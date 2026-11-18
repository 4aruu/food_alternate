// Run with: node --test src/__tests__/nutrition.test.mjs  (from frontend/)
import { test } from 'node:test';
import assert from 'node:assert/strict';

import * as N from '../constants/nutritionFilters.js';
import {
  formatFoodNutrient,
  formatNutrient,
  isValidNutrientValue,
  nutrientBarPercent,
  nutrientValue,
  passesNutrientFilter,
} from '../utils/nutrition.js';

const INVALID = [null, undefined, -1, -0.5, NaN, Infinity, -Infinity, '12', true, {}];
const food = (nutrition) => ({ id: 1, name: 'F', nutrition });
const filter = (key) => N.SEARCH_NUTRIENT_FILTERS.find((f) => f.key === key);

// ── Value validity (criteria 44, 52) ─────────────────────────
test('valid values are finite non-negative numbers', () => {
  for (const value of [0, 0.5, 1, 300, 1e6]) assert.equal(isValidNutrientValue(value), true, String(value));
  for (const value of INVALID) assert.equal(isValidNutrientValue(value), false, String(value));
});

test('missing or invalid values read as null, never 0', () => {
  assert.equal(nutrientValue(food({ sugar: 0 }), 'sugar'), 0);
  assert.equal(nutrientValue(food({ sugar: 4 }), 'sugar'), 4);
  for (const value of INVALID) assert.equal(nutrientValue(food({ sugar: value }), 'sugar'), null);
  assert.equal(nutrientValue(food(null), 'sugar'), null);
  assert.equal(nutrientValue({}, 'sugar'), null);
  assert.equal(nutrientValue(null, 'sugar'), null);
});

test('formatting shows "Not available" for missing or invalid values', () => {
  assert.equal(formatNutrient(12, 'g'), '12g');
  assert.equal(formatNutrient(250, ' kcal'), '250 kcal');
  assert.equal(formatNutrient(0, 'mg'), '0mg');
  for (const value of INVALID) assert.equal(formatNutrient(value, 'g'), 'Not available');
  assert.equal(formatFoodNutrient(food({ sodium: null }), 'sodium', 'mg'), 'Not available');
  assert.equal(formatFoodNutrient(food(null), 'sodium', 'mg'), 'Not available');
  assert.equal(formatFoodNutrient(food({ sodium: 120 }), 'sodium', 'mg'), '120mg');
});

test('bar width is null for missing or invalid values, clamped otherwise', () => {
  assert.equal(nutrientBarPercent(15, 30), 50);
  assert.equal(nutrientBarPercent(90, 30), 100);
  assert.equal(nutrientBarPercent(0, 30), 0);
  for (const value of INVALID) assert.equal(nutrientBarPercent(value, 30), null);
  assert.equal(nutrientBarPercent(5, 0), null);
});

// ── Search filters (criterion 52) ────────────────────────────
test('search filters keep the existing thresholds', () => {
  assert.deepEqual(
    N.SEARCH_NUTRIENT_FILTERS.map(({ key, field, op, value, unit }) => ({ key, field, op, value, unit })),
    [
      { key: 'High Protein', field: 'protein', op: 'gt', value: 15, unit: 'g' },
      { key: 'Low Calorie', field: 'calories', op: 'lt', value: 300, unit: 'kcal' },
    ],
  );
});

test('High Protein and Low Calorie exclude foods with a null or invalid value', () => {
  const highProtein = filter('High Protein');
  const lowCalorie = filter('Low Calorie');
  for (const value of INVALID) {
    assert.equal(passesNutrientFilter(food({ protein: value }), highProtein), false, String(value));
    assert.equal(passesNutrientFilter(food({ calories: value }), lowCalorie), false, String(value));
  }
  // A null calorie value read as 0 would pass "calories < 300"; it must not.
  assert.equal(passesNutrientFilter(food({ calories: null }), lowCalorie), false);
  assert.equal(passesNutrientFilter(food(null), lowCalorie), false);
});

test('filters apply their condition strictly', () => {
  const highProtein = filter('High Protein');
  const lowCalorie = filter('Low Calorie');
  assert.equal(passesNutrientFilter(food({ protein: 16 }), highProtein), true);
  assert.equal(passesNutrientFilter(food({ protein: 15 }), highProtein), false);
  assert.equal(passesNutrientFilter(food({ calories: 299 }), lowCalorie), true);
  assert.equal(passesNutrientFilter(food({ calories: 300 }), lowCalorie), false);
  assert.equal(passesNutrientFilter(food({ calories: 0 }), lowCalorie), true);
});

test('an unknown operator is rejected', () => {
  assert.throws(() => passesNutrientFilter(food({ protein: 5 }), { field: 'protein', op: 'eq', value: 5 }));
});

// ── Presets (criterion 51) ───────────────────────────────────
test('preset keys and labels', () => {
  assert.deepEqual(
    N.HEALTH_GOAL_PRESETS.map((p) => ({ ...p })),
    [
      { key: 'diabetic', label: 'Sugar and fiber filter' },
      { key: 'heart', label: 'Sodium and fat filter' },
      { key: 'weight', label: 'Calorie filter' },
      { key: 'muscle', label: 'Protein filter' },
      { key: 'kidney', label: 'Sodium and protein filter' },
      { key: 'cholesterol', label: 'Fat filter' },
    ],
  );
  assert.deepEqual([...N.HEALTH_GOAL_KEYS], ['diabetic', 'heart', 'weight', 'muscle', 'kidney', 'cholesterol']);
  assert.deepEqual([...N.NUTRITION_FIELDS], ['calories', 'protein', 'fat', 'carbohydrates', 'fiber', 'sugar', 'sodium']);
});

// ── Fixed texts (criteria 29, 41, 46, 48, 51) ────────────────
test('fixed texts equal the blueprint', () => {
  assert.equal(
    N.DISCLAIMER,
    'Exploratory filters for food discovery. Not medical advice and not validated for any medical condition. Allergen information is incomplete and can depend on preparation; always check labels or ask the preparer.',
  );
  assert.equal(
    N.NUTRITION_BASIS_NOTICE,
    'Nutrition values were entered from source portions that differ between foods and have no recorded measurement basis; do not compare them as equivalent amounts.',
  );
  assert.equal(N.NUTRITION_INCOMPLETE_TEXT, 'Some nutrition values for this food are not available.');
  assert.equal(N.NOT_AVAILABLE_LABEL, 'Not available');
});

const allTexts = () => [
  ...Object.values(N.NUTRITION_FIXED_TEXTS),
  N.NOT_AVAILABLE_LABEL,
  ...N.HEALTH_GOAL_PRESETS.map((p) => p.label),
  ...N.SEARCH_NUTRIENT_FILTERS.map((f) => f.label),
];

test('no medical, suitability, comparative or absence wording', () => {
  const caseInsensitive = [
    'medically validated', 'medical validated', 'saturated', 'suitable for', 'safe for',
    'prescription', 'recommended for', 'lower than', 'higher than', 'better', 'healthier',
    'best value', 'winner', 'allergen-free', 'free of allergens', 'free from allergens',
    'no allergens', 'no known allergens', 'no allergies', 'safe to eat', 'contains no',
    'per portion', 'standardised', '1 portion',
  ];
  for (const text of allTexts()) {
    const lowered = text.toLowerCase();
    for (const phrase of caseInsensitive) assert.ok(!lowered.includes(phrase), `${phrase}: ${text}`);
    assert.doesNotMatch(text, /\bGI\b/);
    assert.doesNotMatch(text, /\bsafe/i);
  }
});

test('no nutrition text mentions cooking or heating', () => {
  for (const text of allTexts()) assert.doesNotMatch(text, /\b(cook|heat)/i);
});
