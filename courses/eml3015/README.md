# EML 3015 Fluids

The fluids course on the engineering shell. It was copied from `courses/starter` to give the
fluids lane on the map its labs. It is built into the site and listed under Thermal in the hub.

Unit 1 is viscosity and shear (Cleynen ch. 5). The lab, `viscosity`, drags a plate over a thin
layer of fluid and draws the velocity profile as it grows from rest to the straight line. The
problems cover shear stress, the force on a plate, the settling time, and why a dense fluid need
not be a thick one.

The math is in `packages/subjects/src/mechanics/couette.js`. The lab checks the series solution
against a finite-difference march on every scenario (`npm test -w @flux/eml3015`).

Run the dev server with `npm run dev -w @flux/eml3015` (port 5185).
