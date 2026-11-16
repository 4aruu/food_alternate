"""Exploratory nutrition presets, value classification and the nutrition basis.

Stored values have no recorded measurement basis. A missing or invalid value is
never replaced by a number.
"""

import math
from collections.abc import Iterable, Mapping
from dataclasses import dataclass

NUTRITION_FIELDS = (
    "calories", "protein", "fat", "carbohydrates", "fiber", "sugar", "sodium",
)

BASIS_CODE = "as_stored_unstandardized"
PRESET_KIND = "exploratory_filter"
VALUE_PROVENANCE = "unverified_manual_entry"


# ── Presets ──────────────────────────────────────────────────
@dataclass(frozen=True)
class Filter:
    field: str
    op: str  # "lt" or "gt"
    value: float
    unit: str

    def as_dict(self) -> dict:
        return {"field": self.field, "op": self.op, "value": self.value, "unit": self.unit}


@dataclass(frozen=True)
class Preset:
    key: str
    label: str
    filters: tuple[Filter, ...]


_PRESETS = (
    Preset("diabetic", "Sugar and fiber filter", (
        Filter("sugar", "lt", 5, "g"),
        Filter("fiber", "gt", 2, "g"),
    )),
    Preset("heart", "Sodium and fat filter", (
        Filter("sodium", "lt", 400, "mg"),
        Filter("fat", "lt", 10, "g"),
    )),
    Preset("weight", "Calorie filter", (
        Filter("calories", "lt", 400, "kcal"),
    )),
    Preset("muscle", "Protein filter", (
        Filter("protein", "gt", 10, "g"),
    )),
    Preset("kidney", "Sodium and protein filter", (
        Filter("sodium", "lt", 300, "mg"),
        Filter("protein", "lt", 20, "g"),
    )),
    Preset("cholesterol", "Fat filter", (
        Filter("fat", "lt", 8, "g"),
    )),
)
PRESETS = {preset.key: preset for preset in _PRESETS}


def validate_health_goals(values: Iterable[str]) -> tuple[list[str], list[str]]:
    """Return (preset keys in submitted order without duplicates, invalid entries)."""
    keys: list[str] = []
    invalid: list[str] = []
    for raw in values:
        key = raw.strip().lower()
        if key not in PRESETS:
            invalid.append(raw)
        elif key not in keys:
            keys.append(key)
    return keys, invalid


def unknown_health_goal_message(invalid: Iterable[str]) -> str:
    listed = ", ".join(f"'{value}'" for value in invalid)
    return f"Unknown health goal(s): {listed}. Valid values: {', '.join(PRESETS)}."


def active_filters(preset_keys: Iterable[str]) -> list[Filter]:
    """Every condition of every selected preset. All of them must hold (AND)."""
    filters: list[Filter] = []
    for key in preset_keys:
        for condition in PRESETS[key].filters:
            if condition not in filters:
                filters.append(condition)
    return filters


# ── Value classification ─────────────────────────────────────
VALUE_VALID = "valid"
VALUE_MISSING = "missing"
VALUE_INVALID = "invalid"


def classify_value(value) -> str:
    """null -> missing; negative, NaN, +inf, -inf or non-numeric -> invalid."""
    if value is None:
        return VALUE_MISSING
    if isinstance(value, bool) or not isinstance(value, (int, float)):
        return VALUE_INVALID
    if math.isnan(value) or math.isinf(value) or value < 0:
        return VALUE_INVALID
    return VALUE_VALID


def nutrition_values(record) -> dict | None:
    """Read the seven fields from a nutrition record; None when there is no record."""
    if record is None:
        return None
    return {field: getattr(record, field, None) for field in NUTRITION_FIELDS}


def nutrition_quality(values: Mapping | None) -> dict:
    if values is None:
        return {
            "nutrition_record_present": False,
            "missing_fields": list(NUTRITION_FIELDS),
            "invalid_fields": [],
        }
    states = {field: classify_value(values.get(field)) for field in NUTRITION_FIELDS}
    return {
        "nutrition_record_present": True,
        "missing_fields": [f for f in NUTRITION_FIELDS if states[f] == VALUE_MISSING],
        "invalid_fields": [f for f in NUTRITION_FIELDS if states[f] == VALUE_INVALID],
    }


def sanitized_nutrition(values: Mapping | None) -> dict:
    """The seven fields for output: a valid number, otherwise null. Never 0 by default."""
    result = {}
    for field in NUTRITION_FIELDS:
        value = None if values is None else values.get(field)
        result[field] = value if classify_value(value) == VALUE_VALID else None
    return result


def nutrition_basis(serving_label: str | None) -> dict:
    return {
        "code": BASIS_CODE,
        "standardized": False,
        "source_portion": None,
        "source_portion_known": False,
        "serving_label_as_stored": serving_label,
        "serving_label_reliable": False,
        "value_provenance": VALUE_PROVENANCE,
    }


# ── Preset evaluation ────────────────────────────────────────
PRESETS_PASS = "pass"
NUTRITION_INVALID = "nutrition_invalid"
NUTRITION_MISSING = "nutrition_missing"
FAILED_FILTER = "failed_filter"


@dataclass(frozen=True)
class PresetEvaluation:
    outcome: str
    matched: tuple[Filter, ...] = ()


def _holds(condition: Filter, value) -> bool:
    if condition.op == "lt":
        return value < condition.value
    if condition.op == "gt":
        return value > condition.value
    raise ValueError(f"Unsupported filter operator: {condition.op}")


def evaluate_presets(values: Mapping | None, preset_keys: Iterable[str]) -> PresetEvaluation:
    """Apply every condition of every selected preset to one food's stored values.

    Order of outcomes: invalid before missing before failed. A food with no
    nutrition record is missing whenever a preset is active.
    """
    filters = active_filters(preset_keys)
    if not filters:
        return PresetEvaluation(PRESETS_PASS)
    if values is None:
        return PresetEvaluation(NUTRITION_MISSING)

    states = [classify_value(values.get(condition.field)) for condition in filters]
    if VALUE_INVALID in states:
        return PresetEvaluation(NUTRITION_INVALID)
    if VALUE_MISSING in states:
        return PresetEvaluation(NUTRITION_MISSING)
    if all(_holds(condition, values[condition.field]) for condition in filters):
        return PresetEvaluation(PRESETS_PASS, tuple(filters))
    return PresetEvaluation(FAILED_FILTER)


def format_number(value) -> str:
    """Render a stored or threshold number without a trailing '.0'."""
    number = float(value)
    return str(int(number)) if number.is_integer() else repr(number)


# ── Fixed texts ──────────────────────────────────────────────
DISCLAIMER = (
    "Exploratory filters for food discovery. Not medical advice and not validated "
    "for any medical condition. Allergen information is incomplete and can depend "
    "on preparation; always check labels or ask the preparer."
)
NUTRITION_UNSTANDARDIZED_TEXT = (
    "Nutrition values were entered from source portions that differ between foods "
    "and have no recorded measurement basis; do not compare them as equivalent "
    "amounts."
)
NUTRITION_INCOMPLETE_TEXT = "Some nutrition values for this food are not available."

FIXED_TEXTS = {
    "disclaimer": DISCLAIMER,
    "uncertainty.nutrition_unstandardized": NUTRITION_UNSTANDARDIZED_TEXT,
    "uncertainty.nutrition_incomplete": NUTRITION_INCOMPLETE_TEXT,
}

UNCERTAINTY_NUTRITION_UNSTANDARDIZED = "nutrition_unstandardized"
UNCERTAINTY_NUTRITION_INCOMPLETE = "nutrition_incomplete"


def nutrition_uncertainty_entries(quality: Mapping) -> list[dict]:
    entries = [{
        "code": UNCERTAINTY_NUTRITION_UNSTANDARDIZED,
        "text": NUTRITION_UNSTANDARDIZED_TEXT,
    }]
    fields = list(quality["missing_fields"]) + list(quality["invalid_fields"])
    if fields:
        entries.append({
            "code": UNCERTAINTY_NUTRITION_INCOMPLETE,
            "fields": fields,
            "text": NUTRITION_INCOMPLETE_TEXT,
        })
    return entries


# ── Metadata ─────────────────────────────────────────────────
def health_goals_metadata() -> dict:
    return {
        "presets": [
            {
                "key": preset.key,
                "label": preset.label,
                "kind": PRESET_KIND,
                "basis": BASIS_CODE,
                "filters": [condition.as_dict() for condition in preset.filters],
            }
            for preset in PRESETS.values()
        ],
        "disclaimer": DISCLAIMER,
    }
