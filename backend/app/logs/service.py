# -*- coding: utf-8 -*-
from sqlalchemy.orm import Session
from ..models import ActivityLog
from datetime import datetime

def log_activity(
    db: Session,
    user_id: str,
    action: str,
    entity: str = None,
    entity_id: str = None,
    details: str = None,
    ip_address: str = None
):
    """Enregistre une activite dans les logs"""
    log = ActivityLog(
        user_id=user_id,
        action=action,
        entity=entity,
        entity_id=entity_id,
        details=details,
        ip_address=ip_address
    )
    db.add(log)
    db.commit()
    return log

def get_recent_logs(db: Session, limit: int = 50, action: str = None, entity: str = None):
    """Recupere les logs recents avec filtres optionnels"""
    query = db.query(ActivityLog)
    if action:
        query = query.filter(ActivityLog.action == action)
    if entity:
        query = query.filter(ActivityLog.entity == entity)
    return query.order_by(ActivityLog.created_at.desc()).limit(limit).all()

def get_user_logs(db: Session, user_id: str, limit: int = 50):
    """Logs d'un utilisateur specifique"""
    return db.query(ActivityLog).filter(
        ActivityLog.user_id == user_id
    ).order_by(ActivityLog.created_at.desc()).limit(limit).all()

def get_stats(db: Session):
    """Statistiques des logs"""
    from sqlalchemy import func
    from datetime import datetime, timedelta
    
    now = datetime.utcnow()
    today = now.replace(hour=0, minute=0, second=0)
    
    total_today = db.query(ActivityLog).filter(ActivityLog.created_at >= today).count()
    total_all = db.query(ActivityLog).count()
    
    # Actions les plus frequentes
    top_actions = db.query(
        ActivityLog.action, func.count(ActivityLog.id)
    ).group_by(ActivityLog.action).order_by(func.count(ActivityLog.id).desc()).limit(5).all()
    
    # Entites les plus modifiees
    top_entities = db.query(
        ActivityLog.entity, func.count(ActivityLog.id)
    ).filter(ActivityLog.entity != None).group_by(ActivityLog.entity
    ).order_by(func.count(ActivityLog.id).desc()).limit(5).all()
    
    return {
        "total_all": total_all,
        "total_today": total_today,
        "top_actions": [{"action": a, "count": c} for a, c in top_actions],
        "top_entities": [{"entity": e, "count": c} for e, c in top_entities]
    }
