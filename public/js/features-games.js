/* ============================================================
   CHIEDZA GAMES - Spelling Bee, Word Scramble, Shona & Ndebele Match
   Loaded after app.js. Exposes window.FXGames.
   ============================================================ */
(function () {
  /* word, clue, difficulty (1 easy, 2 medium, 3 challenge) */
  const WORDS = [
    ["sun", "It shines in the sky during the day.", 1], ["tree", "It has a trunk, branches and leaves.", 1], ["book", "You read it at school.", 1],
    ["water", "We drink it and it falls as rain.", 1], ["maize", "The grain we use to make sadza.", 1], ["goat", "A farm animal that says meh.", 1],
    ["house", "The place where a family lives.", 1], ["bread", "You spread butter on it.", 1], ["river", "Water that flows to the sea.", 1],
    ["mother", "A female parent.", 1], ["school", "Where children go to learn.", 1], ["lion", "The king of the jungle.", 1],
    ["green", "The colour of grass and the Zimbabwe flag stripe.", 1], ["pencil", "You write with it, and you can rub out the marks.", 1],
    ["friend", "Someone you like and play with.", 1], ["market", "A place where people buy and sell food.", 1],
    ["elephant", "The biggest land animal, with a trunk.", 2], ["Harare", "The capital city of Zimbabwe.", 2], ["Zimbabwe", "Our country in southern Africa.", 2],
    ["rainbow", "Seven colours in the sky after rain and sun.", 2], ["teacher", "The person who helps you learn in class.", 2],
    ["kitchen", "The room where food is cooked.", 2], ["farmer", "A person who grows crops and keeps animals.", 2],
    ["library", "A quiet place full of books you can borrow.", 2], ["blanket", "You use it to keep warm in bed.", 2],
    ["mountain", "A very high hill, like Nyangani.", 2], ["planet", "Earth is one of these going around the sun.", 2],
    ["healthy", "Strong and not sick.", 2], ["village", "A small community in the countryside.", 2], ["clinic", "A place where nurses help sick people.", 2],
    ["harvest", "Picking the crops when they are ready.", 2], ["telephone", "You use it to talk to someone far away.", 2],
    ["calendar", "It shows the days, weeks and months.", 2], ["triangle", "A shape with three sides.", 2], ["umbrella", "It keeps you dry in the rain.", 2],
    ["vegetable", "Cabbage, covo and spinach are all this.", 3], ["environment", "The nature and surroundings around us.", 3],
    ["independence", "Zimbabwe celebrates this on 18 April.", 3], ["necessary", "Something that you must have.", 3],
    ["different", "Not the same.", 3], ["beautiful", "Very pretty to look at.", 3], ["parliament", "The building where laws are made.", 3],
    ["temperature", "How hot or cold something is.", 3], ["Victoria Falls", "The great waterfall, also called Mosi-oa-Tunya.", 3],
    ["photosynthesis", "How green plants make food using sunlight.", 3], ["community", "A group of people living in one area.", 3],
    ["knowledge", "What you know from learning.", 3], ["calculator", "A machine that helps you add and multiply.", 3],
    ["restaurant", "A place where you pay to eat meals.", 3], ["responsible", "Doing your duty and being trusted.", 3]
  ];
  const norm = s => String(s).toLowerCase().replace(/[^a-z]/g, "");
  const E = s => esc(s);
  let G = null;

  /* ---------- shared bits ---------- */
  function wrap(inner, back) {
    return `${topbar("games")}<div class="quiz-wrap">
      <div class="flex gap wrap" style="align-items:center;justify-content:space-between;margin-bottom:16px">
        <button class="back-btn" onclick="go('#/games')">←</button>
        <div class="muted" style="font-weight:800">Score: ${G.score} · Round ${Math.min(G.i + 1, G.total)}/${G.total}</div>
      </div>${inner}</div>${footer()}`;
  }
  function levelPicker(title, emoji, intro, onPick) {
    $("#app").innerHTML = `${topbar("games")}
    <div class="page-head"><button class="back-btn" onclick="go('#/games')">←</button><div class="titles"><h1>${emoji} ${title}</h1><p>${intro}</p></div></div>
    <section class="section"><div class="fx-card"><h3>Choose how hard</h3><div class="chip-row">
      <button class="chip" onclick="${onPick}(1)">🟢 Easy</button><button class="chip" onclick="${onPick}(2)">🟡 Medium</button><button class="chip" onclick="${onPick}(3)">🔴 Challenge</button>
    </div></div></section>${footer()}`;
  }
  function pickWords(level, n) {
    const pool = WORDS.filter(w => w[2] === level);
    return FX.shuffle(pool).slice(0, n).map(w => ({ word: w[0], clue: w[1] }));
  }
  function endGame(emoji, title, goodMsg) {
    const ok = G.score >= Math.ceil(G.total * 0.7);
    if (ok) { state.gamesWon++; if (G.wordGame && G.score >= 8) awardBadge("word-wizard"); }
    if (window.FX) FX.onGameDone();
    saveState(); checkBadges();
    $("#app").innerHTML = `${topbar("games")}<div class="result-wrap"><div class="result-card">
      <div class="result-emoji">${emoji}</div><h1>${title}</h1><div class="score-big">${G.score}/${G.total}</div>
      <div class="msg">${ok ? goodMsg : "Good try! Practise a little more and you will get faster."}</div>
      <div class="result-actions"><button class="btn btn-primary" onclick="${G.again}">🔁 Play again</button><button class="btn btn-ghost" onclick="go('#/games')">← Games</button></div>
    </div></div>${footer()}`;
  }

  /* ============ Spelling Bee ============ */
  function spellMenu() { levelPicker("Spelling Bee", "🐝", "Press 🔊 to hear the word, then type how it is spelled.", "FXGames.spellStart"); }
  function spellStart(level) {
    G = { kind: "spell", wordGame: true, items: pickWords(level, 10), i: 0, score: 0, total: 10, again: "FXGames.spellMenu()", tries: 0 };
    G.total = G.items.length; spellDraw();
  }
  function spellDraw() {
    const it = G.items[G.i], blanks = it.word.split("").map(c => c === " " ? "&nbsp;&nbsp;" : "_").join(" ");
    $("#app").innerHTML = wrap(`<div class="quiz-card math-play">
      <div class="quiz-hint">Spell the word</div>
      <button class="btn btn-primary btn-lg" onclick="FXGames.say()">🔊 Hear the word</button>
      <p class="muted" style="margin:14px 0;font-weight:700">Clue: ${E(it.clue)}</p>
      <div class="fx-blanks">${blanks}</div>
      <input id="spellIn" class="fx-input" style="text-align:center;font-size:24px" autocomplete="off" autocapitalize="off" spellcheck="false" placeholder="Type here" onkeydown="if(event.key==='Enter')FXGames.spellCheck()" />
      <div class="quiz-feedback" id="gFeedback"></div>
      <div class="quiz-actions"><button class="btn btn-ghost" onclick="FXGames.say(true)">🐢 Slowly</button><button class="btn btn-primary" id="gBtn" onclick="FXGames.spellCheck()">Check ✓</button></div>
    </div>`);
    const i = $("#spellIn"); if (i) i.focus(); setTimeout(() => say(), 300);
  }
  function say(slow) {
    if (!G || !G.items) return; const w = G.items[G.i].word;
    if (!window.speechSynthesis) { showToast("🔇 No voice on this device. Use the clue!"); return; }
    speechSynthesis.cancel(); const u = new SpeechSynthesisUtterance(w); u.rate = slow ? 0.5 : 0.85; u.lang = "en-GB"; speechSynthesis.speak(u);
  }
  function spellCheck() {
    if (G.locked) return; const it = G.items[G.i], v = ($("#spellIn").value || "").trim(); if (!v) return;
    G.locked = true; const ok = norm(v) === norm(it.word); if (ok) G.score++;
    const fb = $("#gFeedback"); fb.className = "quiz-feedback show " + (ok ? "ok" : "no");
    fb.innerHTML = ok ? "✅ <strong>Perfect spelling!</strong>" : `❌ The correct spelling is <strong>${E(it.word)}</strong>.`;
    $("#spellIn").disabled = true; setTimeout(() => { G.locked = false; G.i++; G.i >= G.total ? endGame("🐝", "Spelling Bee Done!", "Buzz-tastic! You are a spelling champion!") : spellDraw(); }, ok ? 800 : 1800);
  }

  /* ============ Word Scramble ============ */
  function scrMenu() { levelPicker("Word Scramble", "🔤", "Tap the letters in the right order to build the word.", "FXGames.scrStart"); }
  function scrStart(level) {
    G = { kind: "scr", wordGame: true, items: pickWords(level, 10), i: 0, score: 0, total: 10, again: "FXGames.scrMenu()" };
    G.total = G.items.length; scrDraw();
  }
  function scrDraw() {
    const it = G.items[G.i], letters = it.word.replace(/ /g, "").split("");
    let sc = FX.shuffle(letters); if (sc.join("") === letters.join("") && letters.length > 1) sc = letters.slice().reverse();
    G.tiles = sc.map((c, k) => ({ c, k, used: false })); G.built = [];
    $("#app").innerHTML = wrap(`<div class="quiz-card math-play">
      <div class="quiz-hint">Unscramble the word</div>
      <p class="muted" style="margin:6px 0 14px;font-weight:700">Clue: ${E(it.clue)}</p>
      <div class="fx-built" id="scrBuilt"></div>
      <div class="fx-tiles" id="scrTiles"></div>
      <div class="quiz-feedback" id="gFeedback"></div>
      <div class="quiz-actions"><button class="btn btn-ghost" onclick="FXGames.scrUndo()">⌫ Undo</button><button class="btn btn-ghost" onclick="FXGames.scrClear()">✖ Clear</button><button class="btn btn-primary" onclick="FXGames.scrCheck()">Check ✓</button></div>
    </div>`);
    scrPaint();
  }
  function scrPaint() {
    const b = $("#scrBuilt"), t = $("#scrTiles"); if (!b) return;
    b.innerHTML = G.built.length ? G.built.map(k => `<span class="fx-tile on">${E(G.tiles[k].c.toUpperCase())}</span>`).join("") : `<span class="muted">Tap the letters below</span>`;
    t.innerHTML = G.tiles.map(x => `<button class="fx-tile" ${x.used ? "disabled" : ""} onclick="FXGames.scrTap(${x.k})">${E(x.c.toUpperCase())}</button>`).join("");
  }
  function scrTap(k) { if (G.locked || G.tiles[k].used) return; G.tiles[k].used = true; G.built.push(k); scrPaint(); }
  function scrUndo() { if (G.locked || !G.built.length) return; G.tiles[G.built.pop()].used = false; scrPaint(); }
  function scrClear() { if (G.locked) return; G.built.forEach(k => G.tiles[k].used = false); G.built = []; scrPaint(); }
  function scrCheck() {
    if (G.locked) return; const it = G.items[G.i], guess = G.built.map(k => G.tiles[k].c).join("");
    if (guess.length < G.tiles.length) { showToast("Use all the letters first!"); return; }
    G.locked = true; const ok = norm(guess) === norm(it.word); if (ok) G.score++;
    const fb = $("#gFeedback"); fb.className = "quiz-feedback show " + (ok ? "ok" : "no");
    fb.innerHTML = ok ? "✅ <strong>Well done!</strong>" : `❌ The word was <strong>${E(it.word)}</strong>.`;
    setTimeout(() => { G.locked = false; G.i++; G.i >= G.total ? endGame("🔤", "Word Scramble Done!", "Brilliant! Your brain is sharp!") : scrDraw(); }, ok ? 800 : 1800);
  }

  /* ============ Shona & Ndebele Match ============ */
  const langCache = {};
  async function loadLang(code) {
    if (langCache[code]) return langCache[code];
    try { const r = await fetch(`brain/languages/${code}.json`); langCache[code] = await r.json(); } catch (e) { langCache[code] = null; }
    return langCache[code];
  }
  const primary = t => t.split(" (")[0].split(" or ")[0].trim();
  function buildVocab(L) { // list of {prompt, answer}
    const out = [];
    (L.phrases || []).forEach(p => {
      const a = primary(p.t); if (a && a.length <= 28 && a.split(" ").length <= 3 && !/[?]/.test(a)) out.push({ prompt: `How do you say “${p.en}”?`, answer: a, kind: "t" });
    });
    (L.numbers || []).forEach(n => { const m = n.match(/^(.+?) \((\d+)\)$/); if (m) out.push({ prompt: `What number is “${m[1]}”?`, answer: m[2], kind: "n" }); });
    return out;
  }
  function vocabMenu() {
    $("#app").innerHTML = `${topbar("games")}
    <div class="page-head"><button class="back-btn" onclick="go('#/games')">←</button><div class="titles"><h1>🇿🇼 Shona &amp; Ndebele Match</h1><p>Learn how to say everyday words in our languages.</p></div></div>
    <section class="section"><div class="fx-card"><h3>Choose a language</h3><div class="chip-row">
      <button class="chip" onclick="FXGames.vocabStart('shona')">🇿🇼 Shona</button><button class="chip" onclick="FXGames.vocabStart('ndebele')">🇿🇼 Ndebele</button>
    </div><p class="muted" style="font-size:13px">Spelling can vary between dialects. Ask a teacher to confirm.</p></div></section>${footer()}`;
  }
  async function vocabStart(code) {
    const L = await loadLang(code);
    if (!L) { showToast("Could not load the words. Check your connection."); return; }
    const bank = buildVocab(L); if (bank.length < 6) { showToast("Not enough words yet."); return; }
    const picked = FX.shuffle(bank).slice(0, 10);
    G = { kind: "vocab", code, name: code === "shona" ? "Shona" : "Ndebele", bank, items: picked, i: 0, score: 0, total: picked.length, again: `FXGames.vocabStart('${code}')` };
    vocabDraw();
  }
  function vocabDraw() {
    const it = G.items[G.i];
    const wrongs = FX.shuffle(G.bank.filter(b => b.kind === it.kind && b.answer !== it.answer)).slice(0, 3);
    G.opts = FX.shuffle([it.answer, ...wrongs.map(w => w.answer)]);
    $("#app").innerHTML = wrap(`<div class="quiz-card math-play">
      <div class="quiz-hint">${G.name}</div>
      <div class="math-question" style="font-size:clamp(20px,4vw,30px)">${E(it.prompt.replace("How do you say", `How do you say in ${G.name}:`))}</div>
      <div class="math-choices" id="vChoices" style="grid-template-columns:repeat(auto-fit,minmax(150px,1fr))">${G.opts.map((o, k) => `<button class="opt" style="font-size:20px" onclick="FXGames.vocabPick(${k})">${E(o)}</button>`).join("")}</div>
      <div class="quiz-feedback" id="gFeedback"></div></div>`);
  }
  function vocabPick(k) {
    if (G.locked) return; G.locked = true; const it = G.items[G.i], ok = G.opts[k] === it.answer; if (ok) G.score++;
    $$("#vChoices .opt").forEach((b, j) => { b.disabled = true; if (G.opts[j] === it.answer) b.classList.add("correct"); else if (j === k) b.classList.add("wrong"); });
    const fb = $("#gFeedback"); fb.className = "quiz-feedback show " + (ok ? "ok" : "no");
    fb.innerHTML = ok ? "✅ <strong>Correct!</strong>" : `❌ The answer is <strong>${E(it.answer)}</strong>.`;
    if (window.FX && window.speechSynthesis && it.kind === "t") { /* words are Shona/Ndebele; no reliable voice, so we do not read them aloud */ }
    setTimeout(() => { G.locked = false; G.i++; G.i >= G.total ? endGame("🇿🇼", `${G.name} Match Done!`, "Well done! Keep speaking our languages with pride!") : vocabDraw(); }, ok ? 800 : 1700);
  }

  function play(id, app) {
    if (id === "game-spelling") { spellMenu(); return true; }
    if (id === "game-scramble") { scrMenu(); return true; }
    if (id === "game-vocab") { vocabMenu(); return true; }
    return false;
  }
  window.FXGames = { play, spellMenu, spellStart, spellCheck, say, scrMenu, scrStart, scrTap, scrUndo, scrClear, scrCheck, vocabStart, vocabPick, WORDS, buildVocab };
})();
