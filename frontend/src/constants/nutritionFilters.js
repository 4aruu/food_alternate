/**
 * Nutrition presets, search filters and fixed texts (frontend copy).
 *
 * Preset keys and labels must stay identical to backend/domain/nutrition_rules.py
 * and the GET /foods/meta/health-goals output; a contract test compares them.
 * The thresholds the alternatives engine applies live on the server only.
 */

// The seven nutrition fields, in the order the API uses.
export const NUTRITION_FIELDS = Object.freeze([
  'calories', 'protein', 'fat', 'carbohydrates', 'fiber', 'sugar', 'sodium',
]);

// Exploratory presets the alternatives request can name, in API order.
export const HEALTH_GOAL_PRESETS = Object.freeze([
  Object.freeze({ key: 'diabetic', label: 'Sugar and fiber filter' }),
  Object.freeze({ key: 'heart', label: 'Sodium and fat filter' }),
  Object.freeze({ key: 'weight', label: 'Calorie filter' }),
  Object.freeze({ key: 'muscle', label: 'Protein filter' }),
  Object.freeze({ key: 'kidney', label: 'Sodium and protein filter' }),
  Object.freeze({ key: 'cholesterol', label: 'Fat filter' }),
]);

export const HEALTH_GOAL_KEYS = Object.freeze(HEALTH_GOAL_PRESETS.map((preset) => preset.key));

/**
 * Nutrient filters of the search page. A food passes only when the stored
 * value is a valid number that meets the condition; a missing or invalid
 * value never passes.
 */
export const SEARCH_NUTRIENT_FILTERS = Object.freeze([
  Object.freeze({ key: 'High Protein', label: 'High Protein', field: 'protein', op: 'gt', value: 15, unit: 'g' }),
  Object.freeze({ key: 'Low Calorie', label: 'Low Calorie', field: 'calories', op: 'lt', value: 300, unit: 'kcal' }),
]);

// ── Fixed texts ───────────────────────────────────────────────
export const DISCLAIMER =
  'Exploratory filters for food discovery. Not medical advice and not validated ' +
  'for any medical condition. Allergen information is incomplete and can depend ' +
  'on preparation; always check labels or ask the preparer.';

// Shown wherever values from two or more foods appear together.
export const NUTRITION_BASIS_NOTICE =
  'Nutrition values were entered from source portions that differ between foods ' +
  'and have no recorded measurement basis; do not compare them as equivalent ' +
  'amounts.';

export const NUTRITION_INCOMPLETE_TEXT = 'Some nutrition values for this food are not available.';

// Shown in place of a missing or invalid value. Never 0.
export const NOT_AVAILABLE_LABEL = 'Not available';

// Every fixed text in this file, keyed as in the blueprint (§1.6) where one exists.
export const NUTRITION_FIXED_TEXTS = Object.freeze({
  disclaimer: DISCLAIMER,
  'uncertainty.nutrition_unstandardized': NUTRITION_BASIS_NOTICE,
  'uncertainty.nutrition_incomplete': NUTRITION_INCOMPLETE_TEXT,
});
