/**
 * A thermal vacuum cycle: how long a test article takes to move between its hot and cold plateaus,
 * and how long a test campaign lasts. Our own model, after NASA GSFC-STD-7000B (GEVS) 2.6.
 *
 * In vacuum the article exchanges heat with the chamber's shroud only by radiation. As one isothermal
 * body of mass m, specific heat c, surface A and emissivity ε, dissipating Q inside,
 *   m c dT/dt = εσA (T_s⁴ − T⁴) + Q = εσA (a⁴ − T⁴),   a⁴ = T_s⁴ + Q/(εσA),
 * so it heads for a, its equilibrium with the shroud at T_s. To speed a transition the shroud is
 * driven past the plateau, by the overdrive, and set to hold the article once it arrives.
 *
 * Closed form: 1/(a⁴ − T⁴) = [1/(a² − T²) + 1/(a² + T²)]/(2a²), so the time from T₀ to T₁ is
 *   t = (m c/εσA) [F(T₁) − F(T₀)],   F(T) = ln|(a + T)/(a − T)|/(4a³) + arctan(T/a)/(2a³).
 * The fastest change is at the start of each transition, εσA|a⁴ − T₀⁴|/(m c), which GEVS keeps
 * below 1 °C a minute.
 * Second method: RK4 in time until the article crosses the plateau.
 */
import { SIGMA } from './spacecraft.js';

const K0 = 273.15;
export const C_SPEC = 900; // J/(kg·K), aluminium, as Unit 6 uses
export const SHROUD = Object.freeze({ lo: -180 + K0, hi: 150 + K0 }); // K, our own chamber's range

/** GEVS Table 2.6-1: plateau hours by level of assembly. */
export const PLATEAU_H = Object.freeze({ unit: 4, subsystem: 12, system: 24 });

const F = (T, a) => Math.log(Math.abs((a + T) / (a - T))) / (4 * a ** 3) + Math.atan(T / a) / (2 * a ** 3);

/** The equilibrium a for shroud temperature Ts (K). */
export const equilibrium = ({ eps, A, Q }, Ts) => (Ts ** 4 + Q / (eps * SIGMA * A)) ** 0.25;

/** The shroud temperature that holds the article at T (K); null if the chamber cannot. */
export function holdShroud({ eps, A, Q }, T) {
  const x = T ** 4 - Q / (eps * SIGMA * A);
  if (x <= 0) return null;
  const Ts = x ** 0.25;
  return Ts >= SHROUD.lo && Ts <= SHROUD.hi ? Ts : null;
}

/**
 * Closed form for one transition from T0 to T1 (K) with the shroud at T1 ± overdrive, clipped to the
 * chamber. Returns hours, the peak rate (°C/min) and the shroud used; hours null if unreachable.
 */
export function transitionClosed(art, T0, T1, overdrive) {
  const dir = Math.sign(T1 - T0);
  const Ts = Math.min(SHROUD.hi, Math.max(SHROUD.lo, T1 + dir * overdrive));
  const a = equilibrium(art, Ts);
  const k = (art.eps * SIGMA * art.A) / (art.m * C_SPEC);
  const peak = (k * Math.abs(a ** 4 - T0 ** 4)) * 60;
  // Unreachable if the equilibrium does not lie beyond the plateau.
  if (dir * (a - T1) <= 0) return { hours: null, peak, Ts, a };
  return { hours: (F(T1, a) - F(T0, a)) / k / 3600, peak, Ts, a };
}

/** Second method: RK4 until the article crosses T1, in steps of a thousandth of the closed time. */
export function transitionStepped(art, T0, T1, overdrive, guessH) {
  const { Ts, a } = transitionClosed(art, T0, T1, overdrive);
  const k = (art.eps * SIGMA * art.A) / (art.m * C_SPEC);
  const f = (T) => k * (a ** 4 - T ** 4);
  const dt = (guessH * 3600) / 1000;
  let T = T0;
  let t = 0;
  const trace = [[0, T0]];
  for (let i = 0; i < 4000; i++) {
    const k1 = f(T);
    const k2 = f(T + (dt / 2) * k1);
    const k3 = f(T + (dt / 2) * k2);
    const k4 = f(T + dt * k3);
    const Tn = T + (dt / 6) * (k1 + 2 * k2 + 2 * k3 + k4);
    if ((Tn - T1) * (T - T1) <= 0) {
      // Cross the plateau within the step: interpolate on the rate, which barely changes in it.
      const tc = t + ((T1 - T) / (Tn - T)) * dt;
      trace.push([tc / 3600, T1]);
      return { hours: tc / 3600, Ts, trace };
    }
    T = Tn;
    t += dt;
    if (i % 20 === 0) trace.push([t / 3600, T]);
  }
  return { hours: null, Ts, trace };
}

/**
 * One cycle and the campaign: heat from the cold plateau to the hot, soak, cool back, soak. Plateaus
 * are the allowable flight range widened by the margin (°C, GEVS's 10 for protoflight).
 */
export function tvacCycle({ m, A, eps, Q, aftLo, aftHi, margin, overdrive, level, cycles }) {
  const art = { m, A, eps, Q };
  const Tc = aftLo - margin + K0;
  const Th = aftHi + margin + K0;
  const heat = transitionClosed(art, Tc, Th, overdrive);
  const cool = transitionClosed(art, Th, Tc, overdrive);
  const soak = PLATEAU_H[level];
  const holdHot = holdShroud(art, Th);
  const holdCold = holdShroud(art, Tc);
  const reachable = heat.hours !== null && cool.hours !== null && holdHot !== null && holdCold !== null;
  const cycleH = reachable ? heat.hours + cool.hours + 2 * soak : null;
  return {
    Tc,
    Th,
    heat,
    cool,
    soak,
    holdHot,
    holdCold,
    reachable,
    cycleH,
    campaignDays: reachable ? (cycles * cycleH) / 24 : null,
    peakRate: Math.max(heat.peak, cool.peak),
    tau: (m * C_SPEC) / (4 * eps * SIGMA * A * Th ** 3) / 3600,
  };
}

/** Both methods on the two transitions. */
export function tvacChecked(p) {
  const c = tvacCycle(p);
  if (!c.reachable) return { ...c, heatStep: null, coolStep: null, gap: 0, traceHeat: [], traceCool: [] };
  const art = { m: p.m, A: p.A, eps: p.eps, Q: p.Q };
  const h = transitionStepped(art, c.Tc, c.Th, p.overdrive, c.heat.hours);
  const k = transitionStepped(art, c.Th, c.Tc, p.overdrive, c.cool.hours);
  const gap = Math.max(Math.abs(h.hours - c.heat.hours) / c.heat.hours, Math.abs(k.hours - c.cool.hours) / c.cool.hours);
  return { ...c, heatStep: h.hours, coolStep: k.hours, traceHeat: h.trace, traceCool: k.trace, gap };
}
