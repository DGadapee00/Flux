/**
 * Thermal radiation from black bodies and real surfaces (EML 4140 unit 2).
 *
 * Planck's law gives a black body's spectral emissive power,
 *   E_bλ = C₁ / (λ⁵ [exp(C₂/λT) − 1]),  C₁ = 3.741771 × 10⁸ W·µm⁴/m²,  C₂ = 1.438777 × 10⁴ µm·K.
 * Closed forms: the total E_b = σT⁴, the peak at λ_max T = 2897.8 µm·K, and the fraction emitted
 * below λ, F(λT) = (15/π⁴) Σₙ e^{−nx}(x³ + 3x²/n + 6x/n² + 6/n³)/n with x = C₂/λT.
 *
 * A real surface emits ε_λ E_bλ. Surfaces here are two-band models: one emissivity below a cutoff
 * wavelength (where sunlight is) and another above it (where room-temperature surfaces glow). Its
 * solar absorptivity α weighs ε_λ by a 5778 K black body; its emissivity ε weighs it by its own
 * temperature. A plate facing the Sun, insulated behind, settles where α S = ε σT⁴.
 *
 * Second routes: Simpson's rule on Planck's law for the total and the band fractions, and a
 * golden-section search for the peak.
 */
export const C1 = 3.741771e8;
export const C2 = 1.438777e4;
export const SIGMA = 5.670374e-8;
export const WIEN = 2897.77;
export const T_SUN = 5778;
export const SOLAR = 1361; // W/m² at Earth's distance

/** Spectral emissive power in W/(m²·µm), λ in µm. */
export const planck = (lambda, T) => C1 / (lambda ** 5 * Math.expm1(C2 / (lambda * T)));

/** Fraction of black-body emission below λ (µm) at T, by its series. */
export function bandFraction(lambda, T) {
  const x = C2 / (lambda * T);
  let s = 0;
  for (let n = 1; n <= 200; n++) {
    const term = (Math.exp(-n * x) / n) * (x ** 3 + (3 * x * x) / n + (6 * x) / n ** 2 + 6 / n ** 3);
    s += term;
    if (term < 1e-17 * s) break;
  }
  return (15 / Math.PI ** 4) * s;
}

/** ∫ E_bλ dλ from λ1 to λ2 (µm) by Simpson's rule in ln λ. */
export function planckIntegral(T, l1 = 0.01, l2 = 1e4, n = 4000) {
  const a = Math.log(l1);
  const b = Math.log(l2);
  const h = (b - a) / n;
  const g = (u) => planck(Math.exp(u), T) * Math.exp(u);
  let s = g(a) + g(b);
  for (let i = 1; i < n; i++) s += (i % 2 ? 4 : 2) * g(a + i * h);
  return (s * h) / 3;
}

/** The wavelength of peak emission at T, by golden-section search. */
export function peakBySearch(T) {
  let a = Math.log(0.05 * WIEN / T);
  let b = Math.log(20 * WIEN / T);
  const phi = (Math.sqrt(5) - 1) / 2;
  const f = (u) => -planck(Math.exp(u), T);
  for (let k = 0; k < 120; k++) {
    const c = b - phi * (b - a);
    const d = a + phi * (b - a);
    if (f(c) < f(d)) b = d;
    else a = c;
  }
  return Math.exp((a + b) / 2);
}

/** Two-band surface models: emissivity below and above a cutoff wavelength (µm). */
export const SURFACES = {
  black: { name: 'Black paint', short: 0.95, long: 0.95, cut: 3 },
  white: { name: 'White paint', short: 0.2, long: 0.9, cut: 3 },
  metal: { name: 'Polished aluminum', short: 0.15, long: 0.05, cut: 3 },
  solarcell: { name: 'A selective absorber', short: 0.9, long: 0.1, cut: 3 },
};

/** Fraction of a surface's black-body emission it really emits at T: its total emissivity. */
export function emissivity(surface, T) {
  const s = SURFACES[surface];
  const F = bandFraction(s.cut, T);
  return s.short * F + s.long * (1 - F);
}

/** The same weighted by Simpson's rule instead of the band-fraction series. */
export function emissivityNumeric(surface, T) {
  const s = SURFACES[surface];
  const below = planckIntegral(T, 0.01, s.cut);
  const above = planckIntegral(T, s.cut, 1e4);
  return (s.short * below + s.long * above) / (below + above);
}

/** A plate facing the Sun, insulated behind: α S = ε(T) σT⁴, solved by fixed-point iteration. */
export function plateTemperature(surface, S = SOLAR) {
  const alpha = emissivity(surface, T_SUN);
  let T = 300;
  for (let k = 0; k < 200; k++) {
    const next = ((alpha * S) / (emissivity(surface, T) * SIGMA)) ** 0.25;
    if (Math.abs(next - T) < 1e-10) break;
    T = next;
  }
  return { T, alpha, epsilon: emissivity(surface, T) };
}

/** Everything the lab shows at temperature T for a surface. */
export function radiation(surface, T) {
  const Eb = SIGMA * T ** 4;
  const EbNum = planckIntegral(T);
  const peak = WIEN / T;
  const peakNum = peakBySearch(T);
  const eps = emissivity(surface, T);
  const epsNum = emissivityNumeric(surface, T);
  const plate = plateTemperature(surface);
  const gap = Math.max(Math.abs(EbNum - Eb) / Eb, Math.abs(peakNum - peak) / peak, Math.abs(epsNum - eps));
  return { T, Eb, EbNum, peak, peakNum, eps, epsNum, emitted: eps * Eb, alphaSolar: plate.alpha, plateT: plate.T, plateEps: plate.epsilon, gap };
}
