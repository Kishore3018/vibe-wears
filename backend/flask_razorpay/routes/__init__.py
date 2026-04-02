from .health import health_bp
from .payments import payments_bp


def register_routes(app):
    app.register_blueprint(health_bp)
    app.register_blueprint(payments_bp)
