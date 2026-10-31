/**
 * Hydrostatic manometers and the closed-system energy balance.
 *
 * A manometer leg of density ρ and vertical drop z (positive downward) changes the pressure by
 * ρ g z. Width and the path along the tube do not appear: only the vertical drop does. Walking
 * the legs from the open end gives the gauge pressure. Walking them backward from that gauge
 * pressure must return to zero at the open end.
 *
 * For a closed system, heat added and work done by the system are positive, so
 * ΔE = Q − W. Over a steady interval the same statement is the integral of Q̇ − Ẇ.
 * Devices in series pass the same power, so the overall efficiency is the product.
 *
 * SI throughout: Pa, J, W, kg/m³, m, s. g defaults to standard gravity.
 */
import { G_STANDARD } from '../convert.js';

export { G_STANDARD };

/** Gauge pressure, Pa, from legs `{ rho, drop }` walked from the open atmosphere toward the point. */
export function manometerGauge(legs, g = G_STANDARD) {
  let p = 0;
  for (const leg of legs) p += leg.rho * g * leg.drop;
  return p;
}

/**
 * Pressure left at the open end after starting from `pGauge` and walking the legs backward.
 * A consistent path returns 0.
 */
export function manometerResidual(pGauge, legs, g = G_STANDARD) {
  let p = pGauge;
  for (let i = legs.length - 1; i >= 0; i--) p -= legs[i].rho * g * legs[i].drop;
  return p;
}

/** ΔE = Q − W, with Q into the system and W done by the system. Joules when Q and W are joules. */
export function closedEnergy({ Q = 0, W = 0 } = {}) {
  return Q - W;
}

/** Integral of Q̇ − Ẇ over a duration t, for rates that are constant on that interval. */
export function integratedBalance({ Qdot = 0, Wdot = 0, t = 0 } = {}) {
  return (Qdot - Wdot) * t;
}

/** Overall efficiency of devices in series. Each factor is shaft power out over power in. */
export function seriesEfficiency(etas) {
  return etas.reduce((p, e) => p * e, 1);
}
