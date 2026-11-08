/**
 * Creep of a nickel superalloy under constant load (EMA 3010).
 *
 * Hot enough, a metal strains steadily under a stress far below its yield strength, because
 * dislocations climb past obstacles with the help of diffusion. The steady rate is
 *   ε̇_s = Aσⁿ exp(−Q_c/RT),
 * with n = 5 and Q_c = 300 kJ/mol here (model values for a nickel superalloy). Strain against time:
 *   ε(t) = σ/E + ε_p(1 − e^{−t/τ}) + ε̇_s t,
 * an elastic part, a primary part that fades, and the steady part. The part is retired when the
 * strain reaches 2%. Since ε̇_s carries exp(−Q/RT), 100 K can change the life a hundredfold.
 *
 * The life solves ε(t) = 2% by Newton's method. The second method marches dε/dt by fourth-order
 * Runge–Kutta in the logarithm of time and finds when it crosses 2%.
 */

export const ALLOY = { A: 2.82e-6, n: 5, Q: 300e3, R: 8.314, E: 150e3, ep: 0.002, tau: 20 * 3600, limit: 0.02, sy: 900 };

export function creepClosed({ TC, sigma }) {
  const { A, n, Q, R, E, ep, tau, limit } = ALLOY;
  const T = TC + 273.15;
  const rate = A * sigma ** n * Math.exp(-Q / (R * T));
  const eps = (t) => sigma / E + ep * (1 - Math.exp(-t / tau)) + rate * t;
  let t = Math.max(1, (limit - sigma / E - ep) / rate);
  for (let i = 0; i < 100; i++) {
    const f = eps(t) - limit;
    const d = (ep / tau) * Math.exp(-t / tau) + rate;
    const step = f / d;
    t -= step;
    if (Math.abs(step) < 1e-12 * t) break;
  }
  return { T, rate, eps, life: t, lifeH: t / 3600, elastic: sigma / E };
}

export function creepNumeric({ TC, sigma }) {
  const { ep, tau, limit, E } = ALLOY;
  const { rate } = creepClosed({ TC, sigma });
  // In s = ln t: dε/ds = t (ε̇_s + (ε_p/τ) e^{−t/τ}).
  const g = (s) => {
    const t = Math.exp(s);
    return t * (rate + (ep / tau) * Math.exp(-t / tau));
  };
  let s = Math.log(1e-3);
  let e = sigma / E + ep * (1 - Math.exp(-1e-3 / tau)) + rate * 1e-3;
  const h = 0.001;
  for (let i = 0; i < 200000; i++) {
    const k1 = g(s);
    const k2 = g(s + h / 2);
    const k4 = g(s + h);
    const next = e + (h / 6) * (k1 + 4 * k2 + k4);
    if (next >= limit) {
      // Cubic Hermite in s between the two ends, solved by bisection.
      const p0 = e;
      const p1 = next;
      const m0 = k1 * h;
      const m1 = k4 * h;
      const H = (u) => (2 * u ** 3 - 3 * u * u + 1) * p0 + (u ** 3 - 2 * u * u + u) * m0 + (-2 * u ** 3 + 3 * u * u) * p1 + (u ** 3 - u * u) * m1;
      let lo = 0;
      let hi = 1;
      for (let j = 0; j < 80; j++) {
        const mid = (lo + hi) / 2;
        if (H(mid) < limit) lo = mid;
        else hi = mid;
      }
      return Math.exp(s + h * (lo + hi) / 2);
    }
    e = next;
    s += h;
  }
  return NaN;
}

export function creepChecked(state) {
  const cf = creepClosed(state);
  const lifeNum = creepNumeric(state);
  return { ...cf, lifeNum, gap: Math.abs(lifeNum - cf.life) / cf.life };
}
