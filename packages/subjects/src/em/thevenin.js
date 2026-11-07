/**
 * Thévenin and Norton equivalents of the two-source network in superposition.js, seen from the load.
 *
 * With the load taken out, the rest is linear, so its terminal voltage falls on a straight line as
 * the load draws current: V = V_th − I R_th. Two numbers fix the line. Closed form:
 *   R_th = R₂ ∥ (R₃ + R₁ ∥ R₄)   (both sources switched off, each a wire),
 *   I_N  = V₂/R₂ + V₁ · [R₄/(R₃ + R₄)] / (R₁ + R₃ ∥ R₄)   (terminals shorted, by superposition),
 *   V_th = I_N R_th.
 * A load R_L then draws I = V_th/(R_th + R_L) and takes P = I² R_L, largest at R_L = R_th, where
 * P = V_th²/(4 R_th). In the equivalent circuit the same current heats R_th, so at the peak only
 * half of the equivalent source's power reaches the load: η = R_L/(R_L + R_th).
 *
 * The second method is a bench test: solve the full network (nodes and meshes, networks.js) with two
 * different loads, draw the line through the two (I, V) points, and read V_th and R_th off it. Then
 * the full network at the chosen load must sit on that line.
 */
import { FIXED, twoSource } from './superposition.js';
import { analyse } from './networks.js';

const par = (a, b) => (a * b) / (a + b);

export function closedForm({ V1, V2 }) {
  const { R1, R4, R3, R2 } = FIXED;
  const Rth = par(R2, R3 + par(R1, R4));
  const IN = V2 / R2 + (V1 * (R4 / (R3 + R4))) / (R1 + par(R3, R4));
  return { Rth, IN, Vth: IN * Rth };
}

/** The full network at load RL: terminal voltage and current, and how far nodes and meshes differ. */
export function atLoad({ V1, V2 }, RL) {
  const r = analyse(twoSource(V1, V2, RL));
  const I = r.nodal.i[3];
  return { I, V: I * RL, gap: r.gap, i: r.nodal.i, v: r.nodal.v };
}

export function theveninChecked(state) {
  const { V1, V2, RL } = state;
  const cf = closedForm(state);
  // The bench test: two loads, one line.
  const a = atLoad(state, 1);
  const b = atLoad(state, 10);
  const Rbench = -(b.V - a.V) / (b.I - a.I);
  const Vbench = a.V + a.I * Rbench;
  const here = atLoad(state, RL);
  const scale = Math.max(Math.abs(cf.Vth), 1e-9);
  const gap = Math.max(
    Math.abs(Rbench - cf.Rth) / cf.Rth,
    Math.abs(Vbench - cf.Vth) / scale,
    Math.abs(here.V - (cf.Vth - here.I * cf.Rth)) / scale,
    a.gap, b.gap, here.gap,
  );
  const I = cf.Vth / (cf.Rth + RL);
  const P = I * I * RL;
  const Pmax = (cf.Vth * cf.Vth) / (4 * cf.Rth);
  // Power the real sources put out, net, at this load.
  const Psrc = here.i[0] * V1 + here.i[4] * V2;
  return {
    ...cf,
    Rbench, Vbench,
    I, V: I * RL, P, Pmax,
    Pin: I * I * cf.Rth, // what heats R_th in the equivalent
    eta: RL / (RL + cf.Rth),
    Psrc,
    etaReal: Psrc > 1e-12 ? P / Psrc : null,
    vNodes: here.v,
    iBranches: here.i,
    gap,
  };
}
