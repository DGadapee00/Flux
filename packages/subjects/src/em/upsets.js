/**
 * Single-event upsets in a memory protected by an error-correcting code and scrubbing. Our own model.
 *
 * Each bit flips at random at a rate λ per bit per day. A memory of N bits is stored in words of k
 * bits. A single-error-correcting, double-error-detecting code (SECDED) repairs one flipped bit in a
 * word but not two. A scrubber reads and rewrites every word each T days, so upsets only add up
 * within one interval. A word takes upsets at kλ, so the number it gathers in one interval is
 * Poisson with mean x = kλT, and it is lost when it gathers two or more:
 *   P₂ = 1 − e^{−x}(1 + x) = e^{−x} Σ_{n≥2} xⁿ/n!.
 * Uncorrectable errors per day are (N/k) P₂ / T, about N k λ² T/2 for small x. Without the code,
 * every upset is an error: Nλ per day.
 *
 * Second method: the word as a three-state Markov chain (no upset, one, two or more) with rate kλ
 * between states, integrated over one interval by fourth-order Runge–Kutta.
 */

/** P(two or more upsets in a word in one interval), summed so that small x keeps its precision. */
export function doubleShare(x) {
  if (x > 0.5) return 1 - Math.exp(-x) * (1 + x);
  let term = (x * x) / 2;
  let sum = term;
  for (let n = 3; n < 60; n++) {
    term *= x / n;
    sum += term;
    if (term < 1e-18 * sum) break;
  }
  return Math.exp(-x) * sum;
}

/** Closed form. bits N, word k bits, rate λ per bit-day, scrub interval T days, ecc on or off. */
export function upsetsClosed({ bits, word, rate, scrub, ecc }) {
  const single = bits * rate; // upsets per day in the whole memory
  if (!ecc) return { single, uncorrectable: single, x: 0, p2: 1, years: 1 / single / 365.25 };
  const x = word * rate * scrub;
  const p2 = doubleShare(x);
  const uncorrectable = ((bits / word) * p2) / scrub;
  return { single, uncorrectable, x, p2, years: 1 / uncorrectable / 365.25 };
}

/** Second method: the three-state chain for one word over one interval, in n Runge–Kutta steps. */
export function doubleShareChain(x, n = 400) {
  // Time measured in units of the interval, so the rate between states is x.
  let p0 = 1;
  let p1 = 0;
  let p2 = 0;
  const h = 1 / n;
  const d = (a, b) => [-x * a, x * (a - b), x * b];
  for (let i = 0; i < n; i++) {
    const k1 = d(p0, p1);
    const k2 = d(p0 + (h / 2) * k1[0], p1 + (h / 2) * k1[1]);
    const k3 = d(p0 + (h / 2) * k2[0], p1 + (h / 2) * k2[1]);
    const k4 = d(p0 + h * k3[0], p1 + h * k3[1]);
    p0 += (h / 6) * (k1[0] + 2 * k2[0] + 2 * k3[0] + k4[0]);
    p1 += (h / 6) * (k1[1] + 2 * k2[1] + 2 * k3[1] + k4[1]);
    p2 += (h / 6) * (k1[2] + 2 * k2[2] + 2 * k3[2] + k4[2]);
  }
  return p2;
}

/** Both methods, the gap between them, and the error rate across scrub intervals for a chart. */
export function upsetsChecked(state) {
  const c = upsetsClosed(state);
  let gap = 0;
  let chainRate = c.uncorrectable;
  if (state.ecc) {
    const p2 = doubleShareChain(c.x);
    chainRate = ((state.bits / state.word) * p2) / state.scrub;
    gap = Math.abs(chainRate - c.uncorrectable) / c.uncorrectable;
  }
  const curve = [];
  for (let i = 0; i <= 80; i++) {
    const T = 10 ** (-4 + (i / 80) * 6); // 10⁻⁴ to 10² days
    curve.push([T, upsetsClosed({ ...state, ecc: true, scrub: T }).uncorrectable]);
  }
  return { ...c, chainRate, gap, curve };
}
