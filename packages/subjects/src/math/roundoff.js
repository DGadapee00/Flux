/**
 * Floating point and round-off (EGN 3203 unit 2).
 *
 * A double stores about 16 significant decimal digits: every stored number and every operation is
 * off by a relative amount up to the unit round-off u = 2⁻⁵³ ≈ 1.1×10⁻¹⁶. Subtracting two nearly
 * equal numbers keeps the absolute error but loses the leading digits, so the relative error grows.
 * Three formulas, each written the direct way and a rewritten way that never subtracts close
 * numbers:
 *
 *   cosine  (1 − cos x)/x²      = 2 sin²(x/2)/x²       for small x; true value near 1/2
 *   expm1   (eˣ − 1)/x          = expm1(x)/x           for small x; true value near 1
 *   sqrt    √(x² + 1) − x       = 1/(√(x² + 1) + x)    for large x; true value near 1/(2x)
 *
 * The second method is each function's Taylor series, summed until its terms no longer change the
 * total, which shares no operation with either form.
 *
 * The direct form's error is estimated as u times the size of the numbers subtracted over the size
 * of their difference: 2u/x² for the cosine, u/x for the exponential, 2x²u for the square root.
 */
export const U = 2 ** -53;

export const FAMILIES = {
  cosine: {
    name: '(1 − cos x)/x²',
    stableName: '2 sin²(x/2)/x²',
    small: true,
    direct: (x) => (1 - Math.cos(x)) / (x * x),
    stable: (x) => (2 * Math.sin(x / 2) ** 2) / (x * x),
    // Σ (−1)ᵏ x²ᵏ/(2k + 2)!
    series: (x) => {
      let term = 0.5;
      let sum = 0.5;
      for (let k = 1; k < 60; k++) {
        term *= (-x * x) / ((2 * k + 1) * (2 * k + 2));
        const next = sum + term;
        if (next === sum) break;
        sum = next;
      }
      return sum;
    },
    estimate: (x) => (2 * U) / (x * x),
  },
  expm1: {
    name: '(eˣ − 1)/x',
    stableName: 'expm1(x)/x',
    small: true,
    direct: (x) => (Math.exp(x) - 1) / x,
    stable: (x) => Math.expm1(x) / x,
    // Σ xᵏ/(k + 1)!
    series: (x) => {
      let term = 1;
      let sum = 1;
      for (let k = 1; k < 80; k++) {
        term *= x / (k + 1);
        const next = sum + term;
        if (next === sum) break;
        sum = next;
      }
      return sum;
    },
    estimate: (x) => U / x,
  },
  sqrt: {
    name: '√(x² + 1) − x',
    stableName: '1/(√(x² + 1) + x)',
    small: false,
    direct: (x) => Math.sqrt(x * x + 1) - x,
    stable: (x) => 1 / (Math.sqrt(x * x + 1) + x),
    // (1/2x) Σ binom(1/2, k+1)·2·(−1)ᵏ... written as the series of √(1 + t) − 1 with t = 1/x², times x.
    series: (x) => {
      const t = 1 / (x * x);
      let c = 0.5; // binomial coefficient C(1/2, 1)
      let p = t;
      let sum = c * p;
      for (let k = 1; k < 80; k++) {
        c *= (0.5 - k) / (k + 1);
        p *= t;
        const next = sum + c * p;
        if (next === sum) break;
        sum = next;
      }
      return x * sum;
    },
    estimate: (x) => 2 * x * x * U,
  },
};

/** Both forms, the series, their relative errors and correct digits, at x. */
export function roundoff(family, x) {
  const f = FAMILIES[family];
  const truth = f.series(x);
  const direct = f.direct(x);
  const stable = f.stable(x);
  const rel = (v) => Math.abs(v - truth) / Math.abs(truth);
  const digits = (e) => Math.min(16, Math.max(0, -Math.log10(Math.max(e, 1e-17))));
  const relDirect = rel(direct);
  const relStable = rel(stable);
  return { ...f, family, x, truth, direct, stable, relDirect, relStable, digitsDirect: digits(relDirect), digitsStable: digits(relStable), estimate: Math.min(1, f.estimate(x)) };
}
