/**
 * A switched first-order circuit, RC or RL (EEL 3111, first-order circuits).
 *
 * A source V_s with R₁ feeds node A through a switch. R₂ runs from A to ground, and the storage
 * element, a capacitor C or an inductor L, hangs from A to ground behind its own series R₃. The
 * switch closes at t = 0 with the element empty, and opens again at t₁.
 *
 * The element sees the rest of the circuit as its Thévenin equivalent, which changes with the switch:
 *   closed: R_th = R₃ + R₁ ∥ R₂,  V_th = V_s R₂/(R₁ + R₂);   open: R_th = R₃ + R₂,  V_th = 0.
 * So τ = R_th C or L/R_th is not set by R₁ alone, and it is different before and after t₁.
 * Each stretch relaxes as x(t) = x(∞) + [x(start) − x(∞)] e^{−(t − start)/τ}, where x is the
 * capacitor's voltage or the inductor's current, which cannot jump at the switching instant.
 * The inductor's voltage can: when the switch opens, the current it carries is forced through
 * R₂ + R₃ at once.
 *
 * Second method: RK4 on the circuit's own node equation at A, switch and all, with no Thévenin step.
 */

const par = (a, b) => (a * b) / (a + b);

export function thevenin({ Vs, R1, R2, R3 }, closed) {
  return closed ? { Rth: R3 + par(R1, R2), Vth: (Vs * R2) / (R1 + R2) } : { Rth: R3 + R2, Vth: 0 };
}

/** The closed form: the state (v_C or i_L) at time t. */
export function stateAt(p, t) {
  const { kind, C, L, t1 } = p;
  const on = thevenin(p, true);
  const off = thevenin(p, false);
  const tauOn = kind === 'C' ? on.Rth * C : L / on.Rth;
  const tauOff = kind === 'C' ? off.Rth * C : L / off.Rth;
  const finalOn = kind === 'C' ? on.Vth : on.Vth / on.Rth;
  const atT1 = finalOn * (1 - Math.exp(-t1 / tauOn));
  if (t <= t1) return finalOn * (1 - Math.exp(-t / tauOn));
  return atT1 * Math.exp(-(t - t1) / tauOff);
}

/** The node equation at A, solved for the state's rate of change. */
function rate(p, x, closed) {
  const { kind, Vs, R1, R2, R3, C, L } = p;
  const s = closed ? 1 : 0;
  if (kind === 'C') {
    const vA = ((s * Vs) / R1 + x / R3) / (s / R1 + 1 / R2 + 1 / R3);
    return (vA - x) / (R3 * C);
  }
  const vA = ((s * Vs) / R1 - x) / (s / R1 + 1 / R2);
  return (vA - R3 * x) / L;
}

/** RK4 from rest through both stretches, sampled at the times given (sorted). */
export function stateRK4(p, times, sub = 400) {
  const out = [];
  let x = 0;
  let t = 0;
  const step = (t0, tEnd, closed) => {
    const n = Math.max(1, Math.ceil(((tEnd - t0) / p.T) * sub));
    const h = (tEnd - t0) / n;
    for (let k = 0; k < n; k++) {
      const k1 = rate(p, x, closed);
      const k2 = rate(p, x + (h / 2) * k1, closed);
      const k3 = rate(p, x + (h / 2) * k2, closed);
      const k4 = rate(p, x + h * k3, closed);
      x += (h / 6) * (k1 + 2 * k2 + 2 * k3 + k4);
    }
  };
  for (const ts of times) {
    if (t < p.t1 && ts > p.t1) {
      step(t, p.t1, true);
      t = p.t1;
    }
    step(t, ts, ts <= p.t1);
    t = ts;
    out.push(x);
  }
  return out;
}

export function switchChecked(p) {
  const on = thevenin(p, true);
  const off = thevenin(p, false);
  const tauOn = p.kind === 'C' ? on.Rth * p.C : p.L / on.Rth;
  const tauOff = p.kind === 'C' ? off.Rth * p.C : p.L / off.Rth;
  const n = 400;
  const ts = Array.from({ length: n + 1 }, (_, i) => (p.T * i) / n);
  const closed = ts.map((t) => stateAt(p, t));
  const numeric = stateRK4(p, ts.slice(1));
  numeric.unshift(0);
  const big = Math.max(...closed.map(Math.abs), 1e-15);
  const gap = Math.max(...closed.map((x, i) => Math.abs(x - numeric[i]))) / big;
  const atT1 = stateAt(p, p.t1);
  // The element's own voltage just after the switch opens: the capacitor keeps its voltage; the
  // inductor's current is forced through R₂ + R₃.
  const vOpen = p.kind === 'C' ? atT1 : -atT1 * off.Rth;
  return {
    ts, closed, numeric, gap,
    on, off, tauOn, tauOff,
    tauR1: p.kind === 'C' ? p.R1 * p.C : p.L / p.R1,
    final: p.kind === 'C' ? on.Vth : on.Vth / on.Rth,
    atT1, vOpen,
  };
}
