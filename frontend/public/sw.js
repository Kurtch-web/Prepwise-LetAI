const CACHE_VERSION = 'v2';
const CACHE_NAME = `prepwise-offline-${CACHE_VERSION}`;
const FLASHCARD_CACHE = `prepwise-flashcards-${CACHE_VERSION}`;
const API_CACHE = `prepwise-api-${CACHE_VERSION}`;
const ASSET_CACHE = `prepwise-assets-${CACHE_VERSION}`;

const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json'
];

const MAX_CACHE_SIZE = 50 * 1024 * 1024; // 50MB max cache
const CACHE_DURATION = 7 * 24 * 60 * 60 * 1000; // 7 days

self.addEventListener('install', event => {
  console.log('[SW] Installing service worker...');
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      console.log('[SW] Caching static assets');
      return cache.addAll(STATIC_ASSETS);
    }).catch(err => {
      console.error('[SW] Error during install:', err);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  console.log('[SW] Activating service worker...');
  event.waitUntil(
    caches.keys().then(cacheNames => {
      console.log('[SW] Found caches:', cacheNames);
      return Promise.all(
        cacheNames.map(cacheName => {
          console.log('[SW] Deleting cache:', cacheName);
          return caches.delete(cacheName);
        })
      );
    }).then(() => {
      console.log('[SW] All caches cleared');
      return self.clients.matchAll();
    }).then(clients => {
      clients.forEach(client => {
        client.postMessage({ type: 'CACHE_CLEARED' });
      });
    })
  );
  return self.clients.claim();
});

self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);

  if (request.method !== 'GET') {
    return;
  }

  // External URLs (PDFs, etc.) - cache-first for slow connections
  if (!url.origin.includes(self.location.origin)) {
    return event.respondWith(handleExternalRequest(request));
  }

  // Don't cache posts endpoint - it changes frequently
  if (url.pathname.startsWith('/api/posts')) {
    return event.respondWith(fetch(request).catch(() => {
      return new Response(JSON.stringify({
        error: 'Offline and no cached data available',
        offline: true
      }), {
        status: 503,
        statusText: 'Service Unavailable',
        headers: { 'Content-Type': 'application/json' }
      });
    }));
  }

  if (url.pathname.startsWith('/api/flashcards')) {
    return event.respondWith(handleFlashcardRequest(request));
  }

  if (url.pathname.startsWith('/api/')) {
    return event.respondWith(handleApiRequest(request));
  }

  return event.respondWith(handleStaticRequest(request));
});

async function handleFlashcardRequest(request) {
  const cache = await caches.open(FLASHCARD_CACHE);

  try {
    const response = await Promise.race([
      fetch(request),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Network timeout')), 5000)
      )
    ]);

    if (response.ok) {
      cache.put(request, response.clone());
      return response;
    }

    // If response not ok, try cache
    const cached = await cache.match(request);
    return cached || new Response(JSON.stringify({
      error: 'Offline and no cached data available',
      offline: true
    }), {
      status: 503,
      statusText: 'Service Unavailable',
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.log('[SW] Flashcard fetch failed, checking cache:', error);

    const cached = await cache.match(request);
    if (cached) {
      const response = cached.clone();
      const clonedResponse = new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers: new Headers(response.headers)
      });
      clonedResponse.headers.set('X-From-Cache', 'true');
      clonedResponse.headers.set('X-Offline-Cached', new Date().toISOString());
      return clonedResponse;
    }

    return new Response(JSON.stringify({
      error: 'Offline and no cached data available',
      offline: true
    }), {
      status: 503,
      statusText: 'Service Unavailable',
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

async function handleApiRequest(request) {
  const cache = await caches.open(API_CACHE);

  try {
    const response = await Promise.race([
      fetch(request),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Network timeout')), 8000)
      )
    ]);

    if (response.ok && response.status !== 204) {
      cache.put(request, response.clone());
      return response;
    }

    // If response not ok, try cache
    const cached = await cache.match(request);
    return cached || response;
  } catch (error) {
    console.log('[SW] API fetch failed, checking cache:', error);

    const cached = await cache.match(request);
    if (cached) {
      const response = cached.clone();
      const clonedResponse = new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers: new Headers(response.headers)
      });
      clonedResponse.headers.set('X-From-Cache', 'true');
      clonedResponse.headers.set('X-Offline-Cached', new Date().toISOString());
      return clonedResponse;
    }

    return new Response(JSON.stringify({
      error: 'Offline and no cached data available',
      offline: true
    }), {
      status: 503,
      statusText: 'Service Unavailable',
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

async function handleStaticRequest(request) {
  const cached = await caches.match(request);
  if (cached) {
    return cached;
  }

  try {
    const response = await Promise.race([
      fetch(request),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Network timeout')), 5000)
      )
    ]);

    if (response.ok) {
      const cache = await caches.open(ASSET_CACHE);
      cache.put(request, response.clone());
    }

    return response;
  } catch (error) {
    console.log('[SW] Static request failed:', error);
    return new Response('Offline - resource not available', {
      status: 503,
      statusText: 'Service Unavailable',
      headers: { 'Content-Type': 'text/plain' }
    });
  }
}

async function handleExternalRequest(request) {
  const cache = await caches.open(ASSET_CACHE);
  const cached = await cache.match(request);

  // Cache-first strategy for external resources like PDFs
  if (cached) {
    return cached;
  }

  try {
    const response = await Promise.race([
      fetch(request),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Network timeout')), 10000)
      )
    ]);

    if (response.ok) {
      cache.put(request, response.clone());
    }

    return response;
  } catch (error) {
    console.log('[SW] External request failed, checking cache:', error);

    if (cached) {
      return cached;
    }

    return new Response('Offline - resource not available', {
      status: 503,
      statusText: 'Service Unavailable',
      headers: { 'Content-Type': 'text/plain' }
    });
  }
}

self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'CLEAR_CACHE') {
    caches.delete(FLASHCARD_CACHE).then(() => {
      caches.delete(API_CACHE).then(() => {
        event.ports[0].postMessage({ success: true });
      });
    });
  }
});
