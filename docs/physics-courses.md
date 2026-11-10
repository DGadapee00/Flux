# Physics after PHY 2049

Modern Physics, Quantum Physics and Nuclear Physics use Flux's standard course shell: unit
picker, interactive lab, notes and practice. MOD, QNT and NUC are Flux navigation labels, not
institutional course numbers. These are introductory courses. The notes identify advanced
topics that have no completed lab yet.

Start Modern Physics after calculus-based Physics II. Quantum Physics follows Modern Physics
and benefits from differential equations. Nuclear Physics follows Modern Physics and can be
taken alongside Quantum Physics for this introductory sequence.

| Course | Four units and labs | Practice templates |
| --- | --- | --- |
| Modern Physics | Relativity and moving clocks; photoelectric threshold; electron matter waves; hydrogen transitions | 16 |
| Quantum Physics | Gaussian packets and uncertainty; infinite well states; barrier transmission; spin measurement | 16 |
| Nuclear Physics | Mass defect and binding; radioactive decay and activity; narrow-beam attenuation; counts and background | 15 |

Each unit has original explanations, a worked setup, common mistakes, a transfer question,
model limits and references. Each lab has three scenarios, live parameter controls, two
prediction prompts and a diagram generated from its computed model. Practice mixes generated
numeric problems with conceptual questions and uses the normal progress records and backup.

## Model checks

The numerical models live in `packages/subjects/src/physics/foundations.js`. Tests recompute
each scenario and sample every slider's domain. The models compare independent calculations:

| Lab | Independent calculation |
| --- | --- |
| Moving clocks | Bisection solution of the light-clock triangle |
| Photoelectric threshold | Photon energy and energy balance in SI units |
| Electron matter waves | Finite-difference plane-wave curvature in the kinetic-energy operator |
| Hydrogen transitions | Coulomb energy with the Bohr radius, using SI constants |
| Gaussian packet | Integrated normalization, position variance and envelope derivative |
| Infinite well | Discrete kinetic-energy quadratic form and wavefunction normalization |
| Rectangular barrier | Complex boundary matching at both interfaces and probability-current conservation |
| Spin measurement | Bloch-vector dot product |
| Mass defect | SI mass-energy conversion |
| Decay | Fourth-order integration of the decay equation |
| Attenuation | Fourth-order integration of the beam equation |
| Counting | Independent evaluation of the Poisson variances from its probability masses |

The checks test consistency of the teaching models. They are not experimental validation.
Radiation attenuation describes an ideal narrow monoenergetic beam, not dose. Binding energy
converts a supplied mass defect; it does not predict isotope masses. Counting uses independent
gross and background acquisitions of equal duration.

## Coverage beyond these units

Modern Physics does not yet include a complete thermal-radiation, solid-state or relativistic
dynamics sequence. Quantum Physics does not yet include a full operator formalism, harmonic
oscillator, three-dimensional angular momentum, perturbation theory or many-particle course.
Nuclear Physics does not yet include full reaction kinematics, cross sections, nuclear structure,
reactor physics or detector response. Unit notes link broader external study rather than
presenting these topics as finished labs.

All explanations, diagrams and exercises are written for Flux. External textbook and OCW
references are links for further reading. No source figures, text or exercise statements are
reproduced. Source links and reading dates are recorded in the unit notes. The map metadata is retained
in `docs/history/map-2026-11-10/`; the hub keeps its simplified course list.

## Verification

`npm test` checks the courses, tracks, grading, storage and backup integration.
`npm run build` assembles the three course apps under the hub. After building,
`npm run smoke:physics -w @flux/site` drives the production preview in Chromium at 390×844
and 1280×800, with both theme settings. It checks all 12 lab routes, slider and scenario updates,
notes equations, correct practice submissions and saved progress. Screenshots go to
`/tmp/flux-physics-courses`, or `FLUX_PHYSICS_OUT` when provided.
