/**
 * In-space propulsion: a propellant budget, a cold-gas tank, and an electric orbit raise. Our own
 * model, after MIT 16.851 Lecture 4 and NASA's small spacecraft report, chapter 4.
 *
 * A thruster expels mass at exhaust speed u_e = I_sp g₀, so thrust F = ṁ u_e, and burning from m₀ to
 * m_f gives Δv = u_e ln(m₀/m_f). The jet carries power ½ ṁ u_e² = ½ F u_e, so a thruster fed P with
 * efficiency η gives F = 2ηP/u_e: at fixed power, more I_sp means less thrust.
 *
 * Propellant must be held. If tanks and feed weigh k times the propellant, then
 *   m_p = m_d (R − 1)/(1 − k(R − 1)),   R = e^{Δv/u_e},
 * for a dry mass m_d (craft plus thruster hardware), and no amount of propellant gives more than
 *   Δv_max = u_e ln((1 + k)/k).
 * A cold-gas tank is a thin sphere: holding pressure p at radius r needs a wall p r/(2σ), so the tank
 * weighs (3/2) p V ρ_t/σ. The gas it holds weighs p V M/(R_u T). Their ratio,
 *   k = (3/2) ρ_t R_u T/(σ M),
 * does not depend on the pressure: a stronger tank holds more gas, and weighs more in proportion.
 *
 * The Δv budget: drag makeup, ½ ρ v² C_D A/m for each second of the mission, and disposal, lowering
 * the perigee from the circular orbit to 200 km.
 *
 * An electric orbit raise thrusts along the velocity in a slow spiral. Each circular orbit's speed is
 * √(μ/r), so the spiral needs Δv = |√(μ/r₁) − √(μ/r₂)|, and takes t = (m₀ u_e/F)(1 − e^{−Δv/u_e}).
 *
 * Second methods: the burn stepped by RK4 on dv/dt = F/m, dm/dt = −F/u_e, with the propellant found
 * by bisection; and the spiral flown, two-body plus thrust, by RK4 until the orbit's energy reaches
 * the target's.
 */
import { CD, density } from './orbitdecay.js';
import { MU_EARTH, R_EARTH } from './kepler.js';

export const G0 = 9.80665;
const R_U = 8.314462618; // J/(mol·K)
const YEAR = 365.25 * 86400;
const MU = MU_EARTH * 1e9; // m³/s²

/** A cold-gas tank's mass over the gas it holds (Wikipedia: 7075-T6 yield 430–480 MPa, 2.81 g/cm³). */
export function coldGasK({ sigma = 450e6, rhoT = 2810, safety = 2, T = 293, M = 0.028014 } = {}) {
  return (1.5 * rhoT * R_U * T * safety) / (sigma * M);
}

/** Nitrogen's ideal exhaust speed, full expansion from T: u_e = √(2 c_p T) (Wikipedia: c_p ≈ 1040 J/(kg·K)). */
export const coldGasUe = (T = 293, cp = 1039.6) => Math.sqrt(2 * cp * T);

/**
 * Technologies: I_sp (s) within NASA's small spacecraft report's Table 4-1 ranges, tankage k, and
 * thruster hardware mass (kg). Cold gas from the formulas above; the rest our own round figures.
 */
export const TECH = Object.freeze({
  cold: { name: 'Cold gas, nitrogen', isp: coldGasUe() / G0, k: coldGasK(), hw: 0.3, thrust: 0.1 },
  mono: { name: 'Hydrazine monopropellant', isp: 220, k: 0.15, hw: 0.6, thrust: 1 },
  electric: { name: 'Electric, gridded ion', isp: 1500, k: 0.2, hw: 1.0, power: 40, eta: 0.5 },
});

/** Thrust (N) of a thruster fed P watts at efficiency η and specific impulse I_sp. */
export const powerThrust = (P, eta, isp) => (2 * eta * P) / (isp * G0);

const thrustOf = (t) => (t.power ? powerThrust(t.power, t.eta, t.isp) : t.thrust);

/** The mission's Δv budget (m/s): drag makeup over the years and the disposal burn. */
export function deltaVBudget({ hkm, years, mass, area, f107 }) {
  const r = (R_EARTH + hkm) * 1e3;
  const v = Math.sqrt(MU / r);
  const drag = 0.5 * density(hkm, f107) * v * v * CD * area / mass; // m/s²
  const makeup = drag * years * YEAR;
  const rp = (R_EARTH + 200) * 1e3;
  const dispose = hkm > 200 ? v - Math.sqrt(MU * (2 / r - 2 / (r + rp))) : 0;
  return { v, drag, makeup, dispose, total: makeup + dispose };
}

/** Closed form: propellant and system mass for a Δv; null propellant if out of reach. */
export function propellantClosed({ dv, dry, tech }) {
  const t = TECH[tech];
  const ue = t.isp * G0;
  const R = Math.exp(dv / ue);
  const md = dry + t.hw;
  const ceiling = ue * Math.log((1 + t.k) / t.k);
  const den = 1 - t.k * (R - 1);
  if (den <= 0) return { ue, ceiling, mp: null, system: null, wet: null, burnH: null, thrust: thrustOf(t) };
  const mp = (md * (R - 1)) / den;
  const system = t.hw + mp * (1 + t.k);
  return { ue, ceiling, mp, system, wet: dry + system, burnH: (mp * ue) / thrustOf(t) / 3600, thrust: thrustOf(t) };
}

/** The Δv an RK4-stepped burn of propellant mp gives, the tank carried throughout. */
export function burnStepped({ mp, dry, tech }, n = 2000) {
  const t = TECH[tech];
  const ue = t.isp * G0;
  const F = thrustOf(t);
  const m0 = dry + t.hw + mp * (1 + t.k);
  const tb = (mp * ue) / F;
  const h = tb / n;
  let m = m0;
  let v = 0;
  const f = (mm) => [F / mm, -F / ue];
  for (let i = 0; i < n; i++) {
    const k1 = f(m);
    const k2 = f(m + (h / 2) * k1[1]);
    const k3 = f(m + (h / 2) * k2[1]);
    const k4 = f(m + h * k3[1]);
    v += (h / 6) * (k1[0] + 2 * k2[0] + 2 * k3[0] + k4[0]);
    m += (h / 6) * (k1[1] + 2 * k2[1] + 2 * k3[1] + k4[1]);
  }
  return v;
}

/** Second method: the propellant for a Δv, by bisection on the stepped burn. */
export function propellantStepped({ dv, dry, tech }) {
  let lo = 0;
  let hi = 1;
  while (burnStepped({ mp: hi, dry, tech }) < dv) {
    hi *= 2;
    if (hi > 1e5) return null;
  }
  for (let i = 0; i < 60; i++) {
    const mid = (lo + hi) / 2;
    if (burnStepped({ mp: mid, dry, tech }) < dv) lo = mid;
    else hi = mid;
  }
  return (lo + hi) / 2;
}

/** The whole budget, both methods. */
export function budgetPropChecked(state) {
  const b = deltaVBudget(state);
  const c = propellantClosed({ dv: b.total, dry: state.dry, tech: state.tech });
  const mpStep = c.mp === null ? null : propellantStepped({ dv: b.total, dry: state.dry, tech: state.tech });
  const gap = c.mp === null ? 0 : Math.abs(mpStep - c.mp) / Math.max(c.mp, 1e-6);
  return { ...b, ...c, mpStep, gap, reachable: c.mp !== null };
}

/** Closed form for the electric spiral between circular orbits h1 and h2 (km). */
export function spiralClosed({ h1, h2, mass, power, isp, eta }) {
  const ue = isp * G0;
  const F = powerThrust(power, eta, isp);
  const v1 = Math.sqrt(MU / ((R_EARTH + h1) * 1e3));
  const v2 = Math.sqrt(MU / ((R_EARTH + h2) * 1e3));
  const dv = Math.abs(v1 - v2);
  const frac = 1 - Math.exp(-dv / ue);
  return { ue, F, dv, mp: mass * frac, days: (mass * ue * frac) / F / 86400, perKW: (F / power) * 1e6 };
}

/**
 * Second method: fly it. Planar two-body plus thrust along (or against) the velocity, RK4 in steps of
 * a two-hundredth of the current orbit's period, until the specific energy reaches the target
 * circular orbit's. Returns days, Δv spent and propellant used, and [days, altitude km] every so often.
 */
export function spiralFlown({ h1, h2, mass, power, isp, eta }) {
  const ue = isp * G0;
  const F = powerThrust(power, eta, isp);
  const sign = h2 >= h1 ? 1 : -1;
  const r1 = (R_EARTH + h1) * 1e3;
  const r2 = (R_EARTH + h2) * 1e3;
  const eTarget = -MU / (2 * r2);
  let s = [r1, 0, 0, Math.sqrt(MU / r1), mass]; // x, y, vx, vy, m
  let t = 0;
  let dvUsed = 0;
  const alt = (st) => Math.hypot(st[0], st[1]) / 1e3 - R_EARTH;
  const path = [[0, alt(s)]];
  const deriv = ([x, y, vx, vy, m]) => {
    const r = Math.hypot(x, y);
    const v = Math.hypot(vx, vy);
    const a = (sign * F) / m;
    return [vx, vy, (-MU * x) / r ** 3 + (a * vx) / v, (-MU * y) / r ** 3 + (a * vy) / v, -F / ue];
  };
  const energy = ([x, y, vx, vy]) => 0.5 * (vx * vx + vy * vy) - MU / Math.hypot(x, y);
  const add = (a, b, h) => a.map((ai, i) => ai + h * b[i]);
  for (let i = 0; i < 5e6; i++) {
    const r = Math.hypot(s[0], s[1]);
    const h = (2 * Math.PI * Math.sqrt(r ** 3 / MU)) / 200;
    const k1 = deriv(s);
    const k2 = deriv(add(s, k1, h / 2));
    const k3 = deriv(add(s, k2, h / 2));
    const k4 = deriv(add(s, k3, h));
    const next = s.map((si, j) => si + (h / 6) * (k1[j] + 2 * k2[j] + 2 * k3[j] + k4[j]));
    const e0 = energy(s);
    const e1 = energy(next);
    if ((e1 - eTarget) * (e0 - eTarget) <= 0) {
      // Finish inside the step, on the energy, which changes almost evenly across it.
      const w = (eTarget - e0) / (e1 - e0);
      const m = s[4] + w * (next[4] - s[4]);
      dvUsed += ue * Math.log(s[4] / m);
      t += w * h;
      s = next;
      path.push([t / 86400, alt(s)]);
      return { days: t / 86400, dv: dvUsed, mp: mass - m, path };
    }
    dvUsed += ue * Math.log(s[4] / next[4]);
    t += h;
    s = next;
    if (i % 25 === 0) path.push([t / 86400, alt(s)]);
  }
  return { days: null, dv: null, mp: null, path };
}

/** Both methods for the spiral. */
export function spiralChecked(p) {
  const c = spiralClosed(p);
  if (Math.abs(p.h2 - p.h1) < 1e-9) return { ...c, flown: { days: 0, dv: 0, mp: 0, path: [] }, gap: 0 };
  const f = spiralFlown(p);
  const gap = Math.max(Math.abs(f.days - c.days) / c.days, Math.abs(f.mp - c.mp) / c.mp);
  return { ...c, flown: f, gap };
}
