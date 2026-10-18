---
name: flux-build-unit
description: Build or rework one unit of a Flux course to docs/COURSE-STANDARD.md (labs, application lab, notes with lab setups, problems with traps and structural variety, OCW worked cases). Use for any "build Unit N" or Phase R rework item.
---

# Build one unit to the standard

One unit per PR. The unit's spine block in `docs/courses/<id>.md` is the plan, in the OCW program's
order (D23). If the spine and the code disagree, stop and ask; do not pick one silently.

## 1. Read before writing

- `docs/COURSE-STANDARD.md` in full, and its exemplar for each part you will write (section 1).
- The course's `CONVENTIONS.md` and `src/data/textbook.js`.
- The unit's OCW lectures and problem sets named in the spine. Note which problems have posted
  solutions: they become worked cases.
- What already exists: `grep` the `subjects` packages before writing any physics or math function.

## 2. Physics and math first

- Each new function goes in `packages/subjects/...` if a second course could use it, as a pure
  function with a comment that derives it.
- Its selftest checks it against a second method (closed form against numerical integration, a
  balance residual, a published table) and at least one scaling (double an input, predict the
  factor).

## 3. Labs

For each lab in the spine:

- Write the intuition it corrects as the first line of its doc comment ("Shows that …").
- 2–3 scenarios with real numbers, sliders, a readout, an explainer ending with **What the model
  leaves out**.
- Recompute in the lab; check by the second method in the course's tests.
- Two to four predictions in `predictions.js`, each outcome computed by the lab; labs-check verifies.
- The application lab: a real everyday or industrial device, with numbers stated and cited.
- Register in the catalog (`LAB_META`, `app: true` for an application lab) and the lab loader.

## 4. Problems

- Templates vary by structure (configuration, unknown, representation). Choose answers first and
  back-solve the givens.
- At least 25% conceptual, each wrong option with a `why`. Symbolic answers where natural. Levels 1–3,
  with level 3 at the OCW problem sets' difficulty.
- Every numeric template: at least two `traps`, each the value a named mistake produces.
- Two or three staged hints in the coaching file; the first names the principle; none gives the
  answer.
- At least one worked case per template that reproduces a printed answer (an OCW solution or an open
  text's example), cited by course, term, set and problem. Never a copyrighted textbook's numbers (D9).
- `sim` on every problem with a physical setup, so it opens its lab at the setup.

## 5. Notes

- One file, structured exactly as the exemplar. Derive every result. Recompute every example.
- At least six worked examples, each with a **Show this in the lab** setup where a lab can show it.
- `box fix` for each mistake students make here (the traps you wrote are a good list).
- **What the model leaves out** in each section with an idealisation; **Another view** linking the
  OCW lecture.
- Register the sections (`lab`, `ch`, `topics`, `problems`) so problems and labs link back.

## 6. Verify

- `npm test` and `npm run build` pass.
- The course's layout or smoke script at 380×820 and 1280×800. Open every screenshot and look:
  nothing covered, clipped or off screen; axis units right.
- `npm run scorecard -- --units` shows this unit passing.
- Run `flux-review-unit` and fix what it finds.

## 7. Hand off

PR titled `<CODE> Unit N: <title> to the standard`, with the scorecard row, the screenshots, every
`box fix` quoted, and anything left out and why. Tick `ROADMAP.md`. Do not set `standard: true`.
