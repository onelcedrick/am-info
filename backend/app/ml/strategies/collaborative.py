from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Dict, Any
from .base import RecommendationStrategy
from ...models import OrderItem, Order, Product

class CollaborativeStrategy(RecommendationStrategy):
    def get_name(self) -> str: return "collaborative"
    def get_weight(self) -> float: return 0.3
    
    def get_recommendations(self, context: Dict[str, Any], limit: int = 10) -> List[Dict]:
        db = context.get('db')
        product_id = context.get('product_id')
        if not db or not product_id: return []
        
        order_ids = db.query(OrderItem.order_id).filter(OrderItem.product_id == product_id).subquery()
        results = db.query(Product, func.count(OrderItem.id).label('cnt')
        ).join(OrderItem, Product.id == OrderItem.product_id
        ).filter(OrderItem.order_id.in_(order_ids), Product.id != product_id, Product.is_visible == True, Product.stock_quantity > 0
        ).group_by(Product.id).order_by(func.count(OrderItem.id).desc()).limit(limit).all()
        
        max_cnt = max([c for _, c in results]) if results else 1
        recs = []
        for p, cnt in results:
            recs.append({"product_id": str(p.id), "name": p.name, "price": float(p.price), "category": p.category, "image_url": p.image_url, "score": round(cnt/max_cnt, 3), "strategy": "collaborative", "reason": f"Achete ensemble ({cnt}x)"})
        return recs
