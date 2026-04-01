import os
from uuid import uuid4
from pathlib import Path
from fastapi import APIRouter, HTTPException, UploadFile, File, Form, Depends
from bson import ObjectId

from utils.db import get_db
from utils.auth import get_current_user

router = APIRouter(prefix="/products", tags=["products"])

BASE_URL = os.getenv("BASE_URL", "http://localhost:8000")

UPLOAD_DIR = Path(__file__).resolve().parent.parent / "uploads"
IMAGE_DIR = UPLOAD_DIR / "images"
MODEL_DIR = UPLOAD_DIR / "models"
IMAGE_DIR.mkdir(parents=True, exist_ok=True)
MODEL_DIR.mkdir(parents=True, exist_ok=True)


def serialize_product(doc):
    def normalize_asset_url(url: str | None) -> str | None:
        if not url:
            return url
        # Migrate old local URLs so previously created products still work in production.
        if url.startswith("http://localhost:8000"):
            return url.replace("http://localhost:8000", BASE_URL)
        return url

    return {
        "id": str(doc.get("_id")),
        "name": doc.get("name"),
        "price": doc.get("price"),
        "description": doc.get("description"),
        "collection": doc.get("collection"),
        "image_url": normalize_asset_url(doc.get("image_url")),
        "model_url": normalize_asset_url(doc.get("model_url")),
    }


def require_admin(user):
    if not user or not user.get("is_admin"):
        raise HTTPException(status_code=403, detail="Admin access required")


@router.get("")
def get_products():
    db = get_db()
    products = [serialize_product(p) for p in db.products.find()]
    return products


@router.get("/{product_id}")
def get_product(product_id: str):
    if not ObjectId.is_valid(product_id):
        raise HTTPException(status_code=404, detail="Product not found")
    db = get_db()
    product = db.products.find_one({"_id": ObjectId(product_id)})
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    return serialize_product(product)


@router.post("")
def create_product(
    name: str = Form(...),
    price: float = Form(...),
    description: str = Form(...),
    collection: str = Form(...),
    image: UploadFile = File(...),
    model: UploadFile = File(...),
    user=Depends(get_current_user),
):
    require_admin(user)
    if len(name.strip()) < 3:
        raise HTTPException(status_code=400, detail="Product name must be at least 3 characters")
    if price <= 0:
        raise HTTPException(status_code=400, detail="Price must be greater than 0")

    # Save files with unique names
    image_ext = Path(image.filename).suffix or ".jpg"
    model_ext = Path(model.filename).suffix or ".glb"

    image_name = f"{uuid4().hex}{image_ext}"
    model_name = f"{uuid4().hex}{model_ext}"

    image_path = IMAGE_DIR / image_name
    model_path = MODEL_DIR / model_name

    with image_path.open("wb") as f:
        f.write(image.file.read())

    with model_path.open("wb") as f:
        f.write(model.file.read())

    image_url = f"{BASE_URL}/static/images/{image_name}"
    model_url = f"{BASE_URL}/static/models/{model_name}"

    doc = {
        "name": name,
        "price": price,
        "description": description,
        "collection": collection,
        "image_url": image_url,
        "model_url": model_url,
    }

    db = get_db()
    result = db.products.insert_one(doc)

    return {
        "id": str(result.inserted_id),
        **doc,
    }


@router.put("/{product_id}")
def update_product(
    product_id: str,
    name: str = Form(...),
    price: float = Form(...),
    description: str = Form(...),
    collection: str = Form(...),
    image: UploadFile | None = File(default=None),
    model: UploadFile | None = File(default=None),
    user=Depends(get_current_user),
):
    require_admin(user)
    if not ObjectId.is_valid(product_id):
        raise HTTPException(status_code=404, detail="Product not found")
    if len(name.strip()) < 3:
        raise HTTPException(status_code=400, detail="Product name must be at least 3 characters")
    if price <= 0:
        raise HTTPException(status_code=400, detail="Price must be greater than 0")
    db = get_db()
    update_doc = {
        "name": name,
        "price": price,
        "description": description,
        "collection": collection,
    }

    if image:
        image_ext = Path(image.filename).suffix or ".jpg"
        image_name = f"{uuid4().hex}{image_ext}"
        image_path = IMAGE_DIR / image_name
        with image_path.open("wb") as f:
            f.write(image.file.read())
        update_doc["image_url"] = f"{BASE_URL}/static/images/{image_name}"

    if model:
        model_ext = Path(model.filename).suffix or ".glb"
        model_name = f"{uuid4().hex}{model_ext}"
        model_path = MODEL_DIR / model_name
        with model_path.open("wb") as f:
            f.write(model.file.read())
        update_doc["model_url"] = f"{BASE_URL}/static/models/{model_name}"

    result = db.products.update_one({"_id": ObjectId(product_id)}, {"$set": update_doc})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Product not found")
    updated = db.products.find_one({"_id": ObjectId(product_id)})
    return serialize_product(updated)


@router.delete("/{product_id}")
def delete_product(product_id: str, user=Depends(get_current_user)):
    require_admin(user)
    if not ObjectId.is_valid(product_id):
        raise HTTPException(status_code=404, detail="Product not found")
    db = get_db()
    result = db.products.delete_one({"_id": ObjectId(product_id)})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Product not found")
    return {"message": "Deleted"}
