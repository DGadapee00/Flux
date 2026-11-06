# Design practice

The design project's course app: designing, making and testing parts. It was copied from the
EML 3015 app's wiring to give the design lane on the map its labs. It is built into the site and
listed under Projects in the hub.

Unit 1 is fits and stack-ups: hole and shaft bands for standard fits (`fits`), and tolerances adding
along a chain of parts (`stackup`). Unit 2 is position and process: a hole's position against a box
and a round zone (`position`), and capability with an x̄ chart (`capability`). Unit 3 is choosing a
design: requirements, weights and how firm the choice is (`decision`), design intent in a sketch
(`intent`) and margins by analysis and by test (`verify`). Unit 4 is joints and mounts: a preloaded
bolted joint (`bolted`) and exact constraint (`mount`). Unit 5 is sensors and signals: a
strain-gauge bridge (`bridge`) and sampling (`sampling`). Unit 5 also has thermocouples and RTDs
(`temperature`) and an orifice meter (`orifice`). Unit 6 is valves, motors and boards: a control
valve in its system (`valve`), a DC motor (`motor`), PWM drive (`pwm`) and a board's ground return
(`board`).

The math is in `packages/subjects/src/design/` (`tolerancing.js`, `decision.js`, `joints.js`, `sketch.js`, `verify.js`, `instruments.js`). Each lab checks its
closed form against a second method on every scenario and slider stop
(`npm test -w @flux/design`).

Run the dev server with `npm run dev -w @flux/design` (port 5186).
