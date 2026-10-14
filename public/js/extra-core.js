/* ============================================================
   CHIEDZA LEARNING — Extra curriculum helpers
   Adds new subjects/courses to LEVELS & COURSES (see extra-*.js)
   Created by Ntandomods
   ============================================================ */

// q(question, correctAnswer, ...wrongAnswers) -> quiz item (correct is placed first; options are shuffled by finalizeExtra())
const q = (text, correct, ...wrong) => ({ q: text, options: [correct, ...wrong], answer: 0 });
const les = (title, emoji, kicker, body, keyFact, quiz) => ({ title, emoji, kicker, body, keyFact, quiz });
const sub = (id, name, emoji, color, desc, lessons) => ({ id, name, emoji, color, desc, lessons });
const addSubjects = (levelId, subjects) => {
  const lv = LEVELS.find(l => l.id === levelId);
  subjects.forEach(s => { if (!lv.subjects.some(x => x.id === s.id)) lv.subjects.push(s); });
};

// The base curriculum lists the correct answer first. Shuffle every quiz/assessment so the answer is not always "A".
function finalizeExtra() {
  const fix = (item) => {
    if (item._shuffled) return;
    const correct = item.options[item.answer];
    const opts = item.options.slice().sort(() => Math.random() - 0.5);
    item.options = opts; item.answer = opts.indexOf(correct); item._shuffled = true;
  };
  LEVELS.forEach(l => l.subjects.forEach(s => s.lessons.forEach(ls => (ls.quiz || []).forEach(fix))));
  COURSES.forEach(c => (c.assessment || []).forEach(fix));
}

// Sign language badge
BADGES.push({ id: "sign-friend", name: "Sign Friend", emoji: "🤟", desc: "Complete a Sign Language lesson" });

// Short reminder used in every sign-language lesson
const ZSL_NOTE = `<p class="note"><strong>🤟 Learn real signs from a Deaf signer.</strong> Signs differ between countries and even regions, so always learn Zimbabwean Sign Language (ZSL) signs from a ZSL teacher or Deaf signer. This lesson teaches the ideas, manners and vocabulary to practise.</p>`;
