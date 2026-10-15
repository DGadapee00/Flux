# FLUX

This repo is the study platform. Each course is a module. `PLAN.md` is the order of work. Finish a phase only when its exit test passes, and leave the next phase unstarted.

The rules in `PLAN.md` section 3 are binding. This file is those rules as they apply to the code, plus the conventions already shared by flux-phy2049, flux-mac2313, statics-sim, and stats.

## Read-only sources

Copy from the four course repos. Platform work leaves them, and their live sites, as they are. A course in the middle of its semester keeps its current site until the module here has passed parity (`PLAN.md` section 5). Cutover waits until after the final unless parity is proven and the owner chooses to switch.

Pinned commits, from the plan: flux-phy2049 `15f8687`, flux-mac2313 `bdeef1b`, statics-sim `6ce522e`, stats `5ee9103`.

This repo is public. Raw course files (PDFs, slides, Canvas exports) may sit only in a course's `incoming/` folder, and only when that course's `PROVENANCE.md` records the instructor's permission (PHY 2049 has it). They never ship: the build fails if anything raw or from `incoming/` is in the built site. Student names, grades and submissions never enter the repo. The prose that ships is rewritten notes.

PHY 2049's weekly content drop runs here now. The Canvas ingest Action writes to `courses/phy2049/incoming/`; the Sunday notes run follows `courses/phy2049/CLAUDE.md`. Platform work leaves `incoming/` and `.canvas-state.json` alone.

## Layout

```
packages/core        engine contracts. No course knowledge.
packages/subjects    shared domain math, pure functions and a selftest each
packages/shells      course-family UI: HUD, practice panel, styles. No course and no chapter.
packages/checks      dependency-direction check
courses/<id>         one folder per course, once it is ported
site                 the Vite hub
```

Dependency direction is one way: `courses → shells → subjects → core`.

- `packages/core` imports neither a subject, a shell, nor a course. It contains no course id, course code, chapter number, constant, or textbook name. A hook core needs goes on `defineCourse`, `defineLab`, or `problem`.
- A subject may import core. A subject imports no shell and no course. `subjects/src/convert.js` is the exact foot, pound-mass, pound-force, Btu, and rankine conversion, plus the derived psi, slug, ft·lbf, and horsepower. The mechanics and thermal courses share it.
- A shell may import core and subjects. A shell imports no course. A shell names no course and no chapter; the course passes its catalog, bank, and code in. `packages/shells/math` is the calculus HUD. `packages/shells/engineering` is the mechanics HUD, practice panel, styles, and free-body drawing. Statics reaches that shell through the thin wrappers in `courses/statics/src/ui/`. The Notes tab is shown only when the course passes notes, and `stage.js` mounts a `plot2d` canvas in place of the three.js stage. A course that uses either one imports `styles/notes.css` or `styles/stage.css`.
- A course may import core, subjects, and shells. A course imports no other course.
- The site may import core, subjects, and courses. It is the registry.

`packages/checks/deps.mjs` fails `npm test` when an import points the wrong way, and when a file under `packages/core` or `packages/shells` names a course. A chapter literal in a shell fails the same check.

## Stack

Vite 6, `base: './'`, `target: esnext`. Vanilla JS, ES modules. KaTeX 0.16. three.js 0.172 for the 3D labs. STA 3032's labs are 2D canvas and do not use three.js. No framework. No TypeScript build. The contracts carry JSDoc.

Node's built-in test runner. There is no test framework to add.

The hub's dev server is port 5173. PHY is 5174, MAC 2313 is 5175, Statics is 5176, STA 3032 is 5177, MAC 2311 is 5178.

Publishing is a Cloudflare Pages direct upload (`npm run deploy`). A green commit is a snapshot on `main`. The live hub moves when someone uploads. See `DEPLOY.md`. The project name is `flux-study`, because `flux.pages.dev` is an unrelated site.

## Contracts

`defineCourse`, `defineLab`, and `problem` live in `@flux/core`. They are identity checks until Phase 2 moves the engine here. Call them by those names anyway.

A course manifest is the object in `PLAN.md` section 4: `id`, `code`, `title`, `subject`, `term`, `units`, `chapters`, and lazy `labs`, `problems`, optional `sets`, `notes`, `formulas`, `ingest`. The `id` is the route segment and the storage namespace. It is lowercase letters and digits, starting with a letter.

`defineLab` has two shapes already in the wild:

- scene3d (PHY, MAC, Statics): `init`, `enter`, `recompute`, `syncViews`, scenarios, controls.
- plot2d (STA): `compute(state, rng)`, `draw`, `predictions`. `compute` is pure. The seeded generator is the only source of randomness, so a picture can be replayed.

`problem({ id, exam, ch, lab, src, vars, derive, text, parts, hints, steps, sim })` with `range`, `choice`, `num`, `mc`, `tf`, `sym`, `self`, `kase`. The fields every bank already shares are the defaults in `problem()`.

Routes in the course apps are `#/<unit>/<mode>/<lab>`. On the platform that becomes `#/<course>/<unit>/<mode>/<lab>`. Old hashes redirect when that course is brought in.

Storage keys are `flux.<course>.<key>.v<n>`. PHY keeps `flux.problems.v1` and `flux.exam.v1`. Statics uses `flux-statics.problems.v1` and `flux-statics.exam.v1`. MAC 2313 keeps `flux-mac2313.problems.v1` and `flux-mac2313.exam.v1`. STA 3032 keeps `fluxstats.problems.v1`, `fluxstats.exam.v1`, and `fluxstats.labs.v1`. `packages/checks/storage.mjs` fails when two courses share a key. Progress export and import is JSON, so a move between domains keeps the review queue. Browser progress on flux-stats.pages.dev stays there until that export exists.

## Checks

`npm test` at the repo root runs every workspace test, including the dependency check. A module with a failing check does not ship. `npm run build` must succeed.

Mobile first. 380px portrait is the design width. No horizontal scroll. Phone inputs are at least 16px, because a smaller input makes Safari zoom the page. Smoke covers 380px and 1280px. STA's overflow check opens every revealed solution at 380px and fails when an equation is wider than the column. Displayed equations wrap (`fitMath`). A single root or fraction that still cannot wrap is split into steps by hand.

Every number on screen is computed, then checked. Each subject library has a selftest. A worked case reproduces a printed answer by a second method, so the check is against a different calculation.

Checks each course already runs, which the port keeps:

- PHY 2049: tex-check, physics selftest, problems-check, notes-check, derive-check. `scripts/smoke.mjs` and `scripts/gallery.mjs` need the dev server on 5174.
- MAC 2313: tex-check, math selftest, problems-check. Analytic partials against differences, Fubini both orders, Jacobians included.
- Statics: tex-check, statics selftest, problems-check. The residual of ΣF = 0 and ΣM = 0, joints against sections, composite parts against integration.
- STA 3032: stats-check, tex-check, problems-check, labs-check, route test. `npm run overflow` and smoke on 5177. Smoke fails when a page is wider than a 380px phone.

TeX inside a JS string is a `String.raw` template. tex-check fails when a backslash is eaten.

## Conventions that belong to a course

These stay with the course (its `CONVENTIONS.md` once the course is ported). They are recorded here so a port does not flatten them into core, and does not drop them.

### PHY 2049

Notes are rewritten, one file per exam, in the structure of `e4-charge-in-motion.html`: eyebrow, h1, lede, legend, toc, parts, `section.topic` numbered s1, s2, boxes `ex` (worked example), `why` (derivation), `fix` (a correction), `key`. Math in the notes files is `\( \)` and `\[ \]`, typeset by KaTeX. `$` is a delimiter in problem prose. It is never a delimiter in the notes files.

Voice for those notes: short declarative sentences, about 15 words. Periods, colons, and lists. Derive a rule. Recompute every worked answer. Where the source is wrong, give the correct version and a `box fix` that says what the original said. A silent correction is a bug. A `box fix` names something a student would get wrong by trusting the source. Slides are not copied, and source images are not included.

Keep the class's own examples and their labels. Colour in the labs is one quantity, one colour: E yellow, B teal, current gold, force pink, velocity white, positive charge red, negative charge blue. In the panels, yellow is the one primary button, blue means selected, and green and red appear only when an answer is graded.

The weekly Canvas drop stays in flux-phy2049 until Phase 6. Homework and quizzes are draft ideas in a run report. An automated run adds a problem only for a new application lab, and only for a device the source names, whose working the course equations fully explain.

### MAC 2313

Notation follows Merino. Points are (x, y) and (x, y, z). Curves are γ(t). The directional derivative is D_u f with a unit vector. θ is in [0, 2π). The cross product is only in R³.

### Statics

Hibbeler, chapters 2–10. The second opinion is equilibrium about every point, reported as a residual. US customary units, when Statics is ported, go in `subjects/mechanics`, where the next mechanics course can use them. The bank's worked cases carry textbook numbers. Publishing that build is a provenance decision, spelled out before the files move.

### STA 3032

The class works on a TI-84. Quartiles are the median of each half, and the median is excluded when n is odd. s uses n − 1. Regression is written ŷ = a + bx, with a the intercept and b the slope.

Printed tables are data. A worked solution quotes the printed value. Grading accepts the exact value and the table value (`alt`). p-values are the calculator's exact values (tcdf, normalcdf, and the rest). Welch's df is the calculator's fractional value. The table's rounded-down df is also accepted. Normal approximation for a binomial, a sample proportion, or a proportion test requires np(1 − p) ≥ 10, and counts use a continuity correction. A normal probability plot puts z_i = Φ⁻¹((i − 0.5)/n) on the x-axis and the sorted data on the y-axis. Table A.6 prints only α = 0.05 and 0.01, so an F interval read from that table is 90% or 98%.

A worked case may break a condition that generated versions must meet. That condition goes in `sampleValid`. `valid` stays the rule for generated versions.

Cite a source by section (Walpole §5.2). Textbook example numbers are never invented. Nothing from the STA 3032 instructor's notes or review sheets goes in (rewritten notes, worked cases, lab presets) until they have been asked and said yes: see `courses/sta3032/PROVENANCE.md`.

A 2D lab earns its place when moving a parameter corrects an intuition. Each has two to four predictions. `outcome(before, after)` is derived from the lab's own results, and labs-check requires it to equal `expect`. Numbers quoted in a prediction's `why` are recomputed when a preset changes.

STA 3032 has no Notes mode (removed 13 Oct 2026).

Prose uses `$…$` and `$$…$$`. Money is written "dollars", because a bare `$` starts math.

## Voice

Notes and course prose use short declarative sentences. Say a thing once. Recompute the number before writing it down.
