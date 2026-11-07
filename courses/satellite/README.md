# Build a satellite

The satellite project's labs, on the engineering shell. The project itself, its subsystem recipes and
the Claude Project review, lives in the hub (`site/src/applications/`); this app holds the labs for the
aerospace concepts on its path (`map/paths/satellite.js`) that no degree course teaches. It is listed
under Projects in the hub.

Unit 1 is Orbit. Its first lab puts a craft on an elliptical orbit with a clock (`kepler`).

The math is in `packages/subjects/src/mechanics/kepler.js`. Each lab checks its numbers by a second
method on every scenario and slider stop (`npm test -w @flux/satellite`).

Run the dev server with `npm run dev -w @flux/satellite` (port 5191).
