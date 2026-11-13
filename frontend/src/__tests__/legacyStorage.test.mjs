// Run with: node --test src/__tests__/legacyStorage.test.mjs  (from frontend/)
import { test } from 'node:test';
import assert from 'node:assert/strict';

import { clearLegacyStorage, LEGACY_STORAGE_KEYS } from '../utils/legacyStorage.js';

function fakeStorage(initial = {}) {
  const data = new Map(Object.entries(initial));
  return {
    getItem: (k) => (data.has(k) ? data.get(k) : null),
    removeItem: (k) => data.delete(k),
    keys: () => [...data.keys()].sort(),
  };
}

test('removes the stale password/session keys', () => {
  const storage = fakeStorage({
    registrationFormData: JSON.stringify({ email: 'a@b.c', password: 'hunter2', confirmPassword: 'hunter2' }),
    nutriswap_user: JSON.stringify({ email: 'a@b.c', name: 'a' }),
  });

  const removed = clearLegacyStorage(storage);

  assert.deepEqual(removed.sort(), [...LEGACY_STORAGE_KEYS].sort());
  assert.deepEqual(storage.keys(), []);
});

test('keeps unrelated keys such as search history', () => {
  const storage = fakeStorage({ user_history: '[]', registrationFormData: '{}' });

  clearLegacyStorage(storage);

  assert.deepEqual(storage.keys(), ['user_history']);
});

test('is a no-op when nothing stale is stored', () => {
  const storage = fakeStorage({ user_history: '[]' });
  assert.deepEqual(clearLegacyStorage(storage), []);
  assert.deepEqual(storage.keys(), ['user_history']);
});

test('tolerates missing or throwing storage', () => {
  assert.deepEqual(clearLegacyStorage(null), []);
  const throwing = {
    getItem() { throw new Error('SecurityError'); },
    removeItem() { throw new Error('SecurityError'); },
  };
  assert.deepEqual(clearLegacyStorage(throwing), []);
});
