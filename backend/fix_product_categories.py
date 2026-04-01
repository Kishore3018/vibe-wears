from __future__ import annotations

from database.connection import SessionLocal
from models.models import Category, Product


def detect_category_slug(name: str, description: str | None) -> str:
    name_text = name.lower()
    desc_text = (description or "").lower()

    keyword_map: dict[str, list[str]] = {
        "footwear": [
            "shoe",
            "shoes",
            "sneaker",
            "sneakers",
            "boot",
            "boots",
            "loafer",
            "sandals",
            "slipper",
            "heels",
            "footwear",
        ],
        "accessories": [
            "watch",
            "belt",
            "wallet",
            "tie",
            "sunglass",
            "cap",
            "bag",
            "bracelet",
            "accessory",
        ],
        "innerwear-sleepwear": [
            "innerwear",
            "underwear",
            "boxer",
            "brief",
            "sleepwear",
            "nightwear",
            "pajama",
            "pyjama",
            "lounge",
        ],
        "sportswear-activewear": [
            "sports",
            "sport",
            "activewear",
            "athleisure",
            "training",
            "gym",
            "workout",
            "running",
            "performance",
            "track",
        ],
        "ethnic-wear": [
            "ethnic",
            "kurta",
            "kurti",
            "sherwani",
            "dhoti",
            "nehru",
        ],
        "bottomwear": [
            "jean",
            "jeans",
            "pant",
            "pants",
            "trouser",
            "trousers",
            "chino",
            "chinos",
            "jogger",
            "joggers",
            "short",
            "shorts",
            "cargo",
            "bottomwear",
        ],
        "topwear": [
            "shirt",
            "t-shirt",
            "tshirt",
            "tee",
            "polo",
            "hoodie",
            "sweater",
            "jacket",
            "blazer",
            "suit",
            "tuxedo",
            "topwear",
            "vest",
        ],
    }

    priority_order = [
        "topwear",
        "bottomwear",
        "ethnic-wear",
        "sportswear-activewear",
        "innerwear-sleepwear",
        "accessories",
        "footwear",
    ]

    scores: dict[str, int] = {slug: 0 for slug in keyword_map}
    for slug, keywords in keyword_map.items():
        for word in keywords:
            if word in name_text:
                scores[slug] += 3
            if word in desc_text:
                scores[slug] += 1

    best_slug = max(priority_order, key=lambda slug: (scores[slug], -priority_order.index(slug)))
    if scores[best_slug] == 0:
        return "topwear"
    return best_slug


def fix_product_categories() -> None:
    db = SessionLocal()
    try:
        category_by_slug = {
            c.slug: c
            for c in db.query(Category)
            .filter(Category.is_active == True)
            .all()
        }

        required_slugs = {
            "topwear",
            "bottomwear",
            "ethnic-wear",
            "footwear",
            "accessories",
            "innerwear-sleepwear",
            "sportswear-activewear",
        }

        missing = sorted(required_slugs - set(category_by_slug.keys()))
        if missing:
            raise RuntimeError(f"Missing required categories: {missing}")

        products = db.query(Product).all()
        print(f"Found {len(products)} products")

        updated = 0
        for product in products:
            target_slug = detect_category_slug(product.name, product.description)
            target_category = category_by_slug[target_slug]

            current_slugs = sorted([c.slug for c in product.categories])
            if current_slugs != [target_slug]:
                product.categories = [target_category]
                updated += 1
                print(f"- {product.name}: {current_slugs} -> {target_slug}")

        db.commit()
        print(f"Updated {updated} products")

    except Exception:
        db.rollback()
        raise
    finally:
        db.close()


if __name__ == "__main__":
    fix_product_categories()
