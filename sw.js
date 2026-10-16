const CACHE_NAME = 'bible-etudes-v1';
const SHELL = ['./', './index.html', './manifest.webmanifest', './icon-192.png', './icon-512.png'];

self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET' || new URL(event.request.url).origin !== self.location.origin) return;
  event.respondWith((async () => {
    const cached = await caches.match(event.request);
    if (cached) {
      fetch(event.request).then(response => {
        if (response.ok) caches.open(CACHE_NAME).then(cache => cache.put(event.request, response.clone()));
      }).catch(() => {});
      return cached;
    }
    try {
      const response = await fetch(event.request);
      if (response.ok) caches.open(CACHE_NAME).then(cache => cache.put(event.request, response.clone()));
      return response;
    } catch {
      return caches.match('./index.html');
    }
  })());
});

self.addEventListener('message', event => {
  if (event.data?.type === 'ACTIVATE') return self.skipWaiting();
  if (event.data?.type === 'DOWNLOAD' || event.data?.type === 'STATUS') {
    event.waitUntil((async () => {
      const cache = await caches.open(CACHE_NAME);
      await cache.addAll(SHELL);
      const clients = await self.clients.matchAll({ type: 'window' });
      clients.forEach(client => client.postMessage({ type: 'COMPLETE', complete: true, count: SHELL.length, total: SHELL.length }));
    })());
  }
});
