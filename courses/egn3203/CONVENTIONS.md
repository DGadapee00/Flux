# EGN 3203 conventions

- Answers print three significant figures, four when the leading digit is 1
  (`src/problems/engine.js`).
- Vectors are columns. AB applies B first, then A.
- Elimination records one row operation per step; a swap is its own step.
- Partial pivoting swaps in the largest entry in the column, by absolute value.
