# -*- coding: utf-8 -*-
from sqlalchemy.orm import Session
from sqlalchemy import func
from ..models import Rating, Ticket

def create_rating(db: Session, ticket_id: str, client_id: str, score: int, comment: str = None):
    ticket = db.query(Ticket).filter(Ticket.id == ticket_id).first()
    if not ticket:
        return None, "Ticket introuvable"
    if ticket.client_id != client_id:
        return None, "Non autorise"
    if ticket.status != "resolved" and ticket.status != "closed":
        return None, "Le ticket doit etre resolu"
    existing = db.query(Rating).filter(Rating.ticket_id == ticket_id).first()
    if existing:
        return None, "Deja note"
    rating = Rating(ticket_id=ticket_id, client_id=client_id, technician_id=ticket.technician_id, score=score, comment=comment)
    db.add(rating)
    db.commit()
    return rating, None

def get_ticket_rating(db: Session, ticket_id: str):
    return db.query(Rating).filter(Rating.ticket_id == ticket_id).first()

def get_technician_stats(db: Session, technician_id: str):
    avg = db.query(func.avg(Rating.score)).filter(Rating.technician_id == technician_id).scalar()
    total = db.query(Rating).filter(Rating.technician_id == technician_id).count()
    return {"average_score": round(float(avg or 0), 1), "total_ratings": total}
