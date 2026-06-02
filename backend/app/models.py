# -*- coding: utf-8 -*-
import uuid
from datetime import datetime, timezone, timedelta
from sqlalchemy import Column, String, Boolean, DateTime, Integer, Numeric, ForeignKey, Text
from sqlalchemy.orm import relationship
from .database import Base

# Fuseau horaire Madagascar (UTC+3)
MADAGASCAR_TZ = timezone(timedelta(hours=3))

def now_madagascar():
    return datetime.now(MADAGASCAR_TZ)

class User(Base):
    __tablename__ = "users"
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    email = Column(String(255), unique=True, nullable=False)
    password_hash = Column(String(255), nullable=True)
    full_name = Column(String(150), nullable=False)
    role = Column(String(20), nullable=False, default="client")
    google_id = Column(String(255), unique=True, nullable=True)
    avatar_url = Column(String(500), nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=now_madagascar)
    updated_at = Column(DateTime, default=now_madagascar, onupdate=now_madagascar)

class Product(Base):
    __tablename__ = "products"
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    price = Column(Numeric(12,2), nullable=False)
    stock_quantity = Column(Integer, default=0)
    image_url = Column(String(500), nullable=True)
    category = Column(String(100), nullable=True)
    is_visible = Column(Boolean, default=True)
    created_at = Column(DateTime, default=now_madagascar)
    updated_at = Column(DateTime, default=now_madagascar, onupdate=now_madagascar)

class Discount(Base):
    __tablename__ = "discounts"
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String(255), nullable=False)
    discount_type = Column(String(20), nullable=False)
    value = Column(Numeric(10,2), nullable=False)
    target_type = Column(String(20), nullable=False)
    target_id = Column(String, nullable=True)
    is_active = Column(Boolean, default=True)
    start_date = Column(DateTime, nullable=True)
    end_date = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=now_madagascar)

class Order(Base):
    __tablename__ = "orders"
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String, ForeignKey('users.id'), nullable=False)
    status = Column(String(30), default='pending')
    total_amount = Column(Numeric(12,2), nullable=True)
    discount_amount = Column(Numeric(12,2), default=0)
    created_at = Column(DateTime, default=now_madagascar)
    updated_at = Column(DateTime, default=now_madagascar, onupdate=now_madagascar)
    items = relationship("OrderItem", back_populates="order")

class OrderItem(Base):
    __tablename__ = "order_items"
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    order_id = Column(String, ForeignKey('orders.id', ondelete='CASCADE'), nullable=False)
    product_id = Column(String, ForeignKey('products.id'), nullable=False)
    quantity = Column(Integer, nullable=False)
    unit_price = Column(Numeric(12,2), nullable=False)
    discount_applied = Column(Numeric(12,2), default=0)
    product_name = Column(String(255), nullable=True)
    product_image = Column(String(500), nullable=True)
    order = relationship("Order", back_populates="items")

class CartItem(Base):
    __tablename__ = "cart_items"
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String, ForeignKey('users.id', ondelete='CASCADE'), nullable=False)
    product_id = Column(String, ForeignKey('products.id'), nullable=False)
    quantity = Column(Integer, default=1)
    added_at = Column(DateTime, default=now_madagascar)

class Ticket(Base):
    __tablename__ = "tickets"
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    client_id = Column(String, ForeignKey('users.id'), nullable=False)
    technician_id = Column(String, ForeignKey('users.id'), nullable=True)
    subject = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    status = Column(String(30), default='open')
    priority = Column(String(10), default='normal')
    created_at = Column(DateTime, default=now_madagascar)
    updated_at = Column(DateTime, default=now_madagascar, onupdate=now_madagascar)
    messages = relationship("TicketMessage", back_populates="ticket")

class TicketMessage(Base):
    __tablename__ = "ticket_messages"
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    ticket_id = Column(String, ForeignKey('tickets.id', ondelete='CASCADE'), nullable=False)
    sender_id = Column(String, ForeignKey('users.id'), nullable=False)
    message = Column(Text, nullable=False)
    is_from_bot = Column(Boolean, default=False)
    attachment_url = Column(String(500), nullable=True)
    created_at = Column(DateTime, default=now_madagascar)
    ticket = relationship("Ticket", back_populates="messages")

class Invoice(Base):
    __tablename__ = "invoices"
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    order_id = Column(String, ForeignKey('orders.id'), unique=True, nullable=False)
    pdf_url = Column(String(500), nullable=True)
    sent_to_email = Column(String(255), nullable=True)
    created_at = Column(DateTime, default=now_madagascar)

class Category(Base):
    __tablename__ = "categories"
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String(100), unique=True, nullable=False)
    created_at = Column(DateTime, default=now_madagascar)

class Rating(Base):
    __tablename__ = "ratings"
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    ticket_id = Column(String, ForeignKey('tickets.id'), nullable=False)
    client_id = Column(String, ForeignKey('users.id'), nullable=False)
    technician_id = Column(String, ForeignKey('users.id'), nullable=True)
    score = Column(Integer, nullable=False)
    comment = Column(Text, nullable=True)
    created_at = Column(DateTime, default=now_madagascar)

class Wishlist(Base):
    __tablename__ = "wishlists"
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String, ForeignKey('users.id', ondelete='CASCADE'), nullable=False)
    product_id = Column(String, ForeignKey('products.id', ondelete='CASCADE'), nullable=False)
    created_at = Column(DateTime, default=now_madagascar)
