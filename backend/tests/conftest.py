"""
Test configuration — in-memory SQLite database for isolated testing.

The key challenge is that main.py calls Base.metadata.create_all(bind=engine)
at module level, which tries to connect to the real PostgreSQL. We solve this
by patching the database module's engine BEFORE importing main.

We also set ALLOWED_HOSTS to include 'testserver' so the TrustedHostMiddleware
doesn't reject test requests.
"""

import sys
import os
import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

# Add backend dir to path so imports work
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Set test-friendly env vars BEFORE any app module is imported
os.environ["ALLOWED_HOSTS"] = "localhost,127.0.0.1,testserver"
os.environ["ALLOWED_ORIGINS"] = "http://testserver"
os.environ["ENVIRONMENT"] = "development"

# ── Create the test engine BEFORE importing anything that touches the DB ──
SQLALCHEMY_DATABASE_URL = "sqlite://"
test_engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=test_engine)

# Patch database module's engine and SessionLocal before main.py is imported
import database
database.engine = test_engine
database.SessionLocal = TestingSessionLocal

# NOW it's safe to import — main.py's create_all will use our SQLite engine
from database import Base, get_db
from models import Food, Nutrition, Allergen, Sustainability
from main import app
from fastapi.testclient import TestClient


def override_get_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()


app.dependency_overrides[get_db] = override_get_db


@pytest.fixture(autouse=True)
def setup_database():
    """Create tables before each test, drop after."""
    Base.metadata.create_all(bind=test_engine)
    yield
    Base.metadata.drop_all(bind=test_engine)


@pytest.fixture
def client():
    """FastAPI test client."""
    return TestClient(app)


@pytest.fixture
def db():
    """Raw DB session for seeding test data."""
    session = TestingSessionLocal()
    try:
        yield session
    finally:
        session.close()


def seed_food(db, name, category="Lunch", nutrition_score=80,
              calories=300, protein=15, fat=8, carbs=40, fiber=5,
              sugar=3, sodium=200, dairy=False, nuts=False, gluten=False,
              soy=False, eggs=False, shellfish=False,
              carbon=2.0, water=50.0, land=1.0, sus_score=75,
              alt_id=None):
    """Helper to insert a fully-formed food item into the test DB."""
    food = Food(
        name=name,
        brand="Test Brand",
        category=category,
        image="/test.png",
        description=f"Test {name}",
        serving_size="100g",
        price_range="$",
        nutrition_score=nutrition_score,
        sustainability_score=sus_score,
        healthy_alternative_id=alt_id,
    )
    db.add(food)
    db.flush()  # get food.id

    db.add(Nutrition(
        food_id=food.id, calories=calories, protein=protein,
        fat=fat, carbohydrates=carbs, fiber=fiber,
        sugar=sugar, sodium=sodium,
    ))
    db.add(Allergen(
        food_id=food.id, dairy=dairy, nuts=nuts, gluten=gluten,
        soy=soy, eggs=eggs, shellfish=shellfish,
    ))
    db.add(Sustainability(
        food_id=food.id, carbon_footprint=carbon, water_usage=water,
        land_use=land, sustainability_score=sus_score,
    ))
    db.commit()
    db.refresh(food)
    return food
