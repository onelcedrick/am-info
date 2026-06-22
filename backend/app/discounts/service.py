# -*- coding: utf-8 -*-
from sqlalchemy.orm import Session
from ..models import Discount
from datetime import datetime, timezone, timedelta

MADAGASCAR_TZ = timezone(timedelta(hours=3))

def get_active_discounts(db: Session):
    now = datetime.utcnow()
    return db.query(Discount).filter(
        Discount.is_active == True,
        (Discount.start_date == None) | (Discount.start_date <= now),
        (Discount.end_date == None) | (Discount.end_date >= now)
    ).all()

def get_all_discounts(db: Session):
    return db.query(Discount).order_by(Discount.created_at.desc()).all()

def create_discount(db: Session, data: dict) -> Discount:
    discount = Discount(**data)
    db.add(discount)
    db.commit()
    db.refresh(discount)
    return discount

def toggle_discount(db: Session, discount_id: str) -> Discount:
    discount = db.query(Discount).filter(Discount.id == discount_id).first()
    if discount:
        discount.is_active = not discount.is_active
        db.commit()
    return discount

def delete_discount(db: Session, discount_id: str):
    db.query(Discount).filter(Discount.id == discount_id).delete()
    db.commit()


def calculate_product_discount(product, db: Session):
    """
    Calcule la meilleure reduction applicable a un produit.
    Retourne un dict avec : final_price, original_price, discount_percent,
    discount_amount, discount_name, has_discount
    """
    from ..models import Discount
    now = datetime.now(MADAGASCAR_TZ)
    original_price = float(product.price)
    
    discounts = db.query(Discount).filter(
        Discount.is_active == True,
        (Discount.start_date == None) | (Discount.start_date <= now),
        (Discount.end_date == None) | (Discount.end_date >= now)
    ).all()
    
    best_price = original_price
    best_discount = None
    
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
                new_price = original_price * (1 - float(d.value) / 100)
            else:  # fixed_amount
                new_price = max(0, original_price - float(d.value))
            
            if new_price < best_price:
                best_price = new_price
                best_discount = d
    
    discount_amount = original_price - best_price
    discount_percent = 0
    if best_discount and best_discount.discount_type == "percentage":
        discount_percent = float(best_discount.value)
    elif best_discount and best_discount.discount_type == "fixed_amount" and original_price > 0:
        discount_percent = round((discount_amount / original_price) * 100, 1)
    
    return {
        "original_price": original_price,
        "final_price": round(best_price, 2),
        "discount_amount": round(discount_amount, 2),
        "discount_percent": discount_percent,
        "discount_name": best_discount.name if best_discount else None,
        "has_discount": best_discount is not None
    }