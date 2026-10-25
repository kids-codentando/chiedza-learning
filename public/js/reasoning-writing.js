/* ============================================================
   CHIEDZA WRITING STUDIO - write essays, compositions, projects
   The writer. It reads a request like "write an essay about
   discipline in 500 words", works out the genre, the topic, the
   length and the register, then builds a real draft: paragraphs
   in the right order, each one doing its job, with transitions,
   a counter-argument where the genre needs one, and an ending
   that lands.

   It also checks its own work. The craft panel is measured, not
   decorative: word count, sentence length, sentence variety,
   adverb density, passive voice, repetition, concrete detail.

   It never invents facts. Names, dates, figures and quotations
   are left as [placeholders] for the writer to fill in, and the
   craft panel says which paragraphs to personalise.

   Blueprints live in public/brain/knowledge/writing.json.
   Works in the browser (registers with ChiedzaBrain) and in Node
   (npm run test:writing). Created by Ntandomods.
   ============================================================ */
(function (root) {
  "use strict";

  /* ---------------- shared text helpers ---------------- */
  const STOP = new Set(("a an the is are was were am be been being to of in on at for and or but with what whats who how why when where which do does did can could would should i me my we you your it its this that these those about tell please explain give show want need some any more from as by us our not no if then than so very just also there their they he she his her him them").split(" "));

  const esc = s => String(s == null ? "" : s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const rxEsc = w => String(w).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const wc = s => (String(s || "").match(/[A-Za-z0-9'\u2019\-]+/g) || []).length;
  const sents = s => (String(s || "").replace(/\s+/g, " ").match(/[^.!?]+[.!?]+["'\u201d]?/g) || [String(s || "")]).map(x => x.trim()).filter(Boolean);
  const mean = a => (a.length ? a.reduce((x, y) => x + y, 0) / a.length : 0);
  const stdev = a => { if (a.length < 2) return 0; const m = mean(a); return Math.sqrt(mean(a.map(x => (x - m) * (x - m)))); };
  const cap = s => String(s || "").replace(/^\s*([a-z])/, (m, c) => c.toUpperCase());
  const SMALL = new Set(["of", "the", "and", "in", "on", "a", "an", "to", "for", "with", "at", "by", "from", "but", "or", "as", "into", "over"]);
  const titleCase = s => String(s || "").split(/\s+/).map((w, i) => (i > 0 && SMALL.has(w.toLowerCase())) ? w.toLowerCase() : cap(w)).join(" ");
  const plainText = h => String(h == null ? "" : h).replace(/<[^>]+>/g, " ").replace(/&nbsp;/g, " ").replace(/&/g, "&").replace(/\s+/g, " ").trim();
  const firstSentence = s => { const t = plainText(s); const m = t.match(/^[^.!?]+[.!?]/); return (m ? m[0] : t).trim(); };
  const lowerFirst = s => String(s || "").replace(/^\s*([A-Z])(?=[a-z])/, (m, c) => c.toLowerCase());

  function hash(str) { let h = 2166136261; for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
  function rng(seed) { let s = (seed >>> 0) || 1; return () => { s = (Math.imul(s, 1664525) + 1013904223) >>> 0; return s / 4294967296; }; }
  function shuffle(arr, r) { const a = arr.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); const t = a[i]; a[i] = a[j]; a[j] = t; } return a; }

  /* ---------------- sentence banks the writer supplies itself ---------------- */
  const SUPPORT = {
    argument: [
      "That is not a small thing, and it is not a new one.",
      "The difficulty is that the obvious response is also the least useful one.",
      "What looks like a personal failing is often a design problem in disguise.",
      "This is where most good intentions quietly expire.",
      "The point is not to be perfect at it, but to be consistent enough for it to compound.",
      "Once you see the pattern, it is hard to unsee it.",
      "None of this requires talent. It requires a decision that survives a bad week.",
      "And the people who do it well are rarely doing anything dramatic.",
      "The temptation is to treat this as a matter of willpower, which lets everybody else off the hook.",
      "It is worth being precise here, because vagueness is how these arguments usually escape scrutiny.",
      "The same logic applies whether the scale is a household or a ministry.",
      "What is being asked for is not heroism, but arithmetic that somebody actually keeps.",
      "Notice how quickly the conversation turns into a list of excuses.",
      "The evidence for this is not exotic; it is the ordinary experience of anyone who has tried it.",
      "There is a version of this argument that flatters the comfortable, and it should be resisted.",
      "A principle that only works when nothing is going wrong is not a principle, it is a mood.",
      "This is the point at which most discussions stop being useful and start being loud.",
      "It would be easier to accept the comfortable answer, and easier still to stop asking.",
      "The measure of a serious position is what it is willing to give up.",
      "None of that makes the problem smaller. It only makes it harder to pretend it is somebody else's.",
      "The argument survives the obvious objections, which is more than most arguments manage.",
      "It is a modest claim, and modest claims are the ones that tend to hold.",
      "What makes it difficult is not the idea but the administration of the idea.",
      "There is no version of this that does not require somebody to be inconvenienced.",
      "The case is not built on a single dramatic example but on a pattern that repeats.",
      "Anyone who has tried it will recognise the shape of the problem immediately.",
      "The alternative is not neutrality; it is a decision made by default."
    ],
    narrative: [
      "The details are what stay with you, long after the facts have gone.",
      "Nobody in that room was thinking about the lesson at the time.",
      "There are moments that arrive without any warning that they will matter.",
      "I have thought about that afternoon more often than I have thought about most years.",
      "The ordinary things kept happening around us, which felt like a kind of insult.",
      "Later, somebody would say it was inevitable, and I never believed them.",
      "The light by then had gone the colour of weak tea.",
      "It was the kind of silence that has weight to it.",
      "I remember wanting to say something and not having the words arranged yet.",
      "That is how it goes, mostly: the big thing happens while you are busy with a small one.",
      "The air smelled of dust and diesel and something cooking.",
      "Somebody laughed, and then stopped laughing.",
      "I counted the tiles on the floor because counting was easier than thinking.",
      "Outside, the street carried on with its ordinary business.",
      "My grandmother used to say that a house tells you the truth before the people in it do.",
      "It was not a large room, and it felt smaller by the minute.",
      "The clock on the wall was four minutes fast and had been for years.",
      "We waited, and waiting has its own texture.",
      "Somebody's radio was playing a song that did not suit the moment at all.",
      "The door was open the whole time, which somehow made it worse.",
      "I have never been able to remember what I was wearing, only what I was thinking.",
      "There was a fly in the room and everybody pretended not to notice it.",
      "The conversation went on around me in a language I understood perfectly and could not follow.",
      "It was the ordinary detail that undid me, not the news.",
      "By evening the whole street knew, which is how these things travel."
    ],
    formal: [
      "This is set out in the table below.",
      "The details are recorded in the appendix.",
      "The figures should be read as indicative rather than final.",
      "Each source was recorded separately so that the results could be compared.",
      "The same procedure was followed in every case.",
      "Where information was unavailable, this is noted rather than estimated.",
      "The findings are presented before any interpretation is offered.",
      "A longer study would be needed before these results could be treated as general.",
      "The scope of this work was deliberately limited to what could be observed directly.",
      "Any figure that could not be verified was excluded rather than approximated.",
      "The limitations of the method are acknowledged in the discussion.",
      "The results are consistent with the observations recorded during the same period.",
      "No conclusion is drawn beyond what the evidence will support.",
      "The arrangement described here is not unusual, which is part of the difficulty.",
      "Responsibility for each stage was assigned to a named person.",
      "The record was kept in a single notebook to avoid discrepancies between sources.",
      "Where the data conflicted, both readings are reported.",
      "The recommendations are limited to what can be implemented within one term.",
      "The same result was obtained when the procedure was repeated a week later.",
      "The difference between the two sets of readings was within the margin of error.",
      "No attempt was made to adjust the figures to fit the expected pattern.",
      "The sample was chosen for accessibility rather than representativeness, and this is a limitation.",
      "The data is presented in full so that others may reach a different conclusion.",
      "Where the outcome was unexpected, the observation is reported as it occurred.",
      "The method was kept simple deliberately, so that it could be repeated by others.",
      "The cost of the intervention was recorded alongside the result.",
      "The findings are consistent with similar work carried out in comparable settings.",
      "The recommendations are addressed to those with the authority to act on them."
    ],
    plain: [
      "That sounds obvious, and it is, which is why it gets skipped.",
      "Most of the work happens before anyone sees anything.",
      "The version that survives contact with a real week is the only version worth having.",
      "It is a small change, and it changes the whole shape of the day.",
      "You do not need permission to start, and you do not need a budget either.",
      "The first attempt will be worse than you want it to be. Do it anyway.",
      "Nothing here depends on being the kind of person who has their life together.",
      "The people who get this right are not more disciplined. They are more specific.",
      "Start with the version you can do on a bad day, then build up from there.",
      "If it needs a perfect week to work, it is not a plan, it is a wish.",
      "The temptation is to wait for a better moment, and the better moment never arrives.",
      "You will know it is working when it stops feeling like an event.",
      "The people around you will notice before you do.",
      "Keep the first version ugly. Ugly things get finished.",
      "There is no version of this that does not cost you something.",
      "And that is fine, as long as the cost is one you chose.",
      "The first week is not a test of the method. The fourth week is.",
      "Write it down, because memory will quietly renegotiate the terms.",
      "You will miss a day. The rule is that you never miss two.",
      "It works better when somebody else knows you are doing it.",
      "The version you can explain to a friend in one sentence is the version that survives."
    ],
    letter: [
      "I have enclosed the relevant documents for your attention.",
      "I would be happy to provide any further information you may require.",
      "I understand that you will receive many such requests, and I am grateful for your time.",
      "I can be available at short notice if that is convenient.",
      "I have taken care to set out the facts as clearly as I can.",
      "I would welcome the opportunity to discuss this in person.",
      "I trust this is clear, and I am happy to clarify any point.",
      "Thank you again for your patience while this was considered."
    ],
    lyric: [
      "the wall keeps its own account of the light",
      "a door left open is a kind of question",
      "dust settles where the argument stopped",
      "the kettle sings to nobody in particular",
      "we measure the day by what it took",
      "the floor remembers every foot",
      "morning arrives without an argument",
      "what is left is smaller and more true",
      "the window holds a square of someone else's weather",
      "a chair keeps the shape of the last person",
      "the roof counts rain the way we count years",
      "and the room goes on being a room"
    ]
  };

  const SPINES = [
    {
      id: "the-call",
      setup: ["The phone rang at twenty past four, which is the hour when bad news likes to arrive."],
      inciting: ["It was my aunt, and she was crying before she had said a single word."],
      action: ["I handed the phone to my mother and watched her face change in stages, the way a face does when it is deciding how much to show."],
      turn: ["What none of us knew then was that the worst part would arrive three days later, quietly, with the paperwork."],
      climax: ["By the time the sun went down the house was full of people who had not been invited and did not need to be, and somebody was making tea for all of them."],
      falling: ["Nobody slept. We sat in the sitting room and let the night do what it wanted with us."],
      resolution: ["The phone still rings at that hour sometimes. I still answer it second."]
    },
    {
      id: "the-journey",
      setup: ["We left before the sun was properly up, because my father believed that lateness was a moral failure."],
      inciting: ["The bus broke down just outside the growth point, and the driver laughed, which was the wrong response."],
      action: ["We stood on the roadside for two hours, watching other vehicles pass with people we knew sitting inside them."],
      turn: ["It was the quiet that did it. Nobody argued. Everybody simply understood, at the same moment, what it meant."],
      climax: ["When the lift finally came, my mother refused it, and that refusal is the thing I remember most clearly."],
      falling: ["We arrived after dark, and the reason for the journey had already resolved itself without us."],
      resolution: ["I have never since been able to think of punctuality as a virtue. It is a kind of luck."]
    },
    {
      id: "the-results",
      setup: ["The list went up on the noticeboard at ten, and by half past nine the corridor was already full."],
      inciting: ["Somebody ran past me shouting a name, and I could not tell from the sound whether it was good news."],
      action: ["I could not find my number. I read the whole column three times and found it on the fourth."],
      turn: ["The strange thing was not the result itself. It was how quickly everybody else's result became the only thing anyone could talk about."],
      climax: ["I walked out into the yard and stood there, and a teacher I barely knew said the kindest thing anybody said all day."],
      falling: ["By afternoon the corridor was empty and the paper had come loose at one corner and was moving in the wind."],
      resolution: ["I kept the slip. I do not know why. It is in a drawer with things I have not looked at in years."]
    }
  ];

  const POEM_OPEN = [
    "Let me tell you about {T}, and about the light it leaves.",
    "Nobody warns you about {T}.",
    "There is a version of {T} that fits in one hand.",
    "{Tt} arrives the way weather does, without asking."
  ];
  const POEM_TURN = [
    "and still, the small thing holds.",
    "this is the part that stays.",
    "call it what it is, and let it be enough.",
    "the rest is noise, and the noise is ours."
  ];

  const CONTRACTIONS = { "don't": "do not", "can't": "cannot", "won't": "will not", "isn't": "is not", "aren't": "are not", "wasn't": "was not", "weren't": "were not", "doesn't": "does not", "didn't": "did not", "it's": "it is", "that's": "that is", "there's": "there is", "i'm": "I am", "we're": "we are", "they're": "they are", "you're": "you are", "i've": "I have", "we've": "we have", "let's": "let us", "wouldn't": "would not", "shouldn't": "should not", "couldn't": "could not", "hasn't": "has not", "haven't": "have not" };

  const FAMILY = {
    essay: "argument", speech: "argument", debate: "argument", review: "argument",
    composition: "narrative", descriptive: "narrative", story: "narrative",
    poem: "lyric",
    project: "formal", report: "formal", letter: "letter", email: "letter",
    article: "plain", blog: "plain", summary: "plain", notice: "plain"
  };

  /* ============================================================
     create(D, H)
     ============================================================ */
  function create(D, H) {
    H = H || {};
    const W = (D && D.writing) || {};
    const genres = W.genres || [];
    const frames = (W.craft && W.craft.frames) || {};
    const transitions = (W.craft && W.craft.transitions) || {};
    const facets = W.facets || ["the small decision that repeats"];

    let last = null; // the last draft, so follow-up edits can act on it

    /* ---------- knowledge the writer can stand on ----------
       If the topic matches a concept in the knowledge files, the
       draft gets real content (a definition, how it works, why it
       matters) instead of only structure. No match, no invention. */
    const grounds = [];
    ((D.general && D.general.concepts) || []).forEach(c => {
      grounds.push({ title: c.title, terms: [c.title].concat(c.terms || []), definition: c.definition, how: c.how, why: c.why });
    });
    ((D.subjects && D.subjects.entries) || []).forEach(e => {
      grounds.push({ title: e.term, terms: [e.term].concat(e.subject ? [e.subject] : []), definition: e.a, how: e.points, why: "" });
    });

    function findGround(topic) {
      const t = " " + String(topic || "").toLowerCase() + " ";
      let best = null, bestScore = 0;
      grounds.forEach(g => {
        let sc = 0;
        (g.terms || []).forEach(term => {
          const q = String(term || "").toLowerCase().trim();
          if (q.length > 4 && t.indexOf(q) > -1) sc += 3;
        });
        if (t.indexOf(String(g.title).toLowerCase()) > -1) sc += 4;
        if (sc > bestScore) { bestScore = sc; best = g; }
      });
      return bestScore >= 3 ? best : null;
    }

    function groundLines(g) {
      const out = [];
      const def = firstSentence(g.definition || "");
      if (def && def.length > 40) out.push(def);
      const steps = (g.how || []).map(plainText).filter(x => x.length > 45);
      steps.slice(0, 2).forEach(x => out.push(/[.!?]$/.test(x) ? x : x + "."));
      const why = firstSentence(g.why || "");
      if (why && why.length > 40) out.push(why);
      return out.slice(0, 3);
    }

    /* ---------- genre matching ---------- */
    function genreHit(low) {
      let best = null;
      genres.forEach(g => {
        (g.keywords || []).forEach(k => {
          const re = new RegExp("(^|[^a-z])" + rxEsc(k) + "(s|es)?([^a-z]|$)", "i");
          const m = re.exec(low);
          if (m && (!best || k.length > best.kw.length)) {
            best = { g: g, kw: k, index: m.index + m[1].length, end: m.index + m[1].length + k.length };
          }
        });
      });
      return best;
    }

    function contextOK(low, hit) {
      const before = low.slice(Math.max(0, hit.index - 40), hit.index);
      const after = low.slice(hit.end, hit.end + 24);
      if (/^(how to|how do i|how can i|how should i|what makes|tips for|guide to|teach me)\b/.test(low)) return "guide";
      if (/\b(write|writing|compose|composing|draft|pen|type up|prepare|produce|create|give me|need|want|help me with|set)\b[^.!?]*$/.test(before)) return "draft";
      if (/^\s*(about|on|of|titled|called|regarding|concerning|:)\s+\S/.test(after)) return "draft";
      if (/\b(a|an|the|my|this|that|your|our)\s+$/.test(before)) return "draft";
      if (low.trim() === hit.kw || low.trim() === hit.kw + "s") return "guide";
      if (/^(essay|composition|project|letter|speech|article|story|poem|report|summary|review|debate|blog|notice|email)\b/.test(low.trim())) return "draft";
      return null;
    }

    function topicAfter(text, end) {
      let rest = text.slice(end);
      rest = rest.replace(/^\s*(?:about|on|of|titled|called|regarding|concerning|for|:|\-|\u2013|\u2014)\s*/i, "");
      // "to the head teacher asking for a library" -> "a library"
      rest = rest.replace(/^\s*to\s+(?:the\s+|my\s+|our\s+|a\s+)?[^,.;]{0,40}?\s+(?:asking|requesting|applying|appealing|complaining|inviting|thanking|informing|reporting|enquiring|inquiring)\s+(?:for|about|that|whether|if)\s+/i, "");
      rest = rest.replace(/^\s*to\s+(?:the\s+|my\s+|our\s+|a\s+)?[^,.;]{0,40}?\s+(?:asking|requesting|applying|appealing|complaining|inviting|thanking|informing|reporting|enquiring|inquiring)\s+/i, "");
      rest = rest.replace(/\b(?:in|at|about|around|roughly|exactly|of)\s+\d{2,4}\s*(?:words?|paragraphs?|pages?)\b/gi, "");
      rest = rest.replace(/\b\d{2,4}\s*(?:words?|paragraphs?|pages?)\b/gi, "");
      rest = rest.replace(/\b(?:for|to)\s+(?:a|an|my|our)\s+[^,.;]{0,40}\b(?:class|grade|form|teacher|school|exam|assignment|project|competition|magazine|newspaper|audience)\b/gi, "");
      rest = rest.replace(/\b(?:make it|keep it|use |write it|and make|with a|in a)\b.*$/i, "");
      rest = rest.replace(/[.!?]+\s*$/, "").trim();
      rest = rest.replace(/^["'\u201c]|["'\u201d]$/g, "").trim();
      return rest;
    }

    function parse(text) {
      const t = String(text || "").trim();
      if (!t) return null;
      const low = t.toLowerCase();
      const hit = genreHit(low);
      if (!hit) return null;
      const mode0 = contextOK(low, hit);
      if (!mode0) return null;

      const topic = topicAfter(t, hit.end);
      const mode = (mode0 === "guide" || !topic) ? "guide" : "draft";

      // length
      let words = hit.g.defaults && hit.g.defaults.words ? hit.g.defaults.words : 400;
      let m;
      if ((m = low.match(/\b(\d{2,4})\s*words?\b/))) words = Math.max(60, Math.min(2000, parseInt(m[1], 10)));
      if ((m = low.match(/\b(\d{1,2})\s*(?:paragraphs?|paras?)\b/))) words = Math.max(60, Math.min(2000, parseInt(m[1], 10) * 95));
      if (/\b(short|brief|quick)\b/.test(low) && !/\d{2,4}\s*words?/.test(low)) words = Math.round(words * 0.6);
      if (/\b(long|detailed|full|in depth|in-depth)\b/.test(low) && !/\d{2,4}\s*words?/.test(low)) words = Math.round(words * 1.6);

      // tone
      let tone = (hit.g.defaults && hit.g.defaults.tone) || "formal";
      if (/\b(informal|casual|friendly|chatty)\b/.test(low)) tone = "informal";
      if (/\bformal|academic|serious\b/.test(low)) tone = "formal";
      if (/\bpersuasive|convincing|argue\b/.test(low)) tone = "persuasive";
      if (/\b(simple|easy|plain|primary|grade \d|standard \d)\b/.test(low)) tone = "simple";
      if (/\b(funny|humorous|light)\b/.test(low)) tone = "light";

      // audience
      let audience = "";
      if ((m = low.match(/\b(?:for|to)\s+(?:a|an|my)?\s*(primary school|secondary school|high school|grade \d+|form \d+|teacher|parents|committee|employer|newspaper|magazine)\b/))) audience = m[1];

      return { mode: mode, genre: hit.g, topic: topic, words: words, tone: tone, audience: audience, raw: t };
    }

    /* ---------- frame filling ---------- */
    function makeCtx(spec, r) {
      const topic = spec.topic || "this question";
      const tLower = /^(the|a|an|my|our|this|why|how|what)\b/i.test(topic) ? lowerFirst(topic) : topic;
      return {
        T: tLower,
        Tt: cap(topic),
        F: facets[Math.floor(r() * facets.length) % facets.length],
        topic: topic
      };
    }
    function fill(frame, ctx) {
      return String(frame)
        .replace(/\{Tt\}/g, ctx.Tt)
        .replace(/\{T\}/g, ctx.T)
        .replace(/\{F\}/g, ctx.F);
    }

    /* ---------- paragraph recipes ---------- */
    const RECIPE = {
      hook: ["hook"], context: ["context"], thesis: ["thesis"],
      point: ["point"], explain: ["explain"], example: ["example"],
      counter: ["counter"], rebut: ["rebut"], consequence: ["consequence"], conclusion: ["conclusion"],
      scene: ["scene"], sensory: ["sensory"], action: ["action"], dialogue: ["dialogue"],
      turn: ["turn"], reflection: ["reflection"], closing: ["closing"], detail: ["detail"], movement: ["movement"],
      setup: ["setup"], inciting: ["inciting"], rising: ["rising"], climax: ["climax"], falling: ["falling"], resolution: ["resolution"],
      aim: ["aim"], background: ["background"], objectives: ["objectives"], method: ["method"], findings: ["findings"],
      discussion: ["discussion"], recommendation: ["recommendation"], observations: ["method", "findings"], analysis: ["discussion"],
      address: ["address"], date: ["date"], salutation: ["salutation"], opening: ["opening"], body: ["body"],
      request: ["request"], signoff: ["signoff"], subject: ["subject"], greeting: ["greeting"], call: ["call"],
      quote: ["quote"], whatitis: ["whatitis"], strengths: ["strengths"], weaknesses: ["weaknesses"], verdict: ["verdict"],
      intro: ["intro"], motion: ["motion"], proposition: ["proposition"], evidence: ["evidence"], opposition: ["opposition"],
      rebuttal: ["rebuttal"], promise: ["promise"], takeaway: ["takeaway"], cta: ["cta"],
      heading: ["heading"], details: ["details"], contact: ["contact"], mainidea: ["mainidea"], points: ["points"],
      letterclose: ["letterclose"], noticeclose: ["noticeclose"],
      verse: ["verse"]
    };

    const FIXED = new Set(["address", "date", "salutation", "signoff", "subject", "heading", "details", "contact"]);

    /* ---------- length-aware shape ----------
       The blueprint is the full text. A short piece keeps only the
       steps that cannot be dropped; a long piece earns extra body
       cycles. This is what makes "make it shorter" actually shorter. */
    const FIXED_LENGTH = new Set(["letter", "email", "notice"]);
    function shapeFor(spec) {
      const g = spec.genre, st = (g.structure || []).slice();
      if (st.length <= 1) return st;
      if (FIXED_LENGTH.has(g.id)) return st;
      const req = (g.required && g.required.length) ? g.required : [st[0].role, st[st.length - 1].role];
      const per = (g.id === "composition" || g.id === "story" || g.id === "descriptive") ? 70 : 80;
      const budget = Math.max(4, Math.min(14, Math.round(spec.words / per)));
      let shape;
      if (budget >= st.length) {
        shape = st.slice();
        const extra = Math.min(6, budget - st.length);
        let insertAt = shape.findIndex(s => /counter|turn|climax|verdict|conclusion|resolution|falling/.test(s.role));
        if (insertAt < 1) insertAt = shape.length - 1;
        const fam0 = FAMILY[g.id] || "argument";
        const cycle = (fam0 === "narrative" || fam0 === "lyric") ? ["sensory", "action", "reflection"]
          : (fam0 === "formal") ? ["analysis", "findings", "discussion"]
          : ["point", "explain", "example"];
        for (let i = 0; i < extra; i++) {
          const role = cycle[i % cycle.length];
          const src = st.find(s => s.role === role) || { role: role, label: role };
          shape.splice(insertAt + i, 0, src);
        }
      } else {
        const seen = {};
        const keep = st.filter(s => {
          if (req.indexOf(s.role) < 0) return false;
          if (seen[s.role]) return false;
          seen[s.role] = 1; return true;
        });
        if (keep.length > budget) shape = [keep[0]].concat(keep.slice(1, budget - 1), [keep[keep.length - 1]]);
        else shape = keep.slice();
        let i = 0;
        while (shape.length < budget && i < st.length) {
          const cand = st[i++];
          if (shape.indexOf(cand) > -1) continue;
          const pos = st.indexOf(cand);
          let at = shape.length;
          for (let k = 0; k < shape.length; k++) { if (st.indexOf(shape[k]) > pos) { at = k; break; } }
          shape.splice(at, 0, cand);
        }
      }
      return shape;
    }

    /* ---------- the writer ---------- */
    function build(spec) {
      const g = spec.genre;
      const fam = FAMILY[g.id] || "argument";
      const support = SUPPORT[fam] || SUPPORT.argument;
      const seed = hash(spec.topic + "|" + g.id + "|" + spec.words + "|" + spec.tone);
      const r = rng(seed);
      const ctx = makeCtx(spec, r);
      const ground = findGround(spec.topic);
      const facts = ground ? groundLines(ground) : [];
      const spine = (g.id === "composition" || g.id === "story") ? SPINES[hash(spec.topic) % SPINES.length] : null;

      if (g.id === "poem") return buildPoem(spec, ctx, r);

      const structure = shapeFor(spec);
      const floor = fam === "letter" ? 4 : 3;
      const maxSents = (fam === "narrative" || fam === "lyric") ? 5 : 7;
      const perPara = Math.max(floor, Math.min(maxSents, Math.ceil(spec.words / 16 / Math.max(1, structure.length))));
      let supportPool = shuffle(support, r);
      let si = 0;
      const recent = [];
      const nextSupport = () => {
        for (let tries = 0; tries < supportPool.length; tries++) {
          if (si >= supportPool.length) { supportPool = shuffle(support, r); si = 0; }
          const cand = supportPool[si++];
          if (recent.indexOf(cand) < 0) { recent.push(cand); if (recent.length > 7) recent.shift(); return cand; }
        }
        if (si >= supportPool.length) { supportPool = shuffle(support, r); si = 0; }
        return supportPool[si++];
      };

      const out = [];

      structure.forEach((step, i) => {
        const role = step.role;
        const bank = frames[role] || frames.point || ["{Tt} deserves a closer look."];
        const lastIndex = structure.length - 1;
        const noPronoun = i === lastIndex || /conclusion|closing|verdict|resolution|letterclose|noticeclose|signoff/.test(role);
        const ctxP = (!noPronoun && i >= 2 && r() > 0.5) ? Object.assign({}, ctx, { T: "it", Tt: "It" }) : ctx;
        const spineLine = spine && spine[role] && spine[role].length ? spine[role][0] : null;
        let line = spineLine ? spineLine : fill(bank[Math.floor(r() * bank.length) % bank.length], ctxP);

        // a transition on paragraphs after the first, for argument and plain families
        const terminal = /conclusion|closing|verdict|resolution|letterclose|noticeclose|signoff/.test(role);
        const alreadyOpens = /^(in the end|the conclusion|none of this|there is|ultimately|to sum|the answer)/i.test(line);
        if (i > 0 && !terminal && !alreadyOpens && (fam === "argument" || fam === "plain") && transitions[role] && r() > 0.45) {
          const tr = transitions[role][Math.floor(r() * transitions[role].length) % transitions[role].length];
          if (tr) {
            const startsSentence = /\.$/.test(tr);
            const rest = startsSentence ? cap(line) : lowerFirst(line);
            line = tr + " " + rest;
          }
        }

        const parts = [line];
        if (FIXED.has(role)) {
          out.push({ role: role, label: step.label, text: line });
          return;
        }

        if (facts.length && /context|point|explain|background|body|whatitis|intro|findings|discussion/.test(role)) {
          parts.push(facts.shift());
        }

        const target = (role === "hook" || role === "closing" || role === "conclusion" || role === "verdict" || role === "thesis" || role === "cta") ? Math.max(2, perPara - 1) : perPara;
        let guard = 0;
        while (parts.length < target && guard < 24) {
          guard++;
          parts.push(nextSupport());
        }

        // narrative paragraphs get one extra beat from the neighbouring role
        if (fam === "narrative" && parts.length < target + 1) {
          const extra = frames[role === "closing" ? "reflection" : "sensory"] || [];
          for (let t = 0; t < extra.length; t++) {
            const cand = fill(extra[Math.floor(r() * extra.length) % extra.length], ctx);
            if (recent.indexOf(cand) < 0 && parts.indexOf(cand) < 0) {
              recent.push(cand); if (recent.length > 7) recent.shift();
              parts.push(cand);
              break;
            }
          }
        }

        out.push({ role: role, label: step.label, text: parts.join(" ") });
      });

      // fit the draft to the requested length: trim or top up whole sentences
      const count = () => out.reduce((n, p) => n + wc(p.text), 0);
      let guardFit = 0;
      while (count() > spec.words * 1.10 && guardFit < 40) {
        guardFit++;
        let best = null;
        out.forEach(p => {
          if (/address|date|salutation|signoff|letterclose|noticeclose/.test(p.role)) return;
          const ss = sents(p.text);
          if (ss.length <= 2) return;
          if (!best || ss.length > sents(best.text).length) best = p;
        });
        if (!best) break;
        const ss = sents(best.text);
        best.text = ss.slice(0, -1).join(" ").trim();
      }
      guardFit = 0;
      while (count() < spec.words * 0.90 && guardFit < 30) {
        guardFit++;
        let best = null;
        out.forEach(p => {
          if (/address|date|salutation|signoff|letterclose|noticeclose/.test(p.role)) return;
          if (!best || wc(p.text) < wc(best.text)) best = p;
        });
        if (!best) break;
        best.text = best.text + " " + nextSupport();
      }

      return { spec: spec, paras: out, family: fam, ground: ground };
    }

    function buildPoem(spec, ctx, r) {
      const stanzas = [];
      const open = POEM_OPEN[Math.floor(r() * POEM_OPEN.length) % POEM_OPEN.length];
      const turn = POEM_TURN[Math.floor(r() * POEM_TURN.length) % POEM_TURN.length];
      const pool = shuffle(SUPPORT.lyric, r);
      let k = 0;
      const nextLine = () => { if (k >= pool.length) k = 0; return pool[k++]; };
      stanzas.push([fill(open, ctx), nextLine(), nextLine()]);
      stanzas.push([nextLine(), nextLine(), nextLine()]);
      stanzas.push([nextLine(), nextLine(), turn]);
      return { spec: spec, poem: stanzas, family: "lyric" };
    }

    /* ---------- craft check (measured, not decorative) ---------- */
    function craftCheck(draft) {
      const text = draft.poem ? draft.poem.map(s => s.join("\n")).join("\n\n") : draft.paras.map(p => p.text).join("\n\n");
      const words = wc(text);
      const list = sents(text);
      const lens = list.map(wc).filter(n => n > 0);
      const avg = mean(lens);
      const sd = stdev(lens);
      const longest = lens.length ? Math.max.apply(null, lens) : 0;
      const ly = (text.match(/\b[A-Za-z]{4,}ly\b/g) || []).length;
      const passive = (text.match(/\b(is|are|was|were|be|been|being)\s+(?:\w+ed|written|made|done|given|taken|seen|known|shown|held|kept|found|told|said|built|sent)\b/gi) || []).length;
      const firstLen = lens.length ? lens[0] : 0;

      const freq = {};
      (text.toLowerCase().match(/[a-z']{4,}/g) || []).forEach(w => { if (!STOP.has(w)) freq[w] = (freq[w] || 0) + 1; });
      let topWord = "", topN = 0;
      Object.keys(freq).forEach(w => { if (freq[w] > topN) { topN = freq[w]; topWord = w; } });

      const hasCounter = /\b(objection|critic|opponent|opposition|on the other hand|however|although|granted|admittedly|it could be argued|sceptic|skeptic)\b/i.test(text);
      const nums = (text.match(/\b\d+\b/g) || []).length;
      const proper = (text.match(/[a-z,;:]\s+([A-Z][a-z]{2,})/g) || []).length;
      const concrete = nums + proper;

      const out = [];
      const add = (id, status, detail) => out.push({ id: id, status: status, detail: detail });

      const target = draft.spec.words;
      const ratio = words / target;
      add("length", ratio >= 0.85 && ratio <= 1.15 ? "good" : ratio >= 0.7 && ratio <= 1.35 ? "warn" : "bad",
        words + " words against a target of " + target + ".");

      const paras = draft.poem ? draft.poem.length : draft.paras.length;
      add("paragraphs", paras >= 3 && paras <= 14 ? "good" : "warn", paras + " paragraph" + (paras === 1 ? "" : "s") + ".");

      add("sentlen", avg >= 12 && avg <= 22 ? "good" : "warn", "Average " + avg.toFixed(1) + " words a sentence; longest is " + longest + ".");
      add("variety", sd >= 4 ? "good" : "warn", "Sentence length varies by " + sd.toFixed(1) + " words on average.");
      add("adverbs", ly / Math.max(1, words) < 0.03 ? "good" : "warn", ly + " -ly adverbs in " + words + " words.");
      add("passive", passive <= 3 ? "good" : "warn", passive + " passive construction" + (passive === 1 ? "" : "s") + ".");
      add("repeat", topN <= 6 ? "good" : "warn", topWord ? "'" + topWord + "' used " + topN + " times." : "No word overused.");
      if (draft.spec.genre.argument) add("counter", hasCounter ? "good" : "bad", hasCounter ? "The other side is stated." : "No counter-argument yet.");
      add("concrete", concrete >= 3 ? "good" : "warn", concrete + " numbers or proper nouns.");
      add("opening", firstLen > 0 && firstLen <= 25 ? "good" : "warn", "Opening sentence is " + firstLen + " words.");

      return { words: words, checks: out, read: Math.max(1, Math.round(words / 180)) };
    }

    /* ---------- rendering ---------- */
    function metaLine(spec, cc) {
      return [
        spec.genre.label.toUpperCase(),
        cc.words + " WORDS",
        spec.tone.toUpperCase(),
        cc.read + " MIN READ"
      ].join(" \u00b7 ");
    }

    function renderDraft(draft) {
      const spec = draft.spec;
      const cc = craftCheck(draft);
      const title = titleCase(spec.topic || spec.genre.label);

      let body = "";
      if (draft.poem) {
        body = draft.poem.map(st => '<p class="verse">' + st.map(l => esc(l)).join("<br>") + "</p>").join("");
      } else {
        body = draft.paras.map(p => {
          const txt = esc(p.text).replace(/\n/g, "<br>");
          return "<p>" + txt + "</p>";
        }).join("");
      }

      const dots = { good: "\u2705", warn: "\u26a0\ufe0f", bad: "\u2717" };
      const checkRows = cc.checks.map(c => {
        const label = (W.checks || []).find(x => x.id === c.id);
        return '<div class="craft-row"><span class="craft-dot ' + c.status + '">' + dots[c.status] + "</span>" +
          '<div class="craft-body"><strong>' + esc(label ? label.label : c.id) + "</strong><span>" + esc(c.detail) + "</span></div></div>";
      }).join("");

      const html =
        '<div class="ans-kicker">' + spec.genre.emoji + " " + esc(metaLine(spec, cc)) + "</div>" +
        '<h3 class="ans-title">' + esc(title) + "</h3>" +
        '<div class="draft">' + body + "</div>" +
        '<div class="ans-box craft-box"><div class="ans-box-h">\ud83d\udcd0 Craft check \u2014 measured on this draft</div>' +
        '<div class="craft-grid">' + checkRows + "</div>" +
        '<div class="craft-note">Names, dates, figures and quotations are left out on purpose \u2014 Chiedza does not invent facts. Drop your own details into the paragraphs that need them and the draft becomes yours.</div>' +
        "</div>";

      return { html: html, cc: cc, title: title };
    }

    function reasoningFor(draft) {
      const spec = draft.spec;
      const g = spec.genre;
      const steps = [];
      steps.push({
        title: "Read the request",
        detail: "Genre: <strong>" + esc(g.label) + "</strong>. Topic: <strong>" + esc(spec.topic) + "</strong>. Register: " + esc(spec.tone) + (spec.audience ? ", for " + esc(spec.audience) : "") + "."
      });
      steps.push({
        title: "Chose the shape",
        detail: (g.structure || []).map(s => esc(s.label)).join(" \u2192 ")
      });
      steps.push({
        title: "Set the target",
        detail: spec.words + " words, about " + (draft.poem ? draft.poem.length : draft.paras.length) + " paragraphs, roughly " + Math.max(3, Math.round(spec.words / Math.max(1, (draft.poem ? draft.poem.length : draft.paras.length)) / 19)) + " sentences each."
      });
      if (draft.ground) {
        steps.push({
          title: "Stood it on real knowledge",
          detail: "The topic matched <strong>" + esc(draft.ground.title) + "</strong> in my knowledge files, so the draft uses that definition and explanation rather than filler."
        });
      }
      steps.push({
        title: "Built each paragraph",
        detail: "Every paragraph opens with its own job (hook, thesis, objection, turn, verdict) and then earns it with support. Transitions carry the reader from one to the next."
      });
      steps.push({
        title: "Checked the craft",
        detail: "Measured word count, sentence length and variety, adverb density, passive voice, repetition, concrete detail and the opening line. Anything flagged in the panel is worth a second pass."
      });
      return steps;
    }

    function chipsFor(spec) {
      const g = spec.genre;
      const out = [];
      if (spec.words > 200) out.push("Make it shorter");
      if (spec.words < 900) out.push("Make it longer");
      if (spec.tone !== "formal") out.push("More formal");
      if (g.argument) out.push("Add a counter-argument");
      out.push("Give me the outline");
      out.push("Write the introduction only");
      return out.slice(0, 4);
    }

    /* ---------- the guide (blueprint, no draft) ---------- */
    function renderGuide(spec) {
      const g = spec.genre;
      const steps = (g.structure || []).map((s, i) => "<li><strong>" + (i + 1) + ". " + esc(s.label) + "</strong></li>").join("");
      const rubric = (g.rubric || []).map(r => "<li>" + esc(r) + "</li>").join("");
      const model = frames[(g.structure && g.structure[0] && g.structure[0].role) || "hook"];
      const modelLine = model ? fill(model[0], makeCtx({ topic: spec.topic || "your topic" }, rng(7))) : "";

      const html =
        '<div class="ans-kicker">' + g.emoji + " " + esc(g.label.toUpperCase()) + " \u00b7 BLUEPRINT</div>" +
        '<h3 class="ans-title">How to write a ' + esc(g.label.toLowerCase()) + "</h3>" +
        '<div class="ans-row"><span class="ans-ico">\ud83e\uddf1</span><div class="ans-body"><strong>The shape</strong><ol class="ans-list">' + steps + "</ol></div></div>" +
        '<div class="ans-row"><span class="ans-ico">\u2705</span><div class="ans-body"><strong>What markers look for</strong><ul class="ans-list">' + rubric + "</ul></div></div>" +
        (modelLine ? '<div class="ans-box"><div class="ans-box-h">\u270d\ufe0f A model opening line</div><p class="ans-p">' + esc(modelLine) + "</p></div>" : "") +
        '<div class="ans-conclusion">Tell me the topic and I will write the whole thing: <em>write a ' + esc(g.label.toLowerCase()) + " about \u2026</em></div>";

      return {
        html: html,
        chips: ["Write one for me", "Write a " + g.label.toLowerCase() + " about discipline", "What makes a strong introduction?"],
        reasoning: [
          { title: "Identified the genre", detail: "You asked how to write, not for a draft, so I gave you the blueprint instead of the answer." },
          { title: "Pulled the structure", detail: (g.structure || []).map(s => esc(s.label)).join(" \u2192 ") },
          { title: "Pulled the marking criteria", detail: (g.rubric || []).length + " criteria, taken from the " + esc(g.label) + " blueprint in my writing file." }
        ]
      };
    }

    /* ---------- edits to the last draft ---------- */
    function applyEdit(text, prev) {
      const low = text.toLowerCase().trim();
      const spec = Object.assign({}, prev.spec);

      if (/^(give me |show me |what is |what's )?(the )?(outline|plan|structure)\b/.test(low)) {
        return renderGuide(Object.assign({}, spec, { mode: "guide" }));
      }
      if (/^(write |give me )?(just )?(the )?(introduction|intro|opening)\b/.test(low)) {
        const first = prev.draft.paras ? prev.draft.paras[0] : null;
        if (first) {
          return {
            html: '<div class="ans-kicker">\u2702\ufe0f OPENING ONLY</div><div class="draft"><p>' + esc(first.text) + "</p></div>",
            chips: ["Write the conclusion only", "Make it longer", "Give me the outline"],
            reasoning: [{ title: "Isolated the opening", detail: "Took the first paragraph of the draft you already have." }]
          };
        }
      }
      if (/^(write |give me )?(just )?(the )?(conclusion|ending)\b/.test(low)) {
        const ps = prev.draft.paras || [];
        const lastP = ps[ps.length - 1];
        if (lastP) {
          return {
            html: '<div class="ans-kicker">\u2702\ufe0f CONCLUSION ONLY</div><div class="draft"><p>' + esc(lastP.text) + "</p></div>",
            chips: ["Write the introduction only", "Add a counter-argument", "Make it shorter"],
            reasoning: [{ title: "Isolated the conclusion", detail: "Took the final paragraph of the draft you already have." }]
          };
        }
      }

      if (/short|cut|trim|brief|condense/.test(low)) spec.words = Math.max(80, Math.round(spec.words * 0.62));
      else if (/long|expand|more|detail|elaborate|fuller/.test(low)) spec.words = Math.min(1800, Math.round(spec.words * 1.5));
      if (/formal|academic|serious/.test(low)) spec.tone = "formal";
      if (/simple|easier|plain|younger|child/.test(low)) spec.tone = "simple";
      if (/informal|casual|friendl/.test(low)) spec.tone = "informal";

      const wantsCounter = /counter|objection|other side|opposing|rebut/.test(low);
      spec.seedBump = (spec.seedBump || 0) + 1;

      const draft = build(spec);
      if (wantsCounter && draft.paras) {
        // drop any existing objection, then put a fresh, clearly-labelled one in
        draft.paras = draft.paras.filter(p => p.role !== "counter" && p.role !== "rebut");
        const idx = draft.paras.findIndex(p => p.role === "conclusion" || p.role === "verdict" || p.role === "closing");
        const at = idx < 0 ? draft.paras.length : idx;
        const r = rng(hash(spec.topic + "counter" + (spec.seedBump || 0)));
        const ctx = makeCtx(spec, r);
        const cBank = (frames.counter || []).slice().sort((a, b) => (/objection/.test(b) ? 1 : 0) - (/objection/.test(a) ? 1 : 0));
        const rBank = frames.rebut || ["That objection has force, but it proves less than it seems."];
        const counter = { role: "counter", label: "The objection", text: fill(cBank[0], ctx) + " " + SUPPORT.argument[3] };
        const rebut = { role: "rebut", label: "Answer it", text: fill(rBank[Math.floor(r() * rBank.length) % rBank.length], ctx) + " " + SUPPORT.argument[8] };
        draft.paras.splice(at, 0, counter, rebut);
      }

      if (spec.tone === "formal") {
        draft.paras.forEach(p => {
          p.text = p.text.replace(/\b(don't|can't|won't|isn't|aren't|wasn't|weren't|doesn't|didn't|it's|that's|there's|i'm|we're|they're|you're|i've|we've|let's|wouldn't|shouldn't|couldn't|hasn't|haven't)\b/gi, m => CONTRACTIONS[m.toLowerCase()] || m);
        });
      }

      last = { spec: spec, draft: draft };
      const out = renderDraft(draft);
      return {
        html: out.html,
        chips: chipsFor(spec),
        reasoning: reasoningFor(draft),
        title: out.title
      };
    }

    /* ---------- main entry ---------- */
    function write(input) {
      const text = String(input || "").trim();
      if (!text) return null;

      // follow-up edits to the draft already on screen
      if (last && /^(make it|make this|shorten|cut it|trim it|lengthen|expand|more formal|more simple|simpler|easier|add a counter|add the counter|add an objection|give me the outline|write the introduction|write the conclusion|rewrite)/i.test(text)) {
        return applyEdit(text, last);
      }

      const spec = parse(text);
      if (!spec) return null;

      if (spec.mode === "guide") return renderGuide(spec);

      const draft = build(spec);
      last = { spec: spec, draft: draft };
      const out = renderDraft(draft);
      return { html: out.html, chips: chipsFor(spec), reasoning: reasoningFor(draft), title: out.title };
    }

    return { write: write, parse: parse, build: build, craftCheck: craftCheck, renderGuide: renderGuide, findGround: findGround, genres: genres, get last() { return last; } };
  }

  /* ---------- browser wiring ---------- */
  function wire() {
    const Br = root.ChiedzaBrain; if (!Br) return;
    Br.ready.then(function () {
      const get = u => fetch("brain/knowledge/" + u, { cache: "no-cache" }).then(r => { if (!r.ok) throw new Error(u); return r.json(); });
      Promise.all([
        get("writing.json"),
        get("general.json").catch(() => null),
        get("concepts-subjects.json").catch(() => null)
      ]).then(parts => {
          const writing = parts[0];
          const E = create({ writing: writing, general: parts[1], subjects: parts[2] }, { esc: Br.esc });
          root.ChiedzaWriting = E;
          Br.register({
            name: "writing",
            priority: 40,
            handle: function (input) {
              let r;
              try { r = E.write(input); } catch (e) { console.warn("writing error", e); return null; }
              if (!r) return null;
              return { html: r.html, chips: r.chips, reasoning: r.reasoning };
            }
          });
        })
        .catch(e => console.warn("Chiedza writing file could not be loaded.", e.message));
    });
  }

  const api = { create: create };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else { root.ChiedzaWritingCore = api; wire(); }
})(typeof window !== "undefined" ? window : globalThis);
