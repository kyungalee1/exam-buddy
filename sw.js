const CACHE = "exam-buddy-v3";
const SHELL = [
  "/exam-buddy.html",
  "/manifest.webmanifest",
  "/assets/icon-180.png",
  "/assets/icon-192.png",
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
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.pathname.startsWith("/api/")) return;
  if (url.hostname.includes("supabase.co")) return;

  const isAppShell =
    url.pathname === "/" ||
    url.pathname === "/exam-buddy.html" ||
    SHELL.includes(url.pathname);

  if (isAppShell) {
    event.respondWith(
      fetch(request)
        .then((res) => {
          if (res.ok && (url.pathname === "/" || url.pathname.endsWith("exam-buddy.html"))) {
            const copy = res.clone();
            caches.open(CACHE).then((cache) => cache.put("/exam-buddy.html", copy));
          }
          return res;
        })
        .catch(() => caches.match("/exam-buddy.html"))
    );
  }
});
