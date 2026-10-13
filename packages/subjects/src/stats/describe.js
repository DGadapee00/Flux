/**
 * Chapter 1 summaries, computed the way the class computes them.
 *
 * Quartiles follow the teacher's notes, which use the TI-84's 1-Var Stats: Q1 and Q3 are the
 * medians of the lower and upper halves of the sorted data, and when n is odd the median itself
 * belongs to neither half. (Checked against her Example 1.6, n = 10, Q1 = 0.36, and Example 1.13,
 * n = 18, Q1 = 735, Q3 = 4668.) Other textbooks interpolate and get different quartiles; that
 * is a convention, not an error, so the notes say which one this is.
 */

export const sum = (xs) => xs.reduce((a, b) => a + b, 0);
export const mean = (xs) => sum(xs) / xs.length;
export const sorted = (xs) => [...xs].sort((a, b) => a - b);

/** Sample variance s² with n − 1. */
export function variance(xs) {
  const m = mean(xs);
  return xs.reduce((a, x) => a + (x - m) ** 2, 0) / (xs.length - 1);
}
export const sd = (xs) => Math.sqrt(variance(xs));

/** Population variance σ² with N. */
export function popVariance(xs) {
  const m = mean(xs);
  return xs.reduce((a, x) => a + (x - m) ** 2, 0) / xs.length;
}
export const popSd = (xs) => Math.sqrt(popVariance(xs));

/** Median of already sorted values. */
function medianSorted(s) {
  const n = s.length;
  if (!n) return NaN;
  return n % 2 ? s[(n - 1) / 2] : (s[n / 2 - 1] + s[n / 2]) / 2;
}

export const median = (xs) => medianSorted(sorted(xs));

/**
 * Five-number summary with the teacher's (TI-84) quartiles, plus where each came from, so a worked
 * solution can say "Q1 is the median of the lower 9 values: the 5th, 735".
 */
export function fiveNumber(xs) {
  const s = sorted(xs);
  const n = s.length;
  const half = Math.floor(n / 2);
  const lower = s.slice(0, half);
  const upper = s.slice(n % 2 ? half + 1 : half);
  return {
    n,
    sorted: s,
    min: s[0],
    q1: medianSorted(lower),
    median: medianSorted(s),
    q3: medianSorted(upper),
    max: s[n - 1],
    lower,
    upper,
  };
}

/** IQR, 1.5·IQR fences, outliers, and where the whiskers end (the teacher's box plot, Step 4). */
export function boxPlot(xs) {
  const f = fiveNumber(xs);
  const iqr = f.q3 - f.q1;
  const lowerFence = f.q1 - 1.5 * iqr;
  const upperFence = f.q3 + 1.5 * iqr;
  const inside = f.sorted.filter((x) => x >= lowerFence && x <= upperFence);
  return {
    ...f,
    iqr,
    lowerFence,
    upperFence,
    outliers: f.sorted.filter((x) => x < lowerFence || x > upperFence),
    whiskerLow: inside[0],
    whiskerHigh: inside[inside.length - 1],
  };
}

export const range = (xs) => Math.max(...xs) - Math.min(...xs);

/**
 * The mode(s). Returns [] when every value occurs equally often ("no mode", as in the notes'
 * Example 1.9), and every tied value when more than one is most frequent (bimodal).
 */
export function modes(xs) {
  const counts = new Map();
  for (const x of xs) counts.set(x, (counts.get(x) || 0) + 1);
  const top = Math.max(...counts.values());
  if (counts.size > 1 && [...counts.values()].every((c) => c === top)) return [];
  if (counts.size === 1) return [xs[0]];
  return [...counts.entries()].filter(([, c]) => c === top).map(([v]) => v);
}

/**
 * Stem-and-leaf rows. `unit` is the leaf's place value (0.1 for data like 3.4 → stem 3, leaf 4).
 * With `split`, each stem is written twice, leaves 0–4 on the first line (★) and 5–9 on the
 * second (·), as in the notes' double-stem plot.
 */
export function stemLeaf(xs, { unit = 1, split = false } = {}) {
  const scaled = xs.map((x) => Math.round(x / unit));
  const rows = new Map();
  for (const v of scaled) {
    const stem = Math.floor(v / 10);
    const leaf = v - 10 * stem;
    const key = split ? `${stem}${leaf < 5 ? '★' : '·'}` : `${stem}`;
    const order = split ? stem * 2 + (leaf < 5 ? 0 : 1) : stem;
    if (!rows.has(key)) rows.set(key, { stem, key, order, leaves: [] });
    rows.get(key).leaves.push(leaf);
  }
  // Empty stems in the middle still get a row.
  const list = [...rows.values()].sort((a, b) => a.order - b.order);
  if (!list.length) return [];
  const out = [];
  for (let o = list[0].order; o <= list[list.length - 1].order; o++) {
    const hit = list.find((r) => r.order === o);
    const stem = split ? Math.floor(o / 2) : o;
    const key = split ? `${stem}${o % 2 ? '·' : '★'}` : `${stem}`;
    out.push({ stem, key, leaves: hit ? hit.leaves.sort((a, b) => a - b) : [] });
  }
  return out.map((r) => ({ ...r, frequency: r.leaves.length }));
}

/**
 * A frequency distribution with classes [start, start + width), written the notes' way as
 * "1.5 – 1.9" when the data are recorded to `dp` decimals. Midpoint and relative frequency too.
 */
export function frequencyTable(xs, { start, width, classes, dp = 1 }) {
  const step = 10 ** -dp;
  const rows = [];
  for (let k = 0; k < classes; k++) {
    const lo = start + k * width;
    const hi = lo + width - step;
    const f = xs.filter((x) => x >= lo - step / 2 && x <= hi + step / 2).length;
    rows.push({ lo: round(lo, dp), hi: round(hi, dp), mid: round((lo + hi) / 2, dp + 1), f, rel: f / xs.length });
  }
  return rows;
}

function round(x, dp) {
  return Math.round(x * 10 ** dp) / 10 ** dp;
}

/** Least squares line and the pieces a worked solution shows (Ch 10). */
export function regression(xs, ys) {
  const n = xs.length;
  const xb = mean(xs);
  const yb = mean(ys);
  let sxx = 0;
  let sxy = 0;
  let syy = 0;
  for (let i = 0; i < n; i++) {
    sxx += (xs[i] - xb) ** 2;
    sxy += (xs[i] - xb) * (ys[i] - yb);
    syy += (ys[i] - yb) ** 2;
  }
  const b1 = sxy / sxx;
  const b0 = yb - b1 * xb;
  const sse = syy - b1 * sxy;
  return { n, xb, yb, sxx, sxy, syy, b0, b1, sse, r: sxy / Math.sqrt(sxx * syy), r2: 1 - sse / syy, s2: sse / (n - 2) };
}
