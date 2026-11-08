/**
 * Unit 1 bank: viscosity and shear. Original problems, written for the Viscosity lab. Each varies
 * by fluid as well as by numbers, carries staged hints and named traps (../coaching/u1.js), and is
 * checked against the lab itself (`sim`).
 */
import { FLUIDS, couetteStress, settlingTime } from '@flux/subjects/mechanics/couette.js';
import { choice, kase, num, problem, range } from '../kit.js';
import { LIQUIDS } from '@flux/subjects/mechanics/capillary.js';

const liquid = () => choice(['water', 'water'], ['mercury', 'mercury'], ['oil', 'olive oil'], ['glycerol', 'glycerol']);
const mu = ($) => FLUIDS[$.fluid].mu;
const nu = ($) => FLUIDS[$.fluid].mu / FLUIDS[$.fluid].rho;
const pick = (id, label, options, correct) => ({ id, kind: 'choice', label, options: options.map(([value, text, why]) => ({ value, label: text, why })), correct, multi: false });
const muText = ($, sig) => String.raw`$\mu = ${sig(mu($))}\ \mathrm{Pa\,s}$`;

/** Water's capillary rise (mm) in a tube of radius r mm; `rad` and `unit` reproduce the traps. */
/** Mercury's depression (mm, positive down) in a tube of radius r mm; `cos` and `rad` reproduce the traps. */
export const sink = ($, cos = Math.cos((140 * Math.PI) / 180), rad = (r) => r) => {
  const L = LIQUIDS.mercury;
  return ((-2 * L.sigma * cos) / (L.rho * 9.81 * rad(Number($.r)) * 1e-3)) * 1000;
};
/** Pressure jump (Pa) across a water drop of radius r mm; `k` is the number of 1/R terms times surfaces. */
export const jump = ($, k = 2) => (k * LIQUIDS.water.sigma) / (Number($.r) * 1e-3);
export const rise = ($, rad = (r) => r, unit = 1e-3) => {
  const L = LIQUIDS.water;
  return ((2 * L.sigma) / (L.rho * 9.81 * rad(Number($.r)) * unit)) * 1000;
};

export default [
  problem({
    id: 'u1.1.shear-stress',
    title: 'Stress under a moving plate',
    exam: 'u1',
    ch: '5',
    lab: 'viscosity',
    src: 'Flux, written for the Viscosity lab',
    topics: ['viscosity'],
    principles: ['viscosity-law'],
    vars: { fluid: liquid(), U: range(0.2, 1, 0.1, 'm/s'), h: range(1, 5, 0.5, 'mm', 1e-3) },
    text: (T, $, sig) => String.raw`A plate slides at ${T.U} over a ${T.h} layer of ${T.fluid} (${muText($, sig)}) on a still floor. Find the shear stress on the plate.`,
    parts: [num('tau', ($) => couetteStress(mu($), $.U, $.h), 'Pa', { label: 'shear stress' })],
    level: 1,
    hints: ['The stress is the viscosity times the velocity gradient across the layer.', 'The speed runs from 0 at the floor to U at the plate, so the gradient is U/h, with h in metres.'],
    steps: ($, sig) => [String.raw`$\tau = \mu U/h = ${sig(mu($))} \times ${sig($.U)} / ${sig($.h)} = ${sig(couetteStress(mu($), $.U, $.h))}$ Pa.`],
    sim: {
      scenario: 'water',
      setup(s, $) {
        s.fluid = $.fluid;
        s.U = $.U;
        s.h = $.h * 1000;
      },
      read: (c) => ({ tau: c.tau }),
    },
    cases: [kase('The notes’ water example: 0.5 m/s over 2 mm', { fluid: 'water', U: 0.5, h: 2 }, { tau: 0.2504 })],
  }),

  problem({
    id: 'u1.2.plate-force',
    title: 'Force to drag a plate',
    exam: 'u1',
    ch: '5',
    lab: 'viscosity',
    src: 'Flux, written for the Viscosity lab',
    topics: ['viscosity'],
    principles: ['viscosity-law'],
    vars: { fluid: liquid(), U: range(0.2, 1, 0.1, 'm/s'), h: range(1, 5, 0.5, 'mm', 1e-3) },
    text: (T, $, sig) => String.raw`A 0.1 m² plate is dragged at ${T.U} over a ${T.h} layer of ${T.fluid} (${muText($, sig)}). What force holds it at that speed?`,
    parts: [num('F', ($) => couetteStress(mu($), $.U, $.h) * 0.1, 'N', { label: 'force' })],
    level: 2,
    hints: ['At steady speed the pull balances the fluid’s drag on the plate.', 'Find the stress μU/h, then multiply by the plate’s area.'],
    steps: ($, sig) => [String.raw`$F = \tau A = (${sig(mu($))} \times ${sig($.U)} / ${sig($.h)})(0.1) = ${sig(couetteStress(mu($), $.U, $.h) * 0.1)}$ N.`],
    sim: {
      scenario: 'water',
      setup(s, $) {
        s.fluid = $.fluid;
        s.U = $.U;
        s.h = $.h * 1000;
      },
      read: (c) => ({ F: c.force }),
    },
    cases: [kase('The notes’ water example: 0.5 m/s over 2 mm, 0.1 m²', { fluid: 'water', U: 0.5, h: 2 }, { F: 0.02504 })],
  }),

  problem({
    id: 'u1.3.settling-time',
    title: 'How long the layer takes to settle',
    exam: 'u1',
    ch: '5',
    lab: 'viscosity',
    src: 'Flux, written for the Viscosity lab',
    topics: ['diffusion'],
    principles: ['momentum-diffusion'],
    vars: { fluid: choice(['water', 'water'], ['mercury', 'mercury'], ['oil', 'olive oil'], ['glycerol', 'glycerol'], ['air', 'air']), h: range(1, 4, 0.5, 'mm', 1e-3) },
    text: (T, $, sig) => String.raw`A plate starts moving over a ${T.h} layer of ${T.fluid}, with $\nu = ${sig(nu($))}\ \mathrm{m^2/s}$. How long until the velocity profile is within 1% of its straight line, \(t_1 = \dfrac{h^2}{\pi^2\nu}\ln\dfrac{200}{\pi}\)?`,
    parts: [num('t1', ($) => settlingTime(nu($), $.h), 's', { label: 'time to settle' })],
    level: 2,
    hints: ['Motion spreads into the layer at the kinematic viscosity ν, not at μ.', 'Put h in metres, square it, divide by π²ν and multiply by ln(200/π) ≈ 4.15.'],
    steps: ($, sig) => [String.raw`$t_1 = \dfrac{(${sig($.h)})^2}{\pi^2 (${sig(nu($))})}\ln\dfrac{200}{\pi} = ${sig(settlingTime(nu($), $.h))}$ s.`],
    sim: {
      scenario: 'water',
      setup(s, $) {
        s.fluid = $.fluid;
        s.h = $.h * 1000;
      },
      read: (c) => ({ t1: c.t1 }),
    },
    cases: [kase('The notes’ water example: 2 mm', { fluid: 'water', h: 2 }, { t1: 1.6807 })],
  }),

  problem({
    id: 'u1.4.dense-or-thick',
    title: 'Dense or thick?',
    exam: 'u1',
    ch: '5',
    kind: 'conceptual',
    lab: 'viscosity',
    src: 'Flux, written for the Viscosity lab',
    topics: ['viscosity'],
    principles: ['viscosity-law'],
    vars: { pair: choice(['mercury', 'mercury, 13.5 times denser than water'], ['glycerol', 'glycerol, 1.26 times denser than water'], ['oil', 'olive oil, a little lighter than water'], ['air', 'air, 830 times lighter than water']) },
    text: (T) => `The same plate is dragged at the same speed over the same gap, first over water and then over ${T.pair}. How does the stress on the plate compare with water's?`,
    parts: [
      pick('ratio', 'the stress compared with water', [
        ['much', 'many times bigger', 'Only a fluid much more viscous than water gives many times the stress.'],
        ['little', 'a little bigger, under twice', 'A fluid a little more viscous than water gives a little more stress, whatever its density.'],
        ['smaller', 'smaller', 'A fluid less viscous than water gives less stress.'],
      ], ($) => ({ mercury: 'little', glycerol: 'much', oil: 'much', air: 'smaller' }[$.pair])),
    ],
    level: 1,
    hints: ['The stress is μU/h. Which property of the fluid is in it?', 'Compare viscosities, not densities.'],
    steps: ($) => [{ mercury: 'Mercury is 1.5 times as viscous as water: a little more stress, though it is far denser.', glycerol: 'Glycerol is 1,400 times as viscous: many times the stress.', oil: 'Olive oil is 56 times as viscous, though lighter than water: many times the stress.', air: 'Air is 54 times less viscous: less stress.' }[$.pair]],
    sim: {
      scenario: 'water',
      setup(s, $) {
        s.fluid = $.pair;
        s.U = 0.5;
        s.h = 2;
      },
      read: (c) => ({ ratio: c.tau / 0.2504 > 10 ? 'much' : c.tau / 0.2504 > 1 ? 'little' : 'smaller' }),
    },
    cases: [kase('Mercury against water', { pair: 'mercury' }, { ratio: 'little' })],
  }),
  problem({
    id: 'u1.5.rise',
    title: 'Water up a thin tube',
    exam: 'u1',
    ch: '5',
    lab: 'capillary',
    src: 'Flux, written for the Capillary lab',
    topics: ['capillarity'],
    principles: ['capillarity'],
    vars: { r: choice(['0.1', '0.1 mm'], ['0.25', '0.25 mm'], ['0.5', '0.5 mm'], ['1', '1 mm']) },
    text: (T) => `A clean glass tube of radius ${T.r} stands in water (σ = 0.0728 N/m, θ = 0°, ρ = 998 kg/m³). How high does the water rise, in mm?`,
    parts: [num('h', ($) => rise($), 'mm', { label: 'h' })],
    level: 1,
    hints: ['The wall’s pull 2πrσ cos θ holds up the column’s weight ρgπr²h.', 'h = 2σ cos θ/(ρgr), with r in metres.'],
    steps: ($) => [String.raw`$h = \frac{2(0.0728)}{998 \times 9.81 \times ${Number($.r) / 1000}} = ${Number(rise($).toPrecision(3))}$ mm`],
    sim: { scenario: 'water', setup(s, $) { s.rmm = Number($.r); }, read: (c) => ({ h: c.hmm }) },
    cases: [kase('0.5 mm', { r: '0.5' }, { h: 29.74 })],
  }),

  problem({
    id: 'u1.6.mercury',
    title: 'Mercury in glass',
    exam: 'u1',
    ch: '5',
    kind: 'conceptual',
    lab: 'capillary',
    src: 'Flux, written for the Capillary lab',
    topics: ['capillarity'],
    principles: ['capillarity'],
    vars: { r: choice(['0.5', 'a 0.5 mm tube'], ['1', 'a 1 mm tube']) },
    text: (T) => `${T.r} of clean glass is dipped in mercury, which meets glass at about 140°. Where does the mercury inside settle?`,
    parts: [
      pick('a', 'the mercury inside', [
        ['below', 'below the outside level', 'cos 140° < 0: surface tension pulls the column down.'],
        ['above', 'above the outside level, like water', 'Only a liquid that wets the glass, θ < 90°, rises.'],
        ['level', 'level with the outside', 'Surface tension acts at the wall whatever the angle; only at θ = 90° does it not shift the column.'],
      ], () => 'below'),
    ],
    level: 1,
    hints: ['Look at the sign of cos θ.', 'h = 2σ cos θ/(ρgr).'],
    steps: () => ['cos 140° = −0.77: the rise is negative, a depression.'],
    sim: { scenario: 'mercury', setup(s, $) { s.rmm = Number($.r); }, read: (c) => ({ a: c.hmm < 0 ? 'below' : 'above' }) },
    cases: [kase('0.5 mm', { r: '0.5' }, { a: 'below' })],
  }),
  problem({
    id: 'u1.7.sink',
    title: 'How far mercury sinks',
    exam: 'u1',
    ch: '5',
    lab: 'capillary',
    src: 'Flux, written for the Capillary lab',
    topics: ['capillarity'],
    principles: ['capillarity'],
    vars: { r: choice(['0.25', '0.25 mm'], ['0.5', '0.5 mm'], ['1', '1 mm']) },
    text: (T) => `A clean glass tube of radius ${T.r} stands in mercury (σ = 0.485 N/m, θ = 140°, ρ = 13 534 kg/m³). How far below the outside level does the mercury inside sit, in mm?`,
    parts: [num('d', ($) => sink($), 'mm', { label: 'depth' })],
    level: 2,
    hints: ['Jurin’s h = 2σ cos θ/(ρgr) is negative here.', 'The depth is −h.'],
    steps: ($) => [String.raw`$-h = -\frac{2(0.485)\cos 140^\circ}{13534 \times 9.81 \times ${Number($.r) / 1000}} = ${Number(sink($).toPrecision(3))}$ mm`],
    sim: { scenario: 'mercury', setup(s, $) { s.rmm = Number($.r); }, read: (c) => ({ d: -c.hmm }) },
    cases: [kase('0.5 mm', { r: '0.5' }, { d: 11.19 })],
  }),

  problem({
    id: 'u1.8.jump',
    title: 'Pressure inside a drop',
    exam: 'u1',
    ch: '5',
    lab: 'capillary',
    src: 'Flux, written for the Capillary lab',
    topics: ['capillarity'],
    principles: ['capillarity'],
    vars: { r: choice(['0.05', '0.05 mm'], ['0.2', '0.2 mm'], ['1', '1 mm']) },
    text: (T) => `A spherical water drop (σ = 0.0728 N/m) has radius ${T.r}. How much higher is the pressure inside than outside, in Pa?`,
    parts: [num('dp', ($) => jump($), 'Pa', { label: 'Δp' })],
    level: 1,
    hints: ['Δp = σ(1/R₁ + 1/R₂).', 'For a sphere both radii are R.'],
    steps: ($) => [String.raw`$\Delta p = 2\sigma/R = 2(0.0728)/${Number($.r) / 1000} = ${Number(jump($).toPrecision(3))}$ Pa`],
    sim: { scenario: 'water', setup(s, $) { s.rmm = Number($.r); }, read: (c) => ({ dp: c.dp }) },
    cases: [kase('0.2 mm', { r: '0.2' }, { dp: 728 })],
  }),
];
