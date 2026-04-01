from database.connection import SessionLocal
from models.models import Category


def update_categories() -> None:
    db = SessionLocal()
    try:
        target_categories = [
            {
                "name": "Topwear",
                "slug": "topwear",
                "description": "T-shirts, shirts, polos, jackets, hoodies, and upper-body essentials.",
                "sort_order": 1,
            },
            {
                "name": "Bottomwear",
                "slug": "bottomwear",
                "description": "Jeans, trousers, chinos, joggers, shorts, and lower-body essentials.",
                "sort_order": 2,
            },
            {
                "name": "Ethnic Wear",
                "slug": "ethnic-wear",
                "description": "Traditional and festive styles including kurtas and ethnic sets.",
                "sort_order": 3,
            },
            {
                "name": "Footwear",
                "slug": "footwear",
                "description": "Shoes, sneakers, sandals, and all footwear essentials.",
                "sort_order": 4,
            },
            {
                "name": "Accessories",
                "slug": "accessories",
                "description": "Watches, belts, wallets, caps, and fashion accessories.",
                "sort_order": 5,
            },
            {
                "name": "Innerwear & Sleepwear",
                "slug": "innerwear-sleepwear",
                "description": "Innerwear, loungewear, and sleepwear for everyday comfort.",
                "sort_order": 6,
            },
            {
                "name": "Sportswear / Activewear",
                "slug": "sportswear-activewear",
                "description": "Performance wear for workouts, training, and active lifestyle.",
                "sort_order": 7,
            },
        ]

        existing = (
            db.query(Category)
            .filter(Category.parent_id.is_(None))
            .order_by(Category.sort_order, Category.id)
            .all()
        )

        if not existing:
            print("No categories found. Creating target categories from scratch...")
            for item in target_categories:
                db.add(
                    Category(
                        name=item["name"],
                        slug=item["slug"],
                        description=item["description"],
                        is_active=True,
                        sort_order=item["sort_order"],
                    )
                )
            db.commit()
            print("Created all target categories.")
            return

        reusable = existing[: min(len(existing), len(target_categories))]

        # Phase 1: temporary rename to avoid UNIQUE conflicts during swap.
        for cat in reusable:
            cat.name = f"__tmp_name_{cat.id}__"
            cat.slug = f"__tmp_slug_{cat.id}__"
        db.flush()

        # Phase 2: assign final values in target order.
        for idx, cat in enumerate(reusable):
            target = target_categories[idx]
            cat.name = target["name"]
            cat.slug = target["slug"]
            cat.description = target["description"]
            cat.sort_order = target["sort_order"]
            cat.is_active = True

        # Create additional categories if target list is longer than existing list.
        for target in target_categories[len(reusable):]:
            db.add(
                Category(
                    name=target["name"],
                    slug=target["slug"],
                    description=target["description"],
                    is_active=True,
                    sort_order=target["sort_order"],
                )
            )

        # Deactivate extra parent categories not in target list.
        for extra in existing[len(target_categories):]:
            extra.is_active = False

        db.commit()

        final_categories = (
            db.query(Category)
            .filter(Category.parent_id.is_(None), Category.is_active == True)
            .order_by(Category.sort_order, Category.id)
            .all()
        )

        print("Updated categories:")
        for cat in final_categories:
            print(f"- {cat.sort_order}. {cat.name} ({cat.slug})")

    except Exception:
        db.rollback()
        raise
    finally:
        db.close()


if __name__ == "__main__":
    update_categories()
