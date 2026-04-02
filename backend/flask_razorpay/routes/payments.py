import re

import razorpay
from flask import Blueprint, current_app, jsonify, request

from ..db import update_order_payment_status
from ..db import update_order_status_after_verification


payments_bp = Blueprint("payments", __name__, url_prefix="/api/payments")

ORDER_ID_PATTERN = re.compile(r"^order_[A-Za-z0-9]+$")
PAYMENT_ID_PATTERN = re.compile(r"^pay_[A-Za-z0-9]+$")
SIGNATURE_PATTERN = re.compile(r"^[A-Za-z0-9+/=_-]{32,256}$")


def _sanitize_receipt(receipt: str | None) -> str | None:
    if receipt is None:
        return None

    value = str(receipt).strip()
    if not value:
        return None
    if len(value) > 40:
        raise ValueError("receipt must be <= 40 characters")
    if not re.fullmatch(r"[A-Za-z0-9_\-./]+", value):
        raise ValueError("receipt has invalid characters")
    return value


def _validate_amount(amount_rupees):
    try:
        amount_paise = int(round(float(amount_rupees) * 100))
    except (TypeError, ValueError):
        raise ValueError("amount must be a valid number")

    # Safety bounds to reduce abuse and accidental huge charges.
    min_paise = 100
    max_paise = 50_000_000
    if amount_paise < min_paise:
        raise ValueError("amount must be at least 1.00")
    if amount_paise > max_paise:
        raise ValueError("amount exceeds maximum allowed")
    return amount_paise


def _validate_verify_fields(razorpay_order_id: str, razorpay_payment_id: str, razorpay_signature: str):
    if not razorpay_order_id or not razorpay_payment_id or not razorpay_signature:
        raise ValueError("Missing Razorpay verification fields")

    if not ORDER_ID_PATTERN.match(razorpay_order_id):
        raise ValueError("Invalid razorpay_order_id format")
    if not PAYMENT_ID_PATTERN.match(razorpay_payment_id):
        raise ValueError("Invalid razorpay_payment_id format")
    if not SIGNATURE_PATTERN.match(razorpay_signature):
        raise ValueError("Invalid razorpay_signature format")


def get_razorpay_client() -> razorpay.Client:
    key_id = current_app.config.get("RAZORPAY_KEY_ID")
    key_secret = current_app.config.get("RAZORPAY_KEY_SECRET")

    if not key_id or not key_secret:
        raise ValueError("Razorpay keys are not configured")

    return razorpay.Client(auth=(key_id, key_secret))


def create_razorpay_order(amount_rupees, receipt=None):
    if amount_rupees is None:
        raise ValueError("amount is required")

    amount_paise = _validate_amount(amount_rupees)
    receipt_value = _sanitize_receipt(receipt)

    client = get_razorpay_client()
    order_data = {
        "amount": amount_paise,
        "currency": current_app.config.get("RAZORPAY_CURRENCY", "INR"),
        "receipt": receipt_value or f"receipt_{amount_paise}",
        "payment_capture": 1,
    }
    order = client.order.create(data=order_data)
    return {
        "order_id": order.get("id"),
        "amount": order.get("amount"),
        "currency": order.get("currency"),
    }


def verify_razorpay_payment(razorpay_order_id, razorpay_payment_id, razorpay_signature):
    _validate_verify_fields(razorpay_order_id, razorpay_payment_id, razorpay_signature)

    client = get_razorpay_client()
    params = {
        "razorpay_order_id": razorpay_order_id,
        "razorpay_payment_id": razorpay_payment_id,
        "razorpay_signature": razorpay_signature,
    }
    try:
        client.utility.verify_payment_signature(params)
    except Exception as exc:
        update_order_status_after_verification(
            payment_id=razorpay_payment_id,
            signature=razorpay_signature,
            is_valid=False,
        )
        raise ValueError("Invalid signature") from exc

    update_order_status_after_verification(
        payment_id=razorpay_payment_id,
        signature=razorpay_signature,
        is_valid=True,
    )

    return {"success": True, "message": "Payment verified"}


def verify_razorpay_webhook_signature(raw_body: str, signature: str):
    if not signature:
        raise ValueError("Missing X-Razorpay-Signature header")
    if not SIGNATURE_PATTERN.match(signature):
        raise ValueError("Invalid webhook signature format")

    webhook_secret = current_app.config.get("RAZORPAY_WEBHOOK_SECRET")
    if not webhook_secret:
        raise ValueError("Webhook secret is not configured")

    client = get_razorpay_client()
    try:
        client.utility.verify_webhook_signature(raw_body, signature, webhook_secret)
    except Exception as exc:
        raise ValueError("Invalid webhook signature") from exc


def process_webhook_event(event_name: str, payload: dict) -> bool:
    payment_entity = (((payload or {}).get("payment") or {}).get("entity")) or {}
    if not payment_entity:
        return False

    return update_order_payment_status(event_name=event_name, payment_entity=payment_entity)


@payments_bp.post("/create-order")
def create_order():
    if not request.is_json:
        return jsonify({"success": False, "message": "Content-Type must be application/json"}), 400

    data = request.get_json(silent=True) or {}
    amount_rupees = data.get("amount")
    receipt = data.get("receipt")

    try:
        result = create_razorpay_order(amount_rupees=amount_rupees, receipt=receipt)
        return jsonify({"success": True, **result}), 201
    except ValueError as exc:
        return jsonify({"success": False, "message": str(exc)}), 400
    except Exception:
        current_app.logger.exception("Unexpected error while creating Razorpay order")
        return jsonify({"success": False, "message": "Internal server error"}), 500


@payments_bp.post("/verify")
def verify_payment():
    if not request.is_json:
        return jsonify({"success": False, "message": "Content-Type must be application/json"}), 400

    data = request.get_json(silent=True) or {}
    razorpay_order_id = data.get("razorpay_order_id")
    razorpay_payment_id = data.get("razorpay_payment_id")
    razorpay_signature = data.get("razorpay_signature")

    try:
        result = verify_razorpay_payment(
            razorpay_order_id=razorpay_order_id,
            razorpay_payment_id=razorpay_payment_id,
            razorpay_signature=razorpay_signature,
        )
        return jsonify(result), 200
    except ValueError as exc:
        return jsonify({"success": False, "message": str(exc)}), 400
    except Exception:
        current_app.logger.exception("Unexpected error while verifying Razorpay payment")
        return jsonify({"success": False, "message": "Internal server error"}), 500
