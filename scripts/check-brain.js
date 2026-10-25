/* Validates the Chiedza Brain files: every file in manifest.json exists, is valid JSON,
   safety patterns compile and website types are complete. Run: npm run check:brain */
const fs = require("fs"), path = require("path");
const root = path.join(__dirname, "..", "public", "brain");
let errors = 0;
const fail = m => { console.error("✗ " + m); errors++; };
const readJSON = f => { try { return JSON.parse(fs.readFileSync(path.join(root, f), "utf8")); } catch (e) { fail(`${f}: ${e.message}`); return null; } };
const man = readJSON("manifest.json"); if (!man) process.exit(1);
["identity", "safety"].forEach(k => { if (!man[k]) fail(`manifest.${k} missing`); else if (!fs.existsSync(path.join(root, man[k]))) fail(`file not found: ${man[k]}`); });
[...(man.reasoning || []), ...(man.website || [])].forEach(f => { const d = readJSON(f); if (d) console.log(`✓ ${f}`); });
const sf = man.safety && readJSON(man.safety);
if (sf) Object.entries(sf).forEach(([k, v]) => { if (!v.reply) fail(`safety.${k}: reply missing`); (v.patterns || []).forEach(p => { try { new RegExp(p, "i"); } catch (e) { fail(`safety.${k}: bad pattern ${p}`); } }); });
const ids = new Set();
(man.website || []).filter(f => /website/.test(f)).forEach(f => {
  const d = readJSON(f); if (!d) return;
  (d.types || []).forEach(t => {
    ["id", "label", "emoji", "palette", "tone", "offerLabel", "offerFile"].forEach(k => { if (!t[k]) fail(`${f}: type ${t.id || "?"} missing ${k}`); });
    if (ids.has(t.id)) fail(`duplicate type id ${t.id}`); ids.add(t.id);
    if (!t.keywords || !t.keywords.length) fail(`${t.id}: needs keywords`);
    if (!t.cta || !t.cta.label) fail(`${t.id}: needs cta`);
    if (!t.about || t.about.length < 1 || !t.offers || t.offers.length < 3 || !t.values || t.values.length !== 3 || !t.faq || t.faq.length < 3 || !t.blurbs || !t.taglines) fail(`${t.id}: copy incomplete (about, 3+ offers, 3 values, 3+ faq, blurbs, taglines)`);
  });
  console.log(`✓ ${f}: ${(d.types || []).length} website types`);
});
const kid = new Set();
(man.knowledge || []).forEach(f => {
  const d = readJSON(f); if (!d) return;
  const cs = d.concepts || [];
  if (!cs.length) fail(`${f}: no concepts`);
  cs.forEach(c => {
    ["id", "title", "domain", "summary", "definition", "why", "example"].forEach(k => { if (!c[k]) fail(`${f}: concept ${c.id || "?"} missing ${k}`); });
    if (!c.terms || !c.terms.length) fail(`${f}: concept ${c.id || "?"} needs terms`);
    if (!c.how || !c.how.length) fail(`${f}: concept ${c.id || "?"} needs how steps`);
    if (kid.has(c.id)) fail(`duplicate concept id ${c.id}`); kid.add(c.id);
  });
  (d.analogies || []).forEach(a => { ["id", "a", "b", "text"].forEach(k => { if (!a[k]) fail(`${f}: analogy ${a.id || "?"} missing ${k}`); }); });
  (d.heuristics || []).forEach(h => { ["id", "pattern", "text"].forEach(k => { if (!h[k]) fail(`${f}: heuristic ${h.id || "?"} missing ${k}`); }); });
  console.log(`✓ ${f}: ${cs.length} concepts, ${(d.analogies || []).length} analogies, ${(d.heuristics || []).length} heuristics`);
});
const gid = new Set();
(man.writing || []).forEach(f => {
  const d = readJSON(f); if (!d) return;
  const gs = d.genres || [];
  if (!gs.length) fail(`${f}: no genres`);
  gs.forEach(g => {
    ["id", "label", "emoji", "keywords", "structure", "rubric"].forEach(k => { if (!g[k]) fail(`${f}: genre ${g.id || "?"} missing ${k}`); });
    if (gid.has(g.id)) fail(`duplicate genre id ${g.id}`); gid.add(g.id);
    if (!g.keywords || !g.keywords.length) fail(`${g.id}: needs keywords`);
    if (!g.structure || g.structure.length < 1) fail(`${g.id}: needs a structure`);
    (g.structure || []).forEach(st => { if (!st.role || !st.label) fail(`${g.id}: structure step needs role and label`); });
    if (!g.rubric || g.rubric.length < 3) fail(`${g.id}: needs 3+ rubric lines`);
    if (!g.defaults || !g.defaults.words) fail(`${g.id}: needs defaults.words`);
  });
  const fr = (d.craft && d.craft.frames) || {};
  gs.forEach(g => (g.structure || []).forEach(st => { if (!fr[st.role] || !fr[st.role].length) fail(`${g.id}: no frames for role ${st.role}`); }));
  if (!d.facets || !d.facets.length) fail(`${f}: no facets`);
  if (!d.checks || d.checks.length < 5) fail(`${f}: needs 5+ craft checks`);
  console.log(`\u2713 ${f}: ${gs.length} genres, ${Object.keys(fr).length} frame banks, ${(d.facets || []).length} facets`);
});
console.log(errors ? `\n${errors} problem(s) found` : "\nBrain OK ✔");
process.exit(errors ? 1 : 0);
