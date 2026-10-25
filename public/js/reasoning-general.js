/* ============================================================
   CHIEDZA GENERAL REASONING - reason about anything
   The universal thinker. It reads any question, works out what
   kind of thinking is needed (define, explain how, explain why,
   weigh pros and cons, decide, plan, explore a hypothetical,
   analyse a topic or reason from first principles), matches it to
   the knowledge files, and answers with its working shown.

   It never invents facts. When the knowledge files do not cover a
   topic it does not guess: it builds a clear reasoning map (what is
   being asked, the sub-questions, the lenses to use, how to reach
   an answer) so the learner can reason it out.

   Knowledge lives in public/brain/knowledge/general.json.
   Works in the browser (registers with ChiedzaBrain) and in Node
   (npm run test:general). Created by Ntandomods.
   ============================================================ */
(function (root) {
  "use strict";

  function create(D, H) {
    H = H || {};
    const K = D.general || { concepts: [], analogies: [], heuristics: [] };
    const esc = H.esc || (s => String(s == null ? "" : s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c])));
    const STOP = new Set("a an the is are was were am be to of in on at for and or but with what whats who how why when where which do does did can could would should i me my we you your it its this that these those about tell please explain give show want need some any more from as by us our".split(" "));
    const stem = w => w.replace(/(ing|ed|es|s)$/i, m => (w.length > 4 ? "" : m));
    const tokens = H.tokens || (s => (s || "").toLowerCase().replace(/<[^>]+>/g, " ").replace(/[^a-z0-9' ]+/g, " ").split(/\s+/).filter(w => w && !STOP.has(w)).map(stem));
    const words = s => (String(s || "").toLowerCase().match(/[a-z']+/g) || []);
    const rxEsc = w => String(w).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const titleCase = s => String(s || "").replace(/\b([a-z])/g, (m, a) => a.toUpperCase());

    const concepts = (K.concepts || []).map(c => Object.assign({}, c, {
      _t: tokens([c.title, c.domain, (c.terms || []).join(" "), c.summary].join(" "))
    }));
    const analogies = K.analogies || [];
    const heuristics = K.heuristics || [];

    /* ---------- small html helpers (styled by studio.css) ---------- */
    const row = (icon, label, text) => `<div class="ans-row"><span class="ans-ico">${icon}</span><div class="ans-body"><strong>${label}</strong><div>${text}</div></div></div>`;
    const list = arr => `<ul class="ans-list">${(arr || []).map(x => `<li>${x}</li>`).join("")}</ul>`;
    const box = (title, inner, icon) => `<div class="ans-box"><div class="ans-box-h">${icon || "•"} ${title}</div>${inner}</div>`;
    const conclusion = t => `<div class="ans-conclusion">✅ ${t}</div>`;
    const kicker = t => `<div class="ans-kicker">${t}</div>`;
    const chipsFor = c => {
      if (!c) return ["What can you do?", "Explain how reasoning works"];
      const out = [];
      (c.related || []).slice(0, 3).forEach(id => { const r = concepts.find(x => x.id === id); if (r) out.push("Explain " + r.title); });
      out.push("Why does " + c.title.toLowerCase() + " matter?");
      return out.slice(0, 3);
    };

    /* ---------- matching ---------- */
    function hasPhrase(text, term) {
      const t = String(term).toLowerCase().replace(/\s+/g, " ").trim();
      if (!t) return false;
      return new RegExp("(^|[^a-z0-9])" + rxEsc(t) + "(s|es)?([^a-z0-9]|$)", "i").test(text);
    }
    function scoreConcept(text) {
      const qt = tokens(text);
      let best = null, bestScore = 0;
      for (const c of concepts) {
        let s = 0;
        for (const term of (c.terms || [])) if (hasPhrase(text, term)) s += 6 + String(term).split(/\s+/).length * 2;
        if (hasPhrase(text, c.title)) s += 9;
        s += c._t.filter(t => qt.includes(t)).length * 1.5;
        if (s > bestScore) { bestScore = s; best = c; }
      }
      return bestScore >= 5 ? { c: best, score: bestScore } : null;
    }
    function analogyFor(c) {
      if (!c) return null;
      return analogies.find(a => a.a === c.id || a.b === c.id || hasPhrase(c.title, a.a) || hasPhrase(c.title, a.b));
    }

    /* ---------- intent ---------- */
    function intentOf(text) {
      const t = String(text).toLowerCase().trim();
      if (/^(hi|hello|hey|mhoro|hie|good (morning|afternoon|evening)|howzit|sup|yo)\b/.test(t)) return "greeting";
      if (/^(thank you|thanks|thankyou|ndatenda|ta|cheers)\b/.test(t) && t.split(/\s+/).length < 7) return "thanks";
      if (/\b(who are you|what are you|your name|who made you|who built you|what can you do|how do you work|what do you do|are you (a )?(real )?ai)\b/.test(t)) return "identity";
      if (/^(how many|how much|how long|how far|how fast|how old|how big|how tall|how heavy|how often)\b/.test(t)) return "quantity";
      if (/\b(pros and cons|advantages and disadvantages|advantages|disadvantages|benefits|drawbacks|should i|is it (good|bad|worth|better|safe)|which is better|worth it|is .* a good idea)\b/.test(t)) return "proscons";
      if (/^(how (do|can|should) i|steps to|how to|plan (for|to)|give me a plan|guide me to|what are the steps)\b/.test(t)) return "plan";
      if (/^what (would|will) happen|what happens (if|when)|what if\b/.test(t)) return "hypothetical";
      if (/\b(analy[sz]e|analysis|evaluate|assess|examine|discuss|explore|reason about|think about|what do you think about|break down)\b/.test(t)) return "analysis";
      if (/\b(compare|difference between|similarities|versus| vs\.? )\b/.test(t)) return "compare";
      if (/^why\b|\bwhy (does|do|is|are|did|would|should|can)\b/.test(t)) return "why";
      if (/^(how (does|do|did|can|is|are|to)|how .* (work|works|happen|happens)|how come)\b/.test(t)) return "how";
      if (/^(what is|what are|what's|whats|define|definition of|meaning of|what does .* mean|explain|describe|tell me about|who is|who was)\b/.test(t)) return "definition";
      return "open";
    }

    /* ---------- subject extraction ---------- */
    function subjectOf(text) {
      let s = String(text).trim().replace(/[?.!]+$/, "");
      s = s.replace(/^(please\s+)?(can you\s+|could you\s+)?(explain|describe|tell me about|what is|what are|what's|whats|define|definition of|meaning of|how does|how do|how is|how are|how can|how should|plan( for)?|why does|why do|why is|why are|reason about|think about|analy[sz]e|discuss|explore|evaluate|assess|break down)\s+/i, "");
      s = s.replace(/^(i|we|you)\s+/i, "");
      s = s.replace(/^(plan( for)?)\s+/i, "");
      s = s.replace(/^(the|a|an)\s+/i, "");
      s = s.replace(/\s+(work|works|happen|happens|matter|matters)\s*$/i, "");
      const parts = s.split(/\s+/).filter(Boolean);
      return parts.slice(0, 8).join(" ").replace(/[?.!,;:]+$/, "");
    }

    /* ---------- domain lenses ---------- */
    const LENSES = [
      { rx: /\b(money|cost|price|buy|pay|budget|business|profit|invest|loan|salary|income|economy)\b/i, name: "money and economics", q: "What does it cost, what does it return, and who carries the risk?" },
      { rx: /\b(health|sick|diet|food|exercise|sleep|stress|body|doctor|disease|medicine)\b/i, name: "health and wellbeing", q: "What does the evidence say about safety, short-term effects and long-term effects?" },
      { rx: /\b(school|study|learn|exam|teacher|homework|grade|university|skill)\b/i, name: "learning", q: "What will it teach, how will it be practised, and how will progress be measured?" },
      { rx: /\b(environment|climate|pollution|waste|energy|water|forest|animal|nature)\b/i, name: "environment", q: "What are the effects on air, water, soil and living things now and later?" },
      { rx: /\b(phone|internet|computer|ai|technology|app|online|data|software|robot)\b/i, name: "technology", q: "What problem does it solve, how reliable is it, and what are the privacy and safety risks?" },
      { rx: /\b(friend|family|relationship|people|community|team|trust|respect|bully)\b/i, name: "people and relationships", q: "How does it affect trust, fairness, feelings and the people around you?" },
      { rx: /\b(future|career|job|work|business|goal|dream|plan)\b/i, name: "the future", q: "What are the likely paths, what skills are needed, and what is reversible?" },
      { rx: /\b(law|rights|government|democracy|constitution|rule|fair|justice)\b/i, name: "law and fairness", q: "What are the rules, whose rights are involved, and what is fair?" }
    ];
    function lensesFor(text) {
      const out = [];
      for (const l of LENSES) if (l.rx.test(text) && !out.some(x => x.name === l.name)) out.push(l);
      if (!out.length) out.push({ name: "first principles", q: "What is it, how does it work, why does it matter, and what are the trade-offs?" });
      return out.slice(0, 3);
    }

    /* ---------- guards: do not steal other skills ---------- */
    function looksLikeMath(text) {
      const t = String(text).trim();
      if (/^\s*[\d\s.+\-*/^()x×÷%=,]+\s*$/i.test(t) && /\d/.test(t)) return true;
      if (/\d+\s*(%|percent|per cent)\s*of\s*\d+/i.test(t)) return true;
      if (/^(what is|calculate|work out|solve|compute)\s+[\d(]/i.test(t)) return true;
      if (/^(sqrt|square root|cube root|root of|times tables?)\b/i.test(t)) return true;
      if (/\b\d+\s*[+\-*/^x\u00d7\u00f7]\s*\d+\b/i.test(t)) return true;
      return false;
    }
    function looksLikeSiteCommand(text) {
      const t = String(text).trim();
      if (/\b(build|create|make|design|generate|launch|set up)\b[\s\S]*\b(website|web ?site|web ?page|site)\b/i.test(t)) return true;
      return /^(add|remove|drop|delete|make it|make the|change|set|rename|call it|name it|dark mode|light mode|one page|multi[- ]?page|we sell|we offer)\b/i.test(t) && t.split(/\s+/).length <= 8;
    }

    /* ---------- answer builders ---------- */
    function defAnswer(c, text) {
      const steps = [
        row("1️⃣", "What is being asked", `You want to understand <strong>${esc(c.title)}</strong>.`),
        row("2️⃣", "Definition", esc(c.definition)),
        row("3️⃣", "How it works", list((c.how || []).map(esc))),
        row("4️⃣", "Why it matters", esc(c.why)),
        row("5️⃣", "A concrete example", esc(c.example))
      ];
      const an = analogyFor(c);
      if (an) steps.push(row("🔗", "Think of it like this", esc(an.text)));
      return {
        html: kicker("🧠 Reasoning") + `<h3 class="ans-title">${esc(c.title)}</h3>` + steps.join("") + conclusion(`<strong>In short:</strong> ${esc(c.summary)}`),
        reasoning: [
          { title: "Classify", detail: "This is a definition question, so I looked for the concept and its explanation." },
          { title: "Recall", detail: `Matched the question to the knowledge entry "${c.title}".` },
          { title: "Structure", detail: "Built the answer as definition → mechanism → importance → example." },
          { title: "Check", detail: "Every statement comes from the knowledge file; nothing was invented." }
        ],
        chips: chipsFor(c)
      };
    }

    function howAnswer(c) {
      const steps = [
        row("1️⃣", "The short answer", esc(c.summary)),
        row("2️⃣", "Step by step", list((c.how || []).map(esc))),
        row("3️⃣", "Why it works that way", esc(c.why)),
        row("4️⃣", "Example", esc(c.example))
      ];
      const an = analogyFor(c);
      if (an) steps.push(row("🔗", "Analogy", esc(an.text)));
      return {
        html: kicker("🧠 Reasoning") + `<h3 class="ans-title">How ${esc(c.title)} works</h3>` + steps.join("") + conclusion(`<strong>In short:</strong> ${esc(c.summary)}`),
        reasoning: [
          { title: "Classify", detail: "This is a mechanism question: it asks how something works." },
          { title: "Recall", detail: `Found the process steps for "${c.title}".` },
          { title: "Order", detail: "Put the steps in the order the process actually happens." },
          { title: "Check", detail: "Added the reason behind the process and a real example." }
        ],
        chips: chipsFor(c)
      };
    }

    function whyAnswer(c) {
      const steps = [
        row("1️⃣", "The direct reason", esc(c.why)),
        row("2️⃣", "The mechanism behind it", list((c.how || []).map(esc))),
        row("3️⃣", "Why that matters", esc(c.summary)),
        row("4️⃣", "Example", esc(c.example))
      ];
      return {
        html: kicker("🧠 Reasoning") + `<h3 class="ans-title">Why ${esc(c.title)} matters</h3>` + steps.join("") + conclusion(`<strong>In short:</strong> ${esc(c.why)}`),
        reasoning: [
          { title: "Classify", detail: "This is a cause/importance question." },
          { title: "Recall", detail: `Used the "why" and "how" parts of the "${c.title}" entry.` },
          { title: "Connect", detail: "Linked the mechanism to the consequence so the reason is clear." },
          { title: "Check", detail: "The conclusion restates the evidence, not a guess." }
        ],
        chips: chipsFor(c)
      };
    }

    function analysisAnswer(c, subject) {
      const angles = [];
      angles.push(`<strong>What it is:</strong> ${esc(c.definition)}`);
      angles.push(`<strong>How it works:</strong> ${(c.how || []).map(esc).join(" ")}`);
      angles.push(`<strong>Why it matters:</strong> ${esc(c.why)}`);
      const rel = (c.related || []).map(id => concepts.find(x => x.id === id)).filter(Boolean);
      if (rel.length) angles.push(`<strong>Connected ideas:</strong> ${rel.map(r => esc(r.title)).join(", ")}.`);
      const steps = [
        row("1️⃣", "Restate the question", `You want a reasoned look at <strong>${esc(c.title)}</strong>, not just a one-line definition.`),
        row("2️⃣", "Break it into parts", list(["What is it?", "How does it work?", "Why does it matter?", "What is it connected to?", "What should we watch or question?"])),
        row("3️⃣", "What the knowledge says", list(angles)),
        row("4️⃣", "A lens to judge it", list(lensesFor(subject || c.title).map(l => `<strong>${esc(l.name)}:</strong> ${esc(l.q)}`))),
        row("5️⃣", "What would change the answer", "New evidence, a different context, or a different goal could change the emphasis. Good reasoning says what it depends on.")
      ];
      return {
        html: kicker("🧠 Reasoning") + `<h3 class="ans-title">A reasoned look at ${esc(c.title)}</h3>` + steps.join("") + conclusion(`<strong>Bottom line:</strong> ${esc(c.summary)}`),
        reasoning: [
          { title: "Classify", detail: "This is an analysis question, so I went beyond a definition." },
          { title: "Decompose", detail: "Split it into what, how, why, connections and open questions." },
          { title: "Apply knowledge", detail: `Used the "${c.title}" entry plus related concepts.` },
          { title: "Evaluate", detail: "Added a lens for judging it and stated what the answer depends on." }
        ],
        chips: chipsFor(c)
      };
    }

    function prosConsAnswer(subject, text, c) {
      const s = subject || "this";
      const lenses = lensesFor(text);
      const benefits = [
        `It can meet a real need: ${esc(s)} may solve a problem you actually have.`,
        `It can build experience, skills or understanding that help later.`,
        `It may save time or money once the first effort is done.`
      ];
      const costs = [
        `It has a cost — money, time or attention — and that cost is real even if it is small.`,
        `There is a risk it does not work as hoped, or works differently in practice.`,
        `It can crowd out other things you value, so the alternative matters.`
      ];
      if (c) {
        benefits.unshift(`<strong>${esc(c.title)}</strong> matters because ${esc(c.why)}`);
        costs.push(`Misunderstanding how it works can lead to poor decisions, so the mechanism matters.`);
      }
      const steps = [
        row("1️⃣", "Restate the decision", `You are weighing whether <strong>${esc(s)}</strong> is a good idea.`),
        row("2️⃣", "Possible benefits", list(benefits)),
        row("3️⃣", "Possible costs and risks", list(costs)),
        row("4️⃣", "Who is affected", "You, the people around you, and anyone who depends on the outcome. A good decision asks who carries the downside."),
        row("5️⃣", "How to decide", list([
          "<strong>Purpose:</strong> what goal does it serve?",
          "<strong>Cost:</strong> can you afford the money, time and attention?",
          "<strong>Risk:</strong> what is the worst realistic outcome, and can you recover?",
          "<strong>Alternatives:</strong> is there a simpler or safer option?",
          "<strong>Values:</strong> does it fit what matters to you?"
        ])),
        row("6️⃣", "The lenses that fit", list(lenses.map(l => `<strong>${esc(l.name)}:</strong> ${esc(l.q)}`)))
      ];
      return {
        html: kicker("⚖️ Reasoning") + `<h3 class="ans-title">Weighing up ${esc(s)}</h3>` + steps.join("") +
          conclusion(`<strong>It depends on your goal and your limits.</strong> If the benefit is real, the cost is affordable and the worst case is recoverable, it is worth trying. If not, wait or choose a smaller first step.`),
        reasoning: [
          { title: "Classify", detail: "This is a judgement question, so a single 'yes' or 'no' would be dishonest." },
          { title: "Both sides", detail: "Listed benefits and costs before judging." },
          { title: "Criteria", detail: "Chose purpose, cost, risk, alternatives and values as the tests." },
          { title: "Conclusion", detail: "Gave a conditional answer instead of pretending certainty." }
        ],
        chips: ["What are the alternatives?", "How do I reduce the risk?", "Help me make a plan"]
      };
    }

    function planAnswer(subject, text, c) {
      const goal = subject || "your goal";
      const steps = [
        row("1️⃣", "Clarify the goal", `Write down what success looks like for <strong>${esc(goal)}</strong>. A vague goal cannot be planned.`),
        row("2️⃣", "Find what you already have", "List your time, money, skills, people and tools. Start from what exists."),
        row("3️⃣", "Break it into small steps", list([
          "Choose the smallest first action you can finish today.",
          "Put the steps in order and give each one a rough date.",
          "Decide what you will do if a step fails."
        ])),
        row("4️⃣", "Do the first step", "Momentum beats a perfect plan. Start small and adjust as you learn."),
        row("5️⃣", "Review and adjust", "At the end of each week, ask: what worked, what did not, and what changes next?")
      ];
      if (c) steps.splice(2, 0, row("📚", "What the knowledge adds", `${esc(c.summary)} ${esc(c.why)}`));
      const lenses = lensesFor(text);
      steps.push(row("🧭", "Keep an eye on", list(lenses.map(l => `<strong>${esc(l.name)}:</strong> ${esc(l.q)}`))));
      return {
        html: kicker("🗺️ Reasoning") + `<h3 class="ans-title">A plan for ${esc(goal)}</h3>` + steps.join("") +
          conclusion(`<strong>Start with one small, finishable action today.</strong> Then review and adjust — a plan is a direction, not a promise.`),
        reasoning: [
          { title: "Classify", detail: "This is a planning question, so the answer is a sequence of actions." },
          { title: "Work backwards", detail: "Started from the goal and broke it into smaller, checkable steps." },
          { title: "Reality check", detail: "Included resources, failure handling and review." },
          { title: "First move", detail: "Ended with one action that can be taken immediately." }
        ],
        chips: ["Make the steps smaller", "What could go wrong?", "How long will it take?"]
      };
    }

    function hypotheticalAnswer(subject, text, c) {
      const premise = subject || "that happened";
      const steps = [
        row("1️⃣", "State the premise", `Assume <strong>${esc(premise)}</strong>. Good reasoning starts by making the assumption explicit.`),
        row("2️⃣", "Immediate effects", "What changes first? Look for the direct, short-term consequences."),
        row("3️⃣", "Second-order effects", "What do those changes cause next? Trace at least two steps out."),
        row("4️⃣", "Who is affected", "Different people feel the same change differently. Ask who gains and who loses."),
        row("5️⃣", "What we cannot know", "A hypothetical is not a prediction. Say clearly which parts are likely and which are uncertain.")
      ];
      if (c) steps.splice(2, 0, row("📚", "What the knowledge suggests", `${esc(c.summary)} ${esc(c.how && c.how[0] ? c.how[0] : "")}`));
      return {
        html: kicker("🔮 Reasoning") + `<h3 class="ans-title">What if ${esc(premise)}?</h3>` + steps.join("") +
          conclusion(`<strong>Reasoned answer:</strong> the first effects are the most predictable; the further out you go, the more the answer depends on other conditions. I have not invented specific numbers or outcomes.`),
        reasoning: [
          { title: "Classify", detail: "This is a hypothetical, so I reasoned from a stated assumption." },
          { title: "Trace", detail: "Followed first-order and second-order consequences." },
          { title: "Bound", detail: "Separated what is likely from what is uncertain." },
          { title: "Check", detail: "Did not present speculation as fact." }
        ],
        chips: ["What could prevent it?", "Who would be affected most?", "What is the evidence?"]
      };
    }

    function quantityAnswer(subject, text, c) {
      const steps = [
        row("1️⃣", "What is being measured", `You are asking for an amount or measurement about <strong>${esc(subject || "this")}</strong>.`),
        row("2️⃣", "What a good answer needs", list([
          "The exact definition of what is being counted or measured.",
          "The numbers or facts that go into the calculation.",
          "The units, and whether the answer should be exact or an estimate."
        ])),
        row("3️⃣", "How to work it out", "Write the relationship (for example amount = rate × time), put in the values, calculate, then check the units and whether the size of the answer makes sense."),
        row("4️⃣", "What I will not do", "I will not invent a number. If you give me the figures I can calculate it exactly and show every step.")
      ];
      if (c) steps.splice(2, 0, row("📚", "Useful knowledge", `${esc(c.summary)} ${esc(c.why)}`));
      return {
        html: kicker("📐 Reasoning") + `<h3 class="ans-title">Working out ${esc(subject || "the amount")}</h3>` + steps.join("") +
          conclusion(`<strong>Give me the numbers and I will calculate it.</strong> I can show the formula, the working and a check.`),
        reasoning: [
          { title: "Classify", detail: "This is a quantitative question, so it needs a method and data." },
          { title: "Method", detail: "Identified the relationship and the units needed." },
          { title: "Honesty", detail: "Refused to invent figures that were not given." }
        ],
        chips: ["Show me an example calculation", "What formula do I use?", "Explain the units"]
      };
    }

    function reasoningMap(subject, text, intent) {
      const s = subject || "this topic";
      const lenses = lensesFor(text);
      const qt = tokens(text).slice(0, 6);
      const subQs = [
        `What exactly is <strong>${esc(s)}</strong>?`,
        `What causes it, or what is it made of?`,
        `What effects does it have, and on whom?`,
        `Who is involved, and what do they want?`,
        `What are the trade-offs, risks and alternatives?`,
        `What evidence would change our minds?`
      ];
      const steps = [
        row("1️⃣", "What you are really asking", `This is best treated as a <strong>${esc(intent)}</strong> question about <strong>${esc(s)}</strong>. Naming the type of question tells us what a good answer must contain.`),
        row("2️⃣", "Break it into smaller questions", list(subQs)),
        row("3️⃣", "What we can reason from the words", qt.length ? `The key ideas are <strong>${qt.map(esc).join(", ")}</strong>. Start by defining each one, because unclear words cause most confused arguments.` : "There are no strong key words yet, so start by defining the subject in one sentence."),
        row("4️⃣", "Lenses to think with", list(lenses.map(l => `<strong>${esc(l.name)}:</strong> ${esc(l.q)}`))),
        row("5️⃣", "How to reach a real answer", list([
          "Gather evidence from reliable sources and separate fact from opinion.",
          "Look for the strongest version of the other side, not a weak one.",
          "Check whether the conclusion follows from the evidence or from an assumption.",
          "Say what would prove you wrong — that is the mark of honest reasoning."
        ]))
      ];
      const h = heuristics.find(x => x.pattern === intent) || heuristics[0];
      if (h) steps.push(row("💡", "A reasoning habit that helps", esc(h.text)));
      return {
        html: kicker("🧭 Reasoning map") + `<h3 class="ans-title">Thinking clearly about ${esc(s)}</h3>` + steps.join("") +
          conclusion(`<strong>I can go deeper.</strong> Tell me which sub-question matters most — what it is, why it happens, what to do, or whether it is a good idea — and I will reason through that part with you.`),
        reasoning: [
          { title: "Classify", detail: `Treated it as a ${intent} question.` },
          { title: "Decompose", detail: "Broke the topic into six smaller, answerable questions." },
          { title: "Lens", detail: "Chose the lenses that fit the words in the question." },
          { title: "Method", detail: "Gave a way to reach a defensible answer rather than inventing one." }
        ],
        chips: ["What is it exactly?", "Why does it happen?", "What should I do about it?"]
      };
    }

    function identityAnswer() {
      return {
        html: kicker("💡 About me") + `<h3 class="ans-title">I am Chiedza AI</h3>` +
          row("🧠", "What I do", "I reason step by step about almost anything — definitions, how things work, why things happen, pros and cons, decisions, plans, hypotheticals and whole topics — and I build complete websites from a short description.") +
          row("📚", "How I think", "I use a folder of knowledge and reasoning files. I match your question to what I know, break it into parts, apply the relevant rules, and show my working.") +
          row("🛡️", "What I will not do", "I do not invent facts, phone numbers, prices or quotes. When I do not know, I say so and give you a reasoning map instead of a guess.") +
          row("🌐", "What I can build", "A full multi-page website — business, shop, restaurant, salon, school, church, portfolio, farm, clinic, tech, event, blog or personal — with preview, code and a ZIP download.") +
          conclusion(`Try: <em>Explain photosynthesis</em>, <em>Should I start a small business?</em>, <em>How do I study better?</em> or <em>Build a website for my bakery</em>.`),
        reasoning: [
          { title: "Identify", detail: "You asked about my capabilities, so I described my reasoning skills honestly." },
          { title: "Scope", detail: "Listed what I can and cannot do." }
        ],
        chips: ["Explain photosynthesis", "Should I start a small business?", "How do I study better?", "Build a website for my bakery"]
      };
    }

    function greetingAnswer() {
      return {
        html: kicker("👋 Hello") + `<h3 class="ans-title">Mhoro! I am Chiedza AI</h3>` +
          `<p class="ans-p">I can reason through almost anything with you — explain ideas, weigh decisions, make plans, explore "what if" questions and analyse topics — and I can build you a complete website.</p>` +
          conclusion(`What would you like to think about today?`),
        reasoning: [],
        chips: ["Explain photosynthesis", "Should I start a small business?", "How do I study better?", "Build a website for my bakery"]
      };
    }

    function thanksAnswer() {
      return {
        html: kicker("😊 You're welcome") + `<h3 class="ans-title">Happy to help</h3><p class="ans-p">If you want to go deeper on anything, just ask. I will show my reasoning every time.</p>`,
        reasoning: [],
        chips: ["Ask me something new", "Explain how reasoning works"]
      };
    }

    /* ---------- main ---------- */
    function reason(input) {
      const text = String(input || "").trim();
      if (text.length < 3) return null;
      if (looksLikeMath(text)) return null;
      if (looksLikeSiteCommand(text)) return null;

      const intent = intentOf(text);
      if (intent === "greeting") return greetingAnswer();
      if (intent === "thanks") return thanksAnswer();
      if (intent === "identity") return identityAnswer();

      const hit = scoreConcept(text);
      const c = hit && hit.c;
      const subject = subjectOf(text);

      if (intent === "proscons") return prosConsAnswer(subject, text, c);
      if (intent === "plan") return planAnswer(subject, text, c);
      if (intent === "hypothetical") return hypotheticalAnswer(subject, text, c);
      if (intent === "quantity") return quantityAnswer(subject, text, c);
      if (intent === "analysis") return c ? analysisAnswer(c, subject) : reasoningMap(subject, text, intent);
      if (intent === "compare") return c ? analysisAnswer(c, subject) : reasoningMap(subject, text, intent);

      if (c) {
        if (intent === "definition") return defAnswer(c, text);
        if (intent === "how") return howAnswer(c);
        if (intent === "why") return whyAnswer(c);
        return analysisAnswer(c, subject);
      }

      // no concept matched: reason from first principles, never invent facts
      if (intent === "definition" || intent === "how" || intent === "why" || intent === "open") {
        return reasoningMap(subject, text, intent);
      }
      return reasoningMap(subject, text, intent);
    }

    return { reason, intentOf, subjectOf, scoreConcept, concepts, lensesFor };
  }

  /* ---------- browser wiring ---------- */
  function wire() {
    const Br = root.ChiedzaBrain; if (!Br) return;
    const get = u => fetch("brain/knowledge/" + u, { cache: "no-cache" }).then(r => { if (!r.ok) throw new Error(u); return r.json(); });
    Br.ready.then(async () => {
      let general;
      try { general = await get("general.json"); }
      catch (e) { console.warn("Chiedza general knowledge could not be loaded.", e.message); return; }
      const E = create({ general }, { esc: Br.esc, tokens: Br.tokens });
      root.ChiedzaGeneral = E;
      Br.register({
        name: "general",
        priority: 100,
        handle(input) {
          let r; try { r = E.reason(input); } catch (e) { console.warn("general reasoning error", e); return null; }
          if (!r) return null;
          return { html: r.html, chips: r.chips, reasoning: r.reasoning };
        }
      });
    });
  }
  const api = { create };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else { root.ChiedzaGeneralCore = api; wire(); }
})(typeof window !== "undefined" ? window : globalThis);
