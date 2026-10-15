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
    { k: "help what can you do features ask", a: "I can <strong>explain lessons</strong>, <strong>quiz you</strong>, <strong>send pictures</strong> (try <em>\"show me a picture of hand washing\"</em>), find a subject or course, explain how certificates, badges and games work, and show your progress. Try: <em>\"Quiz me on Shona\"</em> or <em>\"Explain fingerspelling\"</em>.", links: [] }
  ];

  const DAY_FUN = ["Did you know? A giraffe's tongue is about 50 cm long!", "Fun fact: Great Zimbabwe means 'house of stone'.", "Fun fact: Victoria Falls is called Mosi-oa-Tunya, 'the smoke that thunders'.", "Fun fact: Zimbabwe's national bird is the Zimbabwe Bird, found carved at Great Zimbabwe.", "Fun fact: The mbira is played with the thumbs."];


  /* ---------- Picture library (all carry the Chiedza Learning x Ntandomods logo band) ---------- */
  const IMAGES = [
    { src: "deaf-hands", cap: "Deaf people talk with their hands, faces and bodies. (Illustration - real ZSL signs must be learned from a Deaf signer.)", k: "sign language deaf hands talk zsl communicate signing", g: "sign" },
    { src: "attention-wave", cap: "Get a Deaf friend's attention with a clear wave where they can see you.", k: "attention wave deaf friend get manners etiquette hello", g: "sign" },
    { src: "attention-tap", cap: "A gentle tap on the shoulder is a kind way to get attention.", k: "attention tap shoulder deaf friend get manners etiquette touch", g: "sign" },
    { src: "eye-contact", cap: "Face the person and keep eye contact when you talk with a Deaf friend.", k: "eye contact face deaf etiquette manners look talk", g: "sign" },
    { src: "faces", cap: "Faces show feelings - happy, sad, surprised and sleepy. In sign language the face is part of the grammar.", k: "face faces feelings expression emotions happy sad surprised sleepy facial", g: "sign" },
    { src: "interpreter", cap: "With an interpreter, speak to the Deaf person, not the interpreter.", k: "interpreter interpret translate deaf assembly speak", g: "sign" },
    { src: "inclusive-class", cap: "An inclusive classroom: the teacher faces the class, there is good light and the Deaf pupil can see the interpreter.", k: "inclusive inclusion classroom school deaf include everyone interpreter", g: "sign" },
    { src: "senses", cap: "The five senses: sight, hearing, smell, taste and touch.", k: "senses sense five sight hearing smell taste touch body", g: "learn" },
    { src: "instruments", cap: "Traditional instruments: the hosho (rattles), the mbira (thumb piano) and the ngoma (drum).", k: "instruments instrument mbira hosho ngoma drum music rattle", g: "learn" },
    { src: "handwash", cap: "Wash your hands with soap and clean water to stop germs.", k: "hand hands wash washing soap germs clean hygiene health", g: "learn" },
    { src: "shapes", cap: "Basic shapes: circle, square, triangle, rectangle and star.", k: "shape shapes circle square triangle rectangle star rainbow colours colors", g: "learn" }
  ];
  IMAGES.forEach(i => { i.t = tokens(i.k); i.url = "assets/learn/" + i.src + ".jpg"; });
  function pickImages(text, explicit, ctx) {
    const qt = tokens(text), ct = tokens(ctx || "");
    const scored = IMAGES.map(i => ({ i, s: i.t.filter(t => qt.includes(t)).length * 3 + i.t.filter(t => ct.includes(t)).length })).filter(x => x.s >= (explicit ? 1 : 4)).sort((a, b) => b.s - a.s);
    if (!scored.length) return [];
    const wantsAll = explicit && /\b(pictures|images|photos|all|more)\b/i.test(text);
    if (!wantsAll) return [scored[0].i];
    const grp = scored[0].i.g, out = scored.slice(0, 4).map(x => x.i);
    IMAGES.filter(i => i.g === grp && !out.includes(i)).forEach(i => { if (out.length < 4) out.push(i); });
    return out;
  }

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
    if (!ok && window.ChiedzaBrain) ChiedzaBrain.noteMiss(it.topic || it.subject || it.title);
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

  function respondCore(input) {
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
      return { html: `${top.emoji} <strong>${esc(top.title)}</strong> <small>(${esc(top.level)} · ${esc(top.subject)})</small><br>${esc(snippet)}${top.fact ? `<br><br>💡 <strong>Key fact:</strong> ${esc(top.fact)}` : ""}`, links: [[top.link, "Open this lesson"]].concat(more), chips: ["Quiz me on " + top.subject], weak: hits[0].s < 8 };
    }
    if (faqHit && faqHit.s >= 1) return { html: faqHit.f.a, links: faqHit.f.links };
    return { html: "Hmm, I could not find that in Chiedza Learning yet. 🤔 Try asking about a subject (like <em>Shona greetings</em> or <em>fractions</em>), or say <em>\"Quiz me\"</em>.", chips: ["Quiz me", "What can you do?", "Teach me sign language"], miss: true };
  }


  const WEB_RX = /\b(search (the )?(web|internet|online)|(look|find)( it| this| that)? up online|google|on the internet|search for|latest news|news about|breaking news)\b/i;
  const PIC_RX = /\b(picture|pictures|image|images|photo|photos|draw|drawing|illustration|show me|see)\b/i;
  function respond(input) {
    const Brain = window.ChiedzaBrain;
    let r = null;
    // "search the internet for..." always goes to the thinking brain (the server also runs the safety check)
    if (WEB_RX.test(input)) r = { html: "", needAI: true, forced: true };
    if (!r && Brain) r = Brain.handle(input);
    if (!r) {
      r = respondCore(input);
      if (r.miss && Brain) { const f = Brain.fallback(input); if (f) r = f; else r.needAI = true; }
      else if (r.miss) r.needAI = true;
      else if (r.weak) r.needAI = true; // only a loose lesson match: let the thinking brain decide
    }
    if (r.needAI || r.quiz || r.next) return r;
    const explicit = PIC_RX.test(input);
    const ctx = (r.links && r.links[0] ? r.links[0][1] : "") + " " + (r.html || "").replace(/<[^>]+>/g, " ").slice(0, 300);
    const imgs = pickImages(input, explicit, ctx);
    if (imgs.length) r.images = imgs;
    else if (explicit && /\b(picture|image|photo|draw|illustration)/i.test(input)) r.html += "<br><br>🖼️ I do not have a picture for that yet. I have pictures for <em>sign language & Deaf etiquette, the five senses, instruments, handwashing and shapes</em>.";
    return r;
  }
  function imgHtml(list) {
    return (list || []).map(i => `<figure class="cai-fig"><a href="${i.url}" target="_blank" rel="noopener"><img src="${i.url}" alt="${esc(i.cap)}" loading="lazy"></a><figcaption>${esc(i.cap)} <a href="${i.url}" download="chiedza-${i.src}.jpg" class="cai-save">⬇ Save</a></figcaption></figure>`).join("");
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
        <form id="caiForm" autocomplete="off"><input id="caiInput" type="text" placeholder="Ask me anything…" maxlength="500" /><button type="submit" aria-label="Send">➤</button></form>
        <div class="cai-foot">Chiedza AI thinks, uses our lessons and can search the internet. It can make mistakes - ask a grown-up to check important things.</div>
      </section>`;
    document.body.appendChild(root);
    const $ = id => document.getElementById(id);
    const msgs = $("caiMsgs"), panel = $("caiPanel"), input = $("caiInput");
    let speak = false;

    const say = (html, who) => { const d = document.createElement("div"); d.className = "cai-msg " + who; d.innerHTML = html; msgs.appendChild(d); msgs.scrollTop = msgs.scrollHeight; return d; };
    const chips = list => { $("caiChips").innerHTML = (list || []).map(c => `<button class="cai-chip">${esc(c)}</button>`).join(""); };
    const talk = html => { if (!speak || !window.speechSynthesis) return; const u = new SpeechSynthesisUtterance(plain(html)); u.rate = 0.95; speechSynthesis.cancel(); speechSynthesis.speak(u); };
    const show = r => {
      say(r.html + imgHtml(r.images) + linkHtml(r.links), "bot"); talk(r.html);
      if (r.next) setTimeout(() => say(r.next.html, "bot"), 500);
      chips(r.chips || (r.quiz || r.next ? [] : ["Quiz me", "Fun fact"]));
    };
    if (window.ChiedzaBrain) window.ChiedzaBrain.say = html => say(html, "bot");
    /* ----- thinking brain (server AI + internet) ----- */
    const history = []; // last turns, sent so follow-up questions make sense
    const remember = (role, html) => { history.push({ role, text: plain(html).slice(0, 700) }); while (history.length > 8) history.shift(); };
    let aiOn = null;
    const aiEnabled = async () => {
      if (aiOn !== null) return aiOn;
      if (!/^https?:/.test(location.protocol)) return (aiOn = false);
      try { const r = await fetch("/api/ai/status", { cache: "no-cache" }); aiOn = r.ok && !!(await r.json()).enabled; } catch (e) { aiOn = false; }
      return aiOn;
    };
    const fmt = t => esc(t).replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>").replace(/^\s*[-*•]\s+/gm, "• ").replace(/\n/g, "<br>");
    const srcHtml = list => (list || []).filter(x => /^https?:\/\//i.test(x.url)).map(x => `<a href="${esc(x.url)}" target="_blank" rel="noopener noreferrer">${esc(x.title || x.url)}</a>`).join(" · ");
    async function thinkOnline(text, local) {
      const bubble = say('<span class="cai-think">🤔 Thinking<span class="cai-dots"></span></span>', "bot");
      const t2 = setTimeout(() => { bubble.innerHTML = '<span class="cai-think">🔎 Checking the internet for you<span class="cai-dots"></span></span>'; }, 4000);
      const ctl = new AbortController(), kill = setTimeout(() => ctl.abort(), 55000);
      try {
        const mem = window.ChiedzaBrain ? ChiedzaBrain.mem() : {};
        const ctx = facts(text, 2).map(f => `${f.title} (${f.level}): ${f.text}${f.fact ? " Key fact: " + f.fact : ""}`).join("\n");
        const resp = await fetch("/api/ai/ask", { method: "POST", signal: ctl.signal, headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ question: text, history: history.slice(0, -1), level: mem.level || "", name: window.ChiedzaBrain ? ChiedzaBrain.myName() : "", context: ctx }) });
        const j = await resp.json().catch(() => ({}));
        if (resp.status === 429) { bubble.innerHTML = j.error === "daily_limit" ? "I have answered a LOT of questions today! 😅 Try again tomorrow, or ask me about a lesson." : "Whoa, slow down a little! 😅 Wait a minute, then ask me again."; return { done: true, html: bubble.innerHTML }; }
        if (!resp.ok || !j.ok || !j.answer) throw new Error(j.error || resp.status);
        const body = j.html ? j.answer : fmt(j.answer);
        const srcs = srcHtml(j.sources);
        bubble.innerHTML = body + (j.searched ? `<div class="cai-src">🌐 I checked the internet.${srcs ? " Sources: " + srcs : ""}</div>` : "") + (j.safety ? "" : '<div class="cai-ai-note">🧠 Thought up by Chiedza AI - ask a grown-up to double-check important things.</div>');
        const rel = local && local.links ? linkHtml(local.links) : "";
        if (rel) bubble.insertAdjacentHTML("beforeend", rel);
        return { done: true, html: bubble.innerHTML, answer: body, bubble, ok: !j.safety };
      } catch (e) {
        bubble.remove(); return { done: false };
      } finally { clearTimeout(t2); clearTimeout(kill); msgs.scrollTop = msgs.scrollHeight; }
    }
    const addFeedback = (target, q, a) => {
      if (!target || !window.ChiedzaBrain) return;
      const fb = document.createElement("div"); fb.className = "cai-fb"; fb.dataset.q = q; fb.dataset.a = a || "";
      fb.innerHTML = `<button data-fb="1" title="Good answer">👍</button><button data-fb="0" title="Teach me better">👎</button>`; target.appendChild(fb);
    };
    const ask = text => {
      say(esc(text), "me"); remember("user", esc(text));
      setTimeout(async () => {
        const r = respond(text);
        if (r.needAI && await aiEnabled()) {
          const out = await thinkOnline(text, r);
          if (out.done) { talk(out.html); remember("assistant", out.html); chips(["Tell me more", "Quiz me", "Fun fact"]); if (out.ok) addFeedback(out.bubble, text, out.answer); return; }
        }
        // thinking brain not available or failed: use the offline answer
        if (r.needAI && r.miss && window.ChiedzaBrain) ChiedzaBrain.miss(text);
        if (r.needAI && r.forced) r.html = "I could not reach the internet just now. 😕 Please try again in a moment, or ask me about a lesson.";
        const at = msgs.children.length; show(r); remember("assistant", r.html || "");
        const first = msgs.children[at];
        if (first && !r.quiz && !r.next) addFeedback(first, text, r.html);
      }, 250);
    };

    function open() {
      panel.hidden = false; $("caiLauncher").classList.add("hide"); input.focus();
      if (!msgs.children.length) { const nm = window.ChiedzaBrain && ChiedzaBrain.myName(); show({ html: `Mhoro${nm ? ", " + esc(nm) : ""}! 👋 I am <strong>Chiedza AI</strong>. I know every lesson, course and game here, and my <strong>brain</strong> can also solve maths with working, convert units, teach Shona and Ndebele, build a <strong>study plan</strong>, set a <strong>daily challenge</strong> and <strong>write projects with you</strong> (reports, posters, experiments, stories, even a mini website). What shall we do today?`, chips: ["Write a project on Victoria Falls", "Make me a study plan", "Daily challenge", "What can you do?"] }); }
    }
    $("caiLauncher").onclick = open;
    $("caiClose").onclick = () => { panel.hidden = true; $("caiLauncher").classList.remove("hide"); if (window.speechSynthesis) speechSynthesis.cancel(); };
    $("caiSpeak").onclick = e => { speak = !speak; e.currentTarget.textContent = speak ? "🔊" : "🔈"; e.currentTarget.setAttribute("aria-pressed", speak); if (!speak && window.speechSynthesis) speechSynthesis.cancel(); };
    $("caiForm").onsubmit = e => { e.preventDefault(); const v = input.value.trim(); if (!v) return; input.value = ""; ask(v); };
    $("caiChips").onclick = e => { const b = e.target.closest(".cai-chip"); if (b) ask(b.textContent); };
    msgs.onclick = e => {
      const f = e.target.closest("[data-fb]");
      if (f) {
        const box = f.parentNode, good = f.dataset.fb === "1";
        if (window.ChiedzaBrain) ChiedzaBrain.feedback(box.dataset.q, box.dataset.a, good);
        box.innerHTML = good ? "Thank you! 🌟" : "Thanks for telling me. 💛 My teacher will help me learn this.";
        return;
      }
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

  function facts(topic, n = 3) {
    const qt = tokens(topic);
    const qs = [...new Set(qt)], share = tk => qs.filter(t => tk.includes(t)).length / (qs.length || 1);
    return search(topic, n + 3).filter(h => h.s >= 4 && share(h.d.tok) >= 0.6 && (share(tokens(h.d.title + " " + (h.d.fact || ""))) >= 0.6 || h.s >= 9)).slice(0, n).map(h => ({ title: h.d.title, level: h.d.level + " · " + h.d.subject, text: bestSentences(h.d.text, qt, 2), fact: h.d.fact, link: h.d.link }));
  }
  window.ChiedzaAI = { respond, search, facts };
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", mount); else mount();
})();
