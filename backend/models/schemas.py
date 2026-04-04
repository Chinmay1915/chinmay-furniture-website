from typing import Dict, List, Optional
from pydantic import BaseModel, EmailStr


class SignupRequest(BaseModel):
    name: str
    email: EmailStr
    password: str
    otp: str


class LoginRequest(BaseModel):
    email: EmailStr
    password: str
    otp: str


class OTPRequest(BaseModel):
    email: EmailStr
    purpose: str  # signup | login
    password: Optional[str] = None


class GoogleAuthRequest(BaseModel):
    credential: str


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
    payment_id: Optional[str] = None
    payment_order_id: Optional[str] = None
    payment_signature: Optional[str] = None


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
    payment_id: Optional[str] = None
    payment_order_id: Optional[str] = None
    payment_signature: Optional[str] = None
    created_at: str


class RazorpayCreateOrderRequest(BaseModel):
    amount: int  # in paise
    currency: str = "INR"
    receipt: str
    notes: Optional[Dict[str, str]] = None


class RazorpayVerifyRequest(BaseModel):
    razorpay_order_id: str
    razorpay_payment_id: str
    razorpay_signature: str
