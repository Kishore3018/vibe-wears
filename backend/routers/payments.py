"""
Razorpay Payment Router
Handles payment creation and verification
"""

import os
import hmac
import hashlib
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional

from database.connection import get_db
from models.models import User, Order, PaymentStatus, OrderStatus, Cart, CartItem, Product, ProductVariant
from utils.auth import get_current_user
from websocket.manager import manager

# Initialize router
router = APIRouter(prefix="/api/payments", tags=["Payments"])

# Razorpay configuration
RAZORPAY_KEY_ID = (os.getenv("RAZORPAY_KEY_ID") or "").strip()
RAZORPAY_KEY_SECRET = (os.getenv("RAZORPAY_KEY_SECRET") or "").strip()
PAYMENT_DEMO_MODE = (os.getenv("PAYMENT_DEMO_MODE") or "").strip().lower()


def _is_demo_mode() -> bool:
    """Resolve payment mode from env, falling back to safe dev-friendly defaults."""
    if PAYMENT_DEMO_MODE in {"1", "true", "yes", "on"}:
        return True
    if PAYMENT_DEMO_MODE in {"0", "false", "no", "off"}:
        return False

    # Backward-compatible fallback for existing setups.
    if not RAZORPAY_KEY_ID or not RAZORPAY_KEY_SECRET:
        return True
    if RAZORPAY_KEY_ID == "rzp_test_demo" or RAZORPAY_KEY_SECRET == "demo_secret":
        return True
    return False


def _public_key_id() -> str:
    return "rzp_test_demo" if _is_demo_mode() else RAZORPAY_KEY_ID

# Try to import razorpay, but handle if not installed
try:
    import razorpay
    razorpay_client = razorpay.Client(auth=(RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET)) if not _is_demo_mode() else None
    RAZORPAY_AVAILABLE = True
except ImportError:
    RAZORPAY_AVAILABLE = False
    razorpay_client = None


def _ensure_live_mode_is_ready() -> None:
    """Fail fast when live mode is requested but credentials/SDK are not valid."""
    if _is_demo_mode():
        return

    if not RAZORPAY_KEY_ID or not RAZORPAY_KEY_SECRET:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Razorpay is in live mode but credentials are missing"
        )

    if RAZORPAY_KEY_ID == "rzp_test_demo" or RAZORPAY_KEY_SECRET == "demo_secret":
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Razorpay is in live mode but demo credentials are configured"
        )

    if not RAZORPAY_AVAILABLE or not razorpay_client:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Razorpay SDK is unavailable. Install dependencies in backend/requirements.txt"
        )


# ============== Schemas ==============
class CreatePaymentOrderRequest(BaseModel):
    order_id: int


class CreatePaymentOrderResponse(BaseModel):
    razorpay_order_id: str
    razorpay_key_id: str
    amount: int  # Amount in paise
    currency: str
    order_number: str
    customer_name: str
    customer_email: str
    customer_phone: str


class VerifyPaymentRequest(BaseModel):
    razorpay_order_id: str
    razorpay_payment_id: str
    razorpay_signature: str
    order_id: int


class PaymentResponse(BaseModel):
    success: bool
    message: str
    order_number: Optional[str] = None


class PaymentFailureRequest(BaseModel):
    order_id: int
    reason: Optional[str] = None


def _build_order_update_payload(order: Order, message: str) -> dict:
    """Build a compact real-time payload consumed by checkout/order UI."""
    return {
        "order_id": order.id,
        "order_number": order.order_number,
        "status": order.status.value if hasattr(order.status, "value") else str(order.status),
        "payment_status": order.payment_status.value if hasattr(order.payment_status, "value") else str(order.payment_status),
        "payment_method": order.payment_method,
        "message": message,
        "updated_at": datetime.utcnow().isoformat()
    }


# ============== Endpoints ==============
@router.post("/create-order", response_model=CreatePaymentOrderResponse)
async def create_payment_order(
    request: CreatePaymentOrderRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create a Razorpay order for payment"""
    
    # Get the order
    order = db.query(Order).filter(
        Order.id == request.order_id,
        Order.user_id == current_user.id
    ).first()
    
    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Order not found"
        )
    
    # Check if order already paid
    if order.payment_status == PaymentStatus.COMPLETED:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Order already paid"
        )
    
    # Convert amount to paise (Razorpay uses smallest currency unit)
    amount_in_paise = int(order.total_amount * 100)

    _ensure_live_mode_is_ready()
    
    if RAZORPAY_AVAILABLE and not _is_demo_mode() and razorpay_client:
        # Create Razorpay order
        try:
            razorpay_order = razorpay_client.order.create({
                "amount": amount_in_paise,
                "currency": "INR",
                "receipt": order.order_number,
                "notes": {
                    "order_id": str(order.id),
                    "customer_email": current_user.email
                }
            })
            razorpay_order_id = razorpay_order["id"]
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to create payment order: {str(e)}"
            )
    else:
        # Demo mode - generate fake order ID
        import uuid
        razorpay_order_id = f"order_demo_{uuid.uuid4().hex[:16]}"
    
    # Store razorpay order ID in our order (optional - can be stored in payment_id temporarily)
    order.payment_id = razorpay_order_id
    db.commit()
    
    return CreatePaymentOrderResponse(
        razorpay_order_id=razorpay_order_id,
        razorpay_key_id=_public_key_id(),
        amount=amount_in_paise,
        currency="INR",
        order_number=order.order_number,
        customer_name=order.shipping_full_name or f"{current_user.first_name or ''} {current_user.last_name or ''}".strip(),
        customer_email=current_user.email,
        customer_phone=order.shipping_phone or current_user.phone or ""
    )


@router.post("/verify", response_model=PaymentResponse)
async def verify_payment(
    request: VerifyPaymentRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Verify Razorpay payment signature and update order status"""
    
    # Get the order
    order = db.query(Order).filter(
        Order.id == request.order_id,
        Order.user_id == current_user.id
    ).first()
    
    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Order not found"
        )

    _ensure_live_mode_is_ready()
    
    # Demo mode - always succeed
    if _is_demo_mode() or request.razorpay_order_id.startswith("order_demo_"):
        order.payment_status = PaymentStatus.COMPLETED
        order.payment_id = request.razorpay_payment_id or f"pay_demo_{order.order_number}"
        db.commit()
        await manager.notify_order_update(
            current_user.id,
            _build_order_update_payload(order, "Payment completed")
        )
        
        return PaymentResponse(
            success=True,
            message="Payment verified successfully (Demo Mode)",
            order_number=order.order_number
        )
    
    # Verify signature
    try:
        # Generate expected signature
        message = f"{request.razorpay_order_id}|{request.razorpay_payment_id}"
        expected_signature = hmac.new(
            RAZORPAY_KEY_SECRET.encode(),
            message.encode(),
            hashlib.sha256
        ).hexdigest()
        
        if expected_signature != request.razorpay_signature:
            # Also try Razorpay's verify method if available
            if RAZORPAY_AVAILABLE:
                try:
                    razorpay_client.utility.verify_payment_signature({
                        'razorpay_order_id': request.razorpay_order_id,
                        'razorpay_payment_id': request.razorpay_payment_id,
                        'razorpay_signature': request.razorpay_signature
                    })
                except razorpay.errors.SignatureVerificationError:
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail="Payment verification failed - Invalid signature"
                    )
            else:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Payment verification failed - Invalid signature"
                )
        
        # Update order payment status
        order.payment_status = PaymentStatus.COMPLETED
        order.payment_id = request.razorpay_payment_id
        db.commit()
        await manager.notify_order_update(
            current_user.id,
            _build_order_update_payload(order, "Payment completed")
        )
        
        return PaymentResponse(
            success=True,
            message="Payment verified successfully",
            order_number=order.order_number
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Payment verification error: {str(e)}"
        )


@router.post("/failed", response_model=PaymentResponse)
async def mark_payment_failed(
    request: PaymentFailureRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Mark payment as failed and restore inventory/cart so user can retry checkout."""

    order = db.query(Order).filter(
        Order.id == request.order_id,
        Order.user_id == current_user.id
    ).first()

    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Order not found"
        )

    if order.payment_status == PaymentStatus.COMPLETED:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Payment already completed for this order"
        )

    # Idempotent behavior for retries
    if order.payment_status == PaymentStatus.FAILED and order.status == OrderStatus.CANCELLED:
        await manager.notify_order_update(
            current_user.id,
            _build_order_update_payload(order, "Payment already marked as failed")
        )
        return PaymentResponse(
            success=True,
            message="Payment already marked as failed",
            order_number=order.order_number
        )

    # Load order items via relationship with fresh query
    db.refresh(order)
    items = order.items

    # Restore inventory and product sold counters
    for item in items:
        product = db.query(Product).filter(Product.id == item.product_id).first()
        if not product:
            continue

        if item.variant_id:
            variant = db.query(ProductVariant).filter(ProductVariant.id == item.variant_id).first()
            if variant:
                variant.quantity += item.quantity
        else:
            product.quantity += item.quantity

        product.total_sold = max(0, product.total_sold - item.quantity)

    # Restore cart so user can retry payment quickly
    cart = db.query(Cart).filter(Cart.user_id == current_user.id).first()
    if not cart:
        cart = Cart(user_id=current_user.id)
        db.add(cart)
        db.flush()

    for item in items:
        product = db.query(Product).filter(Product.id == item.product_id, Product.is_active == True).first()
        if not product:
            continue

        existing = db.query(CartItem).filter(
            CartItem.cart_id == cart.id,
            CartItem.product_id == item.product_id,
            CartItem.variant_id == item.variant_id
        ).first()

        if existing:
            existing.quantity += item.quantity
        else:
            db.add(CartItem(
                cart_id=cart.id,
                product_id=item.product_id,
                variant_id=item.variant_id,
                quantity=item.quantity
            ))

    order.payment_status = PaymentStatus.FAILED
    order.status = OrderStatus.CANCELLED

    reason = (request.reason or "").strip()
    if reason:
        reason_line = f"Payment failure: {reason}"
        order.admin_notes = f"{order.admin_notes}\n{reason_line}".strip() if order.admin_notes else reason_line

    db.commit()

    await manager.notify_order_update(
        current_user.id,
        _build_order_update_payload(order, "Payment failed")
    )

    return PaymentResponse(
        success=True,
        message="Payment failed and order was rolled back. Cart restored for retry.",
        order_number=order.order_number
    )


@router.post("/mark-cod")
async def mark_cod_payment(
    order_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Mark order as Cash on Delivery (payment pending until delivery)"""
    
    order = db.query(Order).filter(
        Order.id == order_id,
        Order.user_id == current_user.id
    ).first()
    
    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Order not found"
        )
    
    # COD orders stay as pending until delivered
    order.payment_method = "cash_on_delivery"
    order.payment_status = PaymentStatus.PENDING
    db.commit()

    await manager.notify_order_update(
        current_user.id,
        _build_order_update_payload(order, "Order placed with Cash on Delivery")
    )
    
    return {
        "success": True,
        "message": "Order marked as Cash on Delivery",
        "order_number": order.order_number
    }


@router.get("/config")
async def get_payment_config():
    """Get Razorpay public configuration"""
    return {
        "razorpay_key_id": _public_key_id(),
        "demo_mode": _is_demo_mode(),
        "live_mode_ready": RAZORPAY_AVAILABLE and bool(razorpay_client)
    }
