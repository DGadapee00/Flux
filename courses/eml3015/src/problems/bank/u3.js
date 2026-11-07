/**
 * Unit 3 bank: following the flow. Original problems, written for the Nozzle and Bend labs. Each
 * varies by layout or fluid as well as by numbers, carries staged hints and named traps
 * (../coaching/u3.js), and is checked against its lab (`sim`).
 */
import { bendPressure, nozzleParticle } from '@flux/subjects/mechanics/flowfields.js';
import { cvClosed } from '@flux/subjects/mechanics/continuity.js';
import { FLUIDS } from '@flux/subjects/mechanics/couette.js';
import { poiseuille } from '@flux/subjects/mechanics/poiseuille.js';
import { choice, kase, num, problem, range } from '../kit.js';

const pick = (id, label, options, correct) => ({ id, kind: 'choice', label, options: options.map(([value, text, why]) => ({ value, label: text, why })), correct, multi: false });
const RATIO = { gentle: 2, medium: 4, sharp: 6 };
/** Model scales by name: N in 1 : N. */
export const SCALE = { sixteen: 16, twentyfive: 25, hundred: 100 };
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

];
