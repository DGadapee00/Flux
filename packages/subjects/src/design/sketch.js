/**
 * Design intent in a parametric sketch: a plate W wide and H tall with two bolt holes that must match
 * a sensor's bolt spacing S. Our own construction.
 *
 * The holes' centres (x₁, y₁, x₂, y₂) are the sketch's four unknowns. Each scheme is a different set
 * of dimensions and relations on them, the way a CAD user might have drawn the same part:
 *   intent:  symmetric about the plate's centre line, spaced S, level, at mid-height
 *   chained: first hole 20 from the left edge, second 40 from the first (a typed number), level
 *   by eye:  each hole dimensioned from the left edge, 20 and 60 (typed numbers)
 *   loose:   spaced S and level at mid-height, but nothing fixes where along the plate
 * The closed form writes each scheme's answer down. The second method is what a CAD solver does:
 * Newton's method on the constraint equations from a rough start, with the degrees of freedom left
 * as four minus the rank of the constraint Jacobian.
 */
import { rankByElimination } from './joints.js';

/** Constraint equations f(v) = 0 for a scheme, v = [x1, y1, x2, y2]. */
export function sketchEquations(scheme, { W, H, S }) {
  const mid = H / 2;
  switch (scheme) {
    case 'intent':
      return [(v) => v[0] + v[2] - W, (v) => v[2] - v[0] - S, (v) => v[1] - v[3], (v) => v[1] - mid];
    case 'chained':
      return [(v) => v[0] - 20, (v) => v[2] - v[0] - 40, (v) => v[1] - v[3], (v) => v[1] - mid];
    case 'eye':
      return [(v) => v[0] - 20, (v) => v[2] - 60, (v) => v[1] - mid, (v) => v[3] - mid];
    default:
      return [(v) => v[2] - v[0] - S, (v) => v[1] - v[3], (v) => v[1] - mid];
  }
}

/** Where each scheme puts the holes, written down. Null x for the loose scheme: it is not fixed. */
export function sketchClosed(scheme, { W, H, S }) {
  const y = H / 2;
  if (scheme === 'intent') return { x1: (W - S) / 2, x2: (W + S) / 2, y, dof: 0 };
  if (scheme === 'chained') return { x1: 20, x2: 60, y, dof: 0 };
  if (scheme === 'eye') return { x1: 20, x2: 60, y, dof: 0 };
  return { x1: null, x2: null, y, dof: 1 };
}

const jacobian = (eqs, v, h = 1e-6) => eqs.map((f) => v.map((_, j) => {
  const a = [...v];
  const b = [...v];
  a[j] += h;
  b[j] -= h;
  return (f(a) - f(b)) / (2 * h);
}));

/**
 * The solver's way: least-norm Newton steps from `start` until the equations hold. Returns the hole
 * positions, the remaining residual and the sketch's free degrees of freedom.
 */
export function sketchSolve(scheme, dims, start = [12, dims.H * 0.3, 70, dims.H * 0.7]) {
  const eqs = sketchEquations(scheme, dims);
  let v = [...start];
  for (let it = 0; it < 50; it++) {
    const f = eqs.map((g) => g(v));
    if (Math.max(...f.map(Math.abs)) < 1e-12) break;
    const J = jacobian(eqs, v);
    // Least-norm step: dv = −Jᵀ (J Jᵀ)⁻¹ f, solved by Gaussian elimination on J Jᵀ.
    const m = J.length;
    const A = J.map((r) => J.map((s) => r.reduce((acc, x, k) => acc + x * s[k], 0)));
    const y = solve(A, f.map((x) => -x));
    v = v.map((x, k) => x + J.reduce((acc, r, i) => acc + r[k] * y[i], 0));
    if (m === 0) break;
  }
  const residual = Math.max(0, ...eqs.map((g) => Math.abs(g(v))));
  const dof = 4 - rankByElimination(jacobian(eqs, v));
  return { x1: v[0], y1: v[1], x2: v[2], y2: v[3], residual, dof };
}

function solve(A, b) {
  const n = b.length;
  const M = A.map((r, i) => [...r, b[i]]);
  for (let c = 0; c < n; c++) {
    let p = c;
    for (let i = c + 1; i < n; i++) if (Math.abs(M[i][c]) > Math.abs(M[p][c])) p = i;
    [M[c], M[p]] = [M[p], M[c]];
    for (let i = c + 1; i < n; i++) {
      const f = M[i][c] / M[c][c];
      for (let j = c; j <= n; j++) M[i][j] -= f * M[c][j];
    }
  }
  const x = new Array(n).fill(0);
  for (let i = n - 1; i >= 0; i--) {
    let s = M[i][n];
    for (let j = i + 1; j < n; j++) s -= M[i][j] * x[j];
    x[i] = s / M[i][i];
  }
  return x;
}
