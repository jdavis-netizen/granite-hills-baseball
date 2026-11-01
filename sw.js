// Granite Hills Baseball service worker: pages and files come from the network first,
// and the last copy seen is used only when there is no connection (at the field, for example).
var CACHE = 'gh-v1';
var START = ['/', '/schedule', '/css/style.css', '/js/main.js', '/js/games.js'];

self.addEventListener('install', function (e) {
  e.waitUntil(caches.open(CACHE).then(function (c) { return c.addAll(START); }).catch(function () {}).then(function () { return self.skipWaiting(); }));
});

self.addEventListener('activate', function (e) {
  e.waitUntil(caches.keys().then(function (keys) {
    return Promise.all(keys.filter(function (k) { return k !== CACHE; }).map(function (k) { return caches.delete(k); }));
  }).then(function () { return self.clients.claim(); }));
});

self.addEventListener('fetch', function (e) {
  var req = e.request;
  var url = new URL(req.url);
  // Forms, other sites and video are left alone.
  if (req.method !== 'GET' || url.origin !== location.origin || /\.mp4$/.test(url.pathname)) return;
  e.respondWith(fetch(req).then(function (res) {
    if (res.ok) {
      var copy = res.clone();
      caches.open(CACHE).then(function (c) { c.put(req, copy); });
    }
    return res;
  }).catch(function () {
    return caches.match(req, { ignoreSearch: true }).then(function (hit) {
      return hit || (req.mode === 'navigate' ? caches.match('/schedule') : Response.error());
    });
  }));
});
