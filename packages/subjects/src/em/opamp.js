/**
 * An inverting amplifier built on an op amp with finite open-loop gain and supply rails
 * (EEL 3111, operational amplifiers).
 *
 * The op amp's output is A(v₊ − v₋) with v₊ grounded, so v_out = −A v₋, until it reaches a rail at
 * ±V_sat. R₁ runs from the input to v₋ and R_f from the output back to v₋. Kirchhoff's current law at
 * v₋, (v_in − v₋)/R₁ + (v_out − v₋)/R_f = 0, with v_out = −A v₋ gives
 *   G = v_out/v_in = −(R_f/R₁) / (1 + (1 + R_f/R₁)/A).
 * As A → ∞, G → −R_f/R₁ and v₋ → 0, the virtual ground. With A = 10⁵ and a gain of 10 the error is
 * about 0.01%: the resistors set the gain, not the op amp. Past a rail the output stops at ±V_sat.
 *
 * The closed form is that formula. The second method writes the two unknowns v₋ and v_out as a
 * linear system, KCL and the op amp's own equation, and solves it by elimination.
 */
import { gaussJordan } from '../math/linalg.js';

export function closedGain({ A, R1, Rf }) {
  return -(Rf / R1) / (1 + (1 + Rf / R1) / A);
}

/** The linear circuit as a 2×2 system in (v₋, v_out), solved by elimination. */
export function solveLinear({ A, R1, Rf }, vin) {
  const M = [
    [-(1 / R1 + 1 / Rf), 1 / Rf],
    [A, 1],
  ];
  const rhs = [-vin / R1, 0];
  const inv = gaussJordan(M).inverse;
  const vm = inv[0][0] * rhs[0] + inv[0][1] * rhs[1];
  const vo = inv[1][0] * rhs[0] + inv[1][1] * rhs[1];
  return { vm, vo };
}

/** The output for an input v_in, with the rails: linear until |v_out| would pass V_sat. */
export function outputAt(p, vin) {
  const vo = closedGain(p) * vin;
  if (Math.abs(vo) <= p.Vsat) return { vo, vm: -vo / p.A, clipped: false };
  const vs = Math.sign(vo) * p.Vsat;
  // Clipped: the output is pinned, and v₋ follows from the divider R₁, R_f between v_in and the rail.
  return { vo: vs, vm: (vin * p.Rf + vs * p.R1) / (p.R1 + p.Rf), clipped: true };
}

/** One period of a sine input, the output, and the checks. */
export function amplifierChecked(p, n = 240) {
  const G = closedGain(p);
  const lin = solveLinear(p, 1);
  const gap = Math.max(Math.abs(lin.vo - G) / Math.abs(G), Math.abs(lin.vm - -G / p.A) / Math.max(Math.abs(G / p.A), 1e-15));
  const ts = Array.from({ length: n + 1 }, (_, i) => i / n);
  const vin = ts.map((t) => p.amp * Math.sin(2 * Math.PI * t));
  const out = vin.map((v) => outputAt(p, v));
  const ideal = -p.Rf / p.R1;
  const peak = Math.max(...out.map((o) => Math.abs(o.vo)));
  return {
    G, ideal, gap, ts, vin,
    vout: out.map((o) => o.vo),
    clipped: out.some((o) => o.clipped),
    peak,
    // v₋ over the period: millivolts while linear, far more once the output is pinned at a rail.
    vmPeak: Math.max(...out.map((o) => Math.abs(o.vm))),
    error: Math.abs(G - ideal) / Math.abs(ideal),
    // How large the input may be before the output reaches a rail.
    maxIn: p.Vsat / Math.abs(G),
  };
}
