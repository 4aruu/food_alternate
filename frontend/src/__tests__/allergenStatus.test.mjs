// Run with: node --test src/__tests__/allergenStatus.test.mjs  (from frontend/)
import { test } from 'node:test';
import assert from 'node:assert/strict';

import * as C from '../constants/allergens.js';
import {
  allergenDisplay,
  displayStateLabel,
  legacyAllergenDisplay,
  DISPLAY_IDENTIFIED,
  DISPLAY_INCOMPLETE,
  DISPLAY_NONE_IDENTIFIED,
} from '../utils/allergenStatus.js';

const CODES = [
  'milk', 'eggs', 'peanuts', 'tree_nuts', 'fish', 'shellfish',
  'soy', 'wheat', 'gluten', 'sesame', 'sulfites',
];
const STATUSES = ['present', 'possible', 'absent', 'unknown'];

const entry = (ingredient, crossContact) => ({
  ingredient,
  ingredient_provenance: 'legacy_default_false',
  cross_contact: crossContact,
  cross_contact_provenance: 'no_source',
});
// An override replaces a code's entry as given, including null.
const statusMap = (pair, overrides = {}) =>
  Object.fromEntries(CODES.map((code) => [code, code in overrides ? overrides[code] : entry(...pair)]));

// ── Vocabulary (criteria 16, 61) ─────────────────────────────
test('canonical codes, labels and aliases', () => {
  assert.deepEqual([...C.ALLERGEN_CODES], CODES);
  assert.deepEqual(Object.keys(C.ALLERGEN_LABELS), CODES);
  assert.deepEqual(Object.keys(C.ALLERGEN_ALIASES), CODES);
  assert.deepEqual(
    Object.fromEntries(Object.entries(C.ALLERGEN_ALIASES).map(([k, v]) => [k, [...v]])),
    {
      milk: ['dairy'], eggs: ['egg'], peanuts: ['peanut'], tree_nuts: ['tree-nuts', 'tree nuts'],
      fish: [], shellfish: [], soy: ['soya'], wheat: [], gluten: [], sesame: [], sulfites: ['sulphites'],
    },
  );
  assert.deepEqual(
    Object.fromEntries(Object.entries(C.GROUP_ALIASES).map(([k, v]) => [k, [...v]])),
    { nuts: ['peanuts', 'tree_nuts'], seafood: ['fish', 'shellfish'] },
  );
  assert.deepEqual([...C.ALLERGEN_STATUSES], STATUSES);
});

test('legacy column fan-out equals the documented backend fan-out', () => {
  const fanOut = Object.fromEntries(Object.entries(C.LEGACY_COLUMN_FANOUT).map(([k, v]) => [k, [...v]]));
  assert.deepEqual(fanOut, {
    dairy: ['milk'],
    nuts: ['peanuts', 'tree_nuts'],
    gluten: ['gluten'],
    eggs: ['eggs'],
    soy: ['soy'],
    shellfish: ['fish', 'shellfish'],
  });
  const fed = Object.values(fanOut).flat();
  assert.equal(new Set(fed).size, fed.length);
  assert.deepEqual(CODES.filter((code) => !fed.includes(code)), ['wheat', 'sesame', 'sulfites']);
});

// ── Display helper (criterion 59) ────────────────────────────
test('identified when any code is present or possible in either dimension', () => {
  for (const code of CODES) {
    for (const [ingredient, crossContact] of [
      ['present', 'absent'], ['possible', 'absent'], ['absent', 'present'], ['absent', 'possible'],
      ['possible', 'unknown'], ['unknown', 'present'],
    ]) {
      const result = allergenDisplay(statusMap(['absent', 'absent'], { [code]: entry(ingredient, crossContact) }));
      assert.equal(result.state, DISPLAY_IDENTIFIED);
      assert.deepEqual(result.flaggedCodes, [code]);
    }
  }
});

test('flagged codes come back in canonical order', () => {
  const result = allergenDisplay(statusMap(['unknown', 'unknown'], {
    sulfites: entry('possible', 'unknown'), milk: entry('unknown', 'present'),
  }));
  assert.deepEqual(result, { state: DISPLAY_IDENTIFIED, flaggedCodes: ['milk', 'sulfites'] });
});

test('none_identified only when all 11 codes are absent in both dimensions', () => {
  assert.deepEqual(allergenDisplay(statusMap(['absent', 'absent'])), {
    state: DISPLAY_NONE_IDENTIFIED, flaggedCodes: [],
  });
});

test('incomplete for every other input', () => {
  const cases = [
    statusMap(['unknown', 'unknown']),
    statusMap(['absent', 'absent'], { sesame: entry('unknown', 'absent') }),
    statusMap(['absent', 'absent'], { sesame: entry('absent', 'unknown') }),
    Object.fromEntries(CODES.slice(0, 10).map((code) => [code, entry('absent', 'absent')])),
    statusMap(['absent', 'absent'], { milk: entry('none', 'absent') }),
    statusMap(['absent', 'absent'], { milk: null }),
    {}, null, undefined, [], 'absent',
  ];
  for (const input of cases) {
    assert.deepEqual(allergenDisplay(input), { state: DISPLAY_INCOMPLETE, flaggedCodes: [] });
  }
});

test('every single-code combination of the four statuses', () => {
  for (const ingredient of STATUSES) {
    for (const crossContact of STATUSES) {
      const { state } = allergenDisplay(statusMap(['absent', 'absent'], { milk: entry(ingredient, crossContact) }));
      const flagged = ['present', 'possible'].includes(ingredient) || ['present', 'possible'].includes(crossContact);
      const expected = flagged
        ? DISPLAY_IDENTIFIED
        : ingredient === 'absent' && crossContact === 'absent' ? DISPLAY_NONE_IDENTIFIED : DISPLAY_INCOMPLETE;
      assert.equal(state, expected, `${ingredient}/${crossContact}`);
    }
  }
});

test('only none_identified has a label of its own', () => {
  assert.equal(displayStateLabel(DISPLAY_NONE_IDENTIFIED), 'None identified in the available data');
  assert.equal(displayStateLabel(DISPLAY_IDENTIFIED), null);
  assert.equal(displayStateLabel(DISPLAY_INCOMPLETE), null);
  for (const state of [DISPLAY_IDENTIFIED, DISPLAY_NONE_IDENTIFIED, DISPLAY_INCOMPLETE]) {
    assert.doesNotMatch(state, /safe/i);
  }
});

// ── Legacy booleans (criteria 24, 58) ────────────────────────
test('legacy: any true flag is identified, with mapped codes and labels', () => {
  assert.deepEqual(
    legacyAllergenDisplay({ dairy: false, nuts: true, gluten: false, soy: false, eggs: false, shellfish: true }),
    {
      state: DISPLAY_IDENTIFIED,
      flaggedCodes: ['peanuts', 'tree_nuts', 'fish', 'shellfish'],
      labels: ['Peanuts', 'Tree nuts', 'Fish', 'Shellfish'],
    },
  );
  assert.deepEqual(legacyAllergenDisplay({ dairy: true }).flaggedCodes, ['milk']);
  assert.deepEqual(legacyAllergenDisplay({ gluten: true }).flaggedCodes, ['gluten']); // never wheat
});

test('legacy: false, null, missing and empty input are incomplete, never none_identified', () => {
  const cases = [
    { dairy: false, nuts: false, gluten: false, soy: false, eggs: false, shellfish: false },
    { dairy: null, nuts: null, gluten: null, soy: null, eggs: null, shellfish: null },
    { dairy: false },
    {},
    null,
    undefined,
    [],
    { dairy: 'true', nuts: 1 },
    { sesame: true }, // not a legacy column
  ];
  for (const input of cases) {
    const result = legacyAllergenDisplay(input);
    assert.deepEqual(result, { state: DISPLAY_INCOMPLETE, flaggedCodes: [], labels: [] });
    assert.notEqual(result.state, DISPLAY_NONE_IDENTIFIED);
  }
});

test('legacy: negative flags produce no entry of their own', () => {
  const result = legacyAllergenDisplay({ dairy: true, nuts: false, eggs: null });
  assert.deepEqual(result.flaggedCodes, ['milk']);
});

// ── Fixed texts (criteria 28, 29, 37, 40, 41) ────────────────
test('fixed texts equal the blueprint', () => {
  assert.equal(
    C.PREPARATION_WARNING,
    'Allergen exposure can depend on the ingredients used, sauces, coatings, shared equipment and the environment where food is prepared. NutriSwap cannot verify these details with its current data. Cooking or heating cannot be relied on to remove allergens. Check with whoever prepares the food, or read the label.',
  );
  assert.equal(C.NONE_CONFIRMED_LABEL, 'Continue without allergen filtering');
  assert.equal(
    C.NONE_CONFIRMED_HELPER,
    "NutriSwap will show alternatives without filtering them for allergens. Each food's allergen information is still shown, and it is incomplete.",
  );
  assert.equal(C.NONE_IDENTIFIED_LABEL, 'None identified in the available data');
  assert.equal(C.LEGACY_FLAG_LABEL, 'Possible (keyword-based, not confirmed)');
  assert.equal(
    C.LEGACY_UNVERIFIED_NOTICE,
    'Allergen information for this food is not verified. A missing flag does not mean the allergen is absent.',
  );
  assert.deepEqual({ ...C.OUTCOME_TEXTS }, {
    no_verified_alternatives: "NutriSwap can't currently verify any alternative that meets your allergen restrictions, because its ingredient and cross-contact data is incomplete. No alternatives are shown rather than unverified ones.",
    no_matching_alternatives: "No alternatives in this food's category group match your selected exploratory filters.",
    no_candidates: "There are no other foods in this food's category group.",
    alternatives_found: '{n} alternatives found.',
  });
});

const ABSENCE_PHRASES = [
  'allergen-free', 'free of allergens', 'free from allergens', 'no allergens',
  'no known allergens', 'no allergies', 'safe for you', 'safe to eat', 'contains no',
];

test('no text claims absence of allergens, no allergies or safety', () => {
  const texts = [...Object.values(C.ALLERGEN_FIXED_TEXTS), ...Object.values(C.ALLERGEN_LABELS)];
  for (const text of texts) {
    const lowered = text.toLowerCase();
    for (const phrase of ABSENCE_PHRASES) assert.ok(!lowered.includes(phrase), `${phrase}: ${text}`);
    assert.doesNotMatch(text, /\bsafe/i);
    assert.doesNotMatch(text, /may_contain/);
  }
});

test('only the preparation warning mentions cooking or heating', () => {
  assert.match(C.PREPARATION_WARNING, /\b(cook|heat)/i);
  for (const [key, text] of Object.entries(C.ALLERGEN_FIXED_TEXTS)) {
    if (key !== 'preparation_warning') assert.doesNotMatch(text, /\b(cook|heat)/i, key);
  }
});
