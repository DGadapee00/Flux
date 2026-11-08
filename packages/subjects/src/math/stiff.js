/**
 * A stiff system: explicit against implicit Euler (EGN 3203).
 *
 * y′ = Ay with A = Q diag(−1, −1000) Qᵀ, Q a rotation by 30°: two modes, one decaying over a second,
 * one over a millisecond. Explicit Euler multiplies each mode by (1 + hλ) per step, implicit Euler by
 * 1/(1 − hλ). For the fast mode, |1 + h(−1000)| ≤ 1 needs h ≤ 0.002: any longer explicit step grows
 * that mode without bound, though it died out within milliseconds and is invisible in the answer.
 * Implicit Euler damps every mode for every h.
 *
 * The closed form writes y_n = Q diag(g₁ⁿ, g₂ⁿ) Qᵀ y₀ from the per-mode factors. The second method
 * marches the coupled system step by step: y ← y + hAy, or solves (I − hA)y_{n+1} = y_n each step.
 */

export const LAMBDA = [-1, -1000];
const th = Math.PI / 6;
export const Q = [[Math.cos(th), -Math.sin(th)], [Math.sin(th), Math.cos(th)]];
export const A = (() => {
  const [l1, l2] = LAMBDA;
  const q = Q;
  const M = [[0, 0], [0, 0]];
  for (let i = 0; i < 2; i++) for (let j = 0; j < 2; j++) M[i][j] = q[i][0] * l1 * q[j][0] + q[i][1] * l2 * q[j][1];
  return M;
})();
export const Y0 = [1, 0];
export const T_END = 0.5;

const toModes = (y) => [Q[0][0] * y[0] + Q[1][0] * y[1], Q[0][1] * y[0] + Q[1][1] * y[1]];
const fromModes = (m) => [Q[0][0] * m[0] + Q[0][1] * m[1], Q[1][0] * m[0] + Q[1][1] * m[1]];

export const factor = (method, h, l) => (method === 'implicit' ? 1 / (1 - h * l) : 1 + h * l);

export function stiffClosed({ method, lh }) {
  const h = 10 ** lh;
  const n = Math.round(T_END / h);
  const m0 = toModes(Y0);
  const g = LAMBDA.map((l) => factor(method, h, l));
  const at = (k) => fromModes([m0[0] * g[0] ** k, m0[1] * g[1] ** k]);
  const exact = (t) => fromModes([m0[0] * Math.exp(LAMBDA[0] * t), m0[1] * Math.exp(LAMBDA[1] * t)]);
  return { h, n, g, at, exact, stable: g.every((x) => Math.abs(x) <= 1), hLimit: 2 / 1000 };
}

export function stiffNumeric({ method, lh }) {
  const h = 10 ** lh;
  const n = Math.round(T_END / h);
  let y = Y0.slice();
  const I = [[1 - h * A[0][0], -h * A[0][1]], [-h * A[1][0], 1 - h * A[1][1]]];
  const det = I[0][0] * I[1][1] - I[0][1] * I[1][0];
  for (let k = 0; k < n; k++) {
    if (method === 'implicit') {
      y = [(I[1][1] * y[0] - I[0][1] * y[1]) / det, (-I[1][0] * y[0] + I[0][0] * y[1]) / det];
    } else {
      y = [y[0] + h * (A[0][0] * y[0] + A[0][1] * y[1]), y[1] + h * (A[1][0] * y[0] + A[1][1] * y[1])];
    }
  }
  return y;
}

export function stiffChecked(state) {
  const cf = stiffClosed(state);
  const yn = stiffNumeric(state);
  const yc = cf.at(cf.n);
  const scale = Math.max(1e-30, Math.hypot(...yc));
  const end = cf.exact(cf.n * cf.h);
  return { ...cf, yEnd: yc, yNum: yn, err: Math.hypot(yc[0] - end[0], yc[1] - end[1]), size: Math.hypot(...yc), gap: Math.hypot(yn[0] - yc[0], yn[1] - yc[1]) / scale };
}
