# FLUX: one platform, many courses

Status (17 Oct 2026): **Phase R is next: rework every course to `docs/COURSE-STANDARD.md`, except PHY 2049.** New units are paused until the shells carry PHY 2049's practice loop (R1); Dynamics is the pilot (R2). Live (once deploy secrets are set): https://flux-study.pages.dev/ with /phy2049/, /statics/, /egn3321/, /eml3100/, /mac2311/, /mac2312/, /mac2313/, /sta3032/. Ports: hub 5173, PHY 2049 5174, MAC 2313 5175, Statics 5176, STA 3032 5177, MAC 2311 5178, MAC 2312 5179, PHY 2048 5180, EGN 3321 5181, EGN 3331 5182, EML 3100 5183. Nothing touches courses/phy2049 before 24 Oct 2026 (Exam 5 on 23 Oct). PHY's weekly drops land here. Earlier status, superseded: see git history of this line.

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
| Math | MAC 2311 Calc I → MAC 2312 Calc II → MAC 2313 Calc III → MAP 2302 Differential equations | `math` | MAC 2311, MAC 2312, MAC 2313 |
| Mechanics | EGN 3311 Statics → EGN 3321 Dynamics and EGN 3331 Mechanics of Materials | `mechanics` | Statics |
| Statistics | STA 3032 | `stats` | STA 3032 |
| Thermal-fluids | EML 3100 Thermodynamics → fluid mechanics → heat transfer | `thermo` (new) | none yet (Phase 8) |

EGN 3321, EGN 3331 and EML 3100 are the codes on the owner's course packs (D5). PHY 2048 and MAP 2302
are the Florida common course numbers and still need confirming against UNF's catalog before they
go in a manifest.

How a track works:

- **Each course stays a module** with its own manifest, route segment (`#/<course>/...`) and storage
  namespace. A track is a grouping, not a merged course: the manifest gains `track` and `order`.
- **Inside the app, a track row** lists that track's courses in the hub's order. A built course links
  to its app. A course that is not built yet stays on the row and does not link. This is the sibling
  row, not a list of every course. The logo still links to the hub.
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

Rule for this phase: a move that turns any course's check red is reverted, not patched forward.

**Exit:** core owns tex, storage and backup, the subject libraries, the scene3d and plot2d hosts, the problem engine and Leitner review, the notes renderer, the lab loader and the routers; each course keeps its own HUD, practice panel and styles.

### Phase 2b (after 23 Oct 2026, optional)

Move UI into core one feature at a time, and only when that feature should exist in every course.

1. `prereqs` links, with a check that lists unbuilt targets (`packages/checks/prereqs.mjs`).

The all-courses row is gone. On 13 Oct 2026 that row came out of every course header (508b60e), and
so did the per-course Export and Import buttons (2afb9d5). On 16 Oct 2026 the math and engineering
headers gained a sibling-track row: the courses in this track, in the order `@flux/tracks` gives the
hub. An unbuilt sibling stays on the row and does not link. The logo still links to the hub. Backup
and restore stay on the hub.

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

### Phase 7: Calc I, Calc II and Physics I

**Math track done, 15 Oct 2026:** MAC 2311 and MAC 2312 are live, on the math shell. **PHY 2048:**
the non-UI groundwork is merged (07fbbe2). The physics shell move and its labs come after 23 Oct.

Three new courses, built directly on the platform: **MAC 2311 Calculus I** and **MAC 2312
Calculus II** in the Math track (before MAC 2313), and **PHY 2048 Physics I** in the Physics
track (before PHY 2049). They are review courses (already taken), so they have no exam dates and
no Canvas drop. The owner wants them for review and as the base the later courses link back to.

#### Rules for this phase

- **PHY 2049 is in use until its Exam 5 on 23 Oct 2026.** Nothing in this phase edits
  `courses/phy2049/` or changes how core behaves for it before 24 Oct. Additions to core and the
  subject libraries are fine when every course's checks still pass.
- **Content source (D7):** OpenStax, openly licensed (CC BY 4.0) and free to cite:
  *Calculus Volume 1* (MAC 2311), *Calculus Volume 2* (MAC 2312), *University Physics Volume 1*
  (PHY 2048). Problems cite by section (`OpenStax Calc 1 §3.4`), statements are written fresh with
  generated numbers, and a worked case may use a book example's numbers with its section cited.
  No figures or text copied. Each course's PROVENANCE.md says so and gives the licence.
- **Same quality bar as the existing courses:** every number is computed and checked by a
  selftest; each problem has a second opinion (a lab or a second method computes the same answer);
  380px first; tex-check, problems-check, smoke and the raw/storage/dependency checks pass.
- **One chapter per PR** after the first slice, so each can be reviewed and deployed alone.

#### The shell for each course (no new forks)

A new course needs a HUD, a practice panel and styles, and those are still per course (Phase 2).
Copying them a fourth and fifth time would deepen the duplication Phase 2 stopped. Instead:

1. **Math shell, now.** Move MAC 2313's HUD, practice panel and styles, unchanged, into
   `packages/shells/math/`. MAC 2313 imports them from there. This is a pure move: MAC 2313's
   tests, smoke and `verify` checks must pass with no behaviour change. MAC 2311 and MAC 2312
   then use the same shell. Most Calc I/II labs are 2D (graphs of y = f(x)): they use the shell's
   head-on `xy` plane camera, as MAC 2313's Chapter 1 labs already do.
2. **Physics shell, after 23 Oct.** The same move for PHY 2049's HUD, practice panel and styles
   into `packages/shells/physics/`, then PHY 2048 uses it. Until then PHY 2048 builds everything
   that is not UI (below).
3. Dependency direction becomes `courses → shells → subjects → core`. Update
   `packages/checks/deps.mjs` and AGENTS.md. A shell names no course and no chapter; course data
   comes in through the manifest and the course's labs.

#### MAC 2311 Calculus I (`courses/mac2311`, port 5178, track math, order 1)

Units, following OpenStax Calculus Volume 1:
1. Functions and limits (Ch 1–2): limit laws, one-sided limits, continuity, the ε–δ picture.
2. Derivatives (Ch 3): the definition as a limit, rules, chain rule, implicit differentiation,
   related rates (Ch 4.1).
3. Applications (Ch 4): linear approximation, extrema, MVT, curve sketching, optimization,
   L'Hôpital, Newton's method.
4. Integration (Ch 5): antiderivatives, Riemann sums, the definite integral, FTC, substitution.

Labs to start with (each corrects an intuition, with predictions): secant to tangent (the
derivative as a limit), limit explorer (one-sided, holes, jumps, ε–δ band), related-rates ladder,
optimization box, Riemann sums to the integral (left/right/mid/trap, error vs n), FTC accumulation.

#### MAC 2312 Calculus II (`courses/mac2312`, port 5179, track math, order 2)

Units, following OpenStax Calculus Volume 2:
1. Applications of integration (Ch 2, Vol 1 Ch 6): area between curves, volumes by disks, washers
   and shells, arc length, work.
2. Techniques (Ch 3): parts, trig integrals, trig substitution, partial fractions, numerical
   integration, improper integrals.
3. Sequences and series (Ch 5–6): convergence tests, power series, Taylor and Maclaurin series.
4. Parametric and polar (Ch 7), linking forward to MAC 2313's Chapter 2 labs.

Labs to start with: solids of revolution (disk/washer/shell, the same solid both ways), Taylor
polynomial builder (order and centre vs error), series partial sums (which tests decide what),
improper integral area as the bound moves, numerical integration error.

#### PHY 2048 Physics I (`courses/phy2048`, port 5180, track physics, order 1)

Units, following OpenStax University Physics Volume 1 (confirm against the UNF syllabus if the
owner has it, D7): vectors and kinematics (Ch 2–4), Newton's laws and friction (Ch 5–6), work and
energy (Ch 7–8), momentum and collisions (Ch 9), rotation, torque and angular momentum (Ch 10–11),
equilibrium (Ch 12), gravitation (Ch 13), oscillations (Ch 15).

Before 24 Oct, build only what is not UI:
- `subjects/mechanics` grows kinematics, dynamics, energy, momentum, rotation and oscillation
  functions, each with selftests. Statics' existing vectors and units are reused, not copied.
- The catalog, the problem bank by chapter (with cases and checks), and lab logic written
  against the scene3d contract.
After 24 Oct: the physics shell move, then the labs go live. Labs to start with: projectile
(launch angle vs range, with and without drag noted as left out), inclined plane with friction,
energy bar charts on a track, 1D collisions (elastic to inelastic), rotation and torque.

#### Track links

- Hub: the three courses appear in their track cards (`site/src/tracks.js`) once each is live.
- Sibling row: a math or engineering header lists its track in the hub's order. The hub card lists the same courses.
- `prereqs` (from Phase 2b): MAC 2313 labs and notes point back to the Calc I/II topic they rest on
  (gradient → derivative, double integral → Riemann sum, polar area → polar curves); PHY 2049 points
  back to PHY 2048 (electric potential energy → work and energy, magnetic force → circular motion);
  PHY 2048 equilibrium points across to Statics. A check lists links to unbuilt targets.

#### Order of work

1. Math shell move (MAC 2313 unchanged) and the dependency rule.
2. MAC 2311 first slice: manifest, catalog, two labs (secant → tangent, Riemann sums), 15–20
   problems across Units 1–2, selftests, PROVENANCE.md, hub and track bar entries. Merge and deploy.
3. MAC 2311 one unit per PR, then MAC 2312 the same way (first slice: solids of revolution and
   Taylor polynomials).
4. In parallel, PHY 2048's mechanics library, catalog and problem bank (no UI) on its own branch.
5. After 23 Oct: physics shell move, PHY 2048 labs, then its first deploy.
6. `prereqs` links across the tracks.

**Exit for each course:** every unit has labs and problems, all checks pass, it is live on the hub
and in its track bar, and its PROVENANCE.md names the source and licence.

### Phase A1: Applications, the rocket, engine first

Flux gets a second way in. The **school side** is bottom-up: track, course, chapter, lab. The
**applications side** is top-down: vehicle, subsystem, component, then "what physics governs
this?", then a link down into the course lab or notes section that teaches it. The courses do not
change. The applications side is a new kind of module whose pages point into them.

It starts with the engine, because that is the owner's main interest, and the reference engine is
his own: **the 25 lbf GOX/GCH₄ engine** in DGadapee00/25lbf-methalox-engine (MIT licence). Every
page shows that engine's real numbers instead of a textbook example. Tanks, structures and the rest
of a vehicle come after the engine.

#### What already exists, and what Flux builds

The engine repo's **stand sim** (`Sim/`, live at dgadapee00.github.io/25lbf-methalox-engine) already
covers the feed system and the test: blowdown, choked orifices, regulators, valve timing, the
injector, chamber fill, ignition inside the flammability limits, hot fire from the CEA table,
faults and aborts, the choke-margin study, and a Quest VR view. It is the owner's portfolio
artifact and stays in its own repo, with its own deploy and its own PROVENANCE rule.

- Flux **links into** the stand sim for those topics (its hash routes: `#/lab/injector`,
  `#/lab/chamber-fill`, `#/lab/orifice`, `#/lab/regulator`, `#/stand/hot-fire`, `#/lab/margin`).
  It does not rebuild them.
- Flux **builds** what the stand sim does not explain: why the nozzle is shaped as it is, what
  sets c\* and the combustion temperature, why L\* and the contraction ratio matter, the heat load
  on the wall, the structural margin, and the link from each of those down into school material.

#### Design data: the engine repo is the source of truth

- `applications/rocket/design/` holds a copy of the engine repo's design files at a pinned commit,
  recorded in `applications/rocket/design/SOURCE`: `Sim/data/components.json` (every design value,
  each with its own `source`), `Sim/data/cea_gox_gch4.json`, and
  `Phase1_Calculations/cea/design_point.txt`. Flux never edits these numbers. A sync script copies a
  later commit in, like `scripts/sync-phy.mjs` did.
- **Methane's heat of formation:** engine-page calculations use −74.873 kJ/mol, the reactant
  enthalpy written into the CEA input (−17895 cal/mol), so they reproduce the committed design
  point. `subjects/thermo` gives −74.600 kJ/mol (GRI-Mech and NASA Glenn); the difference is the
  1.08 cal/g reactant-enthalpy gap its test explains. `applications/rocket/design/SOURCE` records
  this when Phase A1 creates it. (Decided 18 Oct 2026.)
- The engine repo marks these values **preliminary** until its Phase 1 tag `v0.2-sizing-frozen`.
  Every page that shows one says so until that tag exists.
- Selftests check that the design table agrees with itself, which is also the first lesson:
  ṁ = P_c·A_t / c\* gives c\* ≈ 1644 m/s from the 8.0 mm throat, 250 psia and 52.7 g/s (about
  0.92 of ideal, as the plan assumes); C_F = F / (P_c·A_t) ≈ 1.28 for ε = 3 at sea level;
  D_e = D_t·√ε = 13.9 mm; D_c = D_t·√CR = 22.6 mm.

#### Component tree (engine)

| Component | The questions it answers | Physics | Stand-sim link |
|---|---|---|---|
| Propellants and combustion | Why O/F 2.8 and not peak 3.3? What sets T_c and c\*? | equilibrium chemistry (CEA), molar mass, γ | hot fire |
| Injector | Why choked gas injection? How big are the orifices? | choked orifice flow, C_d·A | injector, orifice |
| Combustion chamber | Why L\* = 35 in and CR = 8? | residence time, chamber volume, Mach at the injector face | chamber fill |
| Nozzle | Why converging–diverging? Why ε = 3? | choked throat, area–Mach relation, isentropic expansion, thrust coefficient, over- and under-expansion | hot fire |
| Thermal | How long can it run? | Bartz heat flux, lumped heat-sink transient, film cooling | (wall-temperature node not built in the stand sim yet) |
| Structure | Will it hold? | thin-wall hoop stress, burst margin ≥ 4, bolts and flanges, thrust mount load path | — |
| Ignition | How does it light without a hard start? | flammability limits, energy, unburned propellant | chamber fill, hot fire |
| Feed system | How does gas get from bottle to chamber? | blowdown, regulators, choke margin | blowdown, regulator, margin |
| Instrumentation and test | How do we know what it did? | load cell, P_c transducer, c\* efficiency from data | hot fire, test mode |

#### A component page

Each page has the same parts:

1. **What it does**, in two sentences.
2. **How it is built on this engine**: a cutaway with the part highlighted, and its design numbers
   from `design/`, each with its source and the preliminary flag.
3. **The physics**: derived, not listed, in the voice of the course notes; then **what the model
   leaves out**.
4. **Its own sim**, where one teaches something (the nozzle sim: P_c, ε and ambient pressure in;
   thrust, I_sp, exit pressure and the flow regime out).
5. **Go deeper**: `teaches` links into course labs, notes sections and problems
   (momentum and thrust → PHY 2048; pressure and fluids → PHY 2048; integrals of a contour →
   Calc II; energy and specific heats → thermodynamics). A target not built yet shows as
   "not built yet".
6. **On the stand**: links into the stand sim's matching lab.

#### The library under it: `subjects/thermo`

New, with selftests against published values: ideal gas and specific heats; isentropic relations;
the area–Mach relation (both branches); choked mass flux; c\*, C_F and thrust, including the
pressure term; a Bartz heat-flux estimate and a lumped heat-sink transient; thin-wall pressure
vessel stress (in `subjects/mechanics`). Checks: the isentropic tables of NACA Report 1135, the
committed CEA design-point output, and worked examples from Sutton's *Rocket Propulsion
Elements* cited by section.

The stand sim has its own gas physics (`Sim/src/physics/`). Flux's library is written separately and
the two are checked against each other at the design point: two independent implementations
agreeing is the same "second opinion" idea the course labs use.

#### Module, routes and hub

- `applications/rocket/` with a manifest from `defineSystem({ id, title, components })`. Each
  component: `{ id, title, parent, design: [keys], teaches: [links], stand: [stand-sim routes],
  page: () => import(...) }`. Dependency direction: `applications → shells → subjects → core`,
  and an application may link to courses but not import them.
- Routes: `#/rocket/engine/nozzle`. Served at `flux-study.pages.dev/rocket/`.
- Hub: an **Applications** row below the tracks, with a Rocket card (its animation: the cutaway
  with the flow accelerating through the throat).
- The cutaway is generated from the design geometry (D_c, D_t, D_e, L\*, contraction and
  expansion half-angles), not modelled by hand, so it follows the design when the numbers change.
  Tapping a region opens its page. A VR walk-through can come later (the stand sim already has a
  Quest view, and Truth Mines is the same kind of dependency map).

#### Coverage report: the applications side decides what to build next

A check collects every `teaches` link and lists the ones whose target does not exist yet, grouped
by the course or subject they need. That list becomes the build order for the school side:
thermodynamics, compressible flow and heat transfer are the first gaps the engine will expose
(the Thermal-fluids track: Thermodynamics in Phase 8, the rest after).

#### Order of work

1. Contract (`defineSystem`), routes, the hub's Applications row, the `design/` copy with its sync
   script and SOURCE, and the design-table consistency selftests.
2. `subjects/thermo` with its selftests (NACA 1135, CEA design point, Sutton), then the cross-check
   against the stand sim's numbers.
3. First slice, deployed: the cutaway and the **Nozzle** and **Propellants and combustion** pages,
   with the nozzle sim.
4. Combustion chamber, Injector, Feed system and Ignition pages (mostly physics plus stand-sim links).
5. Thermal (Bartz and the heat-sink transient), then Structure (hoop stress, burst margin).
6. Instrumentation and test, then the coverage report.
7. Next level up, after the engine: tanks (pressure vessel, ullage, propellant management,
   material choice: aluminium, stainless and composite), then structures, then the vehicle.

**Rules:** nothing here touches `courses/phy2049` before 24 Oct 2026; every number shown is
computed and checked; every design number comes from `design/`; nothing is copied from Sutton or
other books but equations and cited values; the stand sim's repo is not edited from Flux.

**Exit for the engine:** every component page is live with its design numbers, physics, links and
(where useful) its own sim; all selftests pass, including the cross-check with the stand sim; the
coverage report runs in `npm test`.

### Phase 8: Dynamics, Mechanics of Materials and Thermodynamics

Three engineering courses, built directly on the platform. **EGN 3321 Dynamics** and **EGN 3331
Mechanics of Materials** join the Mechanics track after Statics. **EML 3100 Thermodynamics** starts
the Thermal-fluids track. The codes and the chapter order are the owner's course packs. Dynamics links to `egn3321/`. Mechanics of Materials stays on the Mechanics card, marked "not built yet". Thermodynamics stays in the track list; the Thermal-fluids card is hidden until a course in that track is built.

| Course | Folder and id | Port | Track, order | Text |
|---|---|---|---|---|
| EGN 3321 Dynamics | `courses/egn3321` | 5181 | mechanics, 2 | Hibbeler, *Engineering Mechanics: Dynamics* |
| EGN 3331 Mechanics of Materials | `courses/egn3331` | 5182 | mechanics, 3 | Roylance, *Mechanics of Materials* (MIT OpenCourseWare 3.11) (D14) |
| EML 3100 Thermodynamics | `courses/eml3100` | 5183 | thermal, 1 | Yan, *Introduction to Engineering Thermodynamics* (BCcampus); OpenStax *University Physics Volume 2* Ch 1–4 for physics background (D13) |

The id is the course code in lowercase, as MAC 2311 and MAC 2312 did. It is the route segment
(`#/egn3321/u2/explore/fma`) and the storage namespace (`flux.egn3321.problems.v1`).

#### Decisions, answered 15 Oct 2026

Dalton takes EGN 3321, EGN 3331, and EML 3100 next term. These are the answers, and the build follows them.

- **D8.** All three courses are next term, so they are built as coming courses, not as undated review. Dynamics is built first. Exam dates go into each unit when he has them.
- **D9.** Worked cases use generated numbers and cite the textbook by section. No textbook example number is copied or invented. The property standards still supply the printed-answer checks.
- **D10.** R-134a comes from the Tillner-Roth & Baehr equation of state, in a later Thermodynamics PR. Refrigeration problems use water and air until that PR.
- **D11.** Coverage follows the course packs. Sections a pack does not name stay out. Dynamics keeps the §15.9 rocket lab, because the rocket application links to it.

#### Decision, answered 18 Oct 2026

- **D12.** Thermodynamics comes before Mechanics of Materials, and its library comes before its screens. Mechanics of Materials reuses the engineering shell, so it is quick. Thermodynamics needs new parts: steam and ideal-gas properties, property diagrams, and table-aware grading. Every thermo answer rests on the property library, so it starts first. The same library serves Phase A1's Nozzle and Propellants pages. The order is:
  1. **`packages/subjects/thermo`, one PR, no UI.**
     - IAPWS-IF97 regions 1, 2 and 4 only. A state in region 3, near the critical point, or outside the validity range throws a clear error, and the selftests check that it does. Problem generators stay out of region 3.
     - NASA 7-coefficient cp, h and s for air, N₂, O₂, CO₂, H₂O and CH₄.
     - Selftests: IF97's own verification tables for regions 1, 2 and 4; the saturation pressure computed both ways across the dome; the NASA-7 values checked against the engine repo's `Sim/data/thermo_nasa7.json` and its committed CEA design point, at a pinned commit and read-only.
     - Pure functions, no DOM, with its own package entry, so the engine pages and the engine repo can import it.
     - SI and English units go through `subjects/src/convert.js`.
     - Flux generates its own property tables from the library. No textbook table is copied. Grading accepts the exact value and the value interpolated linearly from the generated table, through the existing `alt` mechanism. A test shows that an answer interpolated the textbook way passes.
  2. **EML 3100 first slice.** Its textbooks are settled by D13, below.
  3. **Mechanics of Materials first slice.**

#### Decision, answered 18 Oct 2026 (textbooks for EML 3100)

- **D13.** EML 3100 cites two open textbooks:
  - **Claire Yu Yan, *Introduction to Engineering Thermodynamics*** (BCcampus, 2022, CC BY-NC-SA 4.0), for the engineering units. Section numbers are the BCcampus Pressbooks edition's. The LibreTexts copy numbers some sections one higher.
  - **OpenStax *University Physics Volume 2*, Ch 1–4** (CC BY 4.0), for the physics background: temperature, kinetic theory, the first law, heat engines.
  - Topics past Yan's Chapter 6 (the Rankine and Brayton cycles, vapour-compression refrigeration) are cited by topic only, until a source is chosen.
  - Every citation goes through one map, `courses/eml3100/src/data/textbook.js`. Problems and notes ask the map for a topic's citation, so switching books changes one file.
  - Flux writes its own text and tables. Nothing is copied from either book: no prose, figures, tables, examples or problems.
  - The course pack still sets coverage and order (D11). Its chapter numbers (Çengel & Boles, Ch 1–7) name the units below and are not cited to students.

#### Decision, answered 18 Oct 2026 (textbook for EGN 3331)

- **D14.** EGN 3331 cites David Roylance's *Mechanics of Materials* modules, published on MIT OpenCourseWare as course 3.11 (Fall 1999, CC BY-NC-SA 4.0).
  - OpenCourseWare posts the modules as separate, unnumbered files. Section numbers are the collected edition's (Engineering LibreTexts, "Mechanics of Materials (Roylance)"), which keeps the same titles and order.
  - Topics the modules do not treat (bearing stress, the factor of safety, statically indeterminate axial members, thermal stress, combined loading, column buckling) are cited by topic only, until a source is chosen.
  - Every citation goes through one map, `courses/egn3331/src/data/textbook.js`. Nothing is copied.
  - The units and the "Ch" numbers in the practice list follow the course pack (D11), which is the order the class works in.

#### Track placement

- **Mechanics:** EGN 3311 Statics → EGN 3321 Dynamics and EGN 3331 Mechanics of Materials. Both rest
  on Statics and neither on the other, so their order numbers only set the order of the list.
- **Thermal-fluids:** EML 3100 Thermodynamics first. Fluid mechanics and heat transfer follow when
  their codes are known. The hub card waits until a course in the track is built. The Carnot
  animation stays in the repo for that card, and its test checks the enclosed area against
  R(T_H − T_L) ln(v₂/v₁).
- **Prerequisite links** (`prereqs`, a check lists unbuilt targets): Dynamics → PHY 2048 (kinematics,
  Newton's laws, energy, momentum, rotation) and Statics (free-body diagrams, centroids, moments of
  inertia). Mechanics of Materials → Statics (sections, trusses, centroids, area moments of inertia)
  and MAC 2311 (integration, for the elastic curve). Thermodynamics → PHY 2048 (work and energy) and
  MAC 2311 (integrals, for boundary work).
- **Applications links:** the rocket's Nozzle page teaches through Thermodynamics' `nozzle` and
  `isentropic` labs. Its Structure page teaches through Mechanics of Materials' `vessel` lab. Dynamics'
  `rocket` lab (variable mass) is linked from the Propellants page.

#### Rules for this phase

- **Course packs are for coverage and order only.** The instructors' packs set the chapter list
  and its order. Nothing from them ships: no rewritten notes, no worked cases, no lab presets, no
  review questions. This is decision D6 applied before it can come up. PROVENANCE.md in each folder
  says so. If an instructor later agrees in writing, their material can come in like PHY 2049's.
- **Textbook use:** problems and notes cite the text by section (Hibbeler §12.7, Yan §4.3).
  Statements are written fresh with generated numbers. A worked case uses numbers computed for this
  bank and cites the section its method comes from. No textbook example or problem number is
  invented, and none is copied (D9). No figures, no tables copied.
- **Property data is computed, not copied.** Steam properties come from IAPWS-IF97. Ideal-gas
  properties come from the NASA 7-coefficient polynomials. Both are published, free standards, and
  their own verification values are the selftests. Material constants (E, G, ν, σ_Y, α) are stated
  in each problem.
- **Units:** both systems, as the texts use them. SI and US customary values go through one
  conversion module with exact definitions. Hibbeler's rule for answers: three significant figures,
  four when the leading digit is 1. Grading accepts the exact value, and the course rounding is what
  the worked solution prints.
- **Headers:** a course header has the logo, the course code and title, and the mode tabs. It has
  no course-switcher row and no Export or Import buttons. The logo links to the hub
  (`mountTrackBar` from `@flux/core`). Backup and restore live on the hub only.
- **Same bar as every course:** every number on screen is computed, then checked by a second
  method. tex-check, problems-check, labs-check, notes-check, the subject selftests, smoke at 380px
  and 1280px, overflow at 380px, and the raw, storage, dependency and prereq checks all pass.
- **PHY 2049 is untouched.** Nothing here edits `courses/phy2049/`, its `incoming/` or
  `.canvas-state.json`.

#### The shell: one engineering shell, moved out of Statics

Phase 7 moved MAC 2313's HUD, practice panel and styles into `packages/shells/math/`, and MAC 2311
and MAC 2312 import them through two thin files (`ui/hud.js`, `ui/problems.js`) that pass the
catalog, the bank and the course code in. Phase 8 does the same for this family:

1. **Move Statics' UI into `packages/shells/engineering/`.** Its `ui/hud.js`, `ui/problems.js`,
   `ui/format.js`, `ui/plot.js`, `ui/shared.js` and `styles/` move unchanged, except that whatever
   names Statics (its code, its unit ids, its chapter numbers) becomes a parameter, so deps.mjs
   passes. Statics keeps two thin wrappers, as MAC 2311 has. This is a pure move. Statics is closed,
   and its tests, smoke and screenshots must come out the same.
2. **Free-body diagrams move with it.** The FBD drawing in Statics' `particle`, `beam` and `frame`
   labs (body, supports, arrows, the cut face's N, V and M in the chapter's positive senses) becomes
   `shells/engineering/fbd.js`. Dynamics draws its FBDs and kinetic diagrams with it. Mechanics of
   Materials draws its cut members with it.
3. **The shell gains two things the new courses need, behind manifest flags.** A Notes tab, shown
   only when the manifest has `notes` (Statics has none, so its header does not change), using
   core's `createNotes`. A `plot2d` stage: a lab of `kind: 'plot2d'` mounts a canvas from
   `@flux/core/plot2d` in place of the three.js stage. Thermodynamics' property diagrams use it.
4. **No copied HUD.** A new course writes only its catalog, labs, bank, notes and the two wrappers.
   A course that needs a different control asks the shell for a hook.

The physics shell (PHY 2049's UI, after 23 Oct) stays a separate family. If the two shells turn out
to be the same code once both exist, they merge then, not before.

#### Notes: PHY 2049's structure

Each unit has one notes file, written for Flux in the structure of PHY 2049's
`e4-charge-in-motion.html`:

- `header.top` with an eyebrow (`EGN 3321 · Dynamics · Unit 1 · Hibbeler Ch 12`), an h1, a lede of
  one or two sentences, the legend, and a toc grouped by part.
- `div.part` blocks, each with its eyebrow (`Part I`) and h2.
- `section.topic` numbered s1, s2, … with an `h2` holding `span.n` and the title. The last section is
  the formula sheet.
- Boxes: `ex` (worked example), `why` (derivation), `fix` (a correction), `key` (key idea). A `fix`
  names something a student would get wrong by trusting the source, cites the section, and gives the
  correct version. Published errata for the text go here, and so do the classic misreadings
  (Celsius in a Carnot ratio, gauge pressure in the ideal-gas law, the contact point of a rolling
  wheel having zero acceleration).
- Math is `\( \)` and `\[ \]`, typeset by KaTeX. `$` is never a delimiter in a notes file.
- Voice: short declarative sentences, about 15 words. Derive each rule. Recompute every worked
  answer before writing it down.

The registry is `notes/index.js`, shaped like PHY 2049's: per unit `{ unit, title, chapters, file,
load, sections }`, each section `{ id, n, title, lab, ch, topics, problems, home }`. `notes/setups.js`
gives a worked example a "Show this in the lab" button, and its `read()` pairs the lab's value with
the notes' value. notes-check (generalised from PHY 2049's into `packages/checks/notes.mjs`, PHY's
own copy untouched) checks the section list against the file, every lab, chapter and problem a
section names, every formula with KaTeX, and every setup headless within 2%.

The notes are written from the text's section list and derivations, not from the instructors'
packs.

#### EGN 3321 Dynamics (`courses/egn3321`, port 5181)

Units follow the course pack (D11). Hibbeler sections the pack does not name are left out:
cylindrical components (§12.8, §13.6), dependent motion (§12.9), central
force (§13.7), steady flow (§15.8), and rotating axes
(§16.8). Variable mass (§15.9) is the `rocket` lab below.

**Unit 1. Particle kinematics** (units and significant figures, which the Dynamics volume does not
repeat, cited from Hibbeler *Statics* §1.3–1.6; Ch 12: rectilinear, curvilinear,
normal–tangential, relative motion)

- `rectilinear`: linked s–t, v–t and a–t graphs, with a piecewise a(t) the student drags.
  Shows that v is the area under a–t and s the area under v–t, and that distance and displacement
  part when v changes sign. Recompute: exact integration of each polynomial piece. Check: RK4
  integration of the same a(t), and total distance as ∫|v| dt against the sum of |Δs| between
  zero crossings of v.
- `path-nt`: a particle moving along y = f(x) with speed v(t). Shows that the acceleration does
  not point along the path: a_t = v̇ and a_n = v²/ρ. Recompute: ρ = (1 + y′²)^{3/2}/|y″|. Check:
  differentiate the position twice in x–y components (subjects/math/ndiff), then project onto t
  and n.
- `relative`: two particles on their own paths, seen from translating axes on A. Shows that
  v_B/A = v_B − v_A can point where neither velocity does. Recompute: vector subtraction. Check:
  numerical derivative of r_B − r_A.

**Unit 2. Particle kinetics: force and acceleration** (Ch 13)

- `fma`: blocks, pulleys and an incline with friction. Shows that the rope tension is not the hanging
  weight while the system accelerates, and when friction is static or kinetic. Recompute: solve
  ΣF = ma for a and T with `mechanics/dynamics.js` and `friction.js`. Check: integrate the motion
  for a time t; the net work over the displacement equals ½mv².
- `curve`: a car on a banked curve and a bead in a vertical loop, in n–t axes. Shows the speed band
  where the car holds without friction, and where the normal force is least in a loop. Recompute:
  n–t equations. Check: the same forces in x–y components at each angle, residual of ΣF − ma = 0.

**Unit 3. Work and energy** (Ch 14)

- `collar`: a collar on a rod with a spring, gravity and optional friction. Shows that a spring's
  work depends only on its start and end stretch. Recompute: T₁ + ΣU₁₋₂ = T₂. Check: integrate the
  equation of motion along the rod and compare the speed at the end.
- `paths`: the same two end points joined by three paths, in gravity plus a spring, then with
  friction. Shows that conservative work is path independent and friction work is not. Recompute:
  −ΔV. Check: the line integral ∫F·dr along each path by quadrature.

**Unit 4. Impulse and momentum** (Ch 15)

- `impulse`: an F–t curve the student shapes. Shows that a short large force and a long small force
  with the same area give the same Δv. Recompute: the area under F(t). Check: integrate m dv/dt = F.
- `impact`: central and oblique impact with restitution e. Shows that momentum is conserved for every
  e, and that energy lost grows as e falls; along the tangent nothing changes. Recompute: the
  closed-form post-impact velocities. Check: the centre-of-mass velocity is unchanged, and the
  energy lost equals ½μ(1 − e²)v_rel² with μ the reduced mass, against T before minus T after.
- `rocket` (§15.9, kept by D11): a rocket burning at constant ṁ. Shows that Δv grows with ln(m₀/m_f),
  not with the mass burned. Recompute: Δv = v_e ln(m₀/m_f) − g t_b. Check: integrate
  m dv/dt = ṁv_e − mg numerically. The rocket application links to it.

**Unit 5. Planar kinematics of a rigid body** (Ch 16: instantaneous centre, relative acceleration)

- `ic`: a sliding ladder, a rolling wheel, a four-bar linkage. Shows that the IC is found from two
  velocity directions and moves as the body moves. Recompute: v_B = v_A + ω × r_B/A. Check:
  ω = v_A / r_A/IC from the IC construction, and the derivative of the linkage's position equations.
- `slider-crank`: a crank at constant ω driving a slider. Shows that the slider still accelerates,
  because of the −ω²r term. Recompute: a_B = a_A + α × r_B/A − ω²r_B/A. Check: x_B(θ) differentiated
  twice numerically (absolute motion analysis, §16.4).
- `rolling`: a wheel rolling without slip, with a point traced on its rim. Shows that the contact
  point has zero velocity but acceleration rω² toward the centre, and the top point moves at 2v.
  Recompute: relative velocity and acceleration from the centre. Check: differentiate the
  cycloid.

**Unit 6. Planar kinetics of a rigid body** (Ch 17)

- `inertia`: mass moments of inertia of composite bodies about any axis. Shows that I depends on how
  far the mass is from the axis, not how much there is. Recompute: tabulated shapes plus the
  parallel-axis theorem (`mechanics/rotation.js`). Check: numerical volume integration of r² dm
  (`subjects/math/quadrature.js`).
- `pendulum`: a slender bar or plate released from rest about a pin. Shows that the pin force at
  release is not the weight (a horizontal slender bar: mg/4). Recompute: ΣM_O = I_O α and
  ΣF = m a_G. Check: moments about G instead of O; the residual of all three equations.
- `roll-slip`: a disk, hoop or sphere on an incline with friction μ. Shows when it rolls and when it
  slips, and that rolling acceleration is g sin θ / (1 + k²/r²). Recompute: the rolling case, then
  the friction it needs against μN. Check: integrate the kinetics and compare the speed with the
  energy method of Ch 18.

**Unit 7. Work and energy of a rigid body** (Ch 18)

- `race`: hoop, disk and sphere racing down an incline. Shows that mass and radius cancel; only k/r
  decides. Recompute: T₁ + V₁ = T₂ + V₂ with T = ½mv² + ½I_Gω². Check: the Ch 17 kinetics integrated
  in time.
- `linkage`: a bar or linkage released with a spring. Shows how to write T when the IC carries the
  kinematics. Recompute: energy conservation with velocities from the IC. Check: numerical
  integration of the one-degree-of-freedom equation of motion.

Problem types per chapter (each template has a second opinion: its lab or a second method):

| Chapter | Templates | Answers |
|---|---|---|
| Statics §1.3–1.6 | convert a derived quantity between SI and US customary; round to Hibbeler's figures; dimensional homogeneity | num, mc, tf |
| 12 | s(t) → v, a; a(s) or a(v) by separating variables; distance with a reversal; areas of erratic-motion graphs; projectile range, height and time; a_n and a for y = f(x); relative velocity and acceleration | num, sym |
| 13 | blocks, pulleys and friction (a, T); max speed on a banked curve; normal force in a loop; spring-attached collar | num |
| 14 | work–energy with springs and friction (speed, distance); power and efficiency; energy conservation; path independence | num, tf |
| 15 | impulse of F(t); momentum conservation (recoil, bullet and block); central impact with e; oblique impact; angular momentum about a point | num |
| 16 | gears and belts (ω, α); absolute motion analysis; relative velocity and the IC; relative acceleration in a slider-crank or four-bar | num |
| 17 | mass moment of inertia (composite, parallel axis); crate that slides or tips; pin reactions in fixed-axis rotation; roll or slip | num, mc |
| 18 | kinetic energy of a rigid body; work of a couple and a spring; energy conservation for linkages and rolling bodies | num |

Shared code: `subjects/mechanics` vectors, units (lb, slug, ft, kip), constants (g, g in ft/s²),
friction, and PHY 2048's kinematics, dynamics, energy, momentum and rotation. New in
`subjects/mechanics`, each with a selftest: `path.js` (n–t components and radius of curvature),
`rigid2d.js` (relative velocity and acceleration, the IC, slider-crank and four-bar position
solutions), `inertia.js` (mass moments of inertia of standard shapes, composite bodies), and
restitution and reduced-mass energy loss in `momentum.js`. FBDs and kinetic diagrams from
`shells/engineering/fbd.js`.

#### EGN 3331 Mechanics of Materials (`courses/egn3331`, port 5182)

Units follow the course pack, Hibbeler Ch 1–9, 12 and 13. Chapters 10 (strain transformation), 11
(beam design) and 14 (energy methods) are not in the pack and are left out (D11, answered).

**Unit 1. Stress** (Ch 1, §1.3–1.6, with the statics review and trusses)

- `cut`: an axially loaded bar cut on a plane at angle θ. Shows that the largest shear is on the 45°
  plane, not on the cross-section. Recompute: σ = (P/A) cos²θ and τ = (P/2A) sin 2θ from the cut's
  equilibrium. Check: the same numbers from the stress transformation of Ch 9 with σ_x = P/A; and the
  left and right segments' equilibrium give equal and opposite internal loads.
- `truss-stress`: a truss with member areas the student sets. Shows that the most stressed member
  is not always the one with the largest force, and how the factor of safety picks an area.
  Recompute: member forces from `mechanics/truss.js`, then σ = F/A. Check: method of sections against
  method of joints (`truss.js` already has both).
- `pins`: single and double shear, and bearing, in a pinned connection. Shows that double shear
  halves τ and that bearing can govern. Recompute: τ = V/A over each shear plane. Check: equilibrium
  of the pin's free-body, segment by segment.

**Unit 2. Strain and material behaviour** (Ch 2–3: strain; Hooke's law, strain energy, Poisson's
ratio, creep and fatigue)

- `tension-test`: a stress–strain curve for a ductile steel and an aluminium, with loading and
  unloading. Shows that E is the initial slope, that unloading follows E and leaves a permanent set,
  and where the 0.2% offset yield sits. Recompute: a bilinear-with-hardening model for steel and
  Ramberg–Osgood for aluminium, and the offset line's intersection by root finding. Check: modulus
  of resilience σ_Y²/2E against the trapezoid area under the curve, and toughness by quadrature
  against the model's integral.
- `poisson`: a bar stretched, contracting sideways. Shows that the volume change is (1 − 2ν)ε and
  vanishes at ν = 0.5. Recompute: the small-strain formula. Check: the deformed volume
  L(1 + ε)·[w(1 − νε)]² computed directly.
- Creep and fatigue are notes and problems (reading an S–N curve the problem states). No lab.

**Unit 3. Axial load** (Ch 4: deformation, indeterminate members, thermal stress)

- `axial`: a stepped or tapered bar under several loads. Shows that the displacement accumulates
  along the bar and the internal force diagram sets it. Recompute: δ = Σ NL/AE. Check: ∫N/(AE) dx by
  quadrature, which also handles the taper.
- `indeterminate`: a bar between two walls with a load, or a rigid bar on posts. Shows that the
  stiffer path carries more load. Recompute: compatibility (the force method). Check: a 1D
  direct-stiffness assembly and solve.
- `thermal`: a bar heated between walls, with an optional gap. Shows that the stress does not depend
  on length, and the temperature at which the gap closes. Recompute: σ = −EαΔT after closure.
  Check: the stiffness method with a thermal load vector.

**Unit 4. Torsion** (Ch 5)

- `torsion`: a solid or hollow circular shaft. Shows that τ grows linearly with ρ, so a hollow shaft
  keeps most of the strength at much less weight. Recompute: τ = Tρ/J and φ = TL/JG. Check: ∫τρ dA
  over the section by quadrature gives back T, and J by quadrature against the closed form.
- `twist`: a stepped shaft with gears, or a shaft fixed at both ends, transmitting power. Shows the
  torque diagram and that a faster shaft can be thinner for the same power. Recompute: T = P/ω,
  φ = Σ TL/JG, compatibility when fixed at both ends. Check: the stiffness method, and the same
  answer worked in hp and rpm.

**Unit 5. Bending** (Ch 6: shear and moment diagrams, bending stress)

- `diagrams`: a beam with point loads, couples and distributed loads. Shows dV/dx = −w and
  dM/dx = V: the moment peaks where the shear crosses zero. Recompute: integrate the load (the
  graphical method). Check: the method of sections at every x (`mechanics/sections.js`
  `internalAt`).
- `flexure`: a rectangle, I and T section under a moment. Shows that the neutral axis passes through
  the centroid, and that a T section's top and bottom stresses differ. Recompute: σ = −My/I with
  the centroid and I from `sections.js` `compositeI`. Check: ∫σ dA = 0 and −∫yσ dA = M by quadrature
  over the section.

**Unit 6. Transverse shear** (Ch 7: shear formula, shear flow)

- `shear`: τ = VQ/It across a rectangle and an I section. Shows that τ peaks at the neutral axis and
  the web carries most of V. Recompute: Q from the composite area above the cut. Check: ∫τ dA over
  the section gives back V; Q by quadrature.
- `built-up`: boards or plates fastened into a beam. Shows that the fastener spacing comes from the
  shear flow on the part being held, s = F_allow / q. Recompute: q = VQ/I. Check: the change in the
  flange's normal force between two sections dx apart, (ΔM/I)Q, equals q·dx.

**Unit 7. Pressure vessels and combined loading** (Ch 8)

- `vessel`: a thin-walled cylinder and sphere. Shows that the hoop stress is twice the longitudinal
  stress, so a cylinder splits along its length. Recompute: σ₁ = pr/t, σ₂ = pr/2t. Check: integrate
  p r sin θ over half the cylinder for the force balance. The rocket's Structure page links here.
- `combined`: a post or bracket with axial load, bending and torsion. Shows which point of the
  section is critical, by superposition. Recompute: each load's stress at the point. Check: internal
  loads from 3D vector moments (`mechanics/vectors.js`, `statics.js`) against the scalar component
  method; the stress state then goes to `mohr`.

**Unit 8. Stress transformation** (Ch 9)

- `mohr`: a plane-stress element the student rotates, beside its Mohr's circle. Shows that principal
  planes 90° apart on the element are 180° apart on the circle, and that the largest in-plane shear
  is 45° from them. Recompute: the transformation equations. Check: the circle's geometry, and the
  eigenvalues of the 2×2 stress tensor; three methods agree.

**Unit 9. Deflection of beams** (Ch 12)

- `deflection`: cantilever, simply supported and overhanging beams under point and distributed
  loads. Shows that the largest deflection is where the slope is zero, not where the moment peaks.
  Recompute: the elastic curve by integration with discontinuity functions and boundary conditions.
  Check: numerical double integration of M/EI (trapezoid with the boundary conditions) and, for
  combined loads, superposition of the single cases.
- `propped`: a propped cantilever or a continuous beam. Shows how compatibility fixes the redundant
  reaction. Recompute: superposition of deflections. Check: finite differences on EIv″ = M with the
  redundant unknown.

**Unit 10. Buckling of columns** (Ch 13)

- `buckling`: a column with pinned, fixed and free ends. Shows that P_cr falls with (KL)², follows
  the weak axis, and that Euler holds only while σ_cr stays below σ_Y. Recompute:
  P_cr = π²EI/(KL)². Check: the smallest eigenvalue of EIv″ + Pv = 0 by finite differences.

Problem types per chapter:

| Chapter | Templates | Answers |
|---|---|---|
| 1 | internal loads by the method of sections; average normal and shear stress; stress on an inclined plane; truss member stress; single and double shear, bearing; allowable stress and factor of safety | num |
| 2 | normal and shear strain from a deformed shape or displacements | num |
| 3 | E, yield and resilience from a stated curve; Hooke's law; Poisson's ratio; shear modulus and G = E/2(1 + ν); strain energy; creep and fatigue reading | num, mc, tf |
| 4 | δ for stepped and tapered bars; superposition; indeterminate bars and rigid bars on posts; thermal stress, with and without a gap | num |
| 5 | τ and φ in solid and hollow shafts; power transmission (SI and hp, rpm); stepped shafts; shafts fixed at both ends | num |
| 6 | shear and moment diagrams (values at points, max, location); flexure formula on composite sections | num, sym |
| 7 | τ = VQ/It at a point; τ_max; fastener spacing from shear flow | num |
| 8 | thin-walled cylinders and spheres (stress, required thickness); stress at a point under combined loads | num |
| 9 | stresses on a rotated plane; principal stresses and angle; maximum in-plane shear; Mohr's circle reading | num |
| 12 | slope and deflection by integration; superposition with a load table; propped cantilever reaction | num, sym |
| 13 | Euler load with effective length; weak axis; critical stress against yield | num, mc |

Shared code: `subjects/mechanics` sections (`internalAt`, `shearMomentDiagram`, `composite`,
`compositeI`, centroids), truss, frames, statics, vectors and units, all from Statics. New in
`subjects/mechanics`, each with a selftest: `materials.js` (stress and strain, axial, torsion,
flexure, transverse shear, shear flow), `vessels.js` (thin-wall stresses; also used by the rocket's
Structure page), `transform.js` (plane-stress transformation, principal values), `elastic.js`
(elastic curve by integration and a numerical integrator, superposition cases), `buckling.js`
(Euler and its finite-difference check), and `stiffness1d.js` (axial and torsional direct stiffness,
for the indeterminate checks).

#### EML 3100 Thermodynamics (`courses/eml3100`, port 5183)

Units follow the course pack's coverage and order: Çengel & Boles Ch 1–7, the chapter numbers
in the headings below. Students see citations to Yan and OpenStax instead, from
`src/data/textbook.js` (D13). Unsteady flow (the charging and discharging part of Ch 5) is left out
(D11, answered).

**Unit 1. Basic concepts** (Ch 1)

- `manometer`: a U-tube and a multi-fluid manometer on a tank. Shows that pressure depends on depth
  and density only, not on the tube's width or shape, and the difference between gauge and absolute.
  Recompute: P = P_atm + Σρgh along the fluid path. Check: walk the path from the other end; the
  two pressures at the tank agree.

**Unit 2. Energy and the first law** (Ch 2)

- `balance`: a tank with a paddle wheel, a resistance heater and heat loss, drawn as energy bars
  (in, out, stored). Shows that heat and work are both energy crossing the boundary, with one sign
  convention. A second scenario chains a motor and a pump: the overall efficiency is the product.
  Recompute: E_in − E_out = ΔE_system. Check: the rate form dE/dt = Q̇ − Ẇ integrated in time
  against the integrated balance.

**Unit 3. Pure substances and property tables** (Ch 3)

- `phase`: T–v and P–v diagrams of water with the saturation dome, and a state the student drags.
  Shows that heating at constant pressure holds T at T_sat while x runs from 0 to 1, and that the
  plateau shrinks to nothing at the critical point. Recompute: IAPWS-IF97 regions 1, 2 and 4.
  Check: dP_sat/dT from region 4 against h_fg/(T v_fg) from regions 1 and 2 (Clapeyron), and
  v = v_f + x v_fg against the mass-weighted mixture.
- `interpolate`: the table a student reads, generated from IF97 at the printed spacing, against the
  exact value. Shows where linear interpolation is fine (superheated vapour far from the dome) and
  where it is not (near saturation, near the critical point), including double interpolation.
  Recompute: the interpolation as a student does it. Check: IF97 at the same state.
- `ideal`: water's compressibility factor Z = Pv/RT over (P, T). Shows that steam is nearly ideal
  at low pressure and high temperature, and far from it near the dome. Recompute: Z from IF97.
  Check: the generalised compressibility (Lee–Kesler) as a second opinion, agreeing within a few
  percent away from the critical point.

**Unit 4. Closed systems** (Ch 4)

- `piston`: a piston–cylinder with a process the student picks: constant P, constant V, isothermal,
  or polytropic Pv^n = C. Shows that boundary work is the area under the path, so two paths between
  the same states do different work. Recompute: the closed form for each process. Check: the
  trapezoid integral of P dv along the drawn path, and closure of Q − W = ΔU with u from IF97 or the
  ideal-gas model.
- `cp-cv`: heating air at constant volume and at constant pressure. Shows that c_p − c_v = R, and
  when a constant c_p is good enough. Recompute: Δh and Δu from the NASA polynomials. Check: Δh by
  quadrature of c_p(T) against the polynomial's closed-form h, and against c_p,avg ΔT (the book's
  average-specific-heat method).

**Unit 5. Control volumes** (Ch 5: mass and energy balances; nozzles, diffusers, pipe flow)

- `nozzle`: a steady nozzle or diffuser with inlet and exit states. Shows that a small enthalpy drop
  gives a large velocity (the factor of 1000 between kJ/kg and m²/s²), and that ṁ = ρAV fixes the
  area. Recompute: h₁ + V₁²/2 = h₂ + V₂²/2 and the mass balance. Check: for an ideal gas, the same
  exit from the isentropic relations in `subjects/thermo` (shared with the rocket's Nozzle page);
  for steam, from IF97 with the exit state found by Newton iteration.
- `devices`: turbine, compressor, throttle, mixing chamber, heat exchanger and heated pipe, one at a
  time. Shows that a throttle keeps h constant yet cools steam and not an ideal gas, and that in pipe
  flow the KE and PE terms are usually small next to Δh. Recompute: the device's mass and energy
  balance. Check: the residual of both balances is zero, and the throttle's temperature drop
  against the integrated Joule–Thomson coefficient from IF97.

**Unit 6. The second law** (Ch 6: heat engines, refrigerators and heat pumps, Carnot)

- `carnot`: a Carnot engine, refrigerator or heat pump between two reservoirs. Shows that the limits
  depend only on T_L/T_H in kelvins, that COP_HP = COP_R + 1, and what a ratio in Celsius gets wrong.
  Recompute: η = 1 − T_L/T_H and the COPs. Check: run an ideal-gas Carnot cycle (two isotherms, two
  adiabats), integrate P dv for W_net and take W_net/Q_H.
- `claims`: an inventor's engine, refrigerator or heat pump with stated Q and W. Shows how to call a
  device reversible, irreversible or impossible. Recompute: compare η or COP with the Carnot limit.
  Check: the sign of the Clausius integral ∮δQ/T on the same data.

**Unit 7. Entropy** (Ch 7: entropy, isentropic processes, isentropic efficiencies)

- `ts`: the T–s diagram of water with processes drawn on it. Shows that the area under a reversible
  path is the heat, and that a real expansion moves right of the isentropic line. Recompute: s from
  IF97. Check: ∫dh/T along a constant-pressure path by quadrature against the change in s.
- `efficiency`: a turbine, compressor or nozzle with isentropic efficiency η. Shows that lower η
  means a hotter exit and more entropy generated. Recompute: the actual exit from the isentropic exit
  and η. Check: s_gen from the entropy balance is never negative and is zero only at η = 1; for air,
  T₂s from T₁(P₂/P₁)^{(k−1)/k} against the variable-specific-heat route with P_r.
- `generation`: heat crossing a wall between two temperatures. Shows that entropy generation goes to
  zero as the temperature difference does. Recompute: S_gen = Q(1/T_L − 1/T_H). Check: the sum of
  the reservoirs' entropy changes against the entropy balance on the wall.

Problem types per chapter:

| Chapter | Templates | Answers |
|---|---|---|
| 1 | gauge and absolute pressure; manometers and barometers; temperature scales and differences; unit conversions | num |
| 2 | forms of energy; mechanical and shaft work; first law for a closed system; efficiencies of devices and chains | num, tf |
| 3 | phase from (P, T) or (P, v); quality and mixture properties; interpolation; ideal-gas state; compressibility | num, mc |
| 4 | boundary work for each process; energy balance for rigid tanks and piston–cylinders; Δu and Δh of ideal gases; incompressible substances | num |
| 5 | mass balance; nozzles and diffusers; turbines and compressors; throttles; mixing chambers; heat exchangers; pipe and duct flow | num |
| 6 | thermal efficiency and COP; Carnot limits; reversible, irreversible or impossible | num, mc |
| 7 | Δs of pure substances, ideal gases and incompressible substances; isentropic processes; isentropic efficiencies; entropy generation | num, tf |

Answers that come from a property table grade against the IF97 value with the course's tolerance.
The class reads printed tables, so a worked solution shows the interpolation from the generated
table and also states the exact value. This is STA 3032's `alt` rule: exact and table value both
accepted.

Shared code: **`subjects/thermo`, new**, pure functions in SI with no DOM, so the rocket engine's
analysis code can import it (Phase A1 writes the same library; whichever starts first creates the
folder, and the other adds files):

- `if97.js`: IAPWS-IF97 regions 1, 2 and 4 (region 3, near the critical point, in a later PR; until
  then a state there says so instead of returning a number). Selftest: the verification values
  printed in the IAPWS-IF97 release, to the digits it gives.
- `steam.js`: saturation tables by T and by P, superheated and compressed-liquid tables, generated
  from IF97 at the spacing a printed table uses; state lookup from any two of P, T, v, u, h, s, x.
  Selftest: round trips, and the consistency checks (h = u + Pv; Clapeyron; s and v as the
  derivatives of g, by finite differences).
- `idealgas.js`: NASA 7-coefficient polynomials for N₂, O₂, Ar, CO₂, H₂O and air; c_p, h, u, s°, P_r
  and v_r. Selftest: c_p against the numerical derivative of h, s° against ∫c_p/T dT by quadrature,
  values at 298.15 K against the polynomials' source.
- `interp.js`: single and double linear interpolation as a student does it.
- `flow.js`: steady-flow device balances; `cycles.js`: Carnot limits and the ideal-gas Carnot
  cycle; `isentropic.js`: the ideal-gas isentropic relations (with Phase A1's area–Mach and choked
  flow beside them).
- Units: a shared `subjects/src/convert.js` with exact definitions (1 ft = 0.3048 m,
  1 lbm = 0.45359237 kg, 1 lbf = 1 lbm × 9.80665 m/s², 1 Btu = 1055.05585262 J, 1 R = 5/9 K) and
  derived ones (psi, slug, ft·lbf, hp). Selftest: round trips and the derived values. The mechanics
  courses use it too.

R-134a, which refrigerator and heat-pump problems use, comes from an equation of state in a
later PR (D10, answered). Until that PR, those problems use water and air.

#### Order of work

One branch and one PR each. Each merges and deploys alone. Every PR keeps all courses' checks green.

1. **This plan, and the hub entries** (EGN 3321 and EGN 3331 in Mechanics, a Thermal-fluids card
   with EML 3100, all "not built yet").
2. **Engineering shell move.** Done. Statics' HUD, practice panel, styles and FBD drawing are in
   `packages/shells/engineering/`; Statics is on thin wrappers; AGENTS.md names the shell.
3. **Shell additions behind flags.** Done. The Notes tab appears when the course passes notes, and
   `stage.js` mounts a `plot2d` canvas in place of the three.js stage. Statics passes neither, so its
   header and picture stay as they were. A fixture course in the shell's test exercises both.
4. **`subjects/src/convert.js` with its selftest.** Done. Exact foot, pound-mass, pound-force, Btu, and
   rankine, and the derived psi, slug, ft·lbf, and horsepower. Round trips, and the derived values
   checked from the definitions a second way.
5. **Dynamics first slice.** Done. `courses/egn3321` on port 5181: manifest, catalog of all seven
   units (unbuilt labs listed as `coming`), PROVENANCE.md, CONVENTIONS.md (three significant figures,
   both unit systems, the sections left out), the hub href, prereqs, and the hub backup. Unit 1 is
   complete: `rectilinear`, `path-nt`, `relative`, the §1.3–1.6 and Ch 12 problems, Unit 1 notes,
   and `mechanics/path.js`. Merge and deploy.
6. **Dynamics, one PR per unit.** Unit 2 is done: `fma`, `curve`, the Ch 13 problems, and Unit 2 notes. Unit 3 is done: `collar`, `paths`, the Ch 14 problems, and Unit 3 notes. Unit 4 is done: `impulse`, `impact`, `rocket`, the Ch 15 problems, and Unit 4 notes. Unit 5 is done: `ic`, `slider-crank`, `rolling`, the Ch 16 problems, Unit 5 notes, and `rigid2d.js`. Unit 6 is done: `inertia`, `pendulum`, `roll-slip`, the Ch 17 problems, Unit 6 notes, and `inertia.js`. Unit 7 is done: `race`, `linkage`, the Ch 18 problems, Unit 7 notes, and `rigid-energy.js`. Next is the Mechanics of Materials first slice. Each PR carries that unit's labs, problems, notes and selftests.
7. **Mechanics of Materials first slice:** the same skeleton with all ten units, Unit 1 complete
   (`cut`, `truss-stress`, `pins`, Ch 1 problems, notes, `materials.js` started). Merge and deploy.
8. **Mechanics of Materials, one PR per unit:** Units 2 to 10, in the pack's order.
9. **`subjects/thermo` base:** `if97.js` (regions 1, 2, 4), `steam.js`, `idealgas.js`, `interp.js`
   and their selftests. If Phase A1 step 2 has already created the folder, this PR adds to it.
10. **Thermodynamics first slice:** the skeleton with all seven units, Unit 1 complete (`manometer`,
    Ch 1 problems, notes) and the Thermal-fluids card's href. Merge and deploy.
11. **Thermodynamics, one PR per unit:** Units 2 to 7. Unit 3 is the largest (three labs on IF97).
12. IF97 region 3, then R-134a from its equation of state (D10).
13. `prereqs` links into and out of the three courses, and the applications links.

Steps 5–6, 7–8 and 9–11 are independent once the shell (2–3) is in. D8 builds Dynamics first.

**Exit for each course:** every unit has its labs, problems and notes; all checks pass; it is live
on the hub; its PROVENANCE.md says what it contains and that the course packs set only coverage and
order.

### Phase R: rework every course to the standard (except PHY 2049)

Decided 17 Oct 2026: the courses other than PHY 2049 feel half-built, and a review confirmed why
(`docs/COURSE-STANDARD.md`, section 1). New units stop until the platform can carry PHY 2049's
practice loop, and every course is then reworked to one written bar.

**Rules.** `docs/COURSE-STANDARD.md` is the bar. Nothing touches `courses/phy2049` before 24 Oct 2026.
The course in progress when this was decided (Mechanics of Materials) stops at its first slice: `courses/egn3331` on port 5182, Unit 1 (stress: the `cut`, `truss-stress` and `pins` labs, 11 problems, notes) and the other nine units listed as coming.

1. **R0, the scorecard.** `npm run scorecard` measures every course against the standard's section 6
   and prints a table. Manifests gain `standard: false`; CI fails only for courses marked `true`.
2. **R1, the practice loop in the shells.** Port PHY 2049's principle step, fading, coaching with
   per-answer `why` and `traps`, interleaving and the weak-principle list, the notes link, the lab
   drawer, the symbolic palette (engineering shell) and the number pad into both shells, as copies.
   Each feature turns on when a course supplies its data. Tests for each, run against a small
   fixture course.
3. **R2, the pilot: Dynamics (EGN 3321).** The owner takes it next term and it is the closest to the
   bar. Principle list and tags, `why` and `traps` on every template, structural variety and designed
   numbers, conceptual share, application labs (one per unit), notes to 5,000 words per unit with lab
   setups, OCW worked cases. Then the owner's review (standard, section 7) and `standard: true`.
   Dynamics becomes the template other courses copy.
4. **R3, next term's other courses to the bar:** Thermodynamics (EML 3100), then Mechanics of
   Materials (EGN 3331), each unit built to the standard from the start.
5. **R4, the review courses:** Calc I, Calc II, Calc III (no notes yet), Statics (no notes yet). Redo the
   problem banks for structural variety and designed numbers (replace the range-widened templates),
   add conceptual problems, symbolic answers, traps and principles; add application labs and notes.
6. **R5, PHY 2048** after 24 Oct, built to the standard on the physics shell.
7. **STA 3032** last: the owner does not use it. Keep it passing its checks; rework only on request.

**Exit:** every course except STA 3032 is `standard: true` in its manifest, and the scorecard passes
in CI.

### Phase 9 and on

- **Math:** MAP 2302 differential equations after MAC 2313.
- **Thermal-fluids:** fluid mechanics, then heat transfer, on `subjects/thermo`.

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
| D5 | Course codes and terms | **Decided:** Statics is EGN 3311. MAC 2313 was taken Spring 2026. EGN 3321 Dynamics, EGN 3331 Mechanics of Materials and EML 3100 Thermodynamics are the codes on the owner's course packs (15 Oct 2026). Other codes are confirmed when each course is started. | |
| D6 | STA 3032 provenance | **Decided 13 Oct 2026:** not asked, so the instructor's material (rewritten notes, review-sheet set, worked cases and lab presets from the notes) was removed. Recorded in `courses/sta3032/PROVENANCE.md`. | |
| D7 | Source for Calc I, Calc II, Physics I | **Default:** OpenStax (CC BY 4.0): Calculus Vol 1 and 2, University Physics Vol 1, cited by section. Switch to the UNF course texts if the owner prefers; confirm PHY 2048's chapter list against the UNF syllabus. | |
| D8 | Terms and exam dates for EGN 3321, EGN 3331, EML 3100 | **Decided 15 Oct 2026:** Dalton takes all three next term. Dynamics is built first. Dates go into each unit when he has them. | |
| D9 | Textbook numbers in worked cases (Hibbeler, and the thermodynamics text) | **Decided 15 Oct 2026:** generated numbers, cited by textbook section. No textbook example number is copied or invented. | |
| D10 | R-134a properties for refrigeration problems | **Decided 15 Oct 2026:** the Tillner-Roth & Baehr equation of state, in a later Thermodynamics PR. Water and air until then. | |
| D11 | Sections the course packs do not name | **Decided 15 Oct 2026:** follow the course packs' coverage, and keep Dynamics' rocket lab (§15.9). | |
| D12 | What comes after Dynamics | **Decided 18 Oct 2026:** Thermodynamics first, its property library before its screens, then Mechanics of Materials. | |
| D14 | EGN 3331 textbook | **Decided 18 Oct 2026:** Roylance, *Mechanics of Materials* (MIT OpenCourseWare 3.11, CC BY-NC-SA 4.0), cited by section through `courses/egn3331/src/data/textbook.js`. Topics the modules do not treat are cited by topic. Nothing copied. | |
| D13 | EML 3100 textbooks | **Decided 18 Oct 2026:** Yan, *Introduction to Engineering Thermodynamics* (BCcampus, CC BY-NC-SA 4.0), and OpenStax *University Physics Volume 2* Ch 1–4 (CC BY 4.0). Topics past Yan Ch 6 cited by topic until a source is chosen. One citation map, `courses/eml3100/src/data/textbook.js`. Nothing copied. | |

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
