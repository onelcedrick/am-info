# -*- coding: utf-8 -*-
from fastapi import APIRouter, Depends, Header, HTTPException, UploadFile, File, Query
from sqlalchemy.orm import Session
from ..database import get_db
from ..auth.service import decode_token
from .recommendation import engine
from .chatbot import chatbot
from .image_classifier import classifier, PART_CLASSES
import os, uuid

router = APIRouter(prefix="/recommendations", tags=["recommendations"])

UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

def get_current_user(authorization: str = Header(None)):
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401)
    payload = decode_token(authorization.split(" ")[1])
    if not payload: raise HTTPException(status_code=401)
    return payload

@router.get("/product/{product_id}")
def product_recommendations(product_id: str, category: str = Query(None), db: Session = Depends(get_db)):
    return engine.get_recommendations(db, {"product_id": product_id, "category": category}, 8)

@router.get("/home")
def home_recommendations(db: Session = Depends(get_db)):
    return engine.get_recommendations(db, limit=12)

@router.post("/chatbot/ask")
def ask_chatbot(data: dict, payload: dict = Depends(get_current_user), db: Session = Depends(get_db)):
    from ..tickets import service as ticket_service
    message = data.get("message", "")
    ticket_id = data.get("ticket_id")
    response = chatbot.get_response(message)
    if ticket_id:
        ticket_service.add_message(db, ticket_id, payload.get("sub"), message)
        ticket_service.add_message(db, ticket_id, "bot", response, is_bot=True)
    return {"response": response, "from_bot": True}

@router.post("/analyze-image")
async def analyze_part_image(
    file: UploadFile = File(...),
    payload: dict = Depends(get_current_user)
):
    """Analyse une photo avec l'IA"""
    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400)
    
    ext = file.filename.split(".")[-1] if "." in file.filename else "jpg"
    filename = f"analyze_{uuid.uuid4().hex[:8]}.{ext}"
    filepath = os.path.join(UPLOAD_DIR, filename)
    
    content = await file.read()
    with open(filepath, "wb") as f:
        f.write(content)
    
    result = classifier.predict(filepath)
    result["image_url"] = f"/uploads/{filename}"
    return result

@router.post("/feedback")
def submit_feedback(data: dict, payload: dict = Depends(get_current_user)):
    """Soumet un feedback pour ameliorer l'IA"""
    image_hash = data.get("image_hash")
    predicted_class = data.get("predicted_class")
    correct_class = data.get("correct_class")
    
    if image_hash is None or predicted_class is None or correct_class is None:
        raise HTTPException(status_code=400, detail="image_hash, predicted_class, correct_class requis")
    
    classifier.add_feedback(image_hash, int(predicted_class), int(correct_class))
    return {"message": "Feedback enregistre, merci ! L'IA va s'ameliorer.", "success": True}

@router.get("/classes")
def get_classes():
    """Liste les classes de pieces"""
    return PART_CLASSES
