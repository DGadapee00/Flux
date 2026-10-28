/**
 * Strain energy and the deflections it produces.
 *
 * A linear spring stores U = ½ k δ². The load and the stretch are P = kδ,
 * so the same energy is ½ Pδ, not Pδ. For a bar in tension that is
 *
 *   U = N²L / (2AE),    δ = NL / (AE)
 *
 * Bending stores ∫ M² dx / (2EI). A tip-loaded cantilever has M = −P(L−x),
 * and the integral is P²L³/(6EI). Castigliano's theorem says the displacement
 * in the direction of a load is ∂U/∂P. Differentiating the cantilever energy
 * returns the tip drop PL³/(3EI).
 *
 * A displacement where no real load acts needs a dummy load Q. Write U with
 * Q present, differentiate with respect to Q, then set Q to zero. On the
 * cantilever that is ∫ M (∂M/∂Q) dx / EI.
 *
 * A weight W dropped from a height h onto the spring comes to rest when
 *
 *   W(h + δ) = ½ k δ²,    k = W / δ_st
 *
 * The positive root is δ = δ_st (1 + √(1 + 2h/δ_st)). A drop of zero, the
 * weight released from the contact point, still doubles the static stretch.
 * The same factor comes from integrating mÿ = W − ky, with the contact
 * speed √(2gh). g cancels in the closed factor. It is used only in that
 * integration.
 */
import { M_PER_IN, N_PER_LBF, PA_PER_PSI } from '../convert.js';
import { cantileverTipDeflection } from './elastic.js';
import { memberForce, solveTruss } from './truss.js';
import { v } from './vectors.js';

const G_FALL = 9.81;

/** Constant axial force. U = ½ Nδ and δ = NL/(AE) are the same bar. */
export function axialBar(N, L, A, E) {
  const delta = (N * L) / (A * E);
  const U = (N * N * L) / (2 * A * E);
  const half = 0.5 * Math.abs(N) * Math.abs(delta);
  const scale = Math.max(Math.abs(U), 1e-30);
  return { delta, U, gap: Math.abs(U - half) / scale };
}

/**
 * Trapezoid of ∫ M² dx / (2EI). `moment(x)` is the bending moment.
 * The sign of M does not matter: the integrand is a square.
 */
export function bendingEnergy(moment, L, EI, n = 2000) {
  if (L <= 0 || EI <= 0) return 0;
  const h = L / n;
  let sum = 0;
  for (let i = 0; i <= n; i++) {
    const M = moment(i * h);
    const w = i === 0 || i === n ? 0.5 : 1;
    sum += w * M * M;
  }
  return (sum * h) / (2 * EI);
}

/** Tip-loaded cantilever. Closed energy against the moment integral and the elastic curve. */
export function cantileverTipEnergy(P, L, EI, n = 2000) {
  const U = (P * P * L ** 3) / (6 * EI);
  const delta = (P * L ** 3) / (3 * EI);
  const curve = cantileverTipDeflection(Math.abs(P), L, EI);
  const quad = bendingEnergy((x) => -Math.abs(P) * (L - x), L, EI, n);
  const gapU = Math.abs(U - quad) / Math.max(Math.abs(U), 1e-30);
  const gapD = Math.abs(delta - curve.drop) / Math.max(Math.abs(delta), 1e-30);
  return { U, delta, gap: Math.max(gapU, gapD) };
}

/**
 * Downward deflection at a station `a` from the wall, on a cantilever with
 * a downward tip load P. The dummy load sits at `a` and is then set to zero.
 *
 *   δ = P (L a²/2 − a³/6) / EI
 *
 * Checked against ∫ M ∂M/∂Q dx / EI and against the elastic curve.
 */
export function cantileverStation(P, L, a, EI, n = 2000) {
  const aa = Math.min(Math.max(a, 0), L);
  const delta = (Math.abs(P) / EI) * (L * aa * aa / 2 - aa ** 3 / 6);
  const h = L / n;
  let sum = 0;
  const load = Math.abs(P);
  for (let i = 0; i <= n; i++) {
    const x = i * h;
    const M = -load * (L - x);
    const dM = x <= aa + 1e-12 ? -(aa - x) : 0;
    const w = i === 0 || i === n ? 0.5 : 1;
    sum += w * M * dM;
  }
  const quad = (sum * h) / EI;
  const drop = -cantileverTipDeflection(load, L, EI).at(aa).y;
  const scale = Math.max(Math.abs(delta), Math.abs(drop), 1e-30);
  if (scale < 1e-18) return { delta: 0, gap: 0 };
  return {
    delta,
    gap: Math.max(Math.abs(delta - quad), Math.abs(delta - drop)) / scale,
  };
}

/** Circular shaft. U = ½ Tφ and φ = TL/(GJ). */
export function torsionStrain(T, L, G, J) {
  const phi = (T * L) / (G * J);
  const U = (T * T * L) / (2 * G * J);
  const half = 0.5 * Math.abs(T) * Math.abs(phi);
  return { phi, U, gap: Math.abs(U - half) / Math.max(Math.abs(U), 1e-30) };
}

/**
 * Rectangle, form factor 6/5, constant shear. U = (6/5) V²L / (2AG).
 * For a slender cantilever this is a small fraction of the bending energy.
 */
export function shearEnergyRect(V, L, A, G) {
  const fs = 6 / 5;
  const U = (fs * V * V * L) / (2 * A * G);
  return { fs, U };
}

/**
 * Two bars from a pin and a pin up to a joint, symmetric, load P downward.
 * Castigliano (a numerical ∂U/∂P) against the bar shortening divided by sin θ,
 * and the bar force against the joint solution.
 */
export function twoBarTruss(P, span, rise, A, E) {
  const half = span / 2;
  const len = Math.hypot(half, rise);
  const sin = rise / len;
  const F = P / (2 * sin);
  const U = (F * F * len) / (A * E);
  const dP = Math.max(Math.abs(P) * 1e-6, 1e-6);
  const up = barEnergy(P + dP, span, rise, A, E);
  const dn = barEnergy(P - dP, span, rise, A, E);
  const delta = (up - dn) / (2 * dP);
  const fromShortening = (F * len) / (A * E * sin);
  const sol = solveTruss({
    joints: {
      A: v(0, 0, 0),
      B: v(span, 0, 0),
      C: v(half, rise, 0),
    },
    members: [['A', 'C'], ['B', 'C']],
    loads: { C: { y: -P } },
    supports: { A: 'pin', B: 'pin' },
  });
  const solved = Math.abs(memberForce(sol, 'A', 'C'));
  const scaleF = Math.max(Math.abs(F), 1);
  const scaleD = Math.max(Math.abs(delta), 1e-30);
  return {
    len, sin, F, U, delta,
    stress: F / A,
    gap: Math.max(
      Math.abs(delta - fromShortening) / scaleD,
      Math.abs(solved - F) / scaleF,
      sol.worstResidual / scaleF,
    ),
  };
}

function barEnergy(P, span, rise, A, E) {
  const len = Math.hypot(span / 2, rise);
  const sin = rise / len;
  const F = P / (2 * sin);
  return (F * F * len) / (A * E);
}

/** Static stretch of a bar used as a spring, δ_st = WL/(AE), k = AE/L. */
export function staticStretch(W, L, A, E) {
  const delta = (W * L) / (A * E);
  return { delta, k: W / delta };
}

/** 1 + √(1 + 2h/δ_st). A zero drop returns 2. */
export function impactFactor(h, deltaSt) {
  const rise = Math.max(h, 0);
  return 1 + Math.sqrt(1 + (2 * rise) / deltaSt);
}

/**
 * Maximum stretch, force, and stress when W is dropped from h.
 * The energy balance and a velocity-Verlet integration of mÿ = W − ky
 * are the two methods. g = 9.81 is the integrator's only.
 */
export function impactDrop(W, L, A, E, h) {
  const st = staticStretch(W, L, A, E);
  const n = impactFactor(h, st.delta);
  const delta = n * st.delta;
  const force = n * W;
  const stored = W * (Math.max(h, 0) + delta);
  const energyGap = Math.abs(stored - 0.5 * st.k * delta * delta) / Math.max(stored, 1e-30);
  const ode = impactPeak(W, st.k, h);
  const odeGap = Math.abs(ode - delta) / Math.max(delta, 1e-30);
  return {
    deltaSt: st.delta,
    k: st.k,
    n,
    delta,
    force,
    stress: force / A,
    gap: Math.max(energyGap, odeGap),
  };
}

/** Peak downward displacement from the contact point. y(0) = 0, v(0) = √(2gh). */
export function impactPeak(W, k, h) {
  const m = W / G_FALL;
  const v0 = Math.sqrt(2 * G_FALL * Math.max(h, 0));
  const omega2 = k / m;
  const steps = 20000;
  const dt = (2 * Math.PI / Math.sqrt(omega2)) / steps;
  let y = 0;
  let v = v0;
  let a = G_FALL - omega2 * y;
  let peak = 0;
  for (let i = 0; i < steps; i++) {
    const y0 = y;
    const vHalf = v + 0.5 * a * dt;
    y = y0 + vHalf * dt;
    const a2 = G_FALL - omega2 * y;
    v = vHalf + 0.5 * a2 * dt;
    a = a2;
    if (y > peak) peak = y;
    if (i > 2 && v < 0 && y0 > 0) {
      const t = v / (v - (v - a2 * dt));
      const crossed = y0 + (y - y0) * Math.min(Math.max(1 - t, 0), 1);
      if (crossed > peak) peak = crossed;
      break;
    }
  }
  return peak;
}

/**
 * Drop height that makes the maximum stress equal an allowable.
 * n = σA/W, then h = (δ_st/2) ((n−1)² − 1). Negative when even a sudden
 * application is already over the allowable.
 */
export function dropHeightForStress(W, L, A, E, stressAllow) {
  const st = staticStretch(W, L, A, E);
  const n = (stressAllow * A) / W;
  const h = (st.delta / 2) * ((n - 1) ** 2 - 1);
  return { deltaSt: st.delta, n, h, stress: stressAllow };
}

/**
 * The same impact in inches and pounds, for a stated area and modulus.
 * Area in in², E in psi, length in inches, load in lbf, drop in inches.
 * Returns psi and inches. Compared with impactDrop through convert.js.
 */
export function impactInches(loadLbf, lengthIn, areaIn2, ePsi, dropIn) {
  const delta = (loadLbf * lengthIn) / (areaIn2 * ePsi);
  const n = impactFactor(dropIn, delta);
  return {
    deltaIn: delta,
    n,
    forceLbf: n * loadLbf,
    stressPsi: (n * loadLbf) / areaIn2,
  };
}

/** SI impact against the inch path. Both must name the same spring. */
export function impactUnitGap(loadLbf, lengthIn, areaIn2, ePsi, dropIn) {
  const inch = impactInches(loadLbf, lengthIn, areaIn2, ePsi, dropIn);
  const si = impactDrop(
    loadLbf * N_PER_LBF,
    lengthIn * M_PER_IN,
    areaIn2 * M_PER_IN * M_PER_IN,
    ePsi * PA_PER_PSI,
    dropIn * M_PER_IN,
  );
  const stress = inch.stressPsi * PA_PER_PSI;
  const delta = inch.n * inch.deltaIn * M_PER_IN;
  return Math.max(
    Math.abs(si.n - inch.n) / inch.n,
    Math.abs(si.stress - stress) / stress,
    Math.abs(si.delta - delta) / delta,
  );
}
