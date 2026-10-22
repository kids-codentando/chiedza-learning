/* Checks that Chiedza answers from the brain only when the answer really fits the question.
   1) every knowledge entry must be found again from its own keywords (95% or better)
   2) questions the brain knows nothing about must NOT get a made-up match
   Run: npm run test:matching */
const fs = require("fs"), vm = require("vm"), path = require("path");
const pub = path.join(__dirname, "..", "public") + path.sep;
const win = { localStorage: { getItem: () => null, setItem() {} }, fetch: async u => { if (u.startsWith("/api")) return { ok: false }; const f = pub + u.replace(/^\//, ""); if (!fs.existsSync(f)) return { ok: false }; const t = fs.readFileSync(f, "utf8"); return { ok: true, json: async () => JSON.parse(t), text: async () => t }; }, console, navigator: {}, document: { addEventListener() {} }, Promise, JSON, Math, Date };
win.window = win; win.globalThis = win; vm.createContext(win); vm.runInContext(fs.readFileSync(pub + "js/brain.js", "utf8"), win);
(async () => {
  await win.ChiedzaBrain.ready; const B = win.ChiedzaBrain; let hit = 0, tot = 0, bad = 0;
  for (const e of B.data.knowledge) { if (e.trained) continue; const ws = e.keywords.split(/\s+/).filter(Boolean); for (const n of [3, 4]) { tot++; const r = B.fallback(ws.slice(0, n).join(" ")); if (r && r.html.startsWith(e.a.slice(0, 40))) hit++; } }
  const pct = hit / tot * 100; console.log(`self-retrieval: ${hit}/${tot} (${pct.toFixed(1)}%)`); if (pct < 95) { bad++; console.error("✗ the brain no longer finds its own entries"); }
  const none = JSON.parse(fs.readFileSync(path.join(pub, "brain", "reasoning", "examples.json"), "utf8")).nomatch || [];
  none.forEach(q => { const r = B.fallback(q); if (r) { bad++; console.error(`✗ should not match: "${q}" -> ${r.html.replace(/<[^>]+>/g, " ").slice(0, 70)}`); } });
  console.log(`${none.length} unrelated questions correctly left unanswered by the file brain`);
  console.log(bad ? `\n${bad} problem(s) found` : "\nMatching OK ✔"); process.exit(bad ? 1 : 0);
})();
