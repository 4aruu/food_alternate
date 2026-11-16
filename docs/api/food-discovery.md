# Food discovery API

How NutriSwap finds alternatives to a food: the allergen status model, the fixed texts, the exclusion counts and the `POST /foods/{food_id}/alternatives` contract.

The rules are fail-closed. A food is shown as an alternative for an avoided allergen only when the data records that allergen as absent, both as an ingredient and through cross-contact. With the current data that never happens, so any allergen restriction returns no alternatives, with the outcome `no_verified_alternatives`.

Code: `backend/domain/` (allergen and nutrition rules, category data), `backend/services/discovery_engine.py` (eligibility, ranking, counts, outcome), `backend/routers/foods.py` (HTTP layer). Frontend copies of the vocabulary and fixed texts: `frontend/src/constants/`. A contract test (`backend/tests/test_allergen_contract.py`) keeps all copies identical.

## 1. Allergen model

### 1.1 Codes and statuses

Two allergen dimensions: `ingredient` and `cross_contact`. Both use the statuses `present`, `possible`, `absent` and `unknown`. Severity, most severe first: `present` > `possible` > `unknown` > `absent`.

Canonical codes, in canonical order, with the accepted aliases:

| Code | Label | Aliases |
|---|---|---|
| `milk` | Milk | `dairy` |
| `eggs` | Eggs | `egg` |
| `peanuts` | Peanuts | `peanut` |
| `tree_nuts` | Tree nuts | `tree-nuts`, `tree nuts` |
| `fish` | Fish | — |
| `shellfish` | Shellfish | — |
| `soy` | Soy | `soya` |
| `wheat` | Wheat | — |
| `gluten` | Gluten | — |
| `sesame` | Sesame | — |
| `sulfites` | Sulfites | `sulphites` |

Group aliases: `nuts` expands to `peanuts` and `tree_nuts`; `seafood` expands to `fish` and `shellfish`.

Submitted `avoid` values are trimmed and lower-cased before matching. Anything else, including an empty string, is rejected with `UNKNOWN_ALLERGEN`. The old aliases `lactose` (for milk) and `wheat` meaning gluten are no longer accepted; `wheat` is its own code.

Preparation is a separate, third concept: `preparation.details_known` (boolean). It is `false` for every food in the current data.

### 1.2 Provenance

Every status carries a provenance value. This is the complete set; `GET /foods/meta/allergens` returns exactly these values.

Ingredient provenance:

| Value | Meaning | Status |
|---|---|---|
| `legacy_seed_heuristic` | the code's legacy column is `True` | `possible` |
| `legacy_default_false` | the code's legacy column is `False` | `unknown` |
| `legacy_null` | the code's legacy column is `NULL` | `unknown` |
| `no_allergen_record` | the food has no allergen row | `unknown` |
| `not_tracked` | the food has an allergen row, but the code has no legacy column (`wheat`, `sesame`, `sulfites`) | `unknown` |
| `derived_from_wheat` | wheat is `present` or `possible` and gluten's own status is less severe | gluten raised to `possible`, or `present` when wheat is `present` |

Legacy column fan-out (each canonical code has at most one source column):

| Legacy column | Canonical codes |
|---|---|
| `dairy` | `milk` |
| `nuts` | `peanuts`, `tree_nuts` |
| `gluten` | `gluten` |
| `eggs` | `eggs` |
| `soy` | `soy` |
| `shellfish` | `fish`, `shellfish` |

`wheat`, `sesame` and `sulfites` have no source column. Gluten never implies wheat.

Resolution order. For each food and each code, the first rule that matches decides:

1. The food has no allergen row → `unknown` / `no_allergen_record`, for all 11 codes, including `wheat`, `sesame` and `sulfites`.
2. The food has an allergen row and the code has no source column → `unknown` / `not_tracked`.
3. The source column is `NULL` → `unknown` / `legacy_null`.
4. The source column is `False` → `unknown` / `legacy_default_false`.
5. The source column is `True` → `possible` / `legacy_seed_heuristic`.
6. After rules 1 to 5 have run for all 11 codes, the wheat rule runs: if wheat is `present` or `possible` and gluten is less severe, gluten is raised with provenance `derived_from_wheat`.

Consequences: for one food, either all 11 codes have provenance `no_allergen_record` or none has; `not_tracked` appears only on `wheat`, `sesame` and `sulfites`; the legacy data has no wheat column, so `derived_from_wheat` is reachable only through test input.

Cross-contact provenance:

| Value | Meaning |
|---|---|
| `no_source` | no cross-contact claim exists for this food and code; status `unknown`. This applies to every current food. |
| `insufficient_preparation_evidence` | a claim exists but is not backed by a verified source for this food. An `absent` claim that fails the coupling rule below becomes `unknown`. A `present` or `possible` claim keeps its status. |
| `verified_preparation_source` | the claim is backed by a verified source for this food. An `absent` claim stays `absent` only when all four coupling conditions hold. A `present` or `possible` claim keeps its status. |

With the current data, ingredient is never `present` or `absent`, and cross-contact is always `unknown` with provenance `no_source`.

### 1.3 Preparation coupling

A `cross_contact = absent` claim is kept only if all four conditions hold:

1. `preparation.details_known` is `true`;
2. a `PreparationSource` is attached and its `verified` field is `true`;
3. the source's `food_id` equals the evaluated food's id;
4. the source's `explicit_absence` set contains the allergen code.

Otherwise the status becomes `unknown` with provenance `insufficient_preparation_evidence`. A bare boolean or flag is never evidence. `PreparationSource` is a domain-only type: it adds no database column, and no current data creates one. `possible` and `present` claims are never downgraded.

### 1.4 Eligibility and `none_confirmed`

For each avoided code, a food is eligible only if `ingredient = absent` and `cross_contact = absent`. `present`, `possible` or `unknown` in either dimension excludes it. A code the user did not avoid never excludes a food; its statuses still appear under `uncertainty`.

`none_confirmed` is the user's confirmation that NutriSwap should apply no allergen filtering. It is not a statement that the user has no allergies, nor that any food is free of allergens. The API reports it as `applied.allergen_filtering = "not_applied"`, and every result still carries its allergen and preparation uncertainty entries.

## 2. Fixed texts

Each text below is defined once in the backend and copied once in the frontend; the contract test asserts that the backend constants, the API and metadata output, the frontend constants and this list are identical. Placeholders in braces are filled as described.

Fixed text `preparation_warning`:

```text
Allergen exposure can depend on the ingredients used, sauces, coatings, shared equipment and the environment where food is prepared. NutriSwap cannot verify these details with its current data. Cooking or heating cannot be relied on to remove allergens. Check with whoever prepares the food, or read the label.
```

Fixed text `disclaimer`:

```text
Exploratory filters for food discovery. Not medical advice and not validated for any medical condition. Allergen information is incomplete and can depend on preparation; always check labels or ask the preparer.
```

Fixed text `outcome.no_verified_alternatives`:

```text
NutriSwap can't currently verify any alternative that meets your allergen restrictions, because its ingredient and cross-contact data is incomplete. No alternatives are shown rather than unverified ones.
```

Fixed text `outcome.no_matching_alternatives`:

```text
No alternatives in this food's category group match your selected exploratory filters.
```

Fixed text `outcome.no_candidates`:

```text
There are no other foods in this food's category group.
```

Fixed text `outcome.alternatives_found` (`{n}` is `eligible_total`):

```text
{n} alternatives found.
```

Fixed text `none_confirmed_label`:

```text
Continue without allergen filtering
```

Fixed text `none_confirmed_helper`:

```text
NutriSwap will show alternatives without filtering them for allergens. Each food's allergen information is still shown, and it is incomplete.
```

Fixed text `none_identified_label`:

```text
None identified in the available data
```

Fixed text `uncertainty.allergen_ingredient_flagged.keyword` (used when every flagged code has provenance `legacy_seed_heuristic`; `{labels}` is the flagged codes' labels in canonical order, joined with a comma and a space):

```text
{labels} may be an ingredient, based on keywords in the dish name or description. This is not confirmed by an ingredient list.
```

Fixed text `uncertainty.allergen_ingredient_flagged.generic` (used in every other case):

```text
Recorded as an ingredient or a possible ingredient: {labels}.
```

Fixed text `uncertainty.allergen_ingredient_unverified`:

```text
NutriSwap can't confirm whether this dish's ingredients include these allergens.
```

Fixed text `uncertainty.allergen_cross_contact_flagged`:

```text
Recorded as present or possible through contact during handling or preparation: {labels}.
```

Fixed text `uncertainty.allergen_cross_contact_unverified`:

```text
NutriSwap has no information on contact with these allergens during handling or preparation.
```

Fixed text `uncertainty.nutrition_unstandardized`:

```text
Nutrition values were entered from source portions that differ between foods and have no recorded measurement basis; do not compare them as equivalent amounts.
```

Fixed text `uncertainty.nutrition_incomplete`:

```text
Some nutrition values for this food are not available.
```

Fixed text `reason.filter_threshold` (`{field}` is the nutrition field; `{direction}` is `below` for `lt` and `above` for `gt`; `{value}` is the threshold; `{stored}` is the food's stored value; `{unit}` is the filter's unit):

```text
Matches your selected exploratory filter: {field} {direction} {value} {unit} (stored value {stored} {unit}; measurement basis unknown)
```

Fixed text `reason.category` (`{original}` is the original food's name):

```text
Same food category as {original}: {category}
```

Fixed text `reason.swap_group`:

```text
Same category group as {original}: {category}
```

Fixed text `legacy_flag_label`:

```text
Possible (keyword-based, not confirmed)
```

Fixed text `legacy_unverified_notice`:

```text
Allergen information for this food is not verified. A missing flag does not mean the allergen is absent.
```

## 3. Legacy allergen booleans: display rule

`GET /foods`, `GET /foods/search` and `GET /foods/{id}` still return the legacy `allergens` object (six booleans). Replacing or removing it is a Batch 2 item (§7). Until then:

- A legacy `false`, a `null` and a missing key all mean `unknown`. None of them may be displayed as absence, as "no", as a tick or as a "safe" state.
- A legacy `true` may be displayed only as possible: the mapped codes' labels with the fixed text `legacy_flag_label`.
- Negative flags are omitted individually. Wherever legacy flags are displayed, `legacy_unverified_notice` and the preparation warning are shown with them.
- The frontend helper `legacyAllergenDisplay(allergens)` (`frontend/src/utils/allergenStatus.js`) returns `identified` when any flag is `true` and `incomplete` otherwise. It never returns `none_identified`.

The only rendered place that reads the legacy booleans is the food detail page's "Allergens" tab (heading "Allergen information"). The search page and the comparison tool do not read them.

## 4. Exclusion precedence, invariants and outcome

### 4.1 Primary-reason precedence

Each excluded food is counted exactly once, under the highest-ranked reason that applies. Rank 1 is the highest.

1. `allergen_ingredient_present` — any avoided code has `ingredient = present`.
2. `allergen_cross_contact_present` — any avoided code has `cross_contact = present`.
3. `allergen_ingredient_possible` — any avoided code has `ingredient = possible`.
4. `allergen_cross_contact_possible` — any avoided code has `cross_contact = possible`.
5. `allergen_ingredient_unknown` — any avoided code has `ingredient = unknown`.
6. `allergen_cross_contact_unknown` — any avoided code has `cross_contact = unknown`.
7. `nutrition_invalid` — a filtered field is negative, NaN, +inf or -inf.
8. `nutrition_missing` — a filtered field is null, or the food has no nutrition record while a preset is active.
9. `failed_filter` — all filtered values are valid but at least one preset condition fails.

Ranks 1 to 6 are allergen-related; ranks 7 to 9 are nutrition-related.

### 4.2 Invariants

- I1: the sum of the nine `excluded.by_primary_reason` values equals `excluded.total`.
- I2: `eligible_total + excluded.total == candidates_considered`.
- I3: `len(results) == min(eligible_total, limit)`.
- I4: for each avoided code and each dimension, `present + possible + absent + unknown == candidates_considered`.
- I5: for each avoided code and each dimension, the `unknown_by_provenance` values add up to `unknown`.

`candidates_considered` is the number of foods in the category scope, excluding the original food. `allergen_detail` counts (candidate, avoided code) pairs, so its counts are not additive across codes.

### 4.3 Outcome rule

Evaluated in order; the first match wins:

1. `candidates_considered == 0` → `no_candidates`
2. `eligible_total > 0` → `alternatives_found`
3. any of ranks 1 to 6 has a count above 0 → `no_verified_alternatives`
4. otherwise → `no_matching_alternatives`

Zero eligible results caused only by nutrition reasons always give `no_matching_alternatives`.

### 4.4 Category scope and ranking

A food's category maps to a swap group (`backend/domain/food_categories.py`). A mapped category reports `category_scope_source = "swap_group"`; an unmapped category is limited to itself and reports `"unmapped_same_category_only"`; a food with no category has an empty scope.

Eligible foods are ordered by: same category as the original first, then same swap group, then id. Brand, region, cuisine, nutrient values and `nutrition_score` are not used. Ranking never adds, removes or changes the status of a result.

### 4.5 Nutrition values

Stored values have no recorded measurement basis. A null value is missing; a negative, NaN or infinite value is invalid; neither is ever turned into 0. Presets are exploratory filters, not medical guidance: a preset applies all its conditions together, and several presets also combine with AND.

## 5. API contract

### 5.1 Request: `POST /foods/{food_id}/alternatives`

Body (`AlternativesRequest`; unknown fields are rejected):

| Field | Type | Default | Rule |
|---|---|---|---|
| `allergen_profile_status` | string or null | `null` | must be `"restrictions"` or `"none_confirmed"` (matched exactly) |
| `avoid` | array of strings | `[]` | codes or aliases; non-empty for `restrictions`, empty for `none_confirmed` |
| `health_goals` | array of strings | `[]` | each a preset key: `diabetic`, `heart`, `weight`, `muscle`, `kidney`, `cholesterol` (trimmed, case-insensitive) |
| `limit` | integer | `10` | 1 to 50 |

The allergen profile and the health goals travel in the body only, never in the URL. Rate limit: 20 requests per minute.

### 5.2 Errors, in precedence order

Application errors use `{"detail": "<message>", "error_code": "<CODE>"}`. Submitted values are never written to logs. A request that breaks several rules receives the first error that applies.

1. 422, FastAPI's standard validation body (a `detail` array) — the body is not a JSON object, a field has the wrong type, an unknown field is present, `limit` is out of range, or `food_id` is not an integer.
2. 400 `INVALID_FOOD_ID` — `food_id` is 0 or negative.
3. 400 `UNKNOWN_ALLERGEN` — any `avoid` entry is empty or not a known code or alias.
4. 400 `UNKNOWN_HEALTH_GOAL` — any `health_goals` entry is not a preset key.
5. 422 `ALLERGEN_PROFILE_REQUIRED` — `allergen_profile_status` is missing, null, `"unconfigured"` or any other value.
6. 422 `PROFILE_INCONSISTENT` — `restrictions` with an empty `avoid`, or `none_confirmed` with a non-empty `avoid`. Checked after alias expansion.
7. 404 `FOOD_NOT_FOUND` — the input is valid but no food has this id. This is the first point at which the database is queried.

The removed GET form returns 405 with FastAPI's standard body.

### 5.3 Response (200)

`AlternativesResponse` has exactly these fields: `applied`, `candidates_considered`, `eligible_total`, `results`, `excluded`, `outcome`, `comparability`, `disclaimer`. The full schema is the set of Pydantic models in `backend/schemas.py`; every example below is validated against them by the contract test.

Key points:

- `applied` reports the profile status, `allergen_filtering` (`applied` / `not_applied`), the canonical `avoid` codes after alias expansion, the preset keys, the category scope and its source, and `nutrition_basis = "as_stored_unstandardized"`.
- `excluded.by_primary_reason` has the nine reasons of §4.1, in rank order. `excluded.allergen_detail.by_allergen` is keyed by avoided code and is `{}` when no code is avoided. Ingredient `unknown_by_provenance` always has the four keys `legacy_default_false`, `legacy_null`, `no_allergen_record` and `not_tracked`; cross-contact `unknown_by_provenance` always has `no_source` and `insufficient_preparation_evidence`.
- Each result has `rank` (from 1), `eligibility = "eligible"`, `food`, `reasons` and `uncertainty`. The `food` object has `id`, `name`, `brand`, `category`, `image`, `serving_size`, `nutrition` (seven fields, each a number or null), `nutrition_quality`, `nutrition_basis`, `allergen_status` (all 11 codes in canonical order, each with both dimensions and their provenance) and `preparation`. It does not include the legacy booleans or `nutrition_score`.
- `nutrition_basis` is always `{"code": "as_stored_unstandardized", "standardized": false, "source_portion": null, "source_portion_known": false, "serving_label_as_stored": <stored label>, "serving_label_reliable": false, "value_provenance": "unverified_manual_entry"}`. The stored serving label is not a measurement basis.
- `reasons` use the codes `filter_threshold` (with `field`), `category` and `swap_group`.
- `uncertainty` entries, in this order when they apply: `allergen_ingredient_flagged`, `allergen_ingredient_unverified`, `allergen_cross_contact_flagged`, `allergen_cross_contact_unverified` (each with `allergens`), `preparation_dependent` (always), `nutrition_unstandardized` (always) and `nutrition_incomplete` (with `fields`: missing fields, then invalid fields).
- `comparability` is always `{"cross_food_nutrition_comparable": false, "reason": "unknown_and_inconsistent_measurement_basis"}`.

### 5.4 Example A — restriction with the current data (fail-closed)

Request.

Schema: `AlternativesRequest`

```json
{"allergen_profile_status": "restrictions", "avoid": ["dairy"], "health_goals": ["diabetic"], "limit": 10}
```

Response 200 (counts are illustrative).

Schema: `AlternativesResponse`

```json
{
  "applied": {
    "allergen_profile_status": "restrictions",
    "allergen_filtering": "applied",
    "avoid": ["milk"],
    "health_goals": ["diabetic"],
    "category_scope": ["Breakfast", "Lunch", "Dinner", "Main Course", "Chinese", "Indian", "Arabic", "Fast Food", "Restaurant/Global", "Kerala Native", "Continental", "Seafood", "Meat Alternative"],
    "category_scope_source": "swap_group",
    "nutrition_basis": "as_stored_unstandardized"
  },
  "candidates_considered": 52,
  "eligible_total": 0,
  "results": [],
  "excluded": {
    "total": 52,
    "by_primary_reason": {
      "allergen_ingredient_present": 0,
      "allergen_cross_contact_present": 0,
      "allergen_ingredient_possible": 2,
      "allergen_cross_contact_possible": 0,
      "allergen_ingredient_unknown": 50,
      "allergen_cross_contact_unknown": 0,
      "nutrition_invalid": 0,
      "nutrition_missing": 0,
      "failed_filter": 0
    },
    "allergen_detail": {
      "unit": "candidate_allergen_pairs",
      "additive_across_allergens": false,
      "by_allergen": {
        "milk": {
          "ingredient": {
            "present": 0,
            "possible": 2,
            "absent": 0,
            "unknown": 50,
            "unknown_by_provenance": {"legacy_default_false": 50, "legacy_null": 0, "no_allergen_record": 0, "not_tracked": 0}
          },
          "cross_contact": {
            "present": 0,
            "possible": 0,
            "absent": 0,
            "unknown": 52,
            "unknown_by_provenance": {"no_source": 52, "insufficient_preparation_evidence": 0}
          }
        }
      }
    }
  },
  "outcome": {
    "code": "no_verified_alternatives",
    "text": "NutriSwap can't currently verify any alternative that meets your allergen restrictions, because its ingredient and cross-contact data is incomplete. No alternatives are shown rather than unverified ones."
  },
  "comparability": {"cross_food_nutrition_comparable": false, "reason": "unknown_and_inconsistent_measurement_basis"},
  "disclaimer": "Exploratory filters for food discovery. Not medical advice and not validated for any medical condition. Allergen information is incomplete and can depend on preparation; always check labels or ask the preparer."
}
```

### 5.5 Example B — no allergen filtering, preset applied, `limit` 1

Request.

Schema: `AlternativesRequest`

```json
{"allergen_profile_status": "none_confirmed", "avoid": [], "health_goals": ["diabetic"], "limit": 1}
```

Response 200 (names and values are illustrative).

Schema: `AlternativesResponse`

```json
{
  "applied": {
    "allergen_profile_status": "none_confirmed",
    "allergen_filtering": "not_applied",
    "avoid": [],
    "health_goals": ["diabetic"],
    "category_scope": ["Breakfast", "Lunch", "Dinner", "Main Course", "Chinese", "Indian", "Arabic", "Fast Food", "Restaurant/Global", "Kerala Native", "Continental", "Seafood", "Meat Alternative"],
    "category_scope_source": "swap_group",
    "nutrition_basis": "as_stored_unstandardized"
  },
  "candidates_considered": 52,
  "eligible_total": 3,
  "results": [
    {
      "rank": 1,
      "eligibility": "eligible",
      "food": {
        "id": 14,
        "name": "Wheat Dosa",
        "brand": "Kerala Native",
        "category": "Breakfast",
        "image": "/assets/images/wheat_dosa.jpg",
        "serving_size": "1 Portion",
        "nutrition": {"calories": 210, "protein": 6, "fat": 4, "carbohydrates": 36, "fiber": 3, "sugar": 2, "sodium": null},
        "nutrition_quality": {"nutrition_record_present": true, "missing_fields": ["sodium"], "invalid_fields": []},
        "nutrition_basis": {
          "code": "as_stored_unstandardized",
          "standardized": false,
          "source_portion": null,
          "source_portion_known": false,
          "serving_label_as_stored": "1 Portion",
          "serving_label_reliable": false,
          "value_provenance": "unverified_manual_entry"
        },
        "allergen_status": {
          "milk": {"ingredient": "unknown", "ingredient_provenance": "legacy_default_false", "cross_contact": "unknown", "cross_contact_provenance": "no_source"},
          "eggs": {"ingredient": "unknown", "ingredient_provenance": "legacy_default_false", "cross_contact": "unknown", "cross_contact_provenance": "no_source"},
          "peanuts": {"ingredient": "unknown", "ingredient_provenance": "legacy_default_false", "cross_contact": "unknown", "cross_contact_provenance": "no_source"},
          "tree_nuts": {"ingredient": "unknown", "ingredient_provenance": "legacy_default_false", "cross_contact": "unknown", "cross_contact_provenance": "no_source"},
          "fish": {"ingredient": "unknown", "ingredient_provenance": "legacy_default_false", "cross_contact": "unknown", "cross_contact_provenance": "no_source"},
          "shellfish": {"ingredient": "unknown", "ingredient_provenance": "legacy_default_false", "cross_contact": "unknown", "cross_contact_provenance": "no_source"},
          "soy": {"ingredient": "unknown", "ingredient_provenance": "legacy_default_false", "cross_contact": "unknown", "cross_contact_provenance": "no_source"},
          "wheat": {"ingredient": "unknown", "ingredient_provenance": "not_tracked", "cross_contact": "unknown", "cross_contact_provenance": "no_source"},
          "gluten": {"ingredient": "possible", "ingredient_provenance": "legacy_seed_heuristic", "cross_contact": "unknown", "cross_contact_provenance": "no_source"},
          "sesame": {"ingredient": "unknown", "ingredient_provenance": "not_tracked", "cross_contact": "unknown", "cross_contact_provenance": "no_source"},
          "sulfites": {"ingredient": "unknown", "ingredient_provenance": "not_tracked", "cross_contact": "unknown", "cross_contact_provenance": "no_source"}
        },
        "preparation": {"details_known": false}
      },
      "reasons": [
        {"code": "filter_threshold", "field": "sugar", "text": "Matches your selected exploratory filter: sugar below 5 g (stored value 2 g; measurement basis unknown)"},
        {"code": "filter_threshold", "field": "fiber", "text": "Matches your selected exploratory filter: fiber above 2 g (stored value 3 g; measurement basis unknown)"},
        {"code": "category", "text": "Same food category as Puttu: Breakfast"}
      ],
      "uncertainty": [
        {"code": "allergen_ingredient_flagged", "allergens": ["gluten"], "text": "Gluten may be an ingredient, based on keywords in the dish name or description. This is not confirmed by an ingredient list."},
        {"code": "allergen_ingredient_unverified", "allergens": ["milk", "eggs", "peanuts", "tree_nuts", "fish", "shellfish", "soy", "wheat", "sesame", "sulfites"], "text": "NutriSwap can't confirm whether this dish's ingredients include these allergens."},
        {"code": "allergen_cross_contact_unverified", "allergens": ["milk", "eggs", "peanuts", "tree_nuts", "fish", "shellfish", "soy", "wheat", "gluten", "sesame", "sulfites"], "text": "NutriSwap has no information on contact with these allergens during handling or preparation."},
        {"code": "preparation_dependent", "text": "Allergen exposure can depend on the ingredients used, sauces, coatings, shared equipment and the environment where food is prepared. NutriSwap cannot verify these details with its current data. Cooking or heating cannot be relied on to remove allergens. Check with whoever prepares the food, or read the label."},
        {"code": "nutrition_unstandardized", "text": "Nutrition values were entered from source portions that differ between foods and have no recorded measurement basis; do not compare them as equivalent amounts."},
        {"code": "nutrition_incomplete", "fields": ["sodium"], "text": "Some nutrition values for this food are not available."}
      ]
    }
  ],
  "excluded": {
    "total": 49,
    "by_primary_reason": {
      "allergen_ingredient_present": 0,
      "allergen_cross_contact_present": 0,
      "allergen_ingredient_possible": 0,
      "allergen_cross_contact_possible": 0,
      "allergen_ingredient_unknown": 0,
      "allergen_cross_contact_unknown": 0,
      "nutrition_invalid": 1,
      "nutrition_missing": 0,
      "failed_filter": 48
    },
    "allergen_detail": {"unit": "candidate_allergen_pairs", "additive_across_allergens": false, "by_allergen": {}}
  },
  "outcome": {"code": "alternatives_found", "text": "3 alternatives found."},
  "comparability": {"cross_food_nutrition_comparable": false, "reason": "unknown_and_inconsistent_measurement_basis"},
  "disclaimer": "Exploratory filters for food discovery. Not medical advice and not validated for any medical condition. Allergen information is incomplete and can depend on preparation; always check labels or ask the preparer."
}
```

The food has an allergen row, so `wheat` is `not_tracked` even though "wheat" is in its name: the legacy data has no wheat column.

### 5.6 Example C — application errors

`INVALID_FOOD_ID` (400).

Schema: `ErrorResponse`

```json
{"detail": "Food ID must be a positive integer.", "error_code": "INVALID_FOOD_ID"}
```

`UNKNOWN_ALLERGEN` (400). The message lists the invalid values and the valid values.

Schema: `ErrorResponse`

```json
{"detail": "Unknown allergen value(s): 'dairyy'. Valid values: milk, eggs, peanuts, tree_nuts, fish, shellfish, soy, wheat, gluten, sesame, sulfites. Accepted aliases: dairy, egg, peanut, tree-nuts, tree nuts, soya, sulphites, nuts, seafood.", "error_code": "UNKNOWN_ALLERGEN"}
```

`UNKNOWN_HEALTH_GOAL` (400).

Schema: `ErrorResponse`

```json
{"detail": "Unknown health goal(s): 'keto'. Valid values: diabetic, heart, weight, muscle, kidney, cholesterol.", "error_code": "UNKNOWN_HEALTH_GOAL"}
```

`ALLERGEN_PROFILE_REQUIRED` (422).

Schema: `ErrorResponse`

```json
{"detail": "Choose the allergens to avoid, or confirm that no allergen filtering should be applied.", "error_code": "ALLERGEN_PROFILE_REQUIRED"}
```

`PROFILE_INCONSISTENT` (422), `none_confirmed` with a non-empty `avoid`.

Schema: `ErrorResponse`

```json
{"detail": "allergen_profile_status 'none_confirmed' requires an empty avoid list.", "error_code": "PROFILE_INCONSISTENT"}
```

`PROFILE_INCONSISTENT` (422), `restrictions` with an empty `avoid`.

Schema: `ErrorResponse`

```json
{"detail": "allergen_profile_status 'restrictions' requires at least one allergen in the avoid list.", "error_code": "PROFILE_INCONSISTENT"}
```

`FOOD_NOT_FOUND` (404).

Schema: `ErrorResponse`

```json
{"detail": "Food not found.", "error_code": "FOOD_NOT_FOUND"}
```

Removed GET form (405).

Schema: `MethodNotAllowed`

```json
{"detail": "Method Not Allowed"}
```

### 5.7 Example D — other food endpoints (`GET /foods`, `GET /foods/search`, `GET /foods/{id}`)

`FoodSchema` now includes `nutrition_quality`, and nutrition values are no longer clamped: a negative, NaN or infinite stored value is returned as `null` and listed in `nutrition_quality.invalid_fields`. The legacy `allergens` object stays on these endpoints in Batch 1; a `false` in it means unknown, never absent (§3).

In this example the stored sugar value is -4, so it is returned as `null` and listed as invalid. `nuts: true` shows the coconut keyword false positive (§7).

Schema: `FoodSchema`

```json
{
  "id": 7,
  "name": "Banana Chips",
  "brand": "Kerala Native",
  "category": "Snack",
  "image": "/assets/images/banana_chips.jpg",
  "description": "Thin banana slices fried in coconut oil.",
  "serving_size": "1 Portion",
  "price_range": "$$",
  "nutrition_score": 60,
  "sustainability_score": 80,
  "nutrition": {"calories": 520, "protein": 2, "fat": 34, "carbohydrates": 58, "fiber": 4, "sugar": null, "sodium": null},
  "nutrition_quality": {"nutrition_record_present": true, "missing_fields": ["sodium"], "invalid_fields": ["sugar"]},
  "allergens": {"dairy": false, "nuts": true, "gluten": false, "soy": false, "eggs": false, "shellfish": false},
  "sustainability": {"carbon_footprint": 1.0, "water_usage": 100.0, "land_use": 1.0, "sustainability_score": 80.0}
}
```

### 5.8 Metadata endpoints

Both are registered before `/foods/{food_id}`, so `meta` is never read as a food id.

#### `GET /foods/meta/allergens`

Schema: `MetaAllergensResponse`

```json
{
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
    {"code": "sulfites", "label": "Sulfites", "aliases": ["sulphites"]}
  ],
  "group_aliases": [
    {"alias": "nuts", "expands_to": ["peanuts", "tree_nuts"]},
    {"alias": "seafood", "expands_to": ["fish", "shellfish"]}
  ],
  "dimensions": {
    "ingredient": ["present", "possible", "absent", "unknown"],
    "cross_contact": ["present", "possible", "absent", "unknown"]
  },
  "provenance": {
    "ingredient": ["legacy_seed_heuristic", "legacy_default_false", "legacy_null", "no_allergen_record", "not_tracked", "derived_from_wheat"],
    "cross_contact": ["no_source", "insufficient_preparation_evidence", "verified_preparation_source"]
  },
  "preparation_warning": "Allergen exposure can depend on the ingredients used, sauces, coatings, shared equipment and the environment where food is prepared. NutriSwap cannot verify these details with its current data. Cooking or heating cannot be relied on to remove allergens. Check with whoever prepares the food, or read the label."
}
```

#### `GET /foods/meta/health-goals`

Each preset is an exploratory filter on the stored values. Thresholds are the ones the engine applies; numbers are sent as floats (`5.0`).

Schema: `HealthGoalsResponse`

```json
{
  "presets": [
    {"key": "diabetic", "label": "Sugar and fiber filter", "kind": "exploratory_filter", "basis": "as_stored_unstandardized", "filters": [{"field": "sugar", "op": "lt", "value": 5.0, "unit": "g"}, {"field": "fiber", "op": "gt", "value": 2.0, "unit": "g"}]},
    {"key": "heart", "label": "Sodium and fat filter", "kind": "exploratory_filter", "basis": "as_stored_unstandardized", "filters": [{"field": "sodium", "op": "lt", "value": 400.0, "unit": "mg"}, {"field": "fat", "op": "lt", "value": 10.0, "unit": "g"}]},
    {"key": "weight", "label": "Calorie filter", "kind": "exploratory_filter", "basis": "as_stored_unstandardized", "filters": [{"field": "calories", "op": "lt", "value": 400.0, "unit": "kcal"}]},
    {"key": "muscle", "label": "Protein filter", "kind": "exploratory_filter", "basis": "as_stored_unstandardized", "filters": [{"field": "protein", "op": "gt", "value": 10.0, "unit": "g"}]},
    {"key": "kidney", "label": "Sodium and protein filter", "kind": "exploratory_filter", "basis": "as_stored_unstandardized", "filters": [{"field": "sodium", "op": "lt", "value": 300.0, "unit": "mg"}, {"field": "protein", "op": "lt", "value": 20.0, "unit": "g"}]},
    {"key": "cholesterol", "label": "Fat filter", "kind": "exploratory_filter", "basis": "as_stored_unstandardized", "filters": [{"field": "fat", "op": "lt", "value": 8.0, "unit": "g"}]}
  ],
  "disclaimer": "Exploratory filters for food discovery. Not medical advice and not validated for any medical condition. Allergen information is incomplete and can depend on preparation; always check labels or ask the preparer."
}
```

### 5.9 Example E — allergen status of a food with no allergen record

Rule 1 of §1.2 applies to all 11 codes, so `wheat`, `sesame` and `sulfites` take `no_allergen_record`, not `not_tracked`. Compare Example B, where the food has a row.

Schema: `AllergenStatusMap`

```json
{
  "milk": {"ingredient": "unknown", "ingredient_provenance": "no_allergen_record", "cross_contact": "unknown", "cross_contact_provenance": "no_source"},
  "eggs": {"ingredient": "unknown", "ingredient_provenance": "no_allergen_record", "cross_contact": "unknown", "cross_contact_provenance": "no_source"},
  "peanuts": {"ingredient": "unknown", "ingredient_provenance": "no_allergen_record", "cross_contact": "unknown", "cross_contact_provenance": "no_source"},
  "tree_nuts": {"ingredient": "unknown", "ingredient_provenance": "no_allergen_record", "cross_contact": "unknown", "cross_contact_provenance": "no_source"},
  "fish": {"ingredient": "unknown", "ingredient_provenance": "no_allergen_record", "cross_contact": "unknown", "cross_contact_provenance": "no_source"},
  "shellfish": {"ingredient": "unknown", "ingredient_provenance": "no_allergen_record", "cross_contact": "unknown", "cross_contact_provenance": "no_source"},
  "soy": {"ingredient": "unknown", "ingredient_provenance": "no_allergen_record", "cross_contact": "unknown", "cross_contact_provenance": "no_source"},
  "wheat": {"ingredient": "unknown", "ingredient_provenance": "no_allergen_record", "cross_contact": "unknown", "cross_contact_provenance": "no_source"},
  "gluten": {"ingredient": "unknown", "ingredient_provenance": "no_allergen_record", "cross_contact": "unknown", "cross_contact_provenance": "no_source"},
  "sesame": {"ingredient": "unknown", "ingredient_provenance": "no_allergen_record", "cross_contact": "unknown", "cross_contact_provenance": "no_source"},
  "sulfites": {"ingredient": "unknown", "ingredient_provenance": "no_allergen_record", "cross_contact": "unknown", "cross_contact_provenance": "no_source"}
}
```

## 6. Breaking changes

- `GET /foods/{id}/alternatives` is removed and returns 405; use `POST` with the body in §5.1.
- The response changes from a bare list of foods to the `AlternativesResponse` object.
- `allergen_profile_status` is new and required.
- Unknown allergens and unknown health goals return 400 with an `error_code` instead of being dropped or returning a plain message.
- Errors from this endpoint include a top-level `error_code`.
- `may_contain` is replaced by `possible`, with provenance on every status.
- New fields: `allergen_status`, `preparation`, `nutrition_quality`, `outcome`, `eligible_total`, `allergen_filtering`.
- The relaxed-threshold and broadened-category fallbacks are gone: when nothing is eligible, the response says why instead of returning other foods.
- `GET /foods/meta/health-goals` returns `presets` and `disclaimer`. It used to return `goals`, a list of `key` and `description` pairs.
- On `GET /foods`, `GET /foods/search` and `GET /foods/{id}`, negative nutrition values are returned as `null` and listed in `nutrition_quality.invalid_fields`. They used to be returned as 0.

## 7. Backlog (not fixed in Batch 1)

### Nutrition values

- Inconsistent source portions (per 250 ml, per slice, per tablespoon, per 100 g, per dish), with no basis recorded per food.
- The "1 Portion" label, which hides those differences.
- No portion weights.
- No provenance per value.
- `nutrition_score` is derived from the unstandardised values.
- The unused `random.randint` fallback in `seed.py`.
- What standardisation would need: a per-100 g basis, portion weights and a source for each value.

### Allergen data

- Allergens inferred from keywords, including `"nut"` matching "coconut".
- The category rule that adds soy to every Chinese dish.
- The `shellfish` column also stores fish.
- No columns for sesame, sulfites or wheat.
- No ingredient-list, cross-contact or preparation sources.

### Batch 2 (recommended first)

- Legacy boolean API cleanup: the legacy `allergens` booleans, in which `False` means unknown, are still served by `GET /foods`, `GET /foods/search` and `GET /foods/{id}`. Batch 2 replaces them with the status model or removes them. Until then the display rule in §3 applies.
- Unrendered component files that still contain code rendering the legacy booleans, including "No known allergens", "Allergen-Free" and "Contains:". Batch 2 deletes or rewrites them:
  - `frontend/src/pages/nutrition-explorer-modal/components/AllergenAlert.jsx`
  - `frontend/src/pages/nutrition-explorer-modal/components/ComparisonView.jsx`
  - `frontend/src/pages/food-search-results/components/ResultCard.jsx`
  - `frontend/src/pages/food-search-results/components/ResultsGrid.jsx`
  - `frontend/src/pages/food-search-results/components/SearchFilters.jsx`
  - `frontend/src/pages/food-comparison-tool/components/AddFoodModal.jsx`
  - `frontend/src/pages/food-comparison-tool/components/ComparisonCard.jsx`
  - `frontend/src/pages/food-comparison-tool/components/RecommendationPanel.jsx`
  - `frontend/src/pages/food-comparison-tool/components/FilterControls.jsx`
- Sustainability values: `SustainabilitySchema` still clamps negative values to 0, and a NaN sustainability value can still cause a 500.

### Copy cleanup (follow-up PR after Batch 1)

- Comparative wording in rendered files outside the Batch 1 scope (acceptance criterion 48 holds only within the Batch 1 files):
  - `frontend/src/components/ui/MobileNavigation.jsx`: "Discover healthier food choices" (shown on every page that renders the header);
  - `frontend/src/pages/landing-page/index.jsx`: "Live Better.", "Stay Healthier.", "Better Outcomes", "Empowering healthier lives through intelligent food choices";
  - `frontend/src/pages/user-dashboard/index.jsx`: "Better options discovered".
- `backend/routers/foods.py`: the module docstring "Medically & Culturally Validated Engine", and the `POST /foods/explain-swap` texts ("healthier", "better choice"). The explain-swap endpoint is outside the Batch 1 scope.
- `backend/models.py` line 29: the code comment "the ID of the better food option" on `healthy_alternative_id`.
- `frontend/src/pages/user-registration/components/TrustSignals.jsx`: unrendered since Batch 1. It contains "Your Data is Safe With Us" and certification claims that are not true (USDA Verified, GDPR Compliant, SOC 2 Certified, ISO 27001). Delete or rewrite.

### Other leftovers

- Brand labels (Kerala Native, Restaurant/Global, Continental) listed among the meal categories.
- `frontend/src/pages/landing-page/components/TrustSignals.jsx` is imported nowhere and contains "Allergen Safety".
- The preferences page sidebar still shows "Food Alternatives 25,000+"; the seed data has 231 foods.
- `frontend/src/utils/history.js` writes viewed foods (food data only, never the allergen profile) to `localStorage` under `user_history`.
