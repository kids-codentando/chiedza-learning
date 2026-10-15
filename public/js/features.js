/* ============================================================
   CHIEDZA FEATURES - adaptive revision, quiz hints, practice
   papers, weekly challenge, daily goal and parent dashboard.
   Everything is stored on the learner's own device (localStorage).
   Loaded after app.js. Exposes window.FX.
   ============================================================ */
(function () {
  const KEY = "chiedza_fx_v1";
  const DEF = { mistakes: {}, activity: {}, goal: 3, exams: [], weekly: {}, subj: {}, cleared: 0 };

  /* ---------------- storage ---------------- */
  let fx = load();
  function load() {
    try { return Object.assign({}, JSON.parse(JSON.stringify(DEF)), JSON.parse(localStorage.getItem(KEY) || "{}")); }
    catch (e) { return JSON.parse(JSON.stringify(DEF)); }
  }
  function save() { try { localStorage.setItem(KEY, JSON.stringify(fx)); } catch (e) {} }

  /* ---------------- small helpers ---------------- */
  const dayKey = (d = new Date()) => d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
  function weekKey(d = new Date()) { // ISO week, e.g. 2026-W42
    const t = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
    const n = t.getUTCDay() || 7; t.setUTCDate(t.getUTCDate() + 4 - n);
    const y0 = new Date(Date.UTC(t.getUTCFullYear(), 0, 1));
    return t.getUTCFullYear() + "-W" + String(Math.ceil(((t - y0) / 86400000 + 1) / 7)).padStart(2, "0");
  }
  function rngSeed(str) { let h = 1779033703 ^ str.length; for (let i = 0; i < str.length; i++) { h = Math.imul(h ^ str.charCodeAt(i), 3432918353); h = (h << 13) | (h >>> 19); } let a = h >>> 0; return () => { a |= 0; a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
  function shuffle(arr, rnd = Math.random) { const a = arr.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }
  const strip = h => String(h || "").replace(/<[^>]+>/g, " ").replace(/&[a-z]+;/g, " ").replace(/\s+/g, " ").trim();
  const toks = s => strip(s).toLowerCase().split(/[^a-z0-9\u00C0-\u024F]+/).filter(w => w.length > 2);
  const fmtMin = s => s < 60 ? s + "s" : Math.round(s / 60) + " min";
  const fmtClock = s => Math.floor(s / 60) + ":" + String(s % 60).padStart(2, "0");
  function day(k = dayKey()) { return fx.activity[k] || (fx.activity[k] = { act: 0, lessons: 0, quizzes: 0, games: 0, practice: 0, answered: 0, correct: 0, sec: 0 }); }
  function speak(text) {
    if (!window.speechSynthesis) { if (window.showToast) showToast("🔇 Reading aloud is not supported on this device."); return; }
    speechSynthesis.cancel(); const u = new SpeechSynthesisUtterance(text); u.rate = 0.92; speechSynthesis.speak(u);
  }

  /* ---------------- question bank ---------------- */
  function levelOf(id) { return LEVELS.find(l => l.id === id); }
  function questionsFor(levelId, subjectId) {
    const out = [], lv = levelOf(levelId); if (!lv) return out;
    lv.subjects.filter(s => !subjectId || subjectId === "all" || s.id === subjectId).forEach(s => {
      s.lessons.forEach((les, idx) => (les.quiz || []).forEach((q, qi) => out.push({ q: q.q, options: q.options, answer: q.answer, levelId, subjectId: s.id, subjectName: s.name, idx, qi, lesson: les.title })));
    });
    return out;
  }
  const srcKey = q => `${q.levelId}/${q.subjectId}/${q.idx}/${q.qi}`;
  function lessonLink(q) { return `#/lesson/${q.levelId}/${q.subjectId}/${q.idx}`; }
  function lookup(key) { // mistakes key -> question object
    const [l, s, i, qi] = key.split("/"); const lv = levelOf(l), sub = lv && lv.subjects.find(x => x.id === s), les = sub && sub.lessons[+i], q = les && les.quiz && les.quiz[+qi];
    return q ? { q: q.q, options: q.options, answer: q.answer, levelId: l, subjectId: s, subjectName: sub.name, idx: +i, qi: +qi, lesson: les.title } : null;
  }

  /* ---------------- activity / goal / time ---------------- */
  function logActivity(kind) {
    const d = day(), before = d.act; d[kind] = (d[kind] || 0) + 1; d.act++;
    if (before < fx.goal && d.act >= fx.goal) {
      if (window.showToast) showToast("🎯 Daily goal reached! Well done!");
      if (window.awardBadge) awardBadge("goal-getter");
    }
    save();
  }
  let lastTouch = Date.now();
  ["pointerdown", "keydown", "touchstart", "scroll"].forEach(ev => window.addEventListener(ev, () => { lastTouch = Date.now(); }, { passive: true }));
  setInterval(() => { if (document.visibilityState === "visible" && Date.now() - lastTouch < 60000) { day().sec += 5; save(); } }, 5000);

  /* ---------------- mistakes (adaptive memory) ---------------- */
  function record(q, correct, hinted) {
    const k = srcKey(q), d = day(), sk = q.levelId + "/" + q.subjectId, st = fx.subj[sk] || (fx.subj[sk] = { a: 0, c: 0, name: q.subjectName || q.subjectId });
    d.answered++; st.a++; if (correct) { d.correct++; st.c++; }
    const m = fx.mistakes[k];
    if (!correct) fx.mistakes[k] = { wrong: (m ? m.wrong : 0) + 1, ok: 0, last: Date.now() };
    else if (m && !hinted) {
      m.ok++; m.last = Date.now();
      if (m.ok >= 2) {
        delete fx.mistakes[k]; fx.cleared++;
        if (fx.cleared >= 10 && window.awardBadge) awardBadge("reviser");
      }
    }
    save();
  }
  function weakList() {
    return Object.entries(fx.mistakes).map(([k, m]) => Object.assign({ key: k }, m)).sort((a, b) => b.wrong - a.wrong || a.last - b.last);
  }
  function weakTopics() { // group by lesson
    const g = {};
    weakList().forEach(m => { const q = lookup(m.key); if (!q) return; const id = `${q.levelId}/${q.subjectId}/${q.idx}`; (g[id] = g[id] || { q, n: 0 }).n++; });
    return Object.values(g).sort((a, b) => b.n - a.n);
  }

  /* ---------------- hints ---------------- */
  let hintN = 0, hintKey = "", hintedNow = false;
  function currentQ() {
    if (sess && sess.active) { const q = sess.qs[sess.i]; return { src: q, q: q.q, opts: q.opts, answer: q.ans, mode: sess.mode, ctx: "sess" }; }
    if (typeof quizCtx !== "undefined" && quizCtx && quizCtx.questions) {
      const q = quizCtx.questions[quizCtx.i]; if (!q) return null;
      return { src: { levelId: quizCtx.levelId, subjectId: quizCtx.subjectId, idx: quizCtx.idx, qi: quizCtx.i }, q: q.q, opts: q.options, answer: q.answer, ctx: "quiz" };
    }
    return null;
  }
  function lessonFor(src) { const lv = levelOf(src.levelId), s = lv && lv.subjects.find(x => x.id === src.subjectId); return s && s.lessons[src.idx]; }
  function bestSentence(les, qtext, opts) {
    const want = new Set(toks(qtext + " " + opts.join(" ")));
    const sents = strip(les.body).split(/(?<=[.!?])\s+/).filter(s => s.length > 20);
    let best = null, bs = 0;
    sents.forEach(s => { const sc = toks(s).filter(t => want.has(t)).length; if (sc > bs) { bs = sc; best = s; } });
    return bs ? best : null;
  }
  function hint() {
    const c = currentQ(); if (!c || (c.mode === "exam")) return;
    const k = c.ctx + srcKey(Object.assign({ qi: 0 }, c.src)) + c.q; if (k !== hintKey) { hintKey = k; hintN = 0; }
    hintN++; hintedNow = true;
    const box = $("#fxHint"); if (!box) return;
    const les = lessonFor(c.src), btns = $$(".quiz-options .opt:not(:disabled)");
    let msg;
    if (hintN === 1) {
      const s = les && bestSentence(les, c.q, c.opts);
      msg = s ? `💡 <strong>Hint 1:</strong> Look back at the lesson: <em>“${esc(s)}”</em>` : (les && les.keyFact ? `💡 <strong>Hint 1:</strong> Remember the key fact: <em>${strip(les.keyFact)}</em>` : `💡 <strong>Hint 1:</strong> Think about the lesson “${esc(les ? les.title : "")}”.`);
    } else if (hintN === 2) {
      const wrong = shuffle(c.opts.map((_, i) => i).filter(i => i !== c.answer)).slice(0, Math.max(0, c.opts.length - 2));
      btns.forEach(b => { if (wrong.includes(+b.dataset.i)) { b.disabled = true; b.style.opacity = ".35"; b.style.textDecoration = "line-through"; } });
      msg = `💡 <strong>Hint 2:</strong> I crossed out ${wrong.length} wrong answers. Which of the rest is right?`;
    } else {
      const a = String(c.opts[c.answer]);
      msg = `💡 <strong>Hint 3:</strong> The answer starts with <strong>“${esc(a.slice(0, 1))}”</strong> and has ${a.length} character${a.length === 1 ? "" : "s"}.`;
    }
    box.innerHTML = msg; box.style.display = "block";
    const hb = $("#fxHintBtn"); if (hb) hb.textContent = hintN >= 3 ? "💡 No more hints" : "💡 Another hint (" + hintN + "/3)";
    if (hintN >= 3 && hb) hb.disabled = true;
  }
  function readQuestion() {
    const c = currentQ(); if (!c) return;
    speak(c.q + ". " + c.opts.map((o, i) => "Option " + "ABCD"[i] + ". " + o).join(". "));
  }
  function resetHints() { hintN = 0; hintKey = ""; hintedNow = false; }
  function quizTools(exam) {
    return `${exam ? "" : `<button class="btn btn-ghost" id="fxHintBtn" onclick="FX.hint()">💡 Hint</button>`}<button class="btn btn-ghost" onclick="FX.readQuestion()" title="Read aloud">🔊 Read</button>`;
  }
  function hintBox() { return `<div id="fxHint" class="fx-hint" style="display:none"></div>`; }

  /* hooks used by app.js quiz */
  function onQuizQuestion() { resetHints(); }
  function onQuizAnswer(ctx, correct) {
    record({ levelId: ctx.levelId, subjectId: ctx.subjectId, idx: ctx.idx, qi: ctx.i, subjectName: (levelOf(ctx.levelId).subjects.find(s => s.id === ctx.subjectId) || {}).name }, correct, hintedNow);
  }
  function onQuizDone() { logActivity("quizzes"); }
  function onLessonDone() { logActivity("lessons"); }
  function onGameDone() { logActivity("games"); }

  /* ============================================================
     SESSION ENGINE (revision, practice paper, weekly challenge)
     ============================================================ */
  let sess = null, timer = null;
  function stopSession() { if (timer) clearInterval(timer); timer = null; if (sess) sess.active = false; }
  window.addEventListener("hashchange", stopSession);

  function prep(list, rnd) { // shuffle options, remember where the answer went
    return list.map(q => {
      const order = shuffle(q.options.map((_, i) => i), rnd);
      return Object.assign({}, q, { opts: order.map(i => q.options[i]), ans: order.indexOf(q.answer) });
    });
  }
  function start(cfg) {
    stopSession(); resetHints();
    sess = Object.assign({ i: 0, score: 0, picks: [], t0: Date.now(), active: true }, cfg);
    sess.qs = prep(cfg.questions, cfg.rnd);
    if (cfg.seconds) { sess.left = cfg.seconds; timer = setInterval(tick, 1000); }
    drawQ();
  }
  function tick() {
    if (!sess || !sess.active) return stopSession();
    sess.left--; const el = $("#fxTimer"); if (el) { el.textContent = "⏱ " + fmtClock(Math.max(0, sess.left)); if (sess.left <= 30) el.style.color = "var(--brand)"; }
    if (sess.left <= 0) finish(true);
  }
  function drawQ() {
    const S = sess, q = S.qs[S.i], total = S.qs.length, exam = S.mode === "exam";
    resetHints();
    $("#app").innerHTML = `
    ${topbar(S.nav || "practice")}
    <div class="quiz-wrap">
      <div class="quiz-head">
        <button class="back-btn" onclick="FX.exit('${S.back}')">←</button>
        <div class="quiz-progress"><div class="progress-bar"><span style="width:${Math.round(S.i / total * 100)}%"></span></div></div>
        <div class="quiz-count">${S.i + 1} / ${total}</div>
        ${S.seconds ? `<div class="quiz-count" id="fxTimer">⏱ ${fmtClock(Math.max(0, S.left))}</div>` : ""}
      </div>
      <div class="quiz-card">
        <div class="kicker" style="color:var(--brand);font-weight:800;font-size:13px;text-transform:uppercase;letter-spacing:.08em">${esc(S.title)} · ${esc(q.subjectName)}</div>
        <div class="quiz-q">${esc(q.q)}</div>
        <div class="quiz-hint">${exam ? "Choose your answer. You will see the marks at the end." : "Choose the correct answer"}</div>
        <div class="quiz-options" id="quizOptions">
          ${q.opts.map((o, i) => `<button class="opt" data-i="${i}" onclick="FX.pick(${i})"><span class="letter">${"ABCD"[i]}</span>${esc(o)}</button>`).join("")}
        </div>
        ${hintBox()}
        <div class="quiz-feedback" id="quizFeedback"></div>
        <div class="quiz-actions">${quizTools(exam)}<button class="btn btn-primary ${exam ? "" : "hidden"}" id="nextBtn" onclick="FX.next()" ${exam ? "disabled" : ""}>${S.i + 1 >= total ? "Finish ✓" : "Next →"}</button></div>
      </div>
    </div>${footer()}`;
  }
  function pick(i) {
    const S = sess; if (!S || !S.active) return;
    const q = S.qs[S.i], opts = $$("#quizOptions .opt");
    if (S.mode === "exam") { // no feedback until the end; the answer can still be changed
      S.picks[S.i] = i; opts.forEach((b, k) => b.classList.toggle("picked", k === i)); $("#nextBtn").disabled = false; return;
    }
    if (S.picks[S.i] !== undefined) return;
    S.picks[S.i] = i; const ok = i === q.ans; if (ok) S.score++;
    opts.forEach((b, k) => { b.disabled = true; if (k === q.ans) b.classList.add("correct"); if (k === i && !ok) b.classList.add("wrong"); });
    const fb = $("#quizFeedback"); fb.className = "quiz-feedback show " + (ok ? "ok" : "no");
    fb.innerHTML = ok ? "✅ <strong>Correct!</strong> Well done." : `❌ <strong>Not quite.</strong> The correct answer is <strong>${esc(q.opts[q.ans])}</strong>. <a href="${lessonLink(q)}" style="text-decoration:underline">Open the lesson</a>`;
    record(q, ok, hintedNow);
    $("#nextBtn").classList.remove("hidden");
  }
  function next() { const S = sess; if (!S) return; S.i++; if (S.i >= S.qs.length) return finish(false); drawQ(); }

  function finish(timeUp) {
    const S = sess; if (!S) return; stopSession();
    const total = S.qs.length, secs = Math.round((Date.now() - S.t0) / 1000);
    if (S.mode === "exam") { // mark the paper now
      S.score = 0;
      S.qs.forEach((q, k) => { const p = S.picks[k]; if (p === undefined) return; const ok = p === q.ans; if (ok) S.score++; record(q, ok, false); });
    }
    const pct = Math.round(S.score / total * 100);
    logActivity(S.mode === "exam" ? "practice" : "quizzes");
    if (S.mode === "exam") {
      fx.exams.unshift({ at: Date.now(), levelId: S.levelId, subject: S.subjectLabel, score: S.score, total, secs }); fx.exams = fx.exams.slice(0, 30);
      if (pct >= 80 && window.awardBadge) awardBadge("exam-ready");
    }
    if (S.mode === "weekly") {
      const k = weekKey() + "/" + S.levelId, b = fx.weekly[k];
      if (!b || S.score > b.score) fx.weekly[k] = { score: S.score, total, secs, at: Date.now() };
    }
    if (pct >= 70) { state.gamesWon += S.mode === "weekly" ? 1 : 0; }
    save(); if (window.saveState) saveState(); if (window.checkBadges) checkBadges();

    const wrong = S.qs.map((q, k) => ({ q, p: S.picks[k] })).filter(x => x.p !== x.q.ans);
    const grade = pct >= 80 ? ["🏆", "Excellent work!"] : pct >= 60 ? ["🎉", "Good job! You are getting there."] : pct >= 40 ? ["💪", "A fair try. Revise the topics below and try again."] : ["🌱", "Keep going! Every mistake helps you learn."];
    const review = wrong.length ? `
      <div class="fx-review"><h3>📚 Review these (${wrong.length})</h3>
        ${wrong.map(({ q, p }) => `<div class="fx-rev-item">
          <div class="fx-rev-q">${esc(q.q)}</div>
          <div class="fx-rev-a no">${p === undefined ? "Not answered" : "Your answer: " + esc(q.opts[p])}</div>
          <div class="fx-rev-a ok">Correct: ${esc(q.opts[q.ans])}</div>
          <a class="fx-rev-link" href="${lessonLink(q)}">Revise “${esc(q.lesson)}” →</a>
        </div>`).join("")}
      </div>` : "";
    $("#app").innerHTML = `
    ${topbar(S.nav || "practice")}
    <div class="result-wrap"><div class="result-card" style="max-width:720px">
      <div class="result-emoji">${grade[0]}</div>
      <h1>${esc(S.title)} ${timeUp ? "· Time is up!" : "complete"}</h1>
      <div class="score-big">${S.score}/${total} <small style="font-size:.45em;color:var(--text-3)">(${pct}%)</small></div>
      <div class="msg">${grade[1]}<br><small class="muted">Time: ${fmtClock(secs)}${S.mode === "weekly" && fx.weekly[weekKey() + "/" + S.levelId] ? " · Best this week: " + fx.weekly[weekKey() + "/" + S.levelId].score + "/" + total : ""}</small></div>
      <div class="result-actions">
        <button class="btn btn-ghost" onclick="FX.exit('${S.back}')">← Back</button>
        <button class="btn btn-primary" onclick="FX.again()">🔁 Try again</button>
        ${wrong.length ? `<button class="btn btn-ghost" onclick="go('#/revise')">🔁 Revise mistakes</button>` : ""}
      </div>
      ${review}
    </div></div>${footer()}`;
  }
  function again() { if (sess && sess.redo) sess.redo(); }
  function exit(hash) { stopSession(); if (location.hash === hash) render(); else go(hash); }

  /* ============================================================
     PAGES
     ============================================================ */
  const head = (back, h1, p) => `<div class="page-head"><button class="back-btn" onclick="go('${back}')">←</button><div class="titles"><h1>${h1}</h1><p>${p}</p></div></div>`;

  /* ---------- Revise ---------- */
  function renderRevise(app) {
    const topics = weakTopics(), n = weakList().length;
    app.innerHTML = `
    ${topbar("practice")}
    ${head("#/progress", "🔁 Revise My Mistakes", "Chiedza remembers the questions you got wrong and brings them back until you know them.")}
    <section class="section">
      ${n === 0 ? `<div class="fx-empty"><div style="font-size:54px">🌟</div><h3>Nothing to revise yet!</h3><p class="muted">Take some quizzes. Any question you miss will show up here so you can master it.</p><button class="btn btn-primary" onclick="startLearning()">▶ Start Learning</button></div>` : `
      <div class="fx-card fx-wide">
        <div><div class="fx-big">${n}</div><div class="muted">question${n === 1 ? "" : "s"} to revise in ${topics.length} topic${topics.length === 1 ? "" : "s"}</div></div>
        <button class="btn btn-primary btn-lg" onclick="FX.startRevise()">▶ Revise now (${Math.min(10, n)} questions)</button>
      </div>
      <p class="muted" style="font-weight:700;margin:6px 0 18px">Answer a question correctly twice without hints and it leaves this list.</p>
      <div class="fx-list">${topics.map(t => `
        <div class="fx-row">
          <div><strong>${esc(t.q.lesson)}</strong><div class="muted" style="font-size:13px">${esc(levelOf(t.q.levelId).name)} · ${esc(t.q.subjectName)}</div></div>
          <div class="fx-pill">${t.n} to revise</div>
          <button class="btn btn-ghost" onclick="go('${lessonLink(t.q)}')">📖 Lesson</button>
        </div>`).join("")}</div>`}
    </section>${footer()}`;
  }
  function startRevise() {
    const qs = weakList().slice(0, 10).map(m => lookup(m.key)).filter(Boolean);
    if (!qs.length) return render();
    start({ mode: "revise", title: "Revision", nav: "practice", back: "#/revise", questions: qs, redo: startRevise });
  }

  /* ---------- Practice paper ---------- */
  const setup = { level: "ecd", subject: "all", n: 10, timed: true };
  function renderPractice(app) {
    const lv = levelOf(setup.level), pool = questionsFor(setup.level, setup.subject).length, n = Math.min(setup.n, pool);
    const chip = (on, label, fn) => `<button class="chip ${on ? "active" : ""}" onclick="${fn}">${label}</button>`;
    app.innerHTML = `
    ${topbar("practice")}
    ${head("#/", "📝 Practice Paper", "An exam-style paper made from the lessons. No hints, answers are marked at the end.")}
    <section class="section"><div class="fx-card">
      <h3>1. Choose your level</h3>
      <div class="chip-row">${LEVELS.map(l => chip(l.id === setup.level, l.emoji + " " + l.name, `FX.setup('level','${l.id}')`)).join("")}</div>
      <h3>2. Choose a subject</h3>
      <div class="chip-row">${chip(setup.subject === "all", "🎯 Mixed (all subjects)", "FX.setup('subject','all')")}${lv.subjects.map(s => chip(s.id === setup.subject, s.emoji + " " + esc(s.name), `FX.setup('subject','${s.id}')`)).join("")}</div>
      <h3>3. How many questions?</h3>
      <div class="chip-row">${[10, 20, 30].map(x => chip(x === setup.n, x, `FX.setup('n',${x})`)).join("")}</div>
      <h3>4. Timer</h3>
      <div class="chip-row">${chip(setup.timed, "⏱ Timed (1 min per question)", "FX.setup('timed',true)")}${chip(!setup.timed, "🧘 No timer", "FX.setup('timed',false)")}</div>
      <div style="margin-top:20px;display:flex;gap:12px;align-items:center;flex-wrap:wrap">
        <button class="btn btn-primary btn-lg" onclick="FX.startPractice()" ${pool < 3 ? "disabled" : ""}>▶ Start paper (${n} questions)</button>
        ${pool < setup.n ? `<span class="muted">Only ${pool} questions available for this choice.</span>` : ""}
      </div>
    </div>
    ${fx.exams.length ? `<div class="section-head" style="margin-top:28px"><h2>🗂 My recent papers</h2></div><div class="fx-list">${fx.exams.slice(0, 5).map(e => `<div class="fx-row"><div><strong>${esc(e.subject)}</strong><div class="muted" style="font-size:13px">${new Date(e.at).toLocaleDateString()} · ${fmtClock(e.secs)}</div></div><div class="fx-pill">${e.score}/${e.total} (${Math.round(e.score / e.total * 100)}%)</div></div>`).join("")}</div>` : ""}
    </section>${footer()}`;
  }
  function setSetup(k, v) { setup[k] = v; if (k === "level") setup.subject = "all"; renderPractice($("#app")); }
  function startPractice() {
    const pool = questionsFor(setup.level, setup.subject), n = Math.min(setup.n, pool.length), lv = levelOf(setup.level);
    const sub = setup.subject === "all" ? "Mixed subjects" : lv.subjects.find(s => s.id === setup.subject).name;
    start({ mode: "exam", title: "Practice Paper", nav: "practice", back: "#/practice", levelId: setup.level, subjectLabel: lv.name + " · " + sub, questions: shuffle(pool).slice(0, n), seconds: setup.timed ? n * 60 : 0, redo: startPractice });
  }

  /* ---------- Weekly challenge ---------- */
  function renderWeekly(app) {
    const wk = weekKey();
    app.innerHTML = `
    ${topbar("practice")}
    ${head("#/", "🏆 Weekly Challenge", "Everyone gets the same 10 questions this week (" + wk + "). Beat your best score!")}
    <section class="section"><div class="level-grid">${LEVELS.map(l => {
      const b = fx.weekly[wk + "/" + l.id];
      return `<div class="level-card ${l.cls}" onclick="FX.startWeekly('${l.id}')"><div class="go">→</div><div class="emoji-big">${l.emoji}</div><h3>${l.name}</h3><div class="ages">${l.ages}</div><div class="subj-count">${b ? "Best: " + b.score + "/" + b.total : "Not played yet"}</div></div>`;
    }).join("")}</div></section>${footer()}`;
  }
  function startWeekly(levelId) {
    const rnd = rngSeed(weekKey() + levelId), pool = questionsFor(levelId, "all");
    start({ mode: "weekly", title: "Weekly Challenge", nav: "practice", back: "#/weekly", levelId, questions: shuffle(pool, rnd).slice(0, 10), rnd, redo: () => startWeekly(levelId) });
  }

  /* ---------- Parent dashboard ---------- */
  let gate = null;
  const parentOK = () => sessionStorage.getItem("chiedza_parent_ok") === "1";
  function renderParent(app) {
    if (!parentOK()) {
      if (!gate) gate = { a: 6 + Math.floor(Math.random() * 6), b: 6 + Math.floor(Math.random() * 6) };
      app.innerHTML = `${topbar("progress")}${head("#/progress", "👪 Parent Dashboard", "This area is for grown-ups.")}
      <section class="section"><div class="fx-card" style="max-width:460px"><h3>Grown-ups only</h3><p class="muted">To continue, solve: <strong style="font-size:22px">${gate.a} × ${gate.b} = ?</strong></p>
      <input id="fxGate" class="fx-input" type="number" inputmode="numeric" placeholder="Answer" onkeydown="if(event.key==='Enter')FX.unlock()" />
      <div style="margin-top:12px"><button class="btn btn-primary" onclick="FX.unlock()">Unlock</button></div></div></section>${footer()}`;
      return;
    }
    const days = [...Array(7)].map((_, i) => { const d = new Date(Date.now() - (6 - i) * 86400000); return { d, k: dayKey(d), r: fx.activity[dayKey(d)] || { act: 0, sec: 0, answered: 0, correct: 0 } }; });
    const tot = days.reduce((a, x) => ({ act: a.act + x.r.act, sec: a.sec + x.r.sec, ans: a.ans + x.r.answered, cor: a.cor + x.r.correct }), { act: 0, sec: 0, ans: 0, cor: 0 });
    const goalDays = days.filter(x => x.r.act >= fx.goal).length, maxSec = Math.max(60, ...days.map(x => x.r.sec));
    const subs = Object.entries(fx.subj).filter(([, s]) => s.a >= 3).map(([k, s]) => ({ k, name: s.name, acc: Math.round(s.c / s.a * 100), a: s.a })).sort((a, b) => b.acc - a.acc);
    const topics = weakTopics().slice(0, 5), name = state.profile.name ? esc(state.profile.name) : "Your child";
    app.innerHTML = `
    ${topbar("progress")}
    ${head("#/progress", "👪 Parent Dashboard", `${state.profile.avatar || "🦁"} ${name} · last 7 days · saved on this device only`)}
    <section class="section">
      <div class="stat-grid">
        <div class="stat-box"><div class="v">${fmtMin(tot.sec)}</div><div class="k">Time learning</div></div>
        <div class="stat-box"><div class="v">${tot.act}</div><div class="k">Activities</div></div>
        <div class="stat-box"><div class="v">${tot.ans ? Math.round(tot.cor / tot.ans * 100) + "%" : "-"}</div><div class="k">Quiz accuracy</div></div>
        <div class="stat-box"><div class="v">${goalDays}/7</div><div class="k">Goal days</div></div>
        <div class="stat-box"><div class="v">🔥 ${state.streak.count}</div><div class="k">Day streak</div></div>
      </div>
      <div class="fx-card"><h3>Daily activity</h3>
        <div class="fx-bars">${days.map(x => `<div class="fx-bar-col"><div class="fx-bar-val">${x.r.act}</div><div class="fx-bar"><span style="height:${Math.max(3, Math.round(x.r.sec / maxSec * 100))}%" class="${x.r.act >= fx.goal ? "met" : ""}"></span></div><div class="fx-bar-lbl">${x.d.toLocaleDateString(undefined, { weekday: "short" })}</div></div>`).join("")}</div>
        <p class="muted" style="font-size:13px">Bar height = time spent. Green bars = daily goal met. Number = activities done.</p>
        <div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap" class="no-print"><label for="fxGoal" style="font-weight:800">Daily goal:</label>
          <select id="fxGoal" class="fx-input" style="width:auto" onchange="FX.setGoal(this.value)">${[1, 2, 3, 4, 5, 6, 8, 10].map(n => `<option value="${n}" ${n === fx.goal ? "selected" : ""}>${n} activit${n === 1 ? "y" : "ies"} a day</option>`).join("")}</select></div>
      </div>
      <div class="fx-two">
        <div class="fx-card"><h3>Subjects</h3>${subs.length ? subs.map(s => `<div class="fx-sub"><span>${esc(s.name)}</span><div class="progress-bar"><span style="width:${s.acc}%"></span></div><b>${s.acc}%</b></div>`).join("") + `<p class="muted" style="font-size:13px">Strongest: <b>${esc(subs[0].name)}</b>${subs.length > 1 ? " · Needs support: <b>" + esc(subs[subs.length - 1].name) + "</b>" : ""}</p>` : `<p class="muted">Not enough quiz answers yet (3+ per subject).</p>`}</div>
        <div class="fx-card"><h3>Topics to help with</h3>${topics.length ? topics.map(t => `<div class="fx-sub"><span>${esc(t.q.lesson)}<br><small class="muted">${esc(t.q.subjectName)}</small></span><b>${t.n}</b></div>`).join("") : `<p class="muted">No weak topics right now. 🌟</p>`}</div>
      </div>
      ${fx.exams.length ? `<div class="fx-card"><h3>Practice papers</h3>${fx.exams.slice(0, 5).map(e => `<div class="fx-sub"><span>${esc(e.subject)}<br><small class="muted">${new Date(e.at).toLocaleDateString()}</small></span><b>${e.score}/${e.total}</b></div>`).join("")}</div>` : ""}
      <div class="flex gap wrap no-print" style="margin-top:18px"><button class="btn btn-primary" onclick="window.print()">🖨 Print this report</button><button class="btn btn-ghost" onclick="go('#/report')">📄 Report card</button><button class="btn btn-ghost" onclick="FX.lock()">🔒 Lock</button></div>
    </section>${footer()}`;
  }
  function unlock() {
    const v = parseInt(($("#fxGate") || {}).value, 10);
    if (gate && v === gate.a * gate.b) { sessionStorage.setItem("chiedza_parent_ok", "1"); gate = null; renderParent($("#app")); }
    else { gate = null; if (window.showToast) showToast("Not quite. Ask a grown-up!"); renderParent($("#app")); }
  }
  function lock() { sessionStorage.removeItem("chiedza_parent_ok"); go("#/progress"); }
  function setGoal(v) { fx.goal = Math.max(1, Math.min(20, parseInt(v, 10) || 3)); save(); renderParent($("#app")); }

  /* ---------- Home cards ---------- */
  function homeCards() {
    const d = day(), pct = Math.min(100, Math.round(d.act / fx.goal * 100)), n = weakList().length, wk = weekKey();
    const best = LEVELS.map(l => fx.weekly[wk + "/" + l.id]).filter(Boolean).sort((a, b) => b.score - a.score)[0];
    return `<section class="section"><div class="section-head"><h2>🌟 Today</h2></div><div class="fx-grid">
      <div class="fx-card fx-goal"><div class="fx-ring" style="--p:${pct}"><span>${Math.min(d.act, fx.goal)}/${fx.goal}</span></div><div><h3>Daily goal</h3><p class="muted">${d.act >= fx.goal ? "Goal reached! 🎉" : (fx.goal - d.act) + " more to go. Finish a lesson, quiz or game."}</p></div></div>
      <div class="fx-card fx-link" onclick="go('#/revise')"><div class="fx-ico">🔁</div><div><h3>Revise</h3><p class="muted">${n ? n + " question" + (n === 1 ? "" : "s") + " waiting for you" : "No mistakes to fix. Great!"}</p></div></div>
      <div class="fx-card fx-link" onclick="go('#/practice')"><div class="fx-ico">📝</div><div><h3>Practice paper</h3><p class="muted">Exam-style questions with a timer</p></div></div>
      <div class="fx-card fx-link" onclick="go('#/explore')"><div class="fx-ico">🌍</div><div><h3>Explore the web</h3><p class="muted">Google, YouTube and more, with a grown-up check</p></div></div>
      <div class="fx-card fx-link" onclick="go('#/weekly')"><div class="fx-ico">🏆</div><div><h3>Weekly challenge</h3><p class="muted">${best ? "Your best: " + best.score + "/" + best.total : "10 new questions every week"}</p></div></div>
    </div></section>`;
  }
  function goalChip() { const d = day(); return `<div class="fx-card fx-goal" style="margin:14px 0"><div class="fx-ring" style="--p:${Math.min(100, Math.round(d.act / fx.goal * 100))}"><span>${Math.min(d.act, fx.goal)}/${fx.goal}</span></div><div><h3>Today's goal</h3><p class="muted">${d.act >= fx.goal ? "Reached! 🎉" : (fx.goal - d.act) + " more activities to go"}</p></div></div>`; }

  /* ---------- router + public API ---------- */
  function route(root, a, b, c, app) {
    if (root === "revise") { renderRevise(app); return true; }
    if (root === "practice") { renderPractice(app); return true; }
    if (root === "weekly") { renderWeekly(app); return true; }
    if (root === "parent") { renderParent(app); return true; }
    if (root === "explore" && window.FXExplore) {
      FXExplore.load().then(() => { if (location.hash === "#/explore") FXExplore.render($("#app")); });
      FXExplore.render(app); return true;
    }
    return false;
  }

  window.FX = {
    route, homeCards, goalChip, quizTools, hintBox, hint, readQuestion, speak,
    onQuizQuestion, onQuizAnswer, onQuizDone, onLessonDone, onGameDone, logActivity,
    pick, next, again, exit, start, finish,
    startRevise, startPractice, startWeekly, setup: setSetup, unlock, lock, setGoal,
    data: () => fx, weakList, weakTopics, dayKey, weekKey, shuffle, rngSeed, questionsFor,
    goal: () => fx.goal, setGoalValue: v => { fx.goal = v; save(); },
    today: () => day()
  };
})();
