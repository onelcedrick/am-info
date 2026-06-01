# -*- coding: utf-8 -*-
from sqlalchemy.orm import Session
from ..models import Order, OrderItem, CartItem, Product

def create_order(db: Session, user_id: str):
    cart_items = db.query(CartItem).filter(CartItem.user_id == user_id).all()
    if not cart_items:
        return None, "Panier vide"
    
    for cart_item in cart_items:
        product = db.query(Product).filter(Product.id == cart_item.product_id).first()
        if not product or product.stock_quantity < cart_item.quantity:
            return None, f"Stock insuffisant pour {product.name if product else 'produit'}"
    
    total = 0
    order = Order(user_id=user_id, status="awaiting_payment")
    db.add(order)
    db.flush()
    
    for cart_item in cart_items:
        product = db.query(Product).filter(Product.id == cart_item.product_id).first()
        if product:
            price = float(product.price)
            line_total = price * cart_item.quantity
            total += line_total
            
            order_item = OrderItem(
                order_id=order.id, product_id=product.id,
                quantity=cart_item.quantity, unit_price=price,
                product_name=product.name, product_image=product.image_url,
                discount_applied=0
            )
            db.add(order_item)
            product.stock_quantity -= cart_item.quantity
    
    order.total_amount = total
    db.commit()
    db.refresh(order)
    
    db.query(CartItem).filter(CartItem.user_id == user_id).delete()
    db.commit()
    
    return order, None

def cancel_order(db: Session, order_id: str, user_id: str):
    order = db.query(Order).filter(Order.id == order_id, Order.user_id == user_id).first()
    if not order:
        return False, "Commande introuvable"
    
    if order.status not in ["pending", "awaiting_payment"]:
        return False, "Seules les commandes en attente peuvent etre annulees"
    
    # Restaurer le stock
    items = db.query(OrderItem).filter(OrderItem.order_id == order_id).all()
    for item in items:
        product = db.query(Product).filter(Product.id == item.product_id).first()
        if product:
            product.stock_quantity += item.quantity
    
    order.status = "cancelled"
    db.commit()
    return True, None

def get_user_orders(db: Session, user_id: str):
    orders = db.query(Order).filter(Order.user_id == user_id).order_by(Order.created_at.desc()).all()
    for order in orders:
        order.items = db.query(OrderItem).filter(OrderItem.order_id == order.id).all()
    return orders

def get_order_detail(db: Session, order_id: str):
    order = db.query(Order).filter(Order.id == order_id).first()
    if order:
        order.items = db.query(OrderItem).filter(OrderItem.order_id == order_id).all()
    return order

def get_all_orders(db: Session):
    return db.query(Order).order_by(Order.created_at.desc()).all()

def update_order_status(db: Session, order_id: str, status: str):
    order = db.query(Order).filter(Order.id == order_id).first()
    if order:
        order.status = status
        db.commit()
    return order
