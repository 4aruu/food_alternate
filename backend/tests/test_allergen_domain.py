"""Allergen domain: vocabulary, provenance, wheat rule, preparation coupling, texts."""

import itertools
import re

import pytest

from domain import allergens as A

CODES = (
    "milk", "eggs", "peanuts", "tree_nuts", "fish", "shellfish",
    "soy", "wheat", "gluten", "sesame", "sulfites",
)
ALL_FALSE = {"dairy": False, "nuts": False, "gluten": False, "soy": False, "eggs": False, "shellfish": False}
FOOD_ID = 7


# ── Vocabulary (criterion 16) ────────────────────────────────
def test_canonical_codes_and_order():
    assert A.CANONICAL_CODES == CODES
    assert A.STATUSES == ("present", "possible", "absent", "unknown")


def test_severity_order():
    order = sorted(A.STATUSES, key=A.severity, reverse=True)
    assert order == ["present", "possible", "unknown", "absent"]


@pytest.mark.parametrize("code", CODES)
def test_every_code_is_accepted(code):
    assert A.expand_avoid([code]) == ([code], [])


@pytest.mark.parametrize("alias,code", [
    ("dairy", "milk"),
    ("egg", "eggs"),
    ("peanut", "peanuts"),
    ("tree-nuts", "tree_nuts"),
    ("tree nuts", "tree_nuts"),
    ("soya", "soy"),
    ("sulphites", "sulfites"),
])
def test_every_alias_expands(alias, code):
    assert A.expand_avoid([alias]) == ([code], [])


@pytest.mark.parametrize("alias,codes", [
    ("nuts", ["peanuts", "tree_nuts"]),
    ("seafood", ["fish", "shellfish"]),
])
def test_group_aliases_expand(alias, codes):
    assert A.expand_avoid([alias]) == (codes, [])


def test_alias_table_is_exactly_the_documented_one():
    assert A.ALIASES == {
        "milk": ("dairy",), "eggs": ("egg",), "peanuts": ("peanut",),
        "tree_nuts": ("tree-nuts", "tree nuts"), "fish": (), "shellfish": (),
        "soy": ("soya",), "wheat": (), "gluten": (), "sesame": (),
        "sulfites": ("sulphites",),
    }
    assert A.GROUP_ALIASES == {
        "nuts": ("peanuts", "tree_nuts"), "seafood": ("fish", "shellfish"),
    }


def test_expansion_is_canonical_order_without_duplicates():
    codes, invalid = A.expand_avoid(["sesame", "nuts", "peanut", "dairy", "milk"])
    assert codes == ["milk", "peanuts", "tree_nuts", "sesame"]
    assert invalid == []


def test_case_and_surrounding_whitespace_are_ignored():
    assert A.expand_avoid(["  Dairy ", "TREE NUTS"]) == (["milk", "tree_nuts"], [])


@pytest.mark.parametrize("bad", ["", "   ", "dairyy", "lactose", "mustard", "tree  nuts"])
def test_unknown_or_empty_entries_are_invalid(bad):
    codes, invalid = A.expand_avoid(["milk", bad])
    assert codes == ["milk"]
    assert invalid == [bad]


def test_unknown_allergen_message():
    assert A.unknown_allergen_message(["dairyy"]) == (
        "Unknown allergen value(s): 'dairyy'. Valid values: milk, eggs, peanuts, "
        "tree_nuts, fish, shellfish, soy, wheat, gluten, sesame, sulfites. Accepted "
        "aliases: dairy, egg, peanut, tree-nuts, tree nuts, soya, sulphites, nuts, seafood."
    )


# ── Ingredient provenance (criterion 17) ─────────────────────
def test_provenance_legacy_seed_heuristic():
    result = A.ingredient_from_legacy({**ALL_FALSE, "dairy": True})
    assert result["milk"] == ("possible", "legacy_seed_heuristic")


def test_provenance_legacy_default_false():
    result = A.ingredient_from_legacy(ALL_FALSE)
    assert result["milk"] == ("unknown", "legacy_default_false")


def test_provenance_legacy_null():
    result = A.ingredient_from_legacy({**ALL_FALSE, "dairy": None})
    assert result["milk"] == ("unknown", "legacy_null")


def test_missing_legacy_key_is_unknown():
    result = A.ingredient_from_legacy({})
    for code in ("milk", "eggs", "peanuts", "tree_nuts", "fish", "shellfish", "soy", "gluten"):
        assert result[code] == ("unknown", "legacy_null")


def test_provenance_no_allergen_record_covers_all_codes():
    result = A.ingredient_from_legacy(None)
    assert list(result) == list(CODES)
    for code in CODES:
        assert result[code] == ("unknown", "no_allergen_record")


def test_provenance_not_tracked_only_on_codes_without_a_column():
    result = A.ingredient_from_legacy({**ALL_FALSE, "dairy": True, "soy": None})
    not_tracked = [code for code in CODES if result[code][1] == "not_tracked"]
    assert not_tracked == ["wheat", "sesame", "sulfites"]
    for code in not_tracked:
        assert result[code][0] == "unknown"
    assert all(result[code][1] != "no_allergen_record" for code in CODES)


def test_provenance_derived_from_wheat():
    base = A.ingredient_from_legacy(ALL_FALSE)
    base["wheat"] = ("possible", "legacy_seed_heuristic")
    assert A.apply_wheat_rule(base)["gluten"] == ("possible", "derived_from_wheat")


@pytest.mark.parametrize("column,codes", [
    ("dairy", ["milk"]),
    ("nuts", ["peanuts", "tree_nuts"]),
    ("gluten", ["gluten"]),
    ("eggs", ["eggs"]),
    ("soy", ["soy"]),
    ("shellfish", ["fish", "shellfish"]),
])
def test_column_fan_out(column, codes):
    result = A.ingredient_from_legacy({**ALL_FALSE, column: True})
    possible = [code for code in CODES if result[code][0] == "possible"]
    assert possible == codes
    assert list(A.LEGACY_COLUMN_FANOUT[column]) == codes


def test_fan_out_table_and_columns():
    assert A.LEGACY_COLUMNS == ("dairy", "nuts", "gluten", "eggs", "soy", "shellfish")
    fed = [code for codes in A.LEGACY_COLUMN_FANOUT.values() for code in codes]
    assert len(fed) == len(set(fed))  # at most one source column per code
    assert set(CODES) - set(fed) == {"wheat", "sesame", "sulfites"}


def test_legacy_flags_reads_a_record_and_handles_no_record():
    class Row:
        dairy, nuts, gluten, soy, eggs, shellfish = True, False, None, False, False, True

    assert A.legacy_flags(None) is None
    assert A.legacy_flags(Row()) == {
        "dairy": True, "nuts": False, "gluten": None,
        "eggs": False, "soy": False, "shellfish": True,
    }


def test_current_data_shape_never_yields_present_absent_or_cross_contact_claims():
    values = (True, False, None)
    inputs = [None] + [
        dict(zip(A.LEGACY_COLUMNS, combo, strict=True))
        for combo in itertools.product(values, repeat=len(A.LEGACY_COLUMNS))
    ]
    assert len(inputs) == 730
    for flags in inputs:
        status_map = A.build_status_map(FOOD_ID, flags)
        assert list(status_map) == list(CODES)
        for status in status_map.values():
            assert status.ingredient in ("possible", "unknown")
            assert status.cross_contact == "unknown"
            assert status.cross_contact_provenance == "no_source"
            assert status.ingredient_provenance in A.INGREDIENT_PROVENANCE
        provenances = {s.ingredient_provenance for s in status_map.values()}
        if flags is None:
            assert provenances == {"no_allergen_record"}
        else:
            assert "no_allergen_record" not in provenances


# ── Wheat rule (criterion 18) ────────────────────────────────
def _statuses(wheat, gluten):
    base = A.ingredient_from_legacy(None)
    base["wheat"] = (wheat, "not_tracked")
    base["gluten"] = (gluten, "legacy_default_false")
    return base


@pytest.mark.parametrize("wheat,gluten,expected", [
    ("possible", "unknown", "possible"),
    ("possible", "absent", "possible"),
    ("present", "unknown", "present"),
    ("present", "absent", "present"),
    ("present", "possible", "present"),
])
def test_wheat_raises_gluten(wheat, gluten, expected):
    result = A.apply_wheat_rule(_statuses(wheat, gluten))
    assert result["gluten"] == (expected, "derived_from_wheat")


@pytest.mark.parametrize("wheat,gluten", [
    ("possible", "present"),
    ("possible", "possible"),
    ("present", "present"),
    ("unknown", "unknown"),
    ("unknown", "absent"),
    ("absent", "absent"),
    ("absent", "unknown"),
])
def test_wheat_never_lowers_or_changes_gluten_otherwise(wheat, gluten):
    result = A.apply_wheat_rule(_statuses(wheat, gluten))
    assert result["gluten"] == (gluten, "legacy_default_false")


@pytest.mark.parametrize("gluten", ["present", "possible"])
def test_gluten_never_implies_wheat(gluten):
    result = A.apply_wheat_rule(_statuses("unknown", gluten))
    assert result["wheat"] == ("unknown", "not_tracked")

    legacy = A.ingredient_from_legacy({**ALL_FALSE, "gluten": True})
    assert legacy["gluten"] == ("possible", "legacy_seed_heuristic")
    assert legacy["wheat"] == ("unknown", "not_tracked")


# ── Preparation coupling (criteria 21, 22) ───────────────────
def _source(food_id=FOOD_ID, verified=True, absence=("milk",)):
    return A.PreparationSource(food_id=food_id, verified=verified, explicit_absence=frozenset(absence))


INSUFFICIENT = ("unknown", "insufficient_preparation_evidence")


def test_c1_details_not_known():
    claim = A.CrossContactClaim("absent", _source())
    assert A.resolve_cross_contact("milk", FOOD_ID, claim, details_known=False) == INSUFFICIENT


def test_c2_no_source_attached():
    claim = A.CrossContactClaim("absent")
    assert A.resolve_cross_contact("milk", FOOD_ID, claim, details_known=True) == INSUFFICIENT


@pytest.mark.parametrize("bare", [True, "verified", {"verified": True}])
def test_c2_bare_flag_is_not_a_source(bare):
    claim = A.CrossContactClaim("absent", bare)
    assert A.resolve_cross_contact("milk", FOOD_ID, claim, details_known=True) == INSUFFICIENT


def test_c3_source_not_verified():
    claim = A.CrossContactClaim("absent", _source(verified=False))
    assert A.resolve_cross_contact("milk", FOOD_ID, claim, details_known=True) == INSUFFICIENT


def test_c4_source_belongs_to_another_food():
    claim = A.CrossContactClaim("absent", _source(food_id=FOOD_ID + 1))
    assert A.resolve_cross_contact("milk", FOOD_ID, claim, details_known=True) == INSUFFICIENT


@pytest.mark.parametrize("absence", [("eggs", "soy"), ()])
def test_c5_source_does_not_name_this_allergen(absence):
    claim = A.CrossContactClaim("absent", _source(absence=absence))
    assert A.resolve_cross_contact("milk", FOOD_ID, claim, details_known=True) == INSUFFICIENT


def test_c6_all_four_conditions_hold():
    claim = A.CrossContactClaim("absent", _source())
    assert A.resolve_cross_contact("milk", FOOD_ID, claim, details_known=True) == (
        "absent", "verified_preparation_source",
    )


@pytest.mark.parametrize("status", ["present", "possible"])
@pytest.mark.parametrize("details_known", [True, False])
def test_flagged_claims_keep_status_and_take_provenance_from_the_source(status, details_known):
    def resolve(source):
        return A.resolve_cross_contact(
            "milk", FOOD_ID, A.CrossContactClaim(status, source), details_known
        )

    assert resolve(_source(absence=())) == (status, "verified_preparation_source")
    assert resolve(None) == (status, "insufficient_preparation_evidence")
    assert resolve(_source(verified=False)) == (status, "insufficient_preparation_evidence")
    assert resolve(_source(food_id=FOOD_ID + 1)) == (status, "insufficient_preparation_evidence")


def test_no_claim_is_unknown_no_source():
    assert A.resolve_cross_contact("milk", FOOD_ID, None, details_known=True) == ("unknown", "no_source")


def test_a_claim_of_unknown_is_rejected():
    with pytest.raises(ValueError):
        A.resolve_cross_contact("milk", FOOD_ID, A.CrossContactClaim("unknown"), True)


def test_status_map_applies_coupling_per_code():
    claims = {
        "milk": A.CrossContactClaim("absent", _source()),
        "eggs": A.CrossContactClaim("absent", _source()),  # source names milk only
        "soy": A.CrossContactClaim("possible"),
    }
    status_map = A.build_status_map(FOOD_ID, ALL_FALSE, claims, details_known=True)
    assert status_map["milk"].as_dict() == {
        "ingredient": "unknown", "ingredient_provenance": "legacy_default_false",
        "cross_contact": "absent", "cross_contact_provenance": "verified_preparation_source",
    }
    assert (status_map["eggs"].cross_contact, status_map["eggs"].cross_contact_provenance) == INSUFFICIENT
    assert status_map["soy"].cross_contact == "possible"
    assert status_map["fish"].cross_contact_provenance == "no_source"


def test_preparation_details_are_not_known_by_default():
    assert A.PREPARATION_DETAILS_KNOWN is False
    claims = {"milk": A.CrossContactClaim("absent", _source())}
    status_map = A.build_status_map(FOOD_ID, ALL_FALSE, claims)
    assert (status_map["milk"].cross_contact, status_map["milk"].cross_contact_provenance) == INSUFFICIENT


# ── Metadata (criterion 19) ──────────────────────────────────
def test_provenance_value_sets():
    assert A.INGREDIENT_PROVENANCE == (
        "legacy_seed_heuristic", "legacy_default_false", "legacy_null",
        "no_allergen_record", "not_tracked", "derived_from_wheat",
    )
    assert A.CROSS_CONTACT_PROVENANCE == (
        "no_source", "insufficient_preparation_evidence", "verified_preparation_source",
    )
    assert A.INGREDIENT_UNKNOWN_PROVENANCE == (
        "legacy_default_false", "legacy_null", "no_allergen_record", "not_tracked",
    )
    assert A.CROSS_CONTACT_UNKNOWN_PROVENANCE == ("no_source", "insufficient_preparation_evidence")


def test_allergen_metadata_payload():
    assert A.allergen_metadata() == {
        "allergens": [
            {"code": "milk", "label": "Milk", "aliases": ["dairy"]},
            {"code": "eggs", "label": "Eggs", "aliases": ["egg"]},
            {"code": "peanuts", "label": "Peanuts", "aliases": ["peanut"]},
            {"code": "tree_nuts", "label": "Tree nuts", "aliases": ["tree-nuts", "tree nuts"]},
            {"code": "fish", "label": "Fish", "aliases": []},
            {"code": "shellfish", "label": "Shellfish", "aliases": []},
            {"code": "soy", "label": "Soy", "aliases": ["soya"]},
            {"code": "wheat", "label": "Wheat", "aliases": []},
            {"code": "gluten", "label": "Gluten", "aliases": []},
            {"code": "sesame", "label": "Sesame", "aliases": []},
            {"code": "sulfites", "label": "Sulfites", "aliases": ["sulphites"]},
        ],
        "group_aliases": [
            {"alias": "nuts", "expands_to": ["peanuts", "tree_nuts"]},
            {"alias": "seafood", "expands_to": ["fish", "shellfish"]},
        ],
        "dimensions": {
            "ingredient": ["present", "possible", "absent", "unknown"],
            "cross_contact": ["present", "possible", "absent", "unknown"],
        },
        "provenance": {
            "ingredient": [
                "legacy_seed_heuristic", "legacy_default_false", "legacy_null",
                "no_allergen_record", "not_tracked", "derived_from_wheat",
            ],
            "cross_contact": [
                "no_source", "insufficient_preparation_evidence", "verified_preparation_source",
            ],
        },
        "preparation_warning": A.PREPARATION_WARNING,
    }


# ── Uncertainty entries ──────────────────────────────────────
def test_uncertainty_entries_for_a_keyword_flagged_food():
    status_map = A.build_status_map(FOOD_ID, {**ALL_FALSE, "gluten": True})
    assert A.allergen_uncertainty_entries(status_map) == [
        {
            "code": "allergen_ingredient_flagged",
            "allergens": ["gluten"],
            "text": "Gluten may be an ingredient, based on keywords in the dish name or description. This is not confirmed by an ingredient list.",
        },
        {
            "code": "allergen_ingredient_unverified",
            "allergens": ["milk", "eggs", "peanuts", "tree_nuts", "fish", "shellfish", "soy", "wheat", "sesame", "sulfites"],
            "text": "NutriSwap can't confirm whether this dish's ingredients include these allergens.",
        },
        {
            "code": "allergen_cross_contact_unverified",
            "allergens": list(CODES),
            "text": "NutriSwap has no information on contact with these allergens during handling or preparation.",
        },
    ]


def test_flagged_labels_are_joined_in_canonical_order():
    status_map = A.build_status_map(FOOD_ID, {**ALL_FALSE, "shellfish": True, "dairy": True})
    entry = A.allergen_uncertainty_entries(status_map)[0]
    assert entry["allergens"] == ["milk", "fish", "shellfish"]
    assert entry["text"].startswith("Milk, Fish, Shellfish may be an ingredient, based on keywords")


def test_generic_text_when_a_flag_is_not_keyword_based():
    status_map = A.build_status_map(FOOD_ID, {**ALL_FALSE, "dairy": True})
    status_map["gluten"] = A.CodeStatus("possible", "derived_from_wheat", "unknown", "no_source")
    entry = A.allergen_uncertainty_entries(status_map)[0]
    assert entry == {
        "code": "allergen_ingredient_flagged",
        "allergens": ["milk", "gluten"],
        "text": "Recorded as an ingredient or a possible ingredient: Milk, Gluten.",
    }


def test_cross_contact_flagged_entry_and_no_unverified_entries_when_nothing_is_unknown():
    status_map = {
        code: A.CodeStatus("absent", "legacy_default_false", "absent", "verified_preparation_source")
        for code in CODES
    }
    assert A.allergen_uncertainty_entries(status_map) == []

    status_map["soy"] = A.CodeStatus("absent", "legacy_default_false", "possible", "insufficient_preparation_evidence")
    status_map["milk"] = A.CodeStatus("absent", "legacy_default_false", "present", "verified_preparation_source")
    assert A.allergen_uncertainty_entries(status_map) == [{
        "code": "allergen_cross_contact_flagged",
        "allergens": ["milk", "soy"],
        "text": "Recorded as present or possible through contact during handling or preparation: Milk, Soy.",
    }]


def test_preparation_entry_is_separate_and_uses_the_warning():
    entry = A.preparation_uncertainty_entry()
    assert entry == {"code": "preparation_dependent", "text": A.PREPARATION_WARNING}
    status_map = A.build_status_map(FOOD_ID, ALL_FALSE)
    codes = [e["code"] for e in A.allergen_uncertainty_entries(status_map)]
    assert "preparation_dependent" not in codes


# ── Fixed texts (criteria 28, 29, 41) ────────────────────────
BANNED_PHRASES = (
    "allergen-free", "free of allergens", "free from allergens", "no allergens",
    "no known allergens", "no allergies", "safe for you", "safe to eat", "contains no",
)


def test_fixed_text_keys():
    assert set(A.FIXED_TEXTS) == {
        "preparation_warning", "none_confirmed_label", "none_confirmed_helper",
        "none_identified_label",
        "uncertainty.allergen_ingredient_flagged.keyword",
        "uncertainty.allergen_ingredient_flagged.generic",
        "uncertainty.allergen_ingredient_unverified",
        "uncertainty.allergen_cross_contact_flagged",
        "uncertainty.allergen_cross_contact_unverified",
        "legacy_flag_label", "legacy_unverified_notice",
    }


def test_none_confirmed_texts():
    assert A.NONE_CONFIRMED_LABEL == "Continue without allergen filtering"
    assert A.NONE_CONFIRMED_HELPER == (
        "NutriSwap will show alternatives without filtering them for allergens. "
        "Each food's allergen information is still shown, and it is incomplete."
    )
    assert A.NONE_IDENTIFIED_LABEL == "None identified in the available data"


def test_preparation_warning_text():
    assert A.PREPARATION_WARNING == (
        "Allergen exposure can depend on the ingredients used, sauces, coatings, "
        "shared equipment and the environment where food is prepared. NutriSwap "
        "cannot verify these details with its current data. Cooking or heating "
        "cannot be relied on to remove allergens. Check with whoever prepares the "
        "food, or read the label."
    )


def test_legacy_texts():
    assert A.LEGACY_FLAG_LABEL == "Possible (keyword-based, not confirmed)"
    assert A.LEGACY_UNVERIFIED_NOTICE == (
        "Allergen information for this food is not verified. A missing flag does "
        "not mean the allergen is absent."
    )


def test_no_text_claims_absence_of_allergens_or_safety():
    texts = list(A.FIXED_TEXTS.values()) + list(A.LABELS.values())
    for text in texts:
        lowered = text.lower()
        for phrase in BANNED_PHRASES:
            assert phrase not in lowered, (phrase, text)
        assert not re.search(r"\bsafe", lowered), text


def test_only_the_preparation_warning_mentions_cooking_or_heating():
    pattern = re.compile(r"\b(cook|heat)", re.IGNORECASE)
    assert pattern.search(A.PREPARATION_WARNING)
    for key, text in A.FIXED_TEXTS.items():
        if key != "preparation_warning":
            assert not pattern.search(text), key
    for label in A.LABELS.values():
        assert not pattern.search(label), label
