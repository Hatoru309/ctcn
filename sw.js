const CACHE_NAME = 'cuuho-v2';
const APP_SHELL = [
  './',
  './index.html',
  './cuuho.html',
  './thongke.html',
  './login.html',
  './style.css',
  './script.js'
];

self.addEventListener('install', event => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE_NAME);
      await cache.addAll(APP_SHELL);
      await self.skipWaiting();
    })()
  );
});

self.addEventListener('fetch', event => {
  const req = event.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);

  // Only handle same-origin assets/pages for instant load.
  if (url.origin !== self.location.origin) return;

  // Navigation: app-shell cache first, then refresh in background.
  if (req.mode === 'navigate') {
    event.respondWith((async () => {
      const cache = await caches.open(CACHE_NAME);
      const cached = await cache.match(req);
      const fetchPromise = fetch(req)
        .then(res => {
          if (res && res.ok) cache.put(req, res.clone());
          return res;
        })
        .catch(() => null);

      return cached || (await fetchPromise) || (await cache.match('./index.html'));
    })());
    return;
  }

  // Static assets: stale-while-revalidate.
  event.respondWith((async () => {
    const cache = await caches.open(CACHE_NAME);
    const cached = await cache.match(req);
    const fetchPromise = fetch(req)
      .then(res => {
        if (res && res.ok) cache.put(req, res.clone());
        return res;
      })
      .catch(() => null);

    return cached || (await fetchPromise);
  })());
});

self.addEventListener('activate', event => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    (async () => {
      const cacheNames = await caches.keys();
      await Promise.all(
        cacheNames.map(cacheName => {
          if (!cacheWhitelist.includes(cacheName)) return caches.delete(cacheName);
        })
      );
      await self.clients.claim();
    })()
  );
});
