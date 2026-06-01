from app.database import SessionLocal
from app.models import Product, CartItem, OrderItem

db = SessionLocal()

# Supprimer les items de commande et panier
db.query(OrderItem).delete()
db.query(CartItem).delete()

# Supprimer tous les anciens produits
db.query(Product).delete()

db.commit()
db.close()
print("Anciens produits supprimes !")
