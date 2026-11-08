/**
 * A spacecraft as two faces joined by a conductive link (Build a satellite, Thermal control).
 *
 * Face 1 faces the Sun: it absorbs αSA₁ in sunlight and radiates εσA₁T₁⁴. Face 2 is the radiator, in
 * shadow: it carries the electronics' heat Q and a heater's H, and radiates εσA₂T₂⁴. A link of
 * conductance G (W/K) carries G(T₁ − T₂) between them. In steady state each face balances:
 *   αSA₁ − εσA₁T₁⁴ − G(T₁ − T₂) = 0,   Q + H + G(T₁ − T₂) − εσA₂T₂⁴ = 0.
 * A weak link leaves the sunlit face hot and the electronics cold; a strong one evens them out. In a
 * dawn–dusk orbit the face sees the Sun all the time; in a low orbit with eclipses it sees it 61% of
 * the time, and since the faces take hours to respond, the orbit-averaged sunlight sets their mean
 * temperatures. Then the heater must hold the electronics above their lower limit.
 *
 * The steady state is solved by Newton's method on the two balances. The second method marches both
 * faces in time, with heat capacities of 4 kJ/K each, until they stop changing.
 */

export const SIGMA = 5.670374419e-8;
export const CRAFT = { S: 1361, A1: 0.25, A2: 0.25, alpha: 0.6, eps: 0.85, Q: 15, C: 4000, lo: -10, hi: 40 };

const residual = ([T1, T2], { G, H, sun }) => {
  const { S, A1, A2, alpha, eps, Q } = CRAFT;
  return [
    (sun === 'average' ? 0.61 : 1) * alpha * S * A1 - eps * SIGMA * A1 * T1 ** 4 - G * (T1 - T2),
    Q + H + G * (T1 - T2) - eps * SIGMA * A2 * T2 ** 4,
  ];
};

export function nodesClosed(state) {
  let T = [300, 280];
  for (let it = 0; it < 100; it++) {
    const f = residual(T, state);
    const e = 1e-4;
    const fa = residual([T[0] + e, T[1]], state);
    const fb = residual([T[0], T[1] + e], state);
    const J = [[(fa[0] - f[0]) / e, (fb[0] - f[0]) / e], [(fa[1] - f[1]) / e, (fb[1] - f[1]) / e]];
    const det = J[0][0] * J[1][1] - J[0][1] * J[1][0];
    const d0 = (f[0] * J[1][1] - f[1] * J[0][1]) / det;
    const d1 = (J[0][0] * f[1] - J[1][0] * f[0]) / det;
    T = [Math.max(20, T[0] - d0), Math.max(20, T[1] - d1)];
    if (Math.hypot(d0, d1) < 1e-11) break;
  }
  const [T1, T2] = T;
  const C = (k) => k - 273.15;
  return { T1, T2, T1c: C(T1), T2c: C(T2), flow: state.G * (T1 - T2), ok: C(T2) >= CRAFT.lo && C(T2) <= CRAFT.hi };
}

/** RK4 in time from 20 °C; returns the path (hours, °C, °C) and the settled temperatures. */
export function nodesMarch(state, hours = 40) {
  const C = CRAFT.C;
  let T = [293.15, 293.15];
  const F = (t) => residual(t, state).map((q) => q / C);
  const dt = 20;
  const n = Math.round((hours * 3600) / dt);
  const path = [[0, 20, 20]];
  for (let i = 0; i < n; i++) {
    const k1 = F(T);
    const k2 = F(T.map((v, j) => v + (dt / 2) * k1[j]));
    const k3 = F(T.map((v, j) => v + (dt / 2) * k2[j]));
    const k4 = F(T.map((v, j) => v + dt * k3[j]));
    T = T.map((v, j) => v + (dt / 6) * (k1[j] + 2 * k2[j] + 2 * k3[j] + k4[j]));
    if ((i + 1) % 90 === 0) path.push([((i + 1) * dt) / 3600, T[0] - 273.15, T[1] - 273.15]);
  }
  return { path, T };
}

export function nodesChecked(state) {
  const cf = nodesClosed(state);
  const m = nodesMarch(state);
  return { ...cf, path: m.path, gap: Math.max(Math.abs(m.T[0] - cf.T1), Math.abs(m.T[1] - cf.T2)) / 100 };
}
