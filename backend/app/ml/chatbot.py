# -*- coding: utf-8 -*-
import json
import os
import re
from datetime import datetime

class ChatbotEngine:
    def __init__(self):
        self.knowledge_base = self._load_knowledge()
    
    def _load_knowledge(self):
        return {
            "salutations": {
                "patterns": ["bonjour", "salut", "hello", "bjr", "bsr", "bonsoir", "hey", "coucou"],
                "responses": [
                    "Bonjour ! Je suis le chatbot d'AM Info. Comment puis-je vous aider ?",
                    "Bienvenue chez AM Info ! Quel est votre probleme ?",
                    "Bonjour ! Dites-moi ce qui ne va pas, je vais vous guider."
                ]
            },
            "ecran_noir": {
                "patterns": ["ecran noir", "ecran ne s'allume pas", "pas d'image", "ecran eteint", "moniteur noir", "no display", "ecran reste noir"],
                "responses": [
                    "Voici les etapes pour un ecran noir :\n1. Verifiez que le cable d'alimentation est bien branche\n2. Verifiez le cable HDMI/VGA entre le PC et l'ecran\n3. Essayez un autre ecran si possible\n4. Verifiez que la carte graphique est bien enfoncee\n\nLe probleme persiste ? Un technicien va vous aider.",
                    "Pour un ecran noir, commencez par :\n- Verifier l'alimentation secteur\n- Changer le cable video\n- Tester sur un autre port\n\nSi ca ne marche toujours pas, je vous mets en relation avec un technicien."
                ]
            },
            "pc_lent": {
                "patterns": ["pc lent", "ordinateur lent", "rame", "trop lent", "ralenti", "lenteur", "pc bloqué", "pc freeze"],
                "responses": [
                    "Votre PC est lent ? Voici quelques solutions :\n1. Redemarrez votre ordinateur\n2. Fermez les programmes inutiles\n3. Verifiez l'espace disque disponible\n4. Faites une analyse antivirus\n5. Desactivez les programmes au demarrage\n\nBesoin d'aide pour ces etapes ?",
                    "Pour accelerer votre PC :\n- Nettoyez les fichiers temporaires\n- Desinstallez les logiciels inutilises\n- Ajoutez de la RAM si possible\n- Verifiez la temperature du processeur\n\nUn technicien peut vous assister si necessaire."
                ]
            },
            "internet": {
                "patterns": ["pas internet", "wifi ne marche pas", "connexion internet", "deconnecte", "reseau", "pas de wifi", "internet lent"],
                "responses": [
                    "Probleme de connexion ? Essayez ceci :\n1. Redemarrez votre box/routeur\n2. Verifiez que le WiFi est active sur votre PC\n3. Oubliez le reseau WiFi et reconnectez-vous\n4. Testez avec un cable Ethernet\n\nToujours pas de connexion ?",
                    "Pour les problemes internet :\n- Redemarrez la box (debranchez 30 secondes)\n- Verifiez les voyants de la box\n- Testez sur un autre appareil\n- Contactez votre fournisseur d'acces\n\nJe peux creer un ticket pour un technicien si besoin."
                ]
            },
            "imprimante": {
                "patterns": ["imprimante", "imprimer", "impression", "n'imprime pas", "cartouche", "papier coincé", "bourrage"],
                "responses": [
                    "Probleme d'imprimante ? Verifiez :\n1. L'imprimante est allumee et connectee\n2. Le bac a papier n'est pas vide\n3. Les cartouches ne sont pas vides\n4. Pas de bourrage papier\n5. Le pilote est bien installe\n\nVous pouvez aussi envoyer une photo de l'imprimante au technicien.",
                    "Pour depanner votre imprimante :\n- Verifiez les connexions (USB ou WiFi)\n- Nettoyez les tetes d'impression\n- Verifiez le niveau d'encre\n- Redemarrez l'imprimante\n\nBesoin d'un technicien ?"
                ]
            },
            "commande_piece": {
                "patterns": ["commander piece", "piece detachee", "acheter piece", "ventilateur", "ecran cassé", "clavier cassé", "remplacer", "changer ecran", "batterie"],
                "responses": [
                    "Pour commander une piece detachee :\n1. Creez un ticket de maintenance\n2. Envoyez une photo de la piece\n3. Donnez la reference si vous l'avez\n\nUn technicien vous fera un devis rapidement.",
                    "Vous voulez commander une piece ?\n- Prenez une photo de la piece defectueuse\n- Notez le modele de votre appareil\n- Creez un ticket et envoyez les infos\n\nLe technicien vous repondra avec le prix et la disponibilite."
                ]
            },
            "remerciements": {
                "patterns": ["merci", "thanks", "super", "parfait", "ok merci", "ca marche", "d'accord merci"],
                "responses": [
                    "Avec plaisir ! N'hesitez pas si vous avez d'autres questions.",
                    "Je vous en prie ! Bonne journee.",
                    "Heureux d'avoir pu vous aider ! A bientot sur AM Info."
                ]
            },
            "default": {
                "responses": [
                    "Je n'ai pas bien compris votre demande. Pouvez-vous decrire plus precisement votre probleme ?\n\n(ex: ecran noir, pc lent, probleme wifi, commander une piece...)",
                    "Desole, je ne comprends pas. Essayez de decrire votre probleme en quelques mots cles : ecran, imprimante, internet, lenteur, piece detachee...",
                    "Pour mieux vous aider, pouvez-vous preciser ?\n- Quel appareil est concerne ?\n- Quel est le symptome exact ?\n- Depuis quand le probleme apparait ?"
                ]
            }
        }
    
    def get_response(self, message: str) -> str:
        message = message.lower().strip()
        
        # Chercher le meilleur match
        best_match = None
        best_score = 0
        
        for intent, data in self.knowledge_base.items():
            if intent == "default":
                continue
            score = self._match_score(message, data["patterns"])
            if score > best_score:
                best_score = score
                best_match = intent
        
        import random
        if best_match and best_score > 0:
            return random.choice(self.knowledge_base[best_match]["responses"])
        else:
            return random.choice(self.knowledge_base["default"]["responses"])
    
    def _match_score(self, message: str, patterns: list) -> int:
        score = 0
        for pattern in patterns:
            if pattern in message:
                score += 2
            # Verifier les mots individuels
            pattern_words = pattern.split()
            message_words = message.split()
            for pw in pattern_words:
                if pw in message_words:
                    score += 1
        return score

chatbot = ChatbotEngine()
