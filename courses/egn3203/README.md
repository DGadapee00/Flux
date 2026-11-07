# EGN 3203 Modern Computation Methods

The computation course's app, on the engineering shell. It was copied from the Design practice app's
wiring to give the map's linear algebra and numerical methods lanes their labs. It is built into the
site and listed under Math in the hub.

Unit 1 is matrices and elimination: a 2×2 matrix as a map of the plane, and the order two maps come
in (`matrix`); Gaussian elimination one row operation at a time, with and without pivoting
(`elimination`).

The math is in `packages/subjects/src/math/linalg.js`. Each lab checks its closed form against a
second method on every scenario and slider stop (`npm test -w @flux/egn3203`).

Run the dev server with `npm run dev -w @flux/egn3203` (port 5187).
