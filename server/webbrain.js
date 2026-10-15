/* ============================================================
   CHIEDZA BRAIN - WEB SKILLS (server side, no API keys, no cost)
   Our own brain for questions the lesson files cannot answer.
   It does not use any paid AI. It reads free public sources:
     - Simple English Wikipedia, then English Wikipedia
     - dictionaryapi.dev (word meanings)
     - Open-Meteo (weather)
   and then understands the question, picks the best page, finds
   the sentences that really answer it, cleans them up for a child
   and lists the source. Child-safety rules run before and after.
   Created by Ntandomods.
   ============================================================ */
const express = require("express");
const fs = require("fs");
const path = require("path");

const router = express.Router();
/* server.js plugs in training hooks: record what was found, and check the owner's block list */
router.hooks = { record() {}, isBlocked() { return false; } };
const BRAIN = path.join(__dirname, "..", "public", "brain");
const UA = "ChiedzaLearningBrain/1.0 (https://github.com/kids-codentando/chiedza-learning; educational helper for children)";

/* ---------- safety (shared with the browser brain) ---------- */
let safety = {};
try { safety = JSON.parse(fs.readFileSync(path.join(BRAIN, "safety.json"), "utf8")); } catch (e) {}
function safetyCheck(text) {
  for (const k of ["help_me", "emergency", "off_limits", "grown_up", "privacy", "homework_cheating"]) {
    const g = safety[k]; if (!g) continue;
    for (const p of g.patterns || []) { try { if (new RegExp(p, "i").test(text)) return { reply: g.reply, kind: k }; } catch (e) {} }
  }
  return null;
}
/* topics from the internet that a child should hear about from a grown-up, not from a robot */
const GROWN_UP = /\b(how (are|do|does|did) (a )?(babies|baby) (made|get made|born|come)|where do babies come from|pregnan\w*|sex|sexual|sexuality|porn\w*|erotic\w*|genital\w*|penis|vagina|intercourse|masturbat\w*|rape|abortion|contracepti\w*|prostitut\w*|nude|nudity|fetish|orgasm|suicide|self-harm|overdose|murder\w*|massacre|genocide|torture|terroris\w*|bomb-making|cocaine|heroin|methamphetamine|cannabis|marijuana|gambling|casino|alcoholic|cigarette)\b/i;
const GROWN_UP_REPLY = "🤝 That is a question for a parent, teacher or another trusted grown-up. They can explain it in the right way for you. Is there something else I can help you learn?";

/* ---------- small language tools ---------- */
const STOP = new Set("a an the is are was were am be been to of in on at for and or but with what whats who whom how why when where which do does did can could would should i me my we you your it its this that these those about tell please explain give show want need some any more from as by us our there their they them he she his her very really also just".split(" "));
const SPELL = { colour: "color", colours: "colors", favourite: "favorite", centre: "center", litre: "liter", metre: "meter", metres: "meters", grey: "gray", neighbour: "neighbor", organise: "organize", programme: "program", leaves: "leaf", children: "child", people: "person", mice: "mouse", feet: "foot", teeth: "tooth", men: "man", women: "woman", wolves: "wolf", knives: "knife", lives: "life", babies: "baby" };
const stemW = w => { w = SPELL[w] || w; return w.length > 4 ? w.replace(/ies$/, "y").replace(/(ing|ed|es|s)$/, "") : w.replace(/s$/, ""); };
const tok = s => (s || "").toLowerCase().replace(/[^a-z0-9' ]+/g, " ").split(/\s+/).filter(w => w && !STOP.has(w)).map(stemW);
const clean = (s, n) => String(s || "").replace(/\s+/g, " ").trim().slice(0, n);
function sentencesOf(text) {
  const lines = String(text || "").split(/\n+/).map(l => l.trim());
  const cut = lines.findIndex(l => /^(Related pages|See also|References|Other websites|External links|Notes|Sources|Further reading|Bibliography)$/i.test(l));
  const body = (cut >= 0 ? lines.slice(0, cut) : lines).filter(l => l.length >= 40 || /[.!?]$/.test(l));
  const t = body.join(" ").replace(/\s+/g, " ");
  const raw = t.split(/(?<=[.!?])\s+(?=[A-Z0-9"“(])/);
  const out = [];
  for (const s of raw) {
    if (out.length && (/\b(St|Mr|Mrs|Dr|Prof|No|vs|approx|c|ca|Mt|Jr|Sr)\.$/.test(out[out.length - 1]) || out[out.length - 1].length < 25)) out[out.length - 1] += " " + s;
    else out.push(s);
  }
  return out.map(s => s.trim()).filter(Boolean);
}
/* make an encyclopedia sentence friendlier: remove brackets, pronunciations, citations */
function tidy(s) {
  return s.replace(/\[[^\]]*\]/g, "").replace(/\s*\([^()]*\)/g, "").replace(/\s*\([^()]*\)/g, "")
    .replace(/\s+([,.;:])/g, "$1").replace(/\s{2,}/g, " ").replace(/^\W+/, "").trim();
}

async function getJSON(url, ms = 9000) {
  const ctl = new AbortController(), t = setTimeout(() => ctl.abort(), ms);
  try { const r = await fetch(url, { signal: ctl.signal, headers: { "User-Agent": UA, Accept: "application/json" } }); if (!r.ok) throw new Error("http " + r.status); return await r.json(); }
  finally { clearTimeout(t); }
}

/* ---------- SKILL 1: word meanings ---------- */
const DEFINE_RX = [/^(?:define|definition of|meaning of|what(?:'s| is) the meaning of|what does)\s+(?:the word\s+)?["']?([a-z][a-z' -]{1,30}?)["']?(?:\s+mean)?\s*\??$/i, /^what(?:'s| is) the (?:definition|meaning) of\s+["']?([a-z][a-z' -]{1,30}?)["']?\s*\??$/i];
const stripTags = h => String(h || "").replace(/<[^>]+>/g, "").replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/\s+/g, " ").trim();
async function skillDefine(q) {
  let word = null; for (const rx of DEFINE_RX) { const m = q.trim().match(rx); if (m) { word = m[1].trim().toLowerCase(); break; } }
  if (!word || word.split(" ").length > 2) return null;
  try { // Wiktionary: free, no key
    const j = await getJSON("https://en.wiktionary.org/api/rest_v1/page/definition/" + encodeURIComponent(word), 5000);
    const lines = [];
    for (const e of (j.en || []).slice(0, 3)) {
      const defs = (e.definitions || []).map(d => stripTags(d.definition)).filter(d => d.length > 8 && !/^(alternative|obsolete|misspelling|senses? relating|used in|plural of|inflection)/i.test(d)).slice(0, 2);
      if (defs.length) lines.push(`**${word}** (${String(e.partOfSpeech || "").toLowerCase()}): ${clean(defs.join("; "), 260)}`);
    }
    if (lines.length) return { answer: lines.join("\n"), sources: [{ title: `${word} - Wiktionary`, url: "https://en.wiktionary.org/wiki/" + encodeURIComponent(word) }], kind: "define" };
  } catch (e) {}
  try { // backup dictionary
    const j = await getJSON("https://api.dictionaryapi.dev/api/v2/entries/en/" + encodeURIComponent(word), 3500);
    const e = Array.isArray(j) && j[0]; const lines = [];
    for (const m of ((e && e.meanings) || []).slice(0, 3)) { const d = m.definitions && m.definitions[0]; if (d) lines.push(`**${e.word}** (${m.partOfSpeech}): ${clean(d.definition, 220)}${d.example ? ` Example: "${clean(d.example, 140)}"` : ""}`); }
    if (lines.length) return { answer: lines.join("\n"), sources: [{ title: "Dictionary (dictionaryapi.dev)", url: "https://dictionaryapi.dev/" }], kind: "define" };
  } catch (e) {}
  return null;
}

/* ---------- SKILL 2: weather ---------- */
const WMO = { 0: "clear sky ☀️", 1: "mostly clear 🌤️", 2: "partly cloudy ⛅", 3: "cloudy ☁️", 45: "foggy 🌫️", 48: "foggy 🌫️", 51: "light drizzle 🌦️", 53: "drizzle 🌦️", 55: "heavy drizzle 🌧️", 61: "light rain 🌧️", 63: "rain 🌧️", 65: "heavy rain 🌧️", 80: "rain showers 🌦️", 81: "rain showers 🌦️", 82: "heavy showers 🌧️", 95: "thunderstorm ⛈️", 96: "thunderstorm with hail ⛈️", 99: "thunderstorm with hail ⛈️" };
async function skillWeather(q) {
  if (!/\b(weather|temperature|how (hot|cold|warm)|is it (raining|going to rain|sunny|hot|cold)|forecast)\b/i.test(q)) return null;
  const m = q.match(/\b(?:in|at|for|of)\s+([A-Za-z][A-Za-z .'-]{2,30}?)(?:\s+(?:today|now|tomorrow|right now|this week))?\s*[?.!]*$/i);
  const place = m ? m[1].trim() : "Harare";
  try {
    const g = await getJSON("https://geocoding-api.open-meteo.com/v1/search?count=1&language=en&name=" + encodeURIComponent(place));
    const loc = g.results && g.results[0]; if (!loc) return null;
    const w = await getJSON(`https://api.open-meteo.com/v1/forecast?latitude=${loc.latitude}&longitude=${loc.longitude}&current=temperature_2m,weather_code,wind_speed_10m&daily=temperature_2m_max,temperature_2m_min,precipitation_probability_max&timezone=auto&forecast_days=1`);
    const c = w.current, d = w.daily; if (!c || !d) return null;
    const desc = WMO[c.weather_code] || "mixed weather";
    return { answer: `🌍 In **${loc.name}${loc.country ? ", " + loc.country : ""}** it is **${Math.round(c.temperature_2m)}°C** right now with ${desc}.\nToday: high ${Math.round(d.temperature_2m_max[0])}°C, low ${Math.round(d.temperature_2m_min[0])}°C, chance of rain ${d.precipitation_probability_max[0] ?? 0}%. Wind ${Math.round(c.wind_speed_10m)} km/h.`, sources: [{ title: "Open-Meteo weather", url: "https://open-meteo.com/" }], kind: "weather" };
  } catch (e) { return null; }
}

/* ---------- SKILL 3: knowledge (Simple Wikipedia -> Wikipedia) ---------- */
const WIKIS = [{ host: "simple.wikipedia.org", name: "Simple Wikipedia" }, { host: "en.wikipedia.org", name: "Wikipedia" }];
const SYN = { tall: "high height metres meters feet", high: "height metres meters feet", long: "length km metres miles", big: "size area largest", large: "size area largest", far: "distance km miles away", old: "age years born founded", heavy: "weight kg tonnes mass", fast: "speed km/h mph", deep: "depth metres", wide: "width metres", hot: "temperature degrees", cold: "temperature degrees", many: "number total", much: "amount total" };
function understand(q) {
  let s = q.trim().replace(/[?!.]+$/g, "").replace(/\s+/g, " ");
  s = s.replace(/^(?:please\s+)?(?:search (?:the )?(?:internet|web|online) for|look up|google|find out|tell me about|explain|tell me)\s+(?:about\s+)?/i, "");
  const type = { what: false, who: false, why: false, how: false, number: false, topic: null }; let m, adj = "";
  if ((m = s.match(/^(?:define|meaning of|what(?:'s| is) the meaning of|what does)\s+(?:the word\s+)?(.+?)(?:\s+mean)?$/i)) && m[1].split(" ").length <= 3) { type.what = true; type.topic = m[1]; }
  else if ((m = s.match(/^(what|who|where)\s+(?:is|are|was|were)\s+(?:a |an |the )?(.+)$/i)) && m[2].split(" ").length <= 5 && !/^(your|my|his|her|their|our)\b/i.test(m[2])) { type[m[1].toLowerCase() === "who" ? "who" : "what"] = true; type.topic = m[2]; }
  else if (/^why\b/i.test(s)) type.why = true;
  else if ((m = s.match(/^how (tall|high|long|big|far|old|deep|wide|heavy|fast|hot|cold|many|much|large)\b/i))) { type.number = true; adj = m[1].toLowerCase(); }
  else if (/^how\b/i.test(s)) type.how = true;
  const base = tok(type.topic || s);
  const extra = adj && SYN[adj] ? tok(SYN[adj]) : [];
  return { type, query: s, tokens: base, extra, adj };
}
async function wikiSearch(host, query, withText) {
  const url = `https://${host}/w/api.php?action=query&format=json&origin=*&generator=search&gsrsearch=${encodeURIComponent(query)}&gsrlimit=5&prop=extracts|info&exintro=1&explaintext=1&exlimit=max&inprop=url`;
  const j = await getJSON(url);
  return Object.values((j.query && j.query.pages) || {}).sort((a, b) => a.index - b.index).map(p => ({ title: p.title, url: p.fullurl, intro: p.extract || "", index: p.index, host }));
}
async function wikiFull(host, title) {
  const j = await getJSON(`https://${host}/w/api.php?action=query&format=json&origin=*&prop=extracts&explaintext=1&exsectionformat=plain&redirects=1&titles=${encodeURIComponent(title)}`, 10000);
  const p = Object.values((j.query && j.query.pages) || {})[0]; return (p && p.extract) || "";
}
const okPage = p => p.intro && p.intro.length >= 60 && !/may (also )?refer to|disambiguation/i.test(p.intro.slice(0, 300));
const cap1 = s => s.charAt(0).toUpperCase() + s.slice(1);
function scoreSentence(s, u) {
  const st = new Set(tok(s)); const qt = u.tokens; if (!qt.length) return 0;
  const cov = qt.filter(t => st.has(t)).length / qt.length;
  if (qt.length > 1 ? cov < 0.5 : cov < 1) return 0; // a sentence must really be about the question
  let v = cov;
  if (u.extra.length && u.extra.some(t => st.has(t))) v += 0.3;
  if (u.type.why && /\b(because|due to|caused|cause|since|so that|reason|result|scatter\w*|makes?|means?)\b/i.test(s)) v += 0.35;
  if (u.type.number && /\d/.test(s)) v += 0.5;
  if (u.type.how && /\b(by|when|using|first|then|process|steps?|works?|uses?)\b/i.test(s)) v += 0.2;
  if (/["“]|^(For example|Also|However|But)\b/.test(s)) v -= 0.25;
  return v;
}
function bestSentences(full, u, n, skip, exclude) {
  const all = sentencesOf(full).map(tidy).filter(s => s.length > 25 && s.length < 380 && s !== exclude);
  const ranked = all.map((s, i) => ({ s, i, v: scoreSentence(s, u) })).filter(x => x.v >= 0.4).sort((a, b) => b.v - a.v);
  return { picked: ranked.slice(skip, skip + n), total: ranked.slice(0, 3).reduce((a, x) => a + x.v, 0) };
}
const cache = new Map();
async function skillKnowledge(q, level, more, exactOnly) {
  const key = (exactOnly ? "x" : "") + (level || "") + "|" + more + "|" + q.toLowerCase().replace(/[^a-z0-9 ]/g, "").trim();
  const hit = cache.get(key); if (hit && Date.now() - hit.t < 6 * 3600e3) return hit.v;
  if (GROWN_UP.test(q)) return { answer: GROWN_UP_REPLY, kind: "grownup", sources: [] };
  const u = understand(q); if (!u.tokens.length) return null;
  const definition = (u.type.what || u.type.who) && !more;
  const small = level === "ecd" || level === "infant", per = small ? 2 : 4;
  let bestV = null, bestSc = 0;
  for (const w of WIKIS) {
    let pages = [];
    try {
      const queries = definition ? [u.type.topic] : [u.query, u.tokens.join(" ")];
      const lists = await Promise.all(queries.map(x => wikiSearch(w.host, x).catch(() => [])));
      const seen = new Set(); lists.forEach((l, li) => l.forEach(p => { if (!seen.has(p.title) && okPage(p)) { seen.add(p.title); p.rank = p.index + li * 0.5; pages.push(p); } }));
    } catch (e) { continue; }
    if (!pages.length) continue;
    let chosen = null;
    if (definition) { // best title match for "what is X"
      let bs = 0;
      for (const p of pages) { const tt = tok(p.title), hitN = u.tokens.filter(t => tt.includes(t)).length; const sc = (tt.join(" ") === u.tokens.join(" ") ? 4 : 0) + hitN * 3 - p.rank * 0.4; if (hitN && sc > bs && (!exactOnly || tt.join(" ") === u.tokens.join(" "))) { bs = sc; chosen = p; } }
      if (!chosen) continue;
      if (GROWN_UP.test(chosen.title) || GROWN_UP.test(chosen.intro.slice(0, 500))) return { answer: GROWN_UP_REPLY, kind: "grownup", sources: [] };
      const sents = sentencesOf(chosen.intro).map(tidy).filter(x => x.length > 20).slice(0, small ? 1 : 3).map(cap1);
      if (!sents.length) continue;
      chosen.out = sents;
    } else { // read the top pages and keep the one with the best answering sentences
      const top = pages.sort((a, b) => a.rank - b.rank).slice(0, 3);
      const fulls = await Promise.all(top.map(p => wikiFull(w.host, p.title).catch(() => "")));
      let bs = 0;
      top.forEach((p, i) => {
        if (GROWN_UP.test(p.title)) return;
        const introFirst = sentencesOf(p.intro).map(tidy)[0]; const r = bestSentences(fulls[i], u, per, more * per, more ? introFirst : null); const tt = tok(p.title);
        const sc = r.total + u.tokens.filter(t => tt.includes(t)).length * 0.3 - p.rank * 0.05;
        if (r.picked.length && sc > bs) { bs = sc; chosen = p; const first = sentencesOf(p.intro).map(tidy)[0]; const body = (u.type.number ? r.picked : r.picked.sort((a, b) => a.i - b.i)).map(x => cap1(x.s)); p.out = (!more && !u.type.number && first && !body.includes(cap1(first)) && first.length < 220 ? [cap1(first)] : []).concat(body); }
      });
      chosen && (chosen.sc = bs);
      if (!chosen) { if (more) return { answer: "I have told you everything I found about that. 😊 Try asking a new question!", sources: [], kind: "done" }; continue; }
    }
    let text = [...new Set(chosen.out)].join(" ");
    if (GROWN_UP.test(text)) return { answer: GROWN_UP_REPLY, kind: "grownup", sources: [] };
    if (text.length > 750) text = text.slice(0, 750).replace(/\s+\S*$/, "") + "…";
    const v = { answer: text, sources: [{ title: `${chosen.title} - ${w.name}`, url: chosen.url }], kind: "knowledge" };
    const sc = definition ? 99 : chosen.sc || 0;
    if (sc > bestSc) { bestSc = sc; bestV = v; }
    if (bestSc >= 1.1) break; // good enough, no need to ask the bigger encyclopedia
  }
  if (bestV) { cache.set(key, { t: Date.now(), v: bestV }); if (cache.size > 500) cache.delete(cache.keys().next().value); }
  return bestV;
}

/* ---------- abuse protection ---------- */
const perIp = new Map();
function allowed(ip) {
  const now = Date.now(), hits = (perIp.get(ip) || []).filter(t => now - t < 600000);
  if (hits.length >= 40) { perIp.set(ip, hits); return false; }
  hits.push(now); perIp.set(ip, hits);
  if (perIp.size > 5000) for (const [a, h] of perIp) if (!h.length || now - h[h.length - 1] > 600000) perIp.delete(a);
  return true;
}

/* ---------- routes ---------- */
router.get("/web-status", (req, res) => { res.set("Cache-Control", "no-cache"); res.json({ ok: true, enabled: true, skills: ["define", "weather", "knowledge"], sources: ["Simple Wikipedia", "Wikipedia", "Wiktionary", "dictionaryapi.dev", "Open-Meteo"] }); });

/* Kid-safe YouTube videos. Optional: only works when YOUTUBE_API_KEY is set on the server.
   Uses YouTube's strict safe search, embeddable videos only, and the "for kids" bias; the same
   safety rules as the chat run on the search words first. Without a key the site shows search links instead. */
const vidCache = new Map();
router.get("/videos-status", (req, res) => res.json({ ok: true, enabled: !!process.env.YOUTUBE_API_KEY }));
router.get("/videos", async (req, res) => {
  res.set("Cache-Control", "no-cache");
  if (!process.env.YOUTUBE_API_KEY) return res.json({ ok: true, enabled: false, videos: [] });
  const q = String(req.query.q || "").replace(/\s+/g, " ").trim().slice(0, 100);
  if (q.length < 2) return res.status(400).json({ ok: false, error: "empty" });
  if (safetyCheck(q) || GROWN_UP.test(q)) return res.json({ ok: true, enabled: true, videos: [], safety: true });
  if (!allowed(req.ip)) return res.status(429).json({ ok: false, error: "slow_down" });
  const key = q.toLowerCase(), hit = vidCache.get(key);
  if (hit && Date.now() - hit.t < 6 * 3600 * 1000) return res.json({ ok: true, enabled: true, videos: hit.v });
  try {
    const u = new URL("https://www.googleapis.com/youtube/v3/search");
    Object.entries({ part: "snippet", type: "video", maxResults: "6", safeSearch: "strict", videoEmbeddable: "true", videoSyndicated: "true", relevanceLanguage: "en", q: q + " for kids", key: process.env.YOUTUBE_API_KEY }).forEach(([k, v]) => u.searchParams.set(k, v));
    const r = await fetch(u, { headers: { "User-Agent": UA }, signal: AbortSignal.timeout(8000) });
    if (!r.ok) return res.json({ ok: true, enabled: true, videos: [], error: "youtube_" + r.status });
    const j = await r.json();
    const videos = (j.items || []).filter(i => i.id && i.id.videoId && !safetyCheck((i.snippet.title || "") + " " + (i.snippet.description || ""))).slice(0, 4)
      .map(i => ({ id: i.id.videoId, title: String(i.snippet.title || "").replace(/&amp;/g, "&").replace(/&#39;/g, "'").replace(/&quot;/g, '"').slice(0, 120), channel: String(i.snippet.channelTitle || "").slice(0, 60) }));
    vidCache.set(key, { t: Date.now(), v: videos }); if (vidCache.size > 300) vidCache.delete(vidCache.keys().next().value);
    res.json({ ok: true, enabled: true, videos });
  } catch (e) { res.json({ ok: true, enabled: true, videos: [], error: "unreachable" }); }
});

router.post("/ask", async (req, res) => {
  const b = req.body || {};
  const question = clean(b.question, 300);
  if (question.length < 2) return res.status(400).json({ ok: false, error: "empty" });
  const unsafe = safetyCheck(question);
  if (unsafe) return res.json({ ok: true, answer: unsafe.reply, safety: unsafe.kind, sources: [], html: true });
  if (GROWN_UP.test(question)) return res.json({ ok: true, answer: GROWN_UP_REPLY, safety: "grownup", sources: [] });
  const ip = String(req.headers["x-forwarded-for"] || req.socket.remoteAddress || "").split(",")[0].trim();
  if (!allowed(ip)) return res.status(429).json({ ok: false, error: "slow_down" });
  const level = ["ecd", "infant", "junior", "olevel"].includes(b.level) ? b.level : "";
  const more = Math.max(0, Math.min(5, parseInt(b.more, 10) || 0));
  if (router.hooks.isBlocked(question, [])) return res.status(404).json({ ok: false, error: "not_found" });
  try {
    let out = null;
    if (!more) {
      const dm = DEFINE_RX.map(rx => question.trim().match(rx)).find(Boolean);
      if (dm) out = await skillKnowledge("what is " + dm[1], level, 0, true); // exact page in Simple Wikipedia first (child friendly)
      out = out || (await skillDefine(question)) || (await skillWeather(question));
    }
    if (!out) out = await skillKnowledge(question, level, more);
    if (!out) return res.status(404).json({ ok: false, error: "not_found" });
    if (router.hooks.isBlocked(question, out.sources || [])) return res.status(404).json({ ok: false, error: "not_found" });
    if (!more && (out.kind === "knowledge" || out.kind === "define")) { try { router.hooks.record(question, out); } catch (e) {} }
    if (out.kind !== "grownup" && safetyCheck(out.answer)) return res.json({ ok: true, answer: GROWN_UP_REPLY, safety: "grownup", sources: [] });
    res.json({ ok: true, answer: out.answer, sources: out.sources, kind: out.kind, searched: true });
  } catch (e) { console.warn("[brain] ask failed:", e.message); res.status(502).json({ ok: false, error: "brain_error" }); }
});

module.exports = router;
module.exports._internals = { understand, skillKnowledge, skillDefine, skillWeather, safetyCheck };
