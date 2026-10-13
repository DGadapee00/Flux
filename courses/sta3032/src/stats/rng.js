/**
 * Seeded random numbers. The generator is FLUX's mulberry32, so a seed means the same draws in the
 * browser, in Node and on every phone: a lab's "Resample" is reproducible and shareable, and the
 * checks can re-run a simulation exactly.
 *
 * Everything here is plain arithmetic on one uniform stream. No DOM.
 */

/** A uniform [0, 1) generator from a 32-bit seed. */
export function mulberry32(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** A string (a problem id and seed, a lab state) as a 32-bit seed. FNV-1a. */
export function hashSeed(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) h = Math.imul(h ^ str.charCodeAt(i), 16777619);
  return h >>> 0;
}

/**
 * A generator with the draws the course needs. `uniform()` never returns exactly 0, so the logs
 * below are always finite.
 */
export function createRng(seed = 1) {
  const u = mulberry32(typeof seed === 'string' ? hashSeed(seed) : seed);
  const uniform = () => {
    let x;
    do x = u();
    while (x === 0);
    return x;
  };
  let spare = null;

  /** Standard normal, Marsaglia's polar method; the second value of each pair is kept. */
  function normal(mu = 0, sigma = 1) {
    if (spare !== null) {
      const z = spare;
      spare = null;
      return mu + sigma * z;
    }
    let x, y, s;
    do {
      x = 2 * uniform() - 1;
      y = 2 * uniform() - 1;
      s = x * x + y * y;
    } while (s >= 1 || s === 0);
    const k = Math.sqrt((-2 * Math.log(s)) / s);
    spare = y * k;
    return mu + sigma * x * k;
  }

  /** Exponential with the given mean (Walpole writes the mean as beta). */
  const exponential = (mean = 1) => -mean * Math.log(uniform());

  /** Gamma(shape k, scale theta), Marsaglia and Tsang; k < 1 by the boost U^(1/k). */
  function gamma(k, theta = 1) {
    if (k < 1) return gamma(k + 1, theta) * Math.pow(uniform(), 1 / k);
    const d = k - 1 / 3;
    const c = 1 / Math.sqrt(9 * d);
    for (;;) {
      let x, v;
      do {
        x = normal();
        v = 1 + c * x;
      } while (v <= 0);
      v = v * v * v;
      const w = uniform();
      if (w < 1 - 0.0331 * x * x * x * x) return d * v * theta;
      if (Math.log(w) < 0.5 * x * x + d * (1 - v + Math.log(v))) return d * v * theta;
    }
  }

  const chi2 = (df) => 2 * gamma(df / 2);
  const t = (df) => normal() / Math.sqrt(chi2(df) / df);
  const f = (d1, d2) => chi2(d1) / d1 / (chi2(d2) / d2);

  /** Integer in [0, n). */
  const int = (n) => Math.floor(u() * n);

  /** Binomial by counting successes for small n, by inversion otherwise. */
  function binomial(n, p) {
    if (n <= 40) {
      let k = 0;
      for (let i = 0; i < n; i++) if (u() < p) k++;
      return k;
    }
    // Inversion from the mode outward would be faster; walking the pmf from 0 is exact and plenty
    // fast for the n this course uses.
    const q = 1 - p;
    let pr = Math.pow(q, n);
    if (pr === 0) return Math.round(n * p + Math.sqrt(n * p * q) * normal());
    let cdf = pr;
    const x = u();
    let k = 0;
    while (x > cdf && k < n) {
      pr *= ((n - k) / (k + 1)) * (p / q);
      k++;
      cdf += pr;
    }
    return k;
  }

  /** Poisson by inversion (the means in this course are small). */
  function poisson(mu) {
    if (mu > 500) return Math.max(0, Math.round(mu + Math.sqrt(mu) * normal()));
    let pr = Math.exp(-mu);
    let cdf = pr;
    const x = u();
    let k = 0;
    while (x > cdf && k < 10000) {
      k++;
      pr *= mu / k;
      cdf += pr;
    }
    return k;
  }

  /** Geometric in Walpole's form: the trial on which the first success happens (1, 2, …). */
  const geometric = (p) => (p >= 1 ? 1 : Math.max(1, Math.ceil(Math.log(uniform()) / Math.log(1 - p))));

  return {
    next: u,
    uniform: (a = 0, b = 1) => a + (b - a) * u(),
    normal,
    exponential,
    gamma,
    chi2,
    t,
    f,
    int,
    binomial,
    poisson,
    geometric,
    /** Fill a typed array with n draws of `draw` (a function of this generator). */
    fill(arr, draw) {
      for (let i = 0; i < arr.length; i++) arr[i] = draw();
      return arr;
    },
  };
}
