# Batch 1 — Final Blueprint, Rev. 7 — Part 1 of 3 (sections 1–3)

Status: for review only. No project file has been edited, no ticket created, nothing installed or committed.

## Changes from Rev. 6

Architecture, decisions, the 36-file scope and the implementation order are unchanged. Content changes:

1. The blueprint is delivered in three parts: Part 1 has sections 1–3, Part 2 has section 4, Part 3 has sections 5–7 and the validation appendix.
2. The primary-reason precedence is a numbered list instead of a table. All nine ranks are present.
3. §1.2 now states the order in which ingredient provenance is resolved. A food with no allergen record takes precedence over a code with no legacy column.
4. §1.2 now states the provenance of a `present` or `possible` cross-contact claim. Rev. 6 left it undefined.
5. §1.6 holds every fixed text once, each in its own `text` block. It adds five texts that Rev. 6 used or needed but never defined: the generic ingredient-flagged text, the cross-contact-flagged text, the swap-group reason, the legacy flag label and the legacy notice. These five wordings are new and need your approval.
6. §1.7 is new: the display rule for legacy allergen booleans (your safety clarification).
7. Correction to Rev. 6: its backlog said the search and comparison components still render the legacy booleans. I checked the code. The rendered search page (M11) and comparison page (M12) do not read them at all. The only rendered place that does is the modal's allergen tab (M8, lines 289–298). The legacy rendering code that exists elsewhere sits in nine component files that no rendered page imports.
8. The modal's `safety` tab is labelled "Allergens", with the heading "Allergen information", because criterion 58 bans the word "Safe". M12's tagline loses "and safety".
9. §4.8 documents the schemas of both metadata endpoints, and the examples are validated against them. §4.10 adds two breaking changes that Rev. 6 missed: `/foods/meta/health-goals` returns `presets` where it used to return `goals`, and on `GET /foods`, `GET /foods/search` and `GET /foods/{id}` negative nutrition values are returned as `null` instead of 0.
10. Example E is new: the allergen status of a food with no allergen record.
11. Sixteen criteria are amended to cover items 3 to 9: 17, 22, 24, 28, 29, 36, 37, 40, 45, 51, 54, 57, 58, 60, 61 and 62. The other 48 are word-for-word as in Rev. 6. The count stays at 64, and C1 is unchanged.
12. The appendix reports the checks that were actually run on the three part files, with their counts, and lists the checks that could not be run.

## 1. Core rules

### 1.1 Allergen status model

- Two allergen dimensions: `ingredient` and `cross_contact`.
- Both dimensions use the statuses `present`, `possible`, `absent`, `unknown`.
- Severity order, most severe first: `present` > `possible` > `unknown` > `absent`.
- Preparation is a separate, third concept: `preparation.details_known` (boolean). It is `false` for every food in the current data.
- Canonical codes, in canonical order, with aliases:
  - `milk` — alias `dairy`
  - `eggs` — alias `egg`
  - `peanuts` — alias `peanut`
  - `tree_nuts` — aliases `tree-nuts`, `tree nuts`
  - `fish` — no aliases
  - `shellfish` — no aliases
  - `soy` — alias `soya`
  - `wheat` — no aliases
  - `gluten` — no aliases
  - `sesame` — no aliases
  - `sulfites` — alias `sulphites`
- Group aliases:
  - `nuts` expands to `peanuts` and `tree_nuts`
  - `seafood` expands to `fish` and `shellfish`

### 1.2 Provenance values

This is the complete set. `/foods/meta/allergens` returns exactly these values.

Ingredient provenance (6 values):

- `legacy_seed_heuristic` — the code's legacy column is `True`. Status: `possible`.
- `legacy_default_false` — the code's legacy column is `False`. Status: `unknown`.
- `legacy_null` — the code's legacy column is `NULL`. Status: `unknown`.
- `no_allergen_record` — the food has no allergen row. Status: `unknown`.
- `not_tracked` — the food has an allergen row, but the code has no legacy column (`wheat`, `sesame`, `sulfites`). Status: `unknown`.
- `derived_from_wheat` — wheat is `present` or `possible` and gluten's own status is less severe. Gluten is raised to `possible`, or to `present` when wheat is `present`.

Legacy column fan-out. Each canonical code has at most one source column:

- `dairy` → `milk`
- `nuts` → `peanuts` and `tree_nuts`
- `gluten` → `gluten`
- `eggs` → `eggs`
- `soy` → `soy`
- `shellfish` → `fish` and `shellfish`
- `wheat`, `sesame` and `sulfites` have no source column.
- Gluten never implies wheat.

Ingredient provenance resolution. For each food and each code, the first rule that matches decides:

1. The food has no allergen row → `unknown` / `no_allergen_record`. This applies to all 11 codes of that food, including `wheat`, `sesame` and `sulfites`. `not_tracked` is never used for such a food.
2. The food has an allergen row and the code has no source column → `unknown` / `not_tracked`.
3. The source column is `NULL` → `unknown` / `legacy_null`.
4. The source column is `False` → `unknown` / `legacy_default_false`.
5. The source column is `True` → `possible` / `legacy_seed_heuristic`.
6. After rules 1 to 5 have run for all 11 codes, the wheat rule runs: if wheat is `present` or `possible` and gluten is less severe, gluten is raised with provenance `derived_from_wheat`.

Why rule 1 comes before rule 2: a missing row means nothing at all is recorded for the food, which is the more basic gap. Both rules give `unknown`, so the order changes only what is reported, never eligibility.

Consequences:

- For one food, either all 11 codes have provenance `no_allergen_record`, or none has.
- `not_tracked` can appear only on `wheat`, `sesame` and `sulfites`.
- The legacy data has no wheat column, so wheat is never `present` or `possible` with the current data. `derived_from_wheat` is reachable only through domain input built in tests.

Cross-contact provenance (3 values):

- `no_source` — no cross-contact claim exists for this food and code. Status: `unknown`. This applies to every current food, whether or not it has an allergen row.
- `insufficient_preparation_evidence` — a claim exists but is not backed by a verified source for this food. An `absent` claim that fails the coupling rule in §1.4 becomes `unknown` with this provenance. A `present` or `possible` claim keeps its status and takes this provenance when conditions 2 and 3 of §1.4 do not both hold.
- `verified_preparation_source` — the claim is backed by a verified source for this food. An `absent` claim that passes all four conditions in §1.4 stays `absent` with this provenance. A `present` or `possible` claim keeps its status and takes this provenance when conditions 2 and 3 of §1.4 both hold.

With the current data, ingredient is never `present` or `absent`, and cross-contact is always `unknown` with provenance `no_source`.

### 1.3 Eligibility (fail-closed)

- For each avoided code, a food is eligible only if `ingredient = absent` and `cross_contact = absent`.
- `present`, `possible` or `unknown` in either dimension excludes the food.
- With `none_confirmed`, no codes are avoided, so the allergen gate is not applied.
- With the current data, any restriction yields zero eligible results. This is the intended fail-closed outcome, reported as `no_verified_alternatives`.

### 1.4 Preparation coupling

Applied in the domain layer (N2) before eligibility. A `cross_contact = absent` claim is kept only if all four conditions hold:

1. `preparation.details_known` is `true`;
2. a `PreparationSource` is attached and its `verified` field is `true`;
3. the source's `food_id` equals the evaluated food's id;
4. the source's `explicit_absence` set contains the allergen code.

Otherwise the status becomes `unknown` with provenance `insufficient_preparation_evidence`.

- A bare boolean or flag is never sufficient evidence.
- `PreparationSource` is a domain-only value type. It adds no database column or model field, and no current data creates one.
- `possible` and `present` claims are never downgraded, because they are never less restrictive. Their provenance follows §1.2.

### 1.5 Meaning of `none_confirmed`

- `none_confirmed` is the user's confirmation that NutriSwap should apply no allergen filtering.
- It is not a statement that the user has no allergies, and not a statement that any food is free of allergens.
- The API reports it as `applied.allergen_filtering = "not_applied"`.
- The UI action label and helper text are the fixed texts `none_confirmed_label` and `none_confirmed_helper` in §1.6.

### 1.6 Fixed texts

Each text below is defined exactly once here. In the code, the allergen texts live in N2, the outcome, reason and nutrition texts in N6 and N3, and the frontend copies in N14 and N15. A test asserts that the backend constants, the metadata output and the frontend constants are identical. Placeholders in braces are filled as described under each template.

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

Fixed text `uncertainty.allergen_ingredient_flagged.generic` (used in every other case; new wording; no current data produces it):

```text
Recorded as an ingredient or a possible ingredient: {labels}.
```

Fixed text `uncertainty.allergen_ingredient_unverified`:

```text
NutriSwap can't confirm whether this dish's ingredients include these allergens.
```

Fixed text `uncertainty.allergen_cross_contact_flagged` (new wording; no current data produces it):

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

Fixed text `reason.filter_threshold` (`{field}` is the nutrition field name; `{direction}` is `below` for `lt` and `above` for `gt`; `{value}` is the threshold; `{stored}` is the food's stored value; `{unit}` is the preset filter's unit):

```text
Matches your selected exploratory filter: {field} {direction} {value} {unit} (stored value {stored} {unit}; measurement basis unknown)
```

Fixed text `reason.category` (`{original}` is the original food's name):

```text
Same food category as {original}: {category}
```

Fixed text `reason.swap_group` (new wording):

```text
Same category group as {original}: {category}
```

Fixed text `legacy_flag_label` (new wording; see §1.7):

```text
Possible (keyword-based, not confirmed)
```

Fixed text `legacy_unverified_notice` (new wording; see §1.7):

```text
Allergen information for this food is not verified. A missing flag does not mean the allergen is absent.
```

### 1.7 Legacy allergen booleans: display rule

Batch 1 leaves the legacy `allergens` object (six booleans) on `GET /foods`, `GET /foods/search` and `GET /foods/{id}`. Removing or replacing it is a Batch 2 item (§7). Until then, this rule keeps the old data path from undermining the uncertainty model.

- A legacy `false`, a `null` and a missing key all mean `unknown`. No Batch 1 code may display any of them as absence, as "no", as a tick or as a "safe" state.
- A legacy `true` may be displayed only as possible: the mapped codes' labels with the fixed text `legacy_flag_label`.
- Negative flags are omitted individually. Wherever legacy flags are displayed, the fixed text `legacy_unverified_notice` and the preparation warning are shown with them.
- N16 exposes `legacyAllergenDisplay(allergens)`. It returns the state `identified` when any flag is `true` and `incomplete` otherwise. It never returns `none_identified`.
- The frontend fan-out from legacy column to canonical codes is a constant in N14. The contract test N13 asserts that it equals the backend fan-out in §1.2.

Where the rule applies, checked against the code on 2026-11-13:

- M8, the modal's allergen tab (today the `safety` tab, `index.jsx` lines 289–298). It is the only rendered place that reads the legacy booleans. Today it lists every flag and shows "Safe / No Major Allergens" when all are false. It is rewritten to follow this rule. The tab is labelled "Allergens" and its heading is "Allergen information".
- M11, the search page. It does not read `allergens` today, and it must not start to.
- M12, the comparison page. It does not read `allergens` today, and it must not start to. Its tagline "Compare nutrition, sustainability, and safety." becomes "Compare nutrition and sustainability."
- Nine component files contain legacy-boolean rendering, including "No known allergens", "Allergen-Free" and "Contains:". No rendered page imports them, so they are not part of Batch 1 (§3.3). M8, M11 and M12 must not import them. They are listed in the Batch 2 backlog.

## 2. Exclusion precedence, invariants and outcome

### 2.1 Primary-reason precedence

Each excluded food is counted exactly once, under the highest-ranked reason that applies to it. Rank 1 is the highest.

1. `allergen_ingredient_present` — any avoided code has `ingredient = present`.
2. `allergen_cross_contact_present` — any avoided code has `cross_contact = present`.
3. `allergen_ingredient_possible` — any avoided code has `ingredient = possible`.
4. `allergen_cross_contact_possible` — any avoided code has `cross_contact = possible`.
5. `allergen_ingredient_unknown` — any avoided code has `ingredient = unknown`.
6. `allergen_cross_contact_unknown` — any avoided code has `cross_contact = unknown`.
7. `nutrition_invalid` — a filtered field is negative, NaN, +inf or -inf.
8. `nutrition_missing` — a filtered field is null, or the food has no nutrition record while a preset is active.
9. `failed_filter` — all filtered values are valid but at least one preset condition fails.

Ranks 1 to 6 are the allergen-related reasons. Ranks 7 to 9 are the nutrition-related reasons.

### 2.2 Invariants

- I1: the sum of all nine `excluded.by_primary_reason` values equals `excluded.total`.
- I2: `eligible_total + excluded.total == candidates_considered`.
- I3: `len(results) == min(eligible_total, limit)`.
- I4: for each avoided code and each dimension, `present + possible + absent + unknown == candidates_considered`.
- I5: for each avoided code and each dimension, the sum of `unknown_by_provenance` values equals `unknown`.

Definitions:

- `candidates_considered` is the number of foods in the category scope, excluding the original food.
- `allergen_detail` counts (candidate, avoided code) pairs, so its counts are not additive across codes.

### 2.3 Outcome rule

Evaluated in this order; the first match wins:

1. `candidates_considered == 0` → `no_candidates`
2. `eligible_total > 0` → `alternatives_found`
3. at least one of ranks 1 to 6 has a count greater than 0 → `no_verified_alternatives`
4. otherwise → `no_matching_alternatives`

Consequently, zero eligible results caused only by nutrition reasons (ranks 7 to 9) always produce `no_matching_alternatives`.

## 3. Files — exactly 36 (23 new, 13 modified)

### 3.1 New files (23)

- N1 `backend/domain/__init__.py`
- N2 `backend/domain/allergens.py` — codes, aliases, status model, legacy mapping, provenance, preparation coupling, fixed allergen texts
- N3 `backend/domain/nutrition_rules.py` — presets, value classification, nutrition basis object
- N4 `backend/domain/food_categories.py` — sole owner of `CATEGORY_SWAP_GROUPS` and `category_scope()`
- N5 `backend/services/__init__.py`
- N6 `backend/services/discovery_engine.py` — eligibility gate, ranking, precedence, counts, outcome
- N7 `backend/tests/test_allergen_domain.py`
- N8 `backend/tests/test_nutrition_rules.py`
- N9 `backend/tests/test_food_categories.py`
- N10 `backend/tests/test_nutrition_integrity.py`
- N11 `backend/tests/test_discovery_engine.py`
- N12 `backend/tests/test_discovery_api.py`
- N13 `backend/tests/test_allergen_contract.py`
- N14 `frontend/src/constants/allergens.js`
- N15 `frontend/src/constants/nutritionFilters.js`
- N16 `frontend/src/utils/allergenStatus.js`
- N17 `frontend/src/utils/nutrition.js`
- N18 `frontend/src/utils/allergenProfile.js`
- N19 `frontend/src/context/AllergenProfileContext.jsx`
- N20 `frontend/src/__tests__/allergenStatus.test.mjs`
- N21 `frontend/src/__tests__/nutrition.test.mjs`
- N22 `frontend/src/__tests__/allergenProfile.test.mjs`
- N23 `docs/api/food-discovery.md`

### 3.2 Modified files (13)

Files marked ✱ already contain your uncommitted changes and are backed up before editing.

- M1 `backend/routers/foods.py` ✱
- M2 `backend/schemas.py`
- M3 `backend/tests/conftest.py` ✱
- M4 `backend/tests/test_foods.py` ✱
- M5 `backend/tests/test_validation.py` ✱
- M6 `frontend/src/utils/api.js` ✱
- M7 `frontend/src/App.jsx`
- M8 `frontend/src/pages/nutrition-explorer-modal/index.jsx` ✱
- M9 `frontend/src/pages/user-registration/components/AllergenProfileForm.jsx`
- M10 `frontend/src/pages/user-registration/index.jsx`
- M11 `frontend/src/pages/food-search-results/index.jsx` ✱
- M12 `frontend/src/pages/food-comparison-tool/index.jsx` ✱
- M13 `README.md` — the section at line 395 only

### 3.3 Not touched

- `backend/models.py`, `backend/seed.py`, `backend/database.py`, `backend/main.py`
- database data, schema and migrations
- CI and deploy files, `CLAUDE.md`, `frontend/package.json`, `docs/PROJECT_ROADMAP.md`
- `SmartSwapButton.jsx` and the explain-swap endpoint
- the legacy `allergens` object on `GET /foods`, `GET /foods/search` and `GET /foods/{id}` (Batch 2)
- the nine component files that contain legacy allergen rendering and that no rendered page imports:
  - `frontend/src/pages/nutrition-explorer-modal/components/AllergenAlert.jsx`
  - `frontend/src/pages/nutrition-explorer-modal/components/ComparisonView.jsx`
  - `frontend/src/pages/food-search-results/components/ResultCard.jsx`
  - `frontend/src/pages/food-search-results/components/ResultsGrid.jsx`
  - `frontend/src/pages/food-search-results/components/SearchFilters.jsx`
  - `frontend/src/pages/food-comparison-tool/components/AddFoodModal.jsx`
  - `frontend/src/pages/food-comparison-tool/components/ComparisonCard.jsx`
  - `frontend/src/pages/food-comparison-tool/components/RecommendationPanel.jsx`
  - `frontend/src/pages/food-comparison-tool/components/FilterControls.jsx`

End of Part 1. Part 2 follows with section 4.
