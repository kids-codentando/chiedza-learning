/* Chiedza Learning service worker: installable + works offline.
   Pages and files: network first, fall back to cache. Static assets are cached as they are used.
   API calls and non-GET requests are never cached, except the taught-answers file. */
const CACHE = "chiedza-v4";
const CORE = ["/", "/index.html", "/css/styles.css", "/manifest.webmanifest", "/assets/icon.png", "/assets/favicon.png",
  "/js/qrcode.js", "/js/data.js", "/js/extra-core.js", "/js/extra-ecd.js", "/js/extra-infant.js", "/js/extra-junior.js",
  "/js/extra-courses.js", "/js/extra-final.js", "/js/app.js", "/js/brain.js", "/js/brain-projects.js", "/js/reasoning.js", "/js/chiedza-ai.js",
  "/brain/manifest.json", "/brain/identity.md", "/brain/safety.json", "/brain/skills/skills.json",
  "/brain/knowledge/zimbabwe.json", "/brain/knowledge/study-skills.json", "/brain/knowledge/science-basics.json",
  "/brain/knowledge/maths-help.json", "/brain/knowledge/life-skills.json", "/brain/knowledge/glossary.json",
  "/brain/knowledge/fun.json", "/brain/knowledge/maths-more.json", "/brain/knowledge/english-help.json",
  "/brain/knowledge/science-more.json", "/brain/knowledge/social-agri.json", "/brain/knowledge/everyone.json", "/brain/knowledge/world.json", "/brain/knowledge/tech-digital.json", "/brain/knowledge/health.json", "/brain/knowledge/life-work.json", "/brain/knowledge/about.json",
  "/brain/languages/shona.json", "/brain/languages/ndebele.json", "/brain/projects/templates.json",
  "/brain/reasoning/reasoning.json", "/brain/reasoning/logic.json", "/brain/reasoning/causes.json", "/brain/reasoning/compare.json"];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE).then(c => Promise.allSettled(CORE.map(u => c.add(u)))).then(() => self.skipWaiting()));
});
self.addEventListener("activate", e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener("fetch", e => {
  const req = e.request, url = new URL(req.url);
  if (req.method !== "GET" || url.origin !== location.origin) return;
  if (url.pathname.startsWith("/api/") && url.pathname !== "/api/brain/trained") return;
  e.respondWith(
    fetch(req).then(res => {
      if (res && res.ok) { const copy = res.clone(); caches.open(CACHE).then(c => c.put(req, copy)); }
      return res;
    }).catch(() => caches.match(req).then(r => r || (req.mode === "navigate" ? caches.match("/index.html") : Response.error())))
  );
});
