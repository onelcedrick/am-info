# -*- coding: utf-8 -*-
from fastapi import APIRouter, Depends, Header, HTTPException
from sqlalchemy.orm import Session
from ..database import get_db
from ..auth.service import decode_token
from . import service

router = APIRouter(prefix="/wishlist", tags=["wishlist"])

def get_current_user(authorization: str = Header(None)):
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401)
    payload = decode_token(authorization.split(" ")[1])
    if not payload:
        raise HTTPException(status_code=401)
    return payload

@router.get("/")
def my_wishlist(payload: dict = Depends(get_current_user), db: Session = Depends(get_db)):
    return service.get_wishlist(db, payload.get("sub"))

@router.get("/ids")
def wishlist_ids(payload: dict = Depends(get_current_user), db: Session = Depends(get_db)):
    return service.get_wishlist_ids(db, payload.get("sub"))

@router.post("/{product_id}")
def toggle(product_id: str, payload: dict = Depends(get_current_user), db: Session = Depends(get_db)):
    return service.toggle_wishlist(db, payload.get("sub"), product_id)
