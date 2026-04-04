import os
import random
from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, HTTPException
from google.auth.transport import requests as google_requests
from google.oauth2 import id_token as google_id_token
from email_validator import validate_email, EmailNotValidError

from models.schemas import SignupRequest, LoginRequest, GoogleAuthRequest, OTPRequest
from utils.db import get_db
from utils.auth import (
    hash_password,
    verify_password,
    create_access_token,
    ADMIN_EMAIL,
    ADMIN_PASSWORD,
)
from utils.emailer import send_auth_otp_email

router = APIRouter(prefix="/auth", tags=["auth"])
GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID", "")
ADMIN_EMAIL_NORMALIZED = ADMIN_EMAIL.strip().lower()
OTP_TTL_MINUTES = 10


def normalize_and_validate_email(raw_email: str) -> str:
    try:
        validated = validate_email(raw_email, check_deliverability=True)
        return validated.normalized.lower()
    except EmailNotValidError:
        raise HTTPException(
            status_code=400,
            detail="Please use a valid, reachable email address",
        )


def _utc_now() -> datetime:
    return datetime.now(timezone.utc)


def _generate_otp() -> str:
    return f"{random.randint(0, 999999):06d}"


def _validate_otp(db, email: str, purpose: str, otp_code: str) -> None:
    now_iso = _utc_now().isoformat()
    otp_doc = db.email_otps.find_one(
        {
            "email": email,
            "purpose": purpose,
            "code": otp_code,
            "used": False,
            "expires_at": {"$gt": now_iso},
        },
        sort=[("created_at", -1)],
    )
    if not otp_doc:
        raise HTTPException(status_code=400, detail="Invalid or expired OTP")

    db.email_otps.update_one({"_id": otp_doc["_id"]}, {"$set": {"used": True, "used_at": now_iso}})


def _check_login_credentials(db, email: str, password: str):
    if len(password) < 6:
        raise HTTPException(status_code=400, detail="Password must be at least 6 characters")

    if email == ADMIN_EMAIL_NORMALIZED and password != ADMIN_PASSWORD:
        raise HTTPException(status_code=401, detail="Invalid credentials")

    user = db.users.find_one({"email": email})
    if not user:
        if email == ADMIN_EMAIL_NORMALIZED and password == ADMIN_PASSWORD:
            return None
        raise HTTPException(status_code=401, detail="Invalid credentials")

    hashed = user.get("password")
    if not hashed or not verify_password(password, hashed):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    return user


@router.post("/request-otp")
def request_otp(payload: OTPRequest):
    db = get_db()
    try:
        db.command("ping")
    except Exception as e:
        raise HTTPException(status_code=503, detail=f"Database not available: {e}")

    purpose = (payload.purpose or "").strip().lower()
    if purpose not in {"signup", "login"}:
        raise HTTPException(status_code=400, detail="Purpose must be signup or login")

    email = normalize_and_validate_email(payload.email)

    if purpose == "signup":
        existing = db.users.find_one({"email": email})
        if existing:
            raise HTTPException(status_code=400, detail="Email already registered")
    else:
        if not payload.password:
            raise HTTPException(status_code=400, detail="Password is required for login OTP")
        _check_login_credentials(db, email, payload.password)

    otp_code = _generate_otp()
    now = _utc_now()
    expires = now + timedelta(minutes=OTP_TTL_MINUTES)

    db.email_otps.insert_one(
        {
            "email": email,
            "purpose": purpose,
            "code": otp_code,
            "used": False,
            "created_at": now.isoformat(),
            "expires_at": expires.isoformat(),
        }
    )

    sent = send_auth_otp_email(email, otp_code, purpose)
    if not sent:
        raise HTTPException(status_code=503, detail="OTP email service is unavailable")

    return {"message": "OTP sent successfully", "expires_in_minutes": OTP_TTL_MINUTES}


@router.post("/signup")
def signup(payload: SignupRequest):
    db = get_db()
    try:
        db.command("ping")
    except Exception as e:
        raise HTTPException(status_code=503, detail=f"Database not available: {e}")

    email = normalize_and_validate_email(payload.email)

    if len(payload.name.strip()) < 2:
        raise HTTPException(status_code=400, detail="Name must be at least 2 characters")
    if len(payload.password) < 6:
        raise HTTPException(status_code=400, detail="Password must be at least 6 characters")

    existing = db.users.find_one({"email": email})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")

    _validate_otp(db, email, "signup", payload.otp)

    if email == ADMIN_EMAIL_NORMALIZED and payload.password != ADMIN_PASSWORD:
        raise HTTPException(status_code=403, detail="Admin credentials invalid")

    user_doc = {
        "name": payload.name.strip(),
        "email": email,
        "password": hash_password(payload.password),
        "is_admin": email == ADMIN_EMAIL_NORMALIZED and payload.password == ADMIN_PASSWORD,
    }
    result = db.users.insert_one(user_doc)

    token = create_access_token(str(result.inserted_id))
    return {
        "token": token,
        "user": {
            "id": str(result.inserted_id),
            "name": user_doc["name"],
            "email": user_doc["email"],
            "is_admin": user_doc["is_admin"],
        },
    }


@router.post("/login")
def login(payload: LoginRequest):
    db = get_db()
    try:
        db.command("ping")
    except Exception as e:
        raise HTTPException(status_code=503, detail=f"Database not available: {e}")

    email = normalize_and_validate_email(payload.email)
    user = _check_login_credentials(db, email, payload.password)

    _validate_otp(db, email, "login", payload.otp)

    if not user and email == ADMIN_EMAIL_NORMALIZED and payload.password == ADMIN_PASSWORD:
        user_doc = {
            "name": "Admin",
            "email": ADMIN_EMAIL_NORMALIZED,
            "password": hash_password(ADMIN_PASSWORD),
            "is_admin": True,
        }
        result = db.users.insert_one(user_doc)
        token = create_access_token(str(result.inserted_id))
        return {
            "token": token,
            "user": {
                "id": str(result.inserted_id),
                "name": "Admin",
                "email": ADMIN_EMAIL_NORMALIZED,
                "is_admin": True,
            },
        }

    token = create_access_token(str(user.get("_id")))
    return {
        "token": token,
        "user": {
            "id": str(user.get("_id")),
            "name": user.get("name"),
            "email": user.get("email"),
            "is_admin": bool(user.get("is_admin")),
        },
    }


@router.post("/google")
def google_auth(payload: GoogleAuthRequest):
    if not GOOGLE_CLIENT_ID:
        raise HTTPException(status_code=503, detail="Google login is not configured on server")

    try:
        token_info = google_id_token.verify_oauth2_token(
            payload.credential,
            google_requests.Request(),
            GOOGLE_CLIENT_ID,
        )
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid Google credential")

    raw_email = token_info.get("email")
    if not raw_email:
        raise HTTPException(status_code=400, detail="Google account email not available")

    email = normalize_and_validate_email(raw_email)
    name = (token_info.get("name") or email.split("@")[0]).strip()

    db = get_db()
    user = db.users.find_one({"email": email})

    if not user:
        user_doc = {
            "name": name,
            "email": email,
            "password": None,
            "is_admin": email == ADMIN_EMAIL_NORMALIZED,
            "auth_provider": "google",
        }
        result = db.users.insert_one(user_doc)
        user_id = str(result.inserted_id)
        is_admin = user_doc["is_admin"]
    else:
        user_id = str(user.get("_id"))
        is_admin = bool(user.get("is_admin"))

    token = create_access_token(user_id)
    return {
        "token": token,
        "user": {
            "id": user_id,
            "name": name if not user else user.get("name") or name,
            "email": email,
            "is_admin": is_admin,
        },
    }
