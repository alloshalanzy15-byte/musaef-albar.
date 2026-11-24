const CACHE_NAME = "musaef-albar-v2";

const APP_FILES = [
  "./",
  "./index.html",
  "./manifest.json",
  "./css/style.css",
  "./js/app.js",
  "./js/firstaid.js",
  "./js/wildlife.js",
  "./icons/icon-192.png",
  "./icons/icon-512.png",

  "./images/horned-viper.jpg",
  "./images/saw-scaled-viper.jpg",
  "./images/cobra.jpg",
  "./images/non-venomous-snake.jpg",
  "./images/scorpion.jpg",
  "./images/ushar.jpg",
  "./images/oleander.jpg",
  "./images/harmal.jpg",
  "./images/henbane.jpg"
];

self.addEventListener("install", event => {
  event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(APP_FILES)));
  self.skipWaiting();
});
self.addEventListener("activate", event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key)))));
  self.clients.claim();
});
self.addEventListener("fetch", event => {
  if (event.request.method !== "GET") return;
  event.respondWith(caches.match(event.request).then(cached => cached || fetch(event.request).then(response => {
    const copy = response.clone();
    caches.open(CACHE_NAME).then(cache => cache.put(event.request, copy));
    return response;
  }).catch(() => caches.match("./index.html"))));
});