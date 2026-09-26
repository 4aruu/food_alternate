"""
Input validation edge-case tests.
These verify the API rejects malformed/malicious input correctly.
"""

from conftest import seed_food


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
    response = client.get("/foods/-5/alternatives")
    assert response.status_code == 400


# ═══════════════════════════════════════════════════════════
# Allergen Input Validation
# ═══════════════════════════════════════════════════════════

def test_unknown_allergen_is_ignored(client, db):
    """Unknown allergen names should be silently ignored, not crash."""
    food = seed_food(db, "Test Food", category="Lunch")
    seed_food(db, "Alt Food", category="Lunch")

    response = client.get(
        f"/foods/{food.id}/alternatives?avoid=unknown_allergen&avoid=dairy"
    )
    assert response.status_code == 200
    # Should still work — unknown allergens logged and skipped


def test_multiple_valid_allergens(client, db):
    """Multiple allergen filters should all be applied."""
    food = seed_food(db, "Original", category="Lunch")
    seed_food(db, "Has Dairy", category="Lunch", dairy=True, nuts=False)
    seed_food(db, "Has Nuts", category="Lunch", dairy=False, nuts=True)
    safe = seed_food(db, "Safe Food", category="Lunch", dairy=False, nuts=False)

    response = client.get(
        f"/foods/{food.id}/alternatives?avoid=dairy&avoid=nuts"
    )
    assert response.status_code == 200
    data = response.json()
    names = [item["name"] for item in data]
    assert "Has Dairy" not in names
    assert "Has Nuts" not in names


# ═══════════════════════════════════════════════════════════
# Health Goal Validation
# ═══════════════════════════════════════════════════════════

def test_all_valid_health_goals_accepted(client, db):
    """All 6 valid health goals should be accepted without error."""
    food = seed_food(db, "Test Food", category="Lunch")
    seed_food(db, "Alt 1", category="Lunch")

    for goal in ["diabetic", "heart", "weight", "muscle", "kidney", "cholesterol"]:
        response = client.get(f"/foods/{food.id}/alternatives?health_goal={goal}")
        assert response.status_code == 200, f"Health goal '{goal}' failed"


def test_health_goal_case_insensitive(client, db):
    """Health goals should be case-insensitive."""
    food = seed_food(db, "Test Food", category="Lunch")
    seed_food(db, "Alt 1", category="Lunch")

    response = client.get(f"/foods/{food.id}/alternatives?health_goal=DIABETIC")
    assert response.status_code == 200


# ═══════════════════════════════════════════════════════════
# Explain-Swap Validation
# ═══════════════════════════════════════════════════════════

def test_explain_swap_missing_fields(client):
    """Missing required fields should return 422."""
    response = client.post("/foods/explain-swap", json={"original": "Test"})
    assert response.status_code == 422


def test_explain_swap_non_json_body(client):
    """Non-JSON body should return 422."""
    response = client.post(
        "/foods/explain-swap",
        content="not json",
        headers={"Content-Type": "application/json"},
    )
    assert response.status_code == 422


def test_explain_swap_whitespace_only_name(client):
    """Whitespace-only food names should be rejected."""
    response = client.post("/foods/explain-swap", json={
        "original": "   ",
        "alternative": "Something",
    })
    assert response.status_code == 422
