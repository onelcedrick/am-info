# -*- coding: utf-8 -*-
from sqlalchemy.orm import Session
from ..models import Wishlist, Product

def get_wishlist(db: Session, user_id: str):
    items = db.query(Wishlist).filter(Wishlist.user_id == user_id).all()
    result = []
    for item in items:
        product = db.query(Product).filter(Product.id == item.product_id).first()
        if product:
            result.append({
                "id": product.id, "name": product.name,
                "price": float(product.price), "category": product.category,
                "image_url": product.image_url
            })
    return result

def toggle_wishlist(db: Session, user_id: str, product_id: str):
    existing = db.query(Wishlist).filter(
        Wishlist.user_id == user_id, Wishlist.product_id == product_id
    ).first()
    if existing:
        db.delete(existing); db.commit()
        return {"added": False}
    item = Wishlist(user_id=user_id, product_id=product_id)
    db.add(item); db.commit()
    return {"added": True}

def get_wishlist_ids(db: Session, user_id: str):
    items = db.query(Wishlist).filter(Wishlist.user_id == user_id).all()
    return [item.product_id for item in items]
