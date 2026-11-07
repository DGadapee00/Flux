/**
 * Euler's equations and the stability of torque-free spin (the satellite's Attitude subsystem).
 *
 * About its principal axes a rigid body with no torque on it obeys
 *   I₁ω̇₁ = (I₂ − I₃)ω₂ω₃,   I₂ω̇₂ = (I₃ − I₁)ω₃ω₁,   I₃ω̇₃ = (I₁ − I₂)ω₁ω₂,
 * and keeps its kinetic energy and the size of its angular momentum. Spin at ω₀ about axis s with a
 * small wobble on the other two, a and b, and linearise: the wobble obeys
 *   ẅ = −ω₀² (I_s − I_a)(I_s − I_b)/(I_a I_b) · w.
 * About the least or the greatest axis the factor is positive, so the wobble oscillates at
 * Ω = ω₀√(…). About the middle axis it is negative, and the wobble grows as e^{λt},
 * λ = ω₀√((I_s − I_a)(I_b − I_s)/(I_a I_b)), until the body flips.
 *
 * The lab integrates the full equations by RK4, with the attitude quaternion alongside. The second
 * method is that linear theory, checked against a run with a wobble of 10⁻⁶: its measured
 * frequency, or its measured growth rate, against Ω or λ.
 */
import { quatMul } from './attitude.js';

/** Boxes of 12 kg: side lengths (m) along x, y, z, and principal inertias I = m(b² + c²)/12. */
export const BODIES = {
  brick: { name: 'Brick, 0.6 × 0.4 × 0.2 m', dims: [0.6, 0.4, 0.2] },
  plate: { name: 'Plate, 0.5 × 0.3 × 0.05 m', dims: [0.5, 0.3, 0.05] },
};
export const MASS = 12;
export function inertias(body) {
  const [a, b, c] = BODIES[body].dims;
  return [(MASS * (b * b + c * c)) / 12, (MASS * (a * a + c * c)) / 12, (MASS * (a * a + b * b)) / 12];
}

const AXIS = { x: 0, y: 1, z: 2 };

/** The linear prediction for spin ω₀ about `axis`: a wobble frequency, or a growth rate. */
export function linearSpin(I, axis, w0) {
  const s = AXIS[axis];
  const [a, b] = [0, 1, 2].filter((i) => i !== s);
  const k = (w0 * w0 * (I[s] - I[a]) * (I[s] - I[b])) / (I[a] * I[b]);
  return k > 0 ? { stable: true, omega: Math.sqrt(k), lambda: 0 } : { stable: false, omega: 0, lambda: Math.sqrt(-k) };
}

/** RK4 on Euler's equations with the attitude quaternion q̇ = ½ q ⊗ (0, ω). */
export function simulate(I, axis, w0, eps, T, dt = 0.01, every = 5) {
  const s = AXIS[axis];
  const w = [0, 0, 0].map((_, i) => (i === s ? w0 : eps * w0));
  let y = [...w, 1, 0, 0, 0];
  const f = (v) => {
    const [w1, w2, w3] = v;
    const q = v.slice(3);
    const dq = quatMul(q, [0, w1, w2, w3]).map((x) => x / 2);
    return [((I[1] - I[2]) * w2 * w3) / I[0], ((I[2] - I[0]) * w3 * w1) / I[1], ((I[0] - I[1]) * w1 * w2) / I[2], ...dq];
  };
  const energy = (v) => 0.5 * (I[0] * v[0] ** 2 + I[1] * v[1] ** 2 + I[2] * v[2] ** 2);
  const hMag = (v) => Math.hypot(I[0] * v[0], I[1] * v[1], I[2] * v[2]);
  const E0 = energy(y);
  const H0 = hMag(y);
  const N = Math.round(T / dt);
  const samples = [{ t: 0, w: y.slice(0, 3), q: y.slice(3) }];
  for (let n = 1; n <= N; n++) {
    const k1 = f(y);
    const k2 = f(y.map((v, i) => v + (dt / 2) * k1[i]));
    const k3 = f(y.map((v, i) => v + (dt / 2) * k2[i]));
    const k4 = f(y.map((v, i) => v + dt * k3[i]));
    y = y.map((v, i) => v + (dt / 6) * (k1[i] + 2 * k2[i] + 2 * k3[i] + k4[i]));
    const qn = Math.hypot(y[3], y[4], y[5], y[6]);
    for (let i = 3; i < 7; i++) y[i] /= qn;
    if (n % every === 0) samples.push({ t: n * dt, w: y.slice(0, 3), q: y.slice(3) });
  }
  return { samples, drift: Math.max(Math.abs(energy(y) - E0) / E0, Math.abs(hMag(y) - H0) / H0) };
}

/** The second method: measure the tiny wobble's frequency or growth rate from a run. */
export function measureSpin(I, axis, w0) {
  const lin = linearSpin(I, axis, w0);
  const s = AXIS[axis];
  const a = [0, 1, 2].find((i) => i !== s);
  const eps = 1e-6;
  if (lin.stable) {
    // Time between upward zero crossings of the wobble, averaged over many periods.
    const T = (20 * 2 * Math.PI) / lin.omega;
    const { samples } = simulate(I, axis, w0, eps, T, 0.002, 1);
    const ups = [];
    for (let i = 1; i < samples.length; i++) {
      const [p, c] = [samples[i - 1], samples[i]];
      if (p.w[a] < 0 && c.w[a] >= 0) ups.push(p.t + ((c.t - p.t) * -p.w[a]) / (c.w[a] - p.w[a]));
    }
    const period = (ups.at(-1) - ups[0]) / (ups.length - 1);
    return { measured: (2 * Math.PI) / period, predicted: lin.omega };
  }
  // Growth rate from the wobble's size between 10⁻⁴ and 10⁻² of the spin.
  const T = Math.log(1e5) / lin.lambda;
  const { samples } = simulate(I, axis, w0, eps, T, 0.002, 1);
  const size = (smp) => Math.hypot(...smp.w.filter((_, i) => i !== s)) / w0;
  const at = (level) => {
    for (let i = 1; i < samples.length; i++) {
      const [p, c] = [size(samples[i - 1]), size(samples[i])];
      if (p < level && c >= level) return samples[i - 1].t + ((samples[i].t - samples[i - 1].t) * Math.log(level / p)) / Math.log(c / p);
    }
    return null;
  };
  const t1 = at(1e-4);
  const t2 = at(1e-2);
  return { measured: Math.log(100) / (t2 - t1), predicted: lin.lambda };
}
