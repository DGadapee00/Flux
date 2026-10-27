/**
 * Chapter 6, continued: entropy. Ideal-gas and liquid changes, a steam isobar, isentropic
 * efficiency, and the entropy a wall generates. 16.050 posts no solutions, so every worked case
 * is a Flux computation, cited to Yan Ch 6 or to OpenStax, and checked a second way: ∫ dh/T,
 * ∫ c dT/T, the NASA entropy integral, and the same wall written in rankine and feet.
 */
import { J_PER_BTU, K_PER_R, M_PER_FT } from '@flux/subjects/convert.js';
import {
  compressionExit,
  expansionExit,
  fromC,
  fromF,
  gas,
  heatByCp,
  idealGasDeltaS,
  idealGasDeltaSIntegral,
  incompressibleDeltaS,
  incompressibleDeltaU,
  isentropicT,
  reservoirGeneration,
  tFromH,
  waterP,
  waterTP,
} from '@flux/subjects/thermo';
import { celsius, choice, cite, fahrenheit, kase, mc, num, problem, range } from '../kit.js';

const AIR = gas('air');
const KJ = 1e3;
const C_LIQUID = 4184;
const P_STEAM = 5e5;
const W_PER_BTUH = J_PER_BTU / 3600;

/** R in h·ft²·°F/Btu, as m²·K/W. The same factor as labs/wall.js. */
const rIpToSi = (rIp) => rIp * M_PER_FT ** 2 * K_PER_R * 3600 / J_PER_BTU;

const R_IP = { ceiling: 60, wall: 25, fill: 23, board: 20 };

/** True when every pair differs by more than 2%, so a trap cannot be graded as right or as another trap. */
function spread(values) {
  for (let i = 0; i < values.length; i++) {
    for (let j = i + 1; j < values.length; j++) {
      const scale = Math.max(Math.abs(values[i]), Math.abs(values[j]), 1e-6);
      if (Math.abs(values[i] - values[j]) <= 0.02 * scale) return false;
    }
  }
  return true;
}

function simpson(f, a, b, n = 40) {
  const steps = n % 2 === 0 ? n : n + 1;
  const h = (b - a) / steps;
  let sum = f(a) + f(b);
  for (let i = 1; i < steps; i++) sum += (i % 2 ? 4 : 2) * f(a + i * h);
  return (sum * h) / 3;
}

/** ∫ (∂h/∂T)_p dT/T. The second method for a steam isobar that stays in one region. */
function isobarIntegral(p, T1, T2) {
  const lo = Math.min(T1, T2);
  const hi = Math.max(T1, T2);
  const f = (T) => {
    const d = 0.25;
    return ((waterTP(T + d, p).h - waterTP(T - d, p).h) / (2 * d)) / T;
  };
  const mag = simpson(f, lo, hi);
  return T2 >= T1 ? mag : -mag;
}

function turbineAt(eta) {
  const one = waterTP(fromC(400), 3e6);
  const twoS = waterP(5e5, 's', one.s);
  const h2 = expansionExit(one.h, twoS.h, eta);
  const two = waterP(5e5, 'h', h2);
  return { w: one.h - h2, ws: one.h - twoS.h, sgen: two.s - one.s, s2: two.s };
}

const ch6entropy = [
  problem({
    id: 'u5.6.isobar',
    title: 'Heat and entropy along a steam isobar',
    exam: 'u5',
    ch: '6',
    lab: 'ts',
    src: cite('entropy'),
    topics: ['entropy-steam'],
    principles: ['entropy-balance'],
    variety: ['unknown'],
    level: 1,
    vars: {
      t1: celsius(180, 250, 10),
      t2: celsius(350, 500, 25),
    },
    derive: ($) => {
      const T1 = fromC($.t1);
      const T2 = fromC($.t2);
      const a = waterTP(T1, P_STEAM);
      const b = waterTP(T2, P_STEAM);
      const q = b.h - a.h;
      return {
        T1, T2, q, du: b.u - a.u, ds: b.s - a.s,
        liquidQ: C_LIQUID * (T2 - T1),
        byExit: q / T2,
        liquidS: C_LIQUID * Math.log(T2 / T1),
      };
    },
    valid: ($) => $.T2 >= $.T1 + 80 && spread([$.q, $.du, $.liquidQ]) && spread([$.ds, $.byExit, $.liquidS]),
    text: (T) => String.raw`Steam is heated at a constant 0.5 MPa from ${T.t1} °C to ${T.t2} °C. Both states are superheated. Find the heat added and the entropy change, per kilogram.`,
    parts: [
      num('q', ($) => $.q, 'kJ/kg', {
        scale: KJ,
        label: 'heat',
        traps: [
          [($) => $.du, 'That is the internal-energy change. At constant pressure the heat equals the enthalpy change, which also carries the flow work.'],
          [($) => $.liquidQ, 'That treats the steam as liquid water with c = 4.184 kJ/(kg·K). Superheated steam has a much smaller specific heat.'],
        ],
      }),
      num('ds', ($) => $.ds, 'J/(kg·K)', {
        label: 'entropy change',
        traps: [
          [($) => $.byExit, 'That divides the heat by the exit temperature alone. The entropy change is the integral of dh/T along the isobar, which the tables already contain.'],
          [($) => $.liquidS, 'That is c ln(T2/T1) with the liquid specific heat. The steam tables are the right source once the vapour is superheated.'],
        ],
      }),
    ],
    hints: [
      'At constant pressure the heat is the enthalpy change. The entropy change is a property, so the tables give it directly.',
      String.raw`Read $h$ and $s$ at each superheated state. Then $q = h_2 - h_1$ and $\Delta s = s_2 - s_1$.`,
    ],
    steps: ($, sig) => [
      String.raw`$q = h_2 - h_1 = ${sig($.q / KJ)}$ kJ/kg.`,
      String.raw`$\Delta s = s_2 - s_1 = ${sig($.ds)}$ J/(kg·K).`,
    ],
    second: ($) => {
      const a = waterTP($.T1, P_STEAM);
      const b = waterTP($.T2, P_STEAM);
      return {
        q: ((b.u - a.u) + P_STEAM * (b.v - a.v)) / KJ,
        ds: isobarIntegral(P_STEAM, $.T1, $.T2),
      };
    },
    sim: {
      scenario: 'heat',
      setup(s, $) {
        s.mode = 'isobar';
        s.p = P_STEAM;
        s.T1 = $.T1;
        s.T2 = $.T2;
      },
      read: (c) => ({ q: c.q, ds: c.ds }),
    },
    cases: [kase(cite('entropy'), { t1: 200, t2: 400 }, { q: 416.396, ds: 734.33 })],
  }),

  problem({
    id: 'u5.6.liquid',
    title: 'Entropy change of an incompressible liquid',
    exam: 'u5',
    ch: '6',
    lab: 'ts',
    src: cite('entropy'),
    topics: ['entropy-liquid'],
    principles: ['entropy-balance'],
    variety: ['model'],
    level: 1,
    vars: {
      t1: celsius(10, 40, 5),
      t2: celsius(55, 95, 5),
    },
    derive: ($) => {
      const T1 = fromC($.t1);
      const T2 = fromC($.t2);
      const q = incompressibleDeltaU(C_LIQUID, T1, T2);
      const ds = incompressibleDeltaS(C_LIQUID, T1, T2);
      return {
        T1, T2, q, ds,
        atCold: ds * T1,
        scaled: q * T1 / T2,
        celsius: C_LIQUID * Math.log($.t2 / $.t1),
        oneTemp: C_LIQUID * (T2 - T1) / T1,
      };
    },
    valid: ($) => $.T2 >= $.T1 + 30 && spread([$.q, $.atCold, $.scaled]) && spread([$.ds, $.celsius, $.oneTemp]),
    text: (T) => String.raw`Liquid water is modeled as incompressible with a constant specific heat of 4.184 kJ/(kg·K). It is heated at constant pressure from ${T.t1} °C to ${T.t2} °C. Find the heat and the entropy change, per kilogram.`,
    parts: [
      num('q', ($) => $.q, 'kJ/kg', {
        scale: KJ,
        label: 'heat',
        traps: [
          [($) => $.atCold, 'That multiplies the entropy change by the colder temperature. The heat is c times the temperature difference, not T times Δs, unless the temperature barely moves.'],
          [($) => $.scaled, 'That scales the heat by T1/T2. Nothing in the incompressible model does that. The heat is c(T2 − T1).'],
        ],
      }),
      num('ds', ($) => $.ds, 'J/(kg·K)', {
        label: 'entropy change',
        traps: [
          [($) => $.celsius, 'The logarithm was taken of the Celsius readings. Entropy uses the ratio of absolute temperatures.'],
          [($) => $.oneTemp, 'That is c(T2 − T1)/T1, the first term of the series for c ln(T2/T1). The liquid formula keeps the logarithm.'],
        ],
      }),
    ],
    hints: [
      'A constant specific heat makes the heat proportional to the temperature change. The entropy change uses the ratio of the absolute temperatures.',
      String.raw`$q = c(T_2 - T_1)$ and $\Delta s = c\ln(T_2/T_1)$, with both temperatures in kelvin.`,
    ],
    steps: ($, sig) => [
      String.raw`$q = 4.184\times (${sig($.T2)} - ${sig($.T1)}) = ${sig($.q / KJ)}$ kJ/kg.`,
      String.raw`$\Delta s = 4184\ln(${sig($.T2)}/${sig($.T1)}) = ${sig($.ds)}$ J/(kg·K).`,
    ],
    second: ($) => ({
      q: (C_LIQUID * ($.T2 - $.T1)) / KJ,
      ds: simpson((T) => C_LIQUID / T, $.T1, $.T2, 80),
    }),
    cases: [kase(cite('entropy'), { t1: 20, t2: 80 }, { q: 251.04, ds: 779.096 })],
  }),

  problem({
    id: 'u5.6.gas',
    title: 'Entropy change of air',
    exam: 'u5',
    ch: '6',
    lab: null,
    src: cite('ideal-gas-heat-capacities'),
    topics: ['entropy-gas'],
    principles: ['entropy-balance'],
    variety: ['representation'],
    level: 2,
    vars: {
      T1: range(280, 340, 10, 'K'),
      T2: range(450, 700, 25, 'K'),
      rp: range(1.5, 6, 0.5, ''),
    },
    derive: ($) => {
      const p1 = 1e5;
      const p2 = $.rp * p1;
      const ds = idealGasDeltaS(AIR, { T1: $.T1, p1, T2: $.T2, p2 });
      const noP = idealGasDeltaS(AIR, { T1: $.T1, p1, T2: $.T2, p2: p1 });
      const flipped = noP + AIR.R * Math.log(p2 / p1);
      return { p1, p2, ds, noP, flipped };
    },
    valid: ($) => spread([$.ds, $.noP, $.flipped]),
    text: (T) => String.raw`Air changes from ${T.T1} K and 100 kPa to ${T.T2} K and a pressure ${T.rp} times as high. Find the entropy change per kilogram. Use the variable specific heat of air.`,
    parts: [
      num('ds', ($) => $.ds, 'J/(kg·K)', {
        label: 'entropy change',
        traps: [
          [($) => $.noP, 'The temperature integral is only half of the change. A higher pressure lowers the entropy by R ln(p2/p1).'],
          [($) => $.flipped, 'The pressure term was added instead of subtracted. Compression makes that term negative.'],
        ],
      }),
    ],
    hints: [
      'An ideal-gas entropy change has a temperature piece and a pressure piece. They carry opposite signs when the gas is compressed and heated.',
      String.raw`$\Delta s = s^\circ(T_2) - s^\circ(T_1) - R\ln(p_2/p_1)$.`,
    ],
    steps: ($, sig) => [
      String.raw`The temperature part is ${sig($.noP)} J/(kg·K). The pressure part is $R\ln(${sig($.rp)}) = ${sig($.noP - $.ds)}$ J/(kg·K).`,
      String.raw`$\Delta s = ${sig($.noP)} - ${sig($.noP - $.ds)} = ${sig($.ds)}$ J/(kg·K).`,
    ],
    second: ($) => ({
      ds: idealGasDeltaSIntegral(AIR, { T1: $.T1, p1: $.p1, T2: $.T2, p2: $.p2 }),
    }),
    cases: [kase(cite('ideal-gas-heat-capacities'), { T1: 300, T2: 500, rp: 4 }, { ds: 119.878 })],
  }),

  problem({
    id: 'u5.6.turbine',
    title: 'Steam turbine with isentropic efficiency',
    exam: 'u5',
    ch: '6',
    lab: 'efficiency',
    src: cite('entropy'),
    topics: ['turbine-efficiency'],
    principles: ['isentropic-efficiency'],
    variety: ['unknown'],
    level: 2,
    vars: {
      eta: range(0.72, 0.92, 0.02, ''),
      m: range(2, 12, 1, 'kg/s'),
    },
    derive: ($) => {
      const st = turbineAt($.eta);
      return { ...st, power: $.m * st.w, powerS: $.m * st.ws, compressor: st.ws / $.eta };
    },
    valid: ($) => spread([$.w, $.ws, $.compressor]) && spread([$.power, $.w, $.powerS]) && spread([$.sgen, 0, $.s2]),
    text: (T) => String.raw`A steam turbine takes vapour at 3 MPa and 400 °C and exhausts at 500 kPa, still superheated. The isentropic efficiency is ${T.eta} and the mass flow is ${T.m} kg/s. Find the work per kilogram, the power, and the entropy generated per kilogram.`,
    parts: [
      num('w', ($) => $.w, 'kJ/kg', {
        scale: KJ,
        label: 'work',
        traps: [
          [($) => $.ws, 'That is the isentropic enthalpy drop. The real turbine delivers only the fraction η of it.'],
          [($) => $.compressor, 'That divides by η, which is the compressor formula. A turbine multiplies the isentropic drop by η.'],
        ],
      }),
      num('W', ($) => $.power, 'kW', {
        scale: KJ,
        label: 'power',
        traps: [
          [($) => $.w, 'That is the work of one kilogram. The power multiplies by the mass flow.'],
          [($) => $.powerS, 'The mass flow was applied to the isentropic work. Multiply the real work by the mass flow.'],
        ],
      }),
      num('sgen', ($) => $.sgen, 'J/(kg·K)', {
        label: 'entropy generation',
        traps: [
          [($) => 0, 'Zero generation belongs to the isentropic turbine. This one has an efficiency below 1, so the exit entropy is higher than the inlet entropy.'],
          [($) => $.s2, 'That is the exit entropy itself. Generation is the rise from the inlet, s2 − s1, and the device is adiabatic so no heat term is subtracted.'],
        ],
      }),
    ],
    hints: [
      'Find the isentropic exit at the exhaust pressure and the inlet entropy. The real enthalpy drop is the efficiency times that drop.',
      String.raw`$h_2 = h_1 - \eta(h_1 - h_{2s})$, then $w = h_1 - h_2$ and $s_\mathrm{gen} = s_2 - s_1$.`,
    ],
    steps: ($, sig) => [
      String.raw`$w = \eta(h_1 - h_{2s}) = ${sig($.w / KJ)}$ kJ/kg.`,
      String.raw`$\dot W = \dot m\, w = ${sig($.m)}\times ${sig($.w / KJ)} = ${sig($.power / KJ)}$ kW.`,
      String.raw`$s_\mathrm{gen} = s_2 - s_1 = ${sig($.sgen)}$ J/(kg·K).`,
    ],
    second: ($) => ({
      w: ($.eta * $.ws) / KJ,
      W: ($.m * $.eta * $.ws) / KJ,
      sgen: $.sgen,
    }),
    sim: {
      scenario: 'turbine',
      setup(s, $) { s.eta = $.eta; },
      read: (c) => ({ w: c.w, sgen: c.sgen }),
    },
    cases: [kase(cite('entropy'), { eta: 0.85, m: 5 }, { w: 373.027, W: 1865.13, sgen: 143.401 })],
  }),

  problem({
    id: 'u5.6.compressor',
    title: 'Air compressor and the entropy it generates',
    exam: 'u5',
    ch: '6',
    lab: 'efficiency',
    src: cite('adiabatic'),
    topics: ['compressor-efficiency'],
    principles: ['isentropic-efficiency'],
    variety: ['unknown'],
    level: 2,
    vars: {
      T1: range(280, 320, 5, 'K'),
      rp: range(4, 10, 1, ''),
      eta: range(0.72, 0.9, 0.02, ''),
    },
    derive: ($) => {
      const p1 = 1e5;
      const p2 = $.rp * p1;
      const T2s = isentropicT(AIR, $.T1, p1, p2);
      const h1 = AIR.h($.T1);
      const h2s = AIR.h(T2s);
      const h2 = compressionExit(h1, h2s, $.eta);
      const T2 = tFromH(AIR, h2);
      const w = h2 - h1;
      const ws = h2s - h1;
      const sgen = AIR.s(T2, p2) - AIR.s($.T1, p1);
      const noP = AIR.s(T2, p1) - AIR.s($.T1, p1);
      return { T2, w, ws, turbine: $.eta * (h1 - h2s), sgen, noP };
    },
    valid: ($) => $.T2 > 220 && $.T2 < 2000 && spread([$.w, $.ws, $.turbine]) && spread([$.sgen, 0, $.noP]),
    text: (T) => String.raw`An adiabatic air compressor takes air at ${T.T1} K and 100 kPa and delivers it at ${T.rp} times that pressure. The isentropic efficiency is ${T.eta}. Find the work input and the entropy generated, per kilogram.`,
    parts: [
      num('w', ($) => $.w, 'kJ/kg', {
        scale: KJ,
        label: 'work input',
        traps: [
          [($) => $.ws, 'That is the isentropic work. A real compressor needs more, so divide that rise by the efficiency.'],
          [($) => $.turbine, 'That multiplies a drop by η, which is the turbine formula. The compressor exit sits above the isentropic enthalpy.'],
        ],
      }),
      num('sgen', ($) => $.sgen, 'J/(kg·K)', {
        label: 'entropy generation',
        traps: [
          [($) => 0, 'The entropy change is zero only for the isentropic compressor. This efficiency is below 1.'],
          [($) => $.noP, 'That keeps the pressure out of the entropy change. The delivered air is at a higher pressure, and that term belongs in Δs.'],
        ],
      }),
    ],
    hints: [
      'The isentropic exit is the temperature that keeps s constant while the pressure rises. The real enthalpy rise is that rise divided by the efficiency.',
      String.raw`$h_2 = h_1 + (h_{2s} - h_1)/\eta$. Then $w = h_2 - h_1$ and $s_\mathrm{gen} = s_2 - s_1$.`,
    ],
    steps: ($, sig) => [
      String.raw`$w = (h_{2s} - h_1)/\eta = ${sig($.w / KJ)}$ kJ/kg.`,
      String.raw`$s_\mathrm{gen} = s(T_2, p_2) - s(T_1, p_1) = ${sig($.sgen)}$ J/(kg·K).`,
    ],
    second: ($) => ({
      w: heatByCp(AIR, $.T1, $.T2, 80) / KJ,
      sgen: idealGasDeltaSIntegral(AIR, { T1: $.T1, p1: 1e5, T2: $.T2, p2: $.rp * 1e5 }),
    }),
    sim: {
      scenario: 'compressor',
      setup(s, $) {
        s.T1 = $.T1;
        s.p1 = 1e5;
        s.p2 = $.rp * 1e5;
        s.eta = $.eta;
      },
      read: (c) => ({ w: c.w, sgen: c.sgen }),
    },
    cases: [kase(cite('adiabatic'), { T1: 290, rp: 8, eta: 0.8 }, { w: 295.009, sgen: 107.229 })],
  }),

  problem({
    id: 'u5.6.nozzle',
    title: 'Air nozzle with isentropic efficiency',
    exam: 'u5',
    ch: '6',
    lab: 'efficiency',
    src: cite('adiabatic'),
    topics: ['nozzle-efficiency'],
    principles: ['isentropic-efficiency'],
    variety: ['unknown'],
    level: 3,
    vars: {
      T1: range(360, 450, 10, 'K'),
      rp: range(3, 6, 0.5, ''),
      eta: range(0.78, 0.9, 0.02, ''),
    },
    derive: ($) => {
      const p2 = 1e5;
      const p1 = $.rp * p2;
      const T2s = isentropicT(AIR, $.T1, p1, p2);
      const h1 = AIR.h($.T1);
      const h2s = AIR.h(T2s);
      const h2 = expansionExit(h1, h2s, $.eta);
      const T2 = tFromH(AIR, h2);
      const drop = h1 - h2;
      const V = Math.sqrt(2 * drop);
      const Vs = Math.sqrt(2 * (h1 - h2s));
      const Vhalf = Math.sqrt(drop);
      const sgen = AIR.s(T2, p2) - AIR.s($.T1, p1);
      const noP = AIR.s(T2, p1) - AIR.s($.T1, p1);
      return { T2, V, Vs, Vhalf, sgen, noP, p1, p2 };
    },
    valid: ($) => $.T2 > 210 && spread([$.V, $.Vs, $.Vhalf]) && spread([$.sgen, 0, $.noP]),
    text: (T) => String.raw`Air enters a nozzle at ${T.T1} K. The inlet pressure is ${T.rp} times the exit pressure of 100 kPa, and the inlet speed is negligible. The nozzle efficiency is ${T.eta}. Find the exit speed and the entropy generated per kilogram.`,
    parts: [
      num('V', ($) => $.V, 'm/s', {
        label: 'exit speed',
        traps: [
          [($) => $.Vs, 'That uses the whole isentropic enthalpy drop. The real drop is only the fraction η of it.'],
          [($) => $.Vhalf, 'The energy balance is V²/2 = Δh when Δh is in J/kg. Leaving out the 2 under the square root is the same as taking the square root of the drop alone.'],
        ],
      }),
      num('sgen', ($) => $.sgen, 'J/(kg·K)', {
        label: 'entropy generation',
        traps: [
          [($) => 0, 'A reversible adiabatic nozzle would generate none. This efficiency is below 1, so the exit entropy is higher.'],
          [($) => $.noP, 'The temperature drop alone would lower the entropy. The pressure drop is what makes the generation come out positive, and it has to be included.'],
        ],
      }),
    ],
    hints: [
      'The isentropic exit sets the enthalpy that a perfect nozzle could reach. The real nozzle converts only η of that drop into kinetic energy.',
      String.raw`$h_2 = h_1 - \eta(h_1 - h_{2s})$ and $V_2 = \sqrt{2(h_1 - h_2)}$, with the enthalpy in J/kg.`,
    ],
    steps: ($, sig) => [
      String.raw`$V_2 = \sqrt{2(h_1 - h_2)} = ${sig($.V)}$ m/s.`,
      String.raw`$s_\mathrm{gen} = s_2 - s_1 = ${sig($.sgen)}$ J/(kg·K).`,
    ],
    second: ($) => ({
      V: Math.sqrt(2 * $.eta * ($.Vs ** 2 / 2)),
      sgen: idealGasDeltaSIntegral(AIR, { T1: $.T1, p1: $.p1, T2: $.T2, p2: $.p2 }),
    }),
    sim: {
      scenario: 'nozzle',
      setup(s, $) {
        s.T1 = $.T1;
        s.p1 = $.p1;
        s.p2 = $.p2;
        s.eta = $.eta;
      },
      read: (c) => ({ V: c.V2, sgen: c.sgen }),
    },
    cases: [kase(cite('adiabatic'), { T1: 400, rp: 5, eta: 0.92 }, { V: 522.291, sgen: 45.8556 })],
  }),

  problem({
    id: 'u5.6.wall',
    title: 'Entropy generated by heat through a wall',
    exam: 'u5',
    ch: '6',
    lab: 'wall',
    src: cite('entropy'),
    topics: ['lost-work'],
    principles: ['lost-work'],
    variety: ['configuration'],
    level: 2,
    vars: {
      layer: choice(
        ['ceiling', 'an attic ceiling, R-60'],
        ['wall', 'a wood-frame wall, R-20 plus R-5'],
        ['fill', 'a wood-frame wall, R-13 plus R-10'],
        ['board', 'a wood-frame wall, R-20 continuous'],
      ),
      tout: celsius(-8, 10, 1),
      area: range(20, 100, 10, 'm²'),
    },
    derive: ($) => {
      const Tin = fromC(21);
      const Tout = fromC($.tout);
      const rIp = R_IP[$.layer];
      const rSi = rIpToSi(rIp);
      const q = $.area * (Tin - Tout) / rSi;
      const sgen = reservoirGeneration(q, Tin, Tout);
      return {
        Tin, Tout, rIp, rSi, q, sgen, lost: Tin * sgen,
        qF: q * (9 / 5),
        qBare: (Tin - Tout) / rSi,
        sHot: q / Tin,
        sCold: q / Tout,
        lostCold: Tout * sgen,
      };
    },
    valid: ($) => $.Tin - $.Tout >= 10
      && spread([$.q, $.qF, $.qBare])
      && spread([$.sgen, $.sHot, $.sCold])
      && spread([$.lost, $.lostCold, $.sgen]),
    text: (T) => String.raw`A room at 21 °C loses heat through ${T.area} m² of ${T.layer}. Outdoors is ${T.tout} °C. The indoor temperature, the outdoor temperature and the area are assumed. The R-value is the DOE figure for climate zone 4 except marine. Find the heat loss, the entropy generation, and the work that generation makes unavailable against the room.`,
    parts: [
      num('q', ($) => $.q, 'W', {
        label: 'heat loss',
        traps: [
          [($) => $.qF, 'The temperature difference was stretched by 9/5, as if it had to become Fahrenheit before dividing by an SI resistance. R was already converted.'],
          [($) => $.qBare, 'That is the heat through one square metre. The loss multiplies by the area.'],
        ],
      }),
      num('sgen', ($) => $.sgen, 'W/K', {
        label: 'entropy generation',
        traps: [
          [($) => $.sHot, 'That is Q/T_H only, the entropy the room gives up. The outdoors receives Q/T_L, and the generation is the difference.'],
          [($) => $.sCold, 'That is Q/T_L only. Subtract Q/T_H. The generation is what is left.'],
        ],
      }),
      num('lost', ($) => $.lost, 'W', {
        label: 'lost work',
        traps: [
          [($) => $.lostCold, 'That multiplies by the outdoor temperature. The unavailable work is measured against the room the heat left, so the factor is the indoor temperature.'],
          [($) => $.sgen, 'That is the entropy generation in W/K, not the work. Multiply by the room temperature in kelvin.'],
        ],
      }),
    ],
    hints: [
      'Convert the R-value to SI, then the heat is the area times the temperature difference divided by that resistance.',
      String.raw`$\dot S_\mathrm{gen} = \dot Q(1/T_L - 1/T_H)$. The lost work against the room is $T_H \dot S_\mathrm{gen}$.`,
    ],
    steps: ($, sig) => [
      String.raw`$\dot Q = A(T_H - T_L)/R = ${sig($.q)}$ W.`,
      String.raw`$\dot S_\mathrm{gen} = ${sig($.q)}(1/${sig($.Tout)} - 1/${sig($.Tin)}) = ${sig($.sgen)}$ W/K.`,
      String.raw`$T_H\dot S_\mathrm{gen} = ${sig($.Tin)}\times ${sig($.sgen)} = ${sig($.lost)}$ W.`,
    ],
    second: ($) => {
      const areaFt = $.area / M_PER_FT ** 2;
      const dTf = ($.Tin - $.Tout) / K_PER_R;
      const q = (areaFt * dTf / $.rIp) * W_PER_BTUH;
      const tinR = $.Tin / K_PER_R;
      const toutR = $.Tout / K_PER_R;
      const sgen = q * (1 / (toutR * K_PER_R) - 1 / (tinR * K_PER_R));
      return { q, sgen, lost: $.Tin * sgen };
    },
    sim: {
      scenario: 'wall',
      setup(s, $) {
        s.layer = $.layer;
        s.Tin = $.Tin;
        s.Tout = $.Tout;
        s.area = $.area;
      },
      read: (c) => ({ q: c.q, sgen: c.sgen, lost: c.lost }),
    },
    cases: [kase(cite('entropy'), { layer: 'wall', tout: 0, area: 40 }, { q: 190.79, sgen: 0.0498659, lost: 14.6681 })],
  }),

  problem({
    id: 'u5.6.english',
    title: 'The same wall in feet and Fahrenheit',
    exam: 'u5',
    ch: '6',
    lab: 'wall',
    src: cite('entropy'),
    topics: ['english', 'lost-work'],
    principles: ['lost-work'],
    variety: ['representation'],
    level: 3,
    vars: {
      layer: choice(
        ['ceiling', 'R-60 attic ceiling'],
        ['wall', 'R-25 wood-frame wall'],
        ['fill', 'R-23 wood-frame wall'],
        ['board', 'R-20 continuous insulation'],
      ),
      tOut: fahrenheit(10, 50, 5),
      areaFt: range(200, 1200, 50, 'ft²'),
    },
    derive: ($) => {
      const tIn = 70;
      const Tin = fromF(tIn);
      const Tout = fromF($.tOut);
      const rIp = R_IP[$.layer];
      const area = $.areaFt * M_PER_FT ** 2;
      const q = area * (Tin - Tout) / rIpToSi(rIp);
      const sgen = reservoirGeneration(q, Tin, Tout);
      const Q = q / W_PER_BTUH;
      const S = sgen * K_PER_R / W_PER_BTUH;
      const flux = (tIn - $.tOut) / rIp;
      const mixed = $.areaFt * (Tin - Tout) / rIp;
      const Sfahr = Q * (1 / $.tOut - 1 / tIn);
      const Scold = Q / ($.tOut + 459.67);
      return { tIn, Tin, Tout, rIp, q, sgen, Q, S, flux, mixed, Sfahr, Scold };
    },
    valid: ($) => spread([$.Q, $.flux, $.mixed]) && spread([$.S, $.Sfahr, $.Scold]),
    text: (T) => String.raw`A room at 70 °F loses heat through ${T.areaFt} ft² of ${T.layer}. Outdoors is ${T.tOut} °F. Find the heat loss and the entropy generation. Keep the R-value in h·ft²·°F/Btu and the temperatures in rankine when you form the generation.`,
    parts: [
      num('Q', ($) => $.q, 'Btu/h', {
        scale: W_PER_BTUH,
        label: 'heat loss',
        traps: [
          [($) => $.flux * W_PER_BTUH, 'That is the heat per square foot. Multiply by the area.'],
          [($) => $.mixed * W_PER_BTUH, 'The temperature difference was left in kelvin while the area stayed in square feet. Use Fahrenheit with the IP R-value, or convert every factor.'],
        ],
      }),
      num('Sgen', ($) => $.sgen, 'Btu/(h·R)', {
        scale: W_PER_BTUH / K_PER_R,
        label: 'entropy generation',
        traps: [
          [($) => $.Sfahr * (W_PER_BTUH / K_PER_R), 'The reciprocals used Fahrenheit. Absolute temperature here is rankine, which is Fahrenheit plus 459.67.'],
          [($) => $.Scold * (W_PER_BTUH / K_PER_R), 'That is the entropy drop of the cold air alone. Subtract the entropy drop of the warm room.'],
        ],
      }),
    ],
    hints: [
      'The heat in Btu/h is the area in square feet times the Fahrenheit difference, divided by R. The generation then uses rankine.',
      String.raw`$\dot Q = A\Delta T/R$ and $\dot S_\mathrm{gen} = \dot Q(1/T_L - 1/T_H)$ with $T$ in rankine.`,
    ],
    steps: ($, sig) => [
      String.raw`$\dot Q = ${sig($.areaFt)}\times (${$.tIn} - ${sig($.tOut)})/${$.rIp} = ${sig($.Q)}$ Btu/h.`,
      String.raw`$\dot S_\mathrm{gen} = ${sig($.Q)}(1/${sig($.tOut + 459.67)} - 1/${sig($.tIn + 459.67)}) = ${sig($.S)}$ Btu/(h·R).`,
    ],
    second: ($) => {
      const Q = $.areaFt * ($.tIn - $.tOut) / $.rIp;
      const S = Q * (1 / ($.tOut + 459.67) - 1 / ($.tIn + 459.67));
      return { Q, Sgen: S };
    },
    sim: {
      scenario: 'ceiling',
      setup(s, $) {
        s.layer = $.layer;
        s.Tin = $.Tin;
        s.Tout = $.Tout;
        s.area = $.areaFt * M_PER_FT ** 2;
      },
      read: (c) => ({ Q: c.q, Sgen: c.sgen }),
    },
    cases: [kase(cite('entropy'), { layer: 'ceiling', tOut: 32, areaFt: 800 }, { Q: 506.667, Sgen: 0.073931 })],
  }),

  problem({
    id: 'u5.6.exit',
    title: 'Where the turbine exit sits',
    exam: 'u5',
    ch: '6',
    lab: 'ts',
    kind: 'conceptual',
    src: cite('entropy'),
    topics: ['turbine-efficiency'],
    principles: ['isentropic-efficiency'],
    variety: ['configuration'],
    level: 2,
    vars: {
      path: choice(
        ['super', 'exhausts at 500 kPa, still superheated, with the efficiency below'],
        ['wet', 'exhausts at 10 kPa, inside the dome, with the efficiency below'],
        ['isen', 'exhausts at 10 kPa on the isentrope'],
      ),
      tIn: celsius(370, 430, 10),
      eta: range(0.75, 0.9, 0.05, ''),
    },
    derive: ($) => ({ eta: $.path === 'isen' ? 1 : $.eta }),
    text: (T) => String.raw`Steam enters a turbine at 3 MPa and ${T.tIn} °C. The turbine ${T.path}. When the path names an efficiency, that efficiency is ${T.eta}. How does the actual exit compare with the isentropic exit at the same pressure?`,
    parts: [
      mc('call', [
        ['hotter', 'Hotter, and at a higher entropy', 'Both exits are superheated. The real turbine extracts less work, so it leaves hotter than the isentrope and to the right of it.'],
        ['sameT', 'The same temperature, and at a higher entropy', 'Both exits are in the dome at one pressure, so they share the saturation temperature. The real exit is drier, and its entropy is higher.'],
        ['sameS', 'The same temperature and the same entropy', 'The efficiency is 1, so the exit is the isentropic state. Nothing is generated.'],
      ], ($) => ($.path === 'super' ? 'hotter' : $.path === 'wet' ? 'sameT' : 'sameS'), { label: 'the exit' }),
    ],
    hints: [
      'Ask two questions. Is the efficiency 1? If not, is the exit pressure low enough to land in the dome?',
      'Inside the dome the temperature is fixed by the pressure. Outside it, a less efficient turbine leaves the steam hotter.',
    ],
    steps: ($) => [
      $.path === 'isen'
        ? 'The efficiency is 1, so the exit state is the isentropic exit.'
        : $.path === 'wet'
          ? 'The exhaust is in the dome, so the temperature matches the isentropic exit and the entropy does not.'
          : 'The exhaust is superheated, so a lower efficiency leaves the steam both hotter and at a higher entropy.',
    ],
    second: ($) => {
      const p2 = $.path === 'super' ? 5e5 : 10e3;
      const one = waterTP(fromC($.tIn), 3e6);
      const twoS = waterP(p2, 's', one.s);
      const h2 = expansionExit(one.h, twoS.h, $.eta);
      const two = waterP(p2, 'h', h2);
      const sgen = two.s - one.s;
      const call = sgen < 1 ? 'sameS' : Math.abs(two.T - twoS.T) < 0.5 ? 'sameT' : 'hotter';
      return { call };
    },
    sim: {
      scenario: 'real',
      setup(s, $) {
        s.mode = 'turbine';
        s.p = 3e6;
        s.T1 = fromC($.tIn);
        s.p2 = $.path === 'super' ? 5e5 : 10e3;
        s.eta = $.eta;
      },
      read: (c) => {
        if (c.sgen < 1) return { call: 'sameS' };
        if (Math.abs(c.T2 - c.T2s) < 0.5) return { call: 'sameT' };
        return { call: 'hotter' };
      },
    },
    cases: [
      kase(cite('entropy'), { path: 'super', tIn: 400, eta: 0.85 }, { call: 'hotter' }),
      kase(cite('entropy'), { path: 'wet', tIn: 400, eta: 0.85 }, { call: 'sameT' }),
      kase(cite('entropy'), { path: 'isen', tIn: 400, eta: 0.85 }, { call: 'sameS' }),
    ],
  }),

  problem({
    id: 'u5.6.sign',
    title: 'Sign of an ideal-gas entropy change',
    exam: 'u5',
    ch: '6',
    lab: null,
    kind: 'conceptual',
    src: cite('ideal-gas-heat-capacities'),
    topics: ['entropy-gas'],
    principles: ['entropy-balance'],
    variety: ['configuration'],
    level: 2,
    vars: {
      proc: choice(
        ['compress', 'compressed isothermally'],
        ['expand', 'expanded isothermally'],
        ['heat', 'heated at constant pressure'],
      ),
      T: range(280, 340, 10, 'K'),
      factor: range(2, 6, 0.5, ''),
    },
    text: (T) => String.raw`Air at ${T.T} K is ${T.proc}. A compression multiplies the pressure by ${T.factor}. An expansion divides it by ${T.factor}. The heating raises the temperature by 80 K. What is the sign of the entropy change?`,
    parts: [
      mc('sign', [
        ['negative', 'Negative', 'Isothermal compression raises the pressure, and the pressure term is the whole change. It lowers the entropy.'],
        ['positive', 'Positive', 'Isothermal expansion lowers the pressure, so the pressure term is positive. Isobaric heating raises the entropy through the temperature term.'],
        ['zero', 'Zero', 'Zero would need both the temperature change and the pressure change to vanish. None of these three processes does that.'],
      ], ($) => ($.proc === 'compress' ? 'negative' : 'positive'), { label: 'the entropy change' }),
    ],
    hints: [
      'Write the two terms. One follows the temperature. The other is minus R times the log of the pressure ratio.',
      'Heating at constant pressure has no pressure term. An isothermal pressure change has no temperature term.',
    ],
    steps: ($) => [
      $.proc === 'compress'
        ? String.raw`$\Delta s = -R\ln(${$.factor})$, which is negative.`
        : $.proc === 'expand'
          ? String.raw`$\Delta s = -R\ln(1/${$.factor}) = R\ln(${$.factor})$, which is positive.`
          : String.raw`$\Delta s = \int c_p\,dT/T$ from ${$.T} K to ${$.T + 80} K, which is positive.`,
    ],
    second: ($) => {
      const p1 = 1e5;
      const p2 = $.proc === 'compress' ? $.factor * p1 : $.proc === 'expand' ? p1 / $.factor : p1;
      const T2 = $.proc === 'heat' ? $.T + 80 : $.T;
      const ds = idealGasDeltaS(AIR, { T1: $.T, p1, T2, p2 });
      return { sign: ds < 0 ? 'negative' : 'positive' };
    },
    cases: [
      kase(cite('ideal-gas-heat-capacities'), { proc: 'compress', T: 300, factor: 4 }, { sign: 'negative' }),
      kase(cite('ideal-gas-heat-capacities'), { proc: 'heat', T: 300, factor: 4 }, { sign: 'positive' }),
    ],
  }),

  problem({
    id: 'u5.6.generation',
    title: 'What changes the entropy a wall generates',
    exam: 'u5',
    ch: '6',
    lab: 'wall',
    kind: 'conceptual',
    src: cite('second-law'),
    topics: ['lost-work'],
    principles: ['lost-work'],
    variety: ['configuration'],
    level: 1,
    vars: {
      move: choice(
        ['out', 'the outdoor air warms by 5 °C and stays colder than the room'],
        ['area', 'the area of the wall is doubled'],
        ['R', 'the R-value is doubled'],
      ),
      tout: celsius(-5, 10, 5),
      area: range(20, 80, 10, 'm²'),
    },
    text: (T) => String.raw`A room at 21 °C loses heat through ${T.area} m² of a wall with R-25. Outdoors is ${T.tout} °C. What happens to the entropy generation if ${T.move}?`,
    parts: [
      mc('call', [
        ['rises', 'It rises', 'Doubling the area doubles the heat at the same two temperatures, so the generation doubles.'],
        ['falls', 'It falls', 'A warmer outdoors shrinks both the heat and the gap 1/T_L − 1/T_H. A larger R shrinks the heat and leaves the temperatures alone. Either one lowers the generation.'],
        ['stays', 'It stays the same', 'The generation stays fixed only when the heat and both temperatures stay fixed. Each of these changes moves one of them.'],
      ], ($) => ($.move === 'area' ? 'rises' : 'falls'), { label: 'the entropy generation' }),
    ],
    hints: [
      'The generation is the heat times a function of the two absolute temperatures. See which of those a given change touches.',
      String.raw`$\dot S_\mathrm{gen} = \dot Q(1/T_L - 1/T_H)$ and $\dot Q = A\Delta T/R$.`,
    ],
    steps: ($) => [
      $.move === 'area'
        ? 'The area doubles, the temperatures do not move, and the generation doubles.'
        : $.move === 'R'
          ? 'Doubling R cuts the heat in half and leaves the temperatures alone, so the generation falls.'
          : 'Warming the outdoors cuts the heat and shrinks 1/T_L − 1/T_H, so the generation falls.',
    ],
    second: ($) => {
      const gen = (area, rIp, tC) => {
        const Tin = fromC(21);
        const Tout = fromC(tC);
        const q = area * (Tin - Tout) / rIpToSi(rIp);
        return reservoirGeneration(q, Tin, Tout);
      };
      const before = gen($.area, 25, $.tout);
      const after = $.move === 'area'
        ? gen($.area * 2, 25, $.tout)
        : $.move === 'R'
          ? gen($.area, 50, $.tout)
          : gen($.area, 25, $.tout + 5);
      return { call: after > before ? 'rises' : 'falls' };
    },
    sim: {
      scenario: 'wall',
      setup(s, $) {
        s.area = $.area;
        s.Tout = fromC($.tout);
        s.Tin = fromC(21);
      },
      read: () => ({}),
    },
    cases: [
      kase(cite('second-law'), { move: 'area', tout: 0, area: 40 }, { call: 'rises' }),
      kase(cite('second-law'), { move: 'out', tout: 0, area: 40 }, { call: 'falls' }),
    ],
  }),

  problem({
    id: 'u5.6.reversible',
    title: 'When an adiabatic device changes its entropy',
    exam: 'u5',
    ch: '6',
    lab: 'efficiency',
    kind: 'conceptual',
    src: cite('adiabatic'),
    topics: ['compressor-efficiency'],
    principles: ['isentropic-efficiency'],
    variety: ['configuration'],
    level: 1,
    vars: {
      device: choice(
        ['rev-c', 'a reversible adiabatic compressor'],
        ['real-c', 'an adiabatic compressor with efficiency 0.80'],
        ['rev-t', 'a reversible adiabatic turbine'],
        ['real-t', 'an adiabatic turbine with efficiency 0.80'],
      ),
      T1: range(280, 320, 10, 'K'),
      rp: range(3, 8, 0.5, ''),
    },
    valid: ($) => {
      try {
        const compressing = $.device.endsWith('c');
        const p1 = compressing ? 1e5 : $.rp * 1e5;
        const p2 = compressing ? $.rp * 1e5 : 1e5;
        const T2s = isentropicT(AIR, $.T1, p1, p2);
        return T2s > 201 && T2s < 2000;
      } catch {
        return false;
      }
    },
    text: (T) => String.raw`The device is ${T.device}. Air enters at ${T.T1} K. A compressor raises the pressure by a factor ${T.rp}. A turbine lowers it by that factor. What is the entropy change of the air?`,
    parts: [
      mc('ds', [
        ['zero', 'Zero', 'Reversible and adiabatic together mean isentropic. The entropy of the air does not change. An efficiency of 0.80 is not that device.'],
        ['positive', 'Positive', 'An efficiency below 1 puts the exit off the isentrope. For an adiabatic compressor or turbine the exit entropy is higher, not lower.'],
        ['negative', 'Negative', 'A turbine can leave the air colder and still at a higher entropy. Adiabatic does not mean the entropy falls.'],
      ], ($) => ($.device.startsWith('rev') ? 'zero' : 'positive'), { label: 'the entropy change' }),
    ],
    hints: [
      'Split the description into the two words that matter: adiabatic, and reversible or not.',
      'Adiabatic removes the heat term. Reversible removes the generation. Anything short of reversible generates entropy.',
    ],
    steps: ($) => [
      $.device.startsWith('rev')
        ? 'Reversible and adiabatic means s2 = s1. The entropy change is zero.'
        : 'The efficiency is 0.80, so the exit is not the isentropic state and the entropy of the air rises.',
    ],
    second: ($) => {
      const compressing = $.device.endsWith('c');
      const eta = $.device.startsWith('rev') ? 1 : 0.8;
      const p1 = compressing ? 1e5 : $.rp * 1e5;
      const p2 = compressing ? $.rp * 1e5 : 1e5;
      const T2s = isentropicT(AIR, $.T1, p1, p2);
      const h1 = AIR.h($.T1);
      const h2s = AIR.h(T2s);
      const h2 = compressing ? compressionExit(h1, h2s, eta) : expansionExit(h1, h2s, eta);
      const T2 = tFromH(AIR, h2);
      const ds = AIR.s(T2, p2) - AIR.s($.T1, p1);
      return { ds: Math.abs(ds) < 0.05 ? 'zero' : 'positive' };
    },
    cases: [
      kase(cite('adiabatic'), { device: 'rev-c', T1: 300, rp: 4 }, { ds: 'zero' }),
      kase(cite('adiabatic'), { device: 'real-t', T1: 300, rp: 4 }, { ds: 'positive' }),
    ],
  }),
];

export default ch6entropy;
