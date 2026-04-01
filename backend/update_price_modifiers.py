"""Script to update product variants with size-based price modifiers"""

import sys
sys.path.append('.')

import logging
logging.getLogger('sqlalchemy.engine').setLevel(logging.WARNING)

from database.connection import engine, SessionLocal
from models.models import ProductVariant

# Define price modifiers for each size (in INR)
SIZE_PRICE_MODIFIERS = {
    'XS': 0,
    'S': 0,
    'M': 50,
    'L': 100,
    'XL': 150,
    'XXL': 200,
    '2XL': 200,
    '3XL': 250,
    '28': 0,
    '30': 0,
    '32': 50,
    '34': 100,
    '36': 150,
    '38': 200,
    '40': 200,
    '42': 250,
}

def update_price_modifiers():
    db = SessionLocal()
    try:
        # Get all variants
        variants = db.query(ProductVariant).all()
        
        print(f"Found {len(variants)} variants to update")
        
        updated_count = 0
        summary = {}
        
        for variant in variants:
            if variant.size:
                size_key = variant.size.upper()
                modifier = SIZE_PRICE_MODIFIERS.get(size_key, 0)
                
                # Also check for numeric sizes (pants)
                if modifier == 0 and variant.size in SIZE_PRICE_MODIFIERS:
                    modifier = SIZE_PRICE_MODIFIERS[variant.size]
                
                # Track summary
                if size_key not in summary:
                    summary[size_key] = {'count': 0, 'modifier': modifier}
                summary[size_key]['count'] += 1
                
                # Only update if different
                if variant.price_modifier != modifier:
                    print(f"  Product {variant.product_id}: Size {variant.size} -> ₹{modifier}")
                    variant.price_modifier = modifier
                    updated_count += 1
        
        # Commit changes
        db.commit()
        print(f"\n✅ Updated {updated_count} variants with price modifiers")
        
        # Print summary
        print("\nPrice modifier summary by size:")
        for size, data in sorted(summary.items()):
            print(f"  {size}: ₹{data['modifier']} ({data['count']} variants)")
        
    except Exception as e:
        print(f"Error: {e}")
        import traceback
        traceback.print_exc()
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    update_price_modifiers()
