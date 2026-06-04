# -*- coding: utf-8 -*-
from fastapi import APIRouter, Depends, HTTPException, Header, UploadFile, File, Request
from fastapi.responses import RedirectResponse
from sqlalchemy.orm import Session
from ..database import get_db
from ..schemas import UserCreate, UserLogin, Token, UserResponse
from ..config import settings
from ..cloudinary_config import upload_image
from ..logs.service import log_activity
from . import service
from ..models import User, CartItem, Order, Ticket, Wishlist, Rating
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
    log_activity(db, str(user.id), "register", "user", str(user.id), f"Inscription: {user.email}")
    return user

@router.post("/login", response_model=Token)
def login(data: UserLogin, request: Request = None, db: Session = Depends(get_db)):
    user = service.get_user_by_email(db, data.email)
    if not user or not service.verify_password(data.password, user.password_hash or ""):
        raise HTTPException(status_code=401, detail="Email ou mot de passe incorrect")
    token = service.create_access_token(str(user.id), user.role)
    ip = request.client.host if request and request.client else None
    log_activity(db, str(user.id), "login", "user", str(user.id), f"Connexion: {user.email}", ip_address=ip)
    return {"token": token, "user": user}

@router.post("/refresh", response_model=Token)
def refresh_token(payload: dict = Depends(get_current_user), db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == payload.get("sub")).first()
    if not user:
        raise HTTPException(status_code=404)
    token = service.create_access_token(str(user.id), user.role)
    return {"token": token, "user": user}

@router.get("/me", response_model=UserResponse)
def get_me(payload: dict = Depends(get_current_user), db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == payload.get("sub")).first()
    if not user:
        raise HTTPException(status_code=404)
    return user

@router.post("/avatar")
async def upload_avatar(file: UploadFile = File(...), payload: dict = Depends(get_current_user), db: Session = Depends(get_db)):
    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400)
    user = db.query(User).filter(User.id == payload.get("sub")).first()
    if not user: raise HTTPException(status_code=404)
    ext = file.filename.split(".")[-1] if "." in file.filename else "jpg"
    filename = f"avatar_{user.id[:8]}_{uuid.uuid4().hex[:4]}.{ext}"
    filepath = os.path.join(UPLOAD_DIR, filename)
    content = await file.read()
    with open(filepath, "wb") as f: f.write(content)
    cloud_url = upload_image(filepath, "aminfo/avatars")
    user.avatar_url = cloud_url or f"{settings.BASE_URL}/uploads/{filename}"
    db.commit()
    return {"avatar_url": user.avatar_url}

@router.delete("/account")
def delete_account(payload: dict = Depends(get_current_user), db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == payload.get("sub")).first()
    if not user: raise HTTPException(status_code=404)
    db.query(CartItem).filter(CartItem.user_id == user.id).delete()
    db.query(Order).filter(Order.user_id == user.id).delete()
    db.query(Ticket).filter(Ticket.client_id == user.id).delete()
    db.query(Wishlist).filter(Wishlist.user_id == user.id).delete()
    db.query(Rating).filter(Rating.client_id == user.id).delete()
    db.delete(user)
    db.commit()
    log_activity(db, str(user.id), "delete", "user", str(user.id), f"Compte supprimé: {user.email}")
    return {"message": "Compte supprime"}

# ============ GOOGLE OAUTH ============
GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth"
GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token"
GOOGLE_USERINFO_URL = "https://openidconnect.googleapis.com/v1/userinfo"

@router.get("/google/login")
async def google_login():
    if not settings.GOOGLE_CLIENT_ID:
        return {"message": "Google OAuth non configure"}
    redirect_uri = f"{settings.BASE_URL}/auth/google/callback"
    url = f"{GOOGLE_AUTH_URL}?client_id={settings.GOOGLE_CLIENT_ID}&redirect_uri={redirect_uri}&response_type=code&scope=openid%20email%20profile&access_type=offline&prompt=consent"
    return RedirectResponse(url=url)

@router.get("/google/callback")
async def google_callback(code: str, db: Session = Depends(get_db)):
    redirect_uri = f"{settings.BASE_URL}/auth/google/callback"
    try:
        import httpx
        async with httpx.AsyncClient() as client:
            token_res = await client.post(GOOGLE_TOKEN_URL, data={
                "client_id": settings.GOOGLE_CLIENT_ID,
                "client_secret": settings.GOOGLE_CLIENT_SECRET,
                "code": code, "grant_type": "authorization_code",
                "redirect_uri": redirect_uri
            })
            token_data = token_res.json()
            access_token = token_data.get("access_token")
            if not access_token:
                return {"error": "Token Google non obtenu", "details": token_data}
            user_res = await client.get(GOOGLE_USERINFO_URL, headers={"Authorization": f"Bearer {access_token}"})
            user_info = user_res.json()
            google_email = user_info.get("email")
            google_name = user_info.get("name", "Utilisateur Google")
            google_id = user_info.get("sub")
            google_picture = user_info.get("picture")
            if not google_email:
                return {"error": "Email manquant"}
            user = service.get_user_by_email(db, google_email)
            if not user:
                user = service.create_google_user(db, google_name, google_email, google_id)
                if google_picture:
                    user.avatar_url = google_picture
                    db.commit()
                log_activity(db, str(user.id), "register", "user", str(user.id), f"Inscription Google: {google_email}")
            else:
                log_activity(db, str(user.id), "login", "user", str(user.id), f"Connexion Google: {google_email}")
            token = service.create_access_token(str(user.id), user.role)
            frontend_url = f"{settings.FRONTEND_URL}/auth/google/callback?token={token}"
            return RedirectResponse(url=frontend_url)
    except Exception as e:
        return {"error": str(e)}

# Admin : créer un compte technicien
@router.post("/admin/create-user")
def admin_create_user(data: dict, payload: dict = Depends(get_current_user), db: Session = Depends(get_db)):
    if payload.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Réservé aux administrateurs")
    email = data.get("email")
    full_name = data.get("full_name")
    password = data.get("password")
    role = data.get("role", "technician")
    if not email or not full_name or not password:
        raise HTTPException(status_code=400, detail="Email, nom et mot de passe requis")
    if role not in ["technician", "admin"]:
        raise HTTPException(status_code=400, detail="Rôle invalide")
    existing = service.get_user_by_email(db, email)
    if existing:
        raise HTTPException(status_code=400, detail="Cet email est déjà utilisé")
    user = service.create_user(db, full_name, email, password, role)
    log_activity(db, payload.get("sub"), "create", "user", str(user.id), f"Création compte {role}: {email}")
    return {"message": f"Compte {role} créé avec succès", "user": {"id": str(user.id), "email": user.email, "full_name": user.full_name, "role": user.role}}

@router.put("/profile")
def update_profile(data: dict, payload: dict = Depends(get_current_user), db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == payload.get("sub")).first()
    if not user:
        raise HTTPException(status_code=404)
    full_name = data.get("full_name")
    if full_name:
        user.full_name = full_name
    db.commit()
    return {"message": "Profil mis à jour", "user": {"id": str(user.id), "email": user.email, "full_name": user.full_name, "role": user.role}}

@router.put("/profile")
def update_profile(data: dict, payload: dict = Depends(get_current_user), db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == payload.get("sub")).first()
    if not user:
        raise HTTPException(status_code=404)
    
    if data.get("full_name"):
        user.full_name = data["full_name"]
    
    db.commit()
    return {"message": "Profil mis à jour", "user": {"id": str(user.id), "email": user.email, "full_name": user.full_name, "role": user.role, "avatar_url": user.avatar_url}}
