// Service Worker - No Caching - Always Fetch Fresh Data
const CACHE_NAME = 'prepwise-no-cache';

const OFFLINE_HTML = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width,initial-scale=1" />
    <title>Waiting for connection</title>
    <style>
      :root { color-scheme: light dark; }
      body {
        margin: 0;
        font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, "Apple Color Emoji", "Segoe UI Emoji";
        background: #0b1220;
        color: #fff;
        min-height: 100vh;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 20px;
      }
      .card {
        width: 100%;
        max-width: 520px;
        border-radius: 18px;
        background: rgba(15, 23, 42, 0.85);
        border: 1px solid rgba(148, 163, 184, 0.25);
        box-shadow: 0 20px 60px rgba(0,0,0,0.45);
        padding: 22px;
      }
      .row { display: flex; gap: 14px; align-items: flex-start; }
      .dot {
        width: 10px;
        height: 10px;
        border-radius: 999px;
        background: #34d399;
        margin-top: 6px;
        animation: pulse 1.2s infinite;
      }
      @keyframes pulse { 0% { opacity: 0.2 } 50% { opacity: 1 } 100% { opacity: 0.2 } }
      h1 { margin: 0; font-size: 18px; }
      p { margin: 8px 0 0; color: rgba(226,232,240,0.85); font-size: 14px; line-height: 1.4; }
      .meta { margin-top: 10px; font-size: 12px; color: rgba(148,163,184,0.9); }
      .actions { margin-top: 16px; display: flex; gap: 10px; flex-wrap: wrap; }
      button {
        cursor: pointer;
        border-radius: 12px;
        border: 1px solid rgba(148,163,184,0.25);
        padding: 10px 14px;
        font-weight: 700;
        background: rgba(2, 6, 23, 0.6);
        color: #fff;
      }
      .primary { background: #10b981; border-color: #10b981; }
      .primary:hover { filter: brightness(1.05); }
      .secondary:hover { background: rgba(30,41,59,0.7); }
      .hint { margin-top: 12px; font-size: 12px; color: rgba(148,163,184,0.9); }
    </style>
  </head>
  <body>
    <div class="card">
      <div class="row">
        <div class="dot"></div>
        <div>
          <h1>Waiting for connection</h1>
          <p>You’re offline. This page will automatically reload when your internet is back.</p>
          <div class="meta" id="meta">Checking connection...</div>
        </div>
      </div>
      <div class="actions">
        <button class="primary" id="retry">Retry</button>
        <button class="secondary" id="back">Go back</button>
      </div>
      <div class="hint">Tip: If you keep seeing this, the server may be down even if your Wi‑Fi is connected.</div>
    </div>
    <script>
      const meta = document.getElementById('meta');
      const started = Date.now();

      function updateMeta(text) {
        if (meta) meta.textContent = text;
      }

      async function tryReload() {
        try {
          if (!navigator.onLine) {
            updateMeta('Offline for ' + Math.floor((Date.now() - started) / 1000) + 's');
            return;
          }
          const res = await fetch(location.href, { cache: 'no-store' });
          if (res && res.ok) {
            location.reload();
          } else {
            updateMeta('Connection detected, waiting for server...');
          }
        } catch {
          updateMeta('Reconnecting...');
        }
      }

      document.getElementById('retry')?.addEventListener('click', () => location.reload());
      document.getElementById('back')?.addEventListener('click', () => history.back());
      window.addEventListener('online', () => tryReload());

      setInterval(tryReload, 1200);
      tryReload();
    </script>
  </body>
</html>`;

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

  const url = new URL(request.url);
  const isVideoRequest = request.destination === 'video' || /\.(mp4|webm|mov|m4v)(\?.*)?$/i.test(url.pathname);
  const isBunnyCdn = url.hostname.endsWith('b-cdn.net');
  const isRangeRequest = request.headers.has('range');

  // Let the browser handle video/CDN/range requests directly.
  // Service worker interception can break streaming performance and seeking.
  if (request.method === 'GET' && (isVideoRequest || isBunnyCdn || isRangeRequest)) {
    return;
  }

  // Always fetch fresh from server, never cache
  if (request.method === 'GET') {
    event.respondWith(
      fetch(request, { cache: 'no-store' }).catch(error => {
        console.log('[SW] Network request failed:', error.message);

        const accept = request.headers.get('accept') || '';
        const isNavigation = request.mode === 'navigate' || accept.includes('text/html');

        if (isNavigation) {
          return new Response(OFFLINE_HTML, {
            status: 503,
            statusText: 'Service Unavailable',
            headers: { 'Content-Type': 'text/html; charset=utf-8' }
          });
        }

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
