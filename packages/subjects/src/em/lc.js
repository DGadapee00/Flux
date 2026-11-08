/**
 * A charged capacitor discharging into a coil: energy traded between E and B fields (EEL 3111,
 * inductance).
 *
 * A capacitor C charged to V₀ is switched at t = 0 across a coil L with series resistance R. The
 * charge obeys Lq̈ + Rq̇ + q/C = 0. With ω₀ = 1/√(LC), α = R/2L and, while α < ω₀,
 * ω_d = √(ω₀² − α²),
 *   q(t) = CV₀ e^{−αt} (cos ω_d t + (α/ω_d) sin ω_d t),   i(t) = CV₀ (ω₀²/ω_d) e^{−αt} sin ω_d t.
 * The energy ½CV₀² moves into the coil's magnetic field, ½Li², and back, twice each period
 * 2π/ω_d, while the resistor takes ∫ i²R dt. With no resistance the peak current is V₀√(C/L).
 *
 * The second method integrates the circuit equation with Runge–Kutta and also checks that the
 * energy left in C and L plus the energy the resistor has taken always equals ½CV₀².
 */

export const TANK = { C: 1e-6, V0: 10 };

export function lcClosed({ Lmh, R }) {
  const { C, V0 } = TANK;
  const L = Lmh / 1000;
  const w0 = 1 / Math.sqrt(L * C);
  const alpha = R / (2 * L);
  const Q0 = C * V0;
  const under = alpha < w0 * (1 - 1e-9);
  const wd = under ? Math.sqrt(w0 * w0 - alpha * alpha) : 0;
  const q = (t) => Q0 * Math.exp(-alpha * t) * (Math.cos(wd * t) + (alpha / wd) * Math.sin(wd * t));
  const i = (t) => Q0 * ((w0 * w0) / wd) * Math.exp(-alpha * t) * Math.sin(wd * t);
  const E0 = 0.5 * C * V0 * V0;
  return { L, w0, alpha, wd, under, q, i, E0, T: (2 * Math.PI) / wd, Ipk0: V0 * Math.sqrt(C / L), f: wd / (2 * Math.PI), zeta: alpha / w0 };
}

export function lcMarch(state, periods = 4, n = 4000) {
  const c = lcClosed(state);
  const { C } = TANK;
  const tEnd = periods * c.T;
  const h = tEnd / n;
  // y = [q, i], with i = −dq/dt: q̇ = −i, L i̇ = q/C − R i.
  const F = ([q, i]) => [-i, (q / C - state.R * i) / c.L];
  let y = [C * TANK.V0, 0];
  let lost = 0;
  const pts = [[0, y[0], y[1], c.E0, 0, 0]];
  let worst = 0;
  for (let k = 0; k < n; k++) {
    const k1 = F(y);
    const k2 = F([y[0] + (h / 2) * k1[0], y[1] + (h / 2) * k1[1]]);
    const k3 = F([y[0] + (h / 2) * k2[0], y[1] + (h / 2) * k2[1]]);
    const k4 = F([y[0] + h * k3[0], y[1] + h * k3[1]]);
    const i0 = y[1];
    y = [y[0] + (h / 6) * (k1[0] + 2 * k2[0] + 2 * k3[0] + k4[0]), y[1] + (h / 6) * (k1[1] + 2 * k2[1] + 2 * k3[1] + k4[1])];
    // Resistor energy by the trapezoid rule on i²R; RK4 midpoints for accuracy.
    const im = i0 + (h / 2) * k2[1];
    lost += (h / 6) * state.R * (i0 * i0 + 4 * im * im + y[1] * y[1]);
    const EC = (y[0] * y[0]) / (2 * C);
    const EL = 0.5 * c.L * y[1] * y[1];
    worst = Math.max(worst, Math.abs(EC + EL + lost - c.E0) / c.E0);
    if ((k + 1) % 10 === 0) pts.push([(k + 1) * h, y[0], y[1], EC, EL, lost]);
  }
  return { pts, y, tEnd, energyGap: worst };
}

export function lcChecked(state) {
  const cf = lcClosed(state);
  const m = lcMarch(state);
  let gap = m.energyGap;
  for (const [t, q, i] of m.pts) gap = Math.max(gap, Math.abs(q - cf.q(t)) / (TANK.C * TANK.V0), Math.abs(i - cf.i(t)) / cf.Ipk0);
  return { ...cf, pts: m.pts, tEnd: m.tEnd, energyGap: m.energyGap, gap };
}
