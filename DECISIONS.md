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
| D-A1 | **Methane's heat of formation** on engine pages is −74.873 kJ/mol, the reactant enthalpy in the engine repo's CEA input, so pages reproduce its design point. `subjects/thermo` keeps −74.600 kJ/mol (GRI-Mech, NASA Glenn); its test explains the gap. | 18 Oct 2026 |

## Courses and sources

| # | Decision | Date |
|---|---|---|
| D5 | Course codes: Statics is EGN 3311; MAC 2313 was Spring 2026; EGN 3321, EGN 3331 and EML 3100 are the codes on the owner's course packs. Other codes are confirmed when each course starts. | 15 Oct 2026 |
| D6 | **STA 3032 instructor material is out.** The instructor was not asked, so his notes, review sheets, worked cases and lab presets were removed (`courses/sta3032/PROVENANCE.md`). | 13 Oct 2026 |
| D7 | Calc I, Calc II and Physics I cite OpenStax by section: *Calculus Volumes 1–2* (CC BY-NC-SA 4.0; the plan said CC BY, corrected 18 Oct 2026) and *University Physics Volume 1* (CC BY 4.0). | 13 Oct 2026 |
| D8 | EGN 3321, EGN 3331 and EML 3100 are next term's courses (Spring 2027), built as coming courses. Dynamics first. Exam dates go in when the owner has them. | 15 Oct 2026 |
| D9 | **No numbers copied from copyrighted textbooks.** Worked cases built on Hibbeler, Çengel and similar texts use generated numbers and cite the section. No textbook example or problem number is copied or invented. (D15 adds OCW as the source of printed answers.) | 15 Oct 2026 |
| D10 | R-134a comes from the Tillner-Roth and Baehr equation of state, in a later thermodynamics PR. Water and air until then. | 15 Oct 2026 |
| D11 | **Course packs and syllabi set coverage and order only.** Sections they do not name stay out. Nothing from them ships. Dynamics keeps the §15.9 rocket lab. | 15 Oct 2026 |
| D12 | Thermodynamics before Mechanics of Materials, and the property library before its screens. | 18 Oct 2026 |
| D13 | EML 3100 cites Yan, *Introduction to Engineering Thermodynamics* (BCcampus, CC BY-NC-SA 4.0) and OpenStax *University Physics Volume 2* Ch 1–4 (CC BY 4.0), through `courses/eml3100/src/data/textbook.js`. Topics past Yan Ch 6 are cited by topic. | 18 Oct 2026 |
| D14 | EGN 3331 cites Roylance, *Mechanics of Materials* (MIT OCW 3.11, CC BY-NC-SA 4.0), through `courses/egn3331/src/data/textbook.js`. Topics the modules do not treat are cited by topic. | 18 Oct 2026 |

## Quality and process

| # | Decision | Date |
|---|---|---|
| D15 | **MIT OpenCourseWare is the standard for material.** Every course names its OCW counterpart in its spine. The counterpart is the coverage check for each unit, the difficulty bar for level-3 problems, and the source of worked cases whose printed answers our templates reproduce (cited by course, term, problem set and problem). Its text, figures and problem statements are not copied: Flux writes its own and cites. MIT's name appears only as attribution, never as endorsement. Details: `docs/COURSE-STANDARD.md`, section 7. | 18 Oct 2026 (owner) |
| D16 | **No word count for notes and no principle-tag requirement.** Principle tags stay optional: a course that supplies them gets the principle step. | 18 Oct 2026 (owner) |
| D17 | **The standard is PHY 2049's exemplars and the owner's review; the scorecard is a floor.** A course passes the scorecard and then the owner works one unit as a student before its manifest says `standard: true`. Proposed with this PR. | proposed 18 Oct 2026 |
| D18 | **Spine before code, and few courses in flight.** A course's spine (`docs/courses/<id>.md`) is confirmed by the owner before code is written. At most two courses have units in progress at once, besides Phase R rework. A course is finished to the standard before the next one starts, unless the owner says otherwise. Proposed with this PR. | proposed 18 Oct 2026 |

## Open

| # | Question | Default until answered |
|---|---|---|
| D19 | **Tracks for the remaining courses.** Proposed: Math gains MAP 2302 then EGN 3203; Mechanics gains EML 4501 then EML 4507C; Thermal-fluids is EML 3100, EML 3101, EML 3015, EML 4140; a new **Systems** track is EEL 3111, EML 4312, EML 4301C; a new **Materials and manufacturing** track (id `making`) is EMA 3010, EML 4320C. | Nothing is added to `packages/tracks` until a course is built. |
| D20 | **Flux's own licence.** The repo has no LICENSE file, so it is all rights reserved by default. Flux cites OpenStax and OCW but copies nothing, so there is no conflict today. If Flux ever adapts CC BY-NC-SA text, those parts must carry that licence. A common pattern is MIT licence for code and CC BY-NC-SA for content; the owner decides, ideally before pitching UNF. | No licence file; copy nothing. |
| D21 | **Textbook for each remaining course.** Each spine lists candidates. Open texts preferred, as D7, D13 and D14 chose. | Cite by topic until chosen. |
| D22 | **Which courses remain.** The roadmap uses the 2020–21 BSME curriculum map. Whether MAP 2302, EMA 3010, EEL 3111 and COP 2220 are already taken is unconfirmed (Degree Works). | Treat them as not taken, after the courses that are certainly ahead. |
