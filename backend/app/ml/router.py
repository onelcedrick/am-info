# -*- coding: utf-8 -*-
from fastapi import APIRouter, Depends, Header, HTTPException, Query
from sqlalchemy.orm import Session
from ..database import get_db
from ..auth.service import decode_token
from .recommendation import engine
from .chatbot import chatbot

router = APIRouter(prefix="/recommendations", tags=["recommendations"])

def get_current_user(authorization: str = Header(None)):
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401)
    payload = decode_token(authorization.split(" ")[1])
    if not payload:
        raise HTTPException(status_code=401)
    return payload

@router.get("/product/{product_id}")
def product_recommendations(product_id: str, category: str = Query(None), db: Session = Depends(get_db)):
    return engine.get_recommendations(db, {"product_id": product_id, "category": category}, 8)

@router.get("/home")
def home_recommendations(db: Session = Depends(get_db)):
    return engine.get_recommendations(db, limit=12)

@router.post("/chatbot/ask")
def ask_chatbot(data: dict, payload: dict = Depends(get_current_user), db: Session = Depends(get_db)):
    from ..tickets import service as ticket_service
    message = data.get("message", "")
    ticket_id = data.get("ticket_id")
    response = chatbot.get_response(message)
    if ticket_id:
        ticket_service.add_message(db, ticket_id, payload.get("sub"), message)
        ticket_service.add_message(db, ticket_id, "bot", response, is_bot=True)
    return {"response": response, "from_bot": True}
