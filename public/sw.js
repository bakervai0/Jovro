/* Jovro service worker — conservative caching.
 * - App shell (index, manifest, icons) is precached at install.
 * - Navigations are network-first; the cached index.html is only an
 *   offline fallback, so new deploys are picked up immediately.
 * - Hashed build assets under /assets/ are immutable -> cache-first.
 * Bump CACHE_VERSION on every release that changes this file's logic.
 */
const CACHE_VERSION = 'jovro-v1';
const BASE = '/Jovro/';

const APP_SHELL = [
  BASE,
  BASE + 'index.html',
  BASE + 'manifest.webmanifest',
  BASE + 'favicon.svg',
  BASE + 'icons/icon-192.png',
  BASE + 'icons/icon-512.png',
  BASE + 'icons/icon-maskable-512.png',
  BASE + 'icons/apple-touch-icon.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE_VERSION)
      .then((cache) => cache.addAll(APP_SHELL))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((key) => key !== CACHE_VERSION).map((key) => caches.delete(key))),
      )
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  // SPA navigations: always try the network first so deploys go live
  // right away; fall back to the cached shell only when offline.
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request).catch(() =>
        caches.match(BASE + 'index.html', { ignoreSearch: true }).then(
          (cached) => cached || caches.match(BASE, { ignoreSearch: true }),
        ),
      ),
    );
    return;
  }

  // Vite build output is content-hashed and immutable: cache-first.
  if (url.pathname.startsWith(BASE + 'assets/')) {
    event.respondWith(
      caches.match(request).then(
        (cached) =>
          cached ||
          fetch(request).then((response) => {
            if (response.ok) {
              const copy = response.clone();
              caches.open(CACHE_VERSION).then((cache) => cache.put(request, copy));
            }
            return response;
          }),
      ),
    );
    return;
  }

  // Everything else (icons, manifest, ...): network-first, cache fallback.
  event.respondWith(
    fetch(request)
      .then((response) => {
        if (response.ok) {
          const copy = response.clone();
          caches.open(CACHE_VERSION).then((cache) => cache.put(request, copy));
        }
        return response;
      })
      .catch(() => caches.match(request, { ignoreSearch: true })),
  );
});
