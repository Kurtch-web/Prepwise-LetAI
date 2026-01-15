/**
 * Backend Configuration
 *
 * VITE_API_BASE: Points to the FastAPI backend (local or deployed)
 *
 * For local development: http://127.0.0.1:8000
 * For Vercel deployment: Set VITE_API_BASE env var to your Vercel backend URL
 *   Example: https://your-backend.vercel.app
 */

export const API_BASE = (import.meta.env.VITE_API_BASE || 'http://127.0.0.1:8000').replace(/\/$/, '');

export const BACKENDS = {
  main: API_BASE,
  passwordReset: API_BASE
} as const;
