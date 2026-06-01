# -*- coding: utf-8 -*-
from sqlalchemy.orm import Session
from ..models import Category

def get_all(db: Session):
    return db.query(Category).order_by(Category.name).all()

def create(db: Session, name: str):
    existing = db.query(Category).filter(Category.name == name).first()
    if existing:
        return existing
    cat = Category(name=name)
    db.add(cat)
    db.commit()
    db.refresh(cat)
    return cat

def update(db: Session, cat_id: str, name: str):
    cat = db.query(Category).filter(Category.id == cat_id).first()
    if cat:
        cat.name = name
        db.commit()
    return cat

def delete(db: Session, cat_id: str):
    db.query(Category).filter(Category.id == cat_id).delete()
    db.commit()
