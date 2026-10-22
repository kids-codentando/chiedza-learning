/* Tests Chiedza's reasoning engine against public/brain/reasoning/examples.json.
   Each example has a question (q) and the expected answer (a). Add your own examples
   when you teach the AI something new. Run: npm run test:reasoning */
const fs = require("fs"), path = require("path");
const dir = path.join(__dirname, "..", "public", "brain", "reasoning");
const rd = f => JSON.parse(fs.readFileSync(path.join(dir, f), "utf8"));
const { create } = require(path.join(__dirname, "..", "public", "js", "reasoning.js"));
const E = create({ reasoning: rd("reasoning.json"), logic: rd("logic.json"), causes: rd("causes.json"), compare: rd("compare.json") });
const ex = rd("examples.json").examples;
let bad = 0;
for (const t of ex) {
  const r = E.route(t.q);
  let ok;
  if (t.a === null) ok = !r || r.unsure === true;                 // must NOT invent an answer
  else if (!r) ok = false;
  else if (typeof t.a === "number") ok = typeof r.answer === "number" && Math.abs(r.answer - t.a) < 1e-6;
  else if (Array.isArray(t.a)) ok = Array.isArray(r.answers) && t.a.length === r.answers.length && t.a.every((v, i) => Math.abs(v - r.answers[i]) < 1e-6);
  else ok = String(r.answer) === t.a || (t.kind && r.kind === t.kind && t.a === "*");
  if (!ok) { bad++; console.error(`✗ ${t.q}\n   expected ${JSON.stringify(t.a)}, got ${r ? JSON.stringify(r.answer) + " (" + r.kind + (r.unsure ? ", unsure" : "") + ")" : "nothing"}`); }
}
// every cause chain, comparison pair and logic word must be well formed
rd("causes.json").chains.forEach(c => { if (!c.id || !c.keywords || !c.q || !Array.isArray(c.chain) || c.chain.length < 3 || !c.because || !c.think) { bad++; console.error("✗ cause chain incomplete: " + c.id); } });
rd("compare.json").pairs.forEach(p => { if (!p.id || !p.a.length || !p.b.length || p.rows.length < 2 || p.rows.some(r => r.length !== 3)) { bad++; console.error("✗ comparison incomplete: " + p.id); } });
console.log(`${ex.length - bad > 0 ? "✓" : "✗"} ${ex.length} reasoning examples checked`);
console.log(bad ? `\n${bad} problem(s) found` : "\nReasoning OK ✔");
process.exit(bad ? 1 : 0);
