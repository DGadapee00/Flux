/**
 * The statistics self-test. Runs first in `npm test`: no problem generator may depend on a
 * distribution function until it has passed this.
 *
 * 1. Published values: critical values and probabilities quoted in every statistics text,
 *    written here as numbers, not computed from the code under test.
 * 2. Internal consistency: cdf(quantile(p)) = p, pdfs integrate to 1, pmfs sum to 1, and the
 *    identities the course leans on (t → z, F(1, ν) = t², the F reciprocal rule).
 * 3. The printed tables: every t, χ² and F entry on the page against the exact value. An entry
 *    off by more than its rounding is a misprint; the known ones are listed in PRINTED_ERRATA
 *    with the exact value, and anything new fails the check.
 * 4. Spot checks of the computed tables (z, binomial, Poisson) against numbers read off the page.
 * 5. The teacher's own examples for quartiles and the box plot.
 * 6. The random number generator: seeded moments within 4 standard errors, and reproducibility.
 */
import * as D from '../src/stats/dist.js';
import * as TB from '../src/stats/tables.js';
import * as S from '../src/stats/describe.js';
import { createRng } from '../src/stats/rng.js';
import * as I from '../src/stats/infer.js';

let fails = 0;
let checks = 0;
const err = (what, msg) => {
  fails++;
  console.log(`FAIL ${what}: ${msg}`);
};
function close(what, got, want, tol) {
  checks++;
  if (!(Math.abs(got - want) <= tol)) err(what, `got ${got}, want ${want} (±${tol})`);
}
function same(what, got, want) {
  checks++;
  const g = JSON.stringify(got);
  const w = JSON.stringify(want);
  if (g !== w) err(what, `got ${g}, want ${w}`);
}

// ---------------------------------------------------------------- 1. published values
// Six or more significant figures from standard references (NIST/SEMATECH e-Handbook tables,
// Abramowitz & Stegun), cross-checked with SciPy 1.x, so each is checked far tighter than any
// table rounds.
const PUBLISHED = [
  ['z_0.10', () => D.zCrit(0.1), 1.281552],
  ['z_0.05', () => D.zCrit(0.05), 1.644854],
  ['z_0.025', () => D.zCrit(0.025), 1.959964],
  ['z_0.01', () => D.zCrit(0.01), 2.326348],
  ['z_0.005', () => D.zCrit(0.005), 2.575829],
  ['z_0.0005', () => D.zCrit(0.0005), 3.290527],
  ['Φ(1)', () => D.normCdf(1), 0.841345],
  ['Φ(−1.96)', () => D.normCdf(-1.96), 0.024998],
  ['Φ(2.33)', () => D.normCdf(2.33), 0.990097],
  ['Φ(−3)', () => D.normCdf(-3), 0.0013499],
  ['P(Z > 6)', () => D.normSf(6) * 1e9, 0.9865876],
  ['t_0.025,10', () => D.tCrit(0.025, 10), 2.228139],
  ['t_0.05,5', () => D.tCrit(0.05, 5), 2.015048],
  ['t_0.005,20', () => D.tCrit(0.005, 20), 2.84534],
  ['t_0.025,1', () => D.tCrit(0.025, 1), 12.7062047],
  ['t_0.005,1', () => D.tCrit(0.005, 1), 63.65674],
  ['t_0.05,30', () => D.tCrit(0.05, 30), 1.697261],
  ['t_0.01,120', () => D.tCrit(0.01, 120), 2.357825],
  ['χ²_0.05,10', () => D.chi2Crit(0.05, 10), 18.307038],
  ['χ²_0.95,10', () => D.chi2Crit(0.95, 10), 3.940299],
  ['χ²_0.025,1', () => D.chi2Crit(0.025, 1), 5.023886],
  ['χ²_0.995,1', () => D.chi2Crit(0.995, 1) * 1e5, 3.927042],
  ['χ²_0.01,30', () => D.chi2Crit(0.01, 30), 50.892181],
  ['F_0.05(5,10)', () => D.fCrit(0.05, 5, 10), 3.325835],
  ['F_0.05(10,5)', () => D.fCrit(0.05, 10, 5), 4.735063],
  ['F_0.01(3,20)', () => D.fCrit(0.01, 3, 20), 4.938193],
  ['F_0.05(1,1)', () => D.fCrit(0.05, 1, 1), 161.447639],
  ['F_0.01(8,15)', () => D.fCrit(0.01, 8, 15), 4.0044532],
  ['b(3; 10, 0.5)', () => D.binomPmf(3, 10, 0.5), 0.1171875],
  ['B(3; 10, 0.3)', () => D.binomCdf(3, 10, 0.3), 0.6496107],
  ['P(X ≤ 2; μ = 1)', () => D.poisCdf(2, 1), 0.9196986],
  ['p(5; μ = 4.5)', () => D.poisPmf(5, 4.5), 0.1708269],
  ['g(3; 0.2)', () => D.geomPmf(3, 0.2), 0.128],
  ['h(2; 10, 5, 3)', () => D.hyperPmf(2, 10, 5, 3), 5 / 12],
  ['H(1; 10, 3, 5)', () => D.hyperCdf(1, 10, 3, 5), 0.5],
  ['H(2; 20, 5, 4)', () => D.hyperCdf(2, 20, 5, 4), 15008 / 15504],
  ['exponential cdf, x = 2, β = 4', () => D.expCdf(2, 4), 0.39346934],
  ['exponential pdf, x = 1, β = 2', () => D.expPdf(1, 2), 0.30326533],
  ['C(10, 3)', () => D.choose(10, 3), 120],
  ['10P3', () => D.perm(10, 3), 720],
];
for (const [name, fn, want] of PUBLISHED) close(name, fn(), want, Math.max(1e-6, Math.abs(want) * 2e-7));

// ---------------------------------------------------------------- 2. consistency
for (const p of [1e-6, 0.001, 0.025, 0.3, 0.5, 0.77, 0.975, 0.999999]) {
  close(`Φ(Φ⁻¹(${p}))`, D.normCdf(D.normInv(p)), p, 1e-13 + p * 1e-12);
}
for (const df of [1, 2, 3, 5, 10, 29, 30, 60, 120, 1000]) {
  for (const a of [0.4, 0.1, 0.025, 0.005, 0.0005]) {
    close(`t sf(t_${a},${df})`, D.tSf(D.tCrit(a, df), df), a, a * 1e-9);
    close(`χ² sf(χ²_${a},${df})`, D.chi2Sf(D.chi2Crit(a, df), df), a, a * 1e-9);
    close(`χ² sf(χ²_${1 - a},${df})`, D.chi2Sf(D.chi2Crit(1 - a, df), df), 1 - a, 1e-9);
  }
}
for (const [d1, d2] of [[1, 1], [2, 7], [5, 10], [10, 5], [12, 30], [24, 120]]) {
  for (const a of [0.05, 0.01]) {
    close(`F sf(f_${a}(${d1},${d2}))`, D.fSf(D.fCrit(a, d1, d2), d1, d2), a, a * 1e-9);
    // f_{1−α}(ν₁, ν₂) = 1 / f_α(ν₂, ν₁): the rule the course uses for a lower F point.
    close(`F reciprocal (${d1},${d2})`, D.fCrit(1 - a, d1, d2), 1 / D.fCrit(a, d2, d1), 1e-9);
  }
}
for (const df of [3, 10, 25]) close(`F(1,${df}) = t²`, D.fCrit(0.05, 1, df), D.tCrit(0.025, df) ** 2, 1e-8);
close('t → z', D.tCrit(0.025, 1e7), D.zCrit(0.025), 1e-6);
close('t∞ = z', D.tCrit(0.025, Infinity), 1.959964, 1e-6);

/** Simpson's rule, for checking that a density integrates to 1. */
function integrate(f, a, b, n = 20000) {
  const h = (b - a) / n;
  let s = f(a) + f(b);
  for (let i = 1; i < n; i++) s += (i % 2 ? 4 : 2) * f(a + i * h);
  return (s * h) / 3;
}
close('∫ normal pdf', integrate(D.normPdf, -12, 12), 1, 1e-10);
close('∫ t pdf (df 5)', integrate((x) => D.tPdf(x, 5), -2000, 2000, 400000), 1, 2e-6);
close('∫ χ² pdf (df 6)', integrate((x) => D.chi2Pdf(x, 6), 0, 200), 1, 1e-8);
close('∫ F pdf (4, 12)', integrate((x) => D.fPdf(x, 4, 12), 0, 400, 400000), 1, 1e-5);
close('t cdf vs ∫ pdf', integrate((x) => D.tPdf(x, 7), 0, 1.5), D.tCdf(1.5, 7) - 0.5, 1e-10);
close('χ² cdf vs ∫ pdf', integrate((x) => D.chi2Pdf(x, 5), 0, 4.2), D.chi2Cdf(4.2, 5), 1e-9);
close('F cdf vs ∫ pdf', integrate((x) => D.fPdf(x, 6, 9), 0, 2.3), D.fCdf(2.3, 6, 9), 1e-9);
let pm = 0;
for (let x = 0; x <= 30; x++) pm += D.binomPmf(x, 30, 0.37);
close('Σ binomial pmf', pm, 1, 1e-12);
pm = 0;
for (let x = 0; x <= 200; x++) pm += D.poisPmf(x, 17.5);
close('Σ Poisson pmf', pm, 1, 1e-12);
close('geometric cdf', D.geomCdf(4, 0.3), [1, 2, 3, 4].reduce((a, x) => a + D.geomPmf(x, 0.3), 0), 1e-14);

// ---------------------------------------------------------------- 3. printed tables vs exact
/**
 * Entries where the page disagrees with the exact value by more than its rounding. Each is a
 * misprint in the book's tables (or a value the book rounds differently); the grader accepts
 * both the printed and the exact value, and a worked solution quotes the printed one.
 * Key: `table|alpha|df` (F: `F|alpha|v1|v2`), value: the exact value to 4 significant figures.
 */
const PRINTED_ERRATA = {
  't|0.0005|1': 636.619, // printed 636.578
  // The α = 0.001 χ² column drifts by a little over one unit in the last place.
  'χ²|0.001|13': 34.5282, // printed 34.527
  'χ²|0.001|19': 43.8202, // printed 43.819
  'χ²|0.001|21': 46.797, // printed 46.796
  'χ²|0.001|27': 55.476, // printed 55.475
  'χ²|0.001|30': 59.7031, // printed 59.702
  'χ²|0.001|40': 73.402, // printed 73.403
};

const found = [];
function checkEntry(key, printed, exact, dp) {
  checks++;
  // One unit in the last printed place. The book rounds some entries the other way at a half
  // (12.832 for 12.8325) and truncates much of the χ² 0.001 column; a student who reads either
  // is within table precision. Anything further off is a misprint.
  const tol = 10 ** -dp + 1e-9;
  if (Math.abs(printed - exact) > tol) found.push([key, printed, exact]);
}
const T = TB.T_TABLE;
T.dfs.forEach((df, r) =>
  T.alphas.forEach((a, c) => checkEntry(`t|${a}|${df}`, T.values[r][c], D.tCrit(a, df), 3)),
);
const C = TB.CHI2_TABLE;
C.dfs.forEach((df, r) =>
  C.alphas.forEach((a, c) => {
    const v = C.values[r][c];
    // Values under 0.1 are printed to 3 significant figures (0.0⁴393, 0.0158); the rest to 3 decimals.
    const dp = v < 0.1 ? 2 - Math.floor(Math.log10(v)) : 3;
    checkEntry(`χ²|${a}|${df}`, v, D.chi2Crit(a, df), dp);
  }),
);
const F = TB.F_TABLE;
for (const a of F.alphas) {
  F.v2s.forEach((v2, r) => F.v1s.forEach((v1, c) => checkEntry(`F|${a}|${v1}|${v2}`, F.values[a][r][c], D.fCrit(a, v1, v2), 2)));
}
const unexplained = found.filter(([key]) => !(key in PRINTED_ERRATA));
if (process.argv.includes('--errata')) {
  for (const [key, printed, exact] of found) console.log(`  '${key}': ${Number(exact.toPrecision(6))}, // printed ${printed}`);
}
for (const [key, printed, exact] of unexplained) err('printed table', `${key}: page says ${printed}, exact ${exact.toPrecision(7)}`);
for (const key of Object.keys(PRINTED_ERRATA)) {
  if (!found.some(([k]) => k === key)) err('PRINTED_ERRATA', `${key} is listed but the page agrees with the exact value`);
}

// ---------------------------------------------------------------- 4. computed tables vs the page
// Read off the class's copy of Appendix A.
const Z_PAGE = [[-3.49, 0.0002], [-3.4, 0.0003], [-1.96, 0.025], [-1.0, 0.1587], [-0.53, 0.2981], [0, 0.5], [0.53, 0.7019], [1.0, 0.8413], [1.64, 0.9495], [1.65, 0.9505], [2.33, 0.9901], [2.57, 0.9949], [2.58, 0.9951], [3.49, 0.9998]];
for (const [z, v] of Z_PAGE) same(`Table A.3 z = ${z}`, TB.zTable(z).value, v);
same('z table: 1.234 reads as 1.23', TB.zTable(1.234).z, 1.23);
same('z table: −1.235 reads as −1.24', TB.zTable(-1.235).z, -1.24);
same('z_0.05 from the table', TB.zCritTable(0.05).z, 1.645);
same('z_0.025 from the table', TB.zCritTable(0.025).z, 1.96);
same('z_0.01 from the table', TB.zCritTable(0.01).z, 2.33);
same('z_0.005 from the table', TB.zCritTable(0.005).z, 2.575);
const BIN_PAGE = [[3, 10, 0.3, 0.6496], [10, 20, 0.5, 0.5881], [6, 15, 0.4, 0.6098], [0, 5, 0.9, 0], [2, 7, 0.8, 0.0047], [8, 18, 0.25, 0.9807], [12, 19, 0.7, 0.3345]];
for (const [r, n, p, v] of BIN_PAGE) same(`Table A.1 n=${n} p=${p} r=${r}`, TB.binomTable(r, n, p), v);
same('Table A.1 is only n ≤ 20', TB.binomTable(3, 25, 0.3), null);
const POIS_PAGE = [[5, 4.5, 0.7029], [20, 18, 0.7307], [1, 0.7, 0.8442], [0, 2.5, 0.0821], [9, 7.5, 0.7764], [13, 10, 0.8645]];
for (const [r, mu, v] of POIS_PAGE) same(`Table A.2 μ=${mu} r=${r}`, TB.poisTable(r, mu), v);

// The lookups themselves
same('t table row 10, α 0.025', TB.tTable(0.025, 10).value, 2.228);
same('t table df 35 offers rows 30 and 40', TB.tTable(0.05, 35).values, [1.697, 1.684]);
same('t table df 500 reads the 120 row and ∞', TB.tTable(0.05, 500).values, [1.658, 1.645]);
same('t table has no α = 0.03', TB.tTable(0.03, 10).inTable, false);
same('χ² table row 10, α 0.05', TB.chi2Table(0.05, 10).value, 18.307);
same('F table f_0.05(5,10)', TB.fTable(0.05, 5, 10).value, 3.33);
same('F table f_0.95(10,5) = 1/f_0.05(5,10)', TB.fTable(0.95, 10, 5).value, 1 / 3.33);
same('F table f_0.01(3,20)', TB.fTable(0.01, 3, 20).value, 4.94);
same('F table has no α = 0.025', TB.fTable(0.025, 5, 10).inTable, false);
same('t bracket: 2.5 on 10 df', TB.tBracket(2.5, 10), { df: 10, pLow: 0.015, pHigh: 0.02 });
same('t bracket: 0.1 on 10 df', TB.tBracket(0.1, 10), { df: 10, pLow: 0.4, pHigh: null });
same('t bracket: 5 on 10 df', TB.tBracket(5, 10), { df: 10, pLow: null, pHigh: 0.0005 });
same('χ² bracket: 20 on 10 df', TB.chi2Bracket(20, 10), { df: 10, pLow: 0.025, pHigh: 0.05 });

// ---------------------------------------------------------------- 5. the teacher's examples
const noNitrogen = [0.32, 0.53, 0.28, 0.37, 0.47, 0.43, 0.36, 0.42, 0.38, 0.43];
close('Ex 1.6 x̄', S.mean(noNitrogen), 0.399, 1e-12);
close('Ex 1.6 median', S.median(noNitrogen), 0.4, 1e-12);
close('Ex 1.6 s (TI Sx)', S.sd(noNitrogen), 0.0727934674, 1e-9);
close('Ex 1.6 σ (TI σx)', S.popSd(noNitrogen), 0.0690579467, 1e-9);
close('Ex 1.6 Q1 (TI)', S.fiveNumber(noNitrogen).q1, 0.36, 1e-12);
const nitrogen = [0.26, 0.43, 0.47, 0.49, 0.52, 0.75, 0.79, 0.86, 0.62, 0.46];
close('Ex 1.11 s', S.sd(nitrogen), 0.187, 0.0005);
const claims = [6751, 9908, 3461, 2336, 21147, 2332, 189, 1185, 370, 1414, 4668, 1953, 10034, 735, 802, 618, 180, 1657];
const bp = S.boxPlot(claims);
same('Ex 1.13 Q1', bp.q1, 735);
same('Ex 1.13 Q2', bp.median, 1805);
same('Ex 1.13 Q3', bp.q3, 4668);
same('Ex 1.14 IQR', bp.iqr, 3933);
close('Ex 1.14 lower fence', bp.lowerFence, -5164.5, 1e-9);
close('Ex 1.14 upper fence', bp.upperFence, 10567.5, 1e-9);
same('Ex 1.14 outliers', bp.outliers, [21147]);
same('Ex 1.15 upper whisker', bp.whiskerHigh, 10034);
same('odd n: the median is in neither half', S.fiveNumber([1, 2, 3, 4, 5, 6, 7]).q1, 2);
same('Ex 1.8 mode', S.modes([0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 2, 3]), [0]);
same('Ex 1.9 no mode', S.modes([82, 77, 90, 71, 62, 68, 74, 84, 94, 88]), []);
const batteries = [2.2, 4.1, 3.5, 4.5, 3.2, 3.7, 3.0, 2.6, 3.4, 1.6, 3.1, 3.3, 3.8, 3.1, 4.7, 3.7, 2.5, 4.3, 3.4, 3.6, 2.9, 3.3, 3.9, 3.1, 3.3, 3.1, 3.7, 4.4, 3.2, 4.1, 1.9, 3.4, 4.7, 3.8, 3.2, 2.6, 3.9, 3.0, 4.2, 3.5];
same('Ex 1.5 stem-and-leaf frequencies', S.stemLeaf(batteries, { unit: 0.1 }).map((r) => r.frequency), [2, 5, 25, 8]);
same('Ex 1.5 double-stem frequencies', S.stemLeaf(batteries, { unit: 0.1, split: true }).map((r) => r.frequency), [2, 1, 4, 15, 10, 5, 3]);
same('Ex 1.5 frequency table', S.frequencyTable(batteries, { start: 1.5, width: 0.5, classes: 7 }).map((r) => r.f), [2, 1, 4, 15, 10, 5, 3]);

// ---------------------------------------------------------------- 6. random numbers
{
  const N = 200000;
  const moment = (name, draw, mu, sigma2) => {
    const r = createRng(`moments:${name}`);
    let s = 0;
    let s2 = 0;
    for (let i = 0; i < N; i++) {
      const x = draw(r);
      s += x;
      s2 += x * x;
    }
    const m = s / N;
    const v = s2 / N - m * m;
    close(`rng mean ${name}`, m, mu, 4 * Math.sqrt(sigma2 / N));
    // The variance's SE depends on the 4th moment; 5% is loose enough for every draw here and
    // still catches a wrong scale.
    close(`rng variance ${name}`, v, sigma2, 0.05 * sigma2);
  };
  moment('normal(10, 3)', (r) => r.normal(10, 3), 10, 9);
  moment('exponential(mean 2)', (r) => r.exponential(2), 2, 4);
  moment('gamma(0.5, 2)', (r) => r.gamma(0.5, 2), 1, 2);
  moment('gamma(3, 1.5)', (r) => r.gamma(3, 1.5), 4.5, 6.75);
  moment('chi2(7)', (r) => r.chi2(7), 7, 14);
  moment('t(10)', (r) => r.t(10), 0, 10 / 8);
  moment('binomial(20, 0.3)', (r) => r.binomial(20, 0.3), 6, 4.2);
  moment('binomial(200, 0.3)', (r) => r.binomial(200, 0.3), 60, 42);
  moment('poisson(4.5)', (r) => r.poisson(4.5), 4.5, 4.5);
  moment('geometric(0.2)', (r) => r.geometric(0.2), 5, 0.8 / 0.04);
  moment('uniform(2, 8)', (r) => r.uniform(2, 8), 5, 3);

  const a = createRng(42);
  const b = createRng(42);
  same('rng reproducible', [a.normal(), a.next(), a.binomial(50, 0.4)], [b.normal(), b.next(), b.binomial(50, 0.4)]);
  // Coverage of the 95% z interval from simulated normal samples: about 0.95.
  const r = createRng('coverage');
  let hit = 0;
  const M = 20000;
  for (let i = 0; i < M; i++) {
    let s = 0;
    for (let j = 0; j < 10; j++) s += r.normal(50, 4);
    const xb = s / 10;
    const half = (1.959964 * 4) / Math.sqrt(10);
    if (Math.abs(xb - 50) <= half) hit++;
  }
  close('simulated z-interval coverage', hit / M, 0.95, 4 * Math.sqrt((0.95 * 0.05) / M));
}

// ---------------------------------------------------------------- 7. inference (Ch 7–10)
{
  // Published: Montgomery's steam-usage data (the notes' Ex 10.1), ŷ = −6.33 + 9.21x.
  const tx = [21, 24, 32, 47, 50, 59, 68, 74, 62, 50, 41, 30];
  const uy = [185.79, 214.47, 288.03, 424.84, 454.58, 539.03, 621.55, 675.06, 562.03, 452.93, 369.95, 273.98];
  const R = I.linRegTest({ xs: tx, ys: uy, side: 'two' });
  // The text rounds intermediate sums, so its −6.33 is within 0.01 of the exact −6.3355.
  close('steam intercept', R.a, -6.33, 0.01);
  close('steam slope', R.b, 9.21, 0.005);
  // The regression t on r equals the slope's t = b / (s/√Sxx).
  close('LinRegTTest t = slope t', R.t, R.b / Math.sqrt(R.s2 / R.sxx), 1e-6 * Math.abs(R.t));

  // Duality: a two-sided test at α rejects exactly when the 100(1 − α)% interval misses the null value.
  const r = createRng('duality');
  for (let k = 0; k < 300; k++) {
    const n = 5 + r.int(40);
    const xbar = r.normal(50, 5);
    const s = 1 + 9 * r.next();
    const mu0 = xbar + r.normal(0, 3 * s / Math.sqrt(n));
    const conf = [0.9, 0.95, 0.99][r.int(3)];
    const a = 1 - conf;
    const agree = (what, p, lo, hi, v) => {
      checks++;
      const out = v < lo || v > hi;
      if ((p < a) !== out && Math.abs(p - a) > 1e-9) err(`duality ${what}`, `p = ${p}, interval (${lo}, ${hi}), null ${v}`);
    };
    const zt = I.zTest({ xbar, sigma: s, n, mu0, side: 'two' });
    const zi = I.zInterval({ xbar, sigma: s, n, conf });
    agree('z', zt.p, zi.lo, zi.hi, mu0);
    const tt = I.tTest({ xbar, s, n, mu0, side: 'two' });
    const ti = I.tInterval({ xbar, s, n, conf });
    agree('t', tt.p, ti.lo, ti.hi, mu0);
    const n2 = 5 + r.int(30);
    const x2 = r.normal(50, 5);
    const s2 = 1 + 9 * r.next();
    const pt = I.pooledTest({ x1: xbar, x2, s1: s, s2, n1: n, n2, side: 'two' });
    const pi = I.pooledInterval({ x1: xbar, x2, s1: s, s2, n1: n, n2, conf });
    agree('pooled', pt.p, pi.lo, pi.hi, 0);
    const wt = I.welchTest({ x1: xbar, x2, s1: s, s2, n1: n, n2, side: 'two' });
    const wi = I.welchInterval({ x1: xbar, x2, s1: s, s2, n1: n, n2, conf });
    agree('Welch', wt.p, wi.lo, wi.hi, 0);
    const ft = I.fTest({ s1sq: s * s, s2sq: s2 * s2, n1: n, n2, side: 'two' });
    const fi = I.fInterval({ s1sq: s * s, s2sq: s2 * s2, n1: n, n2, conf });
    agree('F', ft.p, fi.lo, fi.hi, 1);
  }

  // Simulation: tests reject a true H0 about α of the time, intervals cover about conf of the time.
  const M = 20000;
  const g = createRng('inference-sim');
  const sample = (n, mu, sig) => Array.from({ length: n }, () => g.normal(mu, sig));
  const rate = (name, hits, want) => close(name, hits / M, want, 4 * Math.sqrt((want * (1 - want)) / M));
  let rz = 0, rt = 0, rp = 0, rw = 0, rpair = 0, rf = 0, cf = 0, cw = 0;
  for (let k = 0; k < M; k++) {
    const a = sample(8, 10, 2);
    const b = sample(12, 10, 2);
    const c = sample(6, 10, 5);
    if (I.zTest({ xbar: mean(a), sigma: 2, n: 8, mu0: 10, side: 'right' }).p < 0.05) rz++;
    if (I.tTest({ xbar: mean(a), s: sdOf(a), n: 8, mu0: 10, side: 'two' }).p < 0.05) rt++;
    if (I.pooledTest({ x1: mean(a), x2: mean(b), s1: sdOf(a), s2: sdOf(b), n1: 8, n2: 12, side: 'left' }).p < 0.05) rp++;
    if (I.welchTest({ x1: mean(a), x2: mean(c), s1: sdOf(a), s2: sdOf(c), n1: 8, n2: 6, side: 'two' }).p < 0.05) rw++;
    if (I.pairedTest({ xs: a, ys: a.map((x) => x + g.normal(0, 1)), side: 'two' }).p < 0.05) rpair++;
    if (I.fTest({ s1sq: variance(a), s2sq: variance(b), n1: 8, n2: 12, side: 'two' }).p < 0.1) rf++;
    const fi = I.fInterval({ s1sq: variance(a), s2sq: variance(c), n1: 8, n2: 6, conf: 0.9 });
    if (fi.lo <= 4 / 25 && fi.hi >= 4 / 25) cf++;
    const wi = I.welchInterval({ x1: mean(a), x2: mean(c), s1: sdOf(a), s2: sdOf(c), n1: 8, n2: 6, conf: 0.95 });
    if (wi.lo <= 0 && wi.hi >= 0) cw++;
  }
  rate('z test size (right, 0.05)', rz, 0.05);
  rate('t test size (two, 0.05)', rt, 0.05);
  rate('pooled t size (left, 0.05)', rp, 0.05);
  rate('paired t size (two, 0.05)', rpair, 0.05);
  rate('F test size (two, 0.10)', rf, 0.1);
  rate('F interval coverage (90%)', cf, 0.9);
  // Welch's df is an approximation: allow half a percentage point beyond sampling error.
  close('Welch t size (two, 0.05)', rw / M, 0.05, 0.005 + 4 * Math.sqrt(0.0475 / M));
  close('Welch interval coverage (95%)', cw / M, 0.95, 0.005 + 4 * Math.sqrt(0.0475 / M));
}

function mean(xs) {
  return xs.reduce((a, b) => a + b, 0) / xs.length;
}
function variance(xs) {
  const m = mean(xs);
  return xs.reduce((a, x) => a + (x - m) ** 2, 0) / (xs.length - 1);
}
function sdOf(xs) {
  return Math.sqrt(variance(xs));
}

console.log(`stats-check: ${checks} checks, ${found.length} printed-table misprints (${Object.keys(PRINTED_ERRATA).length} known)${fails ? `, ${fails} FAILED` : ', all passed'}`);
process.exit(fails ? 1 : 0);
