# What the map covers

A snapshot from the data on 3 November 2026, after the thermal-fluids courses (EML 3015, EML 4140,
EML 3101). Since then a linear algebra thread runs from vectors to eigenvalues and projection, and
feeds differential equations and regression. EEL 3111 Circuit Analysis I and EGN 3203 Modern
Computation Methods are on the map. MAP 2302 gained six concepts and six labs for the UNF schedule:
exact equations, substitutions, balance models, variation of parameters, Cauchy–Euler equations and
higher-order equations. On 8 November 2026 the last 37 gaps got labs, in EML 4140, EMA 3010,
EGN 3203, EML 3101, EML 3015 and EEL 3111, and the same day five aerospace component concepts
joined as new gaps (see below). For the live numbers run `node map/check.mjs`,
`npm run map-audit` and `npm run map-gaps`.

**280 concepts, 275 with a Flux lab, 5 gaps.**

| Lane | Concepts | With a lab |
|---|---|---|
| Calculus | 30 | 30 |
| Linear algebra | 8 | 8 |
| Differential equations | 18 | 18 |
| Numerical methods | 14 | 13 |
| Mechanics | 34 | 34 |
| Electricity and magnetism | 27 | 27 |
| Thermodynamics | 22 | 22 |
| Fluid mechanics | 20 | 20 |
| Heat transfer | 19 | 19 |
| Circuits and systems | 27 | 27 |
| Mechanics of materials | 19 | 16 |
| Materials science | 15 | 15 |
| Design and manufacturing | 10 | 9 |
| Instrumentation and actuators | 8 | 8 |
| Statistics | 9 | 9 |

Every Flux course app is on the map: every lab and every notes section sits on a concept, and
`npm run map-audit` lists nothing. Each has a path, in teaching order:

| Course | Concepts on its path |
|---|---|
| MAC 2311–2312 Calculus I and II | 16 |
| MAC 2313 Calculus III | 19 |
| MAP 2302 Differential Equations | 20 |
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
| EMA 3010 Materials Science | 15 (app: Bond, Crystal, X-ray, Vacancy, Diffusion, Slip, Grain size, Lever, End quench, Crack, Fatigue, Creep, Chains, Glass and Galvanic labs) | 3.091 recitations |
| EEL 3111 Circuit Analysis I | 18 (10 new; app: Nodes, Dependent, Phasors, Filter, Power factor, Superpose, Thévenin, Switch, RLC step and Op amp labs) | 6.002, Spring 2007, in the archived plan's order |
| EGN 3203 Modern Computation Methods | 24 (11 new, plus the 7 linear algebra concepts; app: Matrix map, Elimination, Inverse, Rank, Projection, Eigen, Condition, Quadratic form, Fit, Round-off, Truncation, Roots, Runge–Kutta, Interpolation, Derivative, Stiff, Monte Carlo and Newton in 2D labs) | 2.086, Spring 2013 |
| EML 3101 Thermodynamics II | 14 (10 new; app: Mixture, Flame, Cooling coil, Nozzle, Bypass, Exergy, Otto and Diesel, Rankine and Heat pump labs) | 16.050, Fall 2002, with Cleynen |
| EML 3015 Fluids | 22 (16 new; app: Viscosity, Capillary, Gate, Accelerating tank, Floating, Nozzle, Bend, Continuity, Transport, Vane, Pipe, Head loss, Network, Model, Boundary layer and Drag labs) | 2.06, Spring 2013 |
| EML 4140 Heat Transfer | 19 (15 new; app: Rod, Resistance, Fin, Quench, Touch, Grid, Radiation, View factor, Shields, Thermal layer, Nusselt, Tube, Plume, Boil, Exchanger and Wet bulb labs) | 2.51, Fall 2008, with Lienhard |
| Build a satellite (a project) | 12 (11 new; app started: Kepler, Transfer, Noise, Link budget, Attitude, Spin, Pointing, Shake, Power and Thermal balance labs) | The satellite's subsystems, from MIT 16.07, 16.06 and 16.851 |
| Design practice (a project) | 20 (20 new) | Requirements to a tested part, then sensors, actuators and boards; MIT 2.007, 2.72 and 2.008 |

A concept can also list `related` concepts: parallels that are not prerequisites, such as diffusion
and the heat equation. The hub lists them in the reading panel's Parallels row and draws nothing.

Courses that share ideas share concepts: Dynamics and Physics I meet on the mechanics lane,
Statics leads into Mechanics of Materials, and Differential Equations ties the oscillators of
Physics I to the circuits of Physics II. The thermal-fluids courses share the control-volume
balances with EML 3100, the boundary layer between fluids and heat transfer, and diffusion with
EMA 3010. Parallels run momentum, heat and mass transfer side by side: viscosity and Fourier's law,
Navier–Stokes and the heat equation, the velocity and thermal boundary layers, heat and mass
convection.

## The satellite's own concepts

The satellite application (`map/applications/satellite.js`) needs ideas no course on the map
teaches yet. Twelve are on the map as the project course *Build a satellite*, with a path in
subsystem order: elliptical orbits and Kepler's equation, the rocket equation, orbit transfers,
spacecraft power, launch loads, the spacecraft radiation balance, rotations and quaternions,
Euler's equations and spin stability, transfer functions and stability, feedback and PID control,
thermal noise, and the link budget. Their sources are MIT 16.07 Dynamics, 16.06 Automatic Control
and 16.851 Satellite Engineering. The rocket equation already has PHY 2048's and Dynamics' rocket
labs, and Kepler's equation, orbit transfers, spacecraft power, the radiation balance, thermal noise,
the link budget, rotations, Euler's equations, transfer functions, feedback and launch loads have the
satellite app's labs, so every satellite concept now has one. When a course that teaches one joins
the map, add it to that concept's `courses`.

## Design practice

The owner's focus after the thermal-fluids courses is designing, making and testing parts. Two
lanes hold it: **Design and manufacturing** (the design process, design intent in CAD, tolerances
and fits, stack-up, GD&T, exact constraint, design for manufacture, process capability,
verification and margins) and **Instrumentation and actuators** (sensors, strain-gauge bridges,
temperature sensors, data acquisition, pressure and flow measurement, valves, actuators and
microcontrollers). Circuit boards sit in the circuits lane: schematic to board, and grounding and
decoupling. Bolted joints sit with mechanics of materials. All twenty are on the project course
*Design practice*, with a path, until the owner's design and measurement courses join the map.
Sources are MIT 2.007, 2.72 and 2.008 lectures and reference articles, read on 6 November 2026.
Sensors already has Bench's divider and night-light labs. *Design practice* now has its own app
with nineteen labs: fits, stack-ups, position zones, process capability, tolerance cost, a decision
matrix, design intent in a sketch, verification margins, a bolted joint, an exact-constraint mount,
a strain-gauge bridge, sampling and aliasing, thermocouples and RTDs, an orifice meter, a control
valve in its system, a DC motor, PWM drive, a board's ground return and decoupling. Every concept on
the design path now has a lab.
Standards such as ASME Y14.5 and ISO 286 are paid documents: concepts explain the ideas and do not
reproduce them.

`map-gaps` weighs a project like a next-term course, so these gaps rank beside the courses ahead.

## Aerospace components

The satellite's structure needs more than one bracket and one mode. Five concepts carry the map
toward flight hardware. Each is a gap with a candidate lab, on the satellite path and in the
satellite recipe:

- **Composite laminates**: the rule of mixtures for a ply, and the ABD matrix for a stack.
- **Buckling of plates and thin shells**: a panel's critical stress, post-buckling, and the
  knockdown factor for a thin cylinder.
- **Fasteners under vibration**: a joint slips once the shear passes the friction its preload
  gives, and then loosens. Also on the *Design practice* path.
- **Thermal stress from expansion mismatch**: joined parts with different \(\alpha\), cycled
  through each eclipse.
- **Finite element method**: element stiffness assembled into one system, and the same matrices
  for the modes.

Sources are MIT 16.20 Structural Mechanics and 2.092 Finite Element Analysis lecture notes and
reference articles, read on 8 November 2026. Tolerancing, GD&T, bolted joints, column buckling,
fatigue and margins were already on the map.

## Labs most worth a second look

`npm run map-gaps` ranks the five aerospace gaps above. This list, kept from when it ranked the
course concepts, names the ones many others build on, where a fuller lab would still pay.

1. **Divergence theorem.** 37 concepts build on it. MAC 2313's Flux lab shows flux across a curve
   and divergence in the plane, and its Tiles lab cuts a square into cells and watches the
   inner-face fluxes cancel. Its Box lab is the same picture one dimension up: a cube in a 3D field,
   six face fluxes against the divergence integral.
2. **Maxwell's divergence equations.** PHY 2049's Divergence lab (Exam 6) puts a small sphere in a
   charged ball and sums E·n̂ ΔA over it against Q_in/ε₀. Φ/V stays ρ/ε₀ as the sphere shrinks,
   and a wire's B gives as much flux in as out.
3. **Line integrals and work.** PHY 2048's work-path lab and Dynamics' paths lab now show it:
   work summed along a path, one total for a gradient field, another for friction. MAC 2313's Work lab
   adds a calculus view: a straight path and a bowed one between the same points, and Green's
   theorem for the difference.
4. **Inductance.** PHY 2049 has a transformer lab. EEL 3111's Switch lab shows an RL step, and its
   LC lab trades energy between the capacitor and the coil.
5. **Matrices as linear maps, and elimination.** The root of the linear algebra thread: 24 and 25
   concepts build on them, through eigenvalues into differential equations, node analysis into
   circuits, and least squares and LU into numerical methods. EGN 3203 now has an app with a Matrix
   map, Elimination, Inverse (determinant against condition number), Rank and Eigen labs; least
   squares is next in its unit 1.
6. **The thermal-fluids trunk.** EML 4140 now has an app, and its Rod lab solves the Heat equation
   by Fourier series and by finite differences side by side. EML 3015 has three units: viscosity
   (Viscosity, and Navier–Stokes for flow along a wall), pressure (a gate and an accelerating tank)
   and following the flow (a nozzle, a bend, Continuity, a Pipe lab that drives Navier–Stokes
   with a pressure drop, a Model lab for similitude, and a Boundary layer lab). Navier–Stokes in two dimensions is still to come.

## Sources

On 6 November 2026, 466 of the 502 sources were opened, read against what their concept says,
and dated. The check fixed what it found:

- Seven MIT 2.06 citations pointed at a contact lens worked example and a quiz equation sheet,
  not at notes on control volumes and differential forms. Each now cites a chapter of Cleynen's
  *Fluid Dynamics for Engineers* or a reference article that covers what its reason claims.
- MIT 18.05 moved from its 2014 to its 2022 edition, and NASA Glenn's guide, three OpenStax
  sections and the 2.086 textbook moved. Each link now opens the current page.
- MIT 2.001 lecture files and MIT 2.51 sessions are numbered differently from the course's own
  list. The titles now use the course's lecture numbers. Six Lebl citations now open their section.

The other 36 sources are on five sites that turn away scripted requests or send an incomplete
certificate chain: the Feynman Lectures, All About Circuits, Yan's thermodynamics book on
BCcampus, Kuphaldt on ibiblio and Margalit and Rabinoff's linear algebra. They have no `checked`
date. Open each in a browser, confirm it, and date it.
