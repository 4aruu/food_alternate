"""Food discovery: eligibility gate, ranking, exclusion counts and outcome.

Eligibility is decided first and is fail-closed. Ranking only orders foods that
are already eligible; it never adds, removes or changes one.
"""

from collections.abc import Iterable, Mapping, Sequence
from dataclasses import dataclass

from domain.allergens import (
    ABSENT,
    CANONICAL_CODES,
    CROSS_CONTACT_UNKNOWN_PROVENANCE,
    INGREDIENT_UNKNOWN_PROVENANCE,
    POSSIBLE,
    PREPARATION_DETAILS_KNOWN,
    PRESENT,
    STATUSES,
    UNKNOWN,
    CodeStatus,
    allergen_uncertainty_entries,
    build_status_map,
    legacy_flags,
    preparation_uncertainty_entry,
)
from domain.food_categories import CATEGORY_SWAP_GROUPS, category_scope
from domain.nutrition_rules import (
    BASIS_CODE,
    DISCLAIMER,
    PRESETS,
    PRESETS_PASS,
    Filter,
    evaluate_presets,
    format_number,
    nutrition_basis,
    nutrition_quality,
    nutrition_uncertainty_entries,
    nutrition_values,
    sanitized_nutrition,
)

# ── Profile ──────────────────────────────────────────────────
PROFILE_RESTRICTIONS = "restrictions"
PROFILE_NONE_CONFIRMED = "none_confirmed"
PROFILE_STATUSES = (PROFILE_RESTRICTIONS, PROFILE_NONE_CONFIRMED)

# ── Primary exclusion reasons, highest rank first ────────────
_ALLERGEN_REASONS = (
    ("allergen_ingredient_present", "ingredient", PRESENT),
    ("allergen_cross_contact_present", "cross_contact", PRESENT),
    ("allergen_ingredient_possible", "ingredient", POSSIBLE),
    ("allergen_cross_contact_possible", "cross_contact", POSSIBLE),
    ("allergen_ingredient_unknown", "ingredient", UNKNOWN),
    ("allergen_cross_contact_unknown", "cross_contact", UNKNOWN),
)
ALLERGEN_REASON_CODES = tuple(reason for reason, _, _ in _ALLERGEN_REASONS)
NUTRITION_REASON_CODES = ("nutrition_invalid", "nutrition_missing", "failed_filter")
PRIMARY_REASON_CODES = ALLERGEN_REASON_CODES + NUTRITION_REASON_CODES

# ── Outcomes ─────────────────────────────────────────────────
OUTCOME_NO_CANDIDATES = "no_candidates"
OUTCOME_ALTERNATIVES_FOUND = "alternatives_found"
OUTCOME_NO_VERIFIED_ALTERNATIVES = "no_verified_alternatives"
OUTCOME_NO_MATCHING_ALTERNATIVES = "no_matching_alternatives"

# ── Fixed texts ──────────────────────────────────────────────
OUTCOME_TEXTS = {
    OUTCOME_NO_VERIFIED_ALTERNATIVES: (
        "NutriSwap can't currently verify any alternative that meets your allergen "
        "restrictions, because its ingredient and cross-contact data is incomplete. "
        "No alternatives are shown rather than unverified ones."
    ),
    OUTCOME_NO_MATCHING_ALTERNATIVES: (
        "No alternatives in this food's category group match your selected "
        "exploratory filters."
    ),
    OUTCOME_NO_CANDIDATES: "There are no other foods in this food's category group.",
    OUTCOME_ALTERNATIVES_FOUND: "Alternatives found: {n}.",
}
REASON_FILTER_THRESHOLD_TEXT = (
    "Matches your selected exploratory filter: {field} {direction} {value} {unit} "
    "(stored value {stored} {unit}; measurement basis unknown)"
)
REASON_CATEGORY_TEXT = "Same food category as {original}: {category}"
REASON_SWAP_GROUP_TEXT = "Same category group as {original}: {category}"

FIXED_TEXTS = {
    **{f"outcome.{code}": text for code, text in OUTCOME_TEXTS.items()},
    "reason.filter_threshold": REASON_FILTER_THRESHOLD_TEXT,
    "reason.category": REASON_CATEGORY_TEXT,
    "reason.swap_group": REASON_SWAP_GROUP_TEXT,
}

COMPARABILITY = {
    "cross_food_nutrition_comparable": False,
    "reason": "unknown_and_inconsistent_measurement_basis",
}
_DIRECTIONS = {"lt": "below", "gt": "above"}


# ── Inputs ───────────────────────────────────────────────────
@dataclass(frozen=True)
class OriginalFood:
    id: int
    name: str
    category: str | None


@dataclass(frozen=True)
class Candidate:
    id: int
    name: str
    category: str | None
    allergen_status: Mapping[str, CodeStatus]
    nutrition: Mapping | None = None  # stored values as they are; None = no record
    brand: str | None = None
    image: str | None = None
    serving_size: str | None = None
    preparation_details_known: bool = PREPARATION_DETAILS_KNOWN


def candidate_from_record(food) -> Candidate:
    """Build a candidate from a stored food and its nutrition and allergen records."""
    return Candidate(
        id=food.id,
        name=food.name,
        category=food.category,
        allergen_status=build_status_map(food.id, legacy_flags(food.allergens)),
        nutrition=nutrition_values(food.nutrition),
        brand=food.brand,
        image=food.image,
        serving_size=food.serving_size,
    )


# ── Eligibility (fail-closed) ────────────────────────────────
def allergen_exclusion_reason(
    status_map: Mapping[str, CodeStatus], avoid: Sequence[str]
) -> str | None:
    """Highest-ranked allergen reason that applies, or None.

    None is returned only when every avoided code is `absent` in both dimensions.
    """
    for reason, dimension, status in _ALLERGEN_REASONS:
        if any(getattr(status_map[code], dimension) == status for code in avoid):
            return reason
    for code in avoid:
        entry = status_map[code]
        if entry.ingredient != ABSENT or entry.cross_contact != ABSENT:
            raise ValueError(f"Unrecognised allergen status for '{code}'.")
    return None


def primary_exclusion_reason(
    candidate: Candidate, avoid: Sequence[str], health_goals: Sequence[str]
) -> str | None:
    """The single reason a candidate is excluded, or None when it is eligible."""
    reason = allergen_exclusion_reason(candidate.allergen_status, avoid)
    if reason is not None:
        return reason
    evaluation = evaluate_presets(candidate.nutrition, health_goals)
    if evaluation.outcome != PRESETS_PASS:
        return evaluation.outcome
    return None


def is_eligible(candidate: Candidate, avoid: Sequence[str], health_goals: Sequence[str]) -> bool:
    return primary_exclusion_reason(candidate, avoid, health_goals) is None


# ── Ranking ──────────────────────────────────────────────────
def rank_candidates(eligible: Iterable[Candidate], original_category: str | None) -> list[Candidate]:
    """Order eligible foods: same category, then same swap group, then id."""
    group = CATEGORY_SWAP_GROUPS.get(original_category, ())

    def key(candidate: Candidate):
        return (
            candidate.category != original_category,
            candidate.category not in group,
            candidate.id,
        )

    return sorted(eligible, key=key)


# ── Result building ──────────────────────────────────────────
def _threshold_reason(condition: Filter, stored) -> dict:
    return {
        "code": "filter_threshold",
        "field": condition.field,
        "text": REASON_FILTER_THRESHOLD_TEXT.format(
            field=condition.field,
            direction=_DIRECTIONS[condition.op],
            value=format_number(condition.value),
            unit=condition.unit,
            stored=format_number(stored),
        ),
    }


def build_reasons(candidate: Candidate, original: OriginalFood, health_goals: Sequence[str]) -> list[dict]:
    reasons = [
        _threshold_reason(condition, candidate.nutrition[condition.field])
        for condition in evaluate_presets(candidate.nutrition, health_goals).matched
    ]
    if candidate.category is not None and candidate.category == original.category:
        reasons.append({
            "code": "category",
            "text": REASON_CATEGORY_TEXT.format(original=original.name, category=candidate.category),
        })
    elif candidate.category in CATEGORY_SWAP_GROUPS.get(original.category, ()):
        reasons.append({
            "code": "swap_group",
            "text": REASON_SWAP_GROUP_TEXT.format(original=original.name, category=candidate.category),
        })
    return reasons


def build_uncertainty(candidate: Candidate) -> list[dict]:
    quality = nutrition_quality(candidate.nutrition)
    return [
        *allergen_uncertainty_entries(candidate.allergen_status),
        preparation_uncertainty_entry(),
        *nutrition_uncertainty_entries(quality),
    ]


def build_food(candidate: Candidate) -> dict:
    return {
        "id": candidate.id,
        "name": candidate.name,
        "brand": candidate.brand,
        "category": candidate.category,
        "image": candidate.image,
        "serving_size": candidate.serving_size,
        "nutrition": sanitized_nutrition(candidate.nutrition),
        "nutrition_quality": nutrition_quality(candidate.nutrition),
        "nutrition_basis": nutrition_basis(candidate.serving_size),
        "allergen_status": {
            code: candidate.allergen_status[code].as_dict() for code in CANONICAL_CODES
        },
        "preparation": {"details_known": candidate.preparation_details_known},
    }


# ── Counts ───────────────────────────────────────────────────
def _dimension_counts(
    candidates: Sequence[Candidate], code: str, dimension: str, unknown_keys: Sequence[str]
) -> dict:
    counts = dict.fromkeys(STATUSES, 0)
    by_provenance = dict.fromkeys(unknown_keys, 0)
    for candidate in candidates:
        entry = candidate.allergen_status[code]
        status = getattr(entry, dimension)
        counts[status] += 1
        if status == UNKNOWN:
            provenance = getattr(entry, f"{dimension}_provenance")
            if provenance not in by_provenance:
                raise ValueError(f"'{provenance}' cannot accompany an unknown {dimension} status.")
            by_provenance[provenance] += 1
    return {**counts, "unknown_by_provenance": by_provenance}


def allergen_detail(candidates: Sequence[Candidate], avoid: Sequence[str]) -> dict:
    """Counts of (candidate, avoided code) pairs. Not additive across codes."""
    return {
        "unit": "candidate_allergen_pairs",
        "additive_across_allergens": False,
        "by_allergen": {
            code: {
                "ingredient": _dimension_counts(
                    candidates, code, "ingredient", INGREDIENT_UNKNOWN_PROVENANCE
                ),
                "cross_contact": _dimension_counts(
                    candidates, code, "cross_contact", CROSS_CONTACT_UNKNOWN_PROVENANCE
                ),
            }
            for code in avoid
        },
    }


# ── Outcome ──────────────────────────────────────────────────
def decide_outcome(candidates_considered: int, eligible_total: int, by_primary_reason: Mapping[str, int]) -> str:
    """The first matching rule wins."""
    if candidates_considered == 0:
        return OUTCOME_NO_CANDIDATES
    if eligible_total > 0:
        return OUTCOME_ALTERNATIVES_FOUND
    if any(by_primary_reason[reason] > 0 for reason in ALLERGEN_REASON_CODES):
        return OUTCOME_NO_VERIFIED_ALTERNATIVES
    return OUTCOME_NO_MATCHING_ALTERNATIVES


def outcome_text(code: str, eligible_total: int) -> str:
    return OUTCOME_TEXTS[code].format(n=eligible_total)


# ── Entry point ──────────────────────────────────────────────
def discover(
    original: OriginalFood,
    foods: Iterable[Candidate],
    *,
    profile_status: str,
    avoid: Sequence[str],
    health_goals: Sequence[str],
    limit: int,
) -> dict:
    """Evaluate the foods in the original's category scope and build the response."""
    avoid = list(avoid)
    health_goals = list(health_goals)
    if profile_status not in PROFILE_STATUSES:
        raise ValueError("An allergen profile status is required.")
    if (profile_status == PROFILE_RESTRICTIONS) != bool(avoid):
        raise ValueError("The avoid list does not match the allergen profile status.")
    if any(code not in CANONICAL_CODES for code in avoid):
        raise ValueError("The avoid list must hold canonical allergen codes.")
    if any(key not in PRESETS for key in health_goals):
        raise ValueError("Health goals must be preset keys.")
    if limit < 1:
        raise ValueError("limit must be at least 1.")

    scope, scope_source = category_scope(original.category)
    candidates = [
        food for food in foods if food.id != original.id and food.category in scope
    ]

    by_primary_reason = dict.fromkeys(PRIMARY_REASON_CODES, 0)
    eligible: list[Candidate] = []
    for candidate in candidates:
        reason = primary_exclusion_reason(candidate, avoid, health_goals)
        if reason is None:
            eligible.append(candidate)
        else:
            by_primary_reason[reason] += 1

    ranked = rank_candidates(eligible, original.category)
    results = [
        {
            "rank": position,
            "eligibility": "eligible",
            "food": build_food(candidate),
            "reasons": build_reasons(candidate, original, health_goals),
            "uncertainty": build_uncertainty(candidate),
        }
        for position, candidate in enumerate(ranked[:limit], start=1)
    ]

    outcome = decide_outcome(len(candidates), len(eligible), by_primary_reason)
    return {
        "applied": {
            "allergen_profile_status": profile_status,
            "allergen_filtering": (
                "applied" if profile_status == PROFILE_RESTRICTIONS else "not_applied"
            ),
            "avoid": avoid,
            "health_goals": health_goals,
            "category_scope": scope,
            "category_scope_source": scope_source,
            "nutrition_basis": BASIS_CODE,
        },
        "candidates_considered": len(candidates),
        "eligible_total": len(eligible),
        "results": results,
        "excluded": {
            "total": sum(by_primary_reason.values()),
            "by_primary_reason": by_primary_reason,
            "allergen_detail": allergen_detail(candidates, avoid),
        },
        "outcome": {"code": outcome, "text": outcome_text(outcome, len(eligible))},
        "comparability": dict(COMPARABILITY),
        "disclaimer": DISCLAIMER,
    }
