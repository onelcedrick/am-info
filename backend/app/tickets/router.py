# -*- coding: utf-8 -*-
from fastapi import APIRouter, Depends, HTTPException, Header, UploadFile, File, Form
from sqlalchemy.orm import Session
from ..database import get_db
from ..schemas import TicketCreate, MessageCreate
from . import service as ticket_service
from ..auth.service import decode_token
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
    return ticket_service.create_ticket(db, payload.get("sub"), data.subject, data.description, data.priority)

@router.get("")
def my_tickets(payload: dict = Depends(get_current_user), db: Session = Depends(get_db)):
    return ticket_service.get_client_tickets(db, payload.get("sub"))

@router.get("/{ticket_id}")
def ticket_detail(ticket_id: str, db: Session = Depends(get_db)):
    return ticket_service.get_ticket_detail(db, ticket_id)

@router.post("/{ticket_id}/messages")
def send_message(ticket_id: str, data: MessageCreate, payload: dict = Depends(get_current_user), db: Session = Depends(get_db)):
    return ticket_service.add_message(db, ticket_id, payload.get("sub"), data.message)

@router.post("/{ticket_id}/upload")
async def upload_photo(
    ticket_id: str,
    file: UploadFile = File(...),
    payload: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Vérifier le type de fichier
    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="Seules les images sont acceptées")
    
    # Générer un nom unique
    ext = file.filename.split(".")[-1] if "." in file.filename else "jpg"
    filename = f"{uuid.uuid4()}.{ext}"
    filepath = os.path.join(UPLOAD_DIR, filename)
    
    # Sauvegarder le fichier
    content = await file.read()
    with open(filepath, "wb") as f:
        f.write(content)
    
    # Créer un message avec la photo
    image_url = f"http://localhost:8000/uploads/{filename}"
    msg = ticket_service.add_message(
        db, ticket_id, payload.get("sub"),
        "📸 Photo de la pièce",
        attachment_url=image_url
    )
    
    return {"message": "Photo envoyée", "image_url": image_url, "message_id": msg.id}

@technician_router.get("")
def tech_tickets(payload: dict = Depends(get_current_user), db: Session = Depends(get_db)):
    return ticket_service.get_technician_tickets(db, payload.get("sub"))

@technician_router.put("/{ticket_id}/assign")
def assign_ticket(ticket_id: str, payload: dict = Depends(get_current_user), db: Session = Depends(get_db)):
    return ticket_service.assign_technician(db, ticket_id, payload.get("sub"))

@technician_router.put("/{ticket_id}/status")
def change_status(ticket_id: str, status: str, db: Session = Depends(get_db)):
    return ticket_service.update_ticket_status(db, ticket_id, status)
