# EGN 3331 conventions

- **Citations.** Every citation goes through `src/data/textbook.js`: problems use `cite(topic)`,
  and notes write the same strings, which notes-check verifies. The "Ch" numbers in the practice
  list are the course pack's (D11), not Roylance's.
- **Units.** Values inside a problem are SI base units. English problems go through
  `subjects/src/convert.js`. Unit 1 has two in kip and inches, and the shackle pin in pounds and
  inches (problems-check requires one per unit with problems). The shackle takes 2200 lbf for each
  catalog tonne.
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
- **Labs** are plot2d. `compute` is pure; `draw` paints a to-scale drawing and a chart inside the
  space the panels leave (`labs/diagram.js`). Each lab declares `sweep(state)`, and labs-check
  moves that slider end to end.
- **Order.** The eleven units follow the spine the owner confirmed (2.001, then Hibbeler for
  transverse shear and buckling). Units 1–10 are at the standard. Unit 11 is still
  listed as coming.
