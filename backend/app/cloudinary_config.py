# -*- coding: utf-8 -*-
import os
from dotenv import load_dotenv

load_dotenv()

try:
    import cloudinary
    import cloudinary.uploader
    HAS_CLOUDINARY = True
except ImportError:
    HAS_CLOUDINARY = False

if HAS_CLOUDINARY:
    cloudinary.config(
        cloud_name=os.getenv("CLOUDINARY_CLOUD_NAME", ""),
        api_key=os.getenv("CLOUDINARY_API_KEY", ""),
        api_secret=os.getenv("CLOUDINARY_API_SECRET", "")
    )

def upload_image(file_path: str, folder: str = "aminfo") -> str:
    if not HAS_CLOUDINARY:
        return None
    try:
        if not os.getenv("CLOUDINARY_CLOUD_NAME"):
            return None
        result = cloudinary.uploader.upload(
            file_path,
            folder=folder,
            transformation=[{'quality': 'auto', 'fetch_format': 'auto'}]
        )
        return result.get('secure_url')
    except Exception as e:
        print(f"Erreur Cloudinary: {e}")
        return None
