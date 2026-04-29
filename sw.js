/* FloorScan PWA service worker — v2.4.0
 *
 * Strategy:
 *   - App-shell (HTML, manifest, icons): cache-first, fall back to network.
 *   - CDN libs (SheetJS, html5-qrcode, qrcodejs): network-first, fall back to cache,
 *     so library updates land but app still boots offline.
 *   - All other GETs: pass-through (no caching) — keeps SharePoint auth flows clean.
 *
 * Versioning:
 *   Bump SW_VERSION to invalidate the cache. The activate handler purges old buckets.
 *
 * Notes:
 *   - We deliberately do NOT cache POST or non-GET requests.
 *   - We do NOT intercept opaque/cross-origin requests other than the explicit CDN allowlist.
 *   - We do NOT touch the File System Access API or getUserMedia paths — those are not
 *     network requests, the SW never sees them.
 */

const SW_VERSION = 'v2.4.0';
const CACHE_SHELL = `floorscan-shell-${SW_VERSION}`;
const CACHE_CDN   = `floorscan-cdn-${SW_VERSION}`;

// Files that make up the offline-capable app shell.
// Paths are relative to the SW scope, which equals the directory where sw.js lives.
const SHELL_ASSETS = [
  './',
  './FloorScan_pilot_v24.html',
  './manifest.webmanifest',
  './icon-192.png',
  './icon-512.png',
  './icon-512-maskable.png',
  './icon-32.png'
];

// CDN URLs we want to cache for offline.
const CDN_HOSTS = ['cdnjs.cloudflare.com'];

self.addEventListener('install', (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE_SHELL);
    // addAll is atomic — if any file 404s the install fails. Fall back to per-file
    // adds so a missing icon doesn't kill the whole install.
    await Promise.all(SHELL_ASSETS.map(async (url) => {
      try {
        await cache.add(new Request(url, { cache: 'reload' }));
      } catch (e) {
        // Log but continue — partial shell is better than no SW.
        console.warn('[FloorScan SW] failed to precache', url, e);
      }
    }));
    // Activate immediately on first install so the next navigation is controlled.
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    // Drop old shell/cdn caches from previous SW versions.
    const names = await caches.keys();
    await Promise.all(
      names
        .filter(n => (n.startsWith('floorscan-shell-') || n.startsWith('floorscan-cdn-')) && n !== CACHE_SHELL && n !== CACHE_CDN)
        .map(n => caches.delete(n))
    );
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', (event) => {
  const req = event.request;

  // Only handle GETs. POSTs (e.g. SharePoint auth, future API calls) pass through.
  if (req.method !== 'GET') return;

  const url = new URL(req.url);

  // 1. Same-origin app shell → cache-first
  if (url.origin === self.location.origin) {
    event.respondWith(cacheFirst(req, CACHE_SHELL));
    return;
  }

  // 2. Whitelisted CDN libs → network-first, cache fallback
  if (CDN_HOSTS.includes(url.hostname)) {
    event.respondWith(networkFirst(req, CACHE_CDN));
    return;
  }

  // 3. Everything else → pass through (don't touch).
});

async function cacheFirst(req, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(req, { ignoreSearch: true });
  if (cached) return cached;
  try {
    const fresh = await fetch(req);
    if (fresh.ok && req.url.startsWith(self.location.origin)) {
      // Best-effort cache; ignore quota errors.
      cache.put(req, fresh.clone()).catch(() => {});
    }
    return fresh;
  } catch (err) {
    // Last-resort offline fallback for HTML navigations: serve the app shell.
    if (req.mode === 'navigate' || (req.headers.get('accept') || '').includes('text/html')) {
      const shell = await cache.match('./FloorScan_pilot_v24.html');
      if (shell) return shell;
    }
    throw err;
  }
}

async function networkFirst(req, cacheName) {
  const cache = await caches.open(cacheName);
  try {
    const fresh = await fetch(req);
    // Only cache successful basic/cors responses.
    if (fresh && (fresh.ok || fresh.type === 'opaque')) {
      cache.put(req, fresh.clone()).catch(() => {});
    }
    return fresh;
  } catch (err) {
    const cached = await cache.match(req, { ignoreSearch: true });
    if (cached) return cached;
    throw err;
  }
}

// Allow the page to ask the SW to skip-waiting on update (used by the in-page update UX).
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
