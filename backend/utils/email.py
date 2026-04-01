import os
import smtplib
from email.message import EmailMessage


def _smtp_config() -> tuple[str, int, str, str, str, bool]:
    smtp_host = os.getenv("SMTP_HOST", "")
    smtp_port = int(os.getenv("SMTP_PORT", "587"))
    smtp_user = os.getenv("SMTP_USER", "")
    smtp_password = os.getenv("SMTP_PASSWORD", "")
    smtp_from = os.getenv("SMTP_FROM", smtp_user)
    smtp_use_tls = os.getenv("SMTP_USE_TLS", "true").lower() == "true"
    return smtp_host, smtp_port, smtp_user, smtp_password, smtp_from, smtp_use_tls


def _send_email(to_email: str, subject: str, plain_text: str, html_text: str) -> None:
    smtp_host, smtp_port, smtp_user, smtp_password, smtp_from, smtp_use_tls = _smtp_config()

    # Email notifications are optional; skip silently if SMTP is not configured.
    if not smtp_host or not smtp_user or not smtp_password or not smtp_from:
        return

    message = EmailMessage()
    message["Subject"] = subject
    message["From"] = smtp_from
    message["To"] = to_email
    message.set_content(plain_text)
    message.add_alternative(html_text, subtype="html")

    with smtplib.SMTP(smtp_host, smtp_port, timeout=20) as server:
        if smtp_use_tls:
            server.starttls()
        server.login(smtp_user, smtp_password)
        server.send_message(message)


def send_signup_success_email(to_email: str, first_name: str | None = None) -> None:
    """Send signup success email using SMTP settings from environment variables."""
    display_name = (first_name or "there").strip() or "there"

    plain_text = (
        f"Hi {display_name},\n\n"
        "Your signup on Vibe Wears was successful.\n"
        "You can now explore products, add to cart, and place orders.\n\n"
        "Thanks for joining Vibe Wears!"
    )

    html_text = f"""
    <html>
      <body style=\"font-family: Arial, sans-serif; color: #1a1a1a;\">
        <h2 style=\"margin-bottom: 8px;\">Welcome to Vibe Wears</h2>
        <p>Hi {display_name},</p>
        <p>Your signup on <strong>Vibe Wears</strong> was successful.</p>
        <p>You can now explore products, add items to cart, and place orders.</p>
        <p style=\"margin-top: 24px;\">Thanks for joining us!</p>
      </body>
    </html>
    """

    _send_email(
        to_email=to_email,
        subject="Welcome to Vibe Wears - Signup Successful",
        plain_text=plain_text,
        html_text=html_text,
    )


def send_google_login_success_email(to_email: str, first_name: str | None = None) -> None:
    """Send Google login success email using SMTP settings from environment variables."""
    display_name = (first_name or "there").strip() or "there"

    plain_text = (
        f"Hi {display_name},\n\n"
        "Your Google login to Vibe Wears was successful.\n"
        "If this was not you, please secure your account immediately.\n\n"
        "- Vibe Wears"
    )

    html_text = f"""
    <html>
      <body style=\"font-family: Arial, sans-serif; color: #1a1a1a;\">
        <h2 style=\"margin-bottom: 8px;\">Google Login Successful</h2>
        <p>Hi {display_name},</p>
        <p>Your Google login to <strong>Vibe Wears</strong> was successful.</p>
        <p>If this was not you, please secure your account immediately.</p>
        <p style=\"margin-top: 24px;\">- Vibe Wears</p>
      </body>
    </html>
    """

    _send_email(
        to_email=to_email,
        subject="Google Login Successful - Vibe Wears",
        plain_text=plain_text,
        html_text=html_text,
    )
