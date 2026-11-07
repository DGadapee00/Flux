/**
 * Attitude: rotation matrices, 3-2-1 Euler angles and quaternions (the satellite's Attitude
 * subsystem).
 *
 * The attitude is the rotation R from the body frame to the reference frame. With yaw ψ about z,
 * then pitch θ about the new y, then roll φ about the body x,
 *   R = R_z(ψ) R_y(θ) R_x(φ),   RᵀR = I.
 * The body's angular velocity follows from the angle rates by
 *   ω = [φ̇ − ψ̇ sin θ,  θ̇ cos φ + ψ̇ cos θ sin φ,  −θ̇ sin φ + ψ̇ cos θ cos φ],
 * a matrix whose determinant is cos θ. At θ = ±90° the yaw axis and the roll axis line up and one
 * direction of turn has no angle left to make it: gimbal lock. A unit quaternion
 * q = (cos θ/2, n̂ sin θ/2) carries the same attitude in four numbers and turns any way.
 *
 * Two checks: the matrix built from the angles against the one built from the quaternion
 * q = q_z(ψ) q_y(θ) q_x(φ), and the rate matrix against a central difference of R in time.
 */
const deg = Math.PI / 180;

export const rotX = (a) => [[1, 0, 0], [0, Math.cos(a), -Math.sin(a)], [0, Math.sin(a), Math.cos(a)]];
export const rotY = (a) => [[Math.cos(a), 0, Math.sin(a)], [0, 1, 0], [-Math.sin(a), 0, Math.cos(a)]];
export const rotZ = (a) => [[Math.cos(a), -Math.sin(a), 0], [Math.sin(a), Math.cos(a), 0], [0, 0, 1]];

export function matMul(A, B) {
  return A.map((row) => [0, 1, 2].map((j) => row[0] * B[0][j] + row[1] * B[1][j] + row[2] * B[2][j]));
}
export const transpose = (A) => [0, 1, 2].map((i) => [0, 1, 2].map((j) => A[j][i]));
export const apply = (A, v) => A.map((row) => row[0] * v[0] + row[1] * v[1] + row[2] * v[2]);

/** R = R_z(ψ) R_y(θ) R_x(φ), angles in radians. */
export const eulerMatrix = (psi, theta, phi) => matMul(matMul(rotZ(psi), rotY(theta)), rotX(phi));

/** Quaternions as [w, x, y, z]. */
export function quatMul([a1, b1, c1, d1], [a2, b2, c2, d2]) {
  return [
    a1 * a2 - b1 * b2 - c1 * c2 - d1 * d2,
    a1 * b2 + b1 * a2 + c1 * d2 - d1 * c2,
    a1 * c2 - b1 * d2 + c1 * a2 + d1 * b2,
    a1 * d2 + b1 * c2 - c1 * b2 + d1 * a2,
  ];
}
export const quatAxis = (axis, a) => {
  const s = Math.sin(a / 2);
  return [Math.cos(a / 2), axis[0] * s, axis[1] * s, axis[2] * s];
};
export const quatFromEuler = (psi, theta, phi) => quatMul(quatMul(quatAxis([0, 0, 1], psi), quatAxis([0, 1, 0], theta)), quatAxis([1, 0, 0], phi));

export function quatMatrix([w, x, y, z]) {
  return [
    [1 - 2 * (y * y + z * z), 2 * (x * y - w * z), 2 * (x * z + w * y)],
    [2 * (x * y + w * z), 1 - 2 * (x * x + z * z), 2 * (y * z - w * x)],
    [2 * (x * z - w * y), 2 * (y * z + w * x), 1 - 2 * (x * x + y * y)],
  ];
}

/** Columns: the body angular velocity per unit φ̇, θ̇ and ψ̇. */
export function rateMatrix(theta, phi) {
  const [st, ct, sp, cp] = [Math.sin(theta), Math.cos(theta), Math.sin(phi), Math.cos(phi)];
  return [
    [1, 0, -st],
    [0, cp, ct * sp],
    [0, -sp, ct * cp],
  ];
}

const maxDiff = (A, B) => Math.max(...A.flatMap((row, i) => row.map((v, j) => Math.abs(v - B[i][j]))));
const norm = (v) => Math.hypot(...v);

/**
 * Everything for one attitude (degrees in) and a wanted body turn rate of 1°/s about `axis`:
 * the angle rates that make it, or the share of it no angle rates can make at gimbal lock.
 */
export function attitude({ psi, theta, phi, axis = [0, 0, 1] }) {
  const [p, t, f] = [psi * deg, theta * deg, phi * deg];
  const R = eulerMatrix(p, t, f);
  const q = quatFromEuler(p, t, f);
  const Rq = quatMatrix(q);
  const J = rateMatrix(t, f);
  const det = Math.cos(t);
  const locked = Math.abs(det) < 1e-9;
  const w = axis.map((v) => v * deg); // 1°/s about the body axis
  let rates = null;
  let residual = 0;
  if (!locked) {
    // Solve J [φ̇, θ̇, ψ̇] = ω row by row: J is upper-triangular after the y-z rows are combined.
    const [st, ct, sp, cp] = [Math.sin(t), Math.cos(t), Math.sin(f), Math.cos(f)];
    const psiDot = (w[1] * sp + w[2] * cp) / ct;
    const thetaDot = w[1] * cp - w[2] * sp;
    const phiDot = w[0] + psiDot * st;
    rates = { phi: phiDot / deg, theta: thetaDot / deg, psi: psiDot / deg };
  } else {
    // At lock the reachable rates span the roll axis and the pitch column; the rest is lost.
    const lost = [0, Math.sin(f), Math.cos(f)];
    residual = Math.abs(w[0] * lost[0] + w[1] * lost[1] + w[2] * lost[2]) / norm(w);
  }
  // The quaternion makes the same small turn exactly: q ⊗ δq against R · R_axis(δ).
  const d = 1e-3;
  const turned = quatMatrix(quatMul(q, quatAxis(axis, d)));
  const want = matMul(R, axisMatrix(axis, d));
  const quatError = maxDiff(turned, want);

  // The second method for the rate matrix: ω× = Rᵀ dR/dt by a central difference.
  const r = [0.3, -0.2, 0.5];
  const h = 1e-5;
  const Rp = eulerMatrix(p + h * r[2], t + h * r[1], f + h * r[0]);
  const Rm = eulerMatrix(p - h * r[2], t - h * r[1], f - h * r[0]);
  const dR = Rp.map((row, i) => row.map((v, j) => (v - Rm[i][j]) / (2 * h)));
  const W = matMul(transpose(R), dR);
  const wNum = [W[2][1], W[0][2], W[1][0]];
  const wJ = apply(J, r);
  const rateGap = norm(wNum.map((v, i) => v - wJ[i])) / norm(wJ);
  const orthGap = maxDiff(matMul(transpose(R), R), [[1, 0, 0], [0, 1, 0], [0, 0, 1]]);
  const matGap = maxDiff(R, Rq);
  // The two angle axes that line up at lock: yaw about the reference z, roll about the body x.
  const yawAxis = [0, 0, 1];
  const rollAxis = [R[0][0], R[1][0], R[2][0]];
  const alignment = Math.abs(rollAxis[2]);
  return {
    R, q, J, det, locked, rates, residual, reachable: !locked || residual < 1e-9, quatError, quatFollows: quatError < 1e-9,
    matGap, rateGap, orthGap, gap: Math.max(matGap, rateGap, orthGap), yawAxis, rollAxis, alignment,
  };
}

function axisMatrix(axis, a) {
  if (axis[0]) return rotX(a);
  if (axis[1]) return rotY(a);
  return rotZ(a);
}
