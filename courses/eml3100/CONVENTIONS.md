# EML 3100 conventions

- **Citations.** Every citation goes through `src/data/textbook.js`: problems use `cite(topic)`,
  and notes write the same strings, which notes-check verifies. Chapter numbers in the practice
  list are Yan's.
- **Units.** Values inside a problem are SI base units. English problems go through
  `subjects/src/convert.js`; at least one problem per unit is in English units (problems-check).
- **Figures.** Answers and steps print four significant figures, the precision a property table
  prints.
- **Tables.** Flux generates its tables from the property library. A part a student would read
  from a table passes `alt`: the linear interpolation from that table, typed to four figures.
  Both the exact value and the table value are accepted. A version where the interpolation would
  be poor (for example a straight line in pressure between low-pressure blocks, where v ∝ 1/P) is
  kept out of the bank rather than graded leniently.
- **Range.** Generators keep to IF97 regions 1 and 2 and the saturation line below 350 °C
  (`covered`), and air between 200 K and 3500 K. Region 3 is never sampled.
- **Signs.** Heat added to the system and work done by the system are positive: Q − W = ΔU.
- **Second methods.** Every answer has one: v as ∂g/∂P, h as u + Pv, T by bisection on the
  saturation equation, boundary work by Simpson's rule, the mass of air by moles, English units
  computed in English units.
- **Labs** are plot2d. `compute` is pure; `draw` paints the diagram inside the space the panels
  leave (`labs/diagram.js`). Each lab declares `sweep(state)`, and labs-check moves that slider
  end to end.
