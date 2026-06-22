# -*- coding: utf-8 -*-
from fastapi import APIRouter, Depends, Header, HTTPException
from sqlalchemy.orm import Session
from ..database import get_db
from ..auth.service import decode_token
from . import service

router = APIRouter(prefix="/admin/invoices", tags=["admin-invoices"])
client_router = APIRouter(prefix="/client/invoices", tags=["client-invoices"])

def get_current_user(authorization: str = Header(None)):
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401)
    payload = decode_token(authorization.split(" ")[1])
    if not payload: raise HTTPException(status_code=401)
    return payload

def get_current_admin(authorization: str = Header(None)):
    payload = get_current_user(authorization)
    if payload.get("role") != "admin":
        raise HTTPException(status_code=403)
    return payload

# ADMIN
@router.post("/{order_id}")
def generate_invoice(order_id: str, payload: dict = Depends(get_current_admin), db: Session = Depends(get_db)):
    pdf_url = service.generate_invoice_pdf(order_id, db)
    if not pdf_url:
        raise HTTPException(status_code=404, detail="Commande non trouvee")
    return {"pdf_url": pdf_url, "message": "Facture generee"}

@router.get("/{order_id}")
def get_invoice(order_id: str, payload: dict = Depends(get_current_admin), db: Session = Depends(get_db)):
    invoice = service.get_invoice(db, order_id)
    if not invoice:
        raise HTTPException(status_code=404, detail="Aucune facture")
    return {"pdf_url": invoice.pdf_url}

# CLIENT - peut voir SA facture
@client_router.get("/{order_id}")
def get_client_invoice(order_id: str, payload: dict = Depends(get_current_user), db: Session = Depends(get_db)):
    # Verifier que la commande appartient au client
    from ..models import Order
    order = db.query(Order).filter(Order.id == order_id, Order.user_id == payload.get("sub")).first()
    if not order:
        raise HTTPException(status_code=404, detail="Commande non trouvee")
    
    # Generer si pas encore
    invoice = service.get_invoice(db, order_id)
    if not invoice:
        pdf_url = service.generate_invoice_pdf(order_id, db)
        if not pdf_url:
            raise HTTPException(status_code=404, detail="Impossible de generer la facture")
        return {"pdf_url": pdf_url}
    
    return {"pdf_url": invoice.pdf_url}