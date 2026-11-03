# EGN 3311 Statics

Status: **review** (taken). R4c rework has four notes units, 15 lab routes and 43
problem templates. The measured scorecard passes. `standard` stays false pending owner review.

| | |
|---|---|
| Folder and id | `courses/statics` |
| Port | 5176 |
| Track, order | `mechanics`, 1 |
| Shell | `engineering`, with the shared course header and practice loop |
| When the owner takes it | Taken. |

## Sources

- **Textbook:** Hibbeler, *Engineering Mechanics: Statics*, Ch 2–10, cited through
  `src/data/textbook.js`. Original prose and generated problems; no textbook figures copied.
- **OCW program:** [2.001 Mechanics & Materials I, Fall 2006](https://ocw.mit.edu/courses/2-001-mechanics-materials-i-fall-2006/),
  lectures 1–6 and problem sets 1–3. The local reference is fetched with `npm run ocw -- 2-001`.
- **Applications:** EPAL pallet specifications; IKEA BERGSHULT and BILLY specifications;
  FHWA MUTCD Table 2C-2; Torin T10152 nominal capacity. Links and assumed teaching inputs
  are recorded separately in `src/data/textbook.js` and shown in each lab.
- **Existing cases:** the authorized public problem-deck cases remain under `PROVENANCE.md`.
  Generated verification cases are not represented as newly verified printed numerical answers.

## OCW map (D29)

2.001 sets the order: forces and moments, equilibrium, planar trusses, friction, then
shear and moment diagrams. Frames and machines, spatial equilibrium, centroids and area
moments of inertia supplement that sequence from Hibbeler. Material deformation after
lecture 6 belongs to EGN 3331, not this course.

## Units

| Unit | Coverage and reference | Concept labs | Application labs |
|---|---|---|---|
| 1: Force vectors | Cartesian components, resultants, spatial direction, dot products; lecture 1, Hibbeler Ch 2 | Vectors | Lifting bridle with an EPAL pallet |
| 2: Equilibrium and moments | Free bodies, cables and springs, spatial ring equilibrium, moments, couples and axis projections; lectures 1–2, Hibbeler Ch 3–4 | Particle, Moments | Wall shelf and anchor force couple |
| 3: Rigid bodies and trusses | Support constraints, planar and spatial equilibrium, equivalent distributed loads, joints, sections, stability, frames and machines; lectures 2–3, Hibbeler Ch 5–6 | Reactions, Truss, Frame | Sign gantry panel, scissor jack |
| 4: Friction and section geometry | Static versus limiting friction, tipping, belt friction, internal cuts, shear and moment diagrams, centroids, holes, Pappus, area inertia; lectures 4–6 then Hibbeler Ch 7–10 | Friction, Beam, Sections, Pappus | Bookcase tipping versus sliding |

The four existing unit IDs and original lab links are preserved. Friction precedes the beam
inside Unit 4. `reactions` is the Unit 3 view of the beam lab's support calculations.

## Review and verification

Notes follow PHY 2049's parts, legend, derivations, worked examples, formula sheet and Another
view structure. Boxes about student errors say **Common mistake**. Every idealised topic has
model limits. There are 32 checked setups and one supplementary spatial free-body example.

Every lab has two computed predictions. Every unit has at least 25% conceptual templates.
Nineteen existing numeric templates now vary the unknown between load and response. The new
level-3 cable-design template chooses tension first and computes the given force backward.
Choice feedback, numeric traps, second hints, symbolic input, fading, interleaving, notes links
and the lab drawer are enabled through the shared practice loop.

Run `npm test -w @flux/statics`, `npm run scorecard -- --units`, `npm run layout -w @flux/statics`
and `npm run smoke -w @flux/statics` with the course dev server running. The browser scripts
cover 380×820 and 1280×800. `CHROMIUM_EXECUTABLE` selects a system browser for smoke when needed.

The fetched 2.001 sets 1–3 contain no posted solution keys. A complete audit matching every
legacy/generated case to a printed answer is still outstanding; the scorecard's nonempty
citation check does not establish that. The owner must also work a unit as a student before
setting `standard: true`.
