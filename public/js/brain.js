/* ============================================================
   CHIEDZA BRAIN - loader + safety + calculator
   Reads the brain files listed in brain/manifest.json (identity,
   safety rules and the reasoning files) and routes every question
   to the right thinker: safety first, then the handlers that
   register themselves (website builder, reasoning engine), then
   the calculator. Edit the files in /brain to change the AI.
   Created by Ntandomods.
   ============================================================ */
(function () {
  "use strict";
  const BASE = "brain/";
  const B = { loaded: false, identity: {}, safety: {}, handlers: [], pending: null };

  const STOP = new Set("a an the is are was were am be to of in on at for and or but with what whats who how why when where which do does did can could would should i me my we you your it its this that these those about tell please explain give show want need some any more from as by us our".split(" "));
  const stem = w => w.replace(/(ing|ed|es|s)$/i, m => (w.length > 4 ? "" : m));
  const tokens = s => (s || "").toLowerCase().replace(/<[^>]+>/g, " ").replace(/[^a-z0-9' ]+/g, " ").split(/\s+/).filter(w => w && !STOP.has(w)).map(stem);
  const plain = h => (h || "").replace(/<[^>]+>/g, " ").replace(/&nbsp;/g, " ").replace(/\s+/g, " ").trim();
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

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
      const [idn, saf] = await Promise.all([getText(man.identity).catch(() => null), getJSON(man.safety).catch(() => null)]);
      B.identity = idn ? parseIdentity(idn) : {};
      B.safety = saf || {};
      B.loaded = true;
      (B.onload || []).forEach(f => { try { f(); } catch (e) {} });
    } catch (e) { console.warn("Chiedza Brain files could not be loaded (open the site through the server).", e.message); }
  })();

  /* ---------- 1. safety guard ---------- */
  function safetyCheck(input) {
    for (const k of Object.keys(B.safety)) {
      const g = B.safety[k]; if (!g || !g.patterns) continue;
      for (const p of g.patterns) { try { if (new RegExp(p, "i").test(input)) return { html: g.reply, safety: k }; } catch (e) {} }
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
      return { html: calcHtml(`${m[1]}% of ${m[2]}`, r, `${m[2]} ÷ 100 × ${m[1]} = ${fShow(fDiv(v, Fr(100n))).dec || fShow(fDiv(v, Fr(100n))).main} × ${m[1]}`) };
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
        return { html: `✖️ <strong>${n} times table</strong><br>${rows}` };
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
        return { html: calcHtml(shown, r, work) };
      } catch (e) {
        if (e.message === "div0") return { html: "🧮 We cannot divide by zero! Nothing can be shared into 0 groups. 😊" };
        if (e.message === "pow") return { html: "🧮 That power is too big for me. Try a smaller one!" };
      }
    }
    return null;
  }

  /* ---------- main entry ---------- */
  function handle(input) {
    const text = String(input || "").trim(); if (!text) return null;
    const unsafe = safetyCheck(text); if (unsafe) { B.pending = null; return unsafe; }
    if (B.pending) {
      const p = B.pending, r = p.handle(text);
      if (r) { if (!r.keep && B.pending === p) B.pending = null; return r; }
      if (B.pending === p) B.pending = null;
    }
    for (const h of B.handlers) { const r = h.handle(text); if (r) return r; }
    return trySkillCalc(text) || null;
  }

  window.ChiedzaBrain = {
    ready, handle, tokens, esc, plain, data: B, safetyCheck,
    register: h => B.handlers.push(h), setPending: p => { B.pending = p; },
    onLoad: f => { if (B.loaded) f(); else (B.onload = B.onload || []).push(f); }
  };
})();
