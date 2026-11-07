# EEL 3111 Circuit Analysis I

The circuits course's app, on the engineering shell. It was copied from EML 4140's wiring to give the
map's circuits lane its labs. It is built into the site and has its own Circuits track in the hub.

Unit 1 is methods of analysis. Its first lab solves one circuit by node voltages and by mesh
currents, side by side, with both matrices (`nodes`).

The math is in `packages/subjects/src/em/networks.js`. Each lab checks its numbers by a second method
on every scenario and slider stop (`npm test -w @flux/eel3111`).

Run the dev server with `npm run dev -w @flux/eel3111` (port 5190).
