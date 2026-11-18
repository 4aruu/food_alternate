"""Nutrition rules: presets, value classification, basis object, texts."""

import math
import re

import pytest

from domain import nutrition_rules as N

FIELDS = ("calories", "protein", "fat", "carbohydrates", "fiber", "sugar", "sodium")
GOOD = {"calories": 300, "protein": 15, "fat": 6, "carbohydrates": 40, "fiber": 5, "sugar": 3, "sodium": 200}

# Thresholds carried over from the router's original engine.
EXPECTED_PRESETS = {
    "diabetic": [("sugar", "lt", 5, "g"), ("fiber", "gt", 2, "g")],
    "heart": [("sodium", "lt", 400, "mg"), ("fat", "lt", 10, "g")],
    "weight": [("calories", "lt", 400, "kcal")],
    "muscle": [("protein", "gt", 10, "g")],
    "kidney": [("sodium", "lt", 300, "mg"), ("protein", "lt", 20, "g")],
    "cholesterol": [("fat", "lt", 8, "g")],
}
EXPECTED_LABELS = {
    "diabetic": "Sugar and fiber filter",
    "heart": "Sodium and fat filter",
    "weight": "Calorie filter",
    "muscle": "Protein filter",
    "kidney": "Sodium and protein filter",
    "cholesterol": "Fat filter",
}


# ── Presets and metadata (criterion 51) ──────────────────────
def test_fields_and_preset_order():
    assert N.NUTRITION_FIELDS == FIELDS
    assert list(N.PRESETS) == ["diabetic", "heart", "weight", "muscle", "kidney", "cholesterol"]


def test_preset_thresholds():
    actual = {
        key: [(f.field, f.op, f.value, f.unit) for f in preset.filters]
        for key, preset in N.PRESETS.items()
    }
    assert actual == EXPECTED_PRESETS


def test_metadata_matches_the_presets_the_engine_applies():
    meta = N.health_goals_metadata()
    assert set(meta) == {"presets", "disclaimer"}
    assert meta["disclaimer"] == N.DISCLAIMER
    assert [p["key"] for p in meta["presets"]] == list(EXPECTED_PRESETS)
    for preset in meta["presets"]:
        assert set(preset) == {"key", "label", "kind", "basis", "filters"}
        assert preset["label"] == EXPECTED_LABELS[preset["key"]]
        assert preset["kind"] == "exploratory_filter"
        assert preset["basis"] == "as_stored_unstandardized"
        assert preset["filters"]
        listed = [(f["field"], f["op"], f["value"], f["unit"]) for f in preset["filters"]]
        assert listed == EXPECTED_PRESETS[preset["key"]]
        applied = [(f.field, f.op, f.value, f.unit) for f in N.active_filters([preset["key"]])]
        assert listed == applied
        for condition in preset["filters"]:
            assert set(condition) == {"field", "op", "value", "unit"}


def test_validate_health_goals():
    assert N.validate_health_goals([]) == ([], [])
    assert N.validate_health_goals(["heart", "diabetic", "heart"]) == (["heart", "diabetic"], [])
    assert N.validate_health_goals([" Diabetic "]) == (["diabetic"], [])
    assert N.validate_health_goals(["keto", "weight", ""]) == (["weight"], ["keto", ""])


def test_unknown_health_goal_message():
    assert N.unknown_health_goal_message(["keto"]) == (
        "Unknown health goal(s): 'keto'. Valid values: diabetic, heart, weight, "
        "muscle, kidney, cholesterol."
    )


# ── Value classification (criterion 44) ──────────────────────
@pytest.mark.parametrize("value", [0, 0.0, 1, 2.5, 10**6])
def test_valid_values(value):
    assert N.classify_value(value) == "valid"


def test_null_is_missing():
    assert N.classify_value(None) == "missing"


@pytest.mark.parametrize("value", [-1, -0.001, math.nan, math.inf, -math.inf, "12", True])
def test_invalid_values(value):
    assert N.classify_value(value) == "invalid"


def test_nutrition_values_reads_a_record():
    class Row:
        calories, protein, fat, carbohydrates, fiber, sugar, sodium = 1, 2, 3, 4, 5, 6, None

    assert N.nutrition_values(None) is None
    assert N.nutrition_values(Row()) == {
        "calories": 1, "protein": 2, "fat": 3, "carbohydrates": 4,
        "fiber": 5, "sugar": 6, "sodium": None,
    }


def test_quality_for_a_complete_record():
    assert N.nutrition_quality(GOOD) == {
        "nutrition_record_present": True, "missing_fields": [], "invalid_fields": [],
    }


def test_quality_lists_missing_and_invalid_fields_in_field_order():
    values = {**GOOD, "sodium": None, "calories": None, "sugar": -4, "fat": math.nan, "fiber": math.inf, "protein": -math.inf}
    assert N.nutrition_quality(values) == {
        "nutrition_record_present": True,
        "missing_fields": ["calories", "sodium"],
        "invalid_fields": ["protein", "fat", "fiber", "sugar"],
    }


def test_quality_without_a_record():
    assert N.nutrition_quality(None) == {
        "nutrition_record_present": False,
        "missing_fields": list(FIELDS),
        "invalid_fields": [],
    }


def test_sanitized_values_are_null_never_zero():
    values = {**GOOD, "sodium": None, "sugar": -4, "fat": math.nan, "fiber": math.inf, "protein": -math.inf}
    assert N.sanitized_nutrition(values) == {
        "calories": 300, "protein": None, "fat": None, "carbohydrates": 40,
        "fiber": None, "sugar": None, "sodium": None,
    }
    assert N.sanitized_nutrition(None) == dict.fromkeys(FIELDS)
    assert N.sanitized_nutrition({**GOOD, "sugar": 0})["sugar"] == 0


# ── Basis object (criterion 46) ──────────────────────────────
def test_nutrition_basis_object():
    assert N.nutrition_basis("1 Portion") == {
        "code": "as_stored_unstandardized",
        "standardized": False,
        "source_portion": None,
        "source_portion_known": False,
        "serving_label_as_stored": "1 Portion",
        "serving_label_reliable": False,
        "value_provenance": "unverified_manual_entry",
    }
    assert N.nutrition_basis(None)["serving_label_as_stored"] is None


# ── Preset evaluation (criteria 43, 44) ──────────────────────
def test_no_preset_always_passes():
    assert N.evaluate_presets(GOOD, []).outcome == "pass"
    assert N.evaluate_presets(None, []).outcome == "pass"
    assert N.evaluate_presets({**GOOD, "sugar": -1}, []).outcome == "pass"


def test_a_preset_requires_all_its_conditions():
    assert N.evaluate_presets({**GOOD, "sugar": 3, "fiber": 5}, ["diabetic"]).outcome == "pass"
    assert N.evaluate_presets({**GOOD, "sugar": 3, "fiber": 1}, ["diabetic"]).outcome == "failed_filter"
    assert N.evaluate_presets({**GOOD, "sugar": 9, "fiber": 5}, ["diabetic"]).outcome == "failed_filter"
    assert N.evaluate_presets({**GOOD, "sugar": 9, "fiber": 1}, ["diabetic"]).outcome == "failed_filter"


def test_thresholds_are_strict():
    assert N.evaluate_presets({**GOOD, "sugar": 5}, ["diabetic"]).outcome == "failed_filter"
    assert N.evaluate_presets({**GOOD, "fiber": 2}, ["diabetic"]).outcome == "failed_filter"
    assert N.evaluate_presets({**GOOD, "calories": 399.9}, ["weight"]).outcome == "pass"


def test_several_presets_combine_with_and():
    values = {**GOOD, "sugar": 3, "fiber": 5, "protein": 8}
    assert N.evaluate_presets(values, ["diabetic"]).outcome == "pass"
    assert N.evaluate_presets(values, ["muscle"]).outcome == "failed_filter"
    assert N.evaluate_presets(values, ["diabetic", "muscle"]).outcome == "failed_filter"
    assert N.evaluate_presets({**values, "protein": 12}, ["diabetic", "muscle"]).outcome == "pass"


def test_matched_filters_are_reported_in_order_on_pass_only():
    result = N.evaluate_presets(GOOD, ["diabetic", "muscle"])
    assert [(f.field, f.op, f.value) for f in result.matched] == [
        ("sugar", "lt", 5), ("fiber", "gt", 2), ("protein", "gt", 10),
    ]
    assert N.evaluate_presets({**GOOD, "sugar": 9}, ["diabetic"]).matched == ()


def test_null_filtered_field_is_missing_not_zero():
    # A null read as 0 would pass "sugar < 5"; it must not.
    assert N.evaluate_presets({**GOOD, "sugar": None}, ["diabetic"]).outcome == "nutrition_missing"
    assert N.evaluate_presets({**GOOD, "sodium": None}, ["heart"]).outcome == "nutrition_missing"


@pytest.mark.parametrize("bad", [-1, math.nan, math.inf, -math.inf])
def test_invalid_filtered_field_is_invalid_not_zero(bad):
    assert N.evaluate_presets({**GOOD, "sugar": bad}, ["diabetic"]).outcome == "nutrition_invalid"


def test_invalid_outranks_missing_and_failed():
    values = {**GOOD, "sugar": -1, "fiber": None}
    assert N.evaluate_presets(values, ["diabetic"]).outcome == "nutrition_invalid"
    values = {**GOOD, "sugar": 9, "fiber": None}
    assert N.evaluate_presets(values, ["diabetic"]).outcome == "nutrition_missing"


def test_unfiltered_fields_do_not_matter():
    values = {**GOOD, "sodium": None, "calories": -5}
    assert N.evaluate_presets(values, ["diabetic"]).outcome == "pass"


def test_no_nutrition_record_is_missing_when_a_preset_is_active():
    for key in N.PRESETS:
        assert N.evaluate_presets(None, [key]).outcome == "nutrition_missing"


# ── Uncertainty entries (criterion 47) ───────────────────────
def test_unstandardized_entry_is_always_present():
    entries = N.nutrition_uncertainty_entries(N.nutrition_quality(GOOD))
    assert entries == [{"code": "nutrition_unstandardized", "text": N.NUTRITION_UNSTANDARDIZED_TEXT}]


def test_incomplete_entry_lists_missing_then_invalid():
    quality = N.nutrition_quality({**GOOD, "sodium": None, "calories": -1})
    entries = N.nutrition_uncertainty_entries(quality)
    assert [e["code"] for e in entries] == ["nutrition_unstandardized", "nutrition_incomplete"]
    assert entries[1] == {
        "code": "nutrition_incomplete",
        "fields": ["sodium", "calories"],
        "text": "Some nutrition values for this food are not available.",
    }


def test_format_number():
    assert N.format_number(2.0) == "2"
    assert N.format_number(5) == "5"
    assert N.format_number(2.5) == "2.5"
    assert N.format_number(400) == "400"


# ── Fixed texts (criteria 29, 41, 46, 48, 51) ────────────────
def _all_texts():
    return list(N.FIXED_TEXTS.values()) + [p.label for p in N.PRESETS.values()]


def test_fixed_texts():
    assert N.FIXED_TEXTS == {
        "disclaimer": (
            "Exploratory filters for food discovery. Not medical advice and not "
            "validated for any medical condition. Allergen information is incomplete "
            "and can depend on preparation; always check labels or ask the preparer."
        ),
        "uncertainty.nutrition_unstandardized": (
            "Nutrition values were entered from source portions that differ between "
            "foods and have no recorded measurement basis; do not compare them as "
            "equivalent amounts."
        ),
        "uncertainty.nutrition_incomplete": "Some nutrition values for this food are not available.",
    }


def test_no_medical_or_suitability_wording():
    banned = (
        "medically validated", "medical validated", "GI", "saturated",
        "suitable for", "safe for", "prescription", "recommended for",
    )
    for text in _all_texts():
        for phrase in banned:
            assert phrase not in text, (phrase, text)
            if phrase != "GI":
                assert phrase not in text.lower(), (phrase, text)


def test_no_comparative_or_allergen_absence_wording():
    banned = (
        "lower than", "higher than", "better", "healthier", "best value", "winner",
        "allergen-free", "free of allergens", "free from allergens", "no allergens",
        "no known allergens", "no allergies", "safe for you", "safe to eat", "contains no",
        "per portion", "standardised",
    )
    for text in _all_texts():
        lowered = text.lower()
        for phrase in banned:
            assert phrase not in lowered, (phrase, text)


def test_no_text_mentions_cooking_or_heating():
    pattern = re.compile(r"\b(cook|heat)", re.IGNORECASE)
    for text in _all_texts():
        assert not pattern.search(text), text
