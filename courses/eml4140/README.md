# EML 4140 Heat Transfer

The heat transfer course's app, on the engineering shell. It was copied from EMA 3010's wiring to
give the map's heat transfer lane its labs. It is built into the site and listed under
Thermal-fluids in the hub.

Unit 1 is modes and conduction. Its first lab is the heat equation on a rod (`rod`): a starting
profile solved by a Fourier sine series and by finite differences, side by side.

The math is in `packages/subjects/src/heat/rod.js`. Each lab checks its closed form against a second
method on every scenario and slider stop (`npm test -w @flux/eml4140`).

Run the dev server with `npm run dev -w @flux/eml4140` (port 5189).
