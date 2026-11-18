/**
 * Centralized API client — single source of truth for API_BASE,
 * timeout handling, and error normalization.
 *
 * Usage:
 *   import { apiFetch, API_BASE } from '../utils/api';
 *   const foods = await apiFetch('/foods');
 *   const result = await apiFetch('/foods/search?q=rice');
 */

import { profileRequestFields } from './allergenProfile.js';

// `import.meta.env` is provided by Vite; it is undefined when this module is
// loaded by Node's test runner, hence the optional chaining.
export const API_BASE = import.meta.env?.VITE_API_BASE_URL || '/api';

/**
 * Shared, deduplicated fetch of the full foods list.
 *
 * Header + every page used to each fetch /foods/ independently, so a
 * single page load hit the API 2-4 times (and burned rate-limit quota
 * on the backend). This caches the in-flight/resolved promise at module
 * level so any number of components share ONE request per session.
 * The dataset is seeded/static, so session-lifetime caching is safe.
 * On failure the promise is dropped so the next caller can retry.
 */
let foodsPromise = null;
export function getFoods() {
  if (!foodsPromise) {
    // 15 s (not the 10 s default): Render Free cold starts are slow, and
    // this is the first request most pages make.
    foodsPromise = apiFetch('/foods/', { timeout: 15000 }).catch((err) => {
      foodsPromise = null; // allow retry on next call
      throw err;
    });
  }
  return foodsPromise;
}

/**
 * Fetch wrapper with timeout and consistent error handling.
 *
 * @param {string} path    - API path (e.g. '/foods', '/health')
 * @param {object} options - fetch options + optional `timeout` (ms, default 10000)
 * @returns {Promise<any>} parsed JSON response
 * @throws {Error} on network error, timeout, or non-2xx status
 */
export async function apiFetch(path, options = {}) {
  const { timeout = 10000, ...fetchOptions } = options;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(`${API_BASE}${path}`, {
      ...fetchOptions,
      signal: controller.signal,
    });

    if (!response.ok) {
      const body = await response.json().catch(() => ({}));
      // `detail` is a string for application errors and a list for
      // FastAPI's standard 422 validation body.
      const message = typeof body.detail === 'string' ? body.detail : null;
      const error = new Error(message || `API error: ${response.status}`);
      error.status = response.status;
      error.code = typeof body.error_code === 'string' ? body.error_code : null;
      throw error;
    }

    return await response.json();
  } catch (err) {
    if (err.name === 'AbortError') {
      const error = new Error('Request timed out');
      error.status = 408;
      throw error;
    }
    throw err;
  } finally {
    clearTimeout(timeoutId);
  }
}

/**
 * Build the alternatives request for one food.
 *
 * The allergen profile and the health goals go in the POST body only, never
 * in the URL. Throws ProfileNotConfiguredError while the profile is
 * unconfigured, so no request can be sent before the user has chosen.
 *
 * @param {number} foodId      - positive integer id of the original food
 * @param {object} profile     - allergen profile ({ status, avoid })
 * @param {string[]} healthGoals - preset keys
 * @param {number} [limit]     - optional result limit (server default 10)
 * @returns {{ path: string, options: object }}
 */
export function buildAlternativesRequest(foodId, profile, healthGoals = [], limit) {
  const fields = profileRequestFields(profile);
  if (!Number.isInteger(foodId) || foodId <= 0) {
    throw new Error('Food ID must be a positive integer.');
  }
  if (!Array.isArray(healthGoals)) {
    throw new Error('healthGoals must be an array');
  }
  const body = { ...fields, health_goals: [...healthGoals] };
  if (limit !== undefined) body.limit = limit;
  return {
    path: `/foods/${foodId}/alternatives`,
    options: {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    },
  };
}

/** POST /foods/{id}/alternatives. Rejects without sending while the profile is unconfigured. */
export async function getAlternatives(foodId, profile, healthGoals = [], limit) {
  const { path, options } = buildAlternativesRequest(foodId, profile, healthGoals, limit);
  return apiFetch(path, options);
}
