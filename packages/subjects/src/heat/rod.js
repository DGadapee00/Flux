/**
 * The heat equation on a rod (EML 4140 unit 1).
 *
 * A rod of length L, insulated along its side, has its ends held at a fixed temperature, taken
 * here as T = 0 (temperatures are measured from the end temperature). Along the rod
 *
 *   ∂T/∂t = α ∂²T/∂x²,   T(0, t) = T(L, t) = 0,   T(x, 0) = f(x).
 *
 * Route 1, Fourier series. Each sine sin(nπx/L) fits the ends and keeps its shape, decaying at its
 * own rate: T = Σ bₙ sin(nπx/L) e^{−(nπ)² Fo}, with Fo = αt/L² the Fourier number and
 * bₙ = (2/L)∫ f sin(nπx/L) dx. The short wiggles die first: mode n decays n² times faster.
 *
 * Route 2, finite differences. Cut the rod into N cells and step forward in time with
 * Tᵢ ← Tᵢ + r (Tᵢ₊₁ − 2Tᵢ + Tᵢ₋₁), r = αΔt/Δx² ≤ ½ (the explicit scheme is stable only there).
 * Nothing from route 1 enters route 2.
 *
 * Everything is in terms of s = x/L and Fo, so one solution serves every material and length.
 */

/** Starting profiles on 0 ≤ s ≤ 1, each zero at both ends, with their sine coefficients in closed form. */
export const PROFILES = {
  // One half sine: a single mode.
  hump: { f: (s) => Math.sin(Math.PI * s), b: (n) => (n === 1 ? 1 : 0) },
  // A tent peaked at the middle: b_n = 8 sin(nπ/2)/(nπ)².
  tent: { f: (s) => (s <= 0.5 ? 2 * s : 2 - 2 * s), b: (n) => (8 * Math.sin((n * Math.PI) / 2)) / (n * Math.PI) ** 2 },
  // The first mode plus a third of the fifth: the wiggle fades long before the hump.
  wiggle: { f: (s) => Math.sin(Math.PI * s) + Math.sin(5 * Math.PI * s) / 3, b: (n) => (n === 1 ? 1 : n === 5 ? 1 / 3 : 0) },
  // A parabola, 4s(1 − s): b_n = 32/(nπ)³ for odd n.
  parabola: { f: (s) => 4 * s * (1 - s), b: (n) => (n % 2 ? 32 / (n * Math.PI) ** 3 : 0) },
};

/** The series solution at s and Fo, summed to `terms` modes. */
export function seriesAt(profile, s, Fo, terms = 4000) {
  const p = PROFILES[profile];
  let T = 0;
  for (let n = 1; n <= terms; n++) {
    const b = p.b(n);
    if (b === 0) continue;
    const decay = Math.exp(-((n * Math.PI) ** 2) * Fo);
    if (decay < 1e-18 && n > 5) break;
    T += b * Math.sin(n * Math.PI * s) * decay;
  }
  return T;
}

/** Explicit finite differences on N cells to time Fo, from the profile's values. Returns N + 1 nodes. */
export function finiteDifference(profile, Fo, N = 80, r = 0.4) {
  const f = PROFILES[profile].f;
  let T = Array.from({ length: N + 1 }, (_, i) => (i === 0 || i === N ? 0 : f(i / N)));
  const ds = 1 / N;
  const steps = Math.ceil(Fo / (r * ds * ds));
  const rr = steps ? Fo / (steps * ds * ds) : 0; // a step a little under r, landing exactly on Fo
  let next = T.slice();
  for (let k = 0; k < steps; k++) {
    for (let i = 1; i < N; i++) next[i] = T[i] + rr * (T[i + 1] - 2 * T[i] + T[i - 1]);
    [T, next] = [next, T];
  }
  return T;
}

/**
 * The rod at Fourier number Fo: both routes on the same nodes, the peak, the heat left (the area
 * under the profile, as a share of the start), and the largest gap between the routes as a share of
 * the starting peak.
 */
export function rod(profile, Fo, N = 80) {
  const fd = finiteDifference(profile, Fo, N);
  const s = fd.map((_, i) => i / N);
  const series = s.map((x) => seriesAt(profile, x, Fo));
  const start = s.map((x) => PROFILES[profile].f(x));
  const peak0 = Math.max(...start);
  const gap = Math.max(...series.map((v, i) => Math.abs(v - fd[i]))) / peak0;
  const area = (arr) => arr.reduce((a, v, i) => a + (i === 0 || i === N ? v / 2 : v), 0) / N;
  const mid = seriesAt(profile, 0.5, Fo);
  return { s, series, fd, start, peak: Math.max(...series), mid, heatLeft: area(series) / area(start), gap, firstModeDecay: Math.exp(-(Math.PI ** 2) * Fo) };
}

/** Thermal diffusivities α = k/(ρc) in m²/s at 300 K: pure copper, pure aluminum, plain carbon steel, Pyrex glass. */
export const ALPHA = { copper: 1.17e-4, aluminum: 9.71e-5, steel: 1.77e-5, glass: 7.5e-7 };
