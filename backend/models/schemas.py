from typing import List
from pydantic import BaseModel, EmailStr


class SignupRequest(BaseModel):
    name: str
    email: EmailStr
    password: str


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class ProductCreate(BaseModel):
    name: str
    price: float
    description: str


class ProductResponse(BaseModel):
    id: str
    name: str
    price: float
    description: str
    image_url: str
    model_url: str


class OrderItem(BaseModel):
    product_id: str
    name: str
    price: float
    quantity: int


class OrderCreate(BaseModel):
    items: List[OrderItem]
    total_price: float
    customer_name: str
    address: str
    phone: str
    pincode: str
    country: str
    state: str
    landmark: str


class OrderResponse(BaseModel):
    id: str
    user_id: str
    items: List[OrderItem]
    total_price: float
    customer_name: str
    address: str
    phone: str
    pincode: str
    country: str
    state: str
    landmark: str
    created_at: str
