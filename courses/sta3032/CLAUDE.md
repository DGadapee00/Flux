# FLUX·stats: notes for Claude

Vite + vanilla JS + KaTeX study app for STA 3032. Sibling of FLUX (DGadapee00/flux-phy2049), whose
engine and conventions were copied and adapted here; FLUX itself is not to be modified. PLAN.md
holds the plan and the course decisions (tables, quartile rule, exam dates, build order).

## Checks

- `npm test` (stats-check, tex-check, problems-check, labs-check, notes-check) must pass. `npx vite build` must succeed.
- `node scripts/smoke.mjs` needs the dev server on 5175 (`npx vite --port 5175 --strictPort`, in the
  background). It fails on page errors and on any page wider than a 380px phone. Look at the
  screenshots in `scripts/output/smoke/` after UI changes.
- `npm run overflow` (same server) opens every problem with its solution revealed, and every notes
  chapter, at 380px, and fails on any equation wider than the column. Run it after changing
  worked steps. Displayed equations wrap automatically (`fitMath` in shared.js); one that still
  cannot (a single long root or fraction) must be split into steps by hand.

## Conventions

- Distribution functions live in `src/stats/dist.js` and must be pinned in stats-check before a
  generator uses them.
- Printed tables are data (`src/stats/tables-data.js`), read through `src/stats/tables.js`. A worked
  solution quotes the printed value; grading accepts exact and table routes (`alt` in kit.js).
- The class works on the TI-84: p-values are exact (tcdf, normalcdf, 2-SampFTest…), and Welch's df is
  the calculator's fractional value (rounded down is also accepted, for the table).
- Quartiles: TI-84 rule (median of halves, median excluded when n is odd). s uses n − 1.
- Normal approximation (binomial, p̂, proportion tests): np(1 − p) ≥ 10, with continuity
  correction for counts.
- Normal probability plot: theoretical quantiles z_i = Φ⁻¹((i − 0.5)/n) on the x-axis, sorted data
  on the y-axis (the notes' convention).
- Regression is written ŷ = a + bx (a intercept, b slope), as in the notes.
- Table A.6 prints only α = 0.05 and 0.01, so F intervals from the table are 90% or 98%.
- A worked case from the notes may break a condition generated versions must meet (Ex 8.14);
  put such conditions in `sampleValid`, not `valid`.
- TeX in JS goes in String.raw templates (tex-check enforces it). Prose uses `$…$` and `$$…$$`;
  never a bare `$` for money (write "dollars").
- Cite sources by section (Walpole §5.2) or by the notes' example number (Notes Ex 1.13). Do not
  invent textbook example numbers. The class's review sheet is cited by question (Review 1, Q4).
- Review-sheet problems (src/problems/bank/review.js) ask a sheet question the same way, all its
  parts on one setup; the sheet's own numbers are a worked case. A named set (src/problems/sets.js)
  lists them in the sheet's order, each item naming that case's `src`; problems-check checks it.
- Mobile first: 380px portrait is the design width; no horizontal scroll.

## Labs

- A lab is a `defineLab({...})` object in `src/labs/` (contract in `define.js`), registered in
  `src/labs/index.js` and listed per exam in `catalog.js` (`labs`). All 2D, on Canvas via
  `src/plot/plot.js`. Route: `#/<unit>/explore/<labId>`.
- `compute(state, rng)` is pure and gets a seeded generator; every number shown comes from it.
- A lab earns its place only if moving a parameter corrects an intuition. Each gets 2–4
  predictions; `outcome(before, after)` must derive the answer from the lab's results, and
  labs-check requires it to equal `expect` (and the change to be reachable by the sliders).
- Numbers quoted in a prediction's `why` are computed; recompute them after changing a preset.

## Notes

- One file per chapter in `src/notes/` (format in `src/notes/index.js`), rewritten from the teacher's
  notes, which are the only notes for this course (there is no weekly drop). Route `#/<unit>/notes/<ch>`.
- Every worked example that states a number carries `checks`; notes-check recomputes each one.
  Link an example to its practice case (`problem`, `case`) only when the case cites that example.
- Where the source slips, keep its example and add a `fix` block (and a line in ERRATA.md).
- Chapters read like FLUX's notes: a `lede`, sections grouped by `part`, prose before formulas,
  `why` boxes, `bridge` paragraphs, and a `formulas` sheet. `show: 'lab:scenario'` on an example
  opens that lab preset (route `?sc=`); add the scenario to the lab first.
- Material beyond the class notes comes from Walpole and is marked: a `book` block inside a class
  section, or a whole section with `source`. Its examples are lettered (2.A, 2.B) and never link a
  practice case.
