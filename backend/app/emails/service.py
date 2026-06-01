# -*- coding: utf-8 -*-
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

def send_email(to_email: str, subject: str, body: str, html_body: str = None) -> bool:
    print(f"\n{'='*60}")
    print(f"EMAIL SIMULE")
    print(f"To: {to_email}")
    print(f"Subject: {subject}")
    print(f"{'='*60}\n")
    return True

def send_order_confirmation(to_email: str, order_id: str, total: float, items: list):
    subject = f"AM Info - Confirmation de commande #{order_id[:8]}"
    items_text = "\n".join([f"- {item['name']} x{item['quantity']} : {item['total']:,.0f} Ar" for item in items])
    body = f"Commande #{order_id[:8]} confirmee.\nTotal: {total:,.0f} Ar"
    return send_email(to_email, subject, body)

def send_ticket_created(to_email: str, ticket_subject: str, ticket_id: str):
    subject = f"AM Info - Ticket cree : {ticket_subject}"
    body = f"Ticket #{ticket_id[:8]} cree. Sujet: {ticket_subject}"
    return send_email(to_email, subject, body)

def send_ticket_resolved(to_email: str, ticket_subject: str, ticket_id: str):
    subject = f"AM Info - Ticket resolu : {ticket_subject}"
    body = f"Ticket #{ticket_id[:8]} resolu."
    return send_email(to_email, subject, body)
