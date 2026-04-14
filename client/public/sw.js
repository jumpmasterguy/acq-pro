// Acqlerate Service Worker v2 — PWA with offline lesson support
// Cache version bumped on every deploy to bust stale content
const CACHE_VERSION = 'acqlerate-v2';
const LESSON_CACHE = 'acqlerate-lessons-v2';

// Core app shell — cached on install for offline access
const APP_SHELL = [
  '/app',
  '/manifest.json',
  '/favicon.ico',
  '/acqlerate-icon.svg',
  '/favicon-192x192.png',
  '/icon-192x192.png',
  '/icon-512x512.png',
  '/apple-touch-icon.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_VERSION).then((cache) => {
      // Pre-cache app shell — failures are non-fatal (some may 404)
      return Promise.allSettled(
        APP_SHELL.map(url => cache.add(url).catch(() => {}))
      );
    }).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((k) => k !== CACHE_VERSION && k !== LESSON_CACHE)
          .map((k) => caches.delete(k))
      )
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // ── API calls: always network-only ──────────────────────────────────────
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(fetch(request).catch(() => new Response(
      JSON.stringify({ error: 'offline' }), 
      { status: 503, headers: { 'Content-Type': 'application/json' } }
    )));
    return;
  }

  // ── HTML navigation: network-first, fall back to cached /app shell ───────
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
          caches.match('/index.html').then((cached) => cached || fetch(request))
        )
    );
    return;
  }

  // ── JS/CSS/fonts bundles (Vite hash filenames): cache-first forever ──────
  if (
    url.pathname.includes('/assets/') ||
    url.pathname.endsWith('.js') ||
    url.pathname.endsWith('.css') ||
    url.pathname.endsWith('.woff2') ||
    url.pathname.endsWith('.woff')
  ) {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) return cached;
        return fetch(request).then((response) => {
          if (response.ok && request.method === 'GET') {
            const clone = response.clone();
            caches.open(CACHE_VERSION).then((c) => c.put(request, clone));
          }
          return response;
        }).catch(() => caches.match(request));
      })
    );
    return;
  }

  // ── Images/icons: cache-first ────────────────────────────────────────────
  if (
    url.pathname.endsWith('.png') ||
    url.pathname.endsWith('.jpg') ||
    url.pathname.endsWith('.jpeg') ||
    url.pathname.endsWith('.svg') ||
    url.pathname.endsWith('.ico')
  ) {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) return cached;
        return fetch(request).then((response) => {
          if (response.ok) {
            const clone = response.clone();
            caches.open(CACHE_VERSION).then((c) => c.put(request, clone));
          }
          return response;
        }).catch(() => caches.match(request));
      })
    );
    return;
  }

  // ── Everything else: network with cache fallback ─────────────────────────
  event.respondWith(
    fetch(request)
      .then((response) => {
        if (response.ok && request.method === 'GET' && url.origin === self.location.origin) {
          const clone = response.clone();
          caches.open(CACHE_VERSION).then((c) => c.put(request, clone));
        }
        return response;
      })
      .catch(() => caches.match(request))
  );
});

// ── Message: clear lesson cache on demand ───────────────────────────────────
self.addEventListener('message', (event) => {
  if (event.data?.type === 'CLEAR_LESSON_CACHE') {
    caches.delete(LESSON_CACHE).then(() => {
      event.ports[0]?.postMessage({ ok: true });
    });
  }
  if (event.data?.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
