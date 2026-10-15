/* Smoke test for the learning features (revise, hints, practice, weekly, parent dashboard, games, guided maths).
   Needs jsdom (not a project dependency):  npm i --no-save jsdom && npm run test:features */
const { JSDOM, VirtualConsole } = require("jsdom");
const { spawn } = require("child_process");
const path = require("path");
const PORT = 3111, BASE = `http://localhost:${PORT}/`;
let pass = 0, fail = 0;
const ok = (c, m) => { if (c) { pass++; console.log("  ✓ " + m); } else { fail++; console.log("  ✗ " + m); } };
const wait = ms => new Promise(r => setTimeout(r, ms));

(async () => {
  const srv = spawn("node", ["server.js"], { cwd: path.join(__dirname, ".."), env: Object.assign({}, process.env, { PORT }), stdio: "ignore" });
  await wait(1200);
  const errors = [], vc = new VirtualConsole();
  vc.on("jsdomError", e => errors.push(e.message)); vc.on("error", e => errors.push(String(e)));
  const dom = await JSDOM.fromURL(BASE, { runScripts: "dangerously", resources: "usable", pretendToBeVisual: true, virtualConsole: vc,
    beforeParse(w) { w.fetch = (u, o) => fetch(new URL(u, BASE), o); w.scrollTo = () => {}; } });
  const w = dom.window, d = w.document;
  await wait(2500);
  const app = () => d.getElementById("app").textContent;
  const hash = h => { w.location.hash = h; return wait(80); };
  try {
    console.log("Loading"); ok(errors.length === 0, "no script errors on load " + errors.join("|")); ok(!!w.FX && !!w.FXGames && !!w.ChiedzaBrain, "FX, FXGames, ChiedzaBrain exist");
    ok(app().includes("Daily goal") && app().includes("Weekly challenge"), "home shows the daily goal and challenge cards");

    console.log("Quiz hints + mistake tracking");
    await hash("#/quiz/ecd/ecd-colours/0");
    const q = w.eval("quizCtx").questions[0], wrongIdx = (q.answer + 1) % q.options.length;
    d.getElementById("fxHintBtn").click(); ok(d.getElementById("fxHint").style.display === "block" && d.getElementById("fxHint").textContent.includes("Hint 1"), "hint 1 shows");
    d.getElementById("fxHintBtn").click(); const struck = [...d.querySelectorAll("#quizOptions .opt")].filter(b => b.disabled).length; ok(struck === q.options.length - 2, "hint 2 crosses out wrong answers (" + struck + ")");
    ok(![...d.querySelectorAll("#quizOptions .opt")].find(b => +b.dataset.i === q.answer).disabled, "hint 2 never removes the right answer");
    w.answerQuiz(wrongIdx); ok(Object.keys(w.FX.data().mistakes).length === 1, "wrong answer saved to the revision list");
    ok(w.FX.today().answered === 1, "activity logged");

    console.log("Revise");
    await hash("#/revise"); ok(app().includes("1 question") || app().includes("question to revise") || app().includes("to revise"), "revise page lists the mistake");
    w.FX.startRevise(); ok(app().includes("Revision"), "revision session starts");
    for (let r = 0; r < 2; r++) {
      if (!w.FX.weakList().length) break;
      w.FX.startRevise(); const s = d.querySelectorAll("#quizOptions .opt"); const ans = [...s].find((_, i) => true);
      // find the correct option by reading the session through the mistakes key
      const k = w.FX.weakList()[0].key, [l, sj, i, qi] = k.split("/"), src = w.LEVELS.find(x => x.id === l).subjects.find(x => x.id === sj).lessons[+i].quiz[+qi];
      const text = src.options[src.answer]; const btn = [...d.querySelectorAll("#quizOptions .opt")].find(b => b.textContent.endsWith(text)); btn.click();
    }
    ok(w.FX.weakList().length === 0, "question leaves the list after 2 correct answers");

    console.log("Practice paper");
    await hash("#/practice"); ok(app().includes("Choose your level"), "setup page renders");
    w.FX.setup("level", "junior"); w.FX.setup("n", 10); w.FX.startPractice(); ok(app().includes("Practice Paper") && app().includes("⏱"), "paper starts with timer");
    ok(d.getElementById("fxHintBtn") === null, "no hint button in exam mode");
    for (let i = 0; i < 10; i++) { d.querySelector("#quizOptions .opt").click(); d.getElementById("nextBtn").click(); }
    ok(app().includes("/10") && app().includes("Review these"), "paper marked with a review list"); ok(w.FX.data().exams.length === 1, "paper saved to history");
    ok(w.FX.weakList().length > 0, "wrong exam answers feed revision");

    console.log("Weekly + parent");
    await hash("#/weekly"); ok(app().includes("Weekly Challenge"), "weekly page");
    w.FX.startWeekly("infant"); const first = d.querySelector(".quiz-q").textContent; w.FX.startWeekly("infant"); ok(first === d.querySelector(".quiz-q").textContent, "weekly questions are the same every time (seeded)");
    for (let i = 0; i < 10; i++) { d.querySelector("#quizOptions .opt").click(); d.getElementById("nextBtn").click(); } ok(!!w.FX.data().weekly[w.FX.weekKey() + "/infant"], "weekly best saved");
    await hash("#/parent"); ok(app().includes("Grown-ups only"), "parent gate shown"); w.sessionStorage.setItem("chiedza_parent_ok", "1"); w.render(); ok(app().includes("Daily activity") && app().includes("Goal days"), "dashboard shown after unlock");
    w.FX.setGoal(5); ok(w.FX.goal() === 5, "goal can be changed");

    console.log("Games");
    await hash("#/games"); ok(app().includes("Spelling Bee") && app().includes("Word Scramble") && app().includes("Match"), "three new games listed");
    await hash("#/game/game-spelling"); w.FXGames.spellStart(1); for (let i = 0; i < 10; i++) { const wd = w.FXGames.WORDS.find(x => x[1] === d.querySelector(".muted[style*='margin:14px']").textContent.replace("Clue: ", "")); d.getElementById("spellIn").value = wd[0]; w.FXGames.spellCheck(); await wait(900); }
    ok(app().includes("10/10"), "spelling bee scores 10/10 with correct spellings");
    w.FXGames.scrStart(1); { const wd = w.FXGames.WORDS.find(x => x[1] === d.querySelector(".muted[style*='margin:6px']").textContent.replace("Clue: ", "")).slice(0)[0].replace(/ /g, "").split(""); const tiles = [...d.querySelectorAll("#scrTiles .fx-tile")]; wd.forEach(c => { const t = [...d.querySelectorAll("#scrTiles .fx-tile")].find(b => !b.disabled && b.textContent.toLowerCase() === c.toLowerCase()); t.click(); }); w.FXGames.scrCheck(); ok(d.getElementById("gFeedback").textContent.includes("Well done"), "word scramble accepts the right word"); }
    await w.FXGames.vocabStart("shona"); ok(d.querySelectorAll("#vChoices .opt").length >= 3, "Shona match shows options"); 
    const opts = [...d.querySelectorAll("#vChoices .opt")]; ok(new Set(opts.map(o => o.textContent)).size === opts.length, "options are unique");
    await w.FXGames.vocabStart("ndebele"); ok(d.querySelectorAll("#vChoices .opt").length >= 3, "Ndebele match works");
    ok(w.BADGES.some(b => b.id === "word-wizard"), "new badges registered");


    console.log("Explore (Google, YouTube and friends)");
    await w.FXExplore.load();
    let x = await w.FXExplore.intent("google volcanoes"); ok(x && x.extra.includes("safe=active") && x.extra.includes("data-ext"), "google search link uses SafeSearch and the grown-up gate");
    x = await w.FXExplore.intent("videos about the water cycle"); ok(x && x.extra.includes("youtube.com/results") && x.extra.includes("for+kids"), "youtube search adds 'for kids'");
    x = await w.FXExplore.intent("open khan academy"); ok(x && x.extra.includes("khanacademy.org"), "open a trusted site by name");
    x = await w.FXExplore.intent("google maps harare"); ok(x && x.extra.includes("google.com/maps"), "maps intent");
    x = await w.FXExplore.intent("what is the capital of Zimbabwe"); ok(x === null, "normal questions are not hijacked");
    ok(w.ChiedzaBrain.safetyCheck("google porn") !== null, "safety rules still catch adult searches");
    await hash("#/explore"); await wait(300); ok(app().includes("Explore the Web") && app().includes("Khan Academy"), "explore page lists the sites");
    const a = d.querySelector("a[data-ext]"); a.click(); ok(!!d.getElementById("fxGateModal"), "clicking an outside link asks a grown-up first");
    d.getElementById("fxGateNo").click(); ok(!d.getElementById("fxGateModal"), "stay here closes the gate");
    const st = await (await fetch(BASE + "api/brain/videos-status")).json(); ok(st.ok && st.enabled === false, "in-site videos stay off without a YouTube key");
    const vv = await (await fetch(BASE + "api/brain/videos?q=volcano")).json(); ok(vv.ok && vv.videos.length === 0, "videos route is harmless without a key");

    console.log("Brain");
    const B = w.ChiedzaBrain; await B.ready;
    let r = B.handle("guide me through 345 + 278"); ok(r && r.html.includes("345 + 278"), "guided add starts"); 
    r = B.handle("hint"); ok(r && r.html.includes("Hint 1"), "hint 1"); r = B.handle("hint"); ok(r.html.includes("Hint 2"), "hint 2");
    r = B.handle("623"); ok(r && r.html.includes("Correct"), "correct answer accepted (345+278=623)");
    r = B.handle("step by step 48 ÷ 6"); ok(r && r.html.includes("48 ÷ 6"), "guided division"); r = B.handle("8"); ok(r.html.includes("Correct"), "48÷6=8");
    r = B.handle("walk me through 23 x 14"); r = B.handle("show me the answer"); ok(r.html.includes("322"), "full working shown on request");
    r = B.handle("how do i work out 52 - 37"); r = B.handle("15"); ok(r.html.includes("Correct"), "subtraction with borrowing");
    B.handle("guide me through 7 x 8"); r = B.handle("what is the capital of Zimbabwe"); ok(r && !/Hint|Not quite/.test(r.html), "a real question is not swallowed by the maths coach");
    r = B.handle("give me a maths question"); ok(r && r.html.includes("="), "maths coach asks a question"); B.handle("give up");
    r = B.handle("what should I revise?"); ok(r && r.html.includes("to revise"), "revision helper reads progress");
    r = B.handle("set my daily goal to 4"); ok(r && w.FX.goal() === 4, "goal can be set by chat");
    r = B.handle("12 x 15"); ok(r && /180/.test(r.html), "plain maths still handled by the old skill");
    ok(errors.length === 0, "no script errors during the run " + errors.join("|"));
  } catch (e) { fail++; console.log("  ✗ crashed:", e.stack); }
  srv.kill(); console.log(`\n${pass} passed, ${fail} failed`); process.exit(fail ? 1 : 0);
})();
