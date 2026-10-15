/* ============================================================
   CHIEDZA BRAIN - Project Writer
   Builds school projects as a guided draft: Chiedza AI writes the
   structure and the facts it really knows (from lessons + brain
   files) and leaves "your turn" lines so the learner writes the
   rest in their own words. Download, print or copy the result.
   Created by Ntandomods.
   ============================================================ */
(function () {
  "use strict";
  function init() {
    const Br = window.ChiedzaBrain; if (!Br) return;
    const { esc, cap, pick, tokens, plain } = Br, B = Br.data;
    const T = () => B.projectTemplates || { kinds: {}, starters: { intro: [], middle: [], end: [] }, questions: [], experiments: [], business: { example: {}, tips: [] }, aboutme: { sections: [] }, wordbank: [] };

    /* ---------- understanding the request ---------- */
    const KIND_ORDER = ["aboutme", "website", "experiment", "business", "poster", "story", "report"];
    const NOUN = /\b(project|report|poster|essay|assignment|experiment|investigation|science fair|tuckshop|business plan|business|about me|mini website|website|web page|webpage|web site|story|presentation|research)\b/i;
    const VERB = /\b(write|make|create|build|plan|do|start|prepare|help|draft|design|generate|need|want|compose|put together|can you|could you)\b/i;
    function detectKind(s) {
      s = s.toLowerCase(); const k = T().kinds;
      for (const id of KIND_ORDER) if (k[id] && (k[id].words || []).some(w => new RegExp("\\b" + w + "\\b").test(s))) return id;
      return "report";
    }
    function extractTopic(s, kind) {
      let t = s.replace(/[?!.]+$/g, "").trim(), m;
      if (kind === "business" && (m = t.match(/\b(?:selling|sell|sells|sale of)\s+(.+)$/i))) return m[1];
      if ((m = t.match(/\b(?:on|about|for|of|called|titled|named|regarding)\s+(.+)$/i))) t = m[1];
      else return "";
      t = t.replace(kind === "website" ? /^(?:the|a|an)\s+/i : /^(?:the|a|an|my|our)\s+/i, "").replace(/\b(please|thanks|thank you)\b/gi, "").replace(/\s+/g, " ").trim();
      return t.length > 60 ? t.slice(0, 60) : t;
    }

    /* ---------- gathering real facts ---------- */
    function gather(topic) {
      const qt = [...new Set(tokens(topic))]; const out = { facts: [], sources: [], words: [], links: [], fun: "" };
      if (!qt.length) return out;
      B.knowledge.map(e => ({ e, s: qt.filter(t => e.kt.includes(t)).length * 2 + qt.filter(t => e.at.includes(t)).length * 0.5 }))
        .filter(x => x.s >= 2 && qt.filter(t => x.e.kt.includes(t)).length / qt.length >= 0.6).sort((a, b) => b.s - a.s).slice(0, 3).forEach(x => {
          out.facts.push(plain(x.e.a)); out.sources.push(`Chiedza Brain: ${x.e.topic}`); (x.e.links || []).slice(0, 1).forEach(l => out.links.push(l));
        });
      const les = window.ChiedzaAI && window.ChiedzaAI.facts ? window.ChiedzaAI.facts(topic, 3) : [];
      les.forEach(l => {
        if (l.text) out.facts.push(l.text); if (l.fact) out.facts.push("Key fact: " + l.fact);
        out.sources.push(`Chiedza lesson: ${l.title} (${l.level})`); if (l.link) out.links.push([l.link, l.title]);
      });
      const blob = (topic + " " + out.facts.join(" ")).toLowerCase();
      out.words = B.glossary.filter(g => new RegExp("\\b" + g.w + "s?\\b").test(blob)).slice(0, 6);
      out.fun = out.facts.length ? "" : "";
      return out;
    }

    /* ---------- builders (each returns a project) ---------- */
    const sec = (h, o) => Object.assign({ h }, o || {});
    const blank = n => Array.from({ length: n }, () => "");
    const starters = k => T().starters[k] || [];
    function head(topic, who) { return sec("Title page", { text: [`By: ${who || "____________"}`, "Class or grade: ____________", "Date: ____________", "School: ____________  (you may leave this blank online)"] }); }

    function buildReport(topic, who) {
      const g = gather(topic), title = "All About " + cap(topic), S = starters("intro"), M = starters("middle"), E = starters("end");
      const secs = [head(topic, who),
        sec("1. Introduction", { text: ["Tell the reader what your project is about. Use these starters:"], write: S.slice(0, 3).map(x => x + " ...") }),
        g.facts.length ? sec("2. What I found out", { text: ["Facts from Chiedza Learning. Read them, then rewrite them in your own words in section 5."], bullets: g.facts }) :
          sec("2. What I need to find out", { text: [`Chiedza does not have a lesson on "${topic}" yet, so I will not invent facts. Find the answers from your teacher, parents, library books or a trusted website, and write them here:`], write: T().questions.map(q => q.replace("it", topic).replace("?", "?  ")) }),
        g.words.length ? sec("3. Key words", { table: { cols: ["Word", "Meaning"], rows: g.words.map(w => [w.w, w.d]) } }) : sec("3. Key words", { text: ["List 3 to 5 important words and what they mean."], write: blank(3).map((_, i) => `Word ${i + 1}: ______  Meaning: ______`) }),
        sec("4. Picture", { text: [`Draw or stick a picture of ${topic} here and label 3 parts.`], box: true }),
        sec("5. In my own words", { text: ["Now explain it in YOUR words. This is the most important part!"], write: M.slice(0, 4).map(x => x + " ...") }),
        sec("6. Conclusion", { write: E.slice(0, 3).map(x => x + " ...") }),
        sec("7. Where I found my information", { bullets: g.sources.concat(["Book or website: ____________", "Person I asked (teacher, parent, elder): ____________"]) }),
        sec("8. Checklist before I hand in", { check: ["Title and my name are on the front", "Every section is finished", "Facts are written in my own words", "Picture is neat and labelled", "I checked spelling and full stops", "I listed where I found my information"] })];
      return { kind: "report", title, topic, sections: secs, links: g.links, grounded: g.facts.length > 0 };
    }

    function buildPoster(topic, who) {
      const g = gather(topic), title = cap(topic);
      const heads = g.facts.slice(0, 3).map(f => f.length > 140 ? f.split(/(?<=[.!?])\s/)[0] : f);
      const secs = [sec("Big title", { text: [`${title}`, "Make it BIG and colourful. Use only 2 to 5 words."] }),
        sec("3 headline facts", heads.length ? { text: ["Write each fact in a short sentence under its own heading:"], bullets: heads } : { text: [`I have no lesson on "${topic}" yet, so find 3 facts yourself:`], write: ["Fact 1: ______", "Fact 2: ______", "Fact 3: ______"] }),
        sec("Pictures to draw or stick", { bullets: [`A big picture of ${topic} in the middle`, "A small map or diagram (label it)", "2 small pictures that show why it matters"] }),
        sec("Colours", { text: ["Use bright colours. Zimbabwe colours always look great: green, yellow, red, black and white. Use dark letters on a light background so people can read it from far away."] }),
        sec("My slogan", { text: ["A slogan is a short, catchy line."], write: [`Slogan for ${topic}: ______________________`] }),
        sec("Layout plan", { pre: "+----------------------------------+\n|        BIG TITLE (centre)        |\n+----------------+-----------------+\n|   Fact 1       |                 |\n|   Fact 2       |  BIG PICTURE    |\n|   Fact 3       |                 |\n+----------------+-----------------+\n|  Slogan   |  My name & class     |\n+----------------------------------+" }),
        sec("Checklist", { check: ["Title is big and readable", "Not too many words", "Pictures are neat", "My name is on the poster", "Spelling checked"] })];
      return { kind: "poster", title: "Poster: " + title, topic, sections: secs, links: g.links, grounded: g.facts.length > 0 };
    }

    function buildStory(topic, who) {
      const wb = (T().wordbank || []).slice(0, 8);
      const secs = [sec("Idea", { text: [`A story about: ${topic}`] }),
        sec("Characters", { write: ["Main character (name, age, what they are like): ______", "A friend or helper: ______", "Someone or something that makes trouble: ______"] }),
        sec("Setting", { text: ["Where and when? Pick a Zimbabwean place to make it real, for example a village near Great Zimbabwe, a school in Bulawayo, the banks of the Zambezi, a rural homestead, a busy Harare market."], write: ["The story happens in ______ at ______ (time)."] }),
        sec("Beginning", { write: ["Opening line (try a question, a sound or a surprise): ______", "We meet the main character, who wants ______ ."] }),
        sec("Middle: the problem", { write: ["Then ______ happened.", "The character tried ______ but it did not work because ______ .", "Then things got worse when ______ ."] }),
        sec("End: the solution", { write: ["In the end the character ______ .", "They learned that ______ ."] }),
        sec("Moral", { text: ["Many Zimbabwean folktales end with a lesson, like Ubuntu (kindness) or working together."], write: ["The moral of my story is ______ ."] }),
        sec("Word bank", { text: ["Try to use at least 5 of these good words: " + wb.join(", ") + "."] }),
        sec("Checklist", { check: ["My story has a beginning, middle and end", "Every sentence starts with a capital letter and ends with . ? or !", "I used speech marks for what people say", "I used interesting adjectives", "I read it out loud to check it"] })];
      return { kind: "story", title: "Story: " + cap(topic), topic, sections: secs, links: [], grounded: false };
    }

    function buildExperiment(topic, who) {
      const qt = tokens(topic); const exps = T().experiments || [];
      const best = exps.map(e => ({ e, s: qt.filter(t => tokens(e.keywords).includes(t)).length })).sort((a, b) => b.s - a.s)[0];
      const known = best && best.s >= 1 ? best.e : null;
      const secs = [];
      if (known) {
        secs.push(sec("Title", { text: [known.title] }), sec("My question", { text: [known.question] }),
          sec("My hypothesis (my smart guess)", { text: ["Example: " + known.hypothesis, "Now write YOUR guess and why you think so:"], write: ["I think ______ because ______ ."] }),
          sec("Materials", { bullets: known.materials }), sec("Method", { numbered: known.steps }),
          sec("Fair test", { table: { cols: ["I change", "I measure", "I keep the same"], rows: [[known.change, known.measure, known.same]] } }),
          sec("Results", { text: ["Draw this table and fill it in as you go."], table: { cols: ["Day / try", "What I saw", "My measurement"], rows: [["1", "", ""], ["2", "", ""], ["3", "", ""], ["4", "", ""], ["5", "", ""]] } }),
          sec("Conclusion", { write: ["My results showed that ______ .", "My hypothesis was right / wrong because ______ .", "Next time I would change ______ ."] }));
      } else {
        secs.push(sec("Title", { text: [`An investigation about ${topic}`] }), sec("My question", { text: ["A good question can be tested and measured. Start with: How does ___ change ___ ?"], write: [`My question about ${topic}: ______`] }),
          sec("My hypothesis (my smart guess)", { write: ["I think ______ because ______ ."] }),
          sec("Materials", { text: ["List everything you need (use simple things from home)."], write: blank(4).map(() => "- ______") }),
          sec("Method", { text: ["Write numbered steps so someone else can repeat your test."], write: ["1. ______", "2. ______", "3. ______", "4. ______"] }),
          sec("Fair test", { table: { cols: ["I change (only ONE thing)", "I measure", "I keep the same"], rows: [["", "", ""]] } }),
          sec("Results", { table: { cols: ["Day / try", "What I saw", "My measurement"], rows: [["1", "", ""], ["2", "", ""], ["3", "", ""], ["4", "", ""], ["5", "", ""]] } }),
          sec("Conclusion", { write: ["My results showed that ______ .", "My hypothesis was right / wrong because ______ ."] }),
          sec("Ready-made experiment ideas", { bullets: exps.map(e => e.title) }));
      }
      secs.push(sec("Safety", { bullets: ["Ask a parent or teacher before you start.", "Never taste or smell the materials.", "Wash your hands when you finish.", "Clean up and put everything away."] }));
      return { kind: "experiment", title: "Experiment: " + (known ? known.title : cap(topic)), topic, sections: secs, links: known ? [known.link] : [], grounded: !!known };
    }

    function buildBusiness(topic, who) {
      const ex = T().business.example || {}, cost = ex.cost || 0.1, price = ex.price || 0.25, made = ex.made || 40, sold = ex.sold || 32;
      const m = n => "$" + (Math.round(n * 100) / 100).toFixed(2);
      const spent = cost * made, income = price * sold, profit = income - spent, per = price - cost;
      const item = topic || "my product";
      const secs = [sec("My business idea", { write: [`I will sell: ${item}`, "Why people want it: ______", "My customers are: ______"] }),
        sec("What it costs me", { text: ["List everything you must buy to make or get your product."], table: { cols: ["Item", "How many", "Cost each", "Total"], rows: [["", "", "", ""], ["", "", "", ""], ["", "", "", ""], ["Total cost", "", "", ""]] } }),
        sec("My price", { text: ["Selling price must be MORE than the cost of making one, or you lose money.", "Profit for one item = selling price - cost of one item.", "Total profit = money earned - money spent."], write: ["Cost of one: ______   Selling price: ______   Profit on one: ______"] }),
        sec(`Worked example (not yours, just to practise): ${ex.item || "mandazi"}`, { table: { cols: ["", "Working", "Answer"], rows: [["Money spent", `${made} made × ${m(cost)}`, m(spent)], ["Money earned", `${sold} sold × ${m(price)}`, m(income)], ["Profit", `${m(income)} - ${m(spent)}`, m(profit)], ["Profit per item", `${m(price)} - ${m(cost)}`, m(per)]] } , text: [profit >= 0 ? `The business made a profit of ${m(profit)}. ${made - sold} items were not sold, so the real profit could be even higher if they sell later.` : `This business made a loss.`] }),
        sec("My sales this week", { table: { cols: ["Day", "Made", "Sold", "Money earned"], rows: ["Mon", "Tue", "Wed", "Thu", "Fri"].map(d => [d, "", "", ""]) } }),
        sec("My savings plan", { text: ["Decide before you spend: for example save 20 cents of every dollar, keep some to buy new stock, and spend a little."], write: ["Save: ____ %   Buy new stock: ____ %   Spend: ____ %"] }),
        sec("Business tips", { bullets: T().business.tips || [] }),
        sec("Checklist", { check: ["I asked a parent or teacher for permission", "My price is higher than my cost", "I wrote down every sale", "I know my profit", "I have a savings plan"] })];
      return { kind: "business", title: "Business Plan: " + cap(item), topic, sections: secs, links: [["#/courses", "Financial Literacy course"]], grounded: false };
    }

    function buildAboutMe(topic, who) {
      const nm = Br.myName();
      const secs = [sec("All About Me", { text: [`By: ${nm || "____________"}`] })].concat(T().aboutme.sections.map(s => sec(s[0], { write: [s[1]] })));
      secs.push(sec("My picture", { text: ["Draw yourself here. Add your favourite colour around the frame."], box: true }));
      secs.push(sec("Privacy reminder", { text: ["Do not write your phone number, home address or passwords. Share this only with people you trust."] }));
      return { kind: "aboutme", title: "All About " + (nm || "Me"), topic: "me", sections: secs, links: [], grounded: false };
    }

    function buildWebsite(topic, who) {
      const g = gather(topic), title = cap(topic), nm = Br.myName() || "A Chiedza learner";
      const facts = (g.facts.length ? g.facts : ["Add your first fact here.", "Add your second fact here.", "Add your third fact here."]).slice(0, 5);
      const e = esc;
      const code = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${e(title)}</title>
<style>
  /* CSS: this part controls how the page LOOKS */
  body { font-family: Arial, sans-serif; margin: 0; background: #fffbe6; color: #222; }
  header { background: #006400; color: white; padding: 24px; text-align: center; border-bottom: 8px solid #ffd200; }
  main { max-width: 700px; margin: 20px auto; padding: 0 16px; }
  h2 { color: #c8102e; }
  li { margin-bottom: 8px; }
  button { background: #c8102e; color: white; border: 0; padding: 12px 20px; border-radius: 10px; font-size: 16px; cursor: pointer; }
  #fact { margin-top: 14px; font-weight: bold; color: #006400; }
  footer { text-align: center; padding: 20px; background: #222; color: white; margin-top: 30px; }
</style>
</head>
<body>
<header>
  <h1>${e(title)}</h1>
  <p>A website by ${e(nm)}</p>
</header>
<main>
  <h2>About ${e(topic)}</h2>
  <p>Write 2 sentences here about why you chose this topic.</p>
  <h2>Facts</h2>
  <ul>
${facts.map(f => "    <li>" + e(f) + "</li>").join("\n")}
  </ul>
  <h2>Try this!</h2>
  <button onclick="showFact()">Show me a random fact</button>
  <p id="fact"></p>
</main>
<footer>Made with Chiedza Learning · Created with ❤️ in Zimbabwe</footer>
<script>
  // JavaScript: this part makes the page DO things
  var facts = ${JSON.stringify(facts).replace(/</g, "\\u003c")};
  function showFact() {
    var n = Math.floor(Math.random() * facts.length);
    document.getElementById("fact").textContent = facts[n];
  }
</script>
</body>
</html>`;
      const secs = [sec("What you get", { text: ["A real web page with 3 parts: HTML (the content), CSS (the style) and JavaScript (the action)."] }),
        sec("How to use it", { numbered: ["Download the file (button below).", "Double-click it to open it in your browser.", "To edit, right-click the file and open it with Notepad (or a code editor).", "Change the words, save, then refresh the browser to see your change."] }),
        sec("Try changing", { bullets: ["Change the header colour #006400 to another colour.", "Add a new <li> fact.", "Write your 2 sentences under 'About'.", "Change the button text.", "Add a picture with <img src=\"mypicture.jpg\" width=\"300\">."] }),
        sec("Learn the parts", { table: { cols: ["Part", "Job"], rows: [["<html>…</html>", "The whole page"], ["<style>", "CSS: colours, sizes, fonts"], ["<h1>, <p>, <ul>", "Heading, paragraph, list"], ["<script>", "JavaScript: makes the button work"]] } })];
      return { kind: "website", title: "Website: " + title, topic, sections: secs, code, links: g.links, grounded: g.facts.length > 0, file: (title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "my-website") + ".html" };
    }

    const BUILD = { report: buildReport, poster: buildPoster, story: buildStory, experiment: buildExperiment, business: buildBusiness, aboutme: buildAboutMe, website: buildWebsite };

    /* ---------- rendering ---------- */
    function secHtml(s, doc) {
      let h = `<h3>${esc(s.h)}</h3>`;
      (s.text || []).forEach(t => h += `<p>${esc(t)}</p>`);
      if (s.bullets) h += "<ul>" + s.bullets.map(b => `<li>${esc(b)}</li>`).join("") + "</ul>";
      if (s.numbered) h += "<ol>" + s.numbered.map(b => `<li>${esc(b)}</li>`).join("") + "</ol>";
      if (s.check) h += "<ul class='chk'>" + s.check.map(b => `<li>☐ ${esc(b)}</li>`).join("") + "</ul>";
      if (s.table) h += "<table><tr>" + s.table.cols.map(c => `<th>${esc(c)}</th>`).join("") + "</tr>" + s.table.rows.map(r => "<tr>" + r.map(c => `<td>${esc(c) || "&nbsp;"}</td>`).join("") + "</tr>").join("") + "</table>";
      if (s.pre) h += `<pre>${esc(s.pre)}</pre>`;
      if (s.box) h += `<div class="box">Picture here</div>`;
      if (s.write) h += s.write.map(w => `<div class="yt"><span class="yt-tag">✍️ Your turn</span> ${esc(w)}${doc ? "<div class='line'></div>" : ""}</div>`).join("");
      return h;
    }
    const css = `body{font-family:Arial,Helvetica,sans-serif;max-width:800px;margin:0 auto;padding:24px;color:#1b1b1b;line-height:1.5}
.top{border-bottom:8px solid #ffd200;background:#006400;color:#fff;padding:18px 22px;border-radius:12px;margin-bottom:18px}.top h1{margin:0;font-size:28px}.top small{opacity:.9}
h3{color:#c8102e;margin:22px 0 6px;border-bottom:2px solid #eee;padding-bottom:4px}table{border-collapse:collapse;width:100%;margin:8px 0}th,td{border:1px solid #999;padding:8px;text-align:left;min-width:60px}th{background:#f2f2f2}
.yt{margin:10px 0;background:#fffbe6;border-left:5px solid #ffd200;padding:8px 10px;border-radius:6px}.yt-tag{font-size:12px;font-weight:bold;color:#006400;display:block}.line{border-bottom:1px solid #777;height:26px}
.box{border:3px dashed #999;height:200px;display:flex;align-items:center;justify-content:center;color:#999;border-radius:10px}pre{background:#f6f6f6;padding:10px;border-radius:8px;overflow:auto}.chk{list-style:none;padding-left:4px}
.foot{margin-top:30px;font-size:12px;color:#666;text-align:center;border-top:1px solid #ddd;padding-top:10px}@media print{body{padding:0}.top{-webkit-print-color-adjust:exact;print-color-adjust:exact}}`;
    function docHtml(p) {
      const nm = Br.myName();
      return `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><title>${esc(p.title)}</title><style>${css}</style></head><body><div class="top"><small>💡 Chiedza Learning</small><h1>${esc(p.title)}</h1><small>${nm ? "By " + esc(nm) + " · " : ""}${Br.today()}</small></div>${p.sections.map(s => secHtml(s, true)).join("")}<div class="foot">A guided project draft from Chiedza AI. The ✍️ parts are for YOU to write in your own words. Created by Ntandomods.</div></body></html>`;
    }
    function projText(p) {
      const L = [p.title.toUpperCase(), "=".repeat(Math.min(60, p.title.length)), ""];
      p.sections.forEach(s => {
        L.push(s.h.toUpperCase());
        (s.text || []).forEach(t => L.push(t)); (s.bullets || []).forEach(b => L.push("- " + b)); (s.numbered || []).forEach((b, i) => L.push(`${i + 1}. ${b}`)); (s.check || []).forEach(b => L.push("[ ] " + b));
        if (s.table) { L.push(s.table.cols.join(" | ")); s.table.rows.forEach(r => L.push(r.join(" | "))); }
        if (s.pre) L.push(s.pre); if (s.box) L.push("[ picture here ]");
        (s.write || []).forEach(w => L.push("(Your turn) " + w)); L.push("");
      });
      L.push("Chiedza Learning by Ntandomods"); return L.join("\n");
    }
    function chatHtml(p, id) {
      const kind = T().kinds[p.kind] || {};
      const outline = p.sections.map(s => esc(s.h)).join(" · ");
      const note = p.kind === "experiment" ? (p.grounded ? "This is a ready-to-run experiment idea from the brain. Always do it with an adult." : "I do not have a ready-made experiment for this topic, so I gave you a fair-test frame to fill in.") : p.grounded ? "I used real facts from Chiedza lessons." : (p.kind === "report" || p.kind === "poster" ? "I have no lesson on this topic yet, so I gave you a research frame instead of making up facts." : "");
      const prev = p.sections.slice(0, 3).map(s => secHtml(s, false)).join("") + (p.sections.length > 3 ? `<p><em>… and ${p.sections.length - 3} more sections in the download.</em></p>` : "");
      const dl = p.kind === "website" ? `<button class="cai-act" data-brain-act="pdl" data-id="${id}">⬇ Download website</button>` : `<button class="cai-act" data-brain-act="pdl" data-id="${id}">⬇ Download</button><button class="cai-act" data-brain-act="pprint" data-id="${id}">🖨️ Print</button>`;
      const code = p.code ? `<details><summary>👀 See the code</summary><pre class="cai-code">${esc(p.code)}</pre></details>` : "";
      return `${kind.emoji || "🗂️"} <strong>${esc(p.title)}</strong><br><small>${esc(kind.name || "Project")} · ${p.sections.length} sections</small><br><small>${outline}</small><br><br>` +
        `✍️ I wrote the structure${p.grounded ? " and facts" : ""}. The <strong>"Your turn"</strong> parts are for you, so you learn and it is truly yours. ${note ? `<br><small>${esc(note)}</small>` : ""}` +
        `<br><br><div class="cai-btnrow">${dl}<button class="cai-act" data-brain-act="pcopy" data-id="${id}">📋 Copy</button></div>${code}<details><summary>📄 Preview</summary><div class="cai-prev">${prev}</div></details>`;
    }

    /* ---------- saved projects ---------- */
    function save(p) {
      const m = Br.mem(); const id = "p" + Date.now().toString(36);
      m.projects = (m.projects || []).concat([{ id, at: Br.today(), p }]).slice(-8); Br.saveMem(m); return id;
    }
    const find = id => (Br.mem().projects || []).find(x => x.id === id);
    Br.actions.pdl = b => { const x = find(b.dataset.id); if (!x) return; const slug = (x.p.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "project"); if (x.p.code) Br.fileDownload(x.p.file || slug + ".html", "text/html", x.p.code); else Br.fileDownload("chiedza-" + slug + ".html", "text/html", docHtml(x.p)); b.textContent = "✅ Downloaded"; };
    Br.actions.pprint = b => { const x = find(b.dataset.id); if (x) Br.printHtml(docHtml(x.p)); };
    Br.actions.pcopy = b => { const x = find(b.dataset.id); if (!x) return; const txt = x.p.code || projText(x.p); (navigator.clipboard ? navigator.clipboard.writeText(txt) : Promise.reject()).then(() => { b.textContent = "✅ Copied"; }).catch(() => { b.textContent = "Copy failed"; }); };
    Br.actions.popen = b => { const x = find(b.dataset.id); if (x && Br.say) Br.say(chatHtml(x.p, x.id)); };

    /* ---------- the handler ---------- */
    function make(kind, topic) {
      const nm = Br.myName(); let p;
      try { p = BUILD[kind](topic, nm); } catch (e) { console.warn(e); return { html: "Oops, I could not build that project. Try again with a topic, like <em>write a project on Victoria Falls</em>." }; }
      const id = save(p);
      return { html: chatHtml(p, id), links: p.links.slice(0, 3), chips: (kind === "report" ? ["Make a poster about " + topic] : kind === "poster" ? ["Write a project on " + topic] : ["Project ideas"]).concat(["Show my projects", "Quiz me"]) };
    }
    Br.register({
      name: "projects",
      handle(input) {
        const s = input.trim(), low = s.toLowerCase();
        if (/\b(my projects|show (me )?my projects|saved projects|list (my )?projects|open my project)\b/.test(low)) {
          const list = (Br.mem().projects || []).slice().reverse();
          if (!list.length) return { html: "You have no saved projects yet. Say <em>write a project on Victoria Falls</em> to start one! 🗂️" };
          return { html: `🗂️ <strong>Your projects</strong> <small>(saved on this device)</small><br>` + list.map(x => `${esc(x.p.title)} <small>${esc(x.at)}</small> <button class="cai-act" data-brain-act="popen" data-id="${x.id}">Open</button>`).join("<br>"), chips: ["Write a project on Zimbabwe"] };
        }
        if (/\b(project ideas?|ideas? for (a )?project|what project)\b/.test(low)) {
          return { html: "🗂️ <strong>Project ideas</strong> by type:<br>📄 Report: <em>Victoria Falls, Great Zimbabwe, the water cycle, hunhu/ubuntu</em><br>🔬 Experiment: <em>plants and light, evaporation, floating and sinking</em><br>💰 Business: <em>a tuckshop selling mandazi</em><br>📖 Story: <em>a hare and a baobab</em><br>💻 Website: <em>my school, my village</em><br>🙋 About me", chips: ["Write a project on Victoria Falls", "Plan a science experiment on plants", "Plan a tuckshop business", "Create a website about my school"] };
        }
        if (/\b(report card|summary for|progress note)\b/.test(low) || /\b(parent|teacher|guardian)\b.*\b(summary|report)\b/.test(low)) return null;
        const direct = /\b(project|poster|report|assignment|experiment|investigation|business plan|website|web page|webpage)\b.*\b(on|about|for)\s+\S+/.test(low) || /\ball about me\b/.test(low);
        if (!((NOUN.test(low) && VERB.test(low)) || direct)) return null;
        if (/\b(what is|what's|define|meaning of|who is)\b/.test(low) && !/\b(write|make|create|build|plan|prepare|draft)\b/.test(low)) return null;
        if (/\b(tell me|read me)\b.*\bstory\b/.test(low)) return null;
        const kind = detectKind(low), topic = extractTopic(s, kind);
        if (!topic && kind !== "aboutme") {
          Br.setPending({ freeText: true, handle(inp) { const t = inp.replace(/^(it'?s |it is |about |on |a |an |the )+/i, "").replace(/[?!.]+$/, "").trim(); if (!t || t.length > 70 || /^(no|cancel|never mind|stop)$/i.test(t)) return t ? { html: "Okay, cancelled. 😊" } : null; return make(kind, t); } });
          const k = T().kinds[kind] || {};
          return { html: `${k.emoji || "🗂️"} Great, let's plan your <strong>${esc((k.name || "project").toLowerCase())}</strong>! What is it about? (For example: <em>${kind === "business" ? "mandazi, airtime stickers, fruit" : kind === "website" ? "my school, my village, my favourite animals" : kind === "experiment" ? "plants and light, evaporation" : "Victoria Falls, water, Great Zimbabwe"}</em>)` };
        }
        return make(kind, topic);
      }
    });
  }
  if (window.ChiedzaBrain) window.ChiedzaBrain.ready.then(init);
})();
