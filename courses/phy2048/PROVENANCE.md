# Provenance

PHY 2048 is a review course. It has no Canvas drop and no instructor files in this folder.

## Source

Problems cite OpenStax *University Physics Volume 1* (CC BY-NC-SA 4.0):

https://openstax.org/books/university-physics-volume-1

Statements are written fresh, with generated numbers. A worked case uses numbers computed for this bank, and the citation is the section the method comes from. No figure and no textbook sentence is copied.

The units follow that volume's chapters in the book's order (D33), as set in `docs/course-plans/phy2048.md`: units, vectors and motion along a line (Ch 1–3), motion in two and three dimensions (Ch 4), Newton's laws (Ch 5–6), work and energy (Ch 7–8), momentum (Ch 9), fixed-axis rotation (Ch 10), rolling and angular momentum (Ch 11), equilibrium and elasticity (Ch 12), gravitation (Ch 13), fluids (Ch 14), oscillations (Ch 15), waves (Ch 16) and sound (Ch 17). Four sections are left out: §1.1, §8.5, §13.6 and §13.7. No UNF syllabus exists; the course is for personal study.

## What is in this folder

The catalog of 13 units, the page wiring, the citation map `src/data/textbook.js` (section titles only), and a problem bank for the chapters 2–13 and 15. Chapters 1, 14, 16 and 17 have no problems yet. Five labs are logic only: projectile, incline, track, collide and rotor. Their numbers are computed in this folder. The course runs on the physics shell (`npm run dev`, port 5180) with Practice, Notes, the units reference and Predict first. Unit 1 (Ch 1–3) is built: three labs, notes, and 34 problems. The other units' canvases show only the grid until each unit's PR draws its labs. The hub links the course.

The shared mechanics functions live in `packages/subjects/src/mechanics/`. They are not course material.
