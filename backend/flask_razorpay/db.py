import os

from sqlalchemy import create_engine, text


def _database_url() -> str:
    return os.getenv("DATABASE_URL", "sqlite:///./backend/vibewears.db")


def _engine():
    database_url = _database_url()
    if database_url.startswith("sqlite"):
        return create_engine(database_url, connect_args={"check_same_thread": False})
    return create_engine(database_url, pool_pre_ping=True, pool_recycle=300)


def _is_sqlite_engine(engine) -> bool:
    return engine.url.get_backend_name() == "sqlite"


def update_order_payment_status(event_name: str, payment_entity: dict) -> bool:
    target_status_map = {
        "payment.captured": "COMPLETED",
        "payment.failed": "FAILED",
    }
    target_status = target_status_map.get(event_name)
    if not target_status:
        return False

    payment_id = (payment_entity or {}).get("id")
    notes = (payment_entity or {}).get("notes") or {}
    receipt = notes.get("receipt")
    order_number = notes.get("order_number") or receipt

    if not payment_id and not order_number:
        return False

    query_by_payment_id = text(
        """
        UPDATE orders
        SET payment_status = :payment_status,
            payment_id = COALESCE(payment_id, :payment_id),
            updated_at = CURRENT_TIMESTAMP
        WHERE payment_id = :payment_id
        """
    )

    query_by_order_number = text(
        """
        UPDATE orders
        SET payment_status = :payment_status,
            payment_id = COALESCE(payment_id, :payment_id),
            updated_at = CURRENT_TIMESTAMP
        WHERE order_number = :order_number
        """
    )

    engine = _engine()
    with engine.begin() as connection:
        updated_rows = 0

        if payment_id:
            result = connection.execute(
                query_by_payment_id,
                {
                    "payment_status": target_status,
                    "payment_id": payment_id,
                },
            )
            updated_rows = result.rowcount or 0

        if updated_rows == 0 and order_number:
            result = connection.execute(
                query_by_order_number,
                {
                    "payment_status": target_status,
                    "payment_id": payment_id,
                    "order_number": order_number,
                },
            )
            updated_rows = result.rowcount or 0

        return updated_rows > 0


def update_order_status_after_verification(payment_id: str, signature: str, is_valid: bool) -> bool:
    if not payment_id:
        return False

    payment_status = "captured" if is_valid else "failed"
    order_status = "success" if is_valid else "failed"

    update_payment_query = text(
        """
        UPDATE payments
        SET status = :payment_status,
            signature = :signature
        WHERE payment_id = :payment_id
        """
    )

    update_order_query_mysql = text(
        """
        UPDATE orders o
        JOIN payments p ON p.order_id = o.id
        SET o.status = :order_status
        WHERE p.payment_id = :payment_id
        """
    )

    update_order_query_sqlite = text(
        """
        UPDATE orders
        SET status = :order_status
        WHERE id = (
            SELECT order_id
            FROM payments
            WHERE payment_id = :payment_id
            LIMIT 1
        )
        """
    )

    engine = _engine()
    try:
        with engine.begin() as connection:
            order_query = update_order_query_sqlite if _is_sqlite_engine(engine) else update_order_query_mysql

            payment_result = connection.execute(
                update_payment_query,
                {
                    "payment_status": payment_status,
                    "signature": signature,
                    "payment_id": payment_id,
                },
            )
            order_result = connection.execute(
                order_query,
                {
                    "order_status": order_status,
                    "payment_id": payment_id,
                },
            )

            updated_payments = payment_result.rowcount or 0
            updated_orders = order_result.rowcount or 0
            return updated_payments > 0 and updated_orders > 0
    except Exception:
        return False
