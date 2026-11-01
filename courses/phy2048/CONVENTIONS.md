# PHY 2048 conventions

These stay in the course. They are not copied into `packages/core` or the shell.

- **Significant figures.** Four, set in `src/problems/engine.js`. Printed answers and steps use them.
- **Units.** SI. Every unit conversion goes through `@flux/subjects/convert.js`.
- **g.** 9.81 m/s², from `@flux/subjects/mechanics/constants.js`.
- **Signs.** Each problem states its axes. Angles are measured counterclockwise from +x unless a
  problem says otherwise. A part that asks for a component keeps its sign.
- **Notation.** Vectors carry an arrow, as in OpenStax *University Physics Volume 1*.
- **Sections left out.** §1.1, §8.5, §13.6 and §13.7 (`LEFT_OUT` in `src/data/textbook.js`), and
  §14.7 as worked examples only. The reason is in `docs/course-plans/phy2048.md`.
- **Unit order.** The book's chapters in the book's order (D33), 13 units. The catalog calls a unit
  `unit` and the practice exam is still called a practice exam.
- **Colour.** The platform's meanings. Force is pink, velocity white. Unit 2 adds two, in the
  relative-motion and wind-triangle labs: the velocity of the moving frame (a current, a wind, minus
  an observer's velocity) is teal, and the resulting velocity over the ground is gold. In Unit 3's
  force diagrams every force is pink and labelled, so the acceleration there is a thin yellow arrow,
  and a reference line on a graph (free fall, a weight, a terminal speed) is yellow too. Unit 5
  draws momentum bars in teal and marks the center of mass in yellow. A second body is gold. Unit 6
  keeps force pink and velocity white. A rider, a second hanging mass, and the flight-energy bar are
  gold. The rotation axis mark is yellow. Unit 7 keeps force pink and velocity white. A second mass,
  the spin-energy bar, and a flywheel that drops on are gold. The origin and the pivot mark are yellow.
  Unit 8 keeps force pink. A second support, and the wall’s push on a ladder, are white. The person
  and the car’s center of mass are gold. The center mark is yellow.
- **Labs.** Units 1 to 8 are drawn (graph panels and flat vector scenes, framed by `fit` and the
  free space). The projectile lab draws the world at one scale on both axes, so angles are true. The
  free space between the panels is taller than wide on a laptop, so a lab with a picture and a bar chart stacks
  them (Unit 4). Energy bars: potential blue, kinetic white, thermal and work pink, a total yellow.
  Momentum bars are teal.
  A choice between a few named options is a `selectRow` (`define.js`).
  A lab says its numbers once, as `readoutCells`, and its law as TeX lines.
- **Notes.** One file per unit in `src/notes/content/`, registered in `src/notes/units/`. Units 1 to 8
  have them. A worked example's setup in `src/notes/setups/` is checked against the lab within 2%.
- **Problems.** A unit built to the standard is listed in `STANDARD_UNITS` in `scripts/problems-check.mjs`,
  which then also requires a level, a declared variety, a cited case, traps that can fire, and a lab
  that shows the answers the template computes. A part's unit may depend on the version (N or cm,
  kW or hp): the engine's `unitFn` is on, and the check fails a unit that renders as code. A trap's
  explanation may also depend on the version.
