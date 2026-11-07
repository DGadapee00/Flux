# EEL 3111 conventions

- Answers print three significant figures, four when the leading digit is 1
  (`src/problems/engine.js`).
- Node 0 is ground. A branch runs from node a to node b; its source pushes current from a to b.
- Mesh currents all run the same way round their windows.
- Every voltage source has its own series resistance, so there are no supernodes yet.
