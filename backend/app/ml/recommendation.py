from sqlalchemy.orm import Session
from typing import Dict, Any, List
from .strategies.factory import RecommendationFactory

class RecommendationEngine:
    def __init__(self):
        self.factory = RecommendationFactory()
    
    def get_recommendations(self, db: Session, context: Dict[str, Any] = None, limit: int = 10) -> List[Dict]:
        context = context or {}
        context['db'] = db
        if context.get('product_id'):
            strategy = self.factory.create_for_product()
        else:
            strategy = self.factory.create_for_homepage()
        return strategy.get_recommendations(context, limit)

engine = RecommendationEngine()
