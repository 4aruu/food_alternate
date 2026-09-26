"""
Tests for /foods endpoints — the core of the application.
Covers: list all, search, get by ID, alternatives engine, explain-swap.
"""

from conftest import seed_food


# ═══════════════════════════════════════════════════════════
# GET /foods/ — List All
# ═══════════════════════════════════════════════════════════

def test_get_foods_empty_db(client):
    """Empty DB should return an empty list, not an error."""
    response = client.get("/foods/")
    assert response.status_code == 200
    assert response.json() == []


def test_get_foods_returns_seeded_items(client, db):
    """Seeded foods should appear in the list with full relations."""
    seed_food(db, "Puttu", category="Breakfast")
    seed_food(db, "Dosa", category="Breakfast")

    response = client.get("/foods/")
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 2

    names = {item["name"] for item in data}
    assert names == {"Puttu", "Dosa"}

    # Verify relations are loaded
    first = data[0]
    assert "nutrition" in first
    assert "allergens" in first
    assert "sustainability" in first
    assert first["nutrition"]["calories"] is not None


# ═══════════════════════════════════════════════════════════
# GET /foods/search — Search
# ═══════════════════════════════════════════════════════════

def test_search_by_name(client, db):
    """Partial name match should return results."""
    seed_food(db, "Masala Dosa", category="Breakfast")
    seed_food(db, "Idli", category="Breakfast")

    response = client.get("/foods/search?q=dosa")
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 1
    assert data[0]["name"] == "Masala Dosa"


def test_search_by_category(client, db):
    """Search should match category names too."""
    seed_food(db, "Rice", category="Lunch")
    seed_food(db, "Chai", category="Drink")

    response = client.get("/foods/search?q=drink")
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 1
    assert data[0]["name"] == "Chai"


def test_search_case_insensitive(client, db):
    """Search should be case-insensitive."""
    seed_food(db, "Appam", category="Breakfast")

    response = client.get("/foods/search?q=APPAM")
    assert response.status_code == 200
    assert len(response.json()) == 1


def test_search_no_results(client, db):
    """No matches should return empty list, not 404."""
    seed_food(db, "Puttu", category="Breakfast")

    response = client.get("/foods/search?q=pizza")
    assert response.status_code == 200
    assert response.json() == []


def test_search_rejects_empty_query(client):
    """Empty search query should return 422 (validation error)."""
    response = client.get("/foods/search?q=")
    assert response.status_code == 422


def test_search_rejects_missing_query(client):
    """Missing q parameter should return 422."""
    response = client.get("/foods/search")
    assert response.status_code == 422


# ═══════════════════════════════════════════════════════════
# GET /foods/{food_id} — Get by ID
# ═══════════════════════════════════════════════════════════

def test_get_food_by_id(client, db):
    """Valid ID should return the food with all relations."""
    food = seed_food(db, "Chapati", category="Lunch")

    response = client.get(f"/foods/{food.id}")
    assert response.status_code == 200
    data = response.json()
    assert data["name"] == "Chapati"
    assert data["nutrition"]["calories"] == 300


def test_get_food_not_found(client):
    """Non-existent ID should return 404."""
    response = client.get("/foods/99999")
    assert response.status_code == 404


def test_get_food_negative_id(client):
    """Negative ID should return 400."""
    response = client.get("/foods/-1")
    assert response.status_code == 400


def test_get_food_zero_id(client):
    """Zero ID should return 400."""
    response = client.get("/foods/0")
    assert response.status_code == 400


# ═══════════════════════════════════════════════════════════
# GET /foods/{id}/alternatives — Smart Alternatives Engine
# ═══════════════════════════════════════════════════════════

def test_alternatives_returns_list(client, db):
    """Should return alternative foods in the same category."""
    original = seed_food(db, "Fried Rice", category="Lunch",
                         nutrition_score=50, calories=500, sugar=5)
    seed_food(db, "Brown Rice", category="Lunch",
              nutrition_score=85, calories=250, sugar=2)
    seed_food(db, "Quinoa Bowl", category="Lunch",
              nutrition_score=90, calories=200, sugar=1)

    response = client.get(f"/foods/{original.id}/alternatives")
    assert response.status_code == 200
    data = response.json()
    assert len(data) >= 1
    # Should not include the original food
    ids = [item["id"] for item in data]
    assert original.id not in ids


def test_alternatives_with_health_goal(client, db):
    """Diabetic goal should prefer low sugar, high fiber foods."""
    original = seed_food(db, "Sweet Dessert", category="Dessert",
                         sugar=25, fiber=1)
    good = seed_food(db, "Fruit Salad", category="Dessert",
                     sugar=3, fiber=4)
    bad = seed_food(db, "Cake", category="Dessert",
                    sugar=30, fiber=0)

    response = client.get(f"/foods/{original.id}/alternatives?health_goal=diabetic")
    assert response.status_code == 200
    data = response.json()
    if len(data) > 0:
        # Fruit Salad should appear (low sugar, high fiber)
        names = [item["name"] for item in data]
        assert "Fruit Salad" in names
        # Cake should NOT appear with strict diabetic filters (sugar < 5)
        assert "Cake" not in names


def test_alternatives_allergen_exclusion(client, db):
    """Allergen filters should strictly exclude matching foods."""
    original = seed_food(db, "Regular Pasta", category="Lunch")
    seed_food(db, "Gluten Pasta", category="Lunch", gluten=True)
    safe = seed_food(db, "Rice Noodles", category="Lunch", gluten=False)

    response = client.get(f"/foods/{original.id}/alternatives?avoid=gluten")
    assert response.status_code == 200
    data = response.json()
    names = [item["name"] for item in data]
    assert "Gluten Pasta" not in names
    if len(data) > 0:
        assert "Rice Noodles" in names


def test_alternatives_invalid_health_goal(client, db):
    """Invalid health goal should return 400."""
    food = seed_food(db, "Test Food", category="Lunch")
    response = client.get(f"/foods/{food.id}/alternatives?health_goal=invalid")
    assert response.status_code == 400


def test_alternatives_not_found(client):
    """Alternatives for non-existent food should return 404."""
    response = client.get("/foods/99999/alternatives")
    assert response.status_code == 404


# ═══════════════════════════════════════════════════════════
# GET /foods/meta/health-goals — Health Goals Metadata
# ═══════════════════════════════════════════════════════════

def test_health_goals_returns_list(client):
    """Should return all 6 health goals with keys and descriptions."""
    response = client.get("/foods/meta/health-goals")
    assert response.status_code == 200
    data = response.json()
    assert "goals" in data
    goals = data["goals"]
    assert len(goals) == 6

    keys = {g["key"] for g in goals}
    assert keys == {"diabetic", "heart", "weight", "muscle", "kidney", "cholesterol"}

    # Each goal should have a description
    for goal in goals:
        assert "description" in goal
        assert len(goal["description"]) > 10


# ═══════════════════════════════════════════════════════════
# POST /foods/explain-swap — Swap Explanation Engine
# ═══════════════════════════════════════════════════════════

def test_explain_swap_with_valid_foods(client, db):
    """Should return explanation and benefits for known foods."""
    seed_food(db, "Fried Chicken", category="Lunch",
              calories=550, fat=30, sugar=2, sodium=800, protein=25, fiber=1)
    seed_food(db, "Grilled Fish", category="Lunch",
              calories=200, fat=5, sugar=0, sodium=200, protein=35, fiber=0)

    response = client.post("/foods/explain-swap", json={
        "original": "Fried Chicken",
        "alternative": "Grilled Fish",
    })
    assert response.status_code == 200
    data = response.json()
    assert "explanation" in data
    assert "all_benefits" in data
    assert "benefit_count" in data
    # The swap is clearly better — should have multiple benefits
    assert data["benefit_count"] >= 1


def test_explain_swap_unknown_foods(client):
    """Unknown food names should still return a generic explanation."""
    response = client.post("/foods/explain-swap", json={
        "original": "Nonexistent Food A",
        "alternative": "Nonexistent Food B",
    })
    assert response.status_code == 200
    data = response.json()
    assert "explanation" in data
    # Should return a generic message, not crash
    assert len(data["explanation"]) > 0


def test_explain_swap_empty_names(client):
    """Empty food names should return 422 validation error."""
    response = client.post("/foods/explain-swap", json={
        "original": "",
        "alternative": "Something",
    })
    assert response.status_code == 422


def test_explain_swap_too_long_names(client):
    """Names over 200 chars should return 422 validation error."""
    response = client.post("/foods/explain-swap", json={
        "original": "A" * 201,
        "alternative": "Something",
    })
    assert response.status_code == 422
