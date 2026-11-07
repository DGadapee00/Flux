/**
 * Unit 3 bank: attitude control. Original problems, written for the Attitude lab, with staged hints
 * and named traps (../coaching/u3.js), each checked against the lab (`sim`).
 */
import { choice, kase, num, problem, range } from '../kit.js';

const pick = (id, label, options, correct) => ({ id, kind: 'choice', label, options: options.map(([value, text, why]) => ({ value, label: text, why })), correct, multi: false });
const DEG = Math.PI / 180;
/** The angle rate (°/s) that makes 1°/s about body z at pitch θ with zero roll. */
export const angleRate = ($) => ($.angle === 'yaw' ? 1 / Math.cos($.pitch) : Math.tan($.pitch));
/** A component of the body x axis after yaw ψ and pitch θ. */
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
];
