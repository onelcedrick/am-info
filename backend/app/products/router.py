# -*- coding: utf-8 -*-
from fastapi import APIRouter, Depends, UploadFile, File, Form
from sqlalchemy.orm import Session
from ..database import get_db
from . import service
import os
import uuid

router = APIRouter(tags=["products"])
admin_router = APIRouter(prefix="/admin/products", tags=["admin-products"])

UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

@router.get("/products")
def list_products(db: Session = Depends(get_db)):
    return service.get_visible_products(db)

@router.get("/products/{product_id}")
def get_product(product_id: str, db: Session = Depends(get_db)):
    products = service.get_visible_products(db)
    for p in products:
        if str(p["id"]) == product_id:
            return p
    return None

@admin_router.get("/")
def admin_list_products(db: Session = Depends(get_db)):
    return service.get_all_products(db)

@admin_router.post("/")
async def admin_create_product(
    name: str = Form(...),
    price: float = Form(...),
    category: str = Form(""),
    description: str = Form(""),
    stock_quantity: int = Form(0),
    image: UploadFile = File(None),
    db: Session = Depends(get_db)
):
    image_url = None
    
    if image and image.filename:
        ext = image.filename.split(".")[-1] if "." in image.filename else "jpg"
        filename = f"product_{uuid.uuid4().hex[:8]}.{ext}"
        filepath = os.path.join(UPLOAD_DIR, filename)
        content = await image.read()
        with open(filepath, "wb") as f:
            f.write(content)
        image_url = f"http://localhost:8000/uploads/{filename}"
    
    data = {
        "name": name,
        "price": price,
        "category": category,
        "description": description,
        "stock_quantity": stock_quantity,
        "image_url": image_url
    }
    return service.create_product(db, data)

@admin_router.patch("/{product_id}/visibility")
def admin_toggle_visibility(product_id: str, db: Session = Depends(get_db)):
    return service.toggle_visibility(db, product_id)
