/**
 * Second-order circuits: series and parallel RLC driven by a step (EEL 3111).
 *
 * Series RLC with a 10 V step: the capacitor voltage obeys LC v″ + RC v′ + v = V. Parallel RLC with a
 * 10 mA step of current: the inductor current obeys LC i″ + (L/R) i′ + i = I. Both have
 * ω₀ = 1/√(LC), with
 *   series: α = R/2L,   parallel: α = 1/(2RC),   ζ = α/ω₀.
 * ζ < 1 rings (underdamped), ζ = 1 is critically damped, ζ > 1 creeps (overdamped). More resistance
 * damps a series circuit more, but a parallel one less: a large parallel R barely loads the tank.
 *
 * The closed form is the textbook step response in each regime. The second method integrates the
 * differential equation with fourth-order Runge–Kutta.
 */

export const PARTS = { L: 0.01, C: 1e-6, V: 10, I: 0.01 };

export function rlcClosed({ topo, R }) {
  const { L, C } = PARTS;
  const w0 = 1 / Math.sqrt(L * C);
  const alpha = topo === 'parallel' ? 1 / (2 * R * C) : R / (2 * L);
  const zeta = alpha / w0;
  const final = topo === 'parallel' ? PARTS.I : PARTS.V;
  let y;
  if (Math.abs(zeta - 1) < 1e-9) {
    y = (t) => final * (1 - (1 + w0 * t) * Math.exp(-w0 * t));
  } else if (zeta < 1) {
    const wd = w0 * Math.sqrt(1 - zeta * zeta);
    y = (t) => final * (1 - Math.exp(-alpha * t) * (Math.cos(wd * t) + (alpha / wd) * Math.sin(wd * t)));
  } else {
    const s = w0 * Math.sqrt(zeta * zeta - 1);
    const s1 = -alpha + s;
    const s2 = -alpha - s;
    y = (t) => final * (1 + (s2 * Math.exp(s1 * t) - s1 * Math.exp(s2 * t)) / (s1 - s2));
  }
  const regime = Math.abs(zeta - 1) < 1e-9 ? 'critically damped' : zeta < 1 ? 'underdamped' : 'overdamped';
  const peak = zeta < 1 ? Math.exp((-Math.PI * zeta) / Math.sqrt(1 - zeta * zeta)) : 0;
  return { w0, alpha, zeta, regime, y, final, overshoot: peak, f0: w0 / (2 * Math.PI) };
}

export const T_SHOW = 0.004;

export function rlcNumeric(state, n = 4000) {
  const c = rlcClosed(state);
  const { w0, alpha, final } = c;
  // y″ + 2αy′ + ω₀²y = ω₀² · final, from rest.
  const F = ([y, v]) => [v, w0 * w0 * (final - y) - 2 * alpha * v];
  let s = [0, 0];
  const h = T_SHOW / n;
  const out = [[0, 0]];
  for (let i = 0; i < n; i++) {
    const k1 = F(s);
    const k2 = F([s[0] + (h / 2) * k1[0], s[1] + (h / 2) * k1[1]]);
    const k3 = F([s[0] + (h / 2) * k2[0], s[1] + (h / 2) * k2[1]]);
    const k4 = F([s[0] + h * k3[0], s[1] + h * k3[1]]);
    s = [s[0] + (h / 6) * (k1[0] + 2 * k2[0] + 2 * k3[0] + k4[0]), s[1] + (h / 6) * (k1[1] + 2 * k2[1] + 2 * k3[1] + k4[1])];
    if ((i + 1) % 20 === 0) out.push([(i + 1) * h, s[0]]);
  }
  return out;
}

export function rlcChecked(state) {
  const cf = rlcClosed(state);
  const pts = rlcNumeric(state);
  const gap = Math.max(...pts.map(([t, y]) => Math.abs(y - cf.y(t)))) / cf.final;
  return { ...cf, pts, gap };
}
