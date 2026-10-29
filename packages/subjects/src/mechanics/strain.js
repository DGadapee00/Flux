/**
 * Plane strain on any axis: transformation, principal strains, rosettes, and the plane-stress
 * stresses a rosette implies. Pure, dimensionless strains, SI stresses. γ is the engineering shear
 * strain, the change of a right angle; the tensor component is γ/2. strain-selftest.js checks each
 * result a second way.
 */
const DEG = Math.PI / 180;

/**
 * A line element along the unit vector n = (cos θ, sin θ) of length ds moves by (∇u) n ds. Its
 * stretch is the part of that move along n: ε(θ) = n·(∇u)·n = εx c² + εy s² + γ s c. The shear
 * strain between n and the perpendicular t = (−s, c) is 2 t·ε·n, the same algebra.
 */
export function strainTransform(ex, ey, gxy, thetaDeg) {
  const c = Math.cos(thetaDeg * DEG);
  const s = Math.sin(thetaDeg * DEG);
  return {
    e: ex * c * c + ey * s * s + gxy * s * c,
    et: ex * s * s + ey * c * c - gxy * s * c,
    g: 2 * (ey - ex) * s * c + gxy * (c * c - s * s),
  };
}

/** Mohr's circle for strain: centre (εx+εy)/2, radius hypot((εx−εy)/2, γ/2), axes ε and γ/2. */
export function principalStrains(ex, ey, gxy) {
  const C = (ex + ey) / 2;
  const R = Math.hypot((ex - ey) / 2, gxy / 2);
  return { C, R, e1: C + R, e2: C - R, gmax: 2 * R, thetaP: (0.5 * Math.atan2(gxy, ex - ey)) / DEG };
}

/**
 * Three gauges at angles θa, θb, θc read εa, εb, εc. Each reading is one equation
 * ε = εx c² + εy s² + γ s c; Cramer's rule solves the three.
 */
export function rosette(anglesDeg, readings) {
  const rows = anglesDeg.map((a) => {
    const c = Math.cos(a * DEG);
    const s = Math.sin(a * DEG);
    return [c * c, s * s, s * c];
  });
  const det3 = (m) => m[0][0] * (m[1][1] * m[2][2] - m[1][2] * m[2][1])
    - m[0][1] * (m[1][0] * m[2][2] - m[1][2] * m[2][0])
    + m[0][2] * (m[1][0] * m[2][1] - m[1][1] * m[2][0]);
  const D = det3(rows);
  if (Math.abs(D) < 1e-12) throw new Error('rosette: two gauges read the same direction');
  const col = (k) => det3(rows.map((r, i) => r.map((v, j) => (j === k ? readings[i] : v)))) / D;
  return { ex: col(0), ey: col(1), gxy: col(2) };
}

/** The 0-45-90 rosette in closed form: εx = εa, εy = εc, γ = 2εb − εa − εc. */
export const rectangularRosette = (ea, eb, ec) => ({ ex: ea, ey: ec, gxy: 2 * eb - ea - ec });

/** The 0-60-120 rosette in closed form. */
export const deltaRosette = (ea, eb, ec) => ({
  ex: ea,
  ey: (2 * eb + 2 * ec - ea) / 3,
  gxy: (2 / Math.sqrt(3)) * (eb - ec),
});

/**
 * Plane stress (σz = 0) from the two normal strains and the shear strain. Solving
 * εx = (σx − νσy)/E and εy = (σy − νσx)/E for the stresses gives E/(1−ν²) times (εx + νεy);
 * the shear stress is Gγ with G = E/(2(1+ν)).
 */
export function planeStressFromStrain(ex, ey, gxy, E, nu) {
  const f = E / (1 - nu * nu);
  return {
    sx: f * (ex + nu * ey),
    sy: f * (ey + nu * ex),
    txy: (E / (2 * (1 + nu))) * gxy,
    ez: (-nu / (1 - nu)) * (ex + ey),
  };
}
