# 🧠 Chiedza Brain

Chiedza AI is **a folder of plain files plus a small reasoning engine**. It does not use an outside AI, an API key or the internet. Change a file, redeploy, and the AI changes.

```
public/brain/
├── manifest.json            # which files the brain loads
├── identity.md              # who the AI is, what it always / never does
├── safety.json              # rules that run before anything else
└── reasoning/
    ├── reasoning.json       # cue words for word problems, steps and checks
    ├── logic.json           # ordering, "if ... then", all/some/none
    ├── causes.json          # cause and effect chains
    ├── compare.json         # "X or Y?" side by side tables
    ├── examples.json        # tests: question + expected answer
    ├── site-rules.json      # how to read a website request (colours, tones, places, extras)
    ├── website.json         # website types, part 1 (business, shop, restaurant, salon, school, community)
    └── website-more.json    # website types, part 2 (portfolio, farm, clinic, tech, event, blog, personal)
```

Code that reads the files: `public/js/brain.js` (loader, safety, calculator), `public/js/reasoning.js` (thinking engine), `public/js/sitebuilder.js` (website builder).

## What it does

| Skill | Try |
| ----- | --- |
| Calculator with working | `12 x 15`, `25% of 80`, `3/4 + 1/2` |
| Word problems | `Tendai has 24 mangoes and gives away 9. How many are left?` |
| Logic | `Tino is taller than Rudo. Rudo is taller than Chipo. Who is the tallest?` |
| Cause and effect | `why does it rain` |
| Comparisons | `difference between a verb and a noun` |
| **Full website builder** | `Build a website for Mai Chido Bakery in Harare selling cakes, bread and mandazi. Make it pink with a gallery` |
| Edit the site | `make it green`, `add pricing`, `change the name to ...`, `make it one page`, `phone is 0771 234 567` |

## How the website builder reasons

1. **Purpose.** Words in the request are matched against the keywords of each type in `website.json`.
2. **Facts.** It extracts name, place, offerings, colours, tone, phone, email and extras. It never invents contact details, prices or customer quotes: missing items become yellow `[placeholders]`.
3. **Design.** Colours come from the request or the type, then are adjusted until all text passes the 4.5:1 contrast rule.
4. **Build.** It renders real HTML, CSS and JS: Home, About, the offer page, optional Pricing / Gallery / News, and Contact (or one long page).
5. **Check.** It checks its own result: links, headings, titles, mobile viewport, contrast and that user text is escaped.
6. **Show.** Every step is shown in the chat. Preview the site, view the code, or download a ZIP.

## Teach it

* New kind of site: copy an entry in `website-more.json`, change keywords and copy, run `npm run test:website`.
* New colour or place: add it to `site-rules.json`.
* New reasoning example: add a question and answer to `examples.json`, run `npm run test:reasoning`.

Run every check with `npm run check:brain`.
