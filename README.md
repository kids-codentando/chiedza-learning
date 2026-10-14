# 💡 Chiedza Learning

**A free learning platform for Zimbabwean children — from ECD to O-Level.**
Created with ❤️ by **Ntandomods**.

Chiedza Learning brings lessons, interactive quizzes, fun games, free courses and printable certificates together in one colourful, kid-friendly app built around the Zimbabwean curriculum.

---

## ✨ Features

- **4 Learning Levels**
  - 🧸 **ECD** (Ages 3–5) — colours, shapes, numbers, letters, animals, body, fine motor & pre-writing, feelings & manners, sorting & patterns, five senses, Ndebele, sign language
  - 📗 **Infant** (Grades 1–2) — Maths, English, Shona, Ndebele, phonics & reading, time/money/measuring, creative arts, values & safety, sign language
  - 📘 **Junior** (Grades 3–7) — Maths, English, Science, Social Studies, Agriculture, Shona, Ndebele, creative & performing arts, reading & creative writing, sign language
  - 🎓 **O-Level** (Forms 1–4) — Maths, English, Combined Science, History, Geography
- **🤟 Sign language** — *Hands That Talk* (ECD), *Meet ZSL* (Infant), *Sign Language & Deaf Culture* (Junior) and a free **Sign Language & Deaf Awareness** course with certificate
- **💡 Chiedza AI** — a built-in learning helper (bottom-right) that answers from every lesson, quiz, course and platform fact, quizzes learners, and can read answers aloud
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

Render will provide a public URL such as `https://chiedza-learning.onrender.com`.

> **Note:** On the Render free tier the filesystem is ephemeral, so assessment
> submissions/certificates are stored in a JSON file that resets on redeploy.
> For permanent storage, connect a database (e.g. Render Postgres) in `server.js`.

---

## 💻 Run Locally

```bash
cd chiedza-learning
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
| POST | `/api/certificates` | Issue a certificate manually (stores the canonical data + tamper-evident code) |
| GET  | `/api/certificates/:id` | Verify a certificate by ID |
| GET  | `/api/verify/:id` | **Open verification** — returns validity, checksum and the recognised-by list |

---

## 📁 Project Structure

```
chiedza-learning/
├── public/
│   ├── index.html          # App shell
│   ├── assets/             # Brand kit: emblem, lockups, seal, favicon, brand sheet
│   ├── css/styles.css      # Design system (Zimbabwe-themed, dark UI)
│   └── js/
│       ├── data.js         # Curriculum, courses, games, badges
│       ├── extra-*.js      # Additional ECD / Infant / Junior subjects + sign-language course
│       ├── chiedza-ai.js   # Chiedza AI helper (client-side, searches all lessons & FAQs)
│       ├── qrcode.js       # QR generator (MIT) for certificate verification
│       └── app.js          # Router, lessons, quizzes, courses, certificates
├── server.js               # Express server + API
├── package.json
├── render.yaml             # Render Blueprint
└── README.md
```

---

## 🎨 Brand — Chiedza Learning × Ntandomods

The official brand kit lives in `public/assets/`:

| File | Use |
| ---- | --- |
| `icon.png` | Emblem (light-bulb growing into leaves) — header, report card |
| `favicon.png` | Rounded app icon / favicon |
| `seal.png` | Official gold & green certificate seal |
| `logo-h-light.png` / `logo-h-dark.png` | Horizontal lockup for dark / light surfaces |
| `logo-stack-light.png` / `logo-stack-dark.png` | Stacked lockup for dark / light surfaces |
| `logo-full.png` / `logo-full-transparent.png` | Master stacked logos |
| `brand-sheet.png` | Full brand sheet |

The emblem stands for bright ideas that grow; the seal appears on every certificate.

---

## 🎓 Certificates

When a learner completes a course's assessment form with **70% or more**, a
certificate is unlocked. It shows the learner's name, course, the **modules
completed**, level, duration, score, date and a unique certificate ID, and can be
**printed or saved as a PDF** from the browser.

### 🔎 Open Verification Standard — works for every organisation

Every certificate is **verifiable by anyone — public or private, anywhere in the world**
(schools, colleges, employers, NGOs, government bodies). Each certificate carries:

- a unique **Certificate ID** (e.g. `CH-2026-ZW8K21`),
- a **QR code** that deep-links to the verification page,
- a **tamper-evident verification code** derived from the certificate's own details.

Verification works in three ways:

1. **Scan the QR code** — opens the verification page with the details filled in.
2. **Enter the Certificate ID** — checked against the public registry (`/api/verify/:id`).
3. **Check the verification code** — recomputed from the certificate's details to
   detect any alteration (works **offline**, straight from the QR data).

The public portal is at `#/verify`. No account or login is ever required.

---

## 📜 License

MIT — free to use and adapt for education.

**Created by Ntandomods** 🇿🇼

---

## 🤟 A note on sign language content

The sign-language lessons teach what Zimbabwean Sign Language (ZSL) is, fingerspelling, Deaf etiquette, interpreters and inclusion. They deliberately **do not claim specific ZSL handshapes**, because signs vary by country and region. To add real signs, embed videos/images from a ZSL-fluent Deaf signer or the [King George VI Centre](https://www.kgvi.org/programs/sign-language/) inside a lesson `body`.

## 💡 Chiedza AI

`public/js/chiedza-ai.js` builds a search index from `LEVELS` and `COURSES` plus a platform FAQ, so **new lessons are picked up automatically**. It runs entirely in the browser (no API key, no cost). Language content (Shona/Ndebele) should be reviewed by a native-speaker teacher.

## 🖼️ Pictures from Chiedza AI

Chiedza AI can send pictures ("show me sign language pictures", "picture of hand washing"). Images live in `public/assets/learn/` and each carries the Chiedza Learning × Ntandomods logo band. To add one, drop a JPG in that folder and add an entry (file name, caption, keywords) to the `IMAGES` list in `public/js/chiedza-ai.js`. The sign-language images are general illustrations of Deaf etiquette, not ZSL handshape charts.
