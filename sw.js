// Cache hors connexion : l'appli et les fiches restent disponibles en forêt.
const VERSION = "champiverif-v1";
const FICHIERS = ["./", "index.html", "style.css", "app.js", "especes.js", "manifest.webmanifest", "icon.svg",
  "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css", "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(VERSION).then((c) => c.addAll(FICHIERS)).then(() => self.skipWaiting()));
});
self.addEventListener("activate", (e) => {
  e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== VERSION).map((k) => caches.delete(k))))
    .then(() => self.clients.claim()));
});
self.addEventListener("fetch", (e) => {
  if (e.request.method !== "GET" || e.request.url.includes("tile.openstreetmap.org")) return;
  // Réseau d'abord (pour recevoir les mises à jour), cache si pas de réseau
  e.respondWith(fetch(e.request).then((r) => {
    const copie = r.clone();
    caches.open(VERSION).then((c) => c.put(e.request, copie));
    return r;
  }).catch(() => caches.match(e.request)));
});
