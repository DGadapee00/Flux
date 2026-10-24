# Physics shell (Phase 2b): design

Status: draft for the owner's review, 24 Oct 2026.
Sub-project 1 of 4 in the plan to relearn Physics 1 in Flux. The later three each get their own spec.

## Why

The owner wants to relearn Physics 1 (PHY 2048) in Flux. PHY 2048 has a mechanics library, a catalog
of eight units, five labs that are logic only, and 67 problem templates. It has no screens and no
notes. Its spine (`docs/course-plans/phy2048.md`) puts its UI on a `physics` shell that does not
exist yet. That shell is PHY 2049's UI moved into `packages/shells/physics/` (ROADMAP, Phase 2b).
Nothing in PHY 2048 can be seen or studied until it exists.

D32 also makes PHY 2049 the benchmark that every other shell converges on. Moving its UI into a
shell is the first step of that, so this work serves both goals.

## Goal

Move PHY 2049's reusable UI into `packages/shells/physics/`, one piece per PR, so that:

1. PHY 2049 looks and behaves exactly as it does today, on the same checks.
2. A second course can use the same UI by supplying data, with no UI code of its own (rule 6).
3. The shell names no course and no chapter, and passes `npm run deps`.

PHY 2049 is a course a student is using this term. Rule 1 binds every PR: the course stays working
and every check stays green.

## Non-goals

- Any PHY 2048 work. Its screens, notes, unit order and problems are sub-projects 2 to 4.
- Changing PHY 2049's content, labs, notes or problems.
- Bringing the math and engineering shells onto PHY 2049's layout. That is the next ROADMAP item
  (D32) and starts only after this one finishes.
- Moving PHY 2049's electromagnetic scene objects or its `main.js`.
- Setting `standard: true` on any course (rule 9).

## What exists today

Measured on `main` at `32eb1a6`.

| Area | Size | What it is |
|---|---|---|
| `courses/phy2049/src/ui/` | 9 files, 3,942 lines | HUD, practice panel, predict, units, notes, derive, plot, format, shared |
| `courses/phy2049/src/main.js` | 714 lines | The app loop, routing, wiring |
| `courses/phy2049/src/styles/` | `main.css` 2,175, `practice.css` 1,855, `mobile.css` 760 | All the styling |
| `courses/phy2049/src/scene/` | 18 files, 2,055 lines | three.js scene objects, mostly EM |
| `courses/phy2049/src/engine/` | 6 files, 310 lines | frame, router, views, pointer, predict, viewport |
| `packages/shells/practice/` | `loop.js` 473 lines and helpers | A copy of PHY 2049's practice loop, made for the math and engineering shells |

Three facts shape the design.

1. **The practice loop is already half extracted.** `practice/loop.js` was copied from
   `ui/problems.js` (1,866 lines) during R1. Its header says PHY 2049 keeps its own copy until
   Phase 2b moves it onto a shell. The last PR in this work closes that gap.
2. **A shell course is thin.** EGN 3321 on the engineering shell keeps its own `main.js` (505
   lines) and three or four wrappers of 10 to 50 lines each (`ui/hud.js` is 22 lines,
   `ui/problems.js` is 50). The physics shell follows that shape. `main.js` stays in the course.
3. **PHY 2048's labs already use the contract.** `courses/phy2048/src/labs/define.js` sets
   `kind: 'scene3d'` with empty `init` and `syncViews`, as PHY 2049's labs do. No contract change is
   needed for the later sub-projects.

## Constraints

- `packages/checks/deps.mjs` fails `npm test` on a shell that imports a course, names a course (it
  matches `phy2049`, `PHY 2049`, `Hibbeler` and others), or contains a chapter literal such as
  `'ch3'` in quotes, `Chapter 3` or `Ch 3`. Every hook below exists because of this.
- Imports run one way: `courses → shells → subjects → core`.
- A missing control becomes a shell hook behind a flag, with a test on the shell's fixture course
  (rule 6). The fixture course lives in `packages/shells/test/fixture/`.
- One piece per PR. Every course's checks stay green on every PR (rule 8).
- Storage keys do not change. PHY 2049 keeps `flux.problems.v1` and `flux.exam.v1`, so a student's
  progress survives every PR (rule 12 and the legacy-key note in `AGENTS.md`).
- Phone first. 380 px portrait is the design width, with no sideways scroll (rule 10).

## Design

### Package layout

```
packages/shells/physics/
  hud.js        the equation panel, lab controls, sliders with typed boxes, scenario picker
  problems.js   the practice panel, as a wrapper over practice/loop.js
  predict.js    the predict-then-run card
  units.js      the units reference
  derive.js     step-through derivations
  format.js     number and unit formatting
  plot.js       canvas plot helpers (generic ones only)
  shared.js     tex, prose, escape helpers
  chrome.js     renders the page chrome (see below)
  styles/       main.css, practice.css, mobile.css
```

`packages/shells/package.json` gains `"./physics/*": "./physics/*"` in `exports`, as the math and
engineering shells have.

### How a course supplies data

Each shell module takes what it needs as arguments, the way `engineering/hud.js` does. Nothing is
imported from a course. For PHY 2049 the hooks are:

| Shell needs | Course supplies | Today it imports |
|---|---|---|
| The unit list and each lab's metadata | `units`, `labMeta`, `unitLabel` | `data/catalog.js` |
| Quantities and symbols per lab | `quantitiesFor(labId)` | `data/quantities.js` |
| Predictions per lab | `predictionsFor(labId)` | `data/predictions.js` |
| The problem bank and its progress | the `bank` object that `practice/loop.js` already documents | `problems/*` |
| Notes and the notes link per lab | `notes` module, `sectionForLab` | `notes/index.js` |
| Derivations | `derivations` module | `derive/index.js` |
| Storage | `courseStore` | `storage.js` |
| Frame helpers (units, work plane) | passed in as functions | `engine/frame.js` |

Lab-specific plots (`drawVx`, `drawAC`, `drawVI`, `drawPaschen`, `drawRC`) are electromagnetic.
They stay in the course and are passed to the HUD as a `plots` map keyed by lab id. Only generic
canvas helpers move to the shell's `plot.js`. The charge list in `hud.js` (`resetChargeListSig`)
becomes a `labPanel` hook the course fills for the labs that need one.

### The page chrome

`index.html` holds about 80 lines of header, mode switch, panels and bottom sheet, with fixed ids.
The shell's `chrome.js` renders the same markup into `#app`, taking the code, title and unit label
from the course. The result must match today's DOM exactly, which the gate below tests. The
course's `index.html` shrinks to a mount point. `main.js` stays in the course.

### Styles

The three stylesheets move wholesale first, with no edits, so there is no visual change. In the
last PR, rules that only the electromagnetic labs use are split into a small course stylesheet.
`practice.css` and `shells/styles/practice-loop.css` overlap. That overlap is settled in the
practice PR, where the two panels become one.

### The practice panel

`ui/problems.js` has 185 lines that mention an exam, a lab or an electromagnetic term (a keyword
grep, so an upper bound on the coupling). Two things happen to it:

1. Behaviour that `practice/loop.js` already has is deleted from the PHY 2049 copy.
2. Behaviour that only the PHY 2049 copy has moves into the loop behind a flag, with a test on the
   fixture course.

This is the riskiest PR. It is split in two if the diff passes about 1,500 lines changed.

## PR sequence

Each PR moves one piece, then runs the gate. Order is chosen so the lowest-risk, most reused code
moves first.

| PR | Piece | Notes |
|---|---|---|
| 2b-0 | **The gate** | Builds the comparison tool. Moves no code. |
| 2b-1 | Shell skeleton, `shared`, `format`, `plot` (generic part), styles wholesale | Adds the `physics` fixture and the exports. Mechanical. |
| 2b-2 | `chrome`, header, unit picker, mode switch, `units` | The wordmark comes from the shared `header.js`. The track bar stays core's `mountTrackBar`. |
| 2b-3 | `hud` | Plots map and `labPanel` hooks. |
| 2b-4 | `predict`, `derive`, notes wiring | `derive.js` pulls in scene helpers from `scene/manim.js`. Those that name no EM concept move to `@flux/core/scene3d`, which already hosts `manim.js` for the engineering shell. |
| 2b-5 | `problems` onto `practice/loop.js` | May split into 5a and 5b. |
| 2b-6 | Split EM-only CSS into a course stylesheet. Fixture tests for every flag. Docs. | Ticks Phase 2b in ROADMAP and updates `docs/COURSE-STANDARD.md`. |

### The gate (PR 2b-0)

The ROADMAP asks for PHY's tests and gallery to be "identical before and after". Today
`scripts/gallery.mjs` writes screenshots but compares nothing, and `smoke.mjs` compares only
numbers against `scripts/baseline/values.json`. So PR 2b-0 adds `scripts/compare.mjs`, with two
modes:

- `--save <dir>` captures, from the checked-out commit: every lab and scenario at 1440×900 and at
  380×820, plus a snapshot of the chrome's DOM (tag, id, class and attribute structure, with text
  content) for Practice, Notes and Explore modes.
- `--against <dir>` captures again and fails on any DOM difference, or on a screenshot difference
  above a small pixel tolerance. WebGL anti-aliasing is not bit-stable, so the tolerance is set in
  2b-0 by running the tool twice on the same commit and measuring the noise.

Every PR from 2b-1 on runs: `npm test`, `npm run build`, PHY 2049's `smoke` and `gallery`, and
`compare.mjs --against` a capture saved from the PR's base commit. The PR description pastes the
results.

The tool is borrowed-Playwright like the existing scripts (Playwright is not a dependency). Captures
stay in the git-ignored `scripts/output/`. They are never committed.

## Testing

- **Fixture course.** `packages/shells/test/fixture/` gains a `physics` wiring. Each hook has a test
  that turns it on and off, as `flags.test.js` does for the other shells.
- **No new numbers.** This work moves UI. No physics is computed or changed, so rule 5 needs no new
  worked cases. The existing selftests and `problems-check` run unchanged.
- **Deps and storage checks.** `npm test` runs `deps.mjs` and `storage.mjs` on every PR. A leaked
  course name or a changed key fails it.
- **Looks.** For each PR the author views the 380×820 and 1280×800 screenshots personally (rule 10).

## Risks

| Risk | Mitigation |
|---|---|
| A moved piece changes PHY 2049 subtly. | The gate compares DOM exactly and pixels within a measured tolerance, on every PR. |
| The practice panel move loses PHY-only behaviour. | The copies are diffed first. Each difference is either deleted with a reason or moved behind a flag with a test. |
| Hook surfaces grow large and ugly. | Pass objects, not dozens of arguments. The engineering shell's wrappers are the size target. |
| The owner is studying from PHY 2049 mid-term. | Rule 1. No PR merges with a red check. The owner may name a freeze, which is honoured. |
| Students' saved progress is lost. | Storage keys are untouched. The compare tool runs after seeding progress in `localStorage`. |

## Done when

- `packages/shells/physics/` holds the pieces in the sequence above.
- PHY 2049 imports them through thin wrappers, and its `ui/` folder holds only wrappers and the
  electromagnetic-specific code.
- `npm test` and `npm run build` pass. PHY 2049's smoke, gallery and compare pass.
- The fixture course tests every hook.
- ROADMAP ticks Phase 2b. `docs/COURSE-STANDARD.md` and the PHY 2048 spine point at the finished
  shell.

## What comes next (not part of this spec)

2. **PHY 2048 on the shell.** Wire the course, put units in 8.01SC's order (momentum before energy,
   D29), draw its five labs. Gets its own spec.
3. **PHY 2048 units, one per PR.** Notes with OpenStax citations by section, problems raised to
   levels 1 to 3 with hints, traps, `why` and conceptual items, application labs on everyday
   devices (D25), and the drag and variable-mass problems 8.01SC adds.
4. **OpenStax coverage gaps.** The catalog skips Volume 1 Ch 1 (units and measurement), Ch 14
   (fluids), Ch 16 (waves) and Ch 17 (sound). The owner has said to add Ch 14, 16 and 17 (24 Oct
   2026). They join PHY 2048 as units after oscillations, because 8.01SC does not cover them and
   OpenStax fills in (D23). Ch 1 folds into Unit 1's notes as a units and measurement section. The
   spine and `catalog.js` change in sub-project 2, not here. Owner confirmation of the new spine is
   still required (rule 7).

## Decided by the owner (24 Oct 2026)

1. **Freeze.** No PHY 2049 week is frozen. Rule 1 still applies to every PR.
2. **Ch 14, 16, 17.** Add them, as described under sub-project 4.
3. **Spec.** Approved. Next step is the implementation plan.
