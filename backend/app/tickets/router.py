# -*- coding: utf-8 -*-
from fastapi import APIRouter, Depends, HTTPException, Header, UploadFile, File, Query
from sqlalchemy.orm import Session
from ..database import get_db
from ..models import User
from ..schemas import TicketCreate, MessageCreate
from . import service as ticket_service
from ..emails import service as email_service
from ..logs.service import log_activity
from ..auth.service import decode_token
from ..config import settings
from .sla import get_sla_status, get_sla_rules
import os, uuid

router = APIRouter(prefix="/tickets", tags=["tickets"])
technician_router = APIRouter(prefix="/technician/tickets", tags=["technician-tickets"])

UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

def get_current_user(authorization: str = Header(None)):
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401)
    payload = decode_token(authorization.split(" ")[1])
    if not payload: raise HTTPException(status_code=401)
    return payload

@router.get("/sla-rules")
def sla_rules():
    """Retourne les regles SLA"""
    return get_sla_rules()

@router.post("")
def create_ticket(data: TicketCreate, payload: dict = Depends(get_current_user), db: Session = Depends(get_db)):
    ticket = ticket_service.create_ticket(db, payload.get("sub"), data.subject, data.description, data.priority)
    user = db.query(User).filter(User.id == payload.get("sub")).first()
    if user: email_service.send_ticket_created(user.email, ticket.subject, str(ticket.id))
    log_activity(db, payload.get("sub"), "create", "ticket", str(ticket.id), f"Ticket: {data.subject}")
    return ticket

@router.get("")
def my_tickets(payload: dict = Depends(get_current_user), search: str = Query(None), status: str = Query(None), priority: str = Query(None), db: Session = Depends(get_db)):
    return ticket_service.search_tickets(db, search=search, status=status, priority=priority, role='client', user_id=payload.get("sub"))

@router.get("/{ticket_id}")
def ticket_detail(ticket_id: str, db: Session = Depends(get_db)):
    ticket = ticket_service.get_ticket_detail(db, ticket_id)
    if not ticket:
        raise HTTPException(status_code=404)
    # Ajouter SLA
    result = {
        "id": ticket.id, "subject": ticket.subject, "description": ticket.description,
        "status": ticket.status, "priority": ticket.priority,
        "client_id": ticket.client_id, "technician_id": ticket.technician_id,
        "created_at": ticket.created_at.isoformat() if ticket.created_at else None,
        "messages": [{
            "id": m.id, "sender_id": m.sender_id, "message": m.message,
            "is_from_bot": m.is_from_bot, "attachment_url": m.attachment_url,
            "created_at": m.created_at.isoformat() if m.created_at else None
        } for m in (ticket.messages or [])],
        "sla": get_sla_status(ticket)
    }
    return result

@router.post("/{ticket_id}/messages")
def send_message(ticket_id: str, data: MessageCreate, payload: dict = Depends(get_current_user), db: Session = Depends(get_db)):
    return ticket_service.add_message(db, ticket_id, payload.get("sub"), data.message)

@router.post("/{ticket_id}/upload")
async def upload_photo(ticket_id: str, file: UploadFile = File(...), payload: dict = Depends(get_current_user), db: Session = Depends(get_db)):
    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400)
    ext = file.filename.split(".")[-1] if "." in file.filename else "jpg"
    filename = f"{uuid.uuid4()}.{ext}"
    filepath = os.path.join(UPLOAD_DIR, filename)
    content = await file.read()
    with open(filepath, "wb") as f: f.write(content)
    image_url = f"{settings.BASE_URL}/uploads/{filename}"
    msg = ticket_service.add_message(db, ticket_id, payload.get("sub"), "Photo de la piece", attachment_url=image_url)
    return {"message": "Photo envoyee", "image_url": image_url}

@router.delete("/{ticket_id}/messages")
def clear_messages(ticket_id: str, payload: dict = Depends(get_current_user), db: Session = Depends(get_db)):
    ticket = ticket_service.get_ticket_detail(db, ticket_id)
    if not ticket: raise HTTPException(status_code=404)
    if ticket.client_id != payload.get("sub") and payload.get("role") != "admin":
        raise HTTPException(status_code=403)
    ticket_service.clear_messages(db, ticket_id)
    log_activity(db, payload.get("sub"), "delete", "ticket_messages", ticket_id, "Historique efface")
    return {"message": "Historique supprime"}

@router.delete("/{ticket_id}/messages/{msg_id}")
def delete_message(ticket_id: str, msg_id: str, payload: dict = Depends(get_current_user), db: Session = Depends(get_db)):
    if payload.get("role") not in ["technician", "admin"]: raise HTTPException(status_code=403)
    ticket_service.delete_message(db, msg_id)
    log_activity(db, payload.get("sub"), "delete", "message", msg_id, "Message supprime")
    return {"message": "Message supprime"}

# NOUVEAU : Client supprime son ticket
@router.delete("/{ticket_id}")
def delete_client_ticket(ticket_id: str, payload: dict = Depends(get_current_user), db: Session = Depends(get_db)):
    if payload.get("role") != "client":
        raise HTTPException(status_code=403, detail="Action reservee aux clients")
    success, error = ticket_service.delete_ticket(db, ticket_id, payload.get("sub"), "client")
    if not success:
        raise HTTPException(status_code=400, detail=error)
    log_activity(db, payload.get("sub"), "delete", "ticket", ticket_id, "Ticket supprime par client")
    return {"message": "Ticket supprime"}

# NOUVEAU : Technicien supprime un ticket assigné
@technician_router.delete("/{ticket_id}")
def delete_technician_ticket(ticket_id: str, payload: dict = Depends(get_current_user), db: Session = Depends(get_db)):
    if payload.get("role") not in ["technician", "admin"]:
        raise HTTPException(status_code=403, detail="Action non autorisee")
    success, error = ticket_service.delete_ticket(db, ticket_id, payload.get("sub"), "technician")
    if not success:
        raise HTTPException(status_code=400, detail=error)
    log_activity(db, payload.get("sub"), "delete", "ticket", ticket_id, "Ticket supprime par technicien")
    return {"message": "Ticket supprime"}

@technician_router.get("")
def tech_tickets(payload: dict = Depends(get_current_user), search: str = Query(None), status: str = Query(None), priority: str = Query(None), db: Session = Depends(get_db)):
    return ticket_service.search_tickets(db, search=search, status=status, priority=priority, role='technician', user_id=payload.get("sub"))

@technician_router.put("/{ticket_id}/assign")
def assign_ticket(ticket_id: str, payload: dict = Depends(get_current_user), db: Session = Depends(get_db)):
    result = ticket_service.assign_technician(db, ticket_id, payload.get("sub"))
    log_activity(db, payload.get("sub"), "assign", "ticket", ticket_id, "Ticket assigne")
    return result

@technician_router.put("/{ticket_id}/status")
def change_status(ticket_id: str, status: str, db: Session = Depends(get_db)):
    ticket = ticket_service.update_ticket_status(db, ticket_id, status)
    if status == 'resolved' and ticket:
        client = db.query(User).filter(User.id == ticket.client_id).first()
        if client: email_service.send_ticket_resolved(client.email, ticket.subject, str(ticket.id))
    log_activity(db, "technician", "status_change", "ticket", ticket_id, f"Statut: {status}")
    return ticket