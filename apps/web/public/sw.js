const CACHE_NAME = 'welcome-page-v1';
const LANDING_URL = '/';

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.add(LANDING_URL)),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) =>
        Promise.all(
          cacheNames
            .filter((cacheName) => cacheName !== CACHE_NAME)
            .map((cacheName) => caches.delete(cacheName)),
        ),
      ),
  );
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  const isLandingRequest =
    event.request.mode === 'navigate' && url.pathname === LANDING_URL;
  const isImage =
    req.destination === 'image' && url.pathname === 'images/figure.png';

  if (!isLandingRequest || !isImage) {
    return;
  }

  event.respondWith(
    caches.match(LANDING_URL).then((cachedResponse) => {
      const fetchPromise = fetch(event.request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.ok) {
            caches
              .open(CACHE_NAME)
              .then((cache) => cache.put(LANDING_URL, networkResponse.clone()));
          }
          return networkResponse;
        })
        .catch(() => cachedResponse);

      return cachedResponse ?? fetchPromise;
    }),
  );
});
