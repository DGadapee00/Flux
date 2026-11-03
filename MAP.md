# What the map covers

A snapshot from the data on 3 November 2026, after the materials-science thread and the split of
thermodynamics from fluid mechanics, and EML 3015 Fluids. For the live
numbers run `node map/check.mjs`, `npm run map-audit` and `npm run map-gaps`.

**184 concepts, 146 with a Flux lab, 38 gaps.**

| Lane | Concepts | With a lab |
|---|---|---|
| Calculus | 31 | 27 |
| Differential equations | 13 | 13 |
| Mechanics | 30 | 30 |
| Electricity and magnetism | 26 | 25 |
| Thermodynamics | 12 | 12 |
| Fluid mechanics | 20 | 3 |
| Heat transfer | 3 | 2 |
| Circuits and systems | 11 | 11 |
| Mechanics of materials | 14 | 14 |
| Materials science | 15 | 0 |
| Statistics | 9 | 9 |

Every Flux course app is on the map: every lab and every notes section sits on a concept, and
`npm run map-audit` lists nothing. Each has a path, in teaching order:

| Course | Concepts on its path |
|---|---|
| MAC 2311–2312 Calculus I and II | 16 |
| MAC 2313 Calculus III | 19 |
| MAP 2302 Differential Equations | 14 |
| PHY 2048 Physics I | 27 |
| PHY 2049 Physics II | 33 |
| EGN 3311 Statics | 8 |
| EGN 3321 Dynamics | 15 |
| EGN 3331 Mechanics of Materials | 15 |
| EML 3100 Thermodynamics | 14 |
| STA 3032 Probability and Statistics | 9 |
| Bench (a project) | 6 |

Courses with no app are not audited. Their paths follow an MIT OpenCourseWare course's order, and
each new concept on them is a gap with a candidate lab:

| Course | Concepts on its path | Order from |
|---|---|---|
| EMA 3010 Materials Science | 15 | 3.091 recitations |
| EML 3015 Fluids | 22 (16 new) | 2.06, Spring 2013 |

EML 3101 Thermodynamics II is on the course list with no app and no path yet.

A concept can also list `related` concepts: parallels that are not prerequisites, such as diffusion
and the heat equation. The hub lists them in the reading panel's Parallels row and draws nothing.

Courses that share ideas share concepts: Dynamics and Physics I meet on the mechanics lane,
Statics leads into Mechanics of Materials, and Differential Equations ties the oscillators of
Physics I to the circuits of Physics II.

## Gaps most worth a lab

From `npm run map-gaps`, which weighs how many concepts build on a gap and where the owner stands
in the courses that teach it.

1. **Flux across a curve, Divergence, Divergence theorem.** The trunk of the flux thread: 15 to 31
   concepts build on each, from Gauss's law to the heat equation. MAC 2313's app stops at triple
   integrals, so none of them has a lab. One lab could carry two of them: a box dragged through a
   field, with face fluxes that sum to the divergence, then a grid whose inner faces cancel.
2. **Maxwell's divergence equations.** PHY 2049 is being taken now, and this is the step from
   Gauss's law to EM waves. Its candidate: flux through a shrinking sphere beside the charge
   density at its centre.
3. **Line integrals and work.** 31 concepts build on it: electric potential, Ampère's law, and
   work and energy in Dynamics and Physics I. A path dragged through a field, with two paths
   compared for a gradient field.
4. **An RL and LC lab for Inductance.** PHY 2049 has a transformer lab, but notes sections on
   self-inductance, RL circuits and LC oscillation have no lab of their own.
5. **Heat equation, Continuity equation.** Later courses (EML 4140, EML 3015). Worth building when
   those terms come close.

## Sources

Every concept has two or three sources, but none has a `checked` date yet. The session that wrote
them could not reach any source site. Run `npm run map-sources` where the network allows, fix what
fails, and date each one you confirm.
