# -*- coding: utf-8 -*-
from abc import ABC, abstractmethod
from typing import List, Dict, Any
from sqlalchemy.orm import Session
from sqlalchemy import func
from ..models import Product, OrderItem

class ComparisonStrategy(ABC):
    @abstractmethod
    def compare(self, products: List[Product], db: Session) -> Dict[str, Any]: pass
    @abstractmethod
    def get_name(self) -> str: pass

class PriceComparison(ComparisonStrategy):
    def get_name(self) -> str: return "price"
    def compare(self, products, db):
        prices = [float(p.price) for p in products]
        return {"name": "Prix", "icon": "price", "type": "price", "values": [f"{p:,.0f} Ar" for p in prices], "best_index": prices.index(min(prices)), "analysis": f"Moins cher: {min(prices):,.0f} Ar"}

class StockComparison(ComparisonStrategy):
    def get_name(self) -> str: return "stock"
    def compare(self, products, db):
        stocks = [p.stock_quantity for p in products]
        return {"name": "Stock disponible", "icon": "stock", "type": "stock", "values": [f"{s} unites" for s in stocks], "best_index": stocks.index(max(stocks)), "analysis": f"Meilleure dispo: {max(stocks)} unites"}

class PopularityComparison(ComparisonStrategy):
    def get_name(self) -> str: return "popularity"
    def compare(self, products, db):
        pops = []
        for p in products:
            qty = db.query(func.coalesce(func.sum(OrderItem.quantity), 0)).filter(OrderItem.product_id == p.id).scalar()
            pops.append(int(qty))
        max_pop = max(pops) if pops else 1
        return {"name": "Popularite", "icon": "popularity", "type": "popularity", "values": [f"{q} ventes" for q in pops], "best_index": pops.index(max(pops)) if max_pop > 0 else -1, "analysis": f"Plus vendu: {max_pop} ventes" if max_pop > 0 else "Pas encore de ventes"}

class ComparisonFactory:
    _strategies = {"price": PriceComparison(), "stock": StockComparison(), "popularity": PopularityComparison()}
    @classmethod
    def get_all(cls): return list(cls._strategies.values())

class ProductComparator:
    def __init__(self): self.strategies = ComparisonFactory.get_all()
    
    def compare_products(self, db: Session, product_ids: List[str]) -> Dict[str, Any]:
        products = []
        for pid in product_ids[:4]:
            p = db.query(Product).filter(Product.id == pid).first()
            if p: products.append(p)
        
        if len(products) < 2:
            return {"error": "Il faut au moins 2 produits"}
        
        # Verifier que tous les produits sont dans la meme categorie
        categories = set(p.category for p in products if p.category)
        if len(categories) > 1:
            return {"error": "Les produits doivent etre dans la meme categorie pour etre compares"}
        
        product_infos = [{
            "id": str(p.id), "name": p.name, "price": float(p.price),
            "category": p.category, "image_url": p.image_url,
            "stock": p.stock_quantity, "description": p.description
        } for p in products]
        
        results = []
        scores = [0] * len(products)
        for strategy in self.strategies:
            try:
                r = strategy.compare(products, db)
                results.append(r)
                if r["best_index"] >= 0: scores[r["best_index"]] += 1
            except: pass
        
        best_index = scores.index(max(scores)) if max(scores) > 0 else -1
        return {
            "products": product_infos,
            "comparisons": results,
            "winner_index": best_index,
            "winner_reason": f"'{product_infos[best_index]['name']}' est le meilleur choix sur {max(scores)} criteres" if best_index >= 0 else "Pas de gagnant clair"
        }

comparator = ProductComparator()
