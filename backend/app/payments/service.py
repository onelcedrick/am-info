# -*- coding: utf-8 -*-
from sqlalchemy.orm import Session
from ..models import Order, User
from .strategies import PaymentStrategyFactory

def process_payment(db: Session, order_id: str, method: str, phone: str):
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        return None, "Commande introuvable"
    if order.status not in ["awaiting_payment", "pending"]:
        return None, "Cette commande ne peut pas etre payee"
    
    # Utiliser le Strategy Pattern
    strategy = PaymentStrategyFactory.get_strategy(method)
    reference = strategy.generate_reference(order_id)
    
    # Verifier automatiquement le paiement
    verification = strategy.verify_payment(reference, float(order.total_amount or 0), phone)
    
    if verification["verified"]:
        order.status = "paid"
        db.commit()
    
    return {
        "success": verification["verified"],
        "transaction_id": verification.get("transaction_id", reference),
        "reference": reference,
        "method": strategy.get_method_name(),
        "amount": float(order.total_amount or 0),
        "phone": phone,
        "message": verification["message"],
        "auto_verified": True
    }, None

def get_payment_methods():
    return [
        {"id": "mvola", "name": "MVola", "icon": "📱", "color": "bg-yellow-500", "prefix": "034"},
        {"id": "orange_money", "name": "Orange Money", "icon": "🟠", "color": "bg-orange-500", "prefix": "032"},
        {"id": "airtel_money", "name": "Airtel Money", "icon": "🔴", "color": "bg-red-500", "prefix": "033"}
    ]

def get_transactions(db: Session, status: str = None):
    query = db.query(Order).filter(
        Order.status.in_(['awaiting_payment', 'paid', 'preparing', 'ready', 'delivered'])
    )
    if status:
        query = query.filter(Order.status == status)
    orders = query.order_by(Order.created_at.desc()).all()
    
    result = []
    for order in orders:
        client = db.query(User).filter(User.id == order.user_id).first()
        result.append({
            "transaction_ref": f"TXN-{order.id[:8].upper()}",
            "order_ref": f"CMD-{order.id[:8].upper()}",
            "order_id": order.id,
            "client_name": client.full_name if client else "Inconnu",
            "client_email": client.email if client else "",
            "amount": float(order.total_amount or 0),
            "status": order.status,
            "date": order.created_at.isoformat() if order.created_at else None,
        })
    return result

def verify_transaction(db: Session, order_id: str):
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        return None, "Commande introuvable"
    if order.status == "awaiting_payment":
        order.status = "paid"
        db.commit()
        return {"verified": True, "status": "paid", "message": "Transaction verifiee et paiement confirme"}, None
    return {"verified": True, "status": order.status, "message": f"Statut: {order.status}"}, None

def get_transaction_stats(db: Session):
    total_paid = db.query(Order).filter(Order.status.in_(['paid', 'preparing', 'ready', 'delivered'])).count()
    total_pending = db.query(Order).filter(Order.status == 'awaiting_payment').count()
    paid_orders = db.query(Order).filter(Order.status.in_(['paid', 'preparing', 'ready', 'delivered'])).all()
    total_revenue = sum(float(o.total_amount or 0) for o in paid_orders)
    pending_orders = db.query(Order).filter(Order.status == 'awaiting_payment').all()
    total_pending_amount = sum(float(o.total_amount or 0) for o in pending_orders)
    
    return {
        "total_transactions": total_paid + total_pending,
        "total_paid": total_paid,
        "total_pending": total_pending,
        "total_revenue": total_revenue,
        "total_pending_amount": total_pending_amount
    }
