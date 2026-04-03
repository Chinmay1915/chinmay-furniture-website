import os

from fastapi import APIRouter, HTTPException
from bson import ObjectId
from google.auth.transport import requests as google_requests
from google.oauth2 import id_token as google_id_token

from models.schemas import SignupRequest, LoginRequest, GoogleAuthRequest
from utils.db import get_db
from utils.auth import (
    hash_password,
    verify_password,
    create_access_token,
    ADMIN_EMAIL,
    ADMIN_PASSWORD,
)

router = APIRouter(prefix="/auth", tags=["auth"])
GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID", "")


@router.post("/signup")
def signup(payload: SignupRequest):
    db = get_db()
    try:
        db.command("ping")
    except Exception as e:
        raise HTTPException(status_code=503, detail=f"Database not available: {e}")
    if len(payload.name.strip()) < 2:
        raise HTTPException(status_code=400, detail="Name must be at least 2 characters")
    if len(payload.password) < 6:
        raise HTTPException(status_code=400, detail="Password must be at least 6 characters")
    existing = db.users.find_one({"email": payload.email})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")

    if payload.email == ADMIN_EMAIL and payload.password != ADMIN_PASSWORD:
        raise HTTPException(status_code=403, detail="Admin credentials invalid")

    user_doc = {
        "name": payload.name,
        "email": payload.email,
        "password": hash_password(payload.password),
        "is_admin": payload.email == ADMIN_EMAIL and payload.password == ADMIN_PASSWORD,
    }
    result = db.users.insert_one(user_doc)

    token = create_access_token(str(result.inserted_id))
    return {
        "token": token,
        "user": {
            "id": str(result.inserted_id),
            "name": payload.name,
            "email": payload.email,
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
    if len(payload.password) < 6:
        raise HTTPException(status_code=400, detail="Password must be at least 6 characters")
    if payload.email == ADMIN_EMAIL and payload.password != ADMIN_PASSWORD:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    user = db.users.find_one({"email": payload.email})
    if not user:
        if payload.email == ADMIN_EMAIL and payload.password == ADMIN_PASSWORD:
            user_doc = {
                "name": "Admin",
                "email": ADMIN_EMAIL,
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
                    "email": ADMIN_EMAIL,
                    "is_admin": True,
                },
            }
        raise HTTPException(status_code=401, detail="Invalid credentials")

    if not verify_password(payload.password, user.get("password")):
        raise HTTPException(status_code=401, detail="Invalid credentials")

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

    email = token_info.get("email")
    if not email:
        raise HTTPException(status_code=400, detail="Google account email not available")

    name = token_info.get("name") or email.split("@")[0]

    db = get_db()
    user = db.users.find_one({"email": email})

    if not user:
        user_doc = {
            "name": name,
            "email": email,
            "password": None,
            "is_admin": email == ADMIN_EMAIL,
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
