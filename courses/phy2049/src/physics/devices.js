/**
 * The physics behind the application labs: a railgun (Ch 46–47), an ion thruster (Ch 38–42) and a
 * cyclotron with its cousin the mass spectrometer (Ch 46). Each is the course model of the device,
 * built only from equations in the notes; what that model leaves out is said in each lab's coach.
 * Pure functions in SI units, so selftest.js checks them against closed forms and hand numbers.
 */
import { MU0, QE } from './constants.js';

export const AMU = 1.6605e-27;
export const G0 = 9.81;

// ---------------------------------------------------------------- railgun

/**
 * Two round rails of radius a, centre to centre w apart, carry I in opposite directions and are
 * bridged by the armature. Each rail is a semi-infinite wire ending at the armature, whose field at
 * perpendicular distance y from its end is μ₀I/4πy (half the infinite wire's). Both rails' fields
 * point the same way between them.
 */
export function railB(I, w, y) {
  return ((MU0 * I) / (4 * Math.PI)) * (1 / y + 1 / (w - y));
}

/**
 * F = ∫ I dy B(y) across the armature, from one rail's surface (y = a) to the other's (y = w − a):
 * F = (μ₀I²/2π) ln((w − a)/a). The same as ½L′I² with L′ = (μ₀/π) ln((w − a)/a).
 */
export function railgunForce(I, w, a) {
  return ((MU0 * I * I) / (2 * Math.PI)) * Math.log((w - a) / a);
}

/** A constant-current launch from rest along rails of length L. */
export function railgunLaunch({ I, w, a, m, L }) {
  const F = railgunForce(I, w, a);
  const acc = F / m;
  const v = Math.sqrt((2 * F * L) / m);
  return {
    F,
    acc,
    gees: acc / G0,
    v,
    t: v / acc,
    KE: F * L,
    Bmid: railB(I, w, w / 2), // = μ₀I/πw
    Lprime: (MU0 / Math.PI) * Math.log((w - a) / a),
    // Far behind the armature the rails are two long antiparallel wires, which repel.
    railRepelPerM: (MU0 * I * I) / (2 * Math.PI * w),
  };
}

// ---------------------------------------------------------------- ion thruster

export const PROPELLANTS = {
  Xe: { id: 'Xe', name: 'Xenon', m: 131.29 * AMU },
  Kr: { id: 'Kr', name: 'Krypton', m: 83.8 * AMU },
  Ar: { id: 'Ar', name: 'Argon', m: 39.95 * AMU },
};

/**
 * A gridded ion thruster: singly charged ions fall through the grids' potential difference V and
 * leave at v = √(2qV/m) (qΔV = ½mv²). A beam current I carries I/q ions a second, so the mass flow
 * is ṁ = Im/q and the thrust is ṁv = I√(2mV/q). The beam's power is IV.
 */
export function thruster({ V, I, gas, gap = 0.001 }) {
  const m = PROPELLANTS[gas]?.m ?? PROPELLANTS.Xe.m;
  const v = Math.sqrt((2 * QE * V) / m);
  const mdot = (I * m) / QE;
  const T = mdot * v;
  const P = I * V;
  return {
    m,
    v,
    mdot,
    T,
    P,
    KEion: QE * V,
    ionsPerSec: I / QE,
    Egap: V / gap,
    TperkW: T / (P / 1000),
    isp: v / G0,
    // Propellant used in a day of thrusting.
    perDay: mdot * 86400,
  };
}

// ---------------------------------------------------------------- cyclotron and mass spectrometer

/** The speed of light, for the cyclotron's relativity check. */
const C_LIGHT = 3e8;

export const IONS = {
  p: { id: 'p', name: 'Proton', m: 1.67e-27, q: QE },
  d: { id: 'd', name: 'Deuteron', m: 3.344e-27, q: QE },
  C12: { id: 'C12', name: 'Carbon-12 ion', m: 12 * AMU, q: QE },
  N14: { id: 'N14', name: 'Nitrogen-14 ion', m: 14.003 * AMU, q: QE },
  O16: { id: 'O16', name: 'Oxygen-16 ion', m: 15.995 * AMU, q: QE },
  Zn64: { id: 'Zn64', name: 'Zinc-64 ion', m: 63.929 * AMU, q: QE },
  Zn66: { id: 'Zn66', name: 'Zinc-66 ion', m: 65.926 * AMU, q: QE },
};

/**
 * Cyclotron: the orbit period 2πm/qB does not depend on speed, so a fixed-frequency voltage across
 * the gap stays in step as the orbit grows. Each gap crossing adds qV; the ion leaves at the dees'
 * radius R with K = (qBR)²/2m.
 *
 * That is the course (non-relativistic) model. In fact lap n takes longer by the factor
 * γ ≈ 1 + K/mc², with K = 2nqV after n laps. Tuned to the first lap, the voltage falls behind by
 * 2π·Σ K_n/mc² ≈ π·(laps)·K_max/mc² radians by the edge. Past about half a cycle (180°) the ion
 * meets the gap on the wrong half of the voltage's swing, so a fixed-frequency cyclotron cannot
 * reach K_max; real ones this big make B grow with radius so every lap still takes the same time.
 */
export function cyclotron({ B, R, V, ion = 'p' }) {
  const P = IONS[ion] ?? IONS.p;
  const f = (P.q * B) / (2 * Math.PI * P.m);
  const vmax = (P.q * B * R) / P.m;
  const Kmax = (P.q * B * R) ** 2 / (2 * P.m);
  const crossings = Kmax / (P.q * V);
  return {
    P,
    f,
    T: 1 / f,
    vmax,
    Kmax,
    KmaxMeV: Kmax / (QE * 1e6),
    crossings,
    turns: crossings / 2,
    // Radius after n gap crossings: K = nqV, r = mv/qB = √(2mK)/qB.
    rAfter: (n) => Math.sqrt(2 * P.m * n * P.q * V) / (P.q * B),
    tOut: (crossings / 2) / f,
    // How much longer the last lap takes than the first, and the voltage's total slip, in degrees.
    lapGrowth: Kmax / (P.m * C_LIGHT ** 2),
    slipDeg: (180 * (crossings / 2) * Kmax) / (P.m * C_LIGHT ** 2),
  };
}

/**
 * Mass spectrometer: an ion accelerated from rest through V enters a field B at right angles and
 * turns a half circle of radius r = mv/qB = √(2mV/q)/B, landing 2r from where it entered.
 */
export function spectrometerRadius(m, q, V, B) {
  return Math.sqrt((2 * m * V) / q) / B;
}

/** The mass that lands at radius r: m = qB²r²/2V. */
export function spectrometerMass(r, q, V, B) {
  return (q * B * B * r * r) / (2 * V);
}

// ---------------------------------------------------------------- power lines (Ch 41–42)

export const LINE_METALS = {
  aluminum: { id: 'aluminum', name: 'Aluminum', rho: 2.82e-8 },
  copper: { id: 'copper', name: 'Copper', rho: 1.72e-8 },
};

/**
 * A power station sends P at voltage V down a line of length L to a town and back: two conductors,
 * each of cross-section A. The current is I = P/V, the line's resistance R = ρ(2L)/A, and the line
 * turns I²R into heat. The share lost, I²R/P = PR/V², falls as 1/V²: that is why lines run at
 * hundreds of kilovolts. (The course model is DC; real lines are three-phase AC, Ch 52.)
 */
export function transmission({ P, V, L, A, metal = 'aluminum' }) {
  const rho = (LINE_METALS[metal] ?? LINE_METALS.aluminum).rho;
  const R = (rho * 2 * L) / A;
  const I = P / V;
  const loss = I * I * R;
  return { rho, R, I, loss, frac: loss / P, drop: I * R, delivered: P - loss, possible: loss < P };
}

// ---------------------------------------------------------------- DC motor (Ch 46)

/**
 * A square coil of N turns, side s, carries I in a uniform field B. The two sides across the field
 * each feel F = NIsB, with lever arm (s/2) sin θ: τ = NIAB sin θ, A = s². A commutator reverses the
 * current every half turn, so the torque never changes sign: its average over a turn is (2/π)τ_max.
 * Turning at ω, the motor does work at P = τ_avg ω.
 */
export function motor({ N, I, s, B, rpm }) {
  const A = s * s;
  const tauMax = N * I * A * B;
  const tauAvg = (2 / Math.PI) * tauMax;
  const omega = (rpm * 2 * Math.PI) / 60;
  return {
    A,
    mu: N * I * A,
    sideForce: N * I * s * B,
    tauMax,
    tauAvg,
    omega,
    P: tauAvg * omega,
    tauAt: (theta) => tauMax * Math.abs(Math.sin(theta)),
  };
}

// ---------------------------------------------------------------- MRI magnet (Ch 47)

/** A proton's magnetic moment (J/T), and its precession frequency per tesla, γ/2π (Hz/T). */
export const MU_PROTON = 1.41e-26;
export const GAMMA_BAR = 42.58e6;

/**
 * The MRI magnet as a long solenoid: B = μ₀nI inside, whatever the radius. Given the field wanted
 * and the current the wire carries, n = B/μ₀I sets the turns, and the turns and the radius set how
 * much wire. Run that wire as copper (cross-section Aw) and it would dissipate I²R; a
 * superconductor dissipates nothing, so the current can circulate for years.
 *
 * A scanner is not much longer than it is wide, so the long-coil formula overestimates. Adding up
 * the on-axis fields of the turns, ∫ μ₀nIR² dx / 2(R² + x²)^{3/2}, gives μ₀nI·(L/2)/√((L/2)² + R²)
 * at the center and ½μ₀nI·L/√(L² + R²) at either end (half the center's for a long coil).
 */
export function mriMagnet({ B, I, L, R, Aw = 4e-6 }) {
  const n = B / (MU0 * I);
  const N = n * L;
  const wire = N * 2 * Math.PI * R;
  const Rcu = (1.72e-8 * wire) / Aw;
  return {
    n,
    N,
    wire,
    Rcu,
    Pcu: I * I * Rcu,
    // The largest torque the field can put on one proton's moment, and the moment's precession.
    tauProton: MU_PROTON * B,
    fLarmor: GAMMA_BAR * B,
    // The same n in a coil of this length and radius, turn by turn (Biot–Savart on the axis).
    Bcenter: (B * (L / 2)) / Math.hypot(L / 2, R),
    Bend: (B * L) / (2 * Math.hypot(L, R)),
  };
}

/**
 * An ideal transformer (Ch 49–50). Both coils wind one iron core, so every turn links the same flux
 * Φ and has the same emf dΦ/dt: V_p = N_p dΦ/dt and V_s = N_s dΦ/dt, so V_s/V_p = N_s/N_p. Nothing
 * is lost, so I_pV_p = I_sV_s and I_p/I_s = N_s/N_p. A load R on the secondary draws I_s = V_s/R,
 * and the primary sees V_p/I_p = R(N_p/N_s)²: a transformer scales impedance by the turns ratio
 * squared, which is how it matches a speaker to an amplifier (Ch 52). Voltages and currents are rms.
 */
export function transformer({ Vp, Np, Ns, R }) {
  const ratio = Ns / Np;
  const Vs = Vp * ratio;
  const Is = Vs / R;
  const Ip = Is * ratio;
  return { ratio, Vs, Is, Ip, P: Vs * Is, Pin: Vp * Ip, Zin: R / (ratio * ratio), step: ratio > 1 ? 'up' : ratio < 1 ? 'down' : 'none' };
}

/**
 * An electromagnetic flow meter (Ch 48, 51). A conducting fluid flows at speed v along a pipe of
 * diameter d, across a field B. Each ion feels qv×B toward one wall; positive and negative ions part
 * until the electric field they build balances the push, qE = qvB. The fluid between the two
 * electrodes is then a conductor of length d moving at v, with emf V = Ed = Bdv: the moving rod of
 * Ch 48 made of water. The volume flow is Q = v·πd²/4, so V = 4BQ/πd reads the flow directly.
 * (Course model: a uniform speed across the pipe; a real meter reads the average.)
 */
export function flowMeter({ B, d, v }) {
  const V = B * d * v;
  const A = (Math.PI * d * d) / 4;
  return { V, E: v * B, A, Q: v * A, Lps: v * A * 1e3 };
}
