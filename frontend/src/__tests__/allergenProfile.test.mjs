// Run with: node --test src/__tests__/allergenProfile.test.mjs  (from frontend/)
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

import {
  initialProfile,
  isProfileConfigured,
  profileReducer,
  profileRequestFields,
  ProfileNotConfiguredError,
  PROFILE_NONE_CONFIRMED,
  PROFILE_RESTRICTIONS,
  PROFILE_UNCONFIGURED,
} from '../utils/allergenProfile.js';
import { buildAlternativesRequest, getAlternatives } from '../utils/api.js';

const CODES = [
  'milk', 'eggs', 'peanuts', 'tree_nuts', 'fish', 'shellfish',
  'soy', 'wheat', 'gluten', 'sesame', 'sulfites',
];
const source = (relative) => readFileSync(new URL(relative, import.meta.url), 'utf8');
const run = (actions, state = initialProfile) => actions.reduce(profileReducer, state);

function assertValidState(state) {
  assert.ok([PROFILE_UNCONFIGURED, PROFILE_RESTRICTIONS, PROFILE_NONE_CONFIRMED].includes(state.status));
  if (state.status === PROFILE_RESTRICTIONS) assert.ok(state.avoid.length > 0);
  else assert.deepEqual([...state.avoid], []);
}

// ── Reducer (criteria 8, 10, 11) ─────────────────────────────
test('the initial state is unconfigured', () => {
  assert.deepEqual({ ...initialProfile, avoid: [...initialProfile.avoid] }, { status: 'unconfigured', avoid: [] });
  assert.equal(isProfileConfigured(initialProfile), false);
});

test('selecting codes gives restrictions in canonical order', () => {
  const state = run([{ type: 'toggle', code: 'sesame' }, { type: 'toggle', code: 'milk' }]);
  assert.equal(state.status, PROFILE_RESTRICTIONS);
  assert.deepEqual([...state.avoid], ['milk', 'sesame']);
  assert.equal(isProfileConfigured(state), true);
});

test('removing the last code returns to unconfigured, never none_confirmed', () => {
  const state = run([{ type: 'toggle', code: 'milk' }, { type: 'toggle', code: 'milk' }]);
  assert.equal(state.status, PROFILE_UNCONFIGURED);
  const afterNone = run([{ type: 'confirm_none' }, { type: 'toggle', code: 'soy' }, { type: 'toggle', code: 'soy' }]);
  assert.equal(afterNone.status, PROFILE_UNCONFIGURED);
  assert.equal(run([{ type: 'toggle', code: 'soy' }, { type: 'set', codes: [] }]).status, PROFILE_UNCONFIGURED);
});

test('none_confirmed is reachable only through confirm_none', () => {
  assert.equal(run([{ type: 'confirm_none' }]).status, PROFILE_NONE_CONFIRMED);
  assert.deepEqual([...run([{ type: 'confirm_none' }]).avoid], []);
  // Completing a selection with nothing chosen leaves the profile unconfigured.
  assert.equal(run([{ type: 'set', codes: [] }]).status, PROFILE_UNCONFIGURED);
  // Choosing a code after confirming none moves to restrictions.
  const state = run([{ type: 'confirm_none' }, { type: 'toggle', code: 'eggs' }]);
  assert.equal(state.status, PROFILE_RESTRICTIONS);
  assert.deepEqual([...state.avoid], ['eggs']);
});

test('set replaces the selection, de-duplicated and in canonical order', () => {
  const state = run([{ type: 'toggle', code: 'milk' }, { type: 'set', codes: ['sulfites', 'eggs', 'eggs'] }]);
  assert.deepEqual([...state.avoid], ['eggs', 'sulfites']);
  assert.equal(run([{ type: 'set', codes: CODES }]).avoid.length, 11);
});

test('reset returns to unconfigured', () => {
  assert.equal(run([{ type: 'toggle', code: 'fish' }, { type: 'reset' }]).status, PROFILE_UNCONFIGURED);
  assert.equal(run([{ type: 'confirm_none' }, { type: 'reset' }]).status, PROFILE_UNCONFIGURED);
});

test('unknown codes, aliases and actions are rejected', () => {
  for (const code of ['dairy', 'tree-nuts', 'nuts', 'lactose', '', undefined]) {
    assert.throws(() => run([{ type: 'toggle', code }]), /Unknown allergen code/);
    assert.throws(() => run([{ type: 'set', codes: ['milk', code] }]), /Unknown allergen code/);
  }
  assert.throws(() => run([{ type: 'set', codes: 'milk' }]));
  assert.throws(() => run([{ type: 'select_all' }]), /Unknown allergen profile action/);
  assert.throws(() => profileReducer(initialProfile, undefined));
});

test('no sequence of actions produces an invalid state', () => {
  let seed = 12345;
  const next = () => (seed = (seed * 1103515245 + 12345) % 2 ** 31) / 2 ** 31;
  const pick = (items) => items[Math.floor(next() * items.length)];
  for (let run_ = 0; run_ < 200; run_ += 1) {
    let state = initialProfile;
    for (let step = 0; step < 15; step += 1) {
      const kind = pick(['toggle', 'toggle', 'toggle', 'set', 'confirm_none', 'reset']);
      const action = kind === 'toggle'
        ? { type: 'toggle', code: pick(CODES) }
        : kind === 'set'
          ? { type: 'set', codes: CODES.filter(() => next() < 0.2) }
          : { type: kind };
      state = profileReducer(state, action);
      assertValidState(state);
      if (kind !== 'confirm_none') assert.notEqual(state.status, PROFILE_NONE_CONFIRMED);
    }
  }
});

test('states are not mutated', () => {
  const state = run([{ type: 'toggle', code: 'milk' }]);
  const next = profileReducer(state, { type: 'toggle', code: 'eggs' });
  assert.deepEqual([...state.avoid], ['milk']);
  assert.deepEqual([...next.avoid], ['milk', 'eggs']);
  assert.ok(Object.isFrozen(state) && Object.isFrozen(state.avoid));
});

// ── Nothing persists (criterion 9) ───────────────────────────
const PERSISTENCE = /localStorage|sessionStorage|indexedDB|document\.cookie|cookieStore|history\.(push|replace)State|location\.state|URLSearchParams|window\.location|useNavigate|navigate\(/;

test('profile modules never touch storage, URL, history state or cookies', () => {
  for (const file of ['../utils/allergenProfile.js', '../context/AllergenProfileContext.jsx', '../utils/api.js']) {
    assert.doesNotMatch(source(file), PERSISTENCE, file);
  }
});

test('the context starts from the initial profile with no lazy initialiser', () => {
  const context = source('../context/AllergenProfileContext.jsx');
  assert.match(context, /useReducer\(profileReducer, initialProfile\)/);
  assert.doesNotMatch(context, /useReducer\([^)]*,[^)]*,[^)]*\)/);
});

test('the app is wrapped in the profile provider', () => {
  const app = source('../App.jsx');
  assert.match(app, /<AllergenProfileProvider>/);
  assert.match(app, /<\/AllergenProfileProvider>/);
});

// ── API helper (criteria 12, 56) ─────────────────────────────
test('request fields for configured profiles', () => {
  assert.deepEqual(profileRequestFields(run([{ type: 'confirm_none' }])), {
    allergen_profile_status: 'none_confirmed', avoid: [],
  });
  assert.deepEqual(profileRequestFields(run([{ type: 'set', codes: ['soy', 'milk'] }])), {
    allergen_profile_status: 'restrictions', avoid: ['milk', 'soy'],
  });
});

test('no request can be built for an unconfigured or inconsistent profile', () => {
  const bad = [
    initialProfile,
    { status: 'restrictions', avoid: [] },
    { status: 'none_confirmed', avoid: ['milk'] },
    { status: 'unconfigured', avoid: ['milk'] },
    { status: 'restrictions', avoid: ['dairy'] },
    null,
    undefined,
  ];
  for (const profile of bad) {
    assert.throws(() => buildAlternativesRequest(1, profile, []));
  }
  assert.throws(() => buildAlternativesRequest(1, initialProfile, []), ProfileNotConfiguredError);
});

test('profile and goals go in the POST body only', () => {
  const profile = run([{ type: 'set', codes: ['sesame', 'milk'] }]);
  const { path, options } = buildAlternativesRequest(42, profile, ['diabetic', 'heart'], 5);
  assert.equal(path, '/foods/42/alternatives');
  assert.doesNotMatch(path, /[?#]/);
  assert.equal(options.method, 'POST');
  assert.deepEqual(options.headers, { 'Content-Type': 'application/json' });
  assert.deepEqual(JSON.parse(options.body), {
    allergen_profile_status: 'restrictions',
    avoid: ['milk', 'sesame'],
    health_goals: ['diabetic', 'heart'],
    limit: 5,
  });
  for (const value of ['sesame', 'milk', 'diabetic', 'heart', 'restrictions']) {
    assert.ok(!path.includes(value), value);
  }
});

test('limit is sent only when given', () => {
  const { options } = buildAlternativesRequest(1, run([{ type: 'confirm_none' }]));
  assert.deepEqual(JSON.parse(options.body), {
    allergen_profile_status: 'none_confirmed', avoid: [], health_goals: [],
  });
});

test('an invalid food id is rejected before any request is built', () => {
  const profile = run([{ type: 'confirm_none' }]);
  for (const id of [0, -1, 1.5, '3', null]) {
    assert.throws(() => buildAlternativesRequest(id, profile), /positive integer/);
  }
});

test('getAlternatives refuses to send while unconfigured and sends one POST otherwise', async (t) => {
  const calls = [];
  const original = globalThis.fetch;
  globalThis.fetch = async (url, init) => {
    calls.push({ url, init });
    return new Response(JSON.stringify({ ok: true }), { status: 200, headers: { 'Content-Type': 'application/json' } });
  };
  t.after(() => { globalThis.fetch = original; });

  await assert.rejects(getAlternatives(7, initialProfile, ['diabetic']), ProfileNotConfiguredError);
  assert.equal(calls.length, 0);

  const result = await getAlternatives(7, run([{ type: 'toggle', code: 'eggs' }]), ['muscle']);
  assert.deepEqual(result, { ok: true });
  assert.equal(calls.length, 1);
  assert.equal(calls[0].url, '/api/foods/7/alternatives');
  assert.equal(calls[0].init.method, 'POST');
  assert.deepEqual(JSON.parse(calls[0].init.body), {
    allergen_profile_status: 'restrictions', avoid: ['eggs'], health_goals: ['muscle'],
  });
});

test('API errors carry the status and error_code', async (t) => {
  const original = globalThis.fetch;
  t.after(() => { globalThis.fetch = original; });

  globalThis.fetch = async () => new Response(
    JSON.stringify({ detail: 'Food not found.', error_code: 'FOOD_NOT_FOUND' }), { status: 404 },
  );
  await assert.rejects(
    getAlternatives(7, run([{ type: 'confirm_none' }])),
    (err) => err.status === 404 && err.code === 'FOOD_NOT_FOUND' && err.message === 'Food not found.',
  );

  globalThis.fetch = async () => new Response(
    JSON.stringify({ detail: [{ type: 'extra_forbidden', loc: ['body', 'x'], msg: 'Extra inputs are not permitted' }] }),
    { status: 422 },
  );
  await assert.rejects(
    getAlternatives(7, run([{ type: 'confirm_none' }])),
    (err) => err.status === 422 && err.code === null && err.message === 'API error: 422',
  );
});
