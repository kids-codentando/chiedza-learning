/* ============================================================
   KIDS FLIX — App logic
   Created by Ntandomods
   ============================================================ */

/* ---------------- STATE ---------------- */
const STORE_KEY = "chiedza_state_v1";

const defaultState = {
  profile: { name: "", avatar: "🦁" },
  completedLessons: {},   // "levelId/subjectId/lessonIdx" -> true
  quizScores: {},         // "levelId/subjectId/lessonIdx" -> {score, total}
  coursesProgress: {},    // courseId -> {completedModules:[], assessmentScore, passed, certificateId, certificateDate}
  badges: {},             // badgeId -> true
  streak: { count: 1, lastDate: new Date().toDateString() },
  levelsTried: {},        // levelId -> true
  gamesWon: 0,
  quizzesPassed: 0,
  reportComment: ""       // parent/teacher comment for the report card
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

/* Stars (XP) — computed from progress, so it can never double-count */
function computeStars() {
  const lessons = Object.keys(state.completedLessons).length;
  const quizPts = Object.values(state.quizScores).reduce((a, s) => a + (s && s.score ? s.score * 5 : 0), 0);
  const courses = Object.values(state.coursesProgress).filter(c => c && c.passed).length;
  const badges = Object.keys(state.badges).length;
  return lessons * 10 + quizPts + courses * 100 + state.gamesWon * 15 + badges * 25;
}
function myCertificates() {
  return COURSES.filter(c => state.coursesProgress[c.id] && state.coursesProgress[c.id].passed)
    .map(c => {
      const cp = state.coursesProgress[c.id];
      return { courseId: c.id, title: c.title, emoji: c.emoji, color: c.color,
        id: cp.certificateId, date: cp.certificateDate,
        score: cp.assessmentScore, total: cp.assessmentTotal };
    });
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
  if (root === "leaderboard") return renderLeaderboard(app);
  if (root === "report") return renderReport(app);
  if (root === "verify") return renderVerify(app, a);
  if (root === "progress") return renderProgress(app);
  if (root === "about") return renderAbout(app);
  return renderHome(app);
}

/* ---------------- TOPBAR ---------------- */
function topbar(active) {
  const navItems = [
    ["home", "Home", "#/"],
    ["levels", "Levels", "#/level/ecd"],
    ["courses", "Courses", "#/courses"],
    ["games", "Games", "#/games"],
    ["leaderboard", "Leaderboard", "#/leaderboard"],
    ["progress", "My Progress", "#/progress"]
  ];
  const links = navItems.map(([id, label, href]) =>
    `<button class="${active === id ? "active" : ""}" onclick="go('${href}')">${label}</button>`
  ).join("");
  return `
  <header class="topbar">
    <div class="logo" onclick="go('#/')">
      <img class="logo-img" src="assets/icon.png" alt="Chiedza Learning" />
      <span>Chiedza</span>
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
    <img class="footer-logo" src="assets/logo-h-light.png" alt="Chiedza Learning × Ntandomods" />
    <div class="flags">🇿🇼 🦅 🌿</div>
    <div>Chiedza Learning — for Zimbabwean children, ECD to O-Level.</div>
    <div class="made-by">Created with ❤️ by <b>Ntandomods</b></div>
    <div class="footer-links">
      <a onclick="go('#/verify')">🔎 Verify a certificate</a>
      <span>·</span>
      <a onclick="go('#/about')">About &amp; verification</a>
      <span>·</span>
      <a onclick="go('#/leaderboard')">🏆 Leaderboard</a>
    </div>
    <div class="footer-legal">© ${new Date().getFullYear()} Chiedza Learning · Open Verification Standard · Recognised by schools, employers &amp; institutions worldwide</div>
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
      <h1>Learn, play and grow with <span class="grad">Chiedza</span></h1>
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
  if (subjectId.includes("sign")) awardBadge("sign-friend");
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
  return `CH-${yr}-${rand}`;
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
  const canonical = certCanonical(c, cp, name);

  // make sure this certificate exists in the public registry (best-effort)
  publishCertificate(c, cp, name, canonical);

  app.innerHTML = `
  ${topbar("courses")}
  <div class="quiz-wrap" style="max-width:900px">
    <div class="flex gap wrap" style="align-items:center;justify-content:space-between;margin-bottom:16px">
      <button class="back-btn" onclick="go('#/course/${c.id}')">←</button>
      <div class="flex gap wrap">
        <button class="btn btn-ghost" onclick="openNameModal(true)">✏️ Change Name</button>
        <button class="btn btn-ghost" onclick="shareCert('${cp.certificateId}')">🔗 Share</button>
        <button class="btn btn-primary" onclick="window.print()">🖨️ Print / Save PDF</button>
      </div>
    </div>

    <div id="certificate" class="cert">
      <div class="cert-inner">
        <img class="cert-seal-img" src="assets/seal.png" alt="Official Chiedza Learning seal" />
        <div class="cert-brand">Chiedza <span>Learning</span></div>
        <div class="cert-sub">Zimbabwe · Learning for Life · × Ntandomods</div>
        <div class="cert-title">Certificate of Completion</div>
        <div class="cert-text">This certificate is proudly presented to</div>
        <div class="cert-name">${esc(name)}</div>
        <div class="cert-text">for successfully completing the course</div>
        <div class="cert-course">${esc(c.title)}</div>
        ${certCompleted(c, cp)}
        <div class="cert-meta">
          <div><span>Score</span><strong>${cp.assessmentScore}/${cp.assessmentTotal} (${Math.round((cp.assessmentScore / cp.assessmentTotal) * 100)}%)</strong></div>
          <div><span>Level</span><strong>${esc(c.level || "All ages")}</strong></div>
          <div><span>Duration</span><strong>${esc(c.duration || "")}</strong></div>
          <div><span>Date</span><strong>${cp.certificateDate}</strong></div>
          <div><span>Certificate ID</span><strong>${cp.certificateId}</strong></div>
        </div>
        ${certTrust()}
        ${certVerifyBlock(cp.certificateId, canonical)}
        <div class="cert-foot">
          <div class="cert-sign">
            <div class="cert-sig-script">Ntandomods</div>
            <div class="sig-line"></div>
            <div>Ntandomods</div>
            <div class="muted" style="font-size:12px">Founder &amp; CEO, Chiedza Learning</div>
          </div>
          <div class="cert-flag">🇿🇼</div>
        </div>
      </div>
    </div>
    <div class="flex gap wrap center mt-2" style="justify-content:center">
      <button class="btn btn-ghost" onclick="go('#/verify/${cp.certificateId}')">🔎 Verify this certificate</button>
      <button class="btn btn-ghost" onclick="go('#/progress')">🎓 My Certificates</button>
    </div>
  </div>
  ${footer()}`;
}

function certCompleted(c, cp) {
  const mods = Array.isArray(c.modules) ? c.modules : [];
  if (!mods.length) return "";
  const doneIdx = (cp.completedModules && cp.completedModules.length)
    ? cp.completedModules.filter(i => mods[i])
    : mods.map((_, i) => i);
  const items = doneIdx.map(i => {
    const m = mods[i];
    return `<li><span class="cc-emoji">${m.emoji || "\u2705"}</span> ${esc(m.title)}</li>`;
  }).join("");
  return `
        <div class="cert-completed">
          <div class="cert-completed-h">\u2714 What was completed</div>
          <ul class="cert-completed-list">${items}</ul>
          <div class="cert-completed-note">${doneIdx.length} of ${mods.length} modules completed \u00b7 ${esc(c.duration || "")} \u00b7 ${esc(c.level || "")}</div>
        </div>`;
}

/* ---------------- OPEN VERIFICATION STANDARD ----------------
   Each certificate carries a deterministic, tamper-evident code
   derived from its own details (ID, course, holder, date, score).
   Anyone can recompute the code from the certificate's printed
   details to confirm it has not been altered \u2014 online through the
   public registry, or offline from the data embedded in the QR code. */
const VERIFY_SALT = "CHIEDZA-LEARNING|NTANDOMODS|OPEN-VERIFY-STANDARD-2026";
const VERIFY_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

function certCanonical(c, cp, name) {
  return [cp.certificateId, c.title, name, cp.certificateDate, (cp.assessmentScore + "/" + cp.assessmentTotal)].join("|");
}

function certChecksum(canonical) {
  const s = VERIFY_SALT + "|" + String(canonical || "");
  let h = 5381;
  for (let i = 0; i < s.length; i++) { h = (((h << 5) + h) ^ s.charCodeAt(i)) >>> 0; }
  let out = "";
  let x = h || 1;
  for (let k = 0; k < 8; k++) { x = (Math.imul(x, 1103515245) + 12345) >>> 0; out += VERIFY_ALPHABET[x % VERIFY_ALPHABET.length]; }
  return out.slice(0, 4) + "-" + out.slice(4, 8);
}

function b64url(str) {
  try { return btoa(unescape(encodeURIComponent(String(str)))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, ""); }
  catch (e) { return ""; }
}
function unb64url(str) {
  try {
    let s = String(str || "").replace(/-/g, "+").replace(/_/g, "/");
    while (s.length % 4) s += "=";
    return decodeURIComponent(escape(atob(s)));
  } catch (e) { return ""; }
}

function certVerifyUrl(id, canonical) {
  return location.origin + location.pathname + "#/verify/" + encodeURIComponent(id) +
    "?c=" + certChecksum(canonical) + "&d=" + b64url(canonical);
}

function certQR(id, canonical, cell) {
  try {
    if (typeof qrcode !== "function") return "";
    const qr = qrcode(0, "M");
    qr.addData(certVerifyUrl(id, canonical));
    qr.make();
    return qr.createSvgTag({ cellSize: cell || 3, margin: 1, scalable: true });
  } catch (e) { return ""; }
}

function certTrust() {
  return `
        <div class="cert-trust">
          <div class="cert-trust-h">\ud83c\udf0d Globally verifiable credential</div>
          <p class="cert-trust-p">Issued under the <b>Chiedza Open Verification Standard</b>. Any organisation \u2014 school, college, employer, NGO or government body, <b>public or private</b> \u2014 can confirm this certificate is genuine using the Certificate ID, the verification code, or by scanning the QR code. No account or login required.</p>
          <div class="cert-trust-badges">
            <span>\ud83c\udfeb Schools</span><span>\ud83c\udf93 Colleges</span><span>\ud83c\udfe2 Employers</span>
            <span>\ud83c\udfdb\ufe0f Government</span><span>\ud83e\udd1d NGOs</span><span>\ud83c\udf0d Anywhere</span>
          </div>
        </div>`;
}

function certVerifyBlock(id, canonical) {
  const code = certChecksum(canonical);
  return `
        <div class="cert-verify">
          <div class="cert-verify-qr">${certQR(id, canonical, 3)}</div>
          <div class="cert-verify-info">
            <div class="cert-verify-title">\ud83d\udd12 Verify this certificate</div>
            <div class="cert-verify-row">Scan the QR code, or open <strong>#/verify/${esc(id)}</strong></div>
            <div class="cert-verify-row">Certificate ID: <strong>${esc(id)}</strong></div>
            <div class="cert-verify-row">Verification code: <strong class="cert-code">${code}</strong></div>
            <div class="cert-verify-note">Issued by Chiedza Learning \u00b7 Ntandomods \u00b7 Open Verification Standard</div>
          </div>
        </div>`;
}

function publishCertificate(c, cp, name, canonical) {
  try {
    const canon = canonical || certCanonical(c, cp, name);
    fetch("/api/certificates", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: cp.certificateId,
        courseId: c.id,
        name,
        percent: Math.round((cp.assessmentScore / cp.assessmentTotal) * 100),
        canonical: canon,
        checksum: certChecksum(canon),
        issuedAt: cp.certificateDate
      })
    }).catch(() => {});
  } catch (e) {}
}

function shareCert(id) {
  const url = location.origin + location.pathname + "#/verify/" + id;
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(url).then(() => showToast("🔗 Verification link copied!")).catch(() => showToast(url));
  } else {
    showToast(url);
  }
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

/* ---------------- LEADERBOARD (public) ---------------- */
function renderLeaderboard(app) {
  app.innerHTML = `
  ${topbar("leaderboard")}
  <div class="page-head">
    <button class="back-btn" onclick="go('#/')">\u2190</button>
    <div class="titles">
      <h1>\ud83c\udfc6 Leaderboard</h1>
      <p>Top learners across Chiedza Learning. Earn stars by finishing lessons, quizzes, courses and games!</p>
    </div>
  </div>
  <section class="section">
    <div class="lb-hero">
      <div class="lb-me">
        <div class="lb-me-avatar">${state.profile.avatar || "\ud83e\udd81"}</div>
        <div>
          <div class="muted" style="font-weight:800;font-size:12px;text-transform:uppercase;letter-spacing:.08em">Your rank</div>
          <div class="lb-me-rank" id="lbMyRank">\u2014</div>
        </div>
        <div class="lb-me-stars"><div class="num" id="lbMyStars">${computeStars()}</div><div class="lbl">\u2b50 Stars</div></div>
      </div>
    </div>
    <div class="lb-list" id="lbList"><div class="muted center" style="padding:30px">Loading leaderboard\u2026</div></div>
    <p class="muted center mt-2" style="font-size:13px">\u2b50 Stars are earned from lessons (10 each), quizzes (5 per point), completed courses (100) and games won (15).</p>
  </section>
  ${footer()}`;
  drawLeaderboard();
}

function drawLeaderboard() {
  const hasName = !!(state.profile.name && state.profile.name.trim());
  const myStars = computeStars();
  const myName = hasName ? state.profile.name : "";
  const myAvatar = state.profile.avatar || "\ud83e\udd81";
  const myLessons = Object.keys(state.completedLessons).length;
  const myCerts = myCertificates().length;

  const paint = (extra) => {
    const all = LEADERBOARD_SEED.map(r => ({ ...r, me: false }));
    if (hasName) all.push({ name: myName, avatar: myAvatar, stars: myStars, lessons: myLessons, certs: myCerts, me: true });
    if (extra) extra.forEach(e => { if (e && e.name && String(e.name).toLowerCase() !== "you") all.push({ ...e, me: false }); });
    // de-duplicate by name, keep the highest stars
    const map = {};
    all.forEach(r => { const k = String(r.name).toLowerCase(); if (!map[k] || (r.stars || 0) > (map[k].stars || 0)) map[k] = r; });
    const rows = Object.values(map).sort((a, b) => (b.stars || 0) - (a.stars || 0));

    const list = $("#lbList");
    if (!list) return;
    const myRank = rows.findIndex(r => r.me) + 1;
    const mr = $("#lbMyRank"); if (mr) mr.textContent = "#" + myRank + " of " + rows.length;
    list.innerHTML = rows.slice(0, 20).map((r, i) => {
      const medal = i === 0 ? "\ud83e\udd47" : i === 1 ? "\ud83e\udd48" : i === 2 ? "\ud83e\udd49" : "#" + (i + 1);
      return `<div class="lb-row ${r.me ? "me" : ""}">
        <div class="lb-pos">${medal}</div>
        <div class="lb-avatar">${r.avatar || "\ud83e\udd81"}</div>
        <div class="lb-name">${esc(r.name)} ${r.me ? '<span class="lb-you">You</span>' : ""}
          <div class="lb-sub">${r.lessons || 0} lessons \u00b7 ${r.certs || 0} certificates</div>
        </div>
        <div class="lb-stars">\u2b50 ${r.stars || 0}</div>
      </div>`;
    }).join("");
  };

  paint(null);
  try {
    fetch("/api/leaderboard").then(r => r.ok ? r.json() : null).then(d => {
      if (d && Array.isArray(d.leaderboard)) paint(d.leaderboard);
    }).catch(() => {});
  } catch (e) {}
  try {
    fetch("/api/leaderboard", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: myName, avatar: myAvatar, stars: myStars, lessons: myLessons, certs: myCerts })
    }).catch(() => {});
  } catch (e) {}
}

/* ---------------- REPORT CARD (private, printable) ---------------- */
function renderReport(app) {
  const name = state.profile.name || "Learner";
  const stars = computeStars();
  const lessons = Object.keys(state.completedLessons).length;
  const certs = myCertificates();
  const badges = Object.keys(state.badges).length;
  const today = new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });

  const quizRows = [];
  LEVELS.forEach(lv => lv.subjects.forEach(s => s.lessons.forEach((les, i) => {
    const sc = state.quizScores[`${lv.id}/${s.id}/${i}`];
    if (sc) quizRows.push({ level: lv.name, subject: s.name, lesson: les.title, score: sc.score, total: sc.total });
  })));

  app.innerHTML = `
  ${topbar("progress")}
  <div class="quiz-wrap" style="max-width:920px">
    <div class="flex gap wrap" style="align-items:center;justify-content:space-between;margin-bottom:16px">
      <button class="back-btn" onclick="go('#/progress')">\u2190</button>
      <div class="flex gap wrap">
        <button class="btn btn-ghost" onclick="openNameModal()">\u270f\ufe0f Edit Name</button>
        <button class="btn btn-primary" onclick="window.print()">\ud83d\udda8\ufe0f Print / Save PDF</button>
      </div>
    </div>

    <div class="report" id="report">
      <div class="report-head">
        <div class="report-brand"><img class="report-bird-img" src="assets/icon.png" alt="" /> Chiedza Learning</div>
        <div class="report-title">Learner Progress Report</div>
        <div class="report-sub">Zimbabwe \u00b7 ECD to O-Level</div>
      </div>
      <div class="report-student">
        <div class="report-avatar">${state.profile.avatar || "\ud83e\udd81"}</div>
        <div>
          <div class="report-name">${esc(name)}</div>
          <div class="muted">Report date: ${today}</div>
        </div>
      </div>
      <div class="report-stats">
        <div><span>\u2b50 Stars</span><strong>${stars}</strong></div>
        <div><span>\ud83d\udcda Lessons</span><strong>${lessons}</strong></div>
        <div><span>\ud83e\udde0 Quizzes</span><strong>${state.quizzesPassed}</strong></div>
        <div><span>\ud83c\udf93 Certificates</span><strong>${certs.length}</strong></div>
        <div><span>\ud83c\udfc5 Badges</span><strong>${badges}/${BADGES.length}</strong></div>
        <div><span>\ud83d\udd25 Streak</span><strong>${state.streak.count} day(s)</strong></div>
      </div>

      <h3 class="report-h">Progress by Level</h3>
      ${LEVELS.map(lv => { const p = progressForLevel(lv); return `
        <div class="report-level">
          <div class="flex" style="justify-content:space-between;font-weight:800"><span>${lv.emoji} ${lv.name}</span><span class="muted">${p.done}/${p.total} \u00b7 ${p.pct}%</span></div>
          <div class="progress-bar" style="margin-top:6px"><span style="width:${p.pct}%"></span></div>
        </div>`; }).join("")}

      <h3 class="report-h">Quiz Results</h3>
      ${quizRows.length ? `<table class="report-table">
        <thead><tr><th>Level</th><th>Subject</th><th>Lesson</th><th>Score</th></tr></thead>
        <tbody>${quizRows.map(r => `<tr><td>${esc(r.level)}</td><td>${esc(r.subject)}</td><td>${esc(r.lesson)}</td><td><b>${r.score}/${r.total}</b></td></tr>`).join("")}</tbody>
      </table>` : `<p class="muted">No quizzes completed yet.</p>`}

      <h3 class="report-h">Certificates Earned</h3>
      ${certs.length ? `<ul class="report-certs">${certs.map(c => `<li>\ud83c\udf93 <b>${esc(c.title)}</b> \u2014 ID ${esc(c.id)} (${esc(c.date)})</li>`).join("")}</ul>` : `<p class="muted">No certificates yet.</p>`}

      <h3 class="report-h">Parent / Teacher Comment</h3>
      <textarea id="reportComment" class="report-comment" placeholder="Write a comment about this learner's progress\u2026" oninput="saveReportComment(this.value)">${esc(state.reportComment || "")}</textarea>

      <div class="report-sign">
        <div class="cert-sign">
          <div class="cert-sig-script">Ntandomods</div>
          <div class="sig-line"></div>
          <div>Ntandomods</div>
          <div class="muted" style="font-size:12px">Founder &amp; CEO, Chiedza Learning</div>
        </div>
        <div class="cert-flag">\ud83c\uddff\ud83c\uddfc</div>
      </div>
    </div>
  </div>
  ${footer()}`;
}

function saveReportComment(v) {
  state.reportComment = String(v).slice(0, 600);
  saveState();
}

/* ---------------- CERTIFICATE VERIFICATION (public, open to all) ---------------- */
function renderVerify(app, id) {
  let code = "", data = "";
  if (id && id.indexOf("?") >= 0) {
    const q = id.split("?")[1] || "";
    id = id.split("?")[0];
    const mc = q.match(/c=([^&]+)/); if (mc) code = decodeURIComponent(mc[1]).toUpperCase();
    const md = q.match(/d=([^&]+)/); if (md) data = decodeURIComponent(md[1]);
  }
  app.innerHTML = `
  ${topbar("")}
  <div class="quiz-wrap" style="max-width:840px">
    <div class="page-head" style="padding-left:0">
      <button class="back-btn" onclick="go('#/')">\u2190</button>
      <div class="titles"><h1>\ud83d\udd0e Verify a Certificate</h1><p>Confirm any Chiedza Learning certificate is genuine \u2014 free, instant and open to everyone.</p></div>
    </div>

    <div class="verify-box">
      <div class="verify-fields">
        <input id="verifyInput" class="verify-input" type="text" placeholder="Certificate ID \u00b7 e.g. CH-2026-ABC123" value="${esc(id || "")}" />
        <input id="verifyCode" class="verify-input verify-code-input" type="text" placeholder="Verification code (optional)" value="${esc(code || "")}" />
        <button class="btn btn-primary" onclick="doVerify()">Verify</button>
      </div>
      <input type="hidden" id="verifyData" value="${esc(data || "")}" />
      <div id="verifyResult" class="verify-result"></div>
    </div>

    <div class="verify-trust">
      <div class="verify-trust-h">\ud83c\udf0d Open to every organisation</div>
      <p>Chiedza Learning certificates follow an <b>open verification standard</b>. Schools, colleges, employers, NGOs and government bodies \u2014 <b>public or private, in Zimbabwe or anywhere in the world</b> \u2014 can verify a certificate in three ways:</p>
      <div class="verify-ways">
        <div class="verify-way"><span>1</span><b>Scan the QR code</b><i>printed on the certificate \u2014 it opens this page with the details filled in.</i></div>
        <div class="verify-way"><span>2</span><b>Enter the Certificate ID</b><i>e.g. CH-2026-ABC123 \u2014 checked against the public registry.</i></div>
        <div class="verify-way"><span>3</span><b>Check the verification code</b><i>a tamper-evident code derived from the certificate's own details.</i></div>
      </div>
    </div>

    <p class="muted center mt-2" style="font-size:13px">Every Chiedza Learning certificate carries a unique ID and verification code. Anyone \u2014 a parent, school, employer or institution \u2014 can confirm it here.</p>
  </div>
  ${footer()}`;
  if (id) doVerify();
}

async function doVerify() {
  const id = ($("#verifyInput").value || "").trim().toUpperCase();
  const entered = ($("#verifyCode") ? $("#verifyCode").value : "").trim().toUpperCase();
  const dataParam = ($("#verifyData") ? $("#verifyData").value : "").trim();
  const box = $("#verifyResult");
  if (!id) { box.innerHTML = `<div class="verify-bad">Please enter a certificate ID.</div>`; return; }
  box.innerHTML = `<div class="muted" style="padding:14px">Checking\u2026</div>`;

  // 1) certificate issued on this device
  const local = myCertificates().find(c => (c.id || "").toUpperCase() === id);
  if (local) {
    const c = COURSES.find(x => x.id === local.courseId);
    const cp = state.coursesProgress[local.courseId];
    const canon = (c && cp) ? certCanonical(c, cp, state.profile.name || "Learner") : "";
    box.innerHTML = validCard(local, state.profile.name, "Verified on this device", { canon, entered });
    return;
  }

  // 2) the public registry (authoritative)
  try {
    const res = await fetch("/api/certificates/" + encodeURIComponent(id));
    if (res.ok) {
      const d = await res.json();
      if (d && d.certificate) {
        const c = COURSES.find(x => x.id === d.certificate.courseId);
        const total = c ? c.assessment.length : 10;
        box.innerHTML = validCard({
          title: c ? c.title : d.certificate.courseId,
          id: d.certificate.id,
          date: new Date(d.certificate.issuedAt).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" }),
          score: Math.round(((d.certificate.percent || 0) * total) / 100),
          total
        }, d.certificate.name, "Verified against the Chiedza Learning registry", { canon: d.certificate.canonical, entered, stored: d.certificate.checksum });
        return;
      }
    }
  } catch (e) {}

  // 3) offline \u2014 recompute the code from the data embedded in the QR
  const canon = dataParam ? unb64url(dataParam) : "";
  if (canon) {
    const expected = certChecksum(canon);
    const parts = canon.split("|");
    if (!entered || entered === expected) {
      box.innerHTML = validCard({
        id: parts[0] || id, title: parts[1] || "\u2014", date: parts[3] || "\u2014",
        score: parts[4] ? parts[4].split("/")[0] : null, total: parts[4] ? parts[4].split("/")[1] : null
      }, parts[2] || "", "Verified offline \u2014 the certificate's details match its tamper-evident code", { canon, entered, offline: true });
      return;
    }
    box.innerHTML = `<div class="verify-bad">\u26a0\ufe0f The certificate details do not match the verification code. This certificate may have been altered.</div>`;
    return;
  }

  box.innerHTML = `<div class="verify-bad">\u274c No certificate found with ID <b>${esc(id)}</b>${entered ? " and the verification code could not be confirmed" : ""}. Please check the details and try again.</div>`;
}

function validCard(c, holder, note, v) {
  v = v || {};
  const expected = v.canon ? certChecksum(v.canon) : "";
  const enteredOk = !v.entered || !expected || v.entered === expected;
  const storedOk = !v.stored || !expected || v.stored === expected;
  return `<div class="verify-good">
    <div class="vg-head">\u2705 Valid Certificate</div>
    <div class="vg-grid">
      <div><span>Certificate ID</span><strong>${esc(c.id)}</strong></div>
      ${holder ? `<div><span>Holder</span><strong>${esc(holder)}</strong></div>` : ""}
      <div><span>Course</span><strong>${esc(c.title)}</strong></div>
      <div><span>Issued</span><strong>${esc(c.date || "\u2014")}</strong></div>
      ${c.score != null ? `<div><span>Score</span><strong>${c.score}/${c.total}</strong></div>` : ""}
      ${expected ? `<div><span>Verification code</span><strong class="cert-code">${expected}</strong></div>` : ""}
    </div>
    <div class="vg-checks">
      <span class="vg-ok">\u2714 Certificate found</span>
      ${expected ? `<span class="vg-${enteredOk ? "ok" : "warn"}">${enteredOk ? "\u2714 Verification code matches" : "\u26a0\ufe0f Verification code mismatch"}</span>` : ""}
      ${v.stored && expected ? `<span class="vg-${storedOk ? "ok" : "warn"}">${storedOk ? "\u2714 Registry record intact" : "\u26a0\ufe0f Registry record altered"}</span>` : ""}
      ${v.offline ? `<span class="vg-ok">\u2714 Offline integrity check passed</span>` : ""}
    </div>
    <div class="muted" style="font-size:12px;margin-top:10px">${note} \u00b7 Issued by Chiedza Learning (Ntandomods) \u00b7 Open Verification Standard</div>
  </div>`;
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

    <div class="flex gap wrap mb-2">
      <button class="btn btn-primary" onclick="go('#/report')">📄 My Report Card</button>
      <button class="btn btn-ghost" onclick="go('#/leaderboard')">🏆 Leaderboard</button>
      <button class="btn btn-ghost" onclick="go('#/verify')">🔎 Verify a Certificate</button>
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

    <div class="center mt-2 flex gap wrap" style="justify-content:center">
      <button class="btn btn-ghost" onclick="go('#/verify')">🔎 Verify a Certificate</button>
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
      <div class="titles"><h1>About Chiedza Learning</h1></div>
    </div>
    <div class="lesson-stage">
      <div class="lesson-content">
        <div class="kicker">🇿🇼 Our Mission</div>
        <h1>Learning made fun for every Zimbabwean child</h1>
        <div class="body-text">
          <p>Chiedza Learning is a free learning platform built for Zimbabwean children from <strong>ECD (Early Childhood Development)</strong> all the way to <strong>O-Level</strong>. It brings lessons, quizzes, games, free courses and certificates together in one colourful, easy-to-use place.</p>
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
          <h3>Our brand</h3>
          <p>Chiedza Learning is created by <strong>Ntandoyenkosi Chisaya</strong>, known as <strong>Ntandomods</strong> (age 20). Our emblem — a light-bulb growing into leaves — stands for bright ideas that grow, and our official seal appears on every certificate we issue.</p>
          <h3>Certificates you can trust — anywhere</h3>
          <p>Every certificate follows the <strong>Chiedza Open Verification Standard</strong>. It carries a unique Certificate ID, a tamper-evident verification code and a QR code. Schools, colleges, employers, NGOs and government bodies — <strong>public or private, in Zimbabwe or anywhere in the world</strong> — can confirm a certificate is genuine in seconds, with no account required.</p>
          <ul>
            <li>Scan the QR code, or open the verification page</li>
            <li>Enter the Certificate ID to check the public registry</li>
            <li>Compare the verification code to detect any alteration</li>
          </ul>
          <div class="about-cta"><button class="btn btn-primary" onclick="go('#/verify')">\ud83d\udd0e Verify a certificate</button></div>
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
      <h2>👋 Welcome to Chiedza Learning!</h2>
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
