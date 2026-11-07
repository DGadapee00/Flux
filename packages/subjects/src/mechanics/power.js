/**
 * Spacecraft power: a solar array, a battery and the eclipse (the satellite's Power subsystem).
 *
 * On a circular orbit of radius r = R + h, Earth's cylindrical shadow covers an arc of half-angle
 * asin(R/r) on the far side (for the Sun in the orbit's plane), so the eclipse lasts
 *   T_e = T · asin(R/r)/π   of the period T = 2π√(r³/μ).
 * The load P_L runs all the time. In sunlight the array also has to refill the battery, through
 * charge and discharge efficiencies η_c and η_d, so the array power needed in sunlight is
 *   P_sun = P_L (T_s + T_e/(η_c η_d)) / T_s,   T_s = T − T_e,
 * more than the orbit-average load. A sun-tracking array gives its full power all through daylight;
 * a panel fixed to the body of a nadir-pointing craft, facing away from Earth, sees the Sun at the
 * orbit angle φ from noon and gives P_peak cos φ while |φ| < 90°, an orbit average of P_peak/π.
 *
 * The second method runs the battery through five orbits in 2 s steps, sunlight and shadow, charge
 * clipped at full, and reads the energy each orbit off it against the closed form.
 */
import { MU_EARTH as MU, R_EARTH } from './kepler.js';

export const ETA_C = 0.9;
export const ETA_D = 0.9;

export function orbitGeometry(h) {
  const r = R_EARTH + h;
  const T = 2 * Math.PI * Math.sqrt(r ** 3 / MU);
  const half = Math.asin(R_EARTH / r); // half-angle of the shadow arc
  return { r, T, Te: (T * half) / Math.PI, half };
}

/** Array output at orbit angle φ from noon (radians), for a panel type and peak power. */
export function arrayPower({ panel, Ppeak }, phi, half) {
  const inShadow = Math.abs(Math.PI - Math.abs(((phi % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI) - Math.PI) - Math.PI) < half;
  if (inShadow) return 0;
  if (panel === 'tracking') return Ppeak;
  return Ppeak * Math.max(0, Math.cos(phi));
}

/** The closed form: energy per orbit in watt-hours. */
export function powerBudget({ h, Pload, panel, Ppeak, Ebatt }) {
  const g = orbitGeometry(h);
  const Ts = g.T - g.Te;
  // Array energy per orbit: full power through daylight, or P_peak/π on average for the body panel
  // (its cos φ lobe, |φ| < 90°, lies wholly in daylight because the shadow is centred at midnight).
  const Earray = panel === 'tracking' ? Ppeak * Ts : (Ppeak * g.T) / Math.PI;
  const eclipseDraw = (Pload * g.Te) / ETA_D; // taken from the battery
  const dod = eclipseDraw / 3600 / Ebatt;
  const needSun = (Pload * (Ts + g.Te / (ETA_C * ETA_D))) / Ts;
  // Net energy per orbit if the battery never fills: array energy in daylight goes first to the load,
  // the rest into the battery at η_c; the eclipse load comes out at 1/η_d.
  return { ...g, Ts, Earray: Earray / 3600, eclipseDraw: eclipseDraw / 3600, dod, needSun, avgArray: Earray / g.T, avgLoad: Pload };
}

/** The share of the orbit-angle interval [a, b] (radians, increasing) that lies in the shadow arc. */
function shadowShare(a, b, half) {
  let inside = 0;
  // The shadow arcs are centred at π + 2πk; check the ones near [a, b].
  const k0 = Math.floor((a - Math.PI - half) / (2 * Math.PI));
  for (let k = k0; k <= k0 + 2; k++) {
    const c = Math.PI + 2 * Math.PI * k;
    inside += Math.max(0, Math.min(b, c + half) - Math.max(a, c - half));
  }
  return inside / (b - a);
}

/** Five orbits of the battery, in about 2 s steps that fit each orbit exactly. */
export function simulatePower({ h, Pload, panel, Ppeak, Ebatt }, orbits = 5) {
  const g = orbitGeometry(h);
  const perOrbit = Math.round(g.T / 2);
  const dt = g.T / perOrbit;
  const dphi = (2 * Math.PI) / perOrbit;
  const cap = Ebatt * 3600;
  let E = cap;
  const trace = [];
  let firstOrbitArray = 0;
  let emptied = false;
  const atEclipse = [];
  let wasLit = true;
  for (let n = 0; n < orbits * perOrbit; n++) {
    const phi = n * dphi;
    // Array energy over the step: a tracking array loses exactly the share of the step in shadow; a
    // body panel is lit only within 90° of noon, well clear of the shadow, so its midpoint value serves.
    const Pa = panel === 'tracking' ? Ppeak * (1 - shadowShare(phi, phi + dphi, g.half)) : Ppeak * Math.max(0, Math.cos(phi + dphi / 2));
    if (n < perOrbit) firstOrbitArray += Pa * dt;
    const lit = shadowShare(phi, phi + dphi, g.half) < 1;
    if (wasLit && !lit) atEclipse.push(E / cap);
    wasLit = lit;
    const net = Pa - Pload;
    E += net >= 0 ? net * ETA_C * dt : (net / ETA_D) * dt;
    if (E > cap) E = cap;
    if (E <= 0) {
      E = 0;
      emptied = true;
    }
    if (n % 15 === 0) trace.push([(n * dt) / g.T, E / cap, Pa]);
  }
  return { trace, socEnd: E / cap, emptied, atEclipse, arrayWh: firstOrbitArray / 3600, lowest: Math.min(...trace.map((t) => t[1])) };
}

export function powerChecked(p) {
  const b = powerBudget(p);
  const s = simulatePower(p);
  const gap = Math.abs(s.arrayWh - b.Earray) / Math.max(b.Earray, 1e-9);
  // It keeps up when the charge at each eclipse stops falling from orbit to orbit and it never empties.
  const k = s.atEclipse.length;
  const sustains = !s.emptied && k >= 2 && s.atEclipse[k - 1] >= s.atEclipse[k - 2] - 1e-9;
  return { ...b, ...s, gap, sustains };
}
