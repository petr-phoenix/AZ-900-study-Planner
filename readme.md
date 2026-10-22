# ☁️ AZ-900 Study Planner

A clean, dependency-free web app that helps you prepare for the **Microsoft Azure Fundamentals (AZ-900)** exam.
No build step, no frameworks — just HTML, CSS and vanilla JavaScript, so it is easy to read and hand-edit.

## Features

- **Dashboard** – animated exam-readiness ring, countdown to your next exam, XP / levels, study streak, badges.
- **Revision planner** – pick one of your exam dates (Mon 19, Wed 21, Fri 23, Mon 26 Oct 2026). The plan runs from *today* to exam day, puts your **weakest, most heavily weighted domains first**, schedules a **mock exam the day before**, and finishes with an exam-day checklist. Dates that have passed are greyed out automatically.
- **Weak-area detection** – every answer updates per-domain accuracy. Domains are tagged *Weak / Improving / Strong* and the plan re-prioritises ("Re-generate plan" button).
- **Learn** – the 12 modules from the three Microsoft Learn paths with checkboxes, topic chips and links.
- **Practice** – 40 original questions in 3 domains; Smart practice (weak areas + missed questions), Quick quiz, Domain focus, Missed-question review and a timed 30-question **Mock exam** (pass mark 70%).
- **"Wow" moments** – confetti, combo streaks, level-ups, badge unlocks, animated rings, dark mode, keyboard shortcuts (A–D, Enter).
- **Saved locally** – progress lives in your browser's `localStorage` (nothing is sent anywhere).

## Run it

```bash
git clone <your-repo-url> az900-study-planner
cd az900-study-planner
code .
```

Then either double-click `index.html`, or use the VS Code **Live Server** extension, or:

```bash
python3 -m http.server 5500   # then open http://localhost:5500
```

## Files

| File | Purpose |
| --- | --- |
| `index.html` | Page shell and navigation |
| `styles.css` | All styling (light + dark theme via CSS variables) |
| `data.js` | **Edit me:** exam dates, domains, modules, practice questions |
| `app.js` | State, planner algorithm, views, quiz engine, gamification |

## Customising

- **Exam dates** – edit `EXAMS` in `data.js` (`YYYY-MM-DD`).
- **Add questions** – append a row to `QUESTION_ROWS` in `data.js`:
  `["id", "cloud|arch|mgmt", "Question?", "Correct answer", ["Wrong 1","Wrong 2","Wrong 3"], "Explanation"]`
  Answers are shuffled automatically.
- **Planner logic** – see `buildPlan()` and `need()` in `app.js`. A domain's *need* is `exam weight × (1 − mastery)`, where mastery blends practice accuracy (60%) and module completion (40%).
- **Colours / look** – tweak the CSS variables at the top of `styles.css`.

## Notes

- Practice questions are original and written to match the AZ-900 skills outline; they are not copied from Microsoft's assessment. For the official free practice assessment, use Microsoft Learn.
- Always verify the latest exam skills outline and policies on Microsoft Learn.