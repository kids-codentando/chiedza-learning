/* Validates the Chiedza Brain files: every file in manifest.json exists, is valid JSON,
   and knowledge entries have the fields the AI needs. Run: npm run check:brain */
const fs = require("fs"), path = require("path");
const root = path.join(__dirname, "..", "public", "brain");
let errors = 0;
const fail = m => { console.error("✗ " + m); errors++; };
const readJSON = f => { try { return JSON.parse(fs.readFileSync(path.join(root, f), "utf8")); } catch (e) { fail(`${f}: ${e.message}`); return null; } };
const man = readJSON("manifest.json"); if (!man) process.exit(1);
["identity", "safety", "skills", "glossary", "fun", "projects"].forEach(k => { if (!man[k]) fail(`manifest.${k} missing`); else if (!fs.existsSync(path.join(root, man[k]))) fail(`file not found: ${man[k]}`); });
const ids = new Set();
(man.knowledge || []).forEach(f => {
  const d = readJSON(f); if (!d) return;
  (d.entries || []).forEach(e => {
    if (!e.id || !e.keywords || !e.a) fail(`${f}: entry needs id, keywords and a (${e.id || "no id"})`);
    if (ids.has(e.id)) fail(`${f}: duplicate id ${e.id}`); ids.add(e.id);
  });
  console.log(`✓ ${f}: ${(d.entries || []).length} entries`);
});
(man.languages || []).forEach(f => { const d = readJSON(f); if (d) { if (!d.phrases || !d.numbers || d.numbers.length !== 10) fail(`${f}: needs phrases and 10 numbers`); else console.log(`✓ ${f}: ${d.phrases.length} phrases`); } });
(man.reasoning || []).forEach(f => { const d = readJSON(f); if (d) console.log(`✓ ${f}`); });
const g = man.glossary && readJSON(man.glossary); if (g) console.log(`✓ glossary: ${g.words.length} words`);
const sf = man.safety && readJSON(man.safety); if (sf) Object.entries(sf).forEach(([k, v]) => (v.patterns || []).forEach(p => { try { new RegExp(p, "i"); } catch (e) { fail(`safety.${k}: bad pattern ${p}`); } }));
const pr = man.projects && readJSON(man.projects); if (pr) console.log(`✓ projects: ${Object.keys(pr.kinds).length} kinds, ${pr.experiments.length} experiments`);
console.log(errors ? `\n${errors} problem(s) found` : "\nBrain OK ✔");
process.exit(errors ? 1 : 0);
