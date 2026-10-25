# Physics shell (Phase 2b) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Move PHY 2049's reusable UI into `packages/shells/physics/`, one piece per task, with PHY 2049 unchanged to a student.

**Architecture:** Each shell module takes course data as arguments, the way `packages/shells/engineering/hud.js` takes its `catalog`. PHY 2049 keeps `main.js` and a thin wrapper per module (EGN 3321's wrappers are 12 to 50 lines). A new compare tool (Task 0) is the gate: it proves each move changed nothing a student can see.

**Tech Stack:** Vanilla JS modules, Vite 6, Node 22 built-in test runner, borrowed Playwright 1.63 (not a dependency; `scripts/playwright.mjs` finds it), KaTeX, three.js 0.172.

**Spec:** `docs/superpowers/specs/2026-10-24-physics-shell-phase-2b-design.md`. Read it first.

## Global Constraints

- The shell names no course and no chapter. `packages/checks/deps.mjs` fails on `phy2049`, `PHY 2049`, `Hibbeler`, `Walpole`, `Merino`, `Montgomery`, a quoted `'ch3'`, `Chapter 3` or `Ch 3` anywhere under `packages/shells` or `packages/core`.
- Imports run `courses → shells → subjects → core`. A shell may import another shell and `@flux/core`.
- A missing control becomes a shell hook behind a flag, with a test on the shell's fixture (`packages/shells/test/`).
- Storage keys do not change: PHY 2049 keeps `flux.problems.v1` and `flux.exam.v1`.
- Phone first: 380 px portrait, no sideways scroll, inputs at least 16 px (rule 10). Look at the 380×820 and 1280×800 screenshots yourself.
- Every course's checks stay green after every task. `npm test` and `npm run build` pass. Never set `standard: true`.
- Develop on branch `claude/sharp-lovelace-iv2atn`. One task is one commit group and one PR's worth of change. Do not open a PR unless the owner asks.
- Voice in any prose you write: short declarative sentences, no em dashes, no filler.
- Commit messages end with the two trailer lines the session gives (Co-Authored-By and Claude-Session).
- Browser steps need PHY 2049's dev server: `npm run dev -w @flux/phy2049` (port 5174). `$SCRATCH` below is the session scratchpad directory.

## Review Focus

1. **Saved progress survives.** A student's localStorage keys must be the same set before and after each move. Task 0 captures them; every later task's gate compares them.
2. **Stylesheet order.** Moving CSS from `<link>` tags to JS imports can reorder the cascade, and `mobile.css` must still win on phones. Pinned by the 380×820 screenshots in Task 1.
3. **A course that lacks an optional piece.** PHY 2048 may have no derivations, no predictions or no units table. Every shell module must no-op, not throw, when its optional hook or element is absent. Pinned by a "hooks omitted" test in Tasks 2, 3 and 4.
4. **Deep links.** `#/e2/gauss?p=<problem>&s=<step>` and `?n=<section>` must open the same state after each move. Pinned by captures that load such URLs (Task 0).
5. **Chrome built too late.** `main.js` and the modules read element ids at start-up. If `renderChrome` runs after them, ids are missing. Pinned by the id-coverage test in Task 2.

---

### Task 0: The comparison gate

**Files:**
- Create: `courses/phy2049/scripts/compare-lib.mjs`, `courses/phy2049/scripts/compare-lib.test.mjs`, `courses/phy2049/scripts/compare.mjs`
- Modify: `courses/phy2049/package.json` (add script `"compare": "node scripts/compare.mjs"`; append `&& node --test scripts/compare-lib.test.mjs` to `test`)

**Interfaces:**
- Produces, in `compare-lib.mjs` (pure, no DOM, no Playwright):
  - `domSignature(root: Element): string[]` — one line per element in document order: `tag#id.class1.class2[attr=value,…]` indented by depth, with attributes sorted by name, skipping `script` and `style`, and appending ` "text"` for an element's direct text (trimmed, collapsed whitespace). Self-contained (no closures over module state) so `compare.mjs` can serialise it with `Function.prototype.toString` into the page.
  - `diffLines(a: string[], b: string[]): string[]` — one message per line that was added, removed or changed, at most 40.
  - `changedRatio(a: Uint8ClampedArray, b: Uint8ClampedArray, channelTol?: number): number` — fraction of pixels (RGBA groups) where any of R, G, B differs by more than `channelTol` (default 8). Throws if lengths differ.
  - `TOLERANCE: number` — the largest `changedRatio` accepted between two captures of the same commit.
- Produces, in `compare.mjs`: `node scripts/compare.mjs --save <dir>` and `node scripts/compare.mjs --against <dir>`.

- [ ] **Step 1: Write the failing tests** in `compare-lib.test.mjs` (`node:test`, `node:assert/strict`):
  - `changedRatio is 0 for identical buffers`
  - `changedRatio counts a pixel once however many channels differ`: two pixels, the second differing in R, G and B by 100, expects `0.5`.
  - `changedRatio ignores a channel difference within the tolerance`: difference of 8 gives `0`, difference of 9 gives `> 0`.
  - `changedRatio throws on different lengths`
  - `diffLines reports an added, a removed and a changed line`: `['a','b']` against `['a','c','d']` yields messages mentioning `b`, `c` and `d`.
  - `domSignature lists tag, id, classes and sorted attributes in order, skipping script and style`: build a fake tree of plain objects with `tagName`, `id`, `className`, `attributes` (array of `{name,value}`), `childNodes` (nodes with `nodeType` 1 or 3, `textContent`) and assert the exact output lines.
- [ ] **Step 2: Run** `node --test courses/phy2049/scripts/compare-lib.test.mjs`. Expected: FAIL, module not found.
- [ ] **Step 3: Implement** `compare-lib.mjs` to the signatures above. Export `TOLERANCE = 0.001` for now.
- [ ] **Step 4: Run the tests again.** Expected: all pass.
- [ ] **Step 5: Implement `compare.mjs`.** It borrows Playwright via `./playwright.mjs`, as `smoke.mjs` does, and takes `--save <dir>` or `--against <dir>`. For each viewport in `[1440×900, 380×820]` it:
  1. loads `http://localhost:5174/#/e1/vectors` and waits for `window.__gauss?.state?.lab`;
  2. for every unit and lab in `/src/data/catalog.js` (`EXAMS`), and every option of `#scenario`, waits for the camera tween (1300 ms, as `gallery.mjs` does) and saves a PNG named `<viewport>-<unit>-<lab>-<scenario>.png`;
  3. in each of the three modes (click `#btn-practice`, `#btn-notes`, `#btn-explore`), records `domSignature(document.getElementById('app'))`;
  4. loads one practice deep link and one notes deep link and records their DOM signatures. Find a real problem id in `src/problems/index.js` and a real section id in `src/notes/index.js` to use;
  5. records `Object.keys(localStorage).sort()` after the practice mode has opened, and `document.documentElement.scrollWidth <= window.innerWidth` at 380 px.
  
  `--save` writes the PNGs and a `manifest.json` of the DOM signatures, keys and overflow flag into `<dir>`. `--against` captures into `<dir>.new`, loads the PNGs back into a canvas in the page to get pixel data for `changedRatio`, and exits 2 on any DOM difference, key-set difference, overflow, or ratio above `TOLERANCE`. It prints a table of the worst five ratios.
- [ ] **Step 6: Measure the noise.** With the dev server up: `npm run compare -w @flux/phy2049 -- --save $SCRATCH/noise-a`, then `--against $SCRATCH/noise-a`. Set `TOLERANCE` to twice the largest ratio reported, and never below `0.0005`. Run `--against` once more and confirm exit 0.
- [ ] **Step 7: Prove it can fail.** Edit a CSS colour in `src/styles/main.css`, run `--against`, confirm exit 2 and a named screenshot, then `git checkout` the file.
- [ ] **Step 8: Run `npm test` and commit** (`Add compare gate for the physics shell move`).

---

### Task 1: Shell skeleton, one `shared.js`, generic helpers, styles

**Files:**
- Create: `packages/shells/shared.js` (moved with `git mv` from `courses/phy2049/src/ui/shared.js`), `packages/shells/physics/shared.js`, `packages/shells/physics/format.js`, `packages/shells/physics/plot.js`, `packages/shells/test/physics-shared.test.js`
- Move: `courses/phy2049/src/styles/{main,practice,mobile}.css` → `packages/shells/physics/styles/` (`git mv`)
- Modify: `packages/shells/engineering/shared.js` and `packages/shells/math/shared.js` (each becomes `export * from '../shared.js';`), `packages/shells/package.json` (exports gain `"./physics/*": "./physics/*"`), `courses/phy2049/src/ui/shared.js`, `ui/format.js`, `ui/plot.js`, `courses/phy2049/src/main.js`, `courses/phy2049/index.html`

**Interfaces:**
- Produces: `@flux/shells/physics/shared.js` (same names as today's `ui/shared.js`: `tex, mathText, mathProse, escapeHTML, eq, prose, kv, qv, cells, matchClass, setLawEl`).
- Produces: `@flux/shells/physics/format.js` exporting `sciHTML(x, digits = 2): string`, `sciTex(x, digits = 2): string`, `sciText(x, digits = 2): string`, `signedSci(x, digits = 2): string`, moved unchanged from `ui/format.js`.
- Produces: `@flux/shells/physics/plot.js` exporting `PLOT_COLORS` (the colour constants now private at the top of `ui/plot.js`: `BLUE, YELLOW, GOLD, CURRENT, CAP, MARK, RED, WHITE, SERIF`, as keys of one object), `setupCanvas(canvas)`, `drawAxes(ctx, w, h, y0, nTicks)`, `drawDot(ctx, x, y, color)` (the private `setup`, `axes`, `dot`, renamed and exported, bodies unchanged).
- Produces: `@flux/shells/physics/styles/{main,practice,mobile}.css`.

- [ ] **Step 1: Save the base capture.** At the task's starting commit, with the dev server up: `npm run compare -w @flux/phy2049 -- --save $SCRATCH/base-1`.
- [ ] **Step 2: Write the failing test** `physics-shared.test.js`:
  - `every shell exposes the one shared module`: for each name in `Object.keys` of `../shared.js`, `../engineering/shared.js`, `../math/shared.js` and `../physics/shared.js` all hold the same value; at least 8 names.
  - `sci formatters`: `sciHTML(1234.5)` is `1.23×10<sup>3</sup>`; `sciTex(2.3e-4)` is `2.3\times 10^{-4}`; `sciText(3.14e-7)` is `3.14 × 10⁻⁷`; each returns `—` or `-` for `NaN` as the current code does, and `0` for `1e-20`.
  - `plot helpers are exported`: `typeof setupCanvas`, `drawAxes`, `drawDot` are `function`; `PLOT_COLORS.RED === '#FC6255'`.
- [ ] **Step 3: Run** `npm test -w @flux/shells`. Expected: FAIL, modules not found.
- [ ] **Step 4: Implement.** Move `shared.js` and make the three shells re-export it. Create `physics/format.js` and `physics/plot.js`. Update PHY 2049's `ui/format.js` (keep the `fmt*` electromagnetic formatters, import `sci*` from the shell and re-export them so existing importers work) and `ui/plot.js` (import the helpers and colours from the shell). Move the three stylesheets and replace the three `<link rel="stylesheet" href="/src/styles/…">` tags in `index.html` with imports at the top of `main.js` in the same order: `main.css`, `practice.css`, `mobile.css`, after the KaTeX import.
- [ ] **Step 5: Run** `npm test` (root). Expected: all workspaces pass, including `deps.mjs`.
- [ ] **Step 6: Run the gate.** `npm run build`, then `npm run smoke -w @flux/phy2049`, then `npm run compare -w @flux/phy2049 -- --against $SCRATCH/base-1`. Expected: smoke passes, compare exits 0. Open the 380×820 screenshots and check the phone layout by eye.
- [ ] **Step 7: Commit** (`Physics shell: skeleton, one shared module, generic helpers, styles`).

---

### Task 2: Page chrome and units

**Files:**
- Create: `packages/shells/physics/chrome.js`, `packages/shells/physics/units.js`, `packages/shells/test/physics-chrome.test.js`, `packages/shells/test/physics-units.test.js`
- Modify: `courses/phy2049/index.html` (body shrinks to `<div id="app"></div>` plus the module script), `courses/phy2049/src/main.js` (call `renderChrome` first), `courses/phy2049/src/ui/units.js` (becomes a wrapper)

**Interfaces:**
- Produces: `renderChrome(app: HTMLElement): void` — writes the markup currently in `index.html`'s `#app` (canvas, header, panels, bottom sheet) with the same ids, classes and order.
- Produces: `CHROME_IDS: readonly string[]` — every id `renderChrome` writes.
- Produces: `createUnits(opts: { onOpen?: () => void, unitsForLab: (labId: string) => Quantity[], labMeta: Record<string, { title?: string }> }): { toggle(): void, close(): void, isOpen(): boolean, onLab(id: string): void }`. `Quantity` is today's `data/quantities.js` row. The old `QUANTITIES` import in `ui/units.js` becomes `opts.quantities` if that file reads it for anything other than `unitsForLab`; read the file and keep exactly what it uses.
- Consumes: Task 1's `physics/shared.js`.

- [ ] **Step 1: Save the base capture** as `$SCRATCH/base-2`.
- [ ] **Step 2: Write the failing tests.**
  - `physics-chrome.test.js`: `renderChrome writes every id in CHROME_IDS exactly once`; `renderChrome writes the three mode buttons in order Practice, Notes, Explore`; `every getElementById literal in packages/shells/physics/*.js is a chrome id or an id the shell itself creates` (read the source files with `fs`; keep the allowed list of self-created ids in the test as `OWNED_IDS`, starting empty; add ids only with a one-line reason).
  - `physics-units.test.js`: `units panel renders the rows for a lab` (stub `unitsForLab` returning one quantity with `sym: 'F'`, `name: 'force'`, `unit: 'N'`; opening the panel shows `force` and `N`); `units panel opens empty without throwing when a lab has no quantities` (Review Focus 3).
- [ ] **Step 3: Run** `npm test -w @flux/shells`. Expected: FAIL.
- [ ] **Step 4: Implement** `chrome.js` by moving the markup out of `index.html` (keep it character for character, including the comments), and `units.js` by moving `ui/units.js` and replacing its three data imports with `opts`. In `main.js`, call `renderChrome(document.getElementById('app'))` before any other statement that reads the DOM, including `document.getElementById('brand')`.
- [ ] **Step 5: Run** `npm test`, `npm run build`, `npm run smoke -w @flux/phy2049`, then `compare --against $SCRATCH/base-2`. The DOM signatures must match exactly. Expected: all pass, compare exits 0.
- [ ] **Step 6: Commit** (`Physics shell: page chrome and units reference`).

---

### Task 3: The HUD and the unit picker

**Files:**
- Create: `packages/shells/physics/hud.js`, `packages/shells/test/physics-hud.test.js`
- Modify: `courses/phy2049/src/ui/hud.js` (becomes a wrapper of about 40 lines), `courses/phy2049/src/main.js` only if the wrapper's signature changes (it should not)

**Interfaces:**
- Produces: `createHUD(api: object, catalog: PhysicsCatalog): { mount, update, setBlind }`, the same return as today. `api` is whatever `main.js` passes today.
- `PhysicsCatalog`:
  ```
  exams: Exam[]                          // the unit list (today EXAMS)
  examById(id: string): Exam | undefined
  examLabel(exam: Exam): string
  examLongLabel(exam: Exam): string
  examNote?(exam: Exam): string          // extra tooltip text; PHY 2049 puts the chapters here
  labMeta: Record<string, { title?: string, app?: boolean }>
  plots?: Record<string, (canvas: HTMLCanvasElement, plot: object) => void>
  labPanel?: { reset(): void }           // called where hud.js calls resetChargeListSig() today
  ```
- `plots` keys are the `plot.type` strings: `Vx`, `ac`, `vi`, `paschen`, `rc`. The wrapper builds each entry from `ui/plot.js`'s five functions, with the arguments the current `drawPlot` passes (`Vx` receives `plot.xs, plot.Vs, plot.xProbe, plot.xA`; `ac` receives `plot.power, plot.t`; the rest receive `plot`).
- Consumes: `@flux/core/scene3d/frame.js` for `sceneScale, workPlane, lenLabel, PLANE_AXES` directly (as `engineering/hud.js` does); `physics/shared.js`; `physics/format.js`.
- The shell's `hud.js` must not contain the strings `Ch ` or `exam.chapters`. The unit option's `title` attribute that prints `Ch ${e.chapters}` today becomes `examLongLabel(e)` plus whatever the course puts in a new optional `catalog.examNote?: (exam: Exam) => string` (PHY 2049 passes the chapters text there, so the tooltip is unchanged).

- [ ] **Step 1: Save the base capture** as `$SCRATCH/base-3`.
- [ ] **Step 2: Write the failing tests** in `physics-hud.test.js`, using `installDOM`, a `page()` built from `renderChrome` and the lab and `api` helpers in `flags.test.js`:
  - `the unit picker lists every unit with its label`
  - `a plot is drawn through the plots map`: a lab whose `plot()` returns `{ type: 'demo' }`, `catalog.plots.demo` a spy; after `hud.update(...)` the spy has been called once with the mini-plot canvas and that plot object.
  - `the HUD runs with no plots map and no labPanel` (Review Focus 3)
  - `labPanel.reset runs when a lab mounts`
  - `the unit option title comes from examNote`
- [ ] **Step 3: Run** `npm test -w @flux/shells`. Expected: FAIL.
- [ ] **Step 4: Implement** by moving `ui/hud.js` into the shell and replacing its data imports with `catalog` fields. The wrapper in `ui/hud.js` imports `EXAMS, examById, LAB_META, examLabel, examLongLabel` from `../data/catalog.js`, `resetChargeListSig` from `../labs/charges-ui.js`, builds `plots`, and returns `createHUD(api, {...})`. Keep `export { sciHTML }` in the wrapper because other files import it from there.
- [ ] **Step 5: Run the gate** as in Task 2, with `base-3`. Also run `npm run gallery -w @flux/phy2049` and look at three screenshots on the phone viewport by eye.
- [ ] **Step 6: Commit** (`Physics shell: HUD and unit picker`).

---

### Task 4: Predict and derive

**Files:**
- Create: `packages/shells/physics/predict.js`, `packages/shells/physics/derive.js`, `packages/shells/test/physics-predict.test.js`, `packages/shells/test/physics-derive.test.js`
- Modify: `courses/phy2049/src/ui/predict.js` and `ui/derive.js` (become wrappers)

**Interfaces:**
- Produces: `createPredict(api: object, deps: { predictionsFor: (labId: string) => Prompt[], store: { get(key: string): unknown, set(key: string, value: unknown): void }, run, outcomes, choices, matchesExpect, cloneState }): { sync, … }` — the same return as today. The last five are the functions in PHY 2049's `engine/predict.js`; the shell does not import a course. If `engine/predict.js` is byte-identical to `packages/shells/engineering/predict.js` apart from comments, import from the engineering shell instead and drop those five fields from `deps`; check with `diff` and note the result in the commit message.
- Produces: `createDerive(api: object, deps: { derivationsFor: (labId: string) => Derivation[], derivationById: (id: string) => Derivation | undefined, agrees: (d: Derivation) => boolean, colors: Record<string, number> }): { update, syncScene, open, close, isOpen }`. `colors` is today's `{ mark, I, B, white }` map; the wrapper builds it from `M` and `Q`.
- Consumes: `@flux/core/scene3d/manim.js` for `fatLine, disposeTree, M`.

- [ ] **Step 1: Save the base capture** as `$SCRATCH/base-4`.
- [ ] **Step 2: Write the failing tests.**
  - `predict is inert when a lab has no predictions` (hidden card, no throw)
  - `predict writes its tally through the store it is given`: answering a prompt calls `store.set` with the same key the current code writes (read `readTally`/`writeTally` for it and assert the key string).
  - `derive.open is a no-op when the lab has no derivation`
  - `derive uses the colours it is given` (the overlay's first material colour equals `colors.mark`; use `three` headlessly, no renderer).
- [ ] **Step 3: Run** `npm test -w @flux/shells`. Expected: FAIL.
- [ ] **Step 4: Implement** by moving both files and replacing imports with `deps`. The tally key must not change (Review Focus 1).
- [ ] **Step 5: Run the gate** with `base-4`; also open a predict card and a derivation on the phone viewport by hand.
- [ ] **Step 6: Commit** (`Physics shell: predict and derive`).

---

### Task 5: The practice panel

**Files:**
- Create: `packages/shells/physics/problems.js`, `packages/shells/test/physics-problems.test.js`
- Modify: `courses/phy2049/src/ui/problems.js` (target: a wrapper under 60 lines like `courses/egn3321/src/ui/problems.js`), `packages/shells/practice/loop.js` (new flags only), `packages/shells/test/practice-loop.test.js`

**Interfaces:**
- Produces: `createPractice(api: object, bank: PracticeBank): object` returning what `ui/problems.js` returns today. `PracticeBank` is the object `courses/egn3321/src/ui/problems.js` builds (`PROBLEMS, problemById, problemsForExam, CHAPTER_ORDER, CHAPTER_TITLES, instance, render, grade, expected, sig, withinTol, compile, checkUnits, choiceOptions, createProgress, pickSet, pickInterleave, MASTERED_BOX, INTERVAL_DAYS, examById, LAB_META, homeId, PRINCIPLES, principleConfused, principleTwins, fading, sectionForProblem, labDrawer, GLYPH, exprToTex`), plus whatever the PHY-only code in Step 2 needs, each behind a named flag.

- [ ] **Step 1: Save the base capture** as `$SCRATCH/base-5`.
- [ ] **Step 2: Measure before you move.** Run `diff courses/phy2049/src/ui/problems.js packages/shells/engineering/problems.js` and list every hunk as one of: *in `loop.js` already*, *PHY-only behaviour*, *electromagnetic* (stays in the course), *drift with no purpose*. Put the table in the commit message.
- [ ] **Step 3: Choose the route by the table.** If the *PHY-only behaviour* hunks total 400 lines or fewer, `physics/problems.js` is `engineering/problems.js` wrapped with flags for those hunks, not a copy. Otherwise move PHY 2049's file into the shell and delete what `loop.js` already provides. Either way the end state is the same: one panel implementation per behaviour.
- [ ] **Step 4: Write the failing tests** before moving code: one test per *PHY-only behaviour* hunk, named for the behaviour, run on the fixture bank (`packages/shells/test/fixture/bank.js`), asserting the flag off leaves the other shells' output unchanged and the flag on produces the behaviour. Add `the progress key is unchanged`: with `createProgress` stubbed, the panel stores under the key the bank's `createProgress` receives and invents none.
- [ ] **Step 5: Run** `npm test -w @flux/shells`. Expected: FAIL.
- [ ] **Step 6: Implement.** If the diff of `ui/problems.js` exceeds 1,500 changed lines at this point, stop and split into 5a (route and flags, tests) and 5b (delete PHY's copy), each with its own gate run.
- [ ] **Step 7: Run the gate** with `base-5`, plus `npm run smoke -w @flux/shells` (the practice loop's own smoke) and PHY 2049's `scripts/smoke.mjs`. Work one problem end to end on the phone viewport by hand: answer wrong, see the feedback, answer right, open the notes link.
- [ ] **Step 8: Commit** (`Physics shell: practice panel on the shared loop`).

---

### Task 6: Split the electromagnetic CSS, fixture, docs

**Files:**
- Create: `courses/phy2049/src/styles/em.css`, `packages/shells/test/fixture/physics.html`, `packages/shells/test/fixture/physics.js`
- Modify: `packages/shells/physics/styles/*.css` (remove EM-only rules), `courses/phy2049/src/main.js` (import `em.css` after the shell styles), `ROADMAP.md`, `docs/COURSE-STANDARD.md`, `docs/course-plans/phy2048.md`, `AGENTS.md` (layout line: shells list gains `physics`), `packages/shells/test/practice-smoke.mjs` (adds the physics fixture page)

**Interfaces:**
- Consumes: every earlier task's exports. The fixture wires `renderChrome`, `createHUD`, `createUnits`, `createPredict`, `createDerive` and `createPractice` with one demo lab and no electromagnetic data.

- [ ] **Step 1: Save the base capture** as `$SCRATCH/base-6`.
- [ ] **Step 2: Find the EM-only rules.** For each selector in the three shell stylesheets, grep PHY 2049's source and the fixture for its class. A rule whose classes appear only in electromagnetic labs (charges, circuits, optics, field lines, capacitor, wave bench) moves to `em.css`, keeping its order relative to the rules around it. Record the count of rules moved in the commit message.
- [ ] **Step 3: Write the failing test** `the physics fixture mounts with no electromagnetic data`: serve `fixture/physics.html` (extend the fixture `vite.config.js` if it needs a second page), load it in `practice-smoke.mjs`, and assert no page errors, every `CHROME_IDS` entry present, and a practice problem opens.
- [ ] **Step 4: Run** `npm run smoke -w @flux/shells`. Expected: FAIL.
- [ ] **Step 5: Implement** the fixture and the CSS split. The shell's CSS must contain no class that appears nowhere in the fixture or in a shell module.
- [ ] **Step 6: Update the docs.** Tick Phase 2b in `ROADMAP.md` and change PHY 2048's row ("R5, after the physics shell") to say the shell exists and R5 is next. Replace "once Phase 2b moves PHY 2049's UI there" in `docs/COURSE-STANDARD.md` and the spine's "Until the physics shell exists" paragraph with the present tense. Add `physics` to the shells line in `AGENTS.md`'s layout.
- [ ] **Step 7: Run the whole gate:** `npm test`, `npm run build`, `npm run scorecard` (PHY 2049 must not newly fail), PHY 2049's `smoke`, `gallery`, `compare --against $SCRATCH/base-6`, and `npm run smoke -w @flux/shells`. Expected: all pass.
- [ ] **Step 8: Final check against the spec's "Done when".** Confirm each of its five bullets with a command or a file path, and list them in the commit message.
- [ ] **Step 9: Commit** (`Physics shell: EM styles to the course, fixture, docs`).
