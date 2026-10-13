/**
 * The printed tables, read the way a student reads them (Appendix A of the textbook).
 *
 * Every lookup returns the value on the page and how it was found, so a worked solution can say
 * "Table A.4, ν = 10, α = 0.025: 2.228" beside the exact 2.2281. When the page cannot give the
 * value exactly (a df between rows, a z between entries), the lookup returns every value a careful
 * student could defensibly read, and the grader accepts any of them.
 *
 * - A.1 binomial and A.2 Poisson (cumulative, 4 dp) and A.3 z (area to the left, 4 dp) are
 *   exact values rounded; stats-check spot-checks them against the page.
 * - A.4 t, A.5 χ² and A.6 F are the printed numbers (tables-data.js), misprints and all.
 */
import { T_TABLE, CHI2_TABLE, F_TABLE } from './tables-data.js';
import { normCdf, binomCdf, poisCdf } from './dist.js';

const round = (x, dp) => Math.round(x * 10 ** dp + (x >= 0 ? 1e-9 : -1e-9)) / 10 ** dp;
const near = (a, b) => Math.abs(a - b) < 1e-9;

// ---------- A.3 z ----------

/** z rounded to the table's two decimals, halves away from zero, as students do. */
export const zRound = (z) => round(z, 2);

/** The printed Φ(z) for a z already on the table's grid. */
const zCell = (z) => round(normCdf(z), 4);

/**
 * Φ(z) read from Table A.3: round z to 2 dp, read 4 dp. Beyond ±3.49 the page runs out; the
 * student uses the last entry (0.0002 or 0.9998) or writes 0 or 1, and both are offered.
 */
export function zTable(z) {
  const zr = zRound(z);
  if (zr < -3.49) return { z: -3.49, value: zCell(-3.49), values: [zCell(-3.49), 0], off: true };
  if (zr > 3.49) return { z: 3.49, value: zCell(3.49), values: [zCell(3.49), 1], off: true };
  const v = zCell(zr);
  return { z: zr, value: v, values: [v], off: false };
}

/** Every (z, Φ) pair printed in Table A.3. */
export const Z_ENTRIES = (() => {
  const out = [];
  for (let i = -349; i <= 349; i++) out.push([i / 100, zCell(i / 100)]);
  return out;
})();

/**
 * Table A.3 read backwards: the z whose printed area is closest to `area`. When two entries are
 * equally close (0.9495 and 0.9505 for 0.95) the book's convention is the midpoint, z = 1.645;
 * either neighbour is also a defensible reading, so all three are offered.
 */
export function zForArea(area) {
  let best = Infinity;
  let hits = [];
  for (const [z, a] of Z_ENTRIES) {
    const d = Math.abs(a - area);
    if (d < best - 1e-12) {
      best = d;
      hits = [z];
    } else if (Math.abs(d - best) <= 1e-12) hits.push(z);
  }
  // A run of equal printed areas (0.9997 for z = 3.39…3.48): take its middle entry.
  if (hits.length > 2 || (hits.length === 2 && Math.abs(hits[1] - hits[0]) > 0.0101)) {
    const mid = hits[Math.floor(hits.length / 2)];
    return { z: mid, values: hits, tie: false };
  }
  if (hits.length === 2) {
    const mid = round((hits[0] + hits[1]) / 2, 3);
    return { z: mid, values: [mid, ...hits], tie: true };
  }
  return { z: hits[0], values: hits, tie: false };
}

/** z_alpha from the table (area alpha to the right). */
export const zCritTable = (alpha) => zForArea(1 - alpha);

// ---------- A.4 t, A.5 χ² ----------

function columnIndex(alphas, alpha) {
  return alphas.findIndex((a) => near(a, alpha));
}

/**
 * The row(s) a df lands on. An exact row is one value. Between rows (df = 35 lies between 30 and
 * 40) both neighbours are offered, the smaller df first: it is the conservative reading and the
 * one most instructors expect, but a student who takes the nearer row is not wrong.
 */
function rowsFor(dfs, df) {
  const i = dfs.findIndex((d) => d === df);
  if (i >= 0) return [i];
  if (df > dfs[dfs.length - 1]) return [dfs.length - 1];
  let j = dfs.findIndex((d) => d > df);
  if (j <= 0) return [0];
  return [j - 1, j];
}

function critFrom(table, alpha, df, name) {
  const c = columnIndex(table.alphas, alpha);
  if (c < 0) return { inTable: false, name, alpha, df, value: null, values: [] };
  const rows = rowsFor(table.dfs, df);
  const values = rows.map((r) => table.values[r][c]);
  return { inTable: true, name, alpha, df, rows: rows.map((r) => table.dfs[r]), value: values[0], values };
}

/** t_alpha(df) from Table A.4. `inTable` is false when alpha is not one of its columns. */
export const tTable = (alpha, df) => critFrom(T_TABLE, alpha, df, 'A.4');

/** χ²_alpha(df) from Table A.5 (df 1–30, 40, 50, 60). */
export const chi2Table = (alpha, df) => critFrom(CHI2_TABLE, alpha, df, 'A.5');

/**
 * Bracketing a statistic between two columns of a t or χ² row: what the page can say about a
 * p-value. The row's values grow as alpha shrinks, so a statistic past t_0.025 but short of
 * t_0.01 gives 0.01 < P(T > t) < 0.025, returned as { pLow: 0.01, pHigh: 0.025 }. `pLow` is
 * null past the last column (the tail is smaller than every printed alpha) and `pHigh` is null
 * before the first.
 */
function bracketFrom(table, stat, df) {
  const r = rowsFor(table.dfs, df)[0];
  const row = table.values[r];
  let pHigh = null;
  let pLow = null;
  for (let c = 0; c < table.alphas.length; c++) {
    if (row[c] <= stat) pHigh = table.alphas[c];
    else {
      pLow = table.alphas[c];
      break;
    }
  }
  return { df: table.dfs[r], pLow, pHigh };
}

/** For t ≥ 0: which printed alphas does P(T > t) fall between? */
export const tBracket = (t, df) => bracketFrom(T_TABLE, Math.abs(t), df);

/** For χ² ≥ 0: which printed alphas does P(χ² > x) fall between? */
export const chi2Bracket = (x, df) => bracketFrom(CHI2_TABLE, x, df);

// ---------- A.6 F ----------

/**
 * f_alpha(ν₁, ν₂) from Table A.6, which prints only alpha = 0.05 and 0.01. A lower point comes
 * from the reciprocal rule the course uses, f_(1−alpha)(ν₁, ν₂) = 1 / f_alpha(ν₂, ν₁).
 */
export function fTable(alpha, v1, v2) {
  const lower = alpha > 0.5;
  const a = lower ? 1 - alpha : alpha;
  const [n1, n2] = lower ? [v2, v1] : [v1, v2];
  const grid = F_TABLE.values[a] || (near(a, 0.05) ? F_TABLE.values[0.05] : near(a, 0.01) ? F_TABLE.values[0.01] : null);
  if (!grid) return { inTable: false, name: 'A.6', alpha, v1, v2, value: null, values: [] };
  const cols = rowsFor(F_TABLE.v1s, n1);
  const rows = rowsFor(F_TABLE.v2s, n2);
  const upper = [];
  for (const r of rows) for (const c of cols) upper.push(grid[r][c]);
  const values = lower ? upper.map((u) => 1 / u) : upper;
  return {
    inTable: true,
    name: 'A.6',
    alpha,
    v1,
    v2,
    reciprocal: lower ? { alpha: a, v1: n1, v2: n2, value: upper[0] } : null,
    value: values[0],
    values,
  };
}

// ---------- A.1 binomial, A.2 Poisson ----------

export const BINOM_NS = Array.from({ length: 20 }, (_, i) => i + 1);
export const BINOM_PS = [0.1, 0.2, 0.25, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9];
export const POIS_MUS = [
  0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5, 5.5, 6, 6.5, 7, 7.5, 8, 8.5, 9, 9.5,
  10, 11, 12, 13, 14, 15, 16, 17, 18,
];

/** Σ_{x=0}^{r} b(x; n, p) from Table A.1, or null when (n, p) is not printed. */
export function binomTable(r, n, p) {
  if (!BINOM_NS.includes(n) || !BINOM_PS.some((q) => near(q, p))) return null;
  return round(binomCdf(r, n, p), 4);
}

/** Σ_{x=0}^{r} p(x; μ) from Table A.2, or null when μ is not printed. */
export function poisTable(r, mu) {
  if (!POIS_MUS.some((m) => near(m, mu))) return null;
  return round(poisCdf(r, mu), 4);
}

export { T_TABLE, CHI2_TABLE, F_TABLE };
