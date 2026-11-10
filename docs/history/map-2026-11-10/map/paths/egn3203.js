/**
 * EGN 3203 Modern Computation Methods, in the order of MIT 2.086 Numerical Computation for
 * Mechanical Engineers, Spring 2013 (docs/ocw/2-086.md), with the archived plan
 * (docs/history/guidance-2026-11-02/docs/course-plans/egn3203.md) for scope. EGN 3203 has no Flux
 * app, so every new concept here is a gap with a candidate lab.
 *
 * Two places bend 2.086's order to keep each prerequisite first:
 * - Elimination, the determinant and rank sit in the first linear algebra unit, because projection
 *   and least squares (taught there) build on them. 2.086 solves systems in its second unit.
 * - Eigenvalues sit in the ODE unit, where 2.086 meets them (recitation 8, MATLAB eig).
 */
export default {
  course: 'egn3203',
  units: [
    {
      title: 'Numerical calculus (2.086 lectures 1 to 3)',
      concepts: ['floating-point', 'truncation-error', 'interpolation', 'numerical-differentiation', 'numerical-integration'],
    },
    {
      title: 'Probability and statistics (lectures 4 to 8)',
      concepts: ['random-variables', 'sampling-distributions', 'confidence-intervals', 'monte-carlo'],
    },
    {
      title: 'Linear algebra 1: matrices and least squares (lectures 9 to 11 and 14)',
      concepts: [
        'matrix-maps',
        'gaussian-elimination',
        'determinant-inverse',
        'rank-nullspace',
        'orthogonality-projection',
        'linear-regression',
        'least-squares',
      ],
    },
    { title: 'Ordinary differential equations (lectures 15 to 17)', concepts: ['euler-method', 'runge-kutta', 'eigenvalues', 'ode-stability'] },
    { title: 'Linear algebra 2: solving linear systems (lectures 18 to 21)', concepts: ['lu-conditioning', 'symmetric-quadratic'] },
    { title: 'Nonlinear problems (lectures 22 to 24)', concepts: ['root-finding', 'newton-systems'] },
  ],
};
