/**
 * Predict first: two to four prompts per lab. `expect` is what the lab's own compute says after
 * `apply`, and labs-check confirms it. A prediction nobody would get wrong teaches nothing.
 */

export const PREDICTIONS = {
  matrix: [
    {
      id: 'mx-order',
      scenario: 'shear-then-turn',
      ask: 'The square is sheared, then turned a quarter. Turn it first, then shear. Does the area change?',
      apply(s) { s.compose = 'before'; },
      watch: [{ id: 'det', label: 'the area scale', get: (c) => c.det }],
      mode: 'dir',
      expect: { det: 'same' },
      why: 'Neither a shear nor a turn changes area, in either order: det(AB) = det A det B. The square lands in a different place, but with the same area.',
    },
    {
      id: 'mx-commute',
      scenario: 'shear-then-turn',
      ask: 'Do the two orders, shear then turn and turn then shear, send the square to the same place?',
      apply(s) { s.compose = 'after'; },
      watch: [{ id: 'commutes', label: 'The two orders agree', get: (c) => c.commutes, mode: 'bool' }],
      mode: 'bool',
      expect: { commutes: false },
      why: 'Matrix products do not commute. Shear then turn sends (1, 0) to (0, 1); turn then shear sends it to (1, 1).',
    },
    {
      id: 'mx-squash',
      scenario: 'stretch',
      ask: 'Set the columns to (1, 0.5) and (2, 1): the second is twice the first. What happens to the area?',
      apply(s) { Object.assign(s, { a: 1, c: 0.5, b: 2, d: 1 }); },
      watch: [{ id: 'det', label: 'the area scale', get: (c) => Math.abs(c.det) }],
      mode: 'dir',
      expect: { det: 'smaller' },
      why: 'Columns along one line span only that line: the square flattens and det A = 0.',
    },
  ],
  elimination: [
    {
      id: 'el-same',
      scenario: 'three',
      ask: 'Do the first three row operations. Does the system’s solution move?',
      apply(s) { s.step = 3; },
      watch: [{ id: 'x1', label: 'the solution’s first entry', get: (c) => Math.round(c.x[0] * 1e9) / 1e9 }],
      mode: 'dir',
      expect: { x1: 'same' },
      why: 'Every row operation can be undone, so every step has exactly the same solution: (2, 3, −1).',
    },
    {
      id: 'el-pivot',
      scenario: 'tiny',
      ask: 'A pivot of 10⁻¹⁷ left in place gives x₁ = 0, not 1. Turn on pivoting, which swaps the rows first. What happens to the error?',
      apply(s) { s.pivot = true; s.step = 2; },
      watch: [{ id: 'err', label: 'the error in the solution', get: (c) => c.err }],
      mode: 'dir',
      expect: { err: 'smaller' },
      why: 'With 1 as the pivot the multiplier is tiny, nothing is swamped by rounding, and the answer comes out right.',
    },
  ],
};
