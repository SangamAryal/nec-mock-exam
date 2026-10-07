# NEC Mock Exam — Computer Engineering (ACtE)

A timed mock-test app for the Nepal Engineering Council registration exam (Computer Engineering),
following the revised pattern: **100 MCQs × 1 mark, 2 hours, pass mark 50, no negative marking**.

- Every mock draws a fresh random paper: 10 questions per syllabus chapter, covering every
  sub-chapter, from a bank of 1000. Questions you've already seen are avoided until a chapter's
  pool runs out, and answer options are shuffled every attempt.
- Exam screen with countdown timer (auto-submits at 0:00), question palette, mark-for-review,
  keyboard shortcuts (A–D / 1–4, ← →, F) and auto-save, so a refresh never loses your progress.
- Result page with score, pass/fail, per-chapter breakdown and the sub-chapters to revise first.
- Review mode: your answer vs the correct one, an explanation, and for numerical questions the
  formula plus a step-by-step solution. You can filter by wrong, unanswered, marked, numerical or chapter.
- Revision notes: 300 probable Q&As and key points for all 60 sub-chapters.
- Responsive (phone → desktop), light/dark theme. Everything stays in your browser (localStorage).

## Run locally

Requires Node 18+ (this machine: `~/.nvm/versions/node/v21.6.1`; the system `node` is v12 and too old).

```bash
nvm use 21     # or: export PATH=$HOME/.nvm/versions/node/v21.6.1/bin:$PATH
npm install
npm run dev    # http://localhost:5173
```

`npm run build` creates a static production build in `dist/` (`npm run preview` serves it).

## Question data

`src/data/*.json` is generated from the two source PDFs by `scripts/extract.py` (needs `pdftotext`):

```bash
python3 scripts/extract.py ~/Downloads/NEC_Computer_Engineering_Model_Sets.pdf ~/Downloads/NEC_Computer_Engineering_Answer_Book.pdf
```

The script cross-checks every question against both the answer key and the solution book and
reports any mismatch. `scripts/formulas.json` holds the hand-written "Formula" line shown for
numerical questions.

## Structure

```
scripts/extract.py        PDF → JSON extraction
src/data/                 questions.json, notes.json, syllabus.json (+ index.ts)
src/lib/exam.ts           random paper generation, scoring
src/lib/storage.ts        localStorage persistence
src/pages/                Home, Exam, Result, Review, Notes
src/components/           Layout, Palette, Solution, Modal, Icons
```
