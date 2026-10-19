# Flux: rules for agents

Flux is one study platform for the owner's mechanical-engineering degree at UNF. Each course is a
module in this repo; the hub at https://flux-study.pages.dev links them. PHY 2049 is the benchmark
(D32): every other course must look, work and teach like it.

## Read before you work

1. **This file.** The rules. They bind every change.
2. **`ROADMAP.md`.** What to build next. Take the first unchecked item in its build list.
3. **`docs/COURSE-STANDARD.md`.** Before any course work: what a course is, the exemplar files to
   copy the shape of, and the bar.
4. **`docs/courses/<id>.md`.** The course's spine: its units, sources, OCW counterpart and labs.
   Build from the spine. If the spine and the code disagree, stop and say so.
5. **The skill for the job** in `.claude/skills/`: `flux-new-course`, `flux-build-unit`,
   `flux-review-unit`, `flux-content-drop`. Cursor: open the skill's `SKILL.md` and follow it.

`DECISIONS.md` records what is settled. Do not reopen a decision. Do not act on an open one without
saying so in the PR. `docs/history/` is the archive; nothing there is an instruction.

## Rules

1. **Never break a course a student is using.** Every PR keeps every course working and its checks
   green. If your task names a freeze (an exam week, say), honour it.
2. **Raw course files never ship.** PDFs, slides, Word files and Canvas exports may sit only in
   `courses/<id>/incoming/`, and only when that course's `PROVENANCE.md` records the instructor's
   permission. `packages/checks/raw.mjs` fails on a raw file anywhere else, and `raw.mjs --dist`
   fails the build if one reaches `site/dist`. Leave `incoming/` and `.canvas-state.json` alone.
3. **No student data.** Names, grades and submissions never enter the repo.
4. **The OCW program first, then the textbook** (D23). A course's MIT OpenCourseWare counterpart sets
   its units, their order, its coverage, its level-3 difficulty and its printed answers (D15). When
   scopes differ, the spine maps units to OCW lectures and the textbook orders the rest (D29).
   Calculus I and II are one module; PHY 2049 keeps its instructor's order (D28). The
   textbook fills in and is cited by section through `src/data/textbook.js`. A UNF syllabus adds
   exam dates, exam style and any topic OCW lacks. **Copy nothing** from any of them: write fresh
   and cite. MIT's name appears only in citations. STA 3032's instructor material stays out (D6).
5. **Every number on screen is computed, then checked a second way,** in the course's tests. A worked
   case reproduces a printed answer by our own computation.
6. **A course writes no UI of its own.** It uses a shell (`packages/shells/math` or `engineering`)
   through two thin wrappers. A missing control becomes a shell hook behind a flag, with a test on
   the shell's fixture course. A course never imports another course.
7. **Spine before code** (D18). A new course starts with its spine confirmed by the owner. At most
   two courses have units in progress at once, besides Phase R rework.
8. **One unit per PR.** Every course's checks stay green on every PR. A failing check does not ship.
9. **Never set `standard: true`.** The owner does, after reviewing a unit as a student.
10. **Phone first.** 380 px portrait is the design width. No sideways scroll. Inputs at least 16 px.
    Look at the screenshots at 380×820 and 1280×800 yourself.
11. **Application labs use everyday and industrial devices** with real, cited numbers (D25).
12. **Storage keys** are `flux.<course>.<key>.v<n>`. `packages/checks/storage.mjs` fails on a clash.

## Layout and dependencies

```
packages/core       engine contracts: defineCourse, defineLab, problem, router, storage, tex, plot2d, scene3d
packages/subjects   shared domain math (math, mechanics, em, stats, thermo, convert.js), pure, each with a selftest
packages/shells     course-family UI: math, engineering, practice (the loop), notes.js. No course, no chapter.
packages/tracks     the hub's track list. Imports nothing.
packages/checks     deps, raw, storage, prereqs, scorecard
courses/<id>        one folder per course
site                the Vite hub
```

Imports run one way: `courses → shells → subjects → core`. Courses and the site may import
`@flux/tracks`. Core names no course, chapter, constant or textbook; a hook core needs goes on
`defineCourse`, `defineLab` or `problem`. `packages/checks/deps.mjs` fails `npm test` on an import
the wrong way, on a course name in core or a shell, and on a chapter literal in a shell. Anything a
second course could use goes into `subjects`, with a selftest, not into the course.

Libraries worth knowing before you write your own:

- `subjects/src/convert.js`: exact foot, pound-mass, pound-force, Btu, rankine, and derived psi, slug,
  ft·lbf, hp. Every unit conversion goes through it.
- `@flux/subjects/thermo`: IAPWS-IF97 regions 1, 2, 4; NASA-7 and NASA Glenn ideal gases (air from
  200 K); isentropic flow; generated property tables. Pure, SI, no DOM. A state
  outside its fits throws `ThermoRangeError`; generators keep to `covered(T, p)`. A table-read answer
  passes `tableInterp(...)` as `alt` with an explicit `tol`. Sources: `src/thermo/PROVENANCE.md`.
- `subjects/em`: circuits by modified nodal analysis, fields, optics (from PHY 2049).
- `subjects/mechanics`: vectors, units, friction, sections, truss, frames, path, rigid2d, inertia,
  materials. FBDs are drawn by `shells/engineering/fbd.js`.
- `packages/shells/practice`: PHY 2049's practice loop. A course turns features on by supplying data:
  `PRINCIPLES` and templates' `principles` (`askPrinciple: false` keeps tags without the question),
  `fading: true`, `pickInterleave`, `sectionForProblem` with `api.openNotes`, `labDrawer: true`,
  `GLYPH` and `exprToTex`, and `choiceNotes: true` so a wrong option's `why` reaches the student.
  Numeric `traps` always do.
- In the engineering shell, a lab of `kind: 'plot2d'` gets a canvas stage (`stage.js`; import
  `styles/stage.css`). A course with notes passes `notes` and imports `@flux/shells/styles/notes.css`.

## Contracts

- A manifest (`src/manifest.js`): `id`, `code`, `title`, `subject`, `track`, `order`, `term`,
  `standard`, units, chapters, and lazy `labs`, `problems`, `notes`, `sets`, `formulas`, `ingest`. The
  id is lowercase letters and digits; it is the route segment and the storage namespace.
- `defineLab`: scene3d (`init`, `enter`, `recompute`, `syncViews`, scenarios, controls) or plot2d
  (`compute(state, rng)` pure and seeded, `draw`, `predictions`).
- `problem({ id, exam, ch, lab, src, vars, derive, text, parts, hints, steps, sim })` with `range`,
  `choice`, `num`, `mc`, `tf`, `sym`, `self`, `kase`, `alt`, `traps`, `why`.
- Routes: `#/<course>/<unit>/<lab>`, `?p=<problem>&s=<step>`, `?n=<notes section>`.
- TeX inside a JS string is a `String.raw` template; tex-check fails when a backslash is eaten.
- Legacy storage keys kept for imported courses: PHY `flux.problems.v1`, `flux.exam.v1`; Statics
  `flux-statics.*.v1`; MAC 2313 `flux-mac2313.*.v1`; STA 3032 `fluxstats.*.v1`. New courses use only
  `flux.<id>.*`.

## Stack, ports, deploy

Vite 6 (`base: './'`), vanilla JS modules, KaTeX 0.16, three.js 0.172, Node's built-in test runner.
No framework, no TypeScript build; contracts carry JSDoc. Node 22.

Dev ports: hub 5173, PHY 2049 5174, MAC 2313 5175, Statics 5176, STA 3032 5177, MAC 2311 5178,
MAC 2312 5179, PHY 2048 5180, EGN 3321 5181, EGN 3331 5182, EML 3100 5183. Reserved for the courses
ahead (spines): MAP 2302 5184, EEL 3111 5185, EML 3015 5186, EML 3101 5187, EGN 3203 5188, EML 4140
5189, EML 4312 5190, EML 4301C 5191, EML 4501 5192, EML 4507C 5193, EML 4320C 5194, EMA 3010 5195.

Deploy: `.github/workflows/deploy.yml` publishes `main` to Cloudflare Pages project `flux-study`
when the Cloudflare secrets are set; `npm run deploy` does the same by hand. `npm run live` says which
commit is live. See `DEPLOY.md`.

## Checks

- `npm test`: every workspace's tests, the dependency, raw, storage and prereq checks, and the
  scorecard (fails only for a course marked `standard: true`). Must pass.
- `npm run build`: must succeed. It runs `raw.mjs` before and `raw.mjs --dist` after.
- `npm run scorecard` (`--units`, `--md`): the standard's floor, per course.
- Browser checks, each needing that course's dev server: the course's `layout` (EGN 3321, Statics),
  `smoke` (EML 3100, EGN 3331), `overflow` (STA 3032) or `verify` (MAC courses) script;
  `npm run smoke -w @flux/shells` for the practice loop; PHY 2049's `scripts/smoke.mjs` and
  `scripts/gallery.mjs` on 5174. A new course copies EGN 3321's `layout`. Playwright is not a
  dependency; scripts borrow a global install.

## Course conventions

Each course keeps its own in `courses/<id>/CONVENTIONS.md` (or `CLAUDE.md` for PHY 2049 and
STA 3032). Read it before editing that course. Examples: Hibbeler's three significant figures (four
when the leading digit is 1), Merino's notation in MAC 2313, the TI-84 rules in STA 3032, the sign
convention in EML 3100.

## Voice

Notes and course prose: short declarative sentences, about 15 words. No em dashes. No filler
("simply", "just", "actually"). Derive, don't list. Say a thing once. Recompute every number before
writing it down.
