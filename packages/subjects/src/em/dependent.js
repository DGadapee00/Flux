/**
 * A dependent source in a feedback amplifier (EEL 3111, methods of analysis).
 *
 * A source V_s with resistance R_s feeds node 1, which has R_in to ground; the voltage across R_in is
 * the controlling voltage v_x = v₁. A voltage-controlled voltage source μ v_x in series with R_o
 * drives node 2, which has the load R_L to ground, and R_f feeds node 2 back to node 1. Kirchhoff's
 * current law at the two nodes gives
 *   v₁ (1/R_s + 1/R_in + 1/R_f) − v₂/R_f = V_s/R_s,
 *   −v₁ (1/R_f + μ/R_o) + v₂ (1/R_o + 1/R_L + 1/R_f) = 0,
 * so the dependent source adds the term μ/R_o to the matrix, not to the right-hand side. It is part
 * of the circuit, not a source of it: zero it and the circuit is a different one. As μ → −∞, v₁ → 0
 * and the gain v₂/V_s → −R_f/R_s, the inverting amplifier.
 *
 * The closed form solves the two equations by Cramer's rule. The second method builds the circuit
 * from element stamps, each resistor, source and the controlled source written into a general
 * conductance matrix, and solves it by elimination; the output resistance comes from a 1 A test
 * current into node 2 with V_s set to zero.
 */
import { gaussJordan } from '../math/linalg.js';

export const PARTS = { Vs: 1, Rs: 1000, Rin: 10000, Ro: 100 };

/** Cramer's rule on the two node equations; V is the input source, Itest a current pushed into node 2. */
export function closedForm({ mu, Rf, RL }, V = PARTS.Vs, Itest = 0) {
  const { Rs, Rin, Ro } = PARTS;
  const a11 = 1 / Rs + 1 / Rin + 1 / Rf;
  const a12 = -1 / Rf;
  const a21 = -(1 / Rf + mu / Ro);
  const a22 = 1 / Ro + 1 / RL + 1 / Rf;
  const b1 = V / Rs;
  const b2 = Itest;
  const det = a11 * a22 - a12 * a21;
  return { v1: (b1 * a22 - a12 * b2) / det, v2: (a11 * b2 - a21 * b1) / det, det };
}

/** The μ at which the two equations stop having one answer (positive feedback). */
export function criticalMu({ Rf, RL }) {
  const { Rs, Rin, Ro } = PARTS;
  const g1 = 1 / Rs + 1 / Rin + 1 / Rf;
  const g2 = 1 / Ro + 1 / RL + 1 / Rf;
  return Ro * (g1 * g2 * Rf - 1 / Rf);
}

/**
 * The same circuit from element stamps. Elements: R (a, b, R); a voltage source in series with a
 * resistor, as its Norton pair (a, b, V, R); a VCVS μ(v_c − v_d) in series with R from a to b, as a
 * controlled current μ(v_c − v_d)/R into b beside the conductance 1/R; and a current source I into b.
 */
export function stamped({ mu, Rf, RL }, V = PARTS.Vs, Itest = 0) {
  const { Rs, Rin, Ro } = PARTS;
  const elements = [
    { kind: 'V', a: 0, b: 1, V, R: Rs },
    { kind: 'R', a: 1, b: 0, R: Rin },
    { kind: 'R', a: 1, b: 2, R: Rf },
    { kind: 'E', a: 0, b: 2, mu, c: 1, d: 0, R: Ro },
    { kind: 'R', a: 2, b: 0, R: RL },
    { kind: 'I', a: 0, b: 2, I: Itest },
  ];
  const n = 2;
  const G = Array.from({ length: n }, () => Array(n).fill(0));
  const rhs = Array(n).fill(0);
  const add = (i, j, g) => {
    if (i > 0 && j > 0) G[i - 1][j - 1] += g;
  };
  const inject = (i, x) => {
    if (i > 0) rhs[i - 1] += x;
  };
  const conductance = (a, b, g) => {
    add(a, a, g);
    add(b, b, g);
    add(a, b, -g);
    add(b, a, -g);
  };
  for (const e of elements) {
    if (e.kind === 'R') conductance(e.a, e.b, 1 / e.R);
    if (e.kind === 'V') {
      conductance(e.a, e.b, 1 / e.R);
      inject(e.b, e.V / e.R);
      inject(e.a, -e.V / e.R);
    }
    if (e.kind === 'I') {
      inject(e.b, e.I);
      inject(e.a, -e.I);
    }
    if (e.kind === 'E') {
      // The current μ(v_c − v_d)/R flows into b and out of a: it depends on node voltages, so it
      // moves to the left-hand side, into the matrix.
      conductance(e.a, e.b, 1 / e.R);
      const g = e.mu / e.R;
      add(e.b, e.c, -g);
      add(e.b, e.d, g);
      add(e.a, e.c, g);
      add(e.a, e.d, -g);
    }
  }
  const inv = gaussJordan(G).inverse;
  const v = inv.map((row) => row.reduce((s, x, j) => s + x * rhs[j], 0));
  return { v1: v[0], v2: v[1], G };
}

/** The amplifier, both ways: node voltages, gain, output resistance, and the same with μ zeroed. */
export function amplifier(p) {
  const cf = closedForm(p);
  const st = stamped(p);
  // Output resistance: V_s off, 1 A into node 2, read v₂ (the load stays in, so this is what the
  // load's own terminals see in parallel with it; it is removed below).
  const tCf = closedForm(p, 0, 1).v2;
  const tSt = stamped(p, 0, 1).v2;
  const outOf = (rPar) => (Math.abs(1 / rPar - 1 / p.RL) < 1e-15 ? Infinity : 1 / (1 / rPar - 1 / p.RL));
  const Rout = outOf(tCf);
  const RoutSt = outOf(tSt);
  const zero = closedForm({ ...p, mu: 0 });
  const Rout0 = outOf(closedForm({ ...p, mu: 0 }, 0, 1).v2);
  const big = Math.max(Math.abs(cf.v1), Math.abs(cf.v2), 1e-12);
  const gap = Math.max(Math.abs(cf.v1 - st.v1) / big, Math.abs(cf.v2 - st.v2) / big, Math.abs(Rout - RoutSt) / Math.abs(Rout));
  const { Vs, Rs } = PARTS;
  return {
    v1: cf.v1,
    v2: cf.v2,
    vx: cf.v1,
    gain: cf.v2 / Vs,
    dep: p.mu * cf.v1,
    gain0: zero.v2 / Vs,
    v1zero: zero.v1,
    Rout,
    Rout0,
    ideal: -p.Rf / Rs,
    det: cf.det,
    critical: criticalMu(p),
    G: st.G,
    gap,
  };
}
