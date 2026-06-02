from typing import List, Dict, Any
from .base import RecommendationStrategy

class HybridStrategy(RecommendationStrategy):
    def __init__(self, strategies=None):
        self.strategies = strategies or []
    def get_name(self) -> str: return "hybrid"
    def get_weight(self) -> float: return 1.0
    def add_strategy(self, s): self.strategies.append(s)
    
    def get_recommendations(self, context: Dict[str, Any], limit: int = 10) -> List[Dict]:
        all_recs = {}
        for strategy in self.strategies:
            try:
                recs = strategy.get_recommendations(context, limit * 2)
                w = strategy.get_weight()
                for r in recs:
                    pid = r['product_id']
                    if pid not in all_recs:
                        all_recs[pid] = r
                        all_recs[pid]['score'] = r['score'] * w
                    else:
                        all_recs[pid]['score'] += r['score'] * w
            except: pass
        sorted_recs = sorted(all_recs.values(), key=lambda x: x['score'], reverse=True)
        return sorted_recs[:limit]
