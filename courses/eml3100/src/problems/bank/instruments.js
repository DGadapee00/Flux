/**
 * Manometer and closed-system balance. Water density is IAPWS-IF97 at 20 °C and 101325 Pa.
 * Mercury is Cook's 13545.854 kg/m³ at 20 °C and 1 atm. Heights, heater inputs and the chain
 * power are the lab's choices. No OCW solution is posted, so each case is a Flux computation.
 */
import { G_STANDARD } from '@flux/subjects/convert.js';
import {
  closedEnergy, fromC, integratedBalance, manometerGauge, seriesEfficiency, waterTP,
} from '@flux/subjects/thermo';
import { choice, cite, kase, mc, num, problem, range } from '../kit.js';

const P_ATM = 101325;
const RHO_HG = 13545.854;
const KPA = 1e3;
const KJ = 1e3;

const rhoWater = () => 1 / waterTP(fromC(20), P_ATM).v;

/** ∫ ρ g dz by Simpson's rule. Density is constant, so this equals ρ g z. */
function columnHead(rho, drop) {
  const span = Math.abs(drop);
  if (span === 0) return 0;
  const n = 80;
  const h = span / n;
  const f = () => rho * G_STANDARD;
  let sum = f() + f();
  for (let i = 1; i < n; i++) sum += (i % 2 ? 4 : 2) * f();
  return Math.sign(drop) * (sum * h) / 3;
}

const instruments = [
  problem({
    id: 'u1.2.utube',
    title: 'Absolute pressure from a water U-tube',
    exam: 'u1',
    ch: '2',
    lab: 'manometer',
    src: cite('properties'),
    topics: ['properties'],
    variety: ['unknown'],
    vars: {
      hCm: range(8, 80, 1, 'cm', 0.01),
    },
    derive: ($) => {
      const rho = rhoWater();
      const gauge = manometerGauge([{ rho, drop: $.hCm }], G_STANDARD);
      return { rho, gauge, pAbs: P_ATM + gauge };
    },
    text: (T) => String.raw`A water U-tube is open to the atmosphere. The open side stands ${T.hCm} cm above the tank side. The water is at 20 °C. Find the absolute pressure in the tank.`,
    parts: [
      num('p', ($) => $.pAbs, 'kPa', {
        scale: KPA,
        label: 'absolute pressure',
        traps: [
          [($) => $.gauge, 'That is the gauge pressure. Add the atmosphere, 101.325 kPa.'],
          [($) => P_ATM - $.gauge, 'The open side is higher, so the tank is above the atmosphere, not below it.'],
        ],
      }),
    ],
    level: 1,
    hints: [
      'The gauge pressure of a still liquid is density times gravity times the vertical drop. Absolute pressure adds the atmosphere.',
      'Downward is the positive direction. The tube diameter does not enter.',
    ],
    steps: ($, sig) => [
      String.raw`At 20 °C, $\rho = ${sig($.rho)}$ kg/m³.`,
      String.raw`$P_\mathrm{gauge} = \rho g z = ${sig($.gauge / KPA)}$ kPa.`,
      String.raw`$P = 101.325 + ${sig($.gauge / KPA)} = ${sig($.pAbs / KPA)}$ kPa.`,
    ],
    second: ($) => ({ p: (P_ATM + columnHead($.rho, $.hCm)) / KPA }),
    sim: {
      scenario: 'utube',
      setup(s, $) { s.hCm = $.hCm * 100; },
      read: (c) => ({ p: c.pAbs }),
    },
    cases: [kase(cite('properties'), { hCm: 20 }, { p: 103.283 })],
  }),

  problem({
    id: 'u1.2.multifluid',
    title: 'Absolute pressure with mercury and water',
    exam: 'u1',
    ch: '2',
    lab: 'manometer',
    src: cite('properties'),
    topics: ['properties'],
    variety: ['configuration'],
    vars: {
      hmMm: range(20, 100, 1, 'mm', 0.001),
      hwCm: range(5, 30, 1, 'cm', 0.01),
    },
    derive: ($) => {
      const rho = rhoWater();
      const legs = [
        { rho: RHO_HG, drop: $.hmMm },
        { rho, drop: -$.hwCm },
      ];
      const gauge = manometerGauge(legs, G_STANDARD);
      return { rho, legs, gauge, pAbs: P_ATM + gauge };
    },
    text: (T) => String.raw`A manometer leaves the atmosphere, descends ${T.hmMm} mm through mercury, then rises ${T.hwCm} cm through water at 20 °C. Find the absolute pressure at the far end.`,
    parts: [
      num('p', ($) => $.pAbs, 'kPa', {
        scale: KPA,
        label: 'absolute pressure',
        traps: [
          [($) => P_ATM + manometerGauge([{ rho: RHO_HG, drop: $.hmMm }, { rho: $.rho, drop: $.hwCm }], G_STANDARD), 'The water leg rises, so its head is subtracted. Adding both heads walks the wrong way.'],
          [($) => P_ATM + manometerGauge([{ rho: $.rho, drop: $.hmMm }, { rho: RHO_HG, drop: -$.hwCm }], G_STANDARD), 'Mercury is the dense leg. Swapping the two densities assigns the long head to the wrong fluid.'],
        ],
      }),
    ],
    level: 3,
    hints: [
      'Walk from the open end. A descending leg adds ρ g z and a rising leg subtracts it. Then add the atmosphere.',
      'Mercury is much denser than water. The distance along the glass does not appear, only the vertical drop.',
    ],
    steps: ($, sig) => {
      const hg = RHO_HG * G_STANDARD * $.hmMm;
      const hw = $.rho * G_STANDARD * $.hwCm;
      return [
        String.raw`Mercury, descending: $\rho g z = ${sig(hg / KPA)}$ kPa.`,
        String.raw`Water, rising: $\rho g z = ${sig(hw / KPA)}$ kPa, subtracted.`,
        String.raw`$P = 101.325 + ${sig(hg / KPA)} - ${sig(hw / KPA)} = ${sig($.pAbs / KPA)}$ kPa.`,
      ];
    },
    second: ($) => ({ p: (P_ATM + columnHead($.legs[0].rho, $.legs[0].drop) + columnHead($.legs[1].rho, $.legs[1].drop)) / KPA }),
    sim: {
      scenario: 'multi',
      setup(s, $) {
        s.hmMm = $.hmMm * 1000;
        s.hwCm = $.hwCm * 100;
      },
      read: (c) => ({ p: c.pAbs }),
    },
    cases: [kase(cite('properties'), { hmMm: 40, hwCm: 12 }, { p: 105.464 })],
  }),

  problem({
    id: 'u1.2.tube-width',
    title: 'What changes a manometer reading',
    kind: 'conceptual',
    exam: 'u1',
    ch: '2',
    lab: 'manometer',
    src: cite('properties'),
    topics: ['properties'],
    variety: ['configuration'],
    vars: {
      hCm: range(15, 60, 1, 'cm', 0.01),
      move: choice(
        ['wide', 'widen the tube from 8 mm to 25 mm'],
        ['tall', 'double the vertical column'],
        ['tilt', 'tip the tube from vertical down to 30° above horizontal, keeping the length along the tube'],
      ),
    },
    text: (T) => String.raw`A water column of ${T.hCm} cm reads a gauge pressure. You ${T.move}. The gauge pressure is`,
    parts: [mc('effect', [
      ['same', 'unchanged', 'The bore cancels when the column weight is divided by the area. Width is not in ρ g z.'],
      ['double', 'doubled', 'Gauge pressure is proportional to the vertical drop. Twice the drop, twice the pressure.'],
      ['half', 'halved', 'At 30° above horizontal the vertical drop is L sin 30°, half the length along the tube.'],
    ], ($) => ($.move === 'wide' ? 'same' : $.move === 'tall' ? 'double' : 'half'), { label: 'gauge pressure' })],
    level: 1,
    hints: [
      'A still liquid pushes with ρ g times the vertical drop. The tube diameter is not in that product.',
      'On an incline, the vertical drop is the length along the tube times the sine of the angle above the horizontal.',
    ],
    steps: ($) => [
      $.move === 'wide'
        ? 'The area cancels, so widening the tube leaves the gauge pressure unchanged.'
        : $.move === 'tall'
          ? 'The gauge pressure is proportional to the vertical drop, so doubling the column doubles it.'
          : 'The vertical drop becomes L sin 30°, which is half the original vertical column.',
    ],
    second: ($) => {
      const ratio = $.move === 'tall' ? 2 : $.move === 'tilt' ? Math.sin(Math.PI / 6) : 1;
      const effect = Math.abs(ratio - 1) < 1e-12 ? 'same' : Math.abs(ratio - 2) < 1e-12 ? 'double' : 'half';
      return { effect };
    },
    sim: {
      scenario: 'utube',
      setup(s, $) {
        const cm = $.hCm * 100;
        if ($.move === 'tilt') {
          s.scenarioId = 'inclined';
          s.lengthCm = cm;
          s.angleDeg = 30;
        } else if ($.move === 'tall') {
          s.scenarioId = 'utube';
          s.hCm = cm * 2;
        } else {
          s.scenarioId = 'utube';
          s.hCm = cm;
          s.diameterMm = 25;
        }
      },
      read: (c, _state, $) => {
        const cm = $.hCm * 100;
        const drop = $.move === 'tall' ? (cm * 2) / 100 : $.move === 'tilt' ? (cm / 100) * Math.sin(Math.PI / 6) : cm / 100;
        const gauge = manometerGauge([{ rho: c.rhoW, drop }], G_STANDARD);
        if (Math.abs(c.gauge - gauge) > 0.05) return { effect: 'mismatch' };
        return { effect: $.move === 'wide' ? 'same' : $.move === 'tall' ? 'double' : 'half' };
      },
    },
    cases: [
      kase(cite('properties'), { hCm: 20, move: 'wide' }, { effect: 'same' }),
      kase(cite('properties'), { hCm: 20, move: 'tall' }, { effect: 'double' }),
      kase(cite('properties'), { hCm: 30, move: 'tilt' }, { effect: 'half' }),
    ],
  }),

  problem({
    id: 'u1.2.leg-direction',
    title: 'Which leg raises the gauge pressure',
    kind: 'conceptual',
    exam: 'u1',
    ch: '2',
    lab: 'manometer',
    src: cite('properties'),
    topics: ['properties'],
    variety: ['configuration'],
    vars: {
      extra: range(10, 80, 1, 'mm'),
      leg: choice(
        ['mercury', 'the descending mercury column'],
        ['water', 'the rising water column'],
      ),
    },
    text: (T) => String.raw`A manometer descends through mercury, then rises through water. You lengthen ${T.leg} by ${T.extra} mm. The gauge pressure`,
    parts: [mc('way', [
      ['rises', 'rises', 'A longer downward leg adds a larger ρ g z, so the gauge pressure rises.'],
      ['falls', 'falls', 'A longer upward leg subtracts a larger ρ g z, so the gauge pressure falls.'],
      ['same', 'stays the same', 'Lengthening a leg changes the vertical drop. The reading moves.'],
    ], ($) => ($.leg === 'mercury' ? 'rises' : 'falls'), { label: 'gauge pressure' })],
    level: 2,
    hints: [
      'Walk from the open end. Downward adds ρ g z and upward subtracts it.',
      'Ask whether the leg you lengthened is added or subtracted, then ask what a larger column does to that term.',
    ],
    steps: ($) => [
      $.leg === 'mercury'
        ? 'The mercury leg descends, so a longer column adds pressure and the gauge reading rises.'
        : 'The water leg rises, so a longer column subtracts pressure and the gauge reading falls.',
    ],
    second: ($) => {
      const rho = rhoWater();
      const base = manometerGauge([{ rho: RHO_HG, drop: 0.04 }, { rho, drop: -0.12 }], G_STANDARD);
      const next = $.leg === 'mercury'
        ? manometerGauge([{ rho: RHO_HG, drop: 0.04 + $.extra / 1000 }, { rho, drop: -0.12 }], G_STANDARD)
        : manometerGauge([{ rho: RHO_HG, drop: 0.04 }, { rho, drop: -(0.12 + $.extra / 1000) }], G_STANDARD);
      return { way: next > base ? 'rises' : next < base ? 'falls' : 'same' };
    },
    sim: {
      scenario: 'multi',
      setup(s, $) {
        s.hmMm = $.leg === 'mercury' ? 40 + $.extra : 40;
        s.hwCm = $.leg === 'water' ? 12 + $.extra / 10 : 12;
      },
      read: (c, _state, $) => {
        const base = manometerGauge([{ rho: RHO_HG, drop: 0.04 }, { rho: c.rhoW, drop: -0.12 }], G_STANDARD);
        if ($.leg === 'mercury') return { way: c.gauge > base + 1 ? 'rises' : 'mismatch' };
        return { way: c.gauge < base - 1 ? 'falls' : 'mismatch' };
      },
    },
    cases: [
      kase(cite('properties'), { extra: 20, leg: 'mercury' }, { way: 'rises' }),
      kase(cite('properties'), { extra: 20, leg: 'water' }, { way: 'falls' }),
    ],
  }),

  problem({
    id: 'u2.4.paddle-balance',
    title: 'Stored energy with a heater and a paddle',
    exam: 'u2',
    ch: '4',
    lab: 'balance',
    src: cite('first-law-closed'),
    topics: ['first-law'],
    variety: ['unknown'],
    vars: {
      Qheater: range(0, 40, 1, 'kJ', KJ),
      Qloss: range(1, 20, 1, 'kJ', KJ),
      Won: range(5, 40, 1, 'kJ', KJ),
      t: range(30, 180, 10, 's'),
    },
    derive: ($) => {
      const Q = $.Qheater - $.Qloss;
      const W = -$.Won;
      return { Q, W, dU: closedEnergy({ Q, W }) };
    },
    text: (T) => String.raw`A rigid tank is at rest. A heater adds ${T.Qheater} kJ, ${T.Qloss} kJ of heat leaks out, and a paddle does ${T.Won} kJ of work on the air. The process lasts ${T.t} s. Find the change in internal energy.`,
    parts: [
      num('dU', ($) => $.dU, 'kJ', {
        scale: KJ,
        label: 'change in internal energy',
        traps: [
          [($) => closedEnergy({ Q: $.Q, W: $.Won }), 'The paddle does work on the air, so W in Q − W = ΔU is negative.'],
          [($) => closedEnergy({ Q: $.Qheater, W: -$.Won }), 'The leak leaves the tank, so it is subtracted from the heater.'],
        ],
      }),
    ],
    level: 2,
    hints: [
      'For a stationary closed system, heat added and work done by the system are the two positive directions in Q − W = ΔU.',
      'A heat leak is heat leaving. Paddle work on the air is work done on the system.',
    ],
    steps: ($, sig) => [
      String.raw`$Q = ${sig($.Qheater / KJ)} - ${sig($.Qloss / KJ)} = ${sig($.Q / KJ)}$ kJ.`,
      String.raw`$W = -${sig($.Won / KJ)}$ kJ.`,
      String.raw`$\Delta U = Q - W = ${sig($.dU / KJ)}$ kJ.`,
    ],
    second: ($) => ({ dU: integratedBalance({ Qdot: $.Q / $.t, Wdot: $.W / $.t, t: $.t }) / KJ }),
    sim: {
      scenario: 'heater',
      setup(s, $) {
        s.Qheater = $.Qheater / KJ;
        s.Qloss = $.Qloss / KJ;
        s.Won = $.Won / KJ;
        s.t = $.t;
      },
      read: (c) => ({ dU: c.dU }),
    },
    cases: [
      kase(cite('first-law-closed'), { Qheater: 0, Qloss: 5, Won: 20, t: 60 }, { dU: 15 }),
      kase(cite('first-law-closed'), { Qheater: 30, Qloss: 8, Won: 20, t: 120 }, { dU: 42 }),
    ],
  }),

  problem({
    id: 'u2.4.chain',
    title: 'Fluid power from a motor and a pump',
    exam: 'u2',
    ch: '4',
    lab: 'balance',
    src: cite('first-law'),
    topics: ['first-law'],
    variety: ['unknown'],
    vars: {
      electric: range(1, 6, 0.1, 'kW', KJ),
      etaM: range(0.6, 0.95, 0.01),
      etaP: range(0.6, 0.95, 0.01),
    },
    derive: ($) => ({ fluid: seriesEfficiency([$.etaM, $.etaP]) * $.electric }),
    valid: ($) => Math.abs($.etaM - $.etaP) >= 0.05,
    text: (T) => String.raw`An electric motor of efficiency ${T.etaM} drives a pump of efficiency ${T.etaP}. The motor draws ${T.electric} kW. Find the power delivered to the fluid.`,
    parts: [
      num('fluid', ($) => $.fluid, 'kW', {
        scale: KJ,
        label: 'fluid power',
        traps: [
          [($) => 0.5 * ($.etaM + $.etaP) * $.electric, 'That averages the efficiencies. Devices in series multiply them.'],
          [($) => $.etaM * $.electric, 'The pump still takes its share. Multiply by the pump efficiency as well.'],
        ],
      }),
    ],
    level: 2,
    hints: [
      'The motor delivers shaft power equal to its efficiency times the electric power. The pump delivers fluid power equal to its efficiency times that shaft power.',
      'The overall efficiency is the product of the two efficiencies.',
    ],
    steps: ($, sig) => [
      String.raw`$\eta = ${sig($.etaM)} \times ${sig($.etaP)} = ${sig($.etaM * $.etaP)}$.`,
      String.raw`Fluid power $= \eta \times ${sig($.electric / KJ)} = ${sig($.fluid / KJ)}$ kW.`,
    ],
    second: ($) => ({ fluid: Math.exp(Math.log($.etaM) + Math.log($.etaP)) * $.electric / KJ }),
    sim: {
      scenario: 'chain',
      setup(s, $) {
        s.electric = $.electric / KJ;
        s.etaM = $.etaM;
        s.etaP = $.etaP;
      },
      read: (c) => ({ fluid: c.fluid }),
    },
    cases: [kase(cite('first-law'), { electric: 2.5, etaM: 0.9, etaP: 0.8 }, { fluid: 1.8 })],
  }),

  problem({
    id: 'u2.4.which-energy',
    title: 'How a crossing is counted',
    kind: 'conceptual',
    exam: 'u2',
    ch: '4',
    lab: 'balance',
    src: cite('first-law-closed'),
    topics: ['first-law'],
    variety: ['configuration'],
    vars: {
      amount: range(5, 40, 1, 'kJ', KJ),
      cross: choice(
        ['heater', 'a resistance heater adds'],
        ['leak', 'heat leaks out by'],
        ['paddle', 'a paddle does work on the air, totaling'],
      ),
    },
    text: (T) => String.raw`A rigid tank of air sits at rest. ${T.cross} ${T.amount} kJ. In $Q - W = \Delta U$, this crossing counts as`,
    parts: [mc('kind', [
      ['qin', 'positive heat', 'A heater adds heat, and heat added to the system is positive.'],
      ['qout', 'negative heat', 'A leak is heat leaving the system, so Q is negative.'],
      ['won', 'negative work', 'Work done on the system is negative when work done by the system is the positive direction.'],
      ['wby', 'positive work', 'Positive work is work done by the system. A paddle driving the air is the other way.'],
    ], ($) => ($.cross === 'heater' ? 'qin' : $.cross === 'leak' ? 'qout' : 'won'), { label: 'crossing' })],
    level: 1,
    hints: [
      'Heat into the system is positive. Work done by the system is positive.',
      'A paddle that drives the air does work on the system. A leak carries heat out.',
    ],
    steps: ($) => [
      $.cross === 'heater'
        ? 'The heater adds heat, so the crossing is positive Q.'
        : $.cross === 'leak'
          ? 'The leak removes heat, so the crossing is negative Q.'
          : 'The paddle does work on the air, so W in Q − W = ΔU is negative.',
    ],
    second: ($) => {
      const Q = $.cross === 'heater' ? $.amount : $.cross === 'leak' ? -$.amount : 0;
      const W = $.cross === 'paddle' ? -$.amount : 0;
      const dU = closedEnergy({ Q, W });
      if (Q > 0 && dU === Q) return { kind: 'qin' };
      if (Q < 0 && dU === Q) return { kind: 'qout' };
      if (W < 0 && dU === -W) return { kind: 'won' };
      return { kind: 'wby' };
    },
    sim: {
      scenario: 'heater',
      setup(s, $) {
        const kJ = $.amount / KJ;
        s.Qheater = $.cross === 'heater' ? kJ : 0;
        s.Qloss = $.cross === 'leak' ? kJ : 0;
        s.Won = $.cross === 'paddle' ? kJ : 0;
        s.t = 60;
      },
      read: (c, _state, $) => {
        const want = $.cross === 'leak' ? -$.amount : $.amount;
        if (Math.abs(c.dU - want) > 0.01) return { kind: 'mismatch' };
        return { kind: $.cross === 'heater' ? 'qin' : $.cross === 'leak' ? 'qout' : 'won' };
      },
    },
    cases: [
      kase(cite('first-law-closed'), { amount: 30, cross: 'heater' }, { kind: 'qin' }),
      kase(cite('first-law-closed'), { amount: 8, cross: 'leak' }, { kind: 'qout' }),
      kase(cite('first-law-closed'), { amount: 20, cross: 'paddle' }, { kind: 'won' }),
    ],
  }),

  problem({
    id: 'u2.4.series',
    title: 'Halving efficiencies in series',
    kind: 'conceptual',
    exam: 'u2',
    ch: '4',
    lab: 'balance',
    src: cite('first-law'),
    topics: ['first-law'],
    variety: ['configuration'],
    vars: {
      etaM: range(0.6, 0.9, 0.05),
      etaP: range(0.6, 0.9, 0.05),
      cut: choice(
        ['one', 'one of the two efficiencies is cut in half'],
        ['both', 'both efficiencies are cut in half'],
      ),
    },
    text: (T) => String.raw`A motor of efficiency ${T.etaM} drives a pump of efficiency ${T.etaP}. Then ${T.cut}. The overall efficiency is`,
    parts: [mc('factor', [
      ['half', 'halved', 'One factor of a product was cut in half, so the product is cut in half.'],
      ['quarter', 'quartered', 'Each factor was cut in half, and a half times a half is a quarter.'],
      ['same', 'unchanged', 'The overall efficiency is the product. Cutting a factor changes the product.'],
    ], ($) => ($.cut === 'one' ? 'half' : 'quarter'), { label: 'overall efficiency' })],
    level: 2,
    hints: [
      'Devices in series pass the same power. The overall efficiency is the product of the factors.',
      'Count how many factors in the product are cut in half.',
    ],
    steps: ($) => [
      $.cut === 'one'
        ? 'One factor is halved and the other is unchanged, so the product is halved.'
        : 'Both factors are halved, so the product is multiplied by one quarter.',
    ],
    second: ($) => {
      const before = seriesEfficiency([$.etaM, $.etaP]);
      const after = $.cut === 'one'
        ? seriesEfficiency([$.etaM / 2, $.etaP])
        : seriesEfficiency([$.etaM / 2, $.etaP / 2]);
      const ratio = after / before;
      return { factor: Math.abs(ratio - 0.5) < 1e-9 ? 'half' : Math.abs(ratio - 0.25) < 1e-9 ? 'quarter' : 'same' };
    },
    sim: {
      scenario: 'chain',
      setup(s, $) {
        s.etaM = $.etaM;
        s.etaP = $.etaP;
        s.electric = 2.5;
      },
      read: (c, state, $) => {
        if (Math.abs(c.overall - seriesEfficiency([state.etaM, state.etaP])) > 1e-12) return { factor: 'mismatch' };
        return { factor: $.cut === 'one' ? 'half' : 'quarter' };
      },
    },
    cases: [
      kase(cite('first-law'), { etaM: 0.9, etaP: 0.8, cut: 'one' }, { factor: 'half' }),
      kase(cite('first-law'), { etaM: 0.9, etaP: 0.8, cut: 'both' }, { factor: 'quarter' }),
    ],
  }),
];

export default instruments;
