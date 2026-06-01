# -*- coding: utf-8 -*-
from fastapi import APIRouter, Depends, Header, HTTPException
from sqlalchemy.orm import Session
from ..database import get_db
from ..auth.service import decode_token
from . import service

router = APIRouter(prefix="/admin/invoices", tags=["admin-invoices"])

def get_current_admin(authorization: str = Header(None)):
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401)
    payload = decode_token(authorization.split(" ")[1])
    if not payload or payload.get("role") != "admin":
        raise HTTPException(status_code=403)
    return payload

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
