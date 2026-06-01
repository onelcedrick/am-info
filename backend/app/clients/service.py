# -*- coding: utf-8 -*-
from sqlalchemy.orm import Session
from sqlalchemy import func
from ..models import User, Order

def get_clients_list(db: Session):
    clients = db.query(User).filter(User.role == 'client').all()
    result = []
    for client in clients:
        total_spent = db.query(func.sum(Order.total_amount)).filter(
            Order.user_id == client.id,
            Order.status.in_(['paid', 'delivered'])
        ).scalar() or 0
        total_orders = db.query(Order).filter(Order.user_id == client.id).count()
        result.append({
            "id": client.id, "full_name": client.full_name, "email": client.email,
            "total_spent": float(total_spent), "total_orders": total_orders,
            "created_at": client.created_at.isoformat() if client.created_at else None,
            "is_active": client.is_active
        })
    return sorted(result, key=lambda x: x['total_spent'], reverse=True)

def get_client_emails(db: Session):
    clients = db.query(User).filter(User.role == 'client', User.is_active == True).all()
    return [{"email": c.email, "name": c.full_name} for c in clients]
