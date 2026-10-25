# 💡 Chiedza AI

**A reasoning AI that solves problems step by step and builds complete websites.**
Created with ❤️ by **Ntandomods**.

Chiedza AI runs on **files, not on a paid AI**. Its brain is a folder of plain JSON and Markdown files plus a small reasoning engine. There is no API key, no database and no monthly bill. It shows its working, says "I cannot tell" when the files do not give enough, and never invents facts.

## What it does

- 🧠 **Reasons about almost anything.** A general reasoning engine reads any question, works out what kind of thinking it needs — define, explain how, explain why, weigh pros and cons, decide, plan, explore a “what if”, analyse a topic, or reason from first principles — and answers with its working shown. It draws on a broad knowledge file (science, health, money, technology, civics, language, maths and more) and applies domain lenses (money, health, learning, environment, technology, people, future, law) to weigh trade-offs. When the files do not cover a topic it does **not** guess: it builds a clear reasoning map of the sub-questions to answer.
- 🌐 **Builds full websites.** Describe the site in a sentence. Chiedza works out the purpose, name, place, offerings, colours, tone and pages, builds a real multi-page site (HTML, CSS, JS), checks its own work, shows every reasoning step, and lets you **preview**, **read the code** and **download a ZIP**.
- ✏️ **Edits the site you built.** `make it green`, `add pricing`, `add a gallery`, `dark mode`, `make it one page`, `change the name to ...`, `phone is 0771 234 567`.
- 🧮 **Word problems and sums** with working shown.
- 🔗 **Logic** (who is tallest, if-then, all/some/none), **cause and effect** and **comparisons**.
- 🛡️ **Safety rules** run first: no phishing or scam pages, no private IDs or passwords.

Try: `Build a website for Mai Chido Bakery in Harare selling cakes, bread and mandazi. Make it pink with a gallery`

13 kinds of site are built in: business, online shop, restaurant or food, salon, school, church or charity, portfolio, farm, clinic, tech or startup, event, blog and personal.

**Honest limits.** The copy comes from templates in the brain files, so it is solid but generic. Photos are colour tiles, contact forms open WhatsApp or email (no server), and anything Chiedza cannot know (phone, prices, reviews) is left as a yellow `[placeholder]` for you to fill in.

## Run locally

```bash
npm install
npm start
# open http://localhost:3000
```

It also works as a plain static site: host the `public/` folder anywhere.

## Checks

```bash
npm run check:brain   # brain files + reasoning + website builder + general reasoner
npm run test:general  # general reasoning engine only
```

## Deploy on Render

1. Push this repo to GitHub.
2. In Render choose **New → Blueprint** and connect the repo. `render.yaml` does the rest (health check `/api/health`).

## Project structure

```
chiedza-ai/
├── public/
│   ├── index.html, css/studio.css, js/studio.js   # chat + preview + ZIP download
│   ├── js/brain.js        # loads the brain, runs safety, calculator, routes handlers
│   ├── js/reasoning.js    # word problems, logic, causes, comparisons
│   ├── js/reasoning-general.js  # universal reasoner: define, decide, plan, what-if, analyse
│   ├── js/sitebuilder.js  # website builder
│   └── brain/             # the AI's files (see public/brain/README.md)
│       └── knowledge/general.json  # 60 concepts, analogies and reasoning heuristics
├── scripts/               # check-brain, test-reasoning, test-website, test-general
├── server.js              # tiny static server + /api/health
└── render.yaml
```

## License

MIT © Ntandomods
