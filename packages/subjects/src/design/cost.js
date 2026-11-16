/**
 * Space system cost: the learning curve for a production run, and the confidence a cost estimate
 * gives. Our own model, after MIT 16.851 Lecture 15.
 *
 * Learning curve (the unit form): each doubling of the quantity built multiplies the unit cost by the
 * slope S, so unit n costs T₁ n^b with b = log₂ S. A run of N costs Σ T₁ n^b. Closed form: the sum is
 * close to the integral over [½, N + ½],
 *   T₁ [(N + ½)^{b+1} − (½)^{b+1}]/(b + 1),
 * less the midpoint rule's leading error; the exact sum is the check. (Lecture 15 uses the cumulative-average form, where the average of
 * the first N units is T₁ N^b, so the run costs T₁ N^{b+1}: a different curve with the same slope.)
 *
 * Cost confidence: each element of the work breakdown has a point estimate and a standard deviation
 * that follows its technology readiness. Costs run high more than low, so each is taken as lognormal
 * with that mean and spread. Closed form: the total's mean and variance add, and a lognormal with the
 * same two moments (Fenton–Wilkinson) gives the budget at any confidence. Second method: convolve the
 * elements' distributions on a grid; the mean and variance must agree, and the grid's own percentile
 * shows what the lognormal approximation costs.
 */

/** Lecture 15's spread of cost by technology readiness level (midpoints of its ranges; 6 and up our own 7.5%). */
export const TRL_SD = Object.freeze({ 2: 0.3, 3: 0.225, 4: 0.175, 5: 0.125, 6: 0.075, 7: 0.075, 8: 0.075 });

/** Lecture 15's learning-curve slopes for the aerospace industry, by quantity. */
export const slopeFor = (N) => (N < 10 ? 0.95 : N <= 50 ? 0.9 : 0.85);

/**
 * Closed form: the run's cost by the integral over [½, N + ½], less the midpoint rule's leading error
 * (Euler–Maclaurin), (1/24)[f'(N + ½) − f'(½)] with f(n) = T₁ n^b.
 */
export function runIntegral({ tfu, S, N }) {
  const b = Math.log2(S);
  const fp = (x) => tfu * b * x ** (b - 1);
  const integral = Math.abs(b + 1) < 1e-12 ? tfu * Math.log((N + 0.5) / 0.5) : (tfu * ((N + 0.5) ** (b + 1) - 0.5 ** (b + 1))) / (b + 1);
  return integral - (fp(N + 0.5) - fp(0.5)) / 24;
}

/** Second method: the run's cost, unit by unit. */
export function runSum({ tfu, S, N }) {
  const b = Math.log2(S);
  let s = 0;
  for (let n = 1; n <= N; n++) s += tfu * n ** b;
  return s;
}

/** A production run with its development cost: totals, average and last unit, both methods. */
export function learningChecked({ dev, tfu, S, N }) {
  const closed = runIntegral({ tfu, S, N });
  const sum = runSum({ tfu, S, N });
  const b = Math.log2(S);
  return {
    b,
    closed,
    sum,
    total: dev + sum,
    average: (dev + sum) / N,
    last: tfu * N ** b,
    cumAverage: tfu * N ** (b + 1),
    noLearning: dev + tfu * N,
    gap: Math.abs(closed - sum) / sum,
  };
}

/** Normal quantile by Acklam's rational approximation, refined by one Halley step. */
export function normInv(p) {
  const a = [-39.69683028665376, 220.9460984245205, -275.9285104469687, 138.357751867269, -30.66479806614716, 2.506628274631];
  const b = [-54.47609879822406, 161.5858368580409, -155.6989798598866, 66.80131188771972, -13.28068155288572];
  const c = [-0.007784894002430293, -0.3223964580411365, -2.400758277161838, -2.549732539343734, 4.374664141464968, 2.938163982698783];
  const d = [0.007784695709041462, 0.3224671290700398, 2.445134137142996, 3.754408661907416];
  const pl = 0.02425;
  let x;
  if (p < pl) {
    const q = Math.sqrt(-2 * Math.log(p));
    x = (((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) / ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1);
  } else if (p <= 1 - pl) {
    const q = p - 0.5;
    const r = q * q;
    x = ((((((a[0] * r + a[1]) * r + a[2]) * r + a[3]) * r + a[4]) * r + a[5]) * q) / (((((b[0] * r + b[1]) * r + b[2]) * r + b[3]) * r + b[4]) * r + 1);
  } else {
    const q = Math.sqrt(-2 * Math.log(1 - p));
    x = -(((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) / ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1);
  }
  const e = 0.5 * erfc(-x / Math.SQRT2) - p;
  const u = e * Math.sqrt(2 * Math.PI) * Math.exp((x * x) / 2);
  return x - u / (1 + (x * u) / 2);
}

function erfc(x) {
  // Numerical Recipes' erfc, good to about 1e-7, enough for a quantile refinement.
  const z = Math.abs(x);
  const t = 1 / (1 + 0.5 * z);
  const r = t * Math.exp(-z * z - 1.26551223 + t * (1.00002368 + t * (0.37409196 + t * (0.09678418 + t * (-0.18628806 + t * (0.27886807 + t * (-1.13520398 + t * (1.48851587 + t * (-0.82215223 + t * 0.17087277)))))))));
  return x >= 0 ? r : 2 - r;
}

/** Lognormal parameters (μ, σ of the log) for a mean m and standard deviation s. */
const logParams = (m, s) => {
  const s2 = Math.log(1 + (s / m) ** 2);
  return { mu: Math.log(m) - s2 / 2, sg: Math.sqrt(s2) };
};

/** Closed form: the total's moments, and the budget at confidence p by Fenton–Wilkinson. */
export function confidenceClosed(items, p) {
  let mean = 0;
  let variance = 0;
  for (const it of items) {
    mean += it.cost;
    variance += (it.cost * it.sd) ** 2;
  }
  const sd = Math.sqrt(variance);
  const { mu, sg } = logParams(mean, sd);
  return { mean, sd, budget: Math.exp(mu + sg * normInv(p)) };
}

/** Second method: convolve the elements' lognormal densities on a grid of step h. */
export function confidenceNumeric(items, p, h = 0.001) {
  let dist = [1]; // probability mass at k h
  for (const it of items) {
    const { mu, sg } = logParams(it.cost, it.cost * it.sd);
    const top = Math.ceil((it.cost * (1 + 8 * it.sd)) / h);
    const cdf = (x) => (x <= 0 ? 0 : 0.5 * erfc(-(Math.log(x) - mu) / (sg * Math.SQRT2)));
    const pmf = [];
    for (let k = 0; k <= top; k++) pmf.push(cdf((k + 0.5) * h) - cdf((k - 0.5) * h));
    const next = new Float64Array(dist.length + pmf.length - 1);
    for (let i = 0; i < dist.length; i++) {
      if (dist[i] < 1e-15) continue;
      for (let j = 0; j < pmf.length; j++) next[i + j] += dist[i] * pmf[j];
    }
    dist = next;
  }
  let mass = 0;
  let mean = 0;
  for (let k = 0; k < dist.length; k++) {
    mass += dist[k];
    mean += dist[k] * k * h;
  }
  mean /= mass;
  let variance = 0;
  let acc = 0;
  let budget = null;
  for (let k = 0; k < dist.length; k++) {
    variance += (dist[k] * (k * h - mean) ** 2) / mass;
    acc += dist[k] / mass;
    if (budget === null && acc >= p) budget = (k - 0.5 + (p - (acc - dist[k] / mass)) / (dist[k] / mass)) * h;
  }
  // The density, thinned to about 300 points, for drawing.
  const every = Math.max(1, Math.floor(dist.length / 300));
  const pdf = [];
  for (let k = 0; k < dist.length; k += every) pdf.push([k * h, dist[k] / mass / h]);
  return { mean, sd: Math.sqrt(variance), budget, pdf };
}

/** Both methods, the reserve the budget holds, and the elements' summed reserves for comparison. */
export function confidenceChecked(items, p) {
  const c = confidenceClosed(items, p);
  const n = confidenceNumeric(items, p);
  const gap = Math.max(Math.abs(n.mean - c.mean) / c.mean, Math.abs(n.sd - c.sd) / c.sd);
  // Holding each element to the same confidence alone and adding the results.
  const each = items.reduce((s, it) => {
    const { mu, sg } = logParams(it.cost, it.cost * it.sd);
    return s + Math.exp(mu + sg * normInv(p));
  }, 0);
  return { ...c, numeric: n, gap, reserve: c.budget - c.mean, reserveShare: (c.budget - c.mean) / c.mean, eachAdded: each, approxError: Math.abs(n.budget - c.budget) / n.budget };
}
