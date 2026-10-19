/* ============================================================
   CHIEDZA BRAIN - Reasoning skills
   Rule-based problem solvers that show their working:
   equations, simultaneous equations, quadratics, number patterns,
   ratios, percentage change, speed/distance/time, simple interest,
   and a structured way to think through decisions.
   No AI service is used. Created for Chiedza Learning.
   ============================================================ */
(function () {
  "use strict";
  function init() {
    const Br = window.ChiedzaBrain; if (!Br) return;
    const esc = Br.esc;
    const num = x => Math.abs(x) < 1e-9 ? 0 : Math.round(x * 1e6) / 1e6;
    function frac(x) {
      x = num(x); if (Number.isInteger(x)) return String(x);
      for (let d = 2; d <= 100; d++) { const n = Math.round(x * d); if (Math.abs(n / d - x) < 1e-9) return `${n}/${d} (= ${x})`; }
      return String(x);
    }
    const sign = (x, first) => (x < 0 ? (first ? "-" : " - ") : (first ? "" : " + "));
    const coef = (c, v) => (Math.abs(c) === 1 && v ? "" : String(Math.abs(c)));

    /* parse one side of an equation into {a2, a1, a0} for one letter */
    function parseSide(str, v) {
      const out = { a2: 0, a1: 0, a0: 0 };
      const terms = str.replace(/²/g, "^2").split(/(?=[+-])/).filter(Boolean);
      for (const t of terms) {
        const m = t.match(/^([+-]?)(\d*\.?\d*)\*?([a-z])?(\^2)?$/);
        if (!m || (m[3] && m[3] !== v) || (m[4] && !m[3])) return null;
        if (m[2] === "" && !m[3]) return null;
        const c = (m[1] === "-" ? -1 : 1) * (m[2] === "" ? 1 : parseFloat(m[2]));
        if (m[3] && m[4]) out.a2 += c; else if (m[3]) out.a1 += c; else out.a0 += c;
      }
      return out;
    }
    function cleanEq(s) {
      return s.toLowerCase().replace(/\b(solve|find|what is|what's|the value of|for|please|calculate|work out|equation|if)\b/g, " ").replace(/[?]/g, "").replace(/\s+/g, "").replace(/−/g, "-").replace(/×/g, "*").replace(/(\d)\*([a-z])/g, "$1$2");
    }
    function solvePoly(raw) {
      const s = cleanEq(raw);
      if (!/^[0-9a-z+\-*.^²]+=[0-9a-z+\-*.^²]+$/.test(s)) return null;
      const letters = [...new Set(s.replace(/[^a-z]/g, "").split(""))];
      if (letters.length !== 1 || /[a-z]{2}/.test(s)) return null;
      const v = letters[0], [L, R] = s.split("=");
      const l = parseSide(L, v), r = parseSide(R, v); if (!l || !r) return null;
      const a = l.a2 - r.a2, b = l.a1 - r.a1, c = l.a0 - r.a0;
      const orig = `${L.replace(/([+-])/g, " $1 ").trim()} = ${R.replace(/([+-])/g, " $1 ").trim()}`;
      if (a === 0 && b === 0) return { html: c === 0 ? "🧠 That is true for <strong>every</strong> value, so there are infinitely many solutions." : "🧠 That can never be true, so it has <strong>no solution</strong>." };
      if (a === 0) {
        const x = -c / b;
        let w = `1) Start: <strong>${esc(orig)}</strong><br>2) Move everything with ${v} to the left and numbers to the right: ${num(b)}${v} = ${num(-c)}<br>3) Divide both sides by ${num(b)}: ${v} = ${num(-c)} / ${num(b)}<br>4) <strong>${v} = ${frac(x)}</strong><br>5) Check: put ${v} = ${num(x)} back in. Left = ${num(l.a1 * x + l.a0)}, right = ${num(r.a1 * x + r.a0)}. ${Math.abs((l.a1 * x + l.a0) - (r.a1 * x + r.a0)) < 1e-6 ? "✅ They match." : "⚠️ Check again."}`;
        return { html: `🧠 <strong>Solving ${esc(orig)}</strong><br><br>${w}`, chips: ["Quiz me", "Explain algebra"] };
      }
      const D = b * b - 4 * a * c;
      let w = `1) Make one side zero: <strong>${num(a)}${v}² ${b < 0 ? "-" : "+"} ${Math.abs(num(b))}${v} ${c < 0 ? "-" : "+"} ${Math.abs(num(c))} = 0</strong><br>2) Use the formula ${v} = (-b ± √(b² - 4ac)) / 2a with a = ${num(a)}, b = ${num(b)}, c = ${num(c)}<br>3) Discriminant b² - 4ac = ${num(b * b)} - ${num(4 * a * c)} = <strong>${num(D)}</strong><br>`;
      if (D < 0) w += "4) The discriminant is negative, so there are <strong>no real solutions</strong>.";
      else if (D === 0) w += `4) The discriminant is 0, so there is one solution: <strong>${v} = ${frac(-b / (2 * a))}</strong>`;
      else { const r1 = (-b + Math.sqrt(D)) / (2 * a), r2 = (-b - Math.sqrt(D)) / (2 * a); w += `4) √${num(D)} = ${num(Math.sqrt(D))}<br>5) <strong>${v} = ${frac(r1)}</strong> or <strong>${v} = ${frac(r2)}</strong>`; }
      return { html: `🧠 <strong>Solving the quadratic ${esc(orig)}</strong><br><br>${w}`, chips: ["Quiz me", "Explain algebra"] };
    }

    /* ---------- simultaneous equations (x and y) ---------- */
    function parseXY(side) {
      const o = { x: 0, y: 0, c: 0 };
      for (const t of side.split(/(?=[+-])/).filter(Boolean)) {
        const m = t.match(/^([+-]?)(\d*\.?\d*)\*?([xy])?$/); if (!m || (m[2] === "" && !m[3])) return null;
        const c = (m[1] === "-" ? -1 : 1) * (m[2] === "" ? 1 : parseFloat(m[2])); if (m[3]) o[m[3]] += c; else o.c += c;
      }
      return o;
    }
    function solveSimul(raw) {
      const parts = raw.toLowerCase().replace(/\b(solve|find|simultaneous equations?|simultaneously|please)\b/g, " ").split(/\band\b|[,;]/).map(p => p.replace(/\s+/g, "").replace(/(\d)\*([xy])/g, "$1$2")).filter(p => p.includes("="));
      if (parts.length !== 2) return null;
      const eq = [];
      for (const p of parts) {
        if (!/^[0-9xy+\-*.]+=[0-9xy+\-*.]+$/.test(p)) return null;
        const [L, R] = p.split("="), l = parseXY(L), r = parseXY(R); if (!l || !r) return null;
        eq.push({ a: l.x - r.x, b: l.y - r.y, c: r.c - l.c, txt: p });
      }
      if (!eq.some(e => e.a) || !eq.some(e => e.b)) return null;
      const [e1, e2] = eq, det = e1.a * e2.b - e2.a * e1.b;
      if (det === 0) return { html: "🧠 These two equations are either the same line or parallel lines, so there is <strong>no single answer</strong>." };
      const x = (e1.c * e2.b - e2.c * e1.b) / det, y = (e1.a * e2.c - e2.a * e1.c) / det;
      const w = `1) Equation A: ${esc(e1.txt)}<br>2) Equation B: ${esc(e2.txt)}<br>3) Eliminate one letter by making its numbers equal, then add or subtract the equations.<br>4) Solving gives <strong>x = ${frac(x)}</strong> and <strong>y = ${frac(y)}</strong><br>5) Check A: ${num(e1.a)}(${num(x)}) + ${num(e1.b)}(${num(y)}) = ${num(e1.a * x + e1.b * y)} ${Math.abs(e1.a * x + e1.b * y - e1.c) < 1e-6 ? "✅" : "⚠️"}<br>6) Check B: ${num(e2.a)}(${num(x)}) + ${num(e2.b)}(${num(y)}) = ${num(e2.a * x + e2.b * y)} ${Math.abs(e2.a * x + e2.b * y - e2.c) < 1e-6 ? "✅" : "⚠️"}`;
      return { html: `🧠 <strong>Simultaneous equations</strong><br><br>${w}`, chips: ["Quiz me"] };
    }

    /* ---------- number patterns ---------- */
    function solveSequence(raw) {
      const low = raw.toLowerCase();
      if (!/\b(next|pattern|sequence|series|continue|missing|what comes)\b/.test(low)) return null;
      const nums = (low.match(/-?\d+(?:\.\d+)?/g) || []).map(Number); if (nums.length < 3) return null;
      const n = nums.length, last = nums[n - 1], d = nums.map((v, i) => i ? v - nums[i - 1] : null).slice(1);
      if (d.every(v => Math.abs(v - d[0]) < 1e-9)) return { html: `🧠 <strong>Pattern: add ${num(d[0])} each time</strong> (arithmetic sequence).<br>${nums.map((v, i) => i ? `${num(nums[i - 1])} → ${num(v)} (+${num(d[0])})` : "").filter(Boolean).slice(0, 4).join("<br>")}<br><br>Next numbers: <strong>${num(last + d[0])}, ${num(last + 2 * d[0])}</strong>.<br>Rule for the nth term: ${num(nums[0])} + (n - 1) × ${num(d[0])}` };
      if (nums[0] !== 0 && nums.every(v => v !== 0)) { const r = nums.map((v, i) => i ? v / nums[i - 1] : null).slice(1); if (r.every(v => Math.abs(v - r[0]) < 1e-9)) return { html: `🧠 <strong>Pattern: multiply by ${num(r[0])} each time</strong> (geometric sequence).<br>Next numbers: <strong>${num(last * r[0])}, ${num(last * r[0] * r[0])}</strong>.` }; }
      if (n >= 4) { const d2 = d.map((v, i) => i ? v - d[i - 1] : null).slice(1); if (d2.every(v => Math.abs(v - d2[0]) < 1e-9)) { const nd = d[d.length - 1] + d2[0]; return { html: `🧠 <strong>Pattern: the differences change by ${num(d2[0])} each time</strong> (a quadratic pattern).<br>Differences: ${d.map(num).join(", ")}<br>Next difference: ${num(nd)}, so next number: <strong>${num(last + nd)}</strong>.` }; } }
      if (n >= 4 && nums.every((v, i) => i < 2 || Math.abs(v - nums[i - 1] - nums[i - 2]) < 1e-9)) return { html: `🧠 <strong>Pattern: each number is the sum of the two before it</strong> (Fibonacci style).<br>Next: <strong>${num(last + nums[n - 2])}</strong>.` };
      return { html: "🧠 I could not find a simple rule (adding, multiplying, changing differences or adding the last two). Look at the gaps between numbers and see if they follow a pattern, or send me more numbers." };
    }

    /* ---------- ratio, percent change, speed, interest ---------- */
    function solveWord(raw) {
      const low = raw.toLowerCase().replace(/,(?=\d{3})/g, ""); let m;
      if ((m = low.match(/\b(?:share|divide|split)\s+\$?(\d+(?:\.\d+)?)\s+(?:\w+\s+)?(?:in|into|in the ratio|in a ratio of)\s*(?:the ratio\s*)?(\d+(?:\s*:\s*\d+)+)/))) {
        const total = parseFloat(m[1]), parts = m[2].split(":").map(x => parseFloat(x)), sum = parts.reduce((a, b) => a + b, 0), one = total / sum;
        return { html: `🧠 <strong>Sharing ${num(total)} in the ratio ${parts.join(":")}</strong><br>1) Add the parts: ${parts.join(" + ")} = ${sum}<br>2) One part = ${num(total)} ÷ ${sum} = ${num(one)}<br>3) Multiply: ${parts.map(p => `${p} × ${num(one)} = <strong>${num(p * one)}</strong>`).join("; ")}<br>4) Check: ${parts.map(p => num(p * one)).join(" + ")} = ${num(total)} ✅` };
      }
      if ((m = low.match(/\b(increase|decrease|reduce|raise|discount)\s+\$?(\d+(?:\.\d+)?)\s+by\s+(\d+(?:\.\d+)?)\s*%/)) || (m = low.match(/(\d+(?:\.\d+)?)\s*%\s*(increase|decrease|discount)\s+(?:on|of|to)\s+\$?(\d+(?:\.\d+)?)/) && [null, RegExp.$2, RegExp.$3, RegExp.$1])) {
        const up = /increase|raise/.test(m[1]), base = parseFloat(m[2]), p = parseFloat(m[3]), ch = base * p / 100, res = up ? base + ch : base - ch;
        return { html: `🧠 <strong>${up ? "Increase" : "Decrease"} ${num(base)} by ${num(p)}%</strong><br>1) ${num(p)}% of ${num(base)} = ${num(base)} × ${num(p)} ÷ 100 = ${num(ch)}<br>2) ${num(base)} ${up ? "+" : "-"} ${num(ch)} = <strong>${num(res)}</strong>` };
      }
      if ((m = low.match(/percentage (?:change|increase|decrease)\s+(?:from\s+)?\$?(\d+(?:\.\d+)?)\s+to\s+\$?(\d+(?:\.\d+)?)/))) {
        const a = parseFloat(m[1]), b = parseFloat(m[2]), p = (b - a) / a * 100;
        return { html: `🧠 <strong>Percentage change from ${num(a)} to ${num(b)}</strong><br>1) Change = ${num(b)} - ${num(a)} = ${num(b - a)}<br>2) Percentage change = change ÷ original × 100 = ${num(b - a)} ÷ ${num(a)} × 100 = <strong>${num(p)}%</strong> ${p >= 0 ? "increase" : "decrease"}` };
      }
      const T = "(hours?|hrs?|h|minutes?|mins?|seconds?|secs?)", tf = u => /^h/.test(u) ? 1 : /^m/.test(u) ? 1 / 60 : 1 / 3600;
      if (/\b(speed|how fast)\b/.test(low) && (m = low.match(new RegExp("(\\d+(?:\\.\\d+)?)\\s*(km|kilometres|kilometers|miles|m|metres|meters)\\b.*?\\bin\\s+(\\d+(?:\\.\\d+)?)\\s*" + T)))) {
        const d = parseFloat(m[1]), t = parseFloat(m[3]), u = m[4]; const sp = d / t;
        return { html: `🧠 <strong>Speed = distance ÷ time</strong><br>Speed = ${num(d)} ${m[2]} ÷ ${num(t)} ${u} = <strong>${num(sp)} ${m[2]} per ${/^h/.test(u) ? "hour" : /^m/.test(u) ? "minute" : "second"}</strong>` };
      }
      if (/\b(how far|distance)\b/.test(low) && (m = low.match(new RegExp("(\\d+(?:\\.\\d+)?)\\s*(km/h|kph|mph|m/s)\\b.*?\\b(?:for|in)\\s+(\\d+(?:\\.\\d+)?)\\s*" + T)))) {
        const s = parseFloat(m[1]), t = parseFloat(m[3]), u = m[4]; const unit = m[2] === "m/s" ? "m" : m[2] === "mph" ? "miles" : "km";
        const tt = m[2] === "m/s" ? t / (/^h/.test(u) ? 1 / 3600 : /^m/.test(u) ? 1 / 60 : 1) : t * tf(u);
        return { html: `🧠 <strong>Distance = speed × time</strong><br>Distance = ${num(s)} ${m[2]} × ${num(t)} ${u} = <strong>${num(s * tt)} ${unit}</strong>` };
      }
      if (/\bhow long\b|\btime\b/.test(low) && (m = low.match(/(\d+(?:\.\d+)?)\s*km\b.*?(\d+(?:\.\d+)?)\s*(?:km\/h|kph)/))) {
        const d = parseFloat(m[1]), s = parseFloat(m[2]), t = d / s;
        return { html: `🧠 <strong>Time = distance ÷ speed</strong><br>Time = ${num(d)} ÷ ${num(s)} = <strong>${num(t)} hours</strong> (${num(t * 60)} minutes)` };
      }
      if ((m = low.match(/(compound|simple)\s+interest.*?\$?(\d+(?:\.\d+)?).*?(\d+(?:\.\d+)?)\s*%.*?(\d+(?:\.\d+)?)\s*(?:years?|yrs?)/))) {
        const P = parseFloat(m[2]), R = parseFloat(m[3]), t = parseFloat(m[4]);
        if (m[1] === "simple") { const I = P * R * t / 100; return { html: `🧠 <strong>Simple interest = P × R × T ÷ 100</strong><br>= ${num(P)} × ${num(R)} × ${num(t)} ÷ 100 = <strong>${num(I)}</strong><br>Total after ${num(t)} years = ${num(P)} + ${num(I)} = <strong>${num(P + I)}</strong>` }; }
        const A = P * Math.pow(1 + R / 100, t); return { html: `🧠 <strong>Compound interest: A = P × (1 + R/100)^T</strong><br>= ${num(P)} × (1 + ${num(R)}/100)^${num(t)} = <strong>${num(A)}</strong><br>Interest earned = ${num(A)} - ${num(P)} = <strong>${num(A - P)}</strong>` };
      }
      return null;
    }

    /* ---------- thinking frameworks ---------- */
    function decide(raw) {
      const low = raw.toLowerCase();
      if (!/\b(help me decide|decide between|pros and cons|which (one )?should i (choose|pick)|should i choose|weigh (up )?(my )?options|make a decision)\b/.test(low)) return null;
      let opts = (raw.match(/\bbetween\s+(.+?)\s+(?:and|or)\s+(.+?)(?:[?.!]|$)/i) || raw.match(/\b(?:choose|pick)\s+(.+?)\s+or\s+(.+?)(?:[?.!]|$)/i) || []).slice(1, 3).map(x => x.trim());
      const o = opts.length === 2 ? opts : ["Option A", "Option B"];
      return { html: `🧠 <strong>Let's decide step by step</strong>${opts.length === 2 ? `: <em>${esc(o[0])}</em> or <em>${esc(o[1])}</em>` : ""}<br><br>1) <strong>Goal:</strong> what do you want most? (money, learning, time, happiness, safety)<br>2) <strong>Criteria:</strong> list 3 to 5 things that matter, and give each an importance from 1 to 5.<br>3) <strong>Score:</strong> give ${esc(o[0])} and ${esc(o[1])} a score from 1 to 5 on each criterion.<br>4) <strong>Multiply and add:</strong> score × importance for each; the higher total is the better fit.<br>5) <strong>Risk check:</strong> what is the worst that could happen? Can you undo it?<br>6) <strong>Ask:</strong> talk to someone you trust who has done it.<br><br>Tell me your criteria and scores, for example <em>cost 5: A=3, B=5; time 3: A=4, B=2</em> and I will add them up.`, chips: ["Problem solving steps"] };
    }
    function scoreDecision(raw) {
      const rows = [...raw.matchAll(/([a-z ]+?)\s+(\d)\s*:\s*[^=]*?=\s*(\d)[^=]*?=\s*(\d)/gi)]; if (rows.length < 2) return null;
      let a = 0, b = 0, lines = rows.map(r => { const w = +r[2], x = +r[3], y = +r[4]; a += w * x; b += w * y; return `${esc(r[1].trim())}: A ${w}×${x}=${w * x}, B ${w}×${y}=${w * y}`; });
      return { html: `🧠 <strong>Decision score</strong><br>${lines.join("<br>")}<br><br>Option A total: <strong>${a}</strong> · Option B total: <strong>${b}</strong><br>${a === b ? "It is a tie, so use the risk check to break it." : `<strong>Option ${a > b ? "A" : "B"}</strong> fits your criteria better.`} A score helps you think, but the final choice is yours.` };
    }
    function steps(raw) {
      if (!/\b(how (do|can|should) i (solve|approach|tackle|start)|think step by step|problem[- ]solving|word problems?\b.*\b(help|how)|how to (solve|think)|steps to solve)\b/.test(raw.toLowerCase())) return null;
      return { html: `🧠 <strong>Four steps for any problem</strong> (Polya's method)<br><br>1) <strong>Understand it:</strong> read it twice. What is asked? What is given? Draw a picture or underline the numbers.<br>2) <strong>Plan:</strong> have you seen something like it? Pick a method: make a table, work backwards, try small numbers, find a pattern, write an equation.<br>3) <strong>Do it:</strong> work neatly, one step per line.<br>4) <strong>Check:</strong> does the answer make sense? Put it back in the problem. Is the unit right?<br><br>Stuck? Try a simpler version first, then grow it. Send me an equation like <em>solve 3x + 5 = 20</em> and I will show every step.`, chips: ["Solve 3x + 5 = 20", "Next number in 2, 4, 8, 16"] };
    }

    Br.register({
      name: "reasoning",
      handle(input) {
        const t = input.trim(); if (!t || t.length > 400) return null;
        const eqChunk = t.match(/[\w.^²]+(?:\s*[+\-*]\s*[\w.^²]+)*\s*=\s*[\w.^²]+(?:\s*[+\-*]\s*[\w.^²]+)*/);
        try {
          return steps(t) || decide(t) || scoreDecision(t) || solveSimul(t) || (eqChunk && /[a-z]/i.test(eqChunk[0]) && /\d/.test(eqChunk[0]) ? solvePoly(eqChunk[0]) : null) || solveSequence(t) || solveWord(t) || null;
        } catch (e) { console.warn("reasoning", e); return null; }
      }
    });
  }
  if (window.ChiedzaBrain) window.ChiedzaBrain.ready.then(init);
})();
