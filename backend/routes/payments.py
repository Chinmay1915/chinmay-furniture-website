import base64
import hashlib
import hmac
import json
import os
import urllib.error
import urllib.request

from fastapi import APIRouter, HTTPException

from models.schemas import RazorpayCreateOrderRequest, RazorpayVerifyRequest

router = APIRouter(prefix="/payments", tags=["payments"])

RAZORPAY_KEY_ID = os.getenv("RAZORPAY_KEY_ID", "")
RAZORPAY_KEY_SECRET = os.getenv("RAZORPAY_KEY_SECRET", "")


def _require_razorpay_keys():
    if not RAZORPAY_KEY_ID or not RAZORPAY_KEY_SECRET:
        raise HTTPException(
            status_code=503,
            detail="Razorpay keys are not configured on server",
        )


def _auth_header() -> str:
    token = f"{RAZORPAY_KEY_ID}:{RAZORPAY_KEY_SECRET}".encode("utf-8")
    return "Basic " + base64.b64encode(token).decode("utf-8")


@router.get("/config")
def get_payment_config():
    _require_razorpay_keys()
    return {"key_id": RAZORPAY_KEY_ID}


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
            return {"key_id": RAZORPAY_KEY_ID, "order": order}
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
    _require_razorpay_keys()
    message = f"{payload.razorpay_order_id}|{payload.razorpay_payment_id}".encode("utf-8")
    expected_signature = hmac.new(
        RAZORPAY_KEY_SECRET.encode("utf-8"),
        message,
        hashlib.sha256,
    ).hexdigest()

    if not hmac.compare_digest(expected_signature, payload.razorpay_signature):
        raise HTTPException(status_code=400, detail="Invalid payment signature")

    return {"verified": True}
