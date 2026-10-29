# EGN 3331 conventions

- **Citations.** Every citation goes through `src/data/textbook.js`: problems use `cite(topic)`,
  and notes write the same strings, which notes-check verifies. The "Ch" numbers in the practice
  list are the course pack's (D11), not Roylance's.
- **Units.** Values inside a problem are SI base units. English problems go through
  `subjects/src/convert.js`. Unit 1 has two in kip and inches, and the shackle pin in pounds and
  inches. The shackle takes 2200 lbf for each catalog tonne. Unit 11 works the adjustable column
  in kip and inches (problems-check requires one per unit with problems).
- **Figures.** Three significant figures, four when the leading digit is 1, as in Dynamics.
  Grading accepts 2%.
- **Signs.** Tension is positive. On an inclined plane, θ is the angle between the bar's axis and
  the plane's normal. Internal loads: N positive in tension, V positive when it acts downward on
  the left piece's face, M positive when the beam sags.
- **Colours.** Force pink, normal stress gold, shear stress teal; members in tension red, in
  compression blue; the allowable line yellow.
- **Second methods.** Every answer has one: the stress transformation against the inclined-plane
  formulas, the method of joints against the method of sections, a pin's segments against
  V = P/n, bisection on an allowable, and English problems worked in English units.
- **Labs** are plot2d. `compute` is pure; `draw` paints the member (bar, beam, shaft, element or
  column, to scale where the geometry allows, with its loads and supports) and a chart inside the
  space the panels leave (`labs/diagram.js`). Each lab declares `sweep(state)`, and labs-check
  moves that slider end to end. The drawing and the chart share the space through `panes`
  (`long` members stack over their chart on a phone). Labs that move (the shear and moment cut,
  Mohr's element, the axial load, the tension coupon, the torque, the crane rope's catch) keep
  their clock in the state and take Play and Space from the engineering shell's `motion.js`.
- **Problems.** Every template carries principle tags from `src/problems/principles.js` (tags
  only, D34), a second method by another route, and steps that show the working, not just the
  results. Every numeric template has traps, and problems-check requires each trap to catch its
  own mistake in three versions of four. Every choice option has a `why`. Core results also ask
  for a symbolic answer (`sym` in `kit.js`), checked by value, units and grading. Each unit has at
  least three level-3 templates. Loads are realistic for the material: the built-up beam is three
  dressed 2×6 boards at 3 kN, not a stress no timber carries.
- **Order.** The eleven units follow the spine the owner confirmed (2.001, then Hibbeler for
  transverse shear and buckling), with the topics D37 adds. All eleven units pass the
  scorecard. The R3c rework is done except the printed-answer worked cases, which wait on OCW
  access.
