/**
 * Slip and Schmid's law (EMA 3010, Defects).
 *
 * A single crystal pulled with stress σ along its axis slips when the shear stress resolved onto a
 * slip plane, along a slip direction in it, reaches the critical resolved shear stress τ_crss:
 *   τ_R = σ cos φ cos λ,
 * with φ the angle between the axis and the plane's normal and λ the angle between the axis and the
 * slip direction. Here the slip direction is turned by ψ within the plane from the steepest line
 * down it, so cos λ = sin φ cos ψ and the Schmid factor m = cos φ sin φ cos ψ, at most ½ at φ = 45°,
 * ψ = 0. The crystal yields at σ_y = τ_crss/m.
 *
 * The second route builds the stress tensor σ a⊗a, rotates it into the slip system's frame
 * (slip direction, its in-plane normal, plane normal) and reads off the shear component.
 */
const deg = Math.PI / 180;

/** The slip system's unit vectors for the axis along z. */
export function slipSystem(phi, psi) {
  const [sp, cp, ss, cs] = [Math.sin(phi * deg), Math.cos(phi * deg), Math.sin(psi * deg), Math.cos(psi * deg)];
  const n = [sp, 0, cp];
  const steep = [-cp, 0, sp]; // in the plane, as close to the axis as the plane allows
  const across = [0, 1, 0];
  const d = steep.map((v, i) => cs * v + ss * across[i]);
  return { n, d };
}

export function schmid({ phi, psi, sigma, tauC }) {
  const cosPhi = Math.cos(phi * deg);
  const cosLam = Math.sin(phi * deg) * Math.cos(psi * deg);
  const m = cosPhi * cosLam;
  const tau = sigma * m;

  // Second route: rotate σ a⊗a into the frame (d, n × d, n) and take the d-n shear component.
  const { n, d } = slipSystem(phi, psi);
  const t = [n[1] * d[2] - n[2] * d[1], n[2] * d[0] - n[0] * d[2], n[0] * d[1] - n[1] * d[0]];
  const Q = [d, t, n];
  const S = [[0, 0, 0], [0, 0, 0], [0, 0, sigma]];
  const QS = Q.map((row) => [0, 1, 2].map((j) => row[0] * S[0][j] + row[1] * S[1][j] + row[2] * S[2][j]));
  const rotated = QS.map((row) => Q.map((q) => row[0] * q[0] + row[1] * q[1] + row[2] * q[2]));
  const tauTensor = rotated[0][2];
  const sigmaN = rotated[2][2];

  const slips = tau >= tauC - 1e-12;
  const sigmaY = m > 1e-12 ? tauC / m : null;
  return { m, cosPhi, cosLam, lambda: Math.acos(cosLam) / deg, tau, tauTensor, sigmaN, slips, sigmaY, n, d, gap: Math.abs(tauTensor - tau) / Math.max(Math.abs(sigma) * 0.5, 1e-12) };
}
