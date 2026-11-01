// Service Worker per Turni Corvetto — compatibile con GitHub Pages e sottopercorsi.
const APP_BASE = new URL('./', self.registration.scope).pathname;
const CACHE_NAME = 'turni-corvetto-static-v2';
const ASSETS_TO_CACHE = [
  APP_BASE,
  `${APP_BASE}index.html`,
  `${APP_BASE}manifest.webmanifest`,
  `${APP_BASE}icon.svg`,
  `${APP_BASE}icon-192.png`,
  `${APP_BASE}icon-512.png`
];

self.addEventListener('install', event => {
  self.skipWaiting();
  event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS_TO_CACHE).catch(err => {
    console.warn('[PWA] Cache iniziale parziale:', err);
  })));
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(
      keys.filter(key => key.startsWith('turni-corvetto-') && key !== CACHE_NAME).map(key => caches.delete(key))
    )).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin || !url.pathname.startsWith(APP_BASE)) return;

  event.respondWith(
    fetch(event.request).then(response => {
      if (response && response.status === 200) {
        const copy = response.clone();
        event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.put(event.request, copy)));
      }
      return response;
    }).catch(() => caches.match(event.request).then(cached => {
      if (cached) return cached;
      if (event.request.mode === 'navigate') return caches.match(`${APP_BASE}index.html`);
      return undefined;
    }))
  );
});

// Supporto notifiche push predisposto, ma il mittente server-side non è attivo su hosting statico gratuito.
self.addEventListener('push', event => {
  let data = { title: 'Turni Corvetto', body: 'Nuovo aggiornamento sui turni.', icon: `${APP_BASE}icon.svg`, data: { url: APP_BASE } };
  try { if (event.data) data = Object.assign(data, event.data.json()); } catch {}
  event.waitUntil(self.registration.showNotification(data.title, {
    body: data.body,
    icon: data.icon || `${APP_BASE}icon.svg`,
    badge: `${APP_BASE}icon.svg`,
    data: data.data || { url: APP_BASE }
  }));
});

self.addEventListener('notificationclick', event => {
  event.notification.close();
  const target = (event.notification.data && event.notification.data.url) || APP_BASE;
  event.waitUntil(self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(windows => {
    for (const client of windows) {
      if (client.url.includes(self.location.origin) && 'focus' in client) return client.focus();
    }
    return self.clients.openWindow ? self.clients.openWindow(target) : undefined;
  }));
});
