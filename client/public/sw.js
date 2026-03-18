// Acqlerate Service Worker — network-first for HTML, cache-first for assets
// Cache version bumped on every deploy to bust stale content
const CACHE_VERSION = 'acqlerate-v1773824899';

self.addEventListener('install', (event) => {
  // Pre-cache nothing on install — let the fetch handler populate the cache
  // This avoids caching the wrong asset filenames at install time
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  // Delete ALL old caches from previous versions
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((k) => k !== CACHE_VERSION)
          .map((k) => caches.delete(k))
      )
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // ── API calls: always network-only, never cache ──────────────────────────
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(fetch(request));
    return;
  }

  // ── HTML navigation requests: network-first, fall back to cached index ───
  // This ensures refreshes always get the latest index.html with correct
  // asset hashes. Edge/Safari are strict about stale HTML causing white screens.
  if (request.mode === 'navigate' || request.headers.get('accept')?.includes('text/html')) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response.ok) {
            const clone = response.clone();
            caches.open(CACHE_VERSION).then((cache) => cache.put(request, clone));
          }
          return response;
        })
        .catch(() =>
          // Only fall back to cached HTML if completely offline
          caches.match('/index.html').then((cached) => cached || fetch(request))
        )
    );
    return;
  }

  // ── Static assets (JS/CSS/fonts/images): cache-first ────────────────────
  // Vite hashes filenames, so a cache hit is always correct content
  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached;
      return fetch(request).then((response) => {
        // Only cache successful GET responses for same-origin assets
        if (
          response.ok &&
          request.method === 'GET' &&
          url.origin === self.location.origin
        ) {
          const clone = response.clone();
          caches.open(CACHE_VERSION).then((cache) => cache.put(request, clone));
        }
        return response;
      }).catch(() => {
        // If asset fetch fails (offline), return whatever we have cached
        return caches.match(request);
      });
    })
  );
});
