const CACHE_NAME = 'prepwise-offline-v1';
const FLASHCARD_CACHE = 'prepwise-flashcards-v1';
const API_CACHE = 'prepwise-api-v1';

const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json'
];

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
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME && cacheName !== FLASHCARD_CACHE && cacheName !== API_CACHE) {
            console.log('[SW] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claimClients();
});

self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);

  if (request.method !== 'GET') {
    return;
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
  try {
    const response = await fetch(request);
    
    if (response.ok) {
      const cache = await caches.open(FLASHCARD_CACHE);
      cache.put(request, response.clone());
    }
    
    return response;
  } catch (error) {
    console.log('[SW] Flashcard fetch failed, checking cache:', error);
    
    const cached = await caches.match(request);
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
  try {
    const response = await fetch(request);
    
    if (response.ok && response.status !== 204) {
      const cache = await caches.open(API_CACHE);
      cache.put(request, response.clone());
    }
    
    return response;
  } catch (error) {
    console.log('[SW] API fetch failed, checking cache:', error);
    
    const cached = await caches.match(request);
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
    const response = await fetch(request);
    
    if (response.ok) {
      const cache = await caches.open(CACHE_NAME);
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
