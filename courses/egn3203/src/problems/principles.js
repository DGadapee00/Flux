/**
 * The principles this course's problems turn on. A template names its deciding principle; the
 * practice panel shows it with each solution and groups misses by it.
 */
export const PRINCIPLES = {
  rk: { name: 'Order beats step count', statement: 'A method of order p has error ∝ hᵖ. With a fixed budget of slope evaluations, a higher-order method takes fewer, longer steps and still wins: halving h halves Euler’s error and divides RK4’s by 16.', cue: 'Solving an ODE numerically, or choosing a step size.', family: 'Numerical methods' },
  columns: { name: 'A matrix is its columns', statement: 'A matrix sends each unit vector to one of its columns, and every other vector to the same combination of them; areas scale by det A.', cue: 'A transformation given as a matrix.', family: 'Linear algebra' },
  projection: { name: 'The error is square to the plane', statement: 'The closest point p = Ax̂ to b has b − p perpendicular to every column, so AᵀA x̂ = Aᵀb. Separate projections onto the columns add up to p only when the columns are perpendicular.', cue: 'A system with more equations than unknowns, a best fit, or a projection.', family: 'Linear algebra' },
  'no-commute': { name: 'Order matters', statement: 'AB applies B first, then A; in general AB ≠ BA, though det(AB) = det A det B.', cue: 'Two transformations in a row.', family: 'Linear algebra' },
  conditioning: { name: 'κ amplifies, the residual hides it', statement: 'A change δb moves the solution by up to κ(A) times as much, relatively: ‖δx‖/‖x‖ ≤ κ ‖δb‖/‖b‖. A small residual b − Ax̂ says x̂ nearly fits, not that it is near the true x.', cue: 'Nearly parallel lines or planes, or an answer checked by its residual.', family: 'Linear algebra' },
  elimination: { name: 'Row operations keep the solution', statement: 'Adding a multiple of one equation to another, or swapping two, never changes the solution; elimination uses them to reach a triangle, solved from the bottom up.', cue: 'A square linear system.', family: 'Linear algebra' },
  conditioning: { name: 'Condition, not determinant', statement: 'How close a matrix is to singular is its condition number κ = σ₁/σ₂, the flatness of the ellipse it maps the circle to. Scaling a matrix changes det but not κ.', cue: 'A matrix with a small determinant, or an inverse with large entries.', family: 'Linear algebra' },
  eigen: { name: 'Directions a matrix only stretches', statement: 'Av = λv where det(A − λI) = 0: λ² − (tr A)λ + det A = 0 for a 2×2. A negative discriminant means no real eigenvector.', cue: 'A matrix and the directions it keeps.', family: 'Linear algebra' },
  rank: { name: 'Rank decides the answers', statement: 'Ax = b has a solution when rank [A | b] = rank A; it is unique when that rank is n, and a family xₚ + xₙ otherwise.', cue: 'A system that may have no answer or many.', family: 'Linear algebra' },
  cancellation: { name: 'Do not subtract nearly equal numbers', statement: 'Each operation is good to u = 2⁻⁵³ relative; a − b keeps the absolute error, so its relative error is about u|a|/|a − b|. Rewrite to avoid the subtraction.', cue: 'A formula that subtracts close numbers at small or large arguments.', family: 'Numerics' },
  roots: { name: 'Bisection is sure, Newton is fast', statement: 'Bisection halves a sign-change bracket each step and always converges; Newton, x − f/f′, doubles the digits near a simple root but can jump to a far root or cycle from a poor start.', cue: 'Solving f(x) = 0 by iteration.', family: 'Numerics' },
  order: { name: 'Order of accuracy', statement: 'A method with error about K hᵖ divides its error by 2ᵖ when h is halved; p is the slope of the error on log axes, until round-off takes over.', cue: 'A step size, and an error that depends on it.', family: 'Numerics' },
  pivoting: { name: 'Pivot on the largest entry', statement: 'Dividing by a tiny pivot makes huge multipliers that swamp the other rows in rounding; swapping the largest entry into the pivot spot avoids it.', cue: 'Solving a system in floating point.', family: 'Numerics' },
};

/** Tags for templates that do not carry their own `principles`. */
export const PRINCIPLE_TAGS = {};
