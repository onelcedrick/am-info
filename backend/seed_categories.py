from app.database import SessionLocal
from app.models import Category

db = SessionLocal()

categories = ["Ecrans", "Peripheriques", "Imprimantes", "Stockage", "Composants", "Cables", "Reseau", "Accessoires"]

for name in categories:
    existing = db.query(Category).filter(Category.name == name).first()
    if not existing:
        db.add(Category(name=name))

db.commit()
db.close()
print("Categories creees !")
