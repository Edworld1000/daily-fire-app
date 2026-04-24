const CACHE_NAME = 'daily-fire-v1';
const ASSETS = [
  '/daily-fire-app/',
  '/daily-fire-app/index.html',
  '/daily-fire-app/manifest.json',
  '/daily-fire-app/icons/icon-192.png',
  '/daily-fire-app/icons/icon-512.png'
];

// Install — cache all core assets
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

// Activate — clean up old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Fetch — serve from cache, fall back to network
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request).then(cached => {
      if (cached) return cached;
      return fetch(event.request).then(response => {
        if (!response || response.status !== 200 || response.type !== 'basic') return response;
        const clone = response.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
        return response;
      }).catch(() => caches.match('/daily-fire-app/index.html'));
    })
  );
});

// Push notification handler
self.addEventListener('push', event => {
  const data = event.data ? event.data.json() : {};
  const title = data.title || '🔥 Daily Fire';
  const options = {
    body: data.body || 'Your daily motivation is waiting.',
    icon: '/daily-fire-app/icons/icon-192.png',
    badge: '/daily-fire-app/icons/icon-96.png',
    vibrate: [100, 50, 100],
    data: { url: '/daily-fire-app/' }
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

// Notification click — open app
self.addEventListener('notificationclick', event => {
  event.notification.close();
  event.waitUntil(
    clients.openWindow(event.notification.data.url || '/daily-fire-app/')
  );
});
