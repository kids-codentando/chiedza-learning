/* ============================================================
   CHIEDZA REASONING - the thinking engine
   Chiedza AI's brain is a folder of files. This engine is the part
   that THINKS with those files: it reads word problems, finds
   patterns, follows logic, explains causes and compares things, and
   it always shows its working, step by step. It never invents facts:
   if the files do not give it enough, it says so.
   The rules and words it uses live in public/brain/reasoning/*.json
   Works in the browser (registers with ChiedzaBrain) and in Node
   (npm run test:reasoning).
   Created by Ntandomods.
   ============================================================ */
(function (root) {
  "use strict";

  function create(D, H) {
    H = H || {};
    const esc = H.esc || (s => String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c])));
    const STOP = new Set("a an the is are was were am be to of in on at for and or but with what whats who how why when where which do does did can could would should i me my we you your it its this that these those about tell please explain give show want need some any more from as by us our".split(" "));
    const stem = w => w.replace(/(ing|ed|es|s)$/i, m => (w.length > 4 ? "" : m));
    const tokens = H.tokens || (s => (s || "").toLowerCase().replace(/<[^>]+>/g, " ").replace(/[^a-z0-9' ]+/g, " ").split(/\s+/).filter(w => w && !STOP.has(w)).map(stem));
    const R = D.reasoning || {}, LG = D.logic || { comparatives: [], tips: {} }, CS = D.causes || { chains: [] }, CP = D.compare || { pairs: [] };
    const NW = R.numberWords || {}, CUE = R.cues || {}, MULT = R.multipliers || {}, QS = R.question || {};
    const set = a => new Set(a || []);
    const CUES = { add: set(CUE.add), subtract: set(CUE.subtract), multiply: set(CUE.multiply), divide: set(CUE.divide), rate: set(CUE.rate), pack: set(CUE.pack) };
    const has = (s, list) => (list || []).some(p => new RegExp("\\b" + p.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "\\b", "i").test(s));
    const clean = n => Math.round(n * 1e9) / 1e9;
    const words = s => (s.toLowerCase().match(/[a-z']+/g) || []);

    /* ---------- numbers ---------- */
    // finds numbers written as digits ($12.50, 1,200, 15%) or words (three, a dozen, half)
    function findNumbers(s) {
      const out = [], rx = /(\$)?(\d[\d,]*(?:\.\d+)?)(\s*(?:%|percent|per cent))?|\b(zero|one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|thirteen|fourteen|fifteen|sixteen|seventeen|eighteen|nineteen|twenty|thirty|forty|fifty|sixty|seventy|eighty|ninety|hundred|thousand|dozen|half)\b/gi;
      let m;
      while ((m = rx.exec(s))) {
        if (m[2]) {
          out.push({ v: Number(m[2].replace(/,/g, "")), idx: m.index, end: m.index + m[0].length, money: !!m[1], pct: !!m[3], raw: m[0].trim() });
        } else {
          const w = m[4].toLowerCase();
          if (w === "half") { if (/\bhalf (of|a|an|the)\b/i.test(s.slice(m.index))) continue; continue; }
          if (w === "one" && /^\s*(of|another|day|time|thing|who|can|should|must|way)\b/i.test(s.slice(m.index + 3))) continue;
          let v = NW[w], end = m.index + m[0].length;
          const nx = /^[\s-]+(one|two|three|four|five|six|seven|eight|nine)\b/i.exec(s.slice(end));
          if (nx && v >= 20 && v < 100) { v += NW[nx[1].toLowerCase()]; end += nx[0].length; }
          const mul = /^\s+(hundred|thousand)\b/i.exec(s.slice(end));
          if (mul && v < 100) { v *= NW[mul[1].toLowerCase()]; end += mul[0].length; }
          out.push({ v, idx: m.index, end, money: false, pct: false, raw: s.slice(m.index, end) });
        }
      }
      return out;
    }
    const isMoney = s => /\$|\bdollars?\b|\bcents?\b|\busd\b/i.test(s);
    const fmt = (n, money) => { n = clean(n); const t = Number.isInteger(n) ? String(n) : (money ? n.toFixed(2) : String(clean(Number(n.toFixed(6))))); return money ? "$" + t : t; };
    const nice = n => fmt(n, false);
    const li = items => items.map((x, i) => `${["1️⃣", "2️⃣", "3️⃣", "4️⃣", "5️⃣", "6️⃣", "7️⃣", "8️⃣"][i] || "▪️"} ${x}`).join("<br>");
    const stepsList = key => (R.steps && R.steps[key]) || [];
    const note = c => (R.confidenceNotes && R.confidenceNotes[c]) || "";

    /* ---------- word problems ---------- */
    const SYM = { add: "+", subtract: "−", multiply: "×", divide: "÷" };
    const WORDOP = { add: "add", subtract: "take away", multiply: "multiply", divide: "divide" };
    function apply(op, a, b) { return op === "add" ? a + b : op === "subtract" ? a - b : op === "multiply" ? a * b : b === 0 ? NaN : a / b; }
    function splitSentences(s) {
      // spoken questions arrive without punctuation: put a full stop before the question part
      if (!/[?]/.test(s)) s = s.replace(/([a-z0-9])\s+(how (?:many|much)\b|what is the\b|find the\b|work out\b)/gi, "$1. $2");
      return s.replace(/(\d)\.(\d)/g, "$1\u0001$2").replace(/(\d),(\d{3})/g, "$1$2").split(/(?<=[.!?])\s+|\n+/).map(x => x.replace(/\u0001/g, ".").trim()).filter(Boolean);
    }
    function cueOf(sentence) {
      const w = words(sentence), found = {};
      for (const k of ["subtract", "divide", "multiply", "add"]) if (w.some(x => CUES[k].has(x))) found[k] = true;
      if (/\btimes as (many|much|long)|times (more|longer|bigger)\b/i.test(sentence)) found.multiply = true;
      if (/\b(shared|share|split|divided|distribut\w+)\b.*\b(equally|among|between|into)\b|\bequally\b/i.test(sentence)) found.divide = true;
      return found;
    }
    function questionKind(q) {
      const s = q.toLowerCase();
      if (has(s, QS.diff)) return "diff";
      if (has(s, QS.total)) return "total";
      if (has(s, QS.left)) return "left";
      return "other";
    }
    function unitOfQuestion(q) {
      const m = q.toLowerCase().match(/how many (?:more |fewer |less )?([a-z]+(?: [a-z]+)?)/);
      if (m) { const ws = m[1].split(" "); const stopW = new Set(["are", "does", "did", "do", "will", "can", "is", "were", "was", "has", "have", "had", "in", "of", "must", "should"]); const out = []; for (const w of ws) { if (stopW.has(w)) break; out.push(w); } return out.join(" "); }
      return "";
    }

    // special forms that are not simple chains
    function solveSpecial(text) {
      const t = text.toLowerCase(), nums = findNumbers(text), money = isMoney(text);
      let m;
      // percentage change of a price
      const pct = nums.find(n => n.pct);
      if (pct && /\b(discount|off|sale|reduc\w+|decreas\w+|increas\w+|markup|mark-up|tax|vat|interest|rise|raised|cheaper)\b/.test(t)) {
        const base = nums.find(n => !n.pct && n.v > 0);
        if (base) {
          const up = /\b(increas\w+|markup|mark-up|tax|vat|interest|rise|raised|added)\b/.test(t) && !/\b(discount|off|sale|reduc\w+|decreas\w+)\b/.test(t);
          const amt = clean(base.v * pct.v / 100), fin = up ? clean(base.v + amt) : clean(base.v - amt);
          const wantsAmount = /\b(save|saves|saving|saved|how much is the (discount|tax|interest|increase)|how much (is|was) (taken|added))\b/.test(t) || /how much (does|did|will) .* (save|save up)/.test(t);
          const steps = [`Find ${nice(pct.v)}% of ${fmt(base.v, money)}: ${fmt(base.v, money)} ÷ 100 × ${nice(pct.v)} = <strong>${fmt(amt, money)}</strong>`, up ? `Add it on: ${fmt(base.v, money)} + ${fmt(amt, money)} = <strong>${fmt(fin, money)}</strong>` : `Take it off: ${fmt(base.v, money)} − ${fmt(amt, money)} = <strong>${fmt(fin, money)}</strong>`];
          return { kind: "percent", answer: wantsAmount ? amt : fin, money, unit: "", plan: `${nice(pct.v)}% ${up ? "increase" : "discount"} on ${fmt(base.v, money)}`, steps, check: `Check: ${fmt(fin, money)} should be ${up ? "more" : "less"} than ${fmt(base.v, money)}, and ${fmt(base.v, money)} ${up ? "−" : "+"} ${fmt(amt, money)} = ${fmt(fin + (up ? -amt : amt), money)} ✔`, confidence: "high", chain: steps.map(() => null) };
        }
      }
      // average, median, mode, range
      if ((m = t.match(/\b(average|mean|median|mode|range)\b/)) && nums.length >= 2 && !/\b(per|each)\b.*\b(average|mean)\b/.test(t)) {
        const v = nums.map(n => n.v), sorted = v.slice().sort((a, b) => a - b), n = v.length, sum = v.reduce((a, b) => a + b, 0);
        let ans, steps;
        if (m[1] === "average" || m[1] === "mean") { ans = clean(sum / n); steps = [`Add all ${n} numbers: ${v.join(" + ")} = <strong>${nice(sum)}</strong>`, `Divide by how many numbers there are: ${nice(sum)} ÷ ${n} = <strong>${nice(ans)}</strong>`]; }
        else if (m[1] === "median") { const mid = n % 2 ? sorted[(n - 1) / 2] : (sorted[n / 2 - 1] + sorted[n / 2]) / 2; ans = mid; steps = [`Put them in order: ${sorted.join(", ")}`, n % 2 ? `The middle number is <strong>${nice(mid)}</strong>` : `There are two middle numbers (${sorted[n / 2 - 1]} and ${sorted[n / 2]}). Their average is <strong>${nice(mid)}</strong>`]; }
        else if (m[1] === "mode") { const c = {}; v.forEach(x => c[x] = (c[x] || 0) + 1); const mx = Math.max(...Object.values(c)); const modes = Object.keys(c).filter(k => c[k] === mx).map(Number); ans = modes[0]; steps = [`Count how many times each number appears.`, mx === 1 ? "Every number appears once, so there is <strong>no mode</strong>." : `The most frequent is <strong>${modes.join(" and ")}</strong> (appears ${mx} times).`]; }
        else { ans = sorted[n - 1] - sorted[0]; steps = [`Biggest = ${sorted[n - 1]}, smallest = ${sorted[0]}`, `Range = biggest − smallest = ${sorted[n - 1]} − ${sorted[0]} = <strong>${nice(ans)}</strong>`]; }
        return { kind: "stats", answer: ans, money, unit: "", plan: `Find the ${m[1]} of ${n} numbers`, steps, check: m[1] === "average" || m[1] === "mean" ? `Check: ${nice(ans)} × ${n} = ${nice(clean(ans * n))}, which is the total ${nice(sum)} ✔` : "", confidence: "high", chain: steps.map(() => null) };
      }
      // speed, distance, time
      const spd = text.match(/(\d+(?:\.\d+)?)\s*(?:km\/h|kph|km per hour|kilometres per hour|kilometers per hour|mph|miles per hour|m\/s|metres per second|meters per second)/i);
      if (spd || /\b(speed|how fast|how far|travel\w*|drives?|walks?|runs?|cycles?)\b/.test(t)) {
        const unitS = spd ? spd[0].replace(/^[\d.\s]+/, "") : "";
        const rest = spd ? text.replace(spd[0], " ") : text;
        const dist = rest.match(/(\d+(?:\.\d+)?)\s*(km|kilomet\w+|miles?|metres|meters|m)\b/i);
        const tim = rest.match(/(\d+(?:\.\d+)?)\s*(hours?|hrs?|h|minutes?|mins?|seconds?|secs?)\b/i);
        const have = [spd, dist, tim].filter(Boolean).length;
        if (have >= 2 && (spd || /\bspeed\b|how fast/.test(t))) {
          let T = tim ? Number(tim[1]) : null, tu = tim ? tim[2].toLowerCase() : "";
          const perSec = /m\/s|per second/i.test(unitS), mins = /^min/.test(tu);
          if (tim && !perSec && mins) T = T / 60;
          const dU = dist ? dist[2].toLowerCase().replace(/kilomet\w+/, "km") : (/mph|mile/i.test(unitS) ? "miles" : /m\/s|second/i.test(unitS) ? "m" : "km");
          const tU = perSec ? "seconds" : "hours";
          let ans, steps, plan, U;
          const q = t;
          if (spd && T != null && !(dist && /how (fast|long)|speed/.test(q) && !/how far|distance/.test(q))) { const S = Number(spd[1]); ans = clean(S * T); U = dU; steps = [`Distance = speed × time`, `${nice(S)} × ${nice(clean(T))} = <strong>${nice(ans)} ${dU}</strong>`]; plan = "Distance = speed × time"; }
          else if (dist && T != null && /how fast|speed/.test(q)) { const Dd = Number(dist[1]); ans = clean(Dd / T); U = `${dU} per ${perSec ? "second" : "hour"}`; steps = [`Speed = distance ÷ time`, `${nice(Dd)} ÷ ${nice(clean(T))} = <strong>${nice(ans)} ${U}</strong>`]; plan = "Speed = distance ÷ time"; }
          else if (dist && spd && /how long|how many (hours|minutes)|time/.test(q)) { const Dd = Number(dist[1]), S = Number(spd[1]); ans = clean(Dd / S); U = tU; steps = [`Time = distance ÷ speed`, `${nice(Dd)} ÷ ${nice(S)} = <strong>${nice(ans)} ${tU}</strong>`]; plan = "Time = distance ÷ speed"; }
          if (ans != null) return { kind: "speed", answer: ans, money: false, unit: U, plan, steps, check: "Check: distance = speed × time. Put your answer back in to see if the numbers fit ✔", confidence: "high", chain: steps.map(() => null) };
        }
      }
      // area and perimeter, circles
      if (/\b(area|perimeter|circumference)\b/.test(t) && nums.length >= 1) {
        const dimU = (text.match(/\d\s*(cm|m|km|mm|metres|meters|centimetres|centimeters)\b/i) || [])[1] || "";
        const u = dimU ? dimU.toLowerCase() : "units";
        const wantA = /\barea\b/.test(t), wantP = /\b(perimeter|circumference)\b/.test(t);
        if (/\b(circle|round|circular)\b/.test(t)) {
          const r0 = /\bdiameter\b/.test(t) ? nums[0].v / 2 : nums[0].v, PI = 3.14;
          const ans = wantA ? clean(PI * r0 * r0) : clean(2 * PI * r0);
          return { kind: "geometry", answer: ans, money: false, unit: wantA ? u + "²" : u, plan: wantA ? "Area of a circle = π × r × r (π ≈ 3.14)" : "Circumference = 2 × π × r (π ≈ 3.14)", steps: [`The radius is ${nice(r0)} ${u}${/\bdiameter\b/.test(t) ? " (half the diameter)" : ""}`, wantA ? `3.14 × ${nice(r0)} × ${nice(r0)} = <strong>${nice(ans)} ${u}²</strong>` : `2 × 3.14 × ${nice(r0)} = <strong>${nice(ans)} ${u}</strong>`], check: "Check: the answer should be a bit more than 3 times bigger than the diameter (for circumference) ✔", confidence: "high", chain: [null, null] };
        }
        if (/\b(square)\b/.test(t) && nums.length === 1) {
          const a = nums[0].v, ans = wantA && !wantP ? a * a : 4 * a;
          return { kind: "geometry", answer: ans, money: false, unit: wantA && !wantP ? u + "²" : u, plan: wantA && !wantP ? "Area of a square = side × side" : "Perimeter of a square = 4 × side", steps: [wantA && !wantP ? `${nice(a)} × ${nice(a)} = <strong>${nice(ans)} ${u}²</strong>` : `4 × ${nice(a)} = <strong>${nice(ans)} ${u}</strong>`], check: "", confidence: "high", chain: [null] };
        }
        if (/\btriangle\b/.test(t) && wantA && nums.length >= 2) {
          const b = nums[0].v, h = nums[1].v, ans = clean(0.5 * b * h);
          return { kind: "geometry", answer: ans, money: false, unit: u + "²", plan: "Area of a triangle = ½ × base × height", steps: [`½ × ${nice(b)} × ${nice(h)} = <strong>${nice(ans)} ${u}²</strong>`], check: "", confidence: "high", chain: [null] };
        }
        if (nums.length >= 2 && /\b(rectangle|rectangular|field|garden|room|classroom|plot|yard|floor|wall|book|page|table|farm)\b/.test(t)) {
          const L = nums[0].v, W = nums[1].v, A = L * W, P = 2 * (L + W);
          const ans = wantA && wantP ? A : wantA ? A : P;
          const steps = [];
          if (wantA) steps.push(`Area = length × width = ${nice(L)} × ${nice(W)} = <strong>${nice(A)} ${u}²</strong>`);
          if (wantP) steps.push(`Perimeter = 2 × (length + width) = 2 × (${nice(L)} + ${nice(W)}) = <strong>${nice(P)} ${u}</strong>`);
          return { kind: "geometry", answer: ans, money: false, unit: wantA ? u + "²" : u, plan: "Area = length × width; Perimeter = 2 × (length + width)", steps, check: "Remember: area is in square units, perimeter is in ordinary units.", confidence: "medium", chain: steps.map(() => null) };
        }
      }
      // unitary method: "If 5 pens cost $10, how much do 8 pens cost?"
      if (/^\s*if\b/i.test(text) && nums.length === 3 && /\b(cost|costs|weigh|weighs|take|takes|make|makes|pay|pays|earn|earns|use|uses|hold|holds|for)\b/i.test(text) && !nums.some(n => n.pct)) {
        const [N, X, M] = nums.map(n => n.v);
        if (N > 0) {
          const one = clean(X / N), ans = clean(one * M);
          return { kind: "unitary", answer: ans, money, unit: "", plan: "Find the amount for ONE, then multiply (the unitary method)", steps: [`For one: ${fmt(X, money)} ÷ ${nice(N)} = <strong>${fmt(one, money)}</strong>`, `For ${nice(M)}: ${fmt(one, money)} × ${nice(M)} = <strong>${fmt(ans, money)}</strong>`], check: `Check: more items should cost more. ${nice(M)} is ${M > N ? "more" : "fewer"} than ${nice(N)} and ${fmt(ans, money)} is ${ans > X ? "more" : "less"} than ${fmt(X, money)} ✔`, confidence: "high", chain: [{ op: "divide", a: X, b: N, r: one, why: "find the amount for one" }, { op: "multiply", a: one, b: M, r: ans, why: "multiply by how many you need" }] };
        }
      }
      // "45 out of 60" as a percentage or a fraction
      if ((m = text.match(/(\d+(?:\.\d+)?)\s*(?:out of|\/)\s*(\d+(?:\.\d+)?)/i)) && /\b(percent|percentage|%)\b/i.test(t) && Number(m[2]) > 0 && nums.length === 2) {
        const a = Number(m[1]), b = Number(m[2]), ans = clean(a / b * 100);
        return { kind: "percent", answer: ans, money: false, unit: "%", plan: "Percentage = part ÷ whole × 100", steps: [`${nice(a)} ÷ ${nice(b)} = <strong>${nice(clean(a / b))}</strong>`, `${nice(clean(a / b))} × 100 = <strong>${nice(ans)}%</strong>`], check: `Check: ${nice(ans)}% of ${nice(b)} = ${nice(clean(ans / 100 * b))} ✔`, confidence: "high", chain: [{ op: "divide", a, b, r: clean(a / b), why: "part ÷ whole" }, { op: "multiply", a: clean(a / b), b: 100, r: ans, why: "× 100 to make a percentage" }] };
      }
      // sharing in a ratio
      if ((m = text.match(/(?:ratio|in the ratio of|in a ratio of)\s*(?:of\s+[a-z]+\s+to\s+[a-z]+\s+is\s*)?(\d+)\s*[:/]\s*(\d+)(?:\s*[:/]\s*(\d+))?/i)) || (m = text.match(/\b(\d+)\s*:\s*(\d+)(?:\s*:\s*(\d+))?/))) {
        const parts = [m[1], m[2], m[3]].filter(Boolean).map(Number), tot = nums.find(n => n.idx < m.index || n.idx > m.index + m[0].length);
        const roles = (t.match(/ratio of ([a-z]+)\s+to\s+([a-z]+)(?:\s+to\s+([a-z]+))?/) || []).slice(1).filter(Boolean);
        if (tot && (/\b(share|shared|divide|divided|split)\b/.test(t) || roles.length === parts.length)) {
          const sum = parts.reduce((a, b) => a + b, 0), one = tot.v / sum, res = parts.map(p => clean(p * one)), money2 = isMoney(text);
          const qpart = t.slice(t.lastIndexOf("?") > 0 ? t.lastIndexOf(".", t.lastIndexOf("?")) : 0);
          const want = roles.length ? roles.findIndex(r => new RegExp("\\b" + r + "\\b").test(qpart)) : -1;
          const pick = want >= 0 ? want : (/bigger|larger|greater|biggest|largest/.test(t) ? res.indexOf(Math.max(...res)) : /smaller|smallest/.test(t) ? res.indexOf(Math.min(...res)) : 0);
          const clear = want >= 0 || /bigger|larger|greater|biggest|largest|smaller|smallest/.test(t) || !roles.length;
          if (!clear) return null;
          const lab = i => (roles[i] ? roles[i] + ": " : `Share ${i + 1}: `);
          return { kind: "ratio", answer: res[pick], answers: res, money: money2, unit: "", plan: `Share ${fmt(tot.v, money2)} in the ratio ${parts.join(":")}`, steps: [`Add the parts: ${parts.join(" + ")} = <strong>${sum}</strong> equal parts`, `One part = ${fmt(tot.v, money2)} ÷ ${sum} = <strong>${fmt(one, money2)}</strong>`, ...parts.map((p, i) => `${lab(i)}${p} × ${fmt(one, money2)} = <strong>${fmt(res[i], money2)}</strong>`)], check: `Check: ${res.map(x => fmt(x, money2)).join(" + ")} = ${fmt(res.reduce((a, b) => a + b, 0), money2)} ✔`, confidence: "high", chain: null };
        }
      }
      return null;
    }

    // the main chain solver: reads the story one sentence at a time.
    // It only answers when the story gives clear operation words. Otherwise it returns null
    // so the caller can show the thinking frame instead of a guess.
    function solveChain(text) {
      if (/\bif\b|\bsuppose\b/i.test(text)) return null;
      const sents = splitSentences(text), money = isMoney(text);
      let qi = sents.findIndex(s => /\?\s*$/.test(s) || /^(how|what|find|calculate|work out|determine)\b/i.test(s));
      if (qi < 0) qi = sents.length - 1;
      const qSent = sents.slice(qi).join(" "), story = sents.slice(0, qi);
      const body = story.length ? story : [qSent];
      const qNums = story.length ? findNumbers(qSent).filter(n => !n.pct) : [];
      const qKind = questionKind(qSent), unit = unitOfQuestion(qSent);
      const all = findNumbers(text);
      if (all.some(n => n.v >= 1e9 || /^0\d/.test(n.raw.replace(/[$,]/g, "")))) return null;
      let tender = null;
      const TENDER = /\b(?:pays?|paid|pay|hands?(?: over)?|gives? the (?:cashier|shopkeeper|seller))\s+(?:with\s+|using\s+)?(\$\s*\d+(?:\.\d+)?|\d+(?:\.\d+)?\s*dollars?)/i;
      const sNums = body.map(s => { const tm = s.match(TENDER); if (tm && /\b(change|left|remain)/i.test(qSent)) { tender = findNumbers(tm[1])[0].v; s = s.replace(tm[0], " "); } return { s, n: findNumbers(s).filter(x => !x.pct), cue: cueOf(s) }; });
      const total = sNums.reduce((a, x) => a + x.n.length, 0) + qNums.length;
      const hasMultWord = /\b(twice|double|triple|half|doubled|tripled)\b/i.test(text);
      if (total < 2 && !(total === 1 && hasMultWord)) return null;
      const anyCue = sNums.some(x => Object.keys(x.cue).length);
      const groupRx = /\b\d+\s+(?:[a-z]+\s+)?(?:packets?|boxes|box|bags?|rows?|groups?|bunches|bundles|trays?|crates?|baskets?|bottles?|sets?|piles?|plates?|teams?|shelves|packs?|classes|tables|cartons?|sacks?)\s+(?:of|with|containing|holding)\s+(?:[a-z]+\s+){0,2}(?:(?:of|with|containing|holding)\s+)?\d+/i;
      const anyRate = sNums.some(x => groupRx.test(x.s) || words(x.s).some(z => CUES.rate.has(z)));
      const andHave = sNums.some(x => x.n.length === 2 && /\band\b/i.test(x.s)) && /\b(have|are there|in all|do they|do we)\b/i.test(qSent);
      const timeQ = /\b(in|after)\s+\d+\s+(years?|months?|days?|weeks?)\b/i.test(qSent) && /\b(old|age)\b/i.test(qSent);
      if (!anyCue && !anyRate && !andHave && !timeQ && qKind === "other" && !hasMultWord && !(qNums.length && /\b(carries|holds|contains|costs|weighs|seats|has|have|there are)\b/i.test(body.join(" ")))) return null;

      const steps = [];
      const record = (op, a, b, why) => { const r = apply(op, a, b); steps.push({ op, a, b, r, why }); return r; };
      let value = null, rate = null, factor = null, guessed = 0, bail = false;
      if (qKind === "diff" && !anyCue) {
        const nn = sNums.flatMap(x => x.n.map(y => y.v)).concat(qNums.map(y => y.v));
        if (nn.length === 2) { const hi = Math.max(...nn), lo = Math.min(...nn), r = clean(hi - lo); return { kind: "word", answer: r, money, unit, plan: "Compare the two amounts: subtract the smaller from the bigger", steps: [`${fmt(hi, money)} − ${fmt(lo, money)} = <strong>${fmt(r, money)}</strong>`], check: `Check: ${fmt(lo, money)} + ${fmt(r, money)} = ${fmt(lo + r, money)} ✔`, confidence: "high", chain: [{ op: "subtract", a: hi, b: lo, r, why: "find how much bigger one amount is" }] }; }
        return null;
      }
      for (const x of sNums) {
        const nums = x.n.map(y => y.v), cue = x.cue, w = words(x.s);
        const groupOf = groupRx.test(x.s);
        const isRate = groupOf || w.some(z => CUES.rate.has(z));
        const packs = w.some(z => CUES.pack.has(z));
        if (!nums.length) {
          const mm = w.find(z => MULT[z]);
          if (mm && value != null) value = record("multiply", value, MULT[mm], `"${mm}" means ×${MULT[mm]}`);
          else if (/\bhalf\b/.test(x.s) && value != null) value = record("divide", value, 2, '"half" means ÷ 2');
          continue;
        }
        const op0 = cue.divide ? "divide" : cue.subtract ? "subtract" : cue.multiply ? "multiply" : cue.add ? "add" : null;
        if (value == null) {
          if (nums.length === 1) {
            if (factor != null) { value = record("multiply", factor, nums[0], '"times as many" means multiply'); factor = null; continue; }
            if (cue.multiply && /\btimes as (many|much|long)|times (more|longer)\b/i.test(x.s)) { factor = nums[0]; continue; }
            if (isRate && !packs && !groupOf) { rate = nums[0]; continue; }
            value = rate != null ? record("multiply", rate, nums[0], "price (or amount) for each × how many") : nums[0];
            rate = null; continue;
          }
          if (isRate && packs && !groupOf && nums.length === 2) { value = record("divide", nums[0], nums[1], "total ÷ amount in each group = number of groups"); continue; }
          if ((isRate || cue.multiply) && nums.length % 2 === 0) {
            let sum = null;
            for (let i = 0; i < nums.length; i += 2) { const p = record("multiply", nums[i], nums[i + 1], "how many × amount for each"); sum = sum == null ? p : record("add", sum, p, "add the parts"); }
            value = sum; continue;
          }
          if (isRate) { bail = true; break; }
          let op = op0;
          if (!op) { if (qKind === "left") op = "subtract"; else if (qKind === "total") op = "add"; else if (nums.length === 2 && /\band\b/i.test(x.s) && /\b(have|are there|in all|in the|do they|do we|do I)\b/i.test(qSent)) { op = "add"; guessed++; } }
          if (!op) { bail = true; break; }
          value = nums[0]; for (let i = 1; i < nums.length; i++) value = record(op, value, nums[i], "");
          continue;
        }
        // there is already a running value
        if (rate != null && nums.length === 1) { value = record(cue.subtract ? "subtract" : "add", value, rate * nums[0], "price (or amount) for each × how many"); rate = null; continue; }
        if (isRate && packs && nums.length === 1 && !groupOf) { value = record("divide", value, nums[0], "total ÷ amount in each group = number of groups"); continue; }
        if (isRate && nums.length === 1 && !groupOf && !cue.divide && !cue.add && !cue.subtract) { value = record("multiply", value, nums[0], "amount × price for each"); continue; }
        if ((isRate || groupOf) && nums.length % 2 === 0) { for (let i = 0; i < nums.length; i += 2) { const p = nums[i] * nums[i + 1]; steps.push({ op: "multiply", a: nums[i], b: nums[i + 1], r: p, why: "how many × amount for each" }); value = record(cue.subtract ? "subtract" : "add", value, p, ""); } continue; }
        let op = op0;
        if (cue.subtract && cue.add && nums.length === 1) op = "subtract";
        if (!op) op = qKind === "left" ? "subtract" : qKind === "total" ? "add" : null;
        if (!op) { bail = true; break; }
        for (const n of nums) value = record(op, value, n, op === "divide" ? "sharing into equal parts" : "");
      }
      if (bail || value == null) return null;
      if (tender != null) value = record("subtract", tender, value, "money handed over − cost = change");
      if (qNums.length) {
        if (qNums.length > 1) return null;
        const timeShift = /\b(in|after)\s+\d+\s+(years?|months?|days?|weeks?)\b/i.test(qSent) && /\b(old|age|be|will)\b/i.test(qSent);
        if (timeShift) { value = record("add", value, qNums[0].v, "time passes, so add"); guessed++; }
        else if (/\b(each|per|every)\b/i.test(qSent) && /\b(share|shared|split|equally)\b/i.test(text)) value = record("divide", value, qNums[0].v, "sharing equally");
        else if (/\b(carries|holds|contains|costs|weighs|seats|has|have|there are|each|per|every)\b/i.test(body.join(" ")) && qKind === "other") { value = record("multiply", value, qNums[0].v, "the question asks about a number of groups"); guessed++; }
        else return null;
      }
      if (!steps.length || !isFinite(value) || value < 0) return null;
      if (/\bhow many\b/i.test(qSent) && !money && !Number.isInteger(clean(value))) return null;
      const conf = guessed >= 1 ? "medium" : (anyCue || qKind !== "other") ? "high" : "medium";
      const ops = [...new Set(steps.map(s => s.op))].map(o => WORDOP[o]).join(", then ");
      const lines = steps.map(s => `${fmt(s.a, money)} ${SYM[s.op]} ${fmt(s.b, money && s.op !== "multiply" && s.op !== "divide")} = <strong>${fmt(s.r, money)}</strong>${s.why ? ` <small>(${esc(s.why)})</small>` : ""}`);
      const last = steps[steps.length - 1];
      let chk;
      if (steps.length === 1) { const inv = { add: ["subtract", "−"], subtract: ["add", "+"], multiply: ["divide", "÷"], divide: ["multiply", "×"] }[last.op]; chk = `Check with the opposite: ${fmt(last.r, money)} ${inv[1]} ${fmt(last.b, money)} = ${fmt(clean(apply(inv[0], last.r, last.b)), money)}, which is where we started (${fmt(last.a, money)}) ✔`; }
      else chk = `Check: go back through the steps in reverse using the opposite operations. You should arrive at ${fmt(steps[0].a, money)} ✔`;
      return { kind: "word", answer: clean(value), money, unit, plan: ops, steps: lines, check: chk, confidence: conf, chain: steps };
    }

    function solveWord(text) {
      const t = text.trim();
      const special = solveSpecial(t);
      if (special) return special;
      return solveChain(t);
    }
    function showSolution(sol, original) {
      const money = sol.money, ans = fmt(sol.answer, money), u = sol.unit && !money ? " " + esc(sol.unit) : "";
      const parts = [
        `🧠 <strong>Let's think it through</strong>`,
        `<em>Plan:</em> ${esc(sol.plan)}`,
        li(sol.steps),
        sol.check ? `🔍 ${sol.check}` : "",
        `✅ <strong>Answer: ${ans}${u}</strong>`
      ];
      const n = note(sol.confidence); if (n) parts.push(`<small>⚠️ ${esc(n)}</small>`);
      if (sol.answers && sol.answers.length > 1) parts[parts.length - 2 < 0 ? 0 : parts.length - 2] = parts[parts.length - 2];
      return parts.filter(Boolean).join("<br><br>");
    }
    function frameworkAnswer(text) {
      const nums = findNumbers(text);
      return `🧠 <strong>Let's think it through</strong><br>I can see these numbers: <strong>${nums.length ? nums.map(n => n.raw).join(", ") : "none yet"}</strong>. I am not sure which operation the story needs, and I do not want to guess.<br><br>${li(stepsList("wordproblem"))}<br><br>Tell me what you think the first step is, or say it again with the question at the end, for example: <em>Tendai has 24 mangoes. He gives 9 away. How many are left?</em>`;
    }

    /* ---------- number patterns ---------- */
    const SEQ_KW = /\b(next|pattern|sequence|series|missing|continue|continues|comes after|what number|nth term|rule|follows)\b/i;
    function solveSequence(text) {
      if (!SEQ_KW.test(text)) return null;
      const cleaned = text.replace(/(\d),(\d{3})/g, "$1$2");
      const m = cleaned.match(/(?:-?\d+(?:\.\d+)?|\?|_+)(?:\s*,\s*|\s+)(?:-?\d+(?:\.\d+)?|\?|_+)(?:(?:\s*,\s*|\s+)(?:-?\d+(?:\.\d+)?|\?|_+))+/);
      if (!m) return null;
      const toks = m[0].split(/\s*,\s*|\s+/).filter(Boolean);
      if (toks.length < 3) return null;
      const arr = toks.map(t => (/^-?\d/.test(t) ? Number(t) : null));
      const known = arr.map((v, i) => [i, v]).filter(x => x[1] != null);
      if (known.length < 3) return null;
      const missing = arr.map((v, i) => (v == null ? i : -1)).filter(i => i >= 0);
      const wantMore = (cleaned.match(/next\s+(two|three|four|2|3|4)\b/i) || [])[1];
      const nNext = missing.length ? 0 : ({ two: 2, three: 3, four: 4, 2: 2, 3: 3, 4: 4 }[(wantMore || "").toLowerCase()] || 1);
      const wanted = missing.length ? missing : Array.from({ length: nNext }, (_, i) => arr.length + i);
      const at = {};
      known.forEach(([i, v]) => at[i] = v);
      const verify = f => known.every(([i, v]) => Math.abs(f(i) - v) < 1e-6);
      let rule = null, f = null;
      const [i0, v0] = known[0], [i1, v1] = known[1];
      // 1. arithmetic: same gap each time
      const d = (v1 - v0) / (i1 - i0);
      if (Number.isFinite(d) && verify(i => v0 + d * (i - i0))) { f = i => v0 + d * (i - i0); rule = { name: "arithmetic", text: d >= 0 ? `Each number is <strong>${nice(d)} more</strong> than the one before (add ${nice(d)}).` : `Each number is <strong>${nice(-d)} less</strong> than the one before (subtract ${nice(-d)}).`, nth: (() => { const b = clean(v0 - d * (i0 + 1)); return `nth term = ${nice(d)}n ${b < 0 ? "−" : "+"} ${nice(Math.abs(b))}`.replace(" + 0", ""); })() }; }
      // 2. geometric: multiply by the same number
      if (!f && v0 !== 0) { const r = Math.pow(v1 / v0, 1 / (i1 - i0)); if (Number.isFinite(r) && r !== 1 && r > 0 && verify(i => v0 * Math.pow(r, i - i0))) { f = i => v0 * Math.pow(r, i - i0); rule = { name: "geometric", text: `Each number is <strong>${nice(clean(r))} times</strong> the one before (multiply by ${nice(clean(r))}).`, nth: "" }; } }
      // 3. quadratic: the gaps themselves change by the same amount (squares, triangle numbers ...)
      if (!f && known.length >= 3) {
        const [ia, va] = known[0], [ib, vb] = known[1], [ic, vc] = known[2];
        const den = (ia - ib) * (ia - ic) * (ib - ic);
        if (den) {
          const A = (ic * (vb - va) + ib * (va - vc) + ia * (vc - vb)) / den;
          const B = (ic * ic * (va - vb) + ib * ib * (vc - va) + ia * ia * (vb - vc)) / den;
          const C = (ib * ic * (ib - ic) * va + ic * ia * (ic - ia) * vb + ia * ib * (ia - ib) * vc) / den;
          const g = i => A * i * i + B * i + C;
          if (Math.abs(A) > 1e-9 && verify(g)) {
            f = g; const sq = known.every(([i, v]) => v === (i + 1) * (i + 1)), cu = known.every(([i, v]) => v === Math.pow(i + 1, 3)), tri = known.every(([i, v]) => v === (i + 1) * (i + 2) / 2);
            rule = { name: "quadratic", text: sq ? "These are the <strong>square numbers</strong> (1×1, 2×2, 3×3 ...). The gaps between them grow by 2 each time." : tri ? "These are the <strong>triangular numbers</strong>. Each time you add one more than you added before (+2, +3, +4 ...)." : "The gaps are not equal, but the <strong>gaps between the gaps</strong> are always the same, so the gaps grow steadily.", nth: sq ? "nth term = n²" : "" };
          }
        }
      }
      if (!f && known.every(([i, v]) => v === Math.pow(i + 1, 3))) { f = i => Math.pow(i + 1, 3); rule = { name: "cubes", text: "These are the <strong>cube numbers</strong> (1×1×1, 2×2×2, 3×3×3 ...).", nth: "nth term = n³" }; }
      // 4. fibonacci style: add the two before
      if (!f && !missing.length && arr.length >= 4 && arr.slice(2).every((v, i) => v === arr[i] + arr[i + 1])) { const s = arr.slice(); f = i => { while (s.length <= i) s.push(s[s.length - 1] + s[s.length - 2]); return s[i]; }; rule = { name: "fibonacci", text: "Each number is the <strong>sum of the two numbers before it</strong> (like the Fibonacci sequence).", nth: "" }; }
      // 5. two patterns mixed together (odd and even places)
      if (!f && !missing.length && arr.length >= 6) {
        const ev = arr.filter((_, i) => i % 2 === 0), od = arr.filter((_, i) => i % 2 === 1);
        const ad = a => a.length >= 3 && a.every((v, i) => i === 0 || Math.abs((v - a[i - 1]) - (a[1] - a[0])) < 1e-9);
        if (ad(ev) && ad(od)) { const de = ev[1] - ev[0], dod = od[1] - od[0]; f = i => (i % 2 === 0 ? ev[0] + de * (i / 2) : od[0] + dod * ((i - 1) / 2)); rule = { name: "interleaved", text: `Two patterns are mixed together. Numbers 1, 3, 5 ... go up by <strong>${nice(de)}</strong>; numbers 2, 4, 6 ... go up by <strong>${nice(dod)}</strong>.`, nth: "" }; }
      }
      if (!f) return { kind: "sequence", unsure: true, html: `🔢 <strong>Let's look for the pattern</strong><br>${li(stepsList("sequence"))}<br><br>I tried: the same gap each time, the same multiplier, gaps that grow steadily, and the sum of the two numbers before. None of them fit <strong>${known.map(x => x[1]).join(", ")}</strong>, so I will not guess. Can you check the numbers? ✍️ Your turn: write the gaps between the numbers and look at them.` };
      const res = wanted.map(i => clean(f(i)));
      const row = arr.map((v, i) => (v == null ? "?" : nice(v))).join(" , ");
      const gaps = known.length === arr.length ? arr.slice(1).map((v, i) => nice(clean(v - arr[i]))).join("   ") : "";
      const first = res[0];
      const ans = missing.length ? `The missing number${res.length > 1 ? "s are" : " is"} <strong>${res.map(nice).join(", ")}</strong>.` : `The next number${res.length > 1 ? "s are" : " is"} <strong>${res.map(nice).join(", ")}</strong>.`;
      const html = [`🔢 <strong>Let's look for the pattern</strong>`, `Numbers: ${esc(row)}`, gaps ? `Gaps between them: ${esc(gaps)}` : "", `🔎 <em>The rule:</em> ${rule.text}`, rule.nth ? `📐 ${esc(rule.nth)}` : "", `🔍 Check: the rule works for every number you were given ✔`, `✅ <strong>${ans}</strong>`].filter(Boolean).join("<br><br>");
      return { kind: "sequence", answer: first, answers: res, rule: rule.name, html };
    }

    /* ---------- logic ---------- */
    const COMP = (LG.comparatives || []);
    const wordMap = {}; // word -> [{dim, up}]
    COMP.forEach(c => {
      [[c.word, true], [c.super, true], [c.opposite, false], [c.opSuper, false]].forEach(([w, up]) => { if (!w) return; (wordMap[w.toLowerCase()] = wordMap[w.toLowerCase()] || []).push({ dim: c.quality, up, super: w.toLowerCase() === (c.super || "").toLowerCase() || w.toLowerCase() === (c.opSuper || "").toLowerCase() }); });
    });
    const compRx = Object.keys(wordMap).sort((a, b) => b.length - a.length).map(w => w.replace(/ /g, "\\s+")).join("|");
    const NAME = "([A-Za-z][A-Za-z']*)";
    const nm = s => s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();

    function solveOrdering(text) {
      if (!compRx) return null;
      const sents = splitSentences(text);
      const rx = new RegExp("^" + NAME + "\\s+(?:is|are|was|were)\\s+(?:much |a bit |slightly |a little )?(" + compRx + ")\\s+than\\s+" + NAME + "\\s*[.!]?$", "i");
      const edges = []; // [bigger, smaller, dims]
      const qs = [];
      sents.forEach(s => {
        const m = s.match(rx);
        if (m) {
          const opts = wordMap[m[2].toLowerCase().replace(/\s+/g, " ")] || [];
          if (!opts.length) return;
          const up = opts[0].up, dims = new Set(opts.map(o => o.dim));
          const a = nm(m[1]), b = nm(m[3]);
          edges.push(up ? [a, b, dims] : [b, a, dims]);
        } else qs.push(s);
      });
      if (edges.length < 2) return null;
      const q = qs.join(" ");
      if (!/\?/.test(q)) return null;
      // which quality is the question about?
      const qm = q.match(new RegExp("\\b(" + compRx + ")\\b", "i"));
      if (!qm) return null;
      const qo = wordMap[qm[1].toLowerCase().replace(/\s+/g, " ")] || [];
      const dim = qo[0].dim, qUp = qo[0].up, isSuper = qo[0].super;
      const use = edges.filter(e => e[2].has(dim));
      const names = [...new Set(use.flatMap(e => [e[0], e[1]]))];
      const reach = {}; names.forEach(n => reach[n] = new Set());
      let changed = true;
      while (changed) { changed = false; use.forEach(([a, b]) => { const add = [b, ...reach[b]]; add.forEach(x => { if (!reach[a].has(x)) { reach[a].add(x); changed = true; } }); }); }
      const path = (a, b) => { const prev = {}, seen = new Set([a]), qu = [a]; while (qu.length) { const x = qu.shift(); for (const [p, r] of use) if (p === x && !seen.has(r)) { seen.add(r); prev[r] = x; qu.push(r); } } if (!seen.has(b)) return null; const out = [b]; while (out[0] !== a) out.unshift(prev[out[0]]); return out; };
      const word = COMP.find(c => c.quality === dim) || {};
      const more = word.word, less = word.opposite;
      const facts = use.map(([a, b]) => `${a} is ${more} than ${b}`);
      const head = `🧩 <strong>Let's reason it out</strong><br><em>Facts we are told:</em><br>${li(use.map(([a, b]) => `${esc(a)} is ${esc(more)} than ${esc(b)}`))}`;
      // "Is A taller than B?"
      const yn = q.match(new RegExp("\\b(?:is|are|was|does)\\s+" + NAME + "\\s+(?:" + compRx + ")\\s+than\\s+" + NAME, "i"));
      if (yn && !isSuper) {
        let a = nm(yn[1]), b = nm(yn[2]); if (!qUp) [a, b] = [b, a];
        const p1 = path(a, b), p2 = path(b, a);
        const ask = qUp ? [nm(yn[1]), nm(yn[2])] : [nm(yn[2]), nm(yn[1])];
        if (p1) return { kind: "logic", answer: qUp ? "yes" : "yes", html: `${head}<br><br>🔗 <em>Follow the chain:</em> ${p1.map(esc).join(" > ")}<br><br>✅ <strong>Yes.</strong> ${esc(a)} is ${esc(more)} than ${esc(b)}.<br><small>${esc(LG.tips.transitive || "")}</small>` };
        if (p2) return { kind: "logic", answer: "no", html: `${head}<br><br>🔗 <em>Follow the chain:</em> ${p2.map(esc).join(" > ")}<br><br>✅ <strong>No.</strong> It is the other way round: ${esc(b)} is ${esc(more)} than ${esc(a)}.` };
        return { kind: "logic", answer: "unknown", html: `${head}<br><br>🔗 No chain of facts joins ${esc(ask[0])} and ${esc(ask[1])}.<br><br>✅ <strong>We cannot tell.</strong> ${esc(LG.tips.unknown || "")}` };
      }
      // "Who is the tallest?"  /  "Who is the shortest?"
      if (/\bwho\b|\bwhich\b/i.test(q)) {
        const target = qUp ? (qm[1] && isSuper ? "top" : "top") : "bottom";
        let top = null;
        const wantTop = qUp; // 'tallest' = bigger than all; 'shortest' = smaller than all
        const cand = names.filter(n => names.every(o => o === n || (wantTop ? reach[n].has(o) : reach[o].has(n))));
        if (cand.length === 1) top = cand[0];
        const sup = isSuper ? qm[1].toLowerCase() : (wantTop ? word.super : word.opSuper) || qm[1];
        if (top) {
          const order = names.slice().sort((x, y) => reach[y].size - reach[x].size);
          const full = order.length === names.length && order.every((n, i) => i === 0 || reach[order[i - 1]].has(n)) ? `<br>🔗 <em>Order:</em> ${order.map(esc).join(" > ")} (${esc(more)} to ${esc(less)})` : "";
          return { kind: "logic", answer: top, html: `${head}${full}<br><br>🔍 <em>Check:</em> ${esc(top)} is ${esc(wantTop ? more : less)} than every other person we know about ✔<br><br>✅ <strong>${esc(top)}</strong> is the ${esc(sup)}.` };
        }
        return { kind: "logic", answer: "unknown", html: `${head}<br><br>🔗 The facts do not put one person above all the others.<br><br>✅ <strong>We cannot tell</strong> who is the ${esc(sup)}. ${esc(LG.tips.unknown || "")}` };
      }
      return null;
    }

    // "All dogs are animals. Rex is a dog. Is Rex an animal?"
    const sing = w => { w = w.toLowerCase().trim().replace(/^(an?|the)\s+/, ""); if (/ies$/.test(w)) return w.replace(/ies$/, "y"); if (/(ss|us|is)$/.test(w)) return w; if (/(ches|shes|xes|sses)$/.test(w)) return w.replace(/es$/, ""); if (/ves$/.test(w)) return w.replace(/ves$/, "f"); if (/men$/.test(w)) return w.replace(/men$/, "man"); if (/children$/.test(w)) return "child"; return w.replace(/s$/, ""); };
    function solveSyllogism(text) {
      const sents = splitSentences(text).map(s => s.replace(/[.!]+$/, "").trim());
      const all = [], none = [], some = [], isa = [], qs = [];
      sents.forEach(s => {
        let m;
        if ((m = s.match(/^(?:all|every|each)\s+(.+?)\s+(?:are|is|can be)\s+(?:an?\s+)?(.+)$/i))) all.push([sing(m[1]), sing(m[2])]);
        else if ((m = s.match(/^no\s+(.+?)\s+(?:are|is)\s+(?:an?\s+)?(.+)$/i))) none.push([sing(m[1]), sing(m[2])]);
        else if ((m = s.match(/^some\s+(.+?)\s+(?:are|is)\s+(?:an?\s+)?(.+)$/i))) some.push([sing(m[1]), sing(m[2])]);
        else if (!/\?$/.test(s) && (m = s.match(/^([A-Z][a-z]+)\s+(?:is|was)\s+(?:an?\s+)(.+)$/))) isa.push([m[1], sing(m[2])]);
        else qs.push(s);
      });
      if (!all.length && !none.length) return null;
      const q = text.split(/(?<=[.!?])\s+/).filter(s => /\?\s*$/.test(s)).join(" ");
      if (!q) return null;
      const qm = q.match(/^(?:so,?\s*)?(?:is|are|was)\s+(?:it true that\s+)?([A-Za-z]+)\s+(?:an?\s+)?([a-z ]+?)\s*\?$/i) || q.match(/(?:is|are)\s+(?:it true that\s+)?([A-Za-z]+)\s+(?:an?\s+)?([a-z ]+?)\s*\?$/i);
      const qa = q.match(/\b(?:are|is)\s+(all|every|some|any)\s+([a-z ]+?)\s+(?:are\s+|is\s+)?(?:an?\s+)?([a-z ]+?)\s*\?$/i);
      const bfs = (from, to) => { const prev = {}, seen = new Set([from]), qu = [from]; while (qu.length) { const x = qu.shift(); for (const [a, b] of all) if (a === x && !seen.has(b)) { seen.add(b); prev[b] = x; qu.push(b); } } if (!seen.has(to)) return null; const out = [to]; while (out[0] !== from) out.unshift(prev[out[0]]); return out; };
      const head = `🧩 <strong>Let's reason it out</strong><br><em>Facts we are told:</em><br>${li([...all.map(x => `All ${x[0]}s are ${x[1]}s`), ...none.map(x => `No ${x[0]}s are ${x[1]}s`), ...some.map(x => `Some ${x[0]}s are ${x[1]}s`), ...isa.map(x => `${x[0]} is a ${x[1]}`)].map(esc))}`;
      const fall = (a, b) => (LG.fallacies && LG.fallacies.converse || (R.fallacies && R.fallacies.converse) || "").replace(/\{A\}/g, a).replace(/\{B\}/g, b);
      if (qm && /^[A-Z]/.test(qm[1])) {
        const ind = nm(qm[1]), cat = sing(qm[2]);
        const starts = isa.filter(x => x[0] === ind).map(x => x[1]);
        if (!starts.length) return null;
        for (const s0 of starts) { const p = bfs(s0, cat); if (p) return { kind: "logic", answer: "yes", html: `${head}<br><br>🔗 <em>Follow the chain:</em> ${esc(ind)} is a ${p.map(esc).join(" → all are → ")}<br><br>🔍 <em>Check:</em> every link is a fact we were told ✔<br><br>✅ <strong>Yes.</strong> ${esc(ind)} is a ${esc(cat)}.` }; }
        for (const s0 of starts) for (const [a, b] of none) { if ((bfs(s0, a) || bfs(s0, b)) && (a === cat || b === cat || bfs(s0, a) && bfs(cat, b) || bfs(s0, b) && bfs(cat, a))) return { kind: "logic", answer: "no", html: `${head}<br><br>🔗 No ${esc(a)}s are ${esc(b)}s, and ${esc(ind)} is on one side of that.<br><br>✅ <strong>No.</strong> ${esc(ind)} cannot be a ${esc(cat)}.` }; }
        const rev = starts.some(s0 => bfs(cat, s0));
        return { kind: "logic", answer: "unknown", html: `${head}<br><br>🔗 The facts do not join ${esc(ind)} to "${esc(cat)}".${rev ? "<br>" + esc(fall(cat, starts[0])) : ""}<br><br>✅ <strong>We cannot tell.</strong> ${esc(LG.tips.unknown || "")}` };
      }
      if (qa) {
        const kind = qa[1].toLowerCase(), A = sing(qa[2]), B = sing(qa[3]);
        if (/all|every/.test(kind)) { const p = bfs(A, B); if (p) return { kind: "logic", answer: "yes", html: `${head}<br><br>🔗 ${p.map(esc).join(" → ")}<br><br>✅ <strong>Yes.</strong> All ${esc(A)}s are ${esc(B)}s.` }; return { kind: "logic", answer: "unknown", html: `${head}<br><br>${esc(fall(B, A))}<br><br>✅ <strong>We cannot tell</strong> from these facts.` }; }
      }
      return null;
    }

    // "If it rains then the ground gets wet. It rains. Is the ground wet?"
    const normFact = s => { let neg = /\b(not|never|no|isn't|aren't|doesn't|don't|didn't|wasn't|won't)\b|n't\b/i.test(s); const t = s.toLowerCase().replace(/\b(not|never|no)\b|n't/g, " ").replace(/\b(it|the|a|an|is|are|was|were|does|do|did|will|then|that|so|true|we|can|say|must|be|has|have|had|gets?|got)\b/g, " ").replace(/[^a-z0-9 ]/g, " ").split(/\s+/).filter(Boolean).map(sing); return { neg, t: [...new Set(t)] }; };
    const sameFact = (a, b) => { if (!a.t.length || !b.t.length) return false; const i = a.t.filter(x => b.t.includes(x)).length; return i / Math.max(a.t.length, b.t.length) >= 0.75; };
    function solveConditional(text) {
      const sents = splitSentences(text).map(s => s.replace(/[.!]+$/, "").trim());
      const rules = [], facts = [], qs = [];
      sents.forEach(s => {
        let m;
        if (/\?$/.test(s)) { qs.push(s.replace(/\?$/, "")); return; }
        if ((m = s.match(/^if\s+(.+?)(?:,\s*then\s+|,\s+|\s+then\s+)(.+)$/i))) rules.push({ p: m[1], q: m[2], np: normFact(m[1]), nq: normFact(m[2]) });
        else facts.push({ raw: s, n: normFact(s) });
      });
      if (!rules.length || !qs.length || !facts.length) return null;
      const known = facts.map(f => ({ n: f.n, raw: f.raw, why: "told" }));
      const used = [];
      let changed = true, rounds = 0;
      while (changed && rounds++ < 6) {
        changed = false;
        for (const r of rules) {
          // modus ponens: P is true, so Q is true
          const pT = known.find(k => sameFact(k.n, r.np) && k.n.neg === r.np.neg);
          if (pT && !known.some(k => sameFact(k.n, r.nq) && k.n.neg === r.nq.neg)) { known.push({ n: r.nq, raw: r.q, why: "from rule" }); used.push(`Rule: if ${r.p} then ${r.q}. We are told "${pT.raw}", so <strong>${esc(r.q)}</strong>.`); changed = true; }
          // modus tollens: Q is false, so P is false
          const qF = known.find(k => sameFact(k.n, r.nq) && k.n.neg !== r.nq.neg);
          if (qF && !known.some(k => sameFact(k.n, r.np) && k.n.neg !== r.np.neg)) { known.push({ n: { neg: !r.np.neg, t: r.np.t }, raw: "not: " + r.p, why: "from rule" }); used.push(`Rule: if ${r.p} then ${r.q}. But we are told "${qF.raw}", so it is <strong>not true</strong> that ${esc(r.p)}.`); changed = true; }
        }
      }
      const q = qs[qs.length - 1].replace(/^(so,?\s*)?(is it true that|can we say that|do we know that|must|does it follow that|is|are|does|did|will)\s+/i, ""), nq = normFact(q);
      const head = `🧩 <strong>Let's reason it out</strong><br><em>Facts we are told:</em><br>${li([...rules.map(r => `If ${r.p}, then ${r.q}`), ...facts.map(f => f.raw)].map(esc))}`;
      const yes = known.find(k => sameFact(k.n, nq) && k.n.neg === nq.neg), no = known.find(k => sameFact(k.n, nq) && k.n.neg !== nq.neg);
      if (yes) return { kind: "logic", answer: "yes", html: `${head}<br><br>🔗 ${used.length ? used.join("<br>") : "This was told to us directly."}<br><br>✅ <strong>Yes</strong>, it follows from the facts.` };
      if (no) return { kind: "logic", answer: "no", html: `${head}<br><br>🔗 ${used.join("<br>")}<br><br>✅ <strong>No</strong>, the facts say the opposite.` };
      const denied = rules.some(r => facts.some(f => sameFact(f.n, r.np) && f.n.neg !== r.np.neg) && sameFact(nq, r.nq)), affirmed = rules.some(r => facts.some(f => sameFact(f.n, r.nq) && f.n.neg === r.nq.neg) && sameFact(nq, r.np));
      const warn = denied ? "<br>Careful: the rule only says what happens WHEN the first part is true. It does not say what happens when it is false." : affirmed ? "<br>Careful: 'if A then B' does not mean 'if B then A'. Something else could cause B." : "";
      return { kind: "logic", answer: "unknown", html: `${head}<br><br>🔗 No rule and fact join up to answer this.${warn}<br><br>✅ <strong>We cannot tell.</strong> ${esc(LG.tips.unknown || "")}` };
    }
    const solveLogic = t => solveSyllogism(t) || solveConditional(t) || solveOrdering(t);

    /* ---------- cause and effect ---------- */
    function solveCause(text) {
      const low = text.toLowerCase();
      if (!/\b(why|what causes?|what makes?|how come|what happens (if|when)|what is the cause|because of)\b/.test(low)) return null;
      const qt = tokens(text); if (qt.length < 1) return null;
      let best = null, bs = 0;
      (CS.chains || []).forEach(c => {
        const kt = new Set(tokens(c.keywords + " " + c.q));
        const hit = qt.filter(w => kt.has(w)).length;
        const qq = new Set(tokens(c.q)), score = hit / Math.max(2, Math.min(qt.length, 5)) + qt.filter(w => qq.has(w)).length * 0.01;
        if (hit >= Math.min(2, qt.length) && score > bs) { bs = score; best = c; }
      });
      if (!best || bs < 0.5) return null;
      const chain = best.chain.map((s, i) => `${i === 0 ? "🔹" : "⬇️"} ${esc(s)}`).join("<br>");
      return { kind: "cause", id: best.id, answer: best.id, html: `🔗 <strong>${esc(best.q)}</strong><br><br><em>Follow the chain of cause and effect:</em><br>${chain}<br><br>✅ <strong>In short:</strong> ${esc(best.because)}<br><br>🤔 <strong>Think about it:</strong> ${esc(best.think)}` };
    }

    /* ---------- comparing ---------- */
    const trimItem = s => s.replace(/[?!.]+$/, "").replace(/^(a|an|the)\s+/i, "").trim().toLowerCase();
    function solveCompare(text) {
      let m, a, b;
      const t = text.trim();
      if ((m = t.match(/(?:differences?|similarit(?:y|ies)|distinction)s?\s+between\s+(.+?)\s+(?:and|&)\s+(.+?)[?.!]*$/i)) || (m = t.match(/^(?:compare|contrast)\s+(.+?)\s+(?:and|with|to|&|vs\.?|versus)\s+(.+?)[?.!]*$/i)) || (m = t.match(/^(.+?)\s+(?:vs\.?|versus)\s+(.+?)[?.!]*$/i)) || (m = t.match(/\bhow (?:is|are|do|does)\s+(.+?)\s+(?:different from|differ from|compare to|compared to|compared with)\s+(.+?)[?.!]*$/i))) { a = trimItem(m[1]); b = trimItem(m[2]); }
      else return null;
      if (/\d/.test(a + b) || a.split(" ").length > 4 || b.split(" ").length > 4) return null;
      const inL = (list, x) => list.some(n => n.toLowerCase() === x || n.toLowerCase() === sing(x) || sing(n.toLowerCase()) === sing(x));
      let hit = null, flip = false;
      for (const p of CP.pairs || []) {
        if (inL(p.a, a) && inL(p.b, b)) { hit = p; break; }
        if (inL(p.a, b) && inL(p.b, a)) { hit = p; flip = true; break; }
      }
      if (!hit) return null;
      // columns follow the order the child asked in; the data is swapped when the file lists the pair the other way round
      const L = a, Rr = b;
      const nameA = esc(L.replace(/\b[a-z]/g, c => c.toUpperCase())), nameB = esc(Rr.replace(/\b[a-z]/g, c => c.toUpperCase()));
      const cell = "padding:4px 8px;border:1px solid #cfd8dc;vertical-align:top";
      const rows = hit.rows.map(r => `<tr><td style="${cell}"><strong>${esc(r[0])}</strong></td><td style="${cell}">${esc(r[flip ? 2 : 1])}</td><td style="${cell}">${esc(r[flip ? 1 : 2])}</td></tr>`).join("");
      const tbl = `<table style="border-collapse:collapse;font-size:.92em;margin:6px 0"><tr><th style="${cell}"></th><th style="${cell}">${nameA}</th><th style="${cell}">${nameB}</th></tr>${rows}</table>`;
      return { kind: "compare", id: hit.id, answer: hit.id, html: `⚖️ <strong>${nameA} or ${nameB}?</strong><br><em>Side by side:</em><br>${tbl}<br>✅ <strong>In short:</strong> ${esc(hit.summary)}<br><br>🤔 <strong>Think about it:</strong> Which row surprised you most? Can you find one more thing they share?` };
    }

    /* ---------- guided mode: hint ladder ---------- */
    function startGuide(sol) {
      if (!sol || !sol.chain || !sol.chain.length || sol.chain.some(c => !c || !c.op)) return null;
      const money = sol.money, chain = sol.chain;
      let i = 0, tries = 0;
      const ask = () => {
        const s = chain[i];
        return `🧭 <strong>Step ${i + 1} of ${chain.length}</strong><br>${s.why ? esc(s.why.replace(/^\s+/, "")) + ".<br>" : ""}What is <strong>${fmt(s.a, money)} ${SYM[s.op]} ${fmt(s.b, money && s.op !== "multiply" && s.op !== "divide")}</strong>?<br><small>Type your answer. Say <em>hint</em> for help or <em>show me</em> to see it.</small>`;
      };
      const finish = () => `🎉 <strong>You did it!</strong> The final answer is <strong>${fmt(sol.answer, money)}${sol.unit && !money ? " " + esc(sol.unit) : ""}</strong>.<br>Now try writing the answer in a full sentence. ✍️`;
      return {
        start: () => `🧭 <strong>Let's solve it together.</strong> You do the thinking, I will guide you.<br><br><em>Plan:</em> ${esc(sol.plan)}<br><br>${ask()}`,
        handle(input) {
          const s = input.toLowerCase().trim(), st = chain[i];
          if (/^(hint|clue|help|tip)\b/.test(s)) { tries = Math.max(tries, 1); return { html: `💡 Hint: we need to <strong>${WORDOP[st.op]}</strong> here. ${tries > 1 ? "Write it as " + fmt(st.a, money) + " " + SYM[st.op] + " " + fmt(st.b, money) + " and work it out slowly." : "Look at the cue words in the question."}`, keep: true }; }
          const reveal = /^(show me|i give up|give up|answer|tell me|skip)/.test(s);
          const n = Number(s.replace(/[\s,$]/g, ""));
          if (!reveal && !(s.replace(/[\s,$]/g, "") !== "" && Number.isFinite(n))) return null;
          if (!reveal && Math.abs(n - st.r) < 1e-9) {
            i++; tries = 0;
            if (i >= chain.length) return { html: `✅ Yes, <strong>${fmt(st.r, money)}</strong>!<br><br>${finish()}`, chips: ["Quiz me"] };
            return { html: `✅ Yes, <strong>${fmt(st.r, money)}</strong>!<br><br>${ask()}`, keep: true };
          }
          tries++;
          if (reveal || tries >= 3) {
            const shown = `${fmt(st.a, money)} ${SYM[st.op]} ${fmt(st.b, money)} = <strong>${fmt(st.r, money)}</strong>`;
            i++; tries = 0;
            if (i >= chain.length) return { html: `No problem. ${shown}.<br><br>${finish()}` };
            return { html: `No problem. ${shown}.<br><br>${ask()}`, keep: true };
          }
          return { html: tries === 1 ? "Not quite, try again. 💛 Say <em>hint</em> if you want help." : `Not quite. Hint: we need to <strong>${WORDOP[st.op]}</strong>. Take your time.`, keep: true, chips: ["hint"] };
        }
      };
    }

    /* ---------- the router: decide which kind of thinking is needed ---------- */
    const WP_HINT = /\?|\b(how many|how much|find|calculate|work out|determine|what is the (total|difference|average|area|perimeter|cost|price|speed|distance))\b/i;
    const GUIDE_RX = /\b(guide me|don'?t (tell|give) me the answer|do not (tell|give) me the answer|help me (think|work (it )?out|solve it myself)|let me try|hint only)\b/i;
    let last = null;
    // "Form 3", "Grade 5", "Page 12" are labels, not amounts
    const LABEL = /\b(form|grade|class|std|standard|page|chapter|lesson|unit|room|level|paper|question|q)\s*\.?\s*\d+\b/gi;
    function route(input) {
      const text = String(input || "").replace(LABEL, " ").replace(/\s+/g, " ").trim();
      if (text.length < 6) return null;
      let r = solveCompare(text) || solveSequence(text);
      if (r) return r;
      r = solveLogic(text) || null;
      if (r) return r;
      const nums = findNumbers(text), nw = words(text).length;
      if (nums.length >= 1 && (nw >= 6 || (nums.length >= 2 && /\b(average|mean|median|mode|range)\b/i.test(text))) && WP_HINT.test(text) && !/^[\d\s.+\-*/^()x×÷=?]+$/.test(text)) {
        const sol = solveWord(text.replace(GUIDE_RX, " ").trim());
        if (sol) {
          last = sol;
          const guide = GUIDE_RX.test(text) && startGuide(sol);
          if (guide) return { kind: sol.kind, answer: sol.answer, html: guide.start(), guide, solution: sol };
          return { kind: sol.kind, answer: sol.answer, answers: sol.answers, html: showSolution(sol, text), solution: sol, chips: sol.chain && sol.chain.every(c => c && c.op) ? ["Guide me step by step"] : [] };
        }
        if (nums.length >= 2 && nw >= 8) return { kind: "word", unsure: true, html: frameworkAnswer(text) };
      }
      r = solveCause(text);
      if (r) return r;
      if (last && /^(guide me|guide me step by step|let me try|help me do it myself|step by step)\b/i.test(text)) { const g = startGuide(last); if (g) return { kind: "guide", html: g.start(), guide: g }; }
      return null;
    }

    return { route, findNumbers, solveWord, solveSequence, solveLogic, solveCause, solveCompare, startGuide, showSolution, frameworkAnswer, fmt, nice, tokens };
  }

  /* ---------- browser wiring ---------- */
  function wire() {
    const Br = root.ChiedzaBrain; if (!Br) return;
    const get = u => fetch("brain/reasoning/" + u, { cache: "no-cache" }).then(r => { if (!r.ok) throw new Error(u); return r.json(); });
    Br.ready.then(async () => {
      let D;
      try {
        const [reasoning, logic, causes, compare] = await Promise.all([get("reasoning.json"), get("logic.json"), get("causes.json"), get("compare.json")]);
        D = { reasoning, logic, causes, compare };
      } catch (e) { console.warn("Chiedza Reasoning files could not be loaded.", e.message); return; }
      const E = create(D, { esc: Br.esc, tokens: Br.tokens });
      root.ChiedzaReasoning = E;
      Br.register({
        name: "reasoning",
        handle(input) {
          let r; try { r = E.route(input); } catch (e) { console.warn("reasoning error", e); return null; }
          if (!r) return null;
          if (r.guide) Br.setPending({ freeText: true, handle: x => r.guide.handle(x) });
          return { html: r.html, chips: r.chips };
        }
      });
    });
  }
  const api = { create };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else { root.ChiedzaReasoningCore = api; wire(); }
})(typeof window !== "undefined" ? window : globalThis);
