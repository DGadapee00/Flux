# Project courses

Projects use the same course shell as Bench and Design: units, lab tabs, setup, readouts,
Notes and Practice. The hub links to `satellite/` and `dome/`. It no longer mounts a satellite
guide or a separate shop traveler. Old project URLs open the corresponding course unit.

## Satellite

The existing six units retain their labs, problems and notes. Each unit's notes now include
Build it: method, deliverable, subsystem handoff, checklist and references. The Structure unit
also holds the material, process, joint and finish comparison tables, options, tradeoffs and
sources. These are readable notes, without option-picking or conflict feedback.

Unit 7 covers sensor payload and integration. It is explicitly notes-only until it has labs
and practice. Its build checklists do not claim automatic grading or flight qualification.

## Tank dome

The course is in `courses/dome/` and uses `@flux/shells/engineering`, as Bench, Design and
Satellite do. Its units group the eleven original stations:

1. Design and materials: requirements, design, material characterization and panels. Lab: weld land sizing.
2. Joining and inspection: fit-up, qualification, welding and inspection. Lab: inspection capability.
3. Repair and disposition: nonconformance, repair evidence and corrective action. Lab: repair strength.
4. Proof and acceptance: proof, leak evidence, traceability and release. Lab: proof test.

The notes keep the engineer's decisions, failure modes, records, floor questions, worked
reasoning, references and transfer challenges. The four shop-floor cases are worked examples
for judgement and discussion. They are not multiple-choice answers to mark.

Thirteen numeric practice templates use the same model as the labs and the normal course
practice engine. Standard course progress, backup export and restore include the dome.

The checked numeric model lives in `packages/subjects/src/mechanics/tank-dome.js`. The old
map import remains a compatibility export through the course. The course independently checks
pressure line load by integrating traction around a cylindrical half-shell, then checks the
ultimate and proof-yield utilizations. These are pressure-only barrel-seam estimates, not a
complete analysis of a shaped dome, service life, supports or flight loads. Inspection capability
is not an acceptance limit; repaired coupon ratios are not an authorized hardware disposition.

The improved dome, tensile frame, contour mill, stir tool, ultrasonic section and test article
are course scene models in `courses/dome/src/visuals/`. They use the course's canvas, camera,
setup controls and readout. They do not mount a second header, typography system or worksheet.
Apparatus motion and curves remain explanatory rather than machine qualification data.

## Archive and compatibility

The earlier standalone interfaces and review workflow are preserved under
`docs/history/project-guides-2026-11-10/`. Claude briefs, Project instructions, conflict-picking
cards and foundations lists are absent from the live project courses. Old application backup
records and local guide notes are kept; they are not converted into course mastery.

`site/scripts/project-courses-smoke.mjs` checks the hub links, both course shells, all four dome
labs, numeric answer submission, notes, the satellite closing unit, legacy URLs and layout.
