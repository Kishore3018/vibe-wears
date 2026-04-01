"""
Script to fix ALL product images with verified working Unsplash URLs
"""
import os
import sys
from dotenv import load_dotenv

load_dotenv()

from database.connection import SessionLocal
from models.models import Product, ProductImage

# All verified working Unsplash image URLs by product slug
ALL_PRODUCT_IMAGES = {
    # Casual Wear
    "classic-denim-jacket": [
        "https://images.unsplash.com/photo-1576995853123-5a10305d93c0?w=600",
        "https://images.unsplash.com/photo-1551028719-00167b16eac5?w=600",
    ],
    "slim-fit-oxford-shirt": [
        "https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=600",
        "https://images.unsplash.com/photo-1603252109303-2751441dd157?w=600",
    ],
    "premium-chino-pants": [
        "https://images.unsplash.com/photo-1473966968600-fa801b869a1a?w=600",
        "https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?w=600",
    ],
    "merino-wool-vneck-sweater": [
        "https://images.unsplash.com/photo-1434389677669-e08b4cac3105?w=600",
        "https://images.unsplash.com/photo-1578587018452-892bacefd3f2?w=600",
    ],
    "straight-fit-jeans": [
        "https://images.unsplash.com/photo-1542272604-787c3835535d?w=600",
        "https://images.unsplash.com/photo-1541099649105-f69ad21f3246?w=600",
    ],
    
    # Formal Wear
    "slim-fit-navy-blazer": [
        "https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=600",
        "https://images.unsplash.com/photo-1593032465175-481ac7f401a0?w=600",
    ],
    "classic-black-tuxedo": [
        "https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=600",
        "https://images.unsplash.com/photo-1593032465175-481ac7f401a0?w=600",
    ],
    "french-cuff-dress-shirt": [
        "https://images.unsplash.com/photo-1598033129183-c4f50c736f10?w=600",
        "https://images.unsplash.com/photo-1603252109303-2751441dd157?w=600",
    ],
    "charcoal-wool-suit": [
        "https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=600",
        "https://images.unsplash.com/photo-1593030761757-71fae45fa0e7?w=600",
    ],
    "silk-tie-collection": [
        "https://images.unsplash.com/photo-1589756823695-278bc923f962?w=600",
        "https://images.unsplash.com/photo-1598211686290-a8ef209d87c5?w=600",
    ],
    "pinstripe-business-suit": [
        "https://images.unsplash.com/photo-1593030103066-0093718f8476?w=600",
        "https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=600",
    ],
    "formal-vest": [
        "https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=600",
        "https://images.unsplash.com/photo-1593032465175-481ac7f401a0?w=600",
    ],
    "formal-dress-pants": [
        "https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?w=600",
        "https://images.unsplash.com/photo-1473966968600-fa801b869a1a?w=600",
    ],
    "double-breasted-blazer": [
        "https://images.unsplash.com/photo-1555069519-127aadedf1ee?w=600",
        "https://images.unsplash.com/photo-1593030761757-71fae45fa0e7?w=600",
    ],
    
    # Streetwear
    "oversized-graphic-hoodie": [
        "https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=600",
        "https://images.unsplash.com/photo-1578768079052-aa76e52ff62e?w=600",
    ],
    "cargo-jogger-pants": [
        "https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?w=600",
        "https://images.unsplash.com/photo-1552902865-b72c031ac5ea?w=600",
    ],
    
    # Activewear
    "performance-training-tee": [
        "https://images.unsplash.com/photo-1581655353564-df123a1eb820?w=600",
        "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=600",
    ],
    "athletic-compression-shorts": [
        "https://images.unsplash.com/photo-1591195853828-11db59a44f6b?w=600",
        "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=600",
    ],
    
    # Accessories
    "leather-messenger-bag": [
        "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=600",
        "https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=600",
    ],
    "classic-aviator-sunglasses": [
        "https://images.unsplash.com/photo-1511499767150-a48a237f0083?w=600",
        "https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=600",
    ],
    
    # Kids
    "kids-rainbow-stripe-tshirt": [
        "https://images.unsplash.com/photo-1519238263530-99bdd11df2ea?w=600",
        "https://images.unsplash.com/photo-1503944583220-79d8926ad5e2?w=600",
    ],
    "kids-denim-overall-shorts": [
        "https://images.unsplash.com/photo-1503919545889-aef636e10ad4?w=600",
        "https://images.unsplash.com/photo-1519457431-44ccd64a579b?w=600",
    ],
}

def fix_all_images():
    """Update all product images with verified working URLs"""
    
    db = SessionLocal()
    fixed_count = 0
    
    try:
        for slug, image_urls in ALL_PRODUCT_IMAGES.items():
            product = db.query(Product).filter(Product.slug == slug).first()
            
            if not product:
                print(f"Product not found: {slug}")
                continue
            
            # Delete existing images
            db.query(ProductImage).filter(ProductImage.product_id == product.id).delete()
            db.commit()
            
            # Add new images
            for i, url in enumerate(image_urls):
                image = ProductImage(
                    product_id=product.id,
                    image_url=url,
                    is_primary=(i == 0),
                    sort_order=i
                )
                db.add(image)
            
            db.commit()
            fixed_count += 1
            print(f"Fixed: {product.name}")
        
        print(f"\nSuccessfully fixed {fixed_count} products!")
        
    except Exception as e:
        print(f"Error: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    fix_all_images()
