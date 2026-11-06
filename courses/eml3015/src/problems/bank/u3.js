/**
 * Unit 3 bank: following the flow. Original problems, written for the Nozzle and Bend labs. Each
 * varies by layout or fluid as well as by numbers, carries staged hints and named traps
 * (../coaching/u3.js), and is checked against its lab (`sim`).
 */
import { bendPressure, nozzleParticle } from '@flux/subjects/mechanics/flowfields.js';
import { choice, kase, num, problem, range } from '../kit.js';

const pick = (id, label, options, correct) => ({ id, kind: 'choice', label, options: options.map(([value, text, why]) => ({ value, label: text, why })), correct, multi: false });
const RATIO = { gentle: 2, medium: 4, sharp: 6 };
const shape = () => choice(['gentle', 'its area halves'], ['medium', 'its area falls to a quarter'], ['sharp', 'its area falls to a sixth']);
const exit = ($) => nozzleParticle({ u0: $.u0, L: $.L, CR: RATIO[$.shape], ramp: 0 }, $.L);
const RHO = { water: 998, air: 1.2 };
const bend = ($) => bendPressure({ rho: RHO[$.fluid] ?? 998, V: $.V, R: $.R, w: $.w, profile: 'vortex' });
const nozzleSetup = (s, $) => Object.assign(s, { u0: $.u0, L: $.L, CR: RATIO[$.shape], ramp: 0, xf: 1 });
const bendVars = () => ({ fluid: choice(['water', 'water'], ['air', 'air']), V: range(1, 4, 0.5, 'm/s'), R: range(0.3, 1, 0.1, 'm'), w: range(0.1, 0.2, 0.05, 'm') });
const bendSetup = (s, $) => Object.assign(s, { fluid: $.fluid, V: $.V, R: $.R, w: $.w, profile: 'vortex' });

export default [
  problem({
    id: 'u3.1.exit-acceleration',
    title: 'Acceleration in a steady nozzle',
    exam: 'u3',
    ch: '6',
    lab: 'nozzle',
    src: 'Flux, written for the Nozzle lab',
    topics: ['material-derivative'],
    principles: ['material-derivative'],
    vars: { shape: shape(), u0: range(0.75, 2, 0.25, 'm/s'), L: range(0.2, 1, 0.1, 'm') },
    text: (T) => String.raw`Water enters a nozzle ${T.L} long at a steady ${T.u0}. Along the nozzle ${T.shape}, falling in a straight line, so \(u = u_0/(1 - c\,x/L)\) with \(c = 1 - A_\text{exit}/A_\text{in}\). Find the acceleration of a water particle as it leaves.`,
    parts: [num('a', ($) => exit($).accel, 'm/s²', { label: 'acceleration at the exit' })],
    level: 2,
    hints: ['The flow is steady, so only the convective part $u\\,\\partial u/\\partial x$ is left.', 'Differentiate: $\\partial u/\\partial x = u\\,c/(L(1 - c\\,x/L))$. Evaluate both at the exit, where $1 - c = A_\\text{exit}/A_\\text{in}$.'],
    steps: ($, sig) => {
      const e = exit($);
      return [String.raw`At the exit $u = ${sig(e.u)}$ m/s and $\partial u/\partial x = ${sig(e.accel / e.u)}$ s⁻¹, so $Du/Dt = ${sig(e.u)} \times ${sig(e.accel / e.u)} = ${sig(e.accel)}$ m/s².`];
    },
    sim: { scenario: 'steady', setup: nozzleSetup, read: (c) => ({ a: c.accel }) },
    cases: [kase('The notes’ example: 4 to 1, 1 m/s, 0.5 m', { shape: 'medium', u0: 1, L: 0.5 }, { a: 96 })],
  }),

  problem({
    id: 'u3.2.transit-time',
    title: 'Time to cross a nozzle',
    exam: 'u3',
    ch: '6',
    lab: 'nozzle',
    src: 'Flux, written for the Nozzle lab',
    topics: ['material-derivative'],
    principles: ['material-derivative'],
    vars: { shape: shape(), u0: range(0.75, 2, 0.25, 'm/s'), L: range(0.2, 1, 0.1, 'm') },
    text: (T) => String.raw`Water enters a nozzle ${T.L} long at a steady ${T.u0}. Along the nozzle ${T.shape}, falling in a straight line. How long does a particle take to pass through?`,
    parts: [num('T', ($) => exit($).t, 's', { label: 'time to cross' })],
    level: 2,
    hints: ['Follow the particle: $dt = dx/u$, and $u = u_0/(1 - c\\,x/L)$.', 'So $T = \\int_0^L (1 - c\\,x/L)\\,dx/u_0 = (L/u_0)(1 - c/2)$.'],
    steps: ($, sig) => {
      const c = 1 - 1 / RATIO[$.shape];
      return [String.raw`$c = ${sig(c)}$, so $T = (${sig($.L)}/${sig($.u0)})(1 - ${sig(c)}/2) = ${sig(exit($).t)}$ s.`];
    },
    sim: { scenario: 'steady', setup: nozzleSetup, read: (c) => ({ T: c.t }) },
    cases: [kase('The notes’ example: 4 to 1, 1 m/s, 0.5 m', { shape: 'medium', u0: 1, L: 0.5 }, { T: 0.3125 })],
  }),

  problem({
    id: 'u3.3.steady-particle',
    title: 'Steady, but accelerating?',
    exam: 'u3',
    ch: '6',
    kind: 'conceptual',
    lab: 'nozzle',
    src: 'Flux, written for the Nozzle lab',
    topics: ['material-derivative'],
    principles: ['material-derivative'],
    vars: { duct: choice(['narrows', 'narrows along its length'], ['straight', 'keeps the same area'], ['widens', 'widens along its length']) },
    text: (T) => `Water flows steadily through a duct that ${T.duct}. At every fixed point the speed never changes. What does a particle of water do as it moves along?`,
    parts: [
      pick('motion', 'the particle', [
        ['speeds', 'speeds up', 'The flow is faster where the duct is narrow, and the particle moves there.'],
        ['none', 'keeps its speed', 'Only a duct of constant area gives the same speed everywhere.'],
        ['slows', 'slows down', 'The flow is slower where the duct is wide, and the particle moves there.'],
      ], ($) => ({ narrows: 'speeds', straight: 'none', widens: 'slows' }[$.duct])),
    ],
    level: 1,
    hints: ['Steady means $\\partial u/\\partial t = 0$ at a fixed point. A particle does not stay at a fixed point.', 'Its acceleration is $u\\,\\partial u/\\partial x$. Which way does $u$ change along this duct?'],
    steps: ($) => [{ narrows: 'The speed rises along the duct, so u ∂u/∂x > 0: the particle speeds up.', straight: 'The speed is the same everywhere, so u ∂u/∂x = 0: the particle keeps its speed.', widens: 'The speed falls along the duct, so u ∂u/∂x < 0: the particle slows down.' }[$.duct]],
    sim: {
      scenario: 'steady',
      setup(s, $) {
        Object.assign(s, { u0: 1, L: 0.5, CR: { narrows: 4, straight: 1, widens: 0.5 }[$.duct], ramp: 0, xf: 0.5 });
      },
      read: (c) => ({ motion: c.accel > 1e-9 ? 'speeds' : c.accel < -1e-9 ? 'slows' : 'none' }),
    },
    cases: [kase('A narrowing duct', { duct: 'narrows' }, { motion: 'speeds' })],
  }),

  problem({
    id: 'u3.4.bend-pressure',
    title: 'Pressure across a bend',
    exam: 'u3',
    ch: '6',
    lab: 'bend',
    src: 'Flux, written for the Bend lab',
    topics: ['euler'],
    principles: ['euler-normal'],
    vars: bendVars(),
    text: (T) => String.raw`${T.fluid === 'air' ? 'Air' : 'Water'} (${T.fluid === 'air' ? '$\\rho = 1.2$' : '$\\rho = 998$'} kg/m³) flows at a mean ${T.V} round a bend in a channel ${T.w} wide, with centre-line radius ${T.R}. Take the flow as a free vortex, \(u = K/r\). How much higher is the pressure on the outer wall than on the inner?`,
    parts: [num('dp', ($) => bend($).dp, 'Pa', { label: 'outer minus inner pressure' })],
    level: 3,
    hints: ['The flow rate per unit depth is $Vw = \\int_{r_1}^{r_2} K/r\\,dr = K\\ln(r_2/r_1)$, which gives $K$.', 'Integrate $\\partial p/\\partial r = \\rho K^2/r^3$ across: $\\Delta p = \\tfrac{\\rho K^2}{2}(1/r_1^2 - 1/r_2^2)$.'],
    steps: ($, sig) => {
      const b = bend($);
      return [String.raw`$r_1 = ${sig(b.r1)}$, $r_2 = ${sig(b.r2)}$ m, $K = ${sig($.V * $.w)}/\ln(${sig(b.r2 / b.r1)}) = ${sig(b.K)}$ m²/s, so $\Delta p = ${sig(b.dp)}$ Pa.`];
    },
    sim: { scenario: 'elbow', setup: bendSetup, read: (c) => ({ dp: c.dp }) },
    cases: [kase('The notes’ example: water elbow, 2 m/s, R = 0.3 m, w = 0.2 m', { fluid: 'water', V: 2, R: 0.3, w: 0.2 }, { dp: 3116 })],
  }),

  problem({
    id: 'u3.5.which-wall',
    title: 'Which wall feels more?',
    exam: 'u3',
    ch: '6',
    kind: 'conceptual',
    lab: 'bend',
    src: 'Flux, written for the Bend lab',
    topics: ['euler'],
    principles: ['euler-normal'],
    vars: { turn: choice(['left', 'turns left'], ['right', 'turns right']) },
    text: (T) => `Looking downstream, a water channel ${T.turn}. Which wall carries the higher pressure in the bend?`,
    parts: [
      pick('wall', 'higher pressure on', [
        ['left', 'the left wall', 'The pressure is higher on the outside of the turn.'],
        ['right', 'the right wall', 'The pressure is higher on the outside of the turn.'],
        ['same', 'neither: the pressure is even', 'Curved streamlines need a pressure that rises toward the outside.'],
      ], ($) => ($.turn === 'left' ? 'right' : 'left')),
    ],
    level: 1,
    hints: ['A parcel going round the bend needs a push toward the bend’s centre.', 'Only pressure can push it, so the pressure is higher on the side away from the centre.'],
    steps: ($) => [$.turn === 'left' ? 'The bend’s centre is on the left, so the push points left and the right wall, on the outside, carries more pressure.' : 'The bend’s centre is on the right, so the left wall, on the outside, carries more pressure.'],
    sim: {
      scenario: 'elbow',
      setup(s) {
        Object.assign(s, { fluid: 'water', V: 2, R: 0.3, w: 0.2, profile: 'vortex' });
      },
      read: (c, s, $) => ({ wall: c.dp > 0 ? ($.turn === 'left' ? 'right' : 'left') : 'same' }),
    },
    cases: [kase('A left turn', { turn: 'left' }, { wall: 'right' })],
  }),

  problem({
    id: 'u3.6.inner-speed',
    title: 'Fastest on the inside',
    exam: 'u3',
    ch: '6',
    lab: 'bend',
    src: 'Flux, written for the Bend lab',
    topics: ['euler'],
    principles: ['euler-normal'],
    vars: bendVars(),
    text: (T) => String.raw`${T.fluid === 'air' ? 'Air' : 'Water'} flows at a mean ${T.V} round a bend in a channel ${T.w} wide, with centre-line radius ${T.R}. As a free vortex, \(u = K/r\), how fast does it move along the inner wall?`,
    parts: [num('u1', ($) => bend($).uIn, 'm/s', { label: 'speed at the inner wall' })],
    level: 2,
    hints: ['Find $K$ from the flow rate: $Vw = K\\ln(r_2/r_1)$.', 'Then the inner wall, at $r_1 = R - w/2$, moves at $K/r_1$.'],
    steps: ($, sig) => {
      const b = bend($);
      return [String.raw`$K = ${sig($.V * $.w)}/\ln(${sig(b.r2)}/${sig(b.r1)}) = ${sig(b.K)}$ m²/s, so $u_1 = K/r_1 = ${sig(b.uIn)}$ m/s.`];
    },
    sim: { scenario: 'elbow', setup: bendSetup, read: (c) => ({ u1: c.uIn }) },
    cases: [kase('The notes’ example: water elbow, 2 m/s, R = 0.3 m, w = 0.2 m', { fluid: 'water', V: 2, R: 0.3, w: 0.2 }, { u1: 2.885 })],
  }),
];
