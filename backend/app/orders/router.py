# -*- coding: utf-8 -*-
from fastapi import APIRouter, Depends, HTTPException, Header
from sqlalchemy.orm import Session
from ..database import get_db
from ..models import User
from . import service as order_service
from ..emails import service as email_service
from ..auth.service import decode_token
from ..redis_client import cache

router = APIRouter(prefix="/orders", tags=["orders"])
admin_router = APIRouter(prefix="/admin/orders", tags=["admin-orders"])

def get_current_user(authorization: str = Header(None)):
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Non authentifie")
    payload = decode_token(authorization.split(" ")[1])
    if not payload:
        raise HTTPException(status_code=401, detail="Token invalide")
    return payload

@router.post("")
def create_order(payload: dict = Depends(get_current_user), db: Session = Depends(get_db)):
    order, error = order_service.create_order(db, payload.get("sub"))
    if error:
        raise HTTPException(status_code=400, detail=error)
    
    user = db.query(User).filter(User.id == payload.get("sub")).first()
    if user:
        items = [{"name": item.product_name, "quantity": item.quantity, "total": float(item.unit_price) * item.quantity} for item in order.items]
        email_service.send_order_confirmation(user.email, str(order.id), float(order.total_amount), items)
    
    # Invalider le cache dashboard
    cache.delete("dashboard:admin_stats")
    cache.delete("products:popular")
    
    return {"message": "Commande creee", "order_id": order.id}

@router.get("")
def my_orders(payload: dict = Depends(get_current_user), db: Session = Depends(get_db)):
    return order_service.get_user_orders(db, payload.get("sub"))

@router.get("/{order_id}")
def order_detail(order_id: str, db: Session = Depends(get_db)):
    order = order_service.get_order_detail(db, order_id)
    if not order:
        raise HTTPException(status_code=404)
    return order

@router.delete("/{order_id}")
def cancel_order(order_id: str, payload: dict = Depends(get_current_user), db: Session = Depends(get_db)):
    success, error = order_service.cancel_order(db, order_id, payload.get("sub"))
    if error:
        raise HTTPException(status_code=400, detail=error)
    
    # Invalider le cache dashboard
    cache.delete("dashboard:admin_stats")
    cache.delete("products:popular")
    
    return {"message": "Commande annulee"}

@admin_router.get("")
def all_orders(db: Session = Depends(get_db)):
    return order_service.get_all_orders(db)

@admin_router.put("/{order_id}/status")
def change_status(order_id: str, status: str, db: Session = Depends(get_db)):
    result = order_service.update_order_status(db, order_id, status)
    
    # Invalider le cache dashboard
    cache.delete("dashboard:admin_stats")
    cache.delete("products:popular")
    
    return result
