# -*- coding: utf-8 -*-
from fastapi import APIRouter, Depends, Header, HTTPException
from sqlalchemy.orm import Session
from ..database import get_db
from ..auth.service import decode_token
from ..tickets import service as ticket_service
from .chatbot import chatbot

router = APIRouter(prefix="/chatbot", tags=["chatbot"])

def get_current_user(authorization: str = Header(None)):
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401)
    payload = decode_token(authorization.split(" ")[1])
    if not payload:
        raise HTTPException(status_code=401)
    return payload

@router.post("/ask")
def ask_chatbot(
    data: dict,
    payload: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    message = data.get("message", "")
    ticket_id = data.get("ticket_id")
    
    # Obtenir la reponse du chatbot
    response = chatbot.get_response(message)
    
    # Sauvegarder dans le ticket si existe
    if ticket_id:
        ticket_service.add_message(db, ticket_id, payload.get("sub"), message)
        ticket_service.add_message(db, ticket_id, "bot", response, is_bot=True)
    
    return {"response": response, "from_bot": True}
