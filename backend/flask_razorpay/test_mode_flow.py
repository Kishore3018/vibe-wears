import hashlib
import hmac
import os
import sqlite3
import sys
from pathlib import Path


def build_signature(order_id: str, payment_id: str, secret: str) -> str:
    message = f"{order_id}|{payment_id}".encode("utf-8")
    return hmac.new(secret.encode("utf-8"), message, hashlib.sha256).hexdigest()


def setup_test_db(db_path: Path):
    if db_path.exists():
        db_path.unlink()

    connection = sqlite3.connect(str(db_path))
    cursor = connection.cursor()

    cursor.execute(
        """
        CREATE TABLE orders (
            id INTEGER PRIMARY KEY,
            user_id INTEGER NOT NULL,
            amount REAL NOT NULL,
            status TEXT NOT NULL,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP
        )
        """
    )

    cursor.execute(
        """
        CREATE TABLE payments (
            id INTEGER PRIMARY KEY,
            order_id INTEGER NOT NULL,
            payment_id TEXT NOT NULL UNIQUE,
            status TEXT NOT NULL,
            signature TEXT,
            FOREIGN KEY (order_id) REFERENCES orders(id)
        )
        """
    )

    cursor.execute("INSERT INTO orders (id, user_id, amount, status) VALUES (1, 10, 499.00, 'pending')")
    cursor.execute("INSERT INTO payments (id, order_id, payment_id, status) VALUES (1, 1, 'pay_TestSuccess001', 'pending')")

    cursor.execute("INSERT INTO orders (id, user_id, amount, status) VALUES (2, 11, 599.00, 'pending')")
    cursor.execute("INSERT INTO payments (id, order_id, payment_id, status) VALUES (2, 2, 'pay_TestFail001', 'pending')")

    connection.commit()
    connection.close()


def get_statuses(db_path: Path):
    connection = sqlite3.connect(str(db_path))
    cursor = connection.cursor()

    cursor.execute("SELECT status FROM orders WHERE id = 1")
    order1_status = cursor.fetchone()[0]
    cursor.execute("SELECT status FROM payments WHERE payment_id = 'pay_TestSuccess001'")
    payment1_status = cursor.fetchone()[0]

    cursor.execute("SELECT status FROM orders WHERE id = 2")
    order2_status = cursor.fetchone()[0]
    cursor.execute("SELECT status FROM payments WHERE payment_id = 'pay_TestFail001'")
    payment2_status = cursor.fetchone()[0]

    connection.close()
    return order1_status, payment1_status, order2_status, payment2_status


def run_test():
    project_root = Path(__file__).resolve().parents[2]
    if str(project_root) not in sys.path:
        sys.path.insert(0, str(project_root))

    db_path = project_root / "backend" / "flask_razorpay" / "test_mode.db"

    setup_test_db(db_path)

    os.environ["DATABASE_URL"] = f"sqlite:///{db_path.as_posix()}"
    os.environ["FORCE_HTTPS"] = "false"
    os.environ["RAZORPAY_KEY_ID"] = "rzp_test_key_for_local"
    os.environ["RAZORPAY_KEY_SECRET"] = "test_secret_local"

    from backend.flask_razorpay.app import create_app

    app = create_app()
    client = app.test_client()

    order_id_success = "order_TestSuccess001"
    payment_id_success = "pay_TestSuccess001"
    good_signature = build_signature(order_id_success, payment_id_success, os.environ["RAZORPAY_KEY_SECRET"])

    success_response = client.post(
        "/verify-payment",
        json={
            "razorpay_order_id": order_id_success,
            "razorpay_payment_id": payment_id_success,
            "razorpay_signature": good_signature,
        },
    )

    order_id_fail = "order_TestFail001"
    payment_id_fail = "pay_TestFail001"
    bad_signature = "0" * 64

    failure_response = client.post(
        "/verify-payment",
        json={
            "razorpay_order_id": order_id_fail,
            "razorpay_payment_id": payment_id_fail,
            "razorpay_signature": bad_signature,
        },
    )

    order1_status, payment1_status, order2_status, payment2_status = get_statuses(db_path)

    print("verify-success-status-code:", success_response.status_code)
    print("verify-success-body:", success_response.get_json())
    print("verify-failure-status-code:", failure_response.status_code)
    print("verify-failure-body:", failure_response.get_json())
    print("db-order-1-status:", order1_status)
    print("db-payment-1-status:", payment1_status)
    print("db-order-2-status:", order2_status)
    print("db-payment-2-status:", payment2_status)


if __name__ == "__main__":
    run_test()
