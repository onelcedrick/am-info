# -*- coding: utf-8 -*-
"""
SLA (Service Level Agreement) - Temps de reponse selon priorite
"""
from datetime import datetime, timedelta, timezone

MADAGASCAR_TZ = timezone(timedelta(hours=3))

SLA_RULES = {
    "urgent": {
        "response_time": 15,     # minutes
        "resolution_time": 120,  # 2 heures
        "label": "Urgent",
        "color": "red",
        "icon": "🔴"
    },
    "high": {
        "response_time": 60,     # 1 heure
        "resolution_time": 480,  # 8 heures
        "label": "Haute",
        "color": "orange",
        "icon": "🟠"
    },
    "normal": {
        "response_time": 240,    # 4 heures
        "resolution_time": 1440, # 24 heures
        "label": "Normal",
        "color": "blue",
        "icon": "🔵"
    },
    "low": {
        "response_time": 1440,   # 24 heures
        "resolution_time": 4320, # 72 heures
        "label": "Faible",
        "color": "green",
        "icon": "🟢"
    }
}

def get_sla_status(ticket) -> dict:
    """Calcule le statut SLA d'un ticket"""
    now = datetime.now(MADAGASCAR_TZ)
    created = ticket.created_at.replace(tzinfo=MADAGASCAR_TZ) if ticket.created_at else now
    rule = SLA_RULES.get(ticket.priority, SLA_RULES["normal"])
    
    # Temps ecoule en minutes
    elapsed = (now - created).total_seconds() / 60
    
    # Temps de reponse depasse ?
    response_deadline = created + timedelta(minutes=rule["response_time"])
    response_overdue = now > response_deadline and ticket.status == "open"
    
    # Temps de resolution depasse ?
    resolution_deadline = created + timedelta(minutes=rule["resolution_time"])
    resolution_overdue = now > resolution_deadline and ticket.status not in ["resolved", "closed"]
    
    # Pourcentage de temps restant
    if ticket.status == "open":
        remaining_pct = max(0, min(100, (1 - elapsed / rule["response_time"]) * 100))
    else:
        remaining_pct = 100
    
    # Statut SLA
    if response_overdue or resolution_overdue:
        sla_status = "breached"
        sla_color = "red"
        sla_message = f"SLA depasse ! Reponse attendue en {rule['response_time']} min"
    elif remaining_pct < 25:
        sla_status = "warning"
        sla_color = "orange"
        sla_message = f"Urgent : {int(remaining_pct)}% du temps restant"
    elif remaining_pct < 50:
        sla_status = "attention"
        sla_color = "yellow"
        sla_message = f"Attention : {int(remaining_pct)}% du temps restant"
    else:
        sla_status = "ok"
        sla_color = "green"
        sla_message = "Dans les temps"
    
    return {
        "sla_status": sla_status,
        "sla_color": sla_color,
        "sla_message": sla_message,
        "elapsed_minutes": int(elapsed),
        "response_time_minutes": rule["response_time"],
        "resolution_time_minutes": rule["resolution_time"],
        "remaining_percent": int(remaining_pct),
        "response_deadline": response_deadline.isoformat(),
        "resolution_deadline": resolution_deadline.isoformat(),
        "priority_label": rule["label"],
        "priority_icon": rule["icon"]
    }

def get_sla_rules():
    return SLA_RULES
