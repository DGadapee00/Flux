/**
 * Chapter 3: ideal and real gases. Air is the NASA-polynomial mixture in @flux/subjects/thermo
 * (R = R̄/M with M = 28.965 g/mol); steam is IAPWS-IF97. English units go through convert.js.
 */
import { J_PER_FT_LBF, KG_PER_LBM, K_PER_R, M_PER_FT, PA_PER_PSI } from '@flux/subjects/convert.js';
import {
  R_UNIVERSAL, R_WATER, SUPERHEAT_P_GRID, SUPERHEAT_T_GRID, covered, fromC, fromF, gas, molarMass, satP, tableInterp2, toF, waterTP,
} from '@flux/subjects/thermo';
import { region2Raw } from '@flux/subjects/thermo/if97.js';
import { celsius, choice, cite, fahrenheit, kase, mc, num, problem, range } from '../kit.js';

const AIR = gas('air');
const KPA = 1e3;
const MPA = 1e6;
const FT3 = M_PER_FT ** 3;

/** R of air in ft·lbf/(lbm·R), built from R̄ and M in English units: the second route. */
const R_AIR_ENGLISH = (R_UNIVERSAL / molarMass('air')) * (KG_PER_LBM * K_PER_R) / J_PER_FT_LBF;

/** v as ∂g/∂P along region 2, by a central difference: a second route to Z. */
function vFromGibbs(T, pPa) {
  const dp = pPa * 1e-6;
  const g = (p) => region2Raw(T, p / MPA).g * 1e3;
  return (g(pPa + dp) - g(pPa - dp)) / (2 * dp);
}

/** Grid pressures up to 4 MPa, in MPa. */
const GRID_MPA = SUPERHEAT_P_GRID.filter((p) => p <= 4e6).map((p) => Number((p / MPA).toPrecision(6)));

const zTable = (p, T) => (p * tableInterp2((pp, TT) => waterTP(TT, pp).v, SUPERHEAT_P_GRID, SUPERHEAT_T_GRID, p, T)) / (R_WATER * 1e3 * T);

const ch3 = [
  problem({
    id: 'u1.3.air-mass',
    title: 'Mass of air in a tank',
    exam: 'u1',
    ch: '3',
    lab: null,
    src: cite('ideal-gas'),
    topics: ['ideal-gas'],
    variety: ['unknown'],
    vars: {
      V: range(0.2, 5, 0.2, 'm³'),
      p: range(100, 1000, 25, 'kPa', KPA),
      tC: celsius(-20, 150, 5),
    },
    derive: ($) => ({ T: fromC($.tC) }),
    text: (T) => String.raw`A ${T.V} m³ tank holds air at $${T.p}$ kPa and ${T.tC} °C. Treat the air as an ideal gas. Find its mass.`,
    parts: [num('m', ($) => ($.p * $.V) / (AIR.R * $.T), 'kg', {
      tol: 0.005,
      label: 'mass',
      traps: [
        [($) => ($.p * $.V) / (AIR.R * $.tC), 'The ideal-gas law needs kelvin. °C was used.'],
        [($) => (($.p - 101325) * $.V) / (AIR.R * $.T), 'That used gauge pressure. The law needs absolute pressure.'],
      ],
    })],
    level: 1,
    hints: [
      String.raw`The ideal-gas law relates pressure, volume, mass and temperature: $PV = mRT$.`,
      String.raw`Use absolute pressure in kPa, volume in m³, temperature in kelvins, and $R = 0.2870$ kJ/(kg·K) for air.`,
    ],
    steps: ($, sig) => [
      String.raw`$T = ${sig($.tC)} + 273.15 = ${sig($.T)}$ K.`,
      String.raw`$m = \dfrac{PV}{RT} = \dfrac{${sig($.p / KPA)} \times ${sig($.V)}}{${sig(AIR.R / 1e3)} \times ${sig($.T)}} = ${sig(($.p * $.V) / (AIR.R * $.T))}$ kg.`,
    ],
    // Second route: moles from R̄, then mass from the molar mass.
    second: ($) => ({ m: (($.p * $.V) / (R_UNIVERSAL * $.T)) * molarMass('air') }),
    cases: [kase(cite('ideal-gas'), { V: 2, p: 400, tC: 25 }, { m: 9.347 })],
  }),

  problem({
    id: 'u1.3.air-mass-english',
    title: 'Air in a tank, English units',
    exam: 'u1',
    ch: '3',
    lab: null,
    src: cite('ideal-gas'),
    topics: ['ideal-gas', 'english'],
    variety: ['representation'],
    vars: {
      V: range(5, 100, 5, 'ft³'),
      p: range(20, 200, 5, 'psia', PA_PER_PSI),
      tF: fahrenheit(-20, 300, 10),
    },
    derive: ($) => ({ T: fromF($.tF) }),
    text: (T) => String.raw`A tank of ${T.V} ft³ holds air at ${T.p} psia and ${T.tF} °F. Treat the air as an ideal gas. Find its mass in pounds-mass.`,
    parts: [num('m', ($) => ($.p * $.V * FT3) / (AIR.R * $.T), 'lbm', {
      scale: KG_PER_LBM,
      tol: 0.005,
      label: 'mass',
      traps: [
        [($) => {
          const mLbm = (($.p / PA_PER_PSI) * 144 * $.V) / (R_AIR_ENGLISH * $.tF);
          return mLbm * KG_PER_LBM;
        }, 'Temperature in the English gas law is rankine, °F + 459.67.'],
        [($) => {
          const psig = $.p / PA_PER_PSI - 101325 / PA_PER_PSI;
          const mLbm = (psig * 144 * $.V) / (R_AIR_ENGLISH * ($.tF + 459.67));
          return mLbm * KG_PER_LBM;
        }, 'psia was treated as gauge. Subtract one atmosphere only when the given pressure is gauge.'],
      ],
    })],
    level: 1,
    hints: [
      String.raw`The ideal-gas law $PV = mRT$ holds in any consistent set of units.`,
      String.raw`In English units: $P$ in lbf/ft² (psia × 144), $V$ in ft³, $T$ in rankines (°F + 459.67), and $R = 53.35$ ft·lbf/(lbm·R) for air.`,
    ],
    steps: ($, sig) => {
      const TR = $.tF + 459.67;
      const m = ($.p / PA_PER_PSI) * 144 * $.V / (R_AIR_ENGLISH * TR);
      return [
        String.raw`$T = ${sig($.tF)} + 459.67 = ${sig(TR)}$ R; $P = ${sig($.p / PA_PER_PSI)} \times 144 = ${sig(($.p / PA_PER_PSI) * 144)}$ lbf/ft².`,
        String.raw`$m = \dfrac{PV}{RT} = \dfrac{${sig(($.p / PA_PER_PSI) * 144)} \times ${sig($.V)}}{${sig(R_AIR_ENGLISH)} \times ${sig(TR)}} = ${sig(m)}$ lbm.`,
      ];
    },
    // Second route: the whole calculation in English units, with R from R̄/M converted exactly.
    second: ($) => ({ m: (($.p / PA_PER_PSI) * 144 * $.V) / (R_AIR_ENGLISH * ($.tF + 459.67)) }),
    cases: [kase(cite('ideal-gas'), { V: 40, p: 100, tF: 80 }, { m: 20.01 })],
  }),

  problem({
    id: 'u1.3.tank-heated',
    title: 'Pressure in a heated tank',
    exam: 'u1',
    ch: '3',
    lab: null,
    src: cite('ideal-gas'),
    topics: ['ideal-gas', 'english'],
    variety: ['unknown'],
    vars: {
      p1: range(15, 150, 5, 'psia', PA_PER_PSI),
      t1: fahrenheit(20, 120, 5),
      t2: fahrenheit(150, 600, 10),
    },
    derive: ($) => ({ T1: fromF($.t1), T2: fromF($.t2) }),
    text: (T) => String.raw`A rigid tank holds air at ${T.p1} psia and ${T.t1} °F. It is heated to ${T.t2} °F. Treat the air as an ideal gas. Find the final pressure.`,
    parts: [num('p2', ($) => ($.p1 * $.T2) / $.T1, 'psia', {
      scale: PA_PER_PSI,
      tol: 0.005,
      label: 'final pressure',
      traps: [
        [($) => $.p1 * ($.t2 / $.t1), 'The ratio uses rankine, not °F. Add 459.67 to each temperature.'],
        [($) => ($.p1 - 101325) * ($.T2 / $.T1), 'The given pressure is absolute. Subtracting one atmosphere treats it as gauge.'],
      ],
    })],
    level: 1,
    hints: [
      'The tank is rigid and closed, so the mass and the volume stay the same.',
      String.raw`With $m$, $R$ and $V$ fixed, $P/T$ is constant. Use absolute temperatures in rankines.`,
    ],
    steps: ($, sig) => [
      String.raw`$T_1 = ${sig($.t1 + 459.67)}$ R and $T_2 = ${sig($.t2 + 459.67)}$ R.`,
      String.raw`$P_2 = P_1 \dfrac{T_2}{T_1} = ${sig($.p1 / PA_PER_PSI)} \times \dfrac{${sig($.t2 + 459.67)}}{${sig($.t1 + 459.67)}} = ${sig(($.p1 * $.T2) / $.T1 / PA_PER_PSI)}$ psia.`,
    ],
    // Second route: find the mass at state 1 for a 1 ft³ tank, then the pressure at state 2.
    second: ($) => {
      const V = FT3;
      const m = ($.p1 * V) / (AIR.R * $.T1);
      return { p2: (m * AIR.R * $.T2) / V / PA_PER_PSI };
    },
    cases: [kase(cite('ideal-gas'), { p1: 50, t1: 70, t2: 400 }, { p2: 81.15 })],
  }),

  problem({
    id: 'u1.3.steam-z',
    title: 'Is steam an ideal gas here?',
    exam: 'u1',
    ch: '3',
    lab: 'phase',
    src: cite('compressibility'),
    topics: ['compressibility', 'superheated'],
    variety: ['representation'],
    // Pressures on the table grid: the student reads one block and interpolates only in T. Between
    // low-pressure blocks v ∝ 1/P, and a straight line in P would be off by up to 12%.
    vars: {
      pMPa: choice(...GRID_MPA.map((v) => [v, String(v)])),
      tC: celsius(200, 700, 25),
    },
    derive: ($) => ({ T: fromC($.tC), p: $.pMPa * MPA }),
    valid: ($) => {
      if (!covered($.T, $.p) || $.T < satP(Math.min($.p, 16e6)).T + 20) return false;
      const z = ($.p * waterTP($.T, $.p).v) / (R_WATER * 1e3 * $.T);
      // Keep clear of the 1% line, so the yes/no part has one answer whichever way it is computed.
      return Math.abs(1 - z - 0.01) > 0.0015;
    },
    text: (T) => String.raw`Steam is at $P = ${T.pMPa}$ MPa and $T = ${T.tC}$ °C. Find its compressibility factor $Z = Pv/RT$, and say whether the ideal-gas law gives $v$ within 1%.`,
    parts: [
      num('Z', ($) => ($.p * waterTP($.T, $.p).v) / (R_WATER * 1e3 * $.T), '', {
        tol: 0.002,
        label: 'compressibility factor Z',
        alt: ($) => zTable($.p, $.T),
        traps: [
          [($) => ($.p * waterTP($.T, $.p).v) / (AIR.R * $.T), 'That used air\'s R. For water use 0.4615 kJ/(kg·K).'],
          [($) => ($.p * waterTP($.T, $.p).v) / (R_WATER * $.T), 'R for water is 0.4615 kJ/(kg·K), which is 461.5 J/(kg·K). The units were short by 1000.'],
        ],
      }),
      mc('ideal', [
        ['yes', 'yes, within 1%', 'Z is within 1% of 1, so the ideal-gas specific volume is within 1% of the table.'],
        ['no', 'no', 'Z is more than 1% away from 1, so the ideal-gas law misses the table volume by more than that.'],
      ], ($) => (Math.abs(1 - ($.p * waterTP($.T, $.p).v) / (R_WATER * 1e3 * $.T)) < 0.01 ? 'yes' : 'no'), {
        label: 'ideal within 1%?',
      }),
    ],
    level: 2,
    hints: [
      String.raw`$Z$ compares the real specific volume with the ideal-gas one at the same $P$ and $T$.`,
      String.raw`Read $v$ from the superheated table, then $Z = Pv/(RT)$ with $R = 0.4615$ kJ/(kg·K) for water. $|1 - Z| < 0.01$ means within 1%.`,
    ],
    steps: ($, sig) => {
      const v = waterTP($.T, $.p).v;
      const z = ($.p * v) / (R_WATER * 1e3 * $.T);
      return [
        String.raw`From the table, $v = ${sig(v)}$ m³/kg.`,
        String.raw`$Z = \dfrac{${sig($.p / KPA)} \times ${sig(v)}}{${sig(R_WATER)} \times ${sig($.T)}} = ${sig(z)}$.`,
        Math.abs(1 - z) < 0.01 ? String.raw`$|1 - Z| < 0.01$: the ideal-gas law is within 1%.` : String.raw`$|1 - Z| \ge 0.01$: the ideal-gas law is off by more than 1%.`,
      ];
    },
    // Second route: v as ∂g/∂P instead of the formulation's v.
    second: ($) => {
      const z = ($.p * vFromGibbs($.T, $.p)) / (R_WATER * 1e3 * $.T);
      return { Z: z, ideal: Math.abs(1 - z) < 0.01 ? 'yes' : 'no' };
    },
    sim: {
      scenario: 'boil',
      setup(s, $) {
        s.p = $.p;
        s.h = waterTP($.T, $.p).h;
      },
      read: (c) => ({ Z: (c.p * c.v) / (R_WATER * 1e3 * c.T) }),
    },
    cases: [
      kase(cite('compressibility'), { pMPa: 0.1, tC: 300 }, { Z: 0.9976, ideal: 'yes' }),
      kase(cite('compressibility'), { pMPa: 3, tC: 300 }, { Z: 0.9206, ideal: 'no' }),
    ],
  }),

  problem({
    id: 'u1.3.air-density',
    title: 'Density of air',
    exam: 'u1',
    ch: '3',
    lab: null,
    src: cite('ideal-gas'),
    topics: ['ideal-gas'],
    variety: ['unknown'],
    vars: {
      p: range(60, 200, 2, 'kPa', KPA),
      tC: celsius(-50, 60, 2),
    },
    derive: ($) => ({ T: fromC($.tC) }),
    text: (T) => String.raw`Find the density of air at $${T.p}$ kPa and ${T.tC} °C, as an ideal gas.`,
    parts: [num('rho', ($) => $.p / (AIR.R * $.T), 'kg/m³', {
      tol: 0.005,
      label: 'density',
      traps: [
        [($) => $.p / (AIR.R * $.tC), 'Density from the ideal-gas law needs kelvin. °C was used.'],
        [($) => ($.p - 101325) / (AIR.R * $.T), 'That used gauge pressure. Density needs the absolute pressure.'],
      ],
    })],
    level: 1,
    hints: [
      String.raw`Density is mass per volume, so divide the ideal-gas law by $V$.`,
      String.raw`$\rho = P/(RT)$, with $T$ in kelvins and $R = 0.2870$ kJ/(kg·K).`,
    ],
    steps: ($, sig) => [
      String.raw`$\rho = \dfrac{P}{RT} = \dfrac{${sig($.p / KPA)}}{${sig(AIR.R / 1e3)} \times ${sig($.T)}} = ${sig($.p / (AIR.R * $.T))}$ kg/m³.`,
    ],
    // Second route: molar concentration P/(R̄T) times the molar mass.
    second: ($) => ({ rho: ($.p / (R_UNIVERSAL * $.T)) * molarMass('air') }),
    cases: [kase(cite('ideal-gas'), { p: 101, tC: 15 }, { rho: 1.221 })],
  }),

  problem({
    id: 'u1.3.slip',
    title: 'Which way the density moves',
    kind: 'conceptual',
    exam: 'u1',
    ch: '3',
    lab: null,
    src: cite('ideal-gas'),
    topics: ['ideal-gas'],
    variety: ['representation'],
    vars: {
      p: range(120, 300, 10, 'kPa', KPA),
      tC: celsius(10, 50, 5),
      fault: choice(['celsius', 'the Celsius temperature'], ['gauge', 'the gauge pressure']),
    },
    derive: ($) => ({ T: fromC($.tC) }),
    text: (T) => (T.fault === 'the Celsius temperature'
      ? String.raw`Air at $${T.p}$ kPa and ${T.tC} °C. A density is computed from $\rho = P/(RT)$ with $T = ${T.tC}$ instead of the kelvin temperature. Compared with the true density, that result is`
      : String.raw`Air at $${T.p}$ kPa absolute and ${T.tC} °C. A density is computed with the gauge pressure, $${T.p} - 101.3$ kPa, in place of the absolute pressure. Compared with the true density, that result is`),
    parts: [mc('dir', [
      ['higher', 'higher', 'Dividing by a Celsius temperature, far below the kelvin value, inflates the density.'],
      ['lower', 'lower', 'Gauge pressure is smaller than absolute pressure, so the density comes out low.'],
      ['same', 'the same', 'The number substituted for T or P is not the absolute value the law uses, so the density moves.'],
    ], ($) => ($.fault === 'celsius' ? 'higher' : 'lower'), { label: 'the mistaken density is' })],
    level: 2,
    hints: [
      'The ideal-gas density is P/(RT), with absolute pressure and absolute temperature.',
      'A smaller denominator raises a fraction. A smaller numerator lowers it.',
    ],
    steps: ($, sig) => {
      const truth = $.p / (AIR.R * $.T);
      const wrong = $.fault === 'celsius' ? $.p / (AIR.R * $.tC) : ($.p - 101325) / (AIR.R * $.T);
      return [
        String.raw`True density: ${sig(truth)} kg/m³. The mistaken substitution gives ${sig(wrong)} kg/m³.`,
        wrong > truth ? 'The mistaken density is higher.' : 'The mistaken density is lower.',
      ];
    },
    second: ($) => {
      const truth = $.p / (AIR.R * $.T);
      const wrong = $.fault === 'celsius' ? $.p / (AIR.R * $.tC) : ($.p - 101325) / (AIR.R * $.T);
      return { dir: wrong > truth ? 'higher' : 'lower' };
    },
    cases: [
      kase(cite('ideal-gas'), { p: 200, tC: 25, fault: 'celsius' }, { dir: 'higher' }),
      kase(cite('ideal-gas'), { p: 200, tC: 25, fault: 'gauge' }, { dir: 'lower' }),
    ],
  }),
];

export default ch3;
