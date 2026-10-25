# The Flux course standard

PHY 2049 is the benchmark: the idealised state every course is built toward (D32). It works because
it was built around a real class and around how people learn physics, not because it has more files.
Where another course does something differently, PHY 2049's way is the target. This document says what every course must be
and how good each part must be. Read it in full before you write any part of a course.

A course is finished when three things are true:

1. It has every part in section 2, in the shape the exemplars in section 1 show.
2. It passes the scorecard (section 8). The scorecard is a floor, not the goal.
3. The owner has worked one unit of it as a student and closed what he found (section 9).

The scorecard cannot tell a good course from a padded one. It fails PHY 2049, the course the owner
rates best, partly because PHY 2049's data predates the fields it counts. When the numbers and the
exemplars disagree, the exemplars win.

Written 17 Oct 2026; reframed around exemplars and owner review on 18 Oct 2026 (DECISIONS.md, D16,
D17).

---

## 1. Read these first

Before you write a part, open its exemplar and match it. Copy the structure; write your own content.
Every content exemplar is PHY 2049, the benchmark (D32). No other course is an exemplar. The one
non-PHY file below is `courses/starter`, the course to copy for wiring: it names no real course
and holds only placeholder content.

| Part | Exemplar | What to take from it |
|---|---|---|
| Notes file | `courses/phy2049/src/notes/content/e4-charge-in-motion.html`, `e3-potential-to-power.html` | Structure (parts, legend, toc), voice, derivations, worked examples, `box fix` |
| Notes registry and setups | `courses/phy2049/src/notes/index.js`, `setups.js` | Sections linked to labs and problems; **Show this in the lab** |
| Notes protocol and quality bar | `courses/phy2049/CLAUDE.md`, "The quality bar" | Voice rules, the error hunt, self-review |
| Application lab | `courses/phy2049/src/labs/mri.js`, `motor.js`, `powerline.js` | A real device, real numbers, closed form plus a second method, **What the course model leaves out** |
| Concept lab with predictions | `courses/phy2049/src/labs/capacitor.js`, `src/data/predictions.js` | A slider that corrects an intuition; predictions computed by the lab |
| Problem template | `courses/phy2049/src/problems/bank/e4.js` | Worked steps, levels, a lab behind the problem |
| Coaching and principles | `courses/phy2049/src/problems/coaching/e2.js`, `principles.js` | Staged hints, a `why` for each wrong answer, principle tags |
| Course wiring | `courses/starter` (its `README.md` says how to copy it) | Manifest, catalog, shell wrappers, storage keys, citation map, checks; one example unit |
| Course plan | `docs/course-plans/TEMPLATE.md` | What a course plan must say before code |

## 2. What every course is

Every course is the same app with different content. A student who knows PHY 2049 should find
everything in the same place in any course. Do not build a different app.

- **One shell.** A course uses `packages/shells/math`, `packages/shells/engineering` or
  `packages/shells/physics` (PHY 2049's UI). It writes its catalog, labs, bank, notes and
  two thin wrappers (`ui/hud.js`, `ui/problems.js`). The physics shell also takes `ui/units.js`,
  `ui/predict.js` and `ui/derive.js`. It writes no HUD, panel or stylesheet of its
  own. If it needs a control the shell lacks, it adds a hook to the shell, behind a flag, with a
  test on the shell's fixture course.
- **Header.** Logo (links to the hub), course code and title, mode controls. The track row lists the
  track's courses. No Export or Import buttons; backup lives on the hub.
- **Units across the top, labs as tabs.** Units follow the OCW program's order (D23) and list their
  labs. Unbuilt labs are listed as `coming`. Exam dates and practice-exam shape are added course by
  course when its syllabus is available (D27).
- **Three ways in, all linked.**
  - **Explore**: the labs.
  - **Practice**: the problem bank, review, practice exams.
  - **Notes**: the rewritten notes, beside the lab each section describes.
  A notes section opens its lab; a lab links to its notes section; a problem links to its section
  and opens its lab at the problem's setup.
- **Routes.** `#/<course>/<unit>/<lab>`, with `?p=<problem>&s=<step>` for a problem and `?n=<section>`
  for notes. Every screen is a link.
- **Colour means one quantity.** E yellow, B teal, current gold, force pink, velocity white,
  positive charge red, negative blue (physics). Population and H₀ blue (statistics). In panels,
  yellow is the one primary button, blue means selected, green and red appear only when grading.
  A new course keeps these meanings and adds its own in its `CONVENTIONS.md`.
- **Phone first.** 380 px portrait is the design width. Nothing scrolls sideways. Inputs are at
  least 16 px. Panels never cover the diagram.

## 3. Notes

- One file per unit, in the OCW program's order, structured as the exemplar: `header.top`
  (eyebrow, h1, lede, legend, toc), `div.part`, `section.topic` numbered s1, s2, …, boxes `ex`
  (worked example), `why` (derivation), `fix` (correction), `key` (key idea) and `out` (what the
  model leaves out). The last section is the formula sheet.
- Sections are grouped into parts (`div.part`) with a legend, as in every PHY 2049 notes file (D32).
- Boxes go where the content needs them. A section may have three `fix` boxes or none. One `why`, one
  `key` and one `out` in every section, whatever its content, is a recipe, not a standard (D32).
- Math is `\( \)` and `\[ \]`, typeset by KaTeX. `$` is never a delimiter in a notes file.
- Derive each result. Never list a formula without where it comes from.
- Worked examples: at least six per unit, each recomputed, each with a **Show this in the lab** setup
  where a lab can show it. notes-check runs every setup against the real lab within 2%.
- `box fix` for the mistakes students make and for errors in sources (published errata, classic
  misreadings). Every `fix` names something a student would get wrong.
- **What the model leaves out**, as a `box out`, at the end of every section that uses an
  idealisation (D30).
- **Another view**: each unit links its matching OCW lecture or notes (section 7).
- Voice: PHY 2049's rules. Short declarative sentences, about 15 words. No em dashes. No filler.
  Say a thing once. No word count (D16): a unit is long enough when every topic is derived and
  every example worked.

## 4. Labs

- A lab exists to correct an intuition. Write the intuition first ("Shows that …"). If moving a
  slider teaches nothing, it is not a lab.
- Every number on screen is computed, then checked by a second method (closed form against
  numerical integration, joints against sections, analytic against finite differences). The check
  runs in the course's tests.
- Two to four predict-first prompts, each with an outcome the lab computes and labs-check verifies.
- 2–3 scenarios with real numbers, sliders for the inputs, a readout, and an explainer.
- At least one **application lab** per unit: a real everyday or industrial device the unit's
  equations fully explain, with realistic numbers from a cited source (PHY 2049's MRI, motor and
  power line are the models; D25). Its explainer ends with **What the course model leaves out.**
  (D30).
- Every problem with a physical setup opens its lab at that setup, with numbers hidden until solved.
- Readable at 380×820 and 1280×800, axis labels in the right units, nothing covered by panels.
  Look at the screenshots yourself.

## 5. Problems

- **Variety from structure.** A template varies at least one of: the configuration or function
  family, which quantity is unknown, or the representation (graph, table, formula, words). Number
  ranges alone do not count.
- **Designed numbers.** Choose the answer first and back-solve the givens, so answers and steps are
  sensible numbers a student can check by estimate. No `x → 46`.
- **Mix per unit:** at least 25% conceptual (choice, true/false or ordering, each wrong option with
  its own `why`); symbolic answers where the natural answer is an expression; numeric problems at
  levels 1, 2 and 3. Level 3 matches the OCW counterpart's problem sets.
- **Wrong-answer feedback:** every choice option has a `why`; every numeric template has at least two
  `traps`, each the value a named mistake produces.
- **Hints:** two or three, staged. The first points at the principle, the last at the step. Never
  the answer.
- **Worked cases:** at least one per template that reproduces a printed answer, cited (section 7).
- **Second opinion:** every numeric answer is also computed by a second method (the lab, a
  numerical integral, a simulation).
- **Principle tags** are optional (D16). A course that supplies them gets the principle step.

## 6. The practice loop

Built once in `packages/shells/practice` (Phase R, R1). A course turns each feature on by supplying
its data: principle tags, `fading: true`, interleaving, `sectionForProblem`, `labDrawer: true`, the
symbol palette, `choiceNotes: true` for per-option `why`. A course turns on everything its data
supports. AGENTS.md lists the flags.

## 7. Sources

In this order of authority (D23): the OCW program, then the textbook, then the UNF syllabus.

- **MIT OpenCourseWare is the program** (D15, D23). Each course's spine names its OCW counterpart.
  - **Units and order.** The counterpart's calendar sets the units and their order. Where OCW runs
    two UNF courses as one, Flux does too: Calculus I and II are one module following 18.01SC
    (D28). PHY 2049 keeps its instructor's order and links 8.02 as Another view (D28).
  - **When the scope differs** (an OCW course that assumes more, goes further, or covers a topic in a
    few lectures), the spine maps each unit to the OCW lectures that cover it, from more than one
    OCW course if needed. OCW sets the order where it has one; the textbook orders the rest (D29).
  - **Coverage.** A unit covers what the counterpart's matching lectures cover. Where the
    counterpart goes past the UNF course (transistors in 6.002, say), the spine says what is left
    out.
  - **Difficulty.** Level-3 problems are as hard as the counterpart's problem sets.
  - **Printed answers.** Worked cases come from OCW problem sets and exams with posted solutions,
    or from an open textbook's examples. The template reproduces the printed answer by our own
    computation, and the case cites it: course number, term, problem set or exam, problem. Where
    our answer differs from the printed one, the case says why (as PHY 2049's `ERRATA.md` does).
  - **Another view.** Notes link the matching OCW lecture or notes.
  - **Nothing is copied.** OCW material is CC BY-NC-SA 4.0. Flux writes its own statements, text
    and figures. Problem numbers and answers are cited facts; statements are rewritten. Figures
    and anything OCW marks as outside its licence are never used. MIT's name appears only in
    citations, never as endorsement.
- **Textbooks** come second. They fill in what OCW does not cover and are cited by section through
  one map, `src/data/textbook.js`. Open texts are preferred (D7, D13, D14, D21). Copyrighted texts
  are cited, never copied, and their example numbers are never used (D9).
- **UNF syllabi and course packs** come third, when available: exam dates, exam style, and any topic
  UNF covers that OCW does not. Nothing from them ships unless the instructor agrees in writing and
  `PROVENANCE.md` records it.
- **Property data and constants** are computed from published standards (IF97, NASA polynomials) or
  stated in the problem, never copied from a textbook table.

## 8. The scorecard (the floor)

`npm run scorecard` prints every course against these thresholds. CI fails for any course marked
`standard: true` that falls short. `--units` prints each unit; `--md` prints a table for a PR.

| Check | Threshold |
|---|---|
| Notes examples with a lab setup, per unit | ≥ 6 |
| Predict-first prompts per lab | ≥ 2 |
| Application labs per unit | ≥ 1 |
| Conceptual share of problems per unit | ≥ 25% |
| `why` on every choice option | 100% |
| Numeric templates with ≥ 2 traps | 100% |
| Templates with ≥ 2 hints | 100% |
| Templates whose variety comes from structure | ≥ 60% |
| Worked cases citing a source | ≥ 1 per template |
| Smoke at 380 and 1280, overflow, layout | pass |

Meeting a threshold by padding (a prediction nobody would get wrong, a trap no student makes, an
"application" that is a relabelled textbook figure) fails the owner's review.

## 9. Owner review

Before a course's manifest says `standard: true`, the owner works one unit start to finish as a
student: notes, labs, a mixed set and a practice exam. What felt thin, wrong or confusing becomes an
issue. The course is marked when those are closed. Agents never set `standard: true`.

## 10. Why the other courses felt half-built (17 Oct 2026)

The review that started Phase R found four causes, in order of weight:

1. **The practice loop was missing** from the shells, so no course on them could have it. Fixed in
   Phase R, R1.
2. **Problems varied the numbers, not the mathematics.** The Calc banks reached 50+ versions by
   widening ranges: `f(x)=x^2` in four templates, `lim x→46 (x²−2116)/(x−46)`, "add the first 82
   terms".
3. **Wrong answers got "Not yet, try again."** Outside PHY 2049 and STA 3032 no problem named a
   misconception.
4. **Labs explained but did not connect.** No application labs, few predictions, and Calc III,
   Statics and PHY 2048 had no notes.

A fifth cause showed up later: **plans drifted from code.** EML 3100 was built in Yan's chapter order
while its plan used the course pack's. That is why a course now has a spine the owner confirms
before code (D18), and why the spine, not memory, is what an agent builds from.

The full measured table is in this file's first version (commit `ba853cb`).
Dynamics (EGN 3321) passed the scorecard first, on 18 Oct 2026.
