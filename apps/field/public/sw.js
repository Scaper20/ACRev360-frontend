// App-shell service worker for the offline-first field agent PWA. Unlike a
// precache-manifest approach, this caches lazily on first use rather than
// listing fixed filenames — Vite's build output is content-hashed, so there
// is no fixed filename list to precache correctly across deploys.
const CACHE_NAME = 'acrev360-field-v1';

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.add('/')).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);

  // API calls always go to the network untouched — the offline queue (see
  // src/lib/offlineQueue.ts) is what decides what happens when that fails,
  // not this worker. A stale cached API response for live payer/bill data
  // would be actively dangerous here, not just inconvenient.
  if (url.pathname.startsWith('/api/')) return;

  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put('/', copy));
          return response;
        })
        .catch(() => caches.match('/').then((cached) => cached ?? Response.error())),
    );
    return;
  }

  // Static assets (Vite's hashed JS/CSS, fonts, icons): cache-first, refill
  // in the background. Content-hashed filenames mean a cached copy is never
  // stale for its own URL — a new deploy ships new filenames, not new
  // content under the old ones.
  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached;
      return fetch(request).then((response) => {
        if (response.ok) {
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
        }
        return response;
      });
    }),
  );
});
