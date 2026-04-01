from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload
from typing import Optional, List

from database.connection import get_db
from models.models import Cart, CartItem, Product, ProductVariant, User
from schemas.schemas import CartItemCreate, CartItemUpdate, CartResponse
from utils.auth import get_current_user, get_current_user_optional

router = APIRouter(prefix="/api/cart", tags=["Cart"])


def get_or_create_cart(user: User, db: Session) -> Cart:
    """Get existing cart or create a new one for the user"""
    cart = db.query(Cart).filter(Cart.user_id == user.id).first()
    if not cart:
        cart = Cart(user_id=user.id)
        db.add(cart)
        db.commit()
        db.refresh(cart)
    return cart


def calculate_cart_totals(cart: Cart) -> dict:
    """Calculate cart subtotal and total items"""
    subtotal = 0
    total_items = 0
    
    for item in cart.items:
        if not item.product:
            continue
        price = item.product.price
        if item.variant:
            price += item.variant.price_modifier
        subtotal += price * item.quantity
        total_items += item.quantity
    
    return {
        "subtotal": round(subtotal, 2),
        "total_items": total_items
    }


def format_cart_item(item: CartItem) -> dict:
    """Format cart item for response"""
    product = item.product
    variant = item.variant

    if not product:
        return None
    
    # Get primary image
    primary_image = None
    if variant and variant.image_url:
        primary_image = variant.image_url
    elif product.images:
        primary_img = next((img for img in product.images if img.is_primary), None)
        primary_image = primary_img.image_url if primary_img else product.images[0].image_url
    
    return {
        "id": item.id,
        "product_id": item.product_id,
        "variant_id": item.variant_id,
        "quantity": item.quantity,
        "product": {
            "id": product.id,
            "name": product.name,
            "slug": product.slug,
            "short_description": product.short_description,
            "price": product.price,
            "compare_price": product.compare_price,
            "is_featured": product.is_featured,
            "is_new_arrival": product.is_new_arrival,
            "average_rating": product.average_rating,
            "total_reviews": product.total_reviews,
            "primary_image": primary_image
        },
        "variant": {
            "id": variant.id,
            "product_id": variant.product_id,
            "sku": variant.sku,
            "size": variant.size,
            "color": variant.color,
            "color_code": variant.color_code,
            "price_modifier": variant.price_modifier,
            "quantity": variant.quantity,
            "image_url": variant.image_url,
            "is_active": variant.is_active
        } if variant else None
    }


@router.get("", response_model=dict)
async def get_cart(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get current user's cart"""
    cart = db.query(Cart).filter(Cart.user_id == current_user.id).options(
        joinedload(Cart.items).joinedload(CartItem.product).joinedload(Product.images),
        joinedload(Cart.items).joinedload(CartItem.variant)
    ).first()
    
    if not cart:
        return {
            "id": None,
            "items": [],
            "subtotal": 0,
            "total_items": 0
        }

    # Remove orphan cart rows that point to deleted/missing products.
    orphan_items = [item for item in cart.items if not item.product]
    if orphan_items:
        for orphan in orphan_items:
            db.delete(orphan)
        db.commit()
        cart = db.query(Cart).filter(Cart.user_id == current_user.id).options(
            joinedload(Cart.items).joinedload(CartItem.product).joinedload(Product.images),
            joinedload(Cart.items).joinedload(CartItem.variant)
        ).first()
    
    totals = calculate_cart_totals(cart)
    
    formatted_items = [formatted for formatted in (format_cart_item(item) for item in cart.items) if formatted]

    return {
        "id": cart.id,
        "items": formatted_items,
        "subtotal": totals["subtotal"],
        "total_items": totals["total_items"]
    }


@router.post("/items", response_model=dict, status_code=status.HTTP_201_CREATED)
async def add_to_cart(
    item_data: CartItemCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Add item to cart"""
    # Get or create cart
    cart = get_or_create_cart(current_user, db)
    
    # Check if product exists and is active
    product = db.query(Product).filter(
        Product.id == item_data.product_id,
        Product.is_active == True
    ).first()
    
    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Product not found"
        )
    
    # Resolve variant: use requested variant, otherwise auto-pick first active in-stock variant
    variant = None
    if item_data.variant_id:
        variant = db.query(ProductVariant).filter(
            ProductVariant.id == item_data.variant_id,
            ProductVariant.product_id == item_data.product_id,
            ProductVariant.is_active == True
        ).first()

        if not variant:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Product variant not found"
            )
    else:
        variant = db.query(ProductVariant).filter(
            ProductVariant.product_id == item_data.product_id,
            ProductVariant.is_active == True,
            ProductVariant.quantity > 0
        ).order_by(ProductVariant.id.asc()).first()
    
    # Check stock
    available_quantity = variant.quantity if variant else product.quantity
    if available_quantity < item_data.quantity:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Only {available_quantity} items available"
        )
    
    # Check if item already in cart
    existing_item = db.query(CartItem).filter(
        CartItem.cart_id == cart.id,
        CartItem.product_id == item_data.product_id,
        CartItem.variant_id == (variant.id if variant else None)
    ).first()
    
    if existing_item:
        # Update quantity
        new_quantity = existing_item.quantity + item_data.quantity
        if new_quantity > available_quantity:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Cannot add more. Only {available_quantity} items available"
            )
        existing_item.quantity = new_quantity
        db.commit()
        db.refresh(existing_item)
        cart_item = existing_item
    else:
        # Create new cart item
        cart_item = CartItem(
            cart_id=cart.id,
            product_id=item_data.product_id,
            variant_id=variant.id if variant else None,
            quantity=item_data.quantity
        )
        db.add(cart_item)
        db.commit()
        db.refresh(cart_item)
    
    # Reload with relationships
    cart_item = db.query(CartItem).filter(CartItem.id == cart_item.id).options(
        joinedload(CartItem.product).joinedload(Product.images),
        joinedload(CartItem.variant)
    ).first()
    
    return {"message": "Item added to cart", "item": format_cart_item(cart_item)}


@router.put("/items/{item_id}", response_model=dict)
async def update_cart_item(
    item_id: int,
    item_data: CartItemUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update cart item quantity"""
    cart_item = db.query(CartItem).join(Cart).filter(
        CartItem.id == item_id,
        Cart.user_id == current_user.id
    ).options(
        joinedload(CartItem.product).joinedload(Product.images),
        joinedload(CartItem.variant)
    ).first()
    
    if not cart_item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Cart item not found"
        )
    
    # Check stock
    available_quantity = cart_item.variant.quantity if cart_item.variant else cart_item.product.quantity
    if item_data.quantity > available_quantity:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Only {available_quantity} items available"
        )
    
    if item_data.quantity <= 0:
        # Remove item
        db.delete(cart_item)
        db.commit()
        return {"message": "Item removed from cart"}
    
    cart_item.quantity = item_data.quantity
    db.commit()
    db.refresh(cart_item)
    
    return {"message": "Cart updated", "item": format_cart_item(cart_item)}


@router.delete("/items/{item_id}", status_code=status.HTTP_204_NO_CONTENT)
async def remove_from_cart(
    item_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Remove item from cart"""
    cart_item = db.query(CartItem).join(Cart).filter(
        CartItem.id == item_id,
        Cart.user_id == current_user.id
    ).first()
    
    if not cart_item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Cart item not found"
        )
    
    db.delete(cart_item)
    db.commit()


@router.delete("", status_code=status.HTTP_204_NO_CONTENT)
async def clear_cart(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Clear all items from cart"""
    cart = db.query(Cart).filter(Cart.user_id == current_user.id).first()
    
    if cart:
        db.query(CartItem).filter(CartItem.cart_id == cart.id).delete()
        db.commit()
