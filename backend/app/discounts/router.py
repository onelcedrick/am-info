# -*- coding: utf-8 -*-
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from ..database import get_db
from ..schemas import DiscountCreate
from . import service

router = APIRouter(prefix="/admin/discounts", tags=["admin-discounts"])

@router.get("/")
def list_discounts(db: Session = Depends(get_db)):
    return service.get_all_discounts(db)

@router.post("/")
def create_discount(data: DiscountCreate, db: Session = Depends(get_db)):
    return service.create_discount(db, data.model_dump())

@router.patch("/{discount_id}/toggle")
def toggle_discount(discount_id: str, db: Session = Depends(get_db)):
    return service.toggle_discount(db, discount_id)

@router.delete("/{discount_id}")
def delete_discount(discount_id: str, db: Session = Depends(get_db)):
    service.delete_discount(db, discount_id)
    return {"message": "Supprime"}
