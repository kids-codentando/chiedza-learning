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
console.log(errors ? `\n${errors} problem(s) found` : "\nBrain OK ✔");
process.exit(errors ? 1 : 0);
