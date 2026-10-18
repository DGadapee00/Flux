/**
 * Chapter 4: the first law for closed systems. Boundary work by closed form, checked against
 * Simpson's rule; energy balances with u from IAPWS-IF97 (water) or the NASA polynomials (air).
 */
import { J_PER_BTU, J_PER_FT_LBF, M_PER_FT, PA_PER_PSI } from '@flux/subjects/convert.js';
import {
  SAT_T_GRID, SUPERHEAT_P_GRID, SUPERHEAT_T_GRID, bracket, covered, fromC, gas, mixP, satP, satT, tableInterp, toC, waterTP, waterTv,
} from '@flux/subjects/thermo';
import { celsius, cite, kase, num, problem, range } from '../kit.js';

const AIR = gas('air');
const KPA = 1e3;
const KJ = 1e3;
const FT3 = M_PER_FT ** 3;
/** Foot-pounds-force in one Btu, from the exact definitions. */
const FT_LBF_PER_BTU = J_PER_BTU / J_PER_FT_LBF;
/** The scenario temperature the lab uses for a polytropic air expansion, K. */
const LAB_T1 = { isobaric: fromC(27), polytropic: fromC(327) };

/** ∫ f dx by Simpson's rule: the second method for boundary work and for ∫cv dT. */
function simpson(f, a, b, n = 400) {
  const h = (b - a) / n;
  let sum = f(a) + f(b);
  for (let i = 1; i < n; i++) sum += (i % 2 ? 4 : 2) * f(a + i * h);
  return (sum * h) / 3;
}

const satRowT = (T, key) => tableInterp((t) => satT(t)[key], SAT_T_GRID, T);

/** Table values for a rigid tank of water heated from (T1, x1) to T2, inside the dome. */
function tankFromTable($) {
  const v = satRowT($.T1, 'vf') + $.x1 * (satRowT($.T1, 'vg') - satRowT($.T1, 'vf'));
  const u1 = satRowT($.T1, 'uf') + $.x1 * satRowT($.T1, 'ufg');
  const x2 = (v - satRowT($.T2, 'vf')) / (satRowT($.T2, 'vg') - satRowT($.T2, 'vf'));
  const u2 = satRowT($.T2, 'uf') + x2 * satRowT($.T2, 'ufg');
  return { v, u1, x2, u2 };
}

function tankExact($) {
  const one = { ...satT($.T1) };
  const v = one.vf + $.x1 * (one.vg - one.vf);
  const u1 = one.uf + $.x1 * one.ufg;
  const two = waterTv($.T2, v);
  return { v, u1, two };
}

/** Steam heated at constant pressure in a piston–cylinder: state 1 a mixture, state 2 superheated. */
function steamPiston($) {
  const one = mixP($.p, $.x1);
  const two = waterTP($.T2, $.p);
  return { one, two, W: $.p * $.m * (two.v - one.v), Q: $.m * (two.h - one.h) };
}

/** The superheated row at this pressure (a grid pressure), interpolated in T. */
const shRow = ($, key) => tableInterp((T) => waterTP(T, $.p)[key], SUPERHEAT_T_GRID, $.T2);

const ch4 = [
  problem({
    id: 'u2.4.work-isobaric',
    title: 'Work at constant pressure',
    exam: 'u2',
    ch: '4',
    lab: 'piston',
    src: cite('boundary-work'),
    topics: ['boundary-work'],
    vars: {
      p: range(100, 1000, 25, 'kPa', KPA),
      V1: range(0.02, 0.5, 0.02, 'm³'),
      r: range(1.2, 3, 0.1, ''),
    },
    derive: ($) => ({ V2: $.V1 * $.r }),
    text: (T, $, sig) => String.raw`A gas in a piston–cylinder expands at a constant $${T.p}$ kPa from ${T.V1} m³ to $${sig($.V2)}$ m³. Find the boundary work done by the gas.`,
    parts: [num('W', ($) => $.p * ($.V2 - $.V1), 'kJ', { scale: KJ, tol: 0.005, label: 'boundary work' })],
    level: 1,
    hints: [
      'Boundary work is the area under the process line on a P–V diagram.',
      String.raw`At constant pressure that area is a rectangle: $W_b = P(V_2 - V_1)$. One kPa·m³ is one kJ.`,
    ],
    steps: ($, sig) => [
      String.raw`$W_b = P(V_2 - V_1) = ${sig($.p / KPA)} \times (${sig($.V2)} - ${sig($.V1)}) = ${sig(($.p * ($.V2 - $.V1)) / KJ)}$ kJ.`,
    ],
    second: ($) => ({ W: simpson(() => $.p, $.V1, $.V2) / KJ }),
    sim: {
      scenario: 'isobaric',
      setup(s, $) {
        s.p1 = $.p;
        s.T1 = LAB_T1.isobaric;
        s.m = ($.p * $.V1) / (AIR.R * s.T1);
        s.V2 = $.V2;
      },
      read: (c) => ({ W: c.W }),
    },
    cases: [kase(cite('boundary-work'), { p: 400, V1: 0.1, r: 2.5 }, { W: 60 })],
  }),

  problem({
    id: 'u2.4.work-isothermal',
    title: 'Isothermal compression of air',
    exam: 'u2',
    ch: '4',
    lab: 'piston',
    src: cite('boundary-work'),
    topics: ['boundary-work', 'first-law'],
    vars: {
      m: range(0.1, 3, 0.1, 'kg'),
      tC: celsius(0, 200, 10),
      p1: range(100, 400, 20, 'kPa', KPA),
      k: range(1.5, 4, 0.25, ''),
    },
    derive: ($) => ({ T: fromC($.tC), p2: $.p1 * $.k }),
    text: (T, $, sig) => String.raw`${T.m} kg of air at ${T.tC} °C is compressed slowly at constant temperature from $${T.p1}$ kPa to $${sig($.p2 / KPA)}$ kPa. Treat it as an ideal gas. Find the boundary work and the heat transfer, both with the sign convention "work done by the gas, heat added to the gas".`,
    parts: [
      num('W', ($) => $.m * AIR.R * $.T * Math.log($.p1 / $.p2), 'kJ', { scale: KJ, tol: 0.005, label: 'boundary work' }),
      num('Q', ($) => $.m * AIR.R * $.T * Math.log($.p1 / $.p2), 'kJ', { scale: KJ, tol: 0.005, label: 'heat transfer' }),
    ],
    level: 2,
    hints: [
      String.raw`At constant temperature an ideal gas keeps $PV$ constant along the path.`,
      String.raw`Integrate $P\,dV$ with $P = mRT/V$: $W_b = mRT\ln(V_2/V_1) = mRT\ln(P_1/P_2)$. A compression gives a negative $W_b$.`,
      String.raw`An ideal gas's $u$ depends on $T$ only, so $\Delta U = 0$ and the first law gives $Q = W_b$.`,
    ],
    steps: ($, sig) => {
      const W = $.m * AIR.R * $.T * Math.log($.p1 / $.p2);
      return [
        String.raw`$W_b = mRT\ln(P_1/P_2) = ${sig($.m)} \times ${sig(AIR.R / KJ)} \times ${sig($.T)} \times \ln(${sig($.p1 / KPA)}/${sig($.p2 / KPA)}) = ${sig(W / KJ)}$ kJ.`,
        String.raw`$\Delta U = 0$ at constant $T$, so $Q = W_b = ${sig(W / KJ)}$ kJ: heat leaves the gas.`,
      ];
    },
    second: ($) => {
      const V1 = ($.m * AIR.R * $.T) / $.p1;
      const V2 = ($.m * AIR.R * $.T) / $.p2;
      const W = simpson((V) => ($.p1 * V1) / V, V1, V2);
      return { W: W / KJ, Q: (W + $.m * (AIR.u($.T) - AIR.u($.T))) / KJ };
    },
    sim: {
      scenario: 'isothermal',
      setup(s, $) {
        s.p1 = $.p1;
        s.T1 = $.T;
        s.m = $.m;
        s.V2 = ($.m * AIR.R * $.T) / $.p2;
      },
      read: (c) => ({ W: c.W, Q: c.Q }),
    },
    cases: [kase(cite('boundary-work'), { m: 1, tC: 30, p1: 100, k: 3 }, { W: -95.60, Q: -95.60 })],
  }),

  problem({
    id: 'u2.4.work-polytropic',
    title: 'Polytropic expansion',
    exam: 'u2',
    ch: '4',
    lab: 'piston',
    src: cite('polytropic'),
    topics: ['boundary-work', 'polytropic'],
    vars: {
      p1: range(300, 1500, 50, 'kPa', KPA),
      V1: range(0.01, 0.2, 0.01, 'm³'),
      k: range(1.5, 4, 0.25, ''),
      n: range(1.15, 1.5, 0.05, ''),
    },
    derive: ($) => ({ p2: $.p1 / $.k, V2: $.V1 * $.k ** (1 / $.n) }),
    text: (T, $, sig) => String.raw`A gas expands in a piston–cylinder from $${T.p1}$ kPa and ${T.V1} m³ to $${sig($.p2 / KPA)}$ kPa, following $PV^{${T.n}} = \text{constant}$. Find the final volume and the boundary work.`,
    parts: [
      num('V2', ($) => $.V2, 'm³', { tol: 0.005, label: 'final volume' }),
      num('W', ($) => ($.p2 * $.V2 - $.p1 * $.V1) / (1 - $.n), 'kJ', { scale: KJ, tol: 0.005, label: 'boundary work' }),
    ],
    level: 2,
    hints: [
      String.raw`The process line is $PV^n = C$, so $P_1V_1^n$ and $P_2V_2^n$ are the same number.`,
      String.raw`$V_2 = V_1(P_1/P_2)^{1/n}$. Then integrate $P = C/V^n$: $W_b = \dfrac{P_2V_2 - P_1V_1}{1-n}$.`,
    ],
    steps: ($, sig) => [
      String.raw`$V_2 = V_1 (P_1/P_2)^{1/n} = ${sig($.V1)} \times ${sig($.k)}^{1/${sig($.n)}} = ${sig($.V2)}$ m³.`,
      String.raw`$W_b = \dfrac{P_2V_2 - P_1V_1}{1-n} = \dfrac{${sig($.p2 / KPA)}\times${sig($.V2)} - ${sig($.p1 / KPA)}\times${sig($.V1)}}{1-${sig($.n)}} = ${sig(($.p2 * $.V2 - $.p1 * $.V1) / (1 - $.n) / KJ)}$ kJ.`,
    ],
    second: ($) => {
      // V₂ by bisection on P(V) = P₂; W by Simpson's rule on P = P₁(V₁/V)ⁿ.
      let lo = $.V1;
      let hi = $.V1 * 10;
      for (let i = 0; i < 100; i++) {
        const mid = (lo + hi) / 2;
        if ($.p1 * ($.V1 / mid) ** $.n > $.p2) lo = mid;
        else hi = mid;
      }
      const V2 = (lo + hi) / 2;
      return { V2, W: simpson((V) => $.p1 * ($.V1 / V) ** $.n, $.V1, V2) / KJ };
    },
    sim: {
      scenario: 'polytropic',
      setup(s, $) {
        s.p1 = $.p1;
        s.T1 = LAB_T1.polytropic;
        s.m = ($.p1 * $.V1) / (AIR.R * s.T1);
        s.n = $.n;
        s.V2 = $.V2;
      },
      read: (c) => ({ V2: c.V2, W: c.W }),
    },
    cases: [kase(cite('polytropic'), { p1: 800, V1: 0.05, k: 4, n: 1.3 }, { V2: 0.1452, W: 36.51 })],
  }),

  problem({
    id: 'u2.4.tank-heat',
    title: 'Heating a rigid tank of wet steam',
    exam: 'u2',
    ch: '4',
    lab: 'phase',
    src: cite('first-law-closed'),
    topics: ['first-law', 'quality', 'tables'],
    vars: {
      m: range(1, 10, 0.5, 'kg'),
      tC1: celsius(41, 149, 2),
      x1: range(0.1, 0.6, 0.05, ''),
      dT: range(20, 100, 10, '°C'),
    },
    derive: ($) => ({ T1: fromC($.tC1), T2: fromC($.tC1 + $.dT), tC2: $.tC1 + $.dT }),
    valid: ($) => {
      const one = satT($.T1);
      const v = one.vf + $.x1 * (one.vg - one.vf);
      return v < 0.9 * satT($.T2).vg;
    },
    text: (T, $) => String.raw`A rigid tank holds ${T.m} kg of water at ${T.tC1} °C with quality ${T.x1}. It is heated until the temperature is ${$.tC2} °C. Find the quality at the end and the heat added.`,
    parts: [
      num('x2', ($) => tankExact($).two.x, '', { tol: 0.005, label: 'final quality', alt: ($) => tankFromTable($).x2 }),
      num('Q', ($) => $.m * (tankExact($).two.u - tankExact($).u1), 'kJ', {
        scale: KJ,
        tol: 0.005,
        label: 'heat added',
        alt: ($) => ($.m * (tankFromTable($).u2 - tankFromTable($).u1)) / KJ,
      }),
    ],
    level: 3,
    hints: [
      'The tank is rigid and closed: the mass and the volume stay fixed, so the specific volume does too.',
      String.raw`Find $v$ from state 1. At $T_2$, $x_2 = (v - v_f)/(v_g - v_f)$.`,
      String.raw`No boundary work is done, so $Q = m(u_2 - u_1)$ with $u = u_f + x\,u_{fg}$ at each state.`,
    ],
    steps: ($, sig) => {
      const e = tankExact($);
      return [
        String.raw`$v = v_f + x_1(v_g - v_f) = ${sig(e.v)}$ m³/kg, and $u_1 = ${sig(e.u1 / KJ)}$ kJ/kg.`,
        String.raw`At ${sig($.tC2)} °C, $x_2 = ${sig(e.two.x)}$ and $u_2 = ${sig(e.two.u / KJ)}$ kJ/kg.`,
        String.raw`$Q = m(u_2 - u_1) = ${sig($.m)} \times (${sig(e.two.u / KJ)} - ${sig(e.u1 / KJ)}) = ${sig(($.m * (e.two.u - e.u1)) / KJ)}$ kJ.`,
      ];
    },
    // Second route: u = h − Pv, so Q = m[(h₂ − h₁) − v(P₂ − P₁)].
    second: ($) => {
      const e = tankExact($);
      const one = satT($.T1);
      const h1 = one.hf + $.x1 * one.hfg;
      const x2 = (e.v - satT($.T2).vf) / (satT($.T2).vg - satT($.T2).vf);
      return { x2, Q: ($.m * (e.two.h - h1 - e.v * (e.two.p - one.p))) / KJ };
    },
    cases: [kase(cite('first-law-closed'), { m: 2, tC1: 101, x1: 0.1, dT: 40 }, { x2: 0.3270, Q: 1203 })],
  }),

  problem({
    id: 'u2.4.steam-piston',
    title: 'Steam heated at constant pressure',
    exam: 'u2',
    ch: '4',
    lab: 'piston',
    src: cite('first-law-closed'),
    topics: ['first-law', 'boundary-work', 'superheated'],
    vars: {
      p: range(200, 1000, 100, 'kPa', KPA),
      m: range(0.2, 2, 0.1, 'kg'),
      x1: range(0.1, 0.9, 0.1, ''),
      tC2: celsius(215, 395, 10),
    },
    derive: ($) => ({ T2: fromC($.tC2) }),
    valid: ($) => {
      const Ts = satP($.p).T;
      const [T0] = bracket(SUPERHEAT_T_GRID, $.T2);
      return $.T2 > Ts + 15 && T0 > Ts && covered($.T2, $.p) && SUPERHEAT_P_GRID.includes($.p);
    },
    text: (T) => String.raw`A piston–cylinder holds ${T.m} kg of water at $${T.p}$ kPa with quality ${T.x1}. It is heated at constant pressure to ${T.tC2} °C. Find the boundary work and the heat added.`,
    parts: [
      num('W', ($) => steamPiston($).W, 'kJ', {
        scale: KJ,
        tol: 0.005,
        label: 'boundary work',
        alt: ($) => ($.p * $.m * (shRow($, 'v') - mixP($.p, $.x1).v)) / KJ,
      }),
      num('Q', ($) => steamPiston($).Q, 'kJ', {
        scale: KJ,
        tol: 0.005,
        label: 'heat added',
        alt: ($) => ($.m * (shRow($, 'h') - mixP($.p, $.x1).h)) / KJ,
      }),
    ],
    level: 3,
    hints: [
      'At constant pressure the boundary work is P times the change in volume.',
      String.raw`State 1 is a mixture: $v_1 = v_f + x_1 v_{fg}$. State 2 is superheated: read $v_2$ and $h_2$ from the superheated table at this pressure.`,
      String.raw`$Q = \Delta U + W_b = m(u_2 - u_1) + Pm(v_2 - v_1) = m(h_2 - h_1)$ at constant pressure.`,
    ],
    steps: ($, sig) => {
      const s = steamPiston($);
      return [
        String.raw`$v_1 = ${sig(s.one.v)}$ m³/kg and $h_1 = ${sig(s.one.h / KJ)}$ kJ/kg; $v_2 = ${sig(s.two.v)}$ m³/kg and $h_2 = ${sig(s.two.h / KJ)}$ kJ/kg.`,
        String.raw`$W_b = Pm(v_2 - v_1) = ${sig($.p / KPA)} \times ${sig($.m)} \times (${sig(s.two.v)} - ${sig(s.one.v)}) = ${sig(s.W / KJ)}$ kJ.`,
        String.raw`$Q = m(h_2 - h_1) = ${sig($.m)} \times (${sig(s.two.h / KJ)} - ${sig(s.one.h / KJ)}) = ${sig(s.Q / KJ)}$ kJ.`,
      ];
    },
    // Second route: Q from ΔU + W, with u instead of h.
    second: ($) => {
      const s = steamPiston($);
      return { W: simpson(() => $.p, $.m * s.one.v, $.m * s.two.v) / KJ, Q: ($.m * (s.two.u - s.one.u) + s.W) / KJ };
    },
    sim: {
      scenario: 'steam',
      setup(s, $) {
        s.p1 = $.p;
        s.x1 = $.x1;
        s.m = $.m;
        s.V2 = $.m * waterTP($.T2, $.p).v;
      },
      read: (c) => ({ W: c.W, Q: c.Q }),
    },
    cases: [kase(cite('first-law-closed'), { p: 500, m: 1, x1: 0.4, tC2: 275 }, { W: 174.0, Q: 1530 })],
  }),

  problem({
    id: 'u2.4.air-heat',
    title: 'Heating air in a rigid tank',
    exam: 'u2',
    ch: '4',
    lab: null,
    src: cite('specific-heats'),
    topics: ['first-law', 'specific-heats'],
    vars: {
      m: range(0.5, 5, 0.5, 'kg'),
      tC1: celsius(0, 100, 5),
      dT: range(100, 700, 50, '°C'),
    },
    derive: ($) => ({ T1: fromC($.tC1), T2: fromC($.tC1 + $.dT), tC2: $.tC1 + $.dT }),
    text: (T, $) => String.raw`A rigid tank holds ${T.m} kg of air at ${T.tC1} °C. It is heated to ${$.tC2} °C. Find the heat added, with $c_v$ varying with temperature.`,
    parts: [
      num('Q', ($) => $.m * (AIR.u($.T2) - AIR.u($.T1)), 'kJ', {
        scale: KJ,
        tol: 0.005,
        label: 'heat added',
        // The average-specific-heat method: c_v at the mean temperature, times ΔT.
        alt: ($) => ($.m * AIR.cv(($.T1 + $.T2) / 2) * ($.T2 - $.T1)) / KJ,
      }),
    ],
    level: 2,
    hints: [
      'A rigid tank does no boundary work, so all the heat goes into internal energy.',
      String.raw`$Q = m(u_2 - u_1)$. For an ideal gas $u$ depends on $T$ only; read it from the ideal-gas table, or use $c_v$ at the average temperature.`,
    ],
    steps: ($, sig) => [
      String.raw`$u_1 - u(298.15\ \mathrm{K})$ and $u_2 - u(298.15\ \mathrm{K})$ from the NASA polynomials give $\Delta u = ${sig((AIR.u($.T2) - AIR.u($.T1)) / KJ)}$ kJ/kg.`,
      String.raw`$Q = m\,\Delta u = ${sig($.m)} \times ${sig((AIR.u($.T2) - AIR.u($.T1)) / KJ)} = ${sig(($.m * (AIR.u($.T2) - AIR.u($.T1))) / KJ)}$ kJ.`,
      String.raw`With $c_v$ at the average temperature, $${sig(AIR.cv(($.T1 + $.T2) / 2) / KJ)}$ kJ/(kg·K), the estimate is $${sig(($.m * AIR.cv(($.T1 + $.T2) / 2) * ($.T2 - $.T1)) / KJ)}$ kJ. Both are accepted.`,
    ],
    second: ($) => ({ Q: ($.m * simpson((T) => AIR.cv(T), $.T1, $.T2)) / KJ }),
    cases: [kase(cite('specific-heats'), { m: 2, tC1: 25, dT: 500 }, { Q: 756.4 })],
  }),

  problem({
    id: 'u2.4.work-english',
    title: 'Work at constant pressure, English units',
    exam: 'u2',
    ch: '4',
    lab: null,
    src: cite('boundary-work'),
    topics: ['boundary-work', 'english'],
    vars: {
      p: range(20, 200, 5, 'psia', PA_PER_PSI),
      V1: range(1, 20, 0.5, 'ft³', FT3),
      r: range(1.2, 3, 0.1, ''),
    },
    derive: ($) => ({ V2: $.V1 * $.r }),
    text: (T, $, sig) => String.raw`A gas expands at a constant ${T.p} psia from ${T.V1} ft³ to $${sig($.V2 / FT3)}$ ft³. Find the boundary work in Btu.`,
    parts: [num('W', ($) => $.p * ($.V2 - $.V1), 'Btu', { scale: J_PER_BTU, tol: 0.005, label: 'boundary work' })],
    level: 1,
    hints: [
      String.raw`At constant pressure the work is $P\,\Delta V$, whatever the units.`,
      String.raw`psia × 144 gives lbf/ft², so $P\,\Delta V$ comes out in ft·lbf. One Btu is 778.17 ft·lbf.`,
    ],
    steps: ($, sig) => {
      const ftlbf = ($.p / PA_PER_PSI) * 144 * (($.V2 - $.V1) / FT3);
      return [
        String.raw`$W_b = P\,\Delta V = ${sig(($.p / PA_PER_PSI) * 144)} \times ${sig(($.V2 - $.V1) / FT3)} = ${sig(ftlbf)}$ ft·lbf.`,
        String.raw`$W_b = ${sig(ftlbf)}/${sig(FT_LBF_PER_BTU)} = ${sig(ftlbf / FT_LBF_PER_BTU)}$ Btu.`,
      ];
    },
    // Second route: the whole calculation in English units.
    second: ($) => ({ W: (($.p / PA_PER_PSI) * 144 * (($.V2 - $.V1) / FT3)) / FT_LBF_PER_BTU }),
    cases: [kase(cite('boundary-work'), { p: 100, V1: 4, r: 2 }, { W: 74.03 })],
  }),
];

export default ch4;
