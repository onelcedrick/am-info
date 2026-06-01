# -*- coding: utf-8 -*-
from sqlalchemy.orm import Session
from ..models import Discount
from datetime import datetime

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
