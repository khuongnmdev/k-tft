// Service worker: serves the app shell of one build from cache, and hands over to the next build as
// soon as it is deployed. The deploy workflow replaces __BUILD__ with the commit, so every deploy
// changes this file, which is what makes browsers install the new worker (see pwa.js).
const BUILD = '__BUILD__';
// Unstamped (local `npm start` / python server): cache nothing, so edits show on a plain reload.
const DEV = BUILD.startsWith('__');
const CACHE = `k-tft-${BUILD}`;

const SHELL = [
  './',
  'index.html',
  'compare.html',
  'app.js',
  'compare.js',
  'core.js',
  'i18n.js',
  'shared.js',
  'pwa.js',
  'style.css',
  'favicon.svg',
  'manifest.webmanifest',
  'icon-192.png',
  'icon-512.png',
];

self.addEventListener('install', (event) => {
  if (DEV) return self.skipWaiting();
  event.waitUntil(
    caches
      .open(CACHE)
      // `reload` skips the HTTP cache, which GitHub Pages keeps for 10 minutes, so the new build
      // is cached instead of a stale copy of the old one.
      .then((cache) => cache.addAll(SHELL.map((path) => new Request(path, { cache: 'reload' }))))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k.startsWith('k-tft-') && k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (DEV || req.method !== 'GET') return;
  const url = new URL(req.url);
  // MetaTFT, CDN images and Chart.js, plus server.js's /api proxy, always go to the network.
  if (url.origin !== self.location.origin || url.pathname.includes('/api/')) return;
  event.respondWith(
    // Shell files are requested with ?v= and pages with the view in the query (?r=…&id=…),
    // so the query is ignored when looking them up.
    caches.match(req, { cacheName: CACHE, ignoreSearch: true }).then((hit) => hit ?? fetch(req)),
  );
});
