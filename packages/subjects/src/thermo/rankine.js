/**
 * A steam power plant: the ideal Rankine cycle, with or without reheat (EML 3101).
 *
 * Water is pumped from the condenser at 10 kPa (state 1, saturated liquid) to boiler pressure (2),
 * boiled and superheated to T₃ (3), expanded isentropically in the turbine to the condenser (4) and
 * condensed. With reheat, the steam is expanded to a quarter of boiler pressure, heated back to T₃,
 * and expanded again. Then
 *   η = [(turbine work) − (h₂ − h₁)] / (heat in),   w_pump ≈ v₁(p₂ − p₁).
 * Raising boiler pressure raises η, but the turbine exhaust gets wetter, and droplets erode the last
 * blades; reheat dries it again. Properties are IAPWS-IF97.
 *
 * The second method takes the heat rejected as T_sat(s₄ − s₁), since condensation happens at one
 * temperature, instead of h₄ − h₁, and computes η = 1 − q_out/q_in.
 */
import { satP, satT, waterP, waterTP } from './water.js';

export const PLANT = { pc: 10e3 };

export function rankineClosed({ pb, TC, reheat }) {
  const p2 = pb * 1e6;
  const T3 = TC + 273.15;
  const s1 = satP(PLANT.pc);
  const h1 = s1.hf;
  const v1 = s1.vf;
  const st2 = waterP(p2, 's', s1.sf);
  const h2 = st2.h;
  const st3 = waterTP(T3, p2);
  let wt;
  let qin = st3.h - h2;
  let st4;
  let x4;
  if (reheat === 'yes') {
    const prh = p2 / 4;
    const a = waterP(prh, 's', st3.s);
    const b = waterTP(T3, prh);
    st4 = waterP(PLANT.pc, 's', b.s);
    wt = st3.h - a.h + (b.h - st4.h);
    qin += b.h - a.h;
  } else {
    st4 = waterP(PLANT.pc, 's', st3.s);
    wt = st3.h - st4.h;
  }
  x4 = st4.x ?? 1;
  const wp = h2 - h1;
  const eta = (wt - wp) / qin;
  return { eta, wt, wp, wpApprox: v1 * (p2 - PLANT.pc), qin, x4, h1, h2, h3: st3.h, h4: st4.h, s1: s1.sf, s3: st3.s, s4: st4.s, Tc: s1.T, T3, qout: st4.h - h1 };
}

export function rankineChecked(state) {
  const cf = rankineClosed(state);
  const qout = cf.Tc * (cf.s4 - cf.s1);
  const etaNum = 1 - qout / cf.qin;
  return { ...cf, etaNum, gap: Math.abs(etaNum - cf.eta) };
}

/** The cycle on T–s as a polyline [s (kJ/kg·K), T (K)], and the dome for drawing. */
export function rankinePath({ pb, TC, reheat }) {
  const c = rankineClosed({ pb, TC, reheat });
  const p2 = pb * 1e6;
  const pts = [[c.s1, c.Tc]];
  const s2 = waterP(p2, 's', c.s1);
  pts.push([s2.s, s2.T]);
  const isobar = (p, Ta, Tb) => {
    const out = [];
    for (let i = 1; i <= 40; i++) {
      const T = Ta + ((Tb - Ta) * i) / 40;
      try {
        out.push([waterTP(T, p).s, T]);
      } catch {
        // Inside the dome or region 3: skip the point.
      }
    }
    return out;
  };
  let boil = isobar(p2, s2.T, c.T3);
  try {
    const sat = satP(p2);
    boil = [...boil.filter((q) => q[1] < sat.T), [sat.sf, sat.T], [sat.sg, sat.T], ...boil.filter((q) => q[1] > sat.T)];
  } catch {
    // Above the dome's top in regions 1 and 2: no flat part.
  }
  pts.push(...boil, [c.s3, c.T3]);
  if (reheat === 'yes') {
    const a = waterP(p2 / 4, 's', c.s3);
    pts.push([a.s, a.T], ...isobar(p2 / 4, a.T, c.T3));
  }
  pts.push([c.s4, c.Tc], [c.s1, c.Tc]);
  return pts.map(([s, T]) => [s / 1000, T]);
}

export function dome() {
  const left = [];
  const right = [];
  for (let T = 280; T <= 620; T += 5) {
    const s = satT(T);
    left.push([s.sf / 1000, T]);
    right.push([s.sg / 1000, T]);
  }
  return [...left, ...right.reverse()];
}
