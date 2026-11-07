/**
 * Feedback control of a satellite's pointing (the satellite's Attitude subsystem).
 *
 * One axis: inertia J, pointing error θ, a steady disturbance torque d, and a reaction wheel whose
 * torque T follows the command u with a lag τ:
 *   J θ̈ = T + d,   τ Ṫ = u − T,   u = −(K_p θ + K_d θ̇ + K_i ∫θ dt).
 * In Laplace terms the plant is G(s) = 1/(J s² (τs + 1)) and the controller C(s) = K_p + K_d s + K_i/s,
 * so the closed-loop poles are the roots of 1 + C(s)G(s) = 0, that is of
 *   P(s) = Jτ s⁴ + J s³ + K_d s² + K_p s + K_i.
 * A step disturbance gives Θ(s) = d (τs + 1)/P(s). With K_i = 0 one root is zero and the error
 * settles at d/K_p; with K_i > 0 it settles at zero. P alone never settles: the s term is missing.
 * PD is stable only while K_p < K_d/τ: past that the wheel's lag lets the swing grow.
 *
 * The response is built from the poles, θ(t) = Σ d(τp + 1)e^{pt}/P′(p), and checked against RK4
 * on the differential equations.
 */
export const J_SAT = 10; // kg·m²
export const T_RUN = 60; // s

// Complex arithmetic on [re, im] pairs.
const cadd = (a, b) => [a[0] + b[0], a[1] + b[1]];
const csub = (a, b) => [a[0] - b[0], a[1] - b[1]];
const cmul = (a, b) => [a[0] * b[0] - a[1] * b[1], a[0] * b[1] + a[1] * b[0]];
const cdiv = (a, b) => {
  const m = b[0] * b[0] + b[1] * b[1];
  return [(a[0] * b[0] + a[1] * b[1]) / m, (a[1] * b[0] - a[0] * b[1]) / m];
};
const cexp = ([re, im]) => [Math.exp(re) * Math.cos(im), Math.exp(re) * Math.sin(im)];
const horner = (coef, z) => coef.reduce((acc, c) => cadd(cmul(acc, z), [c, 0]), [0, 0]);

/** Roots of a real polynomial (highest power first) by Durand–Kerner. */
export function roots(coef) {
  const a = coef.map((c) => c / coef[0]);
  const n = a.length - 1;
  let z = Array.from({ length: n }, (_, k) => cexp([0, (2 * Math.PI * k) / n + 0.4]).map((v) => 0.9 * v));
  for (let it = 0; it < 500; it++) {
    let moved = 0;
    z = z.map((zi, i) => {
      let den = [1, 0];
      z.forEach((zj, j) => {
        if (j !== i) den = cmul(den, csub(zi, zj));
      });
      const step = cdiv(horner(a, zi), den);
      moved = Math.max(moved, Math.hypot(...step));
      return csub(zi, step);
    });
    if (moved < 1e-15) break;
  }
  return z.map(([re, im]) => [re, Math.abs(im) < 1e-10 ? 0 : im]);
}

export function charPoly({ Kp, Kd, Ki, tau, J = J_SAT }) {
  return [J * tau, J, Kd, Kp, Ki];
}

const deriv = (P) => P.slice(0, -1).map((c, i) => c * (P.length - 1 - i));

/**
 * θ(t) from the poles: the residues of d(τs + 1)e^{st}/P(s). A simple pole p gives N(p)/P′(p) e^{pt}.
 * Two poles that coincide, as at 5(s + 1)²(s² + 1), give (A + Bt)e^{pt} with P = (s − p)²Q:
 * B = N(p)/Q(p), A = (N′Q − NQ′)/Q² at p, where Q(p) = P″(p)/2 and Q′(p) = P‴(p)/6.
 */
export function modalResponse({ Kp, Kd, Ki, tau, d, J = J_SAT }) {
  const P = charPoly({ Kp, Kd, Ki, tau, J });
  const found = roots(P);
  const [d1, d2, d3] = [deriv(P), deriv(deriv(P)), deriv(deriv(deriv(P)))];
  const N = (z) => cmul([d, 0], [tau * z[0] + 1, tau * z[1]]);
  const dN = [d * tau, 0];
  // Merge poles closer than the root finder can split, into double poles.
  const terms = [];
  const used = new Set();
  found.forEach((p, i) => {
    if (used.has(i)) return;
    const j = found.findIndex((q, k) => k > i && !used.has(k) && Math.hypot(q[0] - p[0], q[1] - p[1]) < 1e-6 * (1 + Math.hypot(...p)));
    if (j < 0) {
      terms.push({ p, A: cdiv(N(p), horner(d1, p)), B: [0, 0] });
      return;
    }
    used.add(j);
    const z = [(p[0] + found[j][0]) / 2, (p[1] + found[j][1]) / 2];
    const Q = cdiv(horner(d2, z), [2, 0]);
    const dQ = cdiv(horner(d3, z), [6, 0]);
    terms.push({ p: z, B: cdiv(N(z), Q), A: cdiv(csub(cmul(dN, Q), cmul(N(z), dQ)), cmul(Q, Q)) });
  });
  const poles = found;
  const at = (t) => terms.reduce((sum, { p, A, B }) => sum + cmul(cadd(A, cmul(B, [t, 0])), cexp([p[0] * t, p[1] * t]))[0], 0);
  return { poles, at };
}

/** RK4 on J θ̈ = T + d, τ Ṫ = u − T, with the integral state. */
export function simulateLoop({ Kp, Kd, Ki, tau, d, J = J_SAT }, T = T_RUN, dt = 0.002) {
  const f = ([th, w, Tw, I]) => {
    const u = -(Kp * th + Kd * w + Ki * I);
    return [w, (Tw + d) / J, (u - Tw) / tau, th];
  };
  let y = [0, 0, 0, 0];
  const out = [[0, 0]];
  const N = Math.round(T / dt);
  for (let n = 1; n <= N; n++) {
    const k1 = f(y);
    const k2 = f(y.map((v, i) => v + (dt / 2) * k1[i]));
    const k3 = f(y.map((v, i) => v + (dt / 2) * k2[i]));
    const k4 = f(y.map((v, i) => v + dt * k3[i]));
    y = y.map((v, i) => v + (dt / 6) * (k1[i] + 2 * k2[i] + 2 * k3[i] + k4[i]));
    if (n % 50 === 0) out.push([n * dt, y[0]]);
  }
  return out;
}

/** Everything the lab shows. d in N·m. */
export function pointing(p) {
  const { poles, at } = modalResponse(p);
  const sim = simulateLoop(p);
  const scale = Math.max(...sim.map(([, th]) => Math.abs(th)), 1e-12);
  const gap = Math.max(...sim.map(([t, th]) => Math.abs(at(t) - th))) / scale;
  // The poles that decide stability: all but the integrator's zero root when K_i = 0.
  const live = poles.filter((q) => Math.hypot(...q) > 1e-9);
  const slowest = Math.max(...live.map((q) => q[0]));
  const stable = slowest < -1e-9;
  const offset = p.Ki > 0 ? 0 : p.Kp > 0 ? p.d / p.Kp : null;
  const settle = stable ? 4 / -slowest : null;
  return { poles, sim, gap, stable, slowest, offset, settle, peak: scale };
}
