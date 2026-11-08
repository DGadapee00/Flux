/**
 * A crack growing under cyclic load: the Paris law (EMA 3010, fatigue).
 *
 * An edge crack of depth a in a steel part sees a stress that cycles from 0 to σ_max, so
 * ΔK = Yσ_max√(πa) with Y = 1.12. Each cycle the crack grows by da/dN = C(ΔK)^m. It grows until
 * K_max reaches the toughness, at a_c = (1/π)(K_Ic/Yσ_max)². With m ≠ 2 the life integrates to
 *   N_f = [a_c^{1−m/2} − a₀^{1−m/2}] / [C(YΔσ√π)^m (1 − m/2)].
 * A stress well below yield still grows the crack every cycle: the part fails, only later.
 *
 * The second method integrates dN = da / C(ΔK)^m by Simpson's rule in ln a.
 */

export const PART = { C: 1e-11, m: 3, Y: 1.12, KIc: 60, sy: 500 };

export function parisClosed({ ds, a0mm }) {
  const { C, m, Y, KIc } = PART;
  const a0 = a0mm / 1000;
  const ac = (KIc / (Y * ds)) ** 2 / Math.PI;
  const k = C * (Y * ds * Math.sqrt(Math.PI)) ** m;
  const e = 1 - m / 2;
  const N = ac > a0 ? (ac ** e - a0 ** e) / (k * e) : 0;
  // a(N) from the same integral, inverted.
  const aAt = (n) => (a0 ** e + k * e * n) ** (1 / e);
  return { a0, ac, N, aAt, dK0: Y * ds * Math.sqrt(Math.PI * a0), rate0: k * a0 ** (m / 2) };
}

export function parisNumeric({ ds, a0mm }, n = 2000) {
  const { C, m, Y, KIc } = PART;
  const a0 = a0mm / 1000;
  const ac = (KIc / (Y * ds)) ** 2 / Math.PI;
  if (ac <= a0) return 0;
  const lo = Math.log(a0);
  const h = (Math.log(ac) - lo) / n;
  const f = (y) => {
    const a = Math.exp(y);
    return a / (C * (Y * ds * Math.sqrt(Math.PI * a)) ** m);
  };
  let s = f(lo) + f(lo + n * h);
  for (let i = 1; i < n; i++) s += f(lo + i * h) * (i % 2 ? 4 : 2);
  return (s * h) / 3;
}

export function parisChecked(state) {
  const cf = parisClosed(state);
  const Nn = parisNumeric(state);
  return { ...cf, Nnum: Nn, gap: cf.N > 0 ? Math.abs(Nn - cf.N) / cf.N : 0 };
}
