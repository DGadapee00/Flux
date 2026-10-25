/**
 * Chapter 5: the first law for a control volume. Steady-flow devices (nozzle, diffuser, turbine,
 * compressor, throttle, mixing chamber, heat exchanger) and a water heater. Every numeric template
 * has a second method that avoids the first one's key step: ∫v dp for a nozzle, h = u + Pv for a
 * turbine, ∫c_p dT for a compressor or exchanger, Joule–Thomson integration for a throttle. Traps
 * name the slip that gives each wrong value.
 *
 * Yan's Chapter 5 is cited as a chapter (src/data/textbook.js). 16.050's lectures 8 and 9 cover
 * the same balances but print no solutions, so the worked cases here are our own computations.
 */
import { J_PER_BTU, KG_PER_LBM, M3_PER_GAL_US } from '@flux/subjects/convert.js';
import {
  fromC, fromF, gas, idealGasNozzle, isentropicVdp, integrateVdp, mixP, satP, tFromH, throttleByJouleThomson, toC, waterP, waterTP,
  covered,
} from '@flux/subjects/thermo';
import { celsius, choice, cite, fahrenheit, kase, mc, num, problem, range } from '../kit.js';

const AIR = gas('air');
const KPA = 1e3;
const MPA = 1e6;
const KJ = 1e3;
/** One gallon per minute, in m³/s. */
const GPM = M3_PER_GAL_US / 60;
/** The inlet area the nozzle lab uses, m². */
const A_LAB = 0.01;
/** Water-heater line pressure, the lab's assumption, Pa. */
const P_LINE = 400e3;

const rel = (a, b) => Math.abs(a - b) / Math.max(Math.abs(b), 1e-12);

function simpson(f, a, b, n = 400) {
  const h = (b - a) / n;
  let sum = f(a) + f(b);
  for (let i = 1; i < n; i++) sum += (i % 2 ? 4 : 2) * f(a + i * h);
  return (sum * h) / 3;
}

/** Steam isentropic nozzle: the exit state at p2, or null when the data does not reach it. */
function steamExit($) {
  try {
    const one = waterTP($.T1, $.p1);
    const two = waterP($.p2, 's', one.s);
    const V2sq = $.V1 * $.V1 + 2 * (one.h - two.h);
    if (!(V2sq > 0)) return null;
    return { one, two, V2: Math.sqrt(V2sq) };
  } catch {
    return null;
  }
}

/** Air nozzle or diffuser: the ideal exit state, or null when the stream would stop before p2. */
function airExit($) {
  try {
    const n = idealGasNozzle(AIR, { T1: $.T1, p1: $.p1, V1: $.V1, p2: $.p2 });
    return Number.isFinite(n.V2) ? n : null;
  } catch {
    return null;
  }
}

/** Air nozzle, second method: V₂ from −∫v dp along the isentrope, and T₂ from the exit enthalpy. */
function airSecond($) {
  const vdp = isentropicVdp(AIR, { T1: $.T1, p1: $.p1, p2: $.p2 });
  const V2 = Math.sqrt($.V1 * $.V1 - 2 * vdp);
  return { V2, T2: tFromH(AIR, AIR.h($.T1) - (V2 * V2 - $.V1 * $.V1) / 2) };
}

const ch5 = [
  // ---------------------------------------------------------------- mass flow
  problem({
    id: 'u3.5.mass-flow',
    title: 'Mass flow of air in a duct',
    exam: 'u3',
    ch: '5',
    lab: 'nozzle',
    src: cite('control-volume'),
    topics: ['control-volume', 'mass-flow'],
    variety: ['unknown'],
    vars: {
      p: range(100, 800, 25, 'kPa', KPA),
      tC: celsius(10, 200, 10),
      V: range(5, 60, 1, 'm/s'),
    },
    derive: ($) => ({ T: fromC($.tC) }),
    text: (T) => String.raw`Air at ${T.p} kPa and ${T.tC} °C flows at ${T.V} m/s through a duct whose cross-section is $100\ \mathrm{cm^2}$. Treat air as an ideal gas. Find the specific volume and the mass flow rate.`,
    parts: [
      num('v', ($) => (AIR.R * $.T) / $.p, 'm³/kg', {
        tol: 0.005,
        label: 'specific volume',
        traps: [[($) => (AIR.R * $.tC) / $.p, 'The ideal-gas law needs the absolute temperature. °C was used.']],
      }),
      num('mdot', ($) => (A_LAB * $.V * $.p) / (AIR.R * $.T), 'kg/s', {
        tol: 0.005,
        label: 'mass flow rate',
        traps: [
          [($) => A_LAB * $.V, 'A V is a volume flow, in m³/s. Divide it by the specific volume to get kg/s.'],
          [($) => (A_LAB * $.V * ($.p / KPA)) / (AIR.R * $.T), 'P in kPa with R in J/(kg·K): the units disagree by a factor of 1000.'],
        ],
      }),
    ],
    level: 1,
    hints: [
      'Mass flow is a volume flow divided by the specific volume. The specific volume comes from the ideal-gas law.',
      String.raw`$v = RT/P$ with $T$ in kelvin and $P$ in pascals. Then $\dot m = AV/v$.`,
    ],
    steps: ($, sig) => {
      const v = (AIR.R * $.T) / $.p;
      return [
        String.raw`$v = RT/P = ${sig(AIR.R / KJ)}\times ${sig($.T)} / ${sig($.p / KPA)} = ${sig(v)}$ m³/kg.`,
        String.raw`$\dot m = AV/v = ${sig(A_LAB)}\times ${sig($.V)}/${sig(v)} = ${sig((A_LAB * $.V) / v)}$ kg/s.`,
      ];
    },
    // Second route: density first, then ṁ = ρ A V.
    second: ($) => {
      const rho = $.p / (AIR.R * $.T);
      return { v: 1 / rho, mdot: rho * A_LAB * $.V };
    },
    sim: {
      scenario: 'subsonic',
      setup(s, $) {
        s.T1 = $.T;
        s.p1 = $.p;
        s.V1 = $.V;
        s.p2 = $.p * 0.9;
      },
      read: (c) => ({ mdot: c.mdot }),
    },
    cases: [kase(cite('control-volume'), { p: 600, tC: 127, V: 30 }, { v: 0.1914, mdot: 1.568 })],
  }),

  // ---------------------------------------------------------------- turbine
  problem({
    id: 'u3.5.turbine',
    title: 'Steam turbine power',
    exam: 'u3',
    ch: '5',
    lab: 'devices',
    src: cite('control-volume'),
    topics: ['control-volume', 'turbine'],
    variety: ['unknown'],
    vars: {
      m: range(1, 20, 0.5, 'kg/s'),
      p1: range(1, 8, 0.5, 'MPa', MPA),
      tC: celsius(350, 550, 25),
      p2: range(10, 100, 5, 'kPa', KPA),
      x2: range(0.85, 0.98, 0.01, ''),
    },
    derive: ($) => ({ T1: fromC($.tC) }),
    valid: ($) => covered($.T1, $.p1) && $.p1 / $.p2 > 10 && waterTP($.T1, $.p1).h > mixP($.p2, $.x2).h,
    text: (T) => String.raw`Steam at ${T.p1} MPa and ${T.tC} °C enters an adiabatic turbine at ${T.m} kg/s and leaves at ${T.p2} kPa with quality ${T.x2}. Neglect changes in kinetic and potential energy. Find the power output and the temperature of the exhaust.`,
    parts: [
      num('W', ($) => $.m * (waterTP($.T1, $.p1).h - mixP($.p2, $.x2).h), 'kW', {
        scale: KJ,
        tol: 0.005,
        label: 'power output',
        traps: [
          [($) => $.m * (waterTP($.T1, $.p1).u - mixP($.p2, $.x2).u), 'The flow work Pv enters and leaves with the steam: the balance uses h, not u.'],
          [($) => waterTP($.T1, $.p1).h - mixP($.p2, $.x2).h, 'That is the work per kilogram, in kJ/kg. Multiply by the mass flow rate for kW.'],
          [($) => -$.m * (waterTP($.T1, $.p1).h - mixP($.p2, $.x2).h), 'A turbine does work on the surroundings: with W out positive the answer is positive.'],
        ],
      }),
      num('T2', ($) => toC(mixP($.p2, $.x2).T), '°C', {
        tol: 0.002,
        label: 'exhaust temperature',
        traps: [[($) => $.tC, 'The exhaust is a saturated mixture, so its temperature is the saturation temperature at the exit pressure.']],
      }),
    ],
    level: 2,
    hints: [
      'Write the steady-flow energy balance for the turbine. It is adiabatic, and the kinetic and potential terms are neglected.',
      String.raw`$0 = \dot Q - \dot W + \dot m(h_1 - h_2)$ with $\dot Q = 0$, so $\dot W = \dot m(h_1 - h_2)$. Find $h_1$ from the superheat table.`,
      String.raw`State 2 is a saturated mixture at the exit pressure: $h_2 = h_f + x h_{fg}$, and its temperature is $T_{sat}(P_2)$.`,
    ],
    steps: ($, sig) => {
      const one = waterTP($.T1, $.p1);
      const two = mixP($.p2, $.x2);
      return [
        String.raw`$h_1 = ${sig(one.h / KJ)}$ kJ/kg (superheated steam at ${sig($.p1 / MPA)} MPa and ${sig($.tC)} °C).`,
        String.raw`$h_2 = h_f + x h_{fg} = ${sig(two.h / KJ)}$ kJ/kg, and $T_2 = T_{sat} = ${sig(toC(two.T))}$ °C.`,
        String.raw`$\dot W = \dot m (h_1 - h_2) = ${sig($.m)}\times ${sig((one.h - two.h) / KJ)} = ${sig(($.m * (one.h - two.h)) / KJ)}$ kW.`,
      ];
    },
    // Second route: the same balance with h written as u + Pv.
    second: ($) => {
      const one = waterTP($.T1, $.p1);
      const two = mixP($.p2, $.x2);
      return { W: ($.m * (one.u + $.p1 * one.v - (two.u + $.p2 * two.v))) / KJ, T2: toC(satP($.p2).T) };
    },
    sim: {
      scenario: 'turbine',
      setup(s, $) {
        s.m = $.m;
        s.p1 = $.p1;
        s.T1 = $.T1;
        s.p2 = $.p2;
        s.x2 = $.x2;
      },
      read: (c) => ({ W: c.W, T2: toC(c.T2) }),
    },
    cases: [kase(cite('control-volume'), { m: 2, p1: 3, tC: 400, p2: 10, x2: 0.9 }, { W: 1774, T2: 45.81 })],
  }),

  // ---------------------------------------------------------------- compressor
  problem({
    id: 'u3.5.compressor',
    title: 'Air compressor power',
    exam: 'u3',
    ch: '5',
    lab: 'devices',
    src: cite('control-volume'),
    topics: ['control-volume', 'compressor'],
    variety: ['unknown'],
    vars: {
      m: range(0.2, 5, 0.1, 'kg/s'),
      tC1: celsius(0, 60, 5),
      tC2: celsius(100, 300, 10),
    },
    derive: ($) => ({ T1: fromC($.tC1), T2: fromC($.tC2) }),
    text: (T) => String.raw`Air enters a compressor at ${T.tC1} °C and leaves at ${T.tC2} °C. The mass flow rate is ${T.m} kg/s. The compressor is adiabatic, and kinetic and potential energy do not change. Treat air as an ideal gas with temperature-dependent specific heats. Find the power input and the work per kilogram.`,
    parts: [
      num('w', ($) => AIR.h($.T2) - AIR.h($.T1), 'kJ/kg', {
        scale: KJ,
        tol: 0.005,
        label: 'work per kilogram',
        traps: [
          [($) => AIR.u($.T2) - AIR.u($.T1), 'That is Δu, the change in internal energy. A flow device uses Δh = Δu + Δ(Pv), which is c_p ΔT for air.'],
          [($) => AIR.cp($.T1) * ($.T2 - $.T1), 'c_p changes over this range. Use its value at the average temperature, or the tabulated enthalpies.'],
        ],
      }),
      num('W', ($) => $.m * (AIR.h($.T2) - AIR.h($.T1)), 'kW', {
        scale: KJ,
        tol: 0.005,
        label: 'power input',
        traps: [[($) => $.m * (AIR.u($.T2) - AIR.u($.T1)), 'That is m Δu. The flow work is part of what the compressor supplies: use Δh.']],
      }),
    ],
    level: 1,
    hints: [
      'Adiabatic, steady, no change in kinetic or potential energy: the shaft work is the whole enthalpy rise.',
      String.raw`$w_{in} = h_2 - h_1$ and $\dot W_{in} = \dot m\,w_{in}$. For an ideal gas $h$ depends on temperature only.`,
    ],
    steps: ($, sig) => {
      const w = AIR.h($.T2) - AIR.h($.T1);
      return [
        String.raw`$h_2 - h_1 = ${sig(w / KJ)}$ kJ/kg from the air tables (or $\int c_p\,dT$ over ${sig($.tC1)} to ${sig($.tC2)} °C).`,
        String.raw`$\dot W_{in} = \dot m (h_2 - h_1) = ${sig($.m)}\times ${sig(w / KJ)} = ${sig(($.m * w) / KJ)}$ kW.`,
      ];
    },
    // Second route: ∫ c_p dT by Simpson's rule.
    second: ($) => {
      const w = simpson((T) => AIR.cp(T), $.T1, $.T2);
      return { w: w / KJ, W: ($.m * w) / KJ };
    },
    sim: {
      scenario: 'compressor',
      setup(s, $) {
        s.m = $.m;
        s.T1 = $.T1;
        s.T2 = $.T2;
      },
      read: (c, s) => ({ W: -c.W, w: -c.W / s.m }),
    },
    cases: [kase(cite('control-volume'), { m: 1, tC1: 27, tC2: 247 }, { w: 223.6, W: 223.6 })],
  }),

  // ---------------------------------------------------------------- air nozzle
  problem({
    id: 'u3.5.nozzle-air',
    title: 'Exit speed of an air nozzle',
    exam: 'u3',
    ch: '5',
    lab: 'nozzle',
    src: cite('control-volume'),
    topics: ['control-volume', 'nozzle'],
    variety: ['unknown'],
    vars: {
      T1: range(300, 600, 25, 'K'),
      p1: range(300, 1000, 50, 'kPa', KPA),
      V1: range(50, 150, 10, 'm/s'),
      r: range(1.5, 6, 0.5, ''),
    },
    derive: ($) => ({ p2: $.p1 / $.r }),
    valid: ($) => airExit($) !== null,
    text: (T, $, sig) => String.raw`Air enters an adiabatic nozzle at ${T.T1} K, ${T.p1} kPa and ${T.V1} m/s, and expands reversibly to $${sig($.p2 / KPA)}$ kPa. Treat air as an ideal gas. Find the exit temperature and the exit speed.`,
    parts: [
      num('T2', ($) => airExit($).T2, 'K', {
        tol: 0.005,
        label: 'exit temperature',
        traps: [[($) => $.T1 * ($.p2 / $.p1) ** (1 / AIR.gamma($.T1)), 'A reversible adiabatic path has T₂/T₁ = (P₂/P₁)^((k−1)/k). The exponent is not 1/k.']],
      }),
      num('V2', ($) => airExit($).V2, 'm/s', {
        tol: 0.005,
        label: 'exit speed',
        traps: [
          [($) => Math.sqrt(2 * (AIR.h($.T1) - airExit($).h2)), 'The inlet kinetic energy was left out: V₂² = V₁² + 2(h₁ − h₂).'],
          [($) => Math.sqrt($.V1 * $.V1 + (2 * (AIR.h($.T1) - airExit($).h2)) / KJ), 'Enthalpy is in J/kg inside the square root. Using kJ/kg is off by a factor of 1000.'],
          [($) => Math.sqrt($.V1 * $.V1 - 2 * AIR.R * $.T1 * Math.log($.p2 / $.p1)), 'That integrates v dp at constant temperature. A nozzle is adiabatic: the air cools as it expands.'],
        ],
      }),
    ],
    level: 2,
    hints: [
      'Two steps. First the exit temperature from the isentropic relation, then the exit speed from the energy balance.',
      String.raw`$T_2 = T_1 (P_2/P_1)^{(k-1)/k}$ for constant specific heats, or use $s_2 = s_1$ with the air tables. Then $V_2 = \sqrt{V_1^2 + 2(h_1 - h_2)}$ with $h$ in J/kg.`,
    ],
    steps: ($, sig) => {
      const n = airExit($);
      return [
        String.raw`$s_2 = s_1$ at ${sig($.p2 / KPA)} kPa gives $T_2 = ${sig(n.T2)}$ K.`,
        String.raw`$h_1 - h_2 = ${sig((n.h1 - n.h2) / KJ)}$ kJ/kg.`,
        String.raw`$V_2 = \sqrt{V_1^2 + 2(h_1 - h_2)} = \sqrt{${sig($.V1)}^2 + 2\times ${sig(n.h1 - n.h2)}} = ${sig(n.V2)}$ m/s.`,
      ];
    },
    // Second route: V₂² = V₁² − 2∫v dp along the isentrope, and T₂ from the exit enthalpy.
    second: airSecond,
    sim: {
      scenario: 'subsonic',
      setup(s, $) {
        s.T1 = $.T1;
        s.p1 = $.p1;
        s.V1 = $.V1;
        s.p2 = $.p2;
      },
      read: (c) => ({ T2: c.T2, V2: c.V2 }),
    },
    cases: [kase(cite('control-volume'), { T1: 400, p1: 600, V1: 30, r: 1.5 }, { T2: 356.5, V2: 298.1 })],
  }),

  // ---------------------------------------------------------------- steam nozzle
  problem({
    id: 'u3.5.nozzle-steam',
    title: 'Exit speed of a steam nozzle',
    exam: 'u3',
    ch: '5',
    lab: 'nozzle',
    src: cite('control-volume'),
    topics: ['control-volume', 'nozzle'],
    variety: ['unknown'],
    vars: {
      tC: celsius(250, 450, 25),
      p1: range(1, 4, 0.5, 'MPa', MPA),
      V1: range(150, 300, 25, 'm/s'),
      p2: range(100, 900, 50, 'kPa', KPA),
    },
    derive: ($) => ({ T1: fromC($.tC) }),
    valid: ($) => covered($.T1, $.p1) && $.p1 / $.p2 > 1.5 && steamExit($) !== null,
    text: (T) => String.raw`Steam at ${T.p1} MPa and ${T.tC} °C enters an adiabatic nozzle at ${T.V1} m/s. It expands reversibly to ${T.p2} kPa. Find the drop in specific enthalpy and the exit speed.`,
    parts: [
      num('dh', ($) => steamExit($).one.h - steamExit($).two.h, 'kJ/kg', {
        scale: KJ,
        tol: 0.005,
        label: 'enthalpy drop, h₁ − h₂',
        traps: [[($) => waterTP($.T1, $.p1).h - waterTP($.T1, $.p2).h, 'The steam does not stay at T₁. Reversible and adiabatic means constant entropy, so state 2 has the entropy of state 1.']],
      }),
      num('V2', ($) => steamExit($).V2, 'm/s', {
        tol: 0.005,
        label: 'exit speed',
        traps: [
          [($) => Math.sqrt(2 * (steamExit($).one.h - steamExit($).two.h)), 'The inlet kinetic energy was left out: V₂² = V₁² + 2(h₁ − h₂).'],
          [($) => Math.sqrt($.V1 * $.V1 + (2 * (steamExit($).one.h - steamExit($).two.h)) / KJ), 'h is in J/kg inside the root. kJ/kg is off by a factor of 1000.'],
        ],
      }),
    ],
    level: 2,
    hints: [
      'A reversible adiabatic nozzle keeps the entropy constant. Find state 2 at the exit pressure with the inlet entropy.',
      String.raw`Read $s_1$ and $h_1$ from the superheat table. At $P_2$ find $h_2$ where $s_2 = s_1$ (interpolate between the saturated and superheated rows). Then $V_2 = \sqrt{V_1^2 + 2(h_1-h_2)}$.`,
    ],
    steps: ($, sig) => {
      const e = steamExit($);
      return [
        String.raw`$h_1 = ${sig(e.one.h / KJ)}$ kJ/kg and $s_1 = ${sig(e.one.s / KJ)}$ kJ/(kg·K).`,
        String.raw`At ${sig($.p2 / KPA)} kPa with $s_2 = s_1$: $h_2 = ${sig(e.two.h / KJ)}$ kJ/kg, so $h_1 - h_2 = ${sig((e.one.h - e.two.h) / KJ)}$ kJ/kg.`,
        String.raw`$V_2 = \sqrt{V_1^2 + 2(h_1 - h_2)} = ${sig(e.V2)}$ m/s.`,
      ];
    },
    // Second route: V₂² = V₁² − 2∫v dp along the isentrope, with v(p) read at s = s₁.
    second: ($) => {
      const e = steamExit($);
      const vdp = integrateVdp((p) => waterP(p, 's', e.one.s).v, $.p1, $.p2);
      const V2 = Math.sqrt($.V1 * $.V1 - 2 * vdp);
      return { dh: -vdp / KJ, V2 };
    },
    sim: {
      scenario: 'steam',
      setup(s, $) {
        s.T1 = $.T1;
        s.p1 = $.p1;
        s.V1 = $.V1;
        s.p2 = $.p2;
      },
      read: (c) => ({ dh: -c.dh, V2: c.V2 }),
    },
    cases: [kase(cite('control-volume'), { tC: 300, p1: 2, V1: 150, p2: 500 }, { dh: 298.3, V2: 786.8 })],
  }),

  // ---------------------------------------------------------------- diffuser
  problem({
    id: 'u3.5.diffuser',
    title: 'Air slowing in a diffuser',
    exam: 'u3',
    ch: '5',
    lab: 'nozzle',
    src: cite('control-volume'),
    topics: ['control-volume', 'diffuser'],
    variety: ['unknown'],
    vars: {
      T1: range(250, 350, 10, 'K'),
      p1: range(60, 120, 10, 'kPa', KPA),
      V1: range(200, 350, 25, 'm/s'),
      pr: range(1.1, 1.6, 0.05, ''),
    },
    derive: ($) => ({ p2: $.p1 * $.pr }),
    valid: ($) => airExit($) !== null && airExit($).V2 > 20,
    text: (T, $, sig) => String.raw`Air enters an adiabatic diffuser at ${T.T1} K, ${T.p1} kPa and ${T.V1} m/s. It leaves at $${sig($.p2 / KPA)}$ kPa after a reversible process. Find the exit temperature and the exit speed.`,
    parts: [
      num('T2', ($) => airExit($).T2, 'K', {
        tol: 0.005,
        label: 'exit temperature',
        traps: [[($) => $.T1 + ($.V1 * $.V1) / (2 * AIR.cp($.T1)), 'That brings the air fully to rest. The exit speed is not zero, so only part of the kinetic energy becomes enthalpy.']],
      }),
      num('V2', ($) => airExit($).V2, 'm/s', {
        tol: 0.005,
        label: 'exit speed',
        traps: [[($) => Math.sqrt($.V1 * $.V1 + 2 * (airExit($).h2 - AIR.h($.T1))), 'Sign of the enthalpy change: h rises in a diffuser, so the speed falls: V₂² = V₁² − 2(h₂ − h₁).']],
      }),
    ],
    level: 2,
    hints: [
      'A diffuser is a nozzle run backward: the pressure rises and the speed falls. The energy balance is the same.',
      String.raw`$T_2$ from $s_2 = s_1$ at the higher pressure, then $V_2^2 = V_1^2 - 2(h_2 - h_1)$ with $h$ in J/kg.`,
    ],
    steps: ($, sig) => {
      const n = airExit($);
      return [
        String.raw`$s_2 = s_1$ at ${sig($.p2 / KPA)} kPa gives $T_2 = ${sig(n.T2)}$ K, and $h_2 - h_1 = ${sig((n.h2 - n.h1) / KJ)}$ kJ/kg.`,
        String.raw`$V_2 = \sqrt{V_1^2 - 2(h_2 - h_1)} = \sqrt{${sig($.V1)}^2 - 2\times ${sig(n.h2 - n.h1)}} = ${sig(n.V2)}$ m/s.`,
      ];
    },
    second: airSecond,
    sim: {
      scenario: 'diffuser',
      setup(s, $) {
        s.T1 = $.T1;
        s.p1 = $.p1;
        s.V1 = $.V1;
        s.p2 = $.p2;
      },
      read: (c) => ({ T2: c.T2, V2: c.V2 }),
    },
    cases: [kase(cite('control-volume'), { T1: 300, p1: 100, V1: 250, pr: 1.25 }, { T2: 319.7, V2: 151.1 })],
  }),

  // ---------------------------------------------------------------- throttle (steam)
  problem({
    id: 'u3.5.throttle-steam',
    title: 'Throttling superheated steam',
    exam: 'u3',
    ch: '5',
    lab: 'devices',
    src: cite('control-volume'),
    topics: ['control-volume', 'throttle'],
    variety: ['unknown'],
    vars: {
      p1: range(1, 5, 0.5, 'MPa', MPA),
      tC: celsius(250, 450, 25),
      p2: range(50, 400, 25, 'kPa', KPA),
    },
    derive: ($) => ({ T1: fromC($.tC) }),
    valid: ($) => {
      if (!covered($.T1, $.p1)) return false;
      try {
        const two = waterP($.p2, 'h', waterTP($.T1, $.p1).h);
        return two.x == null && two.T > satP($.p2).T + 5;
      } catch {
        return false;
      }
    },
    text: (T) => String.raw`Steam at ${T.p1} MPa and ${T.tC} °C is throttled to ${T.p2} kPa through a valve. The valve is adiabatic, and the change in kinetic energy is negligible. Find the specific enthalpy and the temperature after the valve.`,
    parts: [
      num('h2', ($) => waterTP($.T1, $.p1).h, 'kJ/kg', {
        scale: KJ,
        tol: 0.005,
        label: 'enthalpy after the valve',
        traps: [[($) => waterTP($.T1, $.p2).h, 'The temperature does not stay fixed across a throttle. What stays fixed is the enthalpy.']],
      }),
      num('T2', ($) => toC(waterP($.p2, 'h', waterTP($.T1, $.p1).h).T), '°C', {
        tol: 0.002,
        label: 'temperature after the valve',
        traps: [
          [($) => $.tC, 'That treats steam as an ideal gas. For steam h depends on pressure too, so h₂ = h₁ at a lower pressure means a lower temperature.'],
          [($) => toC(satP($.p2).T), 'The steam is still superheated at the exit. Saturation is not reached.'],
        ],
      }),
    ],
    level: 2,
    hints: [
      'A throttle has no work, no heat, and almost no change in kinetic energy. The energy balance leaves one statement.',
      String.raw`$h_2 = h_1$. Read $h_1$ at the inlet state, then find the temperature at $P_2$ where the superheat table shows that enthalpy (interpolate).`,
    ],
    steps: ($, sig) => {
      const h1 = waterTP($.T1, $.p1).h;
      return [
        String.raw`$h_1 = ${sig(h1 / KJ)}$ kJ/kg, and $h_2 = h_1$.`,
        String.raw`At ${sig($.p2 / KPA)} kPa, $h = ${sig(h1 / KJ)}$ kJ/kg lies in the superheated region at $T_2 = ${sig(toC(waterP($.p2, 'h', h1).T))}$ °C.`,
      ];
    },
    // Second route: integrate the Joule–Thomson coefficient (∂T/∂P)_h from P₁ to P₂.
    second: ($) => ({ h2: (waterTP($.T1, $.p1).u + $.p1 * waterTP($.T1, $.p1).v) / KJ, T2: toC(throttleByJouleThomson($.T1, $.p1, $.p2)) }),
    sim: {
      scenario: 'throttle',
      setup(s, $) {
        s.T1 = $.T1;
        s.p1 = $.p1;
        s.p2 = $.p2;
      },
      read: (c) => ({ T2: toC(c.T2) }),
    },
    cases: [kase(cite('control-volume'), { p1: 2, tC: 300, p2: 100 }, { h2: 3024.2, T2: 274.9 })],
  }),

  // ---------------------------------------------------------------- flash
  problem({
    id: 'u3.5.flash',
    title: 'Hot liquid throttled to a flash',
    exam: 'u3',
    ch: '5',
    lab: 'devices',
    src: cite('control-volume'),
    topics: ['control-volume', 'throttle'],
    variety: ['unknown'],
    vars: {
      p1: range(0.8, 2, 0.1, 'MPa', MPA),
      tC: celsius(120, 190, 10),
      p2: range(100, 400, 25, 'kPa', KPA),
    },
    derive: ($) => ({ T1: fromC($.tC) }),
    valid: ($) => {
      try {
        if ($.T1 > satP($.p1).T - 5) return false;
        const two = waterP($.p2, 'h', waterTP($.T1, $.p1).h);
        return two.x != null && two.x > 0.03 && two.x < 0.6;
      } catch {
        return false;
      }
    },
    text: (T) => String.raw`Liquid water at ${T.p1} MPa and ${T.tC} °C passes through a throttling valve and leaves at ${T.p2} kPa. The valve is adiabatic and the kinetic energy does not change. Find the quality after the valve and its temperature.`,
    parts: [
      num('x2', ($) => waterP($.p2, 'h', waterTP($.T1, $.p1).h).x, '', {
        tol: 0.005,
        abs: 1e-4,
        label: 'quality after the valve',
        traps: [
          [($) => (waterTP($.T1, $.p1).u - satP($.p2).uf) / satP($.p2).ufg, 'The balance conserves h, not u. Use h₁ = h_f + x h_fg at the exit pressure.'],
          [($) => (waterTP($.T1, $.p1).h - satP($.p2).hf) / satP($.p2).hg, 'Divide by h_fg, the heat of vaporisation, not by h_g.'],
        ],
      }),
      num('T2', ($) => toC(satP($.p2).T), '°C', {
        tol: 0.002,
        label: 'temperature after the valve',
        traps: [[($) => $.tC, 'Part of the liquid boils, which cools the rest to the saturation temperature at the new pressure.']],
      }),
    ],
    level: 2,
    hints: [
      'No work, no heat, and the same enthalpy before and after. Compare that enthalpy with the saturated liquid and vapour at the exit pressure.',
      String.raw`$h_1 \approx h_f(T_1)$ for a compressed liquid, and $h_f(P_2) < h_1 < h_g(P_2)$ means a mixture. Then $x_2 = (h_1 - h_f)/h_{fg}$ at $P_2$.`,
    ],
    steps: ($, sig) => {
      const h1 = waterTP($.T1, $.p1).h;
      const s2 = satP($.p2);
      return [
        String.raw`$h_2 = h_1 = ${sig(h1 / KJ)}$ kJ/kg. At ${sig($.p2 / KPA)} kPa, $h_f = ${sig(s2.hf / KJ)}$ and $h_g = ${sig(s2.hg / KJ)}$ kJ/kg, so the water flashes into a mixture.`,
        String.raw`$x_2 = (h_1 - h_f)/h_{fg} = (${sig(h1 / KJ)} - ${sig(s2.hf / KJ)})/${sig(s2.hfg / KJ)} = ${sig((h1 - s2.hf) / s2.hfg)}$, at $T_2 = T_{sat} = ${sig(toC(s2.T))}$ °C.`,
      ];
    },
    // Second route: rebuild h from the mixture at the exit pressure and its state's own tables.
    second: ($) => {
      const h1 = waterTP($.T1, $.p1).h;
      const s2 = satP($.p2);
      let lo = 0;
      let hi = 1;
      for (let i = 0; i < 80; i++) {
        const mid = (lo + hi) / 2;
        if (mixP($.p2, mid).h < h1) lo = mid;
        else hi = mid;
      }
      return { x2: (lo + hi) / 2, T2: toC(s2.T) };
    },
    sim: {
      scenario: 'flash',
      setup(s, $) {
        s.T1 = $.T1;
        s.p1 = $.p1;
        s.p2 = $.p2;
      },
      read: (c) => ({ x2: c.x2, T2: toC(c.T2) }),
    },
    cases: [kase(cite('control-volume'), { p1: 1.5, tC: 180, p2: 100 }, { x2: 0.1533, T2: 99.61 })],
  }),

  // ---------------------------------------------------------------- mixing chamber
  problem({
    id: 'u3.5.mixer',
    title: 'Mixing hot and cold water',
    exam: 'u3',
    ch: '5',
    lab: 'devices',
    src: cite('control-volume'),
    topics: ['control-volume', 'mixing'],
    variety: ['unknown'],
    vars: {
      mh: range(0.2, 5, 0.2, 'kg/s'),
      tCh: celsius(50, 90, 5),
      mc: range(0.5, 8, 0.5, 'kg/s'),
      tCc: celsius(5, 30, 5),
      p: range(100, 500, 50, 'kPa', KPA),
    },
    derive: ($) => ({ Th: fromC($.tCh), Tc: fromC($.tCc), m3: $.mh + $.mc }),
    text: (T) => String.raw`A mixing chamber at ${T.p} kPa receives ${T.mh} kg/s of liquid water at ${T.tCh} °C and ${T.mc} kg/s at ${T.tCc} °C. It is adiabatic, with no work. Find the mass flow rate and the temperature of the mixed stream.`,
    parts: [
      num('m3', ($) => $.m3, 'kg/s', { tol: 0.005, label: 'outlet mass flow rate' }),
      num('T3', ($) => toC(waterP($.p, 'h', ($.mh * waterTP($.Th, $.p).h + $.mc * waterTP($.Tc, $.p).h) / $.m3).T), '°C', {
        tol: 0.002,
        label: 'outlet temperature',
        traps: [
          [($) => ($.tCh + $.tCc) / 2, 'The streams are not equal: the outlet leans toward the larger flow. Weight the enthalpies by mass flow rate.'],
          [($) => ($.mh * $.tCc + $.mc * $.tCh) / $.m3, 'The weights are swapped. The larger flow should pull the outlet toward its own temperature.'],
        ],
      }),
    ],
    level: 1,
    hints: [
      'Mass in equals mass out. Energy in equals energy out, because there is no heat and no work.',
      String.raw`$\dot m_3 = \dot m_h + \dot m_c$ and $\dot m_3 h_3 = \dot m_h h_h + \dot m_c h_c$. Get $h_h$ and $h_c$ from the compressed-liquid values (about $h_f$ at each temperature).`,
    ],
    steps: ($, sig) => {
      const hh = waterTP($.Th, $.p).h;
      const hc = waterTP($.Tc, $.p).h;
      const h3 = ($.mh * hh + $.mc * hc) / $.m3;
      return [
        String.raw`$\dot m_3 = ${sig($.mh)} + ${sig($.mc)} = ${sig($.m3)}$ kg/s.`,
        String.raw`$h_3 = (\dot m_h h_h + \dot m_c h_c)/\dot m_3 = (${sig($.mh)}\times ${sig(hh / KJ)} + ${sig($.mc)}\times ${sig(hc / KJ)})/${sig($.m3)} = ${sig(h3 / KJ)}$ kJ/kg.`,
        String.raw`That enthalpy belongs to liquid water at $T_3 = ${sig(toC(waterP($.p, 'h', h3).T))}$ °C.`,
      ];
    },
    // Second route: solve Σ ṁ (h(T) − h_in) = 0 for T by bisection.
    second: ($) => {
      const hh = waterTP($.Th, $.p).h;
      const hc = waterTP($.Tc, $.p).h;
      let lo = $.Tc;
      let hi = $.Th;
      for (let i = 0; i < 100; i++) {
        const mid = (lo + hi) / 2;
        const h = waterTP(mid, $.p).h;
        if ($.mh * (h - hh) + $.mc * (h - hc) < 0) lo = mid;
        else hi = mid;
      }
      return { m3: $.mh + $.mc, T3: toC((lo + hi) / 2) };
    },
    sim: {
      scenario: 'mixer',
      setup(s, $) {
        s.mh = $.mh;
        s.Th = $.Th;
        s.mc = $.mc;
        s.Tc = $.Tc;
        s.p = $.p;
      },
      read: (c) => ({ T3: toC(c.T2) }),
    },
    cases: [kase(cite('control-volume'), { mh: 1, tCh: 60, mc: 2, tCc: 15, p: 200 }, { m3: 3, T3: 29.99 })],
  }),

  // ---------------------------------------------------------------- heat exchanger
  problem({
    id: 'u3.5.exchanger',
    title: 'Water-to-water heat exchanger',
    exam: 'u3',
    ch: '5',
    lab: 'devices',
    src: cite('control-volume'),
    topics: ['control-volume', 'heat-exchanger'],
    variety: ['unknown'],
    vars: {
      mh: range(0.5, 3, 0.25, 'kg/s'),
      tChi: celsius(70, 100, 5),
      tCho: celsius(35, 60, 5),
      mc: range(0.5, 4, 0.25, 'kg/s'),
      tCci: celsius(10, 25, 5),
      p: range(200, 500, 100, 'kPa', KPA),
    },
    derive: ($) => ({ Thi: fromC($.tChi), Tho: fromC($.tCho), Tci: fromC($.tCci) }),
    valid: ($) => {
      const Q = $.mh * (waterTP($.Thi, $.p).h - waterTP($.Tho, $.p).h);
      const hco = waterTP($.Tci, $.p).h + Q / $.mc;
      return $.Tho < $.Thi - 10 && toC(waterP($.p, 'h', hco).T) < $.tCho - 3;
    },
    text: (T) => String.raw`Liquid water at ${T.p} kPa flows through a heat exchanger, hot side ${T.mh} kg/s from ${T.tChi} °C to ${T.tCho} °C, cold side ${T.mc} kg/s entering at ${T.tCci} °C. No heat is lost to the surroundings and no work is done. Find the rate of heat transfer between the streams and the cold-side outlet temperature.`,
    parts: [
      num('Q', ($) => $.mh * (waterTP($.Thi, $.p).h - waterTP($.Tho, $.p).h), 'kW', {
        scale: KJ,
        tol: 0.005,
        label: 'heat transferred',
        traps: [
          [($) => $.mc * (waterTP($.Thi, $.p).h - waterTP($.Tci, $.p).h), 'The cold side is not heated from T_ci to the hot inlet temperature. Use the hot stream: ṁ_h (h_hi − h_ho).'],
          [($) => $.mh * (waterTP($.Thi, $.p).h - waterTP($.Tci, $.p).h), 'The hot stream leaves at its outlet temperature, not at the cold inlet temperature.'],
        ],
      }),
      num('Tco', ($) => {
        const Q = $.mh * (waterTP($.Thi, $.p).h - waterTP($.Tho, $.p).h);
        return toC(waterP($.p, 'h', waterTP($.Tci, $.p).h + Q / $.mc).T);
      }, '°C', {
        tol: 0.002,
        label: 'cold-side outlet temperature',
        traps: [[($) => $.tCci + ($.tChi - $.tCho), 'The cold side rises by the hot side’s drop only when the two flow rates are equal.']],
      }),
    ],
    level: 2,
    hints: [
      'Treat the whole exchanger as the control volume: nothing crosses its outside. What the hot stream loses, the cold stream gains.',
      String.raw`$\dot Q = \dot m_h (h_{hi} - h_{ho}) = \dot m_c (h_{co} - h_{ci})$. Find $h_{co}$ from the second equality, then its temperature.`,
    ],
    steps: ($, sig) => {
      const dh = waterTP($.Thi, $.p).h - waterTP($.Tho, $.p).h;
      const Q = $.mh * dh;
      const hco = waterTP($.Tci, $.p).h + Q / $.mc;
      return [
        String.raw`$\dot Q = \dot m_h (h_{hi} - h_{ho}) = ${sig($.mh)}\times ${sig(dh / KJ)} = ${sig(Q / KJ)}$ kW.`,
        String.raw`$h_{co} = h_{ci} + \dot Q/\dot m_c = ${sig(hco / KJ)}$ kJ/kg, which is liquid water at $${sig(toC(waterP($.p, 'h', hco).T))}$ °C.`,
      ];
    },
    // Second route: each side as ṁ ∫ c_p dT; the cold outlet is found by bisection.
    second: ($) => {
      const cp = (T) => waterTP(T, $.p).cp;
      const Q = $.mh * simpson(cp, $.Tho, $.Thi);
      let lo = $.Tci;
      let hi = $.Thi;
      for (let i = 0; i < 100; i++) {
        const mid = (lo + hi) / 2;
        if ($.mc * simpson(cp, $.Tci, mid) < Q) lo = mid;
        else hi = mid;
      }
      return { Q: Q / KJ, Tco: toC((lo + hi) / 2) };
    },
    sim: {
      scenario: 'exchanger',
      setup(s, $) {
        s.mh = $.mh;
        s.Thi = $.Thi;
        s.Tho = $.Tho;
        s.mc = $.mc;
        s.Tci = $.Tci;
        s.p = $.p;
      },
      read: (c) => ({ Q: c.Qx, Tco: toC(c.T2) }),
    },
    cases: [kase(cite('control-volume'), { mh: 1, tChi: 90, tCho: 50, mc: 1.5, tCci: 15, p: 300 }, { Q: 167.6, Tco: 41.72 })],
  }),

  // ---------------------------------------------------------------- water heater (SI)
  problem({
    id: 'u3.5.heater',
    title: 'Power of a tankless water heater',
    exam: 'u3',
    ch: '5',
    lab: 'heater',
    src: cite('control-volume'),
    topics: ['control-volume', 'heat-exchanger'],
    variety: ['unknown'],
    vars: {
      gpm: range(1, 5, 0.25, 'gal/min', GPM),
      tCin: celsius(4, 25, 1),
      tCset: celsius(40, 60, 1),
      eta: range(0.85, 1, 0.01, ''),
    },
    derive: ($) => ({ Tin: fromC($.tCin), Tset: fromC($.tCset) }),
    text: (T) => String.raw`A tankless water heater raises water from ${T.tCin} °C to ${T.tCset} °C at ${T.gpm} gal/min. Use liquid-water properties at 400 kPa. One US gallon is $3.785\times10^{-3}$ m³. Find the mass flow rate, the rate of heat added to the water, and the electric power drawn if ${T.eta} of the electric power reaches the water.`,
    parts: [
      num('mdot', ($) => $.gpm / waterTP($.Tin, P_LINE).v, 'kg/s', {
        tol: 0.005,
        label: 'mass flow rate',
        traps: [[($) => $.gpm * 60 / waterTP($.Tin, P_LINE).v, 'Gallons per minute must become seconds: divide by 60 as well as converting gallons to cubic metres.']],
      }),
      num('Q', ($) => ($.gpm / waterTP($.Tin, P_LINE).v) * (waterTP($.Tset, P_LINE).h - waterTP($.Tin, P_LINE).h), 'kW', {
        scale: KJ,
        tol: 0.005,
        label: 'heat added to the water',
        traps: [[($) => ($.gpm / waterTP($.Tin, P_LINE).v) * (waterTP($.Tset, P_LINE).h - waterTP($.Tin, P_LINE).h) * 60, 'The flow is per minute. Convert to per second before multiplying by kJ/kg.']],
      }),
      num('P', ($) => (($.gpm / waterTP($.Tin, P_LINE).v) * (waterTP($.Tset, P_LINE).h - waterTP($.Tin, P_LINE).h)) / $.eta, 'kW', {
        scale: KJ,
        tol: 0.005,
        label: 'electric power',
        traps: [[($) => (($.gpm / waterTP($.Tin, P_LINE).v) * (waterTP($.Tset, P_LINE).h - waterTP($.Tin, P_LINE).h)) * $.eta, 'Efficiency is heat in the water divided by electricity in. The electric power is larger than the heat, so divide by it.']],
      }),
    ],
    level: 2,
    hints: [
      'Convert the volume flow to m³/s first, then to kg/s with the specific volume.',
      String.raw`$\dot Q = \dot m (h_{out} - h_{in})$ with no work and no change in kinetic energy. Take $h$ from the compressed-liquid values at 400 kPa.`,
    ],
    steps: ($, sig) => {
      const v = waterTP($.Tin, P_LINE).v;
      const mdot = $.gpm / v;
      const dh = waterTP($.Tset, P_LINE).h - waterTP($.Tin, P_LINE).h;
      return [
        String.raw`$\dot m = \dot V/v = ${sig($.gpm)}/${sig(v)} = ${sig(mdot)}$ kg/s.`,
        String.raw`$\dot Q = \dot m (h_{out} - h_{in}) = ${sig(mdot)}\times ${sig(dh / KJ)} = ${sig((mdot * dh) / KJ)}$ kW.`,
        String.raw`$P_{el} = \dot Q/\eta = ${sig((mdot * dh) / $.eta / KJ)}$ kW.`,
      ];
    },
    // Second route: ṁ ∫ c_p dT by Simpson's rule.
    second: ($) => {
      const mdot = $.gpm / waterTP($.Tin, P_LINE).v;
      const Q = mdot * simpson((T) => waterTP(T, P_LINE).cp, $.Tin, $.Tset);
      return { mdot, Q: Q / KJ, P: Q / $.eta / KJ };
    },
    sim: {
      scenario: 'shower',
      setup(s, $) {
        s.gpm = $.gpm / GPM;
        s.Tin = $.Tin;
        s.Tset = $.Tset;
        s.eta = $.eta;
      },
      read: (c) => ({ mdot: c.mdot, Q: c.Q, P: c.elec }),
    },
    cases: [kase(cite('control-volume'), { gpm: 2.5, tCin: 15, tCset: 48.9, eta: 0.98 }, { mdot: 0.1576, Q: 22.33, P: 22.79 })],
  }),

  // ---------------------------------------------------------------- water heater (English units)
  problem({
    id: 'u3.5.heater-english',
    title: 'Water heater load, English units',
    exam: 'u3',
    ch: '5',
    lab: null,
    src: cite('control-volume'),
    topics: ['control-volume', 'english'],
    variety: ['unknown'],
    vars: {
      gpm: range(1, 5, 0.5, 'gal/min', GPM),
      tF1: fahrenheit(40, 70, 5),
      tF2: fahrenheit(100, 140, 5),
    },
    derive: ($) => ({ Tin: fromF($.tF1), Tset: fromF($.tF2) }),
    text: (T) => String.raw`A heater raises water from ${T.tF1} °F to ${T.tF2} °F at ${T.gpm} gal/min. Use liquid-water properties at 58 psia (400 kPa). Find the mass flow rate in lbm/h and the heat added in Btu/h.`,
    parts: [
      num('mdot', ($) => $.gpm / waterTP($.Tin, P_LINE).v, 'lbm/h', {
        scale: KG_PER_LBM / 3600,
        tol: 0.005,
        label: 'mass flow rate',
        traps: [[($) => ($.gpm / waterTP($.Tin, P_LINE).v) * 60, 'Per minute to per hour is a factor of 60, not 1/60.']],
      }),
      num('Q', ($) => ($.gpm / waterTP($.Tin, P_LINE).v) * (waterTP($.Tset, P_LINE).h - waterTP($.Tin, P_LINE).h), 'Btu/h', {
        scale: J_PER_BTU / 3600,
        tol: 0.005,
        label: 'heat added',
        traps: [
          [($) => ($.gpm / waterTP($.Tin, P_LINE).v) * (waterTP($.Tset, P_LINE).h - waterTP($.Tin, P_LINE).h) / 1.8, 'The temperature difference in °F is 1.8 times the difference in K: the Btu per lbm·°F figure already includes that.'],
        ],
      }),
    ],
    level: 2,
    hints: [
      'Work in one unit system. A US gallon of water at these temperatures weighs about 8.3 lbm.',
      String.raw`$\dot Q = \dot m\,(h_{out} - h_{in})$, with $h$ in Btu/lbm. Per hour: multiply the per-minute flow by 60.`,
    ],
    steps: ($, sig) => {
      const mdot = $.gpm / waterTP($.Tin, P_LINE).v;
      const lbmh = (mdot * 3600) / KG_PER_LBM;
      const dh = (waterTP($.Tset, P_LINE).h - waterTP($.Tin, P_LINE).h) / J_PER_BTU * KG_PER_LBM;
      return [
        String.raw`$\dot m = ${sig(lbmh)}$ lbm/h.`,
        String.raw`$h_{out} - h_{in} = ${sig(dh)}$ Btu/lbm, so $\dot Q = ${sig(lbmh)}\times ${sig(dh)} = ${sig(lbmh * dh)}$ Btu/h.`,
      ];
    },
    // Second route: the whole calculation in English units, with specific volume in ft³/lbm.
    second: ($) => {
      const vEng = waterTP($.Tin, P_LINE).v / (0.3048 ** 3 / KG_PER_LBM);
      const galFt3 = M3_PER_GAL_US / 0.3048 ** 3;
      const lbmh = (($.gpm / GPM) * 60 * galFt3) / vEng;
      const dh = ((waterTP($.Tset, P_LINE).h - waterTP($.Tin, P_LINE).h) * KG_PER_LBM) / J_PER_BTU;
      return { mdot: lbmh, Q: lbmh * dh };
    },
    cases: [kase(cite('control-volume'), { gpm: 2.5, tF1: 60, tF2: 120 }, { mdot: 1251, Q: 74920 }, { note: 'The shortcut cp = 1 Btu/(lbm·°F) gives 75 000 Btu/h.' })],
  }),

  // ---------------------------------------------------------------- conceptual
  problem({
    id: 'u3.5.which-device',
    title: 'Which device is it?',
    exam: 'u3',
    ch: '5',
    lab: 'devices',
    kind: 'conceptual',
    src: cite('control-volume'),
    topics: ['control-volume'],
    variety: ['configuration'],
    vars: {
      m: range(0.5, 10, 0.5, 'kg/s'),
      device: choice(
        ['turbine', 'a turbine: steam passes over blades that turn a shaft, with no heat loss'],
        ['throttle', 'a throttling valve: a fluid squeezes through a small opening, with no heat loss and no shaft'],
        ['nozzle', 'a nozzle: a fluid expands through a narrowing passage with no shaft and no heat loss'],
        ['mixer', 'a mixing chamber: two streams join in a vessel with no shaft and no heat loss'],
      ),
    },
    text: (T) => String.raw`Fluid flows steadily at ${T.m} kg/s through ${T.device}. Which energy relation do you start from?`,
    parts: [
      mc('form', [
        ['turbine', String.raw`$\dot W = \dot m (h_1 - h_2)$`, 'This is the turbine: a shaft carries the enthalpy drop out as work. A device with no shaft has no work term to solve for.'],
        ['throttle', String.raw`$h_2 = h_1$`, 'This is the throttle: no shaft, no heat and almost no change in speed leave the enthalpy unchanged. A device that gains speed or work does change h.'],
        ['nozzle', String.raw`$V_2^2 = V_1^2 + 2(h_1 - h_2)$`, 'This is the nozzle: with no shaft and no heat, the enthalpy that is lost becomes speed. A device whose speed barely changes drops the kinetic term.'],
        ['mixer', String.raw`$\dot m_3 h_3 = \dot m_1 h_1 + \dot m_2 h_2$`, 'This is the mixing chamber: two inlets, so the outlet enthalpy is a flow-weighted mean. A device with one stream has no second inlet to weight.'],
      ], ($) => $.device, { label: 'the relation to start from' }),
    ],
    level: 1,
    hints: [
      'Start from the steady-flow energy balance and cross out the terms the description sets to zero.',
      'A device with a shaft has work. A device with only one stream has one mass flow. Ask which terms stay.',
    ],
    steps: ($) => [
      {
        turbine: String.raw`A turbine has a shaft, no heat and little change in kinetic energy: the work is the enthalpy drop, $\dot W = \dot m(h_1 - h_2)$.`,
        throttle: String.raw`A throttle has no work, no heat, and a change in kinetic energy that is small: $h_2 = h_1$.`,
        nozzle: String.raw`A nozzle has no work and no heat. The enthalpy drop becomes kinetic energy: $V_2^2 = V_1^2 + 2(h_1 - h_2)$.`,
        mixer: String.raw`A mixing chamber has two inlets, no work, no heat: the outlet enthalpy is the flow-weighted mean.`,
      }[$.device],
    ],
    second: ($) => {
      // Which terms the description drops, then the relation that is left.
      const dropped = { turbine: 'q,ke', throttle: 'q,w,ke', nozzle: 'q,w', mixer: 'q,w,ke,one-stream' }[$.device];
      const left = { 'q,ke': 'turbine', 'q,w,ke': 'throttle', 'q,w': 'nozzle', 'q,w,ke,one-stream': 'mixer' }[dropped];
      return { form: left };
    },
    cases: [
      kase(cite('control-volume'), { m: 2, device: 'turbine' }, { form: 'turbine' }),
      kase(cite('control-volume'), { m: 2, device: 'throttle' }, { form: 'throttle' }),
    ],
  }),

  problem({
    id: 'u3.5.throttle-temperature',
    title: 'What happens to the temperature in a throttle?',
    exam: 'u3',
    ch: '5',
    lab: 'devices',
    kind: 'conceptual',
    src: cite('control-volume'),
    topics: ['control-volume', 'throttle'],
    variety: ['configuration'],
    vars: {
      fluid: choice(['air', 'air'], ['steam', 'superheated steam'], ['liquid', 'hot liquid water']),
      p1: range(500, 3000, 100, 'kPa', KPA),
      tC: celsius(30, 420, 10),
      p2: range(100, 400, 50, 'kPa', KPA),
    },
    derive: ($) => ({ T1: fromC($.tC) }),
    valid: ($) => {
      if ($.p1 / $.p2 < 2) return false;
      try {
        if ($.fluid === 'air') return $.tC < 100;
        const sat = satP($.p1).T;
        if ($.fluid === 'steam') return $.T1 > sat + 15 && covered($.T1, $.p1);
        const two = waterP($.p2, 'h', waterTP($.T1, $.p1).h);
        return $.T1 < sat - 5 && two.x != null && two.x > 0.02;
      } catch {
        return false;
      }
    },
    text: (T) => String.raw`${T.fluid} at ${T.p1} kPa and ${T.tC} °C passes through an adiabatic valve into a line at ${T.p2} kPa. Kinetic energy does not change. What happens to the temperature?`,
    parts: [
      mc('dT', [
        ['falls', 'It falls', 'Right for steam (h depends on P, and the Joule–Thomson effect cools it) and for hot liquid (part boils, leaving the saturation temperature). It does not apply to an ideal gas.'],
        ['same', 'It stays the same', 'Right only for an ideal gas, whose h depends on T alone. Steam and a liquid close to boiling are not ideal gases.'],
        ['rises', 'It rises', 'At these states a pressure drop at constant enthalpy never heats the fluid. The Joule–Thomson coefficient is positive here, and flashing cools the liquid.'],
      ], ($) => ($.fluid === 'air' ? 'same' : 'falls'), {
        label: 'temperature after the valve',
      }),
    ],
    level: 2,
    hints: [
      'The balance gives h₂ = h₁ for a valve. Ask what the enthalpy of this fluid depends on.',
      'If h depends on T only, T cannot change. If h also depends on P, then T has to move.',
    ],
    steps: ($) => [
      $.fluid === 'air'
        ? String.raw`For an ideal gas $h = h(T)$ only, so $h_2 = h_1$ gives $T_2 = T_1$.`
        : $.fluid === 'steam'
          ? String.raw`Steam is a real gas: $h$ depends on $P$ as well as $T$. At these states $(\partial T/\partial P)_h > 0$, so a pressure drop lowers $T$.`
          : String.raw`The liquid's pressure falls below its saturation pressure, so some of it boils. The mixture is at $T_{sat}(P_2)$, below $T_1$.`,
    ],
    // Second route: compute the exit state and read the sign of ΔT.
    second: ($) => {
      let T2;
      if ($.fluid === 'air') T2 = tFromH(AIR, AIR.h($.T1));
      else T2 = waterP($.p2, 'h', waterTP($.T1, $.p1).h).T;
      const d = T2 - $.T1;
      return { dT: Math.abs(d) < 0.01 ? 'same' : d < 0 ? 'falls' : 'rises' };
    },
    cases: [
      kase(cite('control-volume'), { fluid: 'air', p1: 500, tC: 27, p2: 100 }, { dT: 'same' }),
      kase(cite('control-volume'), { fluid: 'steam', p1: 2000, tC: 300, p2: 100 }, { dT: 'falls' }),
    ],
  }),

  problem({
    id: 'u3.5.passage',
    title: 'Does the passage narrow or widen?',
    exam: 'u3',
    ch: '5',
    lab: 'nozzle',
    kind: 'conceptual',
    src: cite('control-volume'),
    topics: ['control-volume', 'nozzle'],
    variety: ['configuration'],
    vars: {
      regime: choice(['sub', 'subsonic'], ['super', 'supersonic']),
      duty: choice(['up', 'speeds up'], ['down', 'slows down']),
      k: range(0, 4, 1, ''),
      T1: range(280, 360, 20, 'K'),
      p1: range(100, 300, 25, 'kPa', KPA),
    },
    derive: ($) => {
      const M1 = $.regime === 'sub' ? 0.3 + 0.1 * $.k : 1.3 + 0.2 * $.k;
      const V1 = M1 * Math.sqrt(AIR.gamma($.T1) * AIR.R * $.T1);
      return { M1, V1, p2: $.duty === 'up' ? $.p1 / 1.2 : $.p1 * 1.2 };
    },
    valid: ($) => airExit($) !== null && airExit($).V2 > 10,
    text: (T, $, sig) => String.raw`Air enters a duct at ${T.p1} kPa and ${T.T1} K moving at $${sig($.V1)}$ m/s (Mach $${sig($.M1)}$, ${T.regime}). Along the duct it ${T.duty}, leaving at $${sig($.p2 / KPA)}$ kPa. The flow is reversible and adiabatic. Must the passage narrow or widen?`,
    parts: [
      mc('area', [
        ['narrow', 'Narrow: the exit area is smaller', 'Right for subsonic acceleration or supersonic deceleration. For the other cases the density changes faster than the speed.'],
        ['widen', 'Widen: the exit area is larger', 'Right for subsonic deceleration or supersonic acceleration. Check the Mach number first: it reverses the rule at Mach 1.'],
        ['same', 'Stay the same: only the pressure changes', 'A change of speed with a change of density needs a change of area by continuity, A = ṁv/V. Only at Mach 1 does the area stop mattering.'],
      ],
        ($) => (($.regime === 'super') === ($.duty === 'up') ? 'widen' : 'narrow'), { label: 'the passage' }),
    ],
    level: 3,
    hints: [
      'Continuity gives A = ṁ v / V. The area falls when V rises faster than v, and rises when v rises faster than V.',
      String.raw`Below Mach 1 the speed changes faster than the density does. Above Mach 1 the density changes faster than the speed. That reverses the rule.`,
    ],
    steps: ($) => [
      String.raw`Subsonic flow: a nozzle (speeding up) narrows, a diffuser (slowing down) widens. Supersonic flow does the opposite.`,
      String.raw`Here the flow is ${$.regime === 'sub' ? 'subsonic' : 'supersonic'} and ${$.duty === 'up' ? 'speeds up' : 'slows down'}, so the passage ${(($.regime === 'super') === ($.duty === 'up')) ? 'widens' : 'narrows'}.`,
    ],
    // Second route: compute A₂/A₁ = (V₁/V₂)(v₂/v₁) from the energy balance.
    second: ($) => {
      const r = airExit($).areaRatio;
      return { area: Math.abs(r - 1) < 1e-4 ? 'same' : r > 1 ? 'widen' : 'narrow' };
    },
    cases: [
      kase(cite('control-volume'), { regime: 'sub', duty: 'up', k: 1, T1: 300, p1: 200 }, { area: 'narrow' }),
      kase(cite('control-volume'), { regime: 'super', duty: 'up', k: 1, T1: 300, p1: 200 }, { area: 'widen' }),
    ],
  }),

  problem({
    id: 'u3.5.heater-power',
    title: 'What changes the heater power?',
    exam: 'u3',
    ch: '5',
    lab: 'heater',
    kind: 'conceptual',
    src: cite('control-volume'),
    topics: ['control-volume'],
    variety: ['configuration'],
    vars: {
      change: choice(
        ['cold', 'the inlet water is 8 K colder, with the same flow and setting'],
        ['hot', 'the outlet setting is raised by 8 K, with the same flow and inlet'],
        ['slow', 'the flow is cut by a quarter, with the same inlet and setting'],
        ['eff', 'the heater’s efficiency rises from 0.90 to 0.98, with the same flow and temperatures'],
        ['both', 'the inlet water and the outlet setting are both 8 K higher, with the same flow'],
      ),
      gpm: range(1, 5, 0.5, 'gal/min', GPM),
      tCin: celsius(8, 24, 4),
      tCset: celsius(40, 56, 4),
    },
    derive: ($) => ({ Tin: fromC($.tCin), Tset: fromC($.tCset) }),
    text: (T) => String.raw`A tankless heater raises water from ${T.tCin} °C to ${T.tCset} °C at ${T.gpm} gal/min. What happens to the electric power it draws if ${T.change}?`,
    parts: [
      mc('P', [
        ['bigger', 'It rises', 'Power is ṁ Δh/η. This change raises Δh or ṁ, or lowers η, only in the cases that need more electricity: a colder inlet, a hotter setting.'],
        ['smaller', 'It falls', 'Power falls only when ṁ or Δh falls or η rises: a smaller flow, or a more efficient heater.'],
        ['same', 'It stays about the same', 'Power depends on the rise ΔT, not on the temperatures themselves, so shifting both by the same amount leaves it nearly unchanged.'],
      ], ($) => ({ cold: 'bigger', hot: 'bigger', slow: 'smaller', eff: 'smaller', both: 'same' })[$.change], { label: 'the electric power' }),
    ],
    level: 2,
    hints: [
      String.raw`Power is $\dot m\,\Delta h/\eta$. Ask which of those three factors moves.`,
      String.raw`$\Delta h$ is set by the temperature rise. Its size depends on the difference of the two temperatures, not on either one.`,
    ],
    steps: ($) => [
      String.raw`$P = \dot m (h_{out} - h_{in})/\eta$. Compare each factor before and after the change.`,
      {
        cold: 'A colder inlet raises $\\Delta T$, so $\\Delta h$ and the power rise.',
        hot: 'A higher setting raises $\\Delta T$, so $\\Delta h$ and the power rise.',
        slow: 'A smaller flow cuts $\\dot m$, so the power falls in proportion.',
        eff: 'A higher efficiency cuts the electricity drawn for the same heat in the water.',
        both: 'Both temperatures move together, so $\\Delta T$ is the same and so is the power, to within the small change of $c_p$ with temperature.',
      }[$.change],
    ],
    // Second route: compute the power before and after, and compare.
    second: ($) => {
      const before = { gpm: $.gpm, Tin: $.Tin, Tset: $.Tset, eta: $.change === 'eff' ? 0.9 : 0.98 };
      const after = { ...before };
      if ($.change === 'cold') after.Tin -= 8;
      if ($.change === 'hot') after.Tset += 8;
      if ($.change === 'slow') after.gpm *= 0.75;
      if ($.change === 'eff') after.eta = 0.98;
      if ($.change === 'both') { after.Tin += 8; after.Tset += 8; }
      const P = (s) => ((s.gpm / waterTP(s.Tin, P_LINE).v) * (waterTP(s.Tset, P_LINE).h - waterTP(s.Tin, P_LINE).h)) / s.eta;
      const a = P(before);
      const b = P(after);
      return { P: rel(a, b) < 0.01 ? 'same' : b > a ? 'bigger' : 'smaller' };
    },
    cases: [
      kase(cite('control-volume'), { change: 'cold', gpm: 2.5, tCin: 16, tCset: 48 }, { P: 'bigger' }),
      kase(cite('control-volume'), { change: 'both', gpm: 2.5, tCin: 16, tCset: 48 }, { P: 'same' }),
    ],
  }),
];

export default ch5;
