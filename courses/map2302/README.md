# MAP 2302 Differential Equations

OCW 18.03SC Fall 2011 sets the four-unit sequence. Dalton confirmed Lebl,
the spine and all four application objects on 1 Nov 2026. Unit 1 is built;
Units 2–4 stay visible as planned. `standard: false` until Dalton reviews.

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
