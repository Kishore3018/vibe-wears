from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List
from datetime import datetime
from enum import Enum


# ============== Enums ==============
class OrderStatusEnum(str, Enum):
    PENDING = "pending"
    CONFIRMED = "confirmed"
    PROCESSING = "processing"
    SHIPPED = "shipped"
    DELIVERED = "delivered"
    CANCELLED = "cancelled"


class PaymentStatusEnum(str, Enum):
    PENDING = "pending"
    COMPLETED = "completed"
    FAILED = "failed"
    REFUNDED = "refunded"


# ============== User Schemas ==============
class UserBase(BaseModel):
    email: EmailStr
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    phone: Optional[str] = None


class UserCreate(UserBase):
    password: str = Field(..., min_length=8)


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserUpdate(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    phone: Optional[str] = None
    avatar_url: Optional[str] = None


class UserResponse(UserBase):
    id: int
    avatar_url: Optional[str] = None
    is_active: bool
    is_admin: bool
    is_verified: bool
    created_at: datetime
    
    class Config:
        from_attributes = True


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse


class TokenData(BaseModel):
    user_id: Optional[int] = None


# ============== OTP Schemas ==============
class SendOTP(BaseModel):
    phone: str = Field(..., min_length=10, max_length=15)


class VerifyOTP(BaseModel):
    phone: str = Field(..., min_length=10, max_length=15)
    otp: str = Field(..., min_length=4, max_length=6)


class OTPResponse(BaseModel):
    success: bool
    message: str
    expires_in: Optional[int] = None  # seconds


# ============== Address Schemas ==============
class AddressBase(BaseModel):
    address_type: str = "home"
    full_name: str
    phone: str
    street_address: str
    apartment: Optional[str] = None
    city: str
    state: str
    postal_code: str
    country: str = "India"
    is_default: bool = False


class AddressCreate(AddressBase):
    pass


class AddressUpdate(BaseModel):
    address_type: Optional[str] = None
    full_name: Optional[str] = None
    phone: Optional[str] = None
    street_address: Optional[str] = None
    apartment: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    postal_code: Optional[str] = None
    country: Optional[str] = None
    is_default: Optional[bool] = None


class AddressResponse(AddressBase):
    id: int
    user_id: int
    created_at: datetime
    
    class Config:
        from_attributes = True


# ============== Category Schemas ==============
class CategoryBase(BaseModel):
    name: str
    slug: str
    description: Optional[str] = None
    image_url: Optional[str] = None
    parent_id: Optional[int] = None
    is_active: bool = True
    sort_order: int = 0


class CategoryCreate(CategoryBase):
    pass


class CategoryUpdate(BaseModel):
    name: Optional[str] = None
    slug: Optional[str] = None
    description: Optional[str] = None
    image_url: Optional[str] = None
    parent_id: Optional[int] = None
    is_active: Optional[bool] = None
    sort_order: Optional[int] = None


class CategoryResponse(CategoryBase):
    id: int
    created_at: datetime
    subcategories: List['CategoryResponse'] = []
    
    class Config:
        from_attributes = True


# ============== Product Image Schemas ==============
class ProductImageBase(BaseModel):
    image_url: str
    alt_text: Optional[str] = None
    is_primary: bool = False
    sort_order: int = 0


class ProductImageCreate(ProductImageBase):
    pass


class ProductImageResponse(ProductImageBase):
    id: int
    product_id: int
    
    class Config:
        from_attributes = True


# ============== Product Variant Schemas ==============
class ProductVariantBase(BaseModel):
    sku: Optional[str] = None
    size: Optional[str] = None
    color: Optional[str] = None
    color_code: Optional[str] = None
    price_modifier: float = 0
    quantity: int = 0
    image_url: Optional[str] = None
    is_active: bool = True


class ProductVariantCreate(ProductVariantBase):
    pass


class ProductVariantResponse(ProductVariantBase):
    id: int
    product_id: int
    
    class Config:
        from_attributes = True


# ============== Product Schemas ==============
class ProductBase(BaseModel):
    name: str
    slug: str
    description: Optional[str] = None
    short_description: Optional[str] = None
    price: float
    compare_price: Optional[float] = None
    cost_price: Optional[float] = None
    sku: Optional[str] = None
    quantity: int = 0
    is_active: bool = True
    is_featured: bool = False
    is_new_arrival: bool = False
    brand: Optional[str] = None
    material: Optional[str] = None
    care_instructions: Optional[str] = None
    meta_title: Optional[str] = None
    meta_description: Optional[str] = None


class ProductCreate(ProductBase):
    category_ids: List[int] = []
    images: List[ProductImageCreate] = []
    variants: List[ProductVariantCreate] = []


class ProductUpdate(BaseModel):
    name: Optional[str] = None
    slug: Optional[str] = None
    description: Optional[str] = None
    short_description: Optional[str] = None
    price: Optional[float] = None
    compare_price: Optional[float] = None
    cost_price: Optional[float] = None
    sku: Optional[str] = None
    quantity: Optional[int] = None
    is_active: Optional[bool] = None
    is_featured: Optional[bool] = None
    is_new_arrival: Optional[bool] = None
    brand: Optional[str] = None
    material: Optional[str] = None
    care_instructions: Optional[str] = None
    meta_title: Optional[str] = None
    meta_description: Optional[str] = None
    category_ids: Optional[List[int]] = None


class ProductResponse(ProductBase):
    id: int
    average_rating: float
    total_reviews: int
    total_sold: int
    created_at: datetime
    updated_at: Optional[datetime] = None
    images: List[ProductImageResponse] = []
    variants: List[ProductVariantResponse] = []
    categories: List[CategoryResponse] = []
    primary_image: Optional[str] = None
    
    class Config:
        from_attributes = True


class ProductListResponse(BaseModel):
    id: int
    name: str
    slug: str
    short_description: Optional[str] = None
    price: float
    compare_price: Optional[float] = None
    is_featured: bool
    is_new_arrival: bool
    average_rating: float
    total_reviews: int
    primary_image: Optional[str] = None
    
    class Config:
        from_attributes = True


# ============== Cart Schemas ==============
class CartItemBase(BaseModel):
    product_id: int
    variant_id: Optional[int] = None
    quantity: int = 1


class CartItemCreate(CartItemBase):
    pass


class CartItemUpdate(BaseModel):
    quantity: int


class CartItemResponse(BaseModel):
    id: int
    product_id: int
    variant_id: Optional[int] = None
    quantity: int
    product: ProductListResponse
    variant: Optional[ProductVariantResponse] = None
    
    class Config:
        from_attributes = True


class CartResponse(BaseModel):
    id: int
    items: List[CartItemResponse] = []
    subtotal: float
    total_items: int
    
    class Config:
        from_attributes = True


# ============== Order Schemas ==============
class OrderItemResponse(BaseModel):
    id: int
    product_id: int
    variant_id: Optional[int] = None
    product_name: str
    variant_info: Optional[str] = None
    price: float
    quantity: int
    total: float
    
    class Config:
        from_attributes = True


class OrderCreate(BaseModel):
    shipping_address_id: int
    billing_address_id: Optional[int] = None
    payment_method: str = "stripe"
    coupon_code: Optional[str] = None
    customer_notes: Optional[str] = None


class OrderResponse(BaseModel):
    id: int
    order_number: str
    status: OrderStatusEnum
    payment_status: PaymentStatusEnum
    payment_method: Optional[str] = None
    subtotal: float
    discount_amount: float
    shipping_amount: float
    tax_amount: float
    total_amount: float
    coupon_code: Optional[str] = None
    shipping_full_name: Optional[str] = None
    shipping_phone: Optional[str] = None
    shipping_address: Optional[str] = None
    shipping_city: Optional[str] = None
    shipping_state: Optional[str] = None
    shipping_postal_code: Optional[str] = None
    shipping_country: Optional[str] = None
    tracking_number: Optional[str] = None
    carrier: Optional[str] = None
    estimated_delivery: Optional[datetime] = None
    delivered_at: Optional[datetime] = None
    customer_notes: Optional[str] = None
    is_approved: bool = False
    approved_at: Optional[datetime] = None
    items: List[OrderItemResponse] = []
    created_at: datetime
    updated_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True


class OrderStatusUpdate(BaseModel):
    status: OrderStatusEnum
    tracking_number: Optional[str] = None
    carrier: Optional[str] = None
    admin_notes: Optional[str] = None


# ============== Review Schemas ==============
class ReviewBase(BaseModel):
    rating: int = Field(..., ge=1, le=5)
    title: Optional[str] = None
    comment: Optional[str] = None


class ReviewCreate(ReviewBase):
    product_id: int


class ReviewResponse(ReviewBase):
    id: int
    product_id: int
    user_id: int
    user_name: str
    is_verified_purchase: bool
    helpful_count: int
    created_at: datetime
    
    class Config:
        from_attributes = True


# ============== Coupon Schemas ==============
class CouponBase(BaseModel):
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


class CouponCreate(CouponBase):
    pass


class CouponResponse(CouponBase):
    id: int
    used_count: int
    created_at: datetime
    
    class Config:
        from_attributes = True


class CouponValidate(BaseModel):
    code: str
    cart_total: float


class CouponValidateResponse(BaseModel):
    valid: bool
    discount_amount: float = 0
    message: str


# ============== Newsletter Schema ==============
class NewsletterSubscribe(BaseModel):
    email: EmailStr


# ============== Banner Schemas ==============
class BannerBase(BaseModel):
    title: Optional[str] = None
    subtitle: Optional[str] = None
    image_url: str
    mobile_image_url: Optional[str] = None
    link_url: Optional[str] = None
    button_text: Optional[str] = None
    position: str = "home"
    sort_order: int = 0
    is_active: bool = True
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None


class BannerCreate(BannerBase):
    pass


class BannerResponse(BannerBase):
    id: int
    created_at: datetime
    
    class Config:
        from_attributes = True


# ============== Pagination ==============
class PaginatedResponse(BaseModel):
    items: List
    total: int
    page: int
    per_page: int
    total_pages: int


# Forward reference update
CategoryResponse.model_rebuild()
