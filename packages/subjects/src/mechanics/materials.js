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

/**
 * Principal values of a plane-stress element.
 * σ_avg ± R, with R = hypot((σx−σy)/2, τxy). θ is the angle to σ1, in radians.
 */
export function principal2(sx, sy, txy) {
  const avg = (sx + sy) / 2;
  const R = Math.hypot((sx - sy) / 2, txy);
  const theta = 0.5 * Math.atan2(2 * txy, sx - sy);
  return { s1: avg + R, s2: avg - R, avg, R, theta };
}

/**
 * The same principals from the eigenvalues of [[σx, τ], [τ, σy]].
 * The discriminant is (σx+σy)²/4 − (σx σy − τ²), not the hypot form.
 */
export function eigen2(sx, sy, txy) {
  const avg = (sx + sy) / 2;
  const det = sx * sy - txy * txy;
  const R = Math.sqrt(Math.max(0, avg * avg - det));
  return { s1: avg + R, s2: avg - R, avg, R };
}

/**
 * Traction on a plane whose normal is θ from x.
 * The shear uses the tangent (−sin θ, cos θ), which matches transform().
 */
export function traction(sx, sy, txy, thetaDeg) {
  const t = thetaDeg * DEG;
  const c = Math.cos(t);
  const s = Math.sin(t);
  const fx = sx * c + txy * s;
  const fy = txy * c + sy * s;
  return { sx: fx * c + fy * s, txy: fx * -s + fy * c };
}

/** Tresca stress in plane stress. The third principal is 0. */
export function trescaPlane(sx, sy, txy) {
  const { s1, s2 } = principal2(sx, sy, txy);
  return Math.max(s1, s2, 0) - Math.min(s1, s2, 0);
}

/** von Mises stress from the in-plane principals, with the third principal 0. */
export function vonMisesPlane(sx, sy, txy) {
  const { s1, s2 } = principal2(sx, sy, txy);
  return Math.sqrt(s1 * s1 - s1 * s2 + s2 * s2);
}

/** The same von Mises stress from the components, σx² − σx σy + σy² + 3 τ². */
export function vonMisesComponents(sx, sy, txy) {
  return Math.sqrt(sx * sx - sx * sy + sy * sy + 3 * txy * txy);
}

/** Area, centroidal I and J of a solid circular cross-section of diameter d. */
export function circleSection(d) {
  const A = (Math.PI * d * d) / 4;
  const I = (Math.PI * d ** 4) / 64;
  const J = (Math.PI * d ** 4) / 32;
  return { A, I, J, c: d / 2 };
}

/**
 * Axial force, bending moment and torque on a solid circular bar.
 * The point is the outer fiber where bending and torsion both peak.
 * Tension is positive. sy is 0.
 */
export function combinedCircle(P, M, T, d) {
  const { A, I, J, c } = circleSection(d);
  const sx = P / A + (M * c) / I;
  const txy = (T * c) / J;
  const p = principal2(sx, 0, txy);
  return {
    sx, sy: 0, txy, ...p,
    vm: vonMisesComponents(sx, 0, txy),
    tresca: trescaPlane(sx, 0, txy),
  };
}

/** The reduced forms 4P/(πd²), 32M/(πd³) and 16T/(πd³). */
export function combinedReduced(P, M, T, d) {
  const axial = (4 * P) / (Math.PI * d * d);
  const bend = (32 * M) / (Math.PI * d ** 3);
  const txy = (16 * T) / (Math.PI * d ** 3);
  return { sx: axial + bend, txy, axial, bend };
}

/**
 * A shank under a compressive tongue load W and a horizontal force H.
 * The moment arm is `arm`. Bending adds on one side and subtracts on the other.
 * Peak is the normal stress of larger magnitude. von Mises equals that magnitude,
 * because the stress at that fiber is uniaxial.
 */
export function hitchSides(W, H, d, arm) {
  const { A, I, c } = circleSection(d);
  const axial = -Math.abs(W) / A;
  const bend = (Math.abs(H) * arm * c) / I;
  const tension = axial + bend;
  const compression = axial - bend;
  const peak = Math.abs(compression) >= Math.abs(tension) ? compression : tension;
  return { axial, bend, tension, compression, peak, vm: Math.abs(peak) };
}

/**
 * Bending stress σ = −M y / I. y is positive upward from the neutral axis.
 * A sagging moment (M > 0) compresses the top fiber.
 */
export const flexureStress = (M, y, I) => (-M * y) / I;

/** Rectangle of width b and height h, bent about the horizontal centroidal axis. */
export function rectSection(b, h) {
  const I = (b * h ** 3) / 12;
  const c = h / 2;
  return { A: b * h, I, c, ybar: 0, S: I / c, topY: c, botY: -c };
}

/**
 * T section, flange on top. Widths and thicknesses are bf, tf, tw, hw (web height
 * below the flange). ybar is measured up from the bottom of the web.
 */
export function teeSection(bf, tf, tw, hw) {
  const Af = bf * tf;
  const Aw = tw * hw;
  const yf = hw + tf / 2;
  const yw = hw / 2;
  const A = Af + Aw;
  const ybar = (Af * yf + Aw * yw) / A;
  const I = (bf * tf ** 3) / 12 + Af * (yf - ybar) ** 2 + (tw * hw ** 3) / 12 + Aw * (yw - ybar) ** 2;
  const topY = hw + tf - ybar;
  const botY = -ybar;
  return { A, I, ybar, topY, botY, cTop: topY, cBot: -botY, height: hw + tf };
}

/** Top and bottom fiber stresses for a sagging-positive moment. */
export function flexureFibers(M, section) {
  return {
    top: flexureStress(M, section.topY, section.I),
    bot: flexureStress(M, section.botY, section.I),
    I: section.I,
  };
}

/**
 * The rectangle formula 6M/(b h²), both fibers equal in magnitude.
 * Top is compression when M sags.
 */
export function rectFibersReduced(M, b, h) {
  const mag = (6 * M) / (b * h * h);
  return { top: -mag, bot: mag };
}

/** Tensile bending stress on a simple span with uniform load w: (w L²/8) times 6/(b h²). */
export const simpleBendingStress = (w, L, b, h) => (3 * w * L * L) / (4 * b * h * h);

/**
 * Integrate σ dA and −y σ dA over horizontal bands { y0, y1, width } measured
 * from the neutral axis. The axial force should be 0 and the moment should return M.
 */
export function flexureBalance(M, I, bands, n = 4000) {
  let axial = 0;
  let moment = 0;
  for (const band of bands) {
    const h = (band.y1 - band.y0) / n;
    for (let i = 0; i < n; i++) {
      const y = band.y0 + (i + 0.5) * h;
      const dA = band.width * Math.abs(h);
      const s = flexureStress(M, y, I);
      axial += s * dA;
      moment += -y * s * dA;
    }
  }
  return { axial, moment };
}

/** Bands of a rectangle centered on the neutral axis, and of a tee, for the integral check. */
export function rectBands(b, h) {
  return [{ y0: -h / 2, y1: h / 2, width: b }];
}

export function teeBands(section, bf, tf, tw, hw) {
  return [
    { y0: -section.ybar, y1: hw - section.ybar, width: tw },
    { y0: hw - section.ybar, y1: hw + tf - section.ybar, width: bf },
  ];
}

/**
 * First moment about the neutral axis of every band's area sitting above station y.
 * Bands are { y0, y1, width }, y positive up from the neutral axis. Side-by-side
 * bands may share a y range; they must not occupy the same area.
 */
export function bandQ(bands, y) {
  let Q = 0;
  for (const band of bands) {
    const bot = Math.max(y, band.y0);
    const top = band.y1;
    if (bot >= top) continue;
    Q += band.width * (top - bot) * ((top + bot) / 2);
  }
  return Q;
}

/** τ = VQ/(I t). t is the width cut by the horizontal line at that station. */
export const shearStress = (V, Q, I, t) => (V * Q) / (I * t);

/** Shear flow q = VQ/I, the force per length along the beam. */
export const shearFlow = (V, Q, I) => (V * Q) / I;

/** Fastener spacing when `lines` fasteners, each able to carry `capacity`, share the flow. */
export const fastenerSpacing = (q, capacity, lines) => (lines * capacity) / q;

/** Force in one fastener when they are `spacing` apart and `lines` share the flow. */
export const fastenerForce = (q, spacing, lines) => (q * spacing) / lines;

/**
 * Rectangle. τ(y) = (V/(2I))((h/2)² − y²), so the peak is 3V/(2A) at the neutral axis
 * and the outer fibers carry none.
 */
export function rectShear(V, b, h, y) {
  const I = (b * h ** 3) / 12;
  const Q = (b / 2) * ((h / 2) ** 2 - y * y);
  return { tau: (V * Q) / (I * b), Q, I, tmax: (3 * V) / (2 * b * h) };
}

/**
 * Symmetric I. The web height hw is the clear distance between the flanges.
 * yf is the flange centroid measured from the neutral axis.
 */
export function iSection(bf, tf, tw, hw) {
  const H = hw + 2 * tf;
  const yf = hw / 2 + tf / 2;
  const Af = bf * tf;
  const I = 2 * ((bf * tf ** 3) / 12 + Af * yf ** 2) + (tw * hw ** 3) / 12;
  return { bf, tf, tw, hw, H, yf, Af, A: 2 * Af + tw * hw, I };
}

export function iBands(sec) {
  const half = sec.hw / 2;
  return [
    { y0: -(half + sec.tf), y1: -half, width: sec.bf },
    { y0: -half, y1: half, width: sec.tw },
    { y0: half, y1: half + sec.tf, width: sec.bf },
  ];
}

/**
 * Box: two lumber flanges of width bf and thickness tf, and two webs of thickness tw
 * running the full height H beside the flanges. The webs do not overlap the lumber.
 */
export function boxSection(bf, tf, tw, H) {
  const yf = H / 2 - tf / 2;
  const Af = bf * tf;
  const Qf = Af * yf;
  const I = 2 * ((bf * tf ** 3) / 12 + Af * yf ** 2) + 2 * ((tw * H ** 3) / 12);
  return { bf, tf, tw, H, yf, Af, Qf, I, webs: 2 };
}

export function boxBands(sec) {
  const half = sec.H / 2;
  return [
    { y0: -half, y1: -(half - sec.tf), width: sec.bf },
    { y0: half - sec.tf, y1: half, width: sec.bf },
    { y0: -half, y1: half, width: 2 * sec.tw },
  ];
}

/** n boards of width b and thickness t, stacked. Q is the top board about the neutral axis. */
export function stackedBoards(b, t, n) {
  const h = n * t;
  const yf = h / 2 - t / 2;
  const Q = b * t * yf;
  const I = (b * h ** 3) / 12;
  return { b, t, n, h, yf, Q, I, A: b * h };
}

/**
 * ∫ VQ/I dy over the section. It returns V when Q is the first moment above each station.
 * The integral is split at every band edge so a jump in width stays out of a panel.
 */
export function shearBalance(V, I, bands, n = 4000) {
  const ys = new Set();
  for (const band of bands) {
    ys.add(band.y0);
    ys.add(band.y1);
  }
  const cuts = [...ys].sort((a, c) => a - c);
  let carried = 0;
  for (let k = 0; k < cuts.length - 1; k++) {
    const y0 = cuts[k];
    const y1 = cuts[k + 1];
    const h = (y1 - y0) / n;
    if (!(h > 0)) continue;
    for (let i = 0; i < n; i++) {
      const y = y0 + (i + 0.5) * h;
      carried += (V * bandQ(bands, y) / I) * h;
    }
  }
  return carried;
}

/** The share of V carried between y0 and y1, where the slice is one material. */
export function shearShare(V, I, bands, y0, y1, n = 4000) {
  const h = (y1 - y0) / n;
  let carried = 0;
  for (let i = 0; i < n; i++) {
    const y = y0 + (i + 0.5) * h;
    carried += (V * bandQ(bands, y) / I) * h;
  }
  return carried / V;
}
