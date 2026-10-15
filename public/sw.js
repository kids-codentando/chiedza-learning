/* Chiedza Learning service worker: lessons, quizzes, games and the brain keep working offline.
   The file list comes from /precache.json (built by the server), so nothing here needs editing
   when lessons or brain files change. */
const PREFIX = "chiedza-v-";
const META = "chiedza-meta";

async function setCurrent(name) { const m = await caches.open(META); await m.put("/__current", new Response(name)); }
async function getCurrent() { const m = await caches.open(META); const r = await m.match("/__current"); return r ? r.text() : null; }

async function precache() {
  const res = await fetch("/precache.json", { cache: "no-cache" });
  const { version, files } = await res.json();
  const name = PREFIX + version;
  const cache = await caches.open(name);
  // add one by one so a single missing file cannot block the whole install
  await Promise.all(files.map(f => fetch(f, { cache: "reload" }).then(r => r.ok ? cache.put(f, r) : null).catch(() => null)));
  await setCurrent(name);
  return name;
}

self.addEventListener("install", e => { e.waitUntil(precache().then(() => self.skipWaiting()).catch(() => self.skipWaiting())); });

self.addEventListener("activate", e => {
  e.waitUntil((async () => {
    const keep = await getCurrent();
    const keys = await caches.keys();
    await Promise.all(keys.filter(k => k.startsWith(PREFIX) && k !== keep).map(k => caches.delete(k)));
    await self.clients.claim();
  })());
});

async function latestCache() { return caches.open((await getCurrent()) || PREFIX + "runtime"); }

self.addEventListener("fetch", e => {
  const req = e.request, url = new URL(req.url);
  if (req.method !== "GET") return;
  if (url.origin === location.origin && (url.pathname.startsWith("/api/") || url.pathname === "/precache.json" || url.pathname === "/sw.js")) return; // always live
  e.respondWith((async () => {
    const cache = await latestCache();
    const hit = await cache.match(req, { ignoreSearch: false }) || (req.mode === "navigate" ? await cache.match("/") : null);
    const net = fetch(req).then(r => { if (r && r.ok && (url.origin === location.origin || r.type === "cors")) cache.put(req, r.clone()); return r; }).catch(() => null);
    if (hit) { e.waitUntil(net); return hit; }          // instant from the device, refresh in the background
    const r = await net;
    return r || new Response("You are offline and this page is not saved yet.", { status: 503, headers: { "Content-Type": "text/plain" } });
  })());
});
