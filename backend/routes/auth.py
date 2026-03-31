from fastapi import APIRouter, HTTPException
from bson import ObjectId

from models.schemas import SignupRequest, LoginRequest
from utils.db import get_db
from utils.auth import (
    hash_password,
    verify_password,
    create_access_token,
    ADMIN_EMAIL,
    ADMIN_PASSWORD,
)

router = APIRouter(prefix="/auth", tags=["auth"])


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
