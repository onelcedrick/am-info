# -*- coding: utf-8 -*-
import os
import uuid
from datetime import datetime
from sqlalchemy.orm import Session
from ..models import Order, OrderItem, Invoice
from reportlab.lib.pagesizes import A4
from reportlab.pdfgen import canvas
from reportlab.lib import colors

UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

def generate_invoice_pdf(order_id: str, db: Session) -> str:
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        return None
    
    items = db.query(OrderItem).filter(OrderItem.order_id == order_id).all()
    
    filename = f"facture_{order_id[:8]}_{uuid.uuid4().hex[:4]}.pdf"
    filepath = os.path.join(UPLOAD_DIR, filename)
    
    c = canvas.Canvas(filepath, pagesize=A4)
    width, height = A4
    
    # En-tete bleu
    c.setFillColor(colors.HexColor('#1a73e8'))
    c.rect(0, height - 120, width, 120, fill=True, stroke=False)
    c.setFillColor(colors.white)
    c.setFont("Helvetica-Bold", 28)
    c.drawString(30, height - 55, "AM Info")
    c.setFont("Helvetica", 12)
    c.drawString(30, height - 75, "Assistance & Maintenance Informatique")
    c.drawString(30, height - 95, "Lot II M 75 Ankadivato, Antananarivo")
    c.drawString(30, height - 110, "Tel: +261 34 00 000 00")
    
    c.setFillColor(colors.black)
    c.setFont("Helvetica-Bold", 20)
    c.drawString(30, height - 155, "FACTURE")
    c.setFont("Helvetica", 10)
    c.drawString(30, height - 175, f"Facture N: INV-{order.id[:8]}")
    c.drawString(30, height - 190, f"Date: {order.created_at.strftime('%d/%m/%Y %H:%M')}")
    c.drawString(30, height - 205, f"Statut: {order.status}")
    
    # Tableau
    y = height - 240
    c.setFillColor(colors.HexColor('#f1f5f9'))
    c.rect(30, y - 10, width - 60, 20, fill=True, stroke=False)
    c.setFillColor(colors.black)
    c.setFont("Helvetica-Bold", 9)
    c.drawString(35, y + 3, "Produit")
    c.drawString(250, y + 3, "Prix unitaire")
    c.drawString(350, y + 3, "Qte")
    c.drawString(430, y + 3, "Total")
    
    y -= 25
    c.setFont("Helvetica", 9)
    for item in items:
        if y < 200:
            c.showPage()
            y = height - 50
        c.drawString(35, y + 3, str(item.product_name or "Produit"))
        c.drawString(250, y + 3, f"{float(item.unit_price):,.0f} Ar")
        c.drawString(350, y + 3, str(item.quantity))
        c.drawString(430, y + 3, f"{float(item.unit_price) * item.quantity:,.0f} Ar")
        y -= 18
    
    y -= 10
    c.line(30, y, width - 30, y)
    y -= 25
    c.setFont("Helvetica-Bold", 14)
    c.drawString(350, y, "TOTAL:")
    c.drawString(430, y, f"{float(order.total_amount or 0):,.0f} Ar")
    
    c.setFont("Helvetica", 8)
    c.setFillColor(colors.gray)
    c.drawString(30, 30, "AM Info - www.aminfo.mg")
    c.drawString(width - 200, 30, f"Genere le {datetime.now().strftime('%d/%m/%Y')}")
    
    c.save()
    
    invoice = db.query(Invoice).filter(Invoice.order_id == order_id).first()
    if not invoice:
        invoice = Invoice(order_id=order_id)
        db.add(invoice)
    invoice.pdf_url = f"http://localhost:8000/uploads/{filename}"
    db.commit()
    
    return invoice.pdf_url

def get_invoice(db: Session, order_id: str):
    return db.query(Invoice).filter(Invoice.order_id == order_id).first()
