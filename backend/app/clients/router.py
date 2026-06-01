# -*- coding: utf-8 -*-
from fastapi import APIRouter, Depends, Header, HTTPException
from sqlalchemy.orm import Session
from ..database import get_db
from ..auth.service import decode_token
from ..emails import service as email_service
from . import service as client_service

router = APIRouter(prefix="/admin/clients", tags=["admin-clients"])

def get_current_admin(authorization: str = Header(None)):
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401)
    payload = decode_token(authorization.split(" ")[1])
    if not payload or payload.get("role") != "admin":
        raise HTTPException(status_code=403)
    return payload

@router.get("/")
def list_clients(payload: dict = Depends(get_current_admin), db: Session = Depends(get_db)):
    return client_service.get_clients_list(db)

@router.get("/emails")
def get_emails(payload: dict = Depends(get_current_admin), db: Session = Depends(get_db)):
    return client_service.get_client_emails(db)

@router.post("/broadcast")
def send_broadcast(data: dict, payload: dict = Depends(get_current_admin), db: Session = Depends(get_db)):
    subject = data.get("subject", "")
    message = data.get("message", "")
    client_emails = data.get("client_ids", [])
    
    if not subject or not message:
        raise HTTPException(status_code=400, detail="Sujet et message requis")
    
    clients = client_service.get_client_emails(db)
    if client_emails:
        clients = [c for c in clients if c['email'] in client_emails]
    
    sent_count = 0
    for client in clients:
        body = f"Bonjour {client['name']},\n\n{message}\n\n---\nAM Info"
        if email_service.send_email(client['email'], subject, body):
            sent_count += 1
    
    return {"message": f"Envoye a {sent_count}/{len(clients)} client(s)", "sent": sent_count, "total": len(clients)}
