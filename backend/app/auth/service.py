# -*- coding: utf-8 -*-
from datetime import datetime, timedelta
from jose import jwt, JWTError
import bcrypt
from sqlalchemy.orm import Session
from ..config import settings
from ..models import User

def hash_password(password: str) -> str:
    """Hash un mot de passe avec bcrypt."""
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def verify_password(plain: str, hashed: str) -> bool:
    """Verifie un mot de passe contre son hash."""
    if not hashed:
        return False
    return bcrypt.checkpw(plain.encode('utf-8'), hashed.encode('utf-8'))

def create_access_token(user_id: str, role: str) -> str:
    expire = datetime.utcnow() + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    payload = {"sub": user_id, "role": role, "exp": expire}
    return jwt.encode(payload, settings.SECRET_KEY, algorithm=settings.ALGORITHM)

def decode_token(token: str) -> dict:
    try:
        return jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
    except JWTError:
        return None

def get_user_by_email(db: Session, email: str) -> User:
    return db.query(User).filter(User.email == email).first()

def create_user(db: Session, full_name: str, email: str, password: str, role: str = "client") -> User:
    user = User(
        email=email,
        full_name=full_name,
        password_hash=hash_password(password),
        role=role
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user

def create_google_user(db: Session, full_name: str, email: str, google_id: str) -> User:
    user = User(
        email=email,
        full_name=full_name,
        google_id=google_id,
        role="client"
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user