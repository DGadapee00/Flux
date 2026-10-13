/** Chapter 6 · Continuous distributions: uniform, normal, z_alpha, assessing normality. */
import { problem, kase, range, choice, data, num, prob, mc, tn, fx, roundTo, zLook, zCritLook } from '../kit.js';
import { normCdf, normInv, zCrit } from '../../stats/dist.js';
import { zTable, zForArea } from '../../stats/tables.js';
import { createRng } from '../../stats/rng.js';
import { mean, sd, sorted } from '../../stats/describe.js';

const PLOTTING_POSITION = 'That uses the area i/(n + 1). The notes use (i − 0.5)/n: for the smallest of n values, 0.5/n.';

const C6 = { ch: '6' };

/** Normal settings with realistic numbers. dp: decimals the measurement is written to; are: plural. */
const NORMALS = [
  { value: 'battery', what: 'the life of a storage battery', unit: 'years', mu: 3.0, sigma: 0.5, dp: 1 },
  { value: 'bulb', what: 'the life of a light bulb', unit: 'hours', mu: 800, sigma: 40, dp: 0 },
  { value: 'iq', what: 'IQ scores', are: true, unit: 'points', mu: 100, sigma: 15, dp: 0 },
  { value: 'bolt', what: 'the diameter of a machined bolt', unit: 'mm', mu: 10, sigma: 0.03, dp: 3 },
  { value: 'score', what: 'scores on a final exam', are: true, unit: 'points', mu: 72, sigma: 9, dp: 0 },
  { value: 'fill', what: 'the amount of soda in a bottle', unit: 'mL', mu: 500, sigma: 3.5, dp: 1 },
  { value: 'x', what: 'a random variable X', unit: '', mu: 40, sigma: 6, dp: 2 },
  { value: 'height', what: 'the height of three-year-old girls', unit: 'inches', mu: 38.72, sigma: 3.17, dp: 2 },
  { value: 'run', what: 'the finishing time in a 10-km run', unit: 'minutes', mu: 61, sigma: 9, dp: 0 },
];
const NORM = choice(...NORMALS.map((c) => [c.value, c.what]));
const ctxOf = (v) => NORMALS.find((c) => c.value === v);
const setup = ($) => {
  const c = ctxOf($.ctx);
  const u = c.unit ? ` ${c.unit}` : '';
  return `Assume ${c.what} ${c.are ? 'are' : 'is'} normally distributed with mean ${c.mu}${u} and standard deviation ${c.sigma}${u}.`;
};

const SIDE = choice(['left', 'less than'], ['right', 'more than'], ['between', 'between']);
const ordinal = (k) => `${k}${k === 1 ? 'st' : k === 2 ? 'nd' : k === 3 ? 'rd' : 'th'}`;

/** Φ(z) the two ways, for a probability question about Z with 2-decimal z's. */
function zQuestion(side, z1, z2) {
  const P = (z) => normCdf(z);
  const T = (z) => zTable(z).value;
  if (side === 'left') return { exact: P(z1), table: T(z1) };
  if (side === 'right') return { exact: 1 - P(z1), table: 1 - T(z1) };
  return { exact: P(z2) - P(z1), table: T(z2) - T(z1) };
}

/** The table lines and the final line of a Φ computation. */
function zSteps(side, z1, z2, ask) {
  const a = zLook(z1);
  if (side === 'left') return [a.line, String.raw`$${ask} = ${fx(a.table, 4)}$`];
  if (side === 'right') return [a.line, String.raw`$${ask} = 1 - ${fx(a.table, 4)} = ${fx(1 - a.table, 4)}$`];
  const b = zLook(z2);
  return [a.line, b.line, String.raw`$${ask} = ${fx(b.table, 4)} - ${fx(a.table, 4)} = ${fx(b.table - a.table, 4)}$`];
}

/** The notes' theoretical quantiles: z_i = Φ⁻¹((i − 0.5)/n) for the i-th smallest value. */
export const normalScores = (n) => Array.from({ length: n }, (_, i) => normInv((i + 0.5) / n));

/**
 * A normal probability plot as SVG, drawn the notes' way: the theoretical quantiles z_i on the
 * horizontal axis and the sorted data on the vertical, with z_i = Φ⁻¹((i − 0.5)/n). A faint
 * least-squares line is drawn for reference.
 */
function nppSVG(xs) {
  const s = sorted(xs);
  const n = s.length;
  const zs = normalScores(n);
  const W = 320;
  const H = 230;
  const L = 44;
  const R = W - 12;
  const T = 16;
  const B = H - 32;
  const ylo = s[0];
  const yhi = s[n - 1];
  const pad = (yhi - ylo) * 0.06 || 1;
  const zmax = Math.max(2.2, Math.ceil(Math.abs(zs[0]) * 10) / 10 + 0.2);
  const X = (z) => L + ((R - L) * (z + zmax)) / (2 * zmax);
  const Y = (y) => B - ((B - T) * (y - (ylo - pad))) / (yhi - ylo + 2 * pad);
  const out = [];
  for (const z of [-2, -1, 0, 1, 2]) {
    if (Math.abs(z) > zmax) continue;
    out.push(`<line x1="${X(z)}" y1="${T}" x2="${X(z)}" y2="${B}" class="fig-grid" />`);
    out.push(`<text x="${X(z)}" y="${B + 15}" text-anchor="middle" class="fig-tick">${z}</text>`);
  }
  // A few data ticks on the vertical axis.
  const step = niceStep((yhi - ylo) / 4);
  for (let y = Math.ceil((ylo - pad) / step) * step; y <= yhi + pad; y += step) {
    out.push(`<line x1="${L}" y1="${Y(y)}" x2="${R}" y2="${Y(y)}" class="fig-grid" />`);
    out.push(`<text x="${L - 6}" y="${Y(y) + 4}" text-anchor="end" class="fig-tick">${Number(y.toPrecision(6))}</text>`);
  }
  out.push(`<line x1="${L}" y1="${B}" x2="${R}" y2="${B}" class="fig-axis" />`);
  out.push(`<line x1="${L}" y1="${T}" x2="${L}" y2="${B}" class="fig-axis" />`);
  out.push(`<text x="${R}" y="${H - 4}" text-anchor="end" class="fig-label">theoretical quantile z</text>`);
  out.push(`<text x="${L - 40}" y="${T - 4}" class="fig-label">data</text>`);
  const zb = mean(zs);
  const yb = mean(s);
  let szz = 0;
  let szy = 0;
  for (let i = 0; i < n; i++) {
    szz += (zs[i] - zb) ** 2;
    szy += (zs[i] - zb) * (s[i] - yb);
  }
  const b1 = szy / szz;
  out.push(`<line x1="${X(-zmax)}" y1="${Y(yb + b1 * (-zmax - zb))}" x2="${X(zmax)}" y2="${Y(yb + b1 * (zmax - zb))}" class="fig-ref" />`);
  for (let i = 0; i < n; i++) out.push(`<circle cx="${X(zs[i]).toFixed(1)}" cy="${Y(s[i]).toFixed(1)}" r="3.2" class="fig-pt" />`);
  return `<svg viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Normal probability plot">${out.join('')}</svg>`;
}

function niceStep(raw) {
  const p = 10 ** Math.floor(Math.log10(raw));
  const m = raw / p;
  return (m < 1.5 ? 1 : m < 3.5 ? 2 : m < 7.5 ? 5 : 10) * p;
}

/** Sample skewness and excess kurtosis, to keep only plots whose shape is unmistakable. */
function shapeStats(xs) {
  const m = mean(xs);
  const n = xs.length;
  let m2 = 0;
  let m3 = 0;
  let m4 = 0;
  for (const x of xs) {
    const d = x - m;
    m2 += d * d;
    m3 += d * d * d;
    m4 += d * d * d * d;
  }
  m2 /= n;
  m3 /= n;
  m4 /= n;
  return { skew: m3 / m2 ** 1.5, kurt: m4 / (m2 * m2) - 3 };
}

export default [
  // ----------------------------------------------------------------- uniform
  problem({
    ...C6, id: 'c6.uniform', title: 'Continuous uniform', kind: 'numeric', topics: ['uniform'], src: 'Walpole §6.1',
    vars: { a: range(0, 10, 1), len: range(2, 20, 1), side: SIDE, c: range(0.1, 0.9, 0.05), d: range(0.1, 0.9, 0.05) },
    derive: ($) => {
      const b = $.a + $.len;
      const x1 = roundTo($.a + Math.min($.c, $.d) * $.len, 1);
      const x2 = roundTo($.a + Math.max($.c, $.d) * $.len, 1);
      const p = $.side === 'left' ? (x1 - $.a) / $.len : $.side === 'right' ? (b - x1) / $.len : (x2 - x1) / $.len;
      return { b, x1, x2, p, mu: ($.a + b) / 2, v: $.len ** 2 / 12 };
    },
    valid: ($) => $.side !== 'between' || $.x2 - $.x1 >= 0.5,
    text: (T, $) =>
      `The length X of a meeting, in hours, is uniformly distributed between ${$.a} and ${$.b}. Find the probability that X is ${$.side === 'left' ? `less than ${$.x1}` : $.side === 'right' ? `more than ${$.x1}` : `between ${$.x1} and ${$.x2}`}, and the mean and variance of X.`,
    parts: [
      prob('p', ($) => $.p, { label: ($T, $) => ($.side === 'left' ? String.raw`$P(X < ${$.x1})$` : $.side === 'right' ? String.raw`$P(X > ${$.x1})$` : String.raw`$P(${$.x1} < X < ${$.x2})$`) }),
      num('mu', ($) => $.mu, { label: String.raw`$\mu$` }),
      num('v', ($) => $.v, { label: String.raw`$\sigma^2$`, traps: [[($) => $.len / Math.sqrt(12), String.raw`That is $\sigma$. The variance is $\sigma^2 = (B - A)^2/12$.`]] }),
    ],
    hints: [String.raw`The density is flat: $f(x) = \dfrac{1}{B - A}$ on $[A, B]$.`, 'A probability is an area: the width of the interval asked about times the height 1/(B − A).', String.raw`$\mu = \dfrac{A + B}{2}$ and $\sigma^2 = \dfrac{(B - A)^2}{12}$.`],
    steps: ($) => {
      const w = $.side === 'left' ? [`${$.x1} - ${$.a}`, $.x1 - $.a] : $.side === 'right' ? [`${$.b} - ${$.x1}`, $.b - $.x1] : [`${$.x2} - ${$.x1}`, $.x2 - $.x1];
      return [
        String.raw`$f(x) = \dfrac{1}{${$.b} - ${$.a}} = \dfrac{1}{${$.len}}$ for $${$.a} \le x \le ${$.b}$.`,
        String.raw`$$P = \dfrac{${w[0]}}{${$.len}} = \dfrac{${tn(w[1], 6)}}{${$.len}} = ${fx($.p, 4)}$$`,
        String.raw`$\mu = \dfrac{${$.a} + ${$.b}}{2} = ${tn($.mu, 6)}$`,
        String.raw`$\sigma^2 = \dfrac{(${$.b} - ${$.a})^2}{12} = \dfrac{${$.len ** 2}}{12} = ${tn($.v, 4)}$`,
      ];
    },
    twin: { part: 'p', draw: (r, $) => { const x = r.uniform($.a, $.b); return $.side === 'left' ? x < $.x1 : $.side === 'right' ? x > $.x1 : x > $.x1 && x < $.x2; } },
    cases: [kase('Walpole §6.1', { a: 0, len: 4, side: 'right', c: 0.75, d: 0.75 }, { p: 0.25, mu: 2, v: 1.333 })],
  }),

  // ----------------------------------------------------------------- standard normal
  problem({
    ...C6, id: 'c6.z-area', title: 'Areas under the standard normal curve', kind: 'numeric', topics: ['standard-normal', 'z-table'], src: 'Walpole §6.3',
    vars: { side: SIDE, z1: range(-3.2, 3.2, 0.01), z2: range(-3.2, 3.2, 0.01) },
    derive: ($) => {
      const lo = Math.min($.z1, $.z2);
      const hi = Math.max($.z1, $.z2);
      const za = $.side === 'between' ? lo : $.z1;
      const q = zQuestion($.side, za, hi);
      return { za, zb: hi, ...q };
    },
    valid: ($) => ($.side !== 'between' || $.zb - $.za >= 0.2) && $.exact > 0.002 && $.exact < 0.998,
    text: (T, $) => `Z is a standard normal random variable. Find ${$.side === 'left' ? `P(Z < ${fx($.za, 2)})` : $.side === 'right' ? `P(Z > ${fx($.za, 2)})` : `P(${fx($.za, 2)} < Z < ${fx($.zb, 2)})`}.`,
    parts: [prob('p', ($) => $.exact, { alt: ($) => [$.table], label: 'Probability' })],
    hints: ['Table A.3 gives the area to the LEFT of z.', 'Area to the right = 1 − area to the left. Area between = left area at the larger z − left area at the smaller z.'],
    steps: ($) => zSteps($.side, $.za, $.zb, $.side === 'left' ? String.raw`P(Z < ${fx($.za, 2)})` : $.side === 'right' ? String.raw`P(Z > ${fx($.za, 2)})` : String.raw`P(${fx($.za, 2)} < Z < ${fx($.zb, 2)})`),
    twin: { part: 'p', draw: (r, $) => { const z = r.normal(); return $.side === 'left' ? z < $.za : $.side === 'right' ? z > $.za : z > $.za && z < $.zb; } },
    cases: [kase('Notes Ex 6.2', { side: 'left', z1: 0.52, z2: 0.52 }, { p: 0.6985 }), kase('Walpole §6.3', { side: 'right', z1: 1.84, z2: 1.84 }, { p: 0.0329 }), kase('Walpole §6.3', { side: 'between', z1: -1.97, z2: 0.86 }, { p: 0.7807 })],
  }),

  problem({
    ...C6, id: 'c6.z-find', title: 'Finding z from an area', kind: 'numeric', topics: ['standard-normal', 'z-table', 'inverse'], src: 'Walpole §6.3',
    vars: { side: choice(['left', 'to the left'], ['right', 'to the right'], ['central', 'between −z and z']), a: range(0.02, 0.98, 0.01) },
    derive: ($) => {
      const leftArea = $.side === 'left' ? $.a : $.side === 'right' ? 1 - $.a : (1 + $.a) / 2;
      const t = zForArea(leftArea);
      return { leftArea, z: normInv(leftArea), zt: t };
    },
    valid: ($) => ($.side !== 'central' || $.a >= 0.5) && Math.abs($.z) > 0.03,
    text: (T, $) =>
      $.side === 'central'
        ? `Find z such that P(−z < Z < z) = ${fx($.a, 2)}.`
        : `Find z such that the area under the standard normal curve ${$.side === 'left' ? 'to the left' : 'to the right'} of z is ${fx($.a, 2)}.`,
    parts: [num('z', ($) => $.z, { alt: ($) => $.zt.values, tol: 0, abs: 0.006, label: '$z$', traps: [[($) => -$.z, 'Wrong side of 0: check whether the area is to the left or to the right.']] })],
    hints: ['Table A.3 lists areas to the left. Turn the area you are given into an area to the left first.', 'Then find that area in the body of the table and read z from the row and column.', String.raw`For $P(-z < Z < z) = a$, the area to the left of $z$ is $a + \frac{1 - a}{2}$.`],
    steps: ($) => {
      const out = [];
      if ($.side === 'right') out.push(String.raw`Area to the left of $z$: $1 - ${fx($.a, 2)} = ${fx($.leftArea, 4)}$`);
      if ($.side === 'central') out.push(String.raw`Each tail holds $\dfrac{1 - ${fx($.a, 2)}}{2} = ${fx((1 - $.a) / 2, 4)}$, so the area to the left of $z$ is $${fx($.leftArea, 4)}$`);
      out.push($.zt.tie ? String.raw`Table A.3: $${fx($.leftArea, 4)}$ falls halfway between the entries at $z = ${fx($.zt.values[1], 2)}$ and $${fx($.zt.values[2], 2)}$, so $z = ${$.zt.z}$` : String.raw`Table A.3: the entry closest to $${fx($.leftArea, 4)}$ is at $z = ${fx($.zt.z, 2)}$`);
      out.push(String.raw`$z = ${fx($.zt.z, $.zt.tie ? 3 : 2)}$ (exact: $${fx($.z, 4)}$; TI-84 invNorm(${fx($.leftArea, 4)}))`);
      return out;
    },
    cases: [kase('Walpole §6.3', { side: 'right', a: 0.3015 }, { z: 0.52 })],
  }),

  problem({
    ...C6, id: 'c6.z-alpha', title: 'The value of z_α', kind: 'numeric', topics: ['z-alpha', 'z-table'], src: 'Walpole §6.4',
    vars: { alpha: choice(...[0.2, 0.15, 0.1, 0.05, 0.04, 0.03, 0.025, 0.02, 0.01, 0.005].map((a) => [a, String(a)])) },
    derive: ($) => ({ z: zCrit($.alpha), look: zCritLook($.alpha) }),
    text: (T, $) => String.raw`Find $z_{${$.alpha}}$, the value with area ${$.alpha} to its right under the standard normal curve.`,
    parts: [num('z', ($) => $.z, { alt: ($) => $.look.values, tol: 0, abs: 0.006, label: String.raw`$z_{\alpha}$`, traps: [[($) => -$.z, String.raw`$z_\alpha$ has area $\alpha$ to its RIGHT, so it is positive for $\alpha < 0.5$.`], [($) => zCrit($.alpha / 2), String.raw`That is $z_{\alpha/2}$. $z_\alpha$ puts all of $\alpha$ in one tail.`]] })],
    hints: [String.raw`$z_\alpha$ has area $\alpha$ to its right, so the area to its left is $1 - \alpha$.`, 'Look up 1 − α in the body of Table A.3.'],
    steps: ($) => [String.raw`Area to the left of $z_{${$.alpha}}$: $1 - ${$.alpha} = ${fx(1 - $.alpha, 4)}$`, $.look.line, String.raw`Exact: $z_{${$.alpha}} = ${fx($.z, 4)}$`],
    cases: [kase('Notes Ex 6.5', { alpha: 0.1 }, { z: 1.28 }), kase('Walpole §6.4', { alpha: 0.05 }, { z: 1.645 }), kase('Walpole §6.4', { alpha: 0.025 }, { z: 1.96 })],
  }),

  // ----------------------------------------------------------------- general normal
  problem({
    ...C6, id: 'c6.normal-prob', title: 'Normal probabilities', kind: 'numeric', topics: ['normal', 'standardize', 'z-table'], src: 'Walpole §6.4',
    vars: { ctx: NORM, side: SIDE, k1: range(-2.8, 2.8, 0.05), k2: range(-2.8, 2.8, 0.05) },
    derive: ($) => {
      const c = ctxOf($.ctx);
      const xa = roundTo(c.mu + Math.min($.k1, $.k2) * c.sigma, c.dp);
      const xb = roundTo(c.mu + Math.max($.k1, $.k2) * c.sigma, c.dp);
      const x1 = $.side === 'between' ? xa : roundTo(c.mu + $.k1 * c.sigma, c.dp);
      const z1 = (x1 - c.mu) / c.sigma;
      const z2 = (xb - c.mu) / c.sigma;
      const P = (z) => normCdf(z);
      const T = (z) => zTable(z).value;
      const exact = $.side === 'left' ? P(z1) : $.side === 'right' ? 1 - P(z1) : P(z2) - P(z1);
      const table = $.side === 'left' ? T(z1) : $.side === 'right' ? 1 - T(z1) : T(z2) - T(z1);
      return { c, x1, x2: xb, z1, z2, exact, table };
    },
    valid: ($) => ($.side !== 'between' || $.z2 - $.z1 >= 0.3) && $.exact > 0.003 && $.exact < 0.997 && $.x1 > 0,
    text: (T, $) => `${setup($)} Find the probability that a randomly chosen value is ${$.side === 'left' ? `less than ${$.x1}` : $.side === 'right' ? `more than ${$.x1}` : `between ${$.x1} and ${$.x2}`}${$.c.unit ? ` ${$.c.unit}` : ''}.`,
    parts: [prob('p', ($) => $.exact, { alt: ($) => [$.table], label: 'Probability' })],
    hints: [String.raw`Standardize: $z = \dfrac{x - \mu}{\sigma}$.`, 'Round z to two decimals and read the area to its left in Table A.3.', 'Right tail: 1 − that area. Between: subtract the two left areas.'],
    steps: ($) => {
      const zt = (x, z) => String.raw`$z = \dfrac{${x} - ${$.c.mu}}{${$.c.sigma}} = ${fx(z, 4)} \approx ${fx(zTable(z).z, 2)}$`;
      const ask = $.side === 'left' ? String.raw`P(X < ${$.x1})` : $.side === 'right' ? String.raw`P(X > ${$.x1})` : String.raw`P(${$.x1} < X < ${$.x2})`;
      const out = [zt($.x1, $.z1)];
      if ($.side === 'between') out.push(zt($.x2, $.z2));
      out.push(...zSteps($.side, $.z1, $.z2, ask));
      out.push(`Exact (TI-84 normalcdf): ${fx($.exact, 4)}. The small difference is the rounding of z.`);
      return out;
    },
    twin: { part: 'p', draw: (r, $) => { const x = r.normal($.c.mu, $.c.sigma); return $.side === 'left' ? x < $.x1 : $.side === 'right' ? x > $.x1 : x > $.x1 && x < $.x2; } },
    cases: [
      kase('Notes Ex 6.3(a)', { ctx: 'height', side: 'left', k1: (35 - 38.72) / 3.17, k2: 0 }, { p: 0.1203 }),
      kase('Notes Ex 6.4(a)', { ctx: 'run', side: 'between', k1: -6 / 9, k2: 1 }, { p: 0.5889 }),
      kase('Walpole §6.4', { ctx: 'battery', side: 'left', k1: -1.4, k2: -1.4 }, { p: 0.0808 }),
      kase('Walpole §6.4', { ctx: 'bulb', side: 'between', k1: -0.55, k2: 0.85 }, { p: 0.5111 }),
    ],
  }),

  problem({
    ...C6, id: 'c6.normal-percentile', title: 'Normal percentiles', kind: 'numeric', level: 2, topics: ['normal', 'inverse', 'z-table'], src: 'Walpole §6.3',
    vars: { ctx: NORM, side: choice(['left', 'below'], ['right', 'above']), p: range(0.02, 0.98, 0.01) },
    derive: ($) => {
      const c = ctxOf($.ctx);
      const leftArea = $.side === 'left' ? $.p : 1 - $.p;
      const t = zForArea(leftArea);
      return { c, leftArea, z: normInv(leftArea), zt: t, x: c.mu + c.sigma * normInv(leftArea), xt: t.values.map((z) => c.mu + c.sigma * z) };
    },
    valid: ($) => Math.abs($.z) > 0.03,
    text: (T, $) => `${setup($)} Find the value x that has ${Math.round($.p * 100)}% of the distribution ${$.side === 'left' ? 'below' : 'above'} it.`,
    parts: [num('x', ($) => $.x, { alt: ($) => $.xt, tol: 0, abs: ($) => 0.006 * ctxOf($.ctx).sigma + 0.5 * 10 ** -ctxOf($.ctx).dp, label: '$x$', unit: '', traps: [[($) => 2 * ctxOf($.ctx).mu - $.x, 'Wrong side of the mean: check whether the percentage is below or above x.']] })],
    hints: ['First turn the percentage into an area to the left of x.', 'Find that area in the body of Table A.3 and read z.', String.raw`Then un-standardize: $x = \mu + z\sigma$.`],
    steps: ($) => [
      $.side === 'right' ? String.raw`Area to the left of $x$: $1 - ${fx($.p, 2)} = ${fx($.leftArea, 4)}$` : String.raw`Area to the left of $x$: $${fx($.leftArea, 2)}$`,
      $.zt.tie ? String.raw`Table A.3: $${fx($.leftArea, 4)}$ is halfway between entries, so $z = ${$.zt.z}$` : String.raw`Table A.3: the entry closest to $${fx($.leftArea, 4)}$ is at $z = ${fx($.zt.z, 2)}$`,
      String.raw`$$x = \mu + z\sigma = ${$.c.mu} + (${$.zt.z})(${$.c.sigma}) = ${tn($.c.mu + $.zt.z * $.c.sigma, 6)}${$.c.unit ? String.raw`\ \text{${$.c.unit}}` : ''}$$`,
      `Exact (TI-84 invNorm(${fx($.leftArea, 4)}, ${$.c.mu}, ${$.c.sigma})): ${tn($.x, 6)}.`,
    ],
    cases: [
      kase('Notes Ex 6.3(b)', { ctx: 'height', side: 'left', p: 0.2 }, { x: 36.05 }),
      kase('Notes Ex 6.4(b), the fastest 10%', { ctx: 'run', side: 'left', p: 0.1 }, { x: 49.47 }),
      kase('Walpole §6.3', { ctx: 'x', side: 'right', p: 0.14 }, { x: 46.48 }),
    ],
  }),

  problem({
    ...C6, id: 'c6.normal-count', title: 'How many, out of N?', kind: 'numeric', topics: ['normal', 'z-table'], src: 'Walpole §6.4',
    vars: { ctx: NORM, N: choice([200, '200'], [500, '500'], [1000, '1,000'], [5000, '5,000']), k1: range(-2.5, 1, 0.05), k2: range(-1, 2.5, 0.05) },
    derive: ($) => {
      const c = ctxOf($.ctx);
      const xa = roundTo(c.mu + $.k1 * c.sigma, c.dp);
      const xb = roundTo(c.mu + $.k2 * c.sigma, c.dp);
      const z1 = (xa - c.mu) / c.sigma;
      const z2 = (xb - c.mu) / c.sigma;
      const exact = normCdf(z2) - normCdf(z1);
      const table = zTable(z2).value - zTable(z1).value;
      return { c, xa, xb, z1, z2, exact, table, n: $.N * exact, nt: $.N * table };
    },
    valid: ($) => $.z2 - $.z1 >= 0.4,
    text: (T, $) => `${setup($)} Of ${T.N} of them, about how many would you expect to be between ${$.xa} and ${$.xb}${$.c.unit ? ` ${$.c.unit}` : ''}?`,
    parts: [num('n', ($) => $.n, { alt: ($) => [$.nt, Math.round($.nt), Math.round($.n)], tol: 0, abs: 0.6, altGap: ($) => 0.005 * $.N, label: 'Expected number', traps: [[($) => $.exact, 'That is the probability. Multiply it by the number of items.']] })],
    hints: ['Find the probability that one value falls in the range, as usual.', 'Expected number = N × probability.'],
    steps: ($) => [
      String.raw`$z_1 = \dfrac{${$.xa} - ${$.c.mu}}{${$.c.sigma}} = ${fx(zTable($.z1).z, 2)}$, $z_2 = \dfrac{${$.xb} - ${$.c.mu}}{${$.c.sigma}} = ${fx(zTable($.z2).z, 2)}$`,
      ...zSteps('between', $.z1, $.z2, String.raw`P(${$.xa} < X < ${$.xb})`),
      String.raw`Expected number $= ${$.N} \times ${fx($.table, 4)} = ${tn($.nt, 5)} \approx ${Math.round($.nt)}$`,
    ],
    cases: [],
  }),

  // ----------------------------------------------------------------- assessing normality
  problem({
    ...C6, id: 'c6.normal-plot', title: 'Reading a normal probability plot', kind: 'conceptual', level: 2, topics: ['normal-probability-plot', 'assessing-normality'], src: 'Notes §6.3',
    vars: {
      shape: choice(['normal', 'normal'], ['right', 'right-skewed'], ['left', 'left-skewed'], ['heavy', 'heavy-tailed']),
      xs: data((rand, v) => {
        for (let tries = 0; tries < 200; tries++) {
          const r = createRng(Math.floor(rand() * 2 ** 31));
          const n = 36;
          const draw = { normal: () => r.normal(50, 8), right: () => 40 + r.gamma(1.2, 9), left: () => 90 - r.gamma(1.2, 9), heavy: () => 50 + 5 * r.t(2) }[v.shape];
          const xs = Array.from({ length: n }, () => Number(draw().toFixed(1)));
          const { skew, kurt } = shapeStats(xs);
          const ok = { normal: Math.abs(skew) < 0.25 && Math.abs(kurt) < 0.5, right: skew > 1.1, left: skew < -1.1, heavy: kurt > 3 && Math.abs(skew) < 0.6 }[v.shape];
          if (ok) return xs;
        }
        return null;
      }),
    },
    derive: ($) => ({ ok: !!$.xs }),
    valid: ($) => $.ok,
    text: () => 'The normal probability plot below (theoretical quantiles z on the horizontal axis, the sorted data on the vertical, as in the notes) is for a sample of 36 measurements. What does it suggest about the population?',
    figure: ($) => nppSVG($.xs),
    parts: [
      mc('shape', [
        ['normal', 'The points lie close to a straight line: a normal model is reasonable'],
        ['right', 'The points curve upward, away from the line at the high end: the data are skewed right'],
        ['left', 'The points curve downward, away from the line at the low end: the data are skewed left'],
        ['heavy', 'The points leave the line at both ends (low end below, high end above): the tails are heavier than normal'],
      ], ($) => $.shape),
    ],
    hints: ['If the data came from a normal population, the points would fall close to a straight line.', 'Look at where the pattern leaves the line: one end only (skew) or both ends (tails).', 'With the data on the vertical axis, a long right tail shows as the largest values sitting far above the line.'],
    steps: ($) =>
      [
        {
          normal: 'The points follow a straight line from end to end, with only small random wiggles. Nothing suggests the population is not normal.',
          right: 'The largest values are much bigger than a normal sample’s would be, so the right end of the plot curves up, away from the line. That is a long right tail: the data are skewed right, and a normal model is not reasonable.',
          left: 'The smallest values are much smaller than a normal sample’s would be, so the left end of the plot curves down, away from the line. That is a long left tail: the data are skewed left, and a normal model is not reasonable.',
          heavy: 'Both ends leave the line: the smallest values fall below it and the largest rise above it, farther out than a normal sample’s. The tails are heavier than normal, so a normal model is not reasonable.',
        }[$.shape],
        'Small samples always wiggle a little. Judge the overall pattern, not single points.',
      ],
    cases: [],
  }),
  problem({
    ...C6, id: 'c6.normal-scores', title: 'Building a normal probability plot', kind: 'numeric', level: 2, topics: ['normal-probability-plot', 'assessing-normality'], src: 'Notes Ex 6.6',
    vars: {
      n: range(5, 8, 1),
      k: range(2, 7, 1),
      xs: data((rand, v) => {
        const r = createRng(Math.floor(rand() * 2 ** 31));
        return Array.from({ length: v.n }, () => Number(r.normal(32, 0.5).toFixed(2)));
      }),
    },
    derive: ($) => {
      const zs = normalScores($.n);
      const s = sorted($.xs);
      return { zs, s, z1: zs[0], zk: zs[$.k - 1], area1: 0.5 / $.n, areak: ($.k - 0.5) / $.n, look1: zForArea(0.5 / $.n), lookk: zForArea(($.k - 0.5) / $.n) };
    },
    valid: ($) => $.k <= $.n && new Set($.xs).size === $.n,
    text: (T, $) => `The finishing times (in seconds) of ${$.n} randomly selected races of a greyhound: ${$.xs.map((x) => x.toFixed(2)).join(', ')}. To draw a normal probability plot, find the theoretical quantile for the smallest time and for the ${ordinal($.k)} smallest.`,
    figure: ($) => nppSVG($.xs),
    parts: [
      num('z1', ($) => $.z1, { alt: ($) => $.look1.values, tol: 0, abs: 0.006, label: 'z for the smallest value', traps: [[($) => normInv(1 / ($.n + 1)), PLOTTING_POSITION]] }),
      num('zk', ($) => $.zk, { alt: ($) => $.lookk.values, tol: 0, abs: 0.006, label: ($T, $) => `z for the ${ordinal($.k)} smallest value`, traps: [[($) => normInv($.k / ($.n + 1)), PLOTTING_POSITION]] }),
    ],
    hints: ['Sort the data. The i-th smallest value is plotted against the theoretical quantile for rank i.', String.raw`$z_i = \Phi^{-1}\!\left(\dfrac{i - 0.5}{n}\right)$: the z with that area to its left (TI-84: invNorm).`],
    steps: ($) => [
      String.raw`Sorted: $${$.s.map((x) => x.toFixed(2)).join(String.raw`,\ `)}$, $n = ${$.n}$`,
      String.raw`$$z_1 = \Phi^{-1}\!\left(\dfrac{1 - 0.5}{${$.n}}\right) = \Phi^{-1}(${fx($.area1, 4)}) = ${fx($.z1, 3)}$$`,
      String.raw`$$z_{${$.k}} = \Phi^{-1}\!\left(\dfrac{${$.k} - 0.5}{${$.n}}\right) = \Phi^{-1}(${fx($.areak, 4)}) = ${fx($.zk, 3)}$$`,
      `All the quantiles: ${$.zs.map((z) => fx(z, 3)).join(', ')}. Plot each against its sorted value; points close to a straight line (as here) support a normal model.`,
    ],
    cases: [kase('Notes Ex 6.6', { n: 6, k: 4, xs: [31.35, 32.52, 32.06, 31.26, 31.91, 32.37] }, { z1: -1.383, zk: 0.21 })],
  }),

  problem({
    ...C6, id: 'c6.uniform-conditional', title: 'Uniform: intervals, conditions, single points', kind: 'numeric', level: 2, topics: ['uniform', 'conditional'], src: 'Notes Ex 6.1',
    vars: { a: range(0, 10, 1), len: range(4, 10, 1), u: range(1, 8, 1), e: range(2, 9, 1), f: range(1, 8, 1), g: range(1, 9, 1) },
    derive: ($) => {
      const b = $.a + $.len;
      const lo = $.a + $.u;
      const hi = lo + 1;
      const cut = $.a + $.e;
      const inner = $.a + $.f;
      return { b, lo, hi, cut, inner, pt: $.a + $.g, pBetween: 1 / $.len, pLess: $.e / $.len, pCond: $.f / $.e };
    },
    valid: ($) => $.hi <= $.b && $.cut < $.b && $.inner < $.cut && $.pt < $.b,
    text: (T, $) => `The annual increase in height of cedar trees is uniformly distributed between ${$.a} and ${$.b} inches. Let X be the growth of a randomly selected tree in a year.`,
    parts: [
      prob('between', ($) => $.pBetween, { label: ($T, $) => String.raw`$P(${$.lo} < X < ${$.hi})$` }),
      prob('less', ($) => $.pLess, { label: ($T, $) => String.raw`$P(X < ${$.cut})$` }),
      prob('cond', ($) => $.pCond, { label: ($T, $) => String.raw`$P(X < ${$.inner} \mid X < ${$.cut})$`, traps: [[($) => ($.inner - $.a) / $.len, String.raw`That ignores the condition. Given $X < c$, divide by $P(X < c)$.`]] }),
      prob('point', () => 0, { label: ($T, $) => `$P(X = ${$.pt})$`, traps: [[($) => 1 / $.len, 'That is the height of the density, not a probability. For a continuous X, a single value has probability 0.']] }),
    ],
    hints: [String.raw`$f(x) = \dfrac{1}{B - A}$ on $[A, B]$, so a probability is (width of the interval) ÷ (B − A).`, String.raw`$P(E \mid F) = \dfrac{P(E \cap F)}{P(F)}$. When one event implies the other, the intersection is just the smaller event.`, 'A continuous random variable takes any single value with probability 0.'],
    steps: ($) => [
      String.raw`$f(x) = \dfrac{1}{${$.b} - ${$.a}} = \dfrac{1}{${$.len}}$ for $${$.a} \le x \le ${$.b}$.`,
      String.raw`$P(${$.lo} < X < ${$.hi}) = \dfrac{${$.hi} - ${$.lo}}{${$.len}} = ${fx($.pBetween, 4)}$`,
      String.raw`$P(X < ${$.cut}) = \dfrac{${$.cut} - ${$.a}}{${$.len}} = ${fx($.pLess, 4)}$`,
      String.raw`$$P(X < ${$.inner} \mid X < ${$.cut}) = \dfrac{P(X < ${$.inner})}{P(X < ${$.cut})} = \dfrac{${$.inner - $.a}/${$.len}}{${$.cut - $.a}/${$.len}} = ${fx($.pCond, 4)}$$`,
      String.raw`$P(X = ${$.pt}) = 0$: a single point has no width, so no area.`,
    ],
    cases: [kase('Notes Ex 6.1', { a: 6, len: 5, u: 3, e: 2, f: 1, g: 1 }, { between: 0.2, less: 0.4, cond: 0.5, point: 0 })],
  }),

  problem({
    ...C6, id: 'c6.both-independent', title: 'Two independent normal outcomes', kind: 'numeric', level: 2, topics: ['normal', 'independence', 'product-rule'], src: 'Notes Ex 6.4(c)',
    vars: { ctx: NORM, k: range(-1.5, 1.5, 0.05) },
    derive: ($) => {
      const c = ctxOf($.ctx);
      const x = roundTo(c.mu + $.k * c.sigma, c.dp);
      const z = (x - c.mu) / c.sigma;
      const one = normCdf(z);
      const t1 = zTable(z).value;
      return { c, x, z, one, both: one * one, t1, tboth: t1 * t1 };
    },
    valid: ($) => Math.abs($.z) > 0.04,
    text: (T, $) => `${setup($)} Two values are chosen independently (say, Hailey's and Jack's results). Find the probability that one value is below ${$.x}${$.c.unit ? ` ${$.c.unit}` : ''}, and that both are.`,
    parts: [prob('one', ($) => $.one, { alt: ($) => [$.t1], label: ($T, $) => `$P(X < ${$.x})$` }), prob('both', ($) => $.both, { alt: ($) => [$.tboth], label: 'Both are below it', traps: [[($) => $.one, 'That is one value. Both, independently: multiply the two probabilities.']] })],
    hints: ['Standardize and find the probability for one value.', String.raw`Independent events: $P(A \cap B) = P(A)P(B)$.`],
    steps: ($) => [
      String.raw`$z = \dfrac{${$.x} - ${$.c.mu}}{${$.c.sigma}} = ${fx($.z, 4)} \approx ${fx(zTable($.z).z, 2)}$, so $P(X < ${$.x}) = ${fx($.t1, 4)}$ (exact $${fx($.one, 4)}$)`,
      String.raw`$$P(\text{both}) = P(X_1 < ${$.x})\,P(X_2 < ${$.x}) = (${fx($.t1, 4)})^2 = ${fx($.tboth, 4)}$$`,
    ],
    twin: { part: 'both', draw: (r, $) => r.normal($.c.mu, $.c.sigma) < $.x && r.normal($.c.mu, $.c.sigma) < $.x },
    cases: [kase('Notes Ex 6.4(c), both finish within an hour', { ctx: 'run', k: -1 / 9 }, { one: 0.4562, both: 0.2077 })],
  }),
];
