"""
Script to add formal wear products to the database
"""
import os
import sys
from dotenv import load_dotenv

load_dotenv()

from database.connection import SessionLocal
from models.models import Category, Product, ProductImage, ProductVariant

def add_formal_products():
    """Add formal wear products to the database"""
    
    db = SessionLocal()
    
    try:
        # Get the Formal Wear category
        formal_cat = db.query(Category).filter(Category.slug == "formal-wear").first()
        
        if not formal_cat:
            print("Formal Wear category not found!")
            return
        
        print(f"Found Formal Wear category with ID: {formal_cat.id}")
        
        # Formal Wear Products
        formal_products = [
            {
                "name": "Classic Black Tuxedo",
                "slug": "classic-black-tuxedo",
                "description": "An impeccably tailored black tuxedo for formal occasions. Features satin peak lapels, single-button closure, and satin stripe trousers. Perfect for black-tie events.",
                "short_description": "Premium black tuxedo with satin details",
                "price": 599.99,
                "compare_price": 749.99,
                "sku": "MEN-TUX-001",
                "quantity": 25,
                "is_active": True,
                "is_featured": True,
                "is_new_arrival": True,
                "brand": "Vibe Tailored",
                "material": "100% Wool with Satin Trim",
                "care_instructions": "Dry clean only",
                "average_rating": 4.9,
                "total_reviews": 156,
                "total_sold": 289,
                "images": [
                    {"url": "https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=600", "is_primary": True},
                    {"url": "https://images.unsplash.com/photo-1592878904946-b3cd8ae243d0?w=600", "is_primary": False},
                ],
                "variants": [
                    {"size": "S", "color": "Black", "color_code": "#000000", "quantity": 5},
                    {"size": "M", "color": "Black", "color_code": "#000000", "quantity": 8},
                    {"size": "L", "color": "Black", "color_code": "#000000", "quantity": 7},
                    {"size": "XL", "color": "Black", "color_code": "#000000", "quantity": 5},
                ]
            },
            {
                "name": "French Cuff Dress Shirt",
                "slug": "french-cuff-dress-shirt",
                "description": "Elegant dress shirt with French cuffs for cufflinks. Made from premium Egyptian cotton with a crisp finish. Spread collar and slim fit.",
                "short_description": "Egyptian cotton French cuff dress shirt",
                "price": 119.99,
                "compare_price": None,
                "sku": "MEN-DS-001",
                "quantity": 60,
                "is_active": True,
                "is_featured": False,
                "is_new_arrival": True,
                "brand": "Vibe Tailored",
                "material": "100% Egyptian Cotton",
                "care_instructions": "Machine wash cold, iron while damp",
                "average_rating": 4.6,
                "total_reviews": 234,
                "total_sold": 567,
                "images": [
                    {"url": "https://images.unsplash.com/photo-1598033129183-c4f50c736f10?w=600", "is_primary": True},
                    {"url": "https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?w=600", "is_primary": False},
                ],
                "variants": [
                    {"size": "S", "color": "White", "color_code": "#FFFFFF", "quantity": 15},
                    {"size": "M", "color": "White", "color_code": "#FFFFFF", "quantity": 20},
                    {"size": "L", "color": "White", "color_code": "#FFFFFF", "quantity": 15},
                    {"size": "XL", "color": "White", "color_code": "#FFFFFF", "quantity": 10},
                    {"size": "M", "color": "Light Blue", "color_code": "#ADD8E6", "quantity": 12},
                    {"size": "L", "color": "Light Blue", "color_code": "#ADD8E6", "quantity": 8},
                ]
            },
            {
                "name": "Charcoal Wool Suit",
                "slug": "charcoal-wool-suit",
                "description": "A versatile charcoal suit crafted from Italian wool. Two-button single-breasted jacket with notch lapels. Includes flat-front trousers with side adjusters.",
                "short_description": "Italian wool charcoal business suit",
                "price": 449.99,
                "compare_price": 549.99,
                "sku": "MEN-SUT-001",
                "quantity": 35,
                "is_active": True,
                "is_featured": True,
                "is_new_arrival": False,
                "brand": "Vibe Tailored",
                "material": "100% Italian Wool",
                "care_instructions": "Dry clean only",
                "average_rating": 4.8,
                "total_reviews": 312,
                "total_sold": 789,
                "images": [
                    {"url": "https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=600", "is_primary": True},
                    {"url": "https://images.unsplash.com/photo-1593030761757-71fae45fa0e7?w=600", "is_primary": False},
                ],
                "variants": [
                    {"size": "S", "color": "Charcoal", "color_code": "#36454F", "quantity": 8},
                    {"size": "M", "color": "Charcoal", "color_code": "#36454F", "quantity": 12},
                    {"size": "L", "color": "Charcoal", "color_code": "#36454F", "quantity": 10},
                    {"size": "XL", "color": "Charcoal", "color_code": "#36454F", "quantity": 5},
                ]
            },
            {
                "name": "Silk Tie Collection",
                "slug": "silk-tie-collection",
                "description": "Premium silk tie with subtle pattern. Hand-finished with a self-loop and keeper. 3.25 inch blade width for a modern yet classic look.",
                "short_description": "Hand-finished silk tie",
                "price": 79.99,
                "compare_price": 99.99,
                "sku": "MEN-TIE-001",
                "quantity": 100,
                "is_active": True,
                "is_featured": False,
                "is_new_arrival": True,
                "brand": "Vibe Tailored",
                "material": "100% Silk",
                "care_instructions": "Dry clean only",
                "average_rating": 4.5,
                "total_reviews": 189,
                "total_sold": 456,
                "images": [
                    {"url": "https://images.unsplash.com/photo-1598211686290-a8ef209d87c5?w=600", "is_primary": True},
                ],
                "variants": [
                    {"size": "One Size", "color": "Navy", "color_code": "#000080", "quantity": 25},
                    {"size": "One Size", "color": "Burgundy", "color_code": "#800020", "quantity": 25},
                    {"size": "One Size", "color": "Silver", "color_code": "#C0C0C0", "quantity": 25},
                    {"size": "One Size", "color": "Black", "color_code": "#000000", "quantity": 25},
                ]
            },
            {
                "name": "Pinstripe Business Suit",
                "slug": "pinstripe-business-suit",
                "description": "Classic pinstripe suit in navy blue. Single-breasted two-button jacket with functional sleeve buttons. Trousers feature a comfortable fit with belt loops.",
                "short_description": "Classic navy pinstripe business suit",
                "price": 399.99,
                "compare_price": 499.99,
                "sku": "MEN-SUT-002",
                "quantity": 30,
                "is_active": True,
                "is_featured": True,
                "is_new_arrival": False,
                "brand": "Vibe Tailored",
                "material": "80% Wool, 20% Polyester",
                "care_instructions": "Dry clean only",
                "average_rating": 4.7,
                "total_reviews": 267,
                "total_sold": 623,
                "images": [
                    {"url": "https://images.unsplash.com/photo-1617127365659-c47fa864d8bc?w=600", "is_primary": True},
                    {"url": "https://images.unsplash.com/photo-1593032465175-481ac7f401a0?w=600", "is_primary": False},
                ],
                "variants": [
                    {"size": "S", "color": "Navy Pinstripe", "color_code": "#000080", "quantity": 6},
                    {"size": "M", "color": "Navy Pinstripe", "color_code": "#000080", "quantity": 10},
                    {"size": "L", "color": "Navy Pinstripe", "color_code": "#000080", "quantity": 9},
                    {"size": "XL", "color": "Navy Pinstripe", "color_code": "#000080", "quantity": 5},
                ]
            },
            {
                "name": "Formal Vest",
                "slug": "formal-vest",
                "description": "Elegant formal vest perfect for layering. Features V-neck design, adjustable back strap, and satin back panel. Ideal for three-piece suit looks.",
                "short_description": "Classic formal vest with adjustable fit",
                "price": 89.99,
                "compare_price": None,
                "sku": "MEN-VST-001",
                "quantity": 45,
                "is_active": True,
                "is_featured": False,
                "is_new_arrival": True,
                "brand": "Vibe Tailored",
                "material": "70% Wool, 30% Polyester",
                "care_instructions": "Dry clean only",
                "average_rating": 4.4,
                "total_reviews": 98,
                "total_sold": 234,
                "images": [
                    {"url": "https://images.unsplash.com/photo-1593032465175-481ac7f401a0?w=600", "is_primary": True},
                ],
                "variants": [
                    {"size": "S", "color": "Black", "color_code": "#000000", "quantity": 10},
                    {"size": "M", "color": "Black", "color_code": "#000000", "quantity": 15},
                    {"size": "L", "color": "Black", "color_code": "#000000", "quantity": 12},
                    {"size": "XL", "color": "Black", "color_code": "#000000", "quantity": 8},
                ]
            },
            {
                "name": "Formal Dress Pants",
                "slug": "formal-dress-pants",
                "description": "Tailored dress pants in a classic straight cut. Features permanent creases, extended waistband, and deep pockets. Perfect for business or formal occasions.",
                "short_description": "Classic tailored dress pants",
                "price": 129.99,
                "compare_price": 159.99,
                "sku": "MEN-DRP-001",
                "quantity": 55,
                "is_active": True,
                "is_featured": False,
                "is_new_arrival": False,
                "brand": "Vibe Tailored",
                "material": "65% Polyester, 35% Viscose",
                "care_instructions": "Machine wash cold, tumble dry low",
                "average_rating": 4.5,
                "total_reviews": 176,
                "total_sold": 412,
                "images": [
                    {"url": "https://images.unsplash.com/photo-1594938374182-a57061c442a9?w=600", "is_primary": True},
                ],
                "variants": [
                    {"size": "30", "color": "Black", "color_code": "#000000", "quantity": 12},
                    {"size": "32", "color": "Black", "color_code": "#000000", "quantity": 15},
                    {"size": "34", "color": "Black", "color_code": "#000000", "quantity": 15},
                    {"size": "36", "color": "Black", "color_code": "#000000", "quantity": 8},
                    {"size": "32", "color": "Navy", "color_code": "#000080", "quantity": 10},
                    {"size": "34", "color": "Navy", "color_code": "#000080", "quantity": 10},
                ]
            },
            {
                "name": "Double-Breasted Blazer",
                "slug": "double-breasted-blazer",
                "description": "Statement double-breasted blazer with gold-tone buttons. Peak lapels, flap pockets, and fully lined. A sophisticated choice for elegant events.",
                "short_description": "Elegant double-breasted blazer",
                "price": 289.99,
                "compare_price": 349.99,
                "sku": "MEN-BL-002",
                "quantity": 28,
                "is_active": True,
                "is_featured": True,
                "is_new_arrival": True,
                "brand": "Vibe Tailored",
                "material": "100% Wool",
                "care_instructions": "Dry clean only",
                "average_rating": 4.7,
                "total_reviews": 134,
                "total_sold": 298,
                "images": [
                    {"url": "https://images.unsplash.com/photo-1555069519-127aadedf1ee?w=600", "is_primary": True},
                    {"url": "https://images.unsplash.com/photo-1617137968427-85924c800a22?w=600", "is_primary": False},
                ],
                "variants": [
                    {"size": "S", "color": "Black", "color_code": "#000000", "quantity": 6},
                    {"size": "M", "color": "Black", "color_code": "#000000", "quantity": 10},
                    {"size": "L", "color": "Black", "color_code": "#000000", "quantity": 8},
                    {"size": "XL", "color": "Black", "color_code": "#000000", "quantity": 4},
                ]
            },
        ]
        
        products_added = 0
        
        for product_data in formal_products:
            # Check if product already exists
            existing = db.query(Product).filter(Product.slug == product_data["slug"]).first()
            if existing:
                print(f"Product '{product_data['name']}' already exists. Skipping...")
                continue
            
            images_data = product_data.pop("images")
            variants_data = product_data.pop("variants")
            
            product = Product(
                **product_data,
                categories=[formal_cat]
            )
            db.add(product)
            db.commit()
            db.refresh(product)
            
            # Add images
            for idx, img_data in enumerate(images_data):
                image = ProductImage(
                    product_id=product.id,
                    image_url=img_data["url"],
                    is_primary=img_data["is_primary"],
                    sort_order=idx
                )
                db.add(image)
            
            # Add variants
            for variant_data in variants_data:
                variant = ProductVariant(
                    product_id=product.id,
                    size=variant_data["size"],
                    color=variant_data["color"],
                    color_code=variant_data["color_code"],
                    quantity=variant_data["quantity"],
                    price_modifier=0,
                    is_active=True
                )
                db.add(variant)
            
            db.commit()
            products_added += 1
            print(f"Added: {product_data['name']}")
        
        print(f"\nSuccessfully added {products_added} formal wear products!")
        
    except Exception as e:
        db.rollback()
        print(f"Error adding products: {e}")
        raise
    finally:
        db.close()

if __name__ == "__main__":
    add_formal_products()
