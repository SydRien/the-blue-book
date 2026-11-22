/* The Blue Book — offline service worker.
 *
 * Keeps a copy of the app itself (HTML, JS, CSS, fonts, icons) on the device
 * so it opens with no internet, in the browser and in the Mac app.
 * Documents are not stored here: they live in the app's local storage and
 * sync to Supabase through the sync queue (lib/storage/syncQueue.ts).
 *
 * Never cached: /api/* (AI companion) and anything on another origin
 * (Supabase, OpenAI).
 */

const VERSION = "v1";
const SHELL_CACHE = `bb-shell-${VERSION}`;
const STATIC_CACHE = `bb-static-${VERSION}`;
const ASSET_CACHE = `bb-assets-${VERSION}`;
const KNOWN_CACHES = [SHELL_CACHE, STATIC_CACHE, ASSET_CACHE];

const SHELL_URL = "/";
const PRECACHE = [
  SHELL_URL,
  "/manifest.webmanifest",
  "/icon.svg",
  "/favicon.ico",
  "/brand/blue-book-icon-192.png",
  "/brand/blue-book-icon-512.png",
  "/fonts/CourierPrime-Regular.ttf",
  "/fonts/CourierPrime-Bold.ttf",
  "/fonts/CourierPrime-Italic.ttf",
  "/fonts/CourierPrime-BoldItalic.ttf",
];

const NAVIGATION_TIMEOUT_MS = 4000;
const MAX_STATIC_ENTRIES = 400;

self.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(SHELL_CACHE);
      // Cache what we can; one missing file must not block offline support.
      await Promise.all(
        PRECACHE.map((url) =>
          cache.add(new Request(url, { cache: "reload" })).catch(() => {}),
        ),
      );
      await self.skipWaiting();
    })(),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const names = await caches.keys();
      await Promise.all(
        names
          .filter((name) => name.startsWith("bb-") && !KNOWN_CACHES.includes(name))
          .map((name) => caches.delete(name)),
      );
      await self.clients.claim();
    })(),
  );
});

// The page sends the URLs it already loaded (before this worker took control)
// so the very first visit is enough to work offline afterwards.
self.addEventListener("message", (event) => {
  const data = event.data;
  if (!data || data.type !== "CACHE_URLS" || !Array.isArray(data.urls)) {
    return;
  }
  event.waitUntil(
    (async () => {
      const staticCache = await caches.open(STATIC_CACHE);
      const assetCache = await caches.open(ASSET_CACHE);
      await Promise.all(
        data.urls.map(async (raw) => {
          try {
            const url = new URL(raw, self.location.origin);
            if (url.origin !== self.location.origin || isNeverCached(url)) {
              return;
            }
            if (url.pathname === SHELL_URL) {
              // The page itself lives in the shell cache.
              const shell = await caches.open(SHELL_CACHE);
              const fresh = await fetch(url.href, { credentials: "same-origin" });
              if (fresh.ok) await shell.put(SHELL_URL, fresh);
              return;
            }
            const target = isImmutableStatic(url) ? staticCache : assetCache;
            if (await target.match(url.href)) {
              return;
            }
            const response = await fetch(url.href, { credentials: "same-origin" });
            if (response.ok) {
              await target.put(url.href, response);
            }
          } catch {
            // ignore single failures
          }
        }),
      );
      await trimCache(STATIC_CACHE, MAX_STATIC_ENTRIES);
    })(),
  );
});

function isNeverCached(url) {
  return url.pathname.startsWith("/api/") || url.pathname === "/sw.js";
}

function isImmutableStatic(url) {
  return url.pathname.startsWith("/_next/static/");
}

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") {
    return;
  }

  const url = new URL(request.url);
  if (url.origin !== self.location.origin || isNeverCached(url)) {
    return; // Supabase, OpenAI, API routes: always straight to the network.
  }

  if (request.mode === "navigate") {
    event.respondWith(handleNavigation(event));
    return;
  }

  if (isImmutableStatic(url)) {
    event.respondWith(cacheFirst(request, STATIC_CACHE));
    return;
  }

  event.respondWith(staleWhileRevalidate(event, ASSET_CACHE));
});

/** Network first (so new deploys show up), cached app when offline or slow. */
async function handleNavigation(event) {
  const cache = await caches.open(SHELL_CACHE);
  try {
    const response = await withTimeout(fetch(event.request), NAVIGATION_TIMEOUT_MS);
    if (response.ok && new URL(event.request.url).pathname === SHELL_URL) {
      event.waitUntil(cache.put(SHELL_URL, response.clone()));
    }
    return response;
  } catch {
    const cached =
      (await cache.match(event.request, { ignoreSearch: true })) ||
      (await cache.match(SHELL_URL));
    if (cached) {
      return cached;
    }
    return new Response(OFFLINE_HTML, {
      status: 503,
      headers: { "Content-Type": "text/html; charset=utf-8" },
    });
  }
}

async function cacheFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  if (cached) {
    return cached;
  }
  const response = await fetch(request);
  if (response.ok) {
    cache.put(request, response.clone()).then(() => trimCache(cacheName, MAX_STATIC_ENTRIES));
  }
  return response;
}

async function staleWhileRevalidate(event, cacheName) {
  const cache = await caches.open(cacheName);
  const shellCache = await caches.open(SHELL_CACHE);
  const cached =
    (await cache.match(event.request)) || (await shellCache.match(event.request));
  const network = fetch(event.request)
    .then((response) => {
      if (response.ok) {
        event.waitUntil(cache.put(event.request, response.clone()));
      }
      return response;
    })
    .catch(() => null);

  if (cached) {
    event.waitUntil(network);
    return cached;
  }
  const response = await network;
  return response || new Response("", { status: 504 });
}

function withTimeout(promise, ms) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error("timeout")), ms);
    promise.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (error) => {
        clearTimeout(timer);
        reject(error);
      },
    );
  });
}

async function trimCache(cacheName, maxEntries) {
  const cache = await caches.open(cacheName);
  const keys = await cache.keys();
  if (keys.length <= maxEntries) {
    return;
  }
  // Oldest entries first (insertion order).
  await Promise.all(keys.slice(0, keys.length - maxEntries).map((key) => cache.delete(key)));
}

const OFFLINE_HTML = `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>The Blue Book</title>
<meta name="viewport" content="width=device-width,initial-scale=1">
<style>html,body{height:100%;margin:0}body{display:flex;align-items:center;justify-content:center;background:#111;color:#f2f0eb;font-family:-apple-system,BlinkMacSystemFont,sans-serif}
.c{text-align:center;max-width:360px;padding:24px}p{color:#8a8a90;font-size:13px;line-height:1.6}button{background:#1a1a1c;color:#f2f0eb;border:1px solid #2e2e34;border-radius:4px;padding:8px 18px;cursor:pointer}</style></head>
<body><div class="c"><svg viewBox="0 0 24 32" width="36" height="48"><path fill="#34507e" d="M3 0H21A3 3 0 0 1 24 3V29A3 3 0 0 1 21 32H19.6V14L17.3 17.4L15 14V32H3A3 3 0 0 1 0 29V3A3 3 0 0 1 3 0Z"/></svg>
<p>The Blue Book hasn't been saved to this device yet. Open it once with an internet connection and it will work offline after that.</p>
<button onclick="location.reload()">Try again</button></div></body></html>`;
