// FIKRA Service Worker v1.0
// Cache-first strategiya: statik assetlar offline ishlaydi

const CACHE_NAME = 'fikra-v1';
const STATIC_CACHE = 'fikra-static-v1';
const API_CACHE = 'fikra-api-v1';

// Offline cache ga olinadigan fayllar
const STATIC_ASSETS = [
  '/',
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png',
  '/apple-touch-icon.png',
];

// ─── Install ──────────────────────────────────────────────────────────────────
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => {
      return cache.addAll(STATIC_ASSETS).catch((err) => {
        console.warn('[SW] Static cache partial fail:', err);
      });
    }).then(() => {
      return self.skipWaiting(); // Darhol faollashuv
    })
  );
});

// ─── Activate ─────────────────────────────────────────────────────────────────
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys
          .filter((key) => key !== STATIC_CACHE && key !== API_CACHE)
          .map((key) => caches.delete(key))
      );
    }).then(() => self.clients.claim())
  );
});

// ─── Fetch ────────────────────────────────────────────────────────────────────
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // API so'rovlarini cache qilmaymiz — network-first
  if (url.pathname.startsWith('/api/') || url.pathname.startsWith('/bot-webhook')) {
    return; // brauzer o'zi hal qiladi
  }

  // Telegram script — network-only
  if (url.hostname === 'telegram.org') {
    return;
  }

  // Google Fonts — network-first, fallback cache
  if (url.hostname.includes('fonts.googleapis.com') || url.hostname.includes('fonts.gstatic.com')) {
    event.respondWith(
      fetch(request).catch(() => caches.match(request))
    );
    return;
  }

  // Statik assetlar — cache-first
  if (
    url.pathname.startsWith('/assets/') ||
    url.pathname.match(/\.(js|css|png|svg|ico|woff2?|ttf)$/)
  ) {
    event.respondWith(
      caches.open(STATIC_CACHE).then((cache) =>
        cache.match(request).then((cached) => {
          if (cached) return cached;
          return fetch(request).then((response) => {
            if (response.ok) cache.put(request, response.clone());
            return response;
          });
        })
      )
    );
    return;
  }

  // HTML (SPA navigation) — network-first, offline fallback
  if (request.mode === 'navigate' || request.headers.get('accept')?.includes('text/html')) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response.ok) {
            const clone = response.clone();
            caches.open(STATIC_CACHE).then((cache) => cache.put('/', clone));
          }
          return response;
        })
        .catch(() =>
          caches.match('/').then((cached) => {
            return cached || new Response('Offline. Internetga ulaning.', {
              headers: { 'Content-Type': 'text/plain; charset=utf-8' },
            });
          })
        )
    );
    return;
  }
});

// ─── Push Notifications (kelajak uchun) ──────────────────────────────────────
self.addEventListener('push', (event) => {
  if (!event.data) return;
  try {
    const data = event.data.json();
    event.waitUntil(
      self.registration.showNotification(data.title || 'FIKRA', {
        body: data.body || '',
        icon: '/icon-192.png',
        badge: '/icon-192.png',
        tag: data.tag || 'fikra-notif',
        data: { url: data.url || '/' },
      })
    );
  } catch {}
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = event.notification.data?.url || '/';
  event.waitUntil(
    clients.matchAll({ type: 'window' }).then((list) => {
      for (const client of list) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.navigate(url);
          return client.focus();
        }
      }
      return clients.openWindow(url);
    })
  );
});
