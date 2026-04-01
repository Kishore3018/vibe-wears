"""
Seed data script to populate the database with sample collections and products
For Vibe Wears - Premium Men's Fashion Store
"""
import os
import sys
from datetime import datetime
from dotenv import load_dotenv

load_dotenv()

from database.connection import engine, SessionLocal, Base
from models.models import Category, Product, ProductImage, ProductVariant, Banner

def seed_database():
    """Populate database with sample data for men's fashion"""
    
    # Create all tables
    Base.metadata.create_all(bind=engine)
    
    db = SessionLocal()
    
    try:
        # Check if data already exists
        existing_categories = db.query(Category).first()
        if existing_categories:
            print("Database already seeded. Skipping...")
            return
        
        print("Seeding database with men's fashion data...")
        
        # ============ CATEGORIES ============
        categories = [
            Category(
                name="Topwear",
                slug="topwear",
                description="T-shirts, shirts, polos, jackets, hoodies, and upper-body essentials",
                image_url="https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=400",
                is_active=True,
                sort_order=1
            ),
            Category(
                name="Bottomwear",
                slug="bottomwear",
                description="Jeans, trousers, chinos, joggers, shorts, and lower-body essentials",
                image_url="https://images.unsplash.com/photo-1617137968427-85924c800a22?w=400",
                is_active=True,
                sort_order=2
            ),
            Category(
                name="Ethnic Wear",
                slug="ethnic-wear",
                description="Traditional and festive styles including kurtas and ethnic sets",
                image_url="https://images.unsplash.com/photo-1523398002811-999ca8dec234?w=400",
                is_active=True,
                sort_order=3
            ),
            Category(
                name="Footwear",
                slug="footwear",
                description="Shoes, sneakers, sandals, and all footwear essentials",
                image_url="https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400",
                is_active=True,
                sort_order=4
            ),
            Category(
                name="Accessories",
                slug="accessories",
                description="Watches, belts, wallets, caps, and fashion accessories",
                image_url="https://images.unsplash.com/photo-1523779105320-d1cd346ff52b?w=400",
                is_active=True,
                sort_order=5
            ),
            Category(
                name="Innerwear & Sleepwear",
                slug="innerwear-sleepwear",
                description="Innerwear, loungewear, and sleepwear for everyday comfort",
                image_url="https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400",
                is_active=True,
                sort_order=6
            ),
            Category(
                name="Sportswear / Activewear",
                slug="sportswear-activewear",
                description="Performance wear for workouts, training, and active lifestyle",
                image_url="https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=400",
                is_active=True,
                sort_order=7
            ),
        ]
        
        db.add_all(categories)
        db.commit()
        
        # Refresh to get IDs
        for cat in categories:
            db.refresh(cat)
        
        formal_cat = categories[0]
        casual_cat = categories[1]
        streetwear_cat = categories[2]
        activewear_cat = categories[3]
        accessories_cat = categories[4]
        footwear_cat = categories[5]
        
        # ============ PRODUCTS ============
        products_data = [
            # Men's Collection
            {
                "name": "Classic Denim Jacket",
                "slug": "classic-denim-jacket",
                "description": "A timeless denim jacket crafted from premium cotton. Features a classic button-front design, chest pockets, and adjustable cuffs. Perfect for layering in any season.",
                "short_description": "Premium cotton denim jacket with classic styling",
                "price": 129.99,
                "compare_price": 159.99,
                "sku": "MEN-DJ-001",
                "quantity": 50,
                "is_active": True,
                "is_featured": True,
                "is_new_arrival": True,
                "brand": "Vibe Essentials",
                "material": "100% Cotton Denim",
                "care_instructions": "Machine wash cold, tumble dry low",
                "average_rating": 4.5,
                "total_reviews": 128,
                "total_sold": 456,
                "category_id": casual_cat.id,
                "images": [
                    {"url": "https://images.unsplash.com/photo-1576995853123-5a10305d93c0?w=600", "is_primary": True},
                    {"url": "https://images.unsplash.com/photo-1551028719-00167b16eac5?w=600", "is_primary": False},
                ],
                "variants": [
                    {"size": "S", "color": "Blue", "color_code": "#4169E1", "quantity": 10},
                    {"size": "M", "color": "Blue", "color_code": "#4169E1", "quantity": 15},
                    {"size": "L", "color": "Blue", "color_code": "#4169E1", "quantity": 15},
                    {"size": "XL", "color": "Blue", "color_code": "#4169E1", "quantity": 10},
                    {"size": "M", "color": "Black", "color_code": "#000000", "quantity": 12},
                    {"size": "L", "color": "Black", "color_code": "#000000", "quantity": 8},
                ]
            },
            {
                "name": "Slim Fit Oxford Shirt",
                "slug": "slim-fit-oxford-shirt",
                "description": "A sophisticated Oxford shirt in a modern slim fit. Made from breathable cotton with a subtle texture. Features a button-down collar and single chest pocket.",
                "short_description": "Modern slim fit Oxford shirt",
                "price": 79.99,
                "compare_price": None,
                "sku": "MEN-OS-002",
                "quantity": 75,
                "is_active": True,
                "is_featured": False,
                "is_new_arrival": True,
                "brand": "Vibe Essentials",
                "material": "100% Cotton",
                "care_instructions": "Machine wash cold",
                "average_rating": 4.3,
                "total_reviews": 89,
                "total_sold": 234,
                "category_id": casual_cat.id,
                "images": [
                    {"url": "https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=600", "is_primary": True},
                ],
                "variants": [
                    {"size": "S", "color": "White", "color_code": "#FFFFFF", "quantity": 20},
                    {"size": "M", "color": "White", "color_code": "#FFFFFF", "quantity": 25},
                    {"size": "L", "color": "White", "color_code": "#FFFFFF", "quantity": 20},
                    {"size": "M", "color": "Light Blue", "color_code": "#ADD8E6", "quantity": 15},
                    {"size": "L", "color": "Light Blue", "color_code": "#ADD8E6", "quantity": 15},
                ]
            },
            {
                "name": "Premium Chino Pants",
                "slug": "premium-chino-pants",
                "description": "Versatile chino pants in a comfortable stretch cotton blend. Features a modern tapered leg and classic five-pocket styling. Perfect for work or weekend.",
                "short_description": "Stretch cotton chino pants",
                "price": 89.99,
                "compare_price": 109.99,
                "sku": "MEN-CP-003",
                "quantity": 60,
                "is_active": True,
                "is_featured": True,
                "is_new_arrival": False,
                "brand": "Vibe Essentials",
                "material": "98% Cotton, 2% Elastane",
                "care_instructions": "Machine wash cold",
                "average_rating": 4.6,
                "total_reviews": 156,
                "total_sold": 567,
                "category_id": casual_cat.id,
                "images": [
                    {"url": "https://images.unsplash.com/photo-1473966968600-fa801b869a1a?w=600", "is_primary": True},
                ],
                "variants": [
                    {"size": "30", "color": "Khaki", "color_code": "#C3B091", "quantity": 15},
                    {"size": "32", "color": "Khaki", "color_code": "#C3B091", "quantity": 20},
                    {"size": "34", "color": "Khaki", "color_code": "#C3B091", "quantity": 15},
                    {"size": "32", "color": "Navy", "color_code": "#000080", "quantity": 15},
                    {"size": "34", "color": "Navy", "color_code": "#000080", "quantity": 10},
                ]
            },
            
            # Formal Collection
            {
                "name": "Slim Fit Navy Blazer",
                "slug": "slim-fit-navy-blazer",
                "description": "A sophisticated slim fit blazer in classic navy. Crafted from premium wool blend fabric with half canvas construction. Features notch lapels and flap pockets.",
                "short_description": "Premium wool blend navy blazer",
                "price": 249.99,
                "compare_price": 299.99,
                "sku": "MEN-BL-001",
                "quantity": 40,
                "is_active": True,
                "is_featured": True,
                "is_new_arrival": True,
                "brand": "Vibe Tailored",
                "material": "70% Wool, 30% Polyester",
                "care_instructions": "Dry clean only",
                "average_rating": 4.8,
                "total_reviews": 203,
                "total_sold": 678,
                "category_id": formal_cat.id,
                "images": [
                    {"url": "https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=600", "is_primary": True},
                    {"url": "https://images.unsplash.com/photo-1593032465175-481ac7f401a0?w=600", "is_primary": False},
                ],
                "variants": [
                    {"size": "S", "color": "Navy", "color_code": "#000080", "quantity": 8},
                    {"size": "M", "color": "Navy", "color_code": "#000080", "quantity": 12},
                    {"size": "L", "color": "Navy", "color_code": "#000080", "quantity": 12},
                    {"size": "XL", "color": "Navy", "color_code": "#000080", "quantity": 8},
                ]
            },
            {
                "name": "Merino Wool V-Neck Sweater",
                "slug": "merino-wool-vneck-sweater",
                "description": "Luxuriously soft merino wool sweater with a classic V-neck. Lightweight yet warm, perfect for layering. Features ribbed cuffs and hem for a refined look.",
                "short_description": "Soft merino wool V-neck",
                "price": 129.99,
                "compare_price": None,
                "sku": "MEN-SW-002",
                "quantity": 35,
                "is_active": True,
                "is_featured": True,
                "is_new_arrival": False,
                "brand": "Vibe Essentials",
                "material": "100% Merino Wool",
                "care_instructions": "Hand wash cold or dry clean",
                "average_rating": 4.7,
                "total_reviews": 145,
                "total_sold": 389,
                "category_id": casual_cat.id,
                "images": [
                    {"url": "https://images.unsplash.com/photo-1434389677669-e08b4cac3105?w=600", "is_primary": True},
                ],
                "variants": [
                    {"size": "S", "color": "Charcoal", "color_code": "#36454F", "quantity": 10},
                    {"size": "M", "color": "Charcoal", "color_code": "#36454F", "quantity": 12},
                    {"size": "L", "color": "Charcoal", "color_code": "#36454F", "quantity": 8},
                    {"size": "S", "color": "Burgundy", "color_code": "#800020", "quantity": 8},
                    {"size": "M", "color": "Burgundy", "color_code": "#800020", "quantity": 10},
                ]
            },
            {
                "name": "Straight Fit Jeans",
                "slug": "straight-fit-jeans",
                "description": "Classic straight fit jeans with the perfect amount of stretch. Features a five-pocket design and comfortable mid-rise waist. Essential denim for every man.",
                "short_description": "Classic stretch straight fit jeans",
                "price": 89.99,
                "compare_price": 109.99,
                "sku": "MEN-JN-003",
                "quantity": 55,
                "is_active": True,
                "is_featured": False,
                "is_new_arrival": True,
                "brand": "Vibe Denim",
                "material": "98% Cotton, 2% Elastane",
                "care_instructions": "Machine wash cold, tumble dry low",
                "average_rating": 4.4,
                "total_reviews": 178,
                "total_sold": 534,
                "category_id": casual_cat.id,
                "images": [
                    {"url": "https://images.unsplash.com/photo-1542272604-787c3835535d?w=600", "is_primary": True},
                ],
                "variants": [
                    {"size": "30", "color": "Dark Blue", "color_code": "#00008B", "quantity": 10},
                    {"size": "32", "color": "Dark Blue", "color_code": "#00008B", "quantity": 15},
                    {"size": "34", "color": "Dark Blue", "color_code": "#00008B", "quantity": 15},
                    {"size": "36", "color": "Dark Blue", "color_code": "#00008B", "quantity": 10},
                    {"size": "32", "color": "Black", "color_code": "#000000", "quantity": 12},
                    {"size": "34", "color": "Black", "color_code": "#000000", "quantity": 12},
                ]
            },
            
            # Streetwear Collection
            {
                "name": "Oversized Graphic Hoodie",
                "slug": "oversized-graphic-hoodie",
                "description": "Bold oversized hoodie featuring exclusive graphic print. Made from heavyweight cotton fleece for ultimate comfort. Features a kangaroo pocket and drawstring hood.",
                "short_description": "Heavyweight graphic print hoodie",
                "price": 89.99,
                "compare_price": None,
                "sku": "STR-GH-001",
                "quantity": 45,
                "is_active": True,
                "is_featured": True,
                "is_new_arrival": True,
                "brand": "Vibe Street",
                "material": "100% Cotton Fleece",
                "care_instructions": "Machine wash cold, inside out",
                "average_rating": 4.6,
                "total_reviews": 234,
                "total_sold": 789,
                "category_id": streetwear_cat.id,
                "images": [
                    {"url": "https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=600", "is_primary": True},
                    {"url": "https://images.unsplash.com/photo-1578768079052-aa76e52ff62e?w=600", "is_primary": False},
                ],
                "variants": [
                    {"size": "S", "color": "Black", "color_code": "#000000", "quantity": 12},
                    {"size": "M", "color": "Black", "color_code": "#000000", "quantity": 15},
                    {"size": "L", "color": "Black", "color_code": "#000000", "quantity": 15},
                    {"size": "XL", "color": "Black", "color_code": "#000000", "quantity": 10},
                    {"size": "M", "color": "Gray", "color_code": "#808080", "quantity": 10},
                    {"size": "L", "color": "Gray", "color_code": "#808080", "quantity": 8},
                ]
            },
            {
                "name": "Cargo Jogger Pants",
                "slug": "cargo-jogger-pants",
                "description": "Utility-inspired cargo joggers with multiple pockets. Features an elastic waistband with drawstring, tapered leg, and ribbed cuffs. Blends style with functionality.",
                "short_description": "Multi-pocket cargo joggers",
                "price": 79.99,
                "compare_price": 99.99,
                "sku": "STR-CJ-002",
                "quantity": 50,
                "is_active": True,
                "is_featured": False,
                "is_new_arrival": True,
                "brand": "Vibe Street",
                "material": "100% Cotton Twill",
                "care_instructions": "Machine wash cold",
                "average_rating": 4.5,
                "total_reviews": 167,
                "total_sold": 445,
                "category_id": streetwear_cat.id,
                "images": [
                    {"url": "https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?w=600", "is_primary": True},
                ],
                "variants": [
                    {"size": "S", "color": "Olive", "color_code": "#808000", "quantity": 12},
                    {"size": "M", "color": "Olive", "color_code": "#808000", "quantity": 15},
                    {"size": "L", "color": "Olive", "color_code": "#808000", "quantity": 12},
                    {"size": "M", "color": "Black", "color_code": "#000000", "quantity": 12},
                    {"size": "L", "color": "Black", "color_code": "#000000", "quantity": 10},
                ]
            },
            
            # Activewear Collection
            {
                "name": "Performance Training Tee",
                "slug": "performance-training-tee",
                "description": "High-performance training t-shirt with moisture-wicking technology. Lightweight, breathable fabric keeps you cool during intense workouts. Features flatlock seams to prevent chafing.",
                "short_description": "Moisture-wicking training tee",
                "price": 49.99,
                "compare_price": None,
                "sku": "ACT-TT-001",
                "quantity": 80,
                "is_active": True,
                "is_featured": False,
                "is_new_arrival": True,
                "brand": "Vibe Active",
                "material": "92% Polyester, 8% Spandex",
                "care_instructions": "Machine wash cold",
                "average_rating": 4.4,
                "total_reviews": 123,
                "total_sold": 567,
                "category_id": activewear_cat.id,
                "images": [
                    {"url": "https://images.unsplash.com/photo-1581655353564-df123a1eb820?w=600", "is_primary": True},
                ],
                "variants": [
                    {"size": "S", "color": "Black", "color_code": "#000000", "quantity": 20},
                    {"size": "M", "color": "Black", "color_code": "#000000", "quantity": 25},
                    {"size": "L", "color": "Black", "color_code": "#000000", "quantity": 20},
                    {"size": "S", "color": "Navy", "color_code": "#000080", "quantity": 15},
                    {"size": "M", "color": "Navy", "color_code": "#000080", "quantity": 15},
                ]
            },
            {
                "name": "Athletic Compression Shorts",
                "slug": "athletic-compression-shorts",
                "description": "High-performance compression shorts for training and sports. Features moisture-wicking technology and four-way stretch. Built-in brief liner for support.",
                "short_description": "Performance compression training shorts",
                "price": 54.99,
                "compare_price": 69.99,
                "sku": "ACT-CS-002",
                "quantity": 55,
                "is_active": True,
                "is_featured": True,
                "is_new_arrival": True,
                "brand": "Vibe Active",
                "material": "87% Polyester, 13% Spandex",
                "care_instructions": "Machine wash cold, lay flat to dry",
                "average_rating": 4.7,
                "total_reviews": 198,
                "total_sold": 723,
                "category_id": activewear_cat.id,
                "images": [
                    {"url": "https://images.unsplash.com/photo-1591195853828-11db59a44f6b?w=600", "is_primary": True},
                ],
                "variants": [
                    {"size": "S", "color": "Black", "color_code": "#000000", "quantity": 12},
                    {"size": "M", "color": "Black", "color_code": "#000000", "quantity": 15},
                    {"size": "L", "color": "Black", "color_code": "#000000", "quantity": 15},
                    {"size": "XL", "color": "Black", "color_code": "#000000", "quantity": 10},
                    {"size": "M", "color": "Navy", "color_code": "#000080", "quantity": 10},
                    {"size": "L", "color": "Navy", "color_code": "#000080", "quantity": 8},
                ]
            },
            
            # Men's Accessories
            {
                "name": "Leather Messenger Bag",
                "slug": "leather-messenger-bag",
                "description": "Classic genuine leather messenger bag with adjustable shoulder strap. Features multiple compartments, laptop sleeve, and brass hardware. Perfect for work or travel.",
                "short_description": "Genuine leather messenger bag",
                "price": 179.99,
                "compare_price": 219.99,
                "sku": "ACC-MB-001",
                "quantity": 30,
                "is_active": True,
                "is_featured": True,
                "is_new_arrival": False,
                "brand": "Vibe Luxe",
                "material": "100% Genuine Leather",
                "care_instructions": "Wipe with damp cloth, use leather conditioner",
                "average_rating": 4.8,
                "total_reviews": 156,
                "total_sold": 345,
                "category_id": accessories_cat.id,
                "images": [
                    {"url": "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=600", "is_primary": True},
                ],
                "variants": [
                    {"size": "One Size", "color": "Brown", "color_code": "#8B4513", "quantity": 15},
                    {"size": "One Size", "color": "Black", "color_code": "#000000", "quantity": 15},
                ]
            },
            {
                "name": "Classic Aviator Sunglasses",
                "slug": "classic-aviator-sunglasses",
                "description": "Timeless aviator sunglasses with polarized lenses. Metal frame with adjustable nose pads for comfort. Provides 100% UV protection.",
                "short_description": "Polarized aviator sunglasses",
                "price": 79.99,
                "compare_price": None,
                "sku": "ACC-AS-002",
                "quantity": 40,
                "is_active": True,
                "is_featured": False,
                "is_new_arrival": True,
                "brand": "Vibe Eyewear",
                "material": "Metal Frame, Polarized Lenses",
                "care_instructions": "Clean with microfiber cloth",
                "average_rating": 4.5,
                "total_reviews": 89,
                "total_sold": 234,
                "category_id": accessories_cat.id,
                "images": [
                    {"url": "https://images.unsplash.com/photo-1511499767150-a48a237f0083?w=600", "is_primary": True},
                ],
                "variants": [
                    {"size": "One Size", "color": "Gold/Brown", "color_code": "#FFD700", "quantity": 20},
                    {"size": "One Size", "color": "Silver/Gray", "color_code": "#C0C0C0", "quantity": 20},
                ]
            },
            
            # Kids Collection
            {
                "name": "Rainbow Stripe T-Shirt",
                "slug": "kids-rainbow-stripe-tshirt",
                "description": "Fun and colorful rainbow stripe t-shirt for kids. Made from soft, durable cotton that's gentle on skin. Features a classic crew neck and easy-on design.",
                "short_description": "Colorful cotton kids t-shirt",
                "price": 29.99,
                "compare_price": None,
                "sku": "KID-RT-001",
                "quantity": 60,
                "is_active": True,
                "is_featured": False,
                "is_new_arrival": True,
                "brand": "Vibe Kids",
                "material": "100% Organic Cotton",
                "care_instructions": "Machine wash warm",
                "average_rating": 4.6,
                "total_reviews": 78,
                "total_sold": 234,
                "category_id": casual_cat.id,
                "images": [
                    {"url": "https://images.unsplash.com/photo-1519238263530-99bdd11df2ea?w=600", "is_primary": True},
                ],
                "variants": [
                    {"size": "3-4Y", "color": "Rainbow", "color_code": "#FF6B6B", "quantity": 15},
                    {"size": "5-6Y", "color": "Rainbow", "color_code": "#FF6B6B", "quantity": 20},
                    {"size": "7-8Y", "color": "Rainbow", "color_code": "#FF6B6B", "quantity": 15},
                    {"size": "9-10Y", "color": "Rainbow", "color_code": "#FF6B6B", "quantity": 10},
                ]
            },
            {
                "name": "Denim Overall Shorts",
                "slug": "kids-denim-overall-shorts",
                "description": "Adorable denim overall shorts perfect for playtime. Features adjustable straps, front pocket, and easy snap closures. Durable enough for active kids.",
                "short_description": "Classic denim overall shorts",
                "price": 44.99,
                "compare_price": 54.99,
                "sku": "KID-DO-002",
                "quantity": 45,
                "is_active": True,
                "is_featured": True,
                "is_new_arrival": False,
                "brand": "Vibe Kids",
                "material": "100% Cotton Denim",
                "care_instructions": "Machine wash cold",
                "average_rating": 4.7,
                "total_reviews": 92,
                "total_sold": 189,
                "category_id": casual_cat.id,
                "images": [
                    {"url": "https://images.unsplash.com/photo-1503919545889-aef636e10ad4?w=600", "is_primary": True},
                ],
                "variants": [
                    {"size": "3-4Y", "color": "Light Wash", "color_code": "#87CEEB", "quantity": 12},
                    {"size": "5-6Y", "color": "Light Wash", "color_code": "#87CEEB", "quantity": 15},
                    {"size": "7-8Y", "color": "Light Wash", "color_code": "#87CEEB", "quantity": 12},
                    {"size": "9-10Y", "color": "Light Wash", "color_code": "#87CEEB", "quantity": 8},
                ]
            },
        ]
        
        # Create products with images and variants
        for product_data in products_data:
            images_data = product_data.pop("images")
            variants_data = product_data.pop("variants")
            category_id = product_data.pop("category_id")
            
            # Get the category object
            category = db.query(Category).filter(Category.id == category_id).first()
            
            product = Product(**product_data)
            if category:
                product.categories.append(category)
            
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
        
        # ============ BANNERS ============
        banners = [
            Banner(
                title="Summer Collection 2026",
                subtitle="Fresh styles for the season",
                image_url="https://images.unsplash.com/photo-1617137968427-85924c800a22?w=1200",
                link_url="/products",
                button_text="Shop Now",
                is_active=True,
                sort_order=1
            ),
            Banner(
                title="New Arrivals",
                subtitle="Discover the latest trends",
                image_url="https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1200",
                link_url="/products?is_new_arrival=true",
                button_text="Explore",
                is_active=True,
                sort_order=2
            ),
            Banner(
                title="Up to 40% Off",
                subtitle="Limited time sale on selected items",
                image_url="https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=1200",
                link_url="/products",
                button_text="Shop Sale",
                is_active=True,
                sort_order=3
            ),
        ]
        
        db.add_all(banners)
        db.commit()
        
        print("Database seeded successfully!")
        print(f"   - {len(categories)} categories created")
        print(f"   - {len(products_data)} products created")
        print(f"   - {len(banners)} banners created")
        print("")
        print("Register your account at http://localhost:4200/auth/register")
        
    except Exception as e:
        db.rollback()
        print(f"Error seeding database: {e}")
        raise
    finally:
        db.close()

if __name__ == "__main__":
    seed_database()
