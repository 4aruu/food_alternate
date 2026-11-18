"""POST /foods/{id}/alternatives and the metadata endpoints, over HTTP."""

import json
import logging
import math
from pathlib import Path

import pytest
from sqlalchemy import event
from sqlalchemy.orm.attributes import set_committed_value

from conftest import seed_food, test_engine
from domain import allergens as A
from domain import food_categories, nutrition_rules
from models import Nutrition
from routers import foods as foods_router
from schemas import AlternativesResponse, HealthGoalsResponse, MetaAllergensResponse
from services import discovery_engine as E

BACKEND = Path(__file__).resolve().parent.parent
CODES = list(A.CANONICAL_CODES)
STATUSES = ("present", "possible", "absent", "unknown")
NONE = {"allergen_profile_status": "none_confirmed"}
FIELDS = list(nutrition_rules.NUTRITION_FIELDS)


def strict_loads(text):
    """JSON parser that rejects NaN, Infinity, -Infinity and duplicate keys."""
    def reject_constant(name):
        raise ValueError(f"non-finite JSON constant: {name}")

    def reject_duplicates(pairs):
        keys = [key for key, _ in pairs]
        if len(keys) != len(set(keys)):
            raise ValueError("duplicate key")
        return dict(pairs)

    return json.loads(text, parse_constant=reject_constant, object_pairs_hook=reject_duplicates)


def restrictions(*avoid, **extra):
    return {"allergen_profile_status": "restrictions", "avoid": list(avoid), **extra}


def post(client, food_id, body):
    return client.post(f"/foods/{food_id}/alternatives", json=body)


def ok(client, food_id, body):
    """POST, expect 200, check the invariants and the schema, return the body."""
    response = post(client, food_id, body)
    assert response.status_code == 200, response.text
    data = strict_loads(response.text)
    check_invariants(data, body.get("limit", 10))
    return data


def check_invariants(data, limit):
    assert list(data) == [
        "applied", "candidates_considered", "eligible_total", "results",
        "excluded", "outcome", "comparability", "disclaimer",
    ]
    AlternativesResponse.model_validate(data)
    excluded = data["excluded"]
    considered = data["candidates_considered"]
    counts = excluded["by_primary_reason"]
    assert list(counts) == list(E.PRIMARY_REASON_CODES)
    assert sum(counts.values()) == excluded["total"]  # I1
    assert data["eligible_total"] + excluded["total"] == considered  # I2
    assert len(data["results"]) == min(data["eligible_total"], limit)  # I3

    by_allergen = excluded["allergen_detail"]["by_allergen"]
    assert list(by_allergen) == data["applied"]["avoid"]
    for detail in by_allergen.values():
        for dimension, keys in (
            ("ingredient", A.INGREDIENT_UNKNOWN_PROVENANCE),
            ("cross_contact", A.CROSS_CONTACT_UNKNOWN_PROVENANCE),
        ):
            dim = detail[dimension]
            assert sum(dim[s] for s in STATUSES) == considered  # I4
            assert list(dim["unknown_by_provenance"]) == list(keys)
            assert sum(dim["unknown_by_provenance"].values()) == dim["unknown"]  # I5

    assert data["disclaimer"] == nutrition_rules.DISCLAIMER
    assert data["comparability"] == {
        "cross_food_nutrition_comparable": False,
        "reason": "unknown_and_inconsistent_measurement_basis",
    }
    assert data["outcome"]["text"] == E.OUTCOME_TEXTS[data["outcome"]["code"]].format(n=data["eligible_total"])
    for position, result in enumerate(data["results"], start=1):
        assert result["rank"] == position
        assert result["eligibility"] == "eligible"
        assert result["food"]["preparation"] == {"details_known": False}
        assert list(result["food"]["allergen_status"]) == CODES
        assert "nutrition_score" not in result["food"]
        assert "allergens" not in result["food"]
        codes = [e["code"] for e in result["uncertainty"]]
        assert "preparation_dependent" in codes
        assert "nutrition_unstandardized" in codes


@pytest.fixture
def statements():
    """SQL statements sent to the database while the fixture is active."""
    seen = []

    def record(_conn, _cursor, statement, _parameters, _context, _executemany):
        seen.append(statement)

    event.listen(test_engine, "before_cursor_execute", record)
    yield seen
    event.remove(test_engine, "before_cursor_execute", record)


@pytest.fixture
def nan_fields():
    """Make chosen nutrition fields load as NaN (SQLite stores NaN as NULL)."""
    targets: dict[int, tuple[str, ...]] = {}

    def on_load(target, _context):
        for field in targets.get(target.food_id, ()):
            set_committed_value(target, field, math.nan)

    event.listen(Nutrition, "load", on_load)
    yield targets
    event.remove(Nutrition, "load", on_load)


@pytest.fixture
def breakfast(db):
    """An original food and three candidates shaped like the current data."""
    original = seed_food(db, "Puttu", category="Breakfast")
    seed_food(db, "Milk Porridge", category="Breakfast", dairy=True, sugar=3, fiber=5)
    seed_food(db, "Idli", category="Breakfast", sugar=2, fiber=4)
    seed_food(db, "Sweet Bun", category="Breakfast", gluten=True, sugar=20, fiber=1)
    return original


# ── Errors (criterion 13) ────────────────────────────────────
def assert_app_error(response, status, code, detail=None):
    assert response.status_code == status, response.text
    body = response.json()
    assert set(body) == {"detail", "error_code"}
    assert isinstance(body["detail"], str)
    assert body["error_code"] == code
    if detail is not None:
        assert body["detail"] == detail


def assert_validation_error(response):
    assert response.status_code == 422, response.text
    body = response.json()
    assert set(body) == {"detail"}
    assert isinstance(body["detail"], list) and body["detail"]
    assert all({"type", "loc", "msg"} <= set(entry) for entry in body["detail"])


@pytest.mark.parametrize("payload", [
    [],
    "restrictions",
    {"avoid": "milk", **NONE},
    {"avoid": [1], **NONE},
    {"health_goals": "diabetic", **NONE},
    {"allergen_profile_status": 5},
    {"limit": "many", **NONE},
    {"limit": 0, **NONE},
    {"limit": 51, **NONE},
    {"limit": 2.5, **NONE},
    {"unexpected": True, **NONE},
    {"health_goal": "diabetic", **NONE},
])
def test_standard_validation_errors(client, breakfast, payload):
    assert_validation_error(post(client, breakfast.id, payload))


def test_validation_error_for_a_missing_or_malformed_body(client, breakfast):
    assert_validation_error(client.post(f"/foods/{breakfast.id}/alternatives"))
    malformed = client.post(
        f"/foods/{breakfast.id}/alternatives", content="{not json",
        headers={"Content-Type": "application/json"},
    )
    assert_validation_error(malformed)


def test_validation_error_for_a_non_integer_food_id(client):
    assert_validation_error(client.post("/foods/abc/alternatives", json=NONE))
    assert_validation_error(client.post("/foods/1.5/alternatives", json=NONE))


@pytest.mark.parametrize("food_id", [0, -1])
def test_invalid_food_id(client, food_id):
    assert_app_error(post(client, food_id, NONE), 400, "INVALID_FOOD_ID", "Food ID must be a positive integer.")


def test_unknown_allergen(client, breakfast):
    assert_app_error(
        post(client, breakfast.id, restrictions("dairyy")), 400, "UNKNOWN_ALLERGEN",
        "Unknown allergen value(s): 'dairyy'. Valid values: milk, eggs, peanuts, tree_nuts, "
        "fish, shellfish, soy, wheat, gluten, sesame, sulfites. Accepted aliases: dairy, egg, "
        "peanut, tree-nuts, tree nuts, soya, sulphites, nuts, seafood.",
    )


@pytest.mark.parametrize("bad", ["", "   ", "lactose"])
def test_empty_or_unlisted_allergen_is_unknown(client, breakfast, bad):
    assert_app_error(post(client, breakfast.id, restrictions("milk", bad)), 400, "UNKNOWN_ALLERGEN")


def test_unknown_health_goal(client, breakfast):
    assert_app_error(
        post(client, breakfast.id, {**NONE, "health_goals": ["keto"]}), 400, "UNKNOWN_HEALTH_GOAL",
        "Unknown health goal(s): 'keto'. Valid values: diabetic, heart, weight, muscle, kidney, cholesterol.",
    )


@pytest.mark.parametrize("payload", [
    {},
    {"allergen_profile_status": None},
    {"allergen_profile_status": "unconfigured"},
    {"allergen_profile_status": "RESTRICTIONS", "avoid": ["milk"]},
    {"allergen_profile_status": ""},
    {"avoid": ["milk"]},
    {"health_goals": ["diabetic"], "limit": 5},
])
def test_allergen_profile_required(client, breakfast, payload):
    assert_app_error(
        post(client, breakfast.id, payload), 422, "ALLERGEN_PROFILE_REQUIRED",
        "Choose the allergens to avoid, or confirm that no allergen filtering should be applied.",
    )


def test_profile_inconsistent(client, breakfast):
    assert_app_error(
        post(client, breakfast.id, {**NONE, "avoid": ["milk"]}), 422, "PROFILE_INCONSISTENT",
        "allergen_profile_status 'none_confirmed' requires an empty avoid list.",
    )
    assert_app_error(
        post(client, breakfast.id, restrictions()), 422, "PROFILE_INCONSISTENT",
        "allergen_profile_status 'restrictions' requires at least one allergen in the avoid list.",
    )


def test_food_not_found(client, breakfast):
    assert_app_error(post(client, 99999, NONE), 404, "FOOD_NOT_FOUND", "Food not found.")
    assert_app_error(post(client, 99999, restrictions("milk", health_goals=["heart"])), 404, "FOOD_NOT_FOUND")


# ── Error precedence (criterion 14) ──────────────────────────
def test_earliest_error_wins(client, breakfast):
    # unknown allergen on a non-existent food: not 404
    assert_app_error(post(client, 99999, restrictions("dairyy")), 400, "UNKNOWN_ALLERGEN")
    # missing profile with an unknown allergen
    assert_app_error(post(client, breakfast.id, {"avoid": ["dairyy"]}), 400, "UNKNOWN_ALLERGEN")
    # alias expansion happens before the consistency check
    assert_app_error(post(client, breakfast.id, {**NONE, "avoid": ["nuts"]}), 422, "PROFILE_INCONSISTENT")
    # the rest of the order
    assert_validation_error(post(client, -1, {"avoid": ["dairyy"], "extra": 1}))
    assert_app_error(post(client, -1, {"avoid": ["dairyy"], "health_goals": ["keto"]}), 400, "INVALID_FOOD_ID")
    assert_app_error(post(client, breakfast.id, {"avoid": ["dairyy"], "health_goals": ["keto"]}), 400, "UNKNOWN_ALLERGEN")
    assert_app_error(post(client, breakfast.id, {"health_goals": ["keto"]}), 400, "UNKNOWN_HEALTH_GOAL")
    assert_app_error(post(client, 99999, {"health_goals": ["keto"]}), 400, "UNKNOWN_HEALTH_GOAL")
    assert_app_error(post(client, 99999, {"avoid": ["milk"]}), 422, "ALLERGEN_PROFILE_REQUIRED")
    assert_app_error(post(client, 99999, restrictions()), 422, "PROFILE_INCONSISTENT")


# ── No query before the checks pass (criterion 15) ───────────
@pytest.mark.parametrize("food_id,payload", [
    (-1, NONE),
    (1, restrictions("dairyy")),
    (1, {**NONE, "health_goals": ["keto"]}),
    (1, {}),
    (1, {**NONE, "avoid": ["nuts"]}),
    (1, restrictions()),
    (1, {**NONE, "unexpected": 1}),
])
def test_no_database_query_before_the_request_checks_pass(client, breakfast, statements, food_id, payload):
    statements.clear()
    response = post(client, food_id, payload)
    assert response.status_code in (400, 422)
    assert statements == []


def test_not_found_is_the_first_point_that_queries(client, statements):
    statements.clear()
    assert post(client, 99999, NONE).status_code == 404
    assert len(statements) == 1


# ── Removed GET form (criterion 55) ──────────────────────────
@pytest.mark.parametrize("suffix", ["", "?health_goal=diabetic&avoid=dairy"])
def test_get_form_is_gone(client, breakfast, suffix):
    response = client.get(f"/foods/{breakfast.id}/alternatives{suffix}")
    assert response.status_code == 405
    assert response.json() == {"detail": "Method Not Allowed"}


# ── Restrictions: fail-closed with current-shape data ────────
def test_restriction_with_current_data_shows_nothing(client, breakfast):
    data = ok(client, breakfast.id, restrictions("dairy", health_goals=["diabetic"]))
    assert data["applied"] == {
        "allergen_profile_status": "restrictions",
        "allergen_filtering": "applied",
        "avoid": ["milk"],
        "health_goals": ["diabetic"],
        "category_scope": food_categories.CATEGORY_SWAP_GROUPS["Breakfast"],
        "category_scope_source": "swap_group",
        "nutrition_basis": "as_stored_unstandardized",
    }
    assert data["candidates_considered"] == 3
    assert data["eligible_total"] == 0
    assert data["results"] == []
    counts = data["excluded"]["by_primary_reason"]
    assert counts["allergen_ingredient_possible"] == 1
    assert counts["allergen_ingredient_unknown"] == 2
    assert data["excluded"]["allergen_detail"]["by_allergen"]["milk"] == {
        "ingredient": {
            "present": 0, "possible": 1, "absent": 0, "unknown": 2,
            "unknown_by_provenance": {"legacy_default_false": 2, "legacy_null": 0, "no_allergen_record": 0, "not_tracked": 0},
        },
        "cross_contact": {
            "present": 0, "possible": 0, "absent": 0, "unknown": 3,
            "unknown_by_provenance": {"no_source": 3, "insufficient_preparation_evidence": 0},
        },
    }
    assert data["outcome"] == {
        "code": "no_verified_alternatives",
        "text": "NutriSwap can't currently verify any alternative that meets your allergen "
                "restrictions, because its ingredient and cross-contact data is incomplete. "
                "No alternatives are shown rather than unverified ones.",
    }


@pytest.mark.parametrize("avoid", [["milk"], ["sesame"], ["wheat"], ["nuts", "seafood"], CODES])
def test_any_restriction_yields_zero_results_with_current_data(client, breakfast, avoid):
    data = ok(client, breakfast.id, restrictions(*avoid))
    assert data["eligible_total"] == 0
    assert data["outcome"]["code"] == "no_verified_alternatives"
    assert sum(data["excluded"]["by_primary_reason"][r] for r in E.NUTRITION_REASON_CODES) == 0


def test_aliases_are_expanded_in_applied_avoid(client, breakfast):
    data = ok(client, breakfast.id, restrictions("Seafood", "egg", "tree nuts", "dairy"))
    assert data["applied"]["avoid"] == ["milk", "eggs", "tree_nuts", "fish", "shellfish"]


# ── none_confirmed (criterion 27) ────────────────────────────
def test_none_confirmed_applies_no_allergen_gate(client, breakfast):
    data = ok(client, breakfast.id, NONE)
    assert data["applied"]["allergen_profile_status"] == "none_confirmed"
    assert data["applied"]["allergen_filtering"] == "not_applied"
    assert data["applied"]["avoid"] == []
    assert data["eligible_total"] == 3
    assert data["excluded"]["allergen_detail"]["by_allergen"] == {}
    assert data["outcome"] == {"code": "alternatives_found", "text": "3 alternatives found."}

    by_name = {r["food"]["name"]: r for r in data["results"]}
    flagged = by_name["Milk Porridge"]["uncertainty"][0]
    assert flagged == {
        "code": "allergen_ingredient_flagged", "allergens": ["milk"],
        "text": "Milk may be an ingredient, based on keywords in the dish name or description. "
                "This is not confirmed by an ingredient list.",
    }
    for result in data["results"]:
        codes = [e["code"] for e in result["uncertainty"]]
        assert "allergen_ingredient_unverified" in codes
        assert "allergen_cross_contact_unverified" in codes
        prep = next(e for e in result["uncertainty"] if e["code"] == "preparation_dependent")
        assert prep == {"code": "preparation_dependent", "text": A.PREPARATION_WARNING}
        assert "nutrition_incomplete" not in codes


def test_preset_with_none_confirmed(client, breakfast):
    data = ok(client, breakfast.id, {**NONE, "health_goals": ["diabetic"], "limit": 1})
    assert data["eligible_total"] == 2
    assert len(data["results"]) == 1
    assert data["excluded"]["by_primary_reason"]["failed_filter"] == 1
    assert data["outcome"]["text"] == "2 alternatives found."
    result = data["results"][0]
    assert result["food"]["name"] == "Milk Porridge"  # lowest id among the eligible
    assert result["reasons"] == [
        {"code": "filter_threshold", "field": "sugar", "text": "Matches your selected exploratory filter: sugar below 5 g (stored value 3 g; measurement basis unknown)"},
        {"code": "filter_threshold", "field": "fiber", "text": "Matches your selected exploratory filter: fiber above 2 g (stored value 5 g; measurement basis unknown)"},
        {"code": "category", "text": "Same food category as Puttu: Breakfast"},
    ]
    assert result["food"]["nutrition_basis"] == {
        "code": "as_stored_unstandardized", "standardized": False, "source_portion": None,
        "source_portion_known": False, "serving_label_as_stored": "100g",
        "serving_label_reliable": False, "value_provenance": "unverified_manual_entry",
    }


def test_nutrition_only_exclusions_give_no_matching_alternatives(client, db):
    original = seed_food(db, "Original", category="Snack")
    seed_food(db, "Sugary", category="Snack", sugar=30)
    seed_food(db, "No Fiber Value", category="Snack", fiber=None)
    seed_food(db, "Negative Sugar", category="Snack", sugar=-2)
    seed_food(db, "No Record", category="Snack", with_nutrition=False)
    data = ok(client, original.id, {**NONE, "health_goals": ["diabetic"]})
    counts = data["excluded"]["by_primary_reason"]
    assert (counts["failed_filter"], counts["nutrition_missing"], counts["nutrition_invalid"]) == (1, 2, 1)
    assert data["outcome"] == {
        "code": "no_matching_alternatives",
        "text": "No alternatives in this food's category group match your selected exploratory filters.",
    }


def test_several_presets_combine_with_and(client, db):
    original = seed_food(db, "Original", category="Snack")
    seed_food(db, "Both", category="Snack", sugar=2, fiber=5, protein=15)
    seed_food(db, "Sugar Only", category="Snack", sugar=2, fiber=5, protein=5)
    seed_food(db, "Protein Only", category="Snack", sugar=20, fiber=5, protein=15)
    data = ok(client, original.id, {**NONE, "health_goals": ["diabetic", "muscle"]})
    assert [r["food"]["name"] for r in data["results"]] == ["Both"]
    assert data["applied"]["health_goals"] == ["diabetic", "muscle"]


# ── Limit and ranking ────────────────────────────────────────
def test_limit_and_deterministic_order(client, db):
    original = seed_food(db, "Original", category="Breakfast")
    lunch = [seed_food(db, f"Lunch {i}", category="Lunch", nutrition_score=100 - i) for i in range(6)]
    same = [seed_food(db, f"Breakfast {i}", category="Breakfast", nutrition_score=i) for i in range(6)]
    expected = [f.id for f in same] + [f.id for f in lunch]

    default = ok(client, original.id, NONE)
    assert default["eligible_total"] == 12
    assert [r["food"]["id"] for r in default["results"]] == expected[:10]

    everything = ok(client, original.id, {**NONE, "limit": 50})
    assert [r["food"]["id"] for r in everything["results"]] == expected
    assert [r["reasons"][-1]["code"] for r in everything["results"]] == ["category"] * 6 + ["swap_group"] * 6
    assert everything["results"][6]["reasons"][-1]["text"] == "Same category group as Original: Lunch"

    one = ok(client, original.id, {**NONE, "limit": 1})
    assert [r["food"]["id"] for r in one["results"]] == expected[:1]
    assert ok(client, original.id, {**NONE, "limit": 50}) == everything


# ── Category scope ───────────────────────────────────────────
def test_no_candidates(client, db):
    original = seed_food(db, "Only Drink", category="Drink")
    seed_food(db, "A Snack", category="Snack")
    data = ok(client, original.id, restrictions("milk", health_goals=["diabetic"]))
    assert data["candidates_considered"] == 0
    assert data["outcome"] == {"code": "no_candidates", "text": "There are no other foods in this food's category group."}


def test_unmapped_category_stays_in_its_own_category(client, db):
    original = seed_food(db, "Vada", category="Street Food")
    seed_food(db, "Bajji", category="Street Food")
    seed_food(db, "Chips", category="Snack")
    data = ok(client, original.id, NONE)
    assert data["applied"]["category_scope"] == ["Street Food"]
    assert data["applied"]["category_scope_source"] == "unmapped_same_category_only"
    assert [r["food"]["name"] for r in data["results"]] == ["Bajji"]


# ── Provenance through the API (criterion 17, Example E) ─────
def test_food_without_an_allergen_record(client, db):
    original = seed_food(db, "Original", category="Snack")
    seed_food(db, "No Allergen Row", category="Snack", with_allergens=False)
    seed_food(db, "With Row", category="Snack")

    data = ok(client, original.id, NONE)
    by_name = {r["food"]["name"]: r["food"]["allergen_status"] for r in data["results"]}
    expected = {
        "ingredient": "unknown", "ingredient_provenance": "no_allergen_record",
        "cross_contact": "unknown", "cross_contact_provenance": "no_source",
    }
    assert by_name["No Allergen Row"] == dict.fromkeys(CODES, expected)
    not_tracked = [c for c in CODES if by_name["With Row"][c]["ingredient_provenance"] == "not_tracked"]
    assert not_tracked == ["wheat", "sesame", "sulfites"]

    restricted = ok(client, original.id, restrictions("sesame"))
    assert restricted["excluded"]["allergen_detail"]["by_allergen"]["sesame"]["ingredient"]["unknown_by_provenance"] == {
        "legacy_default_false": 0, "legacy_null": 0, "no_allergen_record": 1, "not_tracked": 1,
    }
    assert restricted["eligible_total"] == 0


def test_current_data_never_yields_present_absent_or_cross_contact_claims(client, db):
    original = seed_food(db, "Original", category="Snack")
    seed_food(db, "All Flags", category="Snack", dairy=True, nuts=True, gluten=True, soy=True, eggs=True, shellfish=True)
    seed_food(db, "Null Flags", category="Snack", dairy=None, nuts=None, gluten=None, soy=None, eggs=None, shellfish=None)
    seed_food(db, "No Row", category="Snack", with_allergens=False)
    data = ok(client, original.id, NONE)
    assert len(data["results"]) == 3
    for result in data["results"]:
        for status in result["food"]["allergen_status"].values():
            assert status["ingredient"] in ("possible", "unknown")
            assert status["cross_contact"] == "unknown"
            assert status["cross_contact_provenance"] == "no_source"


# ── Nutrition integrity on this endpoint (criteria 44, 45) ───
def test_invalid_stored_values_return_200_and_strict_json(client, db, nan_fields):
    original = seed_food(db, "Original", category="Snack")
    bad = seed_food(db, "Broken", category="Snack", calories=-1, protein=-math.inf, fiber=math.inf, sodium=None)
    nan_fields[bad.id] = ("fat",)

    data = ok(client, original.id, NONE)
    result = data["results"][0]
    assert result["food"]["nutrition"] == {
        "calories": None, "protein": None, "fat": None, "carbohydrates": 40.0,
        "fiber": None, "sugar": 3.0, "sodium": None,
    }
    assert result["food"]["nutrition_quality"] == {
        "nutrition_record_present": True,
        "missing_fields": ["sodium"],
        "invalid_fields": ["calories", "protein", "fat", "fiber"],
    }
    assert result["uncertainty"][-1] == {
        "code": "nutrition_incomplete",
        "fields": ["sodium", "calories", "protein", "fat", "fiber"],
        "text": "Some nutrition values for this food are not available.",
    }

    for goal, reason in (("weight", "nutrition_invalid"), ("cholesterol", "nutrition_invalid"), ("diabetic", "nutrition_invalid")):
        filtered = ok(client, original.id, {**NONE, "health_goals": [goal]})
        assert filtered["excluded"]["by_primary_reason"][reason] == 1
        assert filtered["results"] == []
    # sodium is null and protein is invalid: invalid outranks missing
    kidney = ok(client, original.id, {**NONE, "health_goals": ["kidney"]})
    assert kidney["excluded"]["by_primary_reason"]["nutrition_invalid"] == 1


def test_food_without_a_nutrition_record(client, db):
    original = seed_food(db, "Original", category="Snack")
    seed_food(db, "No Record", category="Snack", with_nutrition=False)

    data = ok(client, original.id, NONE)
    food = data["results"][0]["food"]
    assert food["nutrition"] == dict.fromkeys(FIELDS)
    assert food["nutrition_quality"] == {"nutrition_record_present": False, "missing_fields": FIELDS, "invalid_fields": []}

    filtered = ok(client, original.id, {**NONE, "health_goals": ["muscle"]})
    assert filtered["excluded"]["by_primary_reason"]["nutrition_missing"] == 1


# ── Metadata (criteria 19, 40, 51, 53, 54) ───────────────────
def test_allergen_metadata(client):
    response = client.get("/foods/meta/allergens")
    assert response.status_code == 200
    data = strict_loads(response.text)
    MetaAllergensResponse.model_validate(data)
    assert list(data) == ["allergens", "group_aliases", "dimensions", "provenance", "preparation_warning"]
    assert data == A.allergen_metadata()
    assert [entry["code"] for entry in data["allergens"]] == CODES
    assert data["provenance"] == {
        "ingredient": [
            "legacy_seed_heuristic", "legacy_default_false", "legacy_null",
            "no_allergen_record", "not_tracked", "derived_from_wheat",
        ],
        "cross_contact": ["no_source", "insufficient_preparation_evidence", "verified_preparation_source"],
    }
    assert data["preparation_warning"] == A.PREPARATION_WARNING


def test_health_goals_metadata(client):
    response = client.get("/foods/meta/health-goals")
    assert response.status_code == 200
    data = strict_loads(response.text)
    HealthGoalsResponse.model_validate(data)
    assert list(data) == ["presets", "disclaimer"]
    assert data == nutrition_rules.health_goals_metadata()
    assert data["disclaimer"] == nutrition_rules.DISCLAIMER
    for preset in data["presets"]:
        assert list(preset) == ["key", "label", "kind", "basis", "filters"]
        assert preset["kind"] == "exploratory_filter"
        assert preset["basis"] == "as_stored_unstandardized"
        applied = [f.as_dict() for f in nutrition_rules.active_filters([preset["key"]])]
        assert preset["filters"] == applied


def test_metadata_paths_are_not_read_as_food_ids(client):
    for path in ("/foods/meta/allergens", "/foods/meta/health-goals"):
        assert client.get(path).status_code == 200
    assert client.get("/foods/meta").status_code == 422  # a single segment is a (bad) food id


def test_metadata_routes_are_registered_before_the_food_id_routes():
    paths = [route.path for route in foods_router.router.routes]
    first_id_route = min(paths.index("/foods/{food_id}"), paths.index("/foods/{food_id}/alternatives"))
    assert paths.index("/foods/meta/allergens") < first_id_route
    assert paths.index("/foods/meta/health-goals") < first_id_route
    methods = {
        route.path: route.methods for route in foods_router.router.routes
        if route.path == "/foods/{food_id}/alternatives"
    }
    assert methods == {"/foods/{food_id}/alternatives": {"POST"}}


# ── Logs (criterion 38) ──────────────────────────────────────
def test_profile_and_goals_never_reach_the_logs(client, breakfast, caplog):
    caplog.set_level(logging.DEBUG)
    requests = [
        (breakfast.id, restrictions("sesame", "sulphites", health_goals=["kidney"])),
        (breakfast.id, {**NONE, "health_goals": ["cholesterol"]}),
        (breakfast.id, restrictions("zzunknownzz")),
        (breakfast.id, {**NONE, "health_goals": ["zzgoalzz"]}),
        (breakfast.id, {"allergen_profile_status": "unconfigured", "avoid": ["sesame"]}),
        (breakfast.id, {**NONE, "avoid": ["sesame"]}),
        (99999, restrictions("sesame", health_goals=["kidney"])),
        (-1, restrictions("sesame", health_goals=["kidney"])),
    ]
    responses = [post(client, food_id, body) for food_id, body in requests]
    statuses = [response.status_code for response in responses]
    assert statuses == [200, 200, 400, 400, 422, 422, 404, 400]
    for (_, body), response in zip(requests, responses, strict=True):
        if response.status_code == 200:
            check_invariants(response.json(), body.get("limit", 10))

    logged = "\n".join(record.getMessage() for record in caplog.records).lower()
    for secret in (
        "sesame", "sulphites", "sulfites", "kidney", "cholesterol", "zzunknownzz", "zzgoalzz",
        "restrictions", "none_confirmed", "unconfigured",
    ):
        assert secret not in logged, secret


# ── Rate limit is unchanged ──────────────────────────────────
def test_rate_limit_still_applies(client, breakfast):
    responses = [post(client, breakfast.id, NONE) for _ in range(21)]
    assert [response.status_code for response in responses] == [200] * 20 + [429]
    for response in responses[:20]:
        check_invariants(response.json(), 10)


# ── Ownership and leftovers (criteria 5, 20) ─────────────────
def _backend_sources():
    skip = {"tests", "__pycache__", ".pytest_cache", ".ruff_cache"}
    for path in BACKEND.rglob("*.py"):
        if not skip.intersection(path.relative_to(BACKEND).parts):
            yield path.relative_to(BACKEND).as_posix(), path.read_text(encoding="utf-8")


def test_one_category_mapping_shared_by_router_and_engine():
    assert foods_router.CATEGORY_SWAP_GROUPS is food_categories.CATEGORY_SWAP_GROUPS
    assert E.CATEGORY_SWAP_GROUPS is food_categories.CATEGORY_SWAP_GROUPS

    definers = [
        name for name, source in _backend_sources()
        if "CATEGORY_SWAP_GROUPS =" in source or "MEAL_CATEGORIES =" in source
    ]
    assert definers == ["domain/food_categories.py"]


def test_old_status_name_and_old_engine_are_gone():
    old_status = "may" + "_contain"
    for name, source in _backend_sources():
        assert old_status not in source, name
    router_source = (BACKEND / "routers" / "foods.py").read_text(encoding="utf-8")
    for leftover in ("ALLERGEN_MAP", "VALID_HEALTH_GOALS", "fallback", "nutrition_score.desc"):
        assert leftover not in router_source, leftover
