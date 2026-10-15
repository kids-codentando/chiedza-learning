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

app.get("/api/brain/status", (req, res) => {
  try {
    const man = JSON.parse(fs.readFileSync(path.join(__dirname, "public", "brain", "manifest.json"), "utf8"));
    res.json({ ok: true, name: man.name, version: man.version, knowledgeFiles: (man.knowledge || []).length, languages: (man.languages || []).length });
  } catch (e) { res.status(500).json({ ok: false, error: "brain manifest missing" }); }
});

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
