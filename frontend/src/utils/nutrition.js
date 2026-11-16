/**
 * Nutrition value helpers. A missing or invalid stored value is shown as
 * "Not available" and never counts as 0.
 */
import { NOT_AVAILABLE_LABEL } from '../constants/nutritionFilters.js';

/** A stored value is valid when it is a finite, non-negative number. */
export function isValidNutrientValue(value) {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0;
}

/** The value of one field of a food, or null when it is missing or invalid. */
export function nutrientValue(food, field) {
  const value = food?.nutrition?.[field];
  return isValidNutrientValue(value) ? value : null;
}

/**
 * Text for one value: the number followed by `unit` (passed as written, e.g.
 * 'g' or ' kcal'), or "Not available".
 */
export function formatNutrient(value, unit = '') {
  return isValidNutrientValue(value) ? `${value}${unit}` : NOT_AVAILABLE_LABEL;
}

/** Text for one field of a food. */
export function formatFoodNutrient(food, field, unit = '') {
  return formatNutrient(food?.nutrition?.[field], unit);
}

/**
 * Whether a food passes one nutrient filter ({ field, op, value }).
 * A missing or invalid value never passes.
 */
export function passesNutrientFilter(food, filter) {
  const value = nutrientValue(food, filter.field);
  if (value === null) return false;
  if (filter.op === 'lt') return value < filter.value;
  if (filter.op === 'gt') return value > filter.value;
  throw new Error(`Unsupported nutrient filter operator: ${filter.op}`);
}

/**
 * Width of a value bar as a percentage of `max`, clamped to 0..100,
 * or null when the value is missing or invalid (draw no bar).
 */
export function nutrientBarPercent(value, max) {
  if (!isValidNutrientValue(value) || !(max > 0)) return null;
  return Math.min((value / max) * 100, 100);
}
