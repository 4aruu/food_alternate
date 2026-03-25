from sqlalchemy import Boolean, Column, ForeignKey, Integer, String, Float
from sqlalchemy.orm import relationship
from database import Base


class Food(Base):
    __tablename__ = "foods"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    brand = Column(String)
    category = Column(String)
    image = Column(String)
    description = Column(String)
    serving_size = Column(String)
    price_range = Column(String)

    # Scores
    nutrition_score = Column(Integer)
    sustainability_score = Column(Integer)

    # Relationships
    nutrition = relationship("Nutrition", uselist=False, back_populates="food", cascade="all, delete-orphan")
    allergens = relationship("Allergen", uselist=False, back_populates="food", cascade="all, delete-orphan")
    sustainability = relationship("Sustainability", uselist=False, back_populates="food", cascade="all, delete-orphan")

    # --- ⭐ NEW: THE INTELLIGENT LINK ---
    # This stores the ID of the better food option
    healthy_alternative_id = Column(Integer, ForeignKey("foods.id"), nullable=True)

    # This allows us to access food.healthy_alternative.name easily
    healthy_alternative = relationship("Food", remote_side=[id])


# ... (Keep Nutrition, Allergen, and Sustainability classes exactly as they were) ...
# (If you need those pasted below, let me know, but they don't change).
class Nutrition(Base):
    __tablename__ = "nutrition"
    id = Column(Integer, primary_key=True, index=True)
    food_id = Column(Integer, ForeignKey("foods.id"))
    calories = Column(Float)
    protein = Column(Float)
    fat = Column(Float)
    carbohydrates = Column(Float)
    fiber = Column(Float)
    sugar = Column(Float)
    sodium = Column(Float)
    food = relationship("Food", back_populates="nutrition")


class Allergen(Base):
    __tablename__ = "allergens"
    id = Column(Integer, primary_key=True, index=True)
    food_id = Column(Integer, ForeignKey("foods.id"))
    dairy = Column(Boolean, default=False)
    nuts = Column(Boolean, default=False)
    gluten = Column(Boolean, default=False)
    soy = Column(Boolean, default=False)
    eggs = Column(Boolean, default=False)
    shellfish = Column(Boolean, default=False)
    food = relationship("Food", back_populates="allergens")


class Sustainability(Base):
    __tablename__ = "sustainability"
    id = Column(Integer, primary_key=True, index=True)
    food_id = Column(Integer, ForeignKey("foods.id"))
    carbon_footprint = Column(Float)
    water_usage = Column(Float)
    land_use = Column(Float)
    sustainability_score = Column(Integer)
    food = relationship("Food", back_populates="sustainability")