# -*- coding: utf-8 -*-
from fastapi import APIRouter, Depends, HTTPException, Header, UploadFile, File, Query
from sqlalchemy.orm import Session
from ..database import get_db
from ..models import User
from ..schemas import TicketCreate, MessageCreate
from . import service as ticket_service
from ..emails import service as email_service
from ..auth.service import decode_token
from ..redis_client import cache
import os
import uuid

router = APIRouter(prefix="/tickets", tags=["tickets"])
technician_router = APIRouter(prefix="/technician/tickets", tags=["technician-tickets"])

UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

def get_current_user(authorization: str = Header(None)):
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401)
    payload = decode_token(authorization.split(" ")[1])
    if not payload:
        raise HTTPException(status_code=401)
    return payload

@router.post("")
def create_ticket(data: TicketCreate, payload: dict = Depends(get_current_user), db: Session = Depends(get_db)):
    ticket = ticket_service.create_ticket(db, payload.get("sub"), data.subject, data.description, data.priority)
    user = db.query(User).filter(User.id == payload.get("sub")).first()
    if user:
        email_service.send_ticket_created(user.email, ticket.subject, str(ticket.id))
    cache.delete("dashboard:admin_stats")
    return ticket

@router.get("")
def my_tickets(payload: dict = Depends(get_current_user), search: str = Query(None), status: str = Query(None), priority: str = Query(None), db: Session = Depends(get_db)):
    return ticket_service.search_tickets(db, search=search, status=status, priority=priority, role='client', user_id=payload.get("sub"))

@router.get("/{ticket_id}")
def ticket_detail(ticket_id: str, db: Session = Depends(get_db)):
    return ticket_service.get_ticket_detail(db, ticket_id)

@router.post("/{ticket_id}/messages")
def send_message(ticket_id: str, data: MessageCreate, payload: dict = Depends(get_current_user), db: Session = Depends(get_db)):
    return ticket_service.add_message(db, ticket_id, payload.get("sub"), data.message)

@router.post("/{ticket_id}/upload")
async def upload_photo(ticket_id: str, file: UploadFile = File(...), payload: dict = Depends(get_current_user), db: Session = Depends(get_db)):
    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="Seules les images sont acceptees")
    ext = file.filename.split(".")[-1] if "." in file.filename else "jpg"
    filename = f"{uuid.uuid4()}.{ext}"
    filepath = os.path.join(UPLOAD_DIR, filename)
    content = await file.read()
    with open(filepath, "wb") as f:
        f.write(content)
    image_url = f"http://localhost:8000/uploads/{filename}"
    msg = ticket_service.add_message(db, ticket_id, payload.get("sub"), "Photo de la piece", attachment_url=image_url)
    return {"message": "Photo envoyee", "image_url": image_url, "message_id": msg.id}

@router.delete("/{ticket_id}/messages")
def clear_messages(ticket_id: str, payload: dict = Depends(get_current_user), db: Session = Depends(get_db)):
    user_id = payload.get("sub")
    role = payload.get("role")
    ticket = ticket_service.get_ticket_detail(db, ticket_id)
    if not ticket:
        raise HTTPException(status_code=404)
    if ticket.client_id != user_id and role != "admin":
        raise HTTPException(status_code=403)
    ticket_service.clear_messages(db, ticket_id)
    return {"message": "Historique supprime"}

@technician_router.get("")
def tech_tickets(payload: dict = Depends(get_current_user), search: str = Query(None), status: str = Query(None), priority: str = Query(None), db: Session = Depends(get_db)):
    return ticket_service.search_tickets(db, search=search, status=status, priority=priority, role='technician', user_id=payload.get("sub"))

@technician_router.put("/{ticket_id}/assign")
def assign_ticket(ticket_id: str, payload: dict = Depends(get_current_user), db: Session = Depends(get_db)):
    result = ticket_service.assign_technician(db, ticket_id, payload.get("sub"))
    cache.delete("dashboard:admin_stats")
    return result

@technician_router.put("/{ticket_id}/status")
def change_status(ticket_id: str, status: str, db: Session = Depends(get_db)):
    ticket = ticket_service.update_ticket_status(db, ticket_id, status)
    if status == 'resolved' and ticket:
        client = db.query(User).filter(User.id == ticket.client_id).first()
        if client:
            email_service.send_ticket_resolved(client.email, ticket.subject, str(ticket.id))
    cache.delete("dashboard:admin_stats")
    return ticket

@router.delete("/{ticket_id}/messages/{msg_id}")
def delete_message(ticket_id: str, msg_id: str, payload: dict = Depends(get_current_user), db: Session = Depends(get_db)):
    ticket = ticket_service.get_ticket_detail(db, ticket_id)
    if not ticket:
        raise HTTPException(status_code=404)
    # Seul le technicien assigpeut supprimer les messages
    if payload.get("role") not in ["technician", "admin"]:
        raise HTTPException(status_code=403)
    ticket_service.delete_message(db, msg_id)
    return {"message": "Supprime"}

@router.put("/{ticket_id}/messages/{msg_id}")
def update_message(ticket_id: str, msg_id: str, data: MessageCreate, payload: dict = Depends(get_current_user), db: Session = Depends(get_db)):
    msg = db.query(TicketMessage).filter(TicketMessage.id == msg_id).first()
    if not msg:
        raise HTTPException(status_code=404)
    # Seul l'auteur peut modifier son message
    if msg.sender_id != payload.get("sub"):
        raise HTTPException(status_code=403, detail="Vous ne pouvez modifier que vos propres messages")
    msg.message = data.message
    db.commit()
    return {"message": "Modifie"}