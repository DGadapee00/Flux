/**
 * Heat engines, refrigerators and the Brayton cycle.
 *
 * Temperatures are kelvin. Heat and work are in the same energy unit, and a specific quantity is
 * per kilogram. A cycle returns to its first state, so Δu = 0 and the first law is Q_net = W_net.
 * With the sign convention that heat into the device and work out of it are positive for an engine,
 * Q_H = Q_L + W when Q_H, Q_L and W are the positive magnitudes.
 *
 * The Carnot limit follows from a reversible cycle between two reservoirs: ∮ δQ/T = 0, so
 * Q_H/T_H = Q_L/T_L, and η = 1 − T_L/T_H. A refrigerator and a heat pump are the same device read
 * two ways, so COP_HP = Q_H/W = (Q_L + W)/W = COP_R + 1.
 *
 * The ideal-gas Carnot cycle is two isotherms and two isentropes. At constant temperature,
 * Δu = 0 and Δs = R ln(v2/v1), so q_H = R T_H ln(v2/v1). The isentropes share one pressure ratio
 * exp((s°(T_H) − s°(T_L))/R), so the cold isotherm has the same volume ratio and
 * q_L = R T_L ln(v2/v1). Then η = 1 − T_L/T_H with no assumption that c_p is constant.
 *
 * The cold-air Brayton cycle takes c_p constant, so the isentropic temperature ratio is
 * r_p^{(k−1)/k} and η = 1 − r_p^{(1−k)/k} = 1 − T1/T2. With c_p(T) from the NASA polynomials the
 * same four processes are integrated as Δh = h(T2) − h(T1), and the isentropic states come from
 * s°(T2) − s°(T1) = R ln(p2/p1).
 */
import { ThermoRangeError } from './if97.js';
import { gas as makeGas, isentropicT } from './idealgas.js';

function asGas(spec) {
  return spec && typeof spec.s0 === 'function' ? spec : makeGas(spec);
}

function requireTemps(TL, TH) {
  if (!(TL > 0 && TH > TL)) {
    throw new ThermoRangeError(`Carnot limits need 0 < T_L < T_H. Got T_L = ${TL} K and T_H = ${TH} K.`, 'outside');
  }
}

/** Thermal efficiency of a Carnot engine, W/Q_H. */
export function carnotEfficiency(TL, TH) {
  requireTemps(TL, TH);
  return 1 - TL / TH;
}

/** Coefficient of performance of a Carnot refrigerator, Q_L/W. */
export function copRefrigerator(TL, TH) {
  requireTemps(TL, TH);
  return TL / (TH - TL);
}

/** Coefficient of performance of a Carnot heat pump, Q_H/W. Equals the refrigerator COP plus one. */
export function copHeatPump(TL, TH) {
  requireTemps(TL, TH);
  return TH / (TH - TL);
}

/**
 * Clausius sum for one cycle, ∮ δQ/T, with heat into the device positive.
 * An engine takes Q_H at T_H and rejects Q_L at T_L. A refrigerator or heat pump does the opposite.
 * The sum is zero for a reversible cycle, negative for an irreversible one, and positive for a
 * cycle that cannot exist.
 */
export function clausiusSum({ kind, TH, TL, QH, QL }) {
  requireTemps(TL, TH);
  if (!(QH > 0 && QL > 0)) throw new ThermoRangeError('The Clausius sum needs positive heat transfers.', 'outside');
  if (kind !== 'engine' && kind !== 'refrigerator' && kind !== 'heatpump') {
    throw new ThermoRangeError(`A claim is an engine, a refrigerator or a heat pump, not "${kind}".`, 'outside');
  }
  return kind === 'engine' ? QH / TH - QL / TL : QL / TL - QH / TH;
}

/**
 * Call a claimed cyclic device reversible, irreversible or impossible.
 * QH, QL and W are positive magnitudes. The first law of a cycle requires QH = QL + W for every
 * kind, because the refrigerator's work is into the device and the engine's work is out of it.
 * `tol` is a relative tolerance on that balance and on a Clausius sum of zero.
 */
export function classifyClaim({ kind, TH, TL, QH, QL, W, tol = 1e-8 }) {
  requireTemps(TL, TH);
  if (!(QH > 0 && QL > 0 && W >= 0)) throw new ThermoRangeError('A claim needs positive Q_H and Q_L, and W ≥ 0.', 'outside');
  const scale = Math.max(QH, QL, W, 1);
  const firstLaw = Math.abs(QH - QL - W) <= tol * scale;
  const clausius = clausiusSum({ kind, TH, TL, QH, QL });
  const eta = W / QH;
  const copR = W > 0 ? QL / W : Infinity;
  const copHP = W > 0 ? QH / W : Infinity;
  const carnotEta = carnotEfficiency(TL, TH);
  const carnotCopR = copRefrigerator(TL, TH);
  const carnotCopHP = copHeatPump(TL, TH);
  let verdict = 'irreversible';
  if (!firstLaw || clausius > tol) verdict = 'impossible';
  else if (Math.abs(clausius) <= tol) verdict = 'reversible';
  return { verdict, firstLaw, clausius, eta, copR, copHP, carnotEta, carnotCopR, carnotCopHP };
}

/**
 * The same call made from the efficiency alone, once the first law has fixed Q_L = Q_H − W.
 * An engine is impossible when η > 1 − T_L/T_H, reversible on the limit, irreversible below it.
 * A refrigerator is impossible when COP_R > T_L/(T_H − T_L). This is the check a student does
 * with one formula; classifyClaim is the check with the Clausius sum. They agree when QH = QL + W.
 */
export function classifyByLimit({ kind, TH, TL, QH, QL, W, tol = 1e-8 }) {
  requireTemps(TL, TH);
  const scale = Math.max(QH, QL, W, 1);
  const firstLaw = Math.abs(QH - QL - W) <= tol * scale;
  if (!firstLaw || !(W >= 0)) return 'impossible';
  if (kind === 'engine') {
    const eta = W / QH;
    const limit = carnotEfficiency(TL, TH);
    if (eta > limit + tol) return 'impossible';
    if (Math.abs(eta - limit) <= tol) return 'reversible';
    return 'irreversible';
  }
  if (!(W > 0)) return 'impossible';
  const cop = kind === 'heatpump' ? QH / W : QL / W;
  const limit = kind === 'heatpump' ? copHeatPump(TL, TH) : copRefrigerator(TL, TH);
  if (cop > limit * (1 + tol) + tol) return 'impossible';
  if (Math.abs(cop - limit) <= tol * Math.max(1, limit)) return 'reversible';
  return 'irreversible';
}

function simpson(f, a, b, n) {
  const steps = n % 2 === 0 ? n : n + 1;
  const h = (b - a) / steps;
  let sum = f(a) + f(b);
  for (let i = 1; i < steps; i++) sum += (i % 2 ? 4 : 2) * f(a + i * h);
  return (sum * h) / 3;
}

/**
 * Ideal-gas Carnot cycle per kilogram. v1 and v2 are the specific volumes on the hot isotherm,
 * with v2 > v1 the expansion. Pressures and the cold volumes follow from pv = RT and from
 * s(T_H, p_hot) = s(T_L, p_cold).
 */
export function idealGasCarnot(spec, { TH, TL, v1, v2 }) {
  const g = asGas(spec);
  requireTemps(TL, TH);
  if (!(v2 > v1 && v1 > 0)) throw new ThermoRangeError('The hot isotherm expands: v2 > v1 > 0.', 'outside');
  if (TH > g.T_high || TL < g.T_low) {
    throw new ThermoRangeError(`Ideal-gas Carnot temperatures fall outside ${g.T_low} K to ${g.T_high} K.`, 'outside');
  }
  const R = g.R;
  const p1 = (R * TH) / v1;
  const p2 = (R * TH) / v2;
  // Along an isentrope, s°(T_H) − R ln(p_hot/p°) = s°(T_L) − R ln(p_cold/p°).
  const ratio = Math.exp((g.s0(TH) - g.s0(TL)) / R);
  const p3 = p2 / ratio;
  const p4 = p1 / ratio;
  const v3 = (R * TL) / p3;
  const v4 = (R * TL) / p4;
  const qH = R * TH * Math.log(v2 / v1);
  const qL = R * TL * Math.log(v2 / v1);
  const wNet = qH - qL;
  return { p1, p2, p3, p4, v1, v2, v3, v4, qH, qL, wNet, eta: wNet / qH };
}

/**
 * Net work of that cycle by integrating P dv around the four paths. The isotherms are R T ln(v2/v1).
 * On an isentrope, T at a given v is the temperature whose entropy equals the isotherm's, with
 * p = R T / v. This is the second method for idealGasCarnot: a path integral against q_H − q_L.
 */
export function carnotWorkIntegral(spec, args, n = 80) {
  const g = asGas(spec);
  const cyc = idealGasCarnot(g, args);
  const w12 = g.R * args.TH * Math.log(cyc.v2 / cyc.v1);
  const w34 = g.R * args.TL * Math.log(cyc.v4 / cyc.v3);
  const temperatureAt = (v, sTarget) => {
    let lo = g.T_low;
    let hi = g.T_high;
    for (let i = 0; i < 60; i++) {
      const mid = (lo + hi) / 2;
      const p = (g.R * mid) / v;
      if (g.s(mid, p) < sTarget) lo = mid;
      else hi = mid;
    }
    return (lo + hi) / 2;
  };
  const workIsen = (va, vb, sTarget) => simpson((v) => {
    const T = temperatureAt(v, sTarget);
    return (g.R * T) / v;
  }, va, vb, n);
  const sHot = g.s(args.TH, cyc.p2);
  const sCold = g.s(args.TL, cyc.p4);
  const w23 = workIsen(cyc.v2, cyc.v3, sHot);
  const w41 = workIsen(cyc.v4, cyc.v1, sCold);
  return { wNet: w12 + w23 + w34 + w41, w12, w23, w34, w41, cycle: cyc };
}

/** Cold-air-standard Brayton efficiency. k = c_p/c_v is constant, and r_p = p2/p1 > 1. */
export function braytonColdAir(rp, k) {
  if (!(rp > 1 && k > 1)) throw new ThermoRangeError('Brayton needs a pressure ratio above 1 and k > 1.', 'outside');
  return 1 - rp ** ((1 - k) / k);
}

/**
 * Brayton cycle with c_p(T), per kilogram. 1→2 isentropic compression, 2→3 isobaric heat addition,
 * 3→4 isentropic expansion, 4→1 isobaric heat rejection. q and w are positive magnitudes.
 */
export function brayton(spec, { T1, p1, rp, T3 }) {
  const g = asGas(spec);
  if (!(rp > 1 && p1 > 0)) throw new ThermoRangeError('Brayton needs p1 > 0 and a pressure ratio above 1.', 'outside');
  if (!(T1 > g.T_low && T3 < g.T_high)) {
    throw new ThermoRangeError(`Brayton temperatures fall outside ${g.T_low} K to ${g.T_high} K.`, 'outside');
  }
  const p2 = rp * p1;
  const T2 = isentropicT(g, T1, p1, p2);
  if (!(T3 > T2)) throw new ThermoRangeError('The turbine inlet must be hotter than the compressor exit.', 'outside');
  const T4 = isentropicT(g, T3, p2, p1);
  const qin = g.h(T3) - g.h(T2);
  const qout = g.h(T4) - g.h(T1);
  const wc = g.h(T2) - g.h(T1);
  const wt = g.h(T3) - g.h(T4);
  const wnet = wt - wc;
  return { T1, T2, T3, T4, p1, p2, qin, qout, wc, wt, wnet, eta: wnet / qin, bwr: wc / wt };
}

/** ∫ c_p dT between two temperatures: the second method for a Brayton heat transfer. */
export function heatByCp(spec, T1, T2, n = 200) {
  const g = asGas(spec);
  if (!(T1 > g.T_low && T1 < g.T_high && T2 > g.T_low && T2 < g.T_high)) {
    throw new ThermoRangeError(`c_p is fitted from ${g.T_low} K to ${g.T_high} K.`, 'outside');
  }
  return simpson((T) => g.cp(T), T1, T2, n);
}
