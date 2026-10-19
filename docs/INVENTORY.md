# Inventory: every course against the new outline

Taken 18 Oct 2026 on `main` at `6fedfe1`, against `docs/COURSE-STANDARD.md`, `DECISIONS.md` (D15–D27)
and each course's spine. Nothing here has been fixed yet. This is the starting line for Phase R and
the build list in `ROADMAP.md`.

How it was measured:

- `npm run scorecard -- --units` for the standard's thresholds.
- A one-off script over every course's manifest, catalog, problem bank, notes files, lab files and
  scripts, for what the scorecard does not count (notes structure, lab explainers, levels, practice
  flags, citation maps, OCW citations).
- Every course opened in a browser at 1280×800 and 380×820: a lab, a notes deep link (`?n=s1`) and a
  practice deep link (`?p=…`).
- The OCW program's calendar for each built course, compared with the built units (D23).

Legend: ✓ meets the outline. ◐ partly. ✗ missing. "n/a" does not apply.

---

## 1. At a glance

| Course | Same app | Notes | Labs | Problems | Practice loop | Sources | OCW order |
|---|---|---|---|---|---|---|---|
| PHY 2049 (reference) | ✓ own UI | ◐ Exams 1–5 only | ◐ | ◐ | ✓ own copy | ◐ | keeps its order (D28) |
| PHY 2048 | ✗ no UI yet | ✗ none | ✗ none | ✗ | ✗ | ◐ | ◐ |
| MAC 2311 | ✓ math shell | ◐ | ✗ | ✗ | ◐ | ◐ | ◐ merge (D28) |
| MAC 2312 | ✓ math shell | ◐ | ✗ | ✗ | ◐ | ◐ | ◐ merge (D28) |
| MAC 2313 | ✓ math shell | ✗ none | ✗ | ✗ | ✗ | ◐ | ✗ coverage gap |
| EGN 3311 Statics | ✓ eng. shell | ✗ none | ✗ | ✗ | ✗ | ◐ | ◐ OCW narrower |
| EGN 3321 Dynamics | ✓ eng. shell | ✓ | ✓ | ✓ | ✓ | ◐ | ◐ swap Units 3–4 |
| EGN 3331 | ✓ eng. shell | ◐ Unit 1 of 11 | ◐ | ✗ | ◐ | ✓ map | ◐ new order planned |
| EML 3100 | ✓ eng. shell | ◐ 2 units | ◐ | ✗ | ◐ | ✓ map | ✓ built units in order |
| STA 3032 | ✗ separate app | ✗ removed | ◐ | ◐ | ◐ own | ◐ | not reworked |

Only Dynamics is close to the outline. Every course, Dynamics included, is missing two things the
outline added on 18 Oct: worked cases from OCW solutions, and **Another view** links to OCW.

### Scorecard (the floor)

| Course | Templates | Lab examples per unit (min) | Predictions per lab (min) | App labs per unit (min) | Conceptual (min unit) | `why` | ≥2 traps | ≥2 hints | Structure | Cited case |
|---|---|---|---|---|---|---|---|---|---|---|
| PHY 2049 | 276 | 0 | 1 | 0 | 14% | 48%* | 0%* | 74%* | 18% | 100% |
| PHY 2048 | 67 | 0 | 0 | 0 | 0% | 0% | 0% | 6% | 0% | 100% |
| MAC 2311 | 39 | 2 | 0 | 0 | 0% | 0% | 0% | 100% | 0% | 100% |
| MAC 2312 | 48 | 3 | 0 | 0 | 10% | 0% | 0% | 100% | 0% | 100% |
| MAC 2313 | 82 | 0 | 0 | 0 | 25% | 0% | 0% | 100% | 1% | 100% |
| Statics | 34 | 0 | 0 | 0 | 9% | 0% | 0% | 74% | 18% | 100% |
| **Dynamics** | 89 | 9 | 2 | 1 | 31% | 100% | 100% | 100% | 83% | 100% |
| EGN 3331 | 11 | 0 | 0 | 0 | 0% | 0% | 0% | 100% | 9% | 100% |
| EML 3100 | 17 | 5 | 3 | 0 | 0% | 0% | 0% | 100% | 0% | 100% |
| STA 3032 | 96 | 0 | 0 | 0 | 16% | 52% | 31% | 98% | 64% | 17% |

\* PHY 2049 keeps its hints and wrong-answer `why` in `src/problems/coaching/`, which the scorecard
does not read. Its real coverage is higher than shown (section 2, item 3).

### What else the script found

| Course | Labs built | Labs with an explainer | Explainer says what the model leaves out | Levels 1 / 2 / 3 | Problems that open their lab (`sim`) | Coaching files | `textbook.js` | CONVENTIONS |
|---|---|---|---|---|---|---|---|---|
| PHY 2049 | 34 | all (7 share a module's) | 8 (the app labs) | 156 / 91 / 29 | 157 of 276 | 9 | ✗ | ✓ (CLAUDE.md) |
| PHY 2048 | 0 | n/a | n/a | 67 / 0 / 0 | 0 | 0 | ✗ | ✗ |
| MAC 2311 | 6 | 6 | 0 | 13 / 24 / 2 | 11 of 39 | 0 | ✗ | ✗ |
| MAC 2312 | 8 | 8 | 0 | 21 / 25 / 2 | 22 of 48 | 0 | ✗ | ✗ |
| MAC 2313 | 17 | 17 | 0 | 40 / 42 / 0 | 60 of 82 | 0 | ✗ | ✓ |
| Statics | 8 | 8 | 0 | 10 / 19 / 5 | 28 of 34 | 0 | ✗ | ✓ |
| Dynamics | 24 | 24 | 0 | 26 / 51 / 12 | 39 of 89 | 8 | ✗ | ✓ |
| EGN 3331 | 3 (+17 coming) | 3 | 0 | 4 / 5 / 2 | 7 of 11 | 0 | ✓ | ✓ |
| EML 3100 | 2 | 2 | 0 | 8 / 6 / 3 | 9 of 17 | 0 | ✓ | ✓ |
| STA 3032 | 10 | own format | n/a | 48 / 37 / 11 | 0 | 0 | ✗ | ✓ |

Notes files, box by box (all files in each course added up):

| Course | Units with notes | `ex` | `why` | `fix` | `key` | `out` (leaves out) | `div.part` / legend | OCW links | Avg sentence |
|---|---|---|---|---|---|---|---|---|---|
| PHY 2049 | 5 of 8 | 151 | 36 | 83 | 12 | 0 | ✓ / ✓ | 0 | 13–17 words |
| MAC 2311 | 4 of 4 | 55 | 29 | 30 | 27 | 27 | ✗ / ✗ | 0 | 10 |
| MAC 2312 | 4 of 4 | 53 | 23 | 25 | 25 | 25 | ✗ / ✗ | 0 | 10 |
| Dynamics | 7 of 7 | 180 | 53 | 48 | 46 | 46 | ✗ / ✗ | 0 | 11–12 |
| EGN 3331 | 1 of 10 | 13 | 6 | **0** | 6 | 6 | ✗ / ✗ | 0 | 13 |
| EML 3100 | 2 of 2 | 23 | 14 | 3 | 10 | 10 | ✗ / ✗ | 0 | 12 |

No notes file uses `$` as a delimiter. PHY 2049's Exam 3 notes have two em dashes; no other notes
file has any.

---

## 2. Gaps that belong to the platform, not a course

Fix these once and every course gains.

1. **Notes deep links work only in PHY 2049.** `?n=s1` opens the notes there. In the math and
   engineering shells the router (`packages/core/src/shell/lab-route.js`) reads only `p` and `s`, so
   the link opens the lab. The outline promises `?n=<section>` everywhere.
2. **Three app families, not one.** PHY 2049 runs its own UI (exam picker, Practice · Notes · Explore ·
   Units switch). The math and engineering shells share one look (track row, unit menu, Practice and
   Notes buttons). STA 3032 is a separate app ("FLUX·stats", practice-first home, Explore and Tables
   tabs). A student moving between them meets three layouts. Phase 2b (PHY into
   `packages/shells/physics/`) closes part of this; STA 3032 stays apart unless the owner asks.
3. **The scorecard misreads PHY 2049.** It reads hints and `why` only from the templates, but PHY 2049
   keeps them in `coaching/`. It also counts PHY's units with no notes (Exams 6, 7, wave) as zero lab
   examples. Teach it to fold in coaching files before anyone uses the numbers to judge PHY.
4. **Practice-loop features are off.** The loop is in the shells (R1), but only Dynamics turns it on.
   MAC 2311 and MAC 2312 use only the notes link and symbol palette; MAC 2313 only the palette;
   EGN 3331 and EML 3100 only the notes link; Statics nothing. Fading, the lab drawer, interleaving
   and `choiceNotes` cost a few lines each once the data exists.
5. **No OCW anywhere yet.** Zero notes link an OCW lecture; zero worked cases cite an OCW problem.
   Every cited case today cites a textbook section or a public problem deck.
6. **Citation maps exist in two courses.** Only EGN 3331 and EML 3100 have `src/data/textbook.js`.
   The rest cite inline in each template's `src`.

## 3. Where the outline and the code disagree about the rules

All seven were decided on 18 Oct 2026 (D28–D32), and the standard now says so.

1. **"What the model leaves out".** The standard asks for it at the end of every lab explainer and
   every notes section with an idealisation. In the reference course it appears only in the 8
   application labs' explainers, and in none of PHY 2049's notes. The shell courses put it in the
   notes (a `box out` per section) and in no lab. *Recommendation:* require it in application-lab
   explainers (as PHY does) and as a `box out` in notes (as the shells do); drop it from concept-lab
   explainers. **Decided: both places (D30).** Dynamics' seven application labs and every future
   application lab need the explainer line.
2. **`box out` is not in the standard.** The shell notes use five box types; the standard names
   four. *Recommendation:* add `out` to the standard. **Decided (D30).**
3. **Notes structure.** PHY 2049's notes group sections into `div.part` with a legend; no shell
   course does, including Dynamics, which the standard lists as an exemplar. *Recommendation:* make
   parts and the legend required for units with more than about eight sections, optional below.
   **Decided: always, as PHY 2049 does (D32).** Every shell course's notes need parts and a legend.
4. **Box recipe.** Every shell notes file has exactly one `why`, one `key` and one `out` per section.
   PHY 2049's boxes follow the content (some sections have three `fix`, some none). The recipe meets
   the counts but can read as filler. *Recommendation:* the review skill should look for it.
   **Decided (D32):** boxes follow the content, as PHY 2049's do. The review skill now flags the
   recipe, and existing notes are rewritten when each course is reworked.
5. **D23 and course boundaries.** OCW runs Calc I and II as one course (18.01SC), and PHY 2049 follows
   its instructor by permission. *Recommendation:* where courses split differently from OCW, UNF sets
   the boundary and OCW sets the order inside it; PHY 2049 keeps its instructor's order and links 8.02
   as Another view. **Decided differently (D28):** Calculus I and II become one module that follows
   18.01SC end to end. PHY 2049 keeps its order.
6. **D23 when the OCW course has a different scope.** 2.003SC assumes 8.01 and goes on to Lagrange
   and vibration; 16.050 is a second thermodynamics course; 2.001 covers statics in four lectures.
   Following those calendars literally would drop topics UNF teaches. *Recommendation:* in those
   cases, the spine maps each unit to the OCW lectures that cover it (from more than one OCW course
   if needed), OCW sets the order where it has one, and the textbook orders the rest. **Decided
   (D29).** Each affected spine now has its OCW map.
7. **EGN 3331 energy methods.** The course pack left out Hibbeler Ch 14 (D11). 2.001 teaches energy
   methods. Under D23 OCW sets coverage, so it comes back in unless the owner says otherwise.
   **Decided: back in (D31)**, as Unit 10 of the new order.

## 4. Course by course

### 4.1 EGN 3321 Dynamics: closest to the outline

**Matches:** engineering shell; 7 units, 24 labs, 1 application lab per unit, 2+ predictions per lab;
notes for every unit with 9–17 lab setups each; 89 templates with `why`, traps, hints, 31%+
conceptual, 83% structural variety; every practice-loop feature on; coaching per unit.

**Gaps:**
- No OCW worked cases or OCW links.
- Notes have no parts or legend; lab explainers never say what the model leaves out (it is in the
  notes).
- Only 1 symbolic-answer template.
- Level 3 is 12 of 89 (13%).
- No `textbook.js` citation map.
- Order: 2.003SC starts after particle dynamics (it assumes 8.01) and ends with Lagrange and
  vibration, which belong to EML 4312. Units 1–4 map to 8.01SC weeks 1–9; Units 5–7 map to 2.003SC
  lectures 3–8. 8.01SC puts momentum before energy; Dynamics puts energy first. Under D29
  Units 3 and 4 swap.
- Application labs include rocket and turbopump labs (`liftoff`, `rocket`, `spinup`). They are
  generic rocket physics, not the methalox engine, so D25 does not require removing them.

### 4.2 EML 3100 Thermodynamics

**Matches:** engineering shell, notes for both built units, predictions (3 per lab), citation map,
property library under it.

**Gaps:**
- Only 2 of 5 units built (properties; first law for closed systems).
- No application lab. No `why` or traps.
- 0% conceptual in Unit 2. No structural variety.
- 3 `fix` boxes in two units.
- New order (D29, in the spine): 16.050 Part 0 puts properties and states (L3) before energy, work
  and heat (L5), so the two built units stay where they are. The old seven units fold into five:
  properties and pure substances; energy and the first law for closed systems; control volumes;
  cycles and the second law; entropy. 16.050 Parts 2 and 3 (power cycles, thermochemistry, heat
  transfer) belong to EML 3101 and EML 4140.

### 4.3 EGN 3331 Mechanics of Materials

**Matches:** engineering shell, Unit 1 notes and labs with predictions, citation map (Roylance),
materials selftests.

**Gaps:**
- 10 of 11 units not built (17 labs `coming`, plus energy methods).
- Unit 1 notes have no `fix` box.
- 11 templates with no `why` or traps and 0% conceptual. No application lab.
- Order: 2.001 (whose required text is Hibbeler's *Mechanics of Materials*) runs axial loading and
  indeterminacy, then multiaxial stress and strain, pressure vessels and thermal stress,
  transformation and failure, then bending and deflection, then torsion and energy methods. The
  plan runs Hibbeler's order: torsion fourth, transformation eighth.
- Transverse shear and buckling are not in 2.001; they stay, from Hibbeler, since UNF teaches them.

### 4.4 MAC 2311 Calculus I

**Matches:** math shell; notes for all 4 units (55 worked examples, 30 `fix`); hints on every
template; notes link from practice.

**Gaps:**
- 0 predictions and 0 application labs.
- No `why` or traps. 0% conceptual in Units 2–3. No structural variety: the range-widened templates
  from the 17 Oct review are still there.
- Level 3 is 2 of 39.
- 2–6 lab setups per unit (6 needed).
- No CONVENTIONS.md, no citation map.
- Order: close to 18.01SC Units 1–3. OCW has no separate limits unit (limits sit inside
  differentiation), and L'Hôpital is in OCW Unit 5, after integration. MAC 2311 teaches it in Unit 3.

### 4.5 MAC 2312 Calculus II

**Matches and gaps:** as MAC 2311 (notes for all 4 units; no predictions, application labs, `why`,
traps or structure; level 3 is 2 of 48; 3–6 setups per unit).

**Order:** 18.01SC runs areas, volumes, average value and numerical integration; then techniques
with arc length and surface area; then parametric and polar; then L'Hôpital and improper integrals;
then Taylor series. The built order is applications (with arc length), techniques (with numerical
and improper), series, then parametric and polar.

**Decided (D28):** MAC 2311 and MAC 2312 merge into one module in 18.01SC's order: differentiation;
applications of differentiation; the definite integral and its applications; techniques; parametric
and polar; L'Hôpital, improper integrals and series. 18.01SC covers only Taylor series, so the
convergence tests come from OpenStax. The plan is `docs/course-plans/mac2311-2312.md`.

### 4.6 MAC 2313 Calculus III

**Matches:** math shell (its UI became the shell); 17 labs; 25%+ conceptual; hints on every template;
Merino notation kept.

**Gaps:**
- No notes at all, 0 predictions, 0 application labs.
- No `why` or traps. Structural variety 1%. Level 3 is 0 of 82.
- **Coverage:** 18.02SC teaches vectors and matrices, Lagrange multipliers, vector fields, line
  integrals, Green's theorem, flux, the divergence theorem and Stokes' theorem. The bank has dot and
  cross products and nothing on Lagrange multipliers, line integrals, Green, flux, divergence or
  Stokes. That is roughly 40% of 18.02SC. Under D23 these are new units.
- **Order:** 18.02SC starts with vectors and matrices and parametric curves, then partial
  derivatives, then double and line integrals, then triple and surface integrals. The built order
  (Merino) puts 3D space in Chapter 4, after double integrals.

### 4.7 EGN 3311 Statics

**Matches:** engineering shell (its UI became the shell); 8 labs with equilibrium residual checks;
worked cases from public decks.

**Gaps:**
- No notes, 0 predictions, 0 application labs, no coaching.
- No `why` or traps. 74% of templates have two hints. Level 3 is 5 of 34.
- No Notes button, because there are no notes.
- Order: 2.001 Parts 1–2 cover forces, moments, equilibrium, trusses, friction and shear and moment
  diagrams in six lectures. Frames, 3D equilibrium, centroids and moments of inertia come from
  Hibbeler.

### 4.8 PHY 2048 Physics I

**Matches:** mechanics library and 67 templates, cited by OpenStax section; problems-check and
labs-check scripts exist.

**Gaps:**
- No UI (waits for the physics shell, Phase 2b) and no notes.
- All 67 templates are level 1. 4 choice parts in the whole bank.
- 94% of templates have fewer than two hints. No `why` or traps.
- No CONVENTIONS.md.
- Order: 8.01SC runs kinematics, Newton, circular motion, drag and constraints, momentum, variable
  mass, then work and energy, collisions, rotation, angular momentum and rolling. The built units put
  energy before momentum.
- Coverage: no drag or variable-mass (rocket) problems, both in 8.01SC. Equilibrium, gravitation and
  oscillations are not in 8.01SC; they stay, from OpenStax.

### 4.9 PHY 2049 Physics II: the reference

**Matches:** everything the outline was written from: 34 labs, 8 application labs whose explainers
end with what the model leaves out, notes with 151 worked examples and 83 `fix` boxes, step-through
derivations, coaching for every exam, its own complete practice loop.

**Gaps** against the outline as written:
- No notes for Exams 6, 7 and wave optics. The weekly drops will add them.
- No application labs in Exams 1, 2, 6, 7 or wave optics.
- Some labs have one prediction.
- 18% structural variety.
- No OCW links.
- Its own UI, not a shell (Phase 2b).

Leave it to the content drop and Phase 2b; do not rework it.

### 4.10 STA 3032

A separate app with its own look, no notes (removed 13 Oct, D6), labs with seeded predictions on some
labs, and 96 templates (52% `why`, 31% traps, 64% structure, 17% cited cases). 18.05 adds a
Bayesian-inference block and bootstrap that STA 3032 does not teach. Per the roadmap it stays as is
unless the owner asks.

## 5. What to fix, in order

**Platform (before more course work):**
1. Notes deep links (`?n=`) in the shell router, with a shell test.
2. The scorecard reads coaching files, so PHY 2049 and Dynamics are measured the same way.
3. Notes in every shell course gain parts and a legend, and lose the one-of-each box recipe, as each
   course is reworked (D32).

**Courses, following the roadmap:**

4. **EML 3100 (R3a):**
   - The owner confirms the five-unit order in the spine (D29).
   - Then Units 3–5 to the standard.
   - Add an application lab and traps to the built units.
5. **EGN 3331 (R3b):**
   - The owner confirms the eleven-unit order in the spine (2.001 order, energy methods back, D31).
   - Add `fix` boxes, `why` and traps to Unit 1.
   - Build Units 2–11.
6. **Dynamics:**
   - OCW worked cases and Another view links.
   - Explainers ending with what the model leaves out on its seven application labs (D30).
   - Swap Units 3 and 4 so momentum comes before energy, as 8.01SC does (D29).
   - Owner review.
7. **The new courses**, back to back (`ROADMAP.md`).
8. **Review courses (R4):**
   - Merge MAC 2311 and MAC 2312 into one module in 18.01SC's order (D28).
   - MAC 2313 notes and the missing vector-calculus units.
   - Statics notes.
   - Calculus I and II template rework.
   - All four: predictions, application labs, traps, conceptual problems.
9. **PHY 2048 (R5)** after Phase 2b:
   - UI and notes.
   - Levels 2–3 and conceptual problems.
   - Momentum before energy.
   - Drag and variable mass.

Re-run this inventory after each course's rework: `npm run scorecard -- --units`, then the checks in
this file's first section.
