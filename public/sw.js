const CACHE_NAME = "pulse-v1";
const STATIC_PATTERNS = [
  /^\/_next\/static\//,
  /^\/fonts\//,
  /^\/icons\//,
  /\.(?:png|jpg|jpeg|svg|gif|webp|ico|woff2?)$/,
];
const SKIP_PATTERNS = [
  /^\/api\//,
  /\/_next\/webpack-hmr/,
];

function isStatic(url) {
  return STATIC_PATTERNS.some((p) => p.test(url));
}

function shouldSkip(url) {
  return SKIP_PATTERNS.some((p) => p.test(url));
}

self.addEventListener("install", (event) => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))
        )
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  if (shouldSkip(url.pathname)) return;

  if (isStatic(url.pathname)) {
    // Cache-first
    event.respondWith(
      caches.open(CACHE_NAME).then((cache) =>
        cache.match(request).then(
          (cached) =>
            cached ||
            fetch(request).then((res) => {
              if (res.ok) cache.put(request, res.clone());
              return res;
            })
        )
      )
    );
  } else {
    // Network-first with cache fallback
    event.respondWith(
      fetch(request)
        .then((res) => {
          if (res.ok) {
            caches
              .open(CACHE_NAME)
              .then((cache) => cache.put(request, res.clone()));
          }
          return res;
        })
        .catch(() => caches.match(request))
    );
  }
});
