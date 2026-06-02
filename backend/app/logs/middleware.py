# -*- coding: utf-8 -*-
"""
Middleware pour loguer automatiquement les actions CRUD des admins
"""
from fastapi import Request
from ..auth.service import decode_token
from .service import log_activity

async def log_admin_actions(request: Request, db, user_id: str, action: str, entity: str, entity_id: str = None, details: str = None):
    """Fonction utilitaire pour loguer les actions admin"""
    ip = request.client.host if request.client else None
    log_activity(db, user_id, action, entity, entity_id, details, ip)
