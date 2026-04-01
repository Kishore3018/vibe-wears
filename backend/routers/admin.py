from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func, desc, and_
from datetime import datetime, timedelta
from typing import Optional, List
from pydantic import BaseModel, EmailStr

from database.connection import get_db
from models.models import (
    User, Product, ProductImage, ProductVariant, Order, OrderItem,
    Category, Review, Coupon, OrderStatus, PaymentStatus
)
from schemas.schemas import (
    UserResponse, ProductResponse, CategoryResponse, OrderResponse,
    ProductCreate, ProductUpdate, CategoryCreate, CategoryUpdate
)
from utils.auth import get_current_user, get_password_hash

router = APIRouter(prefix="/api/admin", tags=["Admin"])


# ============== Helper Functions ==============
def require_admin(current_user: User = Depends(get_current_user)):
    """Dependency to ensure user is an admin"""
    if not current_user.is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required"
        )
    return current_user


# ============== Admin Schemas ==============
class DashboardStats(BaseModel):
    total_revenue: float
    total_orders: int
    total_products: int
    total_users: int
    pending_orders: int
    low_stock_products: int
    today_orders: int
    today_revenue: float
    monthly_revenue: float
    monthly_orders: int


class RevenueData(BaseModel):
    date: str
    revenue: float
    orders: int


class TopProduct(BaseModel):
    id: int
    name: str
    image_url: Optional[str]
    total_sold: int
    revenue: float


class RecentOrder(BaseModel):
    id: int
    order_number: str
    customer_name: str
    total_amount: float
    status: str
    created_at: datetime

    class Config:
        from_attributes = True


class AdminUserUpdate(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    phone: Optional[str] = None
    is_active: Optional[bool] = None
    is_admin: Optional[bool] = None
    is_verified: Optional[bool] = None


class AdminUserCreate(BaseModel):
    email: EmailStr
    password: str
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    phone: Optional[str] = None
    is_admin: bool = False


class AdminProductCreate(BaseModel):
    name: str
    slug: str
    description: Optional[str] = None
    short_description: Optional[str] = None
    price: float
    compare_price: Optional[float] = None
    cost_price: Optional[float] = None
    sku: Optional[str] = None
    quantity: int = 0
    low_stock_threshold: int = 10
    is_active: bool = True
    is_featured: bool = False
    is_new_arrival: bool = False
    brand: Optional[str] = None
    material: Optional[str] = None
    care_instructions: Optional[str] = None
    category_ids: List[int] = []
    images: List[dict] = []
    variants: List[dict] = []


class AdminProductUpdate(BaseModel):
    name: Optional[str] = None
    slug: Optional[str] = None
    description: Optional[str] = None
    short_description: Optional[str] = None
    price: Optional[float] = None
    compare_price: Optional[float] = None
    cost_price: Optional[float] = None
    sku: Optional[str] = None
    quantity: Optional[int] = None
    low_stock_threshold: Optional[int] = None
    is_active: Optional[bool] = None
    is_featured: Optional[bool] = None
    is_new_arrival: Optional[bool] = None
    brand: Optional[str] = None
    material: Optional[str] = None
    care_instructions: Optional[str] = None
    category_ids: Optional[List[int]] = None


class OrderStatusUpdate(BaseModel):
    status: str
    tracking_number: Optional[str] = None
    carrier: Optional[str] = None
    admin_notes: Optional[str] = None


class CouponCreate(BaseModel):
    code: str
    description: Optional[str] = None
    discount_type: str  # percentage, fixed
    discount_value: float
    minimum_order_amount: float = 0
    maximum_discount: Optional[float] = None
    usage_limit: Optional[int] = None
    usage_limit_per_user: int = 1
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    is_active: bool = True


class CouponUpdate(BaseModel):
    code: Optional[str] = None
    description: Optional[str] = None
    discount_type: Optional[str] = None
    discount_value: Optional[float] = None
    minimum_order_amount: Optional[float] = None
    maximum_discount: Optional[float] = None
    usage_limit: Optional[int] = None
    usage_limit_per_user: Optional[int] = None
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    is_active: Optional[bool] = None


class CouponResponse(BaseModel):
    id: int
    code: str
    description: Optional[str]
    discount_type: str
    discount_value: float
    minimum_order_amount: float
    maximum_discount: Optional[float]
    usage_limit: Optional[int]
    used_count: int
    usage_limit_per_user: int
    start_date: Optional[datetime]
    end_date: Optional[datetime]
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True


# ============== Dashboard Endpoints ==============
@router.get("/dashboard/stats", response_model=DashboardStats)
async def get_dashboard_stats(
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin)
):
    """Get dashboard statistics"""
    today = datetime.now().replace(hour=0, minute=0, second=0, microsecond=0)
    month_start = today.replace(day=1)
    
    # Total revenue (only completed payments)
    total_revenue = db.query(func.sum(Order.total_amount)).filter(
        Order.payment_status == PaymentStatus.COMPLETED
    ).scalar() or 0
    
    # Total orders
    total_orders = db.query(func.count(Order.id)).scalar()
    
    # Total products
    total_products = db.query(func.count(Product.id)).scalar()
    
    # Total users
    total_users = db.query(func.count(User.id)).filter(User.is_admin == False).scalar()
    
    # Pending orders
    pending_orders = db.query(func.count(Order.id)).filter(
        Order.status.in_([OrderStatus.PENDING, OrderStatus.CONFIRMED, OrderStatus.PROCESSING])
    ).scalar()
    
    # Low stock products
    low_stock_products = db.query(func.count(Product.id)).filter(
        Product.quantity <= Product.low_stock_threshold
    ).scalar()
    
    # Today's orders
    today_orders = db.query(func.count(Order.id)).filter(
        Order.created_at >= today
    ).scalar()
    
    # Today's revenue
    today_revenue = db.query(func.sum(Order.total_amount)).filter(
        and_(
            Order.created_at >= today,
            Order.payment_status == PaymentStatus.COMPLETED
        )
    ).scalar() or 0
    
    # Monthly revenue
    monthly_revenue = db.query(func.sum(Order.total_amount)).filter(
        and_(
            Order.created_at >= month_start,
            Order.payment_status == PaymentStatus.COMPLETED
        )
    ).scalar() or 0
    
    # Monthly orders
    monthly_orders = db.query(func.count(Order.id)).filter(
        Order.created_at >= month_start
    ).scalar()
    
    return DashboardStats(
        total_revenue=round(total_revenue, 2),
        total_orders=total_orders,
        total_products=total_products,
        total_users=total_users,
        pending_orders=pending_orders,
        low_stock_products=low_stock_products,
        today_orders=today_orders,
        today_revenue=round(today_revenue, 2),
        monthly_revenue=round(monthly_revenue, 2),
        monthly_orders=monthly_orders
    )


@router.get("/dashboard/revenue-chart")
async def get_revenue_chart(
    days: int = 30,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin)
):
    """Get revenue data for chart"""
    end_date = datetime.now()
    start_date = end_date - timedelta(days=days)
    
    # Get daily revenue data
    revenue_data = []
    current_date = start_date
    
    while current_date <= end_date:
        next_date = current_date + timedelta(days=1)
        
        daily_revenue = db.query(func.sum(Order.total_amount)).filter(
            and_(
                Order.created_at >= current_date,
                Order.created_at < next_date,
                Order.payment_status == PaymentStatus.COMPLETED
            )
        ).scalar() or 0
        
        daily_orders = db.query(func.count(Order.id)).filter(
            and_(
                Order.created_at >= current_date,
                Order.created_at < next_date
            )
        ).scalar()
        
        revenue_data.append({
            "date": current_date.strftime("%Y-%m-%d"),
            "revenue": round(daily_revenue, 2),
            "orders": daily_orders
        })
        
        current_date = next_date
    
    return revenue_data


@router.get("/dashboard/top-products")
async def get_top_products(
    limit: int = 5,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin)
):
    """Get top selling products"""
    products = db.query(Product).options(
        joinedload(Product.images)
    ).order_by(desc(Product.total_sold)).limit(limit).all()
    
    return [
        {
            "id": p.id,
            "name": p.name,
            "image_url": p.primary_image,
            "total_sold": p.total_sold,
            "revenue": round(p.price * p.total_sold, 2)
        }
        for p in products
    ]


@router.get("/dashboard/recent-orders")
async def get_recent_orders(
    limit: int = 10,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin)
):
    """Get recent orders"""
    orders = db.query(Order).options(
        joinedload(Order.user)
    ).order_by(desc(Order.created_at)).limit(limit).all()
    
    return [
        {
            "id": o.id,
            "order_number": o.order_number,
            "customer_name": f"{o.user.first_name or ''} {o.user.last_name or ''}".strip() or o.user.email,
            "total_amount": o.total_amount,
            "status": o.status.value,
            "created_at": o.created_at
        }
        for o in orders
    ]


@router.get("/dashboard/order-stats")
async def get_order_stats(
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin)
):
    """Get order status distribution"""
    stats = {}
    for status in OrderStatus:
        count = db.query(func.count(Order.id)).filter(
            Order.status == status
        ).scalar()
        stats[status.value] = count
    
    return stats


# ============== User Management ==============
@router.get("/users")
async def get_all_users(
    skip: int = 0,
    limit: int = 20,
    search: Optional[str] = None,
    is_active: Optional[bool] = None,
    is_admin: Optional[bool] = None,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin)
):
    """Get all users with filters"""
    query = db.query(User)
    
    if search:
        search_filter = f"%{search}%"
        query = query.filter(
            (User.email.ilike(search_filter)) |
            (User.first_name.ilike(search_filter)) |
            (User.last_name.ilike(search_filter))
        )
    
    if is_active is not None:
        query = query.filter(User.is_active == is_active)
    
    if is_admin is not None:
        query = query.filter(User.is_admin == is_admin)
    
    total = query.count()
    users = query.order_by(desc(User.created_at)).offset(skip).limit(limit).all()
    
    return {
        "items": [UserResponse.model_validate(u) for u in users],
        "total": total,
        "skip": skip,
        "limit": limit
    }


@router.get("/users/{user_id}")
async def get_user(
    user_id: int,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin)
):
    """Get user details"""
    user = db.query(User).options(
        joinedload(User.orders),
        joinedload(User.addresses)
    ).filter(User.id == user_id).first()
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    return {
        "user": UserResponse.model_validate(user),
        "total_orders": len(user.orders),
        "total_spent": sum(o.total_amount for o in user.orders if o.payment_status == PaymentStatus.COMPLETED),
        "addresses": len(user.addresses)
    }


@router.post("/users")
async def create_user(
    user_data: AdminUserCreate,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin)
):
    """Create a new user (admin can create admin users)"""
    existing = db.query(User).filter(User.email == user_data.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    new_user = User(
        email=user_data.email,
        hashed_password=get_password_hash(user_data.password),
        first_name=user_data.first_name,
        last_name=user_data.last_name,
        phone=user_data.phone,
        is_admin=user_data.is_admin,
        is_verified=True
    )
    
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    return UserResponse.model_validate(new_user)


@router.patch("/users/{user_id}")
async def update_user(
    user_id: int,
    user_data: AdminUserUpdate,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin)
):
    """Update user details"""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Prevent deactivating yourself
    if user.id == admin.id and user_data.is_active == False:
        raise HTTPException(status_code=400, detail="Cannot deactivate your own account")
    
    # Prevent removing your own admin access
    if user.id == admin.id and user_data.is_admin == False:
        raise HTTPException(status_code=400, detail="Cannot remove your own admin access")
    
    update_data = user_data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(user, field, value)
    
    db.commit()
    db.refresh(user)
    
    return UserResponse.model_validate(user)


@router.delete("/users/{user_id}")
async def delete_user(
    user_id: int,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin)
):
    """Delete a user"""
    if user_id == admin.id:
        raise HTTPException(status_code=400, detail="Cannot delete your own account")
    
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    db.delete(user)
    db.commit()
    
    return {"message": "User deleted successfully"}


# ============== Product Management ==============
@router.get("/products")
async def get_all_products(
    skip: int = 0,
    limit: int = 20,
    search: Optional[str] = None,
    category_id: Optional[int] = None,
    is_active: Optional[bool] = None,
    is_featured: Optional[bool] = None,
    low_stock: Optional[bool] = None,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin)
):
    """Get all products with filters"""
    query = db.query(Product).options(
        joinedload(Product.images),
        joinedload(Product.categories),
        joinedload(Product.variants)
    )
    
    if search:
        search_filter = f"%{search}%"
        query = query.filter(
            (Product.name.ilike(search_filter)) |
            (Product.sku.ilike(search_filter))
        )
    
    if category_id:
        query = query.filter(Product.categories.any(id=category_id))
    
    if is_active is not None:
        query = query.filter(Product.is_active == is_active)
    
    if is_featured is not None:
        query = query.filter(Product.is_featured == is_featured)
    
    if low_stock:
        query = query.filter(Product.quantity <= Product.low_stock_threshold)
    
    total = query.count()
    products = query.order_by(desc(Product.created_at)).offset(skip).limit(limit).all()
    
    return {
        "items": [ProductResponse.model_validate(p) for p in products],
        "total": total,
        "skip": skip,
        "limit": limit
    }


@router.get("/products/{product_id}")
async def get_product(
    product_id: int,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin)
):
    """Get product details"""
    product = db.query(Product).options(
        joinedload(Product.images),
        joinedload(Product.categories),
        joinedload(Product.variants),
        joinedload(Product.reviews)
    ).filter(Product.id == product_id).first()
    
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    return ProductResponse.model_validate(product)


@router.post("/products")
async def create_product(
    product_data: AdminProductCreate,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin)
):
    """Create a new product"""
    # Check for duplicate slug
    existing = db.query(Product).filter(Product.slug == product_data.slug).first()
    if existing:
        raise HTTPException(status_code=400, detail="Product slug already exists")
    
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
        low_stock_threshold=product_data.low_stock_threshold,
        is_active=product_data.is_active,
        is_featured=product_data.is_featured,
        is_new_arrival=product_data.is_new_arrival,
        brand=product_data.brand,
        material=product_data.material,
        care_instructions=product_data.care_instructions
    )
    
    # Add categories
    if product_data.category_ids:
        categories = db.query(Category).filter(Category.id.in_(product_data.category_ids)).all()
        product.categories = categories
    
    db.add(product)
    db.flush()
    
    # Add images
    for idx, img in enumerate(product_data.images):
        image = ProductImage(
            product_id=product.id,
            image_url=img.get("image_url"),
            alt_text=img.get("alt_text"),
            is_primary=img.get("is_primary", idx == 0),
            sort_order=img.get("sort_order", idx)
        )
        db.add(image)
    
    # Add variants
    for var in product_data.variants:
        variant = ProductVariant(
            product_id=product.id,
            sku=var.get("sku"),
            size=var.get("size"),
            color=var.get("color"),
            color_code=var.get("color_code"),
            price_modifier=var.get("price_modifier", 0),
            quantity=var.get("quantity", 0),
            image_url=var.get("image_url"),
            is_active=var.get("is_active", True)
        )
        db.add(variant)
    
    db.commit()
    db.refresh(product)
    
    return ProductResponse.model_validate(product)


@router.patch("/products/{product_id}")
async def update_product(
    product_id: int,
    product_data: AdminProductUpdate,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin)
):
    """Update product details"""
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    update_data = product_data.model_dump(exclude_unset=True)
    
    # Handle categories separately
    if "category_ids" in update_data:
        category_ids = update_data.pop("category_ids")
        if category_ids is not None:
            categories = db.query(Category).filter(Category.id.in_(category_ids)).all()
            product.categories = categories
    
    for field, value in update_data.items():
        setattr(product, field, value)
    
    db.commit()
    db.refresh(product)
    
    return ProductResponse.model_validate(product)


@router.delete("/products/{product_id}")
async def delete_product(
    product_id: int,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin)
):
    """Delete a product"""
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    db.delete(product)
    db.commit()
    
    return {"message": "Product deleted successfully"}


@router.post("/products/{product_id}/images")
async def add_product_image(
    product_id: int,
    image_data: dict,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin)
):
    """Add image to product"""
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    image = ProductImage(
        product_id=product_id,
        image_url=image_data.get("image_url"),
        alt_text=image_data.get("alt_text"),
        is_primary=image_data.get("is_primary", False),
        sort_order=image_data.get("sort_order", 0)
    )
    
    db.add(image)
    db.commit()
    
    return {"message": "Image added successfully", "id": image.id}


@router.delete("/products/{product_id}/images/{image_id}")
async def delete_product_image(
    product_id: int,
    image_id: int,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin)
):
    """Delete product image"""
    image = db.query(ProductImage).filter(
        ProductImage.id == image_id,
        ProductImage.product_id == product_id
    ).first()
    
    if not image:
        raise HTTPException(status_code=404, detail="Image not found")
    
    db.delete(image)
    db.commit()
    
    return {"message": "Image deleted successfully"}


@router.post("/products/{product_id}/variants")
async def add_product_variant(
    product_id: int,
    variant_data: dict,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin)
):
    """Add variant to product"""
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    variant = ProductVariant(
        product_id=product_id,
        sku=variant_data.get("sku"),
        size=variant_data.get("size"),
        color=variant_data.get("color"),
        color_code=variant_data.get("color_code"),
        price_modifier=variant_data.get("price_modifier", 0),
        quantity=variant_data.get("quantity", 0),
        image_url=variant_data.get("image_url"),
        is_active=variant_data.get("is_active", True)
    )
    
    db.add(variant)
    db.commit()
    
    return {"message": "Variant added successfully", "id": variant.id}


@router.patch("/products/{product_id}/variants/{variant_id}")
async def update_product_variant(
    product_id: int,
    variant_id: int,
    variant_data: dict,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin)
):
    """Update product variant"""
    variant = db.query(ProductVariant).filter(
        ProductVariant.id == variant_id,
        ProductVariant.product_id == product_id
    ).first()
    
    if not variant:
        raise HTTPException(status_code=404, detail="Variant not found")
    
    for field, value in variant_data.items():
        if hasattr(variant, field):
            setattr(variant, field, value)
    
    db.commit()
    db.refresh(variant)
    
    return {"message": "Variant updated successfully"}


@router.delete("/products/{product_id}/variants/{variant_id}")
async def delete_product_variant(
    product_id: int,
    variant_id: int,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin)
):
    """Delete product variant"""
    variant = db.query(ProductVariant).filter(
        ProductVariant.id == variant_id,
        ProductVariant.product_id == product_id
    ).first()
    
    if not variant:
        raise HTTPException(status_code=404, detail="Variant not found")
    
    db.delete(variant)
    db.commit()
    
    return {"message": "Variant deleted successfully"}


# ============== Order Management ==============
@router.get("/orders")
async def get_all_orders(
    skip: int = 0,
    limit: int = 20,
    status: Optional[str] = None,
    payment_status: Optional[str] = None,
    is_approved: Optional[bool] = None,
    search: Optional[str] = None,
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin)
):
    """Get all orders with filters"""
    query = db.query(Order).options(
        joinedload(Order.user),
        joinedload(Order.items).joinedload(OrderItem.product)
    )
    
    if status:
        query = query.filter(Order.status == OrderStatus(status))
    
    if payment_status:
        query = query.filter(Order.payment_status == PaymentStatus(payment_status))
    
    if is_approved is not None:
        query = query.filter(Order.is_approved == is_approved)
    
    if search:
        search_filter = f"%{search}%"
        query = query.filter(
            (Order.order_number.ilike(search_filter)) |
            (Order.shipping_full_name.ilike(search_filter))
        )
    
    if start_date:
        query = query.filter(Order.created_at >= start_date)
    
    if end_date:
        query = query.filter(Order.created_at <= end_date)
    
    total = query.count()
    orders = query.order_by(desc(Order.created_at)).offset(skip).limit(limit).all()
    
    return {
        "items": [OrderResponse.model_validate(o) for o in orders],
        "total": total,
        "skip": skip,
        "limit": limit
    }


@router.get("/orders/{order_id}")
async def get_order(
    order_id: int,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin)
):
    """Get order details"""
    order = db.query(Order).options(
        joinedload(Order.user),
        joinedload(Order.items).joinedload(OrderItem.product).joinedload(Product.images),
        joinedload(Order.items).joinedload(OrderItem.variant)
    ).filter(Order.id == order_id).first()
    
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    return OrderResponse.model_validate(order)


@router.patch("/orders/{order_id}/status")
async def update_order_status(
    order_id: int,
    status_data: OrderStatusUpdate,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin)
):
    """Update order status"""
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    try:
        order.status = OrderStatus(status_data.status)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid status")
    
    if status_data.tracking_number:
        order.tracking_number = status_data.tracking_number
    
    if status_data.carrier:
        order.carrier = status_data.carrier
    
    if status_data.admin_notes:
        order.admin_notes = status_data.admin_notes
    
    if status_data.status == "delivered":
        order.delivered_at = datetime.now()
    
    db.commit()
    db.refresh(order)
    
    return OrderResponse.model_validate(order)


@router.patch("/orders/{order_id}/payment")
async def update_payment_status(
    order_id: int,
    payment_status: str,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin)
):
    """Update payment status"""
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    try:
        order.payment_status = PaymentStatus(payment_status)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid payment status")
    
    db.commit()
    db.refresh(order)
    
    return OrderResponse.model_validate(order)


@router.patch("/orders/{order_id}/approve")
async def approve_order(
    order_id: int,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin)
):
    """Approve an order - makes it visible to the customer"""
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    if order.is_approved:
        raise HTTPException(status_code=400, detail="Order is already approved")
    
    order.is_approved = True
    order.approved_at = datetime.now()
    
    db.commit()
    db.refresh(order)
    
    return OrderResponse.model_validate(order)


@router.patch("/orders/{order_id}/reject")
async def reject_order(
    order_id: int,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin)
):
    """Reject an order - cancels it and restores stock"""
    order = db.query(Order).options(
        joinedload(Order.items)
    ).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    if order.is_approved:
        raise HTTPException(status_code=400, detail="Cannot reject an already approved order")
    
    # Restore stock for each item
    for item in order.items:
        if item.variant_id:
            variant = db.query(ProductVariant).filter(ProductVariant.id == item.variant_id).first()
            if variant:
                variant.quantity += item.quantity
        else:
            product = db.query(Product).filter(Product.id == item.product_id).first()
            if product:
                product.quantity += item.quantity
    
    order.status = OrderStatus.CANCELLED
    order.admin_notes = (order.admin_notes or "") + "\nOrder rejected by admin."
    
    db.commit()
    db.refresh(order)
    
    return OrderResponse.model_validate(order)


# ============== Category Management ==============
@router.get("/categories")
async def get_all_categories(
    skip: int = 0,
    limit: int = 50,
    include_inactive: bool = True,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin)
):
    """Get all categories"""
    query = db.query(Category)
    
    if not include_inactive:
        query = query.filter(Category.is_active == True)
    
    total = query.count()
    categories = query.order_by(Category.sort_order, Category.name).offset(skip).limit(limit).all()
    
    return {
        "items": [CategoryResponse.model_validate(c) for c in categories],
        "total": total
    }


@router.post("/categories")
async def create_category(
    category_data: CategoryCreate,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin)
):
    """Create a new category"""
    existing = db.query(Category).filter(Category.slug == category_data.slug).first()
    if existing:
        raise HTTPException(status_code=400, detail="Category slug already exists")
    
    category = Category(**category_data.model_dump())
    db.add(category)
    db.commit()
    db.refresh(category)
    
    return CategoryResponse.model_validate(category)


@router.patch("/categories/{category_id}")
async def update_category(
    category_id: int,
    category_data: CategoryUpdate,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin)
):
    """Update category"""
    category = db.query(Category).filter(Category.id == category_id).first()
    if not category:
        raise HTTPException(status_code=404, detail="Category not found")
    
    update_data = category_data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(category, field, value)
    
    db.commit()
    db.refresh(category)
    
    return CategoryResponse.model_validate(category)


@router.delete("/categories/{category_id}")
async def delete_category(
    category_id: int,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin)
):
    """Delete a category"""
    category = db.query(Category).filter(Category.id == category_id).first()
    if not category:
        raise HTTPException(status_code=404, detail="Category not found")
    
    db.delete(category)
    db.commit()
    
    return {"message": "Category deleted successfully"}


# ============== Coupon Management ==============
@router.get("/coupons")
async def get_all_coupons(
    skip: int = 0,
    limit: int = 20,
    is_active: Optional[bool] = None,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin)
):
    """Get all coupons"""
    query = db.query(Coupon)
    
    if is_active is not None:
        query = query.filter(Coupon.is_active == is_active)
    
    total = query.count()
    coupons = query.order_by(desc(Coupon.created_at)).offset(skip).limit(limit).all()
    
    return {
        "items": [CouponResponse.model_validate(c) for c in coupons],
        "total": total
    }


@router.post("/coupons")
async def create_coupon(
    coupon_data: CouponCreate,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin)
):
    """Create a new coupon"""
    existing = db.query(Coupon).filter(Coupon.code == coupon_data.code).first()
    if existing:
        raise HTTPException(status_code=400, detail="Coupon code already exists")
    
    coupon = Coupon(**coupon_data.model_dump())
    db.add(coupon)
    db.commit()
    db.refresh(coupon)
    
    return CouponResponse.model_validate(coupon)


@router.patch("/coupons/{coupon_id}")
async def update_coupon(
    coupon_id: int,
    coupon_data: CouponUpdate,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin)
):
    """Update coupon"""
    coupon = db.query(Coupon).filter(Coupon.id == coupon_id).first()
    if not coupon:
        raise HTTPException(status_code=404, detail="Coupon not found")
    
    update_data = coupon_data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(coupon, field, value)
    
    db.commit()
    db.refresh(coupon)
    
    return CouponResponse.model_validate(coupon)


@router.delete("/coupons/{coupon_id}")
async def delete_coupon(
    coupon_id: int,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin)
):
    """Delete a coupon"""
    coupon = db.query(Coupon).filter(Coupon.id == coupon_id).first()
    if not coupon:
        raise HTTPException(status_code=404, detail="Coupon not found")
    
    db.delete(coupon)
    db.commit()
    
    return {"message": "Coupon deleted successfully"}


# ============== Review Management ==============
@router.get("/reviews")
async def get_all_reviews(
    skip: int = 0,
    limit: int = 20,
    is_approved: Optional[bool] = None,
    product_id: Optional[int] = None,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin)
):
    """Get all reviews"""
    query = db.query(Review).options(
        joinedload(Review.user),
        joinedload(Review.product)
    )
    
    if is_approved is not None:
        query = query.filter(Review.is_approved == is_approved)
    
    if product_id:
        query = query.filter(Review.product_id == product_id)
    
    total = query.count()
    reviews = query.order_by(desc(Review.created_at)).offset(skip).limit(limit).all()
    
    return {
        "items": [
            {
                "id": r.id,
                "product_id": r.product_id,
                "product_name": r.product.name,
                "user_email": r.user.email,
                "rating": r.rating,
                "title": r.title,
                "comment": r.comment,
                "is_approved": r.is_approved,
                "created_at": r.created_at
            }
            for r in reviews
        ],
        "total": total
    }


@router.patch("/reviews/{review_id}/approve")
async def approve_review(
    review_id: int,
    is_approved: bool,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin)
):
    """Approve or reject a review"""
    review = db.query(Review).filter(Review.id == review_id).first()
    if not review:
        raise HTTPException(status_code=404, detail="Review not found")
    
    review.is_approved = is_approved
    db.commit()
    
    return {"message": f"Review {'approved' if is_approved else 'rejected'} successfully"}


@router.delete("/reviews/{review_id}")
async def delete_review(
    review_id: int,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin)
):
    """Delete a review"""
    review = db.query(Review).filter(Review.id == review_id).first()
    if not review:
        raise HTTPException(status_code=404, detail="Review not found")
    
    db.delete(review)
    db.commit()
    
    return {"message": "Review deleted successfully"}
