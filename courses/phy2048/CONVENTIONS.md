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
- **Colour.** The platform's meanings. Force is pink, velocity white. This course adds none.
- **Labs.** Five labs are logic only: the picture on the canvas is drawn unit by unit, as each unit's
  PR lands. A lab says its numbers once, as `readoutCells`, and its law as TeX lines.
- **Notes.** None yet. The Notes mode is hidden until a unit has them.
