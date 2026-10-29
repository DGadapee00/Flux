/**
 * How a pin joint moves when the bars that hold it stretch, and where stress gathers at a hole.
 * Pure, SI, plane. Each function says how it is derived; deformation-selftest.js checks each one a
 * second way.
 */

const unit = (from, to) => {
  const dx = to[0] - from[0];
  const dy = to[1] - from[1];
  const L = Math.hypot(dx, dy);
  return { e: [dx / L, dy / L], L };
};

/**
 * One free pin joint at `joint`, held by bars from fixed pins: bars [{ from: [x, y], A, E }].
 * `F` is the load on the joint [Fx, Fy]. Any number of bars, two or more, not all in line.
 *
 * Stiffness method. A joint displacement d stretches bar i by δi = ei·d, where ei points from the
 * bar's fixed end to the joint. Its tension is Ni = ki δi with ki = AE/L. The bars pull the joint
 * back by −Ni ei, so equilibrium is (Σ ki ei eiᵀ) d = F. Two bars make it determinate; a third
 * makes it indeterminate, and the same 2×2 solve still closes it.
 */
export function pinJoint(joint, bars, F) {
  let kxx = 0;
  let kxy = 0;
  let kyy = 0;
  const geo = bars.map((b) => {
    const { e, L } = unit(b.from, joint);
    const k = (b.A * b.E) / L;
    kxx += k * e[0] * e[0];
    kxy += k * e[0] * e[1];
    kyy += k * e[1] * e[1];
    return { e, L, k };
  });
  const det = kxx * kyy - kxy * kxy;
  if (Math.abs(det) < 1e-12 * (kxx * kyy || 1)) throw new Error('pinJoint: the bars are in line, so the joint is a mechanism');
  const u = (kyy * F[0] - kxy * F[1]) / det;
  const v = (kxx * F[1] - kxy * F[0]) / det;
  const members = geo.map(({ e, L, k }, i) => {
    const delta = e[0] * u + e[1] * v;
    const N = k * delta;
    return { e, L, k, delta, N, stress: N / bars[i].A, U: (N * delta) / 2 };
  });
  // Equilibrium residual: the load against the bars' pull, a check on the solve.
  const rx = F[0] - members.reduce((s, m) => s + m.N * m.e[0], 0);
  const ry = F[1] - members.reduce((s, m) => s + m.N * m.e[1], 0);
  const work = 0.5 * (F[0] * u + F[1] * v);
  // Clapeyron: the load's work equals the strain energy Σ N²L/2AE stored in the bars.
  const energy = members.reduce((s, m) => s + m.U, 0);
  return { u, v, members, residual: Math.hypot(rx, ry), work, energy };
}

/**
 * Compatibility alone: two bars whose elongations are known put the joint where e1·d = δ1 and
 * e2·d = δ2. This is the hand method (and the Williot diagram drawn as algebra).
 */
export function jointFromElongations(joint, froms, deltas) {
  const [a, b] = froms.map((f) => unit(f, joint).e);
  const det = a[0] * b[1] - a[1] * b[0];
  if (Math.abs(det) < 1e-12) throw new Error('jointFromElongations: the bars are in line');
  return {
    u: (deltas[0] * b[1] - deltas[1] * a[1]) / det,
    v: (a[0] * deltas[1] - b[0] * deltas[0]) / det,
  };
}

/**
 * Two-bar bracket: a level bar of length `Lh` and a bar that rises `rise` over the same run, both
 * pinned to a wall, meet at a joint loaded by P downward. Member forces from the joint by statics,
 * then the joint displacement from compatibility. The level bar is in compression, the slanted one
 * in tension. Returns SI, with v negative (down).
 */
export function bracket(P, Lh, rise, A1, A2, E) {
  const Ls = Math.hypot(Lh, rise);
  const sin = rise / Ls;
  const cos = Lh / Ls;
  const Ns = P / sin;
  const Nh = -P * cos / sin;
  const dh = (Nh * Lh) / (A1 * E);
  const ds = (Ns * Ls) / (A2 * E);
  const joint = [0, 0];
  const { u, v } = jointFromElongations(joint, [[-Lh, 0], [-Lh, rise]], [dh, ds]);
  return { Ls, sin, cos, Nh, Ns, dh, ds, u, v };
}

/**
 * Three bars from a ceiling to one joint: the middle one vertical of length L, the two sides at θ
 * from the vertical (length L/cos θ), all the same A and E, load P down. Compatibility: a side bar
 * stretches by the joint drop times cos θ, so its strain is cos²θ times the middle bar's, and its
 * force is cos²θ times the middle force. Vertical equilibrium Nm + 2 Ns cos θ = P then gives
 * Nm = P/(1 + 2 cos³θ).
 */
export function threeBar(P, L, thetaDeg, A, E) {
  const c = Math.cos((thetaDeg * Math.PI) / 180);
  const Nm = P / (1 + 2 * c ** 3);
  const Ns = Nm * c * c;
  const drop = (Nm * L) / (A * E);
  return { Nm, Ns, drop, cos: c, sm: Nm / A, ss: Ns / A };
}

/**
 * The Kirsch field around a circular hole of radius a in a wide plate under a far stress S along x.
 * Polar (r, θ) with θ from the load axis. Traction-free at r = a; S along x far away.
 */
export function kirsch(S, a, r, thetaDeg) {
  const t = (thetaDeg * Math.PI) / 180;
  const q = (a * a) / (r * r);
  const c2 = Math.cos(2 * t);
  const s2 = Math.sin(2 * t);
  return {
    sr: (S / 2) * (1 - q) + (S / 2) * (1 - 4 * q + 3 * q * q) * c2,
    st: (S / 2) * (1 + q) - (S / 2) * (1 + 3 * q * q) * c2,
    srt: -(S / 2) * (1 + 2 * q - 3 * q * q) * s2,
  };
}

/** Peak at the edge of an elliptical hole, half-axis a across the load and b along it (Inglis). */
export const ktEllipse = (a, b) => 1 + (2 * a) / b;

/** The same, written with the tip radius ρ = b²/a. */
export const ktTip = (a, rho) => 1 + 2 * Math.sqrt(a / rho);

/**
 * A hole of diameter d in a strip of width w, on the net-section stress P/((w − d)t). Heywood's fit
 * to the measured curve; it tends to 3 as d/w → 0, the Kirsch value.
 */
export const ktStrip = (d, w) => 2 + (1 - d / w) ** 3;

/** The peak stress at a hole in a strip: Kt on the net section. */
export function holeInStrip(P, w, d, t) {
  const net = P / ((w - d) * t);
  const Kt = ktStrip(d, w);
  return { net, gross: P / (w * t), Kt, peak: Kt * net };
}
