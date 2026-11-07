/**
 * Unit 3 bank: attitude control. Original problems, written for the Attitude lab, with staged hints
 * and named traps (../coaching/u3.js), each checked against the lab (`sim`).
 */
import { inertias } from '@flux/subjects/mechanics/spin.js';
import { choice, kase, num, problem, range } from '../kit.js';

const pick = (id, label, options, correct) => ({ id, kind: 'choice', label, options: options.map(([value, text, why]) => ({ value, label: text, why })), correct, multi: false });
const DEG = Math.PI / 180;
/** The angle rate (°/s) that makes 1°/s about body z at pitch θ with zero roll. */
export const angleRate = ($) => ($.angle === 'yaw' ? 1 / Math.cos($.pitch) : Math.tan($.pitch));
/** A component of the body x axis after yaw ψ and pitch θ. */
/** The middle-axis growth rate for the box spun at ω₀; `root` and `den` name the traps. */
export const tumbleRate = ($, root = true, den = 'outer') => {
  const [a, b, c] = inertias($.body);
  const k = den === 'outer' ? ((b - a) * (c - b)) / (a * c) : ((b - a) * (c - b)) / (b * b);
  return $.w0 * (root ? Math.sqrt(k) : k);
};
export { inertias };
/** The pointing problem: disturbances (N·m) and the steady PD offset in degrees. */
export const DIST = { small: 0.002, large: 0.01 };
export const offsetDeg = ($, mode = 'right') => (mode === 'rad' ? DIST[$.dist] / $.Kp : mode === 'times' ? (DIST[$.dist] * $.Kp * 180) / Math.PI : (DIST[$.dist] / $.Kp) * (180 / Math.PI));
export const noseComponent = ($) => ($.comp === 'x' ? Math.cos($.psi) * Math.cos($.theta) : Math.sin($.psi) * Math.cos($.theta));

export default [
  problem({
    id: 'u3.1.rates',
    title: 'How fast must the angles turn?',
    exam: 'u3',
    ch: '3',
    lab: 'attitude',
    src: 'Flux, written for the Attitude lab',
    topics: ['gimbal-lock'],
    principles: ['gimbal-lock'],
    vars: { angle: choice(['yaw', 'the yaw angle ψ'], ['roll', 'the roll angle φ']), pitch: range(20, 80, 10, '°', DEG) },
    text: (T) => `A satellite’s attitude is held as yaw, pitch and roll in 3-2-1 order. It sits at pitch θ = ${T.pitch}° with zero roll, and its controller wants a turn of 1°/s about the body’s own z axis. How fast must ${T.angle} change, in °/s?`,
    parts: [num('rate', ($) => angleRate($), '°/s', { label: 'rate' })],
    level: 2,
    hints: [
      'With φ = 0 the body rates are ω = (φ̇ − ψ̇ sin θ, θ̇, ψ̇ cos θ).',
      'Set ω = (0, 0, 1°/s) and solve for ψ̇ first, then φ̇.',
    ],
    steps: ($) => [
      String.raw`$\omega_z = \dot\psi\cos\theta = 1$, so $\dot\psi = 1/\cos\theta$; $\omega_x = \dot\phi - \dot\psi\sin\theta = 0$, so $\dot\phi = \tan\theta$`,
      String.raw`At $\theta = ${Math.round($.pitch / DEG)}^\circ$: ${Number(angleRate($).toPrecision(3))} °/s`,
    ],
    sim: {
      scenario: 'tilted',
      setup(s, $) {
        Object.assign(s, { psi: 0, theta: $.pitch / DEG, phi: 0, axis: 'z' });
      },
      read: (c, s, $) => ({ rate: $.angle === 'yaw' ? c.rates.psi : c.rates.phi }),
    },
    cases: [kase('yaw at 80°', { angle: 'yaw', pitch: 80 }, { rate: 5.759 })],
  }),

  problem({
    id: 'u3.2.nose',
    title: 'Where does the nose point?',
    exam: 'u3',
    ch: '3',
    lab: 'attitude',
    src: 'Flux, written for the Attitude lab',
    topics: ['rotation'],
    principles: ['rotation'],
    vars: { comp: choice(['x', 'the reference x component'], ['y', 'the reference y component']), psi: range(10, 80, 10, '°', DEG), theta: range(10, 60, 10, '°', DEG) },
    text: (T) => `A satellite starts with its body axes along the reference axes. It yaws ${T.psi}° about z, then pitches ${T.theta}° about its new y axis. Its nose is the body x axis. What is ${T.comp} of the nose’s unit vector?`,
    parts: [num('n', ($) => noseComponent($), '', { label: 'component' })],
    level: 2,
    hints: ['The body x axis is the first column of R = R_z(ψ) R_y(θ).', 'R_y(θ) sends x to (cos θ, 0, −sin θ); then R_z(ψ) turns that about z.'],
    steps: ($) => [String.raw`First column: $(\cos\psi\cos\theta,\ \sin\psi\cos\theta,\ -\sin\theta)$, so the answer is ${Number(noseComponent($).toPrecision(4))}`],
    sim: {
      scenario: 'tilted',
      setup(s, $) {
        Object.assign(s, { psi: $.psi / DEG, theta: $.theta / DEG, phi: 0 });
      },
      read: (c, s, $) => ({ n: $.comp === 'x' ? c.R[0][0] : c.R[1][0] }),
    },
    cases: [kase('x, yaw 30°, pitch 20°', { comp: 'x', psi: 30, theta: 20 }, { n: 0.8138 })],
  }),

  problem({
    id: 'u3.3.which-locks',
    title: 'Which one can lock?',
    exam: 'u3',
    ch: '3',
    kind: 'conceptual',
    lab: 'attitude',
    src: 'Flux, written for the Attitude lab',
    topics: ['gimbal-lock', 'quaternion'],
    principles: ['gimbal-lock'],
    vars: { rep: choice(['euler', 'three angles, yaw, pitch and roll'], ['quat', 'a unit quaternion'], ['matrix', 'a 3 × 3 rotation matrix']) },
    text: (T) => `Flight software stores the attitude as ${T.rep}, and updates it each step from the measured body rates. Is there an attitude where some small turn cannot be followed?`,
    parts: [
      pick('lock', 'can it lock', [
        ['yes', 'yes: at some attitude a direction of turn is lost', 'Three angles in sequence lose a direction where the first and last axes line up: pitch ±90° for yaw, pitch and roll.'],
        ['no', 'no: every small turn can be followed everywhere', 'A quaternion or a matrix is updated by multiplying by the small turn itself, which works at every attitude.'],
      ], ($) => ($.rep === 'euler' ? 'yes' : 'no')),
    ],
    level: 1,
    hints: ['Gimbal lock comes from describing a rotation with three angles in sequence.', 'A quaternion is updated as q ⊗ δq, a matrix as R δR.'],
    steps: ($) => [$.rep === 'euler' ? 'At pitch ±90° the yaw and roll axes line up: two angles, one direction.' : 'Multiplying by the small turn needs no angles, so nothing can line up.'],
    sim: {
      scenario: 'lock',
      read: (c, s, $) => ({ lock: $.rep === 'euler' ? (c.reachable ? 'no' : 'yes') : c.quatFollows ? 'no' : 'yes' }),
    },
    cases: [kase('three angles', { rep: 'euler' }, { lock: 'yes' })],
  }),

  problem({
    id: 'u3.4.tumble-rate',
    title: 'How fast does the tumble grow?',
    exam: 'u3',
    ch: '3',
    lab: 'spin',
    src: 'Flux, written for the Spin lab',
    topics: ['spin'],
    principles: ['spin-stability'],
    vars: { body: choice(['brick', 'a 12 kg brick, 0.6 × 0.4 × 0.2 m'], ['plate', 'a 12 kg plate, 0.5 × 0.3 × 0.05 m']), w0: range(0.5, 2, 0.5, 'rad/s') },
    text: (T) => `In orbit, ${T.body} is spun at ${T.w0} rad/s about its middle principal axis, with a tiny wobble. Treat it as a uniform box, I = m(b² + c²)/12 about each axis. At what rate λ does the wobble grow, in 1/s?`,
    parts: [num('lam', ($) => tumbleRate($), '1/s', { label: 'λ' })],
    level: 3,
    hints: [
      'Find the three inertias. The middle one is I₂, spun about; I₁ and I₃ are the other two.',
      'Linearise Euler’s equations: λ = ω₀√((I₂ − I₁)(I₃ − I₂)/(I₁I₃)).',
    ],
    steps: ($) => {
      const I = inertias($.body);
      return [
        String.raw`$I = ${I.map((v) => Number(v.toPrecision(4))).join(',\\ ')}$ kg·m²`,
        String.raw`$\lambda = ${$.w0}\sqrt{\dfrac{(${Number(I[1].toPrecision(4))} - ${Number(I[0].toPrecision(4))})(${Number(I[2].toPrecision(4))} - ${Number(I[1].toPrecision(4))})}{(${Number(I[0].toPrecision(4))})(${Number(I[2].toPrecision(4))})}} = ${Number(tumbleRate($).toPrecision(3))}$ 1/s`,
      ];
    },
    sim: {
      scenario: 'mid',
      setup(s, $) {
        Object.assign(s, { body: $.body, axis: 'y' });
      },
      // The lab spins at 1 rad/s; Euler's equations scale time with 1/ω₀, so λ scales with ω₀.
      read: (c, s, $) => ({ lam: c.check.measured * $.w0 }),
    },
    cases: [kase('the brick at 1 rad/s', { body: 'brick', w0: 1 }, { lam: 0.4804 })],
  }),

  problem({
    id: 'u3.5.which-axis',
    title: 'Which spin is steady?',
    exam: 'u3',
    ch: '3',
    kind: 'conceptual',
    lab: 'spin',
    src: 'Flux, written for the Spin lab',
    topics: ['spin'],
    principles: ['spin-stability'],
    vars: { axis: choice(['least', 'its least'], ['middle', 'its middle'], ['greatest', 'its greatest']) },
    text: (T) => `A rigid box with three different moments of inertia is spun in orbit about the principal axis of ${T.axis} moment of inertia, with a small wobble. With no torque on it, what does the wobble do?`,
    parts: [
      pick('d', 'the wobble', [
        ['steady', 'it stays small, turning over between the other two axes', 'About the least or the greatest axis, Euler’s equations make the wobble oscillate.'],
        ['flips', 'it grows until the box flips over, again and again', 'About the middle axis the linearised equations have a growing solution, e^(λt).'],
      ], ($) => ($.axis === 'middle' ? 'flips' : 'steady')),
    ],
    level: 1,
    hints: ['Linearise Euler’s equations about the spin.', 'The sign of (I_s − I_a)(I_s − I_b) decides: positive oscillates, negative grows.'],
    steps: ($) => [$.axis === 'middle' ? 'The two factors have opposite signs: the wobble grows.' : 'Both factors have the same sign: the wobble oscillates.'],
    sim: {
      scenario: 'max',
      setup(s, $) {
        s.axis = { least: 'x', middle: 'y', greatest: 'z' }[$.axis];
      },
      read: (c) => ({ d: c.flips > 0 ? 'flips' : 'steady' }),
    },
    cases: [kase('the middle axis', { axis: 'middle' }, { d: 'flips' })],
  }),

  problem({
    id: 'u3.6.offset',
    title: 'How far off target?',
    exam: 'u3',
    ch: '3',
    lab: 'pointing',
    src: 'Flux, written for the Pointing lab',
    topics: ['feedback'],
    principles: ['feedback'],
    vars: { dist: choice(['small', 'a steady 2 mN·m disturbance torque'], ['large', 'a steady 10 mN·m disturbance torque']), Kp: range(5, 30, 5, 'N·m/rad') },
    text: (T) => `A reaction wheel holds one axis of a satellite under PD control, K_p = ${T.Kp} N·m/rad and K_d = 20 N·m·s/rad, against ${T.dist}. The loop is stable. Once it settles, how far off target does the satellite point, in degrees?`,
    parts: [num('th', ($) => offsetDeg($), '°', { label: 'θ' })],
    level: 2,
    hints: ['In steady state nothing moves, so the wheel’s torque must cancel the disturbance.', 'The PD torque at rest is K_p θ, so θ = d/K_p, in radians.'],
    steps: ($) => [String.raw`$\theta = d/K_p = ${DIST[$.dist]}/${$.Kp} = ${(DIST[$.dist] / $.Kp).toExponential(2)}$ rad $= ${Number(offsetDeg($).toPrecision(3))}^\circ$`],
    sim: {
      scenario: 'pd',
      setup(s, $) {
        Object.assign(s, { Kp: $.Kp, Kd: 20, Ki: 0, tau: 0.5, dmN: DIST[$.dist] * 1000 });
      },
      read: (c) => ({ th: c.offsetDeg }),
    },
    cases: [kase('10 mN·m at K_p = 10', { dist: 'large', Kp: 10 }, { th: 0.0573 })],
  }),

  problem({
    id: 'u3.7.what-breaks',
    title: 'What breaks the loop?',
    exam: 'u3',
    ch: '3',
    kind: 'conceptual',
    lab: 'pointing',
    src: 'Flux, written for the Pointing lab',
    topics: ['feedback'],
    principles: ['feedback'],
    vars: { change: choice(['kp', 'K_p is raised from 10 to 60'], ['kd', 'K_d is raised from 20 to 40'], ['lag', 'the wheel is swapped for a slower one, τ = 3 s']) },
    text: (T) => `A PD loop holds a satellite’s pointing with K_p = 10 and K_d = 20 through a reaction wheel that lags by τ = 0.5 s, and it is stable. What happens if ${T.change}?`,
    parts: [
      pick('d', 'the loop', [
        ['stable', 'it stays stable', 'More damping, or more margin against the lag, keeps every pole in the left half plane.'],
        ['unstable', 'it rings and the swing grows', 'The PD loop with a lag is stable only while K_p < K_d/τ. Crossing that puts a pair of poles in the right half plane.'],
      ], ($) => ($.change === 'kd' ? 'stable' : 'unstable')),
    ],
    level: 2,
    hints: ['The characteristic equation is Jτs³ + Js² + K_d s + K_p = 0.', 'By Routh’s test it is stable while K_p < K_d/τ.'],
    steps: ($) => [{ kp: 'K_d/τ = 40 < 60: unstable.', kd: 'K_d/τ = 80 > 10: stable, and better damped.', lag: 'K_d/τ = 6.7 < 10: unstable.' }[$.change]],
    sim: {
      scenario: 'pd',
      setup(s, $) {
        Object.assign(s, { Kp: 10, Kd: 20, Ki: 0, tau: 0.5 }, { kp: { Kp: 60 }, kd: { Kd: 40 }, lag: { tau: 3 } }[$.change]);
      },
      read: (c) => ({ d: c.stable ? 'stable' : 'unstable' }),
    },
    cases: [kase('a slower wheel', { change: 'lag' }, { d: 'unstable' })],
  }),
];
