import os

from dotenv import load_dotenv
from flask import Flask, jsonify, request
from werkzeug.middleware.proxy_fix import ProxyFix

from .config import Config
from .routes import register_routes
from .routes.payments import create_razorpay_order
from .routes.payments import process_webhook_event
from .routes.payments import verify_razorpay_payment
from .routes.payments import verify_razorpay_webhook_signature


def create_app() -> Flask:
    env_path = os.path.join(os.path.dirname(__file__), ".env")
    load_dotenv(env_path)

    app = Flask(__name__)
    app.config.from_object(Config)

    if app.config.get("TRUST_PROXY_HEADERS", True):
        # Respect X-Forwarded-* headers when running behind a reverse proxy.
        app.wsgi_app = ProxyFix(app.wsgi_app, x_proto=1, x_host=1)

    @app.before_request
    def enforce_https():
        if app.config.get("FORCE_HTTPS", True) and not app.debug and not request.is_secure:
            return jsonify({"message": "HTTPS is required"}), 400

    @app.errorhandler(Exception)
    def handle_unexpected_error(error):
        app.logger.exception("Unhandled Flask error")
        return jsonify({"success": False, "message": "Internal server error"}), 500

    register_routes(app)

    @app.get("/")
    def root():
        return jsonify(
            {
                "message": "Razorpay Flask backend is running",
                "health": "/api/health",
            }
        )

    @app.post("/create-order")
    def create_order():
        if not request.is_json:
            return jsonify({"message": "Content-Type must be application/json"}), 400

        data = request.get_json(silent=True) or {}
        amount = data.get("amount")
        receipt = data.get("receipt")

        try:
            result = create_razorpay_order(amount_rupees=amount, receipt=receipt)
            return jsonify(result), 201
        except ValueError as exc:
            return jsonify({"message": str(exc)}), 400
        except Exception:
            app.logger.exception("Error in /create-order")
            return jsonify({"message": "Internal server error"}), 500

    @app.post("/verify-payment")
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
            app.logger.exception("Error in /verify-payment")
            return jsonify({"success": False, "message": "Internal server error"}), 500

    @app.post("/webhook")
    def webhook():
        raw_body = request.get_data(as_text=True)
        signature = request.headers.get("X-Razorpay-Signature", "")
        body = request.get_json(silent=True) or {}

        try:
            verify_razorpay_webhook_signature(raw_body=raw_body, signature=signature)
        except ValueError as exc:
            return jsonify({"success": False, "message": str(exc)}), 200
        except Exception:
            app.logger.exception("Error while verifying webhook signature")
            return jsonify({"success": False, "message": "Webhook processing failed"}), 200

        event_name = body.get("event", "")
        if event_name not in {"payment.captured", "payment.failed"}:
            return jsonify({"success": True, "message": "Event ignored"}), 200

        updated = process_webhook_event(event_name=event_name, payload=body.get("payload") or {})
        if updated:
            return jsonify({"success": True, "message": "Order status updated"}), 200

        return jsonify({"success": False, "message": "No matching order found"}), 200

    return app


app = create_app()


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5001, debug=app.config.get("DEBUG", False))
