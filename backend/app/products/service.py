# -*- coding: utf-8 -*-
from sqlalchemy.orm import Session
from ..models import Product, Discount
from datetime import datetime

def get_visible_products(db: Session):
    products = db.query(Product).filter(Product.is_visible == True).all()
    return [_apply_best_discount(p, db) for p in products]

def _apply_best_discount(product: Product, db: Session) -> dict:
    now = datetime.utcnow()
    discounts = db.query(Discount).filter(
        Discount.is_active == True,
        (Discount.start_date == None) | (Discount.start_date <= now),
        (Discount.end_date == None) | (Discount.end_date >= now)
    ).all()
    
    best_discount = None
    best_price = float(product.price)
    
    for d in discounts:
        applicable = False
        if d.target_type == "global":
            applicable = True
        elif d.target_type == "product" and str(d.target_id) == str(product.id):
            applicable = True
        elif d.target_type == "category" and d.target_id == product.category:
            applicable = True
        
        if applicable:
            if d.discount_type == "percentage":
                new_price = float(product.price) * (1 - float(d.value) / 100)
            else:
                new_price = max(0, float(product.price) - float(d.value))
            
            if new_price < best_price:
                best_price = new_price
                best_discount = d
    
    return {
        "id": product.id, "name": product.name, "description": product.description,
        "price": float(product.price), "stock_quantity": product.stock_quantity,
        "category": product.category, "image_url": product.image_url,
        "is_visible": product.is_visible,
        "discount_percent": float(best_discount.value) if best_discount and best_discount.discount_type == "percentage" else 0,
        "final_price": best_price
    }

def get_all_products(db: Session):
    return db.query(Product).all()

def create_product(db: Session, data: dict) -> Product:
    product = Product(**data)
    db.add(product)
    db.commit()
    db.refresh(product)
    return product

def toggle_visibility(db: Session, product_id: str) -> Product:
    product = db.query(Product).filter(Product.id == product_id).first()
    if product:
        product.is_visible = not product.is_visible
        db.commit()
    return product
