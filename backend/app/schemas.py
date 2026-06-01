# -*- coding: utf-8 -*-
from pydantic import BaseModel, EmailStr
from typing import Optional
from uuid import UUID
from datetime import datetime
from decimal import Decimal

class UserCreate(BaseModel):
    full_name: str
    email: str
    password: str

class UserLogin(BaseModel):
    email: str
    password: str

class UserResponse(BaseModel):
    id: UUID
    email: str
    full_name: str
    role: str
    is_active: bool
    class Config: from_attributes = True

class ProductCreate(BaseModel):
    name: str
    description: Optional[str] = None
    price: Decimal
    stock_quantity: int = 0
    category: Optional[str] = None
    image_url: Optional[str] = None

class ProductResponse(BaseModel):
    id: UUID
    name: str
    description: Optional[str]
    price: Decimal
    stock_quantity: int
    category: Optional[str]
    image_url: Optional[str]
    is_visible: bool
    discount_percent: float = 0
    final_price: Optional[Decimal] = None
    class Config: from_attributes = True

class DiscountCreate(BaseModel):
    name: str
    discount_type: str
    value: Decimal
    target_type: str
    target_id: Optional[str] = None
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None

class DiscountResponse(BaseModel):
    id: UUID
    name: str
    discount_type: str
    value: Decimal
    target_type: str
    target_id: Optional[str]
    is_active: bool
    class Config: from_attributes = True

class CartItemCreate(BaseModel):
    product_id: str
    quantity: int = 1

class CartItemResponse(BaseModel):
    id: UUID
    product_id: str
    product_name: str
    quantity: int
    unit_price: Decimal
    total: Decimal
    class Config: from_attributes = True

class OrderResponse(BaseModel):
    id: UUID
    status: str
    total_amount: Optional[Decimal]
    discount_amount: Decimal
    created_at: datetime
    items: list = []
    class Config: from_attributes = True

class TicketCreate(BaseModel):
    subject: str
    description: str
    priority: str = "normal"

class TicketResponse(BaseModel):
    id: UUID
    subject: str
    status: str
    priority: str
    created_at: datetime
    class Config: from_attributes = True

class MessageCreate(BaseModel):
    message: str

class Token(BaseModel):
    token: str
    user: UserResponse
