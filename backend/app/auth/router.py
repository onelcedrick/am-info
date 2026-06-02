# -*- coding: utf-8 -*-
from fastapi import APIRouter, Depends, HTTPException, Header, UploadFile, File
from sqlalchemy.orm import Session
from ..database import get_db
from ..schemas import UserCreate, UserLogin, Token, UserResponse
from . import service
from ..models import User
import os
import uuid

router = APIRouter(prefix="/auth", tags=["auth"])

UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

def get_current_user(authorization: str = Header(None)):
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Non authentifie")
    payload = service.decode_token(authorization.split(" ")[1])
    if not payload:
        raise HTTPException(status_code=401, detail="Token expire ou invalide")
    return payload

@router.post("/register", response_model=UserResponse)
def register(data: UserCreate, db: Session = Depends(get_db)):
    existing = service.get_user_by_email(db, data.email)
    if existing:
        raise HTTPException(status_code=400, detail="Email deja utilise")
    user = service.create_user(db, data.full_name, data.email, data.password)
    return user

@router.post("/login", response_model=Token)
def login(data: UserLogin, db: Session = Depends(get_db)):
    user = service.get_user_by_email(db, data.email)
    if not user or not service.verify_password(data.password, user.password_hash or ""):
        raise HTTPException(status_code=401, detail="Email ou mot de passe incorrect")
    token = service.create_access_token(str(user.id), user.role)
    return {"token": token, "user": user}

@router.post("/refresh", response_model=Token)
def refresh_token(payload: dict = Depends(get_current_user), db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == payload.get("sub")).first()
    if not user:
        raise HTTPException(status_code=404, detail="Utilisateur introuvable")
    # Generer un nouveau token
    token = service.create_access_token(str(user.id), user.role)
    return {"token": token, "user": user}

@router.get("/me", response_model=UserResponse)
def get_me(payload: dict = Depends(get_current_user), db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == payload.get("sub")).first()
    if not user:
        raise HTTPException(status_code=404)
    return user

@router.post("/avatar")
async def upload_avatar(
    file: UploadFile = File(...),
    payload: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="Seules les images sont acceptees")
    user = db.query(User).filter(User.id == payload.get("sub")).first()
    if not user:
        raise HTTPException(status_code=404)
    ext = file.filename.split(".")[-1] if "." in file.filename else "jpg"
    filename = f"avatar_{user.id[:8]}_{uuid.uuid4().hex[:4]}.{ext}"
    filepath = os.path.join(UPLOAD_DIR, filename)
    content = await file.read()
    with open(filepath, "wb") as f:
        f.write(content)
    user.avatar_url = f"{settings.BASE_URL}/uploads/{filename}"
    db.commit()
    return {"avatar_url": user.avatar_url}

@router.delete("/account")
def delete_account(payload: dict = Depends(get_current_user), db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == payload.get("sub")).first()
    if not user:
        raise HTTPException(status_code=404, detail="Utilisateur introuvable")
    
    # Supprimer les donnees liees
    db.query(CartItem).filter(CartItem.user_id == user.id).delete()
    db.query(Order).filter(Order.user_id == user.id).delete()
    db.query(Ticket).filter(Ticket.client_id == user.id).delete()
    db.query(Wishlist).filter(Wishlist.user_id == user.id).delete()
    db.query(Rating).filter(Rating.client_id == user.id).delete()
    
    db.delete(user)
    db.commit()
    return {"message": "Compte supprime definitivement"}