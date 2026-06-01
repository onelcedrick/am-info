# -*- coding: utf-8 -*-
from fastapi import APIRouter, Depends, HTTPException, Header, UploadFile, File, Request
from fastapi.responses import RedirectResponse
from sqlalchemy.orm import Session
from ..database import get_db
from ..schemas import UserCreate, UserLogin, Token, UserResponse
from . import service
from ..models import User
from ..config import settings
import os
import uuid
import httpx

router = APIRouter(prefix="/auth", tags=["auth"])

UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

def get_current_user(authorization: str = Header(None)):
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Non authentifie")
    payload = service.decode_token(authorization.split(" ")[1])
    if not payload:
        raise HTTPException(status_code=401, detail="Token invalide")
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
    user.avatar_url = f"http://localhost:8000/uploads/{filename}"
    db.commit()
    return {"avatar_url": user.avatar_url}

# Google OAuth
GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth"
GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token"
GOOGLE_USERINFO_URL = "https://openidconnect.googleapis.com/v1/userinfo"

@router.get("/google/login")
async def google_login():
    if not settings.GOOGLE_CLIENT_ID:
        return {"message": "Google OAuth non configure", "simulate": True}
    
    params = {
        "client_id": settings.GOOGLE_CLIENT_ID,
        "redirect_uri": "http://localhost:8000/auth/google/callback",
        "response_type": "code",
        "scope": "openid email profile",
        "access_type": "offline",
        "prompt": "consent"
    }
    
    url = f"{GOOGLE_AUTH_URL}?{'&'.join(f'{k}={v}' for k, v in params.items())}"
    return RedirectResponse(url=url)

@router.get("/google/callback")
async def google_callback(request: Request, db: Session = Depends(get_db)):
    code = request.query_params.get("code")
    error = request.query_params.get("error")
    
    if error:
        raise HTTPException(status_code=400, detail=f"Google OAuth erreur: {error}")
    
    if not code:
        raise HTTPException(status_code=400, detail="Code manquant")
    
    # Echanger le code contre un token
    async with httpx.AsyncClient() as client:
        token_response = await client.post(GOOGLE_TOKEN_URL, data={
            "client_id": settings.GOOGLE_CLIENT_ID,
            "client_secret": settings.GOOGLE_CLIENT_SECRET,
            "code": code,
            "grant_type": "authorization_code",
            "redirect_uri": "http://localhost:8000/auth/google/callback"
        })
        
        if token_response.status_code != 200:
            raise HTTPException(status_code=400, detail="Erreur token Google")
        
        token_data = token_response.json()
        access_token = token_data.get("access_token")
        
        # Recuperer les infos utilisateur
        user_response = await client.get(GOOGLE_USERINFO_URL, headers={
            "Authorization": f"Bearer {access_token}"
        })
        
        if user_response.status_code != 200:
            raise HTTPException(status_code=400, detail="Erreur infos Google")
        
        user_info = user_response.json()
        google_email = user_info.get("email")
        google_name = user_info.get("name", "Utilisateur Google")
        google_id = user_info.get("sub")
        google_picture = user_info.get("picture")
        
        if not google_email:
            raise HTTPException(status_code=400, detail="Email Google manquant")
        
        # Chercher ou creer l'utilisateur
        user = service.get_user_by_email(db, google_email)
        if not user:
            user = service.create_google_user(db, google_name, google_email, google_id)
            if google_picture:
                user.avatar_url = google_picture
                db.commit()
        
        # Creer notre JWT
        token = service.create_access_token(str(user.id), user.role)
        
        # Rediriger vers le frontend
        frontend_url = f"http://localhost:5173/auth/google/callback?token={token}"
        return RedirectResponse(url=frontend_url)
