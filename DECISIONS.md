# Decisions

Every decision that shapes how Flux is built, with its date and who made it. An agent follows these
and does not reopen them. A decision the owner has not made yet is marked **open**; an agent does
not act on an open decision's default without saying so in its PR.

The plan these came from is archived in `docs/history/PLAN-2026-10-18.md`.

## Platform

| # | Decision | Date |
|---|---|---|
| D1 | **The repo is public.** Raw course files live only in a course's `incoming/` folder, with the instructor's permission recorded, and never ship (AGENTS.md, rule 9). | 13 Oct 2026 |
| D2 | One domain for everything (`flux-study.pages.dev`), courses at `/<id>/`. Per-course subdomains only if a class needs its own link. | 13 Oct 2026 |
| D3 | Old course sites get a banner pointing to Flux at cutover and stay up through their term. | 13 Oct 2026 |
| D4 | Vanilla JS. JSDoc types on `defineCourse`, `defineLab` and `problem`; no TypeScript build. | 13 Oct 2026 |

## Courses and sources

| # | Decision | Date |
|---|---|---|
| D5 | Course codes: Statics is EGN 3311; MAC 2313 was Spring 2026; EGN 3321, EGN 3331 and EML 3100 are the codes on the owner's course packs. Other codes are confirmed when each course starts. | 15 Oct 2026 |
| D6 | **STA 3032 instructor material is out.** The instructor was not asked, so his notes, review sheets, worked cases and lab presets were removed (`courses/sta3032/PROVENANCE.md`). | 13 Oct 2026 |
| D7 | Calc I, Calc II and Physics I cite OpenStax by section: *Calculus Volumes 1–2* (CC BY-NC-SA 4.0; the plan said CC BY, corrected 18 Oct 2026) and *University Physics Volume 1* (CC BY-NC-SA 4.0; the plan said CC BY, corrected 25 Oct 2026 from the book's source repo). | 13 Oct 2026 |
| D8 | EGN 3321, EGN 3331 and EML 3100 are next term's courses (Spring 2027), built as coming courses. Dynamics first. Exam dates go in when the owner has them. | 15 Oct 2026 |
| D9 | **No numbers copied from copyrighted textbooks.** Worked cases built on Hibbeler, Çengel and similar texts use generated numbers and cite the section. No textbook example or problem number is copied or invented. (D15 adds OCW as the source of printed answers.) | 15 Oct 2026 |
| D10 | R-134a comes from the Tillner-Roth and Baehr equation of state, in a later thermodynamics PR. Water and air until then. | 15 Oct 2026 |
| D11 | ~~Course packs and syllabi set coverage and order.~~ **Superseded by D23.** Nothing from a course pack ships. Dynamics keeps the §15.9 rocket lab. | 15 Oct 2026 |
| D12 | Thermodynamics before Mechanics of Materials, and the property library before its screens. | 18 Oct 2026 |
| D13 | EML 3100 cites Yan, *Introduction to Engineering Thermodynamics* (BCcampus, CC BY-NC-SA 4.0) and OpenStax *University Physics Volume 2* Ch 1–4 (CC BY-NC-SA 4.0; corrected 25 Oct 2026), through `courses/eml3100/src/data/textbook.js`. Topics past Yan Ch 6 are cited by topic. | 18 Oct 2026 |
| D14 | EGN 3331 cites Roylance, *Mechanics of Materials* (MIT OCW 3.11, CC BY-NC-SA 4.0), through `courses/egn3331/src/data/textbook.js`. Topics the modules do not treat are cited by topic. | 18 Oct 2026 |

## Quality and process

| # | Decision | Date |
|---|---|---|
| D15 | **MIT OpenCourseWare is the standard for material.** Every course names its OCW counterpart in its spine. The counterpart is the coverage check for each unit, the difficulty bar for level-3 problems, and the source of worked cases whose printed answers our templates reproduce (cited by course, term, problem set and problem). Its text, figures and problem statements are not copied: Flux writes its own and cites. MIT's name appears only as attribution, never as endorsement. Details: `docs/COURSE-STANDARD.md`, section 7. | 18 Oct 2026 (owner) |
| D16 | **No word count for notes and no principle-tag requirement.** Principle tags stay optional. (The "which principle decides this problem?" step it mentioned was removed by D34.) | 18 Oct 2026 (owner) |
| D17 | **The standard is PHY 2049's exemplars and the owner's review; the scorecard is a floor.** A course passes the scorecard and then the owner works one unit as a student before its manifest says `standard: true`. | 18 Oct 2026 (owner) |
| D18 | **Spine before code, and few courses in flight.** A course's spine (`docs/course-plans/<id>.md`) is confirmed by the owner before code is written. At most two courses have units in progress at once, besides Phase R rework. A course is finished to the standard before the next one starts, unless the owner says otherwise. | 18 Oct 2026 (owner) |
| D19 | **Tracks.** Math gains MAP 2302 then EGN 3203; Mechanics gains EML 4501 then EML 4507C; Thermal-fluids is EML 3100, EML 3101, EML 3015, EML 4140; a new **Systems** track is EEL 3111, EML 4312, EML 4301C; a new **Materials and manufacturing** track (id `making`) is EMA 3010, EML 4320C. A course joins `packages/tracks` when its first slice is built. | 18 Oct 2026 (owner) |
| D22 | **Which courses remain.** Taken: everything on the 2020–21 curriculum map before year 3 except MAP 2302 and EEL 3111, so EMA 3010 and COP 2220 are done. Not taken: MAP 2302, EEL 3111, and every year-3 and year-4 course. | 18 Oct 2026 (owner) |
| D23 | **The OCW program comes first, then the textbook.** A course's OCW counterpart sets its units, their order and its coverage. The textbook fills in what OCW does not cover and is what problems and notes cite by section. The UNF syllabus or course pack, when available, adds exam dates, exam style, and any topic UNF covers that OCW does not. Replaces D11. | 18 Oct 2026 (owner) |
| D24 | **Build every remaining course in order, back to back.** No waiting for the term before the owner takes a course. The order is ROADMAP.md, section 4. D18 still holds: spine confirmed first, at most two in progress. | 18 Oct 2026 (owner) |
| D25 | **The methalox engine stays out of Flux for now.** Flux is built as a general study platform first. Application labs use everyday and industrial devices. Connecting the engine is a later project. The earlier engine plan is in `docs/history/PLAN-2026-10-18.md`, Phase A1. | 18 Oct 2026 (owner) |
| D26 | **No dated "do not edit" limits in the guidance docs.** Rules describe how to work, not temporary freezes. An exam-week freeze is given to an agent in its task, not written into AGENTS.md. | 18 Oct 2026 (owner) |
| D27 | **No standard "exam view".** Exam dates and practice-exam shape are set course by course when its syllabus is available. | 18 Oct 2026 (owner) |
| D28 | **Calculus I and II are one module; PHY 2049 keeps its order.** MAC 2311 and MAC 2312 merge into one Calculus I and II module that follows 18.01SC from differentiation to Taylor series, with sequences and convergence tests from OpenStax. PHY 2049 follows its instructor's order; 8.02 is its Another view. | 18 Oct 2026 (owner) |
| D29 | **When an OCW course's scope differs from the UNF course,** the spine maps each unit to the OCW lectures that cover it, from more than one OCW course if needed (Dynamics: 8.01SC and 2.003SC). OCW sets the order where it has one; the textbook orders the rest. | 18 Oct 2026 (owner) |
| D30 | **"What the model leaves out" goes in two places:** the explainer of every application lab, ending with **What the course model leaves out.**, and a `box out` in every notes section that uses an idealisation. Concept-lab explainers need not have it. `out` joins the standard's box types. | 18 Oct 2026 (owner) |
| D31 | **EGN 3331 teaches energy methods** (Hibbeler Ch 14), as 2.001 does. Reverses the course pack's omission under D11. | 18 Oct 2026 (owner) |

| D32 | **PHY 2049 is the benchmark for every course.** Where any course differs from PHY 2049 (notes structure and boxes, lab explainers, the practice loop, layout), PHY 2049's version is the target. Notes group sections into `div.part` with a legend, as PHY's do, and place boxes where the content needs them, not one of each per section. The shells converge on PHY 2049's layout after Phase 2b. The one exception is unit order, which comes from OCW (D23); PHY 2049 keeps its own (D28). | 18 Oct 2026 (owner) |
| D33 | **PHY 2048 is built from OpenStax *University Physics Volume 1* alone, for now.** OCW 8.01SC is set aside; its index stays and EGN 3321 still uses it. The 13 units follow the book's chapters 1–17 in book order. Difficulty levels come from the book's section, additional and challenge problems. A stated exception to D23 for this course; revisit when the owner brings OCW back. | 25 Oct 2026 (owner) |
| D34 | **No "which principle decides this problem?" step.** Practice problems do not ask the student to name the principle before solving, in any course or shell, and no guide prescribes it. Principle tags stay optional and still drive the deciding-principle line, "what went wrong", the weak-principle list and the group-by-principle view. PHY 2049 has its own copy of the step; it is removed once its exam freeze ends (24 Oct 2026). | 19 Oct 2026 (owner) |
| D35 | **Bench, a breadboard-electronics module, is built from its own plan** (`docs/course-plans/bench.md`), not from an OCW calendar. It is a personal-projects module with no UNF course behind it. Units follow the plan's goal-first order; Kuphaldt's *Lessons in Electric Circuits* and the parts' datasheets are cited for content and numbers. MIT 6.091 (IAP 2008), whose labs the owner shared, is an Another view only; nothing from it is copied. It joins a new `projects` track. Unit 8 models a microcontroller's pins and shows code without running it. A stated exception to D23, like D33. | 27 Oct 2026 (owner) |
| D36 | **Dynamics covers what its mapped OCW lectures cover (D23 over D11).** The seven-unit order stays (D29). Polar coordinates join Unit 1 (Hibbeler §12.8, §13.6; 8.01SC circular motion, 2.003SC lecture 2). Pulley constraints and drag join Unit 2 (§12.9; 8.01SC lessons 12 and 14). Rotating axes and the Coriolis term join Unit 5 (§16.8; 2.003SC lectures 2 and 4). Rigid-body impulse and momentum (Hibbeler Ch 19; 8.01SC 33–34 and 37.3–37.4; 2.003SC lectures 3, 6 and 7) is a new Unit 8. Central-force orbits (§13.7) and steady flow (§15.8) stay out. Five application labs built on the rocket engine theme are replaced by everyday and industrial devices (D25). | 28 Oct 2026 (owner) |

## Open

| # | Question | Default until answered |
|---|---|---|
| D20 | **Flux's own licence.** The repo has no LICENSE file, so it is all rights reserved by default. Flux cites OpenStax and OCW but copies nothing, so there is no conflict today. If Flux ever adapts CC BY-NC-SA text, those parts must carry that licence. A common pattern is MIT licence for code and CC BY-NC-SA for content; settle it before pitching UNF. | No licence file; copy nothing. |
| D21 | **Textbook for each remaining course.** Each spine lists candidates. Open texts preferred, as D7, D13 and D14 chose. | Cite by topic until chosen. |
