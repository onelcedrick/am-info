from app.database import SessionLocal
from app.models import User
from app.auth.service import hash_password

db = SessionLocal()

# Créer admin
admin = User(
    email="admin@aminfo.mg",
    full_name="Admin AM Info",
    password_hash=hash_password("admin123"),
    role="admin"
)
db.add(admin)

# Créer technicien
tech = User(
    email="tech@aminfo.mg",
    full_name="Technicien AM Info",
    password_hash=hash_password("tech123"),
    role="technician"
)
db.add(tech)

# Créer client
client = User(
    email="client@aminfo.mg",
    full_name="Client Test",
    password_hash=hash_password("client123"),
    role="client"
)
db.add(client)

# Ajouter des produits
from app.models import Product
products = [
    Product(name="Écran 24\" Full HD", description="Écran LED Full HD", price=150000, stock_quantity=15, category="Écrans", image_url="🖥️"),
    Product(name="Clavier Mécanique RGB", description="Clavier gaming", price=45000, stock_quantity=30, category="Périphériques", image_url="⌨️"),
    Product(name="Souris Sans Fil", description="Souris ergonomique", price=25000, stock_quantity=50, category="Périphériques", image_url="🖱️"),
    Product(name="Imprimante Laser", description="Imprimante rapide", price=200000, stock_quantity=8, category="Imprimantes", image_url="🖨️"),
    Product(name="Disque SSD 1To", description="Stockage rapide", price=80000, stock_quantity=25, category="Stockage", image_url="💾"),
]
for p in products:
    db.add(p)

db.commit()
db.close()
print("✅ Données de test créées !")
