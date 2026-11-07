/**
 * Root finding: bisection and Newton's method on a cubic (EGN 3203, Numbers on a computer).
 *
 * Bisection keeps a bracket [a, b] with f(a) and f(b) of opposite sign and halves it each step: it
 * always converges, one binary digit a step. Newton's method follows the tangent,
 *   x_{k+1} = x_k − f(x_k)/f′(x_k),
 * and near a simple root doubles the correct digits each step. But it is not tied to the nearest root:
 * from some starts it jumps to a far one, and on x³ − 2x + 2 from 0 it cycles 0 → 1 → 0 for ever.
 *
 * The cubics here are x³ + px + q, whose real roots come in closed form: three by the trigonometric
 * formula when 4p³ + 27q² < 0, else one by Cardano's. That is the second method for whatever root
 * either iteration finds.
 */
export const CUBICS = {
  cycle: { name: 'x³ − 2x + 2', p: -2, q: 2 },
  three: { name: 'x³ − x', p: -1, q: 0 },
  shifted: { name: 'x³ − 3x + 1', p: -3, q: 1 },
};

export const f = ({ p, q }, x) => x * x * x + p * x + q;
export const df = ({ p }, x) => 3 * x * x + p;

/** The real roots of x³ + px + q, in closed form, sorted. */
export function cubicRoots({ p, q }) {
  const disc = 4 * p * p * p + 27 * q * q;
  if (disc < 0) {
    const m = 2 * Math.sqrt(-p / 3);
    const th = Math.acos(((3 * q) / (p * m)) * 1) / 3;
    return [0, 1, 2].map((k) => m * Math.cos(th - (2 * Math.PI * k) / 3)).sort((a, b) => a - b);
  }
  const s = Math.sqrt(q * q / 4 + (p * p * p) / 27);
  return [Math.cbrt(-q / 2 + s) + Math.cbrt(-q / 2 - s)];
}

/** Newton from x0: the iterates, and whether they settled. */
export function newton(c, x0, steps = 40) {
  const xs = [x0];
  let x = x0;
  for (let k = 0; k < steps; k++) {
    const d = df(c, x);
    if (d === 0) break;
    const nx = x - f(c, x) / d;
    xs.push(nx);
    if (!Number.isFinite(nx) || Math.abs(nx) > 1e6) break;
    if (Math.abs(nx - x) < 1e-15 * Math.max(1, Math.abs(nx))) {
      x = nx;
      break;
    }
    x = nx;
  }
  const last = xs[xs.length - 1];
  const converged = Number.isFinite(last) && Math.abs(f(c, last)) < 1e-12;
  return { xs, root: converged ? last : null, converged };
}

/** Bisection on [a, b]: the brackets, or null when f does not change sign. */
export function bisection(c, a, b, tol = 1e-12) {
  let [lo, hi] = a < b ? [a, b] : [b, a];
  let flo = f(c, lo);
  if (flo * f(c, hi) > 0) return { brackets: [], root: null, valid: false };
  const brackets = [[lo, hi]];
  while (hi - lo > tol && brackets.length < 80) {
    const mid = (lo + hi) / 2;
    const fm = f(c, mid);
    if (fm === 0) {
      lo = hi = mid;
    } else if (flo * fm < 0) hi = mid;
    else {
      lo = mid;
      flo = fm;
    }
    brackets.push([lo, hi]);
  }
  return { brackets, root: (lo + hi) / 2, valid: true };
}

const nearest = (roots, x) => roots.reduce((best, r) => (Math.abs(r - x) < Math.abs(best - x) ? r : best), roots[0]);

/** Both iterations, their errors step by step, and the gap to the exact roots. */
export function findRoots({ fn, x0, a, b }) {
  const c = CUBICS[fn];
  const exact = cubicRoots(c);
  const nw = newton(c, x0);
  const bs = bisection(c, a, b);
  const nwRoot = nw.converged ? nearest(exact, nw.root) : null;
  const bsRoot = bs.valid ? nearest(exact, bs.root) : null;
  const gaps = [];
  if (nw.converged) gaps.push(Math.abs(nw.root - nwRoot));
  if (bs.valid) gaps.push(Math.abs(bs.root - bsRoot) - 1e-12 > 0 ? Math.abs(bs.root - bsRoot) : 0);
  const nearestToStart = nearest(exact, x0);
  const nwErr = nw.xs.map((x) => Math.abs(x - (nwRoot ?? nearestToStart)));
  const bsErr = bs.brackets.map(([lo, hi]) => Math.abs((lo + hi) / 2 - bsRoot));
  const stepsTo = (errs, tol) => {
    const k = errs.findIndex((e) => e < tol);
    return k < 0 ? null : k;
  };
  return {
    exact, newton: nw, bisect: bs, nwRoot, bsRoot, nearestToStart,
    jumped: nw.converged && Math.abs(nwRoot - nearestToStart) > 1e-9,
    nwErr, bsErr, nwSteps: stepsTo(nwErr, 1e-10), bsSteps: bs.valid ? stepsTo(bsErr, 1e-10) : null,
    gap: gaps.length ? Math.max(...gaps) : 0,
  };
}
