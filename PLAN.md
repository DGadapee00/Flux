# FLUX: one platform, many courses

Status: **Phase 1b done** (13 Oct 2026). All four courses build from this repo and are live: https://flux-study.pages.dev/ with /phy2049/, /statics/, /mac2313/, /sta3032/. Ports: hub 5173, PHY 5174, MAC 5175, Statics 5176, STA 3032 5177. PHY's weekly drops land here. **Next: Phase 2.** flux-phy2049, statics-sim, flux-mac2313 and stats are frozen; their sites stay up.

Revised 13 Oct 2026: PHY 2049 is imported first, whole and unchanged, and the engine is carved out
of it. The other three courses port onto that engine afterward. This repo is public (D1).
Raw course files live only in a course's `incoming/` folder, with the instructor's permission, and never ship (rule 9).
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

### Tracks: what the hub shows

The hub shows **tracks**, not courses. A track is one subject followed through the degree, with its
courses in order inside it. Earlier courses fold into the later ones, so Physics I material sits
next to Physics II, and a Calc III topic can point back to where Calc I taught the idea it builds on.

| Track | Courses, in order | Subject library | Built today |
|---|---|---|---|
| Physics | PHY 2048 Physics I → PHY 2049 Physics II | `mechanics` + `em` | PHY 2049 |
| Math | MAC 2311 Calc I → MAC 2312 Calc II → MAC 2313 Calc III → MAP 2302 Differential equations | `math` | MAC 2313 |
| Mechanics | EGN 3311 Statics → Dynamics | `mechanics` | Statics |
| Statistics | STA 3032 | `stats` | STA 3032 |
| Thermal-fluids (later) | Thermodynamics → fluid mechanics → heat transfer | `thermo` (new) | |

Codes other than PHY 2049, MAC 2313, EGN 3311 and STA 3032 are the Florida common course numbers
and still need confirming against UNF's catalog before they go in a manifest.

How a track works:

- **Each course stays a module** with its own manifest, route segment (`#/<course>/...`) and storage
  namespace. A track is a grouping, not a merged course: the manifest gains `track` and `order`.
- **Inside the app, a track bar** lists the track's courses in order. Switching course keeps you in
  the same mode (Practice, Notes, Explore).
- **Prerequisite links cross courses.** A lab, notes section or problem can name `prereqs`, ids of
  sections or labs in an earlier course of the same track (Calc III gradient → Calc I derivative;
  PHY 2049 Gauss's law → MAC 2313 flux integrals is cross-track and allowed too). Unbuilt targets
  are fine; they render as "not built yet" and the check lists them.
- **Shared libraries do the folding.** PHY 2048 and Statics both use `subjects/mechanics`; Calc I
  to differential equations all use `subjects/math`. Building an earlier course is mostly new labs
  and problems on code that already exists.
- **Past courses have no Canvas drop.** Courses already taken (Calc I/II, PHY 2048, MAC 2313) are
  built from the textbook's section list and generated problems, cited by section. Provenance says so.

Thermal-fluids also serves the methalox engine (nozzle flow, isentropic relations, combustion
thermo), so its library should be written to be callable from outside FLUX.

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
9. **Raw course files stay in `courses/<id>/incoming/` and never ship.** PDFs, slides, docx and
   Canvas page exports may sit in the repo only in a course's `incoming/` folder, and only when that
   course's PROVENANCE.md records the instructor's permission (PHY 2049: yes, 13 Oct 2026). The repo
   is public, so this is a deliberate choice per course. `packages/checks/raw.mjs` fails on a raw
   file anywhere else under `courses/`, and `raw.mjs --dist` fails the build if anything raw or from
   an `incoming/` folder is in the built site.

---

## 4. The course module contract

A course is a folder that exports a manifest. The site's registry lists the manifests and
lazy-loads each course's code the first time it is opened.

```js
// courses/statics/index.js
import { defineCourse } from '@flux/core';

export default defineCourse({
  id: 'statics',                       // route segment and storage namespace
  code: 'EGN 3311',
  title: 'Statics',
  subject: 'mechanics',
  track: 'mechanics',                  // hub card this course sits under
  order: 1,                            // position in the track (Dynamics is 2)
  term: null,
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

The Pages project is `flux-study` (https://flux-study.pages.dev). `flux.pages.dev` is an unrelated site, checked 13 Oct 2026, so this repo does not use that hostname. Statics' live app is https://dgadapee00.github.io/statics-sim/. Statics is EGN 3311 and MAC 2313 was Spring 2026 (D5).

### Phase 0b: track cards on the hub (small)

Replace the four course links with four **track cards**: Physics, Math, Mechanics, Statistics.

- **Card layout.** A regular card, not a link row: track name at top, an animation in the
  centre, then the courses in the track as a short list (built ones as links, unbuilt ones dimmed
  with "not built yet"). Clicking the card opens the most recent built course in the track.
  Two columns at 720px and up, one column at 380px.
- **One animation per track,** drawn in SVG or a small canvas (no three.js on the hub), using the
  scene palette (E yellow, B teal, current gold, force pink, velocity white, + red, − blue):
  - Physics: a positive and a negative charge with field lines between them; on hover a test
    charge travels along a line.
  - Math: a surface's level curves with a gradient arrow; on hover the arrow climbs the levels.
  - Mechanics: a simple truss under a load; on hover the load drops on and member forces colour
    in (tension one colour, compression another).
  - Statistics: a histogram of samples; on hover bars fill in and a normal curve settles over them.
- **Motion rules.** At rest each animation is a still frame or a very slow idle loop. Hover (or
  focus, for keyboard users) plays the full animation once and holds the last frame. Touch devices,
  which have no hover, play it once when the card scrolls into view. `prefers-reduced-motion`
  shows the still frame only. Animations pause when off screen.
- **Data.** `site/src/courses.js` becomes `site/src/tracks.js`: tracks in order, each with its
  courses (`id`, `code`, `title`, `term`, `href` or `null`). Facts from D5: Statics is EGN 3311;
  MAC 2313 term is Spring 2026.
- **Checks.** Tests that every track has at least one built course and that every built course has
  an `href`; smoke at 380px and 1280px with hover simulated on each card; no horizontal scroll.

**Exit:** the hub shows the four track cards, each animates on hover, the reduced-motion and
380px checks pass, and every built course is one tap away.

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

### Phase 1b: import MAC 2313, Statics and STA 3032 as they are

Bring the other three courses in the way PHY came in: a snapshot of each, running unchanged inside
the hub, each at its own path. No refactoring. After this phase all four courses build and deploy
from this repo, the four old repos are frozen, and Phase 2 can carve the engine with all four test
suites as its safety net instead of PHY's alone.

One course per branch and PR, in this order: Statics (closed, smallest), MAC 2313 (taken Spring
2026), STA 3032 (in progress: final 7 Dec 2026).

| Course | Source repo (public) | Pinned commit | Folder | Package | Old site |
|---|---|---|---|---|---|
| EGN 3311 Statics | DGadapee00/statics-sim | `6ce522ee0e58646b632e94087456076a51678eb4` | `courses/statics` | `@flux/statics` | dgadapee00.github.io/statics-sim |
| MAC 2313 Calc III | DGadapee00/flux-mac2313 | `bdeef1b34124bef1829318b430a534fb2f6e4ccf` | `courses/mac2313` | `@flux/mac2313` | flux-mac2313.pages.dev |
| STA 3032 Stats | DGadapee00/stats | `5ee91038940732abfc6605514702a42f28726d5e` | `courses/sta3032` | `@flux/sta3032` | flux-stats.pages.dev |

None of the three contains a PDF, slide or Word file, or an `incoming/` folder (checked 13 Oct 2026).
They are 0.7 to 1.3 MB each.

#### Steps for each course

1. **Snapshot.** `git clone` the public repo, check that its HEAD is still the pinned commit (if it
   moved, use the new HEAD and record it), then copy the tree without history:
   `git -C <src> archive <commit> -- . ':(exclude).github' ':(exclude)package-lock.json' | tar -x -C courses/<id>`.
   Write the commit to `courses/<id>/SOURCE`. Commit this alone first ("import <course> snapshot at
   <short sha>") so the wiring commits after it are easy to review.
2. **Workspace.** Package name `@flux/<id>`. The root lockfile replaces the course's own. Its
   `deploy` script prints "ships with the hub" and exits 1, as PHY's does. `npm test` at the root now
   runs this course's checks too.
3. **Dev port.** Each course gets its own: PHY 5174 (unchanged), **MAC 5175** (unchanged),
   **Statics 5176**, **STA 3032 5177**. Update `vite.config.js` (`strictPort: true`, `open: false`)
   and every script and doc that names the old port (stats: `scripts/smoke.mjs`, `scripts/overflow.mjs`,
   CLAUDE.md, README; mac: `scripts/smoke.mjs`, `verify*.mjs`, `browser-checks.mjs`, README, DEPLOY).
4. **Storage keys.** One origin now serves every course, so keys must not collide. Statics uses
   `flux.exam.v1` and `flux.problems.v1`, **the same keys as PHY**: rename them to
   `flux-statics.exam.v1` and `flux-statics.problems.v1` (`src/problems/progress.js`). MAC
   (`flux-mac2313.*`) and STA (`fluxstats.*`) are already unique; leave them. Add a root check,
   `packages/checks/storage.mjs`, that collects every storage key constant under `courses/` and fails
   if two courses share one.
5. **Routes.** Same pattern as PHY's router (`courses/phy2049/src/engine/router.js` and its
   `scripts/route.test.mjs`): the hash gains the course prefix (`#/statics/u2/moments`,
   `#/mac2313/ch2/gradient`, `#/sta3032/<unit>/explore/<lab>`), old hashes redirect with
   `history.replaceState`, and a route test covers new form, old form, empty hash and a problem
   query. Stats' router has a different shape (`parseHash(hash)`, `hashFor`, `go`); keep its shape
   and add the prefix inside it.
6. **Dev server.** Generalise `site/phy-server.js` into `site/course-server.js`, one middleware per
   course at `/<id>/`, from a single list of course ids. `npm run dev` at the root serves the hub and
   all four courses.
7. **Build and deploy.** The root `build` builds every course workspace, then the hub, then
   `scripts/assemble.mjs` copies each `courses/<id>/dist` to `site/dist/<id>/` (a loop over the same
   course list, failing if one is missing), then `raw.mjs --dist`. `deploy.yml` needs no change.
8. **Hub.** In `site/src/tracks.js`, the course's `href` becomes its relative path (`statics/`,
   `mac2313/`, `sta3032/`). Extend the tracks test: every built course's href is relative and, after
   a build, `site/dist/<href>index.html` exists.
9. **Course docs.** Add a header to the course's README (and stats' CLAUDE.md and PLAN.md) like the
   one on PHY's CLAUDE.md: the course lives in Flux at `courses/<id>/`, paths are relative to it, the
   old repo is frozen, the root AGENTS.md wins on platform matters. Stats' CLAUDE.md line "FLUX
   itself is not to be modified" is about the old arrangement: replace it.
10. **Provenance (rule 8).** MAC has a PROVENANCE.md; keep it. Statics and STA 3032 have none: write
    one each, saying what course material is in the folder and where it came from (Statics: textbook
    numbers as worked cases, cited by section; STA 3032: notes rewritten from the instructor's notes,
    printed tables as data, review-sheet questions as worked cases). Whether STA 3032's instructor has
    been asked is decision D6; until it is answered, write "not yet asked" rather than guessing.

#### Exit, per course

- `npm test` and `npm run build` at the root pass, including the course's own checks, the raw-file
  scans, the dependency check and the new storage-key check.
- The course's own smoke check passes on its new port, at 380px and 1280px, with no page errors and no
  horizontal scroll. Stats' overflow check passes.
- Its hub card opens `flux-study.pages.dev/<id>/`, and an old-style link redirects.
- The live site is deployed from main.

#### After all three

- PLAN status and AGENTS.md list the four courses and their ports.
- The old repos are frozen. Leave the old sites up; a banner pointing to Flux can come later.
- Note for the owner: progress kept in the browser does not move between sites, so STA 3032 practice
  history on flux-stats.pages.dev stays there until Phase 2's export/import exists.

### Phase 2: carve core and the subject libraries out of all four courses

With all four courses in the repo, build `packages/core` from the union of them, not from PHY alone.

1. For each shared file (router, frame, pointer, views, hud, problems panel, plot, format, shared,
   manim, numberPlane, arrows, kit, engine, progress, styles), diff the four copies and write every
   difference into `packages/core/MERGE-NOTES.md` before writing code: which course has which feature.
2. Take PHY's version as the base (the superset for the 3D shell and problem engine), then bring in
   what the others added: stats' seeded labs, checked predictions, `alt` grading, named sets, overflow
   check and 380px layer; mac's `domain()` and term-by-term integral display; statics' unit system.
3. Move code in this order, lowest risk first, running **all four** courses' checks after each move:
   - `tex/`, `storage/` (namespaced `flux.<course>.<key>.v<n>` keys, with a one-time read of each
     course's old key, plus progress export/import);
   - subject libraries: `subjects/em` (PHY `physics/*`), `subjects/mechanics` (statics `physics/*`),
     `subjects/math` (mac `math/*`), `subjects/stats` (stats `stats/*`), each with its selftest.
     Where copies of the same helper disagree (vectors, units), the selftests decide;
   - `scene3d/` and `plot2d/`, with `defineLab({ kind: 'scene3d' | 'plot2d' })`;
   - the problem engine (generic kit parts only; course constants and helpers stay with the course);
   - `notes/`, the lab loader, then `shell/` (router, HUD, practice panel, styles).
4. `defineCourse` and the course registry; each course gets its manifest with `track` and `order`.
5. Track bar in the shell and `prereqs` links, with a check that lists unbuilt targets.

Rule for this phase: a move that turns any course's check red is reverted, not patched forward.

**Exit:** each `courses/<id>` holds only course content (labs, bank, notes, scenarios, manifest), all
four pass every check, and progress export/import round-trips in each.

### Phases 3–5: retired

They were "port Statics", "port MAC 2313" and "port STA 3032" onto a finished engine. Phase 1b
imports them first instead, and Phase 2 folds all four onto the engine at once.

### Phase 6: PHY cutover

**Done early, 13 Oct 2026, by choice.** PHY's `incoming/` folder and Canvas state moved to
`courses/phy2049/incoming/`; the Canvas ingest runs from this repo (`.github/workflows/canvas-ingest.yml`);
the Sunday notes run follows `courses/phy2049/CLAUDE.md` and commits here; `.github/workflows/deploy.yml`
publishes main to Cloudflare Pages on every push. flux-phy2049 is frozen. Still to do: generalise the
ingest into `tools/ingest`, reading the Canvas course id from each manifest, when a second course
gets weekly drops; and a banner on the old PHY site pointing here.

**Exit:** ingest runs from the platform repo; flux-phy2049 is no longer edited.

### Phase 7 and on: new courses, by track

Each new course is built directly as a module inside its track:

- **Physics:** PHY 2048, on `subjects/mechanics` (shared with Statics) plus what it adds
  (kinematics, energy, momentum, rotation, oscillations).
- **Math:** MAC 2311 and MAC 2312 before MAC 2313, then MAP 2302 after it. Each Calc III lab and
  notes section gains `prereqs` pointing back at the Calc I/II topic it rests on.
- **Mechanics:** Dynamics after Statics, reusing its vectors, free-body diagrams and units.
- **Thermal-fluids:** a new track and `subjects/thermo` library, written to be reusable by the
  methalox engine's analysis code.

Order: whatever is coming next in the degree first, then earlier courses as review, with
propulsion-relevant courses ahead of the rest when there is a choice.

Optional: the Engineering-Material cheat sheet becomes a "Reference" module (notes only, no labs),
cross-linked from the courses whose formulas it covers.

---

## 7. Decisions to make before Phase 0

| # | Decision | Options | Leaning |
|---|---|---|---|
| D1 | Repo visibility | **Decided: public.** PHY's raw Canvas files are in the repo under `courses/phy2049/incoming/` with the instructor's permission; nothing raw ships (rule 9). | |
| D2 | Address | one domain for everything vs. one subdomain per course on the same build | one domain; per-course subdomains only if a course needs its own link to share with a class |
| D3 | Old domains | redirect at cutover vs. leave frozen | banner + link at cutover, leave them up through the term |
| D4 | TypeScript | stay vanilla JS vs. add types (or JSDoc + `checkJs`) for the contracts only | JSDoc types on `defineCourse`, `defineLab`, `problem`; no build change |
| D5 | Course codes and terms | **Decided:** Statics is EGN 3311. MAC 2313 was taken Spring 2026. Codes for courses not yet built are confirmed when each is started. | |
| D6 | STA 3032 provenance | **Decided 13 Oct 2026:** not asked, so the instructor's material (rewritten notes, review-sheet set, worked cases and lab presets from the notes) was removed. Recorded in `courses/sta3032/PROVENANCE.md`. | |

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
