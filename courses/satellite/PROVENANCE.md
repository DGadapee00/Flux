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

Unit 3, attitude sensors and the pointing budget: two sections added after the existing ones. The
sensor accuracies are NASA's small spacecraft report's (2026, Tables 5-5, 5-7 and 5-8): a star
tracker's 30″, a fine Sun sensor's 0.3° and a horizon sensor's 1°, each taken as 3σ. The jitter,
misalignment and thermal bending are our own round figures.

Unit 10: avionics, flight software and data, after MIT 16.851 Lectures 16 to 19. The scheduling
tests are Liu and Layland's bound and response-time analysis (Wikipedia, Rate-monotonic
scheduling). The margin rule, four times the estimate at the requirements review and twice at
launch, is Lecture 16's. Bus speeds are from Wikipedia's I²C and SPI articles; radio rates from
NASA's small spacecraft report, Table 9-3. The task set, the payload rate and the watchdog figures
are our own.

Unit 2, telemetry, tracking and command: three sections added after the existing ones, after MIT
16.851 Lecture 20. Licensing and command protection follow NASA's small spacecraft report, 9.2.5,
9.2.6 and 11.8.1. The carriers lie in the bands of the report's Table 9-3. The telemetry channel
list is our own.

Unit 11: optical payloads and laser links, after MIT 16.851 Lectures 6 to 8 and NASA's small
spacecraft report, 9.3. The Rayleigh criterion and the Airy zero are from Lecture 6 and Wikipedia's
Airy disk article; beam divergence and the power through an aperture from Wikipedia's Gaussian
beam article. Laser wavelengths and rates are from the report's Table 9-4, and the 40 cm ground
telescope is OCSD's. The camera and terminal figures are our own.

Unit 12: ground systems and operations, after MIT 16.851 Lecture 24 and NASA's small spacecraft
report, chapter 11. Station positions are the ATLAS network's, from the report's Table 11-7. The
coverage model, a ground-track latitude density integrated over each station's circle of view, is
our own, checked against flying the orbit.

Unit 7, mission design: three sections and a lab added after the existing ones, after the NASA
Systems Engineering Handbook (3.0, 4.0, 4.4 and 6.7). The lab combines the course's subsystem
models on Unit 8's craft. The thermal sphere is Unit 6's, resized to the craft's surface. The 0 to
50 °C limits are MIT 16.851 Lecture 23's operating range for digital electronics. Radio rates are
NASA's small spacecraft report's, Table 9-3. The loads, the radios' powers and antennas, the
payloads, the power system's mass and the 30% depth of discharge are our own round figures. The
check, flying the craft for twenty days, is our own.
