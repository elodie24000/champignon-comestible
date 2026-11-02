// Cache hors connexion : l'appli et les fiches restent disponibles en forêt.
const VERSION = "champiverif-v7";
const FICHIERS = ["./", "index.html", "style.css", "app.js", "ia.js", "especes.js", "manifest.webmanifest", "icon.svg", "assets/cepe.svg", "assets/fond.svg", "assets/icone-192.png", "assets/icone-512.png",
  "vendor/leaflet/leaflet.css", "vendor/leaflet/leaflet.js"];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(VERSION).then((c) => c.addAll(FICHIERS)).then(() => self.skipWaiting()));
});
self.addEventListener("activate", (e) => {
  e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== VERSION).map((k) => caches.delete(k))))
    .then(() => self.clients.claim()));
});
self.addEventListener("fetch", (e) => {
  if (e.request.method !== "GET" || e.request.url.includes("tile.openstreetmap.org") || e.request.url.includes("supabase.co")) return;
  // Fichiers lourds (modèle IA, moteur) : cache d'abord, pour ne les télécharger qu'une fois
  if (/\/(modele|vendor)\//.test(e.request.url)) {
    e.respondWith(caches.match(e.request).then((m) => m || fetch(e.request).then((r) => {
      if (r.ok) { const copie = r.clone(); caches.open(VERSION).then((c) => c.put(e.request, copie)); }
      return r;
    })));
    return;
  }
  // Réseau d'abord (pour recevoir les mises à jour), cache si pas de réseau
  e.respondWith(fetch(e.request).then((r) => {
    const copie = r.clone();
    caches.open(VERSION).then((c) => c.put(e.request, copie));
    return r;
  }).catch(() => caches.match(e.request)));
});
