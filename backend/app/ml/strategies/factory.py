from .popularity import PopularityStrategy
from .content_based import ContentBasedStrategy
from .collaborative import CollaborativeStrategy
from .hybrid import HybridStrategy

class RecommendationFactory:
    @staticmethod
    def create_default():
        return HybridStrategy([PopularityStrategy(), ContentBasedStrategy(), CollaborativeStrategy()])
    
    @staticmethod
    def create_for_product():
        return HybridStrategy([ContentBasedStrategy(), CollaborativeStrategy(), PopularityStrategy()])
    
    @staticmethod
    def create_for_homepage():
        return HybridStrategy([PopularityStrategy(), ContentBasedStrategy()])
