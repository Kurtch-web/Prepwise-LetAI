/**
 * Performance optimization utilities for slow data connections
 */

export const performanceConfig = {
  REQUEST_TIMEOUT: 10000,
  SLOW_CONNECTION_THRESHOLD: 1000, // 1MB/s
  CACHE_DURATION: 7 * 24 * 60 * 60 * 1000, // 7 days
  MAX_CACHE_SIZE: 50 * 1024 * 1024 // 50MB
};

/**
 * Detects if the user has a slow connection based on Network Information API
 */
export function isSlowConnection(): boolean {
  if (typeof navigator === 'undefined' || !('connection' in navigator)) {
    return false;
  }

  const connection = (navigator as any).connection;
  const effectiveType = connection?.effectiveType;

  // 'slow-2g', '2g', '3g' are considered slow
  return ['slow-2g', '2g', '3g'].includes(effectiveType);
}

/**
 * Gets the effective connection speed in Mbps
 */
export function getConnectionSpeed(): string {
  if (typeof navigator === 'undefined' || !('connection' in navigator)) {
    return 'unknown';
  }

  const connection = (navigator as any).connection;
  return connection?.effectiveType || 'unknown';
}

/**
 * Preloads a resource ahead of time
 */
export function preloadResource(url: string, type: 'script' | 'style' | 'font' | 'fetch'): void {
  if (typeof document === 'undefined') return;

  const link = document.createElement('link');
  link.rel = 'preload';
  link.as = type;
  link.href = url;

  if (type === 'font') {
    link.crossOrigin = 'anonymous';
  }

  document.head.appendChild(link);
}

/**
 * Defers heavy operations when on slow connections
 */
export function deferIfSlowConnection<T>(
  fn: () => T,
  slowFn?: () => T
): T {
  if (isSlowConnection()) {
    return slowFn ? slowFn() : fn();
  }
  return fn();
}

/**
 * Measures and logs performance metrics
 */
export function measurePerformance(label: string, fn: () => void): void {
  if (!('performance' in window)) {
    fn();
    return;
  }

  const start = performance.now();
  fn();
  const end = performance.now();
  
  console.log(`[Performance] ${label}: ${(end - start).toFixed(2)}ms`);
}

/**
 * Reports Core Web Vitals
 */
export function reportWebVitals(): void {
  if ('web-vital' in window) {
    // Use web-vitals library if available
    return;
  }

  // Basic implementation for monitoring
  if ('PerformanceObserver' in window) {
    try {
      // Observe Largest Contentful Paint
      const lcpObserver = new PerformanceObserver((entryList) => {
        const entries = entryList.getEntries();
        const lastEntry = entries[entries.length - 1] as any;
        const vitals = (lastEntry as { renderTime?: number; loadTime?: number });
        console.log('[WebVitals] LCP:', vitals.renderTime || vitals.loadTime);
      });
      lcpObserver.observe({ type: 'largest-contentful-paint', buffered: true });

      // Observe First Input Delay
      const fidObserver = new PerformanceObserver((entryList) => {
        const entries = entryList.getEntries();
        entries.forEach((entry) => {
          const eventEntry = entry as any;
          console.log('[WebVitals] FID:', eventEntry.processingDuration);
        });
      });
      fidObserver.observe({ type: 'first-input', buffered: true });
    } catch (e) {
      console.warn('[Performance] Failed to observe web vitals:', e);
    }
  }
}

/**
 * Creates a request with automatic retry on timeout
 */
export async function fetchWithRetry<T>(
  url: string,
  options: RequestInit = {},
  maxRetries: number = 2
): Promise<T> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), performanceConfig.REQUEST_TIMEOUT);

      const response = await fetch(url, {
        ...options,
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      return response.json() as Promise<T>;
    } catch (error) {
      lastError = error as Error;
      
      if (attempt < maxRetries) {
        // Wait before retrying with exponential backoff
        const delay = Math.pow(2, attempt) * 1000;
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  throw lastError || new Error('Failed to fetch after retries');
}

/**
 * Monitors network status changes
 */
export function onNetworkChange(callback: (isOnline: boolean) => void): () => void {
  window.addEventListener('online', () => callback(true));
  window.addEventListener('offline', () => callback(false));

  return () => {
    window.removeEventListener('online', () => callback(true));
    window.removeEventListener('offline', () => callback(false));
  };
}
