# -*- coding: utf-8 -*-
from sqlalchemy.orm import Session
from ..models import SiteSetting

def get_setting(db: Session, key: str) -> str:
    setting = db.query(SiteSetting).filter(SiteSetting.key == key).first()
    return setting.value if setting else None

def set_setting(db: Session, key: str, value: str):
    setting = db.query(SiteSetting).filter(SiteSetting.key == key).first()
    if setting:
        setting.value = value
    else:
        setting = SiteSetting(key=key, value=value)
        db.add(setting)
    db.commit()
    db.refresh(setting)
    return setting