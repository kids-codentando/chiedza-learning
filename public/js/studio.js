/* ============================================================
   CHIEDZA STUDIO - the chat page
   Sends what you type to the brain (safety, website builder,
   reasoning, calculator), shows the answer, and lets you preview,
   read and download the website that was built. Created by Ntandomods.
   ============================================================ */
(function () {
  "use strict";
  const $ = id => document.getElementById(id);
  const msgs = $("msgs"), chipsEl = $("chips"), input = $("input"), side = $("side"), layout = $("layout"), frame = $("frame");
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  let site = null, page = "index.html", codeFile = "index.html";

  const say = (html, who) => { const d = document.createElement("div"); d.className = "msg " + (who || "bot"); d.innerHTML = html; msgs.appendChild(d); msgs.scrollTop = msgs.scrollHeight; return d; };
  const chips = list => { chipsEl.innerHTML = (list || []).map(c => `<button type="button" class="chip">${esc(c)}</button>`).join(""); };

  const WELCOME = `Mhoro! 👋 I am <strong>Chiedza AI</strong>. I think in steps and I <strong>build complete websites</strong> from a short description. Tell me what the site is for, its name, what you sell or offer, where you are, and the colours you like.<br><br>I can also solve word problems, logic puzzles, cause-and-effect questions and comparisons, and I always show my working.`;
  const START_CHIPS = ["Build a website for Mai Chido Bakery in Harare selling cakes, bread and mandazi. Make it pink with a gallery", "Create a website called Sunrise Hardware for my shop in Bulawayo selling cement, paint and tools", "Tino is taller than Rudo. Rudo is taller than Chipo. Who is the tallest?", "Why does it rain?"];
  const MISS = `I could not work that one out from my files. 🤔 I do not look things up, so I only answer what I can reason through.<br><br>I can:<ul><li><strong>Build a website:</strong> <em>Build a website for my salon Glow Studio in Mutare</em></li><li><strong>Change it:</strong> <em>make it green</em>, <em>add pricing</em>, <em>make it one page</em></li><li><strong>Solve problems:</strong> word problems, logic, cause and effect, comparisons, and sums like <em>25% of 80</em></li></ul>`;

  /* ---------- asking ---------- */
  function ask(text) {
    text = text.trim(); if (!text) return;
    say(esc(text), "me"); chips([]);
    const Br = window.ChiedzaBrain;
    const wait = say("🤔 Thinking…");
    setTimeout(() => {
      let r = null;
      try { r = Br && Br.handle(text); } catch (e) { console.warn(e); }
      wait.remove();
      if (!r) { say(MISS); chips(START_CHIPS.slice(0, 2).concat(["Why does it rain?"])); return; }
      say(r.html);
      if (r.site) { site = r.site; page = "index.html"; codeFile = "index.html"; showSide(); preview(); }
      chips(r.chips || []);
    }, 200);
  }

  /* ---------- preview ---------- */
  function showSide() { side.hidden = false; layout.classList.remove("no-side"); $("showPreview").hidden = false; }
  function inline(file) {
    let h = site.files[file] || "";
    h = h.replace('<link rel="stylesheet" href="styles.css">', () => "<style>" + site.files["styles.css"] + "</style>").replace('<script src="script.js"></script>', () => "<script>" + site.files["script.js"].replace(/<\/script/gi, "<\\/script") + "<\/script>");
    return h;
  }
  function tabs() {
    const htmls = Object.keys(site.files).filter(f => f.endsWith(".html"));
    $("tabs").innerHTML = htmls.length > 1 ? htmls.map(f => `<button type="button" data-page="${esc(f)}" class="${f === page ? "on" : ""}">${esc(f)}</button>`).join("") : "";
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

  /* ---------- ZIP (stored, no compression) ---------- */
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

  /* ---------- events ---------- */
  $("form").onsubmit = e => { e.preventDefault(); const v = input.value; input.value = ""; ask(v); };
  chipsEl.onclick = e => { const b = e.target.closest(".chip"); if (b) ask(b.textContent); };
  msgs.onclick = e => {
    const b = e.target.closest("[data-site]"); if (!b || !site) return;
    if (b.dataset.site === "preview") { showSide(); preview(); }
    if (b.dataset.site === "zip") download();
    if (b.dataset.site === "code") codeView();
  };
  $("tabs").onclick = e => { const b = e.target.closest("[data-page]"); if (b) preview(b.dataset.page); };
  $("codeFiles").onclick = e => { const b = e.target.closest("[data-file]"); if (b) { codeFile = b.dataset.file; codeView(); } };
  $("backPreview").onclick = () => preview();
  $("copyCode").onclick = e => { const t = $("codeText").value; (navigator.clipboard ? navigator.clipboard.writeText(t) : Promise.reject()).then(() => { e.target.textContent = "Copied!"; setTimeout(() => (e.target.textContent = "Copy this file"), 1500); }).catch(() => { $("codeText").select(); }); };
  document.querySelectorAll("[data-dev]").forEach(b => b.onclick = () => { document.querySelectorAll("[data-dev]").forEach(x => x.classList.toggle("on", x === b)); $("frameWrap").classList.toggle("mobile", b.dataset.dev === "mobile"); });
  $("closePreview").onclick = () => { side.hidden = true; };
  $("showPreview").onclick = () => { if (site) { showSide(); preview(); } };
  $("newBtn").onclick = () => { site = null; if (window.ChiedzaSite) window.ChiedzaSite.current = null; side.hidden = true; $("showPreview").hidden = true; layout.classList.add("no-side"); msgs.innerHTML = ""; start(); };

  function start() { say(WELCOME); chips(START_CHIPS); layout.classList.add("no-side"); input.focus(); }
  start();
})();
