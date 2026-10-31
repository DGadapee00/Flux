# Provenance

PHY 2048 is a review course. It has no Canvas drop and no instructor files in this folder.

## Source

Problems cite OpenStax *University Physics Volume 1* (CC BY-NC-SA 4.0):

https://openstax.org/books/university-physics-volume-1

Statements are written fresh, with generated numbers. A worked case uses numbers computed for this bank, and the citation is the section the method comes from. No figure and no textbook sentence is copied.

The units follow that volume's chapters in the book's order (D33), as set in `docs/course-plans/phy2048.md`: units, vectors and motion along a line (Ch 1–3), motion in two and three dimensions (Ch 4), Newton's laws (Ch 5–6), work and energy (Ch 7–8), momentum (Ch 9), fixed-axis rotation (Ch 10), rolling and angular momentum (Ch 11), equilibrium and elasticity (Ch 12), gravitation (Ch 13), fluids (Ch 14), oscillations (Ch 15), waves (Ch 16) and sound (Ch 17). Four sections are left out: §1.1, §8.5, §13.6 and §13.7. No UNF syllabus exists; the course is for personal study.

## What is in this folder

The catalog of 13 units, the page wiring, the citation map `src/data/textbook.js` (section titles only), and a problem bank for the chapters 2–13 and 15. Chapters 1, 14, 16 and 17 have no problems yet. The course runs on the physics shell (`npm run dev`, port 5180) with Practice, Notes, the units reference and Predict first. Unit 1 (Ch 1–3) is built: three labs, notes, and 34 problems. Unit 2 (Ch 4) is built: four labs, notes, and 17 problems. Unit 3 (Ch 5–6) is built: six labs, notes, and 25 problems. Unit 4 (Ch 7–8) is built: five labs, notes, and 27 problems. Unit 5 (Ch 9) is built: seven labs, notes, and 18 problems. Unit 6 (Ch 10) is built: four labs, notes, and 19 problems. Unit 7 (Ch 11) is built: five labs, notes, and 15 problems. Unit 8 (Ch 12) is built: four labs, notes, and 16 problems. Unit 9 (Ch 13) is built: three labs, notes, and 17 problems. The other units' canvases show only the grid until each unit's PR draws its labs. The hub links the course.

## Application lab numbers

- `stopping-distance` (Unit 1): OpenStax §3.4, "How Far Does a Car Go?".
- `wind-triangle` (Unit 2): OpenStax §4.5, "Flying a Plane in a Wind" (300 km/h, a 90 km/h wind from the northeast). The Cessna 172 cruises at about 120 kn true airspeed (Cessna 172S Pilot's Operating Handbook, cruise performance). The Boeing 737-800 cruises at Mach 0.785, about 450 kn at 35 000 ft (Boeing 737 airport planning document). Jet-stream winds of 150 kn and more: NOAA National Weather Service, JetStream. Only the figures are used; no text or figure is copied.

- `elevator-scale` (Unit 3): OpenStax §6.1, "What Does the Bathroom Scale Read in an Elevator?" (75.0 kg, 1.20 m/s²).
- `skydiver` (Unit 3): OpenStax §6.4, "Terminal Velocity of a Skydiver" (85 kg, 0.70 m², C = 1.0, ρ = 1.21 kg/m³), the same section's head-first figures (75 kg, 0.18 m², C = 0.70) and its 50 kg Check Your Understanding. The canopy's drag area, C·A = 25 m², is an illustrative value, not a manufacturer's, and the lab says so.
- `automotive-power` (Unit 4): OpenStax §7.4, "Automotive Power Driving Uphill" (1200 kg, a 15% grade, 90 km/h, 25% lost). Drag areas from §6.4's problems: a Toyota Camry, 0.70 m², and a Hummer H2, 2.44 m²; air at 1.21 kg/m³ as in §6.4. The rolling-resistance coefficient, 0.010, and the two highway cars' masses, 1500 kg and 2900 kg, are illustrative values, and the lab says so.
- `crumple-zone` (Unit 5): OpenStax §9.2, "The Benefits of Impulse" (27 m/s, weight 860 N, 2.5 s in a seatbelt, 0.20 s against a steering wheel). The spine's "about 1 s" is the book's rough first estimate; the worked comparison uses 2.5 s and 0.20 s.
- `crash-reconstruction` (Unit 5): OpenStax §9.4, "Analyzing a Car Crash" (1200 kg car that stops, 3000 kg truck, 10 m skid, μ = 0.62).
- `rocket` (Unit 5): OpenStax §9.7, "Thrust on a Spacecraft" (20 000 kg down to 14 000 kg, exhaust 250 m/s, 200 kg/s). That thruster cannot lift its own weight. The liftoff scenario (exhaust 2800 m/s, 20 000 kg down to 8000 kg) is illustrative, and the lab says so.
- `helicopter-rotor` (Unit 6): OpenStax §10.4, "Calculating Helicopter Energies" (four blades of 4.00 m and 50.0 kg, 300 rpm, a 1000 kg helicopter at 20.0 m/s). The fishing-reel lab cases use a 2 kg disk so a tangent force can produce the example's α. The reel's mass is not in the example. The Atwood pulley case (1.00 kg, 3.00 kg, a 2.00 kg disk of radius 0.100 m) is ours: §10.7 gives the method and does not print that set.
- `rover-wheel` (Unit 7): OpenStax §11.1, "Curiosity Rover" (a 25 cm wheel, mass 5 kg, a 25.0 m drop, Mars g = 3.71 m/s², modeled as a thin hoop). The book prints 9.63 m/s. The no-friction slide is a comparison we added. It is not a second reading of the example. The bullet-in-a-disk case uses our 1.248 rad/s because the book's printed 1.2 sits outside the grader. The high-bar moment is mL²/12 about the center, as the example states, and the book rounds the 0.495 s drop to 0.5 s.
- `car-balance` (Unit 8): OpenStax §12.1, "Center of Gravity of a Car" (wheelbase 2.5 m, 52% of the weight on the front axle, center 1.3 m ahead of the rear axle). The book’s weight cancels. The lab’s 12 000 N, the 0.55 m height, and the braking rates are ours, and the lab says so. The breaking-tension case keeps the printed 277 g. The page’s string components written over 5 are not a unit vector. The 1-2-√5 triangle is the geometry that produces that mass. The pillar case uses 1620 kg of granite. The book rounds that segment to 1.60×10³ kg. The yield wire is ours: §12.4 describes the idea and does not print this wire. The scaffold and the sign have no printed tensions. Their case wants are the equilibrium of the weights the sections give.
- `iss-orbit` (Unit 9): OpenStax §13.4, "The International Space Station" (400 km, Earth 5.96×10²⁴ kg, radius 6.37×10⁶ m). The station’s mass is not in that example. 4.20×10⁵ kg is a round figure so the readout has a mass to double, and the lab says so. The GPS scenario uses the section’s “about 20,000 km”. Halley’s speeds and the Earth–Mars transfer boost are computed here: those sections print the orbit and describe the path, and they do not print those speeds. The course uses G = 6.67430×10⁻¹¹. The book’s examples use 6.67×10⁻¹¹. Printed answers still grade inside the tolerance.

The book's source text was read from the public `openstax/osbooks-university-physics-bundle` repository, in a clone outside this repo. Nothing from it is committed.

The shared mechanics functions live in `packages/subjects/src/mechanics/`. They are not course material.
