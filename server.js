/* ============================================================
   CHIEDZA LEARNING — Server
   Serves the static app + a small API for assessments,
   certificates (public registry) and the leaderboard.
   Deployable on Render (Web Service).
   Created by Ntandomods
   ============================================================ */

const express = require("express");
const path = require("path");
const fs = require("fs");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ---- Web brain: free internet skills, no API keys (server/webbrain.js) ----
app.use("/api/brain", require("./server/webbrain"));

// ---- Simple JSON file store (ephemeral on Render free tier) ----
const DATA_DIR = path.join(__dirname, "data");
const DB_FILE = path.join(DATA_DIR, "submissions.json");
const EMPTY_DB = { assessments: [], certificates: [], leaderboard: [] };

function ensureDb() {
  try {
    if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
    if (!fs.existsSync(DB_FILE)) fs.writeFileSync(DB_FILE, JSON.stringify(EMPTY_DB, null, 2));
  } catch (e) {
    console.warn("Could not create data dir (read-only FS?). Using in-memory store.", e.message);
  }
}

let memoryDb = JSON.parse(JSON.stringify(EMPTY_DB));

function readDb() {
  try {
    if (fs.existsSync(DB_FILE)) {
      const db = JSON.parse(fs.readFileSync(DB_FILE, "utf8"));
      return Object.assign({ assessments: [], certificates: [], leaderboard: [] }, db);
    }
  } catch (e) {}
  return memoryDb;
}
function writeDb(db) {
  memoryDb = db;
  try {
    if (fs.existsSync(DATA_DIR)) fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2));
  } catch (e) {}
}

ensureDb();

function newCertId() {
  return "CH-" + new Date().getFullYear() + "-" + Math.random().toString(36).slice(2, 8).toUpperCase();
}

// ---- Open Verification Standard: tamper-evident code (mirror of the client) ----
const VERIFY_SALT = "CHIEDZA-LEARNING|NTANDOMODS|OPEN-VERIFY-STANDARD-2026";
const VERIFY_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
function certChecksum(canonical) {
  const s = VERIFY_SALT + "|" + String(canonical || "");
  let h = 5381;
  for (let i = 0; i < s.length; i++) { h = (((h << 5) + h) ^ s.charCodeAt(i)) >>> 0; }
  let out = "", x = h || 1;
  for (let k = 0; k < 8; k++) { x = (Math.imul(x, 1103515245) + 12345) >>> 0; out += VERIFY_ALPHABET[x % VERIFY_ALPHABET.length]; }
  return out.slice(0, 4) + "-" + out.slice(4, 8);
}

// ---- API ----
app.get("/api/health", (req, res) => {
  res.json({ ok: true, app: "Chiedza Learning", author: "Ntandomods", time: new Date().toISOString() });
});

// Save an assessment submission
app.post("/api/assessments", (req, res) => {
  const { courseId, score, total, passed, name } = req.body || {};
  if (!courseId) return res.status(400).json({ ok: false, error: "courseId is required" });

  const db = readDb();
  const record = {
    id: "AS-" + Date.now().toString(36).toUpperCase(),
    courseId,
    name: (name || "Learner").slice(0, 80),
    score: Number(score) || 0,
    total: Number(total) || 0,
    percent: total ? Math.round((score / total) * 100) : 0,
    passed: !!passed,
    submittedAt: new Date().toISOString()
  };
  db.assessments.push(record);
  writeDb(db);
  res.json({ ok: true, assessment: record });
});

// List assessments (simple, no auth — for demo/admin)
app.get("/api/assessments", (req, res) => {
  const db = readDb();
  res.json({ ok: true, count: db.assessments.length, assessments: db.assessments.slice(-100) });
});

// Publish / issue a certificate (public registry)
app.post("/api/certificates", (req, res) => {
  const { id, courseId, name, percent, issuedAt, canonical, checksum } = req.body || {};
  if (!courseId) return res.status(400).json({ ok: false, error: "courseId is required" });

  const db = readDb();
  const certId = String(id || newCertId()).toUpperCase();
  const canon = String(canonical || "").slice(0, 400);
  const sum = String(checksum || (canon ? certChecksum(canon) : "")).toUpperCase();
  let certificate = db.certificates.find(c => c.id === certId);
  if (certificate) {
    certificate.courseId = courseId;
    certificate.name = (name || certificate.name || "Learner").slice(0, 80);
    if (percent != null) certificate.percent = Number(percent) || 0;
    if (canon) certificate.canonical = canon;
    if (sum) certificate.checksum = sum;
  } else {
    certificate = {
      id: certId,
      courseId,
      name: (name || "Learner").slice(0, 80),
      percent: Number(percent) || 0,
      canonical: canon,
      checksum: sum,
      issuedAt: issuedAt ? new Date(issuedAt).toISOString() : new Date().toISOString()
    };
    db.certificates.push(certificate);
  }
  writeDb(db);
  res.json({ ok: true, certificate });
});

// Verify a certificate by ID (public)
app.get("/api/certificates/:id", (req, res) => {
  const db = readDb();
  const cert = db.certificates.find(c => c.id === String(req.params.id).toUpperCase());
  if (!cert) return res.status(404).json({ ok: false, error: "Certificate not found" });
  res.json({ ok: true, certificate: cert });
});

// Open verification endpoint \u2014 for any organisation, public or private
app.get("/api/verify/:id", (req, res) => {
  const db = readDb();
  const id = String(req.params.id).toUpperCase();
  const cert = db.certificates.find(c => c.id === id);
  if (!cert) return res.status(404).json({ ok: false, valid: false, error: "Certificate not found" });
  const expected = cert.canonical ? certChecksum(cert.canonical) : (cert.checksum || "");
  const codeOk = !cert.checksum || !expected || cert.checksum === expected;
  res.json({
    ok: true,
    valid: codeOk,
    certificate: cert,
    checksum: expected,
    standard: "Chiedza Open Verification Standard",
    issuedBy: "Chiedza Learning (Ntandomods)",
    recognisedBy: ["schools", "colleges", "employers", "government", "ngos", "any organisation (public or private)"]
  });
});

// ---- Leaderboard ----
app.get("/api/leaderboard", (req, res) => {
  const db = readDb();
  const board = (db.leaderboard || [])
    .slice()
    .sort((a, b) => (b.stars || 0) - (a.stars || 0))
    .slice(0, 50);
  res.json({ ok: true, count: board.length, leaderboard: board });
});

app.post("/api/leaderboard", (req, res) => {
  const { name, avatar, stars, lessons, certs } = req.body || {};
  if (!name) return res.status(400).json({ ok: false, error: "name is required" });

  const db = readDb();
  db.leaderboard = db.leaderboard || [];
  const key = String(name).toLowerCase();
  const payload = {
    name: String(name).slice(0, 40),
    avatar: String(avatar || "\ud83e\udd81").slice(0, 8),
    stars: Number(stars) || 0,
    lessons: Number(lessons) || 0,
    certs: Number(certs) || 0,
    updatedAt: new Date().toISOString()
  };
  const entry = db.leaderboard.find(e => String(e.name).toLowerCase() === key);
  if (entry) Object.assign(entry, payload);
  else db.leaderboard.push(payload);
  writeDb(db);
  res.json({ ok: true, entry: payload });
});

// ---- Chiedza Brain: questions the AI could not answer ("knowledge gaps") ----
// Learners' unanswered questions are counted here so the owner can teach the brain
// by adding entries to public/brain/knowledge/*.json. No names or personal data are stored.
const gapHits = new Map();
app.post("/api/brain/gaps", (req, res) => {
  const ip = req.ip || "x", now = Date.now();
  const h = (gapHits.get(ip) || []).filter(t => now - t < 60000);
  if (h.length >= 20) return res.status(429).json({ ok: false });
  h.push(now); gapHits.set(ip, h);
  const q = String((req.body && req.body.q) || "").toLowerCase().replace(/\s+/g, " ").trim().slice(0, 160);
  if (q.length < 4) return res.status(400).json({ ok: false });
  // never keep anything that looks like a phone number, email or ID
  if (/\d{6,}|@/.test(q)) return res.json({ ok: true, skipped: true });
  const db = readDb();
  db.brainGaps = db.brainGaps || [];
  const hit = db.brainGaps.find(g => g.q === q);
  if (hit) { hit.count++; hit.last = new Date().toISOString(); }
  else db.brainGaps.push({ q, count: 1, last: new Date().toISOString() });
  db.brainGaps = db.brainGaps.sort((a, b) => b.count - a.count).slice(0, 500);
  writeDb(db);
  res.json({ ok: true });
});

// Owner-only list. Set BRAIN_ADMIN_KEY on Render, then call with header  x-admin-key: <key>
app.get("/api/brain/gaps", (req, res) => {
  const key = process.env.BRAIN_ADMIN_KEY;
  if (!key || req.get("x-admin-key") !== key) return res.status(403).json({ ok: false, error: "Set BRAIN_ADMIN_KEY and send it as x-admin-key" });
  const db = readDb();
  res.json({ ok: true, count: (db.brainGaps || []).length, gaps: db.brainGaps || [] });
});

// ---- Chiedza Brain: TRAINING ----
// The owner teaches the AI through /teach.html (protected by BRAIN_ADMIN_KEY).
// Trained answers live in db.trained, are served to every learner at /api/brain/trained,
// and (optional) are committed to GitHub so they survive redeploys:
//   set GITHUB_TOKEN (repo write access) and GITHUB_REPO (default kids-codentando/chiedza-learning) on Render.
const TRAINED_FILE = path.join(__dirname, "public", "brain", "knowledge", "trained.json");
function adminOnly(req, res, next) {
  const key = process.env.BRAIN_ADMIN_KEY;
  if (!key || req.get("x-admin-key") !== key) return res.status(403).json({ ok: false, error: "Set BRAIN_ADMIN_KEY and send it as x-admin-key" });
  next();
}
function seedTrained() {
  const db = readDb();
  if (db.trained && db.trained.length) return;
  try {
    const f = JSON.parse(fs.readFileSync(TRAINED_FILE, "utf8"));
    if (f.entries && f.entries.length) { db.trained = f.entries; writeDb(db); }
  } catch (e) {}
}
seedTrained();
function trainedPayload(db) { return { topic: "Taught by the owner", entries: db.trained || [] }; }
let syncTimer = null, syncStatus = { last: null, ok: null, message: "GitHub sync not configured" };
function scheduleGithubSync() {
  if (!process.env.GITHUB_TOKEN) return;
  clearTimeout(syncTimer);
  syncTimer = setTimeout(async () => {
    const repo = process.env.GITHUB_REPO || "kids-codentando/chiedza-learning";
    const url = `https://api.github.com/repos/${repo}/contents/public/brain/knowledge/trained.json`;
    const H = { Authorization: `Bearer ${process.env.GITHUB_TOKEN}`, Accept: "application/vnd.github+json", "User-Agent": "chiedza-brain" };
    try {
      const cur = await fetch(url, { headers: H }); const sha = cur.ok ? (await cur.json()).sha : undefined;
      const body = { message: "Brain: update trained answers", content: Buffer.from(JSON.stringify(trainedPayload(readDb()), null, 2) + "\n").toString("base64"), sha };
      const r = await fetch(url, { method: "PUT", headers: Object.assign({ "Content-Type": "application/json" }, H), body: JSON.stringify(body) });
      syncStatus = { last: new Date().toISOString(), ok: r.ok, message: r.ok ? "Saved to GitHub" : "GitHub said " + r.status };
    } catch (e) { syncStatus = { last: new Date().toISOString(), ok: false, message: e.message }; }
  }, 4000);
}

// ---- Training from the internet ----
// Every answer the web brain finds is logged (anonymously) so the owner can review it in /teach.html:
// teach it (promote to a vetted offline answer), block it (never serve it again) or dismiss it.
const webBrain = require("./server/webbrain");
const normQ = q => String(q || "").toLowerCase().replace(/[^a-z0-9' ]+/g, " ").replace(/\s+/g, " ").trim().slice(0, 160);
webBrain.hooks.record = (question, out) => {
  const q = normQ(question); if (q.length < 4 || /\d{6,}|@/.test(question)) return;
  const db = readDb(); db.webAnswers = db.webAnswers || [];
  let w = db.webAnswers.find(x => x.q === q);
  const src = (out.sources && out.sources[0]) || {};
  if (w) { w.count++; w.last = new Date().toISOString(); w.a = out.answer.slice(0, 900); w.source = src.title || w.source; w.url = src.url || w.url; }
  else db.webAnswers.push({ q, a: out.answer.slice(0, 900), kind: out.kind, source: src.title || "", url: src.url || "", count: 1, status: "new", last: new Date().toISOString() });
  db.webAnswers = db.webAnswers.sort((a, b) => (a.status === "new" ? 0 : 1) - (b.status === "new" ? 0 : 1) || b.count - a.count).slice(0, 300);
  writeDb(db);
};
webBrain.hooks.isBlocked = (question, sources) => {
  const db = readDb(), bl = (db.webAnswers || []).filter(x => x.status === "blocked"); if (!bl.length) return false;
  const q = normQ(question), urls = new Set(bl.map(x => x.url).filter(Boolean));
  return bl.some(x => x.q === q) || (sources || []).some(x => urls.has(x.url));
};
app.get("/api/brain/web-answers", adminOnly, (req, res) => res.json({ ok: true, answers: readDb().webAnswers || [] }));
app.post("/api/brain/web-answers/review", adminOnly, (req, res) => {
  const q = normQ(req.body && req.body.q), action = req.body && req.body.action;
  if (!["approve", "block", "dismiss"].includes(action)) return res.status(400).json({ ok: false, error: "action must be approve, block or dismiss" });
  const db = readDb(), w = (db.webAnswers || []).find(x => x.q === q);
  if (!w) return res.status(404).json({ ok: false, error: "Not found" });
  w.status = action === "approve" ? "approved" : action === "block" ? "blocked" : "dismissed";
  writeDb(db); res.json({ ok: true, status: w.status });
});

app.get("/api/brain/trained", (req, res) => { res.set("Cache-Control", "no-cache"); res.json(trainedPayload(readDb())); });

app.post("/api/brain/train", adminOnly, (req, res) => {
  const b = req.body || {};
  const a = String(b.a || "").replace(/<(script|style)[\s\S]*?<\/\1>/gi, "").replace(/<(?!\/?(strong|em|br)\s*\/?>)[^>]*>/gi, "").replace(/<(strong|em|br)\s[^>]*>/gi, "<$1>").trim().slice(0, 1500), keywords = String(b.keywords || "").toLowerCase().replace(/[^a-z0-9' -]+/g, " ").replace(/\s+/g, " ").trim().slice(0, 300);
  if (a.length < 5 || keywords.length < 3) return res.status(400).json({ ok: false, error: "Need keywords and an answer" });
  const db = readDb(); db.trained = db.trained || [];
  const entry = { id: b.id || "t-" + Date.now().toString(36), topic: String(b.topic || "Taught by the owner").slice(0, 60), level: ["all", "ecd", "infant", "junior", "olevel"].includes(b.level) ? b.level : "all", keywords, a, links: Array.isArray(b.links) ? b.links.slice(0, 3).map(l => [String(l[0]).slice(0, 120), String(l[1]).slice(0, 60)]) : [], taughtAt: new Date().toISOString() };
  const i = db.trained.findIndex(e => e.id === entry.id);
  if (i >= 0) db.trained[i] = entry; else db.trained.push(entry);
  if (b.fromGap) { db.brainGaps = (db.brainGaps || []).filter(g => g.q !== String(b.fromGap).toLowerCase()); const wq = String(b.fromGap).toLowerCase().replace(/[^a-z0-9' ]+/g, " ").replace(/\s+/g, " ").trim().slice(0, 160); (db.webAnswers || []).forEach(w => { if (w.q === wq) w.status = "approved"; }); }
  writeDb(db); scheduleGithubSync();
  res.json({ ok: true, entry, total: db.trained.length });
});

app.delete("/api/brain/train/:id", adminOnly, (req, res) => {
  const db = readDb(); const n = (db.trained || []).length;
  db.trained = (db.trained || []).filter(e => e.id !== req.params.id);
  writeDb(db); scheduleGithubSync();
  res.json({ ok: true, removed: n - db.trained.length });
});

app.get("/api/brain/export", adminOnly, (req, res) => res.json(trainedPayload(readDb())));
app.get("/api/brain/sync-status", adminOnly, (req, res) => res.json(Object.assign({ ok: true, configured: !!process.env.GITHUB_TOKEN }, syncStatus)));
app.delete("/api/brain/gaps", adminOnly, (req, res) => {
  const db = readDb(); const q = String(req.query.q || "").toLowerCase();
  db.brainGaps = (db.brainGaps || []).filter(g => g.q !== q); writeDb(db); res.json({ ok: true });
});

// Learners tap a thumbs up / down on answers. Thumbs down = "teach me this better".
app.post("/api/brain/feedback", (req, res) => {
  const ip = req.ip || "x", now = Date.now();
  const h = (gapHits.get("fb" + ip) || []).filter(t => now - t < 60000);
  if (h.length >= 20) return res.status(429).json({ ok: false });
  h.push(now); gapHits.set("fb" + ip, h);
  const q = String((req.body && req.body.q) || "").toLowerCase().replace(/\s+/g, " ").trim().slice(0, 160);
  const snippet = String((req.body && req.body.a) || "").replace(/\s+/g, " ").trim().slice(0, 200);
  if (q.length < 3 || /\d{6,}|@/.test(q)) return res.json({ ok: true, skipped: true });
  const db = readDb(); db.feedback = db.feedback || [];
  const good = !!(req.body && req.body.good);
  const hit = db.feedback.find(f => f.q === q && f.good === good);
  if (hit) { hit.count++; hit.last = new Date().toISOString(); } else db.feedback.push({ q, a: snippet, good, count: 1, last: new Date().toISOString() });
  db.feedback = db.feedback.slice(-400); writeDb(db); res.json({ ok: true });
});
app.get("/api/brain/feedback", adminOnly, (req, res) => res.json({ ok: true, feedback: (readDb().feedback || []).sort((a, b) => (a.good - b.good) || (b.count - a.count)) }));

app.get("/api/brain/status", (req, res) => {
  try {
    const man = JSON.parse(fs.readFileSync(path.join(__dirname, "public", "brain", "manifest.json"), "utf8"));
    res.json({ ok: true, name: man.name, version: man.version, knowledgeFiles: (man.knowledge || []).length, languages: (man.languages || []).length });
  } catch (e) { res.status(500).json({ ok: false, error: "brain manifest missing" }); }
});

// ---- Offline support: list of files the service worker should keep on the device ----
function walkPublic(dir, base = "") {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap(e => {
    const rel = base + "/" + e.name;
    return e.isDirectory() ? walkPublic(path.join(dir, e.name), rel) : [rel];
  });
}
app.get("/precache.json", (req, res) => {
  try {
    const root = path.join(__dirname, "public");
    const files = walkPublic(root).filter(f => !/^\/(sw\.js|precache\.json)$/.test(f) && !/\.(md|map)$/.test(f));
    const sig = require("crypto").createHash("sha1");
    files.forEach(f => { const st = fs.statSync(path.join(root, f)); sig.update(f + st.size + st.mtimeMs); });
    res.set("Cache-Control", "no-cache");
    res.json({ version: sig.digest("hex").slice(0, 12), files: ["/"].concat(files) });
  } catch (e) { res.status(500).json({ error: "precache unavailable" }); }
});
app.get("/sw.js", (req, res) => { res.set("Cache-Control", "no-cache"); res.set("Service-Worker-Allowed", "/"); res.sendFile(path.join(__dirname, "public", "sw.js")); });

// ---- Static files ----
app.use(express.static(path.join(__dirname, "public")));

// SPA fallback — serve index.html for any non-API route
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.listen(PORT, () => {
  console.log(`\n\ud83d\udca1 Chiedza Learning running on http://localhost:${PORT}`);
  console.log("   Created by Ntandomods\n");
});
