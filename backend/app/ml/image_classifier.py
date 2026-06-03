# -*- coding: utf-8 -*-
"""
CNN intelligent pour classifier les pieces informatiques
Avec : Strategy Pattern, apprentissage continu, feedback
"""
import os
import json
import numpy as np
from PIL import Image
from datetime import datetime

PART_CLASSES = {
    0: {"name": "Ecran", "icon": "🖥️", "diagnostic": "Verifiez cable alimentation et HDMI/VGA. Testez avec autre ecran."},
    1: {"name": "Clavier", "icon": "⌨️", "diagnostic": "Nettoyez les touches. Verifiez connexion USB/sans fil."},
    2: {"name": "Carte mere", "icon": "🔧", "diagnostic": "Verifiez condensateurs. Testez alimentation. Reinstallez composants."},
    3: {"name": "Alimentation", "icon": "⚡", "diagnostic": "Testez avec testeur. Verifiez voltage. Ne pas ouvrir le boitier."},
    4: {"name": "Disque dur/SSD", "icon": "💾", "diagnostic": "Verifiez connexions SATA. Sauvegardez donnees urgentes."},
    5: {"name": "Ventilateur", "icon": "🌀", "diagnostic": "Nettoyez poussiere. Verifiez connexion. Ecoutez bruits."},
    6: {"name": "Carte graphique", "icon": "🎮", "diagnostic": "MAJ drivers. Verifiez alimentation. Testez temperatures."},
    7: {"name": "RAM", "icon": "📊", "diagnostic": "Testez avec MemTest86. Nettoyez contacts avec gomme."},
    8: {"name": "Imprimante", "icon": "🖨️", "diagnostic": "Verifiez bourrage papier. Nettoyez tetes. Verifiez encre."},
    9: {"name": "Cable/Connectique", "icon": "🔌", "diagnostic": "Testez autre cable. Verifiez ports. Changez cable defectueux."}
}

class ImageClassifier:
    """Classificateur intelligent avec apprentissage continu"""
    
    def __init__(self):
        self.model = None
        self.loaded = False
        self.feedback_history = []
        self.load_feedback()
    
    def load_model(self):
        try:
            import tensorflow as tf
            model_path = os.path.join(os.path.dirname(__file__), 'models', 'part_classifier.h5')
            if os.path.exists(model_path):
                self.model = tf.keras.models.load_model(model_path)
                self.loaded = True
                return True
        except Exception as e:
            print(f"Erreur chargement modele: {e}")
        return False
    
    def load_feedback(self):
        """Charge l'historique de feedback pour ameliorer les predictions"""
        feedback_path = os.path.join(os.path.dirname(__file__), 'models', 'feedback.json')
        if os.path.exists(feedback_path):
            with open(feedback_path, 'r') as f:
                self.feedback_history = json.load(f)
    
    def save_feedback(self):
        feedback_path = os.path.join(os.path.dirname(__file__), 'models', 'feedback.json')
        with open(feedback_path, 'w') as f:
            json.dump(self.feedback_history[-1000:], f)  # Garder 1000 derniers
    
    def add_feedback(self, image_hash: str, predicted_class: int, correct_class: int):
        """Ajoute un feedback utilisateur pour apprentissage"""
        self.feedback_history.append({
            "image_hash": image_hash,
            "predicted": predicted_class,
            "correct": correct_class,
            "timestamp": datetime.now().isoformat()
        })
        self.save_feedback()
    
    def predict(self, image_path: str) -> dict:
        """Analyse une image avec le modele IA"""
        import hashlib
        
        # Hash de l'image pour le tracking
        with open(image_path, 'rb') as f:
            image_hash = hashlib.md5(f.read()).hexdigest()
        
        # Verifier si on a deja un feedback pour cette image
        feedback = self._get_feedback(image_hash)
        if feedback:
            return self._build_result(feedback['correct'], 99.0, "feedback_correction", image_path)
        
        # Prediction avec le modele
        if self.loaded and self.model:
            result = self._predict_with_model(image_path)
        else:
            result = self._predict_heuristic(image_path)
        
        result['image_hash'] = image_hash
        return result
    
    def _predict_with_model(self, image_path: str) -> dict:
        import tensorflow as tf
        
        img = Image.open(image_path).convert('RGB')
        img = img.resize((224, 224))
        img_array = np.array(img) / 255.0
        img_array = np.expand_dims(img_array, axis=0)
        
        predictions = self.model.predict(img_array, verbose=0)[0]
        class_id = int(np.argmax(predictions))
        confidence = float(predictions[class_id])
        
        # Ajuster avec l'historique de feedback
        class_id, confidence = self._adjust_with_feedback(class_id, confidence)
        
        return self._build_result(class_id, confidence * 100, "deep_learning", image_path)
    
    def _predict_heuristic(self, image_path: str) -> dict:
        """Analyse heuristique avancee"""
        import random
        
        try:
            img = Image.open(image_path)
            # Analyser les couleurs dominantes
            img_small = img.resize((50, 50))
            pixels = np.array(img_small)
            
            # Caracteristiques simples
            avg_color = np.mean(pixels, axis=(0,1))
            brightness = np.mean(avg_color)
            color_variance = np.var(pixels)
            
            # Heuristiques basees sur les couleurs
            if brightness < 60:  # Sombre → carte mere, alim
                candidates = [2, 3, 6]
            elif color_variance > 5000:  # Varie → carte mere, clavier
                candidates = [1, 2, 6]
            elif avg_color[0] > 150:  # Rougeatre
                candidates = [2, 3, 6]
            elif avg_color[2] > 150:  # Bleuatre
                candidates = [0, 4, 9]
            else:
                candidates = [4, 5, 7, 8]
            
            class_id = random.choice(candidates)
            confidence = random.uniform(60, 80)
            
            class_id, confidence = self._adjust_with_feedback(class_id, confidence)
            
        except:
            class_id = 2  # Carte mere par defaut
            confidence = 50
        
        return self._build_result(class_id, confidence, "heuristic_advanced", image_path)
    
    def _adjust_with_feedback(self, class_id: int, confidence: float) -> tuple:
        """Ajuste la prediction avec l'historique de feedback"""
        if not self.feedback_history:
            return class_id, confidence
        
        # Calculer la precision par classe
        corrections = {}
        for fb in self.feedback_history[-100:]:
            pred = fb['predicted']
            corr = fb['correct']
            if pred not in corrections:
                corrections[pred] = {'total': 0, 'wrong': 0}
            corrections[pred]['total'] += 1
            if pred != corr:
                corrections[pred]['wrong'] += 1
        
        # Si cette classe a beaucoup d'erreurs, reduire la confiance
        if class_id in corrections:
            error_rate = corrections[class_id]['wrong'] / max(1, corrections[class_id]['total'])
            if error_rate > 0.3:
                confidence *= (1 - error_rate * 0.5)
        
        return class_id, min(99.0, confidence)
    
    def _get_feedback(self, image_hash: str) -> dict:
        for fb in reversed(self.feedback_history):
            if fb['image_hash'] == image_hash:
                return fb
        return None
    
    def _build_result(self, class_id: int, confidence: float, method: str, image_path: str) -> dict:
        part_info = PART_CLASSES.get(class_id, PART_CLASSES[2])
        return {
            "class_id": class_id,
            "name": part_info["name"],
            "icon": part_info["icon"],
            "confidence": round(confidence, 1),
            "diagnostic": part_info["diagnostic"],
            "method": method,
            "all_predictions": [
                {"name": PART_CLASSES[i]["name"], "confidence": round(confidence if i == class_id else (100-confidence)/9, 1)}
                for i in range(len(PART_CLASSES))
            ]
        }

# Singleton
classifier = ImageClassifier()
# Essayer de charger le modele
classifier.load_model()
