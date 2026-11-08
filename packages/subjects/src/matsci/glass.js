/**
 * How fast a window pane flows (EMA 3010, ceramics and glasses).
 *
 * A glass's viscosity climbs steeply as it cools, η = η₀ exp(Q/RT). Fitting that line through two
 * standard points of soda-lime glass, the annealing point (10¹² Pa·s at 546 °C, about where it stops
 * flowing on a human timescale: the glass transition) and the softening point (10^6.6 Pa·s at 726 °C),
 * gives Q ≈ 470 kJ/mol.
 *
 * A vertical pane of height H carries its own weight: at depth z the stress is ρgz, and the glass
 * shortens at a rate ρgz/3η per unit length (3η is the viscosity in tension). Over the whole pane the
 * top drops at ρgH²/6η, so it takes t = 6ηΔ/(ρgH²) to sink by Δ. At room temperature that is longer
 * than the age of the universe: old panes are thicker at the bottom because of how they were made.
 * Below the glass transition the Arrhenius line is an extrapolation, and the true viscosity is
 * uncertain by many orders of magnitude; every estimate gives no visible flow.
 *
 * The second method sums the shortening of 400 slices of the pane, each under the weight above it,
 * by Simpson's rule.
 */

export const SODA = { Ta: 546, etaA: 1e12, Ts: 726, etaS: 10 ** 6.6, rho: 2500, g: 9.81, H: 1, drop: 1e-4 };
export const R = 8.314;
const K = (c) => c + 273.15;
export const Qover = Math.log(SODA.etaA / SODA.etaS) / (1 / K(SODA.Ta) - 1 / K(SODA.Ts));
export const Q = Qover * R;

export const log10eta = (TC) => Math.log10(SODA.etaA) + (Qover * (1 / K(TC) - 1 / K(SODA.Ta))) / Math.LN10;

export function paneClosed({ TC }) {
  const le = log10eta(TC);
  const { rho, g, H, drop } = SODA;
  // log10 of the time in seconds, to keep huge numbers finite.
  const lt = Math.log10(6 * drop / (rho * g * H * H)) + le;
  return { le, lt, ly: lt - Math.log10(3.156e7), Q };
}

export function paneNumeric({ TC }, n = 400) {
  const { rho, g, H, drop } = SODA;
  const le = log10eta(TC);
  // Shortening rate × η: ∫₀^H ρgz/3 dz, by Simpson. Then t = Δ/rate.
  const h = H / n;
  const f = (z) => (rho * g * z) / 3;
  let s = f(0) + f(H);
  for (let i = 1; i < n; i++) s += f(i * h) * (i % 2 ? 4 : 2);
  const rateEta = (s * h) / 3;
  return Math.log10(drop / rateEta) + le;
}

export function paneChecked(state) {
  const cf = paneClosed(state);
  const ltNum = paneNumeric(state);
  return { ...cf, ltNum, gap: Math.abs(ltNum - cf.lt) / Math.max(1, Math.abs(cf.lt)) };
}
