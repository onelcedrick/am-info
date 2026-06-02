# -*- coding: utf-8 -*-
from fastapi import APIRouter, Depends, Header, HTTPException, Query, Request
from sqlalchemy.orm import Session
from ..database import get_db
from ..auth.service import decode_token
from . import service as log_service

router = APIRouter(prefix="/admin/logs", tags=["admin-logs"])

def get_current_admin(authorization: str = Header(None)):
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401)
    payload = decode_token(authorization.split(" ")[1])
    if not payload or payload.get("role") != "admin":
        raise HTTPException(status_code=403)
    return payload

@router.get("/")
def get_logs(
    limit: int = Query(50, le=200),
    action: str = Query(None),
    entity: str = Query(None),
    payload: dict = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """Consulter les logs d'activite"""
    logs = log_service.get_recent_logs(db, limit, action, entity)
    from ..models import User
    
    result = []
    for log in logs:
        user = db.query(User).filter(User.id == log.user_id).first() if log.user_id else None
        result.append({
            "id": log.id,
            "user_name": user.full_name if user else "Systeme",
            "user_email": user.email if user else "",
            "action": log.action,
            "entity": log.entity,
            "entity_id": log.entity_id,
            "details": log.details,
            "ip_address": log.ip_address,
            "created_at": log.created_at.isoformat() if log.created_at else None
        })
    return result

@router.get("/stats")
def get_stats(payload: dict = Depends(get_current_admin), db: Session = Depends(get_db)):
    return log_service.get_stats(db)

@router.get("/user/{user_id}")
def get_user_logs(
    user_id: str,
    limit: int = Query(50, le=200),
    payload: dict = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    return log_service.get_user_logs(db, user_id, limit)
