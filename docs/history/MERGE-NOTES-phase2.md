# Phase 2 merge notes

Read against `origin/main` at `e8e2272` (Phase 1b done, STA 3032 instructor material already removed). No code has moved. This file is the diff record Phase 2 asks for before any move.

PHY is the base for the 3D shell and the problem engine, as the plan says. MAC, Statics, and STA add the features named below. A feature that exists in only one course stays, behind a hook the course passes in. Core does not gain a course id, a chapter number, a constant, or a textbook name. STA 3032 does not regain the instructor's notes, review sheet, or notes-example cases (`courses/sta3032/PROVENANCE.md`).

`createScene.js` is not in the file list. It is byte-identical in PHY, MAC, and Statics (67 lines), so it moves with `scene3d/` when that step starts.

## Who has the file

| File | PHY 2049 | MAC 2313 | Statics | STA 3032 |
|---|---|---|---|---|
| router | `src/engine/router.js` (91) | same shape (87) | same shape (87) | different shape (83) |
| frame | `src/engine/frame.js` (146) | rewritten (115) | PHY minus a NaN guard (141) | none |
| pointer | charge drag (186) | probe drag (183) | stub (10) | none; labs use canvas pointer |
| views | EM view pool (122) | calculus view pool (69) | stub (24) | none |
| hud | `src/ui/hud.js` (532) | shorter shell (298) | shorter shell (245) | none; `src/ui/lab.js` is the lab page |
| problems panel | `src/ui/problems.js` (1866) | (1316) | (1180) | `src/ui/practice.js` (433), a different page |
| plot | `src/ui/plot.js` (425) | (342) | subset of MAC (207) | `src/plot/plot.js` (280), a different library |
| format | `src/ui/format.js` (230) | (224) | (215) | none; numbers go through KaTeX |
| shared | `src/ui/shared.js` | identical to PHY | identical to PHY | different (134) |
| manim | `src/scene/manim.js` (261) | (211) | identical to MAC | none |
| numberPlane | `src/scene/numberPlane.js` (127) | (126) | (122) | none |
| arrows | `src/scene/arrows.js` | MAC = Statics | MAC = Statics | none |
| kit | `src/problems/kit.js` (236) | (110) | (173) | (268) |
| engine | `src/problems/engine.js` (724) | (498) | (482) | (285) |
| progress | `src/problems/progress.js` (274) | (177) | MAC with other keys | (279) |
| styles | `main` + `mobile` + `practice` | same three files | `main` + `practice`, no `mobile` | `main` only, own layout |
| lab contract | `src/labs/define.js` | identical to Statics | identical to MAC | 2D contract |

Line counts are the current files. "Identical" means the bytes match.

---

## router

Three courses share one router. STA has another.

**PHY, MAC, Statics** export `COURSE`, `parseRoute`, `courseHash`, `parseHash`, `problemQuery`, `writeHash`, `neighborExam`. The hash is `#/<course>/<unit>/<lab>`, plus `?p=<id>&s=<seed>`. An old hash with no course prefix sets `legacy`, and `writeHash` replaces it so Back does not return to it. A bare lab id (`#/gauss`) is resolved through `LAB_META`.

They differ in four places, all course data rather than mechanism:

- The course id, and the lab named in the comments.
- Empty hash. PHY calls `nextExam()` and opens that exam's first lab. MAC hardcodes `ch2/gradient`. Statics hardcodes `u1/vectors`.
- Seed floor. PHY keeps seeds down to −99 (`Math.max(-99, …)`), because a worksheet case is a negative seed. MAC and Statics clamp to `Math.max(0, …)`.
- Query parsing. MAC and Statics strip a leading `?` before `URLSearchParams`. PHY passes the `?` through. Both work. The behavior to keep is PHY's seed floor and a default lab supplied by the course, not a lab id written in core.

**STA** exports `COURSE`, `MODES`, `parseHash(hash)`, `hashFor`, `go`. Modes are `practice`, `explore`, `tables`, `exam`. Notes mode is gone: a `/notes` segment is treated as legacy and rewritten to the practice list. The hash is `#/sta3032/<unit>`, `#/sta3032/<unit>/exam`, `#/sta3032/<unit>/explore/<lab>?sc=<scenario>`, with `?p=&s=` and `?set=`. Calling `parseHash()` with no argument reads `location.hash` and rewrites a legacy hash itself. Seed is `null` when `s` is absent, and `0` is a worked case, not "no seed". There is no `neighborExam`.

Core keeps both grammars. The manifest says which one the course uses. Old hashes in both grammars keep redirecting. One grammar would change URLs that already shipped.

## frame

PHY and Statics are the metre frame. MAC is the same fit math with no metres and a third plane.

Shared by all three: `GRID_HALF = 7`, `FIT_UNITS = 3.4`, `FIT_MIN = 1.2`, `FIT_MAX = 4.4`, `sceneScale`, `workPlane`, `setFrame`, `fitScale`, `snapStep`, `snapTo`, `refit`. The fit picks a 1/2/2.5/5 × 10ⁿ tick.

| | PHY | Statics | MAC |
|---|---|---|---|
| Scale name | `metersPerUnit`, starts from `UNITS_PER_METER` | same names, same start | `unitsPerTick`, starts from `DEFAULT_UPM = 1` |
| Default plane | `xz` | `xz` | `xyfloor` |
| Planes | `xz`, `xy` | `xz`, `xy` | `xz`, `xy`, `xyfloor` |
| Softening | `softenFor`, `contourSoftenFor` (charge singularities) | same | absent |
| Tick text | `lenLabel`: m, cm, mm, µm | same | plain numbers, or exponential |
| Coordinate box | `coordUnit` returns m/cm/mm/µm and a step | same | `{ unit: '', per: 1, step }` |
| Extent | charges, probe, path A, marks, surface; non-finite coordinates become 0 | charges, probe, path A; no marks; `p.x \|\| 0` instead of the NaN guard | probe and `xMin/xMax/yMin/yMax` only |
| Mapping | world axes are the state axes | same | `mathToWorld` / `worldToMath`: on `xyfloor` and `xz`, math y is world z and height is world y |

`xyfloor` is the graph of z = f(x, y): domain on the floor, labeled x and y, height up. PHY's `xz` is the physics floor, labeled x and z.

Core's frame keeps the three planes, the fit, the snap, and both mappings. Tick labels are a function the course passes. PHY and Statics pass the SI length label. MAC passes the plain-number label. Core does not import `UNITS_PER_METER`. Statics' US customary lengths belong in `subjects/mechanics`, not in this label helper, until a lab asks for them on the grid.

## pointer

PHY drags charges and the probe in the work plane. Shift leaves the plane. Positions snap to half a grid square. Alt places freely. A drag is clamped to the band `refit` leaves alone, so the scene cannot zoom out forever inside one gesture.

MAC's function has the same name, `createChargePointer`, and the same arguments. It drags the probe, not charges. It grabs the probe only when the pointer is within 24 px of the handle, so a press on empty space still orbits. It maps through `mathToWorld` / `worldToMath`, including `xyfloor`. Shift moves along the out-of-plane axis, which is height on an `xyfloor` graph.

Statics exports `createChargePointer()` with no arguments. It returns `{ dragging: false, dispose() {} }`. Labs set `pointer: null` and are driven from the Setup panel.

The merged pointer is PHY's drag plus MAC's screen-space grab and `xyfloor` mapping. A lab that sets `pointer: null` does not install it, which is what Statics does today. STA's pointer is per lab (`down` / `move` / `up` in CSS pixels on the canvas) and stays on the plot2d contract.

## views

These are not one pool with a few flags. Each file lists that course's scene classes.

- PHY: charges, patches, arrows, field lines, probe, forces, distribution, equipotentials, capacitor, circuit, a test charge, path A, and a marked point. It imports `Q.mark` from manim.
- MAC: surface, contours, probe, gradient arrows, tangent plane, polar grid, curve, a lifted curve, slices, Riemann boxes, region, space arrows, graph bars, triple boxes, solid, slice area, element.
- Statics: a `Proxy` whose every key returns a no-op view. `hideAll()` is a no-op. Labs build their own meshes in `init`.

Core takes the lazy `once()` pattern only. The view classes stay with the course that draws them. Moving PHY's pool into core would pull capacitor, circuit, and field-line classes with it.

## hud

All three export `createHUD(api)` and re-export `sciHTML`. The shell is a WebGL canvas, exam tabs, lab tabs, a scenario `<select>`, toggles, a legend, sliders, a law line, and a readout. STA has no HUD. Its lab page is `src/ui/lab.js`.

Shared by MAC and Statics, and present in simpler form in PHY: `setLaw`, `fillScenarios`, `renderLabTabs`, `renderToggles`, `renderLegend`, `enhanceSliders`, `mount`, `updatePlaneHint`, `update`. MAC and Statics share `renderExamTabs` (identical). PHY has `renderExamPicker` instead: exam dates, a portrait layout that drops the weekday, and unbuilt labs left visible.

PHY only:

- Law text shrinks to 70% rather than scrolling away.
- Scenario box can read "a problem's setup" or "your own", not only a preset id (`scenarioValue`, `syncScenario`). Presets that are not pickable stay out of the menu.
- `revealActive` scrolls the selected tab into view.
- Application labs get their own labelled row.
- Keyboard cheat sheet (`renderKeys`, `setKeys`).
- Phone plot slot: the graph is lifted out of the last lab's controls before mount, and a hidden panel's plot is redrawn once it has a size (`drawPlot`).
- Problem blind mode strips the half of a scenario name that states the answer (`setBlind`).
- `neutralName` for that stripping.
- Typed boxes beside sliders, rebuilt on mount. A fractional step becomes continuous so a typed value is not snapped back. Whole-number steps stay discrete.
- `PHONE` media query matches `mobile.css`.

MAC only: `navFailed`. `setExam` and `setLab` are async. A failed dynamic import used to leave the tab focused and the lab unchanged. MAC writes the error into the setup hint. PHY and Statics do not. The merged HUD keeps this.

Statics only, at the page rather than inside `hud.js`: an Explain button (`#btn-sheet`, class `sheet-toggle`) in `index.html`. The equilibrium tables use `.ptab` (see styles). `enhanceSliders` is the short form, without PHY's typed boxes.

`renderLegend` differs in all three (PHY's colour-vision ramp is the extra). `update` differs in all three because each dispatches its own plot types.

## problems panel

PHY, MAC, and Statics export `createPractice(api)`. A large set of helpers is byte-identical across the three: `levelDots`, `fmtClock`, `fmtDays`, `prettyId`, `veilNode`, `examActive`, `loadAttempt`, `isDetached`, `readInputs`, `isEmpty`, `selfParts`, `maybeFinish`, `reveal`, `restoreSetup`, `startReview`, `showExamItem`, `saveExamInputs`, `submitExam`, `reviewExamItem`, `open`, `close`. Exam length constants `EXAM_MINUTES` and `EXAM_SIZE` match. `MIXED_SIZE` does not: PHY weights the mixed set.

PHY only, and these stay, because the other courses do not have the data they read:

- Principle step before the problem (`principleHTML`, `ASK_PRINCIPLE`), faded worked example (`guideHTML`), and the "what went wrong" note (`gapHTML`).
- Interleave: `advance` pulls one earlier-chapter problem into a chapter path. `sessionPos` tracks it.
- Weak-principle list (`weakHTML`, `weakPrinciples`, `startPrinciple`, `orderByPrinciple`) and the Mixed set weight.
- Worksheet sheets (`startSheets`, `sheetGo`).
- Notes link and the lab drawer (`notesLink`, `labButton`, `labDrawerReady`, `setLabOpen`).
- Phone number pad (`numPadHTML`) and part lockers (`lockersOf`).
- Spoken result (`announce`, `spoken`).
- `showChapter` opens the panel on one chapter.

MAC only, on the symbolic answer:

- Live value of the typed expression at the lab's current point (`evalAtScope`).
- The typed expression typeset as you go (`exprToTex`, `previewHTML`).
- A symbol palette (`paletteHTML`, `insertAt`). PHY also has a palette; Statics has neither palette nor `insertAt`.
- `parseMessage` is MAC's own: it talks about the formula, not the unit.

Statics matches MAC's practice flow (no principle step, no sheets, no notes link) and matches PHY's `parseMessage` (units). Its `resultsHTML` matches PHY. MAC's `resultsHTML` does not. `refreshLabChecks` is ~50 lines in PHY and ~210 in MAC and Statics: the two shorter courses grew a longer "does the lab agree" block. Those two copies differ from each other.

`check` in PHY calls `announce`. MAC and Statics do not. `gradeAll` matches between MAC and Statics and differs in PHY (choice options that are a function of the version, via `choiceOptions`). `newAttempt` in PHY takes `principle` and `again`.

**STA's panel is a different page**, `renderList` / `renderProblem` / `dueCount` / `reviewCap`. It is not a drawer over a 3D canvas. It has:

- A today card: chapters, how many are due, days until the exam (`daysUntil`, `todayHTML`).
- Named sets (`startSetSession`, `setCard`). `src/problems/sets.js` still has the mechanism. `SETS` is empty. The review-sheet set was removed on 13 Oct 2026 and is not coming back in this phase.
- A review cap: a clean solve is not scheduled past the day before the exam (`reviewCap`, also in progress).
- Part markup through `partHTML`, lab links for the chapter, and a finished banner.
- No symbolic palette, no principle step, no 3D blind mode.

The plot2d host keeps this page. It does not get rebuilt into `createPractice`. The shared piece is the grader and the progress record, not the DOM.

## plot

Two libraries, not one file that grew.

**3D `ui/plot.js`.** `setup`, `axes`, and `dot` are identical in PHY, MAC, and Statics. Colours `BLUE`, `YELLOW`, `RED`, `WHITE`, and the serif font match. `GOLD` differs: PHY's gold is a separate current colour.

| Drawer | PHY | MAC | Statics | Who calls it |
|---|---|---|---|---|
| `drawVx` | yes | yes, one line different | yes | HUD, if `plot.type === 'Vx'`. No current MAC or Statics lab returns that type |
| `drawAC` | yes | yes | yes | same, type `'ac'`. Unused by MAC and Statics labs |
| `drawVI` | yes | yes | yes | type `'vi'`. Unused by MAC and Statics labs |
| `drawPaschen` | yes | yes, slightly shorter | no | type `'paschen'`. PHY only |
| `drawRC` | yes | no | no | PHY RC lab |
| `drawAccum` | no | yes | no | MAC `triple` and `iterated` labs, type `'accum'` |

MAC's HUD still imports and dispatches `drawVx`, `drawAC`, `drawVI`, and `drawPaschen` even though no MAC lab returns them. Statics' HUD dispatches `Vx` and `ac` and no Statics lab returns a plot. Those drawers stay available on the scene HUD so a PHY lab does not lose them. They are not part of STA's plotter. `drawAccum` is MAC's and moves with the scene HUD, not into `plot2d/`.

**STA `src/plot/plot.js`.** This is the 2D lab painter: `setup`, `scale`, `ticks`, `area`, `axes`, `bars`, `curve`, `shade`, `vline`, `segment`, `dot`, `label`, `histogram`, `meanSd`, and a small palette `C`. `compute(state, rng)` in the lab is pure. The seeded generator is the only randomness. This file is `plot2d/`. It does not share functions with `ui/plot.js`.

## format

PHY, MAC, and Statics each have a file of display helpers. STA has none.

Shared idea: `sciHTML`, `sciTex`, `sciText`, `signedSci`, and a long list of quantity formatters (`fmtCharge`, `fmtE`, `fmtForce`, `fmtV`, `fmtR`, `fmtI`, `fmtP`, and the rest). Statics defines the EM formatters and nothing in Statics calls them. The HUD re-exports `sciHTML` only. MAC labs call `fmtNum` and, in the gradient lab, `sciHTML`. They do not call `fmtCharge`.

Real differences:

- `sciText`. PHY prints unicode superscripts (`3.14 × 10⁻⁷`). MAC and Statics print `toExponential` (`3.14e-7`).
- `fmtCharge`. PHY uses three significant figures and can land on pC, so 85 pC stays 85 pC. MAC and Statics use µC with two decimals, or nC with one, and have no pC branch.
- `fmtPoint`. PHY and Statics use `coordUnit()` and print `(x, y, z)` with a unit. MAC prints `(x, y)` in problem units, three decimals, no unit.
- `fmtSpeed`. PHY only.
- `fmtI`. PHY has nA and pA branches. MAC and Statics stop at µA.
- `fmtNum`. MAC only. Values under `1e-10` print as 0 so `sin(π)` does not show as `10^{-16}`. Large and tiny values print as TeX scientific notation.

Core takes `sciHTML` and `sciTex`, with the superscript style as an option so PHY's panels do not change. `fmtNum` moves with MAC's labs (it is a math-panel helper, not an EM one). The quantity formatters stay in the course that displays that quantity. PHY keeps `fmtCharge` and `fmtSpeed`. Copying PHY's `fmtCharge` into MAC or Statics would change nothing on screen today, and copying MAC's into PHY would change the charge readouts. Neither happens.

## shared

PHY, MAC, and Statics are the same file. It exports `tex`, `mathText`, `escapeHTML`, `mathProse`, `eq`, `prose`, `kv`, `qv`, `cells`, `matchClass`, `setLawEl`. Math is `$…$` only. KaTeX macros are the EM ones: `\qV`, `\qI`, `\qR`, `\qP`, `\Qin`, `\eps`, `\net`. `mathProse` escapes text outside the dollars, because problem sentences contain `<` and `>`.

STA keeps `tex`, `mathText`, `escapeHTML`, `mathProse`, and adds:

- `$$…$$` as a displayed equation (`displayBlock`).
- `breakable` / comma breaks: a long inline list may break after top-level commas, and a display equation is set twice so `fitMath` can swap in the wrapping copy when the display copy is wider than the column.
- `fitMath(root)`. The overflow check depends on this.
- `texError` and `mathPieces`, for the checks.
- Macros `\xbar`, `\phat`, `\Xbar`, `\given`. No EM macros.

STA does not have `eq`, `prose`, `kv`, `qv`, `cells`, `matchClass`, or `setLawEl`. Those are the 3D panel's row markup. They move with the scene shell.

Core's tex module is: render a string, parse `$` and `$$`, escape prose, report a KaTeX error, list the math pieces, and run `fitMath`. The macro map is an argument. PHY passes the EM macros. STA passes the statistics macros. Core does not contain either map.

## manim

MAC and Statics match. PHY is that file plus the quantity palette.

Shared: palette `M` (the Manim swatches), `rampColor`, `lineMaterial`, `fatLine`, `fatSegments`, `updateFatLine`, `setFatSegments`, `segmentCapacity`, `Arrow`, `makeChargeTexture`, `markAnswer`, `ANSWER_LAYER`, `disposeTree`, `POS_COLOR`, `NEG_COLOR`.

PHY adds:

- `M.lavender`.
- `Q`, the quantity colours: E yellow, B teal, I gold, F pink, velocity white, capacitor purple, positive red, negative blue, selected white, mark purple, real image purple, virtual image lavender. MAC and Statics set `POS_COLOR` / `NEG_COLOR` straight from `M.red` / `M.blue`, which are the same hexes as `Q.pos` / `Q.neg`.
- `rampColorCVD`, the blue–yellow ramp the circuit wires use, where colour is the only cue for potential.
- `setAnswer(obj, on)`, to move an object onto the answer layer and back. MAC and Statics only have `markAnswer`, which puts it on the layer and leaves it there.

`Q` is a PHY theme. It stays a theme object PHY passes, or a module PHY re-exports. Core's manim keeps the swatches and the line helpers, including `lavender`, `rampColorCVD`, and `setAnswer`, because those are drawing tools with no course name in them. The comment that says "yellow means E" lives with PHY, not in core.

## numberPlane

One class, three defaults.

- PHY: default plane `xz`, default scale 8, axis names x and z, plus a near pair `+x` / `+z` five squares out so a problem about the positive axis can still read the name. The out-of-plane name swaps between y and z when the plane stands up.
- MAC: default plane `xyfloor`, default scale 1, names x and y on the floor and z up. `xz` still gets physics labels. The out-of-plane axis and its name hide when the plane is vertical (`id === 'xy'`). No near-axis pair.
- Statics: PHY's defaults (`xz`, scale 8, names x and z) without the near-axis pair, and without MAC's hide-when-vertical rule.

The merged plane takes a plane id (`xz`, `xy`, `xyfloor`), optional near labels, and whether the out-of-plane axis shows. The course's `defaultView` picks the id. PHY keeps the near labels.

## arrows

MAC and Statics are the same file. PHY differs by two lines: it imports `Q` and colours a positive `En` with `Q.E`. MAC and Statics use `M.yellow`. Those are the same yellow. Behavior matches. The merged file uses the swatch, not `Q`, so manim can move without the theme object. PHY labs that need the named quantity colours keep using `Q` at their own call sites.

`VectorBatch` in this file is what MAC's `gradArrows` and `spaceArrows` draw with. It is a scene tool, not an EM tool, despite the charge-pointer name on the drag helper.

## kit

Four authoring kits. The part object is the shared idea. The function signatures are not, and the banks call them in the shape they have today. Rewriting every `num(...)` call is not part of this phase.

| Helper | PHY | MAC | Statics | STA |
|---|---|---|---|---|
| `range` | `(min, max, step, unit, si, opts)` | same | same | `(min, max, step, opts)` and no `si` |
| `choice` | pairs to `{value, label}` | same | same | same, plus a third entry is a label the choice can carry |
| `num` | `(id, get, unit, o)`, tol 0.02, `scale`, `wrap` | same, slightly shorter body | PHY's, including `wrap` for angles | `(id, get, o)`, tol 0.005, `alt`, `traps`, `altGap`, no unit argument |
| `mc` | options are pairs | same | same | options may be a function of `$`, and an option may carry `why` |
| `tf` | PHY = Statics | shorter | PHY | shortest |
| `sym` | PHY = Statics, with `units` | no `units` field | PHY | none |
| `self` | prompt + rubric | longer | PHY | prompt + rubric |
| `problem()` | level, topics, vars, derive, valid, hints, steps, `sim: null`, cases | no `sim` key in the default object (spread still keeps one) | PHY's | adds `kind: 'numeric'`, no `sim` |
| `kase` | `{src, v, want, key, note}` | same shape | PHY's | same shape |
| `data()` | no | no | no | a sample drawn after the ranges, so it can use n |

Course helpers that stay in the course:

- PHY: `charge`, `layout` (fit the problem's own metres into `state.view`), `texNum`, `unitTex`, `qty`, `texDeg`, `pq`, `terms`, `axisCode`, and the direction choices `DIR_X`, `RADIAL`, `POSNEG`, `AXES6`. Constants `C_LIGHT`, `ME`, `MP`, `G` live here too and move to `subjects/em`, not to core.
- MAC: `coef`, `prod`, `domain` (the plan's `domain()`: writes `s.view = { upm, plane }` for a rectangle, default plane `xyfloor`), `texNum`, `mag`, `angleDeg`. `domain` is the calculus twin of PHY's `layout`.
- Statics: `charge` and `layout` are the PHY copies, plus `G` and `G_FT` re-exported from `physics/constants.js`. `UPDOWN` matches PHY. The US constants move to `subjects/mechanics`.
- STA: table lookups (`zLook`, `tLook`, `chi2Look`, `fLook`, `zTableP`, `zCrits`), hypothesis wording (`hyp`, `h1Part`, `decisionPart`, `conclusionPart`, `conclude`), `prob`, `statPart`, `pPart`, `endpoint`, `tn`, `fx`, `pn`, `roundTo`, `confLabel`. These stay in the stats course or in `subjects/stats`. They are not generic kit parts.

`problem()` in core already fills `level`, `topics`, `vars`, `derive`, `valid`, `hints`, `steps`, `cases`. That matches the fields all four banks share. `sim` and `kind` stay optional fields the spec passes through. Core does not default `kind` to `'numeric'`, because that word is a STA part kind, and it does not default `sim` to `null` as a required concept. Both survive the spread, which is what the banks rely on.

`num`, `mc`, `tf`, `sym`, `self`, `kase`, `range`, and `choice` stay in each course's kit for this phase, each producing the part object the shared grader already understands. Unifying the call signature would edit every bank file. That is a later cleanup, and only if the checks still pass.

## engine

The sampler and the expression parser are shared by the 3D courses. STA's grader is the one that knows about printed tables. The constants table is different in every file, so it cannot live in core.

Identical across PHY, MAC, and Statics: `hashSeed`, the internal `clean`, `sampleValues`, `FUNCS`, `OPS`, `evalAst`, `gradeSymbolic`, `evalSymbolic`. `build` matches across those three and differs in STA (articles, and a wider render). `rng` matches across the three. STA's `rng` is `mulberry32` from `stats/rng.js`, re-exported.

`parseExpr` matches between PHY and MAC. Statics' copy is shorter. `compile` matches between PHY and Statics. MAC's `compile` is one line different. `dimensionOf` and `checkUnits` match between PHY and Statics and are absent in MAC. MAC's comment still mentions `dimensionOf`; the function was replaced by `evalAtScope`.

`CONSTS`:

- PHY: `pi`, `k`, `eps0`, `mu0`, `c`, `g`.
- MAC: `pi`, `e` (the base of the natural log).
- Statics: `pi`, `g`, `gft`.
- STA: no expression language.

The grader takes `consts` from the course. Core ships `pi` only if a caller asks for it. `k`, `eps0`, `mu0`, `c` come from `subjects/em`. `g` and `gft` come from `subjects/mechanics`. `e` comes from `subjects/math`.

Grading, which is the part that must not regress:

- PHY `grade` for a number: parse, read a typed unit (`typedUnit`, `unitFactor`, `convertTyped`), reject a dimension mismatch, then tolerance. Feedback covers a wrapped angle, a wrong sign, a power of ten, and a factor of two. `withinTol` understands `wrap` (so −30° and 330° match). `choiceOptions` and `unitOf` allow the options and the unit to be functions of the version. `tidyProse` fixes "a 8", normalises scientific notation, and capitalises a sentence that starts with an article.
- MAC `grade` matches Statics' `grade`: no typed-unit conversion inside `grade`. Symbolic answers go to `gradeSymbolic`. While the student types, the panel calls `evalAtScope` and shows the value at the current point. There is no `checkUnits` on that path.
- Statics `grade` is MAC's. The panel calls `checkUnits` instead of `evalAtScope`, using the dimension table that includes lb, kip, ft, in, and slug.
- STA `grade`: `accepted` is the exact value plus every finite `alt`. `tolerance` allows `abs` to be a function, and a small probability tightens the absolute band so a doubled tail cannot pass. `nearest` reports which accepted value was closest. `diagnose` recognises the complement, a one-tail/two-tail swap, a percent typed as a whole number, and σ where σ² was asked, plus the part's own `traps`. `parseNumber` treats a trailing `%` as a fraction, accepts `1/4` and `1,250`, and strips a trailing word ("12 minutes"). It does not strip a unit the way PHY does, and it does not turn a percent into a unit. Multi-select feedback matches PHY's wording. There is no symbolic kind.

Also STA only: `CASE_SEED`, `caseIndex`, `seedForAttempt`. Seed 0 and the seeds at `CASE_SEED + i` are the worked cases. Generated versions use other seeds. `sig` defaults to 4 figures in STA and 3 in the 3D courses, and PHY's `sig` uses unicode superscripts.

`instance` in the 3D courses takes `{ worksheet }`. PHY's body is a few lines longer than MAC's and Statics'. STA's `instance` also takes `worksheet` and records the case index.

The merged engine is PHY's sampler and parser, with constants injected, plus:

- STA's `alt` / `tolerance` / `nearest` / `diagnose` / percent parsing, used when the part has `alt`, `traps`, or `prob`.
- PHY's typed units and `wrap`, used when the part has a unit or a wrap.
- Statics' `checkUnits`, used when the part has `units`.
- MAC's `evalAtScope` and `exprToTex`, used when the panel has a scope to evaluate at.

A part that has none of those fields grades as it does today. `GLYPH`, `astToTex`, and `exprToTex` exist in PHY and MAC (PHY's `GLYPH` is one entry longer) and not in Statics. They move with the expression printer. Statics simply does not call them.

## progress

No course can export or import progress yet. Phase 2 adds that. The Leitner boxes are already the same idea.

Shared: boxes 0–5, `INTERVAL_DAYS = [10/1440, 1, 3, 7, 16, 35]`, `MASTERED_BOX = 3`, `browserStorage`, `memoryStorage`, `createProgress`, `pickSet`. A clean solve moves up a box. A miss or a revealed solution goes back to box 0. A correct answer that needed help drops one box but not below 1.

MAC and Statics are the same file apart from the key strings.

Keys today:

| Course | Problems | Exam | Other |
|---|---|---|---|
| PHY | `flux.problems.v1` | `flux.exam.v1` | `flux.predict.v1`, `flux.notes.width`, `flux.notes.full` |
| MAC | `flux-mac2313.problems.v1` | `flux-mac2313.exam.v1` | |
| Statics | `flux-statics.problems.v1` | `flux-statics.exam.v1` | |
| STA | `fluxstats.problems.v1` | `fluxstats.exam.v1` | `fluxstats.labs.v1` in `src/ui/lab.js` |

PHY and Statics used to share `flux.problems.v1` and `flux.exam.v1`. Phase 1b renamed Statics. PHY still uses the un-namespaced keys. On one origin that is safe only while Statics does not write them. The new keys are `flux.<course>.<name>.v<n>`.

PHY adds, and STA mostly has: `noteGap`, `principleTally`, `principleMisses`, `pickInterleave`, and a `weight` argument on `pickSet`. MAC and Statics have none of those. `record` in PHY stores `principle`, `guided`, and `rightFirst`.

STA's `record` adds two rules MAC and Statics do not have, and PHY does not have either:

- A clean solve moves the box up only when the problem was already due. Solving it again in the same sitting does not promote it, and does not push `due` further out.
- `cap` clamps `due` to the day before the exam (`reviewCap` in the panel).

STA imports `CHAPTER_ORDER` from the catalog and `rng` from `stats/rng.js`. The 3D courses import both from the problems folder.

Core's store builds `flux.${courseId}.${name}.v${n}`. The course passes the legacy key strings. If the new key is empty and the legacy key has a value, that value is copied once. The legacy key is left in place, so a revert can still read it. Export and import are the JSON already stored under those keys, for every key the course registered (problems, exam, predict, notes width, lab tallies). Core does not list the four course ids.

`pickSet`, `pickInterleave`, and the Leitner `record` move with the problem engine, not with the key helper. The due-cap and the "only promote when due" rule are arguments on `record` (`cap`, and the was-due check). Courses that omit them keep today's behavior: PHY promotes on every clean solve, STA passes `cap`.

## styles

The token block at the top of `main.css` is the same palette everywhere: `--bg #0b0c0e`, Manim blue, teal, green, yellow, gold, red, purple, pink, and the same text colours. STA's comment states the panel rule the 3D apps also follow: yellow is the one primary button, blue means selected, green and red appear only when an answer is graded.

**`main.css`.** PHY is the 3D shell and is the superset, except for these additions:

- MAC only: `.element-label`.
- Statics: `.ptab` (the equilibrium table in the sections lab), `.sheet-toggle` (the Explain button), `.slide-only input[type=range]`, and a `@media (max-width: 720px)` block. Statics has no `mobile.css`. Those phone rules live here and have to survive the move.
- STA: a different document. One column, sticky header, mode links, chapter `<details>`, lab controls, `.disp` / `.disp.wrapped` for `fitMath`, table lookup, exam bar. About 197 selectors and variables appear in no 3D sheet. It shares the tokens and not the HUD.

PHY-only blocks in `main.css` cover the step-through derivation (`.derive*`), the keyboard sheet (`.keys*`), the prediction panel (`.pr-*`), quantity colours on the readout (`.qV`, `.qI`, `.qR`, `.qP`), the exam `<select>`, and charge and circuit labels. Those stay with the scene shell. They are not STA's page.

**`mobile.css`.** PHY and MAC only. Every selector in MAC's file is also in PHY's. PHY adds the type-scale variables `--fs-body`, `--fs-meta`, `--fs-title`, `--fs-ui`, `--select-line`, `--select-soft`. Inputs at phone width are 16px in both, so Safari does not zoom. The merged phone layer is PHY's file. Statics' 720px rules from `main.css` are checked against it so the Explain button and the slider still fit.

**`practice.css`.** PHY, MAC, and Statics. Every selector in MAC and in Statics is also in PHY. PHY adds the notes column (`.notes*`, `.nt-doc*`) and the mode switch. The merged practice sheet is PHY's. STA's practice styling lives in its `main.css`, with the plot2d page.

## Lab contract (`define.js`)

Not in the file list, and it decides `defineLab`.

MAC and Statics are the same file. PHY's `defineLab` function matches them. PHY's comment adds the rule that a lab's on-screen quantities are listed in `data/quantities.js`, not on the spec. The shared scene3d fields are: `id`, `exam`, `title`, `live`, `orbit`, `hint`, `camera`, `keys`, `toggles`, `legend`, `defaultState`, `scenarios`, `controls`, `bind`, `syncControls`, `init`, `enter`, `exit`, `recompute`, `syncViews`, `tick`, `law`, `liveRows`, `readout`, `coach`, `plot`, `pointer`, `cameraFor`, `applyScenario`, `extent`, `frame`, `afterFrame`. `planeCamera` is the head-on camera for an `xy` plane.

STA's `defineLab` is the other shape: `id`, `title`, `ch`, `blurb`, `params`, `scenarios`, `actions`, `compute(state, rng)`, `draw`, `pointer` in CSS pixels, `tap`, `readout` as label/value pairs, `explain`, `predictions` (`outcome` must equal `expect`), `height`, and `defaults()` seeded from the params. There is no three.js.

`kind: 'scene3d' | 'plot2d'` selects the defaults. A missing or unknown `kind` throws. Scene labs do not gain `compute`. Plot labs do not gain `recompute`.

---

## Vectors and units

The plan says that where the same helper disagrees, the selftest decides. These are not in the file list. They are the copies that step will hit.

**Vectors.** PHY `physics/vec.js` and MAC `math/vec.js` match on `v`, `clone`, `set`, `add`, `sub`, `scale`, `addScaled`, `dot`, `cross`, `len`, `lenSq`, `dist`, `distSq`, `normalize`, `lerp`. All of them return a new `{x, y, z}`. MAC adds `proj`, `det2`, `det3`. Statics `physics/vectors.js` uses the same `add` / `sub` / `scale` / `dot` / `cross` / `v` arithmetic, names length `mag` and the unit vector `unit`, and adds the Hibbeler edge: degrees in, radians inside (`directionAngles`, `fromAngles`, `fromAngle2D`, `angleBetween`, `lawOfCosines`, `lawOfSines`, `parallelogram`, `forceAlong`, `posVec`). `proj` exists in both MAC and Statics. MAC divides by `lenSq` and returns zero when the base is tiny. Statics goes through `unit()`. The selftests are the check that those agree on a non-zero base.

`subjects/math` takes PHY's vec plus MAC's `proj`, `det2`, `det3`. `subjects/mechanics` takes Statics' degree-edged helpers and calls the shared arithmetic rather than a second copy of `cross`. Cross product stays in R³, which both copies already assume.

**Units.** Statics `physics/units.js` is PHY's file plus `lb`, `kip`, `ft`, `in`, `slug`, with `CONST_DIMS` changed from `k`, `eps0`, `mu0`, `c` to `g`, `gft`, and with `lb·ft`, `N·m`, `ft^4` and the rest added to the display names. The dimension vector is `[M, L, T, I]`. A pound is a force, a slug is the mass. `subjects/mechanics` keeps the US names and `g` / `gft`. `subjects/em` keeps `k`, `eps0`, `mu0`, `c` and the EM unit names. The parser (`parseUnit`, `dimEqual`) is one function, and each subject passes its own table. Core does not list `lb` or `eps0`.

---

## Proposed core API

What `packages/core` already exports stays: `defineCourse`, `defineLab`, `problem`. This phase fills them in. Nothing below names a course.

### `defineCourse(spec)`

Unchanged from `PLAN.md` section 4 (now `docs/history/PLAN-2026-10-18.md`) and from `packages/core/src/contract.js`. `id` is lowercase letters and digits, starting with a letter. It is the route prefix and the storage namespace. Optional `track`, `order`, `text`, `sets`, `notes`, `formulas`, `ingest`. The lazy loaders stay lazy.

Two fields the shell reads, both optional so a course that omits them keeps today's behavior:

- `routes: 'lab' | 'modes'`. `'lab'` is `#/<course>/<unit>/<lab>` (PHY, MAC, Statics). `'modes'` is STA's grammar, and `modes` lists the segments (`practice`, `explore`, `tables`, `exam`). Default `'lab'`.
- `legacyKeys: { [name]: string }`. The old storage key to read once for that name. PHY will pass `problems: 'flux.problems.v1'`. Core does not know that string.

`defaultUnit` is not a new field. The empty-hash lab comes from the course catalog (`nextExam` / `nextUnit`), which the course's router adapter already has.

### `defineLab(spec)`

`kind` is required: `'scene3d'` or `'plot2d'`.

`scene3d` defaults are the PHY / MAC / Statics contract: `init`, `enter`, `exit`, `recompute`, `syncViews`, `controls`, `bind`, `scenarios`, `defaultState`, `law`, `liveRows`, `readout`, `coach`, `plot`, `pointer`. A lab may set `frame: true` and `view: { upm, plane }` with `plane` in `'xz' | 'xy' | 'xyfloor'`.

`plot2d` defaults are the STA contract: `params`, `scenarios`, `actions`, `compute(state, rng)`, `draw`, `predictions`, `readout`, `explain`, `height`. `compute` is pure. The only randomness is the seeded `rng` the host passes in. `predictions[].outcome(before, after)` is what the lab computed, and the labs check still requires it to equal `expect`.

### `problem(spec)`

Defaults stay what all four banks already share:

```js
{
  level: 1,
  topics: [],
  vars: {},
  derive: () => ({}),
  valid: () => true,
  hints: [],
  steps: () => [],
  cases: [],
  ...spec,
}
```

`sim`, `kind`, `principles`, `sampleValid`, `figure`, and `table` pass through when a bank sets them. Core does not interpret them. Part builders (`num`, `mc`, `tf`, `sym`, `self`, `range`, `choice`, `kase`) stay in the course kit, each still called the way that bank calls them. The shared grader reads the part object: `kind`, `get`, `alt`, `tol`, `abs`, `wrap`, `unit`, `units`, `traps`, `prob`, `expr`, `vars`.

### Storage

```js
storageKey(courseId, name, version)  // => `flux.${courseId}.${name}.v${version}`

createStore({ courseId, storage, keys, legacy })
// keys: { problems: 1, exam: 1, ... }
// legacy: { problems: 'flux.problems.v1', ... }   // the course supplies this
// read(name) copies legacy → new once, when the new key is empty
// exportJSON() / importJSON(json) round-trip every registered key
```

Target keys:

| Course | New problems key | New exam key | Also |
|---|---|---|---|
| phy2049 | `flux.phy2049.problems.v1` | `flux.phy2049.exam.v1` | predict, notes width, notes full |
| mac2313 | `flux.mac2313.problems.v1` | `flux.mac2313.exam.v1` | |
| statics | `flux.statics.problems.v1` | `flux.statics.exam.v1` | |
| sta3032 | `flux.sta3032.problems.v1` | `flux.sta3032.exam.v1` | lab tallies |

`packages/checks/storage.mjs` still fails if two courses share a key. The legacy strings remain only inside the course that owns them, as the `legacy` map, so the one-time read has something to read.

### Order of moves

Lowest risk first. After each move, `npm test` and `npm run build` at the repo root, then each course's smoke on its own port (PHY 5174, MAC 5175, Statics 5176, STA 5177), and STA's overflow check. A red check reverts that move.

1. **`tex/`.** From `ui/shared.js`: `tex`, `mathText`, `mathProse`, `escapeHTML`, `$$`, `fitMath`, `texError`, `mathPieces`. Macro maps stay in the courses. `kv`, `prose`, `eq`, `setLawEl` stay with the scene shell until step 6.
2. **`storage/`.** `storageKey`, `createStore`, the one-time legacy read, export and import. The four progress modules call it. Leitner logic stays where it is. Then a round-trip check: export, clear, import, same review queue, in each course.
3. **Subject libraries.** `subjects/em` from PHY `physics/*`. `subjects/mechanics` from Statics `physics/*`, including the US unit names. `subjects/math` from MAC `math/*`, including `vec` (PHY's arithmetic plus `proj`, `det2`, `det3`), `domain`'s scale helper, and `sumtex.js` (the term-by-term sum the labs title themselves with). `subjects/stats` from STA `stats/*`. Each keeps its selftest. Where `proj` or a unit name disagrees, the selftests are the decider, and the course that fails is the one that does not move.
4. **`scene3d/` and `plot2d/`.** `defineLab({ kind })`. `scene3d/` takes the identical `createScene.js`, manim, numberPlane, arrows, frame (with a label hook and `xyfloor`), and the merged pointer. View classes stay in the course. `plot2d/` takes STA's `src/plot/plot.js`. The 3D `ui/plot.js` drawers stay with the HUD until step 6. `drawAccum` stays on the scene side.
5. **Problem engine.** Grader and expression parser, constants injected. Then the generic progress operations (`record`, `pickSet`, `pickInterleave`) with STA's due-cap as an argument. Course kit helpers stay in the course. `SETS` stays an empty array in STA. The review-sheet file is not restored.
6. **`notes/`, the lab loader, then `shell/`.** Notes renderer from PHY only. STA's manifest does not load notes. The shell is two hosts: the scene HUD (PHY, plus MAC's `navFailed`, plus Statics' Explain button and `.ptab`) and the plot2d page (STA's list, lab, tables, exam). Styles: PHY's `main`, `mobile`, and `practice`, plus the Statics rules that are not in those files, plus STA's page sheet for the plot2d host. Router: both grammars, selected by `routes`.

`defineCourse` is wired when the first course's manifest can call it without a behavior change, which is step 6, after the shell can read the manifest. The track bar and `prereqs` links are the last step in the plan's list, after the four courses pass on the carved engine.

---

## What I will not do

- Deploy, or merge to `main`. PHY's Exam 5 is 23 Oct 2026. The live site stays as it is.
- Edit `courses/*/incoming/` or `.canvas-state.json`.
- Put STA's removed notes, review sheet, or notes-example cases back. `SETS` stays empty.
- Put a course id, a colour legend ("yellow means E"), or a unit name (`lb`, `eps0`) in `packages/core`.
- Unify `num()`'s call signature across the banks in this phase.
- Rebuild STA's page inside the three.js HUD.

## Choice

I am not blocked. One place is worth a yes or a no before the shell move, because it is the only fork that would change what a student sees rather than where a function lives.

**STA stays on its own page, and the 3D courses stay on the HUD.** Core hosts both. The other way is to rebuild STA into the three.js chrome. I will not do that: it would drop modes, the today card, `fitMath`, and the overflow check's layout, and a red check gets reverted rather than patched. Say if you want that rebuild anyway. Otherwise step 2 follows the order above, starting at `tex/` and `storage/`.
