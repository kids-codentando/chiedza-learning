/* ============================================================
   KIDS FLIX — App logic
   Created by Ntandomods
   ============================================================ */

/* ---------------- STATE ---------------- */
const STORE_KEY = "kidsflix_state_v1";

const defaultState = {
  profile: { name: "", avatar: "🦁" },
  completedLessons: {},   // "levelId/subjectId/lessonIdx" -> true
  quizScores: {},         // "levelId/subjectId/lessonIdx" -> {score, total}
  coursesProgress: {},    // courseId -> {completedModules:[], assessmentScore, passed, certificateId, certificateDate}
  badges: {},             // badgeId -> true
  streak: { count: 1, lastDate: new Date().toDateString() },
  levelsTried: {},        // levelId -> true
  gamesWon: 0,
  quizzesPassed: 0
};

let state = loadState();

function loadState() {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (raw) return Object.assign({}, defaultState, JSON.parse(raw));
  } catch (e) { console.warn("state load error", e); }
  return JSON.parse(JSON.stringify(defaultState));
}
function saveState() {
  try { localStorage.setItem(STORE_KEY, JSON.stringify(state)); } catch (e) {}
}
function updateStreak() {
  const today = new Date().toDateString();
  if (state.streak.lastDate !== today) {
    const y = new Date(Date.now() - 86400000).toDateString();
    state.streak.count = (state.streak.lastDate === y) ? state.streak.count + 1 : 1;
    state.streak.lastDate = today;
    saveState();
  }
}

/* ---------------- BADGES ---------------- */
function awardBadge(id) {
  if (state.badges[id]) return;
  state.badges[id] = true;
  saveState();
  const b = BADGES.find(x => x.id === id);
  if (b) showToast(`${b.emoji} Badge earned: ${b.name}!`);
}
function checkBadges() {
  if (Object.keys(state.completedLessons).length >= 1) awardBadge("first-step");
  if (state.quizzesPassed >= 5) awardBadge("quiz-whiz");
  if (Object.keys(state.levelsTried).length >= 4) awardBadge("explorer");
  if (state.gamesWon >= 1) awardBadge("gamer");
  if (state.streak.count >= 3) awardBadge("streak");
  Object.keys(state.coursesProgress).forEach(cid => {
    const cp = state.coursesProgress[cid];
    if (cp && cp.passed) { awardBadge("course-grad"); awardBadge("certified"); }
  });
}

/* ---------------- HELPERS ---------------- */
function $(sel, root = document) { return root.querySelector(sel); }
function $$(sel, root = document) { return Array.from(root.querySelectorAll(sel)); }
function esc(s) { return String(s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c])); }

function showToast(msg) {
  const t = document.createElement("div");
  t.className = "toast";
  t.innerHTML = msg;
  document.body.appendChild(t);
  setTimeout(() => { t.style.transition = "opacity .4s"; t.style.opacity = "0"; setTimeout(() => t.remove(), 400); }, 2600);
}

function progressForSubject(levelId, subject) {
  let done = 0;
  subject.lessons.forEach((_, i) => { if (state.completedLessons[`${levelId}/${subject.id}/${i}`]) done++; });
  return { done, total: subject.lessons.length, pct: Math.round((done / subject.lessons.length) * 100) };
}
function progressForLevel(level) {
  let done = 0, total = 0;
  level.subjects.forEach(s => { total += s.lessons.length; s.lessons.forEach((_, i) => { if (state.completedLessons[`${level.id}/${s.id}/${i}`]) done++; }); });
  return { done, total, pct: total ? Math.round((done / total) * 100) : 0 };
}

/* ---------------- ROUTER ---------------- */
function go(hash) { window.location.hash = hash; }
function parseHash() {
  const h = window.location.hash.replace(/^#\/?/, "");
  return h.split("/").filter(Boolean);
}

function render() {
  const parts = parseHash();
  const app = $("#app");
  window.scrollTo(0, 0);

  if (parts.length === 0) return renderHome(app);
  const [root, a, b, c] = parts;

  if (root === "level") return renderLevel(app, a);
  if (root === "subject") return renderSubject(app, a, b);
  if (root === "lesson") return renderLesson(app, a, b, c);
  if (root === "quiz") return renderQuiz(app, a, b, c);
  if (root === "courses") return renderCourses(app);
  if (root === "course") return renderCourse(app, a);
  if (root === "assessment") return renderAssessment(app, a);
  if (root === "certificate") return renderCertificate(app, a);
  if (root === "games") return renderGames(app);
  if (root === "game") return renderGame(app, a);
  if (root === "progress") return renderProgress(app);
  if (root === "about") return renderAbout(app);
  return renderHome(app);
}

/* ---------------- TOPBAR ---------------- */
function topbar(active) {
  const navItems = [
    ["home", "Home", "#/"],
    ["levels", "Levels", "#/level/ecd"],
    ["courses", "Free Courses", "#/courses"],
    ["games", "Games", "#/games"],
    ["progress", "My Progress", "#/progress"]
  ];
  const links = navItems.map(([id, label, href]) =>
    `<button class="${active === id ? "active" : ""}" onclick="go('${href}')">${label}</button>`
  ).join("");
  return `
  <header class="topbar">
    <div class="logo" onclick="go('#/')">
      <span class="bird">🦅</span>
      <span>Kids<span class="flix">Flix</span></span>
    </div>
    <nav class="topbar-nav">${links}</nav>
    <div class="topbar-right">
      <div class="streak-chip" title="Daily learning streak"><span class="fire">🔥</span>${state.streak.count}</div>
      <div class="avatar-mini" onclick="go('#/progress')" title="My profile">${state.profile.avatar || "🦁"}</div>
    </div>
  </header>`;
}

function footer() {
  return `
  <footer class="footer">
    <div class="flags">🇿🇼 🦅 🌿</div>
    <div>Kids Flix — Learning for Zimbabwean children, ECD to O-Level.</div>
    <div class="made-by">Created with ❤️ by <b>Ntandomods</b></div>
  </footer>`;
}

/* ---------------- HOME ---------------- */
function renderHome(app) {
  updateStreak();
  checkBadges();
  const levelCards = LEVELS.map(lv => {
    const p = progressForLevel(lv);
    const subjCount = lv.subjects.length;
    return `
    <div class="level-card ${lv.cls}" onclick="go('#/level/${lv.id}')">
      <div class="go">→</div>
      <div class="emoji-big">${lv.emoji}</div>
      <h3>${lv.name}</h3>
      <div class="ages">${lv.ages}</div>
      <div class="subj-count">${subjCount} subjects · ${p.total} lessons</div>
      <div class="progress-bar" style="margin-top:12px"><span style="width:${p.pct}%"></span></div>
    </div>`;
  }).join("");

  const courseCards = COURSES.slice(0, 6).map(c => courseCard(c)).join("");

  app.innerHTML = `
  ${topbar("home")}
  <section class="hero">
    <div class="hero-banner">
      <div class="hero-badge">🇿🇼 Made for Zimbabwe · ECD → O-Level</div>
      <h1>Learn, play and grow with <span class="grad">Kids Flix</span></h1>
      <p>The fun learning home for every Zimbabwean child. Explore lessons, ace quizzes, take free courses and earn real certificates — all in one place.</p>
      <div class="hero-actions">
        <button class="btn btn-primary btn-lg" onclick="startLearning()">▶ Start Learning</button>
        <button class="btn btn-ghost btn-lg" onclick="go('#/courses')">🎓 Free Courses</button>
      </div>
      <div class="hero-stats">
        <div class="hero-stat"><div class="num">${LEVELS.reduce((a, l) => a + l.subjects.reduce((x, s) => x + s.lessons.length, 0), 0)}+</div><div class="lbl">Lessons</div></div>
        <div class="hero-stat"><div class="num">${LEVELS.reduce((a, l) => a + l.subjects.length, 0)}</div><div class="lbl">Subjects</div></div>
        <div class="hero-stat"><div class="num">${COURSES.length}</div><div class="lbl">Free Courses</div></div>
        <div class="hero-stat"><div class="num">4</div><div class="lbl">Levels</div></div>
      </div>
    </div>
  </section>

  <section class="section">
    <div class="section-head"><h2>🎯 Choose Your Level</h2></div>
    <div class="level-grid">${levelCards}</div>
  </section>

  <section class="section">
    <div class="section-head">
      <h2>🎓 Free Courses with Certificates</h2>
      <span class="see-all" onclick="go('#/courses')">See all →</span>
    </div>
    <div class="row-scroll">${courseCards}</div>
  </section>

  <section class="section">
    <div class="section-head"><h2>🎮 Play & Learn</h2><span class="see-all" onclick="go('#/games')">See all →</span></div>
    <div class="game-grid">
      ${GAMES.map(g => `<div class="game-card" onclick="go('#/game/${g.id}')"><div class="g-emoji">${g.emoji}</div><h4>${g.title}</h4><p>${g.desc}</p></div>`).join("")}
    </div>
  </section>

  <section class="section">
    <div class="section-head"><h2>🏅 Earn Badges</h2><span class="see-all" onclick="go('#/progress')">My progress →</span></div>
    <div class="badge-grid">
      ${BADGES.map(b => `<div class="badge ${state.badges[b.id] ? "earned" : ""}"><div class="b-emoji">${b.emoji}</div><div class="b-name">${b.name}</div><div class="b-desc">${b.desc}</div></div>`).join("")}
    </div>
  </section>

  ${footer()}`;
}

function startLearning() {
  if (!state.profile.name) { openNameModal(); return; }
  go("#/level/ecd");
}

function courseCard(c) {
  const cp = state.coursesProgress[c.id] || {};
  const pct = cp.passed ? 100 : Math.round(((cp.completedModules || []).length / c.modules.length) * 100);
  return `
  <div class="card" onclick="go('#/course/${c.id}')">
    <div class="card-thumb" style="background:linear-gradient(140deg, ${c.color}, #12151d)">
      <span>${c.emoji}</span>
      <span class="play-ov">▶</span>
    </div>
    <div class="card-body">
      <h4>${c.title}</h4>
      <div class="desc">${c.desc}</div>
      <div class="card-meta">
        <span class="pill gold">🎓 Certificate</span>
        <span class="pill">${c.duration}</span>
      </div>
      <div class="progress-bar"><span style="width:${pct}%"></span></div>
    </div>
  </div>`;
}

/* ---------------- LEVEL PAGE ---------------- */
function renderLevel(app, levelId) {
  const lv = LEVELS.find(l => l.id === levelId);
  if (!lv) { go("#/"); return; }
  state.levelsTried[lv.id] = true; saveState(); checkBadges();
  const p = progressForLevel(lv);

  const subjects = lv.subjects.map(s => {
    const sp = progressForSubject(lv.id, s);
    return `
    <div class="subject-card" onclick="go('#/subject/${lv.id}/${s.id}')">
      <div class="ico" style="background:${s.color}22;color:${s.color}">${s.emoji}</div>
      <h4>${s.name}</h4>
      <div class="cnt">${sp.total} lessons · ${sp.done} done</div>
      <div class="mini-prog progress-bar"><span style="width:${sp.pct}%"></span></div>
    </div>`;
  }).join("");

  app.innerHTML = `
  ${topbar("levels")}
  <div class="page-head">
    <button class="back-btn" onclick="go('#/')">←</button>
    <div class="titles">
      <h1>${lv.emoji} ${lv.fullName} <span class="muted" style="font-size:16px">(${lv.ages})</span></h1>
      <p>${lv.tagline}</p>
    </div>
  </div>
  <section class="section">
    <div class="section-head">
      <h2>📚 Subjects</h2>
      <span class="muted">${p.done}/${p.total} lessons complete</span>
    </div>
    <div class="subject-grid">${subjects}</div>
  </section>
  ${footer()}`;
}

/* ---------------- SUBJECT PAGE ---------------- */
function renderSubject(app, levelId, subjectId) {
  const lv = LEVELS.find(l => l.id === levelId);
  const s = lv && lv.subjects.find(x => x.id === subjectId);
  if (!s) { go("#/"); return; }
  const sp = progressForSubject(lv.id, s);

  const lessons = s.lessons.map((les, i) => {
    const done = state.completedLessons[`${lv.id}/${s.id}/${i}`];
    const score = state.quizScores[`${lv.id}/${s.id}/${i}`];
    return `
    <div class="card" onclick="go('#/lesson/${lv.id}/${s.id}/${i}')">
      <div class="card-thumb" style="background:linear-gradient(140deg, ${s.color}, #12151d)">
        <span>${les.emoji}</span>
        <span class="play-ov">▶</span>
      </div>
      <div class="card-body">
        <div class="card-meta">
          <span class="pill">Lesson ${i + 1}</span>
          ${done ? `<span class="pill green">✓ Done</span>` : ""}
          ${score ? `<span class="pill gold">Quiz ${score.score}/${score.total}</span>` : ""}
        </div>
        <h4>${les.title}</h4>
        <div class="desc">${les.kicker}</div>
      </div>
    </div>`;
  }).join("");

  app.innerHTML = `
  ${topbar("levels")}
  <div class="page-head">
    <button class="back-btn" onclick="go('#/level/${lv.id}')">←</button>
    <div class="titles">
      <h1>${s.emoji} ${s.name}</h1>
      <p>${lv.name} · ${s.desc}</p>
    </div>
  </div>
  <section class="section">
    <div class="section-head"><h2>Lessons</h2><span class="muted">${sp.done}/${sp.total} complete</span></div>
    <div class="row-scroll">${lessons}</div>
  </section>
  ${footer()}`;
}

/* ---------------- LESSON PLAYER ---------------- */
function renderLesson(app, levelId, subjectId, idx) {
  idx = parseInt(idx, 10);
  const lv = LEVELS.find(l => l.id === levelId);
  const s = lv && lv.subjects.find(x => x.id === subjectId);
  const les = s && s.lessons[idx];
  if (!les) { go("#/"); return; }

  app.innerHTML = `
  ${topbar("levels")}
  <div class="lesson-wrap">
    <div class="flex gap wrap" style="align-items:center;margin-bottom:14px">
      <button class="back-btn" onclick="go('#/subject/${lv.id}/${s.id}')">←</button>
      <span class="muted" style="font-weight:800">${lv.name} · ${s.name}</span>
    </div>
    <div class="lesson-stage">
      <div class="lesson-visual" style="background:linear-gradient(140deg, ${s.color}33, #232838)">
        <span class="big-emoji">${les.emoji}</span>
      </div>
      <div class="lesson-content">
        <div class="kicker">${les.kicker} · Lesson ${idx + 1} of ${s.lessons.length}</div>
        <h1>${les.title}</h1>
        <div class="body-text">${les.body}</div>
        ${les.keyFact ? `<div class="key-fact"><span class="label">💡 Key Fact</span>${les.keyFact}</div>` : ""}
      </div>
      <div class="lesson-nav">
        <div class="lesson-dots">
          ${s.lessons.map((_, i) => `<i class="${i === idx ? "on" : ""}"></i>`).join("")}
        </div>
        <div class="flex gap">
          ${idx > 0 ? `<button class="btn btn-ghost" onclick="go('#/lesson/${lv.id}/${s.id}/${idx - 1}')">← Previous</button>` : ""}
          <button class="btn btn-primary" onclick="completeLesson('${lv.id}','${s.id}',${idx})">Take Quiz →</button>
        </div>
      </div>
    </div>
  </div>
  ${footer()}`;
}

function completeLesson(levelId, subjectId, idx) {
  state.completedLessons[`${levelId}/${subjectId}/${idx}`] = true;
  // subject-specific badge
  if (subjectId.includes("shona")) awardBadge("shona-star");
  if (subjectId.includes("science")) awardBadge("science-ace");
  saveState(); checkBadges();
  go(`#/quiz/${levelId}/${subjectId}/${idx}`);
}

/* ---------------- QUIZ ---------------- */
let quizCtx = null;

function renderQuiz(app, levelId, subjectId, idx) {
  idx = parseInt(idx, 10);
  const lv = LEVELS.find(l => l.id === levelId);
  const s = lv && lv.subjects.find(x => x.id === subjectId);
  const les = s && s.lessons[idx];
  if (!les) { go("#/"); return; }

  quizCtx = { questions: les.quiz, i: 0, score: 0, levelId, subjectId, idx, title: les.title, back: `#/subject/${levelId}/${subjectId}` };
  renderQuizQuestion(app);
}

function renderQuizQuestion(app) {
  const q = quizCtx.questions[quizCtx.i];
  const total = quizCtx.questions.length;
  const pct = Math.round((quizCtx.i / total) * 100);
  const letters = ["A", "B", "C", "D"];

  app.innerHTML = `
  ${topbar("levels")}
  <div class="quiz-wrap">
    <div class="quiz-head">
      <button class="back-btn" onclick="go('${quizCtx.back}')">←</button>
      <div class="quiz-progress"><div class="progress-bar"><span style="width:${pct}%"></span></div></div>
      <div class="quiz-count">${quizCtx.i + 1} / ${total}</div>
    </div>
    <div class="quiz-card">
      <div class="kicker" style="color:var(--brand);font-weight:800;font-size:13px;text-transform:uppercase;letter-spacing:.08em">Quiz · ${esc(quizCtx.title)}</div>
      <div class="quiz-q">${esc(q.q)}</div>
      <div class="quiz-hint">Choose the correct answer</div>
      <div class="quiz-options" id="quizOptions">
        ${q.options.map((o, i) => `<button class="opt" data-i="${i}" onclick="answerQuiz(${i})"><span class="letter">${letters[i]}</span>${esc(o)}</button>`).join("")}
      </div>
      <div class="quiz-feedback" id="quizFeedback"></div>
      <div class="quiz-actions">
        <button class="btn btn-primary hidden" id="nextBtn" onclick="nextQuiz()">Next →</button>
      </div>
    </div>
  </div>
  ${footer()}`;
}

function answerQuiz(choice) {
  const q = quizCtx.questions[quizCtx.i];
  const opts = $$("#quizOptions .opt");
  const fb = $("#quizFeedback");
  opts.forEach((b, i) => {
    b.disabled = true;
    if (i === q.answer) b.classList.add("correct");
    if (i === choice && i !== q.answer) b.classList.add("wrong");
  });
  const correct = choice === q.answer;
  if (correct) quizCtx.score++;
  fb.className = "quiz-feedback show " + (correct ? "ok" : "no");
  fb.innerHTML = correct
    ? `✅ <strong>Correct!</strong> Well done.`
    : `❌ <strong>Not quite.</strong> The correct answer is <strong>${esc(q.options[q.answer])}</strong>.`;
  $("#nextBtn").classList.remove("hidden");
}

function nextQuiz() {
  quizCtx.i++;
  if (quizCtx.i >= quizCtx.questions.length) return finishQuiz();
  renderQuizQuestion($("#app"));
}

function finishQuiz() {
  const { score, questions, levelId, subjectId, idx } = quizCtx;
  const total = questions.length;
  const pct = Math.round((score / total) * 100);
  const key = `${levelId}/${subjectId}/${idx}`;
  const prev = state.quizScores[key];
  if (!prev || score > prev.score) state.quizScores[key] = { score, total };
  if (pct >= 60) state.quizzesPassed++;
  if (pct === 100) awardBadge("perfect");
  state.completedLessons[key] = true;
  saveState(); checkBadges();

  const emoji = pct === 100 ? "🏆" : pct >= 60 ? "🎉" : "💪";
  const msg = pct === 100 ? "Perfect score! You are a superstar!" : pct >= 60 ? "Great job! You passed the quiz." : "Good try! Review the lesson and try again.";

  $("#app").innerHTML = `
  ${topbar("levels")}
  <div class="result-wrap">
    <div class="result-card">
      <div class="result-emoji">${emoji}</div>
      <h1>Quiz Complete</h1>
      <div class="score-big">${score}/${total}</div>
      <div class="msg">${msg}</div>
      <div class="result-actions">
        <button class="btn btn-ghost" onclick="go('${quizCtx.back}')">← Back to Lessons</button>
        <button class="btn btn-primary" onclick="go('#/quiz/${levelId}/${subjectId}/${idx}')">🔁 Retry Quiz</button>
      </div>
    </div>
  </div>
  ${footer()}`;
}

/* ---------------- COURSES ---------------- */
function renderCourses(app) {
  app.innerHTML = `
  ${topbar("courses")}
  <div class="page-head">
    <button class="back-btn" onclick="go('#/')">←</button>
    <div class="titles">
      <h1>🎓 Free Courses</h1>
      <p>Learn new skills, complete the assessment and earn a certificate — 100% free.</p>
    </div>
  </div>
  <section class="section">
    <div class="subject-grid">
      ${COURSES.map(c => {
        const cp = state.coursesProgress[c.id] || {};
        const pct = cp.passed ? 100 : Math.round(((cp.completedModules || []).length / c.modules.length) * 100);
        return `
        <div class="subject-card" onclick="go('#/course/${c.id}')">
          <div class="ico" style="background:${c.color}22;color:${c.color}">${c.emoji}</div>
          <h4>${c.title}</h4>
          <div class="cnt">${c.modules.length} modules · ${c.duration} · ${c.level}</div>
          <div class="card-meta" style="margin-top:10px">
            <span class="pill gold">🎓 Certificate</span>
            ${cp.passed ? `<span class="pill green">✓ Completed</span>` : ""}
          </div>
          <div class="mini-prog progress-bar"><span style="width:${pct}%"></span></div>
        </div>`;
      }).join("")}
    </div>
  </section>
  ${footer()}`;
}

function renderCourse(app, courseId) {
  const c = COURSES.find(x => x.id === courseId);
  if (!c) { go("#/courses"); return; }
  const cp = state.coursesProgress[c.id] || { completedModules: [] };
  const done = cp.completedModules || [];
  const allDone = done.length >= c.modules.length;

  const modules = c.modules.map((m, i) => {
    const isDone = done.includes(i);
    return `
    <div class="card" style="flex:0 0 280px" onclick="openModule('${c.id}',${i})">
      <div class="card-thumb" style="background:linear-gradient(140deg, ${c.color}, #12151d);height:120px">
        <span style="font-size:44px">${m.emoji}</span>
        <span class="play-ov">▶</span>
      </div>
      <div class="card-body">
        <div class="card-meta"><span class="pill">Module ${i + 1}</span>${isDone ? `<span class="pill green">✓ Done</span>` : ""}</div>
        <h4>${m.title}</h4>
      </div>
    </div>`;
  }).join("");

  app.innerHTML = `
  ${topbar("courses")}
  <div class="page-head">
    <button class="back-btn" onclick="go('#/courses')">←</button>
    <div class="titles">
      <h1>${c.emoji} ${c.title}</h1>
      <p>${c.desc}</p>
    </div>
  </div>
  <section class="section">
    <div class="card-meta mb-2">
      <span class="pill">${c.level}</span>
      <span class="pill">${c.duration}</span>
      <span class="pill gold">🎓 Free Certificate</span>
      <span class="pill blue">${done.length}/${c.modules.length} modules</span>
    </div>
    <div class="section-head"><h2>📦 Modules</h2></div>
    <div class="row-scroll">${modules}</div>
  </section>
  <section class="section">
    <div class="section-head"><h2>📝 Final Assessment</h2></div>
    <div class="subject-card" style="max-width:640px" onclick="go('#/assessment/${c.id}')">
      <div class="ico" style="background:#FFD20022;color:#FFD200">📝</div>
      <h4>Assessment Form</h4>
      <div class="cnt">${c.assessment.length} questions · Pass mark 70% · Earns your certificate</div>
      ${!allDone ? `<div class="cnt" style="color:#FFB300;margin-top:8px">💡 Complete all modules first for the best result.</div>` : `<div class="cnt" style="color:#4ade80;margin-top:8px">✓ All modules complete — you are ready!</div>`}
    </div>
  </section>
  ${footer()}`;
}

function openModule(courseId, i) {
  const c = COURSES.find(x => x.id === courseId);
  const m = c.modules[i];
  const overlay = document.createElement("div");
  overlay.className = "modal-overlay";
  overlay.innerHTML = `
    <div class="modal">
      <div class="kicker" style="color:var(--brand);font-weight:800;font-size:13px;text-transform:uppercase;letter-spacing:.08em">Module ${i + 1} of ${c.modules.length}</div>
      <h2>${m.emoji} ${m.title}</h2>
      <div class="body-text" style="margin:14px 0">${m.body}</div>
      <div class="flex gap wrap" style="justify-content:flex-end">
        <button class="btn btn-ghost" onclick="closeModal()">Close</button>
        <button class="btn btn-primary" onclick="completeModule('${courseId}',${i})">✓ Mark Complete</button>
      </div>
    </div>`;
  overlay.addEventListener("click", e => { if (e.target === overlay) closeModal(); });
  document.body.appendChild(overlay);
}
function closeModal() { const o = $(".modal-overlay"); if (o) o.remove(); }

function completeModule(courseId, i) {
  const cp = state.coursesProgress[courseId] || { completedModules: [] };
  cp.completedModules = cp.completedModules || [];
  if (!cp.completedModules.includes(i)) cp.completedModules.push(i);
  state.coursesProgress[courseId] = cp;
  saveState();
  closeModal();
  showToast("✅ Module complete!");
  renderCourse($("#app"), courseId);
}

/* ---------------- ASSESSMENT ---------------- */
let assessCtx = null;

function renderAssessment(app, courseId) {
  const c = COURSES.find(x => x.id === courseId);
  if (!c) { go("#/courses"); return; }
  assessCtx = { courseId, i: 0, score: 0, answers: [] };
  renderAssessQuestion(app);
}

function renderAssessQuestion(app) {
  const c = COURSES.find(x => x.id === assessCtx.courseId);
  const q = c.assessment[assessCtx.i];
  const total = c.assessment.length;
  const pct = Math.round((assessCtx.i / total) * 100);
  const letters = ["A", "B", "C", "D"];

  app.innerHTML = `
  ${topbar("courses")}
  <div class="quiz-wrap">
    <div class="quiz-head">
      <button class="back-btn" onclick="go('#/course/${c.id}')">←</button>
      <div class="quiz-progress"><div class="progress-bar"><span style="width:${pct}%"></span></div></div>
      <div class="quiz-count">${assessCtx.i + 1} / ${total}</div>
    </div>
    <div class="quiz-card">
      <div class="kicker" style="color:#FFD200;font-weight:800;font-size:13px;text-transform:uppercase;letter-spacing:.08em">📝 ${esc(c.title)} · Assessment</div>
      <div class="quiz-q">${esc(q.q)}</div>
      <div class="quiz-hint">Select one answer</div>
      <div class="quiz-options" id="assessOptions">
        ${q.options.map((o, i) => `<button class="opt" data-i="${i}" onclick="answerAssess(${i})"><span class="letter">${letters[i]}</span>${esc(o)}</button>`).join("")}
      </div>
      <div class="quiz-feedback" id="assessFeedback"></div>
      <div class="quiz-actions"><button class="btn btn-primary hidden" id="assessNext" onclick="nextAssess()">Next →</button></div>
    </div>
  </div>
  ${footer()}`;
}

function answerAssess(choice) {
  const c = COURSES.find(x => x.id === assessCtx.courseId);
  const q = c.assessment[assessCtx.i];
  const opts = $$("#assessOptions .opt");
  const fb = $("#assessFeedback");
  opts.forEach((b, i) => {
    b.disabled = true;
    if (i === q.answer) b.classList.add("correct");
    if (i === choice && i !== q.answer) b.classList.add("wrong");
  });
  const correct = choice === q.answer;
  if (correct) assessCtx.score++;
  assessCtx.answers.push(choice);
  fb.className = "quiz-feedback show " + (correct ? "ok" : "no");
  fb.innerHTML = correct ? `✅ Correct!` : `❌ The correct answer is <strong>${esc(q.options[q.answer])}</strong>.`;
  $("#assessNext").classList.remove("hidden");
}

function nextAssess() {
  const c = COURSES.find(x => x.id === assessCtx.courseId);
  assessCtx.i++;
  if (assessCtx.i >= c.assessment.length) return finishAssess();
  renderAssessQuestion($("#app"));
}

function finishAssess() {
  const c = COURSES.find(x => x.id === assessCtx.courseId);
  const total = c.assessment.length;
  const score = assessCtx.score;
  const pct = Math.round((score / total) * 100);
  const passed = pct >= 70;

  const cp = state.coursesProgress[c.id] || { completedModules: [] };
  cp.assessmentScore = score;
  cp.assessmentTotal = total;
  cp.passed = passed;
  if (passed && !cp.certificateId) {
    cp.certificateId = generateCertId(c.id);
    cp.certificateDate = new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
  }
  state.coursesProgress[c.id] = cp;
  saveState(); checkBadges();

  // send to server (best-effort, works when deployed on Render)
  submitAssessment(c.id, score, total, passed);

  const emoji = passed ? "🎓" : "💪";
  $("#app").innerHTML = `
  ${topbar("courses")}
  <div class="result-wrap">
    <div class="result-card">
      <div class="result-emoji">${emoji}</div>
      <h1>${passed ? "You Passed!" : "Keep Trying!"}</h1>
      <div class="score-big">${pct}%</div>
      <div class="msg">${passed ? "Congratulations! You have earned your certificate." : "You need 70% to pass. Review the modules and try again — you can do it!"}</div>
      <div class="result-actions">
        ${passed ? `<button class="btn btn-green btn-lg" onclick="go('#/certificate/${c.id}')">🎓 View Certificate</button>` : ""}
        <button class="btn btn-ghost" onclick="go('#/course/${c.id}')">← Back to Course</button>
        <button class="btn btn-primary" onclick="go('#/assessment/${c.id}')">🔁 Retry</button>
      </div>
    </div>
  </div>
  ${footer()}`;
}

function generateCertId(courseId) {
  const rand = Math.random().toString(36).slice(2, 8).toUpperCase();
  const yr = new Date().getFullYear();
  return `KF-${yr}-${rand}`;
}

function submitAssessment(courseId, score, total, passed) {
  try {
    fetch("/api/assessments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ courseId, score, total, passed, name: state.profile.name || "Learner" })
    }).catch(() => {});
  } catch (e) {}
}

/* ---------------- CERTIFICATE ---------------- */
function renderCertificate(app, courseId) {
  const c = COURSES.find(x => x.id === courseId);
  const cp = state.coursesProgress[courseId];
  if (!c || !cp || !cp.passed) { go("#/courses"); return; }
  const name = state.profile.name || "Learner";

  app.innerHTML = `
  ${topbar("courses")}
  <div class="quiz-wrap" style="max-width:900px">
    <div class="flex gap wrap" style="align-items:center;justify-content:space-between;margin-bottom:16px">
      <button class="back-btn" onclick="go('#/course/${c.id}')">←</button>
      <div class="flex gap wrap">
        <button class="btn btn-ghost" onclick="openNameModal(true)">✏️ Change Name</button>
        <button class="btn btn-primary" onclick="window.print()">🖨️ Print / Save PDF</button>
      </div>
    </div>

    <div id="certificate" class="cert">
      <div class="cert-inner">
        <div class="cert-seal">🦅</div>
        <div class="cert-brand">Kids<span>Flix</span></div>
        <div class="cert-sub">Zimbabwe · Learning for Life</div>
        <div class="cert-title">Certificate of Completion</div>
        <div class="cert-text">This certificate is proudly presented to</div>
        <div class="cert-name">${esc(name)}</div>
        <div class="cert-text">for successfully completing the course</div>
        <div class="cert-course">${esc(c.title)}</div>
        <div class="cert-meta">
          <div><span>Score</span><strong>${cp.assessmentScore}/${cp.assessmentTotal} (${Math.round((cp.assessmentScore / cp.assessmentTotal) * 100)}%)</strong></div>
          <div><span>Date</span><strong>${cp.certificateDate}</strong></div>
          <div><span>Certificate ID</span><strong>${cp.certificateId}</strong></div>
        </div>
        <div class="cert-foot">
          <div class="cert-sign">
            <div class="sig-line"></div>
            <div>Ntandomods</div>
            <div class="muted" style="font-size:12px">Founder, Kids Flix</div>
          </div>
          <div class="cert-flag">🇿🇼</div>
        </div>
      </div>
    </div>
    <p class="muted center mt-2">Verify this certificate with ID <strong>${cp.certificateId}</strong></p>
  </div>
  ${footer()}`;
}

/* ---------------- GAMES ---------------- */
function renderGames(app) {
  app.innerHTML = `
  ${topbar("games")}
  <div class="page-head">
    <button class="back-btn" onclick="go('#/')">←</button>
    <div class="titles"><h1>🎮 Play & Learn</h1><p>Fun games that make your brain stronger.</p></div>
  </div>
  <section class="section">
    <div class="game-grid">
      ${GAMES.map(g => `<div class="game-card" onclick="go('#/game/${g.id}')"><div class="g-emoji">${g.emoji}</div><h4>${g.title}</h4><p>${g.desc}</p></div>`).join("")}
    </div>
  </section>
  ${footer()}`;
}

function renderGame(app, gameId) {
  if (gameId === "game-memory") return renderMemory(app);
  if (gameId === "game-math") return renderMathGame(app);
  go("#/games");
}

/* Memory game */
let memState = null;
function renderMemory(app) {
  const emojis = ["🦁", "🐘", "🦒", "🦓", "🐆", "🦏", "🐃", "🦅"];
  const deck = [...emojis, ...emojis].sort(() => Math.random() - 0.5);
  memState = { deck, flipped: [], matched: [], moves: 0 };
  drawMemory(app);
}
function drawMemory(app) {
  app.innerHTML = `
  ${topbar("games")}
  <div class="quiz-wrap">
    <div class="flex gap wrap" style="align-items:center;justify-content:space-between;margin-bottom:16px">
      <button class="back-btn" onclick="go('#/games')">←</button>
      <div class="muted" style="font-weight:800">Moves: <span id="memMoves">${memState.moves}</span> · Matched: <span id="memMatched">${memState.matched.length / 2}</span>/8</div>
    </div>
    <div class="memory-board" id="memBoard">
      ${memState.deck.map((e, i) => {
        const isFlipped = memState.flipped.includes(i) || memState.matched.includes(i);
        const isMatched = memState.matched.includes(i);
        return `<div class="mem-tile ${isFlipped ? "flipped" : ""} ${isMatched ? "matched" : ""}" onclick="flipTile(${i})"><span class="face">${isFlipped ? e : ""}</span></div>`;
      }).join("")}
    </div>
    <div class="center mt-2"><button class="btn btn-ghost" onclick="renderMemory($('#app'))">🔄 New Game</button></div>
  </div>
  ${footer()}`;
}
function flipTile(i) {
  if (memState.flipped.length >= 2 || memState.flipped.includes(i) || memState.matched.includes(i)) return;
  memState.flipped.push(i);
  drawMemory($("#app"));
  if (memState.flipped.length === 2) {
    memState.moves++;
    const [a, b] = memState.flipped;
    if (memState.deck[a] === memState.deck[b]) {
      memState.matched.push(a, b);
      memState.flipped = [];
      if (memState.matched.length === memState.deck.length) {
        state.gamesWon++; saveState(); checkBadges();
        setTimeout(() => showToast("🏆 You won Memory Match!"), 300);
      }
      setTimeout(() => drawMemory($("#app")), 500);
    } else {
      setTimeout(() => { memState.flipped = []; drawMemory($("#app")); }, 800);
    }
  }
}

/* Math game */
let mathState = null;
function renderMathGame(app) {
  mathState = { score: 0, round: 1, total: 10 };
  newMathQuestion();
  drawMath(app);
}
function newMathQuestion() {
  const ops = ["+", "−", "×"];
  const op = ops[Math.floor(Math.random() * ops.length)];
  let a, b, ans;
  if (op === "+") { a = rnd(1, 20); b = rnd(1, 20); ans = a + b; }
  else if (op === "−") { a = rnd(5, 20); b = rnd(1, a); ans = a - b; }
  else { a = rnd(2, 9); b = rnd(2, 9); ans = a * b; }
  const choices = new Set([ans]);
  while (choices.size < 4) choices.add(ans + rnd(-6, 6));
  mathState.q = { text: `${a} ${op} ${b}`, ans, choices: [...choices].sort(() => Math.random() - 0.5) };
}
function rnd(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }

function drawMath(app) {
  app.innerHTML = `
  ${topbar("games")}
  <div class="quiz-wrap">
    <div class="flex gap wrap" style="align-items:center;justify-content:space-between;margin-bottom:16px">
      <button class="back-btn" onclick="go('#/games')">←</button>
      <div class="muted" style="font-weight:800">Score: ${mathState.score} · Question ${mathState.round}/${mathState.total}</div>
    </div>
    <div class="quiz-card math-play">
      <div class="quiz-hint">What is the answer?</div>
      <div class="math-question">${mathState.q.text} = ?</div>
      <div class="math-choices" id="mathChoices">
        ${mathState.q.choices.map(c => `<button class="opt" onclick="answerMath(${c})">${c}</button>`).join("")}
      </div>
      <div class="quiz-feedback" id="mathFeedback"></div>
    </div>
  </div>
  ${footer()}`;
}
function answerMath(choice) {
  const fb = $("#mathFeedback");
  const correct = choice === mathState.q.ans;
  if (correct) mathState.score++;
  fb.className = "quiz-feedback show " + (correct ? "ok" : "no");
  fb.innerHTML = correct ? "✅ Correct!" : `❌ The answer was ${mathState.q.ans}.`;
  $$("#mathChoices .opt").forEach(b => b.disabled = true);
  setTimeout(() => {
    mathState.round++;
    if (mathState.round > mathState.total) {
      state.gamesWon++; saveState(); checkBadges();
      $("#app").innerHTML = `
      ${topbar("games")}
      <div class="result-wrap">
        <div class="result-card">
          <div class="result-emoji">⚡</div>
          <h1>Math Blitz Done!</h1>
          <div class="score-big">${mathState.score}/${mathState.total}</div>
          <div class="msg">${mathState.score >= 8 ? "Amazing! You are a maths star!" : "Good work! Keep practising to get faster."}</div>
          <div class="result-actions">
            <button class="btn btn-primary" onclick="renderMathGame($('#app'))">🔁 Play Again</button>
            <button class="btn btn-ghost" onclick="go('#/games')">← Games</button>
          </div>
        </div>
      </div>
      ${footer()}`;
      return;
    }
    newMathQuestion();
    drawMath($("#app"));
  }, 900);
}

/* ---------------- PROGRESS ---------------- */
function renderProgress(app) {
  const totalLessons = LEVELS.reduce((a, l) => a + l.subjects.reduce((x, s) => x + s.lessons.length, 0), 0);
  const doneLessons = Object.keys(state.completedLessons).length;
  const certs = Object.values(state.coursesProgress).filter(c => c && c.passed).length;
  const badgesEarned = Object.keys(state.badges).length;

  app.innerHTML = `
  ${topbar("progress")}
  <div class="profile-wrap">
    <div class="profile-hero">
      <div class="profile-avatar">${state.profile.avatar || "🦁"}</div>
      <div style="flex:1">
        <h1>${state.profile.name ? esc(state.profile.name) : "Welcome, Learner!"}</h1>
        <p>${state.profile.name ? "Keep up the great work!" : "Set your name to personalise your certificates."}</p>
      </div>
      <button class="btn btn-ghost" onclick="openNameModal()">✏️ Edit Profile</button>
    </div>

    <div class="stat-grid">
      <div class="stat-box"><div class="v">${doneLessons}</div><div class="k">Lessons Done</div></div>
      <div class="stat-box"><div class="v">${state.quizzesPassed}</div><div class="k">Quizzes Passed</div></div>
      <div class="stat-box"><div class="v">${certs}</div><div class="k">Certificates</div></div>
      <div class="stat-box"><div class="v">${badgesEarned}/${BADGES.length}</div><div class="k">Badges</div></div>
      <div class="stat-box"><div class="v">🔥 ${state.streak.count}</div><div class="k">Day Streak</div></div>
      <div class="stat-box"><div class="v">${state.gamesWon}</div><div class="k">Games Won</div></div>
    </div>

    <div class="section-head"><h2>📈 Level Progress</h2></div>
    ${LEVELS.map(lv => {
      const p = progressForLevel(lv);
      return `<div class="mb-2">
        <div class="flex" style="justify-content:space-between;font-weight:800"><span>${lv.emoji} ${lv.name}</span><span class="muted">${p.done}/${p.total}</span></div>
        <div class="progress-bar" style="margin-top:6px"><span style="width:${p.pct}%"></span></div>
      </div>`;
    }).join("")}

    <div class="section-head" style="margin-top:24px"><h2>🏅 My Badges</h2></div>
    <div class="badge-grid">
      ${BADGES.map(b => `<div class="badge ${state.badges[b.id] ? "earned" : ""}"><div class="b-emoji">${b.emoji}</div><div class="b-name">${b.name}</div><div class="b-desc">${b.desc}</div></div>`).join("")}
    </div>

    <div class="section-head" style="margin-top:24px"><h2>🎓 My Certificates</h2></div>
    <div class="subject-grid">
      ${COURSES.filter(c => state.coursesProgress[c.id] && state.coursesProgress[c.id].passed).map(c => `
        <div class="subject-card" onclick="go('#/certificate/${c.id}')">
          <div class="ico" style="background:#FFD20022;color:#FFD200">🎓</div>
          <h4>${c.title}</h4>
          <div class="cnt">ID: ${state.coursesProgress[c.id].certificateId}</div>
        </div>`).join("") || `<p class="muted">No certificates yet. Complete a free course to earn one!</p>`}
    </div>

    <div class="center mt-2">
      <button class="btn btn-ghost" onclick="resetProgress()">🗑️ Reset My Progress</button>
    </div>
  </div>
  ${footer()}`;
}

function resetProgress() {
  if (confirm("Are you sure you want to reset all your progress? This cannot be undone.")) {
    localStorage.removeItem(STORE_KEY);
    state = JSON.parse(JSON.stringify(defaultState));
    saveState();
    go("#/");
  }
}

/* ---------------- ABOUT ---------------- */
function renderAbout(app) {
  app.innerHTML = `
  ${topbar("")}
  <div class="profile-wrap">
    <div class="page-head" style="padding-left:0">
      <button class="back-btn" onclick="go('#/')">←</button>
      <div class="titles"><h1>About Kids Flix</h1></div>
    </div>
    <div class="lesson-stage">
      <div class="lesson-content">
        <div class="kicker">🇿🇼 Our Mission</div>
        <h1>Learning made fun for every Zimbabwean child</h1>
        <div class="body-text">
          <p>Kids Flix is a free learning platform built for Zimbabwean children from <strong>ECD (Early Childhood Development)</strong> all the way to <strong>O-Level</strong>. It brings lessons, quizzes, games, free courses and certificates together in one colourful, easy-to-use place.</p>
          <h3>What's inside</h3>
          <ul>
            <li>4 learning levels: ECD, Infant, Junior and O-Level</li>
            <li>Subjects including Mathematics, English, Shona, Ndebele, Science, Social Studies and more</li>
            <li>Interactive quizzes with instant feedback</li>
            <li>Free courses with assessment forms and printable certificates</li>
            <li>Fun games and a badge reward system</li>
          </ul>
          <h3>Built for Zimbabwe</h3>
          <p>Content reflects the Zimbabwean curriculum and culture — from Great Zimbabwe and the liberation struggle to our national symbols, languages and food.</p>
        </div>
        <div class="key-fact"><span class="label">Created by</span>Ntandomods — building tools that help Zimbabwean children learn and grow.</div>
      </div>
    </div>
  </div>
  ${footer()}`;
}

/* ---------------- NAME MODAL ---------------- */
function openNameModal(fromCert) {
  const avatars = ["🦁", "🐘", "🦒", "🦓", "🐆", "🦏", "🐃", "🦅", "🌟", "🚀"];
  const overlay = document.createElement("div");
  overlay.className = "modal-overlay";
  overlay.innerHTML = `
    <div class="modal">
      <h2>👋 Welcome to Kids Flix!</h2>
      <p class="muted" style="margin-bottom:16px">Tell us your name so we can personalise your certificates.</p>
      <label style="font-weight:800;display:block;margin-bottom:6px">Your name</label>
      <input id="nameInput" type="text" placeholder="e.g. Tendai Moyo" value="${esc(state.profile.name)}"
        style="width:100%;padding:14px 16px;border-radius:12px;border:1px solid var(--line);background:var(--surface-2);color:var(--text);font-weight:700;font-size:16px;margin-bottom:16px" />
      <label style="font-weight:800;display:block;margin-bottom:8px">Choose an avatar</label>
      <div class="chip-row" id="avatarRow">
        ${avatars.map(a => `<span class="chip ${state.profile.avatar === a ? "active" : ""}" data-a="${a}" onclick="pickAvatar(this)">${a}</span>`).join("")}
      </div>
      <div class="flex gap" style="justify-content:flex-end;margin-top:10px">
        <button class="btn btn-ghost" onclick="closeModal()">Cancel</button>
        <button class="btn btn-primary" onclick="saveName(${!!fromCert})">Save</button>
      </div>
    </div>`;
  overlay.addEventListener("click", e => { if (e.target === overlay) closeModal(); });
  document.body.appendChild(overlay);
  setTimeout(() => { const n = $("#nameInput"); if (n) n.focus(); }, 100);
}
let pickedAvatar = null;
function pickAvatar(el) {
  $$("#avatarRow .chip").forEach(c => c.classList.remove("active"));
  el.classList.add("active");
  pickedAvatar = el.dataset.a;
}
function saveName(fromCert) {
  const name = ($("#nameInput").value || "").trim();
  state.profile.name = name || state.profile.name;
  if (pickedAvatar) state.profile.avatar = pickedAvatar;
  saveState();
  closeModal();
  pickedAvatar = null;
  showToast("✅ Profile saved!");
  if (fromCert) render(); else render();
}

/* ---------------- INIT ---------------- */
window.addEventListener("hashchange", render);
window.addEventListener("DOMContentLoaded", () => {
  if (!state.profile.name) {
    setTimeout(() => openNameModal(), 600);
  }
  render();
});
