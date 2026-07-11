const STATIC_CACHE = 'elimux-static-v2';
const API_CACHE = 'elimux-api-v2';
const CURRENT_CACHES = [STATIC_CACHE, API_CACHE];

const STATIC_ASSETS = [
  '/',
  '/programs/',
  '/institutions/',
  '/ai-search/',
  '/pricing/',
  '/about/',
  '/contact/',
  '/manifest.json',
  '/icon-192x192.png',
  '/icon-512x512.png',
];

const API_ORIGIN = 'https://api.elimux.ke';

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => cache.addAll(STATIC_ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) =>
      Promise.all(
        cacheNames
          .filter((name) => !CURRENT_CACHES.includes(name))
          .map((name) => caches.delete(name))
      )
    )
  );
  self.clients.claim();
});

// CacheFirst: same-origin static assets (pages, icons, JS/CSS chunks, manifest) -
// these change on deploy, not per-request, so serving from cache first is safe
// and fast; a background fetch refreshes the cache for next time.
async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) return cached;

  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(STATIC_CACHE);
      cache.put(request, response.clone());
    }
    return response;
  } catch (err) {
    if (request.destination === 'document') {
      const fallback = await caches.match('/');
      if (fallback) return fallback;
    }
    throw err;
  }
}

// NetworkFirst: elimux-backend API calls - data changes constantly, so always
// prefer a fresh network response; fall back to the last cached response only
// when offline (stale data beats no data for a GET the UI already expects).
async function networkFirst(request) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(API_CACHE);
      cache.put(request, response.clone());
    }
    return response;
  } catch (err) {
    const cached = await caches.match(request);
    if (cached) return cached;
    throw err;
  }
}

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);

  if (url.origin === API_ORIGIN) {
    event.respondWith(networkFirst(event.request));
  } else if (url.origin === self.location.origin) {
    event.respondWith(cacheFirst(event.request));
  }
  // Other cross-origin requests (Supabase, etc.) are left to the browser's
  // default handling - neither strategy applies cleanly to third-party APIs
  // this app doesn't own the caching contract for.
});

// Background Sync: the Background Sync API isn't supported everywhere (notably
// Safari/iOS), so this is a best-effort accelerator, not the only path - the
// primary sync mechanism is useBackgroundSync.ts's online/offline listener,
// which works everywhere. Where the browser does support it, a registered
// 'elimux-sync' tag fires this as soon as connectivity returns, even if the
// tab isn't focused; broadcasting to clients lets any open tab's hook react
// immediately instead of waiting for its own online event.
self.addEventListener('sync', (event) => {
  if (event.tag === 'elimux-sync') {
    event.waitUntil(
      self.clients.matchAll().then((clients) => {
        clients.forEach((client) => client.postMessage({ type: 'BACKGROUND_SYNC' }));
      })
    );
  }
});

// Push: display a notification for a payload sent by POST /api/pwa/notify
// ({ title, body, url }).
self.addEventListener('push', (event) => {
  if (!event.data) return;

  let payload;
  try {
    payload = event.data.json();
  } catch (err) {
    payload = { title: 'ElimuX', body: event.data.text() };
  }

  const { title, body, url } = payload;

  event.waitUntil(
    self.registration.showNotification(title || 'ElimuX', {
      body: body || '',
      icon: '/icon-192x192.png',
      badge: '/icon-72x72.png',
      data: { url: url || '/' },
    })
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const targetUrl = event.notification.data?.url || '/';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
      for (const client of clients) {
        if (client.url === targetUrl && 'focus' in client) {
          return client.focus();
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow(targetUrl);
      }
    })
  );
});
