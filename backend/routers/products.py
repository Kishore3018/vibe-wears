from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import or_, and_, func
from typing import Optional, List

from database.connection import get_db
from models.models import Product, Category, ProductImage, ProductVariant, Review, User, product_categories
from schemas.schemas import (
    ProductCreate, ProductUpdate, ProductResponse, ProductListResponse,
    ProductImageCreate, ProductVariantCreate, ProductImageResponse,
    ProductVariantResponse, ReviewCreate, ReviewResponse
)
from utils.auth import get_current_user, get_current_admin_user, get_current_user_optional

router = APIRouter(prefix="/api/products", tags=["Products"])


def get_primary_image(product: Product) -> Optional[str]:
    """Get the primary image URL for a product"""
    primary = next((img for img in product.images if img.is_primary), None)
    if primary:
        return primary.image_url
    return product.images[0].image_url if product.images else None


@router.get("", response_model=dict)
def get_products(
    page: int = Query(1, ge=1),
    per_page: int = Query(12, ge=1, le=50),
    search: Optional[str] = None,
    category: Optional[str] = None,
    min_price: Optional[float] = None,
    max_price: Optional[float] = None,
    brand: Optional[str] = None,
    sort_by: str = Query("newest", regex="^(newest|price_low|price_high|popular|rating)$"),
    is_featured: Optional[bool] = None,
    is_new_arrival: Optional[bool] = None,
    db: Session = Depends(get_db)
):
    """Get paginated list of products with filters"""
    query = db.query(Product).filter(Product.is_active == True)
    
    # Apply filters
    if search:
        search_filter = or_(
            Product.name.ilike(f"%{search}%"),
            Product.description.ilike(f"%{search}%"),
            Product.brand.ilike(f"%{search}%")
        )
        query = query.filter(search_filter)
    
    if category:
        query = query.join(Product.categories).filter(
            or_(Category.slug == category, Category.name.ilike(f"%{category}%"))
        )
    
    if min_price is not None:
        query = query.filter(Product.price >= min_price)
    
    if max_price is not None:
        query = query.filter(Product.price <= max_price)
    
    if brand:
        query = query.filter(Product.brand.ilike(f"%{brand}%"))
    
    if is_featured is not None:
        query = query.filter(Product.is_featured == is_featured)
    
    if is_new_arrival is not None:
        query = query.filter(Product.is_new_arrival == is_new_arrival)
    
    # Apply sorting
    if sort_by == "newest":
        query = query.order_by(Product.created_at.desc())
    elif sort_by == "price_low":
        query = query.order_by(Product.price.asc())
    elif sort_by == "price_high":
        query = query.order_by(Product.price.desc())
    elif sort_by == "popular":
        query = query.order_by(Product.total_sold.desc())
    elif sort_by == "rating":
        query = query.order_by(Product.average_rating.desc())
    
    # Get total count
    total = query.count()
    
    # Apply pagination
    products = query.options(
        joinedload(Product.images)
    ).offset((page - 1) * per_page).limit(per_page).all()
    
    # Format response
    items = []
    for product in products:
        items.append({
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
            "primary_image": get_primary_image(product)
        })
    
    return {
        "items": items,
        "total": total,
        "page": page,
        "per_page": per_page,
        "total_pages": (total + per_page - 1) // per_page
    }


@router.get("/featured", response_model=List[dict])
def get_featured_products(
    limit: int = Query(8, ge=1, le=20),
    db: Session = Depends(get_db)
):
    """Get featured products"""
    products = db.query(Product).filter(
        Product.is_active == True,
        Product.is_featured == True
    ).options(
        joinedload(Product.images)
    ).order_by(Product.created_at.desc()).limit(limit).all()
    
    return [{
        "id": p.id,
        "name": p.name,
        "slug": p.slug,
        "price": p.price,
        "compare_price": p.compare_price,
        "average_rating": p.average_rating,
        "total_reviews": p.total_reviews,
        "primary_image": get_primary_image(p)
    } for p in products]


@router.get("/new-arrivals", response_model=List[dict])
def get_new_arrivals(
    limit: int = Query(8, ge=1, le=20),
    db: Session = Depends(get_db)
):
    """Get new arrival products"""
    products = db.query(Product).filter(
        Product.is_active == True,
        Product.is_new_arrival == True
    ).options(
        joinedload(Product.images)
    ).order_by(Product.created_at.desc()).limit(limit).all()
    
    return [{
        "id": p.id,
        "name": p.name,
        "slug": p.slug,
        "price": p.price,
        "compare_price": p.compare_price,
        "average_rating": p.average_rating,
        "total_reviews": p.total_reviews,
        "primary_image": get_primary_image(p)
    } for p in products]


@router.get("/best-sellers", response_model=List[dict])
def get_best_sellers(
    limit: int = Query(8, ge=1, le=20),
    db: Session = Depends(get_db)
):
    """Get best selling products - Men's products only"""
    # Get men's category IDs (exclude any women/girls categories if they exist)
    men_categories = db.query(Category).filter(
        Category.is_active == True,
        ~Category.name.ilike('%women%'),
        ~Category.name.ilike('%girl%'),
        ~Category.name.ilike('%ladies%')
    ).all()
    men_category_ids = [c.id for c in men_categories]
    
    products = db.query(Product).join(
        product_categories
    ).filter(
        Product.is_active == True,
        product_categories.c.category_id.in_(men_category_ids)
    ).options(
        joinedload(Product.images)
    ).order_by(Product.total_sold.desc()).distinct().limit(limit).all()
    
    return [{
        "id": p.id,
        "name": p.name,
        "slug": p.slug,
        "price": p.price,
        "compare_price": p.compare_price,
        "average_rating": p.average_rating,
        "total_reviews": p.total_reviews,
        "total_sold": p.total_sold,
        "primary_image": get_primary_image(p)
    } for p in products]


@router.get("/{slug}", response_model=ProductResponse)
def get_product(slug: str, db: Session = Depends(get_db)):
    """Get product details by slug"""
    product = db.query(Product).filter(
        Product.slug == slug,
        Product.is_active == True
    ).options(
        joinedload(Product.images),
        joinedload(Product.variants),
        joinedload(Product.categories)
    ).first()
    
    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Product not found"
        )
    
    return ProductResponse.model_validate(product)


@router.get("/{product_id}/reviews", response_model=List[ReviewResponse])
def get_product_reviews(
    product_id: int,
    page: int = Query(1, ge=1),
    per_page: int = Query(10, ge=1, le=50),
    db: Session = Depends(get_db)
):
    """Get reviews for a product"""
    reviews = db.query(Review).filter(
        Review.product_id == product_id,
        Review.is_approved == True
    ).join(User).order_by(Review.created_at.desc()).offset(
        (page - 1) * per_page
    ).limit(per_page).all()
    
    return [{
        "id": r.id,
        "product_id": r.product_id,
        "user_id": r.user_id,
        "user_name": f"{r.user.first_name or ''} {r.user.last_name or ''}".strip() or "Anonymous",
        "rating": r.rating,
        "title": r.title,
        "comment": r.comment,
        "is_verified_purchase": r.is_verified_purchase,
        "helpful_count": r.helpful_count,
        "created_at": r.created_at
    } for r in reviews]


@router.post("/{product_id}/reviews", response_model=ReviewResponse, status_code=status.HTTP_201_CREATED)
def create_review(
    product_id: int,
    review_data: ReviewCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create a review for a product"""
    # Check if product exists
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Product not found"
        )
    
    # Check if user already reviewed this product
    existing_review = db.query(Review).filter(
        Review.product_id == product_id,
        Review.user_id == current_user.id
    ).first()
    
    if existing_review:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You have already reviewed this product"
        )
    
    # Create review
    review = Review(
        product_id=product_id,
        user_id=current_user.id,
        rating=review_data.rating,
        title=review_data.title,
        comment=review_data.comment
    )
    
    db.add(review)
    db.commit()
    db.refresh(review)
    
    # Update product rating
    avg_rating = db.query(func.avg(Review.rating)).filter(
        Review.product_id == product_id,
        Review.is_approved == True
    ).scalar() or 0
    
    total_reviews = db.query(Review).filter(
        Review.product_id == product_id,
        Review.is_approved == True
    ).count()
    
    product.average_rating = round(float(avg_rating), 1)
    product.total_reviews = total_reviews
    db.commit()
    
    return {
        "id": review.id,
        "product_id": review.product_id,
        "user_id": review.user_id,
        "user_name": f"{current_user.first_name or ''} {current_user.last_name or ''}".strip() or "Anonymous",
        "rating": review.rating,
        "title": review.title,
        "comment": review.comment,
        "is_verified_purchase": review.is_verified_purchase,
        "helpful_count": review.helpful_count,
        "created_at": review.created_at
    }


# ============== Admin Routes ==============
@router.post("", response_model=ProductResponse, status_code=status.HTTP_201_CREATED)
def create_product(
    product_data: ProductCreate,
    current_user: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    """Create a new product (Admin only)"""
    # Check if slug already exists
    existing = db.query(Product).filter(Product.slug == product_data.slug).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Product with this slug already exists"
        )
    
    # Get categories
    categories = db.query(Category).filter(
        Category.id.in_(product_data.category_ids)
    ).all()
    
    # Create product
    product = Product(
        name=product_data.name,
        slug=product_data.slug,
        description=product_data.description,
        short_description=product_data.short_description,
        price=product_data.price,
        compare_price=product_data.compare_price,
        cost_price=product_data.cost_price,
        sku=product_data.sku,
        quantity=product_data.quantity,
        is_active=product_data.is_active,
        is_featured=product_data.is_featured,
        is_new_arrival=product_data.is_new_arrival,
        brand=product_data.brand,
        material=product_data.material,
        care_instructions=product_data.care_instructions,
        meta_title=product_data.meta_title,
        meta_description=product_data.meta_description,
        categories=categories
    )
    
    # Add images
    for img_data in product_data.images:
        image = ProductImage(
            image_url=img_data.image_url,
            alt_text=img_data.alt_text,
            is_primary=img_data.is_primary,
            sort_order=img_data.sort_order
        )
        product.images.append(image)
    
    # Add variants
    for var_data in product_data.variants:
        variant = ProductVariant(
            sku=var_data.sku,
            size=var_data.size,
            color=var_data.color,
            color_code=var_data.color_code,
            price_modifier=var_data.price_modifier,
            quantity=var_data.quantity,
            image_url=var_data.image_url,
            is_active=var_data.is_active
        )
        product.variants.append(variant)
    
    db.add(product)
    db.commit()
    db.refresh(product)
    
    return ProductResponse.model_validate(product)


@router.put("/{product_id}", response_model=ProductResponse)
def update_product(
    product_id: int,
    product_data: ProductUpdate,
    current_user: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    """Update a product (Admin only)"""
    product = db.query(Product).filter(Product.id == product_id).first()
    
    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Product not found"
        )
    
    update_data = product_data.model_dump(exclude_unset=True)
    
    # Handle categories separately
    if "category_ids" in update_data:
        category_ids = update_data.pop("category_ids")
        categories = db.query(Category).filter(Category.id.in_(category_ids)).all()
        product.categories = categories
    
    for field, value in update_data.items():
        setattr(product, field, value)
    
    db.commit()
    db.refresh(product)
    
    return ProductResponse.model_validate(product)


@router.delete("/{product_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_product(
    product_id: int,
    current_user: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    """Delete a product (Admin only)"""
    product = db.query(Product).filter(Product.id == product_id).first()
    
    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Product not found"
        )
    
    db.delete(product)
    db.commit()
