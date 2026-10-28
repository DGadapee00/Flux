/**
 * Circular shafts in torsion.
 *
 * A radius line stays straight, so the shear strain is linear in the radius.
 * Elastic material then makes the shear stress linear too. Moment equilibrium
 * on the cross-section is
 *
 *   T = ∫ τ ρ dA
 *
 * With τ = (ρ/c) τ_max this is τ = Tρ/J, and J = ∫ ρ² dA. A ring of radius ρ
 * has dA = 2πρ dρ, so
 *
 *   J = ∫_ri^ro 2π ρ³ dρ = (π/2)(ro⁴ − ri⁴) = (π/32)(do⁴ − di⁴)
 *
 * A solid shaft is the same integral with ri = 0.
 *
 * The shear strain is also ρ dφ/dx. With τ = Gγ,
 *
 *   φ = TL/(GJ)
 *
 * on a prismatic segment. Power and torque share one angular speed, T = P/ω.
 * An ideal gear pair keeps the power, so the slower shaft carries more torque.
 */
import { FT_LBF_PER_S_PER_HP, M_PER_FT, N_PER_LBF, RAD_S_PER_RPM } from '../convert.js';

/** Polar moment of a circular tube. ri = 0 is a solid shaft. */
export function polarJ(ro, ri = 0) {
  return (Math.PI / 2) * (ro ** 4 - ri ** 4);
}

/** Cross-sectional area of the same tube. */
export function polarArea(ro, ri = 0) {
  return Math.PI * (ro * ro - ri * ri);
}

/** τ(ρ) = Tρ/J. */
export function torsionShear(T, rho, J) {
  return (T * rho) / J;
}

/** Angle of twist of a prismatic segment, in radians. */
export function twistAngle(T, L, G, J) {
  return (T * L) / (G * J);
}

/** Radians per second from rpm, and the torque P/ω. P is in watts. */
export function torqueFromPower(P, rpm) {
  const omega = rpm * RAD_S_PER_RPM;
  return { omega, T: P / omega };
}

/**
 * The same torque from mechanical horsepower and rpm.
 * 1 hp = 550 ft·lbf/s. The foot-pound torque is converted to N·m only at the end.
 */
export function torqueFromHorsepower(hp, rpm) {
  const omega = rpm * RAD_S_PER_RPM;
  const Tft = (hp * FT_LBF_PER_S_PER_HP) / omega;
  return {
    omega,
    T_ft_lbf: Tft,
    T_lbf_in: Tft * 12,
    T: Tft * N_PER_LBF * M_PER_FT,
  };
}

/** Trapezoid of J = ∫ 2π ρ³ dρ. The closed form is polarJ. */
export function polarJQuadrature(ro, ri = 0, n = 2000) {
  const inner = Math.max(ri, 0);
  const outer = Math.max(ro, inner);
  if (outer - inner < 1e-15) return 0;
  const h = (outer - inner) / n;
  let sum = 0;
  for (let i = 0; i <= n; i++) {
    const rho = inner + i * h;
    const w = i === 0 || i === n ? 0.5 : 1;
    sum += w * 2 * Math.PI * rho ** 3;
  }
  return sum * h;
}

/**
 * Recover the torque by integrating τρ dA, with τ taken from the closed-form J.
 * A consistent linear stress field has to give T back.
 */
export function torqueFromShearField(T, ro, ri = 0, n = 2000) {
  const J = polarJ(ro, ri);
  const inner = Math.max(ri, 0);
  const outer = Math.max(ro, inner);
  if (!(J > 0) || outer - inner < 1e-15) return 0;
  const h = (outer - inner) / n;
  let sum = 0;
  for (let i = 0; i <= n; i++) {
    const rho = inner + i * h;
    const w = i === 0 || i === n ? 0.5 : 1;
    const tau = (T * rho) / J;
    sum += w * tau * rho * (2 * Math.PI * rho);
  }
  return sum * h;
}

/** Relative gap of the quadrature J, and of the recovered torque, against the closed form. */
export function sectionGap(T, ro, ri = 0, n = 2000) {
  const J = polarJ(ro, ri);
  const Jq = polarJQuadrature(ro, ri, n);
  const back = torqueFromShearField(T, ro, ri, n);
  const gapJ = Math.abs(Jq - J) / Math.max(Math.abs(J), 1);
  const gapT = Math.abs(back - T) / Math.max(Math.abs(T), 1);
  return { J, Jq, back, gap: Math.max(gapJ, gapT) };
}

/** Section properties from outer and inner diameters. */
export function shaftSection(d, di = 0) {
  const ro = d / 2;
  const ri = Math.max(di, 0) / 2;
  const J = polarJ(ro, ri);
  const A = polarArea(ro, ri);
  return { ro, ri, J, A, c: ro };
}

/** Stress at ρ, the extreme stresses, the angle, and the quadrature gap. */
export function roundShaft(T, L, G, d, di = 0, rho) {
  const sec = shaftSection(d, di);
  const at = rho == null ? sec.ro : Math.min(Math.max(rho, sec.ri), sec.ro);
  const tau = torsionShear(T, at, sec.J);
  const tauMax = torsionShear(T, sec.ro, sec.J);
  const tauIn = torsionShear(T, sec.ri, sec.J);
  const phi = twistAngle(T, L, G, sec.J);
  const gap = sectionGap(T, sec.ro, sec.ri).gap;
  const solidJ = polarJ(sec.ro, 0);
  return { ...sec, tau, tauMax, tauIn, phi, rho: at, gap, strength: sec.J / solidJ, areaFrac: sec.A / polarArea(sec.ro, 0) };
}

/**
 * Segments in series. Each carries torque seg.T, or the shaft torque T when
 * that is omitted. phiK is the equivalent spring only when every segment
 * carries that same T: 1/k = Σ L/(GJ).
 */
export function seriesTwist(segments, G, T) {
  let phi = 0;
  let flex = 0;
  const parts = segments.map((seg) => {
    const sec = shaftSection(seg.d, seg.di || 0);
    const Ti = seg.T ?? T;
    const ph = twistAngle(Ti, seg.L, G, sec.J);
    phi += ph;
    flex += seg.L / (G * sec.J);
    return { ...sec, T: Ti, L: seg.L, phi: ph, tauMax: torsionShear(Ti, sec.ro, sec.J) };
  });
  return { phi, phiK: T * flex, parts };
}

/**
 * Fixed at both ends, with torque T applied a distance a from the left end.
 * The two segments are springs, k = GJ/length, sharing the rotation at the
 * load. Their torques sum to T. The closed split T(L−a)/L is the same
 * statement written as equilibrium plus compatibility.
 */
export function fixedFixedTorsion(T, L, a, G, J) {
  const kL = (G * J) / a;
  const kR = (G * J) / (L - a);
  const phi = T / (kL + kR);
  const Tleft = kL * phi;
  const Tright = kR * phi;
  const TleftClosed = (T * (L - a)) / L;
  const TrightClosed = (T * a) / L;
  const phiClosed = (TleftClosed * a) / (G * J);
  const gap = Math.max(
    Math.abs(Tleft - TleftClosed) / Math.max(Math.abs(T), 1),
    Math.abs(phi - phiClosed) / Math.max(Math.abs(phiClosed), 1e-18),
  );
  return { phi, Tleft, Tright, kL, kR, gap };
}

/** Solid diameter for an allowable shear stress. τ = 16T/(π d³). */
export function solidDiameterForShear(T, tau) {
  return Math.cbrt((16 * T) / (Math.PI * tau));
}

/** Solid diameter for an allowable angle of twist, in radians. J = TL/(Gφ). */
export function solidDiameterForTwist(T, L, G, phi) {
  const J = (T * L) / (G * phi);
  return ((32 * J) / Math.PI) ** 0.25;
}

/** The larger of the stress diameter and the twist diameter. */
export function solidDiameterRequired(T, L, G, tauAllow, phiAllow) {
  const dShear = solidDiameterForShear(T, tauAllow);
  const dTwist = solidDiameterForTwist(T, L, G, phiAllow);
  return { dShear, dTwist, d: Math.max(dShear, dTwist) };
}

/**
 * Ideal gears. teeth2/teeth1 is the torque ratio of shaft 2 to shaft 1.
 * Speeds go the other way, and Tω is the same on both shafts.
 */
export function gearPair(T1, rpm1, teeth1, teeth2) {
  const ratio = teeth2 / teeth1;
  return { ratio, rpm2: rpm1 / ratio, T2: T1 * ratio };
}
