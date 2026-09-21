/* GoPoli PWA — cache de app shell únicamente.
 * NO cachear respuestas de API autenticadas ni datos de viajes en vivo.
 */
const CACHE_NAME = "gopoli-shell-v2";
const SHELL_URLS = [
  "/",
  "/manifest.webmanifest",
  "/icons/Icon-192.png",
  "/icons/Icon-512.png",
  "/icons/Icon-maskable-192.png",
  "/icons/Icon-maskable-512.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(SHELL_URLS)).then(() => {
      return self.skipWaiting();
    }),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key)),
      ),
    ).then(() => self.clients.claim()),
  );
});

function isApiOrLiveRequest(url) {
  const path = url.pathname;
  if (
    path.startsWith("/usuario") ||
    path.startsWith("/servicio") ||
    path.startsWith("/servicios") ||
    path.startsWith("/login") ||
    path.startsWith("/register") ||
    path.startsWith("/carreras") ||
    path.startsWith("/ubicaciones")
  ) {
    return true;
  }
  // Peticiones cross-origin al backend (NEXT_PUBLIC_API_URL)
  if (url.origin !== self.location.origin) {
    return true;
  }
  return false;
}

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;

  let url;
  try {
    url = new URL(req.url);
  } catch {
    return;
  }

  if (isApiOrLiveRequest(url)) {
    return; // network only — nunca cachear API / viajes
  }

  // Next reescribe estos archivos en cada cambio de env; cache-first dejaba
  // la URL vieja del backend pegada en el navegador.
  if (url.pathname.startsWith("/_next/")) {
    return;
  }

  // Navegación / shell: network-first con fallback a cache
  if (req.mode === "navigate") {
    event.respondWith(
      fetch(req)
        .then((res) => {
          const copy = res.clone();
          void caches.open(CACHE_NAME).then((cache) => cache.put(req, copy));
          return res;
        })
        .catch(() => caches.match(req).then((cached) => cached || caches.match("/"))),
    );
    return;
  }

  // Assets estáticos del origen: cache-first
  event.respondWith(
    caches.match(req).then((cached) => {
      if (cached) return cached;
      return fetch(req).then((res) => {
        if (res.ok && url.origin === self.location.origin) {
          const copy = res.clone();
          void caches.open(CACHE_NAME).then((cache) => cache.put(req, copy));
        }
        return res;
      });
    }),
  );
});
