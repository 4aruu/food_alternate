/**
 * Removes localStorage keys written by the old mock login/registration flow.
 *
 * - "registrationFormData" held the whole registration form, including the
 *   password and confirmPassword fields in plain text.
 * - "nutriswap_user" held a mock session (email and name).
 *
 * Neither key is written any more. This runs on every app load and is
 * idempotent, so it deletes the data the first time an existing visitor
 * returns. Other keys (e.g. "user_history") are left alone.
 */
export const LEGACY_STORAGE_KEYS = ['registrationFormData', 'nutriswap_user'];

export function clearLegacyStorage(storage) {
  const removed = [];
  if (!storage) return removed;

  for (const key of LEGACY_STORAGE_KEYS) {
    try {
      if (storage.getItem(key) !== null) {
        storage.removeItem(key);
        removed.push(key);
      }
    } catch {
      // Storage blocked or unavailable: nothing to clean up.
    }
  }
  return removed;
}
