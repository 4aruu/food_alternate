"""Allergen vocabulary, status model, provenance and preparation coupling.

Two dimensions are tracked for every allergen code: `ingredient` and
`cross_contact`. `unknown` is a status of its own and is never read as absence.
"""

from collections.abc import Iterable, Mapping
from dataclasses import dataclass

# ── Statuses ─────────────────────────────────────────────────
PRESENT = "present"
POSSIBLE = "possible"
ABSENT = "absent"
UNKNOWN = "unknown"

STATUSES = (PRESENT, POSSIBLE, ABSENT, UNKNOWN)
DIMENSIONS = ("ingredient", "cross_contact")

# Most severe first: present > possible > unknown > absent
_SEVERITY = {PRESENT: 3, POSSIBLE: 2, UNKNOWN: 1, ABSENT: 0}


def severity(status: str) -> int:
    return _SEVERITY[status]


# ── Vocabulary (canonical order) ─────────────────────────────
_ALLERGENS = (
    ("milk", "Milk", ("dairy",)),
    ("eggs", "Eggs", ("egg",)),
    ("peanuts", "Peanuts", ("peanut",)),
    ("tree_nuts", "Tree nuts", ("tree-nuts", "tree nuts")),
    ("fish", "Fish", ()),
    ("shellfish", "Shellfish", ()),
    ("soy", "Soy", ("soya",)),
    ("wheat", "Wheat", ()),
    ("gluten", "Gluten", ()),
    ("sesame", "Sesame", ()),
    ("sulfites", "Sulfites", ("sulphites",)),
)

CANONICAL_CODES = tuple(code for code, _, _ in _ALLERGENS)
LABELS = {code: label for code, label, _ in _ALLERGENS}
ALIASES = {code: aliases for code, _, aliases in _ALLERGENS}
GROUP_ALIASES = {
    "nuts": ("peanuts", "tree_nuts"),
    "seafood": ("fish", "shellfish"),
}

_LOOKUP: dict[str, tuple[str, ...]] = {}
for _code in CANONICAL_CODES:
    _LOOKUP[_code] = (_code,)
    for _alias in ALIASES[_code]:
        _LOOKUP[_alias] = (_code,)
_LOOKUP.update(GROUP_ALIASES)


def expand_avoid(values: Iterable[str]) -> tuple[list[str], list[str]]:
    """Expand codes and aliases to canonical codes.

    Returns (codes in canonical order without duplicates, invalid entries as
    submitted). An empty or whitespace-only entry is invalid.
    """
    found: set[str] = set()
    invalid: list[str] = []
    for raw in values:
        codes = _LOOKUP.get(raw.strip().lower())
        if codes is None:
            invalid.append(raw)
        else:
            found.update(codes)
    return [code for code in CANONICAL_CODES if code in found], invalid


def unknown_allergen_message(invalid: Iterable[str]) -> str:
    listed = ", ".join(f"'{value}'" for value in invalid)
    valid = ", ".join(CANONICAL_CODES)
    aliases = ", ".join(
        [alias for code in CANONICAL_CODES for alias in ALIASES[code]] + list(GROUP_ALIASES)
    )
    return (
        f"Unknown allergen value(s): {listed}. Valid values: {valid}. "
        f"Accepted aliases: {aliases}."
    )


# ── Provenance ───────────────────────────────────────────────
LEGACY_SEED_HEURISTIC = "legacy_seed_heuristic"
LEGACY_DEFAULT_FALSE = "legacy_default_false"
LEGACY_NULL = "legacy_null"
NO_ALLERGEN_RECORD = "no_allergen_record"
NOT_TRACKED = "not_tracked"
DERIVED_FROM_WHEAT = "derived_from_wheat"

INGREDIENT_PROVENANCE = (
    LEGACY_SEED_HEURISTIC,
    LEGACY_DEFAULT_FALSE,
    LEGACY_NULL,
    NO_ALLERGEN_RECORD,
    NOT_TRACKED,
    DERIVED_FROM_WHEAT,
)
INGREDIENT_UNKNOWN_PROVENANCE = (
    LEGACY_DEFAULT_FALSE,
    LEGACY_NULL,
    NO_ALLERGEN_RECORD,
    NOT_TRACKED,
)

NO_SOURCE = "no_source"
INSUFFICIENT_PREPARATION_EVIDENCE = "insufficient_preparation_evidence"
VERIFIED_PREPARATION_SOURCE = "verified_preparation_source"

CROSS_CONTACT_PROVENANCE = (
    NO_SOURCE,
    INSUFFICIENT_PREPARATION_EVIDENCE,
    VERIFIED_PREPARATION_SOURCE,
)
CROSS_CONTACT_UNKNOWN_PROVENANCE = (
    NO_SOURCE,
    INSUFFICIENT_PREPARATION_EVIDENCE,
)

# ── Legacy boolean columns ───────────────────────────────────
# Each legacy column and the canonical codes it feeds. Wheat, sesame and
# sulfites have no source column. Gluten never implies wheat.
LEGACY_COLUMN_FANOUT = {
    "dairy": ("milk",),
    "nuts": ("peanuts", "tree_nuts"),
    "gluten": ("gluten",),
    "eggs": ("eggs",),
    "soy": ("soy",),
    "shellfish": ("fish", "shellfish"),
}
LEGACY_COLUMNS = tuple(LEGACY_COLUMN_FANOUT)

_SOURCE_COLUMN = {
    code: column for column, codes in LEGACY_COLUMN_FANOUT.items() for code in codes
}


def legacy_flags(row) -> dict[str, bool | None] | None:
    """Read the legacy columns from an allergen record; None when there is no record."""
    if row is None:
        return None
    return {column: getattr(row, column, None) for column in LEGACY_COLUMNS}


def apply_wheat_rule(statuses: Mapping[str, tuple[str, str]]) -> dict[str, tuple[str, str]]:
    """Raise gluten when wheat is present or possible and gluten is less severe."""
    result = dict(statuses)
    wheat_status = result["wheat"][0]
    if wheat_status in (PRESENT, POSSIBLE):
        raised = PRESENT if wheat_status == PRESENT else POSSIBLE
        if severity(result["gluten"][0]) < severity(raised):
            result["gluten"] = (raised, DERIVED_FROM_WHEAT)
    return result


def ingredient_from_legacy(
    flags: Mapping[str, bool | None] | None,
) -> dict[str, tuple[str, str]]:
    """Resolve (status, provenance) for all codes. The first matching rule decides."""
    result: dict[str, tuple[str, str]] = {}
    for code in CANONICAL_CODES:
        if flags is None:
            result[code] = (UNKNOWN, NO_ALLERGEN_RECORD)
            continue
        column = _SOURCE_COLUMN.get(code)
        if column is None:
            result[code] = (UNKNOWN, NOT_TRACKED)
            continue
        value = flags.get(column)
        if value is None:
            result[code] = (UNKNOWN, LEGACY_NULL)
        elif value:
            result[code] = (POSSIBLE, LEGACY_SEED_HEURISTIC)
        else:
            result[code] = (UNKNOWN, LEGACY_DEFAULT_FALSE)
    return apply_wheat_rule(result)


# ── Preparation coupling ─────────────────────────────────────
# No current data records preparation details for any food.
PREPARATION_DETAILS_KNOWN = False


@dataclass(frozen=True)
class PreparationSource:
    """Domain-only evidence for a cross-contact claim. Never stored."""

    food_id: int
    verified: bool
    explicit_absence: frozenset[str] = frozenset()


@dataclass(frozen=True)
class CrossContactClaim:
    status: str
    source: PreparationSource | None = None


def resolve_cross_contact(
    code: str,
    food_id: int,
    claim: CrossContactClaim | None,
    details_known: bool,
) -> tuple[str, str]:
    """Return (status, provenance) for one code's cross-contact dimension."""
    if claim is None:
        return UNKNOWN, NO_SOURCE
    if claim.status not in (PRESENT, POSSIBLE, ABSENT):
        raise ValueError("A cross-contact claim must be present, possible or absent.")

    source = claim.source
    source_verified_for_food = (
        isinstance(source, PreparationSource)
        and source.verified is True
        and source.food_id == food_id
    )

    if claim.status == ABSENT:
        if (
            details_known is True
            and source_verified_for_food
            and code in source.explicit_absence
        ):
            return ABSENT, VERIFIED_PREPARATION_SOURCE
        return UNKNOWN, INSUFFICIENT_PREPARATION_EVIDENCE

    # present / possible are never downgraded
    if source_verified_for_food:
        return claim.status, VERIFIED_PREPARATION_SOURCE
    return claim.status, INSUFFICIENT_PREPARATION_EVIDENCE


# ── Status map ───────────────────────────────────────────────
@dataclass(frozen=True)
class CodeStatus:
    ingredient: str
    ingredient_provenance: str
    cross_contact: str
    cross_contact_provenance: str

    def as_dict(self) -> dict[str, str]:
        return {
            "ingredient": self.ingredient,
            "ingredient_provenance": self.ingredient_provenance,
            "cross_contact": self.cross_contact,
            "cross_contact_provenance": self.cross_contact_provenance,
        }


def build_status_map(
    food_id: int,
    flags: Mapping[str, bool | None] | None,
    cross_contact_claims: Mapping[str, CrossContactClaim] | None = None,
    details_known: bool = PREPARATION_DETAILS_KNOWN,
) -> dict[str, CodeStatus]:
    """Status of all codes, in canonical order, for one food."""
    ingredient = ingredient_from_legacy(flags)
    claims = cross_contact_claims or {}
    result: dict[str, CodeStatus] = {}
    for code in CANONICAL_CODES:
        status, provenance = ingredient[code]
        cc_status, cc_provenance = resolve_cross_contact(
            code, food_id, claims.get(code), details_known
        )
        result[code] = CodeStatus(status, provenance, cc_status, cc_provenance)
    return result


# ── Fixed texts ──────────────────────────────────────────────
PREPARATION_WARNING = (
    "Allergen exposure can depend on the ingredients used, sauces, coatings, shared "
    "equipment and the environment where food is prepared. NutriSwap cannot verify "
    "these details with its current data. Cooking or heating cannot be relied on to "
    "remove allergens. Check with whoever prepares the food, or read the label."
)
NONE_CONFIRMED_LABEL = "Continue without allergen filtering"
NONE_CONFIRMED_HELPER = (
    "NutriSwap will show alternatives without filtering them for allergens. Each "
    "food's allergen information is still shown, and it is incomplete."
)
NONE_IDENTIFIED_LABEL = "None identified in the available data"
INGREDIENT_FLAGGED_KEYWORD_TEXT = (
    "{labels} may be an ingredient, based on keywords in the dish name or "
    "description. This is not confirmed by an ingredient list."
)
INGREDIENT_FLAGGED_GENERIC_TEXT = (
    "Recorded as an ingredient or a possible ingredient: {labels}."
)
INGREDIENT_UNVERIFIED_TEXT = (
    "NutriSwap can't confirm whether this dish's ingredients include these allergens."
)
CROSS_CONTACT_FLAGGED_TEXT = (
    "Recorded as present or possible through contact during handling or "
    "preparation: {labels}."
)
CROSS_CONTACT_UNVERIFIED_TEXT = (
    "NutriSwap has no information on contact with these allergens during handling "
    "or preparation."
)
LEGACY_FLAG_LABEL = "Possible (keyword-based, not confirmed)"
LEGACY_UNVERIFIED_NOTICE = (
    "Allergen information for this food is not verified. A missing flag does not "
    "mean the allergen is absent."
)

FIXED_TEXTS = {
    "preparation_warning": PREPARATION_WARNING,
    "none_confirmed_label": NONE_CONFIRMED_LABEL,
    "none_confirmed_helper": NONE_CONFIRMED_HELPER,
    "none_identified_label": NONE_IDENTIFIED_LABEL,
    "uncertainty.allergen_ingredient_flagged.keyword": INGREDIENT_FLAGGED_KEYWORD_TEXT,
    "uncertainty.allergen_ingredient_flagged.generic": INGREDIENT_FLAGGED_GENERIC_TEXT,
    "uncertainty.allergen_ingredient_unverified": INGREDIENT_UNVERIFIED_TEXT,
    "uncertainty.allergen_cross_contact_flagged": CROSS_CONTACT_FLAGGED_TEXT,
    "uncertainty.allergen_cross_contact_unverified": CROSS_CONTACT_UNVERIFIED_TEXT,
    "legacy_flag_label": LEGACY_FLAG_LABEL,
    "legacy_unverified_notice": LEGACY_UNVERIFIED_NOTICE,
}


# ── Uncertainty entries ──────────────────────────────────────
UNCERTAINTY_INGREDIENT_FLAGGED = "allergen_ingredient_flagged"
UNCERTAINTY_INGREDIENT_UNVERIFIED = "allergen_ingredient_unverified"
UNCERTAINTY_CROSS_CONTACT_FLAGGED = "allergen_cross_contact_flagged"
UNCERTAINTY_CROSS_CONTACT_UNVERIFIED = "allergen_cross_contact_unverified"
UNCERTAINTY_PREPARATION_DEPENDENT = "preparation_dependent"


def _labels(codes: Iterable[str]) -> str:
    return ", ".join(LABELS[code] for code in codes)


def allergen_uncertainty_entries(status_map: Mapping[str, CodeStatus]) -> list[dict]:
    """The allergen uncertainty entries that apply to one food, in fixed order."""
    codes = [code for code in CANONICAL_CODES if code in status_map]
    flagged = (PRESENT, POSSIBLE)
    entries: list[dict] = []

    ingredient_flagged = [c for c in codes if status_map[c].ingredient in flagged]
    if ingredient_flagged:
        keyword_only = all(
            status_map[c].ingredient_provenance == LEGACY_SEED_HEURISTIC
            for c in ingredient_flagged
        )
        template = (
            INGREDIENT_FLAGGED_KEYWORD_TEXT if keyword_only else INGREDIENT_FLAGGED_GENERIC_TEXT
        )
        entries.append({
            "code": UNCERTAINTY_INGREDIENT_FLAGGED,
            "allergens": ingredient_flagged,
            "text": template.format(labels=_labels(ingredient_flagged)),
        })

    ingredient_unknown = [c for c in codes if status_map[c].ingredient == UNKNOWN]
    if ingredient_unknown:
        entries.append({
            "code": UNCERTAINTY_INGREDIENT_UNVERIFIED,
            "allergens": ingredient_unknown,
            "text": INGREDIENT_UNVERIFIED_TEXT,
        })

    cross_flagged = [c for c in codes if status_map[c].cross_contact in flagged]
    if cross_flagged:
        entries.append({
            "code": UNCERTAINTY_CROSS_CONTACT_FLAGGED,
            "allergens": cross_flagged,
            "text": CROSS_CONTACT_FLAGGED_TEXT.format(labels=_labels(cross_flagged)),
        })

    cross_unknown = [c for c in codes if status_map[c].cross_contact == UNKNOWN]
    if cross_unknown:
        entries.append({
            "code": UNCERTAINTY_CROSS_CONTACT_UNVERIFIED,
            "allergens": cross_unknown,
            "text": CROSS_CONTACT_UNVERIFIED_TEXT,
        })

    return entries


def preparation_uncertainty_entry() -> dict:
    return {"code": UNCERTAINTY_PREPARATION_DEPENDENT, "text": PREPARATION_WARNING}


# ── Metadata ─────────────────────────────────────────────────
def allergen_metadata() -> dict:
    return {
        "allergens": [
            {"code": code, "label": LABELS[code], "aliases": list(ALIASES[code])}
            for code in CANONICAL_CODES
        ],
        "group_aliases": [
            {"alias": alias, "expands_to": list(codes)}
            for alias, codes in GROUP_ALIASES.items()
        ],
        "dimensions": {dimension: list(STATUSES) for dimension in DIMENSIONS},
        "provenance": {
            "ingredient": list(INGREDIENT_PROVENANCE),
            "cross_contact": list(CROSS_CONTACT_PROVENANCE),
        },
        "preparation_warning": PREPARATION_WARNING,
    }
