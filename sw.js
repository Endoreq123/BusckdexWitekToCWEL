/* ============================================================
   BuseDex Kielce — sw.js  (Service Worker)
   Strategia: cache-first dla plików aplikacji,
              network-first dla map tiles.
   ============================================================ */

var CACHE  = "busedex-v1";
var ASSETS = [
  "/",
  "/index.html",
  "/viewer.html",
  "/css/style.css",
  "/js/catalog.js",
  "/js/render.js",
  "/js/app.js",
  "/js/badges.js",
  "/js/map.js",
  "/js/history.js",
  "/js/stats.js",
  "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js",
  "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
];

self.addEventListener("install", function(e) {
  e.waitUntil(
    caches.open(CACHE).then(function(c) {
      return Promise.allSettled(
        ASSETS.map(function(url) {
          return c.add(url).catch(function() {/* ignoruj błędy cdn */});
        })
      );
    })
  );
  self.skipWaiting();
});

self.addEventListener("activate", function(e) {
  e.waitUntil(
    caches.keys().then(function(keys) {
      return Promise.all(
        keys.filter(function(k) { return k !== CACHE; })
            .map(function(k) { return caches.delete(k); })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener("fetch", function(e) {
  var url = e.request.url;

  // tile mapy — network-first (muszą być świeże)
  if (url.includes("tile.openstreetmap") || url.includes("tiles.")) {
    e.respondWith(
      fetch(e.request).catch(function() {
        return caches.match(e.request);
      })
    );
    return;
  }

  // reszta — cache-first
  e.respondWith(
    caches.match(e.request).then(function(cached) {
      if (cached) return cached;
      return fetch(e.request).then(function(response) {
        if (!response || response.status !== 200) return response;
        var clone = response.clone();
        caches.open(CACHE).then(function(c) { c.put(e.request, clone); });
        return response;
      });
    })
  );
});
