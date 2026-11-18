"""
Kerala Food Alternatives API
============================
Food lookup, search, metadata and fail-closed alternatives.
"""

import logging
import time

from fastapi import APIRouter, Depends, HTTPException, Query, Request
from fastapi.responses import JSONResponse
from slowapi import Limiter
from sqlalchemy.exc import OperationalError, SQLAlchemyError
from sqlalchemy.orm import Session, joinedload

from database import get_db
from domain.allergens import allergen_metadata, expand_avoid, unknown_allergen_message
from domain.food_categories import (
    CATEGORY_SWAP_GROUPS,  # noqa: F401 - the single category mapping, owned by the domain module
    category_scope,
)
from domain.nutrition_rules import (
    health_goals_metadata,
    unknown_health_goal_message,
    validate_health_goals,
)
from models import Food
from schemas import (
    AlternativesRequest,
    AlternativesResponse,
    FoodSchema,
    HealthGoalsResponse,
    MetaAllergensResponse,
)
from services.discovery_engine import (
    PROFILE_NONE_CONFIRMED,
    PROFILE_RESTRICTIONS,
    PROFILE_STATUSES,
    OriginalFood,
    candidate_from_record,
    discover,
)

logger = logging.getLogger(__name__)


# ── RATE-LIMIT KEY (real client IP behind Render's proxy) ───
# Render puts every request behind its proxy, so request.client.host
# is the proxy IP for ALL users — keying limits on it would make
# every visitor share a single global rate-limit bucket. We read the
# RIGHT-most X-Forwarded-For entry: that is the one appended by the
# nearest trusted proxy (Render), so clients cannot spoof it.
def rate_limit_key(request: Request) -> str:
    xff = request.headers.get("x-forwarded-for")
    if xff:
        return xff.split(",")[-1].strip()
    if request.client:
        return request.client.host
    return "unknown"


limiter = Limiter(key_func=rate_limit_key)


# ── IN-PROCESS TTL CACHE FOR THE FOODS LIST ────────────────
# The foods table is seeded, read-only data. Caching the serialized
# list briefly means page loads / header fetches stop re-querying
# Postgres (huge win on Render Free's 0.1 CPU), and each gunicorn
# worker serves from its own memory.
_FOODS_CACHE_TTL_SECONDS = 120
_foods_cache: dict = {"data": None, "expires_at": 0.0}


def clear_foods_cache():
    """Reset the in-process foods cache (used by tests after each run)."""
    _foods_cache["data"] = None
    _foods_cache["expires_at"] = 0.0

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
        ) from e
    except SQLAlchemyError as e:
        logger.error("SQLAlchemyError (%s) in query", type(e).__name__)
        raise HTTPException(status_code=500, detail=error_msg) from e


# ── ALTERNATIVES: APPLICATION ERRORS ─────────────────────────
def _error(status_code: int, error_code: str, detail: str) -> JSONResponse:
    return JSONResponse(
        status_code=status_code,
        content={"detail": detail, "error_code": error_code},
    )


def _check_alternatives_request(food_id: int, body: AlternativesRequest):
    """Run the request checks in their documented order, before any query.

    Returns (error response or None, canonical avoid codes, preset keys).
    Submitted values are never logged.
    """
    if food_id <= 0:
        return _error(400, "INVALID_FOOD_ID", "Food ID must be a positive integer."), [], []

    avoid, invalid_allergens = expand_avoid(body.avoid)
    if invalid_allergens:
        return _error(400, "UNKNOWN_ALLERGEN", unknown_allergen_message(invalid_allergens)), [], []

    health_goals, invalid_goals = validate_health_goals(body.health_goals)
    if invalid_goals:
        return _error(400, "UNKNOWN_HEALTH_GOAL", unknown_health_goal_message(invalid_goals)), [], []

    status = body.allergen_profile_status
    if status not in PROFILE_STATUSES:
        return _error(
            422, "ALLERGEN_PROFILE_REQUIRED",
            "Choose the allergens to avoid, or confirm that no allergen filtering should be applied.",
        ), [], []

    if status == PROFILE_RESTRICTIONS and not avoid:
        return _error(
            422, "PROFILE_INCONSISTENT",
            "allergen_profile_status 'restrictions' requires at least one allergen in the avoid list.",
        ), [], []
    if status == PROFILE_NONE_CONFIRMED and avoid:
        return _error(
            422, "PROFILE_INCONSISTENT",
            "allergen_profile_status 'none_confirmed' requires an empty avoid list.",
        ), [], []

    return None, avoid, health_goals


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
@router.get("/", response_model=list[FoodSchema])
@limiter.limit("30/minute")
def get_foods(request: Request, db: Session = Depends(get_db)):
    """Returns all foods with full nutrition, allergen, and sustainability data.

    Served from a short-lived in-process cache — the dataset is static
    (seeded once), so there is no value in re-querying Postgres for it
    on every page load.
    """
    now = time.monotonic()
    if _foods_cache["data"] is not None and now < _foods_cache["expires_at"]:
        return _foods_cache["data"]

    def query():
        results = food_query_with_joins(db).all()
        if not results:
            logger.warning("No foods found in database. Has seed.py been run?")
        return results

    results = safe_db_query(db, query, "Failed to fetch foods list")

    # Serialize OUTSIDE the session (avoids detached-instance lazy loads)
    payload = [FoodSchema.model_validate(f).model_dump() for f in results]
    # Never cache an empty list: it means the DB is unseeded (or a seed is
    # in progress), and caching it would hide the data once it arrives.
    if payload:
        _foods_cache["data"] = payload
        _foods_cache["expires_at"] = now + _FOODS_CACHE_TTL_SECONDS
    return payload


# ═══════════════════════════════════════════════════════════════
# 2. SEARCH FOODS
# ═══════════════════════════════════════════════════════════════
@router.get("/search", response_model=list[FoodSchema])
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
# METADATA (registered before /{food_id} so "meta" is never read as an id)
# ═══════════════════════════════════════════════════════════════
@router.get("/meta/allergens", response_model=MetaAllergensResponse)
def get_allergen_metadata():
    """Allergen codes, aliases, statuses, provenance values and the preparation warning."""
    return allergen_metadata()


@router.get("/meta/health-goals", response_model=HealthGoalsResponse)
def get_health_goals():
    """The exploratory nutrition presets and their thresholds."""
    return health_goals_metadata()


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
# 4. FOOD DISCOVERY: ALTERNATIVES (fail-closed)
# ═══════════════════════════════════════════════════════════════
@router.post("/{food_id}/alternatives", response_model=AlternativesResponse)
@limiter.limit("20/minute")
def get_alternatives(
    request: Request,
    food_id: int,
    body: AlternativesRequest,
    db: Session = Depends(get_db)
):
    """
    Alternatives from the food's category group.

    The allergen profile and the exploratory filters travel in the request
    body only. Eligibility, counts and the outcome are decided by the
    discovery engine; this handler validates the request and loads the foods.
    """
    error, avoid, health_goals = _check_alternatives_request(food_id, body)
    if error is not None:
        return error

    # ── FETCH ORIGINAL FOOD (first database access) ──
    def get_original():
        return db.query(Food).filter(Food.id == food_id).first()

    original = safe_db_query(db, get_original, "Failed to fetch food")
    if not original:
        return _error(404, "FOOD_NOT_FOUND", "Food not found.")

    # ── LOAD THE CATEGORY SCOPE ──
    scope, _ = category_scope(original.category)

    def get_candidates():
        if not scope:
            return []
        return food_query_with_joins(db).filter(
            Food.id != original.id,
            Food.category.in_(scope)
        ).all()

    foods = safe_db_query(db, get_candidates, "Failed to compute alternatives")

    return discover(
        OriginalFood(id=original.id, name=original.name, category=original.category),
        [candidate_from_record(food) for food in foods],
        profile_status=body.allergen_profile_status,
        avoid=avoid,
        health_goals=health_goals,
        limit=body.limit,
    )
