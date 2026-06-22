# -*- coding: utf-8 -*-
from sqlalchemy.orm import Session
from ..models import CartItem, Product
from ..discounts.service import calculate_product_discount

def get_cart(db: Session, user_id: str):
    items = db.query(CartItem).filter(CartItem.user_id == user_id).all()
    result = []
    for item in items:
        product = db.query(Product).filter(Product.id == item.product_id).first()
        if product:
            discount_info = calculate_product_discount(product, db)
            unit_price = discount_info["final_price"]
            total = unit_price * item.quantity
            
            result.append({
                "id": item.id,
                "product_id": item.product_id,
                "product_name": product.name,
                "quantity": item.quantity,
                "unit_price": unit_price,
                "original_price": discount_info["original_price"],
                "total": round(total, 2),
                "discount_percent": discount_info["discount_percent"],
                "discount_amount": round(discount_info["discount_amount"] * item.quantity, 2),
                "discount_name": discount_info["discount_name"],
                "has_discount": discount_info["has_discount"],
                "image_url": product.image_url,
                "stock": product.stock_quantity
            })
    return result

def add_to_cart(db: Session, user_id: str, product_id: str, quantity: int = 1):
    # Verifier le stock
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        return None, "Produit introuvable"
    
    existing = db.query(CartItem).filter(
        CartItem.user_id == user_id,
        CartItem.product_id == product_id
    ).first()
    
    current_qty = existing.quantity if existing else 0
    total_qty = current_qty + quantity
    
    if total_qty > product.stock_quantity:
        return None, f"Stock insuffisant. Disponible: {product.stock_quantity}, Deja dans panier: {current_qty}"
    
    if existing:
        existing.quantity = total_qty
        db.commit()
        return existing, None
    
    item = CartItem(user_id=user_id, product_id=product_id, quantity=quantity)
    db.add(item)
    db.commit()
    return item, None

def update_quantity(db: Session, item_id: str, quantity: int):
    item = db.query(CartItem).filter(CartItem.id == item_id).first()
    if item:
        product = db.query(Product).filter(Product.id == item.product_id).first()
        if product and quantity <= product.stock_quantity:
            item.quantity = max(1, quantity)
            db.commit()
        else:
            return None, f"Stock insuffisant. Maximum: {product.stock_quantity if product else 0}"
    return item, None

def remove_from_cart(db: Session, item_id: str):
    item = db.query(CartItem).filter(CartItem.id == item_id).first()
    if item:
        db.delete(item)
        db.commit()