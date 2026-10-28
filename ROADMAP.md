# Flux roadmap

Status (18 Oct 2026): **Phase R.** Dynamics (EGN 3321) passes the scorecard and waits for the
owner's review. Next: EML 3100, then EGN 3331, each re-mapped to its OCW program and built to the
standard. After that, every remaining course in order, back to back (D24). Phase 2b is done (24 Oct
2026): PHY 2049's UI lives in `packages/shells/physics/`, and PHY 2048 can be wired to it.

This file says what to build next. `AGENTS.md` has the rules. `docs/COURSE-STANDARD.md` is the bar.
`DECISIONS.md` records what is settled. `docs/course-plans/<id>.md` is each course's plan. The old
phase-by-phase plan is archived in `docs/history/PLAN-2026-10-18.md`.

## How an agent picks work

1. Take the first unchecked item in section 3. Work the list in order.
2. Read `AGENTS.md`, `docs/COURSE-STANDARD.md`, and the course's spine.
3. Use the skill for the job: `flux-new-course`, `flux-build-unit`, `flux-review-unit`, or
   `flux-content-drop` (`.claude/skills/`).
4. One unit per PR. Every course's checks stay green. Never set `standard: true`; the owner does.
5. When an item is done, tick it here in the same PR and update the status line.

---

## 1. End state

Flux is one study platform for the owner's mechanical-engineering degree at UNF, good enough that
the department would use it in place of paid homework platforms. Each course is a module with the
same three things in the same places:

1. **Explore:** labs where moving a parameter corrects an intuition.
2. **Practice:** generated problems with staged hints, named-mistake feedback, faded worked examples,
   spaced review, and a second opinion from the lab.
3. **Notes:** the course rewritten, derived not listed, linked both ways to labs and problems.

Exam dates and practice exams are set course by course when its syllabus is available (D27).

Courses sit in **tracks** (a subject followed through the degree), so a later course links back to
where an idea was taught. Each course follows its MIT OpenCourseWare program first and its textbook
second (D23).

What makes it one platform: one engine and one set of shells (a fix reaches every course), shared
subject libraries (a function written for one course serves the next), and one standard.

## 2. Where each course stands

| Course | Spine | Built | Scorecard | Next |
|---|---|---|---|---|
| PHY 2049 Physics II | [phy2049](docs/course-plans/phy2049.md) | reference | not yet scored | weekly drops; on the physics shell |
| PHY 2048 Physics I | [phy2048](docs/course-plans/phy2048.md) | on the physics shell; Units 1–4 of 13 built | fails (Units 1–4 pass) | R5: Unit 5, momentum and collisions |
| MAC 2311–2312 Calculus I and II | [mac2311-2312](docs/course-plans/mac2311-2312.md) | two modules, 4 units each, notes | fails | R4: merge into one (D28) |
| MAC 2313 Calculus III | [mac2313](docs/course-plans/mac2313.md) | labs and bank, no notes | fails | R4 |
| EGN 3311 Statics | [statics](docs/course-plans/statics.md) | labs and bank, no notes | fails | R4 |
| EGN 3321 Dynamics | [egn3321](docs/course-plans/egn3321.md) | 7 units, notes | **passes** | owner review (R2b follow-ups done) |
| EGN 3331 Mechanics of Materials | [egn3331](docs/course-plans/egn3331.md) | Units 1–8 of 11 at the standard | fails | R3b: Units 9–11 |
| EML 3100 Thermodynamics | [eml3100](docs/course-plans/eml3100.md) | 5 of 5 units to the standard | passes | owner review (`standard` stays false) |
| STA 3032 Statistics | [sta3032](docs/course-plans/sta3032.md) | complete, older style | fails | keep passing; no rework |
| Bench (electronics on the bench) | [bench](docs/course-plans/bench.md) | Units 1–3 of 9 built (engineering shell) | fails (Units 1–3 pass) | Unit 4, switching bigger things |

## 3. The build list, in order

### Phase R: next term's courses to the standard

- [x] **R0** Scorecard (`npm run scorecard`), `standard: false` in every manifest.
- [x] **R1** The practice loop in the shells (`packages/shells/practice`).
- [x] **R2** Dynamics to the standard.
- [ ] **R2b Dynamics follow-ups:** ~~swap Units 3 and 4 so momentum comes before energy (D29)~~ (done); ~~end
      each application lab's explainer with **What the course model leaves out.** (D30)~~ (done); the Hibbeler citation map,
      the Flux-units columns and the Another view links (done); the notes' parts, legend and footer (D32, done); OCW worked cases for every unit (done, from 2.003SC solutions; see `courses/egn3321/ERRATA.md`). Then the owner's review.
- [x] **Reference guide** (AGENTS.md, this roadmap, DECISIONS.md, the standard, a spine for every
      course, the skills).
- [x] **Inventory** of every course against the outline: `docs/INVENTORY.md`.
- [x] **Platform fixes from the inventory:** notes deep links (`?n=`) in the shells; the scorecard
      reads coaching files.
- [x] **Course-neutral references:** content exemplars are PHY 2049 only; `courses/starter` is the
      course to copy; course plans live in `docs/course-plans/`; the shell notes CSS styles parts and
      the legend; the word floor and the fixed end-of-section box are gone from every notes-check.
- [ ] **A math-shell starter** before MAP 2302 starts: `courses/starter` is on the engineering
      shell. Add the math-shell wiring to it (or a second starter) with the same example unit.
- [x] **R3a EML 3100.** The five-unit order in its spine (16.050 Part 0–1, then Yan; D29), confirmed
      by the owner. Units 3, 4 and 5 were already at the standard. Units 1 and 2 now have `why`,
      traps, conceptual problems, application labs (a pressure canner and a coil burner) and notes
      in PHY 2049's layout. The course scorecard passes. `standard` stays false until the owner
      works a unit as a student.
- [ ] **R3b EGN 3331.** The eleven-unit order in its spine (2.001, energy methods back; D29, D31).
      The owner confirmed the order on 28 Oct 2026. Units 1–8 are at the standard.
      Units 9–11 are still to be built.

### New courses, back to back (D24)

Each starts with `flux-new-course`: complete the spine against its OCW calendar, owner confirms,
first slice, then one unit per PR. At most two courses in progress at once (D18).

| # | Course | Spine | OCW program |
|---|---|---|---|
| 1 | MAP 2302 Differential Equations | [map2302](docs/course-plans/map2302.md) | 18.03SC (Fall 2011) |
| 2 | EEL 3111 Circuit Analysis I | [eel3111](docs/course-plans/eel3111.md) | 6.002 (Spring 2007) |
| 3 | EML 3101 Thermodynamics II | [eml3101](docs/course-plans/eml3101.md) | 16.050 (Fall 2002) |
| 4 | EML 3015 Fluids | [eml3015](docs/course-plans/eml3015.md) | 2.06 (Spring 2013) |
| 5 | EGN 3203 Modern Computation Methods | [egn3203](docs/course-plans/egn3203.md) | 2.086 (Spring 2013) |
| 6 | EML 4140 Heat Transfer | [eml4140](docs/course-plans/eml4140.md) | 2.51 (Fall 2008) |
| 7 | EML 4312 Modeling and Analysis of Dynamic Systems | [eml4312](docs/course-plans/eml4312.md) | 2.003SC (Fall 2011), 2.004 (Spring 2008) |
| 8 | EML 4501 Machine Design | [eml4501](docs/course-plans/eml4501.md) | 2.72 (Spring 2009) |
| 9 | EML 4320C Integrated Design and Manufacturing | [eml4320c](docs/course-plans/eml4320c.md) | 2.008 (Spring 2025) |
| 10 | EML 4507C Finite Element Modeling and Analysis | [eml4507c](docs/course-plans/eml4507c.md) | 2.092 (Fall 2009) |
| 11 | EML 4301C Control of Machinery | [eml4301c](docs/course-plans/eml4301c.md) | 2.004 (Spring 2008) |

The order follows prerequisites: MAP 2302 and EEL 3111 feed most of what follows; EML 4140 needs
EML 3015; EML 4312 needs EGN 3203 and EEL 3111; EML 4507C and EML 4301C come last.

### Review courses (already taken)

- [ ] **EMA 3010 Materials Science**, new: [ema3010](docs/course-plans/ema3010.md), OCW 3.091 (Fall 2018).
- [ ] **R4a Calculus I and II:** merge MAC 2311 and MAC 2312 into one module in 18.01SC's order
      (D28, `docs/course-plans/mac2311-2312.md`), keeping progress and redirecting old links. Then the
      template rework, predictions, application labs, traps and conceptual problems.
- [ ] **R4b MAC 2313:** notes, the missing vector-calculus units (Lagrange multipliers through
      Stokes), 18.02SC's order, and the same rework.
- [ ] **R4c Statics:** notes, and the same rework, with 2.001 Lectures 1–6 setting their topics'
      order (D29).
- [ ] **R5** PHY 2048 on the physics shell (Phase 2b is done; R5a catalog, bank and citations, R5b the page and Unit 1 are done, Units 2 to 4 are done, Units 5 to 13 follow, one per PR), from OpenStax *University Physics Volume 1* alone
      (D33): 13 units in book order, with drag, variable-mass, fluids, waves and sound added.
- STA 3032: keep its checks passing. Rework only if the owner asks.

### Personal projects

- [ ] **Bench**, a breadboard-electronics module beside PHY 2049 (D35,
      [bench](docs/course-plans/bench.md)). B0 (PHY 2049's schematic view in the physics shell) and
      B1 (the course on the engineering shell, and Unit 1: breadboard, multimeter, USB power) are
      done. Unit 2 (LED and resistor, LED strings, indicator LED) and Unit 3 (divider, button and
      pull-up, night light) are done. Units 4 to 9 follow, one per PR.

### Platform items that can run beside the list

- [x] **Deploys:** Cloudflare Pages builds and publishes every push to `main` (`DEPLOY.md`).
- [x] **Phase 2b:** PHY 2049's page chrome, HUD, units reference, predict card, derivations and
      practice panel, and its stylesheets, now live in `packages/shells/physics/`. PHY 2049 keeps
      `main.js`, its scene objects, its electromagnetic styles and one wrapper per module. The
      practice panel moved whole, so it is still a near copy of the math and engineering panels.
      The before-and-after gate guards it: `npm run compare -w @flux/phy2049` and the
      `scripts/interact-*.mjs` runs, each run on both trees and diffed.
- [ ] **Converge the shells on PHY 2049** (D32): the physics shell now exists. Start with the three
      practice panels, which are near copies of one another. Then bring the math and
      engineering shells' header, unit picker, mode switch, notes panel and practice panel to its
      layout, one piece per PR, every course's checks green.
- [ ] A banner on the frozen flux-phy2049 site pointing to Flux.

## 4. Tracks (D19)

| Track | Courses, in order |
|---|---|
| Physics | PHY 2048 → PHY 2049 |
| Math | Calculus I and II (MAC 2311–2312) → MAC 2313 → MAP 2302 → EGN 3203 |
| Mechanics | EGN 3311 → EGN 3321, EGN 3331 → EML 4501 → EML 4507C |
| Thermal-fluids | EML 3100 → EML 3101, EML 3015 → EML 4140 |
| Systems | EEL 3111 → EML 4312 → EML 4301C |
| Materials and manufacturing (id `making`) | EMA 3010 → EML 4320C |
| Statistics | STA 3032 |

A course joins `packages/tracks/tracks.js` when its first slice is built.

### Out of scope for sims

Labs, CAD, programming, writing and design courses: EGN 1001C, EML 3535C, COP 2220, ENC courses,
PHY 2048L, PHY 2049L, EML 4304L, EML 4004L, EML 4551 and EML 4552. CHM 2045 could join later as a
review course; nothing is planned. Technical electives are planned when the owner picks them.

## 5. Later

- **UNF adoption.** When three or more courses are `standard: true`, prepare a pitch for the
  department: what Flux does that the paid platforms do not (a lab behind every problem, named
  mistakes, notes linked both ways), the provenance and licence position (D20), and an instructor
  view if one is wanted.
- **Ingest for a second course.** Generalise the Canvas ingest into `tools/ingest`, reading the
  Canvas course id from each manifest, when another course has an instructor who agrees to weekly
  drops.
- **A reference module.** An engineering-formula cheat sheet as notes only, linked from the courses
  whose formulas it covers.
