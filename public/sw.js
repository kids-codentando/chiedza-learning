/* Chiedza AI service worker: network first, so brain edits show up at once; cached copy when offline. */
const CACHE = "chiedza-ai-v2";
const CORE = ["/", "/index.html", "/css/studio.css", "/js/brain.js", "/js/reasoning.js", "/js/sitebuilder.js", "/js/studio.js",
  "/brain/manifest.json", "/brain/identity.md", "/brain/safety.json",
  "/brain/reasoning/reasoning.json", "/brain/reasoning/logic.json", "/brain/reasoning/causes.json", "/brain/reasoning/compare.json",
  "/brain/reasoning/site-rules.json", "/brain/reasoning/website.json", "/brain/reasoning/website-more.json"];
self.addEventListener("install", e => { e.waitUntil(caches.open(CACHE).then(c => Promise.allSettled(CORE.map(u => c.add(u)))).then(() => self.skipWaiting())); });
self.addEventListener("activate", e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener("fetch", e => {
  const req = e.request, url = new URL(req.url);
  if (req.method !== "GET" || url.origin !== location.origin || url.pathname.startsWith("/api/")) return;
  e.respondWith(fetch(req).then(res => { if (res.ok) { const copy = res.clone(); caches.open(CACHE).then(c => c.put(req, copy)); } return res; }).catch(() => caches.match(req).then(r => r || caches.match("/index.html"))));
});
