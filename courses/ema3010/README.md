# EMA 3010 Materials Science

The materials course's app, on the engineering shell. It was copied from EGN 3203's wiring to give
the map's materials science lane its labs. It is built into the site and listed under Mechanics in
the hub, before Mechanics of Materials.

Unit 1 is bonding and structure: two atoms on their energy curve, with the force as its slope and
the bond's stiffness as its curvature (`bond`). Crystal structures and X-ray diffraction come next.

The math is in `packages/subjects/src/matsci/bonding.js`. Each lab checks its closed form against a
second method on every scenario and slider stop (`npm test -w @flux/ema3010`).

Run the dev server with `npm run dev -w @flux/ema3010` (port 5188).
