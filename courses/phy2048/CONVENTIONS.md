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
  and a reference line on a graph (free fall, a weight, a terminal speed) is yellow too.
- **Labs.** Units 1 to 3 are drawn (graph panels and flat vector scenes, framed by `fit` and the
  free space). The projectile lab draws the world at one scale on both axes, so angles are true. The
  three older labs in Units 4 to 6 are logic only until their unit's PR draws them.
  A lab says its numbers once, as `readoutCells`, and its law as TeX lines.
- **Notes.** One file per unit in `src/notes/content/`, registered in `src/notes/units/`. Units 1 to 3
  have them. A worked example's setup in `src/notes/setups/` is checked against the lab within 2%.
- **Problems.** A unit built to the standard is listed in `STANDARD_UNITS` in `scripts/problems-check.mjs`,
  which then also requires a level, a declared variety, a cited case, traps that can fire, and a lab
  that shows the answers the template computes.
