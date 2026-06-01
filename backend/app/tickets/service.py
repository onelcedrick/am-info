# -*- coding: utf-8 -*-
from sqlalchemy.orm import Session
from ..models import Ticket, TicketMessage

def create_ticket(db: Session, client_id: str, subject: str, description: str, priority: str = "normal"):
    ticket = Ticket(client_id=client_id, subject=subject, description=description, priority=priority)
    db.add(ticket)
    db.commit()
    db.refresh(ticket)
    return ticket

def get_client_tickets(db: Session, client_id: str):
    return db.query(Ticket).filter(Ticket.client_id == client_id).order_by(Ticket.created_at.desc()).all()

def get_technician_tickets(db: Session, technician_id: str):
    return db.query(Ticket).filter(
        (Ticket.technician_id == technician_id) | (Ticket.technician_id == None)
    ).order_by(Ticket.created_at.desc()).all()

def get_ticket_detail(db: Session, ticket_id: str):
    ticket = db.query(Ticket).filter(Ticket.id == ticket_id).first()
    if ticket:
        ticket.messages = db.query(TicketMessage).filter(
            TicketMessage.ticket_id == ticket_id
        ).order_by(TicketMessage.created_at).all()
    return ticket

def add_message(db: Session, ticket_id: str, sender_id: str, message: str, is_bot: bool = False, attachment_url: str = None):
    msg = TicketMessage(
        ticket_id=ticket_id, sender_id=sender_id,
        message=message, is_from_bot=is_bot,
        attachment_url=attachment_url
    )
    db.add(msg)
    db.commit()
    return msg

def assign_technician(db: Session, ticket_id: str, technician_id: str):
    ticket = db.query(Ticket).filter(Ticket.id == ticket_id).first()
    if ticket:
        ticket.technician_id = technician_id
        ticket.status = "assigned"
        db.commit()
    return ticket

def update_ticket_status(db: Session, ticket_id: str, status: str):
    ticket = db.query(Ticket).filter(Ticket.id == ticket_id).first()
    if ticket:
        ticket.status = status
        db.commit()
    return ticket
