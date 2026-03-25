from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import or_, and_, desc
from typing import List, Optional
from database import get_db
from models import Food, Nutrition, Allergen, Sustainability
from schemas import FoodSchema
from pydantic import BaseModel

# Note: No external AI imports needed anymore!

router = APIRouter(prefix="/foods", tags=["foods"])

# --- 🔍 CRITICAL FIX: MAP FRONTEND TERMS TO DB COLUMNS ---
# The frontend sends "fish", but your database column is likely "shellfish"
ALLERGEN_MAP = {
    "fish": "shellfish",  # Fixes the "No Fish" bug
    "seafood": "shellfish",  # Handles "Seafood" selection too
    "dairy": "dairy",
    "gluten": "gluten",
    "nuts": "nuts",
    "soy": "soy",
    "eggs": "eggs"
}


# 1. Get ALL Foods
@router.get("/", response_model=List[FoodSchema])
def get_foods(db: Session = Depends(get_db)):
    return db.query(Food).options(
        joinedload(Food.nutrition),
        joinedload(Food.allergens),
        joinedload(Food.sustainability)
    ).all()


# 2. Search Foods
@router.get("/search", response_model=List[FoodSchema])
def search_foods(q: str, db: Session = Depends(get_db)):
    search = f"%{q}%"
    return db.query(Food).options(
        joinedload(Food.nutrition),
        joinedload(Food.allergens),
        joinedload(Food.sustainability)
    ).filter(
        (Food.name.ilike(search)) | (Food.category.ilike(search))
    ).all()


# 3. Get Single Food Details
@router.get("/{food_id}", response_model=FoodSchema)
def get_food_detail(food_id: int, db: Session = Depends(get_db)):
    food = db.query(Food).options(
        joinedload(Food.nutrition),
        joinedload(Food.allergens),
        joinedload(Food.sustainability)
    ).filter(Food.id == food_id).first()

    if not food:
        raise HTTPException(status_code=404, detail="Food not found")
    return food


# --- IMPROVED RECOMMENDATION ENGINE ---
@router.get("/{food_id}/alternatives", response_model=List[FoodSchema])
def get_alternatives(
        food_id: int,
        health_goal: Optional[str] = None,
        avoid: List[str] = Query(default=[]),
        db: Session = Depends(get_db)
):
    original = db.query(Food).filter(Food.id == food_id).first()
    if not original:
        raise HTTPException(status_code=404, detail="Food not found")

    # 1. SMART CATEGORY GROUPING
    MEAL_CATEGORIES = [
        "Lunch", "Dinner", "Main Course", "Chinese", "Indian", "Arabic",
        "Fast Food", "Restaurant/Global", "Kerala Native", "Continental"
    ]
    SNACK_CATEGORIES = ["Snack", "Dessert"]
    BREAKFAST_CATEGORIES = ["Breakfast"]
    DRINK_CATEGORIES = ["Drink"]
    SIDE_CATEGORIES = ["Side Dish"]

    target_categories = [original.category]

    if original.category in MEAL_CATEGORIES:
        target_categories = MEAL_CATEGORIES
    elif original.category in SNACK_CATEGORIES:
        target_categories = SNACK_CATEGORIES
    elif original.category in BREAKFAST_CATEGORIES:
        target_categories = BREAKFAST_CATEGORIES
    elif original.category in DRINK_CATEGORIES:
        target_categories = DRINK_CATEGORIES
    elif original.category in SIDE_CATEGORIES:
        target_categories = SIDE_CATEGORIES

    # 2. BASE QUERY
    query = db.query(Food).options(
        joinedload(Food.nutrition),
        joinedload(Food.allergens),
        joinedload(Food.sustainability)
    ).join(Nutrition).join(Allergen).filter(
        Food.id != original.id,
        Food.category.in_(target_categories)
    )

    # 3. STRICT ALLERGEN FILTER (Fixed with Map)
    for allergen in avoid:
        # Translate the term (e.g., "fish" -> "shellfish")
        db_col_name = ALLERGEN_MAP.get(allergen.lower(), allergen.lower())

        allergen_col = getattr(Allergen, db_col_name, None)
        if allergen_col:
            query = query.filter(allergen_col == False)

    # 4. GOAL-BASED OPTIMIZATION
    if health_goal == "diabetic":
        query = query.filter(Nutrition.sugar < 5, Nutrition.fiber > 2).order_by(Nutrition.sugar.asc(),
                                                                                Nutrition.fiber.desc())
    elif health_goal == "heart":
        query = query.filter(Nutrition.sodium < 400, Nutrition.fat < 10).order_by(Nutrition.sodium.asc())
    elif health_goal == "weight":
        query = query.filter(Nutrition.calories < 400).order_by(Nutrition.calories.asc(), Nutrition.protein.desc())
    elif health_goal == "muscle":
        query = query.order_by(Nutrition.protein.desc(), Nutrition.calories.asc())
    else:
        query = query.order_by(Food.nutrition_score.desc())

    # 5. EXECUTE & FALLBACK
    results = query.limit(3).all()

    # Fallback: Relax health goals, but NEVER relax safety (Allergens)
    if len(results) == 0 and health_goal:
        fallback_query = db.query(Food).join(Nutrition).join(Allergen).filter(
            Food.id != original.id,
            Food.category.in_(target_categories)
        )

        # Re-apply allergen safety (Using the Map again)
        for allergen in avoid:
            db_col_name = ALLERGEN_MAP.get(allergen.lower(), allergen.lower())
            allergen_col = getattr(Allergen, db_col_name, None)
            if allergen_col:
                fallback_query = fallback_query.filter(allergen_col == False)

        if health_goal == "diabetic":
            fallback_query = fallback_query.order_by(Nutrition.sugar.asc())
        elif health_goal == "heart":
            fallback_query = fallback_query.order_by(Nutrition.sodium.asc())
        elif health_goal == "weight":
            fallback_query = fallback_query.order_by(Nutrition.calories.asc())
        elif health_goal == "muscle":
            fallback_query = fallback_query.order_by(Nutrition.protein.desc())

        results = fallback_query.limit(3).all()

    return results


# --- ⭐ SMART "MOCK AI" ENDPOINT ⭐ ---

class SwapRequest(BaseModel):
    original: str
    alternative: str


@router.post("/explain-swap")
async def explain_swap(request: SwapRequest, db: Session = Depends(get_db)):
    """
    Deterministically generates a "smart" reason for the swap based on real nutrition data.
    """

    # Simple check to prevent empty requests
    if not request.original or not request.alternative:
        return {"explanation": "Swapping to a healthier alternative is always a good choice!"}

    original_food = db.query(Food).filter(Food.name == request.original).first()
    alt_food = db.query(Food).filter(Food.name == request.alternative).first()

    msg = f"{request.alternative} is generally a better choice for your lifestyle."

    if original_food and alt_food and original_food.nutrition and alt_food.nutrition:
        o_n = original_food.nutrition
        a_n = alt_food.nutrition

        if o_n.sugar > a_n.sugar:
            diff = int(o_n.sugar - a_n.sugar)
            msg = f"Significantly healthier choice with {diff}g less sugar per serving."
        elif o_n.calories > a_n.calories:
            diff = int(o_n.calories - a_n.calories)
            msg = f"Helps manage your weight goals by saving you {diff} calories."
        elif a_n.protein > o_n.protein:
            diff = int(a_n.protein - o_n.protein)
            msg = f"A powerful swap that provides {diff}g more protein for muscle recovery."
        elif o_n.sodium > a_n.sodium:
            msg = "Better for your heart health due to significantly lower sodium levels."
        elif alt_food.sustainability_score > original_food.sustainability_score:
            msg = "A more sustainable choice with a lower carbon footprint."

    return {"explanation": msg}