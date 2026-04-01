from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from database.connection import get_db
from models.models import User, Product, wishlist_items
from schemas.schemas import ProductResponse
from utils.auth import get_current_user

router = APIRouter(prefix="/api/wishlist", tags=["Wishlist"])


@router.get("", response_model=List[ProductResponse])
async def get_wishlist(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get all items in user's wishlist"""
    return current_user.wishlist


@router.post("/items/{product_id}")
async def add_to_wishlist(
    product_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Add a product to wishlist"""
    # Check if product exists
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Product not found"
        )
    
    # Check if already in wishlist
    if product in current_user.wishlist:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Product already in wishlist"
        )
    
    # Add to wishlist
    current_user.wishlist.append(product)
    db.commit()
    
    return {"message": "Product added to wishlist", "product_id": product_id}


@router.delete("/items/{product_id}")
async def remove_from_wishlist(
    product_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Remove a product from wishlist"""
    # Check if product exists
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Product not found"
        )
    
    # Check if in wishlist
    if product not in current_user.wishlist:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Product not in wishlist"
        )
    
    # Remove from wishlist
    current_user.wishlist.remove(product)
    db.commit()
    
    return {"message": "Product removed from wishlist", "product_id": product_id}


@router.delete("")
async def clear_wishlist(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Clear all items from wishlist"""
    current_user.wishlist.clear()
    db.commit()
    
    return {"message": "Wishlist cleared"}


@router.get("/check/{product_id}")
async def check_wishlist(
    product_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Check if a product is in the wishlist"""
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Product not found"
        )
    
    is_in_wishlist = product in current_user.wishlist
    return {"product_id": product_id, "in_wishlist": is_in_wishlist}
