/**
 * Chapter 2: properties of a pure substance. Water from IAPWS-IF97 (@flux/subjects/thermo).
 * Every version stays in regions 1, 2 and 4 (`covered`). A part a student would read from a table
 * passes `alt`: the value interpolated from Flux's generated table, the way the student does it.
 */
import {
  SAT_P_GRID, SAT_T_GRID, SUPERHEAT_P_GRID, SUPERHEAT_T_GRID, bracket, covered, fromC, lerp, mixP, psat,
  satP, satT, tableInterp, tableInterp2, toC, waterP, waterTP, waterTv,
} from '@flux/subjects/thermo';
import { region1Raw, region2Raw } from '@flux/subjects/thermo/if97.js';
import { celsius, cite, kase, mc, num, problem, range } from '../kit.js';

const KPA = 1e3;
const MPA = 1e6;
const KJ = 1e3;

/** Temperature at which f(T) = p on the saturation line, by bisection on the region 4 equation. */
function tsatByBisection(pPa) {
  let lo = 273.16;
  let hi = 623.15;
  for (let i = 0; i < 80; i++) {
    const mid = (lo + hi) / 2;
    if (psat(mid) * MPA < pPa) lo = mid;
    else hi = mid;
  }
  return (lo + hi) / 2;
}

/**
 * v as ∂g/∂P at constant T, by a central difference on the Gibbs function: a second route to v.
 * A `second` returns each answer in the unit its part asks for.
 */
function vFromGibbs(T, pPa) {
  const f = waterTP(T, pPa).region === 1 ? region1Raw : region2Raw;
  const dp = pPa * 1e-6;
  const g = (p) => f(T, p / MPA).g * KJ;
  return (g(pPa + dp) - g(pPa - dp)) / (2 * dp);
}

/** A saturation-table row, interpolated in T from the generated table the way a student reads it. */
const satRowT = (T, key) => tableInterp((t) => satT(t)[key], SAT_T_GRID, T);
const satRowP = (p, key) => tableInterp((q) => satP(q)[key], SAT_P_GRID, p);

/** All four table cells around (p, T) are superheated vapour, so the double interpolation exists. */
function superheatCellsExist(p, T) {
  const [p0, p1] = bracket(SUPERHEAT_P_GRID, p);
  const [T0, T1] = bracket(SUPERHEAT_T_GRID, T);
  for (const pp of [p0, p1]) {
    for (const TT of [T0, T1]) {
      if (!covered(TT, pp)) return false;
      if (pp <= 16e6 && TT <= satP(pp).T + 1e-9) return false;
    }
  }
  return true;
}

const shV = (p, T) => tableInterp2((pp, TT) => waterTP(TT, pp).v, SUPERHEAT_P_GRID, SUPERHEAT_T_GRID, p, T);
const shH = (p, T) => tableInterp2((pp, TT) => waterTP(TT, pp).h, SUPERHEAT_P_GRID, SUPERHEAT_T_GRID, p, T);

const PHASES = [
  ['liquid', 'compressed liquid'],
  ['mixture', 'saturated mixture'],
  ['vapour', 'superheated vapour'],
];

const ch2 = [
  problem({
    id: 'u1.2.phase',
    title: 'Which phase?',
    exam: 'u1',
    ch: '2',
    lab: 'phase',
    src: cite('phase-diagrams'),
    topics: ['phase'],
    vars: {
      p: range(50, 5000, 50, 'kPa', KPA),
      tC: celsius(20, 400, 5),
    },
    derive: ($) => ({ T: fromC($.tC) }),
    valid: ($) => covered($.T, $.p) && Math.abs($.T - satP($.p).T) > 2,
    text: (T) => String.raw`Water is at $P = ${T.p}$ kPa and $T = ${T.tC}$ °C. What phase is it in?`,
    parts: [mc('phase', PHASES, ($) => (waterTP($.T, $.p).region === 1 ? 'liquid' : 'vapour'), { label: 'phase' })],
    level: 1,
    hints: [
      'Every pressure has one boiling temperature. Find it for this pressure, then compare.',
      String.raw`Below $T_{sat}(P)$ the water is a compressed liquid. Above it, the water is superheated vapour.`,
    ],
    steps: ($, sig) => {
      const Ts = satP($.p).T;
      return [
        String.raw`At $${sig($.p / KPA)}$ kPa, $T_{sat} = ${sig(toC(Ts))}$ °C.`,
        $.T < Ts
          ? String.raw`$${sig($.tC)}$ °C is below it: a compressed liquid.`
          : String.raw`$${sig($.tC)}$ °C is above it: superheated vapour.`,
      ];
    },
    // Second route: compare the pressure with p_sat at this temperature instead.
    second: ($) => ({ phase: $.T <= 623.15 && $.p > psat($.T) * MPA ? 'liquid' : 'vapour' }),
    sim: {
      scenario: 'boil',
      setup(s, $) {
        s.p = $.p;
        s.h = waterTP($.T, $.p).h;
      },
      read: (c) => ({ phase: c.phase }),
    },
    cases: [
      kase(cite('phase-diagrams'), { p: 500, tC: 200 }, { phase: 'vapour' }),
      kase(cite('phase-diagrams'), { p: 2000, tC: 150 }, { phase: 'liquid' }),
    ],
  }),

  problem({
    id: 'u1.2.tank-quality',
    title: 'Quality in a rigid tank',
    exam: 'u1',
    ch: '2',
    lab: 'phase',
    src: cite('quality'),
    topics: ['quality', 'tables'],
    vars: {
      V: range(0.1, 2, 0.1, 'm³'),
      m: range(2, 40, 1, 'kg'),
      tC: celsius(31, 299, 2),
    },
    derive: ($) => ({ T: fromC($.tC), v: $.V / $.m }),
    valid: ($) => {
      const s = satT($.T);
      return $.v > s.vf + 0.05 * (s.vg - s.vf) && $.v < s.vg - 0.05 * (s.vg - s.vf);
    },
    text: (T) => String.raw`A rigid tank of ${T.V} m³ holds ${T.m} kg of water at ${T.tC} °C, part liquid and part vapour. Find the pressure in the tank and the quality.`,
    parts: [
      num('p', ($) => satT($.T).p, 'kPa', { scale: KPA, tol: 0.003, label: 'pressure', alt: ($) => satRowT($.T, 'p') / KPA }),
      num('x', ($) => {
        const s = satT($.T);
        return ($.v - s.vf) / (s.vg - s.vf);
      }, '', {
        tol: 0.005,
        label: 'quality',
        alt: ($) => ($.v - satRowT($.T, 'vf')) / (satRowT($.T, 'vg') - satRowT($.T, 'vf')),
      }),
    ],
    level: 2,
    hints: [
      'Both phases are present, so the tank is on the saturation line: the temperature fixes the pressure.',
      String.raw`Find $v = V/m$, then $x = (v - v_f)/(v_g - v_f)$ from the saturation table at this temperature.`,
    ],
    steps: ($, sig) => {
      const s = satT($.T);
      const x = ($.v - s.vf) / (s.vg - s.vf);
      return [
        String.raw`$v = V/m = ${sig($.V)}/${sig($.m)} = ${sig($.v)}$ m³/kg.`,
        String.raw`At ${sig($.tC)} °C: $P_{sat} = ${sig(s.p / KPA)}$ kPa, $v_f = ${sig(s.vf)}$, $v_g = ${sig(s.vg)}$ m³/kg.`,
        String.raw`$x = \dfrac{${sig($.v)} - ${sig(s.vf)}}{${sig(s.vg)} - ${sig(s.vf)}} = ${sig(x)}$.`,
        String.raw`Read from the table, interpolating between rows, the answers are $${sig(satRowT($.T, 'p') / KPA)}$ kPa and $${sig(($.v - satRowT($.T, 'vf')) / (satRowT($.T, 'vg') - satRowT($.T, 'vf')))}$. Both are accepted.`,
      ];
    },
    second: ($) => {
      const st = waterTv($.T, $.v);
      return { p: st.p / KPA, x: st.x };
    },
    sim: {
      scenario: 'tank',
      setup(s, $) {
        s.T = $.T;
        s.v = $.v;
      },
      read: (c) => ({ p: c.p, x: c.x }),
    },
    cases: [kase(cite('quality'), { V: 0.5, m: 10, tC: 151 }, { p: 489.0, x: 0.1281 })],
  }),

  problem({
    id: 'u1.2.mixture',
    title: 'A mixture at a given pressure',
    exam: 'u1',
    ch: '2',
    lab: 'phase',
    src: cite('property-tables'),
    topics: ['quality', 'tables'],
    vars: {
      p: range(110, 990, 20, 'kPa', KPA),
      x: range(0.1, 0.9, 0.05, ''),
    },
    text: (T) => String.raw`Water at $P = ${T.p}$ kPa is a saturated mixture with quality $x = ${T.x}$. Find its temperature, specific volume and enthalpy.`,
    parts: [
      num('T', ($) => toC(mixP($.p, $.x).T), '°C', { tol: 0.002, label: 'temperature', alt: ($) => toC(satRowP($.p, 'T')) }),
      num('v', ($) => mixP($.p, $.x).v, 'm³/kg', {
        tol: 0.003,
        label: 'specific volume',
        alt: ($) => satRowP($.p, 'vf') + $.x * (satRowP($.p, 'vg') - satRowP($.p, 'vf')),
      }),
      num('h', ($) => mixP($.p, $.x).h, 'kJ/kg', {
        scale: KJ,
        tol: 0.002,
        label: 'enthalpy',
        alt: ($) => (satRowP($.p, 'hf') + $.x * satRowP($.p, 'hfg')) / KJ,
      }),
    ],
    level: 1,
    hints: [
      'A saturated mixture sits at the boiling temperature of its pressure. Use the saturation table by pressure.',
      String.raw`Each property is $y = y_f + x\,(y_g - y_f)$, with $y_f$ and $y_g$ from the same row.`,
    ],
    steps: ($, sig) => {
      const s = satP($.p);
      const m = mixP($.p, $.x);
      return [
        String.raw`At $${sig($.p / KPA)}$ kPa: $T_{sat} = ${sig(toC(s.T))}$ °C, $v_f = ${sig(s.vf)}$, $v_g = ${sig(s.vg)}$ m³/kg, $h_f = ${sig(s.hf / KJ)}$, $h_{fg} = ${sig(s.hfg / KJ)}$ kJ/kg.`,
        String.raw`$v = ${sig(s.vf)} + ${sig($.x)}(${sig(s.vg)} - ${sig(s.vf)}) = ${sig(m.v)}$ m³/kg.`,
        String.raw`$h = ${sig(s.hf / KJ)} + ${sig($.x)}(${sig(s.hfg / KJ)}) = ${sig(m.h / KJ)}$ kJ/kg.`,
      ];
    },
    // Second routes: T by bisection on p_sat(T); v weighted by mass; h as u + P v.
    second: ($) => {
      const s = satP($.p);
      const u = s.uf + $.x * s.ufg;
      const v = (1 - $.x) * s.vf + $.x * s.vg;
      return { T: toC(tsatByBisection($.p)), v, h: (u + $.p * v) / KJ };
    },
    sim: {
      scenario: 'boil',
      setup(s, $) {
        s.p = $.p;
        s.h = mixP($.p, $.x).h;
      },
      read: (c) => ({ T: toC(c.T), v: c.v, h: c.h }),
    },
    cases: [kase(cite('property-tables'), { p: 450, x: 0.6 }, { T: 147.9, v: 0.2488, h: 1895 })],
  }),

  problem({
    id: 'u1.2.superheat',
    title: 'Superheated steam from the table',
    exam: 'u1',
    ch: '2',
    lab: 'phase',
    src: cite('property-tables'),
    topics: ['superheated', 'interpolation'],
    vars: {
      // From 0.25 MPa up, the pressure blocks are close enough that a straight line in P stays within a few percent.
      p: range(0.25, 4.5, 0.05, 'MPa', MPA),
      tC: celsius(205, 745, 10),
    },
    derive: ($) => ({ T: fromC($.tC) }),
    valid: ($) => covered($.T, $.p) && $.T > satP($.p).T + 20 && superheatCellsExist($.p, $.T),
    text: (T) => String.raw`Steam is at $P = ${T.p}$ MPa and $T = ${T.tC}$ °C. Find its specific volume and enthalpy.`,
    parts: [
      num('v', ($) => waterTP($.T, $.p).v, 'm³/kg', { tol: 0.003, label: 'specific volume', alt: ($) => shV($.p, $.T) }),
      num('h', ($) => waterTP($.T, $.p).h, 'kJ/kg', { scale: KJ, tol: 0.002, label: 'enthalpy', alt: ($) => shH($.p, $.T) / KJ }),
    ],
    level: 2,
    hints: [
      String.raw`Compare $T$ with $T_{sat}$ at this pressure first, to know which table to open.`,
      'The temperature falls between two rows and the pressure between two blocks. Interpolate in temperature within each block, then between the blocks.',
    ],
    steps: ($, sig) => {
      const st = waterTP($.T, $.p);
      const [p0, p1] = bracket(SUPERHEAT_P_GRID, $.p);
      const [T0, T1] = bracket(SUPERHEAT_T_GRID, $.T);
      return [
        String.raw`$T_{sat}$ at $${sig($.p / MPA)}$ MPa is $${sig(toC(satP($.p).T))}$ °C, below $${sig($.tC)}$ °C: superheated.`,
        String.raw`The table rows around it: $${sig(p0 / MPA)}$ and $${sig(p1 / MPA)}$ MPa, $${sig(toC(T0))}$ and $${sig(toC(T1))}$ °C. Interpolating gives $v = ${sig(shV($.p, $.T))}$ m³/kg and $h = ${sig(shH($.p, $.T) / KJ)}$ kJ/kg.`,
        String.raw`IAPWS-IF97 at the state itself: $v = ${sig(st.v)}$ m³/kg, $h = ${sig(st.h / KJ)}$ kJ/kg. Both answers are accepted.`,
      ];
    },
    // Second routes: v as ∂g/∂P; h as u + P v.
    second: ($) => {
      const st = waterTP($.T, $.p);
      return { v: vFromGibbs($.T, $.p), h: (st.u + $.p * st.v) / KJ };
    },
    sim: {
      scenario: 'boil',
      setup(s, $) {
        s.p = $.p;
        s.h = waterTP($.T, $.p).h;
      },
      read: (c) => ({ v: c.v, h: c.h }),
    },
    cases: [kase(cite('property-tables'), { p: 0.9, tC: 275 }, { v: 0.2736, h: 3001 })],
  }),

  problem({
    id: 'u1.2.find-T',
    title: 'Temperature from pressure and enthalpy',
    exam: 'u1',
    ch: '2',
    lab: 'phase',
    src: cite('interpolation'),
    topics: ['superheated', 'interpolation'],
    vars: {
      p: range(0.2, 4, 0.1, 'MPa', MPA),
      tTrue: celsius(215, 705, 10),
    },
    // The enthalpy is printed to 0.1 kJ/kg; the answer is the temperature that gives that printed value.
    derive: ($) => ({ H: Math.round(waterTP(fromC($.tTrue), $.p).h / 100) * 100 }),
    valid: ($) => {
      const T = fromC($.tTrue);
      return covered(T, $.p) && T > satP($.p).T + 20 && superheatCellsExist($.p, T);
    },
    text: (T, $, sig) => String.raw`Steam at $P = ${T.p}$ MPa has $h = ${sig($.H / KJ, 5)}$ kJ/kg. Find its temperature.`,
    parts: [
      num('T', ($) => toC(waterP($.p, 'h', $.H).T), '°C', {
        tol: 0.004,
        label: 'temperature',
        alt: ($) => {
          // Interpolate T between the table rows whose h brackets the given h, at the bracketing pressures.
          const atP = (pp) => {
            const rows = SUPERHEAT_T_GRID.filter((TT) => covered(TT, pp) && (pp > 16e6 || TT > satP(pp).T));
            for (let i = 0; i < rows.length - 1; i++) {
              const h0 = waterTP(rows[i], pp).h;
              const h1 = waterTP(rows[i + 1], pp).h;
              if ($.H >= h0 && $.H <= h1) return lerp(h0, rows[i], h1, rows[i + 1], $.H);
            }
            return NaN;
          };
          const [p0, p1] = bracket(SUPERHEAT_P_GRID, $.p);
          return toC(lerp(p0, atP(p0), p1, atP(p1), $.p));
        },
      }),
    ],
    level: 3,
    hints: [
      String.raw`Compare $h$ with $h_g$ at this pressure first: it tells you which table holds the state.`,
      String.raw`In the superheated table, find the two rows whose $h$ brackets the given value, then interpolate $T$ linearly in $h$.`,
      'When the pressure falls between two blocks, do that in each block, then interpolate the two temperatures in pressure.',
    ],
    steps: ($, sig) => {
      const T = waterP($.p, 'h', $.H).T;
      return [
        String.raw`$h_g$ at $${sig($.p / MPA)}$ MPa is $${sig(satP($.p).hg / KJ)}$ kJ/kg, below the given $h$: superheated.`,
        String.raw`Solving $h(T, P) = ${sig($.H / KJ, 5)}$ kJ/kg gives $T = ${sig(toC(T))}$ °C.`,
      ];
    },
    // Second route: bisection on h(T) at this pressure.
    second: ($) => {
      let lo = satP($.p).T;
      let hi = 1073.15;
      for (let i = 0; i < 80; i++) {
        const mid = (lo + hi) / 2;
        if (waterTP(mid, $.p).h < $.H) lo = mid;
        else hi = mid;
      }
      return { T: toC((lo + hi) / 2) };
    },
    cases: [kase(cite('interpolation'), { p: 1.4, tTrue: 325 }, { T: 325.0 })],
  }),
];

export default ch2;
