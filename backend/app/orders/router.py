# -*- coding: utf-8 -*-
from fastapi import APIRouter, Depends, HTTPException, Header
from sqlalchemy.orm import Session
from ..database import get_db
from . import service as order_service
from ..auth.service import decode_token

router = APIRouter(prefix="/orders", tags=["orders"])
admin_router = APIRouter(prefix="/admin/orders", tags=["admin-orders"])

def get_current_user(authorization: str = Header(None)):
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Non authentifié")
    payload = decode_token(authorization.split(" ")[1])
    if not payload:
        raise HTTPException(status_code=401, detail="Token invalide")
    return payload

@router.post("")
def create_order(payload: dict = Depends(get_current_user), db: Session = Depends(get_db)):
    order = order_service.create_order(db, payload.get("sub"))
    if not order:
        raise HTTPException(status_code=400, detail="Panier vide")
    return {"message": "Commande créée", "order_id": order.id}

@router.get("")
def my_orders(payload: dict = Depends(get_current_user), db: Session = Depends(get_db)):
    return order_service.get_user_orders(db, payload.get("sub"))

@admin_router.get("")
def all_orders(db: Session = Depends(get_db)):
    return order_service.get_all_orders(db)

@admin_router.put("/{order_id}/status")
def change_status(order_id: str, status: str, db: Session = Depends(get_db)):
    return order_service.update_order_status(db, order_id, status)
