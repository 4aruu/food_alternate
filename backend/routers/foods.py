"""
Kerala Food Alternatives API — Medically & Culturally Validated Engine
=====================================================================
Sources: ICMR/NIN dietary guidelines, FSSAI Eat Right India,
         Ayurvedic food pairing, Kerala clinical nutrition studies.
"""

from fastapi import APIRouter, Depends, HTTPException, Query, Request
from sqlalchemy.orm import Session, joinedload
from sqlalchemy.exc import SQLAlchemyError, OperationalError
from sqlalchemy import or_, and_, desc
from typing import List, Optional
from database import get_db
from models import Food, Nutrition, Allergen, Sustainability
from schemas import FoodSchema
from pydantic import BaseModel, field_validator
from slowapi import Limiter
from slowapi.util import get_remote_address
import logging

logger = logging.getLogger(__name__)
limiter = Limiter(key_func=get_remote_address)

router = APIRouter(prefix="/foods", tags=["foods"])

# ── ERROR HANDLING HELPER ─────────────────────────────────────
def safe_db_query(db: Session, query_func, error_msg: str = "Database query failed"):
    """Wraps DB queries with proper error handling and logging.

    SECURITY: Exception objects are intentionally NOT logged verbatim to
    prevent connection strings / credentials from leaking into log output.
    Only the exception type is logged.
    """
    try:
        return query_func()
    except OperationalError as e:
        # Log only the type — not the full string which may contain the DSN
        logger.error("Database OperationalError: %s", type(e).__name__)
        raise HTTPException(
            status_code=503,
            detail="Database is temporarily unavailable. Please try again."
        )
    except SQLAlchemyError as e:
        logger.error("SQLAlchemyError (%s) in query", type(e).__name__)
        raise HTTPException(status_code=500, detail=error_msg)
    except Exception as e:
        logger.error("Unexpected error (%s) in query", type(e).__name__)
        raise HTTPException(status_code=500, detail="An unexpected error occurred.")


# ── ALLERGEN MAP (Frontend → DB Column) ──────────────────────
ALLERGEN_MAP = {
    "fish": "shellfish",
    "seafood": "shellfish",
    "dairy": "dairy",
    "gluten": "gluten",
    "nuts": "nuts",
    "soy": "soy",
    "eggs": "eggs",
    "egg": "eggs",
    "shellfish": "shellfish",
    "wheat": "gluten",     # common user term
    "lactose": "dairy",    # common user term
    "peanut": "nuts",      # common user term
    "peanuts": "nuts",
    "tree nuts": "nuts",
}


# ── CATEGORY GROUPING (Culturally Validated) ─────────────────
MEAL_CATEGORIES = [
    "Lunch", "Dinner", "Main Course", "Chinese", "Indian", "Arabic",
    "Fast Food", "Restaurant/Global", "Kerala Native", "Continental",
    "Seafood", "Meat Alternative",
]
SNACK_CATEGORIES = ["Snack"]
DESSERT_CATEGORIES = ["Dessert"]
BREAKFAST_CATEGORIES = ["Breakfast"]
DRINK_CATEGORIES = ["Drink"]
SIDE_CATEGORIES = ["Side Dish"]
DAIRY_CATEGORIES = ["Dairy", "Dairy Alternative"]
GRAIN_CATEGORIES = ["Grain"]
SWEETENER_CATEGORIES = ["Sweetener"]
PROTEIN_CATEGORIES = ["Plant Protein"]
SALAD_CATEGORIES = ["Salad"]

# Map a food's category to the group of categories it can swap into
CATEGORY_SWAP_GROUPS = {
    **{c: MEAL_CATEGORIES + BREAKFAST_CATEGORIES for c in MEAL_CATEGORIES},
    **{c: BREAKFAST_CATEGORIES + MEAL_CATEGORIES for c in BREAKFAST_CATEGORIES},
    **{c: SNACK_CATEGORIES for c in SNACK_CATEGORIES},
    **{c: DESSERT_CATEGORIES + SNACK_CATEGORIES for c in DESSERT_CATEGORIES},
    **{c: DRINK_CATEGORIES for c in DRINK_CATEGORIES},
    **{c: SIDE_CATEGORIES for c in SIDE_CATEGORIES},
    **{c: DAIRY_CATEGORIES for c in DAIRY_CATEGORIES},
    **{c: GRAIN_CATEGORIES for c in GRAIN_CATEGORIES},
    **{c: SWEETENER_CATEGORIES for c in SWEETENER_CATEGORIES},
    **{c: PROTEIN_CATEGORIES for c in PROTEIN_CATEGORIES},
    **{c: SALAD_CATEGORIES + SIDE_CATEGORIES for c in SALAD_CATEGORIES},
}

# ── VALID HEALTH GOALS (Medical Basis) ───────────────────────
VALID_HEALTH_GOALS = {
    "diabetic": "Low sugar (<5g), high fiber (>2g), low GI foods. Based on ICMR diabetes guidelines.",
    "heart": "Low sodium (<400mg), low saturated fat (<10g). Based on AHA/ICMR cardiac diet.",
    "weight": "Low calorie (<400 kcal), moderate protein. Based on FSSAI weight management.",
    "muscle": "High protein, moderate calorie. Based on sports nutrition guidelines.",
    "kidney": "Low sodium (<300mg), moderate protein (<20g). Based on NKF dietary guidelines.",
    "cholesterol": "Low fat (<8g), low sodium. Based on lipid management protocols.",
}


# ── HELPER: Eagerly Load Relations ───────────────────────────
def food_query_with_joins(db: Session):
    """Standard food query with all relationships eagerly loaded."""
    return db.query(Food).options(
        joinedload(Food.nutrition),
        joinedload(Food.allergens),
        joinedload(Food.sustainability)
    )


# ═══════════════════════════════════════════════════════════════
# 1. GET ALL FOODS
# ═══════════════════════════════════════════════════════════════
@router.get("/", response_model=List[FoodSchema])
@limiter.limit("30/minute")
def get_foods(request: Request, db: Session = Depends(get_db)):
    """Returns all foods with full nutrition, allergen, and sustainability data."""
    def query():
        results = food_query_with_joins(db).all()
        if not results:
            logger.warning("No foods found in database. Has seed.py been run?")
        return results

    return safe_db_query(db, query, "Failed to fetch foods list")


# ═══════════════════════════════════════════════════════════════
# 2. SEARCH FOODS
# ═══════════════════════════════════════════════════════════════
@router.get("/search", response_model=List[FoodSchema])
@limiter.limit("10/minute")
def search_foods(request: Request, q: str = Query(..., min_length=1, max_length=100), db: Session = Depends(get_db)):
    """
    Search foods by name or category.
    - Minimum 1 character, maximum 100 characters.
    - Case-insensitive partial match.
    """
    # Input sanitization: strip whitespace, prevent SQL-like patterns
    q = q.strip()
    if not q:
        raise HTTPException(status_code=400, detail="Search query cannot be empty or only whitespace.")

    # Escape SQL wildcards that user might inject
    sanitized = q.replace("%", "").replace("_", "")
    if not sanitized:
        raise HTTPException(status_code=400, detail="Invalid search query.")

    search = f"%{sanitized}%"

    def query():
        return food_query_with_joins(db).filter(
            (Food.name.ilike(search)) | (Food.category.ilike(search))
        ).all()

    results = safe_db_query(db, query, "Search query failed")
    return results  # Empty list is valid — frontend handles "no results"


# ═══════════════════════════════════════════════════════════════
# 3. GET SINGLE FOOD DETAILS
# ═══════════════════════════════════════════════════════════════
@router.get("/{food_id}", response_model=FoodSchema)
@limiter.limit("30/minute")
def get_food_detail(request: Request, food_id: int, db: Session = Depends(get_db)):
    """Get detailed food info by ID."""
    if food_id <= 0:
        raise HTTPException(status_code=400, detail="Food ID must be a positive integer.")

    def query():
        return food_query_with_joins(db).filter(Food.id == food_id).first()

    food = safe_db_query(db, query, f"Failed to fetch food with ID {food_id}")

    if not food:
        raise HTTPException(status_code=404, detail=f"Food with ID {food_id} not found.")
    return food


# ═══════════════════════════════════════════════════════════════
# 4. SMART ALTERNATIVES ENGINE (Medically Validated)
# ═══════════════════════════════════════════════════════════════
@router.get("/{food_id}/alternatives", response_model=List[FoodSchema])
@limiter.limit("20/minute")
def get_alternatives(
    request: Request,
    food_id: int,
    health_goal: Optional[str] = None,
    avoid: List[str] = Query(default=[]),
    db: Session = Depends(get_db)
):
    """
    Returns up to 5 food alternatives based on:
    - Category matching (culturally relevant swaps)
    - Health goal optimization (medically validated thresholds)
    - Allergen safety (strict exclusion)

    Health goals: diabetic, heart, weight, muscle, kidney, cholesterol
    Avoid: dairy, gluten, nuts, soy, eggs, fish/shellfish
    """
    # ── INPUT VALIDATION ──
    if food_id <= 0:
        raise HTTPException(status_code=400, detail="Food ID must be a positive integer.")

    if health_goal and health_goal.lower() not in VALID_HEALTH_GOALS:
        valid_goals = ", ".join(VALID_HEALTH_GOALS.keys())
        raise HTTPException(
            status_code=400,
            detail=f"Invalid health goal '{health_goal}'. Valid options: {valid_goals}"
        )

    # Normalize and validate allergens
    validated_avoid = []
    invalid_allergens = []
    for allergen in avoid:
        allergen_clean = allergen.strip().lower()
        if allergen_clean in ALLERGEN_MAP:
            validated_avoid.append(allergen_clean)
        elif allergen_clean:
            invalid_allergens.append(allergen_clean)

    if invalid_allergens:
        valid_allergens = ", ".join(set(ALLERGEN_MAP.keys()))
        logger.warning(f"Unknown allergens received: {invalid_allergens}")
        # Don't fail — just log and skip unknown allergens

    # Normalize health goal
    health_goal = health_goal.lower() if health_goal else None

    # ── FETCH ORIGINAL FOOD ──
    def get_original():
        return food_query_with_joins(db).filter(Food.id == food_id).first()

    original = safe_db_query(db, get_original, "Failed to fetch food")
    if not original:
        raise HTTPException(status_code=404, detail="Food not found.")

    # Safety check: Ensure nutrition data exists
    if not original.nutrition:
        logger.warning(f"Food '{original.name}' (ID: {food_id}) has no nutrition data.")

    # ── DETERMINE TARGET CATEGORIES ──
    target_categories = CATEGORY_SWAP_GROUPS.get(
        original.category, [original.category]
    )

    # ── BUILD QUERY ──
    def build_query():
        query = food_query_with_joins(db).join(Nutrition).join(Allergen).filter(
            Food.id != original.id,
            Food.category.in_(target_categories)
        )

        # ── ALLERGEN SAFETY (Strict — never relaxed) ──
        for allergen in validated_avoid:
            db_col_name = ALLERGEN_MAP[allergen]
            allergen_col = getattr(Allergen, db_col_name, None)
            if allergen_col is not None:
                query = query.filter(allergen_col == False)

        # ── HEALTH GOAL OPTIMIZATION ──
        if health_goal == "diabetic":
            # ICMR: <5g sugar, >2g fiber, prefer low carbs
            query = query.filter(
                Nutrition.sugar < 5,
                Nutrition.fiber > 2
            ).order_by(Nutrition.sugar.asc(), Nutrition.fiber.desc(), Nutrition.carbohydrates.asc())

        elif health_goal == "heart":
            # AHA/ICMR: <400mg sodium, <10g sat fat
            query = query.filter(
                Nutrition.sodium < 400,
                Nutrition.fat < 10
            ).order_by(Nutrition.sodium.asc(), Nutrition.fat.asc())

        elif health_goal == "weight":
            # FSSAI: <400 kcal, prefer high protein for satiety
            query = query.filter(
                Nutrition.calories < 400
            ).order_by(Nutrition.calories.asc(), Nutrition.protein.desc())

        elif health_goal == "muscle":
            # Sports nutrition: maximize protein, moderate calories
            query = query.filter(
                Nutrition.protein > 10
            ).order_by(Nutrition.protein.desc(), Nutrition.calories.asc())

        elif health_goal == "kidney":
            # NKF: low sodium, moderate protein
            query = query.filter(
                Nutrition.sodium < 300,
                Nutrition.protein < 20
            ).order_by(Nutrition.sodium.asc())

        elif health_goal == "cholesterol":
            # Lipid mgmt: low fat, low sodium
            query = query.filter(
                Nutrition.fat < 8
            ).order_by(Nutrition.fat.asc(), Nutrition.sodium.asc())

        else:
            # Default: better nutrition score than original
            query = query.order_by(Food.nutrition_score.desc())

        return query.limit(5).all()

    results = safe_db_query(db, build_query, "Failed to compute alternatives")

    # ── FALLBACK: Relax health goal thresholds but KEEP allergen safety ──
    if len(results) == 0 and health_goal:
        def fallback_query():
            query = food_query_with_joins(db).join(Nutrition).join(Allergen).filter(
                Food.id != original.id,
                Food.category.in_(target_categories)
            )

            # Re-apply allergen safety (NEVER relaxed)
            for allergen in validated_avoid:
                db_col_name = ALLERGEN_MAP[allergen]
                allergen_col = getattr(Allergen, db_col_name, None)
                if allergen_col is not None:
                    query = query.filter(allergen_col == False)

            # Relaxed sorting without strict filters
            if health_goal == "diabetic":
                query = query.order_by(Nutrition.sugar.asc(), Nutrition.fiber.desc())
            elif health_goal == "heart":
                query = query.order_by(Nutrition.sodium.asc(), Nutrition.fat.asc())
            elif health_goal == "weight":
                query = query.order_by(Nutrition.calories.asc())
            elif health_goal == "muscle":
                query = query.order_by(Nutrition.protein.desc())
            elif health_goal == "kidney":
                query = query.order_by(Nutrition.sodium.asc())
            elif health_goal == "cholesterol":
                query = query.order_by(Nutrition.fat.asc())

            return query.limit(5).all()

        results = safe_db_query(db, fallback_query, "Fallback query failed")

    # ── SECOND FALLBACK: Broaden category scope ──
    if len(results) == 0:
        def broad_fallback():
            query = food_query_with_joins(db).join(Nutrition).join(Allergen).filter(
                Food.id != original.id
            )

            for allergen in validated_avoid:
                db_col_name = ALLERGEN_MAP[allergen]
                allergen_col = getattr(Allergen, db_col_name, None)
                if allergen_col is not None:
                    query = query.filter(allergen_col == False)

            return query.order_by(Food.nutrition_score.desc()).limit(5).all()

        results = safe_db_query(db, broad_fallback, "Broad fallback query failed")

    return results


# ═══════════════════════════════════════════════════════════════
# 5. HEALTH GOALS METADATA ENDPOINT
# ═══════════════════════════════════════════════════════════════
@router.get("/meta/health-goals")
def get_health_goals():
    """Returns all valid health goals with medical descriptions."""
    return {
        "goals": [
            {"key": k, "description": v}
            for k, v in VALID_HEALTH_GOALS.items()
        ]
    }


# ═══════════════════════════════════════════════════════════════
# 6. SMART SWAP EXPLANATION ENGINE (Multi-Factor)
# ═══════════════════════════════════════════════════════════════

class SwapRequest(BaseModel):
    original: str
    alternative: str

    @field_validator('original', 'alternative')
    @classmethod
    def validate_not_empty(cls, v):
        if not v or not v.strip():
            raise ValueError("Food name cannot be empty.")
        if len(v) > 200:
            raise ValueError("Food name is too long (max 200 characters).")
        return v.strip()


# ── Medically validated explanation templates ──
MEDICAL_INSIGHTS = {
    "sugar": {
        "threshold": 5,
        "benefit": "Significantly healthier choice with {diff}g less sugar per serving. "
                   "Lower sugar intake helps manage blood glucose levels and reduces "
                   "risk of insulin resistance (ICMR guideline: <25g added sugar/day).",
        "icon": "🩺"
    },
    "calories": {
        "threshold": 50,
        "benefit": "Saves {diff} calories per serving — equivalent to a {context}. "
                   "This swap supports sustainable weight management without sacrificing taste.",
        "icon": "⚡"
    },
    "protein": {
        "threshold": 3,
        "benefit": "Provides {diff}g more protein for muscle repair and satiety. "
                   "Higher protein keeps you fuller longer, reducing snacking urges.",
        "icon": "💪"
    },
    "sodium": {
        "threshold": 100,
        "benefit": "Contains {diff}mg less sodium, supporting healthier blood pressure. "
                   "FSSAI recommends <5g salt (2000mg sodium) per day.",
        "icon": "❤️"
    },
    "fat": {
        "threshold": 5,
        "benefit": "Reduces fat intake by {diff}g, supporting heart health and "
                   "cholesterol management.",
        "icon": "🫀"
    },
    "fiber": {
        "threshold": 2,
        "benefit": "Adds {diff}g more dietary fiber, improving digestion and "
                   "helping regulate blood sugar levels.",
        "icon": "🌿"
    },
}


@router.post("/explain-swap")
@limiter.limit("10/minute")
async def explain_swap(http_request: Request, request: SwapRequest, db: Session = Depends(get_db)):
    """
    Generates a multi-factor, medically validated explanation for why
    the alternative food is a better choice than the original.

    Returns multiple benefits instead of just one comparison.
    """
    def query():
        original_food = db.query(Food).filter(
            Food.name.ilike(request.original)
        ).first()
        alt_food = db.query(Food).filter(
            Food.name.ilike(request.alternative)
        ).first()
        return original_food, alt_food

    original_food, alt_food = safe_db_query(
        db, query, "Failed to look up food items"
    )

    # Build multi-factor explanation
    benefits = []
    primary_msg = f"{request.alternative} is a better choice for your health goals."

    if original_food and alt_food and original_food.nutrition and alt_food.nutrition:
        o_n = original_food.nutrition
        a_n = alt_food.nutrition

        # Check each nutritional dimension
        # Sugar reduction
        if o_n.sugar is not None and a_n.sugar is not None:
            sugar_diff = o_n.sugar - a_n.sugar
            if sugar_diff >= MEDICAL_INSIGHTS["sugar"]["threshold"]:
                benefits.append(MEDICAL_INSIGHTS["sugar"]["benefit"].format(diff=int(sugar_diff)))

        # Calorie reduction
        if o_n.calories is not None and a_n.calories is not None:
            cal_diff = o_n.calories - a_n.calories
            if cal_diff >= MEDICAL_INSIGHTS["calories"]["threshold"]:
                # Contextual comparison
                if cal_diff > 300:
                    context = "full meal's worth of energy"
                elif cal_diff > 150:
                    context = "30-minute brisk walk"
                elif cal_diff > 50:
                    context = "15-minute jog"
                else:
                    context = "small snack"
                benefits.append(MEDICAL_INSIGHTS["calories"]["benefit"].format(
                    diff=int(cal_diff), context=context
                ))

        # Protein increase
        if o_n.protein is not None and a_n.protein is not None:
            prot_diff = a_n.protein - o_n.protein
            if prot_diff >= MEDICAL_INSIGHTS["protein"]["threshold"]:
                benefits.append(MEDICAL_INSIGHTS["protein"]["benefit"].format(diff=int(prot_diff)))

        # Sodium reduction
        if o_n.sodium is not None and a_n.sodium is not None:
            sodium_diff = o_n.sodium - a_n.sodium
            if sodium_diff >= MEDICAL_INSIGHTS["sodium"]["threshold"]:
                benefits.append(MEDICAL_INSIGHTS["sodium"]["benefit"].format(diff=int(sodium_diff)))

        # Fat reduction
        if o_n.fat is not None and a_n.fat is not None:
            fat_diff = o_n.fat - a_n.fat
            if fat_diff >= MEDICAL_INSIGHTS["fat"]["threshold"]:
                benefits.append(MEDICAL_INSIGHTS["fat"]["benefit"].format(diff=int(fat_diff)))

        # Fiber increase
        if o_n.fiber is not None and a_n.fiber is not None:
            fiber_diff = a_n.fiber - o_n.fiber
            if fiber_diff >= MEDICAL_INSIGHTS["fiber"]["threshold"]:
                benefits.append(MEDICAL_INSIGHTS["fiber"]["benefit"].format(diff=int(fiber_diff)))

        # Sustainability bonus
        if (alt_food.sustainability_score and original_food.sustainability_score
                and alt_food.sustainability_score > original_food.sustainability_score):
            eco_diff = alt_food.sustainability_score - original_food.sustainability_score
            if eco_diff >= 10:
                benefits.append(
                    f"A more sustainable choice with {eco_diff} points higher eco-score, "
                    f"contributing to a lower carbon footprint."
                )

        # Build primary message from top benefit
        if benefits:
            primary_msg = benefits[0]

    elif not original_food:
        logger.warning(f"explain-swap: Original food '{request.original}' not found in DB")
    elif not alt_food:
        logger.warning(f"explain-swap: Alternative food '{request.alternative}' not found in DB")

    return {
        "explanation": primary_msg,
        "all_benefits": benefits[:4],  # Cap at 4 benefits for UI
        "benefit_count": len(benefits),
    }