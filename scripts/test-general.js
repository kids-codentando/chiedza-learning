/* Exercises the general reasoning engine (public/js/reasoning-general.js)
   against the knowledge file, checking every intent path and the guards
   that keep maths and website commands with their own engines.
   Run: npm run test:general */
const fs = require("fs"), path = require("path");
const root = path.join(__dirname, "..");
const general = JSON.parse(fs.readFileSync(path.join(root, "public/brain/knowledge/general.json"), "utf8"));
const { create } = require(path.join(root, "public/js/reasoning-general.js"));
const E = create({ general });

let pass = 0, fail = 0;
const ok = (name, cond, extra) => { if (cond) { pass++; console.log("✓ " + name); } else { fail++; console.error("✗ " + name + (extra ? " — " + extra : "")); } };

const cases = [
  { q: "Explain photosynthesis", intent: "definition", must: ["photosynthesis"], hasReasoning: true },
  { q: "How does a computer work?", intent: "how", must: ["computer"], hasReasoning: true },
  { q: "Why does it rain?", intent: "why", must: [], hasReasoning: true },
  { q: "Tell me about democracy", intent: "definition", must: ["democracy"], hasReasoning: true },
  { q: "Should I start a small business?", intent: "proscons", must: [], hasReasoning: true },
  { q: "How do I study better?", intent: "plan", must: [], hasReasoning: true },
  { q: "What if I exercise every day?", intent: "hypothetical", must: [], hasReasoning: true },
  { q: "Analyse climate change", intent: "analysis", must: ["climate"], hasReasoning: true },
  { q: "How many minutes should I sleep?", intent: "quantity", must: [], hasReasoning: true },
  { q: "Compare savings and investing", intent: "compare", must: [], hasReasoning: true },
  { q: "Hello", intent: "greeting", must: ["Chiedza"], hasReasoning: false },
  { q: "Who are you?", intent: "identity", must: ["Chiedza"], hasReasoning: true },
  { q: "Thanks!", intent: "thanks", must: [], hasReasoning: false },
  { q: "zxcv qwerty plugh", intent: "open", must: [], hasReasoning: true }
];

cases.forEach(({ q, intent, must, hasReasoning }) => {
  const got = E.intentOf(q);
  ok(`intent "${q}" → ${intent}`, got === intent, "got " + got);
  const r = E.reason(q);
  ok(`answer "${q}"`, !!r && typeof r.html === "string" && r.html.length > 20);
  if (!r) return;
  must.forEach(w => ok(`"${q}" mentions ${w}`, r.html.toLowerCase().includes(w.toLowerCase())));
  ok(`"${q}" reasoning steps`, hasReasoning ? Array.isArray(r.reasoning) && r.reasoning.length > 0 : Array.isArray(r.reasoning));
  ok(`"${q}" has chips`, Array.isArray(r.chips) && r.chips.length > 0);
});

// Guards: these must be left for the calculator and website builder.
["25% of 80", "12 * 7", "sqrt 144", "Build a website for my bakery", "make it green"].forEach(q => {
  ok(`guard leaves "${q}" alone`, E.reason(q) === null);
});

// Knowledge coverage sanity.
ok("knowledge has many concepts", (general.concepts || []).length >= 40, "found " + (general.concepts || []).length);
ok("knowledge has analogies", (general.analogies || []).length >= 3);
ok("knowledge has heuristics", (general.heuristics || []).length >= 3);

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
