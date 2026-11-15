# Satellite coverage

One row per topic in the three standard references. Each row says where the topic sits in each
reference, when the class reaches it, and what the course has now.

- **16.851**: MIT 16.851 Satellite Engineering, Fall 2003, lecture number. Index: `docs/ocw/16-851.md`.
- **SoA**: NASA, [State-of-the-Art of Small Spacecraft Technology](https://www.nasa.gov/smallsat-institute/sst-soa/), 2026 edition, chapter or section.
- **SEH**: [NASA Systems Engineering Handbook](https://www.nasa.gov/reference/systems-engineering-handbook/), NASA/SP-2016-6105 Rev 2, section.
- **Class**: the stage at which the class reaches the topic. The class has no weekly calendar yet,
  so stages stand in for weeks. 1 is the first week. 2 and 3 end in the first and second design
  reviews. 4 is the end of term. 5 is project work after the term. "none" means the class does
  not place it.
- **Status**: covered (notes, labs and practice), notes only, or missing.

## Coverage

| Topic | 16.851 | SoA | SEH | Class | Unit and labs now | Status |
|---|---|---|---|---|---|---|
| Mission statement, objectives and concept of operations | none | [2](https://www.nasa.gov/smallsat-institute/sst-soa/platforms) | [3.3](https://www.nasa.gov/reference/3-0-nasa-program-project-life-cycle/), [4.1](https://www.nasa.gov/reference/4-0-system-design-processes/) | 1 | u7 notes: one mission case | notes only |
| Requirements and the verification matrix | [L17](https://ocw.mit.edu/courses/16-851-satellite-engineering-fall-2003/resources/l17_software_eng/) | none | [4.2](https://www.nasa.gov/reference/4-0-system-design-processes/), [5.3](https://www.nasa.gov/reference/5-0-product-realization/), App. C, App. D | 3 | none | missing |
| Life cycle phases and design reviews | none | none | [3.0](https://www.nasa.gov/reference/3-0-nasa-program-project-life-cycle/), [6.7](https://www.nasa.gov/reference/6-0-crosscutting-technical-management/) | 2, 3, 4 | none | missing |
| Mass budget, margins and performance measures | [L1](https://ocw.mit.edu/courses/16-851-satellite-engineering-fall-2003/resources/l1_launch_system/) | [2](https://www.nasa.gov/smallsat-institute/sst-soa/platforms) | [4.2](https://www.nasa.gov/reference/4-0-system-design-processes/), [6.7](https://www.nasa.gov/reference/6-0-crosscutting-technical-management/) | 3 | u7 notes: budgets agree | notes only |
| Interfaces and integration | none | [2](https://www.nasa.gov/smallsat-institute/sst-soa/platforms), [10](https://www.nasa.gov/smallsat-institute/sst-soa/integration-launch-and-deployment) | [6.3](https://www.nasa.gov/reference/6-0-crosscutting-technical-management/) | 4 | u7 notes; handoffs in each unit's notes | notes only |
| Risk and trade studies | none | none | [6.4](https://www.nasa.gov/reference/6-0-crosscutting-technical-management/), [6.8](https://www.nasa.gov/reference/6-0-crosscutting-technical-management/) | 2, 3 | u7 notes: one trade study; u4 notes: material and process choices | notes only |
| Cost modelling | [L15](https://ocw.mit.edu/courses/16-851-satellite-engineering-fall-2003/resources/l15_costmodellec/) | none | [2.5](https://www.nasa.gov/reference/2-0-fundamentals-of-systems-engineering/) | none | none | missing |
| Launch vehicles and launch selection | [L1](https://ocw.mit.edu/courses/16-851-satellite-engineering-fall-2003/resources/l1_launch_system/) | [10](https://www.nasa.gov/smallsat-institute/sst-soa/integration-launch-and-deployment) | none | 5 | none | missing |
| Rocket equation and in-space propulsion | [L4](https://ocw.mit.edu/courses/16-851-satellite-engineering-fall-2003/resources/l4_propulsion/) | [4](https://www.nasa.gov/smallsat-institute/sst-soa/in-space_propulsion) | none | none | u1 lists "Rocket equation" as coming | missing |
| Orbits, Kepler's equation and transfers | [L2](https://ocw.mit.edu/courses/16-851-satellite-engineering-fall-2003/resources/l2_orbital_mech/) | none | none | none | u1: kepler, transfer | covered |
| Eclipses and ground-station passes | [L2](https://ocw.mit.edu/courses/16-851-satellite-engineering-fall-2003/resources/l2_orbital_mech/), [L24](https://ocw.mit.edu/courses/16-851-satellite-engineering-fall-2003/resources/l24_groundsysdes/) | [11](https://www.nasa.gov/smallsat-institute/sst-soa/ground-data-systems-and-mission-operations) | none | 3 | u1: passes | covered |
| Formation flight and relative motion | [L10–13](https://ocw.mit.edu/courses/16-851-satellite-engineering-fall-2003/resources/l10_emformflight/) | [5.3](https://www.nasa.gov/smallsat-institute/sst-soa/guidance-navigation-and-control) | none | 1 | none | missing |
| Space environment: atmosphere, plasma, magnetic field | [L5](https://ocw.mit.edu/courses/16-851-satellite-engineering-fall-2003/resources/l5_space_environ_done2/) | none | none | none | u6 uses sunlight, albedo and Earth infrared only | missing |
| Radiation: dose, single-event effects, shielding | [L5](https://ocw.mit.edu/courses/16-851-satellite-engineering-fall-2003/resources/l5_space_environ_done2/) | [6.5](https://www.nasa.gov/smallsat-institute/sst-soa/structures-materials-and-mechanisms), [8.2.1](https://www.nasa.gov/smallsat-institute/sst-soa/small-spacecraft-avionics) | none | 1 | u7 notes cite L5 in one checklist line | missing |
| Power: arrays, batteries, energy budget | [L3](https://ocw.mit.edu/courses/16-851-satellite-engineering-fall-2003/resources/l3_scpowersys_dm_done2/) | [3](https://www.nasa.gov/smallsat-institute/sst-soa/power-subsystems) | none | 2 | u5: power, ageing | covered |
| Attitude determination and control, pointing budget | [L9](https://ocw.mit.edu/courses/16-851-satellite-engineering-fall-2003/resources/l9_acs/) | [5](https://www.nasa.gov/smallsat-institute/sst-soa/guidance-navigation-and-control) | none | 2 | u3: attitude, spin, pointing, poles, wheel | covered |
| Attitude and position sensors: star trackers, sun sensors, GPS | [L9](https://ocw.mit.edu/courses/16-851-satellite-engineering-fall-2003/resources/l9_acs/) | [5.2](https://www.nasa.gov/smallsat-institute/sst-soa/guidance-navigation-and-control) | none | 2 | none | missing |
| Optics and optical payloads | [L6–8](https://ocw.mit.edu/courses/16-851-satellite-engineering-fall-2003/resources/l6_optics_1/) | [9.3](https://www.nasa.gov/smallsat-institute/sst-soa/soa-communications) | none | 1, 5 | none | missing |
| Sensor payload and data budget | [L19](https://ocw.mit.edu/courses/16-851-satellite-engineering-fall-2003/resources/l19scraftcompsys/) | none | none | 1, 3 | u7 notes: sensor model, data count | notes only |
| Structures and launch loads | [L14](https://ocw.mit.edu/courses/16-851-satellite-engineering-fall-2003/resources/l14_structures/) | [6](https://www.nasa.gov/smallsat-institute/sst-soa/structures-materials-and-mechanisms) | none | 5 | u4: shake, random; material, process, joint and finish notes | covered |
| Mechanisms and deployables | [L14](https://ocw.mit.edu/courses/16-851-satellite-engineering-fall-2003/resources/l14_structures/) | [6.3](https://www.nasa.gov/smallsat-institute/sst-soa/structures-materials-and-mechanisms) | none | none | none | missing |
| Thermal control | [L23](https://ocw.mit.edu/courses/16-851-satellite-engineering-fall-2003/resources/l23thermalcontro/) | [7](https://www.nasa.gov/smallsat-institute/sst-soa/thermal-control) | none | 5 | u6: balance, nodes | covered |
| Environmental test and verification | [L14](https://ocw.mit.edu/courses/16-851-satellite-engineering-fall-2003/resources/l14_structures/) | [6.4.2](https://www.nasa.gov/smallsat-institute/sst-soa/structures-materials-and-mechanisms) | [5.3](https://www.nasa.gov/reference/5-0-product-realization/) | 5 | none | missing |
| Communications and the link budget | [L21](https://ocw.mit.edu/courses/16-851-satellite-engineering-fall-2003/resources/l21satelitecomm2_done/) | [9](https://www.nasa.gov/smallsat-institute/sst-soa/soa-communications) | none | 3 | u2: noise, link | covered |
| Telemetry, tracking and command | [L20](https://ocw.mit.edu/courses/16-851-satellite-engineering-fall-2003/resources/l20_satellitettc/) | [9](https://www.nasa.gov/smallsat-institute/sst-soa/soa-communications), [11](https://www.nasa.gov/smallsat-institute/sst-soa/ground-data-systems-and-mission-operations) | none | 3 | none | missing |
| Ground systems and mission operations | [L24](https://ocw.mit.edu/courses/16-851-satellite-engineering-fall-2003/resources/l24_groundsysdes/) | [11](https://www.nasa.gov/smallsat-institute/sst-soa/ground-data-systems-and-mission-operations) | [3.8](https://www.nasa.gov/reference/3-0-nasa-program-project-life-cycle/) | 5 | u1 passes covers visibility only | missing |
| Identification and tracking | none | [12](https://www.nasa.gov/smallsat-institute/sst-soa/identification-and-tracking-systems) | none | none | none | missing |
| Onboard computing and avionics | [L19](https://ocw.mit.edu/courses/16-851-satellite-engineering-fall-2003/resources/l19scraftcompsys/) | [8.2](https://www.nasa.gov/smallsat-institute/sst-soa/small-spacecraft-avionics) | none | none | none | missing |
| Flight software and software engineering | [L16](https://ocw.mit.edu/courses/16-851-satellite-engineering-fall-2003/resources/l16_software/), [L17](https://ocw.mit.edu/courses/16-851-satellite-engineering-fall-2003/resources/l17_software_eng/) | [8.3](https://www.nasa.gov/smallsat-institute/sst-soa/small-spacecraft-avionics) | none | 3 | none | missing |
| Autonomy and fault management | [L18](https://ocw.mit.edu/courses/16-851-satellite-engineering-fall-2003/resources/l18_autonomy_lec/) | [8.3](https://www.nasa.gov/smallsat-institute/sst-soa/small-spacecraft-avionics) | none | none | none | missing |
| Reentry, deorbit and debris rules | [L22](https://ocw.mit.edu/courses/16-851-satellite-engineering-fall-2003/resources/l22_reentry/) | [13](https://www.nasa.gov/smallsat-institute/sst-soa/deorbit-systems) | [3.9](https://www.nasa.gov/reference/3-0-nasa-program-project-life-cycle/) | none | none | missing |

## Totals

31 topics: 7 covered, 5 notes only, 19 missing.

## 16.851 lectures and SoA chapters by unit

| Unit | 16.851 | SoA |
|---|---|---|
| u1 Orbit | L2 | none |
| u2 Communications | L21 | 9 |
| u3 Attitude control | L9 | 5 |
| u4 Structure | L14 | 6, 10 |
| u5 Power | L3 | 3 |
| u6 Thermal control | L23 | 7 |
| u7 Payload and integration | none | 2 |
| No unit yet | L1, L4, L5, L6–8, L10–13, L15–20, L22, L24 | 1, 4, 8, 11, 12, 13 |
