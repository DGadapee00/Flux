# MAP 2302 Differential Equations

OCW 18.03SC Fall 2011 sets the four-unit sequence. Dalton confirmed Lebl,
the spine and all four application objects on 1 Nov 2026. All four units are built. `standard: false` until Dalton reviews.

Unit 1 has five labs (including a drawn, animated HARIO coffee server),
25 original templates, ten computed predictions, and eleven notes sections
with fifteen lab-linked worked examples. Sources and model limits are in
the notes and PROVENANCE.md. All textbook citations use src/data/textbook.js.

Run `npm run dev -w @flux/map2302` (5184), `npm test -w @flux/map2302`,
and the root build. For production browser checks, from this course folder run
`CHROMIUM_EXECUTABLE=/path/to/chromium node scripts/browser-checks.mjs`.
The checks cover 380×820 and 1280×800; the PR includes reviewed screenshots.
`npm run scorecard -- --course map2302 --units` reports built and unbuilt units
honestly. All course progress participates in the hub backup.

One unit per stacked PR, based on the previous branch. Never set standard true.

Unit 2 adds four drawn/animated labs, including the Eibach-spring quarter-car,
25 templates (36% conceptual), eight predictions and eleven checked notes setups.

Unit 3: four labs, a cited 60 kHz radio-clock tuner, eight predictions, 26 templates
(34.6% conceptual), and eleven notes examples that open in labs. Owner student review remains.

UNF supplement: the UNF MAP 2302 schedule (Nagle, Saff and Snider, 9th ed.) is mapped section
by section in `src/data/syllabus.js`, and `spine.test.mjs` fails if any section loses its notes, lab
or problems. Six labs and eight notes sections fill what the OCW spine leaves out: exact equations,
substitutions, tanks, buildings and drag (Unit 1); variation of parameters, Cauchy–Euler and
reduction of order, higher-order equations and annihilators (Unit 2); and transform rules (Unit 3).

Unit 4: five labs including the drawn pendulum clock, ten predictions, 25 templates
(36% conceptual), and thirteen lab-linked notes examples. The full measured scorecard passes.
