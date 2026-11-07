/**
 * Power factor and its correction (EEL 3111, AC power).
 *
 * A motor draws a real power P from a V_rms, f supply at a lagging power factor cos θ: its current
 * lags the voltage by θ. It also draws a reactive power Q_m = P tan θ, which flows into the motor's
 * inductance and back out each cycle, doing no work. A capacitor in parallel draws Q_C = V²ωC the
 * other way, so the supply sees
 *   S = √(P² + (Q_m − Q_C)²),   I_line = S/V,   cos θ_line = P/S.
 * The work done is P whatever the power factor; the line current, and its I²R loss in the wires,
 * are set by S. Correct fully, Q_C = Q_m, and the line carries only P/V.
 *
 * The closed form is that phasor arithmetic. The second method builds v(t) and i(t) as sines, and
 * averages p(t) = v(t)i(t) and i(t)² over one cycle by Simpson's rule, for P and I_rms.
 */

export const SUPPLY = { V: 240, f: 60, P: 5000, Rline: 0.2 };

export function powerFactor({ pf, Cuf }) {
  const { V, f, P, Rline } = SUPPLY;
  const w = 2 * Math.PI * f;
  const theta = Math.acos(pf);
  const Qm = P * Math.tan(theta);
  const Qc = V * V * w * Cuf * 1e-6;
  const Q = Qm - Qc;
  const S = Math.hypot(P, Q);
  const I = S / V;
  const Imotor = P / (V * pf);
  return {
    theta, Qm, Qc, Q, S, I, Imotor,
    pfLine: P / S,
    lagging: Q > 0,
    loss: I * I * Rline,
    lossMotorOnly: Imotor * Imotor * Rline,
    // The capacitance that cancels the motor's reactive power exactly.
    Cfull: (Qm / (V * V * w)) * 1e6,
    // The line current's phase relative to the voltage, radians (negative: lagging).
    phase: -Math.atan2(Q, P),
  };
}

/** One cycle of v(t), i(t) and p(t), and P and I_rms from them by Simpson's rule. */
export function waveforms(r, n = 600) {
  const { V, f } = SUPPLY;
  const T = 1 / f;
  const w = 2 * Math.PI * f;
  const Vp = V * Math.SQRT2;
  const Ip = r.I * Math.SQRT2;
  const ts = Array.from({ length: n + 1 }, (_, k) => (T * k) / n);
  const v = ts.map((t) => Vp * Math.cos(w * t));
  const i = ts.map((t) => Ip * Math.cos(w * t + r.phase));
  const p = v.map((x, k) => x * i[k]);
  const simpson = (ys) => {
    let s = ys[0] + ys[n];
    for (let k = 1; k < n; k++) s += ys[k] * (k % 2 ? 4 : 2);
    return (s * (T / n)) / 3;
  };
  const Pavg = simpson(p) / T;
  const Irms = Math.sqrt(simpson(i.map((x) => x * x)) / T);
  return { ts, v, i, p, Pavg, Irms };
}

export function powerChecked(state) {
  const r = powerFactor(state);
  const wv = waveforms(r);
  const gap = Math.max(Math.abs(wv.Pavg - SUPPLY.P) / SUPPLY.P, Math.abs(wv.Irms - r.I) / r.I);
  return { ...r, wave: wv, gap, VI: SUPPLY.V * r.I };
}
