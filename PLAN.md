# FLUX: one platform, many courses

Status: **Phase 0 done** (PR #1 merged 13 Oct 2026; hub live at https://flux-study.pages.dev). Next: Phase 1. Nothing in the four existing repos was changed.

Revised 13 Oct 2026: PHY 2049 is imported first, whole and unchanged, and the engine is carved out
of it. The other three courses port onto that engine afterward. This repo is public (D1).
Raw course files never enter it, including through git history: see Phase 1.
Written 13 Oct 2026 from the repos at these commits: flux-phy2049 `15f8687`, flux-mac2313 `bdeef1b`,
statics-sim `6ce522e`, stats `5ee9103`.

This document starts from the end state, then works backward to the order of work. Each phase ends
with a test you can run, so a Cursor session knows when it is done.

---

## 1. End state

### Purpose

FLUX is one study platform for an engineering degree. Each course is a module inside it. Every
module gives the same four things, in the same place, with the same controls:

1. **Explore**: interactive labs where moving a parameter corrects an intuition.
2. **Practice**: generated problems with worked steps, spaced review, and a "second opinion"
   (the matching lab computes the same answer by a different route and says whether they agree).
3. **Notes**: the course's notes, rewritten, linked both ways to labs and problems.
4. **Exam view**: units dated to the course's exams, opening on the next one coming up.

What makes it a platform rather than four apps:

- **One engine.** A fix to the problem generator, spaced review, KaTeX layout or mobile HUD reaches
  every course at once.
- **One address.** `flux.pages.dev` (or similar) with a course picker. Each course lives at
  `#/<course>/...`.
- **Shared subject libraries.** A vector, quadrature or unit helper written for Calc III is the same
  one Statics and Physics use. Later courses start with most of their math already written.
- **Adding a course is a module, not a fork.** A new course is a folder with a manifest, its labs,
  its problem bank and its notes. It writes no engine code.

### Shape of the repo

```
flux/                              one repo, npm workspaces
├── packages/
│   ├── core/                      the engine: no course knowledge
│   │   ├── shell/                 router, HUD, course picker, mode tabs, mobile layer, styles/tokens
│   │   ├── scene3d/               three.js stage: createScene, frame, viewport, pointer, views, manim palette, numberPlane, arrows
│   │   ├── plot2d/                canvas plotting (stats-style labs and the 2D plots in 3D labs)
│   │   ├── labs/                  defineLab contract (two kinds: scene3d, plot2d), lazy loader, predictions
│   │   ├── problems/              kit (range, choice, num, mc, tf, sym, self, problem, kase), engine, progress, spaced review, fading, sets
│   │   ├── notes/                 notes panel, section registry format, notes-check
│   │   ├── tex/                   KaTeX wrappers, fitMath, texNum/qty/unitTex, tex-check
│   │   └── storage/               namespaced localStorage, export/import of progress
│   ├── subjects/                  shared domain math, pure functions + selftests
│   │   ├── math/                  vec, r3, ndiff, quadrature, curves, surfaces, fields
│   │   ├── mechanics/             force vectors, equilibrium, truss, frames, friction, sections, units (SI/US)
│   │   ├── em/                    constants, potential, conductors, circuits (MNA), optics
│   │   └── stats/                 rng (seeded), dist, describe, infer, printed tables
│   └── checks/                    shared check runners: problems-check, tex-check, labs-check, smoke, overflow
├── courses/
│   ├── sta3032/   mac2313/   statics/   phy2049/      one folder per course (section 4)
├── site/                          the Vite app: imports core + the course registry, lazy-loads each course
├── tools/ingest/                  Canvas ingest, parameterised per course (from flux-phy2049)
├── AGENTS.md  .cursor/rules/      conventions merged from the four CLAUDE.md / READMEs
└── PLAN.md                        this file
```

Dependency direction is one way only: `courses → subjects → core`. Core never imports a course or
a subject. A subject never imports a course. Checks enforce it (section 3, rule 6).

### Subjects and courses

Courses are grouped by subject, because the subject library is where reuse happens.

| Subject | Library | Courses now | Likely next |
|---|---|---|---|
| Math | `subjects/math` | MAC 2313 Calc III | Differential equations, linear algebra |
| Mechanics | `subjects/mechanics` | Statics | Dynamics, strength of materials, vibrations |
| Physics | `subjects/em` | PHY 2049 | (PHY 2048 if ever useful as review) |
| Statistics | `subjects/stats` | STA 3032 | |
| Thermal-fluids | `subjects/thermo` (new) | | Thermodynamics, fluid mechanics, heat transfer, compressible flow |

Thermal-fluids is the subject that also serves the methalox engine (nozzle flow, isentropic
relations, combustion thermo), so its library should be written to be callable from outside FLUX.

---

## 2. What exists today

Four apps, each forked from FLUX and grown separately. Same stack everywhere: Vite 6, vanilla JS
ES modules, KaTeX 0.16, three.js 0.172 (not stats), no framework, Node-script tests, Cloudflare
Pages deploys.

| Repo | Course | Visibility | Size (src lines) | Labs | Problem templates | Notes | Canvas ingest |
|---|---|---|---|---|---|---|---|
| flux-phy2049 | PHY 2049 | public | ~49k | ~30 | ~276 | yes, instructor-permitted | yes (weekly Action) |
| flux-mac2313 | MAC 2313 | public | ~19k | 17 | ~81 | no | no |
| statics-sim | Statics | public | ~12k | 8 | ~34 | no | no |
| stats | STA 3032 | public | ~16k | 10 | ~103 | yes | no |

What is already common:

- **Lab contract**: `defineLab({...})` with the same fields in phy/mac/statics (stats has a 2D
  variant with `compute(state, rng)` and predictions).
- **Problem spec**: `problem({ id, exam, ch, lab, src, vars, derive, text, parts, hints, steps, sim })`
  with `range/choice/num/mc/tf/sym/self/kase` from `kit.js`. Same in all four.
- **Catalog**: an `EXAMS`/`UNITS` list with labs per unit, plus `LAB_META`. Stats uses `UNITS` with
  real dates and `nextUnit()`; the others use `EXAMS`.
- **Routes**: hash routes, `#/<unit>/<mode>/<lab>`.

Where they have drifted (the reason to consolidate):

- Only `ui/shared.js` and `scene/createScene.js` are still identical across phy/mac/statics.
- `ui/problems.js` (the practice panel) is 1,866 / 1,316 / 1,180 lines in phy / mac / statics.
  `hud.js`, `plot.js`, `views.js`, `pointer.js` and the stylesheets have all diverged.
- PHY has features the others lack: coaching, fading, principles, principle-step, sequence, sheets,
  derivations, predictions, notes. Stats has features PHY lacks: seeded labs with checked
  predictions, `overflow` check, `alt` grading for table routes, named problem sets, 380px-first layout.
- **Storage keys collide**: statics-sim uses `flux.exam.v1` and `flux.problems.v1`, the same keys as
  PHY. Harmless today (different origins), a real bug the moment both live on one origin.

---

## 3. Rules for the whole project

1. **Never break a course in the middle of its semester.** Every existing site stays live and
   untouched until its module in the platform has passed parity (section 5). Cutover for an
   in-semester course waits until after its final, unless parity is proven and you choose to switch.
2. **The old repos are read-only sources.** Copy from them; do not edit them as part of this work.
   flux-phy2049 stays the live PHY site and keeps getting its weekly content drops until cutover;
   the platform pulls those drops in (Phase 1).
3. **Core knows nothing about any course.** No chapter numbers, constants or course names in
   `packages/core`. If core needs a hook, add it to a contract.
4. **Every number shown is computed and checked.** Each subject library has a selftest; each
   course's problems, labs and notes pass the shared checks. A module with failing checks does not ship.
5. **Mobile first.** 380px portrait is the design width; no horizontal scroll. The smoke and
   overflow checks run on every course.
6. **One-way dependencies.** `courses → subjects → core`. A check script fails the build on an
   import that points the wrong way.
7. **Storage is namespaced**: `flux.<course>.<key>.v<n>`. Progress can be exported and imported as
   JSON, so moving from an old domain to the platform loses nothing.
8. **Provenance per course.** Each course folder has its own PROVENANCE.md saying what course
   material it contains and on whose permission. Course material without permission stays out.
9. **No raw course files, in the tree or in history.** PDFs, slides, docx, Canvas page exports,
   solutions and answer keys stay in a private place (a private repo, or the course repo kept
   private). This repo is public, and a file deleted later is still in its history.

---

## 4. The course module contract

A course is a folder that exports a manifest. The site's registry lists the manifests and
lazy-loads each course's code the first time it is opened.

```js
// courses/statics/index.js
import { defineCourse } from '@flux/core';

export default defineCourse({
  id: 'statics',                       // route segment and storage namespace
  code: 'EGN ????',                    // confirm (D5)
  title: 'Statics',
  subject: 'mechanics',
  term: 'Fall 2026',
  text: 'Hibbeler, Engineering Mechanics: Statics',   // optional
  units: [                             // replaces EXAMS / UNITS
    { id: 'u1', title: 'Force vectors', chapters: ['2'], date: null, labs: ['vectors'] },
    // ...
  ],
  chapters: { 2: 'Force vectors', 3: 'Particle equilibrium' /* ... */ },
  labs: () => import('./labs/index.js'),         // { [labId]: defineLab(...) }
  problems: () => import('./problems/index.js'), // array of problem(...) specs
  sets: () => import('./problems/sets.js'),      // optional named sets (review sheets)
  notes: () => import('./notes/index.js'),       // optional
  formulas: () => import('./formulas.js'),       // optional formula palette
  ingest: { canvasCourseId: null },              // optional; tools/ingest reads it
});
```

Course folder:

```
courses/<id>/
├── index.js          the manifest above
├── labs/             defineLab objects + this course's scenarios
├── problems/         bank/*.js, sets.js, any course-only kit helpers
├── notes/            optional
├── PROVENANCE.md
└── CONVENTIONS.md    course-specific rules (e.g. stats: TI-84 quartiles, ŷ = a + bx)
```

Anything a second course could use goes down into `subjects/`, not into the course.

---

## 5. Parity: when a ported course counts as done

A course is ported when all of these pass on the platform build:

- Every route the old app served resolves (`#/<unit>/<mode>/<lab>` maps to `#/<course>/<unit>/<mode>/<lab>`).
- Every lab opens with no page error; every scenario applies.
- Every problem template passes problems-check (same count as the old repo, or a written reason for
  each one dropped).
- Subject selftests pass for every function the course uses.
- notes-check passes (if the course has notes).
- Smoke at 380px and 1280px, and overflow at 380px, pass for every screen.
- Progress exported from the old site imports and shows the same review queue.
- The old site gets a banner pointing to the new address (in the old repo, at cutover only).

---

## 6. Phases

Each phase is one branch and one Cursor session (or a few). Do not start a phase until the one
before has met its exit test.

The approach: bring PHY 2049 over whole, get it running unchanged on the platform, then carve the
engine out of it **while PHY's own checks stay green**. PHY is the safety net for every refactor.
The other courses then port onto an engine that already works, adding what they need as they come.

### Phase 0: repo and hub (small)

- Create the public `flux` repo, npm workspaces, Vite site, Cloudflare Pages project.
- Site shows a course picker. PHY will be the first entry; the other three **link out** to their
  live apps until they are ported.
- AGENTS.md and `.cursor/rules/` written from the four CLAUDE.md / README files, plus section 3 above.
- CI runs `npm test` across workspaces and the dependency-direction check.

**Exit:** the hub is live and links to all four apps.

The Pages project is `flux-study` (https://flux-study.pages.dev). `flux.pages.dev` is an unrelated site, checked 13 Oct 2026, so this repo does not use that hostname. Statics' live app is https://dgadapee00.github.io/statics-sim/. Its official course code, and MAC 2313's term, are still unconfirmed (D5).

### Phase 1: import PHY 2049 as it is

- **Import a snapshot, not the history.** flux-phy2049's history contains `incoming/` (168 raw
  Canvas files, about 33 MB: lecture-note PDFs, solution sheets, worksheet keys). A `git subtree add`
  would publish all of it in this repo's history. Instead, copy the tree at a pinned commit with
  `incoming/` excluded:
  `git -C <phy> archive <commit> -- . ':(exclude)incoming' | tar -x -C courses/phy2049`.
  Record the source commit in `courses/phy2049/SOURCE` and in the commit message. PHY's history
  stays in flux-phy2049.
- Add a check that fails the build if any file under `courses/` is a PDF, pptx, docx or doc, or sits
  under a path named `incoming`. PHY's own `lessons/*.docx` are generated from `lessons/src/`, so
  leave the .docx out of the import (they rebuild) rather than allowlisting them.
- Change only what is needed to run inside the monorepo: package name, workspace wiring, dev port,
  deploy target, and the route prefix `#/phy2049/...` (old hash routes redirect).
- No refactoring yet. Every file under `src/` stays as it was.
- Weekly content: while flux-phy2049 is still the live PHY site, sync each week with a script,
  `scripts/sync-phy.mjs <to-commit>`, that reads the commit in `SOURCE`, applies
  `git diff SOURCE..<to-commit> -- . ':(exclude)incoming'` under `courses/phy2049`, and updates
  `SOURCE`. Before Phase 2 this applies cleanly. After Phase 2 moves files, drops are mostly new
  notes HTML and bank files; the script reports anything it cannot place.

**Exit:** PHY's full `npm test`, smoke and gallery pass from the platform build, and the PHY entry
on the hub opens the platform copy.

### Phase 2: carve core and `subjects/em` out of PHY

Move code out of `courses/phy2049` into packages, one area at a time, running PHY's checks after
each move. Order, lowest risk first:

1. `tex/`, `storage/` (namespaced keys + progress export/import), `subjects/em` (`physics/*` + selftest).
2. `scene3d/` (createScene, frame, viewport, pointer, views, manim, numberPlane, arrows) and `plot2d/`.
3. `problems/` engine: kit (generic parts only; constants, `charge()`, `layout()` stay with PHY or
   go to `subjects/em`), engine, progress, fading, sequence, principles, sheets.
4. `notes/`, `labs/` contract and loader, then `shell/` (router, HUD, practice panel, styles).
5. `defineCourse` and the course registry; PHY gets its manifest.

Rule for this phase: a move that turns a check red is reverted, not patched forward.

**Exit:** `courses/phy2049` holds only course content (labs, bank, notes, scenarios, manifest), PHY
still passes every check, and a throwaway demo course (one lab, three problems) runs on the engine
without importing anything from PHY.

### Phase 3: Statics (first course onto the engine)

Smallest 3D app and a closed course. Move `physics/statics, truss, frames, friction, sections,
vectors, units` into `subjects/mechanics`. Anything Statics needs that the engine lacks (its US unit
system) goes into core or the subject library, not the course.

**Exit:** parity (section 5).

### Phase 4: MAC 2313 (proves subject reuse)

Move `math/*` into `subjects/math`. Vector code shared with Statics and PHY becomes one module; if
copies disagree, the selftests decide. Bring mac's `domain()` and term-by-term integral display in.

**Exit:** parity, and `subjects/math` is imported by at least two courses.

### Phase 5: STA 3032 (adds the 2D lab kind)

Add `kind: 'plot2d'` to the lab contract, plus stats' seeded labs, checked predictions, `alt`
grading, named sets and overflow check, so every course gets them. Move `stats/*` into
`subjects/stats`. The final is 7 Dec 2026: prove parity and switch early, or cut over after it.

**Exit:** parity. Cutover per rule 1.

### Phase 6: PHY cutover

After the fall final (or earlier if you choose): move the Canvas ingest into `tools/ingest`,
reading the course id from each manifest, so any course can have weekly drops. The ingest writes
raw files to a **private** repo (for example `flux-incoming`), never to this one (rule 9). The
processing run reads them there and commits only rewritten notes and problems here. Old PHY site gets a
banner pointing to the platform.

**Exit:** ingest runs from the platform repo; flux-phy2049 is no longer edited.

### Phase 7 and on: new courses, by subject

Each new course is built directly as a module. Order by what is coming in the degree and by
propulsion relevance: thermal-fluids courses get the new `subjects/thermo` library, written to be
reusable by the methalox engine's analysis code.

Optional: the Engineering-Material cheat sheet becomes a "Reference" module (notes only, no labs),
cross-linked from the courses whose formulas it covers.

---

## 7. Decisions to make before Phase 0

| # | Decision | Options | Leaning |
|---|---|---|---|
| D1 | Repo visibility | **Decided: public.** Rewritten notes may ship under the PHY instructor's permission; raw course files never do (rule 9). | |
| D2 | Address | one domain for everything vs. one subdomain per course on the same build | one domain; per-course subdomains only if a course needs its own link to share with a class |
| D3 | Old domains | redirect at cutover vs. leave frozen | banner + link at cutover, leave them up through the term |
| D4 | TypeScript | stay vanilla JS vs. add types (or JSDoc + `checkJs`) for the contracts only | JSDoc types on `defineCourse`, `defineLab`, `problem`; no build change |
| D5 | Course codes and terms | confirm each course's official code and term for the manifests | |

---

## 8. Working this in Cursor

- Open the `flux` repo as the workspace and add the four old repos as read-only folders in the same
  workspace (or under `reference/`, git-ignored), so the agent can diff them directly.
- One phase per branch. Start each session by pointing it at this file and the phase number:
  "Do Phase 2 of PLAN.md. Rules in section 3 apply. Stop when the exit test passes and report what
  you dropped and why."
- Have it write MERGE-NOTES.md (Phase 2) and a short PORT-NOTES.md per course before it writes code.
  Review those; they are where a wrong merge shows up cheaply.
- `npm test` and the smoke/overflow checks are the definition of done. Do not accept "should work".
- Update the status line at the top of this file at the end of each phase.
