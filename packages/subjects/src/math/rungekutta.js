/**
 * Euler, the midpoint method and classical RK4 on one equation, each given the same budget of slope
 * evaluations (EGN 3203, Runge–Kutta methods).
 *
 * Euler uses one slope per step and its error falls as h; the midpoint method uses two per step and
 * falls as h²; RK4 uses four and falls as h⁴. With N evaluations to spend over [0, T], Euler takes N
 * steps, the midpoint N/2 and RK4 N/4. So RK4's steps are four times as long, yet its error is far
 * smaller once N is more than a handful: many cheap steps lose to a few good ones.
 *
 * The equations have exact solutions, against which each method's error at T is measured:
 *   forced:  y′ = −y + sin 3t,  y(0) = 1,  y = 1.3 e^{−t} + (sin 3t − 3 cos 3t)/10;
 *   growth:  y′ = y cos t,      y(0) = 1,  y = e^{sin t}.
 * The second method checks each exact solution against RK4 with 20 000 steps.
 */

export const EQUATIONS = {
  forced: {
    name: 'y′ = −y + sin 3t, a decay pushed by a sine',
    f: (t, y) => -y + Math.sin(3 * t),
    exact: (t) => 1.3 * Math.exp(-t) + (Math.sin(3 * t) - 3 * Math.cos(3 * t)) / 10,
    y0: 1,
  },
  growth: {
    name: 'y′ = y cos t, growth that rises and falls',
    f: (t, y) => y * Math.cos(t),
    exact: (t) => Math.exp(Math.sin(t)),
    y0: 1,
  },
};

const STEP = {
  euler: (f, t, y, h) => y + h * f(t, y),
  midpoint: (f, t, y, h) => y + h * f(t + h / 2, y + (h / 2) * f(t, y)),
  rk4: (f, t, y, h) => {
    const k1 = f(t, y);
    const k2 = f(t + h / 2, y + (h / 2) * k1);
    const k3 = f(t + h / 2, y + (h / 2) * k2);
    const k4 = f(t + h, y + h * k3);
    return y + (h / 6) * (k1 + 2 * k2 + 2 * k3 + k4);
  },
};
export const COST = { euler: 1, midpoint: 2, rk4: 4 };
export const ORDER = { euler: 1, midpoint: 2, rk4: 4 };

/** One method with a budget of `evals` slope evaluations over [0, T]: its points and its error at T. */
export function run(eq, method, evals, T) {
  const n = Math.max(1, Math.floor(evals / COST[method]));
  const h = T / n;
  const pts = [[0, eq.y0]];
  let y = eq.y0;
  for (let k = 0; k < n; k++) {
    y = STEP[method](eq.f, k * h, y, h);
    pts.push([(k + 1) * h, y]);
  }
  return { n, h, pts, yT: y, error: Math.abs(y - eq.exact(T)) };
}

export function compare({ eq: id, evals, T }) {
  const eq = EQUATIONS[id];
  const out = {};
  for (const m of ['euler', 'midpoint', 'rk4']) out[m] = run(eq, m, evals, T);
  // The exact solution against a very fine RK4 run.
  const ref = run(eq, 'rk4', 80000, T).yT;
  const gap = Math.abs(ref - eq.exact(T)) / Math.max(Math.abs(eq.exact(T)), 1e-12);
  // Each method's error curve against the budget, for the log-log plot.
  const budgets = [4, 8, 16, 32, 64, 128, 256, 512, 1024];
  const curves = Object.fromEntries(['euler', 'midpoint', 'rk4'].map((m) => [m, budgets.map((b) => [b, Math.max(run(eq, m, b, T).error, 1e-16)])]));
  return { ...out, exactT: eq.exact(T), ref, gap, curves, budgets, ratio: out.euler.error / Math.max(out.rk4.error, 1e-300) };
}
