// ─── FIKRA Service Worker ────────────────────────────────────────────────────
// Offline cache + PWA install

const CACHE_VERSION = 'fikra-v1.0.0';
const STATIC_CACHE = 'fikra-static-' + CACHE_VERSION;
const API_CACHE = 'fikra-api-' + CACHE_VERSION;

// Offline da ishlashi kerak bo'lgan static fayllar
const STATIC_FILES = [
  '/',
  '/index.html',
  '/manifest.json',
  '/css/theme.css',
  '/js/api.js',
  '/js/app.js',
  '/js/music.js',
  '/js/ads/adsgram.js',
  '/js/games/stroop.js',
  '/js/games/test.js',
  '/js/ai/chat.js',
  '/js/ai/doc.js',
  '/js/ai/image.js',
  '/js/ai/calorie.js',
  '/icons/icon.svg',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
];

// ─── Install ──────────────────────────────────────────────────────────────────
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => {
      console.log('[SW] Static fayllar cache qilinmoqda');
      return cache.addAll(STATIC_FILES).catch((err) => {
        console.warn('[SW] Ba\'zi fayllar cache qilinmadi:', err);
      });
    }).then(() => self.skipWaiting())
  );
});

// ─── Activate ─────────────────────────────────────────────────────────────────
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((k) => k !== STATIC_CACHE && k !== API_CACHE && k.startsWith('fikra-'))
          .map((k) => {
            console.log('[SW] Eski cache o\'chirilmoqda:', k);
            return caches.delete(k);
          })
      )
    ).then(() => self.clients.claim())
  );
});

// ─── Fetch: strategiyalar ─────────────────────────────────────────────────────
// 1. Telegram SDK, Adsgram — doim network (bypass)
// 2. API (/api/...) — network-first, offline fallback
// 3. Static fayllar — cache-first
// 4. Boshqa — network-first
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // GET dan boshqasini by-pass qilish
  if (request.method !== 'GET') return;

  // Telegram SDK, Adsgram, boshqa tashqi CDN — cache qilmaymiz
  if (url.hostname !== self.location.hostname) return;

  // API so'rovlari — network-first, xato bo'lsa cache
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(request)
        .then((resp) => {
          // Muvaffaqiyatli bo'lsa cache ga yozish (faqat GET)
          if (resp.ok && request.method === 'GET') {
            const clone = resp.clone();
            caches.open(API_CACHE).then((cache) => cache.put(request, clone));
          }
          return resp;
        })
        .catch(() => caches.match(request).then((c) => c || _offlineResponse()))
    );
    return;
  }

  // Static fayllar — cache-first
  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached;
      return fetch(request).then((resp) => {
        // Cache qilish (status 200)
        if (resp.ok) {
          const clone = resp.clone();
          caches.open(STATIC_CACHE).then((cache) => cache.put(request, clone));
        }
        return resp;
      }).catch(() => {
        // Offline da index.html qaytar (SPA fallback)
        if (request.mode === 'navigate') {
          return caches.match('/index.html');
        }
        return _offlineResponse();
      });
    })
  );
});

function _offlineResponse() {
  return new Response(
    JSON.stringify({ error: 'Offline — internet aloqasini tekshiring' }),
    { headers: { 'Content-Type': 'application/json' }, status: 503 }
  );
}

// ─── Push notifications (keyinchalik) ─────────────────────────────────────────
self.addEventListener('push', (event) => {
  if (!event.data) return;
  try {
    const data = event.data.json();
    event.waitUntil(
      self.registration.showNotification(data.title || 'FIKRA', {
        body: data.body || '',
        icon: '/icons/icon-192.png',
        badge: '/icons/icon-192.png',
        data: data.url || '/',
      })
    );
  } catch (e) {}
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = event.notification.data || '/';
  event.waitUntil(
    self.clients.matchAll({ type: 'window' }).then((clients) => {
      for (const client of clients) {
        if (client.url === url && 'focus' in client) return client.focus();
      }
      if (self.clients.openWindow) return self.clients.openWindow(url);
    })
  );
});
