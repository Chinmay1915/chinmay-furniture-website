import logging
import os
import smtplib
from email.message import EmailMessage

logger = logging.getLogger(__name__)

SMTP_HOST = os.getenv("SMTP_HOST", "").strip()
SMTP_PORT = int(os.getenv("SMTP_PORT", "587"))
SMTP_USER = os.getenv("SMTP_USER", "").strip()
SMTP_PASS = os.getenv("SMTP_PASS", "").replace(" ", "").strip()
SMTP_FROM = os.getenv("SMTP_FROM", SMTP_USER).strip()
SMTP_USE_TLS = os.getenv("SMTP_USE_TLS", "true").strip().lower() in {"1", "true", "yes"}
SMTP_USE_SSL = os.getenv("SMTP_USE_SSL", "false").strip().lower() in {"1", "true", "yes"}


def _smtp_ready() -> bool:
    return bool(SMTP_HOST and SMTP_PORT and SMTP_USER and SMTP_PASS and SMTP_FROM)


def _build_receipt_lines(order_id: str, order_doc: dict) -> str:
    lines = [
        "Thank you for shopping with BR Furniture.",
        "",
        f"Order ID: {order_id}",
        f"Order Date: {order_doc.get('created_at', '')}",
        "",
        "Items:",
    ]

    for idx, item in enumerate(order_doc.get("items", []), start=1):
        name = item.get("name", "Item")
        qty = int(item.get("quantity", 1) or 1)
        price = float(item.get("price", 0) or 0)
        subtotal = qty * price
        lines.append(f"{idx}. {name} - Qty {qty} x INR {price:,.2f} = INR {subtotal:,.2f}")

    lines.extend(
        [
            "",
            f"Total Paid: INR {float(order_doc.get('total_price', 0) or 0):,.2f}",
            "",
            "Delivery Details:",
            f"Customer: {order_doc.get('customer_name', '')}",
            f"Address: {order_doc.get('address', '')}",
            f"Landmark: {order_doc.get('landmark', '')}",
            f"State/Country: {order_doc.get('state', '')}, {order_doc.get('country', '')}",
            f"Pincode: {order_doc.get('pincode', '')}",
            f"Phone: {order_doc.get('phone', '')}",
            "",
            "If you have any questions, just reply to this email.",
        ]
    )

    return "\n".join(lines)


def send_order_receipt_email(user_email: str, order_id: str, order_doc: dict) -> bool:
    if not user_email or not _smtp_ready():
        return False

    message = EmailMessage()
    message["Subject"] = f"BR Furniture Receipt - Order #{order_id[:8]}"
    message["From"] = SMTP_FROM
    message["To"] = user_email
    message.set_content(_build_receipt_lines(order_id, order_doc))

    try:
        use_ssl = SMTP_USE_SSL or SMTP_PORT == 465
        smtp_cls = smtplib.SMTP_SSL if use_ssl else smtplib.SMTP
        with smtp_cls(SMTP_HOST, SMTP_PORT, timeout=20) as server:
            if SMTP_USE_TLS and not use_ssl:
                server.starttls()
            server.login(SMTP_USER, SMTP_PASS)
            server.send_message(message)
        return True
    except Exception as exc:
        logger.exception("Failed to send receipt email: %s", exc)
        return False


def send_auth_otp_email(user_email: str, otp_code: str, purpose: str) -> bool:
    if not user_email or not _smtp_ready():
        return False

    subject_action = "Login" if purpose == "login" else "Signup"
    message = EmailMessage()
    message["Subject"] = f"BR Furniture {subject_action} OTP"
    message["From"] = SMTP_FROM
    message["To"] = user_email
    message.set_content(
        "\n".join(
            [
                "Your BR Furniture verification code is:",
                "",
                f"{otp_code}",
                "",
                "This OTP is valid for 10 minutes.",
                "Do not share this code with anyone.",
            ]
        )
    )

    try:
        use_ssl = SMTP_USE_SSL or SMTP_PORT == 465
        smtp_cls = smtplib.SMTP_SSL if use_ssl else smtplib.SMTP
        with smtp_cls(SMTP_HOST, SMTP_PORT, timeout=20) as server:
            if SMTP_USE_TLS and not use_ssl:
                server.starttls()
            server.login(SMTP_USER, SMTP_PASS)
            server.send_message(message)
        return True
    except Exception as exc:
        logger.exception("Failed to send auth OTP email: %s", exc)
        return False
