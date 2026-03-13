const SHELL_CACHE = 'distrigouttes_shell_v2';
const DOC_CACHE = 'distrigouttes_docs_files_v1';
const APP_SHELL = [
  './',
  './index.html',
  './style.css',
  './app.js',
  './supabase-config.js',
  './scripts/state.js',
  './scripts/utils.js',
  './scripts/data.js',
  './scripts/auth.js',
  './scripts/presentation.js',
  './scripts/journal.js',
  './scripts/documents.js',
  './scripts/settings.js',
  './scripts/ui.js',
  './scripts/main.js'
];

self.addEventListener('install', event => {
  event.waitUntil(caches.open(SHELL_CACHE).then(cache => cache.addAll(APP_SHELL)));
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.map(key => {
        if (key !== SHELL_CACHE && key !== DOC_CACHE) return caches.delete(key);
        return Promise.resolve();
      }))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', event => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  const isSameOrigin = url.origin === self.location.origin;

  // Never intercept Firebase / Google APIs traffic (Firestore/Auth/Storage SDK internals)
  if (!isSameOrigin) return;

  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request).catch(() => caches.match('./index.html'))
    );
    return;
  }

  event.respondWith(
    caches.match(request).then(cached => {
      if (cached) return cached;
      return fetch(request).then(response => {
        const clone = response.clone();
        caches.open(SHELL_CACHE).then(cache => cache.put(request, clone));
        return response;
      });
    })
  );
});
