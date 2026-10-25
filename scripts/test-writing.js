/* Exercises the Chiedza writing engine without a browser.
   Checks that every genre produces a draft, that the draft is the
   right length, that no template tokens survive, that the craft
   checker reports, and that reasoning questions are left alone.
   Run: npm run test:writing */
const fs = require("fs"), path = require("path");
const { create } = require("../public/js/reasoning-writing.js");
const writing = JSON.parse(fs.readFileSync(path.join(__dirname, "..", "public", "brain", "knowledge", "writing.json"), "utf8"));
const E = create({ writing });

let pass = 0, fail = 0;
const ok = (cond, msg) => { if (cond) { pass++; } else { fail++; console.error("\u2717 " + msg); } };
const words = s => (s.replace(/<[^>]+>/g, " ").match(/[A-Za-z0-9'\u2019-]+/g) || []).length;

function draft(q, expectGenre, minWords) {
  const r = E.write(q);
  ok(!!r, `no result for: ${q}`);
  if (!r) return null;
  ok(/class="draft"/.test(r.html), `no draft block for: ${q}`);
  ok(!/\{T\}|\{Tt\}|\{F\}/.test(r.html), `unfilled template token in: ${q}`);
  ok(!/undefined|NaN|\[object/.test(r.html), `bad value in: ${q}`);
  ok(/Craft check/.test(r.html), `no craft check for: ${q}`);
  ok(Array.isArray(r.reasoning) && r.reasoning.length >= 4, `thin reasoning for: ${q}`);
  ok(Array.isArray(r.chips) && r.chips.length >= 2, `no chips for: ${q}`);
  if (expectGenre) ok(r.html.indexOf(expectGenre) > -1, `expected genre ${expectGenre} in: ${q}`);
  const n = words(r.html);
  if (minWords) ok(n >= minWords, `too short (${n} words) for: ${q}`);
  return r;
}

console.log("\nDrafts");
draft("Write an essay about the importance of discipline in 500 words", "ESSAY", 380);
draft("write a composition about a day I will never forget", "COMPOSITION", 300);
draft("Write a descriptive piece about my grandmother's kitchen", "DESCRIPTIVE", 250);
draft("write a project on water conservation for grade 10", "PROJECT", 700);
draft("write a formal letter applying for a job as a clerk", "FORMAL LETTER", 200);
draft("write an email to my teacher asking for an extension", "EMAIL", 100);
draft("write a speech about climate change for a school assembly", "SPEECH", 350);
draft("write a newspaper article about street vendors in Harare", "ARTICLE", 350);
draft("write a short story about a girl who finds a letter", "SHORT STORY", 450);
draft("write a poem about rain", "POEM", 40);
draft("write a report on an experiment about rusting", "REPORT", 450);
draft("write a summary of the passage about village life", "SUMMARY", 60);
draft("write a book review of a novel I read at school", "REVIEW", 300);
draft("write a debate speech on whether school uniforms should be abolished", "DEBATE SPEECH", 300);
draft("write a blog post about saving money", "BLOG POST", 350);
draft("write a notice about sports day", "NOTICE", 60);

console.log("\nGuides");
["how do I write an essay", "what makes a good composition", "tips for writing a speech"].forEach(q => {
  const r = E.write(q);
  ok(!!r, `no guide for: ${q}`);
  if (r) {
    ok(/BLUEPRINT/.test(r.html), `guide not marked as blueprint: ${q}`);
    ok(/What markers look for/.test(r.html), `guide missing rubric: ${q}`);
    ok(!/class="draft"/.test(r.html), `guide should not contain a draft: ${q}`);
  }
});

console.log("\nEdits to the last draft");
const first = E.write("Write an essay about the value of reading in 600 words");
const before = words(first.html);
const shorter = E.write("make it shorter");
ok(!!shorter && words(shorter.html) < before, "shorter edit did not shorten the draft");
const formal = E.write("more formal");
ok(!!formal && !/\b(don't|can't|isn't|it's)\b/.test(formal.html), "formal edit left contractions in");
const counter = E.write("add a counter-argument");
ok(!!counter && /objection/i.test(counter.html), "counter-argument edit did not add an objection");
const outline = E.write("give me the outline");
ok(!!outline && /BLUEPRINT/.test(outline.html), "outline edit did not return the blueprint");

console.log("\nLeft alone (not writing requests)");
["Explain photosynthesis", "What is 25% of 80", "Should I start a small business?",
 "Build a website for Mai Chido Bakery in Harare", "How do I study better?",
 "What if I exercise every day?", "Why does inflation happen?"].forEach(q => {
  ok(E.write(q) === null, `writing engine wrongly claimed: ${q}`);
});

console.log("\nCraft checker");
const d = E.build(E.parse("Write an essay about the importance of discipline in 500 words"));
const cc = E.craftCheck(d);
ok(cc.words > 300, "craft check word count too low");
ok(cc.checks.length >= 8, "craft check returned too few checks");
ok(cc.checks.some(c => c.id === "counter"), "craft check missing counter-argument test");
ok(cc.checks.every(c => ["good", "warn", "bad"].indexOf(c.status) > -1), "craft check has a bad status value");

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
