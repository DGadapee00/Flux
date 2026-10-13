/**
 * Distribution functions: pdf/pmf, cdf, upper tail and quantiles for every distribution in the
 * course. Exact to about 1e-12, so a table value is always "exact, then rounded", and the rounding
 * is the only thing that separates them.
 *
 * Conventions follow the textbook (Walpole, Myers, Myers & Ye):
 * - the geometric counts trials to the first success, g(x; p) = p q^(x−1) for x = 1, 2, …
 * - the exponential is written with its mean beta
 * - a critical value is an upper-tail point: t_alpha has area alpha to its right.
 *
 * scripts/stats-check.mjs pins these against published values before anything depends on them.
 */

// ---------- special functions ----------

const LANCZOS = [
  0.99999999999980993, 676.5203681218851, -1259.1392167224028, 771.32342877765313, -176.61502916214059,
  12.507343278686905, -0.13857109526572012, 9.9843695780195716e-6, 1.5056327351493116e-7,
];

/** ln Γ(x) for x > 0 (Lanczos, g = 7). */
export function lgamma(x) {
  if (x < 0.5) return Math.log(Math.PI / Math.abs(Math.sin(Math.PI * x))) - lgamma(1 - x);
  x -= 1;
  let a = LANCZOS[0];
  const t = x + 7.5;
  for (let i = 1; i < 9; i++) a += LANCZOS[i] / (x + i);
  return 0.5 * Math.log(2 * Math.PI) + (x + 0.5) * Math.log(t) - t + Math.log(a);
}

const EPS = 1e-15;
const TINY = 1e-300;

/** Regularized lower incomplete gamma P(a, x). */
export function gammaP(a, x) {
  if (x <= 0) return 0;
  if (x < a + 1) return gammaSeries(a, x);
  return 1 - gammaCF(a, x);
}

/** Regularized upper incomplete gamma Q(a, x) = 1 − P(a, x), computed directly in the tail. */
export function gammaQ(a, x) {
  if (x <= 0) return 1;
  if (x < a + 1) return 1 - gammaSeries(a, x);
  return gammaCF(a, x);
}

function gammaSeries(a, x) {
  let sum = 1 / a;
  let del = sum;
  let ap = a;
  for (let n = 0; n < 10000; n++) {
    ap += 1;
    del *= x / ap;
    sum += del;
    if (Math.abs(del) < Math.abs(sum) * EPS) break;
  }
  return sum * Math.exp(-x + a * Math.log(x) - lgamma(a));
}

function gammaCF(a, x) {
  // Modified Lentz on the continued fraction for Q(a, x).
  let b = x + 1 - a;
  let c = 1 / TINY;
  let d = 1 / b;
  let h = d;
  for (let i = 1; i < 10000; i++) {
    const an = -i * (i - a);
    b += 2;
    d = an * d + b;
    if (Math.abs(d) < TINY) d = TINY;
    c = b + an / c;
    if (Math.abs(c) < TINY) c = TINY;
    d = 1 / d;
    const del = d * c;
    h *= del;
    if (Math.abs(del - 1) < EPS) break;
  }
  return Math.exp(-x + a * Math.log(x) - lgamma(a)) * h;
}

/** Regularized incomplete beta I_x(a, b). */
export function betaI(x, a, b) {
  if (x <= 0) return 0;
  if (x >= 1) return 1;
  const bt = Math.exp(lgamma(a + b) - lgamma(a) - lgamma(b) + a * Math.log(x) + b * Math.log(1 - x));
  if (x < (a + 1) / (a + b + 2)) return (bt * betaCF(x, a, b)) / a;
  return 1 - (bt * betaCF(1 - x, b, a)) / b;
}

function betaCF(x, a, b) {
  const qab = a + b;
  const qap = a + 1;
  const qam = a - 1;
  let c = 1;
  let d = 1 - (qab * x) / qap;
  if (Math.abs(d) < TINY) d = TINY;
  d = 1 / d;
  let h = d;
  for (let m = 1; m < 10000; m++) {
    const m2 = 2 * m;
    let aa = (m * (b - m) * x) / ((qam + m2) * (a + m2));
    d = 1 + aa * d;
    if (Math.abs(d) < TINY) d = TINY;
    c = 1 + aa / c;
    if (Math.abs(c) < TINY) c = TINY;
    d = 1 / d;
    h *= d * c;
    aa = (-(a + m) * (qab + m) * x) / ((a + m2) * (qap + m2));
    d = 1 + aa * d;
    if (Math.abs(d) < TINY) d = TINY;
    c = 1 + aa / c;
    if (Math.abs(c) < TINY) c = TINY;
    d = 1 / d;
    const del = d * c;
    h *= del;
    if (Math.abs(del - 1) < EPS) break;
  }
  return h;
}

/** ln C(n, k). */
export const lchoose = (n, k) => lgamma(n + 1) - lgamma(k + 1) - lgamma(n - k + 1);

/** C(n, k) as an exact integer while it fits (n up to about 60), rounded otherwise. */
export function choose(n, k) {
  if (k < 0 || k > n) return 0;
  k = Math.min(k, n - k);
  let r = 1;
  for (let i = 1; i <= k; i++) r = (r * (n - k + i)) / i;
  return Math.round(r);
}

/** nPr = n! / (n − r)!. */
export function perm(n, r) {
  if (r < 0 || r > n) return 0;
  let p = 1;
  for (let i = 0; i < r; i++) p *= n - i;
  return p;
}

export function factorial(n) {
  let p = 1;
  for (let i = 2; i <= n; i++) p *= i;
  return p;
}

// ---------- normal ----------

export const normPdf = (x, mu = 0, sigma = 1) => {
  const z = (x - mu) / sigma;
  return Math.exp(-0.5 * z * z) / (sigma * Math.sqrt(2 * Math.PI));
};

/**
 * Standard normal upper tail for z ≥ 0. Hart's double-precision rational approximation, as
 * given by West (2005), "Better approximations to cumulative normal functions": about 1e-15.
 */
function upperStd(za) {
  if (za > 37) return 0;
  const e = Math.exp((-za * za) / 2);
  if (za < 7.07106781186547) {
    let n = 3.52624965998911e-2 * za + 0.700383064443688;
    n = n * za + 6.37396220353165;
    n = n * za + 33.912866078383;
    n = n * za + 112.079291497871;
    n = n * za + 221.213596169931;
    n = n * za + 220.206867912376;
    let d = 8.83883476483184e-2 * za + 1.75566716318264;
    d = d * za + 16.064177579207;
    d = d * za + 86.7807322029461;
    d = d * za + 296.564248779674;
    d = d * za + 637.333633378831;
    d = d * za + 793.826512519948;
    d = d * za + 440.413735824752;
    return (e * n) / d;
  }
  let b = za + 0.65;
  b = za + 4 / b;
  b = za + 3 / b;
  b = za + 2 / b;
  b = za + 1 / b;
  return e / b / 2.506628274631;
}

/** Φ((x − μ)/σ): area to the left of x. */
export function normCdf(x, mu = 0, sigma = 1) {
  const z = (x - mu) / sigma;
  return z >= 0 ? 1 - upperStd(z) : upperStd(-z);
}

/** Area to the right of x, computed directly so a far tail keeps its digits. */
export function normSf(x, mu = 0, sigma = 1) {
  const z = (x - mu) / sigma;
  return z >= 0 ? upperStd(z) : 1 - upperStd(-z);
}

/** The x with area p to its left. Wichura's AS 241 (PPND16), about 1e-16. */
export function normInv(p, mu = 0, sigma = 1) {
  if (!(p > 0 && p < 1)) return p === 0 ? -Infinity : p === 1 ? Infinity : NaN;
  const q = p - 0.5;
  let val;
  if (Math.abs(q) <= 0.425) {
    const r = 0.180625 - q * q;
    val =
      (q *
        (((((((r * 2509.0809287301226727 + 33430.575583588128105) * r + 67265.770927008700853) * r + 45921.953931549871457) * r +
          13731.693765509461125) *
          r +
          1971.5909503065514427) *
          r +
          133.14166789178437745) *
          r +
          3.387132872796366608)) /
      (((((((r * 5226.495278852545925 + 28729.085735721942674) * r + 39307.89580009271061) * r + 21213.794301586595867) * r +
        5394.1960214247511077) *
        r +
        687.1870074920579083) *
        r +
        42.313330701600911252) *
        r +
        1);
  } else {
    let r = q < 0 ? p : 1 - p;
    r = Math.sqrt(-Math.log(r));
    if (r <= 5) {
      r -= 1.6;
      val =
        (((((((r * 7.7454501427834140764e-4 + 0.0227238449892691845833) * r + 0.24178072517745061177) * r + 1.27045825245236838258) * r +
          3.64784832476320460504) *
          r +
          5.7694972214606914055) *
          r +
          4.6303378461565452959) *
          r +
          1.42343711074968357734) /
        (((((((r * 1.05075007164441684324e-9 + 5.475938084995344946e-4) * r + 0.0151986665636164571966) * r + 0.14810397642748007459) * r +
          0.68976733498510000455) *
          r +
          1.6763848301838038494) *
          r +
          2.05319162663775882187) *
          r +
          1);
    } else {
      r -= 5;
      val =
        (((((((r * 2.01033439929228813265e-7 + 2.71155556874348757815e-5) * r + 0.0012426609473880784386) * r + 0.026532189526576123093) * r +
          0.29656057182850489123) *
          r +
          1.7848265399172913358) *
          r +
          5.4637849111641143699) *
          r +
          6.6579046435011037772) /
        (((((((r * 2.04426310338993978564e-15 + 1.4215117583164458887e-7) * r + 1.8463183175100546818e-5) * r + 7.868691311456132591e-4) * r +
          0.0148753612908506148525) *
          r +
          0.13692988092273580531) *
          r +
          0.59983220655588793769) *
          r +
          1);
    }
    if (q < 0) val = -val;
  }
  return mu + sigma * val;
}

/** z_alpha: the z with area alpha to its right. */
export const zCrit = (alpha) => -normInv(alpha);

// ---------- t, chi-squared, F ----------

export function tPdf(x, df) {
  return Math.exp(lgamma((df + 1) / 2) - lgamma(df / 2) - 0.5 * Math.log(df * Math.PI) - ((df + 1) / 2) * Math.log(1 + (x * x) / df));
}

/** P(T > t). */
export function tSf(t, df) {
  if (df === Infinity) return normSf(t);
  const tail = 0.5 * betaI(df / (df + t * t), df / 2, 0.5);
  return t >= 0 ? tail : 1 - tail;
}

export const tCdf = (t, df) => 1 - tSf(t, df);

export function chi2Pdf(x, df) {
  if (x < 0) return 0;
  if (x === 0) return df === 2 ? 0.5 : df < 2 ? Infinity : 0;
  const k = df / 2;
  return Math.exp((k - 1) * Math.log(x) - x / 2 - k * Math.LN2 - lgamma(k));
}

export const chi2Cdf = (x, df) => gammaP(df / 2, x / 2);
export const chi2Sf = (x, df) => gammaQ(df / 2, x / 2);

export function fPdf(x, d1, d2) {
  if (x <= 0) return 0;
  const lg = 0.5 * (d1 * Math.log(d1 * x) + d2 * Math.log(d2) - (d1 + d2) * Math.log(d1 * x + d2)) - Math.log(x) - (lgamma(d1 / 2) + lgamma(d2 / 2) - lgamma((d1 + d2) / 2));
  return Math.exp(lg);
}

/** P(F > f), with the degenerate ∞ columns and rows handled as chi-squared limits. */
export function fSf(f, d1, d2) {
  if (f <= 0) return 1;
  if (d1 === Infinity && d2 === Infinity) return f < 1 ? 1 : 0;
  if (d2 === Infinity) return chi2Sf(d1 * f, d1);
  if (d1 === Infinity) return chi2Cdf(d2 / f, d2);
  return betaI(d2 / (d2 + d1 * f), d2 / 2, d1 / 2);
}

export const fCdf = (f, d1, d2) => 1 - fSf(f, d1, d2);

/**
 * The x with upper-tail area alpha for a decreasing survival function on (lo, ∞): bracket, then
 * bisect. Bisecting on the tail itself (not on 1 − cdf) keeps small alphas accurate.
 */
function upperPoint(sf, alpha, lo = 0, start = 1) {
  if (!(alpha > 0 && alpha < 1)) return alpha <= 0 ? Infinity : lo;
  let a = lo;
  let b = start;
  while (sf(b) > alpha) {
    a = b;
    b *= 2;
    if (b > 1e12) return Infinity;
  }
  for (let i = 0; i < 300; i++) {
    const m = 0.5 * (a + b);
    if (m === a || m === b) break;
    if (sf(m) > alpha) a = m;
    else b = m;
    if (b - a <= 1e-14 * Math.max(1, b)) break;
  }
  return 0.5 * (a + b);
}

/** t_alpha(df): area alpha to its right. */
export function tCrit(alpha, df) {
  if (df === Infinity) return zCrit(alpha);
  if (alpha > 0.5) return -tCrit(1 - alpha, df);
  if (alpha === 0.5) return 0;
  return upperPoint((x) => tSf(x, df), alpha);
}

/** χ²_alpha(df): area alpha to its right. */
export const chi2Crit = (alpha, df) => upperPoint((x) => chi2Sf(x, df), alpha, 0, Math.max(1, df));

/** f_alpha(ν₁, ν₂): area alpha to its right. */
export function fCrit(alpha, d1, d2) {
  if (d1 === Infinity && d2 === Infinity) return 1;
  return upperPoint((x) => fSf(x, d1, d2), alpha);
}

export const tInv = (p, df) => tCrit(1 - p, df);
export const chi2Inv = (p, df) => chi2Crit(1 - p, df);
export const fInv = (p, d1, d2) => fCrit(1 - p, d1, d2);

// ---------- discrete ----------

/** b(x; n, p). */
export function binomPmf(x, n, p) {
  if (x < 0 || x > n || x !== Math.floor(x)) return 0;
  if (p === 0) return x === 0 ? 1 : 0;
  if (p === 1) return x === n ? 1 : 0;
  return Math.exp(lchoose(n, x) + x * Math.log(p) + (n - x) * Math.log1p(-p));
}

/** P(X ≤ r) = Σ_{x=0}^{r} b(x; n, p): what Table A.1 prints. */
export function binomCdf(r, n, p) {
  r = Math.floor(r);
  if (r < 0) return 0;
  if (r >= n) return 1;
  let s = 0;
  for (let x = 0; x <= r; x++) s += binomPmf(x, n, p);
  return Math.min(1, s);
}

/** g(x; p) = p q^(x−1), x = 1, 2, … */
export const geomPmf = (x, p) => (x >= 1 && x === Math.floor(x) ? p * Math.pow(1 - p, x - 1) : 0);
/** P(X ≤ x) = 1 − q^x. */
export const geomCdf = (x, p) => (x < 1 ? 0 : 1 - Math.pow(1 - p, Math.floor(x)));

/** p(x; μ). */
export function poisPmf(x, mu) {
  if (x < 0 || x !== Math.floor(x)) return 0;
  if (mu === 0) return x === 0 ? 1 : 0;
  return Math.exp(-mu + x * Math.log(mu) - lgamma(x + 1));
}

/** P(X ≤ r) = Σ_{x=0}^{r} p(x; μ): what Table A.2 prints. */
export function poisCdf(r, mu) {
  r = Math.floor(r);
  if (r < 0) return 0;
  let s = 0;
  for (let x = 0; x <= r; x++) s += poisPmf(x, mu);
  return Math.min(1, s);
}

/** h(x; N, n, k): x successes in a sample of n from N items of which k are successes. */
export function hyperPmf(x, N, n, k) {
  if (x < Math.max(0, n - (N - k)) || x > Math.min(n, k)) return 0;
  return Math.exp(lchoose(k, x) + lchoose(N - k, n - x) - lchoose(N, n));
}

/** P(X ≤ r) for the hypergeometric: a sum of h(x; N, n, k). */
export function hyperCdf(r, N, n, k) {
  let s = 0;
  for (let x = 0; x <= Math.floor(r); x++) s += hyperPmf(x, N, n, k);
  return Math.min(1, s);
}

// ---------- continuous uniform and exponential ----------

export const unifPdf = (x, a, b) => (x >= a && x <= b ? 1 / (b - a) : 0);
export const unifCdf = (x, a, b) => (x <= a ? 0 : x >= b ? 1 : (x - a) / (b - a));
export const expPdf = (x, beta) => (x < 0 ? 0 : Math.exp(-x / beta) / beta);
export const expCdf = (x, beta) => (x <= 0 ? 0 : 1 - Math.exp(-x / beta));
