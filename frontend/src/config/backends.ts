/**
 * Backend Configuration
 *
 * RENDER_API_BASE: Used for main API operations (login, signup, profile, community, etc.)
 * VERCEL_API_BASE: Used specifically for password reset operations
 *
 * For local development, both point to http://127.0.0.1:8000
 */

export const RENDER_API_BASE = import.meta.env.VITE_RENDER_API_BASE || 'http://127.0.0.1:8000';
export const VERCEL_API_BASE = import.meta.env.VITE_VERCEL_API_BASE || 'http://127.0.0.1:8000';

/**
 * Ensure URLs don't have trailing slashes for consistency
 */
export const API_BASE = RENDER_API_BASE.replace(/\/$/, '');
export const PASSWORD_RESET_API_BASE = VERCEL_API_BASE.replace(/\/$/, '');

export const BACKENDS = {
  main: API_BASE,
  passwordReset: PASSWORD_RESET_API_BASE
} as const;
