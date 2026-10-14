/* ============================================================
   CHIEDZA AI — the friendly learning helper
   Works fully offline in the browser: it reads every lesson,
   quiz, course and platform fact in Chiedza Learning and answers
   from them. Created by Ntandomods.
   ============================================================ */
(function () {
  "use strict";

  const STOP = new Set("a an the is are was were am be to of in on at for and or but with what whats who how why when where which do does did can could would should i me my we you your it its this that these those about tell please explain give show want need some any more from as by us our".split(" "));
  const stem = w => w.replace(/(ing|ed|es|s)$/i, m => (w.length > 4 ? "" : m));
  const tokens = s => (s || "").toLowerCase().replace(/<[^>]+>/g, " ").replace(/[^a-z0-9' ]+/g, " ").split(/\s+/).filter(w => w && !STOP.has(w)).map(stem);
  const plain = h => (h || "").replace(/<[^>]+>/g, " ").replace(/&nbsp;/g, " ").replace(/\s+/g, " ").trim();
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const sentences = t => (t.match(/[^.!?]+[.!?]+/g) || [t]).map(x => x.trim()).filter(Boolean);

  /* ---------- Knowledge: platform facts ---------- */
  const FAQ = [
    { k: "what is chiedza learning about platform app website free", a: "Chiedza Learning is a <strong>free learning platform for Zimbabwean children</strong>, from <strong>ECD to O-Level</strong>. It has lessons, quizzes, games, free courses, badges and printable certificates, all built around Zimbabwe's curriculum and culture.", links: [["#/about", "About Chiedza"]] },
    { k: "who made created built founder owner ntandomods creator", a: "Chiedza Learning was created with ❤️ by <strong>Ntandomods</strong>.", links: [["#/about", "About us"]] },
    { k: "what does chiedza mean name meaning", a: "<strong>Chiedza</strong> is a Shona word that means <strong>light</strong>. Our tagline is <em>Lighting every child's future</em>.", links: [] },
    { k: "levels ecd infant junior olevel o-level grades ages", a: "There are 4 levels:<br>🧸 <strong>ECD</strong> (ages 3 to 5)<br>📗 <strong>Infant</strong> (Grades 1 to 2)<br>📘 <strong>Junior</strong> (Grades 3 to 7)<br>🎓 <strong>O-Level</strong> (Forms 1 to 4)", links: [["#/level/ecd", "ECD"], ["#/level/infant", "Infant"], ["#/level/junior", "Junior"], ["#/level/olevel", "O-Level"]] },
    { k: "certificate certificates get earn download print how", a: "To earn a <strong>certificate</strong>: open a <strong>Free Course</strong>, read all modules, then take the assessment. Score <strong>70% or more</strong> and your certificate is issued with a unique Certificate ID, verification code and QR code. You can print it.", links: [["#/courses", "Free Courses"]] },
    { k: "verify verification certificate check authentic real qr code id", a: "Every certificate follows the <strong>Chiedza Open Verification Standard</strong>. Anyone (schools, employers, NGOs) can scan the QR code or enter the Certificate ID on the verification page to check that it is real.", links: [["#/verify", "Verify a certificate"]] },
    { k: "pass mark passing score percent assessment exam", a: "Course assessments need <strong>70%</strong> to pass. Lesson quizzes show a passing message from <strong>60%</strong>. If you do not pass, review the lessons and try again!", links: [] },
    { k: "games play memory math blitz", a: "We have two games: 🧠 <strong>Memory Match</strong> (flip cards and match pairs) and ⚡ <strong>Math Blitz</strong> (answer maths questions fast). Winning games earns the <strong>Game Master</strong> badge.", links: [["#/games", "Play games"]] },
    { k: "badges badge rewards stars points earn earned achievement collect", a: "You earn <strong>badges</strong> by learning: First Step, Quiz Whiz, Perfect Score, Explorer, Course Graduate, Certified, Game Master, On Fire (3-day streak), Shona Star, Science Ace and Sign Friend 🤟. Points come from lessons, quizzes, courses, games and badges.", links: [["#/progress", "My progress"]] },
    { k: "leaderboard rank ranking top learners", a: "The <strong>Leaderboard</strong> shows top learners by stars. Keep learning to climb up!", links: [["#/leaderboard", "Leaderboard"]] },
    { k: "report card progress parent teacher", a: "Your <strong>Report Card</strong> summarises lessons done, quiz scores, courses and badges. It is print-friendly, so parents and teachers can see your progress.", links: [["#/report", "Report card"], ["#/progress", "My progress"]] },
    { k: "save data progress saved privacy browser account login sign up", a: "No account is needed. Your progress is <strong>saved in your own browser</strong>. If you clear your browser data or switch device, the progress will not follow you.", links: [] },
    { k: "free cost price pay money", a: "Chiedza Learning is <strong>completely free</strong> for learners.", links: [] },
    { k: "offline internet data work without", a: "The app is light and runs in your browser. Once the page is open, lessons and quizzes work from the app itself. A connection is needed to load it the first time.", links: [] },
    { k: "languages shona ndebele english language", a: "We teach in English with <strong>Shona</strong> and <strong>Ndebele</strong> lessons at ECD, Infant and Junior levels, and the Hunhu/Ubuntu values of our culture.", links: [["#/subject/junior/jun-shona", "Junior Shona"], ["#/subject/junior/jun-ndebele", "Junior Ndebele"]] },
    { k: "sign language deaf zsl zimbabwean sign hearing impaired", a: "🤟 <strong>Sign language</strong> is taught at every early level: <em>Hands That Talk</em> (ECD), <em>Meet ZSL</em> (Infant) and <em>Sign Language & Deaf Culture</em> (Junior), plus a free course with a certificate. We teach what ZSL is, fingerspelling, Deaf etiquette, interpreters and inclusion. <strong>Important:</strong> real signs differ by country and region, so learn the actual ZSL signs from a Deaf signer or ZSL teacher.", links: [["#/subject/ecd/ecd-sign", "ECD sign"], ["#/subject/infant/inf-sign", "Infant sign"], ["#/subject/junior/jun-sign", "Junior sign"], ["#/course/course-sign", "Sign course"]] },
    { k: "courses free course list modules", a: "Free courses include Digital Literacy, Coding Basics, Financial Literacy, Zimbabwe Heritage, Environmental Conservation, Health & Hygiene Heroes, Study Skills, Creative Arts and <strong>Sign Language & Deaf Awareness</strong>.", links: [["#/courses", "All courses"]] },
    { k: "deploy render host hosting server api developer github", a: "For developers: the app is a Node/Express server plus a static front end in <code>public/</code>. It is ready to deploy on <strong>Render</strong> using <code>render.yaml</code> (build <code>npm install</code>, start <code>npm start</code>, health check <code>/api/health</code>). The API has endpoints for health, assessments, certificates and open verification.", links: [] },
    { k: "help what can you do features ask", a: "I can <strong>explain lessons</strong>, <strong>quiz you</strong>, find a subject or course, explain how certificates, badges and games work, and show your progress. Try: <em>\"Quiz me on Shona\"</em> or <em>\"Explain fingerspelling\"</em>.", links: [] }
  ];

  const DAY_FUN = ["Did you know? A giraffe's tongue is about 50 cm long!", "Fun fact: Great Zimbabwe means 'house of stone'.", "Fun fact: Victoria Falls is called Mosi-oa-Tunya, 'the smoke that thunders'.", "Fun fact: Zimbabwe's national bird is the Zimbabwe Bird, found carved at Great Zimbabwe.", "Fun fact: The mbira is played with the thumbs."];

  /* ---------- Index all curriculum content ---------- */
  let DOCS = [], QA = [], DF = {}, built = false;
  function build() {
    if (built || typeof LEVELS === "undefined") return;
    built = true;
    LEVELS.forEach(lv => lv.subjects.forEach(s => s.lessons.forEach((l, i) => {
      const text = plain(l.body);
      DOCS.push({ type: "lesson", title: l.title, level: lv.name, levelId: lv.id, subject: s.name, text, fact: l.keyFact || "", emoji: l.emoji, link: `#/lesson/${lv.id}/${s.id}/${i}`, topic: `${lv.name} ${s.name}`, tok: tokens(`${l.title} ${l.title} ${s.name} ${lv.name} ${l.kicker} ${text} ${l.keyFact}`) });
      (l.quiz || []).forEach(x => QA.push({ q: x.q, a: x.options[x.answer], tok: tokens(x.q + " " + x.options[x.answer]), link: `#/lesson/${lv.id}/${s.id}/${i}`, title: l.title, topic: `${lv.name} ${s.name}`, quiz: x }));
    })));
    COURSES.forEach(c => c.modules.forEach((m, i) => {
      const text = plain(m.body);
      DOCS.push({ type: "course", title: m.title, level: "Free course", subject: c.title, text, fact: "", emoji: m.emoji, link: `#/course/${c.id}`, topic: c.title, tok: tokens(`${m.title} ${m.title} ${c.title} ${text}`) });
    }));
    DOCS.forEach(d => new Set(d.tok).forEach(t => DF[t] = (DF[t] || 0) + 1));
  }
  const idf = t => Math.log(1 + DOCS.length / (1 + (DF[t] || 0)));
  function score(qt, d) {
    let s = 0; const bag = {}; d.tok.forEach(t => bag[t] = (bag[t] || 0) + 1);
    qt.forEach(t => { if (bag[t]) s += idf(t) * (1 + Math.log(bag[t])); });
    const title = d.title.toLowerCase();
    qt.forEach(t => { if (title.includes(t)) s += 2 * idf(t); });
    return s;
  }
  function search(query, n = 3) {
    build();
    const qt = tokens(query); if (!qt.length) return [];
    return DOCS.map(d => ({ d, s: score(qt, d) })).filter(x => x.s > 0).sort((a, b) => b.s - a.s).slice(0, n);
  }
  function bestSentences(text, qt, n = 2) {
    return sentences(text).map(s => ({ s, v: tokens(s).filter(t => qt.includes(t)).length })).sort((a, b) => b.v - a.v).slice(0, n)
      .sort((a, b) => text.indexOf(a.s) - text.indexOf(b.s)).map(x => x.s).join(" ");
  }
  function searchQA(query) {
    const qt = tokens(query); if (qt.length < 1) return null;
    let best = null, bs = 0;
    QA.forEach(x => { const ov = x.tok.filter(t => qt.includes(t)).length; const sc = ov / Math.max(qt.length, 1); if (ov >= 2 && sc > bs) { bs = sc; best = x; } });
    return bs >= 0.6 ? best : null;
  }

  /* ---------- Quiz mode ---------- */
  let activeQuiz = null;
  function startQuiz(topic) {
    build();
    let pool = QA;
    if (topic) {
      const qt = tokens(topic);
      const f = QA.filter(x => qt.some(t => tokens(x.topic + " " + x.title).includes(t)));
      if (f.length >= 3) pool = f;
    }
    const picks = pool.slice().sort(() => Math.random() - 0.5).slice(0, 3);
    activeQuiz = { items: picks, i: 0, score: 0 };
    return askNext();
  }
  function askNext() {
    const qz = activeQuiz, it = qz.items[qz.i];
    const opts = it.quiz.options.map((o, i) => `<button class="cai-opt" data-quiz="${i}">${String.fromCharCode(65 + i)}. ${esc(o)}</button>`).join("");
    return { html: `<strong>Question ${qz.i + 1} of ${qz.items.length}</strong><br>${esc(it.q)}<div class="cai-opts">${opts}</div>`, quiz: true };
  }
  function answerQuiz(i) {
    const qz = activeQuiz; if (!qz) return null;
    const it = qz.items[qz.i], ok = i === it.quiz.answer;
    if (ok) qz.score++;
    let html = ok ? "✅ <strong>Correct!</strong> Well done!" : `❌ Not quite. The answer is <strong>${esc(it.a)}</strong>.`;
    qz.i++;
    if (qz.i >= qz.items.length) {
      html += `<br><br>🎉 You got <strong>${qz.score} out of ${qz.items.length}</strong>. ${qz.score === qz.items.length ? "Perfect, superstar!" : "Keep practising!"}`;
      activeQuiz = null;
      return { html, chips: ["Quiz me again", "Explain something"] };
    }
    return { html, next: askNext() };
  }

  /* ---------- Answering ---------- */
  const rx = r => r.test(lastInput);
  let lastInput = "";
  function myProgress() {
    if (typeof state === "undefined") return null;
    const lessons = Object.keys(state.completedLessons || {}).length;
    const badges = Object.keys(state.badges || {}).length;
    const courses = Object.values(state.coursesProgress || {}).filter(c => c && c.passed).length;
    const name = (state.profile && state.profile.name) || "friend";
    return `📊 Hi <strong>${esc(name)}</strong>! You have finished <strong>${lessons}</strong> lesson${lessons === 1 ? "" : "s"}, earned <strong>${badges}</strong> badge${badges === 1 ? "" : "s"} and completed <strong>${courses}</strong> course${courses === 1 ? "" : "s"}. Keep going!`;
  }
  function linkHtml(links) { return links && links.length ? `<div class="cai-links">${links.map(l => `<a href="${l[0]}" class="cai-link">${esc(l[1])} →</a>`).join("")}</div>` : ""; }

  function respond(input) {
    build(); lastInput = input.trim().toLowerCase();
    if (!lastInput) return { html: "Type a question and I will help! 😊" };
    if (activeQuiz) { activeQuiz = null; }
    if (rx(/^(hi|hello|hey|mhoro|mhoroi|sawubona|salibonani|good (morning|afternoon|evening))\b/)) {
      const nm = (typeof state !== "undefined" && state.profile && state.profile.name) || "";
      return { html: `Mhoro${nm ? ", " + esc(nm) : ""}! 👋 I am <strong>Chiedza AI</strong>, your learning helper. Ask me about any lesson, or say <em>"Quiz me"</em>!`, chips: ["Quiz me", "Teach me sign language", "How do I get a certificate?"] };
    }
    if (rx(/^(thanks|thank you|ndatenda|ngiyabonga)/)) return { html: "You are welcome! 😊 Keep shining. <em>Ndatenda / Ngiyabonga</em> for learning with me!" };
    if (rx(/\b(who are you|your name|are you (a )?(robot|ai|real)|what are you)\b/)) return { html: "I am <strong>Chiedza AI</strong> 💡, the learning helper of Chiedza Learning. I read all the lessons, quizzes and courses on this platform and answer from them. I am a program, not a person, and I can make mistakes, so check important things with your teacher." };
    if (rx(/\b(quiz me|test me|ask me a question|practice|practise)\b/)) {
      const topic = lastInput.replace(/.*\b(on|about|in|for)\b/, "").trim();
      return startQuiz(topic === lastInput ? "" : topic);
    }
    if (rx(/\b(my progress|my badges|my stars|how am i doing|my score)\b/)) return { html: myProgress() || "Open the Progress page to see your results.", links: [["#/progress", "My progress"], ["#/report", "Report card"]] };
    if (rx(/\b(fun fact|tell me something|random fact|surprise)\b/)) return { html: "💡 " + DAY_FUN[Math.floor(Math.random() * DAY_FUN.length)] };
    if (rx(/\b(joke)\b/)) return { html: "😄 Why did the mbira player bring a pencil? Because he wanted to draw a good tune!" };

    // quiz-answer lookup for direct factual questions ("what is gumi")
    const qa = searchQA(input);
    const faqHit = FAQ.map(f => ({ f, s: tokens(f.k).filter(t => tokens(input).includes(t)).length })).sort((a, b) => b.s - a.s)[0];
    const hits = search(input, 3);

    const titleHit = hits.length && tokens(hits[0].d.title).filter(t => tokens(input).includes(t)).length >= 2;
    if (qa && (!hits.length || hits[0].s < 6) && !(faqHit && faqHit.s >= 2)) {
      return { html: `${esc(qa.a)}<br><small>From the lesson “${esc(qa.title)}”.</small>`, links: [[qa.link, "Open lesson"]] };
    }
    if (faqHit && faqHit.s >= 2 && !titleHit) return { html: faqHit.f.a, links: faqHit.f.links };
    if (faqHit && faqHit.s >= 1 && (!hits.length || hits[0].s < 5)) return { html: faqHit.f.a, links: faqHit.f.links };
    if (hits.length && hits[0].s >= 3) {
      const top = hits[0].d, qt = tokens(input);
      const snippet = bestSentences(top.text, qt, 2);
      const more = hits.slice(1).filter(h => h.s >= hits[0].s * 0.45).map(h => [h.d.link, `${h.d.emoji} ${h.d.title}`]);
      return { html: `${top.emoji} <strong>${esc(top.title)}</strong> <small>(${esc(top.level)} · ${esc(top.subject)})</small><br>${esc(snippet)}${top.fact ? `<br><br>💡 <strong>Key fact:</strong> ${esc(top.fact)}` : ""}`, links: [[top.link, "Open this lesson"]].concat(more), chips: ["Quiz me on " + top.subject] };
    }
    if (faqHit && faqHit.s >= 1) return { html: faqHit.f.a, links: faqHit.f.links };
    return { html: "Hmm, I could not find that in Chiedza Learning yet. 🤔 Try asking about a subject (like <em>Shona greetings</em> or <em>fractions</em>), or say <em>\"Quiz me\"</em>.", chips: ["Quiz me", "What can you do?", "Teach me sign language"] };
  }

  /* ---------- UI ---------- */
  function mount() {
    if (document.getElementById("caiRoot")) return;
    const root = document.createElement("div"); root.id = "caiRoot";
    root.innerHTML = `
      <button id="caiLauncher" aria-label="Open Chiedza AI" title="Ask Chiedza AI"><img src="assets/icon.png" alt="" onerror="this.replaceWith(document.createTextNode('💡'))"><span>Ask Chiedza AI</span></button>
      <section id="caiPanel" role="dialog" aria-label="Chiedza AI chat" hidden>
        <header><div class="cai-title"><span class="cai-dot"></span><div><strong>Chiedza AI</strong><small>Your learning helper</small></div></div>
          <div class="cai-actions"><button id="caiSpeak" title="Read answers aloud" aria-pressed="false">🔈</button><button id="caiClose" aria-label="Close">✕</button></div></header>
        <div id="caiMsgs" aria-live="polite"></div>
        <div id="caiChips"></div>
        <form id="caiForm" autocomplete="off"><input id="caiInput" type="text" placeholder="Ask me anything about your lessons…" maxlength="200" /><button type="submit" aria-label="Send">➤</button></form>
        <div class="cai-foot">Chiedza AI answers from the lessons on this site. It can make mistakes.</div>
      </section>`;
    document.body.appendChild(root);
    const $ = id => document.getElementById(id);
    const msgs = $("caiMsgs"), panel = $("caiPanel"), input = $("caiInput");
    let speak = false;

    const say = (html, who) => { const d = document.createElement("div"); d.className = "cai-msg " + who; d.innerHTML = html; msgs.appendChild(d); msgs.scrollTop = msgs.scrollHeight; return d; };
    const chips = list => { $("caiChips").innerHTML = (list || []).map(c => `<button class="cai-chip">${esc(c)}</button>`).join(""); };
    const talk = html => { if (!speak || !window.speechSynthesis) return; const u = new SpeechSynthesisUtterance(plain(html)); u.rate = 0.95; speechSynthesis.cancel(); speechSynthesis.speak(u); };
    const show = r => {
      say(r.html + linkHtml(r.links), "bot"); talk(r.html);
      if (r.next) setTimeout(() => say(r.next.html, "bot"), 500);
      chips(r.chips || (r.quiz || r.next ? [] : ["Quiz me", "Fun fact"]));
    };
    const ask = text => { say(esc(text), "me"); setTimeout(() => show(respond(text)), 250); };

    function open() {
      panel.hidden = false; $("caiLauncher").classList.add("hide"); input.focus();
      if (!msgs.children.length) show({ html: "Mhoro! 👋 I am <strong>Chiedza AI</strong>. I know all the lessons, courses, games, certificates and even sign language on this platform. What would you like to learn today?", chips: ["Quiz me", "Teach me sign language", "How do I get a certificate?", "Tell me a fun fact"] });
    }
    $("caiLauncher").onclick = open;
    $("caiClose").onclick = () => { panel.hidden = true; $("caiLauncher").classList.remove("hide"); if (window.speechSynthesis) speechSynthesis.cancel(); };
    $("caiSpeak").onclick = e => { speak = !speak; e.currentTarget.textContent = speak ? "🔊" : "🔈"; e.currentTarget.setAttribute("aria-pressed", speak); if (!speak && window.speechSynthesis) speechSynthesis.cancel(); };
    $("caiForm").onsubmit = e => { e.preventDefault(); const v = input.value.trim(); if (!v) return; input.value = ""; ask(v); };
    $("caiChips").onclick = e => { const b = e.target.closest(".cai-chip"); if (b) ask(b.textContent); };
    msgs.onclick = e => {
      const o = e.target.closest("[data-quiz]");
      if (o) {
        msgs.querySelectorAll("[data-quiz]").forEach(b => b.disabled = true);
        say(esc(o.textContent), "me");
        const r = answerQuiz(Number(o.dataset.quiz));
        if (r) { say(r.html + linkHtml(r.links), "bot"); talk(r.html); if (r.next) setTimeout(() => say(r.next.html, "bot"), 700); chips(r.chips || []); }
        return;
      }
      if (e.target.closest(".cai-link") && window.innerWidth < 700) { panel.hidden = true; $("caiLauncher").classList.remove("hide"); }
    };
  }

  window.ChiedzaAI = { respond, search };
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", mount); else mount();
})();
