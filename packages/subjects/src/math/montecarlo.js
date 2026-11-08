/**
 * Estimating π by throwing points at a square (EGN 3203, Monte Carlo).
 *
 * N points uniform in the unit square land inside the quarter circle x² + y² < 1 with probability
 * p = π/4. The share inside, times 4, estimates π. Each throw is a 0 or 1 with variance p(1 − p), so
 * the estimate's standard error is 4√(p(1 − p)/N) ≈ 1.64/√N: ten times the points gives only about
 * three times the accuracy. The same 1/√N holds for a Monte Carlo integral in any number of
 * dimensions, which is why it wins only in high dimensions.
 *
 * The throws come from a fixed, seeded generator, so a given N always gives the same estimate. The
 * standard error formula's p is checked by integrating √(1 − x²) over [0, 1] with Simpson's rule
 * after the substitution x = sin t, which removes the square root's endpoint singularity.
 */

/** mulberry32: a small seeded generator. */
export function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function throwPoints(N, seed = 7, keep = 0) {
  const r = rng(seed);
  let inside = 0;
  const pts = [];
  for (let i = 0; i < N; i++) {
    const x = r();
    const y = r();
    const hit = x * x + y * y < 1;
    if (hit) inside++;
    if (i < keep) pts.push([x, y, hit]);
  }
  return { inside, est: (4 * inside) / N, pts };
}

export const stdErr = (N, p = Math.PI / 4) => 4 * Math.sqrt((p * (1 - p)) / N);

export function quarterArea(n = 2000) {
  // ∫₀¹ √(1 − x²) dx = ∫₀^{π/2} cos² t dt, by Simpson.
  const h = Math.PI / 2 / n;
  const f = (t) => Math.cos(t) ** 2;
  let s = f(0) + f(Math.PI / 2);
  for (let i = 1; i < n; i++) s += f(i * h) * (i % 2 ? 4 : 2);
  return (s * h) / 3;
}

export function mcChecked({ lN }) {
  const N = Math.round(10 ** lN);
  const t = throwPoints(N, 7, Math.min(N, 3000));
  const se = stdErr(N);
  const seNum = stdErr(N, quarterArea());
  // More runs with other seeds, for the spread.
  const runs = Array.from({ length: N > 1e5 ? 5 : 20 }, (_, k) => throwPoints(N, 101 + k).est);
  return { N, ...t, err: Math.abs(t.est - Math.PI), se, seNum, runs, gap: Math.abs(seNum - se) / se };
}
