"""
Input validation edge-case tests.
These verify the API rejects malformed/malicious input correctly.
"""

from conftest import seed_food
from test_discovery_api import check_invariants

# ═══════════════════════════════════════════════════════════
# Search Input Validation
# ═══════════════════════════════════════════════════════════

def test_search_strips_sql_wildcards(client, db):
    """SQL wildcards % and _ should be stripped from search queries."""
    seed_food(db, "Test Food", category="Lunch")

    # %% would match everything in a raw LIKE — should be stripped
    response = client.get("/foods/search?q=%%")
    assert response.status_code == 400  # Empty after sanitization


def test_search_max_length(client):
    """Search query over 100 chars should be rejected."""
    long_query = "a" * 101
    response = client.get(f"/foods/search?q={long_query}")
    assert response.status_code == 422


def test_search_whitespace_only(client):
    """Whitespace-only query should return 400."""
    response = client.get("/foods/search?q=%20%20%20")
    assert response.status_code == 400


# ═══════════════════════════════════════════════════════════
# Food ID Validation
# ═══════════════════════════════════════════════════════════

def test_food_id_string_rejected(client):
    """Non-integer food ID should return 422."""
    response = client.get("/foods/abc")
    assert response.status_code == 422


def test_food_id_float_rejected(client):
    """Float food ID should return 422."""
    response = client.get("/foods/1.5")
    assert response.status_code == 422


def test_alternatives_negative_id(client):
    """Negative ID for alternatives should return 400."""
    response = client.post(
        "/foods/-5/alternatives", json={"allergen_profile_status": "none_confirmed"}
    )
    assert response.status_code == 400
    assert response.json()["error_code"] == "INVALID_FOOD_ID"


# ═══════════════════════════════════════════════════════════
# Allergen Input Validation
# ═══════════════════════════════════════════════════════════

def test_unknown_allergen_is_rejected(client, db):
    """Unknown allergen names are rejected, never silently dropped."""
    food = seed_food(db, "Test Food", category="Lunch")
    seed_food(db, "Alt Food", category="Lunch")

    response = client.post(
        f"/foods/{food.id}/alternatives",
        json={
            "allergen_profile_status": "restrictions",
            "avoid": ["unknown_allergen", "dairy"],
        },
    )
    assert response.status_code == 400
    body = response.json()
    assert body["error_code"] == "UNKNOWN_ALLERGEN"
    assert "'unknown_allergen'" in body["detail"]


def test_multiple_valid_allergens(client, db):
    """Multiple allergen filters should all be applied."""
    food = seed_food(db, "Original", category="Lunch")
    seed_food(db, "Has Dairy", category="Lunch", dairy=True, nuts=False)
    seed_food(db, "Has Nuts", category="Lunch", dairy=False, nuts=True)
    unverified = seed_food(db, "Unflagged Food", category="Lunch", dairy=False, nuts=False)

    response = client.post(
        f"/foods/{food.id}/alternatives",
        json={"allergen_profile_status": "restrictions", "avoid": ["dairy", "nuts"]},
    )
    assert response.status_code == 200
    data = response.json()
    check_invariants(data, limit=10)
    assert data["applied"]["avoid"] == ["milk", "peanuts", "tree_nuts"]
    names = [item["food"]["name"] for item in data["results"]]
    assert "Has Dairy" not in names
    assert "Has Nuts" not in names
    # An unflagged food is unknown, not absent, so it is excluded too.
    assert names == []
    counts = data["excluded"]["by_primary_reason"]
    assert counts["allergen_ingredient_possible"] == 2
    assert counts["allergen_ingredient_unknown"] == 1


# ═══════════════════════════════════════════════════════════
# Health Goal Validation
# ═══════════════════════════════════════════════════════════

def test_all_valid_health_goals_accepted(client, db):
    """All 6 valid health goals should be accepted without error."""
    food = seed_food(db, "Test Food", category="Lunch")
    seed_food(db, "Alt 1", category="Lunch")

    for goal in ["diabetic", "heart", "weight", "muscle", "kidney", "cholesterol"]:
        response = client.post(
            f"/foods/{food.id}/alternatives",
            json={"allergen_profile_status": "none_confirmed", "health_goals": [goal]},
        )
        assert response.status_code == 200, f"Health goal '{goal}' failed"
        check_invariants(response.json(), limit=10)
        assert response.json()["applied"]["health_goals"] == [goal]


def test_health_goal_case_insensitive(client, db):
    """Health goals should be case-insensitive."""
    food = seed_food(db, "Test Food", category="Lunch")
    seed_food(db, "Alt 1", category="Lunch")

    response = client.post(
        f"/foods/{food.id}/alternatives",
        json={"allergen_profile_status": "none_confirmed", "health_goals": ["DIABETIC"]},
    )
    assert response.status_code == 200
    check_invariants(response.json(), limit=10)
    assert response.json()["applied"]["health_goals"] == ["diabetic"]


def test_explain_swap_is_removed(client):
    """The explain-swap endpoint was removed in the copy-cleanup PR."""
    response = client.post("/foods/explain-swap", json={"original": "A", "alternative": "B"})
    assert response.status_code == 405
