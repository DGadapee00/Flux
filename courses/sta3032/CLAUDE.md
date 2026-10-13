# FLUX·stats: notes for Claude

**This course now lives in the Flux platform repo (DGadapee00/Flux), at `courses/sta3032/`.** Paths
in this file are relative to that folder, and commands run from it, unless they say "repo root".
The old repo, stats, is frozen and no longer edited. The platform's own rules are in the
repo root's `AGENTS.md` and `PLAN.md`; where they and this file differ about the platform, they win.

Vite + vanilla JS + KaTeX study app for STA 3032. Sibling of FLUX (DGadapee00/flux-phy2049), whose
engine and conventions were copied and adapted here. This folder's `PLAN.md` holds the course
decisions (tables, quartile rule, exam dates, build order).

## Checks

- `npm test` (stats-check, tex-check, problems-check, labs-check, route test) must pass. `npx vite build` must succeed.
- `node scripts/smoke.mjs` needs the dev server on 5177 (`npx vite --port 5177 --strictPort`, in the
  background). It fails on page errors and on any page wider than a 380px phone. Look at the
  screenshots in `scripts/output/smoke/` after UI changes.
- `npm run overflow` (same server) opens every problem with its solution revealed, at 380px, and fails on any equation wider than the column. Run it after changing
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
  on the y-axis (the course's convention).
- Regression is written ŷ = a + bx (a intercept, b slope), as in the course.
- Table A.6 prints only α = 0.05 and 0.01, so F intervals from the table are 90% or 98%.
- A worked case may break a condition generated versions must meet; put such conditions in
  `sampleValid`, not `valid`.
- TeX in JS goes in String.raw templates (tex-check enforces it). Prose uses `$…$` and `$$…$$`;
  never a bare `$` for money (write "dollars").
- Cite sources by section (Walpole §5.2). Do not invent textbook example numbers.
- **No material from the instructor's notes or review sheets** (see PROVENANCE.md): no rewritten
  notes, no worked cases or lab presets from their examples, until they have been asked and said yes.
  Named sets (src/problems/sets.js) are still supported; problems-check checks each one.
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

Notes mode was removed on 13 Oct 2026 (PROVENANCE.md). An old `#/<unit>/notes` link opens the
practice list. Do not add notes rewritten from the instructor's notes.
