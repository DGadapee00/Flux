/**
 * The spacecraft radiation balance (the satellite's Thermal subsystem).
 *
 * A sphere of radius R absorbs sunlight on its projected area, α S πR², and while over the sunlit
 * Earth also Earth's reflected sunlight, α a S A F, and at all times Earth's infrared, ε q_E A F,
 * where A = 4πR² and F = (1 − √(1 − (R_E/r)²))/2 is the share of its view filled by Earth. With an
 * internal dissipation Q it settles where
 *   ε σ A T⁴ = absorbed + Q.
 * So the hot (sunlit) and cold (eclipse) temperatures set by the finish go with α/ε, not with how
 * dark it looks: polished aluminium, with α small but ε tiny, runs hotter than black paint. A real
 * craft has thermal mass m c, so through each orbit it swings between those two and does not reach
 * either.
 *
 * The second method integrates m c dT/dt = absorbed(t) + Q − εσAT⁴ through 40 orbits by RK4, until
 * the swing repeats, and checks that over the last orbit it radiates exactly what it absorbs on
 * average, which the closed form gives.
 */
import { MU_EARTH as MU, R_EARTH } from '../mechanics/kepler.js';

export const SIGMA = 5.670374419e-8;
export const SOLAR = 1361; // W/m²
export const ALBEDO = 0.3;
export const EARTH_IR = 237; // W/m², at Earth's top of atmosphere
export const RADIUS = 0.25; // m, the satellite
export const C_SPEC = 900; // J/(kg·K), aluminium

export const FINISHES = {
  black: { name: 'Black paint', alpha: 0.95, eps: 0.9 },
  white: { name: 'White paint', alpha: 0.2, eps: 0.9 },
  aluminium: { name: 'Polished aluminium', alpha: 0.15, eps: 0.05 },
};

function environment({ env, h }) {
  if (env === 'deep') return { T: 6000, Te: 0, F: 0, irScale: 0 };
  const r = R_EARTH + h;
  const T = 2 * Math.PI * Math.sqrt(r ** 3 / MU);
  const half = Math.asin(R_EARTH / r);
  const x = R_EARTH / r;
  return { T, Te: (T * half) / Math.PI, F: (1 - Math.sqrt(1 - x * x)) / 2, irScale: x * x, half };
}

/** Absorbed power in sunlight and in eclipse, W, and the matching steady temperatures. */
export function balance({ finish, env, h, Q }) {
  const { alpha, eps } = FINISHES[finish];
  const e = environment({ env, h });
  const A = 4 * Math.PI * RADIUS ** 2;
  const Ap = Math.PI * RADIUS ** 2;
  // Earth's infrared, from its top of atmosphere, spread out to the orbit, seen through the view factor.
  const ir = env === 'deep' ? 0 : eps * EARTH_IR * A * e.F;
  const sun = alpha * SOLAR * Ap + (env === 'deep' ? 0 : alpha * ALBEDO * SOLAR * A * e.F);
  const inSun = sun + ir + Q;
  const inShadow = ir + Q;
  const k = eps * SIGMA * A;
  const Thot = (inSun / k) ** 0.25;
  const Tcold = inShadow > 0 ? (inShadow / k) ** 0.25 : 0;
  const share = env === 'deep' ? 1 : 1 - e.Te / e.T;
  const avgIn = share * inSun + (1 - share) * inShadow;
  return { ...e, A, Ap, alpha, eps, sun, ir, inSun, inShadow, Thot, Tcold, avgIn, Tavg4: (avgIn / k) ** 0.25, k };
}

/** RK4 on m c dT/dt = in(t) − εσAT⁴ through 40 orbits; the last orbit's trace and average radiated. */
export function simulateThermal(p, orbits = 40) {
  const b = balance(p);
  const mc = p.mass * C_SPEC;
  // Each orbit in three pieces, sun, shadow, sun, with the eclipse centred at half an orbit, so every
  // step lies wholly in sunlight or wholly in shadow and the intake is constant across it.
  const w = p.env === 'deep' ? 0 : b.Te / b.T;
  const pieces = w > 0 ? [[0, 0.5 - w / 2, b.inSun], [0.5 - w / 2, 0.5 + w / 2, b.inShadow], [0.5 + w / 2, 1, b.inSun]] : [[0, 1, b.inSun]];
  const perOrbit = 600;
  const dTdt = (q, T) => (q - b.k * T ** 4) / mc;
  let T = b.Tavg4;
  const trace = [];
  let emitted = 0;
  let inLast = 0;
  for (let o = 0; o < orbits; o++) {
    const last = o === orbits - 1;
    for (const [a, z, q] of pieces) {
      const n = Math.max(2, Math.round(perOrbit * (z - a)));
      const dt = ((z - a) * b.T) / n;
      for (let i = 0; i < n; i++) {
        const k1 = dTdt(q, T);
        const k2 = dTdt(q, T + (dt / 2) * k1);
        const k3 = dTdt(q, T + (dt / 2) * k2);
        const k4 = dTdt(q, T + dt * k3);
        const Tn = T + (dt / 6) * (k1 + 2 * k2 + 2 * k3 + k4);
        if (last) {
          emitted += (b.k * (T ** 4 + 4 * ((T + Tn) / 2) ** 4 + Tn ** 4) * dt) / 6;
          inLast += q * dt;
          trace.push([a + ((z - a) * i) / n, T]);
        }
        T = Tn;
      }
    }
  }
  return { trace, emittedAvg: emitted / b.T, inAvgSim: inLast / b.T, Tmax: Math.max(...trace.map((x) => x[1])), Tmin: Math.min(...trace.map((x) => x[1])) };
}

export function thermalChecked(p) {
  const b = balance(p);
  const s = simulateThermal(p);
  // Over a repeating orbit the craft radiates what it absorbs; and the closed form's average intake is
  // what the stepped one takes in.
  const gap = Math.max(Math.abs(s.emittedAvg - b.avgIn), Math.abs(s.inAvgSim - b.avgIn)) / b.avgIn;
  return { ...b, ...s, gap };
}
