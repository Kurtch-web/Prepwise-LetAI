// Service Worker - No Caching - Always Fetch Fresh Data
const CACHE_NAME = 'prepwise-no-cache';

self.addEventListener('install', event => {
  console.log('[SW] Installing service worker (NO CACHING MODE)');
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  console.log('[SW] Activating service worker - clearing all caches...');
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
      console.log('[SW] All caches cleared - running in NO CACHE mode');
    })
  );
  return self.clients.claim();
});

self.addEventListener('fetch', event => {
  const { request } = event;

  // Always fetch fresh from server, never cache
  if (request.method === 'GET') {
    event.respondWith(
      fetch(request, { cache: 'no-store' }).catch(error => {
        console.log('[SW] Network request failed:', error.message);
        return new Response(JSON.stringify({
          error: 'Network error - cannot reach server',
          offline: true
        }), {
          status: 503,
          statusText: 'Service Unavailable',
          headers: { 'Content-Type': 'application/json' }
        });
      })
    );
  }
});

self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
