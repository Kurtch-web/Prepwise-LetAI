import { offlineStorage, OfflineFlashcard } from './offlineStorage';

export async function fetchWithOfflineFallback<T>(
  path: string,
  options: RequestInit = {},
  cacheKey?: string
): Promise<{ data: T; isOffline: boolean; fromCache: boolean }> {
  const API_BASE = import.meta.env.VITE_API_BASE || '/api';
  
  try {
    const response = await fetch(`${API_BASE}${path}`, {
      credentials: 'include',
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers ?? {})
      }
    });

    if (!response.ok) {
      const errorBody = await response.json().catch(() => ({}));
      const errorMessage = (errorBody as { detail?: string; message?: string }).detail ??
        (errorBody as { message?: string }).message ??
        response.statusText;
      throw new Error(errorMessage);
    }

    if (response.status === 204) {
      return { data: {} as T, isOffline: false, fromCache: false };
    }

    const data = await response.json() as T;
    
    if (cacheKey) {
      try {
        sessionStorage.setItem(`api_cache_${cacheKey}`, JSON.stringify(data));
      } catch (e) {
        console.warn('[API Cache] Failed to cache response:', e);
      }
    }
    
    return { data, isOffline: false, fromCache: false };
  } catch (error) {
    console.warn('[API Offline] Fetch failed, attempting offline fallback:', error);
    
    if (cacheKey) {
      try {
        const cached = sessionStorage.getItem(`api_cache_${cacheKey}`);
        if (cached) {
          const data = JSON.parse(cached) as T;
          return { data, isOffline: true, fromCache: true };
        }
      } catch (e) {
        console.warn('[API Cache] Failed to retrieve cache:', e);
      }
    }
    
    throw error;
  }
}

export async function getFlashcardsWithOfflineSupport(
  token: string,
  onlineApi: any
): Promise<{ flashcards: any[]; isOffline: boolean; fromCache: boolean }> {
  try {
    const result = await onlineApi.fetchFlashcards(token);
    
    offlineStorage.setFlashcardsList(result.flashcards);
    
    return {
      flashcards: result.flashcards,
      isOffline: false,
      fromCache: false
    };
  } catch (error) {
    console.warn('[Flashcards] Online fetch failed, checking offline cache:', error);
    
    const cached = offlineStorage.getFlashcardsList();
    if (cached) {
      return {
        flashcards: cached,
        isOffline: true,
        fromCache: true
      };
    }
    
    throw error;
  }
}

export async function getFlashcardDataWithOfflineSupport(
  token: string,
  flashcardId: string,
  onlineApi: any
): Promise<{ data: OfflineFlashcard; isOffline: boolean; fromCache: boolean }> {
  try {
    const data = await onlineApi.getFlashcardQuestions(token, flashcardId);
    
    offlineStorage.setFlashcardData(flashcardId, data);
    
    return {
      data,
      isOffline: false,
      fromCache: false
    };
  } catch (error) {
    console.warn('[Flashcard Data] Online fetch failed, checking offline cache:', error);
    
    const cached = offlineStorage.getFlashcardData(flashcardId);
    if (cached) {
      return {
        data: cached,
        isOffline: true,
        fromCache: true
      };
    }
    
    throw error;
  }
}
