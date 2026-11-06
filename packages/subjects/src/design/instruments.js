/**
 * Instruments, valves and boards. Our own derivations, with data from Wikipedia read on
 * 6 November 2026: a foil gauge factor of about 2 (Strain gauge), the flow factor Kv in m³/h at
 * 1 bar for water (Flow coefficient), copper's resistivity 1.68 × 10⁻⁸ Ω·m (Electrical resistivity
 * and conductivity) and 1 oz copper as 35 μm thick (Printed circuit board).
 *
 * Each closed form has a numeric partner: the bridge and the board by nodal analysis solved with
 * Gaussian elimination, aliasing by a discrete Fourier transform of the samples, and the valve by
 * bisection on the pump and system curves.
 */

/** Solve A x = b by Gaussian elimination with partial pivoting. */
export function solveLinear(A, b) {
  const n = b.length;
  const M = A.map((r, i) => [...r, b[i]]);
  for (let c = 0; c < n; c++) {
    let p = c;
    for (let i = c + 1; i < n; i++) if (Math.abs(M[i][c]) > Math.abs(M[p][c])) p = i;
    [M[c], M[p]] = [M[p], M[c]];
    for (let i = c + 1; i < n; i++) {
      const f = M[i][c] / M[c][c];
      for (let j = c; j <= n; j++) M[i][j] -= f * M[c][j];
    }
  }
  const x = new Array(n).fill(0);
  for (let i = n - 1; i >= 0; i--) {
    let s = M[i][n];
    for (let j = i + 1; j < n; j++) s -= M[i][j] * x[j];
    x[i] = s / M[i][i];
  }
  return x;
}

/**
 * A Wheatstone bridge of four gauges of resistance R. Left divider R1 over R2, right divider R3 over
 * R4, output V(left) − V(right). x = GF ε is the gauges' fractional change from strain; t = GF ε_T the
 * change every gauge sees from temperature.
 *   quarter: R2 active in tension
 *   half:    R1 in compression, R2 in tension (top and bottom of a bent beam)
 *   full:    R1 and R4 in compression, R2 and R3 in tension
 */
export function bridgeArms(kind, x, t = 0) {
  // Temperature changes the gauges only; the fixed completion resistors stay put.
  const T = 1 + t;
  if (kind === 'full') return [T - x, T + x, T + x, T - x];
  if (kind === 'half') return [T - x, T + x, 1, 1];
  return [1, T + x, 1, 1];
}

/** Exact output and the linear estimate V·n·GF·ε/4, in the units of V. */
export function bridgeOutput({ kind, Vex, GF, strain, thermal = 0 }) {
  const x = GF * strain;
  const [r1, r2, r3, r4] = bridgeArms(kind, x, GF * thermal);
  const exact = Vex * (r2 / (r1 + r2) - r4 / (r3 + r4));
  const n = kind === 'full' ? 4 : kind === 'half' ? 2 : 1;
  return { exact, linear: (Vex * n * x) / 4, n };
}

/** The same output by nodal analysis: the two divider nodes solved from Kirchhoff's current law. */
export function bridgeNodal({ kind, Vex, GF, strain, thermal = 0, R = 350 }) {
  const [r1, r2, r3, r4] = bridgeArms(kind, GF * strain, GF * thermal).map((k) => k * R);
  // Unknowns: left node a, right node b. Supply at Vex on top, 0 below.
  const A = [
    [1 / r1 + 1 / r2, 0],
    [0, 1 / r3 + 1 / r4],
  ];
  const [a, b] = solveLinear(A, [Vex / r1, Vex / r3]);
  return { out: a - b };
}

/** Surface strain at the root of a cantilever arm b wide, h thick, L long, load P (mm, N, MPa). */
export const rootStrain = ({ P, L, b, h, E }) => (6 * P * L) / (b * h * h * E);

/** The frequency a sampled sine appears at, folded into [0, fs/2]. */
export function aliasFrequency(f, fs) {
  const r = ((f % fs) + fs) % fs;
  return r > fs / 2 ? fs - r : r;
}

/**
 * The same by looking at the samples: N samples of sin(2πft + φ) at rate fs, with φ = 0.7 so a
 * signal sampled at its own frequency is a constant, not zero, Hann-windowed, their DFT
 * magnitude scanned over [0, fs/2] and the peak refined by golden-section search.
 */
export const PHASE = 0.7;

export function aliasByDft(f, fs, N = 512) {
  const x = Array.from({ length: N }, (_, n) => Math.sin((2 * Math.PI * f * n) / fs + PHASE) * (0.5 - 0.5 * Math.cos((2 * Math.PI * n) / (N - 1))));
  const mag = (g) => {
    let re = 0;
    let im = 0;
    for (let n = 0; n < N; n++) {
      const a = (2 * Math.PI * g * n) / fs;
      re += x[n] * Math.cos(a);
      im -= x[n] * Math.sin(a);
    }
    return Math.hypot(re, im);
  };
  const steps = 4 * N;
  let best = 0;
  let bestM = -1;
  for (let i = 0; i <= steps; i++) {
    const g = (i / steps) * (fs / 2);
    const m = mag(g);
    if (m > bestM) {
      bestM = m;
      best = g;
    }
  }
  const h = fs / 2 / steps;
  let lo = Math.max(0, best - h);
  let hi = Math.min(fs / 2, best + h);
  const phi = (Math.sqrt(5) - 1) / 2;
  for (let i = 0; i < 80; i++) {
    const c = hi - phi * (hi - lo);
    const d = lo + phi * (hi - lo);
    if (mag(c) > mag(d)) hi = d;
    else lo = c;
  }
  return { f: (lo + hi) / 2, mag };
}

/** Inherent valve characteristic: the share of Kv at opening x in [0, 1]. Rangeability R for equal percentage. */
export function inherent(kind, x, R = 50) {
  if (kind === 'equal') return x <= 0 ? 0 : R ** (x - 1);
  if (kind === 'quick') return Math.sqrt(Math.max(0, x));
  return Math.max(0, x);
}

/**
 * A pump (head H0 bar at no flow, falling as a Q²) drives water through a pipe (loss k Q²) and a valve
 * (Kv). Pressures in bar, flow in m³/h, water so RD = 1: H0 − aQ² = kQ² + (Q/Kv)².
 */
export function valveFlow({ H0, a, k, KvMax, kind, x }) {
  const kv = KvMax * inherent(kind, x);
  if (kv <= 0) return { Q: 0, dpValve: H0, kv };
  const Q = Math.sqrt(H0 / (a + k + 1 / (kv * kv)));
  return { Q, dpValve: (Q / kv) ** 2, kv };
}

/** The same flow by bisection where the pump curve meets the system curve. */
export function valveFlowNumeric({ H0, a, k, KvMax, kind, x }) {
  const kv = KvMax * inherent(kind, x);
  if (kv <= 0) return { Q: 0 };
  const excess = (Q) => H0 - a * Q * Q - k * Q * Q - (Q / kv) ** 2;
  let lo = 0;
  let hi = 1;
  while (excess(hi) > 0) hi *= 2;
  for (let i = 0; i < 200; i++) {
    const m = (lo + hi) / 2;
    if (excess(m) > 0) lo = m;
    else hi = m;
  }
  return { Q: (lo + hi) / 2 };
}

/** Valve authority: the valve's share of the system's pressure drop when fully open. */
export function authority(p) {
  const open = valveFlow({ ...p, x: 1 });
  const total = open.dpValve + p.k * open.Q * open.Q;
  return open.dpValve / total;
}

export const COPPER = Object.freeze({ rho: 1.68e-8, oz1: 35e-6 }); // Ω·m, m

/** Resistance of a copper trace L long and w wide, in mm, with copper t thick (m). */
export const traceResistance = (L, w, t) => (COPPER.rho * (L / 1000)) / ((w / 1000) * t);

/**
 * An active sensor (an amplifier or a sensor chip) puts out Vsig above its own ground pin and draws
 * a supply current i_s that returns through that pin. Its ground runs R_gs to a junction, where a
 * motor's return current I joins; the junction runs R_sh back to the connector. With a star ground
 * the sensor's trace goes straight to the connector instead. The ADC reads the output against the
 * connector, so any rise of the sensor's ground is read as signal. Closed form by Ohm's law.
 */
export function groundClosed({ I, is = 1e-3, Rgs, Rsh, layout, Vsig = 1.65 }) {
  const Vg = layout === 'star' ? is * Rgs : (I + is) * Rsh + is * Rgs;
  return { Vg, Vm: Vsig + Vg, error: Vg };
}

/** The same board by nodal analysis: the ground pin g and the junction j solved from KCL. */
export function groundNodal({ I, is = 1e-3, Rgs, Rsh, layout, Vsig = 1.65 }) {
  const G = (r) => 1 / r;
  if (layout === 'star') {
    // g ties to the connector through Rgs; j carries the motor alone through Rsh.
    const [g, j] = solveLinear([[G(Rgs), 0], [0, G(Rsh)]], [is, I]);
    void j;
    return { Vm: Vsig + g, error: g };
  }
  const [g] = solveLinear([[G(Rgs), -G(Rgs)], [-G(Rgs), G(Rgs) + G(Rsh)]], [is, I]);
  return { Vm: Vsig + g, error: g };
}
