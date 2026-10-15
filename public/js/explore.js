/* ============================================================
   CHIEDZA EXPLORE - safe doors to Google, YouTube and friends
   - The list of sites lives in brain/links.json (edit it, no code).
   - Every link to another website asks a grown-up first.
   - Google searches use SafeSearch. YouTube searches add "for kids".
   - If the server has a YouTube key, kid-safe videos play right
     inside Chiedza (strict safe search, embeddable only).
   Loaded after app.js. Exposes window.FXExplore.
   ============================================================ */
(function () {
  const FALLBACK = [
    { id: "google", name: "Google", emoji: "🔍", url: "https://www.google.com/", search: "https://www.google.com/search?q={q}&safe=active", words: ["google"], about: "Search the web (SafeSearch is on)" },
    { id: "youtube", name: "YouTube", emoji: "▶️", url: "https://www.youtube.com/", search: "https://www.youtube.com/results?search_query={q}+for+kids", words: ["youtube", "video", "videos"], about: "Watch videos. We add “for kids” to every search" }
  ];
  let SITES = FALLBACK, loaded = null;
  function load() {
    if (!loaded) loaded = fetch("brain/links.json").then(r => r.json()).then(j => { if (j && Array.isArray(j.sites) && j.sites.length) SITES = j.sites.filter(s => /^https:\/\//.test(s.url)); }).catch(() => {});
    return loaded;
  }
  const site = id => SITES.find(s => s.id === id);
  const safeText = t => String(t || "").replace(/\s+/g, " ").trim().slice(0, 100);
  function urlFor(id, q) {
    const s = site(id); if (!s) return null;
    q = safeText(q);
    return q && s.search ? s.search.replace("{q}", encodeURIComponent(q)) : s.url;
  }
  /* is the question allowed? uses the same safety rules as the chat */
  function blocked(q) {
    const B = window.ChiedzaBrain; if (!B || !B.safetyCheck) return null;
    return B.safetyCheck(q);
  }

  /* ---------- grown-up gate ---------- */
  const OK_KEY = "chiedza_ext_ok", OK_MS = 15 * 60 * 1000;
  const approved = () => Date.now() - Number(sessionStorage.getItem(OK_KEY) || 0) < OK_MS;
  function go_(url) { window.open(url, "_blank", "noopener,noreferrer"); }
  function open(url, name) {
    if (!/^https:\/\//.test(url)) return;
    if (approved()) return go_(url);
    const a = 6 + Math.floor(Math.random() * 6), b = 6 + Math.floor(Math.random() * 6);
    const o = document.createElement("div"); o.className = "modal-overlay"; o.id = "fxGateModal";
    o.innerHTML = `<div class="modal"><h2>👪 Ask a grown-up first</h2>
      <p class="muted" style="margin-bottom:14px">You are about to leave Chiedza Learning to visit <strong>${esc(name || new URL(url).hostname)}</strong>. Websites outside Chiedza are not checked by us, so a grown-up should be with you.</p>
      <p style="font-weight:800;margin-bottom:8px">Grown-up question: ${a} × ${b} = ?</p>
      <input id="fxGateIn" class="fx-input" type="number" inputmode="numeric" placeholder="Answer" />
      <div class="flex gap" style="justify-content:flex-end;margin-top:16px"><button class="btn btn-ghost" id="fxGateNo">Stay here</button><button class="btn btn-primary" id="fxGateYes">Continue →</button></div></div>`;
    document.body.appendChild(o);
    const close = () => o.remove(), inp = o.querySelector("#fxGateIn");
    const yes = () => { if (parseInt(inp.value, 10) === a * b) { sessionStorage.setItem(OK_KEY, String(Date.now())); close(); go_(url); } else { inp.value = ""; inp.placeholder = "Not quite, try again"; inp.focus(); } };
    o.querySelector("#fxGateYes").onclick = yes; o.querySelector("#fxGateNo").onclick = close;
    inp.onkeydown = e => { if (e.key === "Enter") yes(); if (e.key === "Escape") close(); };
    o.addEventListener("click", e => { if (e.target === o) close(); });
    setTimeout(() => inp.focus(), 80);
  }
  /* any <a data-ext="https://..."> anywhere (chat, pages) goes through the gate */
  document.addEventListener("click", e => {
    const a = e.target.closest && e.target.closest("a[data-ext]"); if (!a) return;
    e.preventDefault(); open(a.getAttribute("data-ext"), a.getAttribute("data-name"));
  });

  /* ---------- videos inside Chiedza (needs YOUTUBE_API_KEY on the server) ---------- */
  let ytOn = null;
  async function videosEnabled() {
    if (ytOn !== null) return ytOn;
    if (!/^https?:/.test(location.protocol)) return (ytOn = false);
    try { const r = await fetch("/api/brain/videos-status", { cache: "no-cache" }); ytOn = r.ok && !!(await r.json()).enabled; } catch (e) { ytOn = false; }
    return ytOn;
  }
  async function findVideos(q) {
    if (!(await videosEnabled())) return null;
    try { const r = await fetch("/api/brain/videos?q=" + encodeURIComponent(safeText(q))); if (!r.ok) return []; const j = await r.json(); return j.videos || []; } catch (e) { return []; }
  }
  function videoHtml(list) {
    return list.map(v => `<div class="fx-video"><iframe loading="lazy" src="https://www.youtube-nocookie.com/embed/${encodeURIComponent(v.id)}?rel=0&modestbranding=1" title="${esc(v.title)}" allow="encrypted-media; picture-in-picture" allowfullscreen referrerpolicy="strict-origin-when-cross-origin"></iframe><div class="fx-video-t">${esc(v.title)}<br><small class="muted">${esc(v.channel)}</small></div></div>`).join("");
  }

  /* ---------- link cards (used by the chat and the Explore page) ---------- */
  function linkHtml(id, q, label) {
    const s = site(id); if (!s) return "";
    const u = urlFor(id, q), text = label || (q ? `${s.emoji} ${s.name}: “${safeText(q)}”` : `${s.emoji} Open ${s.name}`);
    return `<a class="cai-link" href="${esc(u)}" data-ext="${esc(u)}" data-name="${esc(s.name)}" rel="noopener noreferrer">${esc(text)} ↗</a>`;
  }

  /* ---------- Explore page ---------- */
  function render(app) {
    app.innerHTML = `
    ${topbar("")}
    <div class="page-head"><button class="back-btn" onclick="go('#/')">←</button><div class="titles"><h1>🌍 Explore the Web</h1><p>Google, YouTube and more. A grown-up question keeps you safe when you leave Chiedza.</p></div></div>
    <section class="section">
      <div class="fx-card"><h3>🔍 Search</h3>
        <form class="fx-search" onsubmit="return FXExplore.submit(event)">
          <input id="fxQ" class="fx-input" type="text" maxlength="100" placeholder="What do you want to find out?" autocomplete="off" />
          <button class="btn btn-primary" data-t="google" type="submit">🔍 Google</button>
          <button class="btn btn-ghost" data-t="youtube" type="submit">▶️ YouTube</button>
          <button class="btn btn-ghost" data-t="wikipedia" type="submit">📖 Wikipedia</button>
        </form>
        <p class="muted" style="font-size:13px;margin-top:10px">Google SafeSearch is switched on and YouTube searches get “for kids” added. Some words are for grown-ups to look up and we will not search them.</p>
        <div id="fxVideos"></div>
      </div>
      <div class="section-head" style="margin-top:24px"><h2>⭐ Good places to learn</h2></div>
      <div class="game-grid">${SITES.map(s => `<a class="game-card" href="${esc(s.url)}" data-ext="${esc(s.url)}" data-name="${esc(s.name)}" style="text-decoration:none;color:inherit"><div class="g-emoji">${s.emoji}</div><h4>${esc(s.name)} ↗</h4><p>${esc(s.about || "")}</p></a>`).join("")}</div>
    </section>${footer()}`;
  }
  async function submit(e) {
    e.preventDefault();
    const q = safeText(document.getElementById("fxQ").value), t = (e.submitter && e.submitter.dataset.t) || "google";
    if (q.length < 2) { if (window.showToast) showToast("Type what you want to find first."); return false; }
    const bad = blocked(q);
    if (bad) { document.getElementById("fxVideos").innerHTML = `<div class="fx-hint" style="display:block">${bad.html}</div>`; return false; }
    if (t === "youtube") { // watch inside Chiedza when we can, otherwise open YouTube
      const box = document.getElementById("fxVideos"), list = await findVideos(q);
      if (list && list.length) { box.innerHTML = `<div class="fx-videos">${videoHtml(list)}</div><p class="muted" style="font-size:13px">${linkHtml("youtube", q, "See more on YouTube")}</p>`; return false; }
    }
    open(urlFor(t, q), (site(t) || {}).name);
    return false;
  }

  /* ---------- chat intents: "google dinosaurs", "videos about volcanoes", "open khan academy" ---------- */
  async function intent(text) {
    await load();
    const raw = String(text || "").trim(), t = raw.toLowerCase().replace(/[?!.]+$/g, "");
    let m;
    // "open youtube", "take me to khan academy", "go to google maps"
    if ((m = t.match(/^(?:please )?(?:open|go to|take me to|visit|show me|launch)\s+(?:the )?(.{2,30})$/))) {
      const name = m[1].replace(/\.com$/, "").trim();
      const s = SITES.slice().sort((a, b) => b.name.length - a.name.length).find(x => x.name.toLowerCase() === name || (x.words || []).includes(name) || x.id === name);
      if (s) return { html: `${s.emoji} <strong>${esc(s.name)}</strong> - ${esc(s.about || "")}.<br><small>A grown-up will be asked to say yes before it opens.</small>`, links: null, extra: linkHtml(s.id, ""), chips: ["Quiz me", "Fun fact"] };
    }
    // videos: "find videos about volcanoes", "youtube volcanoes", "show me a video on photosynthesis"
    if ((m = t.match(/^(?:please )?(?:(?:find|show|search|get|look for|watch|play)(?: me)?(?: some| a| the)?\s+)?(?:videos?|youtube|youtube videos?)(?: (?:about|on|of|for|to learn))?\s*(.{2,100})$/)) || (m = t.match(/^(?:search|find|look)(?: for)? (.{2,100}) (?:on|in) youtube$/))) {
      const q = m[1].replace(/^(about|on|of|for)\s+/, "").trim();
      if (q.length >= 2) {
        const list = await findVideos(q);
        const link = linkHtml("youtube", q);
        if (list && list.length) return { html: `▶️ Here are some videos about <strong>${esc(q)}</strong>:${`<div class="fx-videos fx-videos-chat">${videoHtml(list)}</div>`}`, raw: true, extra: link, chips: ["Quiz me", "Fun fact"] };
        return { html: `▶️ I can send you to YouTube to watch videos about <strong>${esc(q)}</strong>. I add “for kids” to the search.<br><small>A grown-up will be asked to say yes first.</small>`, extra: link, chips: ["Quiz me", "Fun fact"] };
      }
    }
    // google: "google volcanoes", "search google for dinosaurs", "search for X on google"
    if ((m = t.match(/^(?:please )?(?:(?:search|look up|look for|find)(?: on)? )?google (?!maps?\b|translate\b|classroom\b)(?:for |about )?(.{2,100})$/)) || (m = t.match(/^(?:search|look up|look for|find)(?: for)? (.{2,100}) (?:on|in|with) google$/))) {
      const q = m[1].trim();
      return { html: `🔍 I can open a Google search for <strong>${esc(q)}</strong> with SafeSearch on.<br><small>A grown-up will be asked to say yes first.</small>`, extra: linkHtml("google", q), chips: ["Quiz me", "Fun fact"] };
    }
    // translate: "translate good morning to shona on google"
    if ((m = t.match(/^google translate (.{2,100})$/)) || (m = t.match(/^translate (.{2,100}) (?:on|with|using) google(?: translate)?$/))) {
      return { html: `🌐 Google Translate can help with <strong>${esc(m[1])}</strong>.`, extra: linkHtml("translate", m[1]), chips: ["Teach me Shona greetings"] };
    }
    // maps: "google maps harare" / "show harare on a map"
    if ((m = t.match(/^(?:google )?maps? (?:of |for |to )?(.{2,80})$/)) || (m = t.match(/^show (.{2,80}) on (?:a |the |google )?maps?$/))) {
      return { html: `🗺️ Let us look at <strong>${esc(m[1])}</strong> on a map.`, extra: linkHtml("maps", m[1]), chips: ["Quiz me"] };
    }
    return null;
  }

  window.FXExplore = { load, intent, open, render, submit, linkHtml, findVideos, sites: () => SITES, urlFor };
  load();
})();
