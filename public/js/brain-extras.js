/* ============================================================
   CHIEDZA BRAIN EXTRAS
   - Guided maths: step-by-step hints, one clue at a time
   - Maths coach: "give me a maths question"
   - Revision, daily goal, practice paper and weekly challenge
     helpers that read the learner's own progress.
   Registers handlers with window.ChiedzaBrain (loaded after brain.js).
   ============================================================ */
(function () {
  const WORD_OP = [
    [/\b(multiplied by|times)\b/g, " * "], [/\b(divided by|over)\b/g, " / "], [/\bplus\b/g, " + "], [/\b(minus|take away)\b/g, " - "], [/×/g, " * "], [/÷/g, " / "], [/(\d)\s*x\s*(\d)/g, "$1 * $2"]
  ];
  const PLACES = ["units", "tens", "hundreds", "thousands", "ten-thousands", "hundred-thousands", "millions"];
  const fmt = n => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, " ");

  /* ---------- step builders ---------- */
  function stepsAdd(a, b) {
    const A = String(a).split("").reverse().map(Number), B = String(b).split("").reverse().map(Number), n = Math.max(A.length, B.length), steps = [];
    steps.push(`Write ${fmt(a)} and ${fmt(b)} one under the other so <strong>units are under units</strong>, tens under tens.`);
    let carry = 0, out = [];
    for (let i = 0; i < n; i++) {
      const x = A[i] || 0, y = B[i] || 0, t = x + y + carry, d = t % 10, c = Math.floor(t / 10);
      steps.push(`Add the <strong>${PLACES[i] || "next"}</strong>: ${x} + ${y}${carry ? " + " + carry + " (carried)" : ""} = ${t}. ${c ? `Write <strong>${d}</strong> and carry <strong>${c}</strong>.` : `Write <strong>${d}</strong>.`}`);
      out.unshift(d); carry = c;
    }
    if (carry) { steps.push(`Bring down the last carry: <strong>${carry}</strong>.`); out.unshift(carry); }
    return { steps, answer: a + b, line: `${fmt(a)} + ${fmt(b)} = ${fmt(a + b)}` };
  }
  function stepsSub(a, b) {
    let neg = false; if (a < b) { [a, b] = [b, a]; neg = true; }
    const A = String(a).split("").reverse().map(Number), B = String(b).split("").reverse().map(Number), steps = [];
    steps.push(neg ? `The second number is bigger, so subtract <strong>${fmt(b)} from ${fmt(a)}</strong> and then put a minus sign in front.` : `Write ${fmt(a)} on top and ${fmt(b)} below it, with <strong>units under units</strong>.`);
    let borrow = 0;
    for (let i = 0; i < A.length; i++) {
      let x = A[i] - borrow; const y = B[i] || 0; let note = "";
      if (x < y) { x += 10; note = ` ${PLACES[i]} are too small, so borrow 1 from the next place (it becomes 10 more here).`; borrow = 1; } else borrow = 0;
      steps.push(`Subtract the <strong>${PLACES[i] || "next"}</strong>: ${x} − ${y} = <strong>${x - y}</strong>.${note}`);
    }
    const ans = neg ? -(a - b) : a - b;
    return { steps, answer: ans, line: `${neg ? fmt(b) + " − " + fmt(a) : fmt(a) + " − " + fmt(b)} = ${fmt(ans)}` };
  }
  function stepsMul(a, b) {
    const steps = [];
    if (a < 11 && b < 11) {
      const m = Math.min(a, b), k = Math.max(a, b), skip = Array.from({ length: m }, (_, i) => k * (i + 1));
      steps.push(`Think of <strong>${m} groups of ${k}</strong>.`, `Count in ${k}s, ${m} times: <strong>${skip.join(", ")}</strong>.`, `The last number you counted is the answer.`);
    } else {
      const big = a >= b ? a : b, small = a >= b ? b : a, digits = String(big).split("");
      const parts = digits.map((d, i) => ({ v: Number(d) * Math.pow(10, digits.length - 1 - i) })).filter(p => p.v > 0);
      steps.push(`Break <strong>${fmt(big)}</strong> into place values: <strong>${parts.map(p => fmt(p.v)).join(" + ")}</strong>.`);
      parts.forEach(p => steps.push(`Multiply ${fmt(p.v)} × ${fmt(small)} = <strong>${fmt(p.v * small)}</strong>.`));
      steps.push(`Add the parts: ${parts.map(p => fmt(p.v * small)).join(" + ")}.`);
    }
    return { steps, answer: a * b, line: `${fmt(a)} × ${fmt(b)} = ${fmt(a * b)}` };
  }
  function stepsDiv(a, b) {
    const q = Math.floor(a / b), r = a % b, steps = [];
    steps.push(`Ask: <strong>how many times does ${fmt(b)} fit into ${fmt(a)}</strong>?`);
    const list = []; for (let i = 1; i <= Math.min(q + 1, 12); i++) list.push(`${b}×${i}=${b * i}`);
    if (q <= 11) steps.push(`Count up in ${fmt(b)}s: <strong>${list.join(", ")}</strong>.`);
    else steps.push(`Estimate: ${fmt(b)} × ${fmt(Math.floor(q / 10) * 10 || 10)} = ${fmt(b * (Math.floor(q / 10) * 10 || 10))}. Keep adding groups of ${fmt(b)} until you reach ${fmt(a)} but do not go past it.`);
    steps.push(`The biggest multiple not more than ${fmt(a)} is ${fmt(b)} × <strong>${fmt(q)}</strong> = ${fmt(b * q)}.`);
    steps.push(r ? `Subtract: ${fmt(a)} − ${fmt(b * q)} = <strong>${r}</strong> is left over (the remainder).` : `Nothing is left over, so it divides exactly.`);
    return { steps, answer: q, rem: r, line: `${fmt(a)} ÷ ${fmt(b)} = ${fmt(q)}${r ? " remainder " + r : ""}` };
  }
  function build(a, op, b) {
    if (op === "+") return stepsAdd(a, b);
    if (op === "-") return stepsSub(a, b);
    if (op === "*") return stepsMul(a, b);
    if (op === "/") return b === 0 ? null : stepsDiv(a, b);
    return null;
  }

  /* ---------- the guided conversation ---------- */
  function guided(P, intro) {
    const Brain = window.ChiedzaBrain, esc = Brain.esc;
    let shown = 0, tries = 0;
    const full = () => `<ol style="margin:6px 0 6px 18px">${P.steps.map(s => `<li>${s}</li>`).join("")}</ol>✅ <strong>${P.line}</strong>`;
    Brain.setPending({
      freeText: true, // we read hints and answers ourselves, so "show me the answer" is not mistaken for a new question
      handle(input) {
        const s = input.toLowerCase().trim();
        if (/^(hint|clue|tip|help|next|next step|stuck|i am stuck|i'm stuck)\b/.test(s)) {
          if (shown < P.steps.length) { shown++; return { html: `💡 <strong>Hint ${shown} of ${P.steps.length}:</strong><br>${P.steps[shown - 1]}${shown < P.steps.length ? "<br><small>Say <em>hint</em> for the next step, or type your answer.</small>" : "<br><small>Now type your answer!</small>"}`, keep: true, chips: ["hint", "show me the answer"] }; }
          return { html: "That was the last hint. 😊 Type your answer, or say <em>show me the answer</em>.", keep: true, chips: ["show me the answer"] };
        }
        if (/^(give up|i give up|answer|skip|tell me|show( me)?( the)?( answer| working)?|working)\b/.test(s)) {
          return { html: `No problem! Here is the full working:${full()}<br>Want another one?`, chips: ["Give me a maths question", "Quiz me"] };
        }
        if (!/^(the answer is |is it |it is |=\s*)?-?[\d\s,.]+(\s*(r|rem|remainder)\s*\d+)?\s*[.!]?$/.test(s)) return null; // not an answer: let the normal brain take over
        const nums = s.replace(/,/g, "").match(/-?\d+(\.\d+)?/g); if (!nums) return null;
        tries++;
        const ok = Number(nums[0]) === P.answer && (P.rem === undefined || P.rem === 0 || nums.length < 2 || Number(nums[1]) === P.rem);
        if (ok) {
          const mm = Brain.mem(); mm.mathWins = (mm.mathWins || 0) + 1; Brain.saveMem(mm);
          if (window.FX) FX.logActivity("games");
          return { html: `🎉 <strong>Correct!</strong> ${esc(Brain.myName() || "Well done")}!${tries === 1 && shown === 0 ? " First try, with no hints! 🌟" : ""}<br><strong>${P.line}</strong>${P.rem ? "<br><small>Remember to say the remainder too.</small>" : ""}`, chips: ["Give me a maths question", "Quiz me"] };
        }
        if (tries >= 3) return { html: `Not quite, and that is okay. 💛 Here is the working:${full()}`, chips: ["Give me a maths question"] };
        return { html: `Not quite, try again! 💪 ${shown < P.steps.length ? "Say <em>hint</em> for a clue." : ""}`, keep: true, chips: ["hint", "show me the answer"] };
      }
    });
    return { html: intro + "<br><small>Type your answer. Say <strong>hint</strong> for one step at a time, or <strong>show me the answer</strong>.</small>", chips: ["hint", "show me the answer"] };
  }

  function parseSum(raw) {
    let s = " " + raw.toLowerCase().replace(/,/g, "") + " ";
    WORD_OP.forEach(([rx, to]) => { s = s.replace(rx, to); });
    const m = s.match(/(\d{1,7})\s*([+\-*/])\s*(\d{1,7})(?!\s*[+\-*/^]\s*\d)/);
    return m && !/[+\-*/]\s*\d+\s*[+\-*/]/.test(s.slice(m.index)) ? { a: Number(m[1]), op: m[2], b: Number(m[3]) } : null;
  }
  const GUIDE_RX = /\b(guide me|walk me through|step by step|steps?|teach me how|show me how|how (do|can) i (work out|solve|add|subtract|multiply|divide)|help me (with|solve|work out|do)|hint|hints|coach me|i am stuck|i'm stuck)\b/;

  function randomSum(level) {
    const r = (lo, hi) => lo + Math.floor(Math.random() * (hi - lo + 1)), t = r(0, 3);
    if (level === "ecd") return t % 2 ? { a: r(3, 9), op: "+", b: r(1, 9) } : { a: r(6, 10), op: "-", b: r(1, 5) };
    if (level === "infant") return [{ a: r(12, 60), op: "+", b: r(11, 39) }, { a: r(40, 90), op: "-", b: r(11, 39) }, { a: r(2, 5), op: "*", b: r(2, 5) }, { a: r(2, 10), op: "*", b: r(2, 10) }][t];
    if (level === "olevel") return [{ a: r(120, 999), op: "*", b: r(12, 40) }, { a: r(1200, 9999), op: "+", b: r(1200, 9999) }, { a: r(1500, 9000), op: "-", b: r(300, 1400) }, { a: r(400, 999) , op: "/", b: r(7, 19) }][t];
    return [{ a: r(120, 999), op: "+", b: r(120, 999) }, { a: r(200, 999), op: "-", b: r(101, 199) }, { a: r(12, 99), op: "*", b: r(3, 9) }, { a: r(60, 150), op: "/", b: r(3, 9) }][t];
  }

  /* ---------- registration ---------- */
  function register() {
    const Brain = window.ChiedzaBrain; if (!Brain || Brain._extras) return; Brain._extras = true;
    const esc = Brain.esc;

    Brain.register({ handle(text) {
      const t = text.toLowerCase();

      // 1. guided maths on a specific sum
      if (GUIDE_RX.test(t)) {
        const sum = parseSum(text);
        if (sum) {
          const P = build(sum.a, sum.op, sum.b);
          if (P) return guided(P, `🧮 Let us work out <strong>${fmt(sum.a)} ${{ "+": "+", "-": "−", "*": "×", "/": "÷" }[sum.op]} ${fmt(sum.b)}</strong> together. Try it first!`);
        }
      }
      // 2. maths coach: a fresh sum with hints
      if (/\b(give me|set me|ask me|make me|try|practise|practice|i want|let'?s do)( a| some| another)?( new| easy| hard)?( maths| math| sum| sums)( question| problem| practice| sum)?\b|\bmaths coach\b|\bgive me a maths question\b|^another sum$|^another one$/.test(t)) {
        const lv = Brain.detectLevel(t) || Brain.mem().level || "junior";
        const sum = randomSum(lv), P = build(sum.a, sum.op, sum.b);
        if (P) return guided(P, `🧮 <strong>${fmt(sum.a)} ${{ "+": "+", "-": "−", "*": "×", "/": "÷" }[sum.op]} ${fmt(sum.b)} = ?</strong>`);
      }

      if (!window.FX) return null;

      // 3. what should I revise
      if (/\b(what (should|can|do) i (revise|review|practise|practice|work on)|revise|revision|my (weak|mistakes|weak topics|weak areas)|what am i (bad|weak) at)\b/.test(t) && !/\bcertificate|course\b/.test(t)) {
        const topics = FX.weakTopics().slice(0, 4), n = FX.weakList().length;
        if (!n) return { html: "🌟 You have no mistakes waiting right now. Take a few quizzes and I will remember anything that is tricky.", links: [["#/practice", "Try a practice paper"]], chips: ["Quiz me"] };
        return { html: `🔁 You have <strong>${n}</strong> question${n === 1 ? "" : "s"} to revise. The trickiest topics:<br>${topics.map(x => `• <strong>${esc(x.q.lesson)}</strong> <small>(${esc(x.q.subjectName)}, ${x.n})</small>`).join("<br>")}`, links: [["#/revise", "Revise now"], ...topics.slice(0, 2).map(x => [`#/lesson/${x.q.levelId}/${x.q.subjectId}/${x.q.idx}`, "📖 " + x.q.lesson])], chips: ["Quiz me", "Give me a maths question"] };
      }
      // 4. daily goal
      const g = t.match(/\b(set|change|make)\b.*\bgoal\b.*?(\d+)/);
      if (g) { const n = Math.max(1, Math.min(20, Number(g[2]))); FX.setGoalValue(n); return { html: `🎯 Done! Your daily goal is now <strong>${n}</strong> activit${n === 1 ? "y" : "ies"} a day (a lesson, quiz or game each).` }; }
      if (/\b(daily goal|my goal|today'?s goal|how many (more )?(lessons|activities) (today|left))\b/.test(t)) {
        const d = FX.today(), left = Math.max(0, FX.goal() - d.act);
        return { html: left ? `🎯 Today you have done <strong>${d.act}</strong> of <strong>${FX.goal()}</strong>. Just ${left} more to hit your goal!` : `🎉 You reached today's goal (<strong>${d.act}/${FX.goal()}</strong>)! Amazing. Keep going if you like.`, chips: ["Quiz me", "Give me a maths question"] };
      }
      // 5. practice paper / exam
      if (/\b(practice paper|practise paper|exam practice|mock (exam|test)|test paper|exam[- ]style|timed test)\b/.test(t)) return { html: "📝 A <strong>Practice Paper</strong> gives you exam-style questions from the lessons, with a timer. The marks and corrections show at the end.", links: [["#/practice", "Start a practice paper"]] };
      // 6. weekly challenge
      if (/\bweekly (challenge|quiz)\b/.test(t)) { const wk = FX.weekKey(), best = LEVELS.map(l => FX.data().weekly[wk + "/" + l.id]).filter(Boolean).sort((a, b) => b.score - a.score)[0]; return { html: `🏆 Every week there are 10 brand new questions per level. ${best ? "Your best this week is <strong>" + best.score + "/" + best.total + "</strong>." : "You have not played this week yet."}`, links: [["#/weekly", "Play the weekly challenge"]] }; }
      // 7. parent dashboard
      if (/\bparent (dashboard|area|page)\b|\bdashboard for (my )?parents?\b/.test(t)) return { html: "👪 The <strong>Parent Dashboard</strong> shows time spent, accuracy, strong and weak subjects for the last 7 days. It is saved on this device only, and a grown-up question protects it.", links: [["#/parent", "Open the parent dashboard"]] };
      return null;
    } });
  }

  if (window.ChiedzaBrain) register(); else window.addEventListener("load", register);
  window.BrainExtras = { build, parseSum, randomSum };
})();
