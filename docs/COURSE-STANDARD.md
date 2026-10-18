# The Flux course standard

PHY 2049 is the reference course. It works because it was built around a real class and around how
people learn physics, not because it has more files. This document turns what it does into a bar
every course must meet. A course is not "done" until it passes the scorecard (section 6) and the
owner has worked one unit of it as a student.

Written 17 Oct 2026 from a review of every course against PHY 2049.

---

## 1. Why the other courses feel half-built

Measured on main at `6017a23`:

| | PHY 2049 | Dynamics | Thermo | Calc I | Calc II | Calc III | Statics | STA 3032 | PHY 2048 |
|---|---|---|---|---|---|---|---|---|---|
| Labs | 34 | 20 | 4 | 6 | 8 | 19 | 9 | 10 | 6 (no UI) |
| Problems | 276 | 56 | 17 | 39 | 48 | 82 | 34 | 96 | 67 |
| Wrong-answer explanations (`why` / `traps`) | 97 | 0 | 0 | 0 | 0 | 0 | 0 | 80 | 0 |
| Principle tags and the principle step | yes | – | – | – | – | – | – | – | – |
| Faded worked examples | yes | – | – | – | – | – | – | – | – |
| Staged coaching per problem | yes | – | – | – | – | – | – | – | – |
| Step-through derivations in a lab | yes | – | – | – | – | – | – | – | – |
| Notes examples shown in a lab | 64 | 59 | 12 | 18 | 20 | 0 | 0 | 0 | 0 |
| Predict-first prompts | 69 | 41 | 6 | 0 | 0 | 0 | 0 | 29 | 15 |
| Application labs (real devices) | 8 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Notes, words per unit | ~8,200 | ~3,000 | ~3,000 | ~3,000 | ~2,300 | none | none | removed | none |

Four causes, in order of weight:

1. **The practice loop is missing.** PHY 2049's practice panel asks which principle governs a problem
   before you solve it, fades a worked example as you improve, explains *why* a wrong answer is
   wrong, interleaves older chapters, opens the lab at the problem's setup, and links each problem to
   its notes section. The math and engineering shells have none of this, so no course built on them
   can have it. This is platform work, done once in the shells.
2. **Problems vary the numbers, not the mathematics.** The Calc banks reached 50+ versions by widening
   number ranges: `f(x)=x^2` in four templates, `lim x→46 (x²−2116)/(x−46)`, "add the first 82
   terms". Real practice varies the function family, the configuration and what is asked. Ugly
   numbers also break the labs (the Limits lab cannot frame x = 46).
3. **Wrong answers get "Not yet, try again."** Outside PHY 2049 and STA 3032, no problem names a
   misconception.
4. **Labs explain but do not connect.** No application labs, few predictions outside Dynamics, and
   Calc III, Statics and PHY 2048 have no notes at all.

---

## 2. Notes

- One set per unit, following the course's own order and textbook sections, with the MIT OCW
  counterpart linked as "Another view".
- At least ~5,000 words per unit for a core course. Derive each result; never list formulas without
  where they come from.
- Worked examples: at least 6 per unit, recomputed, each with a **Show this in the lab** setup where a
  lab can show it (checked by notes-check against the lab).
- "Common mistake" boxes for the errors students actually make, and **What the model leaves out** at
  the end of each section that uses an idealisation.
- Two-way links: every section lists its lab and its problems; every problem links back to its
  section.
- Voice: the PHY 2049 notes' rules (short declarative sentences, no filler, say a thing once).

## 3. Labs

- Each lab exists to correct an intuition. If moving a slider teaches nothing, it is not a lab.
- 2–4 predict-first prompts per lab, with the outcome computed by the lab and checked by labs-check.
- An explainer that ends with **What the model leaves out**.
- At least one **application lab** per unit: a real device or system the unit's equations fully
  explain, with realistic numbers (PHY 2049's railgun, MRI and flow meter are the models). For
  engineering courses, prefer hardware from the rocket (Phase A1) where it fits: tanks for pressure
  vessels, nozzles for thermo, turbopump shafts for torsion.
- Every problem with a physical setup opens its lab at that setup (the sim twin), numbers hidden
  until solved.
- Readable at 380×820 and 1280×800, axis labels in the right units, nothing covered by panels.

## 4. Problems

- **Variety from structure.** A template varies at least one of: the function family or
  configuration, which quantity is unknown, or the representation (graph, table, formula, words).
  Number ranges alone do not count toward variety.
- **Designed numbers.** Choose the answer first and back-solve the givens, so answers and
  intermediate steps are sensible numbers a student can check by estimate. No x → 46.
- **Mix per unit:** at least 25% conceptual (choice, true/false or ordering, each wrong option with
  its own `why`), symbolic answers wherever the natural answer is an expression, and numeric
  problems at levels 1, 2 and 3.
- **Principle tags** on every template (the course's own principle list, like PHY 2049's
  `principles.js`), driving the principle step.
- **Wrong-answer feedback:** every choice option has a `why`, and every numeric template has at
  least two `traps` (the specific wrong values a known mistake produces, with what the mistake was).
- **Hints:** 2–3, staged (the first points at the principle, the last at the step), never the answer.
- **Worked cases:** at least one per template from the textbook or an OCW problem set, cited, whose
  printed answer the template reproduces.
- **Second opinion:** every numeric answer is checked by a second method (the lab, a numerical
  integral, a simulation), as now.

## 5. The practice loop (in the shells, for every course)

Ported from PHY 2049 into `packages/shells/math` and `packages/shells/engineering`, behind the same
data each course provides:

- principle step before a problem, from the course's principle tags;
- faded worked examples (backward fading by chapter skill);
- staged coaching and per-answer `why` / `traps` feedback;
- interleaving of earlier chapters into a chapter path, and a weak-principle list;
- problem → notes section link, and the lab drawer at the problem's setup;
- symbolic palette and the phone number pad in both shells.

PHY 2049 keeps its own copy until 24 Oct 2026; Phase 2b later moves it onto the shell.

## 6. The scorecard

`npm run scorecard` prints every course against these thresholds and fails CI for any course marked
`standard: true` in its manifest that falls short. A course is marked only after it passes.

| Check | Threshold |
|---|---|
| Notes words per unit | ≥ 5,000 (core), ≥ 3,000 (review courses) |
| Notes examples with a lab setup per unit | ≥ 6 |
| Predict-first prompts per lab | ≥ 2 |
| Application labs per unit | ≥ 1 |
| Conceptual share of problems per unit | ≥ 25% |
| `why` on every choice option | 100% |
| Numeric templates with ≥ 2 traps | 100% |
| Templates with principle tags | 100% |
| Templates with ≥ 2 hints | 100% |
| Templates whose variety comes from structure (not only ranges) | ≥ 60% |
| Worked cases citing a source | ≥ 1 per template |
| Smoke at 380 and 1280, overflow, layout | pass |

## 7. Owner review

Before a course is marked `standard: true`, the owner works one unit start to finish as a student:
notes, labs, a mixed set and a practice exam. Anything that felt thin, wrong or confusing becomes an
issue, and the course is not marked until those are closed.
