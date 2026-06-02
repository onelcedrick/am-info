# -*- coding: utf-8 -*-
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from ..database import get_db
from . import service
from ..logs.service import log_activity

router = APIRouter(prefix="/admin/categories", tags=["admin-categories"])
public_router = APIRouter(prefix="/categories", tags=["categories"])

@router.get("/") 
def list_categories(db: Session = Depends(get_db)): return service.get_all(db)

@router.post("/")
def create_category(data: dict, db: Session = Depends(get_db)):
    result = service.create(db, data.get("name", ""))
    log_activity(db, "admin", "create", "category", str(result.id), f"Categorie: {data.get('name')}")
    return result

@router.put("/{cat_id}")
def update_category(cat_id: str, data: dict, db: Session = Depends(get_db)):
    result = service.update(db, cat_id, data.get("name", ""))
    log_activity(db, "admin", "update", "category", cat_id, f"Renommage: {data.get('name')}")
    return result

@router.delete("/{cat_id}")
def delete_category(cat_id: str, db: Session = Depends(get_db)):
    service.delete(db, cat_id)
    log_activity(db, "admin", "delete", "category", cat_id, "Categorie supprimee")
    return {"message": "Supprimee"}

@public_router.get("/")
def public_categories(db: Session = Depends(get_db)): return service.get_all(db)
