self.addEventListener('install', event => {
  event.waitUntil(
    caches.open('todo-v1').then(cache => cache.addAll([
      '/',
      '/index.html',
      '/styles.css',
      '/app.js',
      '/manifest.json',
      // Add icons as needed
    ]))
  );
  self.skipWaiting();
});
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request).then(response => response || fetch(event.request))
  );
});