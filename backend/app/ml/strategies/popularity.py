from sqlalchemy.orm import Session
from sqlalchemy import func, desc
from typing import List, Dict, Any
from .base import RecommendationStrategy
from ...models import OrderItem, Order, Product
from ...redis_client import cache

class PopularityStrategy(RecommendationStrategy):
    def get_name(self) -> str: return "popularity"
    def get_weight(self) -> float: return 1.0  # Poids max quand utilise seul
    
    def get_recommendations(self, context: Dict[str, Any], limit: int = 10) -> List[Dict]:
        db = context.get('db')
        if not db: return []
        
        cache_key = f"rec:pop:{limit}"
        cached = cache.get(cache_key)
        if cached: return cached
        
        results = db.query(
            Product, 
            func.coalesce(func.sum(OrderItem.quantity), 0).label('qty'),
            func.coalesce(func.count(func.distinct(OrderItem.order_id)), 0).label('cnt')
        ).outerjoin(OrderItem, Product.id == OrderItem.product_id
        ).outerjoin(Order, OrderItem.order_id == Order.id
        ).filter(
            Product.is_visible == True, 
            Product.stock_quantity > 0
        ).group_by(Product.id
        ).order_by(desc('qty'), desc('cnt')
        ).limit(limit).all()
        
        max_qty = max([qty for _, qty, _ in results]) if results else 1
        
        recs = []
        for p, qty, cnt in results:
            # Score normalise entre 0 et 1
            score = round(qty / max(max_qty, 1), 3) if max_qty > 0 else 0.5
            
            reason = f"{int(qty)} vendus" if qty > 0 else "Nouveau produit"
            
            recs.append({
                "product_id": str(p.id), 
                "name": p.name, 
                "price": float(p.price), 
                "category": p.category, 
                "image_url": p.image_url, 
                "score": score, 
                "strategy": self.get_name(), 
                "reason": reason
            })
        
        cache.set(cache_key, recs, ttl=600)
        return recs
