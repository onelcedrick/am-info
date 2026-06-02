# -*- coding: utf-8 -*-
from fastapi import APIRouter, Depends, Header, HTTPException, Query
from sqlalchemy.orm import Session
from ..database import get_db
from ..auth.service import decode_token
from . import service

router = APIRouter(prefix="/payments", tags=["payments"])
admin_router = APIRouter(prefix="/admin/payments", tags=["admin-payments"])

def get_current_user(authorization: str = Header(None)):
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401)
    payload = decode_token(authorization.split(" ")[1])
    if not payload:
        raise HTTPException(status_code=401)
    return payload

def get_current_admin(authorization: str = Header(None)):
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401)
    payload = decode_token(authorization.split(" ")[1])
    if not payload or payload.get("role") != "admin":
        raise HTTPException(status_code=403)
    return payload

@router.get("/methods")
def payment_methods():
    return service.get_payment_methods()

@router.post("/pay")
def pay(data: dict, payload: dict = Depends(get_current_user), db: Session = Depends(get_db)):
    order_id = data.get("order_id")
    method = data.get("method")
    phone = data.get("phone", "")
    if not order_id or not method:
        raise HTTPException(status_code=400, detail="order_id et method requis")
    result, error = service.process_payment(db, order_id, method, phone)
    if error:
        raise HTTPException(status_code=400, detail=error)
    return result

@admin_router.get("/transactions")
def get_transactions(
    status: str = Query(None),
    payload: dict = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    return service.get_transactions(db, status)

@admin_router.get("/stats")
def get_stats(payload: dict = Depends(get_current_admin), db: Session = Depends(get_db)):
    return service.get_transaction_stats(db)

@admin_router.post("/verify/{order_id}")
def verify_transaction(order_id: str, payload: dict = Depends(get_current_admin), db: Session = Depends(get_db)):
    result, error = service.verify_transaction(db, order_id)
    if error:
        raise HTTPException(status_code=400, detail=error)
    return result
