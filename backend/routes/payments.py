import base64
import hashlib
import hmac
import json
import os
import urllib.error
import urllib.request
from pathlib import Path

from fastapi import APIRouter, HTTPException
from dotenv import dotenv_values, load_dotenv

from models.schemas import RazorpayCreateOrderRequest, RazorpayVerifyRequest

router = APIRouter(prefix="/payments", tags=["payments"])
load_dotenv()


def _get_razorpay_keys():
    key_id = os.getenv("RAZORPAY_KEY_ID", "").strip()
    key_secret = os.getenv("RAZORPAY_KEY_SECRET", "").strip()
    if key_id and key_secret:
        return key_id, key_secret

    # Fallback: read from backend/.env when process env is empty/stale.
    env_path = Path(__file__).resolve().parents[1] / ".env"
    if env_path.exists():
        env_values = dotenv_values(env_path)
        key_id = (env_values.get("RAZORPAY_KEY_ID") or "").strip()
        key_secret = (env_values.get("RAZORPAY_KEY_SECRET") or "").strip()
    return key_id, key_secret


def _require_razorpay_keys():
    key_id, key_secret = _get_razorpay_keys()
    if not key_id or not key_secret:
        raise HTTPException(
            status_code=503,
            detail="Razorpay keys are not configured on server",
        )
    return key_id, key_secret


def _auth_header() -> str:
    key_id, key_secret = _require_razorpay_keys()
    token = f"{key_id}:{key_secret}".encode("utf-8")
    return "Basic " + base64.b64encode(token).decode("utf-8")


@router.get("/config")
def get_payment_config():
    key_id, _ = _require_razorpay_keys()
    return {"key_id": key_id}


@router.post("/create-order")
def create_razorpay_order(payload: RazorpayCreateOrderRequest):
    _require_razorpay_keys()
    if payload.amount <= 0:
        raise HTTPException(status_code=400, detail="Amount must be greater than 0")
    if payload.currency != "INR":
        raise HTTPException(status_code=400, detail="Only INR is supported")

    body = {
        "amount": int(payload.amount),
        "currency": payload.currency,
        "receipt": payload.receipt,
        "notes": payload.notes or {},
    }
    request = urllib.request.Request(
        url="https://api.razorpay.com/v1/orders",
        data=json.dumps(body).encode("utf-8"),
        headers={
            "Content-Type": "application/json",
            "Authorization": _auth_header(),
        },
        method="POST",
    )

    try:
        with urllib.request.urlopen(request, timeout=10) as response:
            raw = response.read().decode("utf-8")
            order = json.loads(raw)
            key_id, _ = _require_razorpay_keys()
            return {"key_id": key_id, "order": order}
    except urllib.error.HTTPError as exc:
        detail = exc.read().decode("utf-8")
        try:
            parsed = json.loads(detail)
            detail = parsed.get("error", {}).get("description") or detail
        except Exception:
            pass
        raise HTTPException(status_code=400, detail=f"Razorpay order create failed: {detail}")
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Payment gateway error: {exc}")


@router.post("/verify")
def verify_razorpay_signature(payload: RazorpayVerifyRequest):
    _, key_secret = _require_razorpay_keys()
    message = f"{payload.razorpay_order_id}|{payload.razorpay_payment_id}".encode("utf-8")
    expected_signature = hmac.new(
        key_secret.encode("utf-8"),
        message,
        hashlib.sha256,
    ).hexdigest()

    if not hmac.compare_digest(expected_signature, payload.razorpay_signature):
        raise HTTPException(status_code=400, detail="Invalid payment signature")

    return {"verified": True}
