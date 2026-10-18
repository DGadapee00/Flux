# Flux roadmap

Status (18 Oct 2026): **Phase R.** Dynamics (EGN 3321) passes the scorecard and waits for the
owner's review. Next: EML 3100, then EGN 3331, each re-mapped to its OCW program and built to the
standard. After that, every remaining course in order, back to back (D24).

This file says what to build next. `AGENTS.md` has the rules. `docs/COURSE-STANDARD.md` is the bar.
`DECISIONS.md` records what is settled. `docs/courses/<id>.md` is each course's plan. The old
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
| PHY 2049 Physics II | [phy2049](docs/courses/phy2049.md) | reference | not yet scored | weekly drops; Phase 2b shell move |
| PHY 2048 Physics I | [phy2048](docs/courses/phy2048.md) | library and bank, no UI | fails | R5, after the physics shell |
| MAC 2311 Calculus I | [mac2311](docs/courses/mac2311.md) | 4 units, notes | fails | R4 |
| MAC 2312 Calculus II | [mac2312](docs/courses/mac2312.md) | 4 units, notes | fails | R4 |
| MAC 2313 Calculus III | [mac2313](docs/courses/mac2313.md) | labs and bank, no notes | fails | R4 |
| EGN 3311 Statics | [statics](docs/courses/statics.md) | labs and bank, no notes | fails | R4 |
| EGN 3321 Dynamics | [egn3321](docs/courses/egn3321.md) | 7 units, notes | **passes** | owner review |
| EGN 3331 Mechanics of Materials | [egn3331](docs/courses/egn3331.md) | Unit 1 of 10 | fails | R3b: re-map to OCW, then build |
| EML 3100 Thermodynamics | [eml3100](docs/courses/eml3100.md) | 2 units | fails | R3a: re-map to OCW, then build |
| STA 3032 Statistics | [sta3032](docs/courses/sta3032.md) | complete, older style | fails | keep passing; no rework |

## 3. The build list, in order

### Phase R: next term's courses to the standard

- [x] **R0** Scorecard (`npm run scorecard`), `standard: false` in every manifest.
- [x] **R1** The practice loop in the shells (`packages/shells/practice`).
- [x] **R2** Dynamics to the standard. Waits on the owner's review.
- [x] **Reference guide** (AGENTS.md, this roadmap, DECISIONS.md, the standard, a spine for every
      course, the skills).
- [ ] **R3a EML 3100.** Re-map the spine's units to 16.050's calendar, then Yan, keeping any
      course-pack topic 16.050 lacks (D23). Owner confirms the spine. Then each unit to the standard.
- [ ] **R3b EGN 3331.** The same: re-map to 3.11 and 2.001, then Roylance. Owner confirms. Units 2–10
      to the standard.

### New courses, back to back (D24)

Each starts with `flux-new-course`: complete the spine against its OCW calendar, owner confirms,
first slice, then one unit per PR. At most two courses in progress at once (D18).

| # | Course | Spine | OCW program |
|---|---|---|---|
| 1 | MAP 2302 Differential Equations | [map2302](docs/courses/map2302.md) | 18.03SC (Fall 2011) |
| 2 | EEL 3111 Circuit Analysis I | [eel3111](docs/courses/eel3111.md) | 6.002 (Spring 2007) |
| 3 | EML 3101 Thermodynamics II | [eml3101](docs/courses/eml3101.md) | 16.050 (Fall 2002) |
| 4 | EML 3015 Fluids | [eml3015](docs/courses/eml3015.md) | 2.06 (Spring 2013) |
| 5 | EGN 3203 Modern Computation Methods | [egn3203](docs/courses/egn3203.md) | 2.086 (Spring 2013) |
| 6 | EML 4140 Heat Transfer | [eml4140](docs/courses/eml4140.md) | 2.51 (Fall 2008) |
| 7 | EML 4312 Modeling and Analysis of Dynamic Systems | [eml4312](docs/courses/eml4312.md) | 2.003SC (Fall 2011), 2.004 (Spring 2008) |
| 8 | EML 4501 Machine Design | [eml4501](docs/courses/eml4501.md) | 2.72 (Spring 2009) |
| 9 | EML 4320C Integrated Design and Manufacturing | [eml4320c](docs/courses/eml4320c.md) | 2.008 (Spring 2004) |
| 10 | EML 4507C Finite Element Modeling and Analysis | [eml4507c](docs/courses/eml4507c.md) | 2.092 (Fall 2009) |
| 11 | EML 4301C Control of Machinery | [eml4301c](docs/courses/eml4301c.md) | 2.004 (Spring 2008) |

The order follows prerequisites: MAP 2302 and EEL 3111 feed most of what follows; EML 4140 needs
EML 3015; EML 4312 needs EGN 3203 and EEL 3111; EML 4507C and EML 4301C come last.

### Review courses (already taken)

- [ ] **EMA 3010 Materials Science**, new: [ema3010](docs/courses/ema3010.md), OCW 3.091 (Fall 2018).
- [ ] **R4** MAC 2311, MAC 2312, MAC 2313 (notes needed), Statics (notes needed): re-map each to its
      OCW program (18.01SC, 18.02SC, 2.001), replace range-widened templates, add conceptual
      problems, traps and application labs.
- [ ] **R5** PHY 2048 on the physics shell, after Phase 2b.
- STA 3032: keep its checks passing. Rework only if the owner asks.

### Platform items that can run beside the list

- [ ] **Deploy secrets.** `deploy.yml` publishes `main` only when `CLOUDFLARE_API_TOKEN` and
      `CLOUDFLARE_ACCOUNT_ID` are set in the repo's Actions secrets. Until then the live site moves
      only on `npm run deploy`.
- [ ] **Phase 2b:** move PHY 2049's HUD, practice panel and styles into `packages/shells/physics/`,
      unchanged, with PHY's tests and gallery identical before and after. PHY 2048 then builds on it.
- [ ] A banner on the frozen flux-phy2049 site pointing to Flux.

## 4. Tracks (D19)

| Track | Courses, in order |
|---|---|
| Physics | PHY 2048 → PHY 2049 |
| Math | MAC 2311 → MAC 2312 → MAC 2313 → MAP 2302 → EGN 3203 |
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
