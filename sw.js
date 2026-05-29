const CACHE = "exam-buddy-v1";
const SHELL = [
  "/",
  "/exam-buddy.html",
  "/manifest.webmanifest",
  "/assets/icon.svg",
  "/assets/icon-512.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(SHELL)).then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  if (request.method !== "GET") return;
  if (url.pathname.startsWith("/api/")) return;
  if (url.hostname.includes("supabase.co")) return;

  if (url.pathname === "/" || url.pathname.endsWith("exam-buddy.html")) {
    event.respondWith(
      fetch(request)
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE).then((cache) => cache.put("/exam-buddy.html", copy));
          return res;
        })
        .catch(() => caches.match("/exam-buddy.html"))
    );
    return;
  }

  if (SHELL.some((path) => url.pathname === path || url.pathname.endsWith(path.replace("/", "")))) {
    event.respondWith(
      caches.match(request).then((cached) => cached || fetch(request))
    );
  }
});
