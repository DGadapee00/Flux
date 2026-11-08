/**
 * A reaction wheel filling with momentum, and magnetic desaturation (Build a satellite, Attitude).
 *
 * To hold a fixed attitude against a disturbance torque, the wheel absorbs it: its stored momentum
 * grows by the torque's integral. A disturbance τ(t) = τ₀ + τ₁ sin(2πt/T) has a steady part τ₀ and a
 * part that cancels over each orbit of period T, so over whole orbits the wheel gains τ₀ per second.
 * A magnetorquer with dipole m in Earth's field B can push back, but only at right angles to the
 * field, which turns once an orbit: on average it removes (2/π)mB. The momentum after k orbits is
 *   H(kT) = (τ₀ − (2/π)mB) kT,
 * and the wheel saturates after H_max/(τ₀ − (2/π)mB) if that is positive; otherwise it never does.
 *
 * The second method integrates dH/dt = τ(t) − mB|sin(2πt/T)| with Runge–Kutta and compares H after
 * twelve orbits. The drawn path is more realistic: the torquer stops once the wheel is empty.
 */

export const WHEEL = { T: 5560, B: 3e-5, tau1: 2e-5 };

export function wheelClosed({ tau0u, m, Hmax }) {
  const tau0 = tau0u * 1e-6;
  const dump = (2 / Math.PI) * m * WHEEL.B;
  const net = tau0 - dump;
  // null when the wheel never fills.
  const tSat = net > 0 ? Hmax / net : null;
  return { tau0, dump, net, tSat, tSatH: tSat === null ? null : tSat / 3600, orbitsToSat: tSat === null ? null : tSat / WHEEL.T, perOrbit: net * WHEEL.T };
}

export function wheelMarch(state, orbits = 40, always = false) {
  const { T, B, tau1 } = WHEEL;
  const tau0 = state.tau0u * 1e-6;
  const w = (2 * Math.PI) / T;
  // While momentum is positive the torquer pushes it down; it never pushes past zero.
  const f = (t, H) => tau0 + tau1 * Math.sin(w * t) - (always || H > 0 ? state.m * B * Math.abs(Math.sin(w * t)) : 0);
  const n = 400;
  const dt = T / n;
  let H = 0;
  let t = 0;
  const ends = [0];
  const path = [[0, 0]];
  for (let k = 0; k < orbits; k++) {
    for (let i = 0; i < n; i++) {
      const k1 = f(t, H);
      const k2 = f(t + dt / 2, H + (dt / 2) * k1);
      const k3 = f(t + dt / 2, H + (dt / 2) * k2);
      const k4 = f(t + dt, H + dt * k3);
      H += (dt / 6) * (k1 + 2 * k2 + 2 * k3 + k4);
      t += dt;
      if (i % 20 === 19) path.push([t / 3600, H]);
    }
    ends.push(H);
  }
  return { ends, path };
}

export function wheelChecked(state) {
  const cf = wheelClosed(state);
  // The closed form assumes the torquer pushes throughout; march the same way and compare at 12 orbits.
  const m = wheelMarch(state, 12, true);
  const closed = cf.net * 12 * WHEEL.T;
  const scale = Math.max(1e-4, Math.abs(cf.tau0) * 12 * WHEEL.T);
  const full = wheelMarch(state, 40);
  return { ...cf, H12: m.ends[12], H12closed: closed, path: full.path, gap: Math.abs(m.ends[12] - closed) / scale };
}
