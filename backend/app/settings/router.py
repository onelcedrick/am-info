# -*- coding: utf-8 -*-
from fastapi import APIRouter, Depends, HTTPException, Header, UploadFile, File
from sqlalchemy.orm import Session
from ..database import get_db
from ..auth.service import decode_token
from . import service as settings_service
from ..cloudinary_config import upload_image
from ..config import settings as app_settings
import os, uuid

router = APIRouter(prefix="/settings", tags=["settings"])

def get_current_user(authorization: str = Header(None)):
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401)
    payload = decode_token(authorization.split(" ")[1])
    if not payload: raise HTTPException(status_code=401)
    return payload

@router.get("/logo")
def get_logo(db: Session = Depends(get_db)):
    """Retourne l'URL du logo (public)"""
    logo_url = settings_service.get_setting(db, "site_logo")
    return {"logo_url": logo_url}

@router.put("/logo")
def update_logo(
    file: UploadFile = File(...),
    payload: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Admin : met à jour le logo"""
    if payload.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin uniquement")
    
    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="Fichier image requis")
    
    ext = file.filename.split(".")[-1] if "." in file.filename else "png"
    filename = f"logo_{uuid.uuid4()}.{ext}"
    filepath = os.path.join("uploads", filename)
    os.makedirs("uploads", exist_ok=True)
    content = file.file.read()
    with open(filepath, "wb") as f:
        f.write(content)
    
    cloud_url = upload_image(filepath, "aminfo/logo")
    logo_url = cloud_url or f"{app_settings.BASE_URL}/uploads/{filename}"
    
    settings_service.set_setting(db, "site_logo", logo_url)
    
    return {"logo_url": logo_url, "message": "Logo mis à jour"}