# FLUX·stats — STA 3032

**This course now lives in the Flux platform repo (DGadapee00/Flux), at `courses/sta3032/`.** Paths
in this file are relative to that folder, and commands run from it, unless they say "repo root".
The old repo, stats, is frozen and no longer edited. The platform's own rules are in the
repo root's `AGENTS.md` and `PLAN.md`; where they and this file differ about the platform, they win.
On the hub the route is `#/sta3032/...`. An old hash such as `#/mid` redirects.

A study app for STA 3032 (Fall 2026; Walpole, Myers, Myers & Ye, *Probability & Statistics for
Engineers & Scientists*). It is the sibling of [FLUX](https://github.com/DGadapee00/flux-phy2049)
for PHY 2049, with the same approach: generated practice problems tied to the course, worked
solutions, spaced review, and interactive labs. It is built for a phone first.

**Live site: https://flux-stats.pages.dev**

```bash
npm install
npm start          # http://localhost:5177
npm test           # stats-check, tex-check, problems-check, labs-check, route test
node scripts/smoke.mjs   # every screen at 380px and 1280px (needs the dev server running)
```

## What is here

- **Practice** — 96 problem generators covering all ten chapters (the midterm's Ch 1–6 and the final's Ch 1–10). Each draws fresh numbers,
  computes the answer, and shows a worked solution that names every table lookup. Where a problem has a
  textbook worked case (20 in all), the first attempt uses its numbers; after that, every attempt gets new numbers.
  - **Grading:** answers are graded to table precision. A problem accepts both the exact value
    and the value you get from the printed tables (z rounded to 2 places, the t row either
    side of your df).
  - **Feedback:** common slips get named: the complement, one tail instead of two, s instead
    of σ, adding variances that should add but were subtracted.
  - **Interpretation:** every hypothesis test also asks for H₁ and the conclusion in words
    (with "accept H₀" and "prove H₁" as the wrong options); "Which procedure?" is generated from
    data-style cues; a separate problem asks what a confidence level means.
  - **Review:** a Today plan on the home screen, spaced review (a problem climbs only when it
    was due, and nothing is scheduled past the day before the exam), mixed sets, and a timed
    8-problem practice exam.
- **Tables** — Appendix A as a lookup, with the printed value beside the exact one and the full z
  table highlighted.
- **Explore** — ten labs, all 2D, each built to correct one or two intuitions. Every lab has
  Predict-first cards: you commit to what a change will do, then make it, and the lab says what
  happened from its own numbers.
  - *Describing data* (Ch 1): histogram, dot plot, box plot; mean vs median, s vs IQR, bin width.
  - *Conditional probability* (Ch 2): a screening test as an area model and a tree; Bayes' rule.
  - *Distributions* (Ch 3, 5, 6, and t, χ², F): every distribution with an event shaded.
  - *Sampling distributions* (Ch 7): x̄ and p̂ from thousands of samples; the normal
    approximation to the binomial with and without the continuity correction.
  - *CI coverage* (Ch 8): 100 intervals; z, t, and the wrong z-with-s.
  - *Errors and power* (Ch 8): H₀ and H₁ curves, α, β, power.
  - *Normal probability plot* (Ch 8): skew, heavy tails, and how much a normal sample wiggles.
  - *Which test?* (Ch 8–10): a decision tree ending at the formula, assumptions and TI-84 menu.
  - *Paired vs independent* (Ch 9): the same subjects twice, tested both ways.
  - *Regression* (Ch 10): drag points; line, residuals, R², residual plot, leverage.
  Worked solutions link to the lab for their chapter.
- **Notes** — removed on 13 Oct 2026, with the class review sheet and the worked cases from the
  instructor's notes, until they are asked (see [PROVENANCE.md](PROVENANCE.md)).

## How it is checked

- `scripts/stats-check.mjs` pins every distribution function to published values. It also checks
  every entry of the printed t, χ² and F tables against the exact value; 7 known misprints are
  listed, including t₀.₀₀₀₅,₁ = 636.578 where the exact value is 636.619.
- The same script reproduces the teacher's Chapter 1 examples (TI-84 quartiles, fences).
- `scripts/problems-check.mjs` checks every generator:
  - its worked cases reproduce the textbook's answers,
  - 200 seeded versions each stay valid and render,
  - KaTeX parses every formula,
  - and each probability agrees with a seeded Monte Carlo simulation of the same problem.
- `scripts/labs-check.mjs` runs every lab headless:
  - every default, scenario and prediction state computes and draws,
  - every Predict-first verdict is what the lab's own numbers show (over several seeds),
  - and the pictures are statistically right: the simulated SD of x̄ against σ/√n, long-run
    CI coverage against the confidence level, simulated power and size against the formula.

[ERRATA.md](ERRATA.md) lists where a printed answer is wrong. Quartiles follow the class's TI-84 rule (the median of each half). The tables are those of the
textbook's Appendix A (`src/stats/tables-data.js`, extracted by `scripts/extract_tables.py`).
