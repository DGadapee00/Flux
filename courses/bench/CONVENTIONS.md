# BENCH conventions

These stay in the course. They are not copied into `packages/core` or the shell.

- **Significant figures.** Three, four when the first digit is 1 (the engine's `sig` setting).
- **Units.** SI with the prefixes a bench uses: mA, kΩ, MΩ. Watt-hours and hours for batteries.
- **Signs.** A voltage is the red lead minus the black lead. A current through a meter is positive
  from its red lead to its black lead. A source's + end is its `b` hole.
- **The board.** A half-size breadboard: rows 1 to 30, holes a–e above the centre channel and f–j
  below it, a + and a − rail along the top and along the bottom. Hole names are `c12`, `T+5`,
  `B-5` (`@flux/subjects/em/breadboard.js`).
- **Colour.** The platform's meanings, plus: on the board, a strip's holes are coloured by its
  voltage, blue at 0 V to orange at the supply, and grey when it floats. Red jumpers and leads are
  +, black ones are −, green ones are anything else. A resistor carries its real colour bands.
- **Labs.** 2D labs on the engineering shell's stage. The meter's leads are placed from the Setup
  panel, not dragged, which suits a phone. Each lab solves its circuit by nodal analysis and checks
  it by relaxation (`relaxBoard`).
- **Units of the plan left out.** None yet; Units 2 to 9 follow, one per PR.
