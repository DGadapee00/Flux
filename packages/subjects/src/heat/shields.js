/**
 * Radiation shields between two plates (EML 4140, gray-body networks).
 *
 * Two large parallel plates at T₁ and T₂ exchange radiation. Each gray surface is a node joined to
 * its black-body potential σT⁴ through a surface resistance (1 − ε)/ε, and two facing plates are
 * joined through a space resistance 1 (per unit area, F = 1). With N thin shields of emissivity ε_s
 * between them, the resistances add in series:
 *   q″ = σ(T₁⁴ − T₂⁴) / [1/ε₁ + 1/ε₂ − 1 + N(2/ε_s − 1)].
 * A shield need not be cold: it floats at whatever temperature passes the same flux on both sides.
 *
 * The second method sets each shield's temperature from the flux balance with its neighbours and
 * sweeps until the temperatures stop moving, then reads the flux off any one gap.
 */

export const SIGMA = 5.670374419e-8;
export const PLATES = { T1: 600, T2: 300, e1: 0.8, e2: 0.8 };

const pair = (Ta, Tb, ea, eb) => (SIGMA * (Ta ** 4 - Tb ** 4)) / (1 / ea + 1 / eb - 1);

export function shieldsClosed({ N, es }) {
  const { T1, T2, e1, e2 } = PLATES;
  const Rends = 1 / e1 + 1 / e2 - 1;
  const Rs = 2 / es - 1;
  const R = Rends + N * Rs;
  const q = (SIGMA * (T1 ** 4 - T2 ** 4)) / R;
  const q0 = (SIGMA * (T1 ** 4 - T2 ** 4)) / Rends;
  // σT⁴ falls linearly with resistance along the chain. Gap k (0 … N) joins surface k to k + 1.
  const res = (k) => (N === 0 ? Rends : k === 0 ? 1 / e1 + 1 / es - 1 : k === N ? 1 / es + 1 / e2 - 1 : Rs);
  const T = [T1];
  let Eb = SIGMA * T1 ** 4;
  for (let k = 0; k < N; k++) {
    Eb -= q * res(k);
    T.push((Eb / SIGMA) ** 0.25);
  }
  T.push(T2);
  return { q, q0, R, T, cut: q / q0 };
}

/** Gauss–Seidel on the shield temperatures: each sits where its two neighbours pass equal flux. */
export function shieldsNumeric({ N, es }) {
  const { T1, T2, e1, e2 } = PLATES;
  const em = [e1, ...Array(N).fill(es), e2];
  const T = Array.from({ length: N + 2 }, (_, i) => T1 + ((T2 - T1) * i) / (N + 1));
  for (let it = 0; it < 20000; it++) {
    let move = 0;
    for (let i = 1; i <= N; i++) {
      // Equal flux in and out: (σT_{i−1}⁴ − σT_i⁴)/Ra = (σT_i⁴ − σT_{i+1}⁴)/Rb.
      const Ra = 1 / em[i - 1] + 1 / em[i] - 1;
      const Rb = 1 / em[i] + 1 / em[i + 1] - 1;
      const E = (T[i - 1] ** 4 / Ra + T[i + 1] ** 4 / Rb) / (1 / Ra + 1 / Rb);
      const t = E ** 0.25;
      move = Math.max(move, Math.abs(t - T[i]));
      T[i] = t;
    }
    if (move < 1e-11) break;
  }
  const qs = T.slice(0, -1).map((t, i) => pair(t, T[i + 1], em[i], em[i + 1]));
  return { T, q: qs[0], spread: Math.max(...qs) - Math.min(...qs) };
}

export function shieldsChecked(state) {
  const cf = shieldsClosed(state);
  const nu = shieldsNumeric(state);
  const gap = Math.max(Math.abs(nu.q - cf.q) / cf.q, ...cf.T.map((t, i) => Math.abs(t - nu.T[i]) / t));
  return { ...cf, qNum: nu.q, gap };
}
