/**
 * Phasors and complex impedance in a series circuit (EEL 3111, Sinusoidal steady state).
 *
 * A source v_s = V cos ωt drives R, L and C in series. In steady state every voltage is a sine at
 * ω, fixed by an amplitude and a phase: a phasor. A derivative becomes multiplication by jω, so
 *   Z_R = R,   Z_L = jωL,   Z_C = 1/(jωC),   I = V/(Z_R + Z_L + Z_C),   V_k = Z_k I,
 * and Kirchhoff's voltage law holds for the phasors: V_R + V_L + V_C = V. It does not hold for the
 * amplitudes, so 3 V across R and 4 V across C make 5 V, and at resonance, ω²LC = 1, the inductor
 * and capacitor can each carry many times the source voltage while cancelling each other.
 *
 * The second method solves the circuit's differential equation for its periodic steady state: the
 * trapezoid rule over one period (stable however fast the circuit's own time constant), shooting for
 * the starting state that repeats, then each waveform's amplitude and phase by Fourier projection.
 */
export const CIRCUITS = {
  rc: { name: 'Series RC', L: false, C: true },
  rl: { name: 'Series RL', L: true, C: false },
  rlc: { name: 'Series RLC', L: true, C: true },
};

// Complex numbers as [re, im].
const add = (a, b) => [a[0] + b[0], a[1] + b[1]];
const mul = (a, b) => [a[0] * b[0] - a[1] * b[1], a[0] * b[1] + a[1] * b[0]];
const div = (a, b) => {
  const m = b[0] * b[0] + b[1] * b[1];
  return [(a[0] * b[0] + a[1] * b[1]) / m, (a[1] * b[0] - a[0] * b[1]) / m];
};
export const mag = (z) => Math.hypot(z[0], z[1]);
export const phaseDeg = (z) => (Math.atan2(z[1], z[0]) * 180) / Math.PI;

/** The phasor solution. V is the source amplitude (V), f in Hz, R in Ω, L in H, C in F. */
export function phasors({ circuit, V, f, R, L, C }) {
  const spec = CIRCUITS[circuit];
  const w = 2 * Math.PI * f;
  const ZR = [R, 0];
  const ZL = spec.L ? [0, w * L] : [0, 0];
  const ZC = spec.C ? [0, -1 / (w * C)] : [0, 0];
  const Z = add(add(ZR, ZL), ZC);
  const I = div([V, 0], Z);
  return { w, Z, I, VR: mul(ZR, I), VL: mul(ZL, I), VC: mul(ZC, I), spec, f0: spec.L && spec.C ? 1 / (2 * Math.PI * Math.sqrt(L * C)) : null };
}

/** The second method: periodic steady state by the trapezoid rule and shooting. */
export function steadyState({ circuit, V, f, R, L, C }, base = 4000) {
  const spec = CIRCUITS[circuit];
  // The trapezoid rule's phase error grows with the resonance's sharpness Q, so a sharp one gets more steps.
  const Q = spec.L && spec.C ? Math.sqrt(L / C) / R : 1;
  const N = 2 * Math.ceil((base * Math.max(1, Q / 3)) / 2);
  const w = 2 * Math.PI * f;
  const T = 1 / f;
  const h = T / N;
  // x' = A x + b vs(t), and the outputs (vR, vL, vC) as rows of x and vs.
  let A;
  let b;
  let out;
  if (circuit === 'rlc') {
    // x = [i, vC]
    A = [[-R / L, -1 / L], [1 / C, 0]];
    b = [1 / L, 0];
    out = (x, vs) => [R * x[0], vs - R * x[0] - x[1], x[1]];
  } else if (circuit === 'rc') {
    A = [[-1 / (R * C)]];
    b = [1 / (R * C)];
    out = (x, vs) => [vs - x[0], 0, x[0]];
  } else {
    A = [[-R / L]];
    b = [1 / L];
    out = (x, vs) => [R * x[0], vs - R * x[0], 0];
  }
  const n = A.length;
  const I = (k) => Array.from({ length: n }, (_, i) => Array.from({ length: n }, (_, j) => (i === j ? k : 0)));
  const M = A.map((row, i) => row.map((a, j) => I(1)[i][j] - (h / 2) * a));
  const P = A.map((row, i) => row.map((a, j) => I(1)[i][j] + (h / 2) * a));
  const solve = (Mx, r) => {
    if (n === 1) return [r[0] / Mx[0][0]];
    const det = Mx[0][0] * Mx[1][1] - Mx[0][1] * Mx[1][0];
    return [(r[0] * Mx[1][1] - Mx[0][1] * r[1]) / det, (Mx[0][0] * r[1] - Mx[1][0] * r[0]) / det];
  };
  const vs = (t) => V * Math.cos(w * t);
  const run = (x0, forced, record) => {
    let x = x0.slice();
    const rec = [];
    for (let k = 0; k < N; k++) {
      if (record) rec.push(out(x, vs(k * h)));
      const u = forced ? (h / 2) * (vs(k * h) + vs((k + 1) * h)) : 0;
      const r = P.map((row, i) => row.reduce((s, a, j) => s + a * x[j], 0) + u * b[i]);
      x = solve(M, r);
    }
    return { x, rec };
  };
  // x(T) = Φ x(0) + c: find Φ from unit starts without the source, c from a zero start with it.
  const c = run(new Array(n).fill(0), true, false).x;
  const Phi = Array.from({ length: n }, (_, j) => run(I(1)[j], false, false).x);
  const IminusPhi = Array.from({ length: n }, (_, i) => Array.from({ length: n }, (_, j) => (i === j ? 1 : 0) - Phi[j][i]));
  const x0 = solve(IminusPhi, c);
  const { rec } = run(x0, true, true);
  // Fourier projection of each output onto cos ωt and sin ωt: v = Re(Vk e^{jωt}).
  const proj = (k) => {
    let a = 0;
    let s = 0;
    rec.forEach((o, m) => {
      a += o[k] * Math.cos(w * m * h);
      s += o[k] * Math.sin(w * m * h);
    });
    return [(2 * a) / N, (-2 * s) / N];
  };
  return { VR: proj(0), VL: proj(1), VC: proj(2) };
}

/** Both methods and their largest disagreement, as a share of the source amplitude. */
export function analyse(p) {
  const a = phasors(p);
  const b = steadyState(p);
  const gap = Math.max(...['VR', 'VL', 'VC'].map((k) => mag([a[k][0] - b[k][0], a[k][1] - b[k][1]]))) / p.V;
  return { ...a, num: b, gap };
}
