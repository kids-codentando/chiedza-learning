/* Tests the website builder: reads requests, builds real sites, checks the result.
   Run: npm run test:website */
const fs = require("fs"), path = require("path");
const dir = path.join(__dirname, "..", "public", "brain", "reasoning");
const rd = f => JSON.parse(fs.readFileSync(path.join(dir, f), "utf8"));
const { create } = require(path.join(__dirname, "..", "public", "js", "sitebuilder.js"));
const E = create({ rules: rd("site-rules.json"), types: rd("website.json").types.concat(rd("website-more.json").types) });
let bad = 0;
const t = (ok, msg) => { if (!ok) { bad++; console.error("✗ " + msg); } };

const cases = [
  { q: "Build me a website for Mai Chido Bakery, a bakery in Harare selling cakes, bread and mandazi. Make it pink with a gallery", type: "restaurant", name: "Mai Chido Bakery", place: "Harare", offers: ["Cakes", "Bread", "Mandazi"], extra: "gallery" },
  { q: "Create a website called \"Sunrise Hardware\" for my shop in Bulawayo selling cement, paint and tools. Phone is 0771 234 567", type: "shop", name: "Sunrise Hardware", place: "Bulawayo", offers: ["Cement", "Paint", "Tools"], phone: "0771 234 567" },
  { q: "I need a website for a school called Hillside Academy in Mutare, blue and professional", type: "school", name: "Hillside Academy", place: "Mutare" },
  { q: "make a one page website for my photography portfolio called Tino Photos", type: "portfolio", name: "Tino Photos", layout: "single" },
  { q: "create a dark website for a church called Grace Fellowship in Gweru", type: "community", name: "Grace Fellowship", place: "Gweru", dark: true },
  { q: "build a website for my farm called Green Acres selling eggs, tomatoes and maize in Marondera", type: "farm", name: "Green Acres", place: "Marondera", offers: ["Eggs", "Tomatoes", "Maize"] },
  { q: "design a website for a hair salon called Glow Studio, gold and elegant, with pricing and testimonials", type: "salon", name: "Glow Studio", extra: "pricing" }
];
for (const c of cases) {
  const r = E.respond(c.q, null);
  if (!r || !r.site) { t(false, "no site built for: " + c.q); continue; }
  const { spec, files, report } = r.site;
  t(spec.type === c.type, `type for "${c.q.slice(0, 40)}" expected ${c.type}, got ${spec.type}`);
  t(spec.name === c.name, `name expected ${c.name}, got ${spec.name}`);
  if (c.place) t(spec.place === c.place, `place expected ${c.place}, got ${spec.place}`);
  if (c.offers) t(JSON.stringify(spec.offers) === JSON.stringify(c.offers), `offers expected ${c.offers}, got ${spec.offers}`);
  if (c.extra) t(spec.extras[c.extra], "extra missing: " + c.extra);
  if (c.layout) t(spec.layout === c.layout, "layout " + spec.layout);
  if (c.dark) t(spec.dark, "dark mode not set");
  if (c.phone) t(spec.contact.phone === c.phone, "phone " + spec.contact.phone);
  t(report.passed === report.total, `self-check failed for ${c.name}: ` + report.checks.filter(x => !x.ok).map(x => x.text).join("; "));
  t(Object.keys(files).includes("index.html") && files["styles.css"] && files["script.js"], "core files missing for " + c.name);
}
// multi-page sites really have several pages
{ const r = E.respond(cases[0].q, null); t(Object.keys(r.site.files).filter(f => f.endsWith(".html")).length >= 5, "bakery site should have 5+ pages"); }
// follow-up edits change the spec and keep it valid
{
  let r = E.respond(cases[1].q, null);
  let e = E.respond("make it green", r.site); t(e && e.site && e.site.spec.colors.primary === "#1b7a3d", "make it green");
  e = E.respond("add a gallery and pricing", e.site); t(e && e.site.spec.extras.gallery && e.site.spec.extras.pricing, "add gallery and pricing");
  e = E.respond("change the name to Moyo Hardware", e.site); t(e && e.site.spec.name === "Moyo Hardware", "rename");
  e = E.respond("make it one page", e.site); t(e && e.site.spec.layout === "single" && Object.keys(e.site.files).filter(f => f.endsWith(".html")).length === 1, "one page");
  e = E.respond("email is hello@moyo.co.zw", e.site); t(e && e.site.spec.contact.email === "hello@moyo.co.zw", "email");
  e = E.respond("add a dark mode", e.site); t(e && e.site.spec.dark, "dark");
  t(e.site.report.passed === e.site.report.total, "site still valid after edits");
}
// every colour passes contrast, including awkward ones
for (const col of ["yellow", "gold", "black", "lime", "orange", "pink", "#ffee00", "#101010"]) {
  for (const dk of ["", " dark mode"]) {
    const r = E.respond(`make a website for Test Co selling pens, ${col}${dk}`, null);
    t(r && r.site.report.passed === r.site.report.total, `contrast failed for ${col}${dk}: ` + (r && r.site.report.checks.filter(x => !x.ok).map(x => x.text)));
  }
}
// hostile input must be escaped everywhere
{
  const r = E.respond('create a website called "<script>alert(1)</script>" selling <img src=x onerror=alert(1)>, tea', null);
  const all = Object.entries(r.site.files).filter(([f]) => f !== "README.txt").map(e => e[1]).join("").replace(/<script src="script.js"><\/script>/g, "");
  t(!/<script>alert/.test(all) && !/<img src=x/.test(all), "user text was not escaped");
}
// things that are not website requests must not trigger the builder
for (const q of ["what is a verb", "12 x 15", "why does it rain", "hello"]) t(E.respond(q, null) === null, "builder wrongly answered: " + q);
// no invented contact details
{ const r = E.respond("build a website for Zed Cafe, a cafe in Harare", null); const all = r.site.files["contact.html"]; t(/class="ph"/.test(all) && !/\+?\d{3}[\s-]?\d{3}/.test(all.replace(/viewport|width=device-width|initial-scale=1/g, "")), "contact page should show placeholders, not made-up numbers"); }
console.log(bad ? `\n${bad} problem(s) found` : "Website builder OK ✔");
process.exit(bad ? 1 : 0);
