from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func
from typing import List, Optional
from pydantic import BaseModel, EmailStr
import uuid
from datetime import datetime

from database.connection import get_db
from models.models import (
    Order, OrderItem, Cart, CartItem, Address, Product, ProductVariant,
    User, Coupon, OrderStatus, PaymentStatus
)
from schemas.schemas import OrderCreate, OrderResponse, OrderStatusUpdate, OrderStatusEnum
from utils.auth import get_current_user, get_current_admin_user

router = APIRouter(prefix="/api/orders", tags=["Orders"])


class TrackOrderRequest(BaseModel):
    order_number: str
    email: EmailStr


def generate_order_number() -> str:
    """Generate a unique order number"""
    timestamp = datetime.utcnow().strftime("%Y%m%d%H%M")
    unique_id = str(uuid.uuid4())[:8].upper()
    return f"VW-{timestamp}-{unique_id}"


def calculate_order_totals(cart_items: List[CartItem], coupon: Optional[Coupon] = None) -> dict:
    """Calculate order totals"""
    subtotal = 0
    for item in cart_items:
        price = item.product.price
        if item.variant:
            price += item.variant.price_modifier
        subtotal += price * item.quantity
    
    discount_amount = 0
    if coupon:
        if coupon.discount_type == "percentage":
            discount_amount = subtotal * (coupon.discount_value / 100)
            if coupon.maximum_discount:
                discount_amount = min(discount_amount, coupon.maximum_discount)
        else:
            discount_amount = coupon.discount_value
    
    # Calculate shipping (free above ₹999)
    shipping_amount = 0 if subtotal - discount_amount >= 999 else 99
    
    # Calculate tax (18% GST)
    taxable_amount = subtotal - discount_amount
    tax_amount = round(taxable_amount * 0.18, 2)
    
    total_amount = subtotal - discount_amount + shipping_amount + tax_amount
    
    return {
        "subtotal": round(subtotal, 2),
        "discount_amount": round(discount_amount, 2),
        "shipping_amount": shipping_amount,
        "tax_amount": tax_amount,
        "total_amount": round(total_amount, 2)
    }


@router.post("/track", response_model=OrderResponse)
async def track_order(
    track_data: TrackOrderRequest,
    db: Session = Depends(get_db)
):
    """Track an order by order number and email (public endpoint - no auth required)"""
    # Find the user by email
    user = db.query(User).filter(User.email == track_data.email).first()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No order found with this order number and email combination"
        )
    
    # Find the order
    order = db.query(Order).filter(
        Order.order_number == track_data.order_number,
        Order.user_id == user.id
    ).options(
        joinedload(Order.items)
    ).first()
    
    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No order found with this order number and email combination"
        )
    
    return OrderResponse.model_validate(order)


@router.post("", response_model=OrderResponse, status_code=status.HTTP_201_CREATED)
async def create_order(
    order_data: OrderCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create a new order"""
    # Get cart with items
    cart = db.query(Cart).filter(Cart.user_id == current_user.id).options(
        joinedload(Cart.items).joinedload(CartItem.product),
        joinedload(Cart.items).joinedload(CartItem.variant)
    ).first()
    
    if not cart or not cart.items:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cart is empty"
        )
    
    # Get shipping address
    shipping_address = db.query(Address).filter(
        Address.id == order_data.shipping_address_id,
        Address.user_id == current_user.id
    ).first()
    
    if not shipping_address:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Shipping address not found"
        )
    
    # Get billing address (use shipping if not provided)
    billing_address = shipping_address
    if order_data.billing_address_id and order_data.billing_address_id != order_data.shipping_address_id:
        billing_address = db.query(Address).filter(
            Address.id == order_data.billing_address_id,
            Address.user_id == current_user.id
        ).first()
        if not billing_address:
            billing_address = shipping_address
    
    # Validate coupon if provided
    coupon = None
    if order_data.coupon_code:
        coupon = db.query(Coupon).filter(
            Coupon.code == order_data.coupon_code,
            Coupon.is_active == True
        ).first()
        
        if not coupon:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid coupon code"
            )
        
        # Check coupon validity
        now = datetime.utcnow()
        if coupon.start_date and coupon.start_date > now:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Coupon not yet active"
            )
        if coupon.end_date and coupon.end_date < now:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Coupon has expired"
            )
        if coupon.usage_limit and coupon.used_count >= coupon.usage_limit:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Coupon usage limit reached"
            )
    
    # Check stock availability
    for item in cart.items:
        available = item.variant.quantity if item.variant else item.product.quantity
        if available < item.quantity:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Insufficient stock for {item.product.name}"
            )
    
    # Calculate totals
    totals = calculate_order_totals(cart.items, coupon)
    
    # Check minimum order amount for coupon
    if coupon and coupon.minimum_order_amount > totals["subtotal"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Minimum order amount for this coupon is ₹{coupon.minimum_order_amount}"
        )
    
    # Create order
    order = Order(
        user_id=current_user.id,
        order_number=generate_order_number(),
        status=OrderStatus.PENDING,
        payment_status=PaymentStatus.PENDING,
        payment_method=order_data.payment_method,
        subtotal=totals["subtotal"],
        discount_amount=totals["discount_amount"],
        shipping_amount=totals["shipping_amount"],
        tax_amount=totals["tax_amount"],
        total_amount=totals["total_amount"],
        coupon_code=order_data.coupon_code,
        shipping_full_name=shipping_address.full_name,
        shipping_phone=shipping_address.phone,
        shipping_address=f"{shipping_address.street_address}, {shipping_address.apartment or ''}".strip(", "),
        shipping_city=shipping_address.city,
        shipping_state=shipping_address.state,
        shipping_postal_code=shipping_address.postal_code,
        shipping_country=shipping_address.country,
        billing_full_name=billing_address.full_name,
        billing_phone=billing_address.phone,
        billing_address=f"{billing_address.street_address}, {billing_address.apartment or ''}".strip(", "),
        billing_city=billing_address.city,
        billing_state=billing_address.state,
        billing_postal_code=billing_address.postal_code,
        billing_country=billing_address.country,
        customer_notes=order_data.customer_notes
    )
    
    db.add(order)
    db.flush()  # Get order ID
    
    # Create order items and update stock
    for item in cart.items:
        price = item.product.price
        if item.variant:
            price += item.variant.price_modifier
        
        variant_info = None
        if item.variant:
            parts = []
            if item.variant.size:
                parts.append(f"Size: {item.variant.size}")
            if item.variant.color:
                parts.append(f"Color: {item.variant.color}")
            variant_info = ", ".join(parts) if parts else None
        
        order_item = OrderItem(
            order_id=order.id,
            product_id=item.product_id,
            variant_id=item.variant_id,
            product_name=item.product.name,
            variant_info=variant_info,
            price=price,
            quantity=item.quantity,
            total=price * item.quantity
        )
        db.add(order_item)
        
        # Update stock
        if item.variant:
            item.variant.quantity -= item.quantity
        else:
            item.product.quantity -= item.quantity
        
        # Update product sold count
        item.product.total_sold += item.quantity
    
    # Update coupon usage
    if coupon:
        coupon.used_count += 1
    
    # Clear cart
    db.query(CartItem).filter(CartItem.cart_id == cart.id).delete()
    
    db.commit()
    db.refresh(order)
    
    # Load order items
    order = db.query(Order).filter(Order.id == order.id).options(
        joinedload(Order.items)
    ).first()
    
    return OrderResponse.model_validate(order)


@router.get("", response_model=List[OrderResponse])
async def get_orders(
    page: int = Query(1, ge=1),
    per_page: int = Query(10, ge=1, le=50),
    status: Optional[OrderStatusEnum] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get user's orders (only approved orders visible to customers)"""
    query = db.query(Order).filter(Order.user_id == current_user.id)
    
    if status:
        query = query.filter(Order.status == status.value)
    
    orders = query.options(
        joinedload(Order.items)
    ).order_by(Order.created_at.desc()).offset(
        (page - 1) * per_page
    ).limit(per_page).all()
    
    return [OrderResponse.model_validate(order) for order in orders]


@router.get("/{order_number}", response_model=OrderResponse)
async def get_order(
    order_number: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get order details by order number (only approved orders visible to customers)"""
    order = db.query(Order).filter(
        Order.order_number == order_number,
        Order.user_id == current_user.id
    ).options(
        joinedload(Order.items)
    ).first()
    
    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Order not found"
        )
    
    return OrderResponse.model_validate(order)


@router.post("/{order_number}/cancel", response_model=OrderResponse)
async def cancel_order(
    order_number: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Cancel an order (only if pending or confirmed)"""
    order = db.query(Order).filter(
        Order.order_number == order_number,
        Order.user_id == current_user.id
    ).options(
        joinedload(Order.items)
    ).first()
    
    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Order not found"
        )
    
    if order.status not in [OrderStatus.PENDING, OrderStatus.CONFIRMED]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Order cannot be cancelled at this stage"
        )
    
    # Restore stock
    for item in order.items:
        if item.variant_id:
            variant = db.query(ProductVariant).filter(ProductVariant.id == item.variant_id).first()
            if variant:
                variant.quantity += item.quantity
        else:
            product = db.query(Product).filter(Product.id == item.product_id).first()
            if product:
                product.quantity += item.quantity
        
        # Update sold count
        product = db.query(Product).filter(Product.id == item.product_id).first()
        if product:
            product.total_sold = max(0, product.total_sold - item.quantity)
    
    order.status = OrderStatus.CANCELLED
    db.commit()
    db.refresh(order)
    
    return OrderResponse.model_validate(order)


# ============== Admin Routes ==============
@router.get("/admin/all", response_model=dict)
async def get_all_orders(
    page: int = Query(1, ge=1),
    per_page: int = Query(10, ge=1, le=50),
    status: Optional[OrderStatusEnum] = None,
    payment_status: Optional[str] = None,
    search: Optional[str] = None,
    current_user: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    """Get all orders (Admin only)"""
    query = db.query(Order)
    
    if status:
        query = query.filter(Order.status == status.value)
    
    if payment_status:
        query = query.filter(Order.payment_status == payment_status)
    
    if search:
        query = query.filter(
            Order.order_number.ilike(f"%{search}%") |
            Order.shipping_full_name.ilike(f"%{search}%")
        )
    
    total = query.count()
    
    orders = query.options(
        joinedload(Order.items),
        joinedload(Order.user)
    ).order_by(Order.created_at.desc()).offset(
        (page - 1) * per_page
    ).limit(per_page).all()
    
    return {
        "items": [OrderResponse.model_validate(order) for order in orders],
        "total": total,
        "page": page,
        "per_page": per_page,
        "total_pages": (total + per_page - 1) // per_page
    }


@router.put("/admin/{order_number}/status", response_model=OrderResponse)
async def update_order_status(
    order_number: str,
    status_data: OrderStatusUpdate,
    current_user: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    """Update order status (Admin only)"""
    order = db.query(Order).filter(
        Order.order_number == order_number
    ).options(
        joinedload(Order.items)
    ).first()
    
    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Order not found"
        )
    
    order.status = OrderStatus(status_data.status.value)
    
    if status_data.tracking_number:
        order.tracking_number = status_data.tracking_number
    
    if status_data.carrier:
        order.carrier = status_data.carrier
    
    if status_data.admin_notes:
        order.admin_notes = status_data.admin_notes
    
    if status_data.status == OrderStatusEnum.DELIVERED:
        order.delivered_at = datetime.utcnow()
    
    db.commit()
    db.refresh(order)
    
    return OrderResponse.model_validate(order)
