"""Discovery engine: eligibility, ranking, precedence, counts, outcome, texts."""

import itertools
import math
import random
import re
from pathlib import Path

import pytest

from domain import allergens as A
from domain import food_categories, nutrition_rules
from schemas import AlternativesResponse
from services import discovery_engine as E

CODES = A.CANONICAL_CODES
STATUSES = ("present", "possible", "absent", "unknown")
GOOD = {"calories": 300, "protein": 15, "fat": 6, "carbohydrates": 40, "fiber": 5, "sugar": 3, "sodium": 200}
ORIGINAL = E.OriginalFood(id=1, name="Puttu", category="Breakfast")
BACKEND = Path(__file__).resolve().parent.parent


# ── Builders ─────────────────────────────────────────────────
def code_status(ingredient="absent", cross_contact="absent"):
    return A.CodeStatus(
        ingredient,
        "legacy_default_false" if ingredient == "unknown" else "legacy_seed_heuristic",
        cross_contact,
        "no_source" if cross_contact == "unknown" else "verified_preparation_source",
    )


def status_map(default=("absent", "absent"), **overrides):
    result = {code: code_status(*default) for code in CODES}
    for code, pair in overrides.items():
        result[code] = code_status(*pair)
    return result


def cand(food_id, category="Breakfast", nutrition=GOOD, default=("absent", "absent"), **overrides):
    return E.Candidate(
        id=food_id, name=f"Food {food_id}", category=category,
        allergen_status=status_map(default, **overrides), nutrition=nutrition,
        brand="Brand", image="/x.jpg", serving_size="1 Portion",
    )


def legacy_cand(food_id, category="Breakfast", nutrition=GOOD, **flags):
    """A candidate shaped like the current data: legacy booleans only."""
    base = dict.fromkeys(A.LEGACY_COLUMNS, False)
    base.update(flags)
    return E.Candidate(
        id=food_id, name=f"Food {food_id}", category=category,
        allergen_status=A.build_status_map(food_id, base), nutrition=nutrition,
        serving_size="1 Portion",
    )


def run(foods, avoid=(), goals=(), limit=10, original=ORIGINAL):
    response = E.discover(
        original, foods,
        profile_status="restrictions" if avoid else "none_confirmed",
        avoid=list(avoid), health_goals=list(goals), limit=limit,
    )
    check_invariants(response, limit)
    return response


def check_invariants(response, limit):
    excluded = response["excluded"]
    considered = response["candidates_considered"]
    counts = excluded["by_primary_reason"]
    assert list(counts) == list(E.PRIMARY_REASON_CODES)
    assert sum(counts.values()) == excluded["total"]  # I1
    assert response["eligible_total"] + excluded["total"] == considered  # I2
    assert len(response["results"]) == min(response["eligible_total"], limit)  # I3

    by_allergen = excluded["allergen_detail"]["by_allergen"]
    assert list(by_allergen) == response["applied"]["avoid"]
    for detail in by_allergen.values():
        assert set(detail) == {"ingredient", "cross_contact"}
        for dimension, keys in (
            ("ingredient", A.INGREDIENT_UNKNOWN_PROVENANCE),
            ("cross_contact", A.CROSS_CONTACT_UNKNOWN_PROVENANCE),
        ):
            dim = detail[dimension]
            assert sum(dim[s] for s in STATUSES) == considered  # I4
            assert list(dim["unknown_by_provenance"]) == list(keys)
            assert sum(dim["unknown_by_provenance"].values()) == dim["unknown"]  # I5

    # Outcome rule, first match wins
    allergen_excluded = sum(counts[r] for r in E.ALLERGEN_REASON_CODES)
    if considered == 0:
        expected = "no_candidates"
    elif response["eligible_total"] > 0:
        expected = "alternatives_found"
    elif allergen_excluded > 0:
        expected = "no_verified_alternatives"
    else:
        expected = "no_matching_alternatives"
    assert response["outcome"]["code"] == expected

    assert [r["rank"] for r in response["results"]] == list(range(1, len(response["results"]) + 1))
    # The response is exactly what the API schema allows, and survives a round trip.
    assert AlternativesResponse.model_validate(response).model_dump() == response


# ── Eligibility (criteria 23 to 26) ──────────────────────────
@pytest.mark.parametrize("code", CODES)
def test_only_absent_absent_is_eligible_for_an_avoided_code(code):
    passed = []
    for ingredient, cross_contact in itertools.product(STATUSES, repeat=2):
        candidate = cand(2, **{code: (ingredient, cross_contact)})
        if E.is_eligible(candidate, [code], []):
            passed.append((ingredient, cross_contact))
    assert passed == [("absent", "absent")]


def test_all_sixteen_combinations_are_covered():
    assert len(list(itertools.product(STATUSES, repeat=2))) == 16


@pytest.mark.parametrize("pair", [("unknown", "absent"), ("absent", "unknown"), ("unknown", "unknown")])
def test_unknown_is_never_treated_as_absence(pair):
    assert not E.is_eligible(cand(2, milk=pair), ["milk"], [])


@pytest.mark.parametrize("flags", [None, {}, {"dairy": False}, {"dairy": None}])
def test_legacy_false_null_missing_and_no_record_are_all_ineligible(flags):
    candidate = E.Candidate(
        id=2, name="F", category="Breakfast",
        allergen_status=A.build_status_map(2, flags), nutrition=GOOD,
    )
    assert candidate.allergen_status["milk"].ingredient == "unknown"
    assert E.primary_exclusion_reason(candidate, ["milk"], []) == "allergen_ingredient_unknown"


def test_several_avoided_codes_must_all_pass():
    candidate = cand(2, eggs=("absent", "unknown"))
    assert E.is_eligible(candidate, ["milk"], [])
    assert E.is_eligible(candidate, ["milk", "soy"], [])
    assert not E.is_eligible(candidate, ["milk", "eggs"], [])
    assert not E.is_eligible(candidate, ["eggs"], [])


def test_a_code_the_user_did_not_avoid_never_excludes():
    candidate = cand(2, default=("present", "present"), milk=("absent", "absent"))
    assert E.is_eligible(candidate, ["milk"], [])
    response = run([candidate], avoid=["milk"])
    assert response["eligible_total"] == 1
    entries = {e["code"]: e for e in response["results"][0]["uncertainty"]}
    others = [code for code in CODES if code != "milk"]
    assert entries["allergen_ingredient_flagged"]["allergens"] == others
    assert entries["allergen_cross_contact_flagged"]["allergens"] == others


def test_an_unrecognised_status_fails_closed():
    broken = dict(status_map())
    broken["milk"] = A.CodeStatus("none", "legacy_default_false", "absent", "no_source")
    candidate = E.Candidate(id=2, name="F", category="Breakfast", allergen_status=broken, nutrition=GOOD)
    with pytest.raises(ValueError):
        E.primary_exclusion_reason(candidate, ["milk"], [])


# ── none_confirmed (criterion 27) ────────────────────────────
def test_none_confirmed_applies_no_allergen_gate_but_keeps_uncertainty():
    foods = [legacy_cand(2, dairy=True), legacy_cand(3), cand(4, default=("present", "present"))]
    response = run(foods)
    assert response["applied"]["allergen_profile_status"] == "none_confirmed"
    assert response["applied"]["allergen_filtering"] == "not_applied"
    assert response["applied"]["avoid"] == []
    assert response["eligible_total"] == 3
    assert response["excluded"]["allergen_detail"] == {
        "unit": "candidate_allergen_pairs", "additive_across_allergens": False, "by_allergen": {},
    }
    for result in response["results"]:
        codes = [e["code"] for e in result["uncertainty"]]
        assert "preparation_dependent" in codes
        assert any(code.startswith("allergen_") for code in codes)
        assert result["food"]["preparation"] == {"details_known": False}


def test_restrictions_report_filtering_as_applied():
    response = run([legacy_cand(2)], avoid=["milk"])
    assert response["applied"]["allergen_profile_status"] == "restrictions"
    assert response["applied"]["allergen_filtering"] == "applied"
    assert response["applied"]["nutrition_basis"] == "as_stored_unstandardized"


@pytest.mark.parametrize("status,avoid", [
    ("restrictions", []), ("none_confirmed", ["milk"]), ("unconfigured", []), (None, []),
])
def test_engine_refuses_an_inconsistent_profile(status, avoid):
    with pytest.raises(ValueError):
        E.discover(ORIGINAL, [], profile_status=status, avoid=avoid, health_goals=[], limit=10)


def test_engine_refuses_aliases_unknown_goals_and_a_zero_limit():
    for kwargs in (
        {"profile_status": "restrictions", "avoid": ["dairy"], "health_goals": [], "limit": 10},
        {"profile_status": "none_confirmed", "avoid": [], "health_goals": ["keto"], "limit": 10},
        {"profile_status": "none_confirmed", "avoid": [], "health_goals": [], "limit": 0},
    ):
        with pytest.raises(ValueError):
            E.discover(ORIGINAL, [], **kwargs)


# ── Primary reason precedence (criterion 30) ─────────────────
BAD_SUGAR = {**GOOD, "sugar": -1}
NO_FIBER = {**GOOD, "fiber": None}
HIGH_SUGAR = {**GOOD, "sugar": 9}


@pytest.mark.parametrize("candidate,goals,expected", [
    # each reason on its own
    (cand(2, milk=("present", "absent")), [], "allergen_ingredient_present"),
    (cand(2, milk=("absent", "present")), [], "allergen_cross_contact_present"),
    (cand(2, milk=("possible", "absent")), [], "allergen_ingredient_possible"),
    (cand(2, milk=("absent", "possible")), [], "allergen_cross_contact_possible"),
    (cand(2, milk=("unknown", "absent")), [], "allergen_ingredient_unknown"),
    (cand(2, milk=("absent", "unknown")), [], "allergen_cross_contact_unknown"),
    (cand(2, nutrition=BAD_SUGAR), ["diabetic"], "nutrition_invalid"),
    (cand(2, nutrition=NO_FIBER), ["diabetic"], "nutrition_missing"),
    (cand(2, nutrition=None), ["diabetic"], "nutrition_missing"),
    (cand(2, nutrition=HIGH_SUGAR), ["diabetic"], "failed_filter"),
    # adjacent ranks: the higher one wins
    (cand(2, milk=("present", "present")), [], "allergen_ingredient_present"),  # 1 over 2
    (cand(2, milk=("possible", "present")), [], "allergen_cross_contact_present"),  # 2 over 3
    (cand(2, milk=("possible", "possible")), [], "allergen_ingredient_possible"),  # 3 over 4
    (cand(2, milk=("unknown", "possible")), [], "allergen_cross_contact_possible"),  # 4 over 5
    (cand(2, milk=("unknown", "unknown")), [], "allergen_ingredient_unknown"),  # 5 over 6
    (cand(2, milk=("absent", "unknown"), nutrition=BAD_SUGAR), ["diabetic"], "allergen_cross_contact_unknown"),  # 6 over 7
    (cand(2, nutrition={**GOOD, "sugar": -1, "fiber": None}), ["diabetic"], "nutrition_invalid"),  # 7 over 8
    (cand(2, nutrition={**GOOD, "sugar": 9, "fiber": None}), ["diabetic"], "nutrition_missing"),  # 8 over 9
    # named cases
    (cand(2, milk=("possible", "absent"), eggs=("unknown", "absent")), [], "allergen_ingredient_possible"),
    (cand(2, milk=("unknown", "absent"), nutrition=NO_FIBER), ["diabetic"], "allergen_ingredient_unknown"),
    (cand(2, milk=("absent", "present"), eggs=("present", "absent")), [], "allergen_ingredient_present"),
])
def test_primary_reason(candidate, goals, expected):
    assert E.primary_exclusion_reason(candidate, ["milk", "eggs"], goals) == expected
    response = run([candidate], avoid=["milk", "eggs"], goals=goals)
    counts = response["excluded"]["by_primary_reason"]
    assert counts[expected] == 1
    assert response["excluded"]["total"] == 1  # counted exactly once


def test_reason_order_matches_the_documented_ranks():
    assert E.PRIMARY_REASON_CODES == (
        "allergen_ingredient_present", "allergen_cross_contact_present",
        "allergen_ingredient_possible", "allergen_cross_contact_possible",
        "allergen_ingredient_unknown", "allergen_cross_contact_unknown",
        "nutrition_invalid", "nutrition_missing", "failed_filter",
    )


# ── Outcome (criteria 31 to 34) ──────────────────────────────
def test_outcome_allergen_only():
    foods = [legacy_cand(2, dairy=True), legacy_cand(3), legacy_cand(4)]
    response = run(foods, avoid=["milk"])
    assert response["outcome"]["code"] == "no_verified_alternatives"
    assert response["outcome"]["text"] == E.OUTCOME_TEXTS["no_verified_alternatives"]
    assert response["results"] == []
    counts = response["excluded"]["by_primary_reason"]
    assert counts["allergen_ingredient_possible"] == 1
    assert counts["allergen_ingredient_unknown"] == 2


def test_outcome_nutrition_only():
    foods = [cand(2, nutrition=HIGH_SUGAR), cand(3, nutrition=NO_FIBER), cand(4, nutrition=BAD_SUGAR), cand(5, nutrition=None)]
    response = run(foods, goals=["diabetic"])
    assert response["outcome"]["code"] == "no_matching_alternatives"
    assert response["outcome"]["text"] == E.OUTCOME_TEXTS["no_matching_alternatives"]
    counts = response["excluded"]["by_primary_reason"]
    assert (counts["failed_filter"], counts["nutrition_missing"], counts["nutrition_invalid"]) == (1, 2, 1)
    assert sum(counts[r] for r in E.ALLERGEN_REASON_CODES) == 0


def test_outcome_mixed_is_no_verified_alternatives():
    foods = [legacy_cand(2), cand(3, nutrition=HIGH_SUGAR), cand(4, nutrition=NO_FIBER)]
    response = run(foods, avoid=["milk"], goals=["diabetic"])
    counts = response["excluded"]["by_primary_reason"]
    assert counts["allergen_ingredient_unknown"] == 1
    assert counts["failed_filter"] == 1
    assert counts["nutrition_missing"] == 1
    assert response["outcome"]["code"] == "no_verified_alternatives"


def test_outcome_verified_allergens_but_nutrition_fails():
    foods = [cand(2, nutrition=HIGH_SUGAR), cand(3, nutrition=HIGH_SUGAR)]
    response = run(foods, avoid=["milk"], goals=["diabetic"])
    assert response["excluded"]["by_primary_reason"]["failed_filter"] == 2
    assert response["outcome"]["code"] == "no_matching_alternatives"


def test_outcome_no_candidates():
    for foods in ([], [cand(1)], [cand(2, category="Drink")]):
        response = run(foods, avoid=["milk"], goals=["diabetic"])
        assert response["candidates_considered"] == 0
        assert response["outcome"] == {
            "code": "no_candidates",
            "text": "There are no other foods in this food's category group.",
        }


def test_outcome_alternatives_found_substitutes_eligible_total():
    response = run([cand(2), cand(3), cand(4)], avoid=["milk"], limit=1)
    assert response["eligible_total"] == 3
    assert len(response["results"]) == 1
    assert response["outcome"] == {"code": "alternatives_found", "text": "3 alternatives found."}


def test_decide_outcome_order():
    zero = dict.fromkeys(E.PRIMARY_REASON_CODES, 0)
    assert E.decide_outcome(0, 0, zero) == "no_candidates"
    assert E.decide_outcome(3, 1, {**zero, "allergen_ingredient_unknown": 2}) == "alternatives_found"
    for reason in E.ALLERGEN_REASON_CODES:
        assert E.decide_outcome(3, 0, {**zero, reason: 1, "failed_filter": 2}) == "no_verified_alternatives"
    for reason in E.NUTRITION_REASON_CODES:
        assert E.decide_outcome(3, 0, {**zero, reason: 3}) == "no_matching_alternatives"


# ── Counts (criteria 35, 36) ─────────────────────────────────
def test_allergen_detail_counts_pairs_per_code():
    foods = [
        legacy_cand(2, dairy=True),
        legacy_cand(3),
        E.Candidate(id=4, name="No record", category="Breakfast", allergen_status=A.build_status_map(4, None), nutrition=GOOD),
        E.Candidate(id=5, name="Null", category="Breakfast", allergen_status=A.build_status_map(5, {"dairy": None}), nutrition=GOOD),
    ]
    response = run(foods, avoid=["milk", "sesame"])
    detail = response["excluded"]["allergen_detail"]
    assert detail["unit"] == "candidate_allergen_pairs"
    assert detail["additive_across_allergens"] is False
    assert detail["by_allergen"]["milk"] == {
        "ingredient": {
            "present": 0, "possible": 1, "absent": 0, "unknown": 3,
            "unknown_by_provenance": {"legacy_default_false": 1, "legacy_null": 1, "no_allergen_record": 1, "not_tracked": 0},
        },
        "cross_contact": {
            "present": 0, "possible": 0, "absent": 0, "unknown": 4,
            "unknown_by_provenance": {"no_source": 4, "insufficient_preparation_evidence": 0},
        },
    }
    sesame = detail["by_allergen"]["sesame"]["ingredient"]
    assert sesame["unknown"] == 4
    assert sesame["unknown_by_provenance"] == {"legacy_default_false": 0, "legacy_null": 0, "no_allergen_record": 1, "not_tracked": 3}


def test_unknown_with_a_non_unknown_provenance_is_rejected():
    broken = dict(status_map())
    broken["milk"] = A.CodeStatus("unknown", "legacy_seed_heuristic", "absent", "verified_preparation_source")
    candidate = E.Candidate(id=2, name="F", category="Breakfast", allergen_status=broken, nutrition=GOOD)
    with pytest.raises(ValueError):
        E.discover(ORIGINAL, [candidate], profile_status="restrictions", avoid=["milk"], health_goals=[], limit=10)


def _random_candidate(rng, food_id, categories):
    statuses = {}
    for code in CODES:
        ingredient = rng.choice(STATUSES)
        cross_contact = rng.choice(STATUSES)
        statuses[code] = A.CodeStatus(
            ingredient,
            rng.choice(A.INGREDIENT_UNKNOWN_PROVENANCE) if ingredient == "unknown" else "legacy_seed_heuristic",
            cross_contact,
            rng.choice(A.CROSS_CONTACT_UNKNOWN_PROVENANCE) if cross_contact == "unknown" else "verified_preparation_source",
        )
    if rng.random() < 0.6:
        # a food the allergen gate can pass, so every outcome is reachable
        for code in CODES:
            statuses[code] = code_status()
    if rng.random() < 0.1:
        nutrition = None
    else:
        nutrition = {}
        for field in nutrition_rules.NUTRITION_FIELDS:
            nutrition[field] = rng.choice(
                [None, -1, math.nan, math.inf, -math.inf] + [rng.uniform(0, 30) for _ in range(12)]
            )
    return E.Candidate(
        id=food_id, name=f"Food {food_id}", category=rng.choice(categories),
        allergen_status=statuses, nutrition=nutrition, serving_size="1 Portion",
    )


def test_invariants_hold_over_randomised_fixtures():
    rng = random.Random(20261115)
    categories = ["Breakfast", "Lunch", "Snack", "Drink", "Street Food", None]
    outcomes = set()
    for _ in range(300):
        original = E.OriginalFood(id=1, name="Original", category=rng.choice(categories))
        foods = [_random_candidate(rng, food_id, categories) for food_id in range(1, rng.randint(1, 25))]
        rng.shuffle(foods)
        avoid = [code for code in CODES if rng.random() < 0.15]
        goals = [key for key in nutrition_rules.PRESETS if rng.random() < 0.2]
        limit = rng.randint(1, 50)
        response = run(foods, avoid=avoid, goals=goals, limit=limit, original=original)
        outcomes.add(response["outcome"]["code"])

        result_ids = [r["food"]["id"] for r in response["results"]]
        by_id = {food.id: food for food in foods}
        assert all(E.is_eligible(by_id[i], avoid, goals) for i in result_ids)
        assert 1 not in result_ids
    assert outcomes == {
        "no_candidates", "alternatives_found", "no_verified_alternatives", "no_matching_alternatives",
    }


# ── Ranking (criteria 3, 4, 49) ──────────────────────────────
def _twenty_foods():
    categories = ["Breakfast", "Lunch", "Dinner", "Snack"]
    return [cand(food_id, category=categories[food_id % 4]) for food_id in range(2, 22)]


def test_ranking_never_adds_removes_or_changes_a_food():
    foods = _twenty_foods()
    rng = random.Random(7)
    expected = None
    for _ in range(25):
        shuffled = foods[:]
        rng.shuffle(shuffled)
        ranked = E.rank_candidates(shuffled, "Breakfast")
        assert sorted(c.id for c in ranked) == sorted(c.id for c in foods)
        assert all(a is b for a, b in zip(sorted(ranked, key=id), sorted(foods, key=id), strict=True))
        order = [c.id for c in ranked]
        expected = expected or order
        assert order == expected  # same order on every run


def test_ranking_is_category_then_swap_group_then_id():
    ranked = E.rank_candidates(_twenty_foods(), "Breakfast")
    keys = [
        (c.category != "Breakfast", c.category not in food_categories.CATEGORY_SWAP_GROUPS["Breakfast"], c.id)
        for c in ranked
    ]
    assert keys == sorted(keys)
    assert [c.category for c in ranked[:5]] == ["Breakfast"] * 5
    assert {c.category for c in ranked[5:15]} == {"Lunch", "Dinner"}
    assert {c.category for c in ranked[15:]} == {"Snack"}
    assert [c.id for c in ranked[:5]] == [4, 8, 12, 16, 20]


def test_ranking_ignores_brand_name_and_nutrient_values():
    plain = [cand(i, category="Lunch") for i in (5, 3, 9, 7)]
    varied = [
        E.Candidate(
            id=c.id, name=f"Z{20 - c.id}", category=c.category, allergen_status=c.allergen_status,
            nutrition={**GOOD, "sugar": c.id * 3, "protein": 100 - c.id}, brand=f"B{c.id % 2}",
        )
        for c in plain
    ]
    assert [c.id for c in E.rank_candidates(plain, "Breakfast")] == [3, 5, 7, 9]
    assert [c.id for c in E.rank_candidates(varied, "Breakfast")] == [3, 5, 7, 9]


def test_eligibility_and_ranking_are_separate_functions():
    foods = _twenty_foods() + [cand(30, milk=("unknown", "unknown")), cand(31, nutrition=HIGH_SUGAR)]
    scope = food_categories.CATEGORY_SWAP_GROUPS["Breakfast"]
    in_scope = [c for c in foods if c.category in scope]  # the 5 Snack foods are out of scope
    eligible = [c for c in in_scope if E.is_eligible(c, ["milk"], ["diabetic"])]
    assert (len(in_scope), len(eligible)) == (17, 15)
    response = run(foods, avoid=["milk"], goals=["diabetic"], limit=50)
    assert response["candidates_considered"] == 17
    assert [r["food"]["id"] for r in response["results"]] == [c.id for c in E.rank_candidates(eligible, "Breakfast")]
    assert all(r["eligibility"] == "eligible" for r in response["results"])


def test_candidate_and_result_carry_no_nutrition_score():
    assert "nutrition_score" not in E.Candidate.__dataclass_fields__
    food = run([cand(2)])["results"][0]["food"]
    assert list(food) == [
        "id", "name", "brand", "category", "image", "serving_size", "nutrition",
        "nutrition_quality", "nutrition_basis", "allergen_status", "preparation",
    ]
    assert "allergens" not in food


def test_scope_excludes_the_original_and_other_category_groups():
    foods = [cand(1), cand(2), cand(3, category="Lunch"), cand(4, category="Drink"), cand(5, category=None)]
    response = run(foods)
    assert response["candidates_considered"] == 2
    assert [r["food"]["id"] for r in response["results"]] == [2, 3]
    assert response["applied"]["category_scope"] == food_categories.CATEGORY_SWAP_GROUPS["Breakfast"]
    assert response["applied"]["category_scope_source"] == "swap_group"


def test_unmapped_category_is_limited_to_itself():
    original = E.OriginalFood(id=1, name="Vada", category="Street Food")
    response = run([cand(2, category="Street Food"), cand(3, category="Snack")], original=original)
    assert response["applied"]["category_scope"] == ["Street Food"]
    assert response["applied"]["category_scope_source"] == "unmapped_same_category_only"
    assert [r["food"]["id"] for r in response["results"]] == [2]


# ── Results: reasons and uncertainty (criteria 39, 47, 60) ───
def test_result_matches_the_documented_example_shape():
    wheat_dosa = E.Candidate(
        id=14, name="Wheat Dosa", category="Breakfast", brand="Kerala Native",
        image="/assets/images/wheat_dosa.jpg", serving_size="1 Portion",
        allergen_status=A.build_status_map(14, {**dict.fromkeys(A.LEGACY_COLUMNS, False), "gluten": True}),
        nutrition={"calories": 210, "protein": 6, "fat": 4, "carbohydrates": 36, "fiber": 3, "sugar": 2, "sodium": None},
    )
    result = run([wheat_dosa], goals=["diabetic"], limit=1)["results"][0]
    assert result["rank"] == 1
    assert result["reasons"] == [
        {"code": "filter_threshold", "field": "sugar", "text": "Matches your selected exploratory filter: sugar below 5 g (stored value 2 g; measurement basis unknown)"},
        {"code": "filter_threshold", "field": "fiber", "text": "Matches your selected exploratory filter: fiber above 2 g (stored value 3 g; measurement basis unknown)"},
        {"code": "category", "text": "Same food category as Puttu: Breakfast"},
    ]
    assert [e["code"] for e in result["uncertainty"]] == [
        "allergen_ingredient_flagged", "allergen_ingredient_unverified",
        "allergen_cross_contact_unverified", "preparation_dependent",
        "nutrition_unstandardized", "nutrition_incomplete",
    ]
    assert result["uncertainty"][-1] == {
        "code": "nutrition_incomplete", "fields": ["sodium"],
        "text": "Some nutrition values for this food are not available.",
    }
    food = result["food"]
    assert food["nutrition"]["sodium"] is None
    assert food["nutrition_quality"] == {"nutrition_record_present": True, "missing_fields": ["sodium"], "invalid_fields": []}
    assert food["nutrition_basis"] == nutrition_rules.nutrition_basis("1 Portion")
    assert food["allergen_status"]["wheat"]["ingredient_provenance"] == "not_tracked"
    assert food["allergen_status"]["gluten"] == {
        "ingredient": "possible", "ingredient_provenance": "legacy_seed_heuristic",
        "cross_contact": "unknown", "cross_contact_provenance": "no_source",
    }
    assert list(food["allergen_status"]) == list(CODES)


def test_swap_group_reason_for_another_category_in_the_group():
    result = run([cand(2, category="Lunch")])["results"][0]
    assert result["reasons"] == [{"code": "swap_group", "text": "Same category group as Puttu: Lunch"}]


def test_threshold_reason_uses_units_and_plain_numbers():
    candidate = cand(2, nutrition={**GOOD, "sodium": 120.5, "fat": 2.0, "calories": 250})
    reasons = run([candidate], goals=["heart", "weight"])["results"][0]["reasons"]
    assert [r["text"] for r in reasons[:3]] == [
        "Matches your selected exploratory filter: sodium below 400 mg (stored value 120.5 mg; measurement basis unknown)",
        "Matches your selected exploratory filter: fat below 10 g (stored value 2 g; measurement basis unknown)",
        "Matches your selected exploratory filter: calories below 400 kcal (stored value 250 kcal; measurement basis unknown)",
    ]


def test_every_result_has_the_fixed_entries_and_they_stay_separate():
    foods = [legacy_cand(2, dairy=True), cand(3), cand(4, nutrition={**GOOD, "sodium": -5}), cand(5, nutrition=None)]
    response = run(foods)
    assert response["disclaimer"] == nutrition_rules.DISCLAIMER
    assert response["comparability"] == {
        "cross_food_nutrition_comparable": False,
        "reason": "unknown_and_inconsistent_measurement_basis",
    }
    for result in response["results"]:
        entries = result["uncertainty"]
        codes = [e["code"] for e in entries]
        assert len(codes) == len(set(codes))
        assert codes.count("preparation_dependent") == 1
        assert codes.count("nutrition_unstandardized") == 1
        prep = next(e for e in entries if e["code"] == "preparation_dependent")
        assert prep == {"code": "preparation_dependent", "text": A.PREPARATION_WARNING}
        quality = result["food"]["nutrition_quality"]
        listed = bool(quality["missing_fields"] or quality["invalid_fields"])
        assert ("nutrition_incomplete" in codes) == listed
        for entry in entries:
            assert ("allergens" in entry) == entry["code"].startswith("allergen_")
            assert ("fields" in entry) == (entry["code"] == "nutrition_incomplete")
    by_id = {r["food"]["id"]: r for r in response["results"]}
    assert "nutrition_incomplete" not in [e["code"] for e in by_id[3]["uncertainty"]]
    assert by_id[4]["food"]["nutrition"]["sodium"] is None
    assert by_id[4]["food"]["nutrition_quality"]["invalid_fields"] == ["sodium"]
    assert by_id[5]["food"]["nutrition_quality"]["nutrition_record_present"] is False


def test_candidate_from_record_reads_legacy_data_only():
    class Row:
        def __init__(self, **values):
            self.__dict__.update(values)

    food = Row(
        id=9, name="Tea", category="Drink", brand=None, image=None, serving_size="1 Portion",
        nutrition_score=99,
        nutrition=Row(calories=1, protein=2, fat=3, carbohydrates=4, fiber=5, sugar=6, sodium=None),
        allergens=Row(dairy=True, nuts=False, gluten=None, soy=False, eggs=False, shellfish=False),
    )
    candidate = E.candidate_from_record(food)
    assert candidate.allergen_status == A.build_status_map(9, {"dairy": True, "nuts": False, "gluten": None, "soy": False, "eggs": False, "shellfish": False})
    assert candidate.nutrition["sodium"] is None
    assert candidate.preparation_details_known is False

    food.allergens = None
    food.nutrition = None
    bare = E.candidate_from_record(food)
    assert {s.ingredient_provenance for s in bare.allergen_status.values()} == {"no_allergen_record"}
    assert bare.nutrition is None


# ── Fixed texts (criteria 29, 37, 41, 48) ────────────────────
def test_fixed_texts():
    assert E.FIXED_TEXTS == {
        "outcome.no_verified_alternatives": (
            "NutriSwap can't currently verify any alternative that meets your allergen "
            "restrictions, because its ingredient and cross-contact data is incomplete. "
            "No alternatives are shown rather than unverified ones."
        ),
        "outcome.no_matching_alternatives": "No alternatives in this food's category group match your selected exploratory filters.",
        "outcome.no_candidates": "There are no other foods in this food's category group.",
        "outcome.alternatives_found": "{n} alternatives found.",
        "reason.filter_threshold": "Matches your selected exploratory filter: {field} {direction} {value} {unit} (stored value {stored} {unit}; measurement basis unknown)",
        "reason.category": "Same food category as {original}: {category}",
        "reason.swap_group": "Same category group as {original}: {category}",
    }


def test_engine_texts_make_no_absence_safety_comparison_or_cooking_claims():
    banned = (
        "allergen-free", "free of allergens", "free from allergens", "no allergens",
        "no known allergens", "no allergies", "safe for you", "safe to eat", "contains no",
        "lower than", "higher than", "better", "healthier", "best value", "winner",
        "per portion", "standardised",
    )
    pattern = re.compile(r"\b(cook|heat|safe)", re.IGNORECASE)
    for text in E.FIXED_TEXTS.values():
        lowered = text.lower()
        for phrase in banned:
            assert phrase not in lowered, (phrase, text)
        assert not pattern.search(text), text


# ── Structure (criteria 4, 5) ────────────────────────────────
def test_engine_uses_the_single_category_mapping():
    assert E.CATEGORY_SWAP_GROUPS is food_categories.CATEGORY_SWAP_GROUPS


def test_engine_and_domain_logic_name_no_region_or_cuisine():
    names = ("Kerala", "Indian", "Chinese", "Arabic", "Continental", "Global")
    for relative in ("services/discovery_engine.py", "domain/allergens.py", "domain/nutrition_rules.py"):
        source = (BACKEND / relative).read_text(encoding="utf-8")
        for name in names:
            assert name.lower() not in source.lower(), (relative, name)
