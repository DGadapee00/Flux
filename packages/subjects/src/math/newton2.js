/**
 * Newton's method for two equations in two unknowns (EGN 3203).
 *
 * Where does the circle x² + y² = 4 cross the curve y = 1 − eˣ? Write F(x, y) = (x² + y² − 4,
 * eˣ + y − 1) = 0. Newton's method replaces both curves by their tangent planes at the current point
 * and solves the linear system J Δ = −F, with J = [[2x, 2y], [eˣ, 1]], moving both unknowns together.
 * Near a root the error is squared each step. Solving one equation at a time instead, y from the
 * second then x from the first, makes each step undo part of the other, and converges only linearly,
 * if at all.
 *
 * The second method substitutes y = 1 − eˣ into the circle and finds the root of
 * g(x) = x² + (1 − eˣ)² − 4 by bisection.
 */

export const F = ([x, y]) => [x * x + y * y - 4, Math.exp(x) + y - 1];
export const J = ([x, y]) => [[2 * x, 2 * y], [Math.exp(x), 1]];

export function newtonPath(x0, y0, steps = 40) {
  const path = [[x0, y0]];
  let p = [x0, y0];
  for (let k = 0; k < steps; k++) {
    const f = F(p);
    const j = J(p);
    const det = j[0][0] * j[1][1] - j[0][1] * j[1][0];
    if (Math.abs(det) < 1e-14) break;
    const dx = (-f[0] * j[1][1] + f[1] * j[0][1]) / det;
    const dy = (-j[0][0] * f[1] + j[1][0] * f[0]) / det;
    p = [p[0] + dx, p[1] + dy];
    path.push(p);
    if (!Number.isFinite(p[0]) || Math.hypot(dx, dy) < 1e-15) break;
  }
  return path;
}

/** One at a time: y from the second equation, then x from the first on the starting point's side. */
export function alternatePath(x0, y0, steps = 12) {
  const path = [[x0, y0]];
  let x = x0;
  const side = x0 >= 0 ? 1 : -1;
  for (let k = 0; k < steps; k++) {
    const y = 1 - Math.exp(x);
    path.push([x, y]);
    if (y * y > 4) break;
    x = side * Math.sqrt(4 - y * y);
    path.push([x, y]);
  }
  return path;
}

export function rootByBisection(lo, hi) {
  const g = (x) => x * x + (1 - Math.exp(x)) ** 2 - 4;
  let a = lo;
  let b = hi;
  for (let i = 0; i < 200; i++) {
    const m = (a + b) / 2;
    if (Math.sign(g(m)) === Math.sign(g(a))) a = m;
    else b = m;
  }
  const x = (a + b) / 2;
  return [x, 1 - Math.exp(x)];
}
export const ROOTS = [rootByBisection(-3, -1), rootByBisection(0.5, 2)];

export function newtonChecked({ x0, y0 }) {
  const path = newtonPath(x0, y0);
  const end = path[path.length - 1];
  const near = ROOTS.reduce((b, r) => (Math.hypot(r[0] - end[0], r[1] - end[1]) < Math.hypot(b[0] - end[0], b[1] - end[1]) ? r : b));
  const errs = path.map((p) => Math.hypot(p[0] - near[0], p[1] - near[1]));
  const alt = alternatePath(x0, y0);
  const altErrs = alt.map((p) => Math.min(...ROOTS.map((r) => Math.hypot(p[0] - r[0], p[1] - r[1]))));
  const conv = errs[errs.length - 1] < 1e-9;
  const steps = errs.findIndex((e) => e < 1e-9);
  return { path, end, root: near, errs, alt, altErrs, conv, steps, gap: conv ? errs[errs.length - 1] / 2 : 0 };
}
