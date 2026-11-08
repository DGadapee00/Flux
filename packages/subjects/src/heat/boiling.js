/**
 * Water at 1 atm, boiling on a hot wall or condensing on a cold one (EML 4140, phase change).
 *
 * Boiling: the curve of heat flux against excess temperature ΔT_e = T_s − T_sat. Nucleate boiling
 * (Rohsenow, Csf = 0.013, n = 1) climbs as ΔT_e³ to the critical flux (Zuber with 0.149),
 *   q″_max = 0.149 h_fg ρ_v [σg(ρ_l − ρ_v)/ρ_v²]^{1/4};
 * past it a vapour film starts to cover the wall and the flux falls, through transition boiling, to
 * the Leidenfrost minimum (Zuber, 0.09). Film boiling then rises slowly: heat must cross the vapour.
 * On a vertical wall of height L the film is a Nusselt layer of vapour,
 *   h̄ = 0.943 [k_v³ ρ_v(ρ_l − ρ_v) g h′_fg / (μ_v ΔT_e L)]^{1/4},  h′_fg = h_fg + 0.8 c_p,v ΔT_e.
 * Condensation on a cold vertical wall is the same layer, of liquid:
 *   h̄ = 0.943 [k_l³ ρ_l(ρ_l − ρ_v) g h′_fg / (μ_l ΔT L)]^{1/4},   h′_fg = h_fg + 0.68 c_p,l ΔT.
 *
 * The second method builds the film itself: the mass it gains from x to x + dx is the heat that
 * crosses it over h′_fg, which gives dδ⁴/dx; it integrates δ(x) with Runge–Kutta and averages k/δ by
 * Simpson's rule over the wall.
 */

export const SAT = { T: 100, hfg: 2.257e6, sigma: 0.0589, rl: 957.9, rv: 0.596, g: 9.81 };
export const LIQ = { k: 0.68, mu: 2.79e-4, cp: 4217, Pr: 1.76 };
/** Vapour near 500 °C for film boiling. */
export const VAP = { k: 0.058, mu: 2.9e-5, cp: 2080, rho: 0.31 };
export const WALL = { L: 0.1 };

const Csf = 0.013;

export function nucleate(dT) {
  const { hfg, sigma, rl, rv, g } = SAT;
  const { mu, cp, Pr } = LIQ;
  return mu * hfg * Math.sqrt((g * (rl - rv)) / sigma) * ((cp * dT) / (Csf * hfg * Pr)) ** 3;
}
export function chf() {
  const { hfg, sigma, rl, rv, g } = SAT;
  return 0.149 * hfg * rv * ((sigma * g * (rl - rv)) / rv ** 2) ** 0.25;
}
export function qmin() {
  const { hfg, sigma, rl, rv, g } = SAT;
  return 0.09 * rv * hfg * ((sigma * g * (rl - rv)) / (rl + rv) ** 2) ** 0.25;
}
const filmCoeff = ({ k, mu, rho, drho, h, dT, L }) => 0.943 * ((k ** 3 * rho * drho * SAT.g * h) / (mu * dT * L)) ** 0.25;
export function filmBoiling(dT, L = WALL.L) {
  const h = filmCoeff({ k: VAP.k, mu: VAP.mu, rho: VAP.rho, drho: SAT.rl - VAP.rho, h: SAT.hfg + 0.8 * VAP.cp * dT, dT, L });
  return { h, q: h * dT };
}
export function condensing(dT, L = WALL.L) {
  const h = filmCoeff({ k: LIQ.k, mu: LIQ.mu, rho: SAT.rl, drho: SAT.rl - SAT.rv, h: SAT.hfg + 0.68 * LIQ.cp * dT, dT, L });
  return { h, q: h * dT };
}

/** ΔT_e at the critical flux and at the Leidenfrost point. */
export function landmarks() {
  const qc = chf();
  const { hfg } = SAT;
  const { cp, Pr } = LIQ;
  const dTc = ((qc / (LIQ.mu * hfg * Math.sqrt((SAT.g * (SAT.rl - SAT.rv)) / SAT.sigma))) ** (1 / 3) * Csf * hfg * Pr) / cp;
  const qm = qmin();
  let lo = 30;
  let hi = 2000;
  for (let i = 0; i < 200; i++) {
    const mid = Math.sqrt(lo * hi);
    if (filmBoiling(mid).q < qm) lo = mid;
    else hi = mid;
  }
  return { qc, dTc, qm, dTl: Math.sqrt(lo * hi) };
}

/** The boiling curve at excess temperature dT (K), from 5 K, where nucleate boiling has begun. */
export function boilCurve(dT) {
  const L = landmarks();
  if (dT <= L.dTc) return { q: nucleate(dT), regime: 'nucleate' };
  if (dT >= L.dTl) return { q: filmBoiling(dT).q, regime: 'film' };
  const f = Math.log(dT / L.dTc) / Math.log(L.dTl / L.dTc);
  return { q: Math.exp(Math.log(L.qc) + f * (Math.log(L.qm) - Math.log(L.qc))), regime: 'transition' };
}

/** Grow the film along the wall: d(δ⁴)/dx = 4kμΔT/(gρ(ρ_l − ρ_v)h′). Average k/δ by Simpson. */
export function filmNumeric({ k, mu, rho, drho, hp, dT, L }, n = 4000) {
  const c = (4 * k * mu * dT) / (SAT.g * rho * drho * hp);
  // Integrate dδ/dx = c/(4δ³) in s = δ⁴ to start cleanly from δ(0) = 0, then RK4 on δ past x₀.
  const x0 = L / n;
  let d = (c * x0) ** 0.25;
  const f = (dd) => c / (4 * dd ** 3);
  const xs = [0];
  const inv = [0];
  const dx = (L - x0) / n;
  let x = x0;
  // The 1/δ singularity at x = 0 integrates to (4/3)(c x₀)^{3/4}/c; add it by hand.
  const head = ((4 / 3) * (c * x0) ** 0.75) / c;
  xs[0] = x;
  inv[0] = 1 / d;
  for (let i = 0; i < n; i++) {
    const k1 = f(d);
    const k2 = f(d + (dx * k1) / 2);
    const k3 = f(d + (dx * k2) / 2);
    const k4 = f(d + dx * k3);
    d += (dx * (k1 + 2 * k2 + 2 * k3 + k4)) / 6;
    x += dx;
    xs.push(x);
    inv.push(1 / d);
  }
  let s = inv[0] + inv[n];
  for (let i = 1; i < n; i++) s += inv[i] * (i % 2 ? 4 : 2);
  const integral = head + (s * dx) / 3;
  return { h: (k * integral) / L, delta: d };
}

export function boilChecked({ side, dT }) {
  const L = WALL.L;
  if (side === 'condense') {
    const cf = condensing(dT);
    const nu = filmNumeric({ k: LIQ.k, mu: LIQ.mu, rho: SAT.rl, drho: SAT.rl - SAT.rv, hp: SAT.hfg + 0.68 * LIQ.cp * dT, dT, L });
    return { side, dT, h: cf.h, q: cf.q, hNum: nu.h, delta: nu.delta, gap: Math.abs(nu.h - cf.h) / cf.h, ...landmarks(), regime: 'film condensation' };
  }
  const bc = boilCurve(dT);
  const fb = filmBoiling(dT);
  const nu = filmNumeric({ k: VAP.k, mu: VAP.mu, rho: VAP.rho, drho: SAT.rl - VAP.rho, hp: SAT.hfg + 0.8 * VAP.cp * dT, dT, L });
  return { side, dT, h: bc.q / dT, q: bc.q, regime: bc.regime, filmQ: fb.q, hNum: nu.h, delta: nu.delta, gap: Math.abs(nu.h - fb.h) / fb.h, ...landmarks() };
}
