# -*- coding: utf-8 -*-
from abc import ABC, abstractmethod
from typing import List, Dict, Any

class RecommendationStrategy(ABC):
    @abstractmethod
    def get_recommendations(self, context: Dict[str, Any], limit: int = 10) -> List[Dict]:
        pass
    @abstractmethod
    def get_name(self) -> str:
        pass
    def get_weight(self) -> float:
        return 0.3
