/**
 * Allergen vocabulary and fixed texts (frontend copy).
 *
 * Must stay identical to backend/domain/allergens.py and the
 * GET /foods/meta/allergens output; a contract test compares them.
 */

// Canonical codes, in canonical order.
export const ALLERGEN_CODES = Object.freeze([
  'milk', 'eggs', 'peanuts', 'tree_nuts', 'fish', 'shellfish',
  'soy', 'wheat', 'gluten', 'sesame', 'sulfites',
]);

export const ALLERGEN_LABELS = Object.freeze({
  milk: 'Milk',
  eggs: 'Eggs',
  peanuts: 'Peanuts',
  tree_nuts: 'Tree nuts',
  fish: 'Fish',
  shellfish: 'Shellfish',
  soy: 'Soy',
  wheat: 'Wheat',
  gluten: 'Gluten',
  sesame: 'Sesame',
  sulfites: 'Sulfites',
});

export const ALLERGEN_ALIASES = Object.freeze({
  milk: Object.freeze(['dairy']),
  eggs: Object.freeze(['egg']),
  peanuts: Object.freeze(['peanut']),
  tree_nuts: Object.freeze(['tree-nuts', 'tree nuts']),
  fish: Object.freeze([]),
  shellfish: Object.freeze([]),
  soy: Object.freeze(['soya']),
  wheat: Object.freeze([]),
  gluten: Object.freeze([]),
  sesame: Object.freeze([]),
  sulfites: Object.freeze(['sulphites']),
});

export const GROUP_ALIASES = Object.freeze({
  nuts: Object.freeze(['peanuts', 'tree_nuts']),
  seafood: Object.freeze(['fish', 'shellfish']),
});

// The four statuses, most severe first is present > possible > unknown > absent.
export const ALLERGEN_STATUSES = Object.freeze(['present', 'possible', 'absent', 'unknown']);

/**
 * Legacy boolean column -> canonical codes it feeds.
 * Wheat, sesame and sulfites have no column. Gluten never implies wheat.
 * Must equal the backend fan-out (LEGACY_COLUMN_FANOUT).
 */
export const LEGACY_COLUMN_FANOUT = Object.freeze({
  dairy: Object.freeze(['milk']),
  nuts: Object.freeze(['peanuts', 'tree_nuts']),
  gluten: Object.freeze(['gluten']),
  eggs: Object.freeze(['eggs']),
  soy: Object.freeze(['soy']),
  shellfish: Object.freeze(['fish', 'shellfish']),
});

// ── Fixed texts ───────────────────────────────────────────────
export const PREPARATION_WARNING =
  'Allergen exposure can depend on the ingredients used, sauces, coatings, shared ' +
  'equipment and the environment where food is prepared. NutriSwap cannot verify ' +
  'these details with its current data. Cooking or heating cannot be relied on to ' +
  'remove allergens. Check with whoever prepares the food, or read the label.';

export const NONE_CONFIRMED_LABEL = 'Continue without allergen filtering';

export const NONE_CONFIRMED_HELPER =
  'NutriSwap will show alternatives without filtering them for allergens. Each ' +
  "food's allergen information is still shown, and it is incomplete.";

export const NONE_IDENTIFIED_LABEL = 'None identified in the available data';

export const LEGACY_FLAG_LABEL = 'Possible (keyword-based, not confirmed)';

export const LEGACY_UNVERIFIED_NOTICE =
  'Allergen information for this food is not verified. A missing flag does not ' +
  'mean the allergen is absent.';

// Outcome texts of POST /foods/{id}/alternatives. `{n}` is eligible_total.
export const OUTCOME_TEXTS = Object.freeze({
  no_verified_alternatives:
    "NutriSwap can't currently verify any alternative that meets your allergen " +
    'restrictions, because its ingredient and cross-contact data is incomplete. ' +
    'No alternatives are shown rather than unverified ones.',
  no_matching_alternatives:
    "No alternatives in this food's category group match your selected " +
    'exploratory filters.',
  no_candidates: "There are no other foods in this food's category group.",
  alternatives_found: '{n} alternatives found.',
});

// Every fixed text in this file, keyed as in the blueprint (§1.6).
export const ALLERGEN_FIXED_TEXTS = Object.freeze({
  preparation_warning: PREPARATION_WARNING,
  none_confirmed_label: NONE_CONFIRMED_LABEL,
  none_confirmed_helper: NONE_CONFIRMED_HELPER,
  none_identified_label: NONE_IDENTIFIED_LABEL,
  legacy_flag_label: LEGACY_FLAG_LABEL,
  legacy_unverified_notice: LEGACY_UNVERIFIED_NOTICE,
  'outcome.no_verified_alternatives': OUTCOME_TEXTS.no_verified_alternatives,
  'outcome.no_matching_alternatives': OUTCOME_TEXTS.no_matching_alternatives,
  'outcome.no_candidates': OUTCOME_TEXTS.no_candidates,
  'outcome.alternatives_found': OUTCOME_TEXTS.alternatives_found,
});
