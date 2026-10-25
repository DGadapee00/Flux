# Provenance

PHY 2048 is a review course. It has no Canvas drop and no instructor files in this folder.

## Source

Problems cite OpenStax *University Physics Volume 1* (CC BY-NC-SA 4.0):

https://openstax.org/books/university-physics-volume-1

Statements are written fresh, with generated numbers. A worked case uses numbers computed for this bank, and the citation is the section the method comes from. No figure and no textbook sentence is copied.

The units follow that volume's chapters in the book's order (D33), as set in `docs/course-plans/phy2048.md`: units, vectors and motion along a line (Ch 1–3), motion in two and three dimensions (Ch 4), Newton's laws (Ch 5–6), work and energy (Ch 7–8), momentum (Ch 9), fixed-axis rotation (Ch 10), rolling and angular momentum (Ch 11), equilibrium and elasticity (Ch 12), gravitation (Ch 13), fluids (Ch 14), oscillations (Ch 15), waves (Ch 16) and sound (Ch 17). Four sections are left out: §1.1, §8.5, §13.6 and §13.7. No UNF syllabus exists; the course is for personal study.

## What is in this folder

The catalog of 13 units, the page wiring, the citation map `src/data/textbook.js` (section titles only), and a problem bank for the chapters 2–13 and 15. Chapters 1, 14, 16 and 17 have no problems yet. Three older labs are logic only: track, collide and rotor. Their numbers are computed in this folder. The course runs on the physics shell (`npm run dev`, port 5180) with Practice, Notes, the units reference and Predict first. Unit 1 (Ch 1–3) is built: three labs, notes, and 34 problems. Unit 2 (Ch 4) is built: four labs, notes, and 17 problems. Unit 3 (Ch 5–6) is built: six labs, notes, and 25 problems. The other units' canvases show only the grid until each unit's PR draws its labs. The hub links the course.

## Application lab numbers

- `stopping-distance` (Unit 1): OpenStax §3.4, "How Far Does a Car Go?".
- `wind-triangle` (Unit 2): OpenStax §4.5, "Flying a Plane in a Wind" (300 km/h, a 90 km/h wind from the northeast). The Cessna 172 cruises at about 120 kn true airspeed (Cessna 172S Pilot's Operating Handbook, cruise performance). The Boeing 737-800 cruises at Mach 0.785, about 450 kn at 35 000 ft (Boeing 737 airport planning document). Jet-stream winds of 150 kn and more: NOAA National Weather Service, JetStream. Only the figures are used; no text or figure is copied.

- `elevator-scale` (Unit 3): OpenStax §6.1, "What Does the Bathroom Scale Read in an Elevator?" (75.0 kg, 1.20 m/s²).
- `skydiver` (Unit 3): OpenStax §6.4, "Terminal Velocity of a Skydiver" (85 kg, 0.70 m², C = 1.0, ρ = 1.21 kg/m³), the same section's head-first figures (75 kg, 0.18 m², C = 0.70) and its 50 kg Check Your Understanding. The canopy's drag area, C·A = 25 m², is an illustrative value, not a manufacturer's, and the lab says so.

The book's source text was read from the public `openstax/osbooks-university-physics-bundle` repository, in a clone outside this repo. Nothing from it is committed.

The shared mechanics functions live in `packages/subjects/src/mechanics/`. They are not course material.
