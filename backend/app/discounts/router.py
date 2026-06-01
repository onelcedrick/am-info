# -*- coding: utf-8 -*-
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from ..database import get_db
from ..schemas import DiscountCreate
from . import service
from ..redis_client import cache

router = APIRouter(prefix="/admin/discounts", tags=["admin-discounts"])

@router.get("/")
def list_discounts(db: Session = Depends(get_db)):
    return service.get_all_discounts(db)

@router.post("/")
def create_discount(data: DiscountCreate, db: Session = Depends(get_db)):
    result = service.create_discount(db, data.model_dump())
    cache.clear_pattern("products:*")
    return result

@router.patch("/{discount_id}/toggle")
def toggle_discount(discount_id: str, db: Session = Depends(get_db)):
    result = service.toggle_discount(db, discount_id)
    cache.clear_pattern("products:*")
    return result

@router.delete("/{discount_id}")
def delete_discount(discount_id: str, db: Session = Depends(get_db)):
    service.delete_discount(db, discount_id)
    cache.clear_pattern("products:*")
    return {"message": "Supprime"}
