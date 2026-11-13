# Batch 1 — Final Blueprint, Rev. 7 — Part 3 of 3 (sections 5–7 and validation appendix)

## 5. Acceptance criteria (1–64)

Each criterion is covered by an automated test unless marked (check) for a grep or structural check, or (manual).

### A. Architecture

1. No frontend code decides eligibility. `getSmartSwaps` and the modal's own category list are removed. (check)
2. The modal renders exactly the server's `results`, in the server's order.
3. Eligibility and ranking are separate functions. Ranking never adds, removes or changes the status of a result, tested with 20 shuffled foods.
4. Ranking is: same category, then same swap group, then id; repeated runs give the same order. Brand, region, cuisine, nutrient values and `nutrition_score` are not used. Engine and domain logic contain no region or cuisine names; N4 is exempt because it holds only category data. (test and check)

### B. Category ownership

5. `CATEGORY_SWAP_GROUPS` is defined only in N4. M1 and N6 import the same object, verified by an identity check. No other Python or JavaScript file defines a category-group list. (test and check)
6. The moved mapping equals a snapshot of the original mapping taken from M1 before the move.
7. Every seed category, read from `seed.py` with `ast`, maps to a scope. A mapped category reports `category_scope_source = "swap_group"`. An unmapped category is limited to its own category and reports `"unmapped_same_category_only"`.

### C. Profile state and `none_confirmed`

8. The reducer has exactly three states: `unconfigured`, `restrictions` (at least one code) and `none_confirmed` (no codes). No input produces `restrictions` with no codes or `none_confirmed` with codes.
9. The initial state, and the state after a reload, is `unconfigured`. Nothing persists the profile: no `localStorage`, `sessionStorage`, IndexedDB, URL, `history.state`, `location.state` or cookie. (test and check)
10. Removing the last selected allergen returns the state to `unconfigured`, never to `none_confirmed`.
11. `none_confirmed` is reachable only through the "Continue without allergen filtering" action. Completing registration with nothing selected leaves the state `unconfigured`.
12. While the state is `unconfigured`, the modal shows the profile step and makes no alternatives request. (test: the API helper refuses to send; manual: the screen)

### D. Errors

13. Each error in §4.2 has a test asserting its status code, `error_code` and body shape.
14. A request that violates several rules receives the earliest error in §4.2. Tested cases: an unknown allergen on a non-existent food returns `UNKNOWN_ALLERGEN`, not 404; a missing profile with an unknown allergen returns `UNKNOWN_ALLERGEN`; `none_confirmed` with `["nuts"]` returns `PROFILE_INCONSISTENT`, because alias expansion happens first.
15. No database query runs before checks 1 to 6 in §4.2 pass, verified with a session spy.

### E. Allergen vocabulary, provenance and coupling

16. All 11 codes, every alias in §1.1 and both group aliases are accepted and expanded correctly.
17. Each provenance value in §1.2 and each column fan-out has its own test. The resolution order in §1.2 is tested: a food with no allergen row has provenance `no_allergen_record` on all 11 codes, including `wheat`, `sesame` and `sulfites`; a food with an allergen row has provenance `not_tracked` on exactly those three codes. Current data never produces ingredient `present` or `absent`, and never produces cross-contact other than `unknown` with provenance `no_source`.
18. Wheat that is `present` or `possible` raises gluten to at least `possible` with provenance `derived_from_wheat`, and never lowers a more severe gluten status. Gluten never implies wheat.
19. `/foods/meta/allergens` returns exactly the provenance values in §1.2: six for ingredient and three for cross-contact.
20. `may_contain` appears nowhere in API output, backend code, frontend code or N23, except in N23's breaking-change section. (check)
21. The five preparation-coupling tests. Each input claims `cross_contact = absent`; each expected result is `unknown` with provenance `insufficient_preparation_evidence`:
    - C1: the attached source is verified, belongs to this food and explicitly records this allergen as absent, but `preparation.details_known = false`.
    - C2: `preparation.details_known = true`, but no source is attached; the claim is a bare boolean or flag.
    - C3: `preparation.details_known = true` and a source is attached, but its `verified` field is `false`.
    - C4: `preparation.details_known = true` and a verified source is attached, but its `food_id` belongs to a different food.
    - C5: `preparation.details_known = true` and a verified source for this food is attached, but its `explicit_absence` set does not contain this allergen (it lists other allergens only, or makes only a general claim).
22. Positive control C6: when all four conditions in §1.4 hold, the result is `absent` with provenance `verified_preparation_source`. Claims of `possible` and `present` keep their status without evidence. Their provenance is `verified_preparation_source` when a verified source for this food is attached, and `insufficient_preparation_evidence` otherwise.

### F. Eligibility (fail-closed)

23. For an avoided code, a food is eligible only when both dimensions are `absent`. Tested for all 11 codes across all 16 status combinations; only the combination (absent, absent) passes.
24. `unknown` is never treated as absence anywhere: not in the engine, the display helper or any UI text. A legacy `false`, a `null` and a missing legacy flag are all treated as `unknown` (§1.7). Unknown preparation can never produce eligibility (follows from criteria 21 to 23).
25. With several codes avoided, a food must pass every one of them.
26. An allergen the user did not avoid never excludes a food. Its statuses appear under `uncertainty`.
27. With `none_confirmed`, `applied.allergen_filtering` is `"not_applied"`, the allergen gate is not applied, and every result still carries its allergen and preparation uncertainty entries.
28. The `none_confirmed` action label and helper text are exactly the fixed texts `none_confirmed_label` and `none_confirmed_helper` in §1.6.
29. No API or UI text states or implies that the user has no allergies or that a food is free of allergens. A test over all text constants in N2, N3, N6, N14 and N15 rejects these phrases: "allergen-free", "free of allergens", "free from allergens", "no allergens", "no known allergens", "no allergies", "safe for you", "safe to eat", "contains no". (test, plus check of M8, M9 and M10)

### G. Counting and outcome

30. The primary reason follows §2.1. There is one test for each adjacent pair of ranks, plus these cases: `possible` milk with `unknown` eggs → rank 3; `unknown` ingredient with missing nutrition → rank 5; invalid sugar with missing fiber → rank 7.
31. Outcome, allergen-only: `restrictions` where every candidate is excluded for an allergen reason → `no_verified_alternatives`.
32. Outcome, nutrition-only: `none_confirmed` with a preset, where every candidate is excluded as `failed_filter`, `nutrition_missing` or `nutrition_invalid` → `no_matching_alternatives`.
33. Outcome, mixed: `restrictions` where some candidates are excluded for allergen reasons and the rest for nutrition reasons → `no_verified_alternatives`.
34. Outcome, verified allergens: `restrictions` with synthetic candidates that are (absent, absent) for the avoided code but all fail the nutrition filter → `no_matching_alternatives`. Separate tests cover `no_candidates` (empty category scope) and `alternatives_found`.
35. Invariants I1, I2 and I3 are asserted in every API test and in a property test over at least 200 randomised fixtures generated from a seeded random number generator.
36. Invariants I4 and I5 hold for every avoided code. Every `unknown_by_provenance` key in §4.3 is always present: four keys for ingredient and two for cross-contact. `by_allergen` is `{}` when no code is avoided.
37. The four outcome texts are identical in the backend constants, the API output and N14, and equal the fixed texts in §1.6. `alternatives_found` substitutes `eligible_total` for `{n}`.
38. The avoid list, the profile state and the health goals never appear in any log record, verified by capturing logs during valid and invalid requests.

### H. Preparation

39. Every result carries `preparation.details_known = false` and a `preparation_dependent` uncertainty entry. The four allergen uncertainty codes and `preparation_dependent` stay separate and are never merged.
40. The preparation warning is identical in N2, in `/foods/meta/allergens`, in every `preparation_dependent` entry and in N14, and equals the fixed text `preparation_warning` in §1.6 (equality test). It is shown without any user interaction wherever allergen status or legacy allergen flags appear: modal results and the modal's allergen tab. (test and manual)
41. The fixed preparation warning is the only text that mentions cooking or heating. No text states or implies that cooking or heating removes allergen risk. (test over all text constants, plus check: grep for "cook" and "heat" outside the warning constant)
42. No preparation, sauce, coating, equipment or environment data is invented or stored, and no database or model field is added. `PreparationSource` is a domain-only type that no current data creates. (check)

### I. Nutrition integrity and serialization

43. A preset applies all its conditions together (AND), and several presets also combine with AND.
44. A filtered field that is null leads to `nutrition_missing`; a negative, NaN, +inf or -inf value leads to `nutrition_invalid`; neither is ever converted to 0. A food without a nutrition record leads to `nutrition_missing` whenever a preset is active.
45. On `/foods`, `/foods/search`, `/foods/{id}` and the alternatives endpoint, a database row containing -1, NaN, +inf and -inf returns 200 with JSON that a NaN-rejecting parser accepts. Those fields are `null` and listed in `invalid_fields`; missing fields are listed in `missing_fields`; `nutrition_record_present` is correct. The clamping validator on nutrition values is removed. (test and check)
46. The nutrition basis object is exactly as in §4.3. No code, UI or documentation text presents "1 Portion" as the measurement basis or describes values as standardised or per portion. (test and check)
47. Every result includes `nutrition_unstandardized`, and `nutrition_incomplete` appears exactly when `nutrition_quality` lists any field. The UI shows the non-equivalence notice wherever values from two or more foods appear together: modal results, search results with a nutrient filter or sort, and the comparison tool.
48. No reason text or UI label makes a comparative nutritional claim: no "lower than", "higher than", "better", "healthier", "best value" or "winner". The comparison tool's highlighting is removed. (test and check)
49. Neither `nutrition_score` nor nutrient values affect ranking, and the alternatives food object does not include `nutrition_score`.
50. Seed guard: an `ast` read of `seed.py`, which is never imported, confirms that every `raw_native_list` food has a `REAL_NUTRITION_DB` entry with all seven fields present as non-negative numbers.
51. The thresholds returned by `/foods/meta/health-goals` equal those the engine applies, and every one of the six presets has `kind = "exploratory_filter"` and `basis = "as_stored_unstandardized"`. No preset text or disclaimer contains "medically validated", "medical validated", "GI", "saturated", "suitable for", "safe for", "prescription" or "recommended for". The disclaimer is identical in the backend constant, the alternatives response, `/foods/meta/health-goals` and N15, and equals the fixed text `disclaimer` in §1.6.
52. Search and comparison show "Not available" for null values and never treat them as 0. The Low Calorie and High Protein filters exclude foods with null values for the filtered field.

### J. Routing and compatibility

53. Both metadata routes are registered before `/foods/{food_id}` and `/foods/{food_id}/alternatives` (structural test).
54. Both metadata endpoints return 200, and each response validates against its schema in §4.8 with no missing and no extra fields. Neither path is handled as a food id: no 422 and no 404.
55. `GET /foods/{id}/alternatives` returns 405 with `{"detail": "Method Not Allowed"}`, with or without query parameters.
56. No code still calls the GET form, and no profile or health-goal data is placed in any URL. The M6 helper sends both only in the POST body, verified by inspecting the request it builds. (test and check)
57. N23 documents §1.2, §1.6, §1.7, §2, §4 and the backlog in §7, and M13 links to it. (manual)

### K. User interface

58. "Safe / No Major Allergens", "Safe", "Friendly" and `{mode} Friendly` are gone from all rendered components. The modal's tab is labelled "Allergens" and its heading is "Allergen information". The legacy display rule in §1.7 holds:
    - `legacyAllergenDisplay` returns `identified` when any legacy flag is `true`, and `incomplete` for all-false, null, missing and empty input. It never returns `none_identified`. (test in N20)
    - M8 shows a legacy `true` only with the fixed text `legacy_flag_label`, shows no entry for a negative flag, and shows `legacy_unverified_notice` with the preparation warning. (test and manual)
    - M11 and M12 contain no read of a food's `allergens` property, and M12's tagline does not mention safety. (test that reads the source text)
    - M8, M11 and M12 import none of the nine unrendered files listed in §3.3. (test that reads the source text)
    - (check: grep for "Safe" and "Friendly", excluding the nine unrendered files)
59. The display helper returns exactly one of three states:
    - `identified` — any code is `present` or `possible` in either dimension;
    - `none_identified` — all 11 codes are `absent` in both dimensions (tested with synthetic input; current data never reaches it);
    - `incomplete` — every other case.
    The UI label for `none_identified` is "None identified in the available data". No state or label uses the word "safe".
60. Reasons use the three `reason` templates in §1.6, and uncertainty entries use the `uncertainty` texts in §1.6. The disclaimer, the basis notice and the preparation warning always appear with results, and the outcome text appears whenever results are empty. (test and manual)

### L. Consistency and scope

61. The allergen code set is identical in N2, N14, `/foods/meta/allergens` and the M9 form ids. The legacy column fan-out in N14 equals the backend fan-out in §1.2.
62. Every JSON example in N23 parses with a parser that rejects duplicate keys, NaN and Infinity, and validates against the matching model in M2: the request, the alternatives response, the error response, the food schema and both metadata responses. Verified by a test that loads the examples from N23.
63. Every existing test passes, except tests deliberately migrated or replaced, and each of those is listed in the diff summary.
64. Exactly the 36 files in §3 change: 23 created and 13 modified. A before-and-after comparison of git status and file hashes shows no other path changed. Every ✱ file is backed up first and receives edits only, with before and after diffs recorded. There is no commit, push, install, migration, database data change or configuration change.

## 6. Implementation order (unchanged)

- Step 0 — back up M1, M3, M4, M5, M6, M8, M11 and M12 to the scratchpad; capture the git status and file-hash baseline; snapshot `CATEGORY_SWAP_GROUPS`.
- Step 1 — N1, N2, N3, N4, N7, N8, N9. Gate: pytest and ruff.
- Step 2 — M2, N10. Gate: pytest and ruff.
- Step 3 — N5, N6, N11. Gate: pytest and ruff.
- Step 4 — M1, M3, M4, M5, N12. Gate: pytest and ruff.
- Step 5 — N14, N15, N16, N17, N18, N19, N20, N21, N22, M6, M7. Gate: `node --test` and build.
- Step 6 — M8, M9, M10. Gate: `node --test` and build.
- Step 7 — M11, M12. Gate: `node --test` and build.
- Step 8 — N13, N23, M13. Gate: the full gate.
- Step 9 — full verification against criteria 1 to 64, then a diff summary for review.

Steps 1 to 8 cover every one of the 36 files exactly once.

Gate commands:

- the guarded pytest harness (empty working directory, dotenv disabled, database and network guards);
- `ruff check --no-cache .` in `backend/`;
- `node --test src/__tests__/*.test.mjs` in `frontend/`;
- an isolated `npm run build`;
- a before-and-after file comparison.

`npm run lint` cannot run because `frontend/package.json` has no `lint` script. Adding one is a configuration change and is not part of Batch 1.

## 7. Data-quality backlog (written into N23; not fixed in Batch 1)

Nutrition values:

- inconsistent source portions (per 250 ml, per slice, per tablespoon, per 100 g, per dish), with no basis recorded per food;
- the "1 Portion" label, which hides those differences;
- no portion weights;
- no provenance per value;
- `nutrition_score` derived from the unstandardised values;
- the unused `random.randint` fallback in `seed.py`;
- what standardisation would need: a per-100 g basis, portion weights and a source for each value.

Allergen data:

- allergens inferred from keywords, including `"nut"` matching "coconut";
- the category rule that adds soy to every Chinese dish;
- the `shellfish` column also storing fish;
- no columns for sesame, sulfites or wheat;
- no ingredient-list, cross-contact or preparation sources.

Batch 2 (recommended first):

- Legacy boolean API cleanup: the legacy `allergens` booleans, in which `False` means unknown, are still served by `GET /foods`, `GET /foods/search` and `GET /foods/{id}`. Batch 2 replaces them with the status model or removes them. Until then the display rule in §1.7 applies.
- The nine unrendered component files listed in §3.3 still contain code that renders the legacy booleans, including "No known allergens", "Allergen-Free" and "Contains:". Batch 2 deletes or rewrites them.
- Sustainability NaN issue: `SustainabilitySchema` still clamps negative values to 0, and a NaN sustainability value can still cause a 500.

Code and data leftovers:

- brand labels (Kerala Native, Restaurant/Global, Continental) listed among the meal categories.

## Appendix — validation actually performed on Rev. 7

The checks ran on the three saved part files, not on the chat text. The validator is `validate_rev7.py` in the same folder as the part files. It uses Python 3.13.5's `json` module and Pydantic 2.13.4 from the project's existing virtual environment. Nothing was installed, and no project file was read or written by it.

### Results

- JSON blocks parsed: 15 of 15. The parser rejects duplicate keys, NaN, Infinity, -Infinity and trailing commas; a self-test confirmed it rejects each of the five before it was used.
- Response examples validated against the response schema: 2 of 2 (`AlternativesResponse`, Examples A and B).
- All other examples validated against their schemas: 13 of 13. These are 2 `AlternativesRequest`, 6 `ErrorResponse`, 1 `MethodNotAllowed`, 1 `FoodSchema`, 1 `MetaAllergensResponse`, 1 `HealthGoalsResponse` and 1 `AllergenStatusMap`.
- The schemas reject unknown fields and missing fields. Five negative controls confirmed that validation can fail: a missing field, an extra field, a missing rank 4, an invalid enum value and a kidney preset without `basis` were each rejected.
- Examples A and B: invariants I1 to I5, the outcome rule, the uncertainty lists against `allergen_status`, `nutrition_incomplete` against `nutrition_quality`, and each threshold reason against the preset thresholds and the stored values all hold.
- Fixed texts: 21 are defined, each exactly once. Every copy in the JSON examples equals its definition character for character: the disclaimer (3 copies: Example A, Example B, health-goals metadata), the preparation warning (2 copies: Example B, allergens metadata), the outcome texts (2), the uncertainty texts (5) and the reason texts (3). No JSON example contains a variant wording of a fixed text.
- Metadata examples: 11 codes in canonical order; the provenance lists (6 and 3) equal §1.2; aliases equal §1.1; six presets, each with `key`, `label`, `kind`, `basis` and `filters`, including kidney; thresholds equal the values in the current router.
- Error precedence: seven entries in §4.2, and the six application-error examples are in the same order.
- Primary-reason precedence: ranks 1 to 9 in §2.1 equal the `PrimaryReasonCounts` field list in §4.3.
- Acceptance criteria: numbered 1 to 64, each once, in order, and none ends mid-sentence.
- Comparison with the saved Rev. 6 file: C1 is identical character for character; the 36-file list is identical; the implementation order is identical; §1.3, §2.2 and §2.3 are identical; 16 criteria differ, and they are the ones listed in "Changes from Rev. 6".
- File scope: 23 new and 13 modified paths, 36 distinct; steps 1 to 8 use each exactly once; the nine unrendered files are outside the scope.
- No ellipsis or placeholder text is present, and the code fences are balanced in all three parts.
- Run history: the first run stopped at a fault in the validator's own section lookup, not in the blueprint. After that one-line fix, all 25 check groups passed. The run was repeated after this appendix was added and passed again.

### Checked against the code in this session

- The legacy allergen rendering described in §1.7 and §3.3: confirmed by searching the frontend source for reads of `allergens` and for imports of the nine files.
- The six preset thresholds: equal to `backend/routers/foods.py` lines 316–353.
- The `ErrorResponse` shape and the `FoodSchema` fields: equal to `backend/schemas.py`.
- The category scope in Examples A and B: equal to the swap group of "Breakfast" in `backend/routers/foods.py`.

### Checks that could not be performed

- Frontend copies of the fixed texts. N14 and N15 do not exist yet, so the metadata copies could be compared only with §1.6, not with frontend code. Criteria 37, 40 and 51 require that comparison at implementation.
- Validation against the real response models. M2 has not been changed, so the examples were validated against models written by hand from §4 inside the validator. An error made in both §4 and that mirror would not be caught. Criterion 62 repeats the validation against the real models.
- A formal JSON Schema validation. The `jsonschema` package is not installed and nothing was installed, so Pydantic models were used instead.
- The illustrative values in the examples (candidate counts, the food names "Wheat Dosa", "Puttu" and "Banana Chips", ids and nutrient values) were not checked against the database or the seed data.
- The text in the chat. I cannot compare what your terminal displays or copies with the saved files. If any passage looks damaged, the saved files are the reference.
