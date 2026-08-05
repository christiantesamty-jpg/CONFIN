const CACHE = "confin-v6-0-2";
const ASSETS = [
  "./",
  "./index.html",
  "./styles.css",
  "./manifest.webmanifest",
  "./version.json",
  "./src/app.js",
  "./src/core/constants.js",
  "./src/core/storage.js",
  "./src/core/store.js",
  "./src/core/format.js",
  "./src/ui/shell.js",
  "./src/ui/modal.js",
  "./src/ui/toast.js",
  "./src/modules/pages.js",
  "./src/modules/actions.js",
  "./src/modules/security.js",
  "./src/modules/updates.js",
  "./icons/apple-touch-icon.png",
  "./icons/icon-192.png",
  "./icons/icon-512.png"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE)
      .then((cache) => cache.addAll(ASSETS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        const copy = response.clone();
        caches.open(CACHE).then((cache) => cache.put(event.request, copy));
        return response;
      })
      .catch(() => caches.match(event.request).then((response) => response || caches.match("./index.html")))
  );
});
