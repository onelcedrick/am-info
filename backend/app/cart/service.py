# -*- coding: utf-8 -*-
from sqlalchemy.orm import Session
from ..models import CartItem, Product

def get_cart(db: Session, user_id: str):
    items = db.query(CartItem).filter(CartItem.user_id == user_id).all()
    result = []
    for item in items:
        product = db.query(Product).filter(Product.id == item.product_id).first()
        if product:
            result.append({
                "id": item.id,
                "product_id": item.product_id,
                "product_name": product.name,
                "quantity": item.quantity,
                "unit_price": float(product.price),
                "total": float(product.price) * item.quantity,
                "image_url": product.image_url
            })
    return result

def add_to_cart(db: Session, user_id: str, product_id: str, quantity: int = 1):
    existing = db.query(CartItem).filter(
        CartItem.user_id == user_id,
        CartItem.product_id == product_id
    ).first()
    if existing:
        existing.quantity += quantity
        db.commit()
        return existing
    item = CartItem(user_id=user_id, product_id=product_id, quantity=quantity)
    db.add(item)
    db.commit()
    return item

def update_quantity(db: Session, item_id: str, quantity: int):
    item = db.query(CartItem).filter(CartItem.id == item_id).first()
    if item:
        item.quantity = max(1, quantity)
        db.commit()
    return item

def remove_from_cart(db: Session, item_id: str):
    item = db.query(CartItem).filter(CartItem.id == item_id).first()
    if item:
        db.delete(item)
        db.commit()
