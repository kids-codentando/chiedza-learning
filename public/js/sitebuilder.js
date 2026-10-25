/* ============================================================
   CHIEDZA SITE BUILDER - reasons its way to a full website
   No outside AI and no API keys. It reads the request, works out
   what kind of site is needed (purpose, name, place, offerings,
   colours, tone, pages), builds a spec, renders real multi-page
   HTML + CSS + JS from it, then checks its own work (links,
   contrast, headings, placeholders). Every decision is shown.
   Rules and starting copy live in public/brain/reasoning/
   (site-rules.json, website.json, website-more.json).
   Works in the browser and in Node (npm run test:website).
   Created by Ntandomods.
   ============================================================ */
(function (root) {
  "use strict";

  function create(D) {
    const R = D.rules, TYPES = D.types;
    const esc = s => String(s == null ? "" : s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
    const rxEsc = w => w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const hasWord = (s, w) => new RegExp("(^|[^a-z0-9])" + rxEsc(w) + "(s|es)?([^a-z0-9]|$)", "i").test(s);
    const findWord = (s, list) => (list || []).find(w => hasWord(s, w));
    const titleCase = s => s.replace(/\b([a-z])([a-z']*)/g, (m, a, b) => a.toUpperCase() + b);

    /* ---------- colour maths (WCAG contrast) ---------- */
    const toRgb = h => { h = h.replace("#", ""); if (h.length === 3) h = h.split("").map(c => c + c).join(""); return [0, 2, 4].map(i => parseInt(h.slice(i, i + 2), 16)); };
    const toHex = rgb => "#" + rgb.map(v => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, "0")).join("");
    const lum = h => { const [r, g, b] = toRgb(h).map(v => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); }); return 0.2126 * r + 0.7152 * g + 0.0722 * b; };
    const contrast = (a, b) => { const x = lum(a), y = lum(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); };
    const mix = (a, b, t) => { const x = toRgb(a), y = toRgb(b); return toHex(x.map((v, i) => v + (y[i] - v) * t)); };
    const onColor = c => contrast("#ffffff", c) >= contrast("#111111", c) ? "#ffffff" : "#111111";
    // nudge colour c toward black (or white) until it has 4.5:1 against bg
    function fit(c, bg, towards) { let k = 0, out = c; while (contrast(out, bg) < 4.5 && k < 20) { out = mix(out, towards, 0.1); k++; } return out; }

    /* ---------- reading the request ---------- */
    const NEW_RX = () => {
      const v = R.intent.verbs.map(rxEsc).join("|"), t = R.intent.things.map(rxEsc).join("|");
      return new RegExp("\\b(" + v + ")\\b[^.?!]{0,80}\\b(" + t + ")\\b|\\b(" + t + ")\\s+(for|about)\\b", "i");
    };
    const newRx = NEW_RX();
    const isNewSiteRequest = text => newRx.test(text) && !/^(what|why|how|who|when)\b/i.test(text.trim());

    function pickType(text) {
      let best = null, score = 0;
      for (const t of TYPES) {
        let s = 0;
        for (const k of t.keywords) if (hasWord(text, k)) s += k.includes(" ") ? 3 : 2;
        if (/online (shop|store)|web ?shop/i.test(text) && t.id === "shop") s += 4;
        if (s > score) { score = s; best = t; }
      }
      return { type: best || TYPES.find(t => t.id === "business"), score };
    }
    function placeOf(text) {
      const p = R.places.find(x => hasWord(text, x));
      if (p) return p;
      const m = text.match(/\b(?:based in|located in|located at|in|at)\s+([A-Z][a-z]+(?:\s[A-Z][a-z]+)?)/);
      return m ? m[1] : "";
    }
    function nameOf(text) {
      let m = text.match(/["\u201c\u201d]([^"\u201c\u201d]{2,40})["\u201c\u201d]/);
      if (m) return m[1].trim();
      m = text.match(/\b(?:called|named|name is|name it|call it|brand is|brand name is|business is called)\s+(.{2,60}?)(?=$|[,.;:!?\n]|\s(?:in|at|that|which|who|with|selling|sells|offering|offers|providing|based|located|where|because|to|from|so|using|on)\b)/i);
      if (m) return m[1].trim().replace(/^(the|my)\s+/i, "");
      m = text.match(/\bfor\s+(?:my\s+|the\s+|our\s+|a\s+|an\s+)?((?:[A-Z][\w'&-]*)(?:\s+(?:[A-Z][\w'&-]*|&|and|of|the)){0,4})/);
      if (m) { const n = m[1].replace(/\s+(and|of|the)$/i, "").trim(); if (!R.places.includes(n)) return n; }
      return "";
    }
    const NOT_OFFER = /\b(pages?|website|web ?site|sites?|gallery|pricing|prices?|testimonials?|reviews?|team|faq|blog|map|newsletter|colou?rs?|theme|dark|light|whatsapp|phone|email|contact|number|logo|menu bar|design|style|font|button|sections?)\b/i;
    function offersOf(text) {
      const strong = /\b(?:sell(?:s|ing)?|offer(?:s|ing)?|provid(?:e|es|ing)|serv(?:e|es|ing)|specialis(?:e|es|ing) in|specializ(?:e|es|ing) in|makes?|making|bakes?|baking|cooks?|cooking|stock(?:s|ing)?|products? (?:are|include)|services? (?:are|include)|menu (?:has|includes?))\s+([^.;!?\n]+)/gi;
      const weak = /\b(?:with|includes?|including|such as|like)\s+([^.;!?\n]+)/gi;
      const grab = rx => { const out = []; let m; while ((m = rx.exec(text))) out.push(m[1]); return out; };
      let segs = grab(strong);
      if (!segs.length) segs = grab(weak);
      const items = [];
      for (let seg of segs) {
        seg = seg.split(/\s(?:in|at|from|with|using|that|which|where|for|to be|so that|please|and (?:make|add|use|include|a |an |the |i |it|my))\b/i)[0];
        seg.split(/,|\band\b|&|\/|;/i).forEach(p => {
          let w = p.trim().replace(/^(?:also|some|a few|many|various)\s+/i, "");
          R.dropWords.forEach(d => { w = w.replace(new RegExp("^" + rxEsc(d) + "\\s+", "i"), ""); });
          w = w.trim();
          if (w.length >= 2 && w.length <= 40 && !NOT_OFFER.test(w) && !/^(i|we|it|you|they)\b/i.test(w)) items.push(titleCase(w));
        });
      }
      return [...new Set(items)].slice(0, 8);
    }
    function colorsOf(text) {
      const hex = text.match(/#[0-9a-f]{6}\b/gi) || [];
      const found = Object.keys(R.colors).filter(c => hasWord(text, c));
      const theme = Object.keys(R.themes).find(t => hasWord(text, t));
      return { hex, found, theme };
    }
    function contactOf(text) {
      const c = {};
      const ph = text.match(/(?:phone|call|whatsapp|tel|number|contact)\s*(?:number|no\.?)?\s*(?:is|on|:)?\s*(\+?\d[\d\s-]{7,}\d)/i);
      if (ph) c.phone = ph[1].replace(/\s+/g, " ").trim();
      const em = text.match(/[\w.+-]+@[\w-]+\.[\w.]+/); if (em) c.email = em[0];
      if (/whatsapp/i.test(text)) c.whatsapp = true;
      return c;
    }
    const waDigits = ph => { let d = String(ph || "").replace(/\D/g, ""); if (/^0\d{9}$/.test(d)) d = "263" + d.slice(1); return d; };

    function blankSpec(type) {
      return { type: type.id, name: "", nameGiven: false, tagline: "", place: "", offers: [], offersGiven: false, tone: type.tone, dark: false, colors: {}, layout: "multi",
        extras: { faq: true }, contact: {}, ctaKind: type.cta.kind };
    }
    const typeOf = spec => TYPES.find(t => t.id === spec.type) || TYPES[0];

    function setColors(spec, c, log) {
      const type = typeOf(spec);
      let primary = null, accent = null, why = "";
      if (c.hex.length) { primary = c.hex[0].toLowerCase(); accent = (c.hex[1] || "").toLowerCase() || null; why = "you gave exact colour codes"; }
      else if (c.theme) { const th = R.themes[c.theme]; primary = th.primary; accent = th.accent; why = "you asked for the " + c.theme + " colours (green, gold, red)"; }
      else if (c.found.length) { primary = R.colors[c.found[0]]; accent = c.found[1] ? R.colors[c.found[1]] : R.accents[c.found[0]]; why = "you asked for " + c.found.join(" and "); }
      else { const k = type.palette; primary = R.colors[k]; accent = R.accents[k]; why = "no colour was asked for, so I used the usual " + k + " for a " + type.label; }
      spec.colors = { primary, accent: accent || R.accents.blue };
      if (log) log.push({ icon: "🎨", step: "Colours", text: why + ". Primary " + primary + ", accent " + spec.colors.accent + "." });
    }
    function setExtras(spec, text) {
      const added = [];
      for (const k of Object.keys(R.extras)) if (findWord(text, R.extras[k]) && !spec.extras[k]) { spec.extras[k] = true; added.push(k); }
      return added;
    }
    function setTone(spec, text) {
      for (const k of Object.keys(R.tones)) if (findWord(text, R.tones[k])) { spec.tone = k; return k; }
      return null;
    }

    /* ---------- understand a NEW request ---------- */
    function understand(text) {
      const log = [];
      const { type, score } = pickType(text);
      const spec = blankSpec(type);
      log.push({ icon: "🧭", step: "Purpose", text: score ? "Words like \u201c" + esc(type.keywords.find(k => hasWord(text, k))) + "\u201d point to a <strong>" + esc(type.label) + "</strong>." : "Nothing in the request names a trade, so I started with a general <strong>business website</strong>. Tell me more and I will adjust." });
      const nm = nameOf(text);
      spec.name = nm || "Your Business"; spec.nameGiven = !!nm;
      log.push({ icon: "🏷️", step: "Name", text: nm ? "The site is called <strong>" + esc(nm) + "</strong>." : esc(R.tips.noName) });
      spec.place = placeOf(text);
      const rest = nm ? text.replace(nm, " ") : text;
      if (spec.place) log.push({ icon: "📍", step: "Place", text: "Based in <strong>" + esc(spec.place) + "</strong>, so the copy mentions it." });
      const offers = offersOf(rest);
      if (offers.length) { spec.offers = offers; spec.offersGiven = true; }
      else spec.offers = type.offers.map(o => o.t);
      log.push({ icon: "📦", step: spec.offersGiven ? "What you offer" : "What you offer (assumed)", text: spec.offersGiven ? "I found: " + offers.map(o => "<strong>" + esc(o) + "</strong>").join(", ") + "." : "You did not list any, so I used typical " + esc(type.offerLabel.toLowerCase()) + " for this kind of site. Say <em>we sell X, Y and Z</em> to replace them." });
      spec.contact = contactOf(text);
      const tone = setTone(spec, rest);
      log.push({ icon: "🗣️", step: "Tone and fonts", text: (tone ? "You asked for a <strong>" + tone + "</strong> feel" : "I chose a <strong>" + spec.tone + "</strong> tone for this audience") + ". Font choice: " + esc(R.fonts[spec.tone].why) + "." });
      spec.dark = !!findWord(text, R.dark);
      setColors(spec, colorsOf(rest), log);
      if (spec.dark) log.push({ icon: "🌙", step: "Dark mode", text: "Dark background requested. Text and accents are re-checked for contrast." });
      const added = setExtras(spec, rest);
      if (findWord(text, R.layout.single)) spec.layout = "single";
      const ck = Object.keys(R.ctaKinds).find(k => findWord(text, R.ctaKinds[k]));
      if (ck) spec.ctaKind = ck;
      if (spec.contact.phone && (spec.contact.whatsapp || spec.ctaKind === "order" || spec.ctaKind === "book")) spec.contact.whatsapp = true;
      log.push({ icon: "🗂️", step: "Pages", text: (spec.layout === "single" ? "One long page with menu links that jump to each section" : "A full multi-page site: " + pageList(spec).map(p => "<strong>" + esc(p.label) + "</strong>").join(", ")) + (added.length ? ". Extras you asked for: " + added.join(", ") : "") + "." });
      return { spec, log };
    }

    /* ---------- edit an EXISTING spec ---------- */
    function applyEdit(spec, text) {
      const changes = [];
      let m;
      const type = typeOf(spec);
      if ((m = text.match(/(?:change|set|make|rename)[^.]*?\b(?:name|call)[^.]*?\b(?:to|it|is)\s+["\u201c]?(.{2,60}?)["\u201d]?\s*$/i)) || (m = text.match(/\b(?:call it|rename (?:it )?(?:to)?|name it|name is|called)\s+["\u201c]?(.{2,60}?)["\u201d]?\s*$/i))) {
        spec.name = m[1].trim(); spec.nameGiven = true; changes.push("Name is now <strong>" + esc(spec.name) + "</strong>.");
      }
      if ((m = text.match(/\b(?:tagline|slogan|motto)\s*(?:is|to|:)?\s*["\u201c]?(.{3,90}?)["\u201d]?\s*$/i))) { spec.tagline = m[1].trim(); changes.push("Tagline is now \u201c" + esc(spec.tagline) + "\u201d."); }
      if ((m = text.match(/\b(?:add|include|also sell|we also sell|also offer|we also offer)\s+(?:products?|services?|items?|menu items?)?\s*:?\s*(.{2,120})$/i)) && !findWord(m[1], [].concat(...Object.values(R.extras)))) {
        const items = offersOf("we sell " + m[1]); const extra = items.length ? items : [];
        if (extra.length) { spec.offers = [...new Set((spec.offersGiven ? spec.offers : []).concat(extra))].slice(0, 10); spec.offersGiven = true; changes.push("Added: " + extra.map(e => "<strong>" + esc(e) + "</strong>").join(", ") + "."); }
      }
      if ((m = text.match(/\b(?:we |i )?(?:sell|offer|provide|serve)s?\s+(?:only\s+)?(.{2,120})$/i)) && /\b(only|instead|change|replace)\b/i.test(text)) {
        const items = offersOf("we sell " + m[1]); if (items.length) { spec.offers = items; spec.offersGiven = true; changes.push("Replaced the list with: " + items.map(e => "<strong>" + esc(e) + "</strong>").join(", ") + "."); }
      }
      const c = colorsOf(text);
      if (c.hex.length || c.found.length || c.theme) { setColors(spec, c, null); changes.push("Colours changed to " + esc(spec.colors.primary) + " with " + esc(spec.colors.accent) + " accents."); }
      if (findWord(text, R.dark)) { spec.dark = true; changes.push("Dark mode on."); }
      else if (/\b(light mode|light theme|white background)\b/i.test(text)) { spec.dark = false; changes.push("Light mode on."); }
      const tone = setTone(spec, text); if (tone) changes.push("Tone is now <strong>" + tone + "</strong> (" + esc(R.fonts[tone].why) + ").");
      const adding = /\b(add|include|with|also|need|want)\b/i.test(text), removing = /\b(remove|drop|delete|without|no more|get rid of|take out)\b/i.test(text);
      for (const k of Object.keys(R.extras)) {
        if (!findWord(text, R.extras[k])) continue;
        if (removing && spec.extras[k]) { delete spec.extras[k]; changes.push("Removed the <strong>" + k + "</strong> section."); }
        else if (adding && !spec.extras[k]) { spec.extras[k] = true; changes.push("Added a <strong>" + k + "</strong> section."); }
      }
      const ct = contactOf(text);
      if (ct.phone) { spec.contact.phone = ct.phone; spec.contact.whatsapp = spec.contact.whatsapp || ct.whatsapp || /whatsapp/i.test(text); changes.push("Phone set to <strong>" + esc(ct.phone) + "</strong>."); }
      if (ct.email) { spec.contact.email = ct.email; changes.push("Email set to <strong>" + esc(ct.email) + "</strong>."); }
      if (!ct.phone && ct.whatsapp && spec.contact.phone && !spec.contact.whatsapp) { spec.contact.whatsapp = true; changes.push("The call-to-action now opens WhatsApp."); }
      if ((m = text.match(/\b(?:located|based|moved?|relocated?)\s+(?:in|to|at)\s+([A-Z][a-z]+(?:\s[A-Z][a-z]+)?)/)) || (m = text.match(/\blocation is\s+([A-Z][a-z]+(?:\s[A-Z][a-z]+)?)/))) { spec.place = m[1]; changes.push("Location is now <strong>" + esc(spec.place) + "</strong>."); }
      if (findWord(text, R.layout.single) && spec.layout !== "single") { spec.layout = "single"; changes.push("Now a single long page."); }
      if (findWord(text, R.layout.multi) && spec.layout !== "multi") { spec.layout = "multi"; changes.push("Now a multi-page site."); }
      const ck = Object.keys(R.ctaKinds).find(k => findWord(text, R.ctaKinds[k]) && /\b(button|cta|call to action)\b/i.test(text));
      if (ck) { spec.ctaKind = ck; changes.push("The main button now says <strong>" + esc(ctaLabel(spec).label) + "</strong>."); }
      return changes;
    }

    /* ---------- pages ---------- */
    function pageList(spec) {
      const t = typeOf(spec);
      const pages = [{ id: "home", file: "index.html", label: "Home" }, { id: "about", file: "about.html", label: "About" }, { id: "offer", file: t.offerFile + ".html", label: t.offerLabel }];
      if (spec.extras.pricing) pages.push({ id: "pricing", file: "pricing.html", label: "Pricing" });
      if (spec.extras.gallery) pages.push({ id: "gallery", file: "gallery.html", label: "Gallery" });
      if (spec.extras.blog) pages.push({ id: "blog", file: "blog.html", label: "News" });
      pages.push({ id: "contact", file: "contact.html", label: "Contact" });
      return pages;
    }
    function ctaLabel(spec) {
      const t = typeOf(spec);
      const labels = { contact: t.cta.kind === "contact" ? t.cta.label : "Contact us", whatsapp: "Chat on WhatsApp", book: "Book now", order: "Order now" };
      const kind = spec.ctaKind;
      const wa = spec.contact.whatsapp && spec.contact.phone ? waDigits(spec.contact.phone) : "";
      const label = kind === t.cta.kind ? t.cta.label : labels[kind] || t.cta.label;
      return { label, href: wa ? "https://wa.me/" + wa : null, kind };
    }

    /* ---------- copy helpers ---------- */
    const hash = s => { let h = 0; for (const ch of String(s)) h = (h * 31 + ch.charCodeAt(0)) >>> 0; return h; };
    function fill(s, spec, o) {
      return String(s || "").replace(/\{name\}/g, spec.name).replace(/\{in\}/g, spec.place ? " in " + spec.place : "")
        .replace(/\{serve\}/g, spec.place ? "We are based in " + spec.place + ". Contact us for the exact address." : "Add your address here.").replace(/\{o\}/g, o || "");
    }
    const taglineOf = spec => spec.tagline || fill(typeOf(spec).taglines[hash(spec.name) % typeOf(spec).taglines.length], spec);
    function offerItems(spec) {
      const t = typeOf(spec);
      return spec.offers.map((o, i) => {
        const def = t.offers.find(x => x.t.toLowerCase() === o.toLowerCase());
        return { t: o, d: def ? def.d : fill(t.blurbs[i % t.blurbs.length], spec, o), i };
      });
    }
    const ICONS = ["✨", "⭐", "🌟", "💫", "🔸", "🔹", "🎯", "🧩"];
    const PH = s => '<span class="ph">[' + esc(s) + "]</span>";

    /* ---------- colours that always pass contrast ---------- */
    function palette(spec) {
      const dark = spec.dark;
      const bg = dark ? "#12161b" : "#ffffff", text = dark ? "#eef1f5" : "#1d232b", surface = dark ? "#1b2128" : "#f4f6f8", muted = dark ? "#b4bcc7" : "#566170", line = dark ? "#2b333d" : "#e2e6ea";
      const notes = [];
      const ensureOn = (c, label) => {
        let on = onColor(c), out = c, k = 0;
        while (contrast(on, out) < 4.5 && k < 20) { out = mix(out, on === "#ffffff" ? "#000000" : "#ffffff", 0.1); k++; }
        if (out !== c) notes.push(label + " adjusted from " + c + " to " + out + " so its text is easy to read");
        return { bg: out, fg: on };
      };
      const b = ensureOn(spec.colors.primary, "Main colour"), a = ensureOn(spec.colors.accent, "Accent colour");
      const link = contrast(b.bg, bg) >= 4.5 ? b.bg : fit(b.bg, bg, dark ? "#ffffff" : "#000000");
      if (link !== b.bg) notes.push("Links use " + link + " on the " + (dark ? "dark" : "light") + " background for readability");
      const heroB = mix(b.bg, b.fg === "#ffffff" ? "#000000" : "#ffffff", 0.28);
      return { dark, bg, text, surface, muted, line, btn: b.bg, btnText: b.fg, accent: a.bg, accentText: a.fg, link, heroA: b.bg, heroB, heroText: b.fg, notes };
    }

    /* ---------- stylesheet and script ---------- */
    function css(spec, P) {
      const t = typeOf(spec), F = R.fonts[spec.tone] || R.fonts.professional;
      const safeName = String(spec.name).replace(/[^\w\s&'.-]/g, "");
      return `/* ${safeName} - styles. Edit the colours below in :root to restyle the whole site. */
:root{--bg:${P.bg};--text:${P.text};--surface:${P.surface};--muted:${P.muted};--line:${P.line};--btn:${P.btn};--btn-text:${P.btnText};--accent:${P.accent};--accent-text:${P.accentText};--link:${P.link};--hero-a:${P.heroA};--hero-b:${P.heroB};--hero-text:${P.heroText};--head:${F.head};--body:${F.body};--r:14px}
*{box-sizing:border-box}html{scroll-behavior:smooth}
body{margin:0;background:var(--bg);color:var(--text);font:17px/1.65 var(--body)}
h1,h2,h3{font-family:var(--head);line-height:1.2;margin:0 0 .5em}h1{font-size:clamp(2rem,5vw,3.2rem)}h2{font-size:clamp(1.5rem,3.4vw,2.1rem)}h3{font-size:1.15rem}
p{margin:0 0 1em}a{color:var(--link)}img{max-width:100%}
.wrap{max-width:1080px;margin:0 auto;padding:0 20px}
.skip{position:absolute;left:-999px}.skip:focus{left:10px;top:10px;background:var(--bg);padding:8px;z-index:50}
.top{position:sticky;top:0;z-index:20;background:var(--bg);border-bottom:1px solid var(--line)}
.bar{display:flex;align-items:center;justify-content:space-between;gap:16px;min-height:64px}
.brand{font:700 1.2rem var(--head);text-decoration:none;color:var(--text)}
nav{display:flex;gap:4px;flex-wrap:wrap}nav a{padding:8px 12px;border-radius:999px;text-decoration:none;color:var(--text);font-weight:600}nav a:hover,nav a[aria-current=page]{background:var(--surface);color:var(--link)}
.menu-btn{display:none;background:var(--surface);color:var(--text);border:1px solid var(--line);border-radius:10px;padding:8px 14px;font:600 1rem var(--body)}
.btn{display:inline-block;background:var(--btn);color:var(--btn-text);padding:12px 22px;border-radius:999px;font-weight:700;text-decoration:none;border:2px solid var(--btn);cursor:pointer;font-family:var(--body);font-size:1rem}
.btn:hover{filter:brightness(1.08)}.btn.ghost{background:transparent;color:var(--link);border-color:var(--link)}
.hero{background:linear-gradient(135deg,var(--hero-a),var(--hero-b));color:var(--hero-text);padding:72px 0}
.hero-in{display:grid;grid-template-columns:1.4fr 1fr;gap:32px;align-items:center}
.hero .lead{font-size:1.25rem;opacity:.95}.hero .btn{background:var(--accent);color:var(--accent-text);border-color:var(--accent)}.hero .btn.ghost{background:transparent;color:var(--hero-text);border-color:var(--hero-text)}
.eyebrow{text-transform:uppercase;letter-spacing:.12em;font-size:.85rem;font-weight:700;opacity:.9}
.hero-art{font-size:min(14rem,30vw);text-align:center;line-height:1}
.btns{display:flex;gap:12px;flex-wrap:wrap;margin-top:8px}
.page-head{background:var(--surface);padding:44px 0;border-bottom:1px solid var(--line)}.page-head p{color:var(--muted);margin:0}
section.block{padding:56px 0}section.alt{background:var(--surface)}
.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:20px}
.card{background:var(--surface);border:1px solid var(--line);border-radius:var(--r);padding:22px}section.alt .card{background:var(--bg)}
.ico{font-size:2rem;display:block;margin-bottom:8px}
.split{display:grid;grid-template-columns:1.6fr 1fr;gap:28px}
.tile{aspect-ratio:4/3;border-radius:var(--r);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:6px;color:var(--hero-text);background:linear-gradient(135deg,var(--hero-a),var(--hero-b));font-weight:700;text-align:center;padding:12px}
.tile:nth-child(even){background:linear-gradient(135deg,var(--accent),var(--hero-a));color:var(--accent-text)}.tile span{font-size:2.6rem}
.band{background:linear-gradient(135deg,var(--hero-a),var(--hero-b));color:var(--hero-text);text-align:center;padding:52px 0}.band .btn{background:var(--accent);color:var(--accent-text);border-color:var(--accent)}
details{background:var(--surface);border:1px solid var(--line);border-radius:12px;padding:14px 18px;margin-bottom:10px}summary{cursor:pointer;font-weight:700}details p{margin:10px 0 0}
.ph{background:#fff3b0;color:#5a4500;border-radius:6px;padding:0 6px;font-size:.92em}
form.contact-form{display:grid;gap:12px}input,textarea{width:100%;padding:12px;border-radius:10px;border:1px solid var(--line);background:var(--bg);color:var(--text);font:inherit}
label{font-weight:600;display:block;margin-bottom:4px}.note{color:var(--muted);font-size:.95rem}
.stat{font:800 2.4rem var(--head);color:var(--link)}
footer{background:var(--surface);border-top:1px solid var(--line);padding:36px 0;margin-top:0}.foot{display:flex;justify-content:space-between;gap:20px;flex-wrap:wrap}.foot a{margin-right:14px}
@media(max-width:760px){.hero-in,.split{grid-template-columns:1fr}.hero{padding:48px 0}.hero-art{font-size:6rem}.menu-btn{display:block}nav{display:none;position:absolute;left:0;right:0;top:64px;background:var(--bg);flex-direction:column;padding:10px 20px;border-bottom:1px solid var(--line)}nav.open{display:flex}}
@media(prefers-reduced-motion:reduce){html{scroll-behavior:auto}}
`;
    }
    function js() {
      return `/* Menu button, footer year and the contact form (no server needed). */
(function(){
var b=document.querySelector(".menu-btn"),n=document.getElementById("nav");
if(b&&n){b.addEventListener("click",function(){var o=n.classList.toggle("open");b.setAttribute("aria-expanded",o)});n.addEventListener("click",function(e){if(e.target.tagName==="A"){n.classList.remove("open");b.setAttribute("aria-expanded","false")}})}
var y=document.getElementById("year");if(y)y.textContent=new Date().getFullYear();
var f=document.querySelector("form.contact-form");
if(f){f.addEventListener("submit",function(e){e.preventDefault();
var who=f.elements.who.value.trim(),msg=f.elements.msg.value.trim(),note=document.getElementById("form-note");
var text="Hello, my name is "+who+". "+msg,wa=f.getAttribute("data-wa"),em=f.getAttribute("data-email");
if(wa){window.open("https://wa.me/"+wa+"?text="+encodeURIComponent(text),"_blank","noopener")}
else if(em){window.location.href="mailto:"+em+"?subject="+encodeURIComponent("Message from "+who)+"&body="+encodeURIComponent(msg)}
else if(note){note.textContent="This form is not connected yet. Add a WhatsApp number or email address to the site first."}
})}
})();
`;
    }

    /* ---------- sections ---------- */
    const linkTo = (spec, id) => {
      const p = pageList(spec).find(x => x.id === id);
      if (spec.layout === "single") return "#" + id;
      return p ? p.file : "index.html";
    };
    const ctaHref = spec => ctaLabel(spec).href || linkTo(spec, "contact");
    const sec = (id, cls, inner) => `<section class="block ${cls || ""}" id="${id}"><div class="wrap">${inner}</div></section>`;
    const head = (spec, title, sub, h1) => spec.layout === "single" ? "" : `<section class="page-head"><div class="wrap"><${h1 ? "h1" : "h2"}>${esc(title)}</${h1 ? "h1" : "h2"}>${sub ? "<p>" + esc(sub) + "</p>" : ""}</div></section>`;

    const S = {
      hero(spec) {
        const t = typeOf(spec), c = ctaLabel(spec), sub = fill(t.about[0], spec);
        return `<section class="hero" id="home"><div class="wrap hero-in"><div><p class="eyebrow">${t.emoji} ${esc(spec.place || t.label)}</p><h1>${esc(spec.name)}</h1><p class="lead">${esc(taglineOf(spec))}</p><p>${esc(sub)}</p><div class="btns"><a class="btn" href="${esc(ctaHref(spec))}"${c.href ? ' target="_blank" rel="noopener"' : ""}>${esc(c.label)}</a><a class="btn ghost" href="${esc(linkTo(spec, "offer"))}">See ${esc(t.offerLabel.toLowerCase())}</a></div></div><div class="hero-art" aria-hidden="true">${t.emoji}</div></div></section>`;
      },
      highlights(spec) {
        const t = typeOf(spec);
        return sec("highlights", "", `<h2>${t.id === "event" ? "Event details" : "Why choose " + esc(spec.name)}</h2><div class="grid">${t.values.map(v => `<article class="card"><span class="ico" aria-hidden="true">${v.i}</span><h3>${esc(v.t)}</h3><p>${esc(fill(v.d, spec))}</p></article>`).join("")}</div>`);
      },
      offer(spec, limit, id) {
        const t = typeOf(spec), items = offerItems(spec).slice(0, limit || 99);
        const more = limit && spec.offers.length > limit ? `<p style="margin-top:20px"><a class="btn ghost" href="${esc(linkTo(spec, "offer"))}">See all ${esc(t.offerLabel.toLowerCase())}</a></p>` : "";
        return sec(id || "offer", "alt", `<h2>${esc(t.offerLabel)}</h2><div class="grid">${items.map(o => `<article class="card"><span class="ico" aria-hidden="true">${ICONS[o.i % ICONS.length]}</span><h3>${esc(o.t)}</h3><p>${esc(o.d)}</p></article>`).join("")}</div>${more}`);
      },
      about(spec) {
        const t = typeOf(spec);
        return sec("about", "", `<div class="split"><div><h2>About ${esc(spec.name)}</h2>${t.about.map(p => "<p>" + esc(fill(p, spec)) + "</p>").join("")}</div><aside class="card"><h3>Quick facts</h3><p><strong>Based in:</strong> ${spec.place ? esc(spec.place) : PH("add your town")}</p><p><strong>Type:</strong> ${esc(t.label)}</p><p><a class="btn" href="${esc(ctaHref(spec))}">${esc(ctaLabel(spec).label)}</a></p></aside></div>`);
      },
      team() { return sec("team", "alt", `<h2>Meet the team</h2><div class="grid">${[1, 2, 3].map(() => `<article class="card"><span class="ico" aria-hidden="true">🙂</span><h3>${PH("Name")}</h3><p>${PH("Role and a short sentence about this person")}</p></article>`).join("")}</div>`); },
      pricing(spec) {
        const items = offerItems(spec);
        return sec("pricing", "", `<h2>Prices</h2><p class="note">Add your real prices below. I did not invent any.</p><div class="grid">${items.map(o => `<article class="card"><h3>${esc(o.t)}</h3><p>${esc(o.d)}</p><p><strong>Price:</strong> ${PH("add your price")}</p><a class="btn ghost" href="${esc(ctaHref(spec))}">Ask about this</a></article>`).join("")}</div>`);
      },
      gallery(spec) {
        const items = offerItems(spec), tiles = Array.from({ length: 6 }, (_, i) => items[i % items.length]);
        return sec("gallery", "alt", `<h2>Gallery</h2><div class="grid">${tiles.map((o, i) => `<div class="tile"><span aria-hidden="true">${typeOf(spec).emoji}</span>${esc(o.t)}</div>`).join("")}</div><p class="note">${PH("Replace these tiles with your own photos")}</p>`);
      },
      testimonials() { return sec("testimonials", "alt", `<h2>What customers say</h2><div class="grid">${[1, 2, 3].map(() => `<figure class="card" style="margin:0"><blockquote style="margin:0 0 10px">${PH("Paste a real customer quote here")}</blockquote><figcaption>${PH("Customer name")}</figcaption></figure>`).join("")}</div>`); },
      stats() { return sec("stats", "", `<div class="grid">${["Happy customers", "Years in business", "Projects done"].map(l => `<div class="card"><div class="stat">${PH("0")}</div><p>${esc(l)}</p></div>`).join("")}</div>`); },
      blog() { return sec("blog", "", `<h2>News and updates</h2><div class="grid">${[1, 2, 3].map(() => `<article class="card"><p class="note">${PH("Date")}</p><h3>${PH("Post title")}</h3><p>${PH("Write two sentences about this post")}</p></article>`).join("")}</div>`); },
      faq(spec) {
        const t = typeOf(spec);
        return sec("faq", "", `<h2>Frequently asked questions</h2>${t.faq.map(f => `<details><summary>${esc(f.q)}</summary><p>${esc(fill(f.a, spec))}</p></details>`).join("")}`);
      },
      contact(spec) {
        const c = spec.contact, wa = c.whatsapp && c.phone ? waDigits(c.phone) : "";
        const map = spec.extras.map ? `<p><a class="btn ghost" target="_blank" rel="noopener" href="https://www.google.com/maps/search/?api=1&amp;query=${encodeURIComponent(spec.name + " " + spec.place)}">Open in Google Maps</a></p>` : "";
        return sec("contact", "", `<div class="split"><div><h2>Contact ${esc(spec.name)}</h2><p><strong>Phone / WhatsApp:</strong> ${c.phone ? `<a href="tel:${esc(c.phone.replace(/[^\d+]/g, ""))}">${esc(c.phone)}</a>` : PH("add your phone number")}</p><p><strong>Email:</strong> ${c.email ? `<a href="mailto:${esc(c.email)}">${esc(c.email)}</a>` : PH("add your email address")}</p><p><strong>Location:</strong> ${spec.place ? esc(spec.place) : PH("add your address")}</p><p><strong>Opening hours:</strong> ${PH("add your hours")}</p>${map}</div><form class="contact-form card" data-wa="${esc(wa)}" data-email="${esc(c.email || "")}"><div><label for="who">Your name</label><input id="who" name="who" required autocomplete="name"></div><div><label for="msg">Your message</label><textarea id="msg" name="msg" rows="5" required></textarea></div><button class="btn" type="submit">${wa ? "Send on WhatsApp" : c.email ? "Send by email" : "Send message"}</button><p class="note" id="form-note" aria-live="polite"></p></form></div>`);
      },
      cta(spec) {
        const c = ctaLabel(spec);
        return `<section class="band"><div class="wrap"><h2>Ready to get started?</h2><p>Talk to ${esc(spec.name)} today.</p><a class="btn" href="${esc(ctaHref(spec))}"${c.href ? ' target="_blank" rel="noopener"' : ""}>${esc(c.label)}</a></div></section>`;
      }
    };

    /* ---------- pages ---------- */
    function bodyFor(spec, id) {
      const t = typeOf(spec);
      switch (id) {
        case "home": return [S.hero(spec), S.highlights(spec), S.offer(spec, 3, spec.layout === "single" ? "offer" : "offer-teaser"), spec.extras.stats && S.stats(), spec.extras.testimonials && S.testimonials(), spec.layout === "single" ? "" : S.cta(spec)].filter(Boolean).join("\n");
        case "about": return head(spec, "About " + spec.name, taglineOf(spec), true) + S.about(spec) + (spec.extras.team ? S.team() : "") + (spec.extras.testimonials && spec.layout !== "single" ? "" : "");
        case "offer": return head(spec, t.offerLabel, "What " + spec.name + " offers", true) + S.offer(spec, 0, "offer");
        case "pricing": return head(spec, "Prices", "Clear prices for " + spec.name, true) + S.pricing(spec);
        case "gallery": return head(spec, "Gallery", "A look at " + spec.name, true) + S.gallery(spec);
        case "blog": return head(spec, "News and updates", "What is new at " + spec.name, true) + S.blog(spec);
        case "contact": return head(spec, "Contact us", "We would love to hear from you", true) + S.contact(spec) + (spec.extras.faq ? S.faq(spec) : "");
      }
      return "";
    }
    function docFor(spec, page, body, pages) {
      const t = typeOf(spec), single = spec.layout === "single";
      const nav = pages.map(p => `<a href="${single ? "#" + p.id : p.file}"${!single && p.id === page.id ? ' aria-current="page"' : ""}>${esc(p.label)}</a>`).join("");
      const desc = fill(t.about[0], spec).slice(0, 155);
      const fav = encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><text y=".9em" font-size="90">${t.emoji}</text></svg>`);
      return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(page.id === "home" ? spec.name + " | " + taglineOf(spec) : page.label + " | " + spec.name)}</title>
<meta name="description" content="${esc(desc)}">
<link rel="icon" href="data:image/svg+xml,${fav}">
<link rel="stylesheet" href="styles.css">
</head>
<body>
<a class="skip" href="#main">Skip to content</a>
<header class="top"><div class="wrap bar"><a class="brand" href="${single ? "#home" : "index.html"}">${t.emoji} ${esc(spec.name)}</a><button class="menu-btn" type="button" aria-expanded="false" aria-controls="nav">Menu</button><nav id="nav" aria-label="Main">${nav}</nav></div></header>
<main id="main">
${body}
</main>
<footer><div class="wrap foot"><div><strong>${esc(spec.name)}</strong><br><span class="note">${esc(taglineOf(spec))}</span></div><div>${nav.replace(/ aria-current="page"/g, "")}</div><div class="note">&copy; <span id="year">${new Date().getFullYear()}</span> ${esc(spec.name)}. Made with Chiedza AI.</div></div></footer>
<script src="script.js"></script>
</body>
</html>
`;
    }
    function render(spec) {
      const pages = pageList(spec), P = palette(spec), files = {};
      if (spec.layout === "single") {
        const body = [S.hero(spec), S.highlights(spec), S.about(spec), spec.extras.team && S.team(), S.offer(spec, 0, "offer"), spec.extras.pricing && S.pricing(spec), spec.extras.gallery && S.gallery(spec), spec.extras.stats && S.stats(), spec.extras.testimonials && S.testimonials(), spec.extras.blog && S.blog(spec), S.cta(spec), S.contact(spec), spec.extras.faq && S.faq(spec)].filter(Boolean).join("\n");
        files["index.html"] = docFor(spec, pages[0], body, pages.filter(p => p.id !== "about" || true));
      } else pages.forEach(p => { files[p.file] = docFor(spec, p, bodyFor(spec, p.id), pages); });
      files["styles.css"] = css(spec, P);
      files["script.js"] = js();
      files["README.txt"] = `${spec.name}\nBuilt by Chiedza AI (reasoning only, no outside AI).\n\nHow to use:\n1. Open index.html in a browser to see the site.\n2. Replace anything marked [like this] (yellow in the browser) with your real details.\n3. To change colours, edit the variables at the top of styles.css.\n4. To publish for free, upload this whole folder to Netlify Drop, Cloudflare Pages or GitHub Pages.\n`;
      render.notes = P.notes;
      return files;
    }

    /* ---------- self-check ---------- */
    function validate(files, spec) {
      const checks = [], add = (ok, text) => checks.push({ ok, text });
      const htmls = Object.keys(files).filter(f => f.endsWith(".html"));
      const ids = {};
      htmls.forEach(f => { ids[f] = new Set([...files[f].matchAll(/\bid="([^"]+)"/g)].map(m => m[1])); });
      let badLinks = [], noH1 = [], noTitle = [];
      htmls.forEach(f => {
        const h = files[f];
        if ((h.match(/<h1[ >]/g) || []).length !== 1) noH1.push(f);
        if (!/<title>[^<]+<\/title>/.test(h) || !/<html lang="/.test(h) || !/name="viewport"/.test(h)) noTitle.push(f);
        for (const m of h.matchAll(/\bhref="([^"]*)"/g)) {
          const href = m[1].replace(/&amp;/g, "&");
          if (!href || /^(https?:|mailto:|tel:|data:)/.test(href)) continue;
          const [file, hash] = href.split("#");
          const target = file || f;
          if (!files[target]) { badLinks.push(f + " -> " + href); continue; }
          if (hash && target.endsWith(".html") && !ids[target].has(hash)) badLinks.push(f + " -> " + href);
        }
      });
      add(!badLinks.length, badLinks.length ? "Broken links: " + badLinks.slice(0, 3).join(", ") : "Every menu and button link goes to a page or section that exists (" + htmls.length + " page" + (htmls.length > 1 ? "s" : "") + ").");
      add(!noH1.length, noH1.length ? "Pages without exactly one main heading: " + noH1.join(", ") : "Each page has exactly one main heading (good for reading and search).");
      add(!noTitle.length, noTitle.length ? "Missing title, language or viewport on: " + noTitle.join(", ") : "Every page has a title, a language and a mobile viewport.");
      const P = palette(spec), pairs = [["body text on background", P.text, P.bg], ["button text", P.btnText, P.btn], ["header text", P.heroText, P.heroA], ["header text (far corner)", P.heroText, P.heroB], ["accent button text", P.accentText, P.accent], ["links on background", P.link, P.bg], ["muted text on background", P.muted, P.bg]];
      const bad = pairs.filter(p => contrast(p[1], p[2]) < 4.5);
      add(!bad.length, bad.length ? "Low contrast: " + bad.map(b => b[0]).join(", ") : "All text colours reach the 4.5:1 contrast level, so it is readable.");
      const all = htmls.map(f => files[f]).join("");
      add(!/<script(?![^>]*src=)[^>]*>/i.test(all) && !/\son\w+=/i.test(all), "No inline scripts or event handlers, so text you typed cannot run as code.");
      const ph = (all.match(/class="ph"/g) || []).length;
      return { checks, placeholders: ph, passed: checks.filter(c => c.ok).length, total: checks.length, notes: P.notes };
    }

    /* ---------- the answer ---------- */
    function summarise(spec, files, report, log, fresh) {
      const t = typeOf(spec), n = Object.keys(files).length;
      const steps = log.map(l => `<li>${l.icon} <strong>${esc(l.step)}:</strong> ${l.text}</li>`).join("");
      const checks = report.checks.map(c => `<li>${c.ok ? "✅" : "⚠️"} ${esc(c.text)}</li>`).join("") + report.notes.map(x => `<li>🎨 ${esc(x)}.</li>`).join("");
      const tips = [];
      if (!spec.nameGiven) tips.push(R.tips.noName);
      if (!spec.contact.phone && !spec.contact.email) tips.push(R.tips.noContact);
      if (spec.extras.gallery) tips.push(R.tips.noPhotos);
      if (spec.extras.testimonials) tips.push(R.tips.noQuotes);
      return `<div class="site-card"><p>${t.emoji} <strong>${fresh ? "I built" : "I updated"} \u201c${esc(spec.name)}\u201d</strong>: ${n} files, ${Object.keys(files).filter(f => f.endsWith(".html")).length} page${Object.keys(files).filter(f => f.endsWith(".html")).length > 1 ? "s" : ""}, works on phones.</p>
<details ${fresh ? "open" : ""}><summary>🧠 How I reasoned</summary><ul>${steps}</ul></details>
<details><summary>🔍 I checked my own work (${report.passed}/${report.total} passed)</summary><ul>${checks}</ul></details>
${report.placeholders ? `<p>📝 <strong>${report.placeholders} place${report.placeholders > 1 ? "s" : ""} need your real details</strong> (marked yellow). I never invent phone numbers, prices or customer quotes.</p>` : ""}${tips.length ? "<ul>" + tips.map(x => "<li>" + esc(x) + "</li>").join("") + "</ul>" : ""}
<div class="site-actions"><button type="button" data-site="preview">👁️ Preview</button><button type="button" data-site="zip">⬇️ Download ZIP</button><button type="button" data-site="code">📄 View code</button></div></div>`;
    }
    function build(spec, log, fresh) {
      const files = render(spec), report = validate(files, spec);
      return { html: summarise(spec, files, report, log, fresh), chips: ["Make it green", "Add a gallery", "Add pricing", "Dark mode", "Make it one page"], site: { spec, files, report } };
    }
    function respond(text, cur) {
      const t = String(text || "").trim();
      if (R.intent.startOver.some(p => hasWord(t, p))) return { html: "Okay, clean slate. Tell me about the new website: what it is for, its name, what you offer and the colours you like.", reset: true, chips: [] };
      const refersToCurrent = /\b(it|this|the (web)?site|the (web)?page|my (web)?site|my (web)?page)\b/i.test(t);
      const wantsNew = isNewSiteRequest(t) && !(cur && refersToCurrent);
      if (wantsNew) { const u = understand(t); return build(u.spec, u.log, true); }
      if (cur) {
        const spec = JSON.parse(JSON.stringify(cur.spec)), changes = applyEdit(spec, t);
        if (changes.length) return build(spec, [{ icon: "✏️", step: "What changed", text: changes.join(" ") }], false);
      }
      return null;
    }


    return { understand, applyEdit, isNewSiteRequest, render, validate, summarise, respond, pageList, typeOf, contrast, TYPES };
  }

  /* ---------- browser wiring ---------- */
  function wire() {
    const Br = root.ChiedzaBrain; if (!Br) return;
    const get = u => fetch("brain/reasoning/" + u, { cache: "no-cache" }).then(r => { if (!r.ok) throw new Error(u); return r.json(); });
    Br.ready.then(async () => {
      let D;
      try {
        const [rules, a, b] = await Promise.all([get("site-rules.json"), get("website.json"), get("website-more.json")]);
        D = { rules, types: a.types.concat(b.types) };
      } catch (e) { console.warn("Chiedza site files could not be loaded.", e.message); return; }
      const S = create(D);
      root.ChiedzaSite = { engine: S, current: null };
      Br.register({
        name: "website",
        handle(input) {
          const st = root.ChiedzaSite; let out;
          try { out = S.respond(input, st.current); } catch (e) { console.warn("site builder error", e); return null; }
          if (!out) return null;
          if (out.site) st.current = out.site;
          return { html: out.html, chips: out.chips, site: out.site || null };
        }
      });
    });
  }
  const api = { create };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else { root.ChiedzaSiteCore = api; wire(); }
})(typeof window !== "undefined" ? window : globalThis);
