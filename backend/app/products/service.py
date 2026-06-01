# -*- coding: utf-8 -*-
from sqlalchemy.orm import Session
from sqlalchemy import func
from ..models import Product, Discount, OrderItem, Order
from ..redis_client import cache
from datetime import datetime, timezone, timedelta

MADAGASCAR_TZ = timezone(timedelta(hours=3))

def get_visible_products(db: Session):
    # Essayer le cache d'abord
    cached = cache.get("products:visible")
    if cached:
        return cached
    
    products = db.query(Product).filter(
        Product.is_visible == True,
        Product.stock_quantity > 0
    ).all()
    result = [_apply_best_discount(p, db) for p in products]
    
    # Mettre en cache pour 5 minutes
    cache.set("products:visible", result, ttl=300)
    return result

def invalidate_product_cache():
    cache.clear_pattern("products:*")

def get_new_arrivals(db: Session):
    cached = cache.get("products:new_arrivals")
    if cached:
        return cached
    
    limit_date = datetime.now(MADAGASCAR_TZ) - timedelta(days=14)
    products = db.query(Product).filter(
        Product.is_visible == True,
        Product.stock_quantity > 0,
        Product.created_at >= limit_date
    ).order_by(Product.created_at.desc()).limit(8).all()
    
    result = [_apply_best_discount(p, db) for p in products]
    cache.set("products:new_arrivals", result, ttl=300)
    return result

def get_popular_products(db: Session):
    cached = cache.get("products:popular")
    if cached:
        return cached
    
    popular = db.query(
        Product, func.count(OrderItem.id).label('total_orders'),
        func.sum(OrderItem.quantity).label('total_quantity')
    ).join(OrderItem, Product.id == OrderItem.product_id).join(
        Order, OrderItem.order_id == Order.id
    ).filter(
        Product.is_visible == True,
        Product.stock_quantity > 0,
        Order.status.in_(['paid', 'delivered', 'ready'])
    ).group_by(Product.id).order_by(func.sum(OrderItem.quantity).desc()).limit(8).all()
    
    result = []
    for product, orders, qty in popular:
        p = _apply_best_discount(product, db)
        p['total_ordered'] = qty
        p['order_count'] = orders
        result.append(p)
    
    if len(result) < 4:
        existing_ids = [p['id'] for p in result]
        more = db.query(Product).filter(
            Product.is_visible == True, Product.stock_quantity > 0, ~Product.id.in_(existing_ids)
        ).order_by(Product.created_at.desc()).limit(8 - len(result)).all()
        for p in more:
            result.append(_apply_best_discount(p, db))
    
    cache.set("products:popular", result, ttl=600)
    return result

def _apply_best_discount(product: Product, db: Session) -> dict:
    now = datetime.now(MADAGASCAR_TZ)
    discounts = db.query(Discount).filter(
        Discount.is_active == True,
        (Discount.start_date == None) | (Discount.start_date <= now),
        (Discount.end_date == None) | (Discount.end_date >= now)
    ).all()
    
    best_price = float(product.price)
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
                new_price = float(product.price) * (1 - float(d.value) / 100)
            else:
                new_price = max(0, float(product.price) - float(d.value))
            if new_price < best_price:
                best_price = new_price
                best_discount = d
    
    return {
        "id": product.id, "name": product.name, "description": product.description,
        "price": float(product.price), "stock_quantity": product.stock_quantity,
        "category": product.category, "image_url": product.image_url,
        "is_visible": product.is_visible,
        "discount_percent": float(best_discount.value) if best_discount and best_discount.discount_type == "percentage" else 0,
        "final_price": best_price
    }

def get_all_products(db: Session):
    return db.query(Product).order_by(Product.created_at.desc()).all()

def create_product(db: Session, data: dict) -> Product:
    product = Product(**data)
    db.add(product)
    db.commit()
    db.refresh(product)
    invalidate_product_cache()
    return product

def update_product(db: Session, product_id: str, data: dict):
    product = db.query(Product).filter(Product.id == product_id).first()
    if product:
        for key, value in data.items():
            if hasattr(product, key) and value is not None:
                setattr(product, key, value)
        db.commit()
        db.refresh(product)
        invalidate_product_cache()
    return product

def delete_product(db: Session, product_id: str):
    product = db.query(Product).filter(Product.id == product_id).first()
    if product:
        db.delete(product)
        db.commit()
        invalidate_product_cache()

def toggle_visibility(db: Session, product_id: str) -> Product:
    product = db.query(Product).filter(Product.id == product_id).first()
    if product:
        product.is_visible = not product.is_visible
        db.commit()
        invalidate_product_cache()
    return product

def update_stock(db: Session, product_id: str, quantity: int):
    product = db.query(Product).filter(Product.id == product_id).first()
    if product:
        product.stock_quantity = quantity
        db.commit()
        invalidate_product_cache()
    return product
