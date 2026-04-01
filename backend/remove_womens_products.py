"""
Script to remove women's products from the database
"""
import os
import sys
from dotenv import load_dotenv

load_dotenv()

from database.connection import SessionLocal
from models.models import Product, ProductImage, ProductVariant

def remove_womens_products():
    db = SessionLocal()
    
    try:
        # Keywords that indicate women's products
        womens_keywords = [
            'dress', 'skirt', 'blouse', 'legging', 'yoga', 'floral',
            'women', 'woman', 'female', 'ladies', 'girl', 'bra',
            'bikini', 'crop top', 'romper', 'jumpsuit'
        ]
        
        # Find products with women's keywords in name
        all_products = db.query(Product).all()
        
        products_to_remove = []
        for product in all_products:
            name_lower = product.name.lower()
            for keyword in womens_keywords:
                if keyword in name_lower:
                    products_to_remove.append(product)
                    break
        
        if not products_to_remove:
            print("No women's products found.")
            return
        
        print(f"Found {len(products_to_remove)} women's products to remove:")
        for p in products_to_remove:
            print(f"  - {p.id}: {p.name}")
        
        # Delete the products (cascades should handle images and variants)
        for product in products_to_remove:
            # First remove category associations
            product.categories = []
            db.commit()
            
            # Delete variants
            db.query(ProductVariant).filter(ProductVariant.product_id == product.id).delete()
            # Delete images
            db.query(ProductImage).filter(ProductImage.product_id == product.id).delete()
            # Delete the product
            db.delete(product)
        
        db.commit()
        print(f"\nSuccessfully removed {len(products_to_remove)} women's products!")
        
    except Exception as e:
        print(f"Error: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    remove_womens_products()
