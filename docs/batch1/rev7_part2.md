# Batch 1 — Final Blueprint, Rev. 7 — Part 2 of 3 (section 4)

Every JSON example below is in a fenced `json` block. The line "Schema:" before each block names the schema in this section that the block was validated against.

## 4. API contract

### 4.1 Request: `POST /foods/{food_id}/alternatives`

Schema `AlternativesRequest`. Body fields:

- `allergen_profile_status` — string or null, default `null`. Must be `"restrictions"` or `"none_confirmed"`.
- `avoid` — array of strings, default `[]`. Codes or aliases, expanded on the server. Must be non-empty for `restrictions` and empty for `none_confirmed`.
- `health_goals` — array of strings, default `[]`. Each must be a preset key: `diabetic`, `heart`, `weight`, `muscle`, `kidney`, `cholesterol`.
- `limit` — integer from 1 to 50, default `10`.
- Unknown body fields are rejected (`extra = "forbid"`).

### 4.2 Errors, in precedence order

Application errors use the existing `ErrorResponse` shape: `{"detail": "<message>", "error_code": "<CODE>"}`. Submitted values are never written to logs. A request that breaks several rules receives the first error in this list that applies.

1. 422, FastAPI's standard validation body (a `detail` array with one entry per validation error) — the body is not a JSON object, a field has the wrong type, an unknown field is present, `limit` is out of range, or `food_id` is not an integer.
2. 400 `INVALID_FOOD_ID` — `food_id` is 0 or negative.
3. 400 `UNKNOWN_ALLERGEN` — any `avoid` entry is empty or not a known code or alias. The message lists the invalid values and the valid values.
4. 400 `UNKNOWN_HEALTH_GOAL` — any `health_goals` entry is not a preset key.
5. 422 `ALLERGEN_PROFILE_REQUIRED` — `allergen_profile_status` is missing, null, `"unconfigured"` or any other unrecognised value.
6. 422 `PROFILE_INCONSISTENT` — `restrictions` with an empty `avoid`, or `none_confirmed` with a non-empty `avoid`. Checked after alias expansion.
7. 404 `FOOD_NOT_FOUND` — the input is valid but no food has this `food_id`. This is the first point at which the database is queried.

Unchanged existing behaviour: rate limiting (429) and database-error handling. The removed GET form returns FastAPI's standard 405 body.

### 4.3 Response schema (200)

Top-level object `AlternativesResponse`. All fields are required, and no other fields are allowed:

- `applied` — object `Applied`
- `candidates_considered` — integer
- `eligible_total` — integer
- `results` — array of `Result`
- `excluded` — object `Excluded`
- `outcome` — object `Outcome`
- `comparability` — object `Comparability`
- `disclaimer` — string, the fixed text `disclaimer`

`Applied`:

- `allergen_profile_status` — `"restrictions"` or `"none_confirmed"`
- `allergen_filtering` — `"applied"` or `"not_applied"`
- `avoid` — array of canonical codes after alias expansion
- `health_goals` — array of preset keys
- `category_scope` — array of category names
- `category_scope_source` — `"swap_group"` or `"unmapped_same_category_only"`
- `nutrition_basis` — `"as_stored_unstandardized"`

`Excluded`:

- `total` — integer
- `by_primary_reason` — object `PrimaryReasonCounts`
- `allergen_detail` — object `AllergenDetail`

`PrimaryReasonCounts` — exactly these nine integer fields, in rank order (§2.1):

- `allergen_ingredient_present`
- `allergen_cross_contact_present`
- `allergen_ingredient_possible`
- `allergen_cross_contact_possible`
- `allergen_ingredient_unknown`
- `allergen_cross_contact_unknown`
- `nutrition_invalid`
- `nutrition_missing`
- `failed_filter`

`AllergenDetail`:

- `unit` — `"candidate_allergen_pairs"`
- `additive_across_allergens` — `false`
- `by_allergen` — object keyed by avoided code. Each value is an object with exactly two fields: `ingredient` (an `IngredientDimCounts`) and `cross_contact` (a `CrossContactDimCounts`). It is `{}` when no code is avoided.

`DimCounts` — the shared shape of both count objects:

- `present` — integer
- `possible` — integer
- `absent` — integer
- `unknown` — integer
- `unknown_by_provenance` — object of integers. Every key listed below is always present, including when its count is 0.

`IngredientDimCounts` is a `DimCounts` whose `unknown_by_provenance` has exactly these four keys:

- `legacy_default_false`
- `legacy_null`
- `no_allergen_record`
- `not_tracked`

`CrossContactDimCounts` is a `DimCounts` whose `unknown_by_provenance` has exactly these two keys:

- `no_source`
- `insufficient_preparation_evidence`

The other three provenance values (`legacy_seed_heuristic`, `derived_from_wheat`, `verified_preparation_source`) never accompany the status `unknown`, so they are not keys of `unknown_by_provenance`.

`Outcome`:

- `code` — `"no_candidates"`, `"alternatives_found"`, `"no_verified_alternatives"` or `"no_matching_alternatives"`, per §2.3
- `text` — the matching fixed text in §1.6

`Comparability`:

- `cross_food_nutrition_comparable` — `false`
- `reason` — `"unknown_and_inconsistent_measurement_basis"`

`Result`:

- `rank` — integer, starting at 1
- `eligibility` — `"eligible"`
- `food` — `AlternativeFood`
- `reasons` — array of `Reason`
- `uncertainty` — array of `Uncertainty`

`AlternativeFood`:

- `id` — integer
- `name` — string
- `brand` — string or null
- `category` — string or null
- `image` — string or null
- `serving_size` — string or null
- `nutrition` — object with `calories`, `protein`, `fat`, `carbohydrates`, `fiber`, `sugar`, `sodium`; each a number or null
- `nutrition_quality` — `NutritionQuality`
- `nutrition_basis` — `NutritionBasis`
- `allergen_status` — `AllergenStatusMap`
- `preparation` — object with one field, `details_known` (boolean)
- It does not include the legacy `allergens` booleans or `nutrition_score`.

`AllergenStatusMap` — an object with all 11 codes as keys, in canonical order. Each value is a `CodeStatus`:

- `ingredient` — `"present"`, `"possible"`, `"absent"` or `"unknown"`
- `ingredient_provenance` — one of the six ingredient provenance values in §1.2
- `cross_contact` — `"present"`, `"possible"`, `"absent"` or `"unknown"`
- `cross_contact_provenance` — one of the three cross-contact provenance values in §1.2

`NutritionQuality`:

- `nutrition_record_present` — boolean
- `missing_fields` — array of field names
- `invalid_fields` — array of field names

`NutritionBasis`:

- `code` — `"as_stored_unstandardized"`
- `standardized` — `false`
- `source_portion` — `null`
- `source_portion_known` — `false`
- `serving_label_as_stored` — string or null
- `serving_label_reliable` — `false`
- `value_provenance` — `"unverified_manual_entry"`

`Reason`:

- `code` — `"filter_threshold"`, `"category"` or `"swap_group"`
- `field` — a nutrition field name; present only for `filter_threshold`
- `text` — string, built from the matching `reason` template in §1.6

`Uncertainty`:

- `code` — one of the seven codes below
- `allergens` — array of codes; present only for the four allergen codes
- `fields` — array of field names; present only for `nutrition_incomplete`
- `text` — string, the matching fixed text in §1.6

The seven uncertainty codes:

1. `allergen_ingredient_flagged` — included when any code has ingredient `present` or `possible`; `allergens` lists those codes.
2. `allergen_ingredient_unverified` — included when any code has ingredient `unknown`; `allergens` lists those codes.
3. `allergen_cross_contact_flagged` — included when any code has cross-contact `present` or `possible`; `allergens` lists those codes.
4. `allergen_cross_contact_unverified` — included when any code has cross-contact `unknown`; `allergens` lists those codes.
5. `preparation_dependent` — always included; `text` is the fixed text `preparation_warning`.
6. `nutrition_unstandardized` — always included.
7. `nutrition_incomplete` — included when `missing_fields` or `invalid_fields` is non-empty; `fields` lists `missing_fields` followed by `invalid_fields`.

### 4.4 Example A — restriction with the current data (fail-closed)

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

Checks: I1 2 + 50 = 52; I2 0 + 52 = 52; I3 0 = min(0, 10); I4 0 + 2 + 0 + 50 = 52 and 0 + 0 + 0 + 52 = 52; I5 50 and 52. Ranks 3 and 5 are non-zero, so the outcome is `no_verified_alternatives`.

### 4.5 Example B — no allergen filtering, preset applied, `limit` 1

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

Checks: I1 1 + 48 = 49; I2 3 + 49 = 52; I3 1 = min(3, 1). The food has an allergen row, so wheat is `not_tracked` (rule 2 in §1.2) even though "wheat" is in the name: the legacy data has no wheat column.

### 4.6 Example C — application errors

`INVALID_FOOD_ID` (400).

Schema: `ErrorResponse`

```json
{"detail": "Food ID must be a positive integer.", "error_code": "INVALID_FOOD_ID"}
```

`UNKNOWN_ALLERGEN` (400).

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

`PROFILE_INCONSISTENT` (422).

Schema: `ErrorResponse`

```json
{"detail": "allergen_profile_status 'none_confirmed' requires an empty avoid list.", "error_code": "PROFILE_INCONSISTENT"}
```

`FOOD_NOT_FOUND` (404).

Schema: `ErrorResponse`

```json
{"detail": "Food not found.", "error_code": "FOOD_NOT_FOUND"}
```

Removed GET form (405). Schema `MethodNotAllowed` is an object with exactly one field, `detail` (string).

Schema: `MethodNotAllowed`

```json
{"detail": "Method Not Allowed"}
```

### 4.7 Example D — other food endpoints (`GET /foods`, `GET /foods/search`, `GET /foods/{id}`)

Schema `FoodSchema` is the existing schema with two changes: `nutrition_quality` is added and the clamping validator on nutrition values is removed. Its fields:

- `id` — integer
- `name` — string
- `brand`, `category`, `image`, `description`, `serving_size`, `price_range` — string or null
- `nutrition_score`, `sustainability_score` — number or null
- `nutrition` — object with the seven nutrition fields, each a number or null; or null
- `nutrition_quality` — `NutritionQuality`
- `allergens` — the legacy object with six booleans (`dairy`, `nuts`, `gluten`, `soy`, `eggs`, `shellfish`), each boolean or null; or null
- `sustainability` — object with `carbon_footprint`, `water_usage`, `land_use`, `sustainability_score`, each a number or null; or null

In this example the stored sugar value is -4, so it is serialized as `null` and listed as invalid. `nuts: true` shows the coconut keyword false positive (backlog).

The legacy `allergens` object stays on these endpoints in Batch 1 and is a Batch 2 item (§7). A `false` in it means unknown, never absent. The display rule in §1.7 governs every Batch 1 component that receives this object.

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

### 4.8 Metadata endpoints (registered before `/foods/{food_id}`)

#### `GET /foods/meta/allergens`

Schema `MetaAllergensResponse`. All fields are required, and no other fields are allowed:

- `allergens` — array of exactly 11 objects, in canonical order. Each has `code` (canonical code), `label` (string) and `aliases` (array of strings, possibly empty).
- `group_aliases` — array of objects. Each has `alias` (string) and `expands_to` (array of canonical codes).
- `dimensions` — object with `ingredient` and `cross_contact`. Each is the array `["present", "possible", "absent", "unknown"]`.
- `provenance` — object with `ingredient` (the six values in §1.2, in that order) and `cross_contact` (the three values in §1.2, in that order).
- `preparation_warning` — string, the fixed text `preparation_warning`.

Response 200.

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

Schema `HealthGoalsResponse`. All fields are required, and no other fields are allowed:

- `presets` — array of exactly six `Preset` objects, in the order `diabetic`, `heart`, `weight`, `muscle`, `kidney`, `cholesterol`.
- `disclaimer` — string, the fixed text `disclaimer`.

`Preset` — all five fields are required for every preset:

- `key` — the preset key
- `label` — a neutral nutrient description
- `kind` — `"exploratory_filter"`
- `basis` — `"as_stored_unstandardized"`
- `filters` — non-empty array of `Filter`

`Filter`:

- `field` — one of the seven nutrition field names
- `op` — `"lt"` or `"gt"`
- `value` — number
- `unit` — `"g"`, `"mg"` or `"kcal"`

Thresholds are carried over unchanged from the current router. There is no `sort` field.

Response 200.

Schema: `HealthGoalsResponse`

```json
{
  "presets": [
    {
      "key": "diabetic",
      "label": "Sugar and fiber filter",
      "kind": "exploratory_filter",
      "basis": "as_stored_unstandardized",
      "filters": [{"field": "sugar", "op": "lt", "value": 5, "unit": "g"}, {"field": "fiber", "op": "gt", "value": 2, "unit": "g"}]
    },
    {
      "key": "heart",
      "label": "Sodium and fat filter",
      "kind": "exploratory_filter",
      "basis": "as_stored_unstandardized",
      "filters": [{"field": "sodium", "op": "lt", "value": 400, "unit": "mg"}, {"field": "fat", "op": "lt", "value": 10, "unit": "g"}]
    },
    {
      "key": "weight",
      "label": "Calorie filter",
      "kind": "exploratory_filter",
      "basis": "as_stored_unstandardized",
      "filters": [{"field": "calories", "op": "lt", "value": 400, "unit": "kcal"}]
    },
    {
      "key": "muscle",
      "label": "Protein filter",
      "kind": "exploratory_filter",
      "basis": "as_stored_unstandardized",
      "filters": [{"field": "protein", "op": "gt", "value": 10, "unit": "g"}]
    },
    {
      "key": "kidney",
      "label": "Sodium and protein filter",
      "kind": "exploratory_filter",
      "basis": "as_stored_unstandardized",
      "filters": [{"field": "sodium", "op": "lt", "value": 300, "unit": "mg"}, {"field": "protein", "op": "lt", "value": 20, "unit": "g"}]
    },
    {
      "key": "cholesterol",
      "label": "Fat filter",
      "kind": "exploratory_filter",
      "basis": "as_stored_unstandardized",
      "filters": [{"field": "fat", "op": "lt", "value": 8, "unit": "g"}]
    }
  ],
  "disclaimer": "Exploratory filters for food discovery. Not medical advice and not validated for any medical condition. Allergen information is incomplete and can depend on preparation; always check labels or ask the preparer."
}
```

### 4.9 Example E — allergen status of a food with no allergen record

The food has no allergen row, so rule 1 in §1.2 applies to all 11 codes. `wheat`, `sesame` and `sulfites` take `no_allergen_record`, not `not_tracked`. Compare Example B, where the food has a row and those three codes take `not_tracked`.

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

### 4.10 Breaking changes (documented in N23, linked from M13)

- `GET /foods/{id}/alternatives` is removed and returns 405; use `POST` with the body in §4.1.
- The response changes from a bare list of foods to the `AlternativesResponse` object.
- `allergen_profile_status` is new and required.
- Unknown allergens and unknown health goals return 400 with an `error_code` instead of being dropped or returning a plain message.
- Errors from this endpoint include a top-level `error_code`.
- `may_contain` is replaced by `possible`, with provenance on every status.
- New fields: `allergen_status`, `preparation`, `nutrition_quality`, `outcome`, `eligible_total`, `allergen_filtering`.
- `GET /foods/meta/health-goals` returns `presets` and `disclaimer`. It used to return `goals`, a list of `key` and `description` pairs. No frontend code calls this endpoint today.
- On `GET /foods`, `GET /foods/search` and `GET /foods/{id}`, negative nutrition values are returned as `null` and listed in `nutrition_quality.invalid_fields`. They used to be returned as 0.

End of Part 2. Part 3 follows with sections 5–7 and the validation appendix.
