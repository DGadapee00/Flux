/**
 * The principles this course's problems turn on. A template names its deciding principle; the
 * practice panel shows it with each solution and groups misses by it.
 */
export const PRINCIPLES = {
  columns: { name: 'A matrix is its columns', statement: 'A matrix sends each unit vector to one of its columns, and every other vector to the same combination of them; areas scale by det A.', cue: 'A transformation given as a matrix.', family: 'Linear algebra' },
  'no-commute': { name: 'Order matters', statement: 'AB applies B first, then A; in general AB ≠ BA, though det(AB) = det A det B.', cue: 'Two transformations in a row.', family: 'Linear algebra' },
  elimination: { name: 'Row operations keep the solution', statement: 'Adding a multiple of one equation to another, or swapping two, never changes the solution; elimination uses them to reach a triangle, solved from the bottom up.', cue: 'A square linear system.', family: 'Linear algebra' },
  pivoting: { name: 'Pivot on the largest entry', statement: 'Dividing by a tiny pivot makes huge multipliers that swamp the other rows in rounding; swapping the largest entry into the pivot spot avoids it.', cue: 'Solving a system in floating point.', family: 'Numerics' },
};

/** Tags for templates that do not carry their own `principles`. */
export const PRINCIPLE_TAGS = {};
