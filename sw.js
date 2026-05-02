/* FloorScan PWA service worker — v2.5.4
 *
 * Strategy:
 *   - App-shell (HTML, manifest, icons): cache-first, fall back to network.
 *   - CDN libs (SheetJS, html5-qrcode, qrcodejs): network-first, fall back to cache,
 *     so library updates land but app still boots offline.
 *   - All other GETs: pass-through (no caching) — keeps auth flows clean.
 *
 * Versioning:
 *   Bump SW_VERSION to invalidate the cache. The activate handler purges old buckets.
 *
 * v2.4.1 toevoeging:
 *   - Web Share Target POST handler op ./share-target → bestand wordt in IndexedDB
 *     "floorscan_share/inbox" gezet, redirect naar app met ?share=1.
 * v2.4.2 toevoeging:
 *   - Smarticate-QR (SPCPART) parser-fallback in app.
 *   - Tekening-paneel + formulier-velden uit UI verwijderd; data-velden in JSON gehandhaafd.
 * v2.4.3 toevoeging:
 *   - Foto-lightbox: klik op hero/thumbnail opent groot beeld met prev/volgende/delete.
 *   - Thumbnails groter (140px ipv 90px).
 *   - Projectenlijst chronologisch gesorteerd op projectnummer (oplopend).
 * v2.4.4 toevoeging:
 *   - Side-photos (voor/zijde/achter) klikbaar als 3-foto gallery in lightbox.
 *   - Lightbox-beeld groter: 98vw × 82vh max (was 95vw × 75vh).
 *   - Header-versie label dynamisch via FLOORSCAN_VERSION constante.
 *   - Lightbox titel kan ook callback (idx) zijn voor dynamische label per foto.
 * v2.5.0 toevoeging:
 *   - Volledige Gpi Group huisstijl: Sofia Sans font (Google Fonts CDN), nieuwe teal #00B3A0,
 *     gpi-black #211F26, sharp corners (radius 0px), warm grey neutrals, indigo AI-box.
 *   - Top-bar: Gpi Group logo + product-block (eyebrow "Gpi Tanks · Pilot v2.5.0" + name "FloorScan").
 *   - Cards en panels met teal top-border accent.
 *   - Cw-banner (huidige week) als donker gpi-black blok met dashed teal cirkel.
 *   - Logo-asset (logo-gpi-group.png) toegevoegd aan precache.
 * v2.5.1 toevoeging:
 *   - Nieuwe Gpi · Floorscanner brand: app-iconen (32/192/512/maskable) gegenereerd uit
 *     hero-illustratie (worker + tank + scan-beam).
 *   - Top-bar wordmark vervangen: 'logo-gpi-group.png' → 'logo-floorscanner-wordmark.png'
 *     (Gpi · Floorscanner met tagline). Naam-regel weggelaten omdat 't in wordmark zit.
 * v2.5.2 toevoeging:
 *   - Wordmark crop fix: bovenkant van "Gpi" werd afgesneden door te lage wm_top — opnieuw
 *     gegenereerd met bredere bounds (388x128 ipv 543x96).
 *   - Mobile responsive top-bar: divider en eyebrow verbergen op <700px, top-actions wrappen,
 *     sync-status compacter. Voorkomt dat knoppen over elkaar heen vallen.
 * v2.5.3 toevoeging:
 *   - App-iconen +18% gezoomd zodat scene de canvas vult (was te veel witruimte).
 *   - Top-bar: scene-icoon links toegevoegd (logo-floorscanner-scene.png) ZIJ aan zij met de
 *     wordmark. Scene-icoon is 44px op desktop, 36px op mobiel.
 * v2.5.4 toevoeging:
 *   - Iconen RGBA met transparant wit (alpha-ramp via afstand-tot-wit). Maskable houdt witte
 *     achtergrond — Android adaptive icons moeten safe-zone vullen.
 *   - Wordmark + scene-icoon ook transparent zodat ze schoon over elke achtergrond passen.
 *
 * Notes:
 *   - POSTs naar share-target worden afgevangen; alle andere POSTs gaan door.
 *   - We do NOT intercept opaque/cross-origin requests other than the explicit CDN allowlist.
 *   - We do NOT touch the File System Access API or getUserMedia paths — those are not
 *     network requests, the SW never sees them.
 */

const SW_VERSION = 'v2.5.4';
const CACHE_SHELL = `floorscan-shell-${SW_VERSION}`;
const CACHE_CDN   = `floorscan-cdn-${SW_VERSION}`;
const SHARE_INBOX_DB = 'floorscan_share';
const SHARE_INBOX_STORE = 'inbox';
const SHARE_INBOX_KEY = 'pending';

// Files that make up the offline-capable app shell.
// Paths are relative to the SW scope, which equals the directory where sw.js lives.
const SHELL_ASSETS = [
  './',
  './FloorScan_pilot_v24.html',
  './manifest.webmanifest',
  './logo-floorscanner-wordmark.png',
  './logo-floorscanner-scene.png',
  './icon-192.png',
  './icon-512.png',
  './icon-512-maskable.png',
  './icon-32.png'
];

// CDN URLs we want to cache for offline (network-first, cache-fallback).
const CDN_HOSTS = ['cdnjs.cloudflare.com', 'fonts.googleapis.com', 'fonts.gstatic.com'];

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
  const url = new URL(req.url);

  // 0. Web Share Target POST → vang JSON-bestand op, sla in IndexedDB op,
  //    redirect naar app met ?share=1 zodat de app het kan oppikken.
  if (req.method === 'POST' &&
      url.origin === self.location.origin &&
      url.pathname.endsWith('/share-target')) {
    event.respondWith(handleShareTarget(event));
    return;
  }

  // Andere POSTs passeren ongewijzigd.
  if (req.method !== 'GET') return;

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

async function handleShareTarget(event) {
  try {
    const formData = await event.request.formData();
    const files = formData.getAll('file').filter(f => f && typeof f === 'object' && f.name);
    if (files.length) {
      // Pak het eerste bestand; meerdere tegelijk niet ondersteund in deze versie.
      await idbPutShared(files[0]);
    } else {
      console.warn('[FloorScan SW] share-target POST zonder bruikbare files');
    }
  } catch (err) {
    console.warn('[FloorScan SW] share-target verwerken faalde', err);
  }
  // 303 See Other: zet POST om naar GET en navigeer naar de app.
  return Response.redirect('./FloorScan_pilot_v24.html?share=1', 303);
}

function idbPutShared(file) {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(SHARE_INBOX_DB, 1);
    req.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains(SHARE_INBOX_STORE)) {
        db.createObjectStore(SHARE_INBOX_STORE);
      }
    };
    req.onsuccess = (e) => {
      const db = e.target.result;
      const tx = db.transaction(SHARE_INBOX_STORE, 'readwrite');
      // Bewaar als plain object met content + metadata zodat het zonder Blob-reconstruct teruggelezen kan worden
      const reader = new FileReader();
      reader.onload = () => {
        try {
          tx.objectStore(SHARE_INBOX_STORE).put({
            name: file.name || 'shared.json',
            type: file.type || 'application/json',
            size: file.size || 0,
            content: reader.result, // string (text)
            ts: Date.now()
          }, SHARE_INBOX_KEY);
        } catch (err) {
          reject(err);
          return;
        }
      };
      reader.onerror = () => reject(reader.error);
      reader.readAsText(file);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    };
    req.onerror = () => reject(req.error);
  });
}

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
