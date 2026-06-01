# -*- coding: utf-8 -*-
from fastapi import APIRouter, Depends, UploadFile, File, Form, HTTPException
from sqlalchemy.orm import Session
from ..database import get_db
from . import service
from ..redis_client import cache
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

@router.get("/products/new-arrivals")
def new_arrivals(db: Session = Depends(get_db)):
    return service.get_new_arrivals(db)

@router.get("/products/popular")
def popular_products(db: Session = Depends(get_db)):
    return service.get_popular_products(db)

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
        "name": name, "price": price, "category": category,
        "description": description, "stock_quantity": stock_quantity,
        "image_url": image_url
    }
    result = service.create_product(db, data)
    
    # Invalider les caches
    cache.delete("dashboard:admin_stats")
    cache.clear_pattern("products:*")
    
    return result

@admin_router.put("/{product_id}")
def admin_update_product(product_id: str, data: dict, db: Session = Depends(get_db)):
    product = service.update_product(db, product_id, data)
    if not product:
        raise HTTPException(status_code=404)
    
    cache.delete("dashboard:admin_stats")
    cache.clear_pattern("products:*")
    
    return product

@admin_router.patch("/{product_id}/visibility")
def admin_toggle_visibility(product_id: str, db: Session = Depends(get_db)):
    result = service.toggle_visibility(db, product_id)
    cache.clear_pattern("products:*")
    return result

@admin_router.patch("/{product_id}/stock")
def admin_update_stock(product_id: str, quantity: int, db: Session = Depends(get_db)):
    result = service.update_stock(db, product_id, quantity)
    cache.clear_pattern("products:*")
    cache.delete("dashboard:admin_stats")
    return result

@admin_router.delete("/{product_id}")
def admin_delete_product(product_id: str, db: Session = Depends(get_db)):
    service.delete_product(db, product_id)
    cache.delete("dashboard:admin_stats")
    cache.clear_pattern("products:*")
    return {"message": "Produit supprime"}
