import { G_STANDARD, S_PER_DAY } from '../convert.js';
/** Point-mass pendulum, no dissipation. Energy gives T=4 sqrt(L/g) K(k),
 * k=sin(amplitude/2). K=(π/2) sum c_n m^n, m=k², c_n/c_(n-1)=((2n-1)/(2n))².
 * Since successive coefficients decrease, the omitted tail is bounded by
 * nextTerm/(1-m). AGM gives a separate evaluation of the complete integral. */
export function pendulumSeries(L, amplitude, n = 4, g = G_STANDARD) {
  if (!(
    Number.isFinite(L) &&
    L > 0 &&
    Number.isFinite(g) &&
    g > 0 &&
    Number.isFinite(amplitude) &&
    amplitude >= 0 &&
    amplitude < Math.PI &&
    Number.isInteger(n) &&
    n >= 1 &&
    n <= 200
  ))
    throw new RangeError('Positive length/gravity, amplitude in [0,π), 1–200 terms required');
  const m = Math.sin(amplitude / 2) ** 2,
    T0 = 2 * Math.PI * Math.sqrt(L / g);
  let a = 1,
    b = Math.sqrt(1 - m);
  for (let j = 0; j < 30; j++) {
    const next = (a + b) / 2;
    b = Math.sqrt(a * b);
    a = next;
    if (Math.abs(a - b) < 1e-15) break;
  }
  const period = T0 / a;
  let term = 1,
    sum = 1;
  for (let j = 1; j < n; j++) {
    term *= m * ((2 * j - 1) / (2 * j)) ** 2;
    sum += term;
  }
  const next = term * m * ((2 * n - 1) / (2 * n)) ** 2,
    series = T0 * sum,
    tailBound = (T0 * next) / (1 - m);
  return {
    m,
    T0,
    period,
    series,
    tailBound,
    error: Math.max(0, period - series),
    fraction: period / T0,
    lossPerDay: S_PER_DAY * (1 - T0 / period),
  };
}
