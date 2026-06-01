# -*- coding: utf-8 -*-
from fastapi import APIRouter, Depends, HTTPException, Header
from sqlalchemy.orm import Session
from ..database import get_db
from ..auth.service import decode_token
from . import service

router = APIRouter(prefix="/ratings", tags=["ratings"])

def get_current_user(authorization: str = Header(None)):
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401)
    payload = decode_token(authorization.split(" ")[1])
    if not payload:
        raise HTTPException(status_code=401)
    return payload

@router.post("/")
def rate_ticket(data: dict, payload: dict = Depends(get_current_user), db: Session = Depends(get_db)):
    ticket_id = data.get("ticket_id")
    score = data.get("score")
    comment = data.get("comment", "")
    if not ticket_id or not score:
        raise HTTPException(status_code=400, detail="ticket_id et score requis")
    if score < 1 or score > 5:
        raise HTTPException(status_code=400, detail="Score entre 1 et 5")
    rating, error = service.create_rating(db, ticket_id, payload.get("sub"), score, comment)
    if error:
        raise HTTPException(status_code=400, detail=error)
    return {"message": "Merci pour votre avis !", "rating": {"score": rating.score, "comment": rating.comment}}

@router.get("/ticket/{ticket_id}")
def get_rating(ticket_id: str, db: Session = Depends(get_db)):
    rating = service.get_ticket_rating(db, ticket_id)
    if not rating:
        return {"rated": False}
    return {"rated": True, "score": rating.score, "comment": rating.comment}

@router.get("/technician/{tech_id}")
def tech_stats(tech_id: str, db: Session = Depends(get_db)):
    return service.get_technician_stats(db, tech_id)
