# -*- coding: utf-8 -*-
from sqlalchemy.orm import Session
from ..models import Order, OrderItem, CartItem, Product

def create_order(db: Session, user_id: str):
    cart_items = db.query(CartItem).filter(CartItem.user_id == user_id).all()
    if not cart_items:
        return None
    total = 0
    order = Order(user_id=user_id, status="awaiting_payment")
    db.add(order)
    db.flush()
    for cart_item in cart_items:
        product = db.query(Product).filter(Product.id == cart_item.product_id).first()
        if product:
            price = float(product.price)
            total += price * cart_item.quantity
            db.add(OrderItem(
                order_id=order.id, product_id=product.id,
                quantity=cart_item.quantity, unit_price=price,
                product_name=product.name, product_image=product.image_url
            ))
    order.total_amount = total
    db.query(CartItem).filter(CartItem.user_id == user_id).delete()
    db.commit()
    return order

def get_user_orders(db: Session, user_id: str):
    return db.query(Order).filter(Order.user_id == user_id).order_by(Order.created_at.desc()).all()

def get_all_orders(db: Session):
    return db.query(Order).order_by(Order.created_at.desc()).all()

def update_order_status(db: Session, order_id: str, status: str):
    order = db.query(Order).filter(Order.id == order_id).first()
    if order:
        order.status = status
        db.commit()
    return order
