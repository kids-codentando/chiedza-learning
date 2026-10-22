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
    { k: "who made created built founder owner ntandomods creator", a: "Chiedza was built by <strong>Ntandoyenkosi Chisaya</strong>, known as <strong>Ntandomods</strong>, who is 20 years old. He created Chiedza Learning and Chiedza AI with ❤️.", links: [["#/about", "About us"]] },
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


  let lastWeb = null; // last question answered from the internet, for "tell me more"
  const MORE_RX = /^(tell me more|more|go on|continue|keep going|say more)\b[ !.?]*$/i;
  const WEB_RX = /\b(weather (in|for|at|of)|(what|how)('s| is) the weather|forecast for|how (hot|cold|warm) is it in|search (the )?(web|internet|online)|(look|find)( it| this| that)? up online|google|on the internet|search for|latest news|news about|breaking news)\b/i;
  const PIC_RX = /\b(picture|pictures|image|images|photo|photos|draw|drawing|illustration|show me|see)\b/i;
  function respond(input) {
    const Brain = window.ChiedzaBrain;
    let r = null;
    // "search the internet for..." always goes to the thinking brain (the server also runs the safety check)
    if (lastWeb && MORE_RX.test(input.trim())) r = { html: "", needAI: true, forced: true, more: lastWeb.more + 1, q: lastWeb.q };
    else if (WEB_RX.test(input)) r = { html: "", needAI: true, forced: true };
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
          <div class="cai-actions"><button id="caiVoice" title="Voice chat: talk to me and I talk back" aria-pressed="false">🎙️</button><button id="caiSpeak" title="Read answers aloud" aria-pressed="false">🔈</button><button id="caiClose" aria-label="Close">✕</button></div></header>
        <div id="caiFace" class="face-idle" hidden aria-hidden="true">
          <svg viewBox="0 0 200 200" width="132" height="132" role="img">
            <defs>
              <radialGradient id="cfHead" cx="50%" cy="38%" r="70%"><stop offset="0" stop-color="#FFF3A6"/><stop offset=".55" stop-color="#FFD83A"/><stop offset="1" stop-color="#F5B800"/></radialGradient>
              <radialGradient id="cfGlow" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="#FFE45C" stop-opacity=".75"/><stop offset="1" stop-color="#FFE45C" stop-opacity="0"/></radialGradient>
            </defs>
            <circle class="cf-glow" cx="100" cy="106" r="98" fill="url(#cfGlow)"/>
            <g class="cf-ring"><circle cx="100" cy="106" r="88" fill="none" stroke="#00A651" stroke-width="3" opacity=".0"/></g>
            <g class="cf-head">
              <path class="cf-leaf" d="M100 34 C96 18 82 12 70 16 C72 30 84 38 100 34 Z" fill="#00A651"/>
              <path class="cf-leaf" d="M100 34 C104 18 118 12 130 16 C128 30 116 38 100 34 Z" fill="#007A3D"/>
              <rect x="88" y="36" width="24" height="12" rx="4" fill="#9aa0a6"/>
              <circle cx="100" cy="112" r="72" fill="url(#cfHead)" stroke="#E0A200" stroke-width="3"/>
              <ellipse cx="62" cy="130" rx="11" ry="7" fill="#FF8A80" opacity=".55"/>
              <ellipse cx="138" cy="130" rx="11" ry="7" fill="#FF8A80" opacity=".55"/>
              <g class="cf-brows" stroke="#5a3b00" stroke-width="5" stroke-linecap="round" fill="none">
                <path class="cf-brow-l" d="M64 84 Q75 78 87 84"/><path class="cf-brow-r" d="M113 84 Q125 78 136 84"/>
              </g>
              <g class="cf-eye cf-eye-l"><ellipse cx="76" cy="104" rx="13" ry="15" fill="#fff" stroke="#5a3b00" stroke-width="2"/><g class="cf-pupil"><circle cx="76" cy="106" r="7.5" fill="#26180a"/><circle cx="73" cy="102" r="2.4" fill="#fff"/></g></g>
              <g class="cf-eye cf-eye-r"><ellipse cx="124" cy="104" rx="13" ry="15" fill="#fff" stroke="#5a3b00" stroke-width="2"/><g class="cf-pupil"><circle cx="124" cy="106" r="7.5" fill="#26180a"/><circle cx="121" cy="102" r="2.4" fill="#fff"/></g></g>
              <path class="cf-smile" d="M72 138 Q100 162 128 138" fill="none" stroke="#5a3b00" stroke-width="5" stroke-linecap="round"/>
              <g class="cf-mouth" style="display:none"><ellipse class="cf-mouth-o" cx="100" cy="146" rx="16" ry="10" fill="#6d1d1d" stroke="#5a3b00" stroke-width="3"/><ellipse class="cf-tongue" cx="100" cy="151" rx="9" ry="4" fill="#ff7a8a"/></g>
            </g>
            <g class="cf-dots" fill="#00A651"><circle cx="150" cy="40" r="5"/><circle cx="166" cy="30" r="6.5"/><circle cx="186" cy="22" r="8"/></g>
          </svg>
          <div id="caiFaceCap" aria-live="off">Hi! I am Chiedza</div>
        </div>
        <div id="caiMsgs" aria-live="polite"></div>
        <div id="caiChips"></div>
        <form id="caiForm" autocomplete="off"><input id="caiInput" type="text" placeholder="Ask me anything…" maxlength="500" /><button type="button" id="caiMic" class="cai-mic" aria-label="Speak your question" title="Tap and speak">🎤</button><button type="submit" aria-label="Send">➤</button></form>
        <div id="caiVoiceBar" hidden><label>Voice language <select id="caiLang"><option value="en-ZA">English</option><option value="sn-ZW">Shona (may not work on every device)</option></select></label><span id="caiVoiceNote"></span></div>
        <div class="cai-foot">Chiedza AI uses our lessons and looks things up on the internet. It can make mistakes - ask a grown-up to check important things.</div>
      </section>`;
    document.body.appendChild(root);
    const $ = id => document.getElementById(id);
    const msgs = $("caiMsgs"), panel = $("caiPanel"), input = $("caiInput");
    let speak = false;

    const say = (html, who) => { const d = document.createElement("div"); d.className = "cai-msg " + who; d.innerHTML = html; msgs.appendChild(d); msgs.scrollTop = msgs.scrollHeight; return d; };
    const chips = list => { $("caiChips").innerHTML = (list || []).map(c => `<button class="cai-chip">${esc(c)}</button>`).join(""); };
    const spoken = html => plain(html).replace(/[\p{Extended_Pictographic}\uFE0F\u20E3]/gu, " ").replace(/×/g, " times ").replace(/÷/g, " divided by ").replace(/−/g, " minus ").replace(/\+/g, " plus ").replace(/=/g, " equals ").replace(/[→⬇➤✔]/g, " ").replace(/\s+/g, " ").trim().slice(0, 900);
    const talk = html => {
      if (!speak || !window.speechSynthesis) return; const t = spoken(html); if (!t) return;
      const u = new SpeechSynthesisUtterance(t); u.rate = 0.95;
      u.onstart = () => faceState("speaking"); u.onboundary = () => faceBeat();
      u.onend = u.onerror = () => faceState(voiceChat ? "idle" : "idle", true);
      speechSynthesis.cancel(); speechSynthesis.speak(u); faceState("speaking");
    };
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
      try { const r = await fetch("/api/brain/web-status", { cache: "no-cache" }); aiOn = r.ok && !!(await r.json()).enabled; } catch (e) { aiOn = false; }
      return aiOn;
    };
    const fmt = t => esc(t).replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>").replace(/^\s*[-*•]\s+/gm, "• ").replace(/\n/g, "<br>");
    const srcHtml = list => (list || []).filter(x => /^https?:\/\//i.test(x.url)).map(x => `<a href="${esc(x.url)}" target="_blank" rel="noopener noreferrer">${esc(x.title || x.url)}</a>`).join(" · ");
    async function thinkOnline(text, local) {
      const more = local && local.more ? local.more : 0, qs = local && local.q ? local.q : text;
      const bubble = say('<span class="cai-think">🤔 Thinking<span class="cai-dots"></span></span>', "bot");
      const t2 = setTimeout(() => { bubble.innerHTML = '<span class="cai-think">🔎 Looking it up on the internet<span class="cai-dots"></span></span>'; }, 4000);
      const ctl = new AbortController(), kill = setTimeout(() => ctl.abort(), 55000);
      try {
        const mem = window.ChiedzaBrain ? ChiedzaBrain.mem() : {};
        const resp = await fetch("/api/brain/ask", { method: "POST", signal: ctl.signal, headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ question: qs, level: mem.level || "", more }) });
        const j = await resp.json().catch(() => ({}));
        if (resp.status === 429) { bubble.innerHTML = j.error === "daily_limit" ? "Whoa, slow down a little! 😅 Wait a minute, then ask me again." : "Whoa, slow down a little! 😅 Wait a minute, then ask me again."; return { done: true, html: bubble.innerHTML }; }
        if (!resp.ok || !j.ok || !j.answer) throw new Error(j.error || resp.status);
        const body = j.html ? j.answer : fmt(j.answer);
        const srcs = srcHtml(j.sources);
        bubble.innerHTML = body + (j.searched ? `<div class="cai-src">🌐 I looked this up on the internet.${srcs ? " Source: " + srcs : ""}</div>` : "") + (j.safety ? "" : '<div class="cai-ai-note">🧠 Found by Chiedza Brain. Ask a grown-up to double-check important things.</div>');
        const rel = local && local.links ? linkHtml(local.links) : "";
        if (rel) bubble.insertAdjacentHTML("beforeend", rel);
        if (!j.safety && j.kind === "knowledge") lastWeb = { q: qs, more }; else if (j.kind !== "done") lastWeb = null;
        return { done: true, html: bubble.innerHTML, answer: body, bubble, ok: !j.safety, more: j.kind === "knowledge" };
      } catch (e) {
        bubble.remove(); return { done: false };
      } finally { clearTimeout(t2); clearTimeout(kill); msgs.scrollTop = msgs.scrollHeight; }
    }
    const addFeedback = (target, q, a) => {
      if (!target || !window.ChiedzaBrain) return;
      const fb = document.createElement("div"); fb.className = "cai-fb"; fb.dataset.q = q; fb.dataset.a = a || "";
      fb.innerHTML = `<button data-fb="1" title="Good answer">👍</button><button data-fb="0" title="Teach me better">👎</button>`; target.appendChild(fb);
    };
    let ask = text => {
      say(esc(text), "me"); remember("user", esc(text));
      setTimeout(async () => {
        const r = respond(text);
        if (r.needAI && await aiEnabled()) {
          const out = await thinkOnline(text, r);
          if (out.done) { talk(out.html); remember("assistant", out.html); chips(out.more ? ["Tell me more", "Quiz me", "Fun fact"] : ["Quiz me", "Fun fact"]); if (out.ok) addFeedback(out.bubble, text, out.answer); return; }
        }
        // thinking brain not available or failed: use the offline answer
        if (r.needAI && r.miss && window.ChiedzaBrain) ChiedzaBrain.miss(text);
        if (r.needAI && r.forced) r.html = "I could not reach the internet just now. 😕 Please try again in a moment, or ask me about a lesson.";
        const at = msgs.children.length; show(r); remember("assistant", r.html || "");
        const first = msgs.children[at];
        if (first && !r.quiz && !r.next) addFeedback(first, text, r.html);
      }, 250);
    };


    /* ----- the face: moves while Chiedza listens, thinks and speaks ----- */
    const faceEl = $("caiFace"), faceCap = $("caiFaceCap");
    const smile = faceEl.querySelector(".cf-smile"), mouthG = faceEl.querySelector(".cf-mouth"), mouthO = faceEl.querySelector(".cf-mouth-o"), tongue = faceEl.querySelector(".cf-tongue");
    const CAP = { idle: "Hi! I am Chiedza 💡", listening: "I am listening…", thinking: "Let me think…", speaking: "" };
    let fState = "idle", mouthTimer = null, hideTimer = null, blinkTimer = null, lastAsk = 0;
    const reduce = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
    function mouth(open, wide) { // open 0..1, wide 0..1
      if (open < 0.08) { smile.style.display = ""; mouthG.style.display = "none"; return; }
      smile.style.display = "none"; mouthG.style.display = "";
      mouthO.setAttribute("rx", (11 + 14 * wide).toFixed(1)); mouthO.setAttribute("ry", (3 + 17 * open).toFixed(1));
      tongue.setAttribute("rx", (6 + 6 * wide).toFixed(1)); tongue.setAttribute("cy", (146 + 3 + 6 * open).toFixed(1)); tongue.style.opacity = open > 0.35 ? 1 : 0;
    }
    let beat = 0;
    function faceBeat() { beat = 1; }
    function faceState(st, ended) {
      if (st === fState && !ended) return;
      if (ended && fState !== "speaking") return;
      fState = st; faceEl.className = "face-" + st;
      clearTimeout(hideTimer); clearInterval(mouthTimer); mouth(0, 0);
      const show = st !== "idle" || voiceChat;
      faceEl.hidden = !show;
      faceCap.textContent = CAP[st] || "";
      if (st === "speaking") {
        let t = 0, vis = [[.55, .3], [.9, .7], [.35, .2], [.75, .1], [.2, .6], [.95, .5], [.5, .9], [.1, .2]];
        mouthTimer = setInterval(() => { t++; const v = vis[(t + Math.floor(Math.random() * 3)) % vis.length]; const k = beat ? 1 : 0.8; beat = 0; mouth(v[0] * k, v[1]); }, 105);
      }
      if (st === "idle" && !voiceChat) hideTimer = setTimeout(() => { if (fState === "idle" && !voiceChat) faceEl.hidden = true; }, 2600);
    }
    function blink() { const eyes = faceEl.querySelectorAll(".cf-eye"); eyes.forEach(e => e.classList.add("blink")); setTimeout(() => eyes.forEach(e => e.classList.remove("blink")), 150); blinkTimer = setTimeout(blink, 2200 + Math.random() * 3200); }
    if (!reduce) blinkTimer = setTimeout(blink, 1800);
    // keep the face honest: thinking while an answer is being prepared, idle when everything is quiet
    setInterval(() => {
      if (faceEl.hidden && !voiceChat) return;
      const thinking = !!msgs.querySelector(".cai-think");
      const talking = window.speechSynthesis && speechSynthesis.speaking;
      if (talking) { if (fState !== "speaking") faceState("speaking"); return; }
      if (fState === "speaking") { faceState("idle"); return; }
      if (thinking || (Date.now() - lastAsk < 700)) { if (fState !== "thinking") faceState("thinking"); return; }
      if (listening) { if (fState !== "listening") faceState("listening"); return; }
      if (fState !== "idle") faceState("idle");
    }, 250);

    /* ----- voice: speak to Chiedza, and hear it answer ----- */
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    const micBtn = $("caiMic"), voiceBtn = $("caiVoice"), bar = $("caiVoiceBar"), note = $("caiVoiceNote"), langSel = $("caiLang");
    let rec = null, listening = false, voiceChat = false, lastActive = Date.now(), errCount = 0;
    const LANG_KEY = "chiedza_voice_lang", OK_KEY = "chiedza_voice_ok";
    try { const l = localStorage.getItem(LANG_KEY); if (l) langSel.value = l; } catch (e) {}
    const setNote = t => { note.textContent = t || ""; bar.hidden = !t && !voiceChat && !listening; };
    const spokenNumbers = t => { const W = { zero: 0, one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10, eleven: 11, twelve: 12, thirteen: 13, fourteen: 14, fifteen: 15, sixteen: 16, seventeen: 17, eighteen: 18, nineteen: 19, twenty: 20, thirty: 30, forty: 40, fifty: 50, sixty: 60, seventy: 70, eighty: 80, ninety: 90 }; const w = t.toLowerCase().replace(/[^a-z -]/g, "").trim().split(/[\s-]+/); if (w.length && w.length <= 2 && W[w[0]] !== undefined && (w.length === 1 || (W[w[0]] >= 20 && W[w[1]] > 0 && W[w[1]] < 10))) return String(W[w[0]] + (w[1] ? W[w[1]] : 0)); return t; };
    function stopListen() { listening = false; micBtn.classList.remove("on"); micBtn.textContent = "🎤"; input.placeholder = "Ask me anything…"; if (rec) { try { rec.abort(); } catch (e) {} } }
    function startListen() {
      if (!SR || listening) return;
      if (window.speechSynthesis && speechSynthesis.speaking) return;
      let got = false;
      try { rec = new SR(); } catch (e) { return; }
      rec.lang = langSel.value || "en-ZA"; rec.interimResults = true; rec.continuous = false; rec.maxAlternatives = 1;
      rec.onstart = () => { listening = true; faceState("listening"); micBtn.classList.add("on"); micBtn.textContent = "⏹️"; input.placeholder = "Listening… speak now"; setNote("🎤 Listening…"); };
      rec.onresult = ev => {
        let txt = "", fin = false;
        for (let i = ev.resultIndex; i < ev.results.length; i++) { txt += ev.results[i][0].transcript; if (ev.results[i].isFinal) fin = true; }
        input.value = txt;
        if (fin) { got = true; errCount = 0; const v = spokenNumbers(txt.trim()); input.value = ""; lastActive = Date.now(); if (v) ask(v); }
      };
      rec.onerror = ev => {
        const e = ev.error;
        if (e === "not-allowed" || e === "service-not-allowed") { voiceChat = false; syncVoice(); setNote("🔒 The microphone is blocked. Allow it in your browser settings and try again."); }
        else if (e === "language-not-supported") { langSel.value = "en-ZA"; setNote("This language is not supported on your device, so I switched to English."); }
        else if (e === "network") { setNote("Voice needs an internet connection."); errCount++; }
        else if (e === "no-speech") { errCount++; }
      };
      rec.onend = () => { listening = false; micBtn.classList.remove("on"); micBtn.textContent = "🎤"; input.placeholder = "Ask me anything…"; if (!got && input.value.trim() && !voiceChat) { /* leave the words in the box so they can be sent */ } if (!voiceChat) setNote(""); if (voiceChat && errCount >= 3) { voiceChat = false; syncVoice(); setNote("I did not hear anything, so voice chat is off. Tap 🎙️ to start again."); } };
      try { rec.start(); } catch (e) {}
    }
    function consent() {
      try { if (localStorage.getItem(OK_KEY) === "1") return true; } catch (e) {}
      const ok = window.confirm("Voice uses your browser's speech service, and your voice may be sent to the company that makes your browser to turn it into words. Please ask a parent or guardian first. Do you have permission to use voice?");
      if (ok) { try { localStorage.setItem(OK_KEY, "1"); } catch (e) {} }
      return ok;
    }
    function syncVoice() { voiceBtn.setAttribute("aria-pressed", voiceChat); voiceBtn.classList.toggle("on", voiceChat); if (!voiceChat) { if (listening) stopListen(); setTimeout(() => { if (fState === "idle") faceEl.hidden = true; }, 600); } }
    if (!SR) { micBtn.disabled = true; micBtn.title = "Voice typing is not supported in this browser. Try Chrome or Edge."; voiceBtn.disabled = true; voiceBtn.title = micBtn.title; micBtn.classList.add("off"); }
    micBtn.onclick = () => { if (!SR) { say("🎤 Voice is not supported in this browser. Please try <strong>Chrome</strong> or <strong>Edge</strong>.", "bot"); return; } if (listening) { stopListen(); return; } if (!consent()) return; errCount = 0; startListen(); };
    voiceBtn.onclick = () => {
      if (!SR) return;
      if (voiceChat) { voiceChat = false; syncVoice(); setNote("Voice chat is off."); speechSynthesis && speechSynthesis.cancel(); return; }
      if (!consent()) return;
      voiceChat = true; errCount = 0; speak = true; $("caiSpeak").textContent = "🔊"; $("caiSpeak").setAttribute("aria-pressed", true);
      syncVoice(); faceState("idle"); faceEl.hidden = false; bar.hidden = false; setNote("🎙️ Voice chat is on. Just talk, and I will talk back.");
      say("🎙️ <strong>Voice chat is on.</strong> Ask me anything by speaking. Tap 🎙️ again to stop.", "bot");
      lastActive = Date.now(); startListen();
    };
    langSel.onchange = () => { try { localStorage.setItem(LANG_KEY, langSel.value); } catch (e) {} };
    // in voice chat: after Chiedza finishes thinking and speaking, listen again
    setInterval(() => {
      if (!voiceChat || listening || panel.hidden) return;
      if (msgs.querySelector(".cai-think")) return;
      if (window.speechSynthesis && (speechSynthesis.speaking || speechSynthesis.pending)) return;
      if (Date.now() - lastActive < 1200) return;
      startListen();
    }, 900);
    const _ask = ask;
    ask = text => { lastActive = Date.now() + 1500; lastAsk = Date.now(); faceState("thinking"); return _ask(text); };

    function open() {
      panel.hidden = false; $("caiLauncher").classList.add("hide"); input.focus();
      if (!msgs.children.length) { const nm = window.ChiedzaBrain && ChiedzaBrain.myName(); show({ html: `Mhoro${nm ? ", " + esc(nm) : ""}! 👋 I am <strong>Chiedza AI</strong>, a helper for <strong>everyone</strong> - children, parents, teachers and adult learners. I know every lesson, course and game here, and my <strong>brain</strong> can also solve maths with working, convert units, teach Shona and Ndebele, build a <strong>study plan</strong>, set a <strong>daily challenge</strong> and <strong>write projects with you</strong> (reports, posters, experiments, stories, even a mini website). What shall we do today?`, chips: ["Write a project on Victoria Falls", "Make me a study plan", "How can I help my child learn?", "How do I make a budget?", "What can you do?"] }); }
    }
    $("caiLauncher").onclick = open;
    $("caiClose").onclick = () => { voiceChat = false; if (typeof syncVoice === "function") syncVoice(); panel.hidden = true; $("caiLauncher").classList.remove("hide"); if (window.speechSynthesis) speechSynthesis.cancel(); };
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
