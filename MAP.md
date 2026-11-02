# What the map covers

A snapshot from the data on 2 November 2026. For the live numbers run `node map/check.mjs`,
`npm run map-audit` and `npm run map-gaps`.

**82 concepts, 75 with a Flux lab, 7 gaps.**

| Lane | Concepts | With a lab |
|---|---|---|
| Calculus | 19 | 15 |
| Mechanics | 15 | 15 |
| Electricity and magnetism | 26 | 25 |
| Thermo and fluids | 14 | 13 |
| Heat transfer | 3 | 2 |
| Circuits and systems | 5 | 5 |
| Differential equations, Materials, Statistics | 0 | 0 |

Four courses are fully on the map, with a path: PHY 2049 (33 concepts), MAC 2313 (19), EML 3100 (14)
and EGN 3321 (15). Every one of their labs and notes sections sits on a concept.

Not yet audited: MAC 2311–2312, MAP 2302, PHY 2048, EGN 3311, EGN 3331, STA 3032 and the Bench
project. Their labs work as before; `npm run map-audit` lists what is still to place. Auditing them
fills the three empty lanes.

## Gaps most worth a lab

From `npm run map-gaps`, which weighs how many concepts build on a gap and where the owner stands
in the courses that teach it.

1. **Flux across a curve, Divergence, Divergence theorem.** The trunk of the flux thread: 15 to 30
   concepts build on each, from Gauss's law to the heat equation. MAC 2313's app stops at triple
   integrals, so none of them has a lab. One lab could carry two of them: a box dragged through a
   field, with face fluxes that sum to the divergence, then a grid whose inner faces cancel.
2. **Maxwell's divergence equations.** PHY 2049 is being taken now, and this is the step from
   Gauss's law to EM waves. Its candidate: flux through a shrinking sphere beside the charge
   density at its centre.
3. **Line integrals and work.** 22 concepts build on it: electric potential, Ampère's law, work
   and energy in Dynamics. A path dragged through a field, with two paths compared for a gradient
   field.
4. **An RL and LC lab for Inductance.** PHY 2049 has a transformer lab, but notes sections on
   self-inductance, RL circuits and LC oscillation have no lab of their own.
5. **Heat equation, Continuity equation.** Later courses (EML 4140, EML 3015). Worth building when
   those terms come close.

## Sources

Every concept has two or three sources, but none has a `checked` date yet. The session that wrote
them could not reach any source site. Run `npm run map-sources` where the network allows, fix what
fails, and date each one you confirm.
