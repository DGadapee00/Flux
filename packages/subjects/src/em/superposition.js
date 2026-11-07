/**
 * Superposition on a two-source resistive circuit (EEL 3111, circuit theorems).
 *
 * Source V₁ with its resistor R₁ feeds node 1. A shunt R₄ runs from node 1 to ground, R₃ joins node 1
 * to node 2, the load R_L hangs from node 2 to ground, and source V₂ with its resistor R₂ feeds node 2
 * from the right. The node equations are G v = i_s with the sources only on the right, so every
 * voltage and current is a sum of one part from each source. To find the part from one source, set
 * the other to zero: a voltage source becomes a wire, leaving its series resistor in place.
 *
 * Power is not linear. The load current with both on is I₁ + I₂, so its power is
 *   P = R_L (I₁ + I₂)² = P₁ + P₂ + 2 R_L I₁ I₂,
 * more than P₁ + P₂ when the parts push the same way, less when they oppose.
 *
 * Each of the three circuits (V₁ alone, V₂ alone, both) is solved twice, by node voltages and by mesh
 * currents (networks.js), and the two must agree on every branch current.
 */
import { analyse } from './networks.js';

export const FIXED = { R1: 2, R4: 4, R3: 2, R2: 4 };
export const LOAD = 3; // the load's branch index

/** The circuit with each source at the voltage given (0 for off) and the load at RL ohms. */
export function twoSource(V1, V2, RL) {
  const { R1, R4, R3, R2 } = FIXED;
  return {
    nodes: 3,
    branches: [
      { a: 0, b: 1, R: R1, V: V1, src: 1 },
      { a: 1, b: 0, R: R4, V: 0 },
      { a: 1, b: 2, R: R3, V: 0 },
      { a: 2, b: 0, R: RL, V: 0, load: true },
      { a: 0, b: 2, R: R2, V: V2, src: 2 },
    ],
    meshes: [
      [[0, 1], [1, 1]],
      [[2, 1], [3, 1], [1, -1]],
      [[4, 1], [3, 1]],
    ],
  };
}

function solveOne(V1, V2, RL) {
  const r = analyse(twoSource(V1, V2, RL));
  const I = r.nodal.i[LOAD];
  return { v: r.nodal.v, i: r.nodal.i, I, VL: I * RL, P: I * I * RL, gap: r.gap };
}

/** The load's current, voltage and power from V₁ alone, from V₂ alone, and from both. */
export function superpose({ V1, V2, RL }) {
  const one = solveOne(V1, 0, RL);
  const two = solveOne(0, V2, RL);
  const both = solveOne(V1, V2, RL);
  const big = Math.max(...both.i.map(Math.abs), ...one.i.map(Math.abs), ...two.i.map(Math.abs), 1e-12);
  // Superposition itself: every branch current with both on is the sum of the two parts.
  const sumGap = Math.max(...both.i.map((x, k) => Math.abs(x - one.i[k] - two.i[k]))) / big;
  const powerSum = one.P + two.P;
  return {
    one,
    two,
    both,
    sumGap,
    routeGap: Math.max(one.gap, two.gap, both.gap),
    gap: Math.max(one.gap, two.gap, both.gap, sumGap),
    powerSum,
    cross: 2 * RL * one.I * two.I,
    // The V₂ that cancels the load current against V₁'s part.
    cancelV2: -one.I / solveOne(0, 1, RL).I,
  };
}
