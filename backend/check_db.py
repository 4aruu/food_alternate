from database import SessionLocal
from models import Food

db = SessionLocal()
foods = db.query(Food).all()

print(f"Total items found: {len(foods)}")
for food in foods:
    print(f"- {food.name}")