from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException
from bson import ObjectId

from models.schemas import OrderCreate
from utils.db import get_db
from utils.auth import get_current_user

router = APIRouter(prefix="/orders", tags=["orders"])


def serialize_order(doc):
    return {
        "id": str(doc.get("_id")),
        "user_id": str(doc.get("user_id")),
        "items": doc.get("items", []),
        "total_price": doc.get("total_price"),
        "customer_name": doc.get("customer_name"),
        "address": doc.get("address"),
        "phone": doc.get("phone"),
        "pincode": doc.get("pincode"),
        "country": doc.get("country"),
        "state": doc.get("state"),
        "landmark": doc.get("landmark"),
        "payment_id": doc.get("payment_id"),
        "payment_order_id": doc.get("payment_order_id"),
        "payment_signature": doc.get("payment_signature"),
        "created_at": doc.get("created_at"),
    }


@router.post("")
def create_order(payload: OrderCreate, user=Depends(get_current_user)):
    if len(payload.phone.strip()) < 10:
        raise HTTPException(status_code=400, detail="Phone number must be at least 10 digits")
    if len(payload.pincode.strip()) < 6:
        raise HTTPException(status_code=400, detail="Pincode must be 6 digits")
    db = get_db()
    doc = {
        "user_id": ObjectId(user["id"]),
        "items": [item.dict() for item in payload.items],
        "total_price": payload.total_price,
        "customer_name": payload.customer_name,
        "address": payload.address,
        "phone": payload.phone,
        "pincode": payload.pincode,
        "country": payload.country,
        "state": payload.state,
        "landmark": payload.landmark,
        "payment_id": payload.payment_id,
        "payment_order_id": payload.payment_order_id,
        "payment_signature": payload.payment_signature,
        "created_at": datetime.utcnow().isoformat(),
    }
    result = db.orders.insert_one(doc)
    return {"id": str(result.inserted_id)}


@router.get("")
def get_orders(user=Depends(get_current_user)):
    db = get_db()
    orders = db.orders.find({"user_id": ObjectId(user["id"])})
    return [serialize_order(o) for o in orders]


@router.get("/all")
def get_all_orders(user=Depends(get_current_user)):
    if not user.get("is_admin"):
        raise HTTPException(status_code=403, detail="Admin access required")
    db = get_db()
    orders = db.orders.find()
    return [serialize_order(o) for o in orders]
