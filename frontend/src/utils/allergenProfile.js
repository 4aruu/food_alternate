/**
 * The user's allergen profile for this visit.
 *
 * Exactly three states:
 * - unconfigured: nothing chosen yet (the initial state);
 * - restrictions: at least one allergen code to avoid;
 * - none_confirmed: the user chose to continue without allergen filtering.
 *
 * The profile lives in memory only. Nothing here reads or writes any storage,
 * URL, history state or cookie.
 */
import { ALLERGEN_CODES } from '../constants/allergens.js';

export const PROFILE_UNCONFIGURED = 'unconfigured';
export const PROFILE_RESTRICTIONS = 'restrictions';
export const PROFILE_NONE_CONFIRMED = 'none_confirmed';

export const initialProfile = Object.freeze({ status: PROFILE_UNCONFIGURED, avoid: Object.freeze([]) });

const CONFIRMED_NONE = Object.freeze({ status: PROFILE_NONE_CONFIRMED, avoid: Object.freeze([]) });

function assertCode(code) {
  if (!ALLERGEN_CODES.includes(code)) {
    throw new Error(`Unknown allergen code: ${String(code)}`);
  }
}

/** Profile for a set of codes: restrictions when non-empty, otherwise unconfigured. */
function fromCodes(codes) {
  const avoid = ALLERGEN_CODES.filter((code) => codes.includes(code));
  if (avoid.length === 0) return initialProfile;
  return Object.freeze({ status: PROFILE_RESTRICTIONS, avoid: Object.freeze(avoid) });
}

/**
 * Actions:
 * - { type: 'toggle', code }      add or remove one canonical code
 * - { type: 'set', codes }        replace the selection with these canonical codes
 * - { type: 'confirm_none' }      the "Continue without allergen filtering" action
 * - { type: 'reset' }             back to unconfigured
 *
 * Removing the last code returns to unconfigured, never to none_confirmed.
 * Unknown codes and unknown actions are rejected.
 */
export function profileReducer(state, action) {
  switch (action?.type) {
    case 'toggle': {
      assertCode(action.code);
      const current = state.status === PROFILE_RESTRICTIONS ? state.avoid : [];
      const next = current.includes(action.code)
        ? current.filter((code) => code !== action.code)
        : [...current, action.code];
      return fromCodes(next);
    }
    case 'set': {
      if (!Array.isArray(action.codes)) throw new Error('codes must be an array');
      action.codes.forEach(assertCode);
      return fromCodes(action.codes);
    }
    case 'confirm_none':
      return CONFIRMED_NONE;
    case 'reset':
      return initialProfile;
    default:
      throw new Error(`Unknown allergen profile action: ${String(action?.type)}`);
  }
}

export function isProfileConfigured(profile) {
  return (
    (profile?.status === PROFILE_RESTRICTIONS && profile.avoid.length > 0) ||
    (profile?.status === PROFILE_NONE_CONFIRMED && profile.avoid.length === 0)
  );
}

export class ProfileNotConfiguredError extends Error {
  constructor() {
    super('Choose the allergens to avoid, or continue without allergen filtering, first.');
    this.name = 'ProfileNotConfiguredError';
  }
}

/**
 * The profile fields of an alternatives request body. Throws
 * ProfileNotConfiguredError for an unconfigured or inconsistent profile, so
 * no request can be built without a choice.
 */
export function profileRequestFields(profile) {
  if (!isProfileConfigured(profile)) {
    throw new ProfileNotConfiguredError();
  }
  profile.avoid.forEach(assertCode);
  return { allergen_profile_status: profile.status, avoid: [...profile.avoid] };
}
