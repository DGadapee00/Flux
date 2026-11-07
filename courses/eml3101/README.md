# EML 3101 Thermodynamics II

The second thermodynamics course's app, on the engineering shell. It was copied from EEL 3111's
wiring to give the map's EML 3101 path its labs. It is built into the site and sits in the
Thermal-fluids track in the hub.

Unit 1 is gas mixtures and combustion. Its first lab mixes nitrogen with a second gas in a closed
vessel and reads mole fractions, mass fractions and partial pressures side by side (`mixture`).

The math is in `packages/subjects/src/thermo/mixtures.js`, on the ideal-gas data in `idealgas.js`.
Each lab checks its numbers by a second method on every scenario and slider stop
(`npm test -w @flux/eml3101`).

Run the dev server with `npm run dev -w @flux/eml3101` (port 5192).
