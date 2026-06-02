# -*- coding: utf-8 -*-
from sqlalchemy.orm import Session
from sqlalchemy import or_
from ..models import Ticket, TicketMessage

def create_ticket(db: Session, client_id: str, subject: str, description: str, priority: str = "normal"):
    ticket = Ticket(client_id=client_id, subject=subject, description=description, priority=priority)
    db.add(ticket)
    db.commit()
    db.refresh(ticket)
    return ticket

def get_client_tickets(db: Session, client_id: str):
    return db.query(Ticket).filter(Ticket.client_id == client_id).order_by(Ticket.created_at.desc()).all()

def get_technician_tickets(db: Session, technician_id: str = None, search: str = None, status: str = None, priority: str = None):
    query = db.query(Ticket)
    
    if technician_id:
        query = query.filter((Ticket.technician_id == technician_id) | (Ticket.technician_id == None))
    
    if search:
        query = query.filter(
            or_(
                Ticket.subject.ilike(f'%{search}%'),
                Ticket.description.ilike(f'%{search}%')
            )
        )
    
    if status and status != 'all':
        query = query.filter(Ticket.status == status)
    
    if priority and priority != 'all':
        query = query.filter(Ticket.priority == priority)
    
    return query.order_by(Ticket.created_at.desc()).all()

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

def clear_messages(db: Session, ticket_id: str):
    db.query(TicketMessage).filter(TicketMessage.ticket_id == ticket_id).delete()
    db.commit()

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

def search_tickets(db: Session, search: str = None, status: str = None, priority: str = None, role: str = None, user_id: str = None):
    query = db.query(Ticket)
    
    if role == 'client' and user_id:
        query = query.filter(Ticket.client_id == user_id)
    elif role == 'technician' and user_id:
        query = query.filter((Ticket.technician_id == user_id) | (Ticket.technician_id == None))
    
    if search:
        query = query.filter(
            or_(
                Ticket.subject.ilike(f'%{search}%'),
                Ticket.description.ilike(f'%{search}%')
            )
        )
    
    if status and status != 'all':
        query = query.filter(Ticket.status == status)
    
    if priority and priority != 'all':
        query = query.filter(Ticket.priority == priority)
    
    return query.order_by(Ticket.created_at.desc()).all()

# Dans tickets/service.py, ajouter :
def delete_message(db: Session, msg_id: str):
    msg = db.query(TicketMessage).filter(TicketMessage.id == msg_id).first()
    if msg:
        db.delete(msg)
        db.commit()
def delete_message(db: Session, msg_id: str):
    msg = db.query(TicketMessage).filter(TicketMessage.id == msg_id).first()
    if msg:
        db.delete(msg)
        db.commit()
        return True
    return False
