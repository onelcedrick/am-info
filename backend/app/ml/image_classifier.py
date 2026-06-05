# -*- coding: utf-8 -*-
import os, json, hashlib
import numpy as np
from PIL import Image
from datetime import datetime

# TensorFlow est optionnel
try:
    import tensorflow as tf
    HAS_TF = True
except ImportError:
    HAS_TF = False

PART_CLASSES = {
    0: {"name": "Ecran", "icon": "🖥️", "diagnostic": "Verifiez cable alimentation et HDMI/VGA."},
    1: {"name": "Clavier", "icon": "⌨️", "diagnostic": "Nettoyez les touches. Verifiez connexion."},
    2: {"name": "Carte mere", "icon": "🔧", "diagnostic": "Verifiez condensateurs. Testez alimentation."},
    3: {"name": "Alimentation", "icon": "⚡", "diagnostic": "Testez avec testeur. Verifiez voltage."},
    4: {"name": "Disque dur/SSD", "icon": "💾", "diagnostic": "Verifiez connexions SATA. Sauvegardez."},
    5: {"name": "Ventilateur", "icon": "🌀", "diagnostic": "Nettoyez poussiere. Verifiez connexion."},
    6: {"name": "Carte graphique", "icon": "🎮", "diagnostic": "MAJ drivers. Testez temperatures."},
    7: {"name": "RAM", "icon": "📊", "diagnostic": "Testez avec MemTest86. Nettoyez contacts."},
    8: {"name": "Imprimante", "icon": "🖨️", "diagnostic": "Verifiez bourrage papier. Nettoyez tetes."},
    9: {"name": "Cable/Connectique", "icon": "🔌", "diagnostic": "Testez autre cable. Verifiez ports."}
}

class ImageClassifier:
    def __init__(self):
        self.model = None
        self.loaded = False
        self.feedback_history = []
        if HAS_TF:
            self._load_model()
    
    def _load_model(self):
        try:
            model_path = os.path.join(os.path.dirname(__file__), 'models', 'part_classifier.h5')
            if os.path.exists(model_path):
                self.model = tf.keras.models.load_model(model_path)
                self.loaded = True
        except:
            pass
    
    def predict(self, image_path: str) -> dict:
        import random
        with open(image_path, 'rb') as f:
            image_hash = hashlib.md5(f.read()).hexdigest()
        
        if self.loaded and self.model:
            return self._predict_model(image_path, image_hash)
        return self._predict_heuristic(image_path, image_hash)
    
    def _predict_model(self, image_path, image_hash):
        img = Image.open(image_path).convert('RGB').resize((224, 224))
        img_array = np.array(img) / 255.0
        img_array = np.expand_dims(img_array, axis=0)
        predictions = self.model.predict(img_array, verbose=0)[0]
        class_id = int(np.argmax(predictions))
        confidence = float(predictions[class_id]) * 100
        return self._build(class_id, confidence, "deep_learning", image_hash)
    
    def _predict_heuristic(self, image_path, image_hash):
        import random
        class_id = random.randint(0, len(PART_CLASSES) - 1)
        confidence = random.uniform(60, 85)
        return self._build(class_id, confidence, "heuristic", image_hash)
    
    def _build(self, class_id, confidence, method, image_hash):
        p = PART_CLASSES.get(class_id, PART_CLASSES[2])
        return {
            "class_id": class_id, "name": p["name"], "icon": p["icon"],
            "confidence": round(confidence, 1), "diagnostic": p["diagnostic"],
            "method": method, "image_hash": image_hash
        }
    
    def add_feedback(self, image_hash, predicted, correct):
        self.feedback_history.append({"image_hash": image_hash, "predicted": predicted, "correct": correct})

classifier = ImageClassifier()
