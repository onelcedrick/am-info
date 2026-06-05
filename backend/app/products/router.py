# -*- coding: utf-8 -*-
from fastapi import APIRouter, Depends, UploadFile, File, Form, HTTPException, Query
from sqlalchemy.orm import Session
from ..database import get_db
from ..models import Product
from ..config import settings
from ..cloudinary_config import upload_image
from . import service
from ..redis_client import cache
import os, uuid

router = APIRouter(tags=["products"])
admin_router = APIRouter(prefix="/admin/products", tags=["admin-products"])

UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

def handle_image_upload(image: UploadFile) -> str:
    """Upload une image et retourne l'URL"""
    if not image or not image.filename:
        return None
    
    ext = image.filename.split(".")[-1] if "." in image.filename else "jpg"
    filename = f"product_{uuid.uuid4().hex[:8]}.{ext}"
    filepath = os.path.join(UPLOAD_DIR, filename)
    
    content = image.file.read()
    with open(filepath, "wb") as f:
        f.write(content)
    
    # Essayer Cloudinary d'abord
    cloud_url = upload_image(filepath, "aminfo/products")
    if cloud_url:
        os.remove(filepath)  # Nettoyer le fichier local
        return cloud_url
    
    # Fallback local
    return f"{settings.BASE_URL}/uploads/{filename}"

@router.get("/products")
def list_products(page: int = Query(1, ge=1), limit: int = Query(12, ge=1, le=50), db: Session = Depends(get_db)):
    return service.get_visible_products_paginated(db, page, limit)

@router.get("/products/search")
def search_products(q: str = Query(""), db: Session = Depends(get_db)):
    if not q or len(q) < 2: return []
    products = db.query(Product).filter(Product.is_visible == True, Product.stock_quantity > 0, (Product.name.ilike(f'%{q}%')) | (Product.category.ilike(f'%{q}%'))).limit(5).all()
    return [{"id": p.id, "name": p.name, "price": float(p.price), "category": p.category, "image_url": p.image_url} for p in products]

@router.get("/products/{product_id}")
def get_product(product_id: str, db: Session = Depends(get_db)):
    products = service.get_visible_products(db)
    for p in products:
        if str(p["id"]) == product_id: return p
    return None

@router.get("/products/{product_id}/also-bought")
def also_bought(product_id: str, db: Session = Depends(get_db)):
    return service.get_also_bought(db, product_id)

@router.get("/products/new-arrivals")
def new_arrivals(db: Session = Depends(get_db)): return service.get_new_arrivals(db)

@router.get("/products/popular")
def popular_products(db: Session = Depends(get_db)): return service.get_popular_products(db)

@router.get("/compare")
def compare_products(ids: str = Query(""), db: Session = Depends(get_db)):
    from .comparison import comparator
    product_ids = [pid.strip() for pid in ids.split(",") if pid.strip()]
    if len(product_ids) < 2: return {"error": "Fournissez au moins 2 IDs"}
    return comparator.compare_products(db, product_ids)

@router.get("/search-all")
def search_all_products(q: str = Query(""), db: Session = Depends(get_db)):
    if not q or len(q) < 2: return []
    products = db.query(Product).filter((Product.name.ilike(f'%{q}%')) | (Product.category.ilike(f'%{q}%'))).limit(10).all()
    return [{"id": p.id, "name": p.name, "price": float(p.price), "category": p.category} for p in products]

@admin_router.get("/")
def admin_list_products(page: int = Query(1, ge=1), limit: int = Query(20, ge=1, le=100), db: Session = Depends(get_db)):
    return service.get_all_products_paginated(db, page, limit)

@admin_router.post("/")
async def admin_create_product(
    name: str = Form(...), price: float = Form(...), category: str = Form(""),
    description: str = Form(""), stock_quantity: int = Form(0),
    image: UploadFile = File(None), db: Session = Depends(get_db)
):
    image_url = handle_image_upload(image)
    result = service.create_product(db, {"name": name, "price": price, "category": category, "description": description, "stock_quantity": stock_quantity, "image_url": image_url})
    cache.delete("dashboard:admin_stats"); cache.clear_pattern("products:*")
    return result

@admin_router.put("/{product_id}")
def admin_update_product(product_id: str, data: dict, db: Session = Depends(get_db)):
    product = service.update_product(db, product_id, data)
    if not product: raise HTTPException(status_code=404)
    cache.delete("dashboard:admin_stats"); cache.clear_pattern("products:*")
    return product

@admin_router.patch("/{product_id}/visibility")
def admin_toggle_visibility(product_id: str, db: Session = Depends(get_db)):
    result = service.toggle_visibility(db, product_id)
    cache.clear_pattern("products:*"); return result

@admin_router.patch("/{product_id}/stock")
def admin_update_stock(product_id: str, quantity: int, db: Session = Depends(get_db)):
    result = service.update_stock(db, product_id, quantity)
    cache.clear_pattern("products:*"); cache.delete("dashboard:admin_stats"); return result

@admin_router.delete("/{product_id}")
def admin_delete_product(product_id: str, db: Session = Depends(get_db)):
    product = db.query(Product).filter(Product.id == product_id).first()
    name = product.name if product else "Inconnu"
    service.delete_product(db, product_id)
    cache.delete("dashboard:admin_stats"); cache.clear_pattern("products:*")
    return {"message": "Produit supprime"}
