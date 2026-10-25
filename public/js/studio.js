/* ============================================================
   CHIEDZA STUDIO — the chat page
   Sends what you type to the brain (safety, website builder,
   reasoning, general reasoner, calculator), shows the answer with
   its reasoning, and lets you preview, read and download the
   website that was built. Created by Ntandomods.
   ============================================================ */
(function () {
  "use strict";

  const $ = id => document.getElementById(id);
  const msgs = $("msgs"), chipsEl = $("chips"), input = $("input"), form = $("form");
  const side = $("side"), layout = $("layout"), frame = $("frame");
  const esc = s => String(s == null ? "" : s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

  let site = null, page = "index.html", codeFile = "index.html";

  /* ---------------- theme ---------------- */
  const rootEl = document.documentElement, themeBtn = $("themeToggle"), themeIco = themeBtn.querySelector(".theme-ico");
  function setTheme(t) {
    rootEl.setAttribute("data-theme", t);
    themeIco.textContent = t === "light" ? "☀️" : "🌙";
    themeBtn.setAttribute("aria-label", t === "light" ? "Switch to dark theme" : "Switch to light theme");
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute("content", t === "light" ? "#f4f6fb" : "#0b0d12");
    try { localStorage.setItem("chiedza-theme", t); } catch (e) {}
  }
  (function initTheme() {
    let saved = null; try { saved = localStorage.getItem("chiedza-theme"); } catch (e) {}
    if (!saved) saved = window.matchMedia && window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark";
    setTheme(saved);
  })();
  themeBtn.onclick = () => setTheme(rootEl.getAttribute("data-theme") === "light" ? "dark" : "light");

  /* ---------------- small helpers ---------------- */
  const scroll = () => { msgs.scrollTop = msgs.scrollHeight; };
  const grow = () => { input.style.height = "auto"; input.style.height = Math.min(input.scrollHeight, 180) + "px"; };

  function say(html, who) {
    const d = document.createElement("div");
    d.className = "msg " + (who || "bot");
    if (who === "me") {
      d.innerHTML = `<div class="bubble">${esc(html)}</div>`;
    } else {
      d.innerHTML = `<div class="avatar" aria-hidden="true">C</div><div class="bubble"><div class="msg-body">${html}</div><div class="msg-tools"><button type="button" data-copy>Copy</button></div></div>`;
    }
    msgs.appendChild(d); scroll(); return d;
  }

  function typing() {
    const d = document.createElement("div");
    d.className = "msg bot typing";
    d.innerHTML = `<div class="avatar" aria-hidden="true">C</div><div class="bubble"><span class="dots"><span></span><span></span><span></span></span> Thinking…</div>`;
    msgs.appendChild(d); scroll(); return d;
  }

  function chips(list) {
    chipsEl.innerHTML = (list || []).map(c => `<button type="button" class="chip">${esc(c)}</button>`).join("");
  }

  /* ---------------- welcome ---------------- */
  const START_CHIPS = [
    "Write an essay about discipline in 500 words",
    "Write a composition about a day I will never forget",
    "Write a project on water conservation",
    "Explain photosynthesis",
    "Should I start a small business?",
    "How do I study better?",
    "Build a website for Mai Chido Bakery in Harare selling cakes, bread and mandazi. Make it pink with a gallery"
  ];

  function hero() {
    msgs.innerHTML = "";
    const h = document.createElement("div");
    h.className = "hero";
    h.innerHTML =
      `<img class="hero-logo" src="assets/icon.png" alt="" width="64" height="64">` +
      `<h1>Think it through with <em>Chiedza</em></h1>` +
      `<p>Ask about almost anything. I break the question down, weigh the options and show every step of my reasoning. I can also <strong>write the whole thing</strong> — essays, compositions, projects, letters, speeches and reports — then build you a complete website.</p>` +
      `<div class="cap-grid">` +
        `<div class="cap-card"><div class="cap-ico">✍️</div><strong>Write essays & projects</strong><span>Real drafts — compositions, letters, speeches, reports — with a craft check.</span></div>` +
        `<div class="cap-card"><div class="cap-ico">💡</div><strong>Explain &amp; define</strong><span>Ideas in science, money, health, tech, law and life.</span></div>` +
        `<div class="cap-card"><div class="cap-ico">⚖️</div><strong>Decide &amp; compare</strong><span>Pros and cons, trade-offs, and what matters most.</span></div>` +
        `<div class="cap-card"><div class="cap-ico">🗺️</div><strong>Plan step by step</strong><span>Study plans, projects, businesses and habits.</span></div>` +
        `<div class="cap-card"><div class="cap-ico">🔮</div><strong>Explore “what if”</strong><span>Trace likely effects, risks and second-order outcomes.</span></div>` +
        `<div class="cap-card"><div class="cap-ico">🧠</div><strong>Reason from scratch</strong><span>No facts invented — a clear map when knowledge runs out.</span></div>` +
        `<div class="cap-card"><div class="cap-ico">🌐</div><strong>Build a website</strong><span>Full multi-page sites you can preview and download.</span></div>` +
      `</div>`;
    msgs.appendChild(h);
    chips(START_CHIPS);
  }

  const MISS = `I could not work that one out from my files. 🤔 I do not look things up, so I only answer what I can reason through.<br><br>` +
    `I can:<ul><li><strong>Write it for you:</strong> <em>Write an essay about discipline in 500 words</em>, <em>Write a project on water conservation</em></li><li><strong>Reason about anything:</strong> <em>Explain inflation</em>, <em>Should I save or invest?</em>, <em>How do I plan a project?</em></li>` +
    `<li><strong>Build a website:</strong> <em>Build a website for my salon Glow Studio in Mutare</em></li>` +
    `<li><strong>Change it:</strong> <em>make it green</em>, <em>add pricing</em>, <em>make it one page</em></li>` +
    `<li><strong>Solve problems:</strong> word problems, logic, cause and effect, comparisons, and sums like <em>25% of 80</em></li></ul>`;

  /* ---------------- asking ---------------- */
  async function readyUp() {
    const Br = window.ChiedzaBrain;
    if (!Br) return null;
    try { await Br.ready; } catch (e) {}
    // The skill engines load their own files just after the brain is ready.
    const deadline = Date.now() + 1500;
    while (Date.now() < deadline) {
      if (window.ChiedzaGeneral && window.ChiedzaReasoning && window.ChiedzaSite) break;
      await new Promise(r => setTimeout(r, 60));
    }
    return Br;
  }

  function renderReasoning(bubble, steps) {
    if (!Array.isArray(steps) || !steps.length) return;
    const det = document.createElement("details");
    det.className = "reasoning";
    det.innerHTML =
      `<summary>How I reasoned · ${steps.length} step${steps.length === 1 ? "" : "s"}</summary>` +
      `<ol class="reasoning-list">` +
        steps.map(s => `<li><strong>${esc(s.title || "Step")}</strong>${s.detail ? " — " + esc(s.detail) : ""}</li>`).join("") +
      `</ol>`;
    const tools = bubble.querySelector(".msg-tools");
    if (tools) bubble.insertBefore(det, tools); else bubble.appendChild(det);
  }

  async function ask(text) {
    text = String(text || "").trim(); if (!text) return;
    const h = msgs.querySelector(".hero"); if (h) h.remove();
    say(text, "me"); chips([]);
    input.value = ""; grow();

    const wait = typing();
    let r = null;
    try {
      const Br = await readyUp();
      if (Br) r = Br.handle(text);
    } catch (e) { console.warn("Chiedza error", e); }
    wait.remove();

    if (!r) { say(MISS); chips(START_CHIPS.slice(0, 3)); return; }

    const msg = say(r.html || "");
    renderReasoning(msg.querySelector(".bubble"), r.reasoning);
    if (r.site) { site = r.site; page = "index.html"; codeFile = "index.html"; showSide(); preview(); }
    chips(r.chips || []);
    scroll();
  }

  /* ---------------- preview ---------------- */
  function showSide() { side.hidden = false; layout.classList.remove("no-side"); $("showPreview").hidden = false; }
  function hideSide() { side.hidden = true; $("showPreview").hidden = true; }

  function inline(file) {
    let h = site.files[file] || "";
    h = h.replace('<link rel="stylesheet" href="styles.css">', () => "<style>" + site.files["styles.css"] + "</style>")
         .replace('<script src="script.js"></script>', () => "<script>" + site.files["script.js"].replace(/<\/script/gi, "<\\/script") + "<\/script>");
    return h;
  }

  function tabs() {
    const htmls = Object.keys(site.files).filter(f => f.endsWith(".html"));
    $("tabs").innerHTML = htmls.length > 1
      ? htmls.map(f => `<button type="button" role="tab" data-page="${esc(f)}" class="${f === page ? "on" : ""}" aria-selected="${f === page}">${esc(f)}</button>`).join("")
      : "";
  }

  function preview(file) {
    if (!site) return;
    if (file) page = file;
    $("codeView").hidden = true; $("frameWrap").hidden = false;
    tabs();
    frame.onload = () => {
      try {
        const d = frame.contentDocument;
        d.addEventListener("click", e => {
          const a = e.target.closest && e.target.closest("a[href]"); if (!a) return;
          const href = a.getAttribute("href");
          if (/^(https?:|mailto:|tel:)/.test(href)) { a.target = "_blank"; a.rel = "noopener"; return; }
          const f = href.split("#")[0];
          if (f && site.files[f]) { e.preventDefault(); preview(f); }
        });
      } catch (e) {}
    };
    frame.srcdoc = inline(page);
  }

  function codeView() {
    if (!site) return;
    showSide(); $("frameWrap").hidden = true; $("codeView").hidden = false;
    const names = Object.keys(site.files);
    $("codeFiles").innerHTML = names.map(f => `<button type="button" data-file="${esc(f)}" class="${f === codeFile ? "on" : ""}">${esc(f)}</button>`).join("");
    $("codeText").value = site.files[codeFile];
  }

  /* ---------------- ZIP (stored, no compression) ---------------- */
  const CRC = (() => { const t = []; for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; } return t; })();
  const crc32 = b => { let c = 0xFFFFFFFF; for (let i = 0; i < b.length; i++) c = CRC[(c ^ b[i]) & 255] ^ (c >>> 8); return (c ^ 0xFFFFFFFF) >>> 0; };
  function makeZip(files, folder) {
    const enc = new TextEncoder(), parts = [], central = []; let offset = 0;
    const u16 = n => [n & 255, (n >> 8) & 255], u32 = n => [n & 255, (n >>> 8) & 255, (n >>> 16) & 255, (n >>> 24) & 255];
    for (const [name, text] of Object.entries(files)) {
      const nm = enc.encode(folder + "/" + name), data = enc.encode(text), crc = crc32(data);
      const local = new Uint8Array([0x50, 0x4b, 3, 4, ...u16(20), ...u16(0x0800), ...u16(0), ...u16(0), ...u16(0x21), ...u32(crc), ...u32(data.length), ...u32(data.length), ...u16(nm.length), ...u16(0)]);
      parts.push(local, nm, data);
      central.push(new Uint8Array([0x50, 0x4b, 1, 2, ...u16(20), ...u16(20), ...u16(0x0800), ...u16(0), ...u16(0), ...u16(0x21), ...u32(crc), ...u32(data.length), ...u32(data.length), ...u16(nm.length), ...u16(0), ...u16(0), ...u16(0), ...u16(0), ...u32(0), ...u32(offset)]), nm);
      offset += local.length + nm.length + data.length;
    }
    const csize = central.reduce((a, b) => a + b.length, 0), n = Object.keys(files).length;
    const end = new Uint8Array([0x50, 0x4b, 5, 6, ...u16(0), ...u16(0), ...u16(n), ...u16(n), ...u32(csize), ...u32(offset), ...u16(0)]);
    return new Blob([...parts, ...central, end], { type: "application/zip" });
  }
  function download() {
    if (!site) return;
    const slug = (site.spec.name || "website").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "website";
    const a = document.createElement("a"); a.href = URL.createObjectURL(makeZip(site.files, slug)); a.download = slug + ".zip";
    document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 4000);
  }

  /* ---------------- events ---------------- */
  form.onsubmit = e => { e.preventDefault(); const v = input.value; ask(v); };
  input.addEventListener("input", grow);
  input.addEventListener("keydown", e => {
    if (e.key === "Enter" && !e.shiftKey && !e.isComposing) { e.preventDefault(); form.requestSubmit(); }
  });
  chipsEl.onclick = e => { const b = e.target.closest(".chip"); if (b) ask(b.textContent); };

  msgs.onclick = e => {
    const copy = e.target.closest("[data-copy]");
    if (copy) {
      const bubble = copy.closest(".bubble");
      const text = bubble ? (bubble.querySelector(".msg-body") || bubble).innerText : "";
      const done = () => { copy.textContent = "Copied!"; setTimeout(() => (copy.textContent = "Copy"), 1500); };
      if (navigator.clipboard) navigator.clipboard.writeText(text).then(done).catch(done); else done();
      return;
    }
    const b = e.target.closest("[data-site]"); if (!b || !site) return;
    if (b.dataset.site === "preview") { showSide(); preview(); }
    if (b.dataset.site === "zip") download();
    if (b.dataset.site === "code") codeView();
  };

  $("tabs").onclick = e => { const b = e.target.closest("[data-page]"); if (b) preview(b.dataset.page); };
  $("codeFiles").onclick = e => { const b = e.target.closest("[data-file]"); if (b) { codeFile = b.dataset.file; codeView(); } };
  $("backPreview").onclick = () => preview();
  $("copyCode").onclick = e => {
    const t = $("codeText").value;
    (navigator.clipboard ? navigator.clipboard.writeText(t) : Promise.reject()).then(() => {
      e.target.textContent = "Copied!"; setTimeout(() => (e.target.textContent = "Copy this file"), 1500);
    }).catch(() => { $("codeText").select(); });
  };
  document.querySelectorAll("[data-dev]").forEach(b => b.onclick = () => {
    document.querySelectorAll("[data-dev]").forEach(x => x.classList.toggle("on", x === b));
    $("frameWrap").classList.toggle("mobile", b.dataset.dev === "mobile");
  });
  $("closePreview").onclick = hideSide;
  $("showPreview").onclick = () => { if (site) { showSide(); preview(); } };
  $("downloadBtn").onclick = download;
  $("codeBtn").onclick = codeView;
  $("newBtn").onclick = () => {
    site = null; if (window.ChiedzaSite) window.ChiedzaSite.current = null;
    hideSide(); layout.classList.add("no-side"); hero(); input.focus();
  };

  hero();
  input.focus();
})();
