# -*- coding: utf-8 -*-
from fastapi import APIRouter, Depends, Header, HTTPException
from sqlalchemy.orm import Session
from ..database import get_db
from ..auth.service import decode_token
from . import service

router = APIRouter(prefix="/admin/stats", tags=["admin-stats"])

def get_current_admin(authorization: str = Header(None)):
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401)
    payload = decode_token(authorization.split(" ")[1])
    if not payload or payload.get("role") != "admin":
        raise HTTPException(status_code=403)
    return payload

@router.get("/")
def get_stats(payload: dict = Depends(get_current_admin), db: Session = Depends(get_db)):
    return service.get_dashboard_stats(db)
