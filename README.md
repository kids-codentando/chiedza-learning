# 🦅 Kids Flix

**A free learning platform for Zimbabwean children — from ECD to O-Level.**
Created with ❤️ by **Ntandomods**.

Kids Flix brings lessons, interactive quizzes, fun games, free courses and printable certificates together in one colourful, kid-friendly app built around the Zimbabwean curriculum.

---

## ✨ Features

- **4 Learning Levels**
  - 🧸 **ECD** (Ages 3–5) — colours, shapes, numbers, letters, animals, body
  - 📗 **Infant** (Grades 1–2) — Maths, English, Shona, Ndebele
  - 📘 **Junior** (Grades 3–7) — Maths, English, Science, Social Studies, Agriculture
  - 🎓 **O-Level** (Forms 1–4) — Maths, English, Combined Science, History, Geography
- **Interactive quizzes** with instant feedback and scoring
- **🎓 Free Courses** with module-based learning and **assessment forms**
- **Printable certificates** (with unique certificate IDs) on passing
- **🎮 Games** — Memory Match & Math Blitz
- **🏅 Badge system** and **progress tracking** (saved in your browser)
- **Zimbabwean identity** — Shona & Ndebele, Great Zimbabwe, national symbols, local culture
- Fully **responsive** and **print-friendly**

---

## 🚀 Deploy on Render

This project is ready to deploy on [Render](https://render.com) as a **Web Service**.

### Option A — One-click Blueprint (recommended)

1. Push this folder to a GitHub/GitLab repository.
2. In Render, click **New → Blueprint**.
3. Connect your repository — Render reads `render.yaml` automatically.
4. Click **Apply**. Render will build and deploy. Done! ✅

### Option B — Manual Web Service

1. In Render, click **New → Web Service** and connect your repo.
2. Set:
   - **Environment:** `Node`
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
   - **Health Check Path:** `/api/health`
3. (Optional) Add env var `NODE_VERSION = 20.11.1`.
4. Click **Create Web Service**.

Render will provide a public URL such as `https://kidsflix.onrender.com`.

> **Note:** On the Render free tier the filesystem is ephemeral, so assessment
> submissions/certificates are stored in a JSON file that resets on redeploy.
> For permanent storage, connect a database (e.g. Render Postgres) in `server.js`.

---

## 💻 Run Locally

```bash
cd kidsflix
npm install
npm start
# open http://localhost:3000
```

The app also works as a **pure static site** (no server needed) — just open
`public/index.html`, or host the `public/` folder on any static host.
The certificate generation and progress tracking work entirely in the browser.

---

## 🔌 API Endpoints

| Method | Endpoint | Description |
| ------ | -------- | ----------- |
| GET  | `/api/health` | Service health check |
| POST | `/api/assessments` | Save an assessment result (auto-issues a certificate on pass) |
| GET  | `/api/assessments` | List recent assessment submissions |
| POST | `/api/certificates` | Issue a certificate manually |
| GET  | `/api/certificates/:id` | Verify a certificate by ID |

---

## 📁 Project Structure

```
kidsflix/
├── public/
│   ├── index.html          # App shell
│   ├── css/styles.css      # Design system (Zimbabwe-themed, dark UI)
│   └── js/
│       ├── data.js         # Curriculum, courses, games, badges
│       └── app.js          # Router, lessons, quizzes, courses, certificates
├── server.js               # Express server + API
├── package.json
├── render.yaml             # Render Blueprint
└── README.md
```

---

## 🎓 Certificates

When a learner completes a course's assessment form with **70% or more**, a
certificate is unlocked. It shows the learner's name, course, score, date and a
unique certificate ID, and can be **printed or saved as a PDF** from the browser.

---

## 📜 License

MIT — free to use and adapt for education.

**Created by Ntandomods** 🇿🇼
