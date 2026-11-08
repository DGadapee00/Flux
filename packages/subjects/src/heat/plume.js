/**
 * A heated vertical plate in still air (EML 4140, natural convection).
 *
 * Air warmed by the plate is lighter and rises. The laminar layer has a similarity solution: with
 * η = (y/x)(Gr_x/4)^{1/4} and u = (2ν/x)Gr_x^{1/2} f′(η),
 *   f‴ + 3ff″ − 2f′² + θ = 0,   θ″ + 3Pr fθ′ = 0,
 *   f(0) = f′(0) = 0, θ(0) = 1, f′(∞) = θ(∞) = 0.
 * The average Nusselt number over a plate of height L is Nu_L = (4/3)(Gr_L/4)^{1/4} g(Pr), and a
 * fitted curve gives g(Pr) = 0.75 Pr^{1/2}/(0.609 + 1.221Pr^{1/2} + 1.238Pr)^{1/4}. Since
 * Gr ∝ ΔT, h grows as ΔT^{1/4}: a hotter plate drives a faster flow.
 *
 * The second method solves the similarity equations by shooting, with Runge–Kutta and Newton, and
 * takes g = −θ′(0) from it.
 */

export const AIR = { nu: 1.6e-5, k: 0.026, Pr: 0.71, g: 9.81, Tinf: 20 };
export const PLATE = { L: 0.3 };

export const gFit = (Pr) => (0.75 * Math.sqrt(Pr)) / (0.609 + 1.221 * Math.sqrt(Pr) + 1.238 * Pr) ** 0.25;

function integrate(a, b, Pr, etaMax = 10, n = 2000, keep = false) {
  // y = [f, f′, f″, θ, θ′]
  const F = (y) => [y[1], y[2], -3 * y[0] * y[2] + 2 * y[1] * y[1] - y[3], y[4], -3 * Pr * y[0] * y[4]];
  let y = [0, 0, a, 1, b];
  const h = etaMax / n;
  const out = keep ? [[0, ...y]] : null;
  for (let i = 0; i < n; i++) {
    const k1 = F(y);
    const k2 = F(y.map((v, j) => v + (h / 2) * k1[j]));
    const k3 = F(y.map((v, j) => v + (h / 2) * k2[j]));
    const k4 = F(y.map((v, j) => v + h * k3[j]));
    y = y.map((v, j) => v + (h / 6) * (k1[j] + 2 * k2[j] + 2 * k3[j] + k4[j]));
    if (keep && (i + 1) % 10 === 0) out.push([(i + 1) * h, ...y]);
  }
  return keep ? out : y;
}

const cache = new Map();
/** Shoot on f″(0) and θ′(0) so that f′ and θ vanish far out. */
export function similarity(Pr = AIR.Pr) {
  if (cache.has(Pr)) return cache.get(Pr);
  let a = 0.68;
  let b = -gFit(Pr);
  let etaMax = 10;
  for (let it = 0; it < 40; it++) {
    const r = (A, Bv) => {
      const y = integrate(A, Bv, Pr, etaMax);
      return [y[1], y[3]];
    };
    const r0 = r(a, b);
    if (Math.hypot(...r0) < 1e-11) break;
    const e = 1e-7;
    const ra = r(a + e, b);
    const rb = r(a, b + e);
    const J = [[(ra[0] - r0[0]) / e, (rb[0] - r0[0]) / e], [(ra[1] - r0[1]) / e, (rb[1] - r0[1]) / e]];
    const det = J[0][0] * J[1][1] - J[0][1] * J[1][0];
    const da = (r0[0] * J[1][1] - r0[1] * J[0][1]) / det;
    const db = (J[0][0] * r0[1] - J[1][0] * r0[0]) / det;
    a -= da;
    b -= db;
  }
  const res = { fpp: a, g: -b, profile: integrate(a, b, Pr, etaMax, 2000, true) };
  cache.set(Pr, res);
  return res;
}

export function plateClosed({ Ts }) {
  const { nu, k, Pr, g, Tinf } = AIR;
  const { L } = PLATE;
  const dT = Ts - Tinf;
  const beta = 1 / ((Ts + Tinf) / 2 + 273.15);
  const alphaT = nu / Pr;
  const Gr = (g * beta * dT * L ** 3) / nu ** 2;
  const Ra = Gr * Pr;
  const Nu = (4 / 3) * (Gr / 4) ** 0.25 * gFit(Pr);
  const h = (Nu * k) / L;
  return { dT, beta, Gr, Ra, Nu, h, q: h * dT, Nu059: 0.59 * Ra ** 0.25, alphaT };
}

export function plateChecked(state) {
  const cf = plateClosed(state);
  const sim = similarity();
  const NuNum = (4 / 3) * (cf.Gr / 4) ** 0.25 * sim.g;
  const { nu, g } = AIR;
  const x = PLATE.L / 2;
  const Grx = (g * cf.beta * cf.dT * x ** 3) / nu ** 2;
  // At mid-height: y in mm, upward speed in m/s, temperature in °C.
  const across = sim.profile.map(([eta, , fp, , th]) => [((eta * x) / (Grx / 4) ** 0.25) * 1000, ((2 * nu) / x) * Math.sqrt(Grx) * fp, AIR.Tinf + cf.dT * th]);
  const umax = Math.max(...across.map((p) => p[1]));
  return { ...cf, NuNum, gap: Math.abs(NuNum - cf.Nu) / NuNum, across, umax, gSim: sim.g };
}
