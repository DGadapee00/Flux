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

/*
 * Temperature sensors. A type K thermocouple gives about 41 μV per °C of difference between its tip
 * and its reference junction (Wikipedia, Thermocouple). A Pt100 RTD is 100 Ω at 0 °C and follows
 * R = R0(1 + AT + BT²) above 0 °C with A = 3.9083 × 10⁻³ and B = −5.775 × 10⁻⁷ (Wikipedia,
 * Resistance thermometer, from IEC 60751).
 */
export const TYPE_K = 41e-6; // V/°C
export const PT100 = Object.freeze({ R0: 100, A: 3.9083e-3, B: -5.775e-7 });

/** Pt100 resistance at T (°C, T ≥ 0). */
export const rtdResistance = (T) => PT100.R0 * (1 + PT100.A * T + PT100.B * T * T);

/** Temperature from a Pt100 resistance by the quadratic's root. */
export function rtdTemperature(R) {
  const { R0, A, B } = PT100;
  return (-A + Math.sqrt(A * A - 4 * B * (1 - R / R0))) / (2 * B);
}

/** The same by Newton's method on R(T) − R = 0, from T = (R/R0 − 1)/A. */
export function rtdTemperatureNewton(R) {
  let T = (R / PT100.R0 - 1) / PT100.A;
  for (let i = 0; i < 50; i++) {
    const f = rtdResistance(T) - R;
    const d = PT100.R0 * (PT100.A + 2 * PT100.B * T);
    const step = f / d;
    T -= step;
    if (Math.abs(step) < 1e-12) break;
  }
  return T;
}

/** What each sensor reports. Leads: Ω per wire; wiring: 2, 3 or 4 wires. */
export function temperatureReadings({ tip, room, cjc, lead, wires }) {
  const emf = TYPE_K * (tip - room);
  const tc = emf / TYPE_K + (cjc ? room : 0);
  // Two wires add both leads; three wires cancel them in a bridge; four wires measure past them.
  const extra = wires === 2 ? 2 * lead : 0;
  const R = rtdResistance(tip) + extra;
  return { emf, tc, R, rtd: rtdTemperature(R), rtdNewton: rtdTemperatureNewton(R) };
}

/*
 * Orifice meter: q = C_d A₂ √(2Δp/(ρ(1 − β⁴))) with β = d/D (Wikipedia, Orifice plate). The drop
 * rises as the square of the flow, so a transmitter's fixed error in Δp is a growing share of a
 * small flow.
 */
export function orificeDp({ Q, D, beta, Cd = 0.61, rho = 998 }) {
  const d = beta * D;
  const A2 = (Math.PI / 4) * d * d;
  return (rho / 2) * (Q / (Cd * A2)) ** 2 * (1 - beta ** 4);
}

/** Flow from a drop by the meter equation. */
export function orificeFlow({ dp, D, beta, Cd = 0.61, rho = 998 }) {
  const A2 = (Math.PI / 4) * (beta * D) ** 2;
  return Cd * A2 * Math.sqrt((2 * Math.max(dp, 0)) / (rho * (1 - beta ** 4)));
}

/** The same flow by bisection on the drop equation. */
export function orificeFlowNumeric(p) {
  let lo = 0;
  let hi = 1e-3;
  while (orificeDp({ ...p, Q: hi }) < p.dp) hi *= 2;
  for (let i = 0; i < 200; i++) {
    const m = (lo + hi) / 2;
    if (orificeDp({ ...p, Q: m }) < p.dp) lo = m;
    else hi = m;
  }
  return (lo + hi) / 2;
}

/*
 * A brushed DC motor: V = iR + kω and τ = k i (SI units, kt = ke = k). In steady state the torque and
 * speed fall on a straight line from stall, τ_s = kV/R, to no load, ω₀ = V/k, and the output power
 * τω peaks at half the stall torque.
 */
export function motorSteady({ V, R, k, load }) {
  const i = load / k;
  const w = (V - i * R) / k;
  return { i, w, stall: (k * V) / R, w0: V / k, Pout: load * w, Pin: V * i, Pmax: (V * V) / (4 * R) };
}

/** The motor started from rest and stepped in time with RK4: L di/dt = V − iR − kω, J dω/dt = ki − load. */
export function motorStep({ V, R, k, load, L = 1e-3, J = 5e-6, tEnd = 0.4, dt = 2e-5 }) {
  let i = 0;
  let w = 0;
  const f = (ii, ww) => [(V - ii * R - k * ww) / L, (k * ii - load) / J];
  const trace = [];
  const n = Math.round(tEnd / dt);
  for (let s = 0; s < n; s++) {
    const a = f(i, w);
    const b = f(i + (dt / 2) * a[0], w + (dt / 2) * a[1]);
    const c = f(i + (dt / 2) * b[0], w + (dt / 2) * b[1]);
    const e = f(i + dt * c[0], w + dt * c[1]);
    i += (dt / 6) * (a[0] + 2 * b[0] + 2 * c[0] + e[0]);
    w += (dt / 6) * (a[1] + 2 * b[1] + 2 * c[1] + e[1]);
    // A motor held at stall does not turn backward: the load is friction-like.
    if (w < 0 && k * i < load) w = 0;
    if (s % 100 === 0) trace.push([s * dt, w]);
  }
  return { i, w, trace };
}

/*
 * PWM into a coil (R, L): the supply V is on for D of each period T = 1/f. The average voltage is
 * DV whatever f is; f only sets the current's ripple. In steady state the ripple is
 *   ΔI = (V/R)(1 − e^{−DT/τ})(1 − e^{−(1−D)T/τ})/(1 − e^{−T/τ}), τ = L/R.
 */
export function pwmClosed({ V, R, L, D, f }) {
  const T = 1 / f;
  const tau = L / R;
  const ripple = D <= 0 || D >= 1 ? 0 : ((V / R) * (1 - Math.exp((-D * T) / tau)) * (1 - Math.exp((-(1 - D) * T) / tau))) / (1 - Math.exp(-T / tau));
  return { avgV: D * V, meanI: (D * V) / R, ripple, tau };
}

/**
 * The same by stepping the coil period after period from rest, each on and off interval solved
 * exactly, until it settles; then the last period's mean current (integrated) and ripple are measured.
 */
export function pwmNumeric({ V, R, L, D, f }) {
  const T = 1 / f;
  const tau = L / R;
  const tOn = D * T;
  const tOff = T - tOn;
  // i(t) = v/R + (i0 − v/R) e^{−t/τ}; its integral over Δ is vΔ/R + (i0 − v/R) τ (1 − e^{−Δ/τ}).
  const step = (i0, v, dt) => v / R + (i0 - v / R) * Math.exp(-dt / tau);
  const area = (i0, v, dt) => (v * dt) / R + (i0 - v / R) * tau * (1 - Math.exp(-dt / tau));
  let i = 0;
  const periods = Math.max(50, Math.ceil((40 * tau) / T));
  let res = null;
  for (let p = 0; p < periods; p++) {
    const iOn = step(i, V, tOn);
    const iOff = step(iOn, 0, tOff);
    if (p === periods - 1) res = { meanI: (area(i, V, tOn) + area(iOn, 0, tOff)) / T, ripple: Math.abs(iOn - i), avgV: (V * tOn) / T };
    i = iOff;
  }
  return res;
}

/*
 * Decoupling. A chip draws a load current that ramps from 0 to ΔI in t_r. Its supply comes from a
 * regulator at V0 through a trace (R_t, L_t); a capacitor C (ESR R_c) sits at the end of its own
 * connection inductance L_c. With i_L the trace current and v_c the capacitor's voltage,
 *   i_L' = (V0 − (R_t + R_c) i_L + L_c i_l' − v_c + R_c i_l)/(L_t + L_c),  v_c' = (i_L − i_l)/C,
 * and the chip's supply is v = [L_c(V0 − R_t i_L − L_t i_l') + L_t(v_c + R_c(i_L − i_l))]/(L_t + L_c).
 * The closed form solves this 2×2 linear system exactly on the ramp and after it (matrix exponential
 * plus an affine particular solution); the second method steps it with RK4.
 */
function exp2(A, t) {
  const s = (A[0][0] + A[1][1]) / 2;
  const det = A[0][0] * A[1][1] - A[0][1] * A[1][0];
  const q2 = s * s - det;
  let c;
  let g;
  if (q2 > 1e-12 * s * s) {
    const q = Math.sqrt(q2);
    c = Math.cosh(q * t);
    g = Math.sinh(q * t) / q;
  } else if (q2 < -1e-12 * s * s) {
    const w = Math.sqrt(-q2);
    c = Math.cos(w * t);
    g = Math.sin(w * t) / w;
  } else {
    c = 1;
    g = t;
  }
  const e = Math.exp(s * t);
  return [
    [e * (c + (A[0][0] - s) * g), e * A[0][1] * g],
    [e * A[1][0] * g, e * (c + (A[1][1] - s) * g)],
  ];
}
const mul = (M, x) => [M[0][0] * x[0] + M[0][1] * x[1], M[1][0] * x[0] + M[1][1] * x[1]];
const inv2 = (A) => {
  const d = A[0][0] * A[1][1] - A[0][1] * A[1][0];
  return [[A[1][1] / d, -A[0][1] / d], [-A[1][0] / d, A[0][0] / d]];
};

function decouplingSystem({ V0, Rt, Lt, C, Rc, Lc, dI, tr }) {
  const S = Lt + Lc;
  const A = [[-(Rt + Rc) / S, -1 / S], [1 / C, 0]];
  const load = (t) => (t < tr ? (dI * t) / tr : dI);
  const slope = (t) => (t < tr ? dI / tr : 0);
  const node = (x, t) => (Lc * (V0 - Rt * x[0] - Lt * slope(t)) + Lt * (x[1] + Rc * (x[0] - load(t)))) / S;
  const deriv = (x, t) => [(V0 - (Rt + Rc) * x[0] + Lc * slope(t) - x[1] + Rc * load(t)) / S, (x[0] - load(t)) / C];
  return { A, load, slope, node, deriv };
}

/** The supply at the chip by the exact solution, sampled at n + 1 times over [0, tEnd]. */
export function decouplingClosed(p, tEnd, n = 600) {
  const { A, node } = decouplingSystem(p);
  const { V0, Rc, Lc, dI, tr, C } = p;
  const S = p.Lt + Lc;
  const Ai = inv2(A);
  // Affine particular solutions x_p = p0 + p1 t for forcing b0 + b1 t.
  const particular = (b0, b1) => {
    const p1 = mul(Ai, b1).map((v) => -v);
    const p0 = mul(Ai, [p1[0] - b0[0], p1[1] - b0[1]]);
    return (t) => [p0[0] + p1[0] * t, p0[1] + p1[1] * t];
  };
  const ramp = particular([(V0 + (Lc * dI) / tr) / S, 0], [(Rc * dI) / (tr * S), -dI / (tr * C)]);
  const hold = particular([(V0 + Rc * dI) / S, -dI / C], [0, 0]);
  const x0 = [0, V0];
  const atRamp = (t) => {
    const h = mul(exp2(A, t), [x0[0] - ramp(0)[0], x0[1] - ramp(0)[1]]);
    const xp = ramp(t);
    return [xp[0] + h[0], xp[1] + h[1]];
  };
  const xr = atRamp(tr);
  const atHold = (t) => {
    const h = mul(exp2(A, t - tr), [xr[0] - hold(tr)[0], xr[1] - hold(tr)[1]]);
    const xp = hold(t);
    return [xp[0] + h[0], xp[1] + h[1]];
  };
  const out = [];
  for (let k = 0; k <= n; k++) {
    const t = (k / n) * tEnd;
    const x = t < tr ? atRamp(t) : atHold(t);
    out.push([t, node(x, t)]);
  }
  return out;
}

/** The same supply by stepping the circuit with RK4, sampled at the same times. */
export function decouplingNumeric(p, tEnd, n = 600, sub = 200) {
  const { deriv, node } = decouplingSystem(p);
  let x = [0, p.V0];
  const out = [[0, node(x, 0)]];
  const dt = tEnd / n / sub;
  let t = 0;
  for (let k = 1; k <= n; k++) {
    for (let s = 0; s < sub; s++) {
      // Step the ramp's corner exactly: split a step that crosses t_r.
      const h = t < p.tr && t + dt > p.tr ? p.tr - t : dt;
      const a = deriv(x, t);
      const b = deriv([x[0] + (h / 2) * a[0], x[1] + (h / 2) * a[1]], t + h / 2);
      const c = deriv([x[0] + (h / 2) * b[0], x[1] + (h / 2) * b[1]], t + h / 2);
      const d = deriv([x[0] + h * c[0], x[1] + h * c[1]], t + h);
      x = [x[0] + (h / 6) * (a[0] + 2 * b[0] + 2 * c[0] + d[0]), x[1] + (h / 6) * (a[1] + 2 * b[1] + 2 * c[1] + d[1])];
      t += h;
      if (h < dt) {
        const h2 = dt - h;
        const a2 = deriv(x, t);
        const b2 = deriv([x[0] + (h2 / 2) * a2[0], x[1] + (h2 / 2) * a2[1]], t + h2 / 2);
        const c2 = deriv([x[0] + (h2 / 2) * b2[0], x[1] + (h2 / 2) * b2[1]], t + h2 / 2);
        const d2 = deriv([x[0] + h2 * c2[0], x[1] + h2 * c2[1]], t + h2);
        x = [x[0] + (h2 / 6) * (a2[0] + 2 * b2[0] + 2 * c2[0] + d2[0]), x[1] + (h2 / 6) * (a2[1] + 2 * b2[1] + 2 * c2[1] + d2[1])];
        t += h2;
      }
    }
    t = (k / n) * tEnd;
    out.push([t, node(x, t)]);
  }
  return out;
}
