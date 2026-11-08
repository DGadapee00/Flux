/**
 * Grain size and yield strength: the Hall–Petch relation (EMA 3010, strengthening).
 *
 * Grain boundaries stop dislocations: slip in one grain must pile up against the boundary before it
 * can set off slip in the next. Smaller grains hold shorter pile-ups, which need more stress, so
 *   σ_y = σ₀ + k_y d^{−1/2}.
 * A real metal has a spread of grain sizes, often close to log-normal with median d₅₀ and spread s in
 * ln d. Averaging d^{−1/2} over it gives E[d^{−1/2}] = d₅₀^{−1/2} e^{s²/8}, so the yield strength is
 * σ₀ + k_y d₅₀^{−1/2} e^{s²/8}.
 *
 * The second method integrates d^{−1/2} over the log-normal distribution by Simpson's rule.
 */

/** Typical values: friction stress σ₀ (MPa) and k_y (MPa·m^½). */
export const METALS = {
  steel: { name: 'Mild steel', s0: 70, ky: 0.74 },
  titanium: { name: 'Titanium', s0: 80, ky: 0.4 },
  copper: { name: 'Copper', s0: 25, ky: 0.11 },
};

export function hpClosed({ metal, ld, s }) {
  const m = METALS[metal];
  const d = 10 ** ld * 1e-6;
  const mean = d ** -0.5 * Math.exp((s * s) / 8);
  return { d, dum: d * 1e6, invRoot: mean, sy: m.s0 + m.ky * mean, single: m.s0 + m.ky * d ** -0.5, s0: m.s0, ky: m.ky };
}

export function hpNumeric({ ld, s }, n = 2000) {
  const d50 = 10 ** ld * 1e-6;
  if (s < 1e-9) return d50 ** -0.5;
  const mu = Math.log(d50);
  const lo = mu - 8 * s;
  const h = (16 * s) / n;
  const f = (y) => (Math.exp(-((y - mu) ** 2) / (2 * s * s)) / (s * Math.sqrt(2 * Math.PI))) * Math.exp(-y / 2);
  let sum = f(lo) + f(lo + n * h);
  for (let i = 1; i < n; i++) sum += f(lo + i * h) * (i % 2 ? 4 : 2);
  return (sum * h) / 3;
}

/** The log-normal density in d (µm) for drawing. */
export function sizeDensity({ ld, s }, dum) {
  const mu = Math.log(10 ** ld);
  return Math.exp(-((Math.log(dum) - mu) ** 2) / (2 * s * s)) / (s * Math.sqrt(2 * Math.PI));
}

export function hpChecked(state) {
  const cf = hpClosed(state);
  const num = hpNumeric(state);
  const syNum = METALS[state.metal].s0 + METALS[state.metal].ky * num;
  return { ...cf, syNum, gap: Math.abs(syNum - cf.sy) / cf.sy };
}
