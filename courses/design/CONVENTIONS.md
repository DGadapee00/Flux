# Design practice conventions

- Answers print three significant figures, four when the leading digit is 1
  (`src/problems/engine.js`).
- Fits are in micrometres from a 50 mm basic size, hole basis. Clearance is hole minus shaft;
  negative is interference.
- A tolerance band is ±3σ of its process unless a lab says otherwise (Cp scales it).
- Lengths elsewhere are in millimetres. Process limits are LSL and USL.
- Decision scores run from 1, the worst concept that passes the requirements, to 5, the best.
