# -*- coding: utf-8 -*-
from fastapi import APIRouter, Depends, HTTPException, Header
from sqlalchemy.orm import Session
from ..database import get_db
from ..schemas import CartItemCreate
from . import service as cart_service
from ..auth.service import decode_token

router = APIRouter(prefix="/cart", tags=["cart"])

def get_current_user_id(authorization: str = Header(None)):
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Non authentifié")
    token = authorization.split(" ")[1]
    payload = decode_token(token)
    if not payload:
        raise HTTPException(status_code=401, detail="Token invalide")
    return payload.get("sub")

@router.get("")
def get_cart(user_id: str = Depends(get_current_user_id), db: Session = Depends(get_db)):
    items = cart_service.get_cart(db, user_id)
    total = sum(item["total"] for item in items)
    return {"items": items, "total": total, "count": len(items)}

@router.post("/items")
def add_item(data: CartItemCreate, user_id: str = Depends(get_current_user_id), db: Session = Depends(get_db)):
    cart_service.add_to_cart(db, user_id, str(data.product_id), data.quantity)
    return get_cart(user_id=user_id, db=db)

@router.put("/items/{item_id}")
def update_item(item_id: str, quantity: int, user_id: str = Depends(get_current_user_id), db: Session = Depends(get_db)):
    cart_service.update_quantity(db, item_id, quantity)
    return get_cart(user_id=user_id, db=db)

@router.delete("/items/{item_id}")
def remove_item(item_id: str, user_id: str = Depends(get_current_user_id), db: Session = Depends(get_db)):
    cart_service.remove_from_cart(db, item_id)
    return get_cart(user_id=user_id, db=db)
