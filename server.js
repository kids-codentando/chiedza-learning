/* ============================================================
   KIDS FLIX — Server
   Serves the static app + a small API for assessments & certificates.
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

function ensureDb() {
  try {
    if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
    if (!fs.existsSync(DB_FILE)) fs.writeFileSync(DB_FILE, JSON.stringify({ assessments: [], certificates: [] }, null, 2));
  } catch (e) {
    console.warn("Could not create data dir (read-only FS?). Using in-memory store.", e.message);
  }
}

let memoryDb = { assessments: [], certificates: [] };

function readDb() {
  try {
    if (fs.existsSync(DB_FILE)) return JSON.parse(fs.readFileSync(DB_FILE, "utf8"));
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

// ---- API ----
app.get("/api/health", (req, res) => {
  res.json({ ok: true, app: "Kids Flix", author: "Ntandomods", time: new Date().toISOString() });
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

  // Auto-issue a certificate when passed
  let certificate = null;
  if (record.passed) {
    certificate = {
      id: "KF-" + new Date().getFullYear() + "-" + Math.random().toString(36).slice(2, 8).toUpperCase(),
      courseId,
      name: record.name,
      percent: record.percent,
      issuedAt: new Date().toISOString()
    };
    db.certificates.push(certificate);
  }

  writeDb(db);
  res.json({ ok: true, assessment: record, certificate });
});

// List assessments (simple, no auth — for demo/admin)
app.get("/api/assessments", (req, res) => {
  const db = readDb();
  res.json({ ok: true, count: db.assessments.length, assessments: db.assessments.slice(-100) });
});

// Issue a certificate manually
app.post("/api/certificates", (req, res) => {
  const { courseId, name, percent } = req.body || {};
  if (!courseId) return res.status(400).json({ ok: false, error: "courseId is required" });
  const db = readDb();
  const certificate = {
    id: "KF-" + new Date().getFullYear() + "-" + Math.random().toString(36).slice(2, 8).toUpperCase(),
    courseId,
    name: (name || "Learner").slice(0, 80),
    percent: Number(percent) || 0,
    issuedAt: new Date().toISOString()
  };
  db.certificates.push(certificate);
  writeDb(db);
  res.json({ ok: true, certificate });
});

// Verify a certificate by ID
app.get("/api/certificates/:id", (req, res) => {
  const db = readDb();
  const cert = db.certificates.find(c => c.id === req.params.id);
  if (!cert) return res.status(404).json({ ok: false, error: "Certificate not found" });
  res.json({ ok: true, certificate: cert });
});

// ---- Static files ----
app.use(express.static(path.join(__dirname, "public")));

// SPA fallback — serve index.html for any non-API route
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.listen(PORT, () => {
  console.log(`\n🦅 Kids Flix running on http://localhost:${PORT}`);
  console.log("   Created by Ntandomods\n");
});
