/**
 * Backend Configuration
 *
 * VITE_API_BASE: Points to the FastAPI backend (local or deployed)
 *
 * For local development: http://127.0.0.1:8000
 * For Vercel deployment: https://prepwise-let-ai-e789.vercel.app
 */

export const API_BASE = (import.meta.env.VITE_API_BASE || 'https://prepwise-let-ai-e789.vercel.app').replace(/\/$/, '');

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
