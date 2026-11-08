/**
 * Unit 2 bank: pressure on walls and in moving tanks. Original problems, written for the Gate and
 * Accelerating tank labs. Each varies by liquid or by layout as well as by numbers, carries staged
 * hints and named traps (../coaching/u2.js), and is checked against its lab (`sim`).
 */
import { LIQUIDS, gateForce, rigidSurface } from '@flux/subjects/mechanics/pressure-fields.js';
import { G, choice, kase, num, problem, range } from '../kit.js';
import { BARGE } from '@flux/subjects/mechanics/floating.js';

const liquid = () => choice(['water', 'water'], ['seawater', 'seawater'], ['oil', 'light oil']);
const rho = ($) => (LIQUIDS[$.fluid] || LIQUIDS.water).rho;
const pick = (id, label, options, correct) => ({ id, kind: 'choice', label, options: options.map(([value, text, why]) => ({ value, label: text, why })), correct, multi: false });
const rhoText = ($) => String.raw`$\rho = ${rho($)}\ \mathrm{kg/m^3}$`;
const TILT = { vertical: 90, sixty: 60, fortyfive: 45 };
const gate = ($) => gateForce({ rho: rho($), d: $.d, L: $.L, b: $.b ?? 1, theta: TILT[$.tilt] ?? 90, g: G });
const H0 = 0.45;
const tank = ($) => rigidSurface({ mode: 'linear', len: 1, h0: H0, ax: $.a, az: 0, rho: rho($), g: G });
const bowl = ($) => rigidSurface({ mode: 'spin', len: 0.3, h0: H0, omega: $.w, az: 0, rho: rho($), g: G });

/** GM (m) of the 12 t, 6 m box barge of width b; `how` reproduces the traps. */
export const barGM = ($, how = 'right') => {
  const b = Number($.b);
  const d = BARGE.m / (BARGE.rho * b * BARGE.L);
  const BM = (how === 'edge' ? (b ** 3 * BARGE.L) / 3 : (b ** 3 * BARGE.L) / 12) / (b * d * BARGE.L);
  return (how === 'nokb' ? 0 : d / 2) + BM - Number($.KG);
};

export default [
  problem({
    id: 'u2.1.gate-force',
    title: 'Force on a gate',
    exam: 'u2',
    ch: '4',
    lab: 'gate',
    src: 'Flux, written for the Gate lab',
    topics: ['hydrostatic-force'],
    principles: ['pressure-force'],
    vars: { fluid: liquid(), d: range(0.5, 5, 0.5, 'm'), L: range(1, 3, 0.5, 'm'), b: range(1, 3, 0.5, 'm') },
    text: (T, $) => String.raw`A vertical rectangular gate ${T.L} tall and ${T.b} wide holds back ${T.fluid} (${rhoText($)}). Its top edge is ${T.d} below the surface. Find the pressure force on the gate.`,
    parts: [num('F', ($) => gate($).F / 1000, 'kN', { label: 'force' })],
    level: 1,
    hints: ['The force is the pressure at the centroid times the area.', 'The centroid is half the gate’s height below its top edge: h_c = d + L/2.'],
    steps: ($, sig) => [String.raw`$h_c = ${sig($.d)} + ${sig($.L)}/2 = ${sig(gate($).hc)}$ m, and $F = \rho g h_c A = ${rho($)}(9.81)(${sig(gate($).hc)})(${sig($.L * $.b)}) = ${sig(gate($).F / 1000)}$ kN.`],
    sim: {
      scenario: 'surface',
      setup(s, $) {
        Object.assign(s, { fluid: $.fluid, d: $.d, L: $.L, b: $.b, theta: 90 });
      },
      read: (c) => ({ F: c.F / 1000 }),
    },
    cases: [kase('The notes’ example: water, 2 m by 1 m gate, top edge 3 m down', { fluid: 'water', d: 3, L: 2, b: 1 }, { F: 78.32 })],
  }),

  problem({
    id: 'u2.2.center-of-pressure',
    title: 'Where the force acts',
    exam: 'u2',
    ch: '4',
    lab: 'gate',
    src: 'Flux, written for the Gate lab',
    topics: ['hydrostatic-force'],
    principles: ['center-of-pressure'],
    vars: { tilt: choice(['vertical', 'vertical'], ['sixty', 'tilted 60° from the horizontal'], ['fortyfive', 'tilted 45° from the horizontal']), d: range(1, 3, 0.5, 'm'), L: range(1.5, 3, 0.5, 'm') },
    text: (T) => String.raw`A flat gate ${T.L} long, ${T.tilt}, has its top edge ${T.d} below the water's surface. At what depth does the pressure force on it act?`,
    parts: [num('hcp', ($) => gate($).hcp, 'm', { tol: 0.005, label: 'depth of the centre of pressure' })],
    level: 2,
    hints: ['Measure y along the gate’s plane from the surface: $y_c = d/\\sin\\theta + L/2$.', 'The force acts at $y_c + I_{xc}/(y_c A) = y_c + L^2/(12 y_c)$ along the plane. Multiply by $\\sin\\theta$ to get a depth.'],
    steps: ($, sig) => {
      const g = gate($);
      return [String.raw`$y_c = ${sig(g.yc)}$ m along the plane, so $y_{cp} = ${sig(g.yc)} + ${sig($.L)}^2/(12 \times ${sig(g.yc)}) = ${sig(g.ycp)}$ m, a depth of ${sig(g.hcp)} m.`];
    },
    sim: {
      scenario: 'surface',
      setup(s, $) {
        Object.assign(s, { fluid: 'water', d: $.d, L: $.L, b: 1, theta: TILT[$.tilt] });
      },
      read: (c) => ({ hcp: c.hcp }),
    },
    cases: [kase('The notes’ example: vertical, 2 m long, top edge 3 m down', { tilt: 'vertical', d: 3, L: 2 }, { hcp: 4.0833 })],
  }),

  problem({
    id: 'u2.3.deeper-gate',
    title: 'Deeper or shallower',
    exam: 'u2',
    ch: '4',
    kind: 'conceptual',
    lab: 'gate',
    src: 'Flux, written for the Gate lab',
    topics: ['hydrostatic-force'],
    principles: ['center-of-pressure'],
    vars: { move: choice(['deeper', 'lowered from 3 m to 6 m'], ['shallower', 'raised from 3 m to 1 m']) },
    text: (T) => `A vertical gate 2 m tall has its top edge 3 m below the surface. It is ${T.move}. What happens to the distance between its centroid and the point where the pressure force acts?`,
    parts: [
      pick('gap', 'the force’s point compared with the centroid', [
        ['closer', 'it moves closer to the centroid', 'Deeper down, the pressure at the top and bottom edges differ by a smaller share, so the load is more even.'],
        ['further', 'it moves further below the centroid', 'Nearer the surface the pressure falls toward zero at the top edge, so the load leans on the bottom.'],
        ['same', 'it stays the same distance', 'The distance is $L^2/(12 y_c)$, which depends on how deep the centroid is.'],
      ], ($) => ($.move === 'deeper' ? 'closer' : 'further')),
    ],
    level: 1,
    hints: ['The force acts below the centroid by $I_{xc}/(y_c A)$.', 'What happens to that as $y_c$ grows?'],
    steps: ($) => [$.move === 'deeper' ? 'The gap falls from 8.3 cm to 4.8 cm: the force closes in on the centroid.' : 'The gap grows from 8.3 cm to 16.7 cm: the force moves further below the centroid.'],
    sim: {
      scenario: 'surface',
      setup(s, $) {
        Object.assign(s, { fluid: 'water', d: $.move === 'deeper' ? 6 : 1, L: 2, b: 1, theta: 90 });
      },
      read: (c) => ({ gap: c.offset < 4 / 48 ? 'closer' : 'further' }),
    },
    cases: [kase('Lowered to 6 m', { move: 'deeper' }, { gap: 'closer' })],
  }),

  problem({
    id: 'u2.4.tank-tilt',
    title: 'Water in an accelerating truck',
    exam: 'u2',
    ch: '4',
    lab: 'rigid-tank',
    src: 'Flux, written for the Accelerating tank lab',
    topics: ['rigid-body'],
    principles: ['rigid-body-pressure'],
    vars: { fluid: liquid(), a: range(1, 5, 0.5, 'm/s²') },
    text: (T, $) => String.raw`An open tank 1 m long holds ${T.fluid} (${rhoText($)}) 0.45 m deep. The truck carrying it speeds up steadily at ${T.a}. Once the liquid settles, how far does the level rise at the back wall, and what is the gauge pressure on the floor there?`,
    parts: [
      num('rise', ($) => tank($).rise * 100, 'cm', { label: 'rise at the back wall' }),
      num('p', ($) => tank($).pInner / 1000, 'kPa', { label: 'floor pressure at the back' }),
    ],
    level: 2,
    hints: ['The surface tilts with slope $a/g$, pivoting about the middle of the tank.', 'The back wall is half the tank’s length from the middle. The floor pressure there is $\\rho g$ times the new depth.'],
    steps: ($, sig) => {
      const t = tank($);
      return [String.raw`Rise $= (a/g)(L/2) = (${sig($.a)}/9.81)(0.5) = ${sig(t.rise * 100)}$ cm, and $p = \rho g (0.45 + ${sig(t.rise)}) = ${sig(t.pInner / 1000)}$ kPa.`];
    },
    sim: {
      scenario: 'rest',
      setup(s, $) {
        Object.assign(s, { mode: 'linear', fluid: $.fluid, ax: $.a, az: 0 });
      },
      read: (c) => ({ rise: (c.back - c.h0) * 100, p: c.pInner / 1000 }),
    },
    cases: [kase('The notes’ example: water, 3 m/s²', { fluid: 'water', a: 3 }, { rise: 15.29, p: 5.903 })],
  }),

  problem({
    id: 'u2.5.spin-dip',
    title: 'A spinning tank',
    exam: 'u2',
    ch: '4',
    lab: 'rigid-tank',
    src: 'Flux, written for the Accelerating tank lab',
    topics: ['rigid-body'],
    principles: ['rigid-body-pressure'],
    vars: { fluid: liquid(), w: range(4, 10, 1, 'rad/s') },
    text: (T, $) => String.raw`A round tank of radius 0.3 m holds ${T.fluid} (${rhoText($)}) 0.45 m deep. It spins about its axis at ${T.w} until the liquid turns with it. How far does the centre drop, and what is the gauge pressure on the floor at the rim?`,
    parts: [
      num('drop', ($) => bowl($).rise * 100, 'cm', { label: 'drop at the centre' }),
      num('p', ($) => bowl($).pOuter / 1000, 'kPa', { label: 'floor pressure at the rim' }),
    ],
    level: 3,
    hints: ['The surface is $z = \\omega^2 r^2/(2g) + C$: from centre to rim it climbs $\\omega^2R^2/(2g)$.', 'No liquid is added, so the centre drops half that and the rim rises half that.'],
    steps: ($, sig) => {
      const s = bowl($);
      return [String.raw`Centre to rim climbs $\omega^2R^2/(2g) = ${sig(2 * s.rise * 100)}$ cm, so the centre drops ${sig(s.rise * 100)} cm and the rim rises the same. At the rim $p = \rho g (0.45 + ${sig(s.rise)}) = ${sig(s.pOuter / 1000)}$ kPa.`];
    },
    sim: {
      scenario: 'spin',
      setup(s, $) {
        Object.assign(s, { mode: 'spin', fluid: $.fluid, omega: $.w, az: 0 });
      },
      read: (c) => ({ drop: (c.h0 - c.inner) * 100, p: c.pOuter / 1000 }),
    },
    cases: [kase('The notes’ example: water at 6 rad/s', { fluid: 'water', w: 6 }, { drop: 8.257, p: 5.214 })],
  }),

  problem({
    id: 'u2.6.which-wall',
    title: 'Which wall does it climb?',
    exam: 'u2',
    ch: '4',
    kind: 'conceptual',
    lab: 'rigid-tank',
    src: 'Flux, written for the Accelerating tank lab',
    topics: ['rigid-body'],
    principles: ['rigid-body-pressure'],
    vars: { motion: choice(['speeding', 'speeding up'], ['braking', 'braking'], ['steady', 'cruising at a steady 25 m/s'], ['lift', 'standing still in a lift that accelerates upward']) },
    text: (T) => `A truck carries an open tank of water. It is ${T.motion}. Once the water settles, where is it highest?`,
    parts: [
      pick('wall', 'the water is highest', [
        ['back', 'at the back wall', 'Speeding up needs a forward push on the water, which takes higher pressure at the back.'],
        ['front', 'at the front wall', 'Slowing down needs a backward push, which takes higher pressure at the front.'],
        ['level', 'nowhere: it stays level', 'With no forward or backward acceleration, nothing tilts the surface. Vertical acceleration only changes the pressure.'],
      ], ($) => ({ speeding: 'back', braking: 'front', steady: 'level', lift: 'level' }[$.motion])),
    ],
    level: 1,
    hints: ['The surface lies square to $\\mathbf g - \\mathbf a$.', 'Which way does the tank accelerate, if at all? Speed alone does nothing.'],
    steps: ($) => [{ speeding: 'The tank accelerates forward, so g − a leans back: the water climbs the back wall.', braking: 'The tank accelerates backward, so the water climbs the front wall.', steady: 'Steady speed is no acceleration: the surface stays level.', lift: 'Upward acceleration adds to g but has no sideways part: the surface stays level.' }[$.motion]],
    sim: {
      scenario: 'rest',
      setup(s, $) {
        Object.assign(s, { mode: 'linear', fluid: 'water', ax: { speeding: 3, braking: -3, steady: 0, lift: 0 }[$.motion], az: $.motion === 'lift' ? 3 : 0 });
      },
      read: (c) => ({ wall: c.back - c.front > 1e-9 ? 'back' : c.front - c.back > 1e-9 ? 'front' : 'level' }),
    },
    cases: [kase('Speeding up', { motion: 'speeding' }, { wall: 'back' })],
  }),
  problem({
    id: 'u2.7.gm',
    title: 'A barge’s metacentric height',
    exam: 'u2',
    ch: '4',
    lab: 'float',
    src: 'Flux, written for the Floating lab',
    topics: ['stability'],
    principles: ['stability'],
    vars: { b: choice(['2.5', '2.5 m'], ['3', '3 m'], ['4', '4 m']), KG: choice(['1', '1.0 m'], ['1.3', '1.3 m']) },
    text: (T) => `A box barge ${T.b} wide and 6 m long has a mass of 12 t and floats in fresh water. Its centre of gravity is ${T.KG} above the keel. What is its metacentric height GM, in m?`,
    parts: [num('gm', ($) => barGM($), 'm', { label: 'GM', abs: 0.005 })],
    level: 2,
    hints: ['Find the draft from the displaced volume, then KB = d/2.', 'BM = I_wp/V_sub with I_wp = Lb³/12; GM = KB + BM − KG.'],
    steps: ($) => [String.raw`$d = ${(12 / (6 * Number($.b))).toFixed(3)}$ m, $\overline{BM} = b^2/12d = ${(Number($.b) ** 2 / (12 * (12 / (6 * Number($.b))))).toFixed(3)}$ m`, String.raw`$\overline{GM} = ${Number(barGM($).toPrecision(3))}$ m`],
    sim: { scenario: 'wide', setup(s, $) { Object.assign(s, { b: Number($.b), KG: Number($.KG) }); }, read: (c) => ({ gm: c.GM }) },
    cases: [kase('3 m, KG 1.0', { b: '3', KG: '1' }, { gm: 0.4583 })],
  }),

  problem({
    id: 'u2.8.g-above-b',
    title: 'G above B',
    exam: 'u2',
    ch: '4',
    kind: 'conceptual',
    lab: 'float',
    src: 'Flux, written for the Floating lab',
    topics: ['stability'],
    principles: ['stability'],
    vars: { boat: choice(['wide', 'a barge 4 m wide with G 1.5 m above the keel'], ['narrow', 'a barge 1.5 m wide with G 1.0 m above the keel']) },
    text: (T) => `The 12 t, 6 m box is built as ${T.boat}. In both cases G is above B. Does it float upright?`,
    parts: [
      pick('a', 'upright', [
        ['yes', 'yes', 'The metacentre is above G, so heeling swings buoyancy to right it.'],
        ['no', 'no', 'The metacentre is below G: heeling makes the buoyancy turn it further.'],
      ], ($) => ($.boat === 'wide' ? 'yes' : 'no')),
    ],
    level: 2,
    hints: ['G above B is not the test.', 'Compare KM = KB + b²/12d with KG.'],
    steps: ($) => [$.boat === 'wide' ? 'KM = 2.92 m > KG = 1.5 m: stable.' : 'KM = 0.81 m < KG = 1.0 m: it capsizes.'],
    sim: { scenario: 'wide', setup(s, $) { Object.assign(s, $.boat === 'wide' ? { b: 4, KG: 1.5 } : { b: 1.5, KG: 1 }); }, read: (c) => ({ a: c.stable ? 'yes' : 'no' }) },
    cases: [kase('narrow', { boat: 'narrow' }, { a: 'no' })],
  }),
];
