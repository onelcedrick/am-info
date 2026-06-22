# -*- coding: utf-8 -*-
import os
import uuid
from datetime import datetime
from sqlalchemy.orm import Session
from ..models import Order, OrderItem, Invoice, User
from ..config import settings
from reportlab.lib.pagesizes import A4
from reportlab.pdfgen import canvas
from reportlab.lib import colors

UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

def generate_invoice_pdf(order_id: str, db: Session) -> str:
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        return None
    
    client = db.query(User).filter(User.id == order.user_id).first()
    items = db.query(OrderItem).filter(OrderItem.order_id == order_id).all()
    
    filename = f"facture_{order_id[:8]}_{uuid.uuid4().hex[:4]}.pdf"
    filepath = os.path.join(UPLOAD_DIR, filename)
    
    c = canvas.Canvas(filepath, pagesize=A4)
    width, height = A4
    
    # En-tete bleu
    c.setFillColor(colors.HexColor('#1a73e8'))
    c.rect(0, height - 130, width, 130, fill=True, stroke=False)
    
    c.setFillColor(colors.white)
    c.setFont("Helvetica-Bold", 28)
    c.drawString(30, height - 55, "AM Info")
    c.setFont("Helvetica", 11)
    c.drawString(30, height - 75, "Assistance & Maintenance Informatique")
    c.drawString(30, height - 90, "Lot II M 75 Ankadivato, Antananarivo")
    c.drawString(30, height - 105, "Tel: +261 34 00 000 00 | contact@aminfo.mg")
    c.drawString(30, height - 120, "NIF: 123456789 | STAT: 987654321")
    
    # Titre facture
    c.setFillColor(colors.black)
    c.setFont("Helvetica-Bold", 22)
    c.drawString(30, height - 160, "FACTURE")
    
    # Infos facture
    c.setFont("Helvetica", 10)
    c.drawString(30, height - 185, f"Facture N: FAC-{order.id[:8].upper()}")
    c.drawString(30, height - 200, f"Date: {order.created_at.strftime('%d/%m/%Y a %H:%M')}")
    c.drawString(30, height - 215, f"Commande N: CMD-{order.id[:8].upper()}")
    
    # Infos client
    if client:
        c.setFont("Helvetica-Bold", 11)
        c.drawString(width - 250, height - 185, "CLIENT")
        c.setFont("Helvetica", 10)
        c.drawString(width - 250, height - 200, f"Nom: {client.full_name}")
        c.drawString(width - 250, height - 215, f"Email: {client.email}")
    
    # Separation
    c.setStrokeColor(colors.HexColor('#1a73e8'))
    c.setLineWidth(1)
    c.line(30, height - 235, width - 30, height - 235)
    
    # Tableau
    y = height - 265
    c.setFillColor(colors.HexColor('#f1f5f9'))
    c.rect(30, y - 10, width - 60, 22, fill=True, stroke=False)
    c.setFillColor(colors.black)
    c.setFont("Helvetica-Bold", 9)
    c.drawString(35, y + 2, "Produit")
    c.drawString(280, y + 2, "Prix unitaire")
    c.drawString(380, y + 2, "Qte")
    c.drawString(440, y + 2, "Total")
    
    y -= 30
    c.setFont("Helvetica", 9)
    for item in items:
        if y < 200:
            c.showPage()
            y = height - 50
        c.drawString(35, y + 2, str(item.product_name or "Produit"))
        c.drawString(280, y + 2, f"{float(item.unit_price):,.0f} Ar")
        c.drawString(380, y + 2, str(item.quantity))
        c.drawString(440, y + 2, f"{float(item.unit_price) * item.quantity:,.0f} Ar")
        c.line(30, y - 5, width - 30, y - 5)
        y -= 22
    
    # Total
    y -= 15
    c.setFont("Helvetica-Bold", 14)
    c.drawString(350, y, "TOTAL:")
    c.setFillColor(colors.HexColor('#1a73e8'))
    c.drawString(440, y, f"{float(order.total_amount or 0):,.0f} Ar")
    
    # Mention
    c.setFillColor(colors.gray)
    c.setFont("Helvetica", 9)
    c.drawString(30, y - 30, f"Statut: {order.status}")
    
    # Footer
    c.setFont("Helvetica", 8)
    c.drawString(30, 30, "AM Info - Assistance & Maintenance Informatique")
    c.drawString(30, 18, "Lot II M 75 Ankadivato, Antananarivo - Madagascar")
    c.drawString(width - 200, 30, f"Genere le {datetime.now().strftime('%d/%m/%Y a %H:%M')}")
    c.drawString(width - 200, 18, "Merci de votre confiance !")
    
    c.save()
    
    # URL dynamique (pas localhost)
    base_url = settings.BASE_URL or "http://localhost:8000"
    pdf_url = f"{base_url}/uploads/{filename}"
    
    invoice = db.query(Invoice).filter(Invoice.order_id == order_id).first()
    if not invoice:
        invoice = Invoice(order_id=order_id)
        db.add(invoice)
    invoice.pdf_url = pdf_url
    db.commit()
    
    return pdf_url

def get_invoice(db: Session, order_id: str):
    return db.query(Invoice).filter(Invoice.order_id == order_id).first()