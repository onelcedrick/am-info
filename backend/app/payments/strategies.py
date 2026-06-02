# -*- coding: utf-8 -*-
"""
Strategy Pattern : Chaque methode de paiement a sa propre strategie de verification
"""
from abc import ABC, abstractmethod
import random
from datetime import datetime

class PaymentStrategy(ABC):
    """Strategie de paiement (interface)"""
    
    @abstractmethod
    def generate_reference(self, order_id: str) -> str:
        pass
    
    @abstractmethod
    def verify_payment(self, reference: str, amount: float, phone: str) -> dict:
        pass
    
    @abstractmethod
    def get_method_name(self) -> str:
        pass

class MVolaStrategy(PaymentStrategy):
    def generate_reference(self, order_id: str) -> str:
        return f"MVOLA-{order_id[:8].upper()}-{datetime.now().strftime('%m%d%H%M')}"
    
    def verify_payment(self, reference: str, amount: float, phone: str) -> dict:
        # Simulation : MVola verifie via API
        success = random.random() > 0.1  # 90% de reussite
        return {
            "verified": success,
            "reference": reference,
            "method": "MVola",
            "amount": amount,
            "phone": phone,
            "message": "Paiement MVola confirme" if success else "Paiement MVola en attente de confirmation",
            "transaction_id": f"MV-{random.randint(100000, 999999)}"
        }
    
    def get_method_name(self) -> str:
        return "MVola"

class OrangeMoneyStrategy(PaymentStrategy):
    def generate_reference(self, order_id: str) -> str:
        return f"OM-{order_id[:8].upper()}-{datetime.now().strftime('%m%d%H%M')}"
    
    def verify_payment(self, reference: str, amount: float, phone: str) -> dict:
        success = random.random() > 0.1
        return {
            "verified": success,
            "reference": reference,
            "method": "Orange Money",
            "amount": amount,
            "phone": phone,
            "message": "Paiement Orange Money confirme" if success else "Paiement Orange Money en attente",
            "transaction_id": f"OM-{random.randint(100000, 999999)}"
        }
    
    def get_method_name(self) -> str:
        return "Orange Money"

class AirtelMoneyStrategy(PaymentStrategy):
    def generate_reference(self, order_id: str) -> str:
        return f"AIRTEL-{order_id[:8].upper()}-{datetime.now().strftime('%m%d%H%M')}"
    
    def verify_payment(self, reference: str, amount: float, phone: str) -> dict:
        success = random.random() > 0.1
        return {
            "verified": success,
            "reference": reference,
            "method": "Airtel Money",
            "amount": amount,
            "phone": phone,
            "message": "Paiement Airtel Money confirme" if success else "Paiement Airtel Money en attente",
            "transaction_id": f"AM-{random.randint(100000, 999999)}"
        }
    
    def get_method_name(self) -> str:
        return "Airtel Money"

# Factory pour choisir la strategie
class PaymentStrategyFactory:
    _strategies = {
        "mvola": MVolaStrategy(),
        "orange_money": OrangeMoneyStrategy(),
        "airtel_money": AirtelMoneyStrategy()
    }
    
    @classmethod
    def get_strategy(cls, method: str) -> PaymentStrategy:
        strategy = cls._strategies.get(method)
        if not strategy:
            raise ValueError(f"Methode de paiement invalide: {method}")
        return strategy
