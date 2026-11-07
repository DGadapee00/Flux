/**
 * Unit 3 bank: following the flow. Original problems, written for the Nozzle and Bend labs. Each
 * varies by layout or fluid as well as by numbers, carries staged hints and named traps
 * (../coaching/u3.js), and is checked against its lab (`sim`).
 */
import { bendPressure, nozzleParticle } from '@flux/subjects/mechanics/flowfields.js';
import { cvClosed } from '@flux/subjects/mechanics/continuity.js';
import { FLUIDS } from '@flux/subjects/mechanics/couette.js';
import { poiseuille } from '@flux/subjects/mechanics/poiseuille.js';
import { plate } from '@flux/subjects/mechanics/blasius.js';
import { DUCT, RHO_WATER, flow } from '@flux/subjects/mechanics/transport.js';
import { vaneForce } from '@flux/subjects/mechanics/vane.js';
import { headLoss } from '@flux/subjects/mechanics/headloss.js';
import { choice, kase, num, problem, range } from '../kit.js';

const pick = (id, label, options, correct) => ({ id, kind: 'choice', label, options: options.map(([value, text, why]) => ({ value, label: text, why })), correct, multi: false });
const RATIO = { gentle: 2, medium: 4, sharp: 6 };
/** Model scales by name: N in 1 : N. */
export const SCALE = { sixteen: 16, twentyfive: 25, hundred: 100 };
/** The boundary-layer problem's two flows: fluid id and speed (m/s). */
export const STREAM = { air: { fluid: 'air', U: 3 }, water: { fluid: 'water', U: 0.2 } };
/** The Transport problem: the net force on the water in a 0.5 m box of the 4 to 1 nozzle. */
export const boxForce = ($) => {
  const F = flow({ duct: 'nozzle', k: $.flow === 'rising' ? 0.5 : 0 });
  const Q = F.Q(1);
  const dQ = F.Q0 * F.k;
  const Ain = F.A($.xb);
  const Aout = F.A($.xb + DUCT.w);
  const box = RHO_WATER * dQ * DUCT.w;
  const flux = RHO_WATER * Q * Q * (1 / Aout - 1 / Ain);
  return { Q, dQ, Ain, Aout, box, flux, F: box + flux };
};
/** The vane problem: the vane's speed by name, and the force along the jet; `turn` names the traps. */
export const VANE_U = { fixed: 0, moving: 5 };
/** The laminar head-loss problem: oil ν = 1e-4, 10 m; `f` and `twoG` name the traps. */
export const PIPE_D = { two: 0.02, four: 0.04 };
export const laminarLoss = ($, k = 64, twoG = 2 * 9.81) => {
  const D = PIPE_D[$.D];
  const V = $.Q / ((Math.PI * D * D) / 4);
  const Re = (V * D) / 1e-4;
  return ((k / Re) * (10 / D) * V * V) / twoG;
};
export const vaneFx = ($, turn = 'right') => {
  const w = 20 - VANE_U[$.motion];
  const q = 998 * ((Math.PI * 0.02 * 0.02) / 4) * w * w;
  const c = Math.cos(($.theta * Math.PI) / 180);
  return q * (turn === 'none' ? 1 : turn === 'minus' ? -c : 1 - c);
};
export const nuOf = (id) => FLUIDS[id].mu / FLUIDS[id].rho;
export const deltaAt = ($, x = $.x) => (4.91 * x) / Math.sqrt((STREAM[$.flow].U * x) / nuOf(STREAM[$.flow].fluid));
/** Flow rate in a pipe, m³/s, for the problems' fluids; R in m, dp in Pa, L in m. */
export const pipeQ = ($, R = $.R) => poiseuille({ geom: 'pipe', size: R, G: $.dp / $.L, mu: FLUIDS[$.fluid].mu }).Q;
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

  problem({
    id: 'u3.7.cv-net',
    title: 'Net mass out of a square',
    exam: 'u3',
    ch: '6',
    lab: 'continuity',
    src: 'Flux, written for the Continuity lab',
    topics: ['continuity'],
    principles: ['continuity'],
    vars: { field: choice(['piston', 'air squeezed by a piston, u = −a x, v = 0'], ['heated', 'air expanding as it heats, u = a x, v = a y']), a: range(0.5, 4, 0.5, '1/s'), h: range(0.1, 0.5, 0.05, 'm') },
    text: (T) => String.raw`In ${T.field}, with $a$ = ${T.a} and air at 1.2 kg/m³, a square control volume ${T.h} on a side sits in the flow. What net mass leaves it each second, per metre of depth? (Negative means it gains mass.)`,
    parts: [num('net', ($) => cvClosed({ field: $.field, a: $.a, h: $.h }).net, 'kg/s', { label: 'net mass out' })],
    level: 2,
    hints: ['By the divergence theorem the net outflow is $\\iint \\nabla\\cdot(\\rho\\mathbf v)\\,dA$.', 'Here ρ is uniform, so it is $\\rho\\,(\\partial u/\\partial x + \\partial v/\\partial y)\\,h^2$.'],
    steps: ($, sig) => [String.raw`$\nabla\cdot\mathbf v = ${$.field === 'piston' ? `-${$.a}` : `2 \times ${$.a}`}$ s⁻¹, so the net out is $1.2 \times (${sig($.field === 'piston' ? -$.a : 2 * $.a)}) \times ${sig($.h)}^2 = ${sig(cvClosed({ field: $.field, a: $.a, h: $.h }).net)}$ kg/s.`],
    sim: {
      scenario: 'piston',
      setup(s, $) {
        Object.assign(s, { field: $.field, a: $.a, h: $.h, x0: 0.3, y0: 0.2 });
      },
      read: (c) => ({ net: c.net }),
    },
    cases: [kase('The notes’ example: the piston, a = 2, h = 0.3 m', { field: 'piston', a: 2, h: 0.3 }, { net: -0.216 })],
  }),

  problem({
    id: 'u3.8.in-or-out',
    title: 'In equals out?',
    exam: 'u3',
    ch: '6',
    kind: 'conceptual',
    lab: 'continuity',
    src: 'Flux, written for the Continuity lab',
    topics: ['continuity'],
    principles: ['continuity'],
    vars: { field: choice(['corner', 'water flowing into a corner'], ['piston', 'air squeezed by a piston'], ['heated', 'air expanding as it heats']) },
    text: (T) => `A small fixed square sits in ${T.field}. Compare the mass flowing in through its sides with the mass flowing out.`,
    parts: [
      pick('balance', 'the mass flows', [
        ['equal', 'in equals out', 'The density cannot change, so nothing can pile up inside.'],
        ['more-in', 'more comes in than leaves', 'The gas inside is being compressed: its density rises.'],
        ['more-out', 'more leaves than comes in', 'The gas inside is expanding: its density falls.'],
      ], ($) => ({ corner: 'equal', piston: 'more-in', heated: 'more-out' }[$.field])),
    ],
    level: 1,
    hints: ['Mass in minus mass out is the rate mass builds up inside.', 'Can the density inside change in this flow, and which way?'],
    steps: ($) => [{ corner: 'Water is incompressible: ∇·v = 0, so in equals out.', piston: '∇·v < 0: the gas converges and its density rises, so more comes in.', heated: '∇·v > 0: the gas spreads out and its density falls, so more leaves.' }[$.field]],
    sim: {
      scenario: 'corner',
      setup(s, $) {
        Object.assign(s, { field: $.field, a: 2, x0: 0.4, y0: 0.4, h: 0.3 });
      },
      read: (c) => ({ balance: Math.abs(c.net) < 1e-9 ? 'equal' : c.net < 0 ? 'more-in' : 'more-out' }),
    },
    cases: [kase('Air squeezed by a piston', { field: 'piston' }, { balance: 'more-in' })],
  }),

  problem({
    id: 'u3.9.poiseuille',
    title: 'Flow down a tube',
    exam: 'u3',
    ch: '6',
    lab: 'pipe',
    src: 'Flux, written for the Pipe lab',
    topics: ['poiseuille'],
    principles: ['poiseuille'],
    vars: { fluid: choice(['oil', 'olive oil (μ = 0.0562 Pa·s)'], ['glycerol', 'glycerol (μ = 1.412 Pa·s)']), R: range(1, 5, 0.5, 'mm', 1e-3), dp: range(5, 50, 5, 'kPa', 1e3), L: range(0.5, 2, 0.5, 'm') },
    text: (T) => `${T.fluid[0].toUpperCase()}${T.fluid.slice(1)} flows steadily down a long straight tube of radius ${T.R} mm and length ${T.L} m, driven by a pressure drop of ${T.dp} kPa. Assuming laminar flow, what is the flow rate in mL/s?`,
    parts: [num('Q', ($) => pipeQ($) * 1e6, 'mL/s', { label: 'Q' })],
    level: 2,
    hints: ['Fully developed flow does not accelerate: the pressure gradient Δp/L balances viscous shear, and the profile is a parabola.', 'Q = πR⁴Δp/(8μL). Use R in metres; 1 m³/s is 10⁶ mL/s.'],
    steps: ($) => [String.raw`$Q = \dfrac{\pi R^4\Delta p}{8\mu L} = \dfrac{\pi(${$.R})^4(${$.dp})}{8(${FLUIDS[$.fluid].mu})(${$.L})} = ${Number((pipeQ($)).toPrecision(3))}$ m³/s $= ${Number((pipeQ($) * 1e6).toPrecision(3))}$ mL/s`],
    sim: {
      scenario: 'oil',
      setup(s, $) {
        Object.assign(s, { geom: 'pipe', fluid: $.fluid, size: $.R * 1e3, dp: $.dp / 1e3, L: $.L });
      },
      read: (c) => ({ Q: c.numeric.Q * 1e6 }),
    },
    cases: [kase('the notes’ olive oil', { fluid: 'oil', R: 2, dp: 10, L: 1 }, { Q: 1.118 })],
  }),

  problem({
    id: 'u3.10.radius',
    title: 'Twice the radius',
    exam: 'u3',
    ch: '6',
    kind: 'conceptual',
    lab: 'pipe',
    src: 'Flux, written for the Pipe lab',
    topics: ['poiseuille'],
    principles: ['poiseuille'],
    vars: { change: choice(['radius', 'the tube’s radius is doubled'], ['dp', 'the pressure drop is doubled'], ['length', 'the tube is made twice as long']) },
    text: (T) => `Oil flows slowly and steadily down a long tube. Everything else stays the same, but ${T.change}. By what factor does the flow rate change?`,
    parts: [
      pick('factor', 'the flow rate', [
        ['half', '×½', 'Twice the length halves the gradient Δp/L that drives the flow.'],
        ['two', '×2', 'Q is proportional to Δp: double the push, double the flow.'],
        ['four', '×4', 'The peak speed does go as R², but the area it flows through grows as R² too.'],
        ['sixteen', '×16', 'Q = πR⁴Δp/(8μL): R², twice over, from the speed and from the area.'],
      ], ($) => ({ radius: 'sixteen', dp: 'two', length: 'half' }[$.change])),
    ],
    level: 1,
    hints: ['Write Q = πR⁴Δp/(8μL) and change one thing.', 'How does each quantity enter: to which power?'],
    steps: ($) => [{ radius: 'Q grows as R⁴: 2⁴ = 16.', dp: 'Q grows as Δp: ×2.', length: 'Q falls as 1/L: ×½.' }[$.change]],
    sim: {
      scenario: 'oil',
      setup() {},
      read: (c, s, $) => {
        const base = { fluid: 'oil', R: s.size * 1e-3, dp: s.dp * 1e3, L: s.L };
        const after = { ...base, R: base.R * ($.change === 'radius' ? 2 : 1), dp: base.dp * ($.change === 'dp' ? 2 : 1), L: base.L * ($.change === 'length' ? 2 : 1) };
        const k = pipeQ(after) / c.Q;
        return { factor: k > 10 ? 'sixteen' : k > 3 ? 'four' : k > 1.5 ? 'two' : 'half' };
      },
    },
    cases: [kase('the radius doubled', { change: 'radius' }, { factor: 'sixteen' })],
  }),
  problem({
    id: 'u3.11.froude',
    title: 'How fast to tow the model',
    exam: 'u3',
    ch: '6',
    lab: 'model',
    src: 'Flux, written for the Model lab',
    topics: ['similitude'],
    principles: ['similitude'],
    vars: { scale: choice(['sixteen', '1 : 16'], ['twentyfive', '1 : 25'], ['hundred', '1 : 100']), Vp: range(4, 14, 1, 'm/s') },
    text: (T) => `A ship is to sail at ${T.Vp} m/s. A ${T.scale} model of it is towed in a water tank so that it makes the same wave pattern. How fast should the model go?`,
    parts: [num('Vm', ($) => $.Vp / Math.sqrt(SCALE[$.scale]), 'm/s', { label: 'V_m' })],
    level: 1,
    hints: ['The waves depend on the Froude number V/√(gL). Make it equal for the model and the ship.', 'V_m/√L_m = V_p/√L_p, so V_m = V_p √(L_m/L_p).'],
    steps: ($) => [String.raw`$V_m = V_p\sqrt{\lambda} = ${$.Vp}\sqrt{1/${SCALE[$.scale]}} = ${Number(($.Vp / Math.sqrt(SCALE[$.scale])).toPrecision(3))}$ m/s`],
    sim: {
      scenario: 'tank',
      setup(s, $) {
        Object.assign(s, { mode: 'surface', fluid: 'water', inv: SCALE[$.scale], Vp: $.Vp });
      },
      read: (c) => ({ Vm: c.Vm }),
    },
    cases: [kase('the notes’ 1/25 model', { scale: 'twentyfive', Vp: 10 }, { Vm: 2 })],
  }),

  problem({
    id: 'u3.12.both',
    title: 'Can the model match both?',
    exam: 'u3',
    ch: '6',
    kind: 'conceptual',
    lab: 'model',
    src: 'Flux, written for the Model lab',
    topics: ['similitude'],
    principles: ['similitude'],
    vars: { fluid: choice(['water', 'water'], ['mercury', 'mercury, whose ν is about a ninth of water’s']) },
    text: (T) => `A 1/25 model of a ship is towed in ${T.fluid} at the speed that matches the ship’s Froude number. How does its Reynolds number compare with the ship’s?`,
    parts: [
      pick('re', 'its Reynolds number', [
        ['match', 'it matches too', 'Matching Fr fixes V_m = V_p√λ, and then Re_m/Re_p = λ^{3/2} ν_p/ν_m, which is 1 only for ν_m = λ^{3/2} ν_p.'],
        ['low', 'it is far too low', 'λ^{3/2} = 1/125 here. Even a fluid nine times thinner than water leaves Re about 14 times short.'],
        ['high', 'it is too high', 'The model is smaller and slower: both lower its Reynolds number.'],
      ], () => 'low'),
    ],
    level: 2,
    hints: ['Write Re_m/Re_p = (V_m/V_p)(L_m/L_p)(ν_p/ν_m).', 'With V_m/V_p = √λ, that is λ^{3/2} ν_p/ν_m.'],
    steps: ($) => [$.fluid === 'water' ? 'Re_m/Re_p = (1/25)^{3/2} = 1/125: far too low.' : 'Re_m/Re_p = (1/125)(about 9) ≈ 0.07: still far too low.'],
    sim: {
      scenario: 'tank',
      setup(s, $) {
        Object.assign(s, { mode: 'surface', fluid: $.fluid, inv: 25 });
      },
      read: (c) => ({ re: Math.abs(c.reRatio - 1) < 0.02 ? 'match' : c.reRatio < 1 ? 'low' : 'high' }),
    },
    cases: [kase('in water', { fluid: 'water' }, { re: 'low' })],
  }),

  problem({
    id: 'u3.13.delta',
    title: 'How thick is the layer?',
    exam: 'u3',
    ch: '6',
    lab: 'layer',
    src: 'Flux, written for the Boundary layer lab',
    topics: ['boundary-layer'],
    principles: ['boundary-layer'],
    vars: { flow: choice(['air', 'air at 3 m/s (ν = 1.54 × 10⁻⁵ m²/s)'], ['water', 'water at 0.2 m/s (ν = 1.00 × 10⁻⁶ m²/s)']), x: range(0.1, 0.9, 0.1, 'm') },
    text: (T) => `A smooth flat plate sits edge-on in a steady stream of ${T.flow}. How thick is the laminar boundary layer ${T.x} m from the leading edge, in mm?`,
    parts: [num('d', ($) => deltaAt($) * 1000, 'mm', { label: 'δ' })],
    level: 2,
    hints: ['Find Re_x = Ux/ν at that distance, and check it is below 5 × 10⁵.', 'δ = 4.91 x/√Re_x.'],
    steps: ($) => {
      const Re = (STREAM[$.flow].U * $.x) / nuOf(STREAM[$.flow].fluid);
      return [String.raw`$\mathrm{Re}_x = ${Number(Re.toPrecision(3))}$, so $\delta = \dfrac{4.91(${$.x})}{\sqrt{${Number(Re.toPrecision(3))}}} = ${Number((deltaAt($) * 1000).toPrecision(3))}$ mm`];
    },
    sim: {
      scenario: 'air',
      setup(s, $) {
        Object.assign(s, { fluid: STREAM[$.flow].fluid, U: STREAM[$.flow].U, L: $.x });
      },
      read: (c) => ({ d: c.deltaEnd * 1000 }),
    },
    cases: [kase('air, half a metre along', { flow: 'air', x: 0.5 }, { d: 7.862 })],
  }),

  problem({
    id: 'u3.14.thinner',
    title: 'Thicker or thinner?',
    exam: 'u3',
    ch: '6',
    kind: 'conceptual',
    lab: 'layer',
    src: 'Flux, written for the Boundary layer lab',
    topics: ['boundary-layer'],
    principles: ['boundary-layer'],
    vars: { change: choice(['speed', 'the stream’s speed doubles, at the same point on the plate'], ['distance', 'you look twice as far from the leading edge, at the same speed']) },
    text: (T) => `A laminar boundary layer grows along a flat plate. What happens to its thickness if ${T.change}?`,
    parts: [
      pick('d', 'the thickness', [
        ['half', 'it halves', 'δ does not go as 1/U: it goes as 1/√U.'],
        ['thinner', 'it thins by √2', 'δ = 4.91x/√(Ux/ν) ∝ 1/√U for a faster stream.'],
        ['thicker', 'it grows by √2', 'δ ∝ √x: momentum has had longer to diffuse out from the wall.'],
        ['double', 'it doubles', 'δ does not grow in step with x: it grows as √x.'],
      ], ($) => ($.change === 'speed' ? 'thinner' : 'thicker')),
    ],
    level: 1,
    hints: ['Write δ = 4.91x/√(Ux/ν) and change one thing.', 'How do U and x enter: to which power?'],
    steps: ($) => [$.change === 'speed' ? 'δ ∝ U^(−1/2): twice U gives δ/√2.' : 'δ ∝ x^(1/2): twice x gives √2 δ.'],
    sim: {
      scenario: 'air',
      setup(s) {
        Object.assign(s, { fluid: 'air', U: 3, L: 1 });
      },
      read: (c, s, $) => {
        const k = $.change === 'speed' ? plate({ U: 2 * s.U, L: s.L, nu: c.nu, rho: c.rho }).delta(0.4) / c.delta(0.4) : c.delta(0.8) / c.delta(0.4);
        return { d: k < 0.6 ? 'half' : k < 1 ? 'thinner' : k < 1.6 ? 'thicker' : 'double' };
      },
    },
    cases: [kase('a faster stream', { change: 'speed' }, { d: 'thinner' })],
  }),


  problem({
    id: 'u3.15.box-force',
    title: 'The force on the water in a box',
    exam: 'u3',
    ch: '6',
    lab: 'transport',
    src: 'Flux, written for the Transport lab',
    topics: ['transport'],
    principles: ['transport'],
    vars: { flow: choice(['steady', 'holds steady at 10 L/s'], ['rising', 'is 15 L/s and rising by 5 L/s every second']), xb: range(0.25, 1.25, 0.25, 'm') },
    text: (T) => `Water (ρ = 1000 kg/m³) flows along a duct whose area falls in a straight line from 0.02 m² at the inlet to 0.005 m² 2 m downstream. The flow ${T.flow}. A fixed box holds the 0.5 m of duct that starts ${T.xb} m from the inlet. Treat the flow as one-dimensional. What net force along the duct acts on the water in the box, in N?`,
    parts: [num('F', ($) => boxForce($).F, 'N', { label: 'F' })],
    level: 3,
    hints: [
      'Use the transport theorem with b = u: the force is the box term plus the momentum flowing out minus the momentum flowing in.',
      'The box holds ∫ρuA dx = ρQ × 0.5 m of momentum, so its rate is ρQ′ × 0.5 m. Through a face, momentum flows at ρQu = ρQ²/A.',
    ],
    steps: ($) => {
      const r = boxForce($);
      return [
        String.raw`Areas at the faces: $A_\text{in} = ${Number(r.Ain.toPrecision(4))}$ m², $A_\text{out} = ${Number(r.Aout.toPrecision(4))}$ m²`,
        String.raw`Box term $\rho Q' w = 1000(${r.dQ})(0.5) = ${Number(r.box.toPrecision(3))}$ N; net outflow $\rho Q^2(1/A_\text{out} - 1/A_\text{in}) = ${Number(r.flux.toPrecision(3))}$ N`,
        String.raw`$F = ${Number(r.F.toPrecision(3))}$ N`,
      ];
    },
    sim: {
      scenario: 'nozzle',
      setup(s, $) {
        Object.assign(s, { duct: 'nozzle', prop: 'momentum', t: 1, k: $.flow === 'rising' ? 0.5 : 0, xb: $.xb });
      },
      read: (c) => ({ F: c.sysRate }),
    },
    cases: [kase('steady, from 0.75 m', { flow: 'steady', xb: 0.75 }, { F: 2.455 })],
  }),

  problem({
    id: 'u3.16.which-term',
    title: 'Which term carries the change?',
    exam: 'u3',
    ch: '6',
    kind: 'conceptual',
    lab: 'transport',
    src: 'Flux, written for the Transport lab',
    topics: ['transport'],
    principles: ['transport'],
    vars: {
      setup: choice(
        ['nozzle', 'water flowing steadily through a nozzle, and B is the momentum'],
        ['surge', 'water in a straight pipe whose flow is growing, and B is the momentum'],
        ['blob', 'a blob of dye carried into the box by a steady flow, and B is the dye'],
      ),
    },
    text: (T) => `A fixed box sits in a duct, with ${T.setup}. The system is the water inside the box at this instant. In the Reynolds transport theorem, which terms make up the system’s rate of change of B?`,
    parts: [
      pick('term', 'the terms', [
        ['box', 'the build-up inside the box alone', 'The box term alone carries it when the property enters and leaves at the same rate but grows inside, as when a flow speeds up in a straight pipe.'],
        ['outflow', 'the net outflow through the faces alone', 'The outflow alone carries it when nothing in the box changes but the property leaves at a different rate from the one it enters at, as in a steady nozzle.'],
        ['both', 'both, and neither is zero', 'Both count when the flow is unsteady and the duct changes, such as a nozzle whose flow is growing.'],
        ['none', 'the two cancel: the system does not change', 'A property the water carries unchanged, like a passive dye, stays with the system. Whatever builds up in the box has come in through a face.'],
      ], ($) => ({ nozzle: 'outflow', surge: 'box', blob: 'none' })[$.setup]),
    ],
    level: 2,
    hints: ['Ask two questions: does anything inside the box change with time, and does B leave at a different rate from the one it enters at?', 'Then ask whether the system itself can change B at all.'],
    steps: ($) => [
      {
        nozzle: 'Steady: the box term is zero. The water leaves faster than it entered, so the net outflow of momentum is not zero, and it is the net force on the system.',
        surge: 'Straight pipe: the same speed in and out, so the fluxes cancel. The flow grows, so the momentum in the box grows: the box term is the whole rate.',
        blob: 'The dye rides with the water. The box term is the dye arriving, the outflow is minus the same amount, and the system’s dye stays fixed.',
      }[$.setup],
    ],
    sim: {
      scenario: 'nozzle',
      setup(s, $) {
        const S = { nozzle: ['nozzle', 'momentum', 0], surge: ['straight', 'momentum', 0.5], blob: ['straight', 'dye', 0] }[$.setup];
        Object.assign(s, { duct: S[0], prop: S[1], k: S[2], t: 1, xb: 0.75 });
      },
      read: (c) => ({ term: c.fixed ? 'none' : c.steady ? 'outflow' : c.noFlux ? 'box' : 'both' }),
    },
    cases: [kase('a steady nozzle', { setup: 'nozzle' }, { term: 'outflow' })],
  }),

  problem({
    id: 'u3.17.vane-force',
    title: 'The force on a vane',
    exam: 'u3',
    ch: '6',
    lab: 'vane',
    src: 'Flux, written for the Vane lab',
    topics: ['momentum-cv'],
    principles: ['momentum-cv'],
    vars: { motion: choice(['fixed', 'a fixed vane'], ['moving', 'a vane moving away from the nozzle at 5 m/s']), theta: range(120, 180, 15, '°') },
    text: (T) => `A 2 cm water jet (ρ = 998 kg/m³) at 20 m/s strikes ${T.motion} that turns it through ${T.theta}°, with no friction. What force along the jet does the water exert on the vane, in N?`,
    parts: [num('F', ($) => vaneFx($), 'N', { label: 'F_x' })],
    level: 2,
    hints: [
      'Work in the vane’s frame: the water arrives at w = V − U and leaves at w, turned through θ.',
      'The mass reaching one vane each second is ρAw; the change of momentum flux along the jet is ρAw²(1 − cos θ).',
    ],
    steps: ($) => {
      const w = 20 - (VANE_U[$.motion] || 0);
      return [String.raw`$A = \pi(0.02)^2/4 = 3.14\times10^{-4}$ m², $w = ${w}$ m/s, so $F_x = 998(3.14\times10^{-4})(${w})^2(1 - \cos ${$.theta}^\circ) = ${Number(vaneFx($).toPrecision(3))}$ N`];
    },
    sim: {
      scenario: 'fixed90',
      setup(s, $) {
        Object.assign(s, { V: 20, u: VANE_U[$.motion] / 20, theta: $.theta, dcm: 2 });
      },
      read: (c) => ({ F: c.Fx }),
    },
    cases: [kase('a fixed 180° vane', { motion: 'fixed', theta: 180 }, { F: 250.8 })],
  }),

  problem({
    id: 'u3.18.relative',
    title: 'What changes the force?',
    exam: 'u3',
    ch: '6',
    kind: 'conceptual',
    lab: 'vane',
    src: 'Flux, written for the Vane lab',
    topics: ['momentum-cv'],
    principles: ['momentum-cv'],
    vars: { change: choice(['half', 'the vane runs away from the nozzle at half the jet’s speed'], ['turn', 'the vane turns the jet right back, 180°, instead of 90°'], ['faster', 'the jet’s speed doubles, with the vane still fixed']) },
    text: (T) => `A water jet strikes a fixed vane that turns it through 90°. By what factor does the force along the jet change if ${T.change}?`,
    parts: [
      pick('f', 'the force', [
        ['quarter', 'a quarter', 'The relative speed halves, and it enters twice: in the water arriving each second and in the momentum each kilogram carries.'],
        ['half', 'a half', 'Halving would need the force to go as w, but it goes as w².'],
        ['double', 'twice', '1 − cos θ goes from 1 at 90° to 2 at 180°.'],
        ['four', 'four times', 'Twice the speed is twice the water each second, each carrying twice the momentum.'],
      ], ($) => ({ half: 'quarter', turn: 'double', faster: 'four' })[$.change]),
    ],
    level: 1,
    hints: ['Write F_x = ρAw²(1 − cos θ) with w = V − U.', 'See which of w and θ the change affects.'],
    steps: ($) => [{ half: 'w halves: ×¼.', turn: '1 − cos θ doubles: ×2.', faster: 'w doubles: ×4.' }[$.change]],
    sim: {
      scenario: 'fixed90',
      read: (c, s, $) => {
        const p = { V: s.V, U: s.u * s.V, theta: s.theta, d: s.dcm / 100 };
        const q = { ...p, ...({ half: { U: p.V / 2 }, turn: { theta: 180 }, faster: { V: 2 * p.V } }[$.change]) };
        const r = vaneForce(q).Fx / c.Fx;
        const opts = { quarter: 0.25, half: 0.5, double: 2, four: 4 };
        return { f: Object.keys(opts).reduce((a, b) => (Math.abs(opts[b] - r) < Math.abs(opts[a] - r) ? b : a)) };
      },
    },
    cases: [kase('half the speed', { change: 'half' }, { f: 'quarter' })],
  }),

  problem({
    id: 'u3.19.laminar-loss',
    title: 'Head loss in laminar flow',
    exam: 'u3',
    ch: '6',
    lab: 'headloss',
    src: 'Flux, written for the Head loss lab',
    topics: ['head-loss'],
    principles: ['head-loss'],
    vars: { D: choice(['two', 'a 2 cm pipe'], ['four', 'a 4 cm pipe']), Q: range(0.1, 0.5, 0.1, 'L/s', 1e-3) },
    text: (T) => `An oil with ν = 1.0 × 10⁻⁴ m²/s flows at ${T.Q} L/s through 10 m of ${T.D}. Check that the flow is laminar, then find the head loss, in m.`,
    parts: [num('h', ($) => laminarLoss($), 'm', { label: 'h_L' })],
    level: 2,
    hints: ['V = Q/A and Re = VD/ν. It should come out well below 2300.', 'h_L = f(L/D)V²/2g with f = 64/Re.'],
    steps: ($) => {
      const D = PIPE_D[$.D];
      const V = $.Q / ((Math.PI * D * D) / 4);
      const Re = (V * D) / 1e-4;
      return [String.raw`$V = ${Number(V.toPrecision(3))}$ m/s, $\mathrm{Re} = ${Number(Re.toPrecision(3))}$: laminar, $f = 64/\mathrm{Re} = ${Number((64 / Re).toPrecision(3))}$`, String.raw`$h_L = ${Number(laminarLoss($).toPrecision(3))}$ m`];
    },
    sim: {
      scenario: 'laminar',
      setup(s, $) {
        Object.assign(s, { fluid: 'oil', lQ: Math.log10($.Q * 1000), Dcm: PIPE_D[$.D] * 100, emm: 0.045 });
      },
      read: (c) => ({ h: c.hL }),
    },
    cases: [kase('4 cm at 0.2 L/s', { D: 'four', Q: 0.2 }, { h: 0.3245 })],
  }),

  problem({
    id: 'u3.20.doubling',
    title: 'Double the flow',
    exam: 'u3',
    ch: '6',
    kind: 'conceptual',
    lab: 'headloss',
    src: 'Flux, written for the Head loss lab',
    topics: ['head-loss'],
    principles: ['head-loss'],
    vars: { regime: choice(['laminar', 'a laminar oil flow'], ['rough', 'a turbulent water flow in a rough pipe']) },
    text: (T) => `In ${T.regime}, the flow rate doubles. What happens to the head loss along the pipe?`,
    parts: [
      pick('d', 'the head loss', [
        ['same', 'it does not change', 'More flow always costs more head: the wall has to slow more fluid, faster.'],
        ['two', 'it doubles', 'Laminar: f = 64/Re falls as the speed rises, so h_L ∝ fV² ∝ V.'],
        ['four', 'it nearly quadruples', 'Rough turbulent: f hardly changes, so h_L ∝ V².'],
      ], ($) => ($.regime === 'laminar' ? 'two' : 'four')),
    ],
    level: 1,
    hints: ['h_L = f(L/D)V²/2g. How does f depend on V in each regime?', 'Laminar f = 64/Re; rough turbulent f levels off.'],
    steps: ($) => [$.regime === 'laminar' ? 'f ∝ 1/V, so h_L ∝ V: ×2.' : 'f nearly constant, so h_L ∝ V²: ×4.'],
    sim: {
      scenario: 'laminar',
      read: (c, s, $) => {
        const base = $.regime === 'laminar' ? { fluid: 'oil', D: 0.05, eps: 0.045e-3 } : { fluid: 'water', D: 0.05, eps: 1e-3 };
        const r = headLoss({ ...base, Q: 0.004 }).hL / headLoss({ ...base, Q: 0.002 }).hL;
        const opts = { same: 1, two: 2, four: 4 };
        return { d: Object.keys(opts).reduce((a, b) => (Math.abs(opts[b] - r) < Math.abs(opts[a] - r) ? b : a)) };
      },
    },
    cases: [kase('laminar oil', { regime: 'laminar' }, { d: 'two' })],
  }),
];
