# EML 3015 Fluids

The fluids course on the engineering shell. It was copied from `courses/starter` to give the
fluids lane on the map its labs. It is built into the site and listed under Thermal in the hub.

Unit 1 is viscosity and shear (Cleynen ch. 5). The lab, `viscosity`, drags a plate over a thin
layer of fluid and draws the velocity profile as it grows from rest to the straight line. The
problems cover shear stress, the force on a plate, the settling time, and why a dense fluid need
not be a thick one.

Unit 2 is pressure on walls and in moving tanks (Cleynen ch. 4): a gate you lower and tilt
(`gate`), and a tank that accelerates or spins (`rigid-tank`). Unit 3 is following the flow
(Cleynen ch. 6): particles through a nozzle for the material derivative (`nozzle`), and the
pressure across a bend for Euler's equation (`bend`).

The math is in `packages/subjects/src/mechanics/` (`couette.js`, `pressure-fields.js`,
`flowfields.js`). Each lab checks its closed form against a second method on every scenario and
slider stop (`npm test -w @flux/eml3015`).

Run the dev server with `npm run dev -w @flux/eml3015` (port 5185).
