/**
 * Display helpers for allergen information. They describe what the data
 * records; they never decide eligibility, and `unknown` is never shown as
 * absence.
 */
import {
  ALLERGEN_CODES,
  ALLERGEN_LABELS,
  LEGACY_COLUMN_FANOUT,
  NONE_IDENTIFIED_LABEL,
} from '../constants/allergens.js';

export const DISPLAY_IDENTIFIED = 'identified';
export const DISPLAY_NONE_IDENTIFIED = 'none_identified';
export const DISPLAY_INCOMPLETE = 'incomplete';

const FLAGGED = new Set(['present', 'possible']);

const isObject = (value) => value !== null && typeof value === 'object' && !Array.isArray(value);

/**
 * State of an `allergen_status` map from the alternatives API.
 *
 * - identified: any code is present or possible in either dimension;
 * - none_identified: all 11 codes are absent in both dimensions;
 * - incomplete: every other case, including missing codes and unknown values.
 *
 * `flaggedCodes` lists the identified codes in canonical order.
 */
export function allergenDisplay(statusMap) {
  const map = isObject(statusMap) ? statusMap : {};
  const flaggedCodes = ALLERGEN_CODES.filter((code) => {
    const entry = map[code];
    return isObject(entry) && (FLAGGED.has(entry.ingredient) || FLAGGED.has(entry.cross_contact));
  });
  if (flaggedCodes.length > 0) {
    return { state: DISPLAY_IDENTIFIED, flaggedCodes };
  }
  const allAbsent = ALLERGEN_CODES.every((code) => {
    const entry = map[code];
    return isObject(entry) && entry.ingredient === 'absent' && entry.cross_contact === 'absent';
  });
  return { state: allAbsent ? DISPLAY_NONE_IDENTIFIED : DISPLAY_INCOMPLETE, flaggedCodes: [] };
}

/** The UI label of a display state, or null when the state has no label of its own. */
export function displayStateLabel(state) {
  return state === DISPLAY_NONE_IDENTIFIED ? NONE_IDENTIFIED_LABEL : null;
}

/**
 * Display rule for the legacy `allergens` booleans on GET /foods,
 * /foods/search and /foods/{id}.
 *
 * Only a value of exactly `true` is shown, as a possible allergen. `false`,
 * `null`, a missing key or an empty object all mean unknown and produce no
 * entry. The state is never `none_identified`.
 *
 * `flaggedCodes` are the mapped canonical codes in canonical order, with labels.
 */
export function legacyAllergenDisplay(allergens) {
  const flags = isObject(allergens) ? allergens : {};
  const codes = new Set();
  for (const [column, mapped] of Object.entries(LEGACY_COLUMN_FANOUT)) {
    if (flags[column] === true) {
      mapped.forEach((code) => codes.add(code));
    }
  }
  const flaggedCodes = ALLERGEN_CODES.filter((code) => codes.has(code));
  return {
    state: flaggedCodes.length > 0 ? DISPLAY_IDENTIFIED : DISPLAY_INCOMPLETE,
    flaggedCodes,
    labels: flaggedCodes.map((code) => ALLERGEN_LABELS[code]),
  };
}
