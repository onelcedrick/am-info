from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from ..database import get_db
from ..models import User
from ..schemas import UserCreate, UserLogin, Token, UserResponse
from . import service

router = APIRouter(prefix="/auth", tags=["auth"])

@router.post("/register", response_model=UserResponse)
def register(data: UserCreate, db: Session = Depends(get_db)):
    existing = service.get_user_by_email(db, data.email)
    if existing:
        raise HTTPException(status_code=400, detail="Email déjà utilisé")
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
def get_me(db: Session = Depends(get_db), user_id: str = Depends(service.decode_token)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404)
    return user
