# Provenance

The satellite labs live in this folder. There is no earlier repo to snapshot. The units follow the
map's satellite path, which follows the satellite application's subsystems in build order.

## Sources

MIT 16.07 Dynamics and MIT 16.851 Satellite Engineering on OpenCourseWare, cited by link only.
Nothing is copied from them: no prose, figures, examples or exercises.

NASA's State-of-the-Art of Small Spacecraft Technology (2026 edition) and the NASA Systems
Engineering Handbook (NASA/SP-2016-6105 Rev 2), cited by link only. `COVERAGE.md` maps their
chapters and sections to the units.

The order of work on new units follows the class schedule.

## What course material is here

Unit 1: elliptical orbits and Kepler's equation, solved by Newton's method and checked against an
integrated two-body orbit. Orbit altitudes are standard round figures for a geostationary transfer
orbit, a Molniya orbit and the ISS.

Unit 8: mission, requirements, verification and the life cycle's reviews, after the NASA Systems
Engineering Handbook. The mass budget's growth model follows NASA/TM-20250008066, a Beta
distribution whose mean follows maturity. The bus and payload masses are our own round figures for
a 6U craft. The mean growth for each maturity is the course's assumption. The 12 kg allocation is
2 kg per unit (Wikipedia, CubeSat).

Unit 9: the space environment and radiation, after MIT 16.851 Lecture 5. The drag model takes the
U.S. Standard Atmosphere 1976 density at 300 km, an atomic-oxygen scale height H = kT/(mg), and the
exospheric temperature T∞ ≈ 500 + 3.4 F10.7 (Wikipedia, Thermosphere). The doses behind CubeSat
shielding and the margin of 2 are NASA's small spacecraft report, 6.5. The upset rate is Cassini's
(Wikipedia, ECC memory). The 6U craft's mass and area are our own round figures.
