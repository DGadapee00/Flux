/**
 * Self-test: each result checked against a published standard or a second, independent method.
 *
 *   node src/thermo/selftest.js
 *
 * IF97: the release's own verification tables (Tables 5, 15, 35, 36); the saturation pressure two
 * ways (the region 4 equation, and the Gibbs-equality of regions 1 and 2); Clausius–Clapeyron;
 * cp against dh/dT; region 2 at low pressure against the NASA-7 ideal-gas H₂O, a different dataset.
 * NASA-7: NIST-JANAF values, cp against dh/dT, s° against ∫cp/T dT, continuity at T_mid,
 * NASA Glenn N₂, O₂ and Ar against JANAF down to 200 K, and CH₄ from GRI-Mech, NASA Glenn and JANAF.
 * Isentropic flow: NACA Report 1135 values and the inverse on both branches.
 */
import { R_WATER, psat, region1Raw, region2Raw, tsat } from './if97.js';
import { AIR, R_UNIVERSAL, cpMolar, gas, hMolar, isentropicT, molarMass, s0Molar } from './idealgas.js';
import { NASA7 } from './nasa7-data.js';
import { exitEnthalpy, exitVelocity, flowArea, idealGasNozzle, isentropicVdp, jouleThomsonWater, massFlow, mixing, steadyEnergy, tFromH, throttleByJouleThomson } from './flow.js';
import { brayton, braytonColdAir, carnotEfficiency, carnotWorkIntegral, classifyByLimit, classifyClaim, clausiusSum, copHeatPump, copRefrigerator, heatByCp, idealGasCarnot } from './cycles.js';
import { compressionEfficiency, compressionExit, expansionEfficiency, expansionExit, flowGeneration, idealGasDeltaS, idealGasDeltaSIntegral, incompressibleDeltaH, incompressibleDeltaS, lostWork, reservoirGeneration } from './entropy.js';
import { areaRatio, chokedMassFlux, densityRatio, machFromArea, pressureRatio, temperatureRatio } from './isentropic.js';
import { FACTORS, fromC, fromF } from './units.js';
import { G_STANDARD, closedEnergy, integratedBalance, manometerGauge, manometerResidual, seriesEfficiency } from './balances.js';
import { mixP, satP, satT, waterP, waterTP, waterTv } from './water.js';

let passed = 0;
let failed = 0;

function approx(a, b, tol, name) {
  const scale = b !== 0 ? Math.abs(b) : 1;
  const good = Number.isFinite(a) && Math.abs(a - b) <= tol * scale;
  if (good) {
    passed += 1;
    console.log(`  PASS  ${name}`);
  } else {
    failed += 1;
    console.log(`  FAIL  ${name}`);
    console.log(`        got ${a}  expected ${b}`);
  }
}
const ok = (c, name) => (c ? ((passed += 1), console.log(`  PASS  ${name}`)) : ((failed += 1), console.log(`  FAIL  ${name}`)));

// ---------- IF97 verification tables (the release's printed values, 9 significant figures) ----------

console.log('IF97 region 1, Table 5');
for (const [T, p, v, h, u, s, cp, w] of [
  [300, 3, 0.100215168e-2, 0.115331273e3, 0.112324818e3, 0.392294792, 0.417301218e1, 0.150773921e4],
  [300, 80, 0.971180894e-3, 0.184142828e3, 0.106448356e3, 0.368563852, 0.401008987e1, 0.163469054e4],
  [500, 3, 0.1202418e-2, 0.975542239e3, 0.971934985e3, 0.258041912e1, 0.465580682e1, 0.124071337e4],
]) {
  const r = region1Raw(T, p);
  const tag = `T = ${T} K, p = ${p} MPa`;
  approx(r.v, v, 5e-9, `v at ${tag}`);
  approx(r.h, h, 5e-9, `h at ${tag}`);
  approx(r.u, u, 5e-9, `u at ${tag}`);
  approx(r.s, s, 5e-9, `s at ${tag}`);
  approx(r.cp, cp, 5e-9, `cp at ${tag}`);
  approx(r.w, w, 5e-9, `w at ${tag}`);
}

console.log('IF97 region 2, Table 15');
for (const [T, p, v, h, u, s, cp, w] of [
  [300, 0.0035, 0.394913866e2, 0.254991145e4, 0.241169160e4, 0.852238967e1, 0.191300162e1, 0.427920172e3],
  [700, 0.0035, 0.923015898e2, 0.333568375e4, 0.301262819e4, 0.101749996e2, 0.208141274e1, 0.644289068e3],
  [700, 30, 0.542946619e-2, 0.263149474e4, 0.246861076e4, 0.517540298e1, 0.103505092e2, 0.480386523e3],
]) {
  const r = region2Raw(T, p);
  const tag = `T = ${T} K, p = ${p} MPa`;
  approx(r.v, v, 5e-9, `v at ${tag}`);
  approx(r.h, h, 5e-9, `h at ${tag}`);
  approx(r.u, u, 5e-9, `u at ${tag}`);
  approx(r.s, s, 5e-9, `s at ${tag}`);
  approx(r.cp, cp, 5e-9, `cp at ${tag}`);
  approx(r.w, w, 5e-9, `w at ${tag}`);
}

console.log('IF97 region 4, Tables 35 and 36');
for (const [T, p] of [[300, 0.353658941e-2], [500, 0.263889776e1], [600, 0.123443146e2]]) approx(psat(T), p, 5e-9, `p_sat(${T} K)`);
for (const [p, T] of [[0.1, 0.372755919e3], [1, 0.453035632e3], [10, 0.584149488e3]]) approx(tsat(p), T, 5e-9, `T_sat(${p} MPa)`);

// ---------- Saturation pressure, two ways ----------

console.log('Saturation: the region 4 equation against the Gibbs equality g_liquid = g_vapour');
// At saturation the Gibbs functions of the two phases are equal. Solve g1(T, p) = g2(T, p) for p
// with regions 1 and 2 alone, and compare with the region 4 equation. IF97 keeps these consistent
// to well under 0.01%.
let worstGibbs = 0;
for (let T = 275; T <= 620; T += 15) {
  const ps = psat(T);
  let lo = ps * 0.9;
  let hi = ps * 1.1;
  const dg = (p) => region1Raw(T, p).g - region2Raw(T, p).g; // > 0 below p_sat: the vapour is stable
  for (let i = 0; i < 100; i++) {
    const mid = (lo + hi) / 2;
    if (dg(mid) > 0) lo = mid;
    else hi = mid;
  }
  worstGibbs = Math.max(worstGibbs, Math.abs((lo + hi) / 2 / ps - 1));
}
approx(worstGibbs, 0, 1e-4, `p_sat from g1 = g2 matches the region 4 equation, 275–620 K (worst ${(worstGibbs * 100).toExponential(2)}%)`);

let worstTrip = 0;
for (let T = 273.15; T <= 647; T += 7.3) worstTrip = Math.max(worstTrip, Math.abs(tsat(psat(T)) - T));
approx(worstTrip, 0, 1e-6, `T_sat(p_sat(T)) returns T, 273.15–647 K (worst ${worstTrip.toExponential(2)} K)`);

console.log('Clausius–Clapeyron: dp_sat/dT = h_fg / (T v_fg)');
for (const T of [300, 373.15, 450, 550, 620]) {
  const dT = 1e-3;
  const slope = ((psat(T + dT) - psat(T - dT)) / (2 * dT)) * 1e6; // Pa/K
  const s = satT(T);
  approx(slope, s.hfg / (T * (s.vg - s.vf)), 2e-4, `at ${T} K`);
}

// ---------- Internal consistency of regions 1 and 2 ----------

console.log('cp = (∂h/∂T)_p, by central difference');
for (const [T, p, f] of [[320, 5, region1Raw], [550, 20, region1Raw], [400, 0.1, region2Raw], [700, 10, region2Raw], [1000, 50, region2Raw]]) {
  const dT = 1e-3;
  approx((f(T + dT, p).h - f(T - dT, p).h) / (2 * dT), f(T, p).cp, 1e-6, `${f === region1Raw ? 'region 1' : 'region 2'}, ${T} K, ${p} MPa`);
}

console.log('Region 2 at low pressure is the ideal gas: IF97 against NASA-7 H₂O, a separate dataset');
{
  const p = 1e-5; // MPa, 10 Pa
  const W = NASA7.H2O.W;
  for (const T of [400, 700, 1000]) {
    const r = region2Raw(T, p);
    approx((p * 1e6 * r.v) / (R_WATER * 1e3 * T), 1, 1e-5, `pv/RT = 1 at ${T} K`);
    approx(r.cp * 1e3, cpMolar('H2O', T) / W, 3e-3, `cp at ${T} K (IF97 ${r.cp.toFixed(4)} kJ/(kg·K))`);
  }
  const dhIF = (region2Raw(1000, p).h - region2Raw(400, p).h) * 1e3;
  const dhNasa = (hMolar('H2O', 1000) - hMolar('H2O', 400)) / W;
  approx(dhIF, dhNasa, 1e-3, 'h(1000 K) − h(400 K)');
  approx(R_WATER * 1e3, R_UNIVERSAL / W, 2e-5, 'R of water = R̄ / M');
}

// ---------- Water states: inverses agree with the forward functions ----------

console.log('Inverse states return the forward state');
for (const [T, p] of [[fromC(25), 5e6], [fromC(250), 1e6], [fromC(500), 10e6], [fromC(600), 30e6], [fromC(300), 30e6]]) {
  const s = waterTP(T, p);
  for (const key of ['h', 's', 'u']) approx(waterP(p, key, s[key]).T, T, 1e-9, `T from p and ${key}, ${(T - 273.15).toFixed(0)} °C, ${p / 1e6} MPa`);
  if (s.region === 2) approx(waterTv(T, s.v).p, p, 1e-9, `p from T and v, ${(T - 273.15).toFixed(0)} °C, ${p / 1e6} MPa`);
}
{
  const m = mixP(200e3, 0.37);
  approx(waterP(200e3, 'h', m.h).x, 0.37, 1e-12, 'quality from p and h');
  approx(waterP(200e3, 's', m.s).x, 0.37, 1e-12, 'quality from p and s');
  approx(waterTv(m.T, m.v).x, 0.37, 1e-12, 'quality from T and v');
  approx(satP(satT(fromC(150)).p).T, fromC(150), 1e-9, 'saturation by T and by p agree');
}

// ---------- NASA-7 ideal gases ----------

console.log('NASA-7 against NIST-JANAF (4th ed., 1998): cp, s° and h − h(298.15 K) at 298.15 K and 1000 K');
const JANAF = {
  N2: { 298.15: [29.124, 191.609, 0], 1000: [32.762, 228.17, 21.463] },
  O2: { 298.15: [29.376, 205.147, 0], 1000: [34.87, 243.578, 22.703] },
  CO2: { 298.15: [37.129, 213.795, 0], 1000: [54.36, 269.299, 33.397] },
  H2O: { 298.15: [33.59, 188.834, 0], 1000: [41.268, 232.738, 26] },
  CH4: { 298.15: [35.639, 186.251, 0] },
  AR: { 298.15: [20.786, 154.845, 0], 1000: [20.786, 179.963, 14.59] },
};
for (const [sp, rows] of Object.entries(JANAF)) {
  for (const [T, [cp, s, dh]] of Object.entries(rows)) {
    const t = Number(T);
    approx(cpMolar(sp, t), cp, 2.5e-3, `${sp} cp at ${T} K`);
    approx(s0Molar(sp, t), s, 1e-3, `${sp} s° at ${T} K`);
    if (dh) approx((hMolar(sp, t) - hMolar(sp, 298.15)) / 1e3, dh, 1e-3, `${sp} h − h(298.15) at ${T} K`);
  }
}
for (const [sp, dfH] of [['CO2', -393.522], ['H2O', -241.826]]) approx(hMolar(sp, 298.15) / 1e3, dfH, 1e-4, `${sp} ΔfH°`);

console.log('NASA-7 internal checks: cp = dh/dT, s°(T2) − s°(T1) = ∫cp/T dT, continuity at T_mid');
for (const sp of ['N2', 'O2', 'CO2', 'H2O', 'CH4', 'AR']) {
  for (const T of [400, 1500]) approx((hMolar(sp, T + 1e-3) - hMolar(sp, T - 1e-3)) / 2e-3, cpMolar(sp, T), 1e-7, `${sp} cp = dh/dT at ${T} K`);
  // Simpson's rule on cp/T from 400 K to 1500 K, across T_mid.
  const n = 2000;
  const a = 400;
  const b = 1500;
  const step = (b - a) / n;
  let integral = 0;
  for (let i = 0; i <= n; i++) {
    const T = a + i * step;
    integral += (i === 0 || i === n ? 1 : i % 2 ? 4 : 2) * (cpMolar(sp, T) / T);
  }
  integral *= step / 3;
  approx(s0Molar(sp, b) - s0Molar(sp, a), integral, 2e-5, `${sp} s° difference equals ∫cp/T dT, 400–1500 K`);
  const r = NASA7[sp];
  approx(hMolar(sp, r.T_mid - 1e-9), hMolar(sp, r.T_mid), 1e-6, `${sp} h is continuous at ${r.T_mid} K`);
}

console.log('CH₄: GRI-Mech against NASA Glenn, and both against NIST-JANAF');
{
  // GRI-Mech 3.0 and NASA Glenn (Gurvich 1991, CEA's database) agree to 0.25% up to 1000 K.
  for (const T of [300, 400, 500, 600, 800, 1000]) approx(cpMolar('CH4', T), cpMolar('glenn:CH4', T), 2.5e-3, `CH₄ cp at ${T} K, GRI against Glenn`);
  // JANAF's methane (Chase 1998) is lower: 52.221 J/(mol·K) at 600 K and 71.795 at 1000 K. It matches a
  // rigid-rotor harmonic oscillator (fundamentals 2917, 1534, 3019, 1306 cm⁻¹) to 0.01%, so it leaves
  // out the anharmonic terms the Gurvich data carries. GRI runs 0.98% and 2.54% above it.
  const MODES = [[2917, 1], [1534, 2], [3019, 3], [1306, 3]];
  const C2 = 1.438776877; // second radiation constant, cm·K
  const cpHO = (T) => R_UNIVERSAL * (4 + MODES.reduce((a, [nu, g]) => {
    const x = (C2 * nu) / T;
    return a + (g * x * x * Math.exp(x)) / (Math.exp(x) - 1) ** 2;
  }, 0));
  for (const [T, janaf, gap] of [[600, 52.221, 0.0098], [1000, 71.795, 0.0254]]) {
    approx(cpHO(T), janaf, 2e-4, `JANAF CH₄ cp at ${T} K is the harmonic-oscillator value`);
    approx(cpMolar('CH4', T) / janaf - 1, gap, 0.02, `GRI CH₄ cp at ${T} K is ${(gap * 100).toFixed(2)}% above JANAF`);
  }
}

console.log('NASA Glenn N₂, O₂ and Ar against NIST-JANAF at 200, 250 and 300 K');
{
  const JANAF_LOW = {
    N2: { 200: [29.107, 179.985, -2.857], 250: [29.111, 186.477, -1.402], 300: [29.125, 191.789, 0.054] },
    O2: { 200: [29.126, 193.485, -2.868], 250: [29.201, 199.99, -1.41], 300: [29.385, 205.329, 0.054] },
  };
  for (const [sp, rows] of Object.entries(JANAF_LOW)) {
    for (const [T, [cp, s, dh]] of Object.entries(rows)) {
      const t = Number(T);
      approx(cpMolar(`glenn:${sp}`, t), cp, 5e-4, `${sp} cp at ${T} K`);
      approx(s0Molar(`glenn:${sp}`, t), s, 1e-4, `${sp} s° at ${T} K`);
      // JANAF prints h − h(298.15) to 1 J/mol, so compare it to ±2 J/mol, not as a ratio.
      approx((hMolar(`glenn:${sp}`, t) - hMolar(`glenn:${sp}`, 298.15)) / 1e3 - dh, 0, 2e-3, `${sp} h − h(298.15) at ${T} K`);
    }
  }
  // Argon: cp = 5R/2 exactly, so s°(T) = s°(298.15) + (5R/2) ln(T/298.15) with JANAF's 154.845 J/(mol·K).
  for (const T of [200, 250, 300]) {
    approx(cpMolar('glenn:AR', T), 2.5 * R_UNIVERSAL, 1e-5, `Ar cp at ${T} K is 5R/2`);
    approx(s0Molar('glenn:AR', T), 154.845 + 2.5 * R_UNIVERSAL * Math.log(T / 298.15), 1e-4, `Ar s° at ${T} K`);
  }
}

console.log('Air, from 200 K');
{
  const air = gas('air');
  approx(molarMass('air') * 1e3, 28.965, 1e-4, 'molar mass, g/mol');
  approx(air.R, 287.05, 2e-4, 'R, J/(kg·K)');
  ok(air.T_low === 200, 'good from 200 K');
  // JANAF cp, mole-weighted over N₂, O₂ and Ar (20.786). CO₂ is 0.03% of the moles; its term uses
  // GRI's cp, checked against JANAF at 298.15 K above.
  for (const T of [200, 250, 300]) {
    const x = AIR;
    const janaf = { N2: { 200: 29.107, 250: 29.111, 300: 29.125 }, O2: { 200: 29.126, 250: 29.201, 300: 29.385 } };
    const cp = x['glenn:N2'] * janaf.N2[T] + x['glenn:O2'] * janaf.O2[T] + x['glenn:AR'] * 20.786 + x.CO2 * cpMolar('CO2', T);
    approx(air.cp(T) / 1e3, cp / (molarMass('air') * 1e3), 5e-4, `cp at ${T} K from JANAF species values`);
  }
  approx(air.gamma(300), 1.4, 2e-3, 'γ at 300 K');
  approx(air.hSensible(298.15), 0, 1e-12, 'sensible enthalpy is zero at 298.15 K');
}

console.log('Variable-cp isentropic temperature');
{
  // Argon's cp is constant, so T2/T1 = (p2/p1)^(R/cp) = (p2/p1)^(2/5) exactly.
  approx(isentropicT('AR', 300, 1e5, 8e5), 300 * 8 ** 0.4, 1e-9, 'argon compressed 8:1 from 300 K');
  // For air, the entropy change of the end state is zero by construction; check it with s(T, p).
  const air = gas('air');
  const T2 = isentropicT('air', 300, 100e3, 1e6);
  approx(air.s(T2, 1e6), air.s(300, 100e3), 1e-10, `air 10:1 from 300 K reaches ${T2.toFixed(2)} K with no entropy change`);
}

// ---------- Isentropic flow, NACA Report 1135 ----------

console.log('Isentropic flow, γ = 1.4, against NACA Report 1135');
for (const [M, T, p, rho, A] of [
  [0.5, 0.9524, 0.843, 0.8852, 1.34],
  [1, 0.8333, 0.5283, 0.6339, 1],
  [2, 0.5556, 0.1278, 0.2300, 1.688],
  [3, 0.3571, 0.02722, 0.07623, 4.235],
]) {
  approx(temperatureRatio(M), T, 6e-4, `T/T₀ at M = ${M}`);
  approx(pressureRatio(M), p, 6e-4, `p/p₀ at M = ${M}`);
  approx(densityRatio(M), rho, 6e-4, `ρ/ρ₀ at M = ${M}`);
  approx(areaRatio(M), A, 6e-4, `A/A* at M = ${M}`);
}
for (const M of [0.2, 0.7, 1.5, 3.2]) {
  const branch = M < 1 ? 'subsonic' : 'supersonic';
  approx(machFromArea(areaRatio(M), branch), M, 1e-10, `M from A/A* on the ${branch} branch, M = ${M}`);
}
{
  // ṁ/A* = ρ* a*, with ρ* and T* from the ratios at M = 1: a second route to the choked flux.
  const p0 = 1.7e6;
  const T0 = 3300;
  const R = 432;
  const g = 1.2;
  const Ts = T0 * temperatureRatio(1, g);
  const rhoS = (p0 / (R * T0)) * densityRatio(1, g);
  approx(chokedMassFlux(p0, T0, R, g), rhoS * Math.sqrt(g * R * Ts), 1e-12, 'choked mass flux = ρ* a*');
}

// ---------- Steady-flow control volumes ----------

console.log('Steady flow: mass and energy balances');
{
  const air = gas('air');
  // A drop of 5 kJ/kg in h is 100 m/s from rest: the factor of 1000 between kJ and J.
  approx(exitVelocity({ h1: 5000, h2: 0, V1: 0 }), 100, 1e-12, 'Δh = 5 kJ/kg from rest gives 100 m/s');
  approx(exitEnthalpy({ h1: 5000, V1: 0, V2: 100 }), 0, 1e-12, 'the exit enthalpy that goes with 100 m/s');
  approx(steadyEnergy({ h1: 5000, h2: 0, V1: 0, V2: 100 }), 0, 1e-12, 'q − w = 0 for that adiabatic nozzle');
  approx(massFlow(0.01, 50, 0.5), 1, 1e-12, 'ṁ = A V / v');
  approx(flowArea(1, 50, 0.5), 0.01, 1e-12, 'A = ṁ v / V');
  const mix = mixing([{ m: 2, h: 100e3 }, { m: 1, h: 400e3 }]);
  approx(mix.h, 200e3, 1e-12, 'mixing: ṁ-weighted enthalpy');
  approx(mix.m, 3, 1e-12, 'mixing: masses add');
  // Ideal gas: T from h by bisection against the polynomial, and h(T) back.
  for (const T of [250, 400, 900, 1800]) approx(tFromH(air, air.h(T)), T, 1e-9, `air: T from h round trip at ${T} K`);
  // An ideal nozzle: the energy balance against ∫ v dp along the isentrope (dh = v dp).
  for (const [T1, p1, V1, p2] of [[400, 600e3, 30, 300e3], [300, 200e3, 10, 100e3], [800, 1e6, 100, 400e3]]) {
    const n = idealGasNozzle(air, { T1, p1, V1, p2 });
    approx(isentropicVdp(air, { T1, p1, p2 }), n.h2 - n.h1, 1e-7, `air nozzle ${T1} K, ${p1 / 1e3} → ${p2 / 1e3} kPa: ∫v dp = Δh`);
    approx(n.V2 * n.V2 / 2 - V1 * V1 / 2, n.h1 - n.h2, 1e-12, 'air nozzle: ΔKE = −Δh');
  }
  // Throttling water: h₂ = h₁ against the Joule–Thomson coefficient integrated along the isenthalp.
  for (const [T1, p1, p2] of [[573.15, 2e6, 0.5e6], [473.15, 1e6, 0.2e6], [723.15, 5e6, 1e6]]) {
    const h1 = waterTP(T1, p1).h;
    const out = waterP(p2, 'h', h1);
    approx(throttleByJouleThomson(T1, p1, p2), out.T, 1e-6, `steam at ${T1 - 273.15} °C, ${p1 / 1e6} → ${p2 / 1e6} MPa: h₂ = h₁ and ∫μ dp agree on T₂`);
  }
  ok(jouleThomsonWater(573.15, 2e6) > 0, 'superheated steam cools when throttled (μ_JT > 0)');
}

// ---------- Units ----------

console.log('Units, from the exact definitions in convert.js');
approx(FACTORS['Btu/lbm'], 2326, 1e-12, '1 Btu/lbm = 2.326 kJ/kg exactly');
approx(FACTORS['Btu/(lbm·R)'], 4186.8, 1e-12, '1 Btu/(lbm·R) = 4.1868 kJ/(kg·K) exactly');
approx(FACTORS.psia, 6894.757293168361, 1e-12, '1 psia in Pa');
approx(FACTORS['ft³/lbm'], 0.028316846592 / 0.45359237, 1e-12, '1 ft³/lbm in m³/kg');
approx(fromF(32), 273.15, 1e-12, '32 °F = 273.15 K');
approx(fromF(212), 373.15, 1e-12, '212 °F = 373.15 K');

// ---------- Cycles: Carnot limits, the ideal-gas cycle, Brayton ----------

console.log('Carnot limits and claims');
{
  approx(carnotEfficiency(300, 600), 0.5, 1e-12, 'η = 1 − 300/600');
  approx(copRefrigerator(300, 600), 1, 1e-12, 'COP_R = 300/300');
  approx(copHeatPump(300, 600), 2, 1e-12, 'COP_HP = 600/300');
  approx(copHeatPump(300, 600) - copRefrigerator(300, 600), 1, 1e-12, 'COP_HP = COP_R + 1');
  // Doubling the temperature ratio's complement: T_L/T_H from 1/2 to 1/4 doubles nothing linear,
  // but Q_H doubles when the volume ratio is squared, because q_H ∝ ln(v2/v1).
  const hot = idealGasCarnot('air', { TH: 600, TL: 300, v1: 0.5, v2: 1 });
  const wider = idealGasCarnot('air', { TH: 600, TL: 300, v1: 0.5, v2: 2 });
  approx(wider.qH, 2 * hot.qH, 1e-12, 'squaring v2/v1 doubles ln and doubles q_H');
  approx(hot.eta, 0.5, 1e-12, 'ideal-gas Carnot efficiency is 1 − T_L/T_H');
  approx(hot.v3 / hot.v4, hot.v2 / hot.v1, 1e-12, 'the cold isotherm has the same volume ratio');
  const integrated = carnotWorkIntegral('air', { TH: 600, TL: 300, v1: 0.5, v2: 1 }, 40);
  approx(integrated.wNet, hot.wNet, 1e-4, '∮ P dv agrees with q_H − q_L');
  const rev = classifyClaim({ kind: 'engine', TH: 600, TL: 300, QH: 200, QL: 100, W: 100 });
  ok(rev.verdict === 'reversible' && Math.abs(rev.clausius) < 1e-12, 'QH/TH = QL/TL is reversible');
  const irr = classifyClaim({ kind: 'engine', TH: 600, TL: 300, QH: 200, QL: 120, W: 80 });
  ok(irr.verdict === 'irreversible' && irr.clausius < 0, 'a lower efficiency has a negative Clausius sum');
  const bad = classifyClaim({ kind: 'engine', TH: 600, TL: 300, QH: 200, QL: 80, W: 120 });
  ok(bad.verdict === 'impossible' && bad.clausius > 0, 'past the Carnot limit the Clausius sum is positive');
  const broken = classifyClaim({ kind: 'engine', TH: 600, TL: 300, QH: 200, QL: 50, W: 100 });
  ok(broken.verdict === 'impossible' && !broken.firstLaw, 'QH ≠ QL + W is impossible');
  ok(classifyByLimit({ kind: 'engine', TH: 600, TL: 300, QH: 200, QL: 120, W: 80 }) === 'irreversible', 'the efficiency test agrees with the Clausius sum');
  ok(classifyByLimit({ kind: 'refrigerator', TH: 600, TL: 300, QH: 200, QL: 120, W: 80 }) === 'impossible', 'COP_R = 1.5 beats the Carnot COP of 1');
  approx(clausiusSum({ kind: 'refrigerator', TH: 600, TL: 300, QH: 200, QL: 80 }), 80 / 300 - 200 / 600, 1e-12, 'a refrigerator reverses the heats in the sum');
}

console.log('Brayton');
{
  const k = 1.4;
  const rp = 8;
  const byRatio = 1 - rp ** ((1 - k) / k);
  const byTemps = 1 - 1 / rp ** ((k - 1) / k);
  approx(braytonColdAir(rp, k), byRatio, 1e-12, 'cold-air η = 1 − r_p^{(1−k)/k}');
  approx(braytonColdAir(rp, k), byTemps, 1e-12, 'the same η is 1 − T1/T2');
  const air = gas('air');
  const b = brayton(air, { T1: 300, p1: 1e5, rp: 8, T3: 1200 });
  approx(b.wnet, b.qin - b.qout, 1e-12, 'w_net = q_in − q_out');
  approx(b.wnet, b.wt - b.wc, 1e-12, 'w_net = w_t − w_c');
  approx(b.qin, heatByCp(air, b.T2, b.T3), 1e-6, 'q_in = ∫ c_p dT');
  approx(b.qout, heatByCp(air, b.T1, b.T4), 1e-6, 'q_out = ∫ c_p dT');
  ok(b.eta > 0 && b.eta < carnotEfficiency(300, 1200), 'a Brayton engine stays under the Carnot limit between T1 and T3');
  ok(b.T2 > 300 && b.T4 < 1200 && b.T4 > 300, 'compression heats the air and expansion cools it');
}

console.log('Entropy, efficiency and lost work');
{
  const air = gas('air');
  const ends = { T1: 300, p1: 1e5, T2: 500, p2: 4e5 };
  approx(idealGasDeltaS(air, ends), idealGasDeltaSIntegral(air, ends), 1e-6, 'Δs from s° against ∫ c_p dT/T − R ln(p2/p1)');
  const twice = { T1: 300, p1: 1e5, T2: 300, p2: 4e5 };
  const squared = { T1: 300, p1: 1e5, T2: 300, p2: 16e5 };
  approx(idealGasDeltaS(air, squared), 2 * idealGasDeltaS(air, twice), 1e-12, 'squaring the pressure ratio doubles Δs at constant T');
  const c = 4180;
  approx(incompressibleDeltaS(c, 300, 600), c * Math.log(2), 1e-12, 'Δs = c ln 2 when T doubles');
  approx(incompressibleDeltaS(2 * c, 300, 330), 2 * incompressibleDeltaS(c, 300, 330), 1e-12, 'doubling c doubles Δs');
  approx(incompressibleDeltaH(c, 300, 301, 0.001, 1e5, 2e5), c * 1 + 0.001 * 1e5, 1e-12, 'Δh = c ΔT + v Δp');
  approx(reservoirGeneration(1000, 600, 300), 1000 * (1 / 300 - 1 / 600), 1e-12, 'S_gen = Q (1/T_L − 1/T_H)');
  approx(reservoirGeneration(2000, 600, 300), 2 * reservoirGeneration(1000, 600, 300), 1e-12, 'doubling Q doubles S_gen');
  approx(lostWork(300, 2), 600, 1e-12, 'W_lost = T0 S_gen');
  const h1 = 3000e3;
  const h2s = 2200e3;
  const h2 = expansionExit(h1, h2s, 0.85);
  approx(expansionEfficiency(h1, h2, h2s), 0.85, 1e-12, 'turbine η round trip');
  approx(h2, h1 - 0.85 * (h1 - h2s), 1e-12, 'h2 = h1 − η (h1 − h2s)');
  const c2 = compressionExit(300e3, 500e3, 0.8);
  approx(compressionEfficiency(300e3, c2, 500e3), 0.8, 1e-12, 'compressor η round trip');
  approx(flowGeneration({ s1: 1, s2: 1.4 }), 0.4, 1e-12, 'adiabatic s_gen = s2 − s1');
  approx(flowGeneration({ s1: 1, s2: 1.4, q: 100, Tb: 500 }), 0.4 - 0.2, 1e-12, 's_gen = s2 − s1 − q/T_b');
  ok(reservoirGeneration(0, 600, 300) === 0, 'no heat, no entropy generated');
}

{
  const g = G_STANDARD;
  const water = [{ rho: 1000, drop: 0.2 }];
  approx(manometerGauge(water, g), 1000 * g * 0.2, 1e-12, 'one manometer leg is ρ g h');
  approx(manometerGauge([{ rho: 1000, drop: 0.4 }], g), 2 * manometerGauge(water, g), 1e-12, 'doubling the drop doubles the gauge pressure');
  const legs = [{ rho: 13545.854, drop: 0.04 }, { rho: 998, drop: -0.12 }];
  const gauge = manometerGauge(legs, g);
  approx(manometerResidual(gauge, legs, g), 0, 1e-12, 'walking a manometer backward returns to the open end');
  approx(gauge, 13545.854 * g * 0.04 - 998 * g * 0.12, 1e-12, 'a rising leg subtracts ρ g h');
  approx(closedEnergy({ Q: 22e3, W: -20e3 }), 42e3, 1e-12, 'ΔE = Q − W');
  approx(closedEnergy({ Q: 44e3, W: 0 }), 2 * closedEnergy({ Q: 22e3, W: 0 }), 1e-12, 'doubling the heat doubles the stored energy when W = 0');
  approx(integratedBalance({ Qdot: 220, Wdot: -200, t: 100 }), closedEnergy({ Q: 22e3, W: -20e3 }), 1e-12, 'a constant rate integrated over t matches Q − W');
  approx(seriesEfficiency([0.9, 0.8]), 0.72, 1e-12, 'efficiencies in series multiply');
  approx(seriesEfficiency([0.5, 0.8]), 0.5 * seriesEfficiency([1, 0.8]), 1e-12, 'halving one efficiency halves the product');
}

console.log(`\n${passed} passed, ${failed} failed`);
if (failed) process.exit(1);
