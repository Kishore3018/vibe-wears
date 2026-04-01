"""
Script to fix formal wear product images with verified working URLs
"""
import os
import sys
from dotenv import load_dotenv

load_dotenv()

from database.connection import SessionLocal
from models.models import Product, ProductImage

# Verified working Unsplash image URLs for formal wear
FORMAL_IMAGES = {
    "classic-black-tuxedo": [
        "https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=600",  # Man in tuxedo
        "https://images.unsplash.com/photo-1593032465175-481ac7f401a0?w=600",  # Suit detail
    ],
    "french-cuff-dress-shirt": [
        "https://images.unsplash.com/photo-1598033129183-c4f50c736f10?w=600",  # Dress shirt
        "https://images.unsplash.com/photo-1603252109303-2751441dd157?w=600",  # White shirt
    ],
    "charcoal-wool-suit": [
        "https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=600",  # Business suit
        "https://images.unsplash.com/photo-1593030761757-71fae45fa0e7?w=600",  # Suit jacket
    ],
    "silk-tie-collection": [
        "https://images.unsplash.com/photo-1589756823695-278bc923f962?w=600",  # Tie
        "https://images.unsplash.com/photo-1598211686290-a8ef209d87c5?w=600",  # Tie collection
    ],
    "pinstripe-business-suit": [
        "https://images.unsplash.com/photo-1593030103066-0093718f8476?w=600",  # Business attire
        "https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=600",  # Suit
    ],
    "formal-vest": [
        "https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=600",  # Vest/waistcoat
        "https://images.unsplash.com/photo-1593032465175-481ac7f401a0?w=600",  # Formal attire
    ],
    "formal-dress-pants": [
        "https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?w=600",  # Dress pants
        "https://images.unsplash.com/photo-1593030761757-71fae45fa0e7?w=600",  # Formal pants
    ],
    "double-breasted-blazer": [
        "https://images.unsplash.com/photo-1555069519-127aadedf1ee?w=600",  # Blazer
        "https://images.unsplash.com/photo-1617137968427-85924c800a22?w=600",  # Double breasted
    ],
}

def fix_images():
    """Update formal product images with verified working URLs"""
    
    db = SessionLocal()
    
    try:
        for slug, image_urls in FORMAL_IMAGES.items():
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
            print(f"Fixed images for: {product.name}")
        
        print("\nSuccessfully fixed all formal wear product images!")
        
    except Exception as e:
        print(f"Error: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    fix_images()
