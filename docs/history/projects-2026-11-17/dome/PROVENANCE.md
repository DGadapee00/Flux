# Provenance

This course uses the standard units, labs, notes and practice shell. It is a project, not a UNF course, so it has no syllabus,
course pack or textbook. It was written for Flux on 9 and 10 November 2026.

## References

Every figure names a source in `src/data/traveler.js`, each opened and read on its `checked` date:

- NASA reports on the NASA Technical Reports Server: the Ares I dome built at Marshall, a decade
  of friction stir welding at Marshall, the measured strength of stir welds in 2195 plate, and
  friction pull plug welding.
- NASA standards: NASA-STD-5006A (welding), 5001B (factors of safety), 5009C (inspection) and
  5019A (fracture control).
- TWI's page on friction stir welding, and Wikipedia's articles on friction stir welding, the 2195
  alloy, the Space Shuttle external tank and pressure vessels (CC BY-SA 4.0).

Nothing is copied: no prose, figures or tables. Flux writes its own text and states the figures a
source gives. Standards that are sold, such as AWS D17.3, are named and not reproduced.

## Data

The example dome is 5.5 m across at 235 kPa, the top of the Shuttle hydrogen tank's operating
range. The weld strengths, the repair strengths and the crack sizes an inspection is counted on to
find are the sources' own numbers (`src/labs/numbers.js` says which). The loads are thin-wall
membrane loads from pressure alone. A real tank also carries flight loads, so its lands are
thicker. The cases are situations written for this course, not records of real parts.
