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
  const { id, courseId, name, percent, issuedAt } = req.body || {};
  if (!courseId) return res.status(400).json({ ok: false, error: "courseId is required" });

  const db = readDb();
  const certId = String(id || newCertId()).toUpperCase();
  let certificate = db.certificates.find(c => c.id === certId);
  if (certificate) {
    certificate.courseId = courseId;
    certificate.name = (name || certificate.name || "Learner").slice(0, 80);
    if (percent != null) certificate.percent = Number(percent) || 0;
  } else {
    certificate = {
      id: certId,
      courseId,
      name: (name || "Learner").slice(0, 80),
      percent: Number(percent) || 0,
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
