/**
 * Service Worker — enables full offline use after first visit.
 *
 * Strategy:
 *   - App shell (HTML, JS, CSS): Network-first, cache fallback.
 *     On every successful navigation/asset fetch, we update the cache.
 *     When offline, we serve from cache.
 *   - Sample files (/samples/salamander/...): Cache-first, network fallback.
 *     Samples are large and never change, so cache-first is optimal.
 */

const APP_CACHE = "octype-app-v1";
const SAMPLE_CACHE = "octype-samples-v1";

/** App shell URLs to precache on install for instant offline. */
const PRECACHE_URLS = ["/"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(APP_CACHE)
      .then((cache) => cache.addAll(PRECACHE_URLS))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    Promise.all([
      self.clients.claim(),
      // Clean up old cache versions.
      caches.keys().then((keys) =>
        Promise.all(
          keys
            .filter(
              (k) =>
                k.startsWith("octype-") &&
                k !== APP_CACHE &&
                k !== SAMPLE_CACHE,
            )
            .map((k) => caches.delete(k)),
        ),
      ),
    ]),
  );
});

self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);

  // Sample files — cache-first.
  if (url.pathname.startsWith("/samples/salamander/")) {
    event.respondWith(cacheFirst(event.request, SAMPLE_CACHE));
    return;
  }

  // Same-origin app requests (HTML, JS, CSS) — network-first with cache fallback.
  if (url.origin === self.location.origin) {
    event.respondWith(networkFirst(event.request, APP_CACHE));
    return;
  }

  // External requests — pass through.
});

async function cacheFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  if (cached) return cached;

  try {
    const response = await fetch(request);
    if (response.ok) {
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    return new Response("Offline — sample not cached", { status: 503 });
  }
}

async function networkFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  try {
    const response = await fetch(request);
    if (response.ok && request.method === "GET") {
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    const cached = await cache.match(request);
    if (cached) return cached;
    // For navigation requests, try serving the cached root page.
    if (request.mode === "navigate") {
      const fallback = await cache.match("/");
      if (fallback) return fallback;
    }
    return new Response("Offline", { status: 503 });
  }
}
