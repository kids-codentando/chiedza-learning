/* ============================================================
   CHIEDZA BRAIN - loader + skills engine
   Reads every file in /brain (manifest.json lists them) and
   gives Chiedza AI memory, safety rules, knowledge and skills.
   Edit the files in /brain to change what the AI knows. Skills
   that need code live here; project writing is in brain-projects.js.
   Created by Ntandomods.
   ============================================================ */
(function () {
  "use strict";
  const BASE = "brain/";
  const MEM_KEY = "chiedza_brain_memory_v1";
  const GAP_KEY = "chiedza_brain_gaps_v1";

  const B = { loaded: false, identity: {}, safety: {}, skills: [], knowledge: [], glossary: [], langs: {}, fun: {}, handlers: [], pending: null };

  /* ---------- helpers ---------- */
  const STOP = new Set("a an the is are was were am be to of in on at for and or but with what whats who how why when where which do does did can could would should i me my we you your it its this that these those about tell please explain give show want need some any more from as by us our".split(" "));
  const stem = w => w.replace(/(ing|ed|es|s)$/i, m => (w.length > 4 ? "" : m));
  const tokens = s => (s || "").toLowerCase().replace(/<[^>]+>/g, " ").replace(/[^a-z0-9' ]+/g, " ").split(/\s+/).filter(w => w && !STOP.has(w)).map(stem);
  const plain = h => (h || "").replace(/<[^>]+>/g, " ").replace(/&nbsp;/g, " ").replace(/\s+/g, " ").trim();
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const pick = a => a[Math.floor(Math.random() * a.length)];
  const cap = s => s.replace(/\b[a-z]/g, c => c.toUpperCase());
  const today = () => new Date().toLocaleDateString("en-CA");
  function rngFrom(seed) { let a = seed >>> 0; return () => { a |= 0; a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
  const daySeed = () => Number(today().replace(/-/g, ""));
  const appState = () => (typeof state !== "undefined" ? state : null);

  /* ---------- memory (only on this device) ---------- */
  function mem() { try { return Object.assign({ name: "", fav: [], weak: {}, level: "", daily: { last: "", streak: 0 }, projects: [], asked: 0 }, JSON.parse(localStorage.getItem(MEM_KEY) || "{}")); } catch (e) { return { name: "", fav: [], weak: {}, level: "", daily: { last: "", streak: 0 }, projects: [], asked: 0 }; } }
  function saveMem(m) { try { localStorage.setItem(MEM_KEY, JSON.stringify(m)); } catch (e) {} }
  const myName = () => { const m = mem(), s = appState(); return m.name || (s && s.profile && s.profile.name) || ""; };

  /* ---------- loading the brain files ---------- */
  const getJSON = u => fetch(BASE + u, { cache: "no-cache" }).then(r => { if (!r.ok) throw new Error(u); return r.json(); });
  const getText = u => fetch(BASE + u, { cache: "no-cache" }).then(r => { if (!r.ok) throw new Error(u); return r.text(); });
  function parseIdentity(md) {
    const o = {};
    md.split("\n").forEach(l => { const m = l.match(/^([a-z]+):\s*(.+)$/i); if (m) o[m[1].toLowerCase()] = m[2].trim(); });
    return o;
  }
  const ready = (async function load() {
    try {
      const man = await getJSON("manifest.json");
      B.manifest = man;
      const safe = p => p.catch(() => null);
      const [idn, saf, sk, gl, fun, ...rest] = await Promise.all([
        safe(getText(man.identity)), safe(getJSON(man.safety)), safe(getJSON(man.skills)), safe(getJSON(man.glossary)), safe(getJSON(man.fun)),
        ...(man.knowledge || []).map(f => safe(getJSON(f))), ...(man.languages || []).map(f => safe(getJSON(f))),
        safe(man.projects ? getJSON(man.projects) : Promise.resolve(null))
      ]);
      B.identity = idn ? parseIdentity(idn) : {};
      B.safety = saf || {}; B.skills = (sk && sk.skills) || []; B.glossary = (gl && gl.words) || []; B.fun = fun || {};
      const nk = (man.knowledge || []).length, nl = (man.languages || []).length;
      rest.slice(0, nk).forEach(k => { if (k && k.entries) k.entries.forEach(e => B.knowledge.push(Object.assign({ topic: k.topic }, e, { kt: tokens(e.keywords), at: tokens(e.a) }))); });
      rest.slice(nk, nk + nl).forEach(l => { if (l && l.language) B.langs[l.language.toLowerCase()] = l; });
      B.projectTemplates = rest[nk + nl] || null;
      // taught by the owner (live from the server; falls back to the committed file)
      let tr = null;
      try { const r = await fetch("/api/brain/trained", { cache: "no-cache" }); if (r.ok) tr = await r.json(); } catch (e) {}
      if (!tr) tr = await safe(getJSON("knowledge/trained.json"));
      if (tr && tr.entries) tr.entries.forEach(e => { B.knowledge = B.knowledge.filter(k => k.id !== e.id); B.knowledge.push(Object.assign({ topic: tr.topic }, e, { trained: true, kt: tokens(e.keywords), at: tokens(e.a) })); });
      B.loaded = true;
      (B.onload || []).forEach(f => { try { f(); } catch (e) {} });
    } catch (e) { console.warn("Chiedza Brain files could not be loaded (open the site through the server). Built-in skills still work.", e.message); }
  })();

  /* ---------- 1. safety guard ---------- */
  function safetyCheck(input) {
    const order = ["help_me", "emergency", "off_limits", "grown_up", "privacy", "homework_cheating"];
    for (const k of order) {
      const g = B.safety[k]; if (!g) continue;
      for (const p of g.patterns || []) { try { if (new RegExp(p, "i").test(input)) return { html: g.reply, safety: k }; } catch (e) {} }
    }
    return null;
  }

  /* ---------- 2. calculator (exact fractions) ---------- */
  const gcd = (a, b) => { a = a < 0n ? -a : a; b = b < 0n ? -b : b; while (b) { [a, b] = [b, a % b]; } return a; };
  const Fr = (n, d = 1n) => { if (d === 0n) throw new Error("div0"); if (d < 0n) { n = -n; d = -d; } const g = gcd(n, d) || 1n; return { n: n / g, d: d / g }; };
  const fNum = s => { const [i, f = ""] = s.split("."); return Fr(BigInt(i + f), 10n ** BigInt(f.length)); };
  const fAdd = (a, b) => Fr(a.n * b.d + b.n * a.d, a.d * b.d), fSub = (a, b) => Fr(a.n * b.d - b.n * a.d, a.d * b.d);
  const fMul = (a, b) => Fr(a.n * b.n, a.d * b.d), fDiv = (a, b) => { if (b.n === 0n) throw new Error("div0"); return Fr(a.n * b.d, a.d * b.n); };
  function fPow(a, b) { if (b.d !== 1n || b.n > 30n || b.n < -30n) throw new Error("pow"); let e = Number(b.n), r = Fr(1n); for (let i = 0; i < Math.abs(e); i++) r = fMul(r, a); return e < 0 ? fDiv(Fr(1n), r) : r; }
  function evalExpr(str) {
    const t = str.match(/\d+(?:\.\d+)?|[+\-*/^()]/g) || []; let i = 0;
    const peek = () => t[i], next = () => t[i++];
    function prim() { const x = next(); if (x === "(") { const v = expr(); if (next() !== ")") throw new Error("syntax"); return v; } if (x && /^\d/.test(x)) return fNum(x); throw new Error("syntax"); }
    function unary() { if (peek() === "-") { next(); const v = unary(); return Fr(-v.n, v.d); } if (peek() === "+") { next(); return unary(); } return pw(); }
    function pw() { const b = prim(); if (peek() === "^") { next(); return fPow(b, unary()); } return b; }
    function term() { let v = unary(); while (peek() === "*" || peek() === "/") { const o = next(), r = unary(); v = o === "*" ? fMul(v, r) : fDiv(v, r); } return v; }
    function expr() { let v = term(); while (peek() === "+" || peek() === "-") { const o = next(), r = term(); v = o === "+" ? fAdd(v, r) : fSub(v, r); } return v; }
    const v = expr(); if (i < t.length) throw new Error("syntax"); return v;
  }
  function fShow(f) {
    const neg = f.n < 0n, n = neg ? -f.n : f.n, sgn = neg ? "-" : "";
    const dec = Number(f.n) / Number(f.d), decS = Number.isFinite(dec) ? String(+dec.toFixed(6)) : "";
    if (f.d === 1n) return { main: sgn + n.toString(), dec: "" };
    const whole = n / f.d, rem = n % f.d;
    const frac = whole > 0n ? `${sgn}${whole} ${rem}/${f.d}` : `${sgn}${rem}/${f.d}`;
    return { main: `${neg && whole === 0n ? "" : ""}${frac}`, dec: decS };
  }
  function calcHtml(shown, f, working) {
    const r = fShow(f);
    return `🧮 <strong>${esc(shown)} = ${esc(r.main)}</strong>${r.dec ? `<br>As a decimal: <strong>${esc(r.dec)}</strong>` : ""}${working ? `<br><br>📝 <em>Working:</em> ${working}` : ""}`;
  }
  function normalizeMath(s) {
    s = s.toLowerCase().replace(/[?=]/g, " ").replace(/\b(what's|what is|whats|calculate|work out|solve|how much is|compute|please|find)\b/g, " ");
    s = s.replace(/(\d),(\d{3})/g, "$1$2").replace(/\bto the power of\b/g, "^").replace(/\bsquared\b/g, "^2").replace(/\bcubed\b/g, "^3")
      .replace(/\b(multiplied by|times)\b/g, "*").replace(/\b(divided by|over)\b/g, "/").replace(/\b(minus|take away|subtract)\b/g, "-").replace(/\b(plus|add)\b/g, "+")
      .replace(/[×÷−]/g, m => ({ "×": "*", "÷": "/", "−": "-" }[m]));
    for (let k = 0; k < 4; k++) s = s.replace(/(\d|\))\s*x\s*(\d|\()/g, "$1*$2");
    return s.trim();
  }
  function mulWorking(a, b) {
    if (a.d !== 1n || b.d !== 1n || a.n < 10n || b.n < 10n || b.n > 99n || a.n > 9999n) return "";
    const tens = (b.n / 10n) * 10n, ones = b.n % 10n;
    return `${a.n} × ${b.n} = (${a.n} × ${tens}) + (${a.n} × ${ones}) = ${a.n * tens} + ${a.n * ones} = <strong>${a.n * b.n}</strong>`;
  }
  function trySkillCalc(raw) {
    const s0 = raw.toLowerCase();
    let m;
    if ((m = s0.match(/(\d+(?:\.\d+)?)\s*(?:%|percent|per cent)\s*of\s*(\d+(?:\.\d+)?)/))) {
      const p = fNum(m[1]), v = fNum(m[2]), r = fDiv(fMul(p, v), Fr(100n));
      return { html: calcHtml(`${m[1]}% of ${m[2]}`, r, `${m[2]} ÷ 100 × ${m[1]} = ${fShow(fDiv(v, Fr(100n))).dec || fShow(fDiv(v, Fr(100n))).main} × ${m[1]}`), chips: ["Quiz me", "Explain percentages"] };
    }
    if ((m = s0.match(/percent(?:age)?\s*(?:is|of)?\s*(\d+(?:\.\d+)?)\s*(?:out of|of|\/)\s*(\d+(?:\.\d+)?)/)) || (m = s0.match(/(\d+(?:\.\d+)?)\s*(?:out of|\/)\s*(\d+(?:\.\d+)?)\s*(?:as a |in |to )?(?:percent|percentage|%)/))) {
      try { const r = fMul(fDiv(fNum(m[1]), fNum(m[2])), Fr(100n)); const x = fShow(r); return { html: `🧮 <strong>${esc(m[1])} out of ${esc(m[2])} = ${esc(x.dec || x.main)}%</strong><br><br>📝 <em>Working:</em> ${m[1]} ÷ ${m[2]} × 100` }; } catch (e) { return { html: "I cannot divide by zero. 😊" }; }
    }
    if ((m = s0.match(/square root of (\d+(?:\.\d+)?)/))) {
      const v = Number(m[1]), r = Math.sqrt(v), exact = Number.isInteger(r);
      return { html: `🧮 <strong>√${m[1]} ${exact ? "= " + r : "≈ " + r.toFixed(4)}</strong>${exact ? `<br>Because ${r} × ${r} = ${m[1]}.` : `<br>It is not a whole number: it is between ${Math.floor(r)} and ${Math.ceil(r)}.`}` };
    }
    if ((m = s0.match(/\b(half|quarter|third|double|triple|twice)\b(?: of)?\s*(\d+(?:\.\d+)?)/))) {
      const k = { half: [1n, 2n], quarter: [1n, 4n], third: [1n, 3n], double: [2n, 1n], twice: [2n, 1n], triple: [3n, 1n] }[m[1]];
      return { html: calcHtml(`${m[1]} of ${m[2]}`, fMul(fNum(m[2]), Fr(k[0], k[1])), "") };
    }
    if ((m = s0.match(/(?:times tables?|multiplication table)\s*(?:of|for)?\s*(\d+)/) || s0.match(/(\d+)\s*times tables?/))) {
      const n = Number(m[1]); if (n > 0 && n < 1000) {
        const rows = Array.from({ length: 12 }, (_, i) => `${n} × ${i + 1} = <strong>${n * (i + 1)}</strong>`).join("<br>");
        return { html: `✖️ <strong>${n} times table</strong><br>${rows}`, chips: [`Quiz me on ${n} times table`, "Daily challenge"] };
      }
    }
    const s = normalizeMath(s0);
    if (/^[\d\s.+\-*/^()]+$/.test(s) && /\d/.test(s) && /[+\-*/^]/.test(s.replace(/^\s*-/, ""))) {
      try {
        const r = evalExpr(s);
        const useDiv = /÷|divided|over/.test(s0);
        const shown = s.replace(/\*/g, " × ").replace(/\//g, useDiv ? " ÷ " : "/").replace(/\s*([+-])\s*/g, " $1 ").replace(/\s+/g, " ").trim();
        let work = "";
        const two = s.match(/^\s*(\d+(?:\.\d+)?)\s*([*/+-])\s*(\d+(?:\.\d+)?)\s*$/);
        if (two) {
          const a = fNum(two[1]), b = fNum(two[3]);
          if (two[2] === "*") work = mulWorking(a, b);
          if (two[2] === "/" && a.d === 1n && b.d === 1n && b.n !== 0n && a.n % b.n !== 0n) work = `${a.n} ÷ ${b.n} = ${a.n / b.n} remainder ${a.n % b.n}`;
        } else if (/[*^()]/.test(s) && /[+-]/.test(s.replace(/^\s*-/, ""))) work = "I followed <strong>BODMAS</strong>: brackets first, then powers, then × and ÷, then + and -.";
        return { html: calcHtml(shown, r, work), chips: ["Quiz me", "Daily challenge"] };
      } catch (e) {
        if (e.message === "div0") return { html: "🧮 We cannot divide by zero! Nothing can be shared into 0 groups. 😊" };
        if (e.message === "pow") return { html: "🧮 That power is too big for me. Try a smaller one!" };
      }
    }
    return null;
  }

  /* ---------- 3. unit converter ---------- */
  const U = {};
  const addU = (cat, base, defs) => Object.entries(defs).forEach(([names, f]) => names.split("|").forEach(n => U[n] = { cat, f, base }));
  addU("length", "metres", { "mm|millimetre|millimeter": 0.001, "cm|centimetre|centimeter": 0.01, "m|metre|meter": 1, "km|kilometre|kilometer": 1000, "in|inch|inche": 0.0254, "ft|foot|feet": 0.3048, "yd|yard": 0.9144, "mile": 1609.344 });
  addU("mass", "grams", { "mg|milligram": 0.001, "g|gram": 1, "kg|kilogram|kilo": 1000, "t|tonne|ton": 1e6, "lb|pound": 453.592, "oz|ounce": 28.3495 });
  addU("volume", "millilitres", { "ml|millilitre|milliliter": 1, "cl|centilitre": 10, "l|litre|liter": 1000, "gallon": 3785.41 });
  addU("time", "seconds", { "s|sec|second": 1, "min|minute": 60, "h|hr|hour": 3600, "day": 86400, "week": 604800 });
  const TEMP = { c: "c", celsius: "c", "°c": "c", f: "f", fahrenheit: "f", "°f": "f", k: "k", kelvin: "k" };
  function trySkillConvert(raw) {
    const m = raw.toLowerCase().replace(/convert|how many|how much is/g, " ").match(/(-?\d+(?:[.,]\d+)?)\s*(?:degrees?\s*)?([a-z°]+)\s*(?:to|in|into|as|=)\s*([a-z°]+)/);
    if (!m) return null;
    const v = parseFloat(m[1].replace(",", ".")), strip = u => (U[u] ? u : U[u.replace(/s$/, "")] ? u.replace(/s$/, "") : U[u.replace(/es$/, "")] ? u.replace(/es$/, "") : u);
    const a = strip(m[2]), b = strip(m[3]);
    const fmt = x => String(+x.toPrecision(7));
    if (TEMP[a] && TEMP[b]) {
      const toC = TEMP[a] === "c" ? v : TEMP[a] === "f" ? (v - 32) * 5 / 9 : v - 273.15;
      const out = TEMP[b] === "c" ? toC : TEMP[b] === "f" ? toC * 9 / 5 + 32 : toC + 273.15;
      return { html: `📏 <strong>${v}°${TEMP[a].toUpperCase()} = ${fmt(out)}°${TEMP[b].toUpperCase()}</strong>` };
    }
    if (U[a] && U[b] && U[a].cat === U[b].cat) {
      const out = v * U[a].f / U[b].f;
      return { html: `📏 <strong>${v} ${m[2]} = ${fmt(out)} ${m[3]}</strong><br><small>1 ${m[2]} = ${fmt(U[a].f / U[b].f)} ${m[3]}</small>` };
    }
    if (U[a] && U[b]) return { html: `📏 Those are different kinds of measures (${U[a].cat} and ${U[b].cat}), so I cannot convert one into the other.` };
    return null;
  }

  /* ---------- 4. Shona / Ndebele phrasebook ---------- */
  const NUMW = { one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10 };
  const LANG_LINKS = { shona: [["#/subject/infant/inf-shona", "Shona lessons"]], ndebele: [["#/subject/infant/inf-ndebele", "Ndebele lessons"]] };
  function langNote(L) { return L.note ? `<br><small>ℹ️ ${esc(L.note)}</small>` : ""; }
  function trySkillLanguage(raw) {
    if (!Object.keys(B.langs).length) return null;
    const s = raw.toLowerCase().replace(/[?!."]/g, " ").replace(/\s+/g, " ").trim();
    let m;
    if ((m = s.match(/\b(shona|ndebele)\b.*\b(numbers?|counting)\b|\b(numbers?|count(?:ing)?)\b.*\b(?:in|to)\s+(shona|ndebele)\b/))) {
      const lang = m[1] || m[4], L = B.langs[lang]; if (!L) return null;
      return { html: `🔢 <strong>Numbers 1 to 10 in ${cap(lang)}</strong><br>${L.numbers.map(esc).join("<br>")}${langNote(L)}`, links: LANG_LINKS[lang] };
    }
    if ((m = s.match(/\b(teach me|learn|common words|basic phrases|some words|phrases)\b.*\b(shona|ndebele)\b/))) {
      const L = B.langs[m[2]]; if (!L) return null;
      const some = L.phrases.slice(0, 10).map(p => `<strong>${esc(p.en)}</strong> → ${esc(p.t)}`).join("<br>");
      return { html: `🗣️ <strong>Let's learn ${cap(m[2])}!</strong><br>${some}${langNote(L)}`, links: LANG_LINKS[m[2]], chips: [`${cap(m[2])} numbers`, `Quiz me on ${cap(m[2])}`] };
    }
    let word = null, lang = null;
    if ((m = s.match(/(?:how (?:do|can) (?:i|you|we) say|say|translate|what(?:'s| is)(?: the word for| the)?|what is)\s+(.+?)\s+(?:in|into|to)\s+(shona|ndebele)\b/))) { word = m[1]; lang = m[2]; }
    else if ((m = s.match(/^(.+?)\s+in\s+(shona|ndebele)$/))) { word = m[1]; lang = m[2]; }
    if (word) {
      word = word.replace(/^(the|a|an|word|phrase)\s+/, "").replace(/\s+/g, " ").trim();
      const L = B.langs[lang]; if (!L) return null;
      const dnum = /^\d+$/.test(word) ? Number(word) : NUMW[word];
      if (dnum >= 1 && dnum <= 10) return { html: `🗣️ <strong>${esc(word)}</strong> in ${cap(lang)}: <strong>${esc(L.numbers[dnum - 1])}</strong>${langNote(L)}`, links: LANG_LINKS[lang] };
      const ps = L.phrases;
      const hit = ps.find(p => p.en === word) || ps.find(p => p.en.startsWith(word) && word.length > 2) || ps.find(p => new RegExp("\\b" + word.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "\\b").test(p.en));
      if (hit) return { html: `🗣️ <strong>${esc(hit.en)}</strong> in ${cap(lang)}: <strong>${esc(hit.t)}</strong>${langNote(L)}`, links: LANG_LINKS[lang], chips: [`${cap(lang)} numbers`, "Quiz me"] };
      return { html: `🤔 I do not have <strong>${esc(word)}</strong> in my ${cap(lang)} phrasebook yet. I know greetings, family, school words, colours, animals and numbers. Try <em>"teach me ${cap(lang)}"</em>, or ask your ${cap(lang)} teacher.`, links: LANG_LINKS[lang], miss: true };
    }
    if ((m = s.match(/what does\s+(.+?)\s+mean$/))) {
      const w = m[1].trim(); if (w.length < 3) return null;
      for (const L of Object.values(B.langs)) { const hit = L.phrases.find(p => p.t.toLowerCase().split(/[\s,()]+/).includes(w)); if (hit) return { html: `🗣️ <strong>${esc(w)}</strong> is ${esc(L.language)} for <strong>${esc(hit.en)}</strong>.${langNote(L)}`, links: LANG_LINKS[L.language.toLowerCase()] }; }
    }
    return null;
  }

  /* ---------- 5. glossary ---------- */
  function trySkillDefine(raw) {
    const s = raw.toLowerCase().replace(/[?!."]/g, " ").replace(/\s+/g, " ").trim();
    const m = s.match(/^(?:define|definition of|meaning of|what(?:'s| is) the meaning of|what does (.+?) mean|what is (?:a |an |the )?(.+?)|what are (.+?)|explain the word|what is meant by)\s*(.*)$/);
    if (!m) return null;
    const cand = (m[1] || m[2] || m[3] || m[4] || "").replace(/^(a|an|the)\s+/, "").trim();
    if (!cand) return null;
    const find = w => B.glossary.find(g => g.w === w) || B.glossary.find(g => g.w + "s" === w || g.w === w.replace(/s$/, ""));
    const hit = find(cand);
    if (!hit) return null;
    return { html: `📖 <strong>${esc(hit.w)}</strong>: ${esc(hit.d)}.`, chips: ["Word scramble", "Quiz me"] };
  }

  /* ---------- 6. memory skill ---------- */
  const SUBJ = /\b(maths?|mathematics|english|science|shona|ndebele|history|geography|social studies|agriculture|ict|computers?|art|music|sign language|reading|writing|spelling|fractions|division|multiplication|money|health)\b/;
  function trySkillMemory(raw) {
    const s = raw.toLowerCase().trim().replace(/[.!]+$/, ""); let m;
    if ((m = s.match(/\b(?:my name is|call me|i am called)\s+([a-z']{2,20})\b/))) {
      const mm = mem(); mm.name = cap(m[1]); saveMem(mm);
      return { html: `Nice to meet you, <strong>${esc(mm.name)}</strong>! 😊 I will remember your first name on this device. (Never tell me your surname, address or phone number.)`, chips: ["Make me a study plan", "Daily challenge"] };
    }
    if ((m = s.match(/\bi (?:really )?(?:like|love|enjoy|am good at)\s+(.+)$/)) && SUBJ.test(m[1])) {
      const mm = mem(), f = m[1].match(SUBJ)[1]; if (!mm.fav.includes(f)) mm.fav.push(f); mm.fav = mm.fav.slice(-4); saveMem(mm);
      return { html: `Great! I will remember you enjoy <strong>${esc(f)}</strong>. 🌟 I will use it in your study plans.` };
    }
    if ((m = s.match(/\bi (?:find|think)\s+(.+?)\s+(?:is |are )?(?:hard|difficult|tricky|confusing)\b/) || s.match(/\bi (?:struggle|have trouble|am bad|am weak) (?:with|at|in)\s+(.+)$/)) && SUBJ.test(m[1])) {
      const mm = mem(), f = m[1].match(SUBJ)[1]; mm.weak[f] = (mm.weak[f] || 0) + 2; saveMem(mm);
      return { html: `Thank you for telling me. 💛 <strong>${esc(f)}</strong> will get extra time in your study plan, and we will practise a little each day. You can do it!`, chips: ["Make me a study plan", `Quiz me on ${f}`] };
    }
    if (/\bi (?:am|'m) in (?:grade|form) (\d)\b|\b(ecd|infant|junior|o-?level)\b.*\b(level|class)\b|\bmy level is\b/.test(s)) {
      const lv = detectLevel(s); if (lv) { const mm = mem(); mm.level = lv; saveMem(mm); return { html: `Got it, I will teach you at the <strong>${cap(lv)}</strong> level. 🎓`, chips: ["Make me a study plan"] }; }
    }
    if (/\b(what do you (remember|know) about me|what do you remember|my memory)\b/.test(s)) {
      const mm = mem(), weak = Object.entries(mm.weak).sort((a, b) => b[1] - a[1]).slice(0, 3).map(x => x[0]);
      const rows = [`Name: <strong>${esc(myName() || "I do not know yet (say 'my name is ...')")}</strong>`, `Level: <strong>${esc(mm.level || "not set")}</strong>`, `Likes: <strong>${esc(mm.fav.join(", ") || "not told me yet")}</strong>`, `Needs practice: <strong>${esc(weak.join(", ") || "nothing yet")}</strong>`, `Daily challenge streak: <strong>${mm.daily.streak || 0}</strong> 🔥`];
      return { html: `🧠 <strong>What I remember</strong> (only on this device):<br>${rows.join("<br>")}<br><small>Say <em>forget me</em> to delete it.</small>` };
    }
    if (/\b(forget me|forget everything|delete my memory|clear my memory)\b/.test(s)) { try { localStorage.removeItem(MEM_KEY); } catch (e) {} return { html: "🧹 Done. I have forgotten everything about you on this device." }; }
    return null;
  }
  function detectLevel(s) {
    s = s.toLowerCase(); let m;
    if (/\becd\b|\bkindergarten\b|\bpre-?school\b/.test(s)) return "ecd";
    if (/\binfant\b/.test(s)) return "infant";
    if (/\bjunior\b/.test(s)) return "junior";
    if (/\bo-?\s?level\b|\bform\s?[1-4]\b/.test(s)) return "olevel";
    if ((m = s.match(/\bgrade\s?(\d)\b/))) return Number(m[1]) <= 2 ? "infant" : "junior";
    return "";
  }
  function noteMiss(topic) {
    if (!topic) return; const t = String(topic).toLowerCase().replace(/[^a-z ]/g, " ").trim().split(/\s+/).slice(0, 3).join(" ");
    if (!t) return; const m = mem(); m.weak[t] = (m.weak[t] || 0) + 1; saveMem(m);
  }

  /* ---------- 7. study planner ---------- */
  function trySkillPlan(raw) {
    const s = raw.toLowerCase();
    if (!/\b(study plan|revision plan|timetable|plan my (study|revision|day)|help me (study|revise)|what should i (study|learn|do))\b/.test(s)) return null;
    if (typeof LEVELS === "undefined") return { html: "Open the lessons first, then ask me again for a study plan. 😊" };
    const mm = mem(); let lv = detectLevel(s) || mm.level;
    if (!lv) return { html: "Which level are you in? I will make the plan for you. 🎓", chips: ["Study plan for ECD", "Study plan for Infant", "Study plan for Junior", "Study plan for O-Level"] };
    if (lv !== mm.level) { mm.level = lv; saveMem(mm); }
    const level = LEVELS.find(l => l.id === lv); if (!level) return null;
    let mins = 30, t;
    if ((t = s.match(/(\d+)\s*(?:h|hr|hrs|hour|hours)\b/))) mins = Number(t[1]) * 60; else if ((t = s.match(/(\d+)\s*(?:m|min|mins|minutes)\b/))) mins = Number(t[1]);
    mins = Math.max(15, Math.min(180, mins));
    const st = appState(), done = (st && st.completedLessons) || {};
    const subj = level.subjects.map(sb => {
      const names = tokens(sb.name + " " + sb.id), nd = sb.lessons.filter((l, i) => done[`${lv}/${sb.id}/${i}`]).length;
      let pr = 0; Object.entries(mm.weak).forEach(([k, v]) => { if (tokens(k).some(x => names.includes(x))) pr += v * 3; });
      mm.fav.forEach(f => { if (tokens(f).some(x => names.includes(x))) pr += 1; });
      return { sb, nd, pr: pr + (sb.lessons.length - nd) / Math.max(1, sb.lessons.length) };
    }).sort((a, b) => b.pr - a.pr);
    const main = Math.max(10, Math.round((mins - 12) * 0.55)), second = Math.max(5, mins - 12 - main);
    const nextLesson = x => { const i = x.sb.lessons.findIndex((l, k) => !done[`${lv}/${x.sb.id}/${k}`]); return i < 0 ? { t: "Revise any lesson you like", i: 0 } : { t: x.sb.lessons[i].title, i }; };
    const a = subj[0], b = subj[1] || subj[0], na = nextLesson(a), nb = nextLesson(b);
    const steps = [
      [5, "🔥 Warm-up", "Do the Daily Challenge to wake your brain.", [["#", "Daily challenge", "ask"]]],
      [main, `${a.sb.emoji} ${a.sb.name}`, `Lesson: <strong>${esc(na.t)}</strong>. Read it slowly, then say the key fact out loud.`, [[`#/subject/${lv}/${a.sb.id}`, "Open " + a.sb.name]]],
      [second, `${b.sb.emoji} ${b.sb.name}`, `Lesson: <strong>${esc(nb.t)}</strong>.`, [[`#/subject/${lv}/${b.sb.id}`, "Open " + b.sb.name]]],
      [5, "🎯 Quiz time", "Ask me to quiz you on what you just learned.", [["#", "Quiz me", "ask"]]],
      [2, "🌟 Reflect", "Tell someone at home one new thing you learned today.", []]
    ];
    const html = `📅 <strong>Study plan for ${esc(myName() || "you")}</strong> <small>(${cap(lv)} · ${mins} minutes)</small><ol class="cai-plan">${steps.map(x => `<li><strong>${x[0]} min · ${x[1]}</strong><br>${x[2]}${x[3].filter(l => !l[2]).map(l => ` <a class="cai-link" href="${l[0]}">${esc(l[1])} →</a>`).join("")}</li>`).join("")}</ol><small>Short breaks help your brain remember. Drink water! 💧</small>`;
    return { html, chips: ["Daily challenge", "Quiz me", "Study plan for 45 minutes"] };
  }

  /* ---------- 8. daily challenge, scramble, riddles, stories ---------- */
  function mathChallenge(rnd) {
    const t = Math.floor(rnd() * 4);
    if (t === 0) { const a = 6 + Math.floor(rnd() * 10), b = 3 + Math.floor(rnd() * 7); return { q: `What is ${a} × ${b}?`, a: a * b, tip: `Think of ${a} groups of ${b}.` }; }
    if (t === 1) { const a = 20 + Math.floor(rnd() * 70), b = 10 + Math.floor(rnd() * 40); return { q: `What is ${a} + ${b}?`, a: a + b, tip: "Add the tens first, then the units." }; }
    if (t === 2) { const s = 2 + Math.floor(rnd() * 6), a = 1 + Math.floor(rnd() * 5); return { q: `Complete the pattern: ${a}, ${a + s}, ${a + 2 * s}, ${a + 3 * s}, ?`, a: a + 4 * s, tip: `Each number goes up by ${s}.` }; }
    const p = [10, 25, 50][Math.floor(rnd() * 3)], q = 20 * (2 + Math.floor(rnd() * 8)); return { q: `What is ${p}% of ${q}?`, a: (p * q) / 100, tip: p === 50 ? "50% is half." : p === 25 ? "25% is a quarter." : "10% means divide by 10." };
  }
  function numPending(ch, onWin, label) {
    let tries = 0;
    B.pending = {
      handle(input) {
        const s = input.toLowerCase().trim();
        if (/^(hint|tip|help)$/.test(s)) return { html: `💡 Hint: ${esc(ch.tip)}`, keep: true };
        if (/^(i give up|give up|answer|tell me|skip)/.test(s)) { B.pending = null; return { html: `No problem! The answer is <strong>${ch.a}</strong>. ${esc(ch.tip)}<br>Tomorrow's challenge will be new!`, chips: ["Quiz me", "Tell me a riddle"] }; }
        const n = s.replace(/[\s,$]/g, ""); if (!/^-?\d+(\.\d+)?$/.test(n)) return null;
        tries++;
        if (Number(n) === ch.a) { B.pending = null; return onWin(tries); }
        return { html: tries >= 3 ? `Not quite. 💛 The answer is <strong>${ch.a}</strong>. ${esc(ch.tip)}` : `Not quite, try again! ${tries === 2 ? "Say <em>hint</em> for a clue." : ""}`, keep: tries < 3, chips: tries < 3 ? ["hint"] : ["Quiz me"] };
      }
    };
    if (B.pending) B.pending.keepAlive = true;
  }
  function trySkillDaily(raw) {
    if (!/\b(daily challenge|challenge of the day|today'?s challenge|brain teaser|give me a challenge)\b/i.test(raw)) return null;
    const rnd = rngFrom(daySeed()), ch = mathChallenge(rnd), mm = mem();
    const act = B.fun.challenges ? B.fun.challenges[Math.floor(rnd() * B.fun.challenges.length)] : "";
    const sn = B.langs.shona ? B.langs.shona.phrases.filter(p => !/[ ?]/.test(p.t.split(" (")[0].trim()) || p.t.split(" ").length < 3) : [];
    const wd = sn.length ? sn[Math.floor(rnd() * sn.length)] : null;
    numPending(ch, tries => {
      const m2 = mem(), d = m2.daily, t = today(), y = new Date(Date.now() - 864e5).toLocaleDateString("en-CA");
      let note = "";
      if (d.last !== t) { d.streak = d.last === y ? (d.streak || 0) + 1 : 1; d.last = t; m2.daily = d; saveMem(m2); note = `<br>🔥 Daily streak: <strong>${d.streak}</strong> day${d.streak === 1 ? "" : "s"}!`; } else note = `<br>You already earned today's streak. 🔥 ${d.streak}`;
      return { html: `✅ <strong>Correct!</strong> ${tries === 1 ? "First try, superstar! 🌟" : "Well done for not giving up! 💪"}${note}`, chips: ["Quiz me", "Tell me a riddle", "Make me a study plan"] };
    });
    const doneToday = mm.daily.last === today();
    return { html: `🌅 <strong>Daily Challenge</strong> <small>${today()}</small>${doneToday ? `<br><small>(You already finished today's. You can still try it again! 🔥 streak ${mm.daily.streak})</small>` : ""}<br><br>🧮 <strong>${esc(ch.q)}</strong><br><small>Type your answer. Say <em>hint</em> if you are stuck.</small>${act ? `<br><br>🎯 <strong>Real-life mission:</strong> ${esc(act)}` : ""}${wd ? `<br><br>🗣️ <strong>Shona word of the day:</strong> ${esc(wd.t.split(" (")[0])} = ${esc(wd.en)}` : ""}`, chips: ["hint"] };
  }
  const scr = w => { let a; let k = 0; do { a = w.split("").sort(() => Math.random() - 0.5).join(""); k++; } while (a === w && k < 10); return a; };
  function trySkillGames(raw) {
    const s = raw.toLowerCase();
    if (/\b(word scramble|unscramble|scramble)\b/.test(s)) {
      const pool = B.glossary.filter(g => /^[a-z]{5,11}$/.test(g.w)); if (!pool.length) return null;
      const w = pick(pool);
      B.pending = {
        tries: 0, handle(input) {
          const g = input.toLowerCase().trim().replace(/[^a-z ]/g, "");
          if (/^(hint|clue)$/.test(g)) return { html: `💡 Clue: ${esc(w.d)}`, keep: true };
          if (/^(i give up|give up|skip|answer)/.test(g)) { B.pending = null; return { html: `The word was <strong>${esc(w.w)}</strong>: ${esc(w.d)}.`, chips: ["Word scramble", "Quiz me"] }; }
          if (!g || g.includes(" ") || g.length < 3) return null;
          this.tries++;
          if (g === w.w) { B.pending = null; return { html: `🎉 <strong>Yes! ${esc(w.w)}</strong>: ${esc(w.d)}.`, chips: ["Word scramble", "Daily challenge"] }; }
          if (this.tries >= 3) { B.pending = null; return { html: `Good try! 💛 The word was <strong>${esc(w.w)}</strong>: ${esc(w.d)}.`, chips: ["Word scramble"] }; }
          return { html: "Not quite, try again! Say <em>clue</em> for help.", keep: true, chips: ["clue"] };
        }
      };
      return { html: `🔤 <strong>Word Scramble!</strong> Unscramble this school word:<br><span class="cai-scr">${esc(scr(w.w).toUpperCase())}</span><br><small>${w.w.length} letters. Say <em>clue</em> for a hint.</small>`, chips: ["clue"] };
    }
    if (/\b(riddle|brain teaser)\b/.test(s) && B.fun.riddles) {
      const r = pick(B.fun.riddles);
      B.pending = {
        tries: 0, handle(input) {
          const g = input.toLowerCase().trim().replace(/[^a-z ]/g, ""); if (!g) return null;
          if (/^(i give up|give up|answer|tell me|skip)/.test(g)) { B.pending = null; return { html: `The answer is <strong>${esc(r.a)}</strong>! 😄`, chips: ["Tell me a riddle", "Tell me a story"] }; }
          const key = r.a.toLowerCase().replace(/^(a|an|the) /, "");
          if (g.includes(key)) { B.pending = null; return { html: `🎉 Correct! <strong>${esc(r.a)}</strong>! You are clever.`, chips: ["Tell me a riddle", "Daily challenge"] }; }
          this.tries++; if (this.tries >= 3) { B.pending = null; return { html: `Nice try! 💛 It is <strong>${esc(r.a)}</strong>.`, chips: ["Tell me a riddle"] }; }
          return { html: "Hmm, not that one. Try again, or say <em>give up</em>.", keep: true };
        }
      };
      return { html: `🧩 <strong>Riddle:</strong> ${esc(r.q)}<br><small>Type your answer, or say <em>give up</em>.</small>`, chips: ["give up"] };
    }
    if (/\b(story|folktale|tale)\b/.test(s) && !/\b(write|make|create|project|plan)\b/.test(s) && B.fun.stories) {
      const st = pick(B.fun.stories);
      return { html: `📖 <strong>${esc(st.t)}</strong><br>${esc(st.b)}`, chips: ["Tell me another story", "Tell me a riddle"] };
    }
    if (/\bjoke\b/.test(s) && B.fun.jokes) return { html: pick(B.fun.jokes), chips: ["Tell me another joke", "Tell me a riddle"] };
    return null;
  }

  /* ---------- 9. parent summary ---------- */
  let lastCopy = "";
  function trySkillParent(raw) {
    if (!/\b(parent|teacher|mother|father|mum|guardian)s?\b.*\b(summary|report|update|note)\b|\b(summary|report|note)\b.*\b(for|to) (my )?(parent|teacher|mum|dad|guardian)/i.test(raw)) return null;
    const st = appState() || {}, mm = mem(), name = myName() || "The learner";
    const lessons = Object.keys(st.completedLessons || {}).length, badges = Object.keys(st.badges || {}).length;
    const courses = Object.values(st.coursesProgress || {}).filter(c => c && c.passed).length, qp = st.quizzesPassed || 0;
    const weak = Object.entries(mm.weak).sort((a, b) => b[1] - a[1]).slice(0, 3).map(x => x[0]);
    const lines = [`Progress note for ${name} - ${today()}`, `Lessons finished: ${lessons}`, `Quizzes passed: ${qp}`, `Courses completed: ${courses}`, `Badges earned: ${badges}`, `Daily challenge streak: ${mm.daily.streak || 0} day(s)`, mm.fav.length ? `Enjoys: ${mm.fav.join(", ")}` : "", weak.length ? `Could use extra practice in: ${weak.join(", ")}` : "", `Tip: 20 to 30 minutes a day, then a short chat about what was learned, works better than long sessions.`, "Chiedza Learning by Ntandomods"].filter(Boolean);
    lastCopy = lines.join("\n");
    return { html: `👨‍👩‍👧 <strong>Summary for parent or teacher</strong><br>${lines.map(esc).join("<br>")}<br><br><button class="cai-act" data-brain-act="copy">📋 Copy text</button>`, links: [["#/report", "Open full report card"]] };
  }

  /* ---------- 10. brain knowledge ---------- */
  function knowledgeSearch(input, strict) {
    const qt = [...new Set(tokens(input))]; if (!qt.length || !B.knowledge.length) return null;
    let best = null, bs = 0;
    B.knowledge.forEach(e => {
      const kw = qt.filter(t => e.kt.includes(t)).length, tx = qt.filter(t => e.at.includes(t) && !e.kt.includes(t)).length;
      const sc = kw * 2 + tx * 0.5, ratio = kw / qt.length;
      const ok = e.trained ? (kw >= 1 && ratio >= 0.5) : strict ? (kw >= 2 && ratio >= 0.5) : (kw >= 1 && (ratio >= 0.34 || kw >= 2));
      if (ok && sc + (e.trained ? 3 : 0) > bs) { bs = sc + (e.trained ? 3 : 0); best = e; }
    });
    return best ? { html: `${best.a}<br><small>🧠 From the Chiedza Brain · ${esc(best.topic || "")}</small>`, links: best.links || [], chips: ["Quiz me", "Fun fact"] } : null;
  }

  /* ---------- skills list ---------- */
  function whatCanIDo() {
    const rows = B.skills.filter(s => s.id !== "safety").map(s => `${s.emoji} <strong>${esc(s.name)}</strong> - ${esc(s.desc)}`).join("<br>");
    const tries = B.skills.flatMap(s => s.try || []);
    const chips = [...tries].sort(() => Math.random() - 0.5).slice(0, 4);
    return { html: `I am <strong>${esc(B.identity.name || "Chiedza AI")}</strong>. Here is what I can do:<br><br>${rows}<br><br><small>Try one of these:</small>`, chips };
  }

  /* ---------- clicks (copy, download, print are used by projects too) ---------- */
  function fileDownload(name, mime, text) {
    const url = URL.createObjectURL(new Blob([text], { type: mime + ";charset=utf-8" }));
    const a = document.createElement("a"); a.href = url; a.download = name; document.body.appendChild(a); a.click();
    setTimeout(() => { URL.revokeObjectURL(url); a.remove(); }, 500);
  }
  function printHtml(html) {
    const f = document.createElement("iframe"); f.style.cssText = "position:fixed;right:0;bottom:0;width:0;height:0;border:0";
    document.body.appendChild(f); f.srcdoc = html;
    f.onload = () => { try { f.contentWindow.focus(); f.contentWindow.print(); } catch (e) {} setTimeout(() => f.remove(), 60000); };
  }
  const actions = {};
  document.addEventListener("click", e => {
    const b = e.target.closest("[data-brain-act]"); if (!b) return;
    const act = b.getAttribute("data-brain-act");
    if (act === "copy") { const txt = b.getAttribute("data-text") || lastCopy; (navigator.clipboard ? navigator.clipboard.writeText(txt) : Promise.reject()).then(() => { b.textContent = "✅ Copied!"; }).catch(() => { b.textContent = "Select and copy manually"; }); return; }
    if (actions[act]) actions[act](b, e);
  });

  /* ---------- gaps: questions the brain could not answer ---------- */
  function miss(input) {
    const q = String(input || "").trim().slice(0, 160); if (!q || q.length < 4 || safetyCheck(q)) return;
    try {
      const list = JSON.parse(localStorage.getItem(GAP_KEY) || "[]"); list.push({ q, at: new Date().toISOString() }); localStorage.setItem(GAP_KEY, JSON.stringify(list.slice(-50)));
    } catch (e) {}
    if (/^https?:/.test(location.protocol)) { try { fetch("/api/brain/gaps", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ q }) }).catch(() => {}); } catch (e) {} }
  }

  /* ---------- feedback (thumbs up / down) ---------- */
  function feedback(q, snippet, good) {
    q = String(q || "").trim(); if (!q || safetyCheck(q) || !/^https?:/.test(location.protocol)) return;
    try { fetch("/api/brain/feedback", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ q, a: plain(snippet).slice(0, 200), good: !!good }) }).catch(() => {}); } catch (e) {}
    if (!good) { try { const l = JSON.parse(localStorage.getItem(GAP_KEY) || "[]"); l.push({ q, at: new Date().toISOString(), bad: true }); localStorage.setItem(GAP_KEY, JSON.stringify(l.slice(-50))); } catch (e) {} }
  }

  /* ---------- main entry ---------- */
  function handle(input) {
    const text = String(input || "").trim(); if (!text) return null;
    const m = mem(); m.asked = (m.asked || 0) + 1; saveMem(m);
    const unsafe = safetyCheck(text); if (unsafe) { B.pending = null; return unsafe; }
    if (B.pending) {
      const isHelper = /^(hint|clue|tip|give up|i give up|answer|skip|tell me the answer|cancel|stop|never mind|no)\b/i.test(text);
      if (!isHelper && !B.pending.freeText && (/\?/.test(text) || text.split(/\s+/).length > 5 || /^(what|how|why|who|where|when|make|write|create|tell|show|quiz|summary|daily|plan|study|define|convert|translate|help|can you|do you|play|word|teach|explain|my|i )/i.test(text))) B.pending = null;
    }
    if (B.pending) {
      const p = B.pending, r = p.handle(text);
      if (r) { if (!r.keep && B.pending === p) B.pending = null; return r; }
      if (B.pending === p) B.pending = null;
    }
    if (/\b(what can you do|what are your (skills|abilities)|what do you know|your skills|your abilities)\b|^help$/i.test(text)) return whatCanIDo();
    for (const h of B.handlers) { const r = h.handle(text); if (r) return r; }
    return trySkillMemory(text) || trySkillParent(text) || trySkillPlan(text) || trySkillDaily(text) || trySkillGames(text) || trySkillLanguage(text) || trySkillConvert(text) || trySkillCalc(text) || trySkillDefine(text) || knowledgeSearch(text, true) || null;
  }
  function fallback(input) { return knowledgeSearch(input, false); }

  window.ChiedzaBrain = {
    ready, handle, fallback, safetyCheck, miss, feedback, noteMiss, whatCanIDo, mem, saveMem, tokens, esc, plain, cap, pick, today, myName, detectLevel, fileDownload, printHtml, actions,
    data: B, register: h => B.handlers.push(h), setPending: p => { B.pending = p; }, onLoad: f => { if (B.loaded) f(); else (B.onload = B.onload || []).push(f); },
    set lastCopy(v) { lastCopy = v; }
  };
})();
