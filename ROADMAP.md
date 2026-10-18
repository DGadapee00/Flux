# Flux roadmap

Status (18 Oct 2026): **Phase R.** Dynamics (EGN 3321) passes the scorecard and waits for the
owner's review. Next: EML 3100, then EGN 3331, each unit built to the standard. Nothing touches
`courses/phy2049` before 24 Oct 2026 (Exam 5 is 23 Oct). New courses start only from a confirmed
spine (D18).

This file says what to build next and why. `AGENTS.md` has the rules. `docs/COURSE-STANDARD.md` is
the bar. `DECISIONS.md` records what is settled. `docs/courses/<id>.md` is each course's plan. The
old phase-by-phase plan is archived in `docs/history/PLAN-2026-10-18.md`.

## How an agent picks work

1. Take the first unchecked item in **Now**. Do not start anything from **Next** or **Later**.
2. Read `AGENTS.md`, `docs/COURSE-STANDARD.md`, and the course's spine.
3. Use the skill for the job: `flux-new-course`, `flux-build-unit`, `flux-review-unit`, or
   `flux-content-drop` (`.claude/skills/`).
4. One unit per PR. Every course's checks stay green. Never set `standard: true`; the owner does.
5. When an item is done, tick it here in the same PR and update the status line.

---

## 1. End state

Flux is one study platform for the owner's mechanical-engineering degree at UNF, good enough that
the department would use it in place of paid homework platforms. Each course is a module with the
same four things in the same places:

1. **Explore:** labs where moving a parameter corrects an intuition.
2. **Practice:** generated problems with staged hints, named-mistake feedback, faded worked examples,
   spaced review, practice exams, and a second opinion from the lab.
3. **Notes:** the course rewritten, derived not listed, linked both ways to labs and problems.
4. **Exam view:** units dated to the course's exams.

Courses sit in **tracks** (a subject followed through the degree), so a later course links back to
where an idea was taught. The **applications side** runs the other way: start from the 25 lbf
methalox engine, ask what physics governs each part, and link down into the course that teaches it.

What makes it one platform: one engine and one set of shells (a fix reaches every course), shared
subject libraries (a function written for one course serves the next), and one standard.

## 2. Where each course stands

| Course | Spine | Built | Scorecard | Next |
|---|---|---|---|---|
| PHY 2049 Physics II | [phy2049](docs/courses/phy2049.md) | reference | n/a until 24 Oct | weekly drops; shell move after 24 Oct |
| PHY 2048 Physics I | [phy2048](docs/courses/phy2048.md) | library and bank, no UI | fails | R5 after the physics shell |
| MAC 2311 Calculus I | [mac2311](docs/courses/mac2311.md) | 4 units, notes | fails | R4 |
| MAC 2312 Calculus II | [mac2312](docs/courses/mac2312.md) | 4 units, notes | fails | R4 |
| MAC 2313 Calculus III | [mac2313](docs/courses/mac2313.md) | labs and bank, no notes | fails | R4 |
| EGN 3311 Statics | [statics](docs/courses/statics.md) | labs and bank, no notes | fails | R4 |
| EGN 3321 Dynamics | [egn3321](docs/courses/egn3321.md) | 7 units, notes | **passes** | owner review |
| EGN 3331 Mechanics of Materials | [egn3331](docs/courses/egn3331.md) | Unit 1 of 10 | fails | R3, after EML 3100 |
| EML 3100 Thermodynamics | [eml3100](docs/courses/eml3100.md) | 2 units (Yan order) | fails | R3: reconcile units, then build |
| STA 3032 Statistics | [sta3032](docs/courses/sta3032.md) | complete, older style | fails | keep passing; no rework |

## 3. Now

### Phase R: rework every course to the standard (except PHY 2049)

- [x] **R0** Scorecard (`npm run scorecard`), `standard: false` in every manifest.
- [x] **R1** The practice loop in the shells (`packages/shells/practice`).
- [x] **R2** Dynamics to the standard. Waits on the owner's review.
- [ ] **This PR:** the reference guide (AGENTS.md, this roadmap, DECISIONS.md, the standard reframed,
      a spine for every course, the skills). Owner reviews and answers the open decisions.
- [ ] **R3a EML 3100.** First reconcile its spine (units in the course pack's order or Yan's), then
      build each unit to the standard: labs with predictions, an application lab per unit, notes
      with setups, problems with traps and structure. Engine hooks: `nozzle` and `isentropic` for
      the Nozzle page.
- [ ] **R3b EGN 3331.** Units 2–10, each to the standard. Engine hooks: `vessel` (chamber and tank
      hoop stress), bolts in combined loading.
- [ ] **R4** Review courses: MAC 2311, MAC 2312, MAC 2313 (notes needed), Statics (notes needed).
      Replace range-widened templates; add conceptual problems, traps, application labs.
- [ ] **R5** PHY 2048 on the physics shell, after Phase 2b.
- STA 3032: keep its checks passing. Rework only if the owner asks.

### Platform items that can run beside Phase R

- [ ] **Deploy secrets.** `deploy.yml` publishes `main` only when `CLOUDFLARE_API_TOKEN` and
      `CLOUDFLARE_ACCOUNT_ID` are set in the repo's secrets. Until then the live site moves only on
      `npm run deploy`. Owner to confirm they are set.
- [ ] **Phase 2b, after 24 Oct 2026:** move PHY 2049's HUD, practice panel and styles into
      `packages/shells/physics/`, unchanged, with PHY's tests and gallery identical before and after.
      PHY 2048 then builds on it.
- [ ] A banner on the frozen flux-phy2049 site pointing to Flux.

## 4. Next: the courses still ahead

Build each course **the term before the owner takes it**, so it is ready on day one. The order below
follows the 2020–21 BSME curriculum map; confirm it against Degree Works (D22). Within a term,
propulsion-relevant courses go first. At most two courses are in progress at once (D18).

| When taken (map) | Course | Spine | OCW standard | Engine link |
|---|---|---|---|---|
| Spring 2027 or taken | MAP 2302 Differential Equations | [map2302](docs/courses/map2302.md) | 18.03SC (Fall 2011) | blowdown, chamber fill, regulator |
| Fall 2027 | EML 3101 Thermodynamics II | [eml3101](docs/courses/eml3101.md) | 16.050 (Fall 2002) | combustion, nozzle |
| Fall 2027 | EML 3015 Fluids | [eml3015](docs/courses/eml3015.md) | 2.06 (Spring 2013) | thrust, injector C_d, feed lines |
| Fall 2027 | EGN 3203 Modern Computation Methods | [egn3203](docs/courses/egn3203.md) | 2.086 (Spring 2013) | area–Mach inversion, blowdown |
| Spring 2028 | EML 4140 Heat Transfer | [eml4140](docs/courses/eml4140.md) | 2.51 (Fall 2008) | heat-sink run time, Bartz |
| Spring 2028 | EML 4312 Dynamic Systems | [eml4312](docs/courses/eml4312.md) | 2.003SC (Fall 2011), 2.004 (Spring 2008) | thrust stand, chamber lag |
| Spring 2028 | EML 4501 Machine Design | [eml4501](docs/courses/eml4501.md) | 2.72 (Spring 2009) | flange bolts, regulator spring |
| Spring 2028 | EML 4320C Design and Manufacturing | [eml4320c](docs/courses/eml4320c.md) | 2.008 (Spring 2004) | orifice tolerance, machining |
| Fall 2028 | EML 4507C Finite Elements | [eml4507c](docs/courses/eml4507c.md) | 2.092 (Fall 2009) | chamber wall, Lamé |
| Fall 2028 | EML 4301C Control of Machinery | [eml4301c](docs/courses/eml4301c.md) | 2.004 (Spring 2008) | regulator as P control |
| Taken (review) | EMA 3010 Materials Science | [ema3010](docs/courses/ema3010.md) | 3.091 (Fall 2018) | chamber material |
| Summer 2027 or taken | EEL 3111 Circuit Analysis I | [eel3111](docs/courses/eel3111.md) | 6.002 (Spring 2007) | load cell, solenoid valve |

So the build order, if the map holds and the owner confirms:

1. **Before Spring 2027:** Phase R (R3). MAP 2302 too, if he takes it with EML 3100.
2. **During Spring 2027:** EML 3101, then EML 3015, then EGN 3203. EEL 3111 if it is a summer course.
3. **During Fall 2027:** EML 4140, EML 4312, EML 4501, EML 4320C.
4. **During Spring 2028:** EML 4507C, EML 4301C.
5. **Review courses** (EMA 3010, and MAP 2302 or EEL 3111 if already taken) after the courses ahead,
   and after Phase R's R4.

Each new course starts the same way (skill `flux-new-course`):

1. Complete the spine: the UNF syllabus if available, the textbook choice (D21), the OCW lecture and
   problem-set map unit by unit, the exam style.
2. The owner confirms the spine. No code before that.
3. First slice: manifest, catalog of every unit (unbuilt labs as `coming`), `PROVENANCE.md`,
   `CONVENTIONS.md`, `src/data/textbook.js`, the hub and track entries, and Unit 1 built to the
   standard. Merge and deploy.
4. One unit per PR, each to the standard.
5. Owner review, then `standard: true`.

### Tracks

Proposed for the courses ahead (D19, open):

| Track | Courses, in order |
|---|---|
| Physics | PHY 2048 → PHY 2049 |
| Math | MAC 2311 → MAC 2312 → MAC 2313 → MAP 2302 → EGN 3203 |
| Mechanics | EGN 3311 → EGN 3321, EGN 3331 → EML 4501 → EML 4507C |
| Thermal-fluids | EML 3100 → EML 3101, EML 3015 → EML 4140 |
| Systems (new) | EEL 3111 → EML 4312 → EML 4301C |
| Materials and manufacturing (new, id `making`) | EMA 3010 → EML 4320C |
| Statistics | STA 3032 |

A course joins `packages/tracks/tracks.js` when its first slice is built.

### Out of scope for sims

Labs, CAD, programming, writing and design courses: EGN 1001C, EML 3535C, COP 2220, ENC courses,
PHY 2048L, PHY 2049L, EML 4304L, EML 4004L, EML 4551 and EML 4552. CHM 2045 could join later as a
review course; nothing is planned. Technical electives are planned when the owner picks them; a
propulsion elective would build on [16.50 Introduction to Propulsion Systems](https://ocw.mit.edu/courses/16-50-introduction-to-propulsion-systems-spring-2012/)
and [16.512 Rocket Propulsion](https://ocw.mit.edu/courses/16-512-rocket-propulsion-fall-2005/), and
belongs with the applications side.

## 5. Applications: the rocket, engine first

The applications side is top-down: vehicle, subsystem, component, then the physics, then a link into
the course lab or notes section that teaches it. It starts with the owner's **25 lbf GOX/GCH₄
engine** (DGadapee00/25lbf-methalox-engine, read-only from Flux). The full design is in
`docs/history/PLAN-2026-10-18.md`, Phase A1. In short:

- `applications/rocket/` with `defineSystem({ id, title, components })`. Dependency direction:
  `applications → shells → subjects → core`; an application links to courses, never imports them.
- `applications/rocket/design/` holds a pinned copy of the engine repo's design files, with a sync
  script and `SOURCE`. Flux never edits those numbers. Values are marked preliminary until the
  engine repo's tag `v0.2-sizing-frozen`.
- Each component page: what it does; how it is built on this engine; the physics, derived, with what
  the model leaves out; its own sim where one teaches something; **Go deeper** links into courses;
  **On the stand** links into the stand sim.
- A coverage check lists every `teaches` link whose target does not exist yet. That list is how the
  applications side tells the school side what to build.

Order:

- [x] `subjects/thermo` base (IF97, NASA-7 and NASA Glenn, isentropic flow), checked against the
      engine repo's CEA design point.
- [ ] Contract, routes, hub row, `design/` copy and its consistency selftests (c* ≈ 1644 m/s from the
      8.0 mm throat, 250 psia and 52.7 g/s; C_F ≈ 1.28 at ε = 3).
- [ ] Cutaway, **Nozzle** and **Propellants and combustion** pages, with the nozzle sim.
- [ ] Chamber, Injector, Feed system, Ignition.
- [ ] Thermal (Bartz, heat-sink transient), Structure (hoop stress, burst margin ≥ 4).
- [ ] Instrumentation and test, then the coverage report in `npm test`.
- Later: tanks, structures, the vehicle.

Every course spine lists its **Applications hooks**. When a course builds an application lab for an
engine part, the component page gains a `teaches` link to it.

## 6. Later

- **UNF adoption.** When three or more courses are `standard: true`, prepare a pitch for the
  department: what Flux does that the paid platforms do not (a lab behind every problem, named
  mistakes, notes linked both ways), the provenance and licence position (D20), and an instructor
  view if one is wanted.
- **Ingest for a second course.** Generalise the Canvas ingest into `tools/ingest`, reading the
  Canvas course id from each manifest, when another course has an instructor who agrees to weekly
  drops.
- **A reference module.** An engineering-formula cheat sheet as notes only, linked from the courses
  whose formulas it covers.
