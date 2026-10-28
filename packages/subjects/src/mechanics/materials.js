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

/** Engineering normal strain: the change of length divided by the original length. */
export const normalStrain = (delta, L) => delta / L;

/** Uniaxial Hooke's law. Stress and modulus in Pa, strain dimensionless. */
export const hookeStress = (E, eps) => E * eps;
export const hookeStrain = (stress, E) => stress / E;

/**
 * Lateral strain under uniaxial stress. The material contracts sideways when it is stretched,
 * so ε_lat = −ν ε_axial.
 */
export const lateralStrain = (nu, epsAxial) => -nu * epsAxial;

/** Isotropic shear modulus, G = E / 2(1 + ν), from requiring the shear form of Hooke's law. */
export const shearModulus = (E, nu) => E / (2 * (1 + nu));

/**
 * Linear volume strain under uniaxial stress. The three edge strains are ε, −ν ε and −ν ε,
 * and their sum is ε(1 − 2ν). At ν = 1/2 the linear volume change is zero.
 */
export const uniaxialVolumeStrain = (eps, nu) => eps * (1 - 2 * nu);

/** Exact change of volume from three engineering edge strains: (1+εx)(1+εy)(1+εz) − 1. */
export const volumeChange = (ex, ey, ez) => (1 + ex) * (1 + ey) * (1 + ez) - 1;

/** Elastic energy per volume stored up to yield: the triangle σ_Y² / 2E. */
export const resilience = (sigY, E) => (sigY * sigY) / (2 * E);

/**
 * Bilinear tension curve. Slope E up to σ_Y, then tangent modulus E_t. Returns the stress at
 * engineering strain eps, and whether the point is past yield.
 */
export function bilinear(eps, E, sigY, Et) {
  const ey = sigY / E;
  if (eps <= ey) return { stress: E * Math.max(eps, 0), ey, plastic: false };
  return { stress: sigY + Et * (eps - ey), ey, plastic: true };
}

/** Area under the bilinear curve from 0 to eps, energy per volume. */
export function bilinearEnergy(eps, E, sigY, Et) {
  if (eps <= 0) return 0;
  const ey = sigY / E;
  if (eps <= ey) return 0.5 * E * eps * eps;
  const stress = sigY + Et * (eps - ey);
  return 0.5 * sigY * ey + 0.5 * (sigY + stress) * (eps - ey);
}

/**
 * Ramberg–Osgood tension curve, ε = σ/E + 0.002 (σ/σ_Y)^n.
 * σ_Y is the 0.2% offset yield by construction: at σ = σ_Y the plastic strain is 0.002.
 */
export function rambergOsgood(stress, E, sigY, n) {
  return stress / E + 0.002 * (stress / sigY) ** n;
}

/** Stress on a Ramberg–Osgood curve at a given strain, by bisection. */
export function rambergStress(eps, E, sigY, n) {
  if (eps <= 0) return 0;
  let lo = 0;
  let hi = Math.max(sigY * 3, E * eps);
  for (let i = 0; i < 80; i++) {
    const mid = (lo + hi) / 2;
    if (rambergOsgood(mid, E, sigY, n) < eps) lo = mid;
    else hi = mid;
  }
  return (lo + hi) / 2;
}

/**
 * Strain left after the stress is removed along modulus E.
 * In the elastic range this is zero. Past yield it is the permanent set.
 */
export const permanentSet = (eps, stress, E) => Math.max(0, eps - stress / E);

/** Elongation of one uniform segment, δ = NL/AE. Tension positive. */
export const segmentElongation = (N, L, A, E) => (N * L) / (A * E);

/** Sum of NL/AE over segments, each { N, L, A, E }. */
export const barElongation = (segments) => segments.reduce((sum, s) => sum + segmentElongation(s.N, s.L, s.A, s.E), 0);

/**
 * A circular bar whose diameter varies linearly from d0 to d1, under a constant axial force.
 * δ = ∫ P/(AE) dx = 4PL / (π E d0 d1).
 */
export const taperedElongation = (P, L, E, d0, d1) => (4 * P * L) / (Math.PI * E * d0 * d1);

/** Axial stiffness AE/L of a uniform segment. */
export const axialStiffness = (A, E, L) => (A * E) / L;

/**
 * A bar fixed at both ends with an axial load P a distance `a` from the left end.
 * The left reaction is P (L − a) / L. The shorter side is stiffer and carries more.
 */
export function fixedFixed(P, L, a) {
  const left = (P * (L - a)) / L;
  return { left, right: P - left };
}

/**
 * The same reactions from two springs. k_left = AE/a, k_right = AE/(L−a),
 * and the joint load splits in proportion to stiffness.
 */
export function fixedFixedByStiffness(P, L, a, A, E) {
  const kL = axialStiffness(A, E, a);
  const kR = axialStiffness(A, E, L - a);
  const left = (P * kL) / (kL + kR);
  return { left, right: P - left, kL, kR };
}

/**
 * Stress in a bar held between rigid walls. Heating (ΔT > 0) puts it in compression.
 * A gap delays the stress until the free expansion closes it. Returns zero when the
 * gap is still open.
 */
export function constrainedThermal(E, alpha, dT, { L = 1, gap = 0 } = {}) {
  const free = alpha * dT * L;
  // No gap means the ends are fastened, so cooling tensions the bar as heating compresses it.
  // A gap is a one-way joint: no force until the free expansion exceeds it, and no tension after.
  const fastened = gap <= 0;
  if (!fastened && free <= gap) return { stress: 0, free, closed: false, mechanical: 0 };
  const mechanical = -(free - (fastened ? 0 : gap));
  return { stress: (E * mechanical) / L, free, closed: true, mechanical };
}

/**
 * Thin-walled closed cylinder. The hoop stress is pr/t and the longitudinal stress is half of that.
 * r is the inside radius. The half-cylinder force balance is 2σ t L = 2 p r L.
 */
export function thinCylinder(p, r, t) {
  const hoop = (p * r) / t;
  return { hoop, axial: hoop / 2 };
}

/** Force across a longitudinal cut of a cylinder of length L: ∫ p sinθ · r dθ L from 0 to π. */
export const cylinderSplitForce = (p, r, L) => 2 * p * r * L;

/** Hoop stress recovered from that split force and the two wall thicknesses. */
export const hoopFromSplit = (p, r, t) => cylinderSplitForce(p, r, 1) / (2 * t);

/**
 * Thin-walled sphere. Both membrane stresses are pr/(2t).
 * A cap balance is π r² p = σ (2 π r t).
 */
export function thinSphere(p, r, t) {
  const membrane = (p * r) / (2 * t);
  return { hoop: membrane, axial: membrane };
}

/** Membrane stress from the cap balance π r² p = σ · 2 π r t, left unsimplified. */
export const sphereFromCap = (p, r, t) => (p * Math.PI * r * r) / (2 * Math.PI * r * t);

/**
 * Isotropic Hooke's law for three normal stresses.
 * εx = [σx − ν(σy + σz)] / E, and the two cyclic partners.
 */
export function hooke3(sx, sy, sz, E, nu) {
  const ex = (sx - nu * (sy + sz)) / E;
  const ey = (sy - nu * (sx + sz)) / E;
  const ez = (sz - nu * (sx + sy)) / E;
  return { ex, ey, ez, vol: ex + ey + ez };
}

/**
 * The same strains split into a hydrostatic part and a deviator.
 * Mean stress σm uses bulk response (1−2ν)/E. The remainder uses (1+ν)/E.
 */
export function hooke3Deviator(sx, sy, sz, E, nu) {
  const sm = (sx + sy + sz) / 3;
  const bulk = (1 - 2 * nu) / E;
  const shear = (1 + nu) / E;
  const ex = bulk * sm + shear * (sx - sm);
  const ey = bulk * sm + shear * (sy - sm);
  const ez = bulk * sm + shear * (sz - sm);
  return { ex, ey, ez, vol: ex + ey + ez };
}
