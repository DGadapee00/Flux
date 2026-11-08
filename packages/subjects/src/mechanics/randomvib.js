/**
 * Random vibration of a bracket, and its fatigue life (Build a satellite, Structure).
 *
 * A launch vehicle shakes its payload with broadband noise, described by an acceleration power
 * spectral density W (g²/Hz). A component on a bracket with natural frequency f_n and amplification
 * Q = 1/2ζ responds mostly near f_n. For white noise the response's mean square is
 *   g²_rms = (π/2) f_n Q W (1 + 1/Q²),
 * Miles' equation without the small 1/Q² term. The bracket's stress follows the response,
 * σ_rms = k g_rms, and narrow-band peaks follow a Rayleigh distribution. With an S–N curve
 * N = N_ref (S_ref/S)^b, each second does f_n · (√2σ_rms)^b Γ(1 + b/2) / (N_ref S_ref^b) of damage, so
 * the bracket lasts t = 1/(that rate) seconds of shaking.
 *
 * The second method integrates the transmissibility |T(f)|² against the flat input, after mapping
 * f = f_n tan θ so the infinite range fits a finite one, and integrates the damage over the Rayleigh
 * distribution of peaks, both by Simpson's rule.
 */

export const BRACKET = { k: 4, Nref: 1e7, Sref: 100, b: 6.4 };

function lnGamma(z) {
  const g = 7;
  const c = [0.99999999999980993, 676.5203681218851, -1259.1392167224028, 771.32342877765313, -176.61502916214059, 12.507343278686905, -0.13857109526572012, 9.9843695780195716e-6, 1.5056327351493116e-7];
  if (z < 0.5) return Math.log(Math.PI / Math.sin(Math.PI * z)) - lnGamma(1 - z);
  z -= 1;
  let x = c[0];
  for (let i = 1; i < g + 2; i++) x += c[i] / (z + i);
  const t = z + g + 0.5;
  return 0.5 * Math.log(2 * Math.PI) + (z + 0.5) * Math.log(t) - t + Math.log(x);
}

export function vibClosed({ fn, Q, W }) {
  const { k, Nref, Sref, b } = BRACKET;
  const grms = Math.sqrt((Math.PI / 2) * fn * Q * W * (1 + 1 / (Q * Q)));
  const miles = Math.sqrt((Math.PI / 2) * fn * Q * W);
  const srms = k * grms;
  const rate = (fn * Math.exp(b * Math.log(Math.SQRT2 * srms) + lnGamma(1 + b / 2))) / (Nref * Sref ** b);
  return { grms, miles, srms, peak3: 3 * srms, rate, lifeS: 1 / rate, lifeMin: 1 / rate / 60 };
}

export const trans2 = (r, Q) => {
  const z = 1 / (2 * Q);
  return (1 + (2 * z * r) ** 2) / ((1 - r * r) ** 2 + (2 * z * r) ** 2);
};

export function vibNumeric({ fn, Q, W }, n = 40000) {
  const { k, Nref, Sref, b } = BRACKET;
  // ∫₀^∞ |T(f)|² W df with f = fn tan θ.
  const g = (th) => trans2(Math.tan(th), Q) * fn / Math.cos(th) ** 2;
  const hi = Math.PI / 2 - 1e-9;
  const h = hi / n;
  let s = g(0) + g(hi);
  for (let i = 1; i < n; i++) s += g(i * h) * (i % 2 ? 4 : 2);
  const grms = Math.sqrt(W * (s * h) / 3);
  // Damage per second: fn ∫ p(S)/N(S) dS over the Rayleigh peaks of σ = k grms.
  const sig = k * grms;
  const p = (S) => (S / (sig * sig)) * Math.exp(-(S * S) / (2 * sig * sig));
  const top = 12 * sig;
  const m = 4000;
  const hs = top / m;
  const d = (S) => (p(S) * S ** b) / (Nref * Sref ** b);
  let t = d(0) + d(top);
  for (let i = 1; i < m; i++) t += d(i * hs) * (i % 2 ? 4 : 2);
  return { grms, rate: (fn * (t * hs)) / 3 };
}

export function vibChecked(state) {
  const cf = vibClosed(state);
  const nu = vibNumeric(state);
  return { ...cf, grmsNum: nu.grms, rateNum: nu.rate, gap: Math.max(Math.abs(nu.grms - cf.grms) / cf.grms, Math.abs(nu.rate - cf.rate) / cf.rate) };
}
