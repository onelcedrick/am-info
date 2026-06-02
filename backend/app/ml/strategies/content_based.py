from sqlalchemy.orm import Session
from typing import List, Dict, Any
from .base import RecommendationStrategy
from ...models import Product

class ContentBasedStrategy(RecommendationStrategy):
    def get_name(self) -> str: return "content_based"
    def get_weight(self) -> float: return 0.4
    
    def get_recommendations(self, context: Dict[str, Any], limit: int = 10) -> List[Dict]:
        db = context.get('db')
        category = context.get('category')
        product_id = context.get('product_id')
        if not db or not category: return []
        
        products = db.query(Product).filter(Product.is_visible == True, Product.stock_quantity > 0, Product.category == category)
        if product_id: products = products.filter(Product.id != product_id)
        products = products.order_by(Product.created_at.desc()).limit(limit).all()
        
        recs = []
        for p in products:
            recs.append({"product_id": str(p.id), "name": p.name, "price": float(p.price), "category": p.category, "image_url": p.image_url, "score": 0.8, "strategy": "content_based", "reason": f"Categorie: {category}"})
        return recs
