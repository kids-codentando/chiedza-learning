/* ============================================================
   CHIEDZA AI - Server
   Serves the static app in public/. The AI runs in the browser from
   the brain files, so there are no API keys and no database.
   Deployable on Render (Web Service). Created by Ntandomods
   ============================================================ */
const express = require("express");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

app.disable("x-powered-by");
app.use((req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  next();
});

app.get("/api/health", (req, res) => res.json({ ok: true, name: "chiedza-ai" }));

app.get("/api/brain/status", (req, res) => {
  try {
    const man = require("./public/brain/manifest.json");
    res.json({ ok: true, name: man.name, version: man.version, reasoningFiles: (man.reasoning || []).length, websiteFiles: (man.website || []).length });
  } catch (e) { res.status(500).json({ ok: false, error: "brain manifest missing" }); }
});

app.use(express.static(path.join(__dirname, "public"), { setHeaders: (res, p) => { if (/[\\/]brain[\\/]|\.js$|\.html$/.test(p)) res.setHeader("Cache-Control", "no-cache"); } }));
app.get("*", (req, res) => res.sendFile(path.join(__dirname, "public", "index.html")));

app.listen(PORT, () => console.log(`\n💡 Chiedza AI running on http://localhost:${PORT}\n   Created by Ntandomods\n`));
