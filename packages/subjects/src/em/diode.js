/**
 * Diodes and LEDs as circuit parts. Pure, SI units, no DOM.
 *
 * The model is the Shockley diode with a series resistance:
 *
 *   I = I_s (exp(V_j / (n V_T)) − 1),   V = V_j + I R_s,
 *
 * where V_j is the junction's own voltage and R_s the resistance of the chip and its leads. Written
 * the other way round, the voltage at a given forward current is explicit:
 *
 *   V(I) = n V_T ln(1 + I / I_s) + I R_s.
 *
 * Reverse bias is modelled as the leakage −I_s and nothing more: no breakdown. An LED's datasheet
 * rates its reverse voltage at about 5 V; past that it may be damaged.
 */

/** Thermal voltage kT/q at 25 °C, in volts. */
export const VT = 0.025693;

/**
 * A diode that drops `vf` volts at `iF` amps, with ideality `n` and series resistance `rs`. I_s is
 * solved from the forward point, so the model passes through the datasheet's typical value.
 */
export function fromForward({ vf, iF, n = 2, rs = 10 }) {
  const vj = vf - iF * rs;
  if (vj <= 0) throw new Error('fromForward: the series resistance takes the whole forward voltage');
  const is = iF / Math.expm1(vj / (n * VT));
  return { is, n, rs };
}

/** The voltage across the diode at a forward current `i` (i ≥ 0). */
export function voltageAt(d, i) {
  return d.n * VT * Math.log1p(Math.max(0, i) / d.is) + Math.max(0, i) * d.rs;
}

/**
 * The current at a voltage `v` across the whole diode: solve v = n V_T ln(1 + I/I_s) + I R_s for I by
 * Newton's method in the junction voltage, which is monotone and safe from overflow.
 */
export function currentAt(d, v) {
  if (v <= 0) return -d.is * -Math.expm1(v / (d.n * VT));
  const nvt = d.n * VT;
  // Start the junction at the lesser of v and where R_s alone would carry the current.
  let vj = Math.min(v, nvt * Math.log1p(v / d.rs / d.is));
  for (let k = 0; k < 200; k += 1) {
    const i = d.is * Math.expm1(vj / nvt);
    const f = vj + i * d.rs - v;
    const df = 1 + (d.is / nvt) * Math.exp(vj / nvt) * d.rs;
    const step = f / df;
    vj -= step;
    if (Math.abs(step) < 1e-15 * Math.max(1, Math.abs(vj))) break;
  }
  return d.is * Math.expm1(vj / nvt);
}

/**
 * One loop: a source `vs`, a resistor `r`, and diodes in series, all forward. The current solves
 * vs = I r + Σ V_k(I). Newton's method on I, from a start that cannot overshoot: the function is
 * increasing and concave in I past zero, so Newton from below converges monotonically.
 * Returns 0 when the source cannot overcome the diodes' threshold (I would be negative).
 */
export function seriesCurrent(vs, r, diodes) {
  if (vs <= 0) return 0;
  const g = (i) => i * r + diodes.reduce((s, d) => s + voltageAt(d, i), 0) - vs;
  const dg = (i) => r + diodes.reduce((s, d) => s + (d.n * VT) / (d.is + i) + d.rs, 0);
  let i = 0;
  if (g(0) >= 0) return 0;
  for (let k = 0; k < 500; k += 1) {
    const step = g(i) / dg(i);
    i -= step;
    if (i < 0) i = 0;
    if (Math.abs(step) <= 1e-15 * Math.max(1e-12, i)) break;
  }
  return i;
}

/**
 * The same loop by bisection on I: the load line V = vs − I r against the diodes' total V(I). The
 * second method for `seriesCurrent`.
 */
export function seriesCurrentBisect(vs, r, diodes) {
  if (vs <= 0) return 0;
  const g = (i) => i * r + diodes.reduce((s, d) => s + voltageAt(d, i), 0) - vs;
  if (g(0) >= 0) return 0;
  let lo = 0;
  let hi = vs / Math.max(r, 1e-9);
  // The diodes take some voltage, so the current is below vs/r; widen if r is tiny.
  while (g(hi) < 0) hi *= 2;
  for (let k = 0; k < 300; k += 1) {
    const mid = 0.5 * (lo + hi);
    if (g(mid) < 0) lo = mid;
    else hi = mid;
  }
  return 0.5 * (lo + hi);
}

/**
 * Diodes in parallel behind one shared resistor `r` from a source `vs`. They share one voltage V,
 * and V + r Σ I_k(V) = vs. Newton's method on V, with the slope Σ dI_k/dV found from each diode's
 * own Newton solve. Returns the shared voltage and each diode's current.
 */
export function parallelShare(vs, r, diodes) {
  const total = (v) => diodes.reduce((s, d) => s + currentAt(d, v), 0);
  const h = (v) => v + r * total(v) - vs;
  // Each diode's conductance at V: dI/dV = 1 / (dV/dI) = 1 / (n V_T/(I_s + I) + R_s).
  const dh = (v) => 1 + r * diodes.reduce((s, d) => s + 1 / ((d.n * VT) / (d.is + Math.max(0, currentAt(d, v))) + d.rs), 0);
  let v = 0;
  for (let k = 0; k < 500; k += 1) {
    const step = h(v) / dh(v);
    v -= step;
    if (v > vs) v = vs;
    if (Math.abs(step) < 1e-15 * Math.max(1, Math.abs(v))) break;
  }
  return { v, currents: diodes.map((d) => currentAt(d, v)) };
}

/** The same sharing by bisection on V between 0 and vs: the second method for `parallelShare`. */
export function parallelShareBisect(vs, r, diodes) {
  const h = (v) => v + r * diodes.reduce((s, d) => s + currentAt(d, v), 0) - vs;
  let lo = 0;
  let hi = vs;
  for (let k = 0; k < 300; k += 1) {
    const mid = 0.5 * (lo + hi);
    if (h(mid) < 0) lo = mid;
    else hi = mid;
  }
  const v = 0.5 * (lo + hi);
  return { v, currents: diodes.map((d) => currentAt(d, v)) };
}

/** The E12 series of preferred resistor values, one decade. */
export const E12 = [1.0, 1.2, 1.5, 1.8, 2.2, 2.7, 3.3, 3.9, 4.7, 5.6, 6.8, 8.2];

/** The smallest E12 value at or above `r` ohms: the standard part that keeps the current at or below the target. */
export function nextE12Up(r) {
  const d = 10 ** Math.floor(Math.log10(r));
  for (const m of [...E12, 10]) {
    const v = Number((m * d).toPrecision(3));
    if (v >= r * (1 - 1e-9)) return v;
  }
  return 10 * d;
}
