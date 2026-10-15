# 🧠 Chiedza Brain

The brain of Chiedza AI is **a folder of plain files**. Change a file, redeploy, and the AI changes. No coding is needed for knowledge, languages, safety rules, riddles or project templates.

```
public/brain/
├── manifest.json            # table of contents: which files the brain loads
├── identity.md              # who Chiedza AI is: name, tone, always / never rules
├── safety.json              # privacy, "help me", off-limits, emergency, homework-cheating guards
├── skills/skills.json       # list of abilities + example prompts (shown in "What can you do?")
├── knowledge/
│   ├── zimbabwe.json        # facts about Zimbabwe
│   ├── study-skills.json    # how to study, exams, memory
│   ├── science-basics.json  # photosynthesis, water cycle, ...
│   ├── maths-help.json      # BODMAS, fractions, area, Pythagoras, ...
│   ├── life-skills.json     # hygiene, diet, saving, road and online safety
│   ├── glossary.json        # school words (define ..., Word Scramble, project key words)
│   └── fun.json             # riddles, jokes, short stories, daily real-life missions
├── languages/
│   ├── shona.json           # phrasebook + numbers
│   └── ndebele.json
└── projects/templates.json  # Project Writer: project types, sentence starters, experiments, business tips
```

Code that reads these files: `public/js/brain.js` (skills engine) and `public/js/brain-projects.js` (project writer). Chiedza AI (`chiedza-ai.js`) asks the brain first, then falls back to the lesson search.

## What the brain can do

| Skill | Examples |
| ----- | -------- |
| 🧮 Maths with working | `12 x 15`, `25% of 80`, `3/4 + 1/2`, `times table of 7` |
| 📏 Unit converter | `convert 5 km to m`, `30 celsius to fahrenheit` |
| 🗣️ Shona and Ndebele | `how do I say thank you in Shona`, `Ndebele numbers`, `teach me Shona` |
| 📖 Word meanings | `define photosynthesis` |
| 📅 Study planner | `study plan for junior 45 minutes` (uses weak topics, favourites and lessons not yet done) |
| 🌅 Daily challenge | new every day, with a streak |
| 🎲 Games | `word scramble`, `tell me a riddle`, `tell me a story` |
| 🗂️ **Project writer** | `write a project on Victoria Falls`, `make a poster about water`, `plan a science experiment on plants`, `plan a tuckshop business selling mandazi`, `create a website about my school`, `all about me project`, `my projects` |
| 🧠 Memory | `my name is Tendai`, `I find maths hard`, `what do you remember about me`, `forget me` |
| 👨‍👩‍👧 Parent summary | `summary for my parent` |
| 🛡️ Safety guard | blocks sharing phone, address or ID, and points a child to a trusted adult and Childline 116 when they need help |

### How the Project Writer stays honest and educational

- It writes the **structure** and only uses **facts it really has** (brain files and lessons). If it has no lesson on a topic it says so and gives a research frame instead of inventing facts.
- It leaves **"✍️ Your turn"** lines so the learner writes the real content in their own words.
- Output can be **downloaded** (printable HTML), **printed** or **copied**. The mini-website project downloads a working `.html` file (HTML + CSS + JavaScript) to learn from.
- The last 8 projects are saved **on the learner's device** (`my projects`).

## Training the AI (no code)

Open **`/teach.html`** on your site and enter your `BRAIN_ADMIN_KEY`.

- **Questions it could not answer:** a live list of what children asked, most-asked first. Click **Teach**, write the answer, save. The AI knows it immediately, with no redeploy.
- **👎 Answers children marked as bad:** every AI answer has 👍 / 👎. Click **Fix** to replace a bad answer.
- **Everything I was taught:** edit or delete anything you taught before.
- **Keywords:** the AI listens for these words in a child's question. "Suggest from question" fills them in for you.

Taught answers are stored on the server and served at `/api/brain/trained`. They are kept in `knowledge/trained.json` in this repo too. To make them survive redeploys, either:
1. set `GITHUB_TOKEN` (a fine-grained token with *Contents: read and write* on this repo only) and optionally `GITHUB_REPO` on Render, and every change is committed to GitHub automatically; or
2. press **Download trained.json** on the Teach page now and then, and commit that file.

## Teaching the brain something new (by editing files)

1. Open a file in `knowledge/` and add an entry:
   ```json
   {"id":"zw-example","level":"all","keywords":"words a child would type","a":"The answer. <strong>HTML is allowed.</strong>","links":[["#/courses","Link label"]]}
   ```
   `keywords` are matched against the child's question, so include the words they would actually use.
2. Run `npm run check:brain` to validate every file.
3. Commit and redeploy.

**What does the AI not know yet?** Unanswered questions are logged anonymously. Set the `BRAIN_ADMIN_KEY` environment variable on Render (the blueprint creates one for you) and open `/api/brain/gaps` with the header `x-admin-key: <your key>` to see the most-asked questions it could not answer. Then add entries for them.

## Privacy

Memory (name, favourite subjects, hard topics, streak, saved projects) is stored in the learner's own browser only. The only thing sent to the server is an unanswered question. Names are never sent, and anything that looks like a phone number or e-mail is dropped.

## Please verify with a teacher

Shona and Ndebele spellings and dialects, the Childline number and national facts should be reviewed by a qualified Zimbabwean teacher before you rely on them for assessment.
