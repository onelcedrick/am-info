# -*- coding: utf-8 -*-
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from ..database import get_db
from . import service

router = APIRouter(prefix="/admin/categories", tags=["admin-categories"])
public_router = APIRouter(prefix="/categories", tags=["categories"])

@router.get("/")
def list_categories(db: Session = Depends(get_db)):
    return service.get_all(db)

@router.post("/")
def create_category(data: dict, db: Session = Depends(get_db)):
    return service.create(db, data.get("name", ""))

@router.put("/{cat_id}")
def update_category(cat_id: str, data: dict, db: Session = Depends(get_db)):
    return service.update(db, cat_id, data.get("name", ""))

@router.delete("/{cat_id}")
def delete_category(cat_id: str, db: Session = Depends(get_db)):
    service.delete(db, cat_id)
    return {"message": "Supprimee"}

@public_router.get("/")
def public_categories(db: Session = Depends(get_db)):
    return service.get_all(db)
