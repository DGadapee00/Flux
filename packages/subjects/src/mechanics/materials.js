/**
 * Stress in members and connections: average normal and shear stress, the stress on a plane cut at
 * an angle through an axially loaded bar, plane-stress transformation, pins in single and double
 * shear, bearing, and the factor of safety. SI throughout: N, m, Pa. Tension is positive.
 *
 * Each closed form here has a second route in materials-selftest.js: the inclined-plane stresses
 * from the cut's force balance and from the transformation equations, the pin's shear planes from
 * its segments' equilibrium.
 */

const DEG = Math.PI / 180;

export const axialStress = (P, A) => P / A;
export const avgShear = (V, A) => V / A;
export const circleArea = (d) => (Math.PI * d * d) / 4;

/**
 * A bar of area A under axial load P, cut on a plane whose normal is θ from the bar's axis.
 * σ = (P/A) cos²θ and τ = (P/2A) sin 2θ. τ is the shear on the plane, positive when it points
 * toward the bar's axis on the side the normal leaves.
 */
export function inclined(P, A, thetaDeg) {
  const t = thetaDeg * DEG;
  const s0 = P / A;
  return { sigma: s0 * Math.cos(t) ** 2, tau: (s0 / 2) * Math.sin(2 * t), area: A / Math.cos(t) };
}

/**
 * The same stresses from the free body to one side of the cut: the internal force P resolved along
 * the plane's normal and along the plane, each divided by the plane's area A/cos θ.
 */
export function inclinedByCut(P, A, thetaDeg) {
  const t = thetaDeg * DEG;
  const n = { x: Math.cos(t), y: Math.sin(t) };
  const along = { x: -Math.sin(t), y: Math.cos(t) };
  const area = A / Math.cos(t);
  // The free body is the left segment. The right segment pulls on its cut face with P along +x.
  const F = { x: P, y: 0 };
  const N = F.x * n.x + F.y * n.y;
  const V = -(F.x * along.x + F.y * along.y);
  return { sigma: N / area, tau: V / area, area, N, V };
}

/** Plane-stress transformation to axes turned θ counterclockwise. */
export function transform(sx, sy, txy, thetaDeg) {
  const t = thetaDeg * DEG;
  const c = Math.cos(2 * t);
  const s = Math.sin(2 * t);
  const avg = (sx + sy) / 2;
  const half = (sx - sy) / 2;
  return {
    sx: avg + half * c + txy * s,
    sy: avg - half * c - txy * s,
    txy: -half * s + txy * c,
  };
}

/** Average shear in a pin of diameter d carrying V across `planes` shear planes. */
export const pinShear = (V, d, planes = 1) => V / (planes * circleArea(d));

/** Average bearing stress: the force pressed on the projected area d·t. */
export const bearing = (P, d, t) => P / (d * t);

/**
 * A pin through a plate and, in double shear, the two legs of a clevis. The plate pushes P on the
 * middle of the pin; each leg pushes back P/2 (double) or the single lug pushes back P (single).
 * Walking along the pin and adding the loads gives the shear carried across each gap between
 * parts. This is the segment-by-segment equilibrium the closed form V = P/planes summarises.
 */
export function pinSegments(P, planes = 1) {
  const loads = planes === 2 ? [-P / 2, P, -P / 2] : [P, -P];
  const shears = [];
  let V = 0;
  for (let i = 0; i < loads.length - 1; i++) {
    V += loads[i];
    shears.push(Math.abs(V));
  }
  const residual = Math.abs(loads.reduce((s, f) => s + f, 0));
  return { loads, shears, residual };
}

export const factorOfSafety = (failure, actual) => failure / actual;

/** The smallest area whose stress stays at failure/FS. */
export const requiredArea = (F, failure, FS = 1) => (Math.abs(F) * FS) / failure;

/** The smallest pin diameter whose shear stays at failure/FS across `planes` planes. */
export const requiredDiameter = (V, failure, FS = 1, planes = 1) => Math.sqrt((4 * requiredArea(V, failure, FS)) / (Math.PI * planes));
