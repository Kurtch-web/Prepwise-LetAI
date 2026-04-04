/**
 * Backend Configuration
 *
 * VITE_API_BASE: Points to the FastAPI backend (local or deployed)
 *
 * For local development: http://127.0.0.1:8000
 * For Vercel deployment: Set VITE_API_BASE environment variable to your backend URL
 *
 * Examples:
 * - Local: http://localhost:8000
 * - Production: https://your-backend-api.com
 */

// Determine the API base URL
let apiBase = import.meta.env.VITE_API_BASE;

if (!apiBase) {
  // In development, default to localhost
  if (import.meta.env.DEV) {
    apiBase = 'http://localhost:8000';
  } else {
    // In production on Vercel, you MUST set VITE_API_BASE environment variable
    console.error('[API Config] VITE_API_BASE is not set! API calls will fail. Please configure this environment variable in Vercel.');
    apiBase = '';
  }
}

export const API_BASE = apiBase.replace(/\/$/, '');

// Helper to check if API is properly configured
export const isApiConfigured = (): boolean => {
  return API_BASE.length > 0;
};

// Log configuration status for debugging
if (!isApiConfigured() && typeof window !== 'undefined') {
  console.warn(
    '[API Config] VITE_API_BASE is not set. ' +
    'For production (Vercel), please set VITE_API_BASE environment variable. ' +
    'API calls will fail without this configuration.'
  );
}

export const BACKENDS = {
  main: API_BASE
} as const;
