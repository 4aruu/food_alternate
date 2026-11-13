/**
 * Centralized API client — single source of truth for API_BASE,
 * timeout handling, and error normalization.
 *
 * Usage:
 *   import { apiFetch, API_BASE } from '../utils/api';
 *   const foods = await apiFetch('/foods');
 *   const result = await apiFetch('/foods/search?q=rice');
 */

export const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api';

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
    foodsPromise = apiFetch('/foods/').catch((err) => {
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
      const error = new Error(body.detail || `API error: ${response.status}`);
      error.status = response.status;
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
