# MAP 2302 scaffold

Awaiting Dalton's confirmation of `docs/course-plans/map2302.md`. No units are built.
This is copied from `courses/mathstarter` with the example tank, notes and bank removed.
The four units and planned labs follow MIT OCW 18.03SC Fall 2011. `standard: false`.

Run `npm run dev -w @flux/map2302` (5184), `npm test -w @flux/map2302`, and
`npm run build -w @flux/map2302`. For production layouts, from this folder run
`CHROMIUM_EXECUTABLE=/path/to/chromium node scripts/browser-checks.mjs`.
The layout runner checks all four empty units at 380×820 and 1280×800.
Measure honestly with `npm run scorecard -- --course map2302 --units`.

The scaffold's test gate proves content is empty and metadata/routes are consistent.
After confirmation, replace that gate with the normal problems/labs/notes checkers
(`npm run check:content`), build Unit 1 to every scorecard floor, and publish its
hub route, root build, track href and backup registration together (D19). Never
set `standard: true`. One unit per stacked PR, based on the previous branch.
