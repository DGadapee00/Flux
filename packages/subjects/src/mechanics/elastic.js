/**
 * Elastic curve of a slender beam. y is positive upward. The moment is the
 * sections.js moment: positive when the beam sags, so compression is on top.
 *
 * A sagging simple span has its lowest point at midspan, a local minimum of y,
 * so y'' is positive there. The sagging moment is positive too. The two signs
 * agree:
 *
 *   EI y'' = M
 *
 * A downward load therefore gives a negative y. `drop` below is the downward
 * distance, −y, so a readout can stay positive.
 *
 * Integration uses the trapezoid rule. A point load's moment is piecewise
 * linear, so the panels are split at the load. The simply supported correction
 * adds the rigid rotation that puts y back to zero at the far end. That
 * rotation does not change y''.
 */

/** Second moment of a rectangle about its centroidal axis parallel to the width. */
export const rectInertia = (b, h) => (b * h ** 3) / 12;

/**
 * Integrate EI y'' = M from a fixed left end, y(0) = y'(0) = 0.
 * `breaks` are stations where M kinks. The grid includes every one of them.
 */
export function integrateFixed(M, L, EI, n = 4000, breaks = []) {
  const raw = [0, L, ...breaks.filter((x) => x > 1e-9 && x < L - 1e-9)];
  raw.sort((a, b) => a - b);
  const marks = [raw[0]];
  for (const x of raw) if (x - marks[marks.length - 1] > 1e-9) marks.push(x);
  const xs = [0];
  for (let k = 0; k < marks.length - 1; k++) {
    const a = marks[k];
    const b = marks[k + 1];
    const panels = Math.max(2, Math.round((n * (b - a)) / L));
    for (let i = 1; i <= panels; i++) xs.push(a + ((b - a) * i) / panels);
  }
  const curv = xs.map((x) => M(x) / EI);
  const hStep = [];
  for (let i = 1; i < xs.length; i++) hStep.push(xs[i] - xs[i - 1]);
  const y = new Float64Array(xs.length);
  const slope = new Float64Array(xs.length);
  let th = 0;
  let v = 0;
  for (let i = 1; i < xs.length; i++) {
    const h = hStep[i - 1];
    const thNext = th + 0.5 * (curv[i - 1] + curv[i]) * h;
    v += 0.5 * (th + thNext) * h;
    th = thNext;
    y[i] = v;
    slope[i] = th;
  }
  return { x: xs, y, slope, L };
}

/** Simply supported: y(0) = y(L) = 0. The fixed-end integral, then a rigid rotation. */
export function integrateSimple(M, L, EI, n = 4000, breaks = []) {
  const raw = integrateFixed(M, L, EI, n, breaks);
  const last = raw.y.length - 1;
  const th0 = -raw.y[last] / L;
  const y = new Float64Array(raw.y.length);
  const slope = new Float64Array(raw.y.length);
  for (let i = 0; i < raw.y.length; i++) {
    y[i] = raw.y[i] + th0 * raw.x[i];
    slope[i] = raw.slope[i] + th0;
  }
  return { x: raw.x, y, slope, L };
}

function peakScale(at, samples) {
  let peak = 0;
  for (const x of samples) peak = Math.max(peak, Math.abs(at(x).y));
  return Math.max(peak, 1e-12);
}

/** Largest relative gap between a closed curve and a double integral of M/EI. */
export function deflectionGap(at, curve) {
  const scale = peakScale(at, curve.x);
  let gap = 0;
  for (let i = 0; i < curve.x.length; i++) {
    gap = Math.max(gap, Math.abs(at(curve.x[i]).y - curve.y[i]) / scale);
  }
  return gap;
}

/** Cantilever fixed at x = 0, downward tip load P. Tip drop is PL³/(3EI). */
export function cantileverTipDeflection(P, L, EI) {
  const at = (x) => {
    const y = (-P * x * x * (3 * L - x)) / (6 * EI);
    const slope = (-P * x * (2 * L - x)) / (2 * EI);
    const M = -P * (L - x);
    return { y, slope, M };
  };
  return {
    at,
    moment: (x) => -P * (L - x),
    drop: (P * L ** 3) / (3 * EI),
    slopeTip: (-P * L * L) / (2 * EI),
    xMax: L,
  };
}

/** Cantilever fixed at x = 0, uniform downward load w. Tip drop is wL⁴/(8EI). */
export function cantileverUniformDeflection(w, L, EI) {
  const at = (x) => {
    const u = L - x;
    const y = ((-(w / 24) * u ** 4) - ((w * L ** 3) / 6) * x + (w * L ** 4) / 24) / EI;
    const slope = (((w / 6) * u ** 3) - (w * L ** 3) / 6) / EI;
    const M = -0.5 * w * u * u;
    return { y, slope, M };
  };
  return {
    at,
    moment: (x) => -0.5 * w * (L - x) ** 2,
    drop: (w * L ** 4) / (8 * EI),
    xMax: L,
  };
}

/**
 * Simply supported beam, downward point load P at distance a from the left.
 * The moment peaks at the load. The slope is zero somewhere in the longer
 * segment, and that is where the deflection peaks.
 */
export function simplePointStation(L, a) {
  const b = L - a;
  if (a + 1e-12 >= b) return Math.sqrt(Math.max(L * L - b * b, 0) / 3);
  return L - Math.sqrt(Math.max(L * L - a * a, 0) / 3);
}

export function simplePointDeflection(P, L, a, EI) {
  const b = L - a;
  const k = P / (6 * EI * L);
  const at = (x) => {
    const xx = Math.min(Math.max(x, 0), L);
    if (xx <= a) {
      const y = -k * b * xx * (L * L - b * b - xx * xx);
      const slope = -k * b * (L * L - b * b - 3 * xx * xx);
      const M = ((P * b) / L) * xx;
      return { y, slope, M };
    }
    const u = L - xx;
    const y = -k * a * u * (L * L - a * a - u * u);
    const slope = k * a * (L * L - a * a - 3 * u * u);
    const M = ((P * a) / L) * u;
    return { y, slope, M };
  };
  const xMax = simplePointStation(L, a);
  const low = at(xMax);
  return {
    at,
    moment: (x) => at(x).M,
    xMax,
    yMax: low.y,
    drop: -low.y,
    under: -at(a).y,
    breaks: [a],
  };
}

/** Simply supported beam, uniform downward load w. Midspan drop is 5wL⁴/(384EI). */
export function simpleUniformDeflection(w, L, EI) {
  const at = (x) => {
    const y = (-(w * x) / (24 * EI)) * (L ** 3 - 2 * L * x * x + x ** 3);
    const slope = (-w / (24 * EI)) * (L ** 3 - 6 * L * x * x + 4 * x ** 3);
    const M = (w * L * x) / 2 - (w * x * x) / 2;
    return { y, slope, M };
  };
  return {
    at,
    moment: (x) => (w * L * x) / 2 - (w * x * x) / 2,
    xMax: L / 2,
    yMax: at(L / 2).y,
    drop: (5 * w * L ** 4) / (384 * EI),
  };
}

/**
 * Propped cantilever: fixed at x = 0, simple support at x = L, uniform load w.
 * The prop reaction is the redundant. Compatibility y(L) = 0 on top of the
 * cantilever curves gives R = 3wL/8 upward. The wall moment is then −wL²/8.
 * The lowest point is not at midspan. Its distance back from the prop is
 * L(1 + √33)/16.
 */
export function proppedUniform(w, L, EI) {
  const R = (3 * w * L) / 8;
  const Mwall = -(w * L * L) / 8;
  const moment = (x) => -0.5 * w * (L - x) ** 2 + R * (L - x);
  const C = -(w * L ** 3) / 6 + (R / 2) * L * L;
  const D = (w * L ** 4) / 24 - (R * L ** 3) / 6;
  const at = (x) => {
    const u = L - x;
    const y = ((-(w / 24) * u ** 4) + (R / 6) * u ** 3 + C * x + D) / EI;
    const slope = ((w / 6) * u ** 3 - (R / 2) * u * u + C) / EI;
    return { y, slope, M: moment(x) };
  };
  const z = (1 + Math.sqrt(33)) / 16;
  const xMax = L * (1 - z);
  return { R, Mwall, at, moment, xMax, yMax: at(xMax).y, drop: -at(xMax).y };
}

function solveLinear(A, rhs) {
  const n = rhs.length;
  const M = A.map((row, i) => [...row, rhs[i]]);
  for (let k = 0; k < n; k++) {
    let piv = k;
    for (let i = k + 1; i < n; i++) if (Math.abs(M[i][k]) > Math.abs(M[piv][k])) piv = i;
    const div = M[piv][k];
    if (Math.abs(div) < 1e-18) throw new Error('singular beam system');
    if (piv !== k) {
      const swap = M[k];
      M[k] = M[piv];
      M[piv] = swap;
    }
    for (let j = k; j <= n; j++) M[k][j] /= div;
    for (let i = 0; i < n; i++) {
      if (i === k) continue;
      const f = M[i][k];
      if (f === 0) continue;
      for (let j = k; j <= n; j++) M[i][j] -= f * M[k][j];
    }
  }
  return M.map((row) => row[n]);
}

/**
 * Finite-difference check of the propped cantilever. Unknowns are the interior
 * stations and the prop reaction. The wall slope is a ghost station, y(−h) = y(h),
 * and both ends stay at y = 0. EI (y_{i−1} − 2y_i + y_{i+1}) / h² = M_i(R).
 */
export function proppedFiniteDifference(w, L, EI, n = 160) {
  const h = L / n;
  const N = n;
  const A = Array.from({ length: N }, () => new Float64Array(N));
  const rhs = new Float64Array(N);
  const rCol = N - 1;
  const yIndex = (i) => i - 1;
  A[0][yIndex(1)] = (2 * EI) / (h * h);
  A[0][rCol] = -L;
  rhs[0] = -0.5 * w * L * L;
  for (let i = 1; i <= n - 1; i++) {
    const row = i;
    const u = L - i * h;
    const coef = EI / (h * h);
    if (i - 1 >= 1) A[row][yIndex(i - 1)] = coef;
    A[row][yIndex(i)] = -2 * coef;
    if (i + 1 <= n - 1) A[row][yIndex(i + 1)] = coef;
    A[row][rCol] = -u;
    rhs[row] = -0.5 * w * u * u;
  }
  const sol = solveLinear(A.map((row) => [...row]), rhs);
  const y = new Float64Array(n + 1);
  for (let i = 1; i <= n - 1; i++) y[i] = sol[yIndex(i)];
  return { R: sol[rCol], y, h, n };
}

/** Relative gap between the closed propped curve and the finite-difference solution. */
export function proppedGap(w, L, EI, n = 160) {
  const closed = proppedUniform(w, L, EI);
  const fd = proppedFiniteDifference(w, L, EI, n);
  const scale = Math.max(Math.abs(closed.drop), 1e-12);
  let gap = Math.abs(fd.R - closed.R) / Math.max(Math.abs(closed.R), 1);
  for (let i = 0; i <= n; i++) {
    gap = Math.max(gap, Math.abs(closed.at(i * fd.h).y - fd.y[i]) / scale);
  }
  return { gap, R: fd.R, closed };
}
