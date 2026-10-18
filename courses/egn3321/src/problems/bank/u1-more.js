/**
 * Unit 1, beyond the numeric drills: three conceptual questions, each wrong option with its own
 * reason, and the unit's application, a sounding rocket's boost and coast (the `boost` lab).
 */
import { flight } from '../../labs/boost.js';
import { G, choice, kase, num, problem, range } from '../kit.js';

/** A choice part whose options each carry a `why`. */
const pick = (id, label, options, correct) => ({ id, kind: 'choice', label, options: options.map(([value, text, why]) => ({ value, label: text, why })), correct, multi: false });

const TOP = {
  ball: 'a ball thrown straight up',
  rocket: 'a sounding rocket coasting after its motor burns out',
  diver: 'a diver who springs straight up off a board',
};

/** v(t) for each described motion, sampled to sort its graph's shape: the second method. */
const MOTION = {
  cruise: (t) => 4,
  speedup: (t) => 3 * t,
  brake: (t) => 9 - 3 * t,
  jerk: (t) => 0.5 * t * t,
};
function shapeOf(motion) {
  const v = MOTION[motion];
  const d1 = v(1) - v(0);
  const d2 = v(2) - v(1);
  if (Math.abs(d1) < 1e-9 && Math.abs(d2) < 1e-9) return 'flat';
  if (Math.abs(d2 - d1) > 1e-9) return 'curve';
  return d1 > 0 ? 'up' : 'down';
}

/** Tangential and normal parts on a curve, and which way their sum points. */
function directionOf(drive) {
  // a_n = v²/ρ is always toward the centre on a curve; only the sign of a_t is in question.
  const at = { steady: 0, speeding: 1.5, braking: -1.5 }[drive];
  if (Math.abs(at) < 1e-9) return 'in';
  return at > 0 ? 'in-forward' : 'in-back';
}

const more = [
  problem({
    id: 'u1.12.at-top',
    title: 'At the top of the climb',
    exam: 'u1',
    ch: '12',
    kind: 'conceptual',
    lab: null,
    src: 'Hibbeler §12.2',
    topics: ['rectilinear'],
    principles: ['rect-kin'],
    vars: { body: choice(['ball', TOP.ball], ['rocket', TOP.rocket], ['diver', TOP.diver]) },
    text: (T) => `Think of ${T.body}, at the instant it reaches its highest point. Ignore air resistance. What are its velocity and its acceleration at that instant?`,
    parts: [
      pick('v', 'velocity', [
        ['zero', 'zero', 'At the top it has stopped rising and not yet started down: v = 0.'],
        ['up', 'upward, but small', 'Then it would still be rising, and this would not be the top.'],
        ['down', 'downward, but small', 'It turns round at the top: just before, it was rising; just after, falling. At the instant itself, v = 0.'],
      ], 'zero'),
      pick('a', 'acceleration', [
        ['zero', 'zero', 'Zero speed is not zero acceleration. If a were zero at the top, v would stay zero and it would hang there.'],
        ['down', 'g, downward', 'Gravity pulls the whole time, including the instant v = 0. That is what turns it round.'],
        ['up', 'g, upward', 'Gravity points down at every instant of the flight.'],
      ], 'down'),
    ],
    level: 1,
    hints: ['Velocity and acceleration are different quantities. One can be zero while the other is not.',
      'What force acts at the top, and what does a force do to the velocity?',
    ],
    steps: () => [
      'The velocity changes sign at the top, from up to down, so it passes through zero.',
      'Gravity still acts, so the acceleration is g downward. It is what makes the velocity change sign.',
    ],
    second: () => {
      // Sample v(t) = v0 − g t through the top: the sign change, and a slope that never vanishes.
      const v0 = 10;
      const tTop = v0 / G;
      const v = (t) => v0 - G * t;
      const a = (v(tTop + 1e-3) - v(tTop - 1e-3)) / 2e-3;
      return { v: Math.abs(v(tTop)) < 1e-9 ? 'zero' : v(tTop) > 0 ? 'up' : 'down', a: a < 0 ? 'down' : a > 0 ? 'up' : 'zero' };
    },
    cases: [kase('Hibbeler §12.2', { body: 'ball' }, { v: 'zero', a: 'down' })],
  }),

  problem({
    id: 'u1.12.vt-shape',
    title: 'Which v–t graph?',
    exam: 'u1',
    ch: '12',
    kind: 'conceptual',
    lab: 'rectilinear',
    src: 'Hibbeler §12.3',
    topics: ['erratic'],
    principles: ['rect-kin'],
    vars: {
      motion: choice(
        ['cruise', 'cruises at a steady speed'],
        ['speedup', 'starts from rest and speeds up at a constant rate'],
        ['brake', 'brakes at a constant rate to a stop'],
        ['jerk', 'starts from rest with an acceleration that grows steadily'],
      ),
    },
    text: (T) => `A cart on a straight track ${T.motion}. Which shape does its v–t graph have?`,
    parts: [
      pick('shape', 'the v–t graph', [
        ['flat', 'a horizontal line', 'A horizontal v–t line means a constant velocity: zero acceleration.'],
        ['up', 'a straight line sloping up', 'A straight rising line means a constant positive acceleration: the slope is a.'],
        ['down', 'a straight line sloping down', 'A straight falling line means a constant negative acceleration.'],
        ['curve', 'a curve that gets steeper', 'A steepening curve means the slope, the acceleration, is itself growing.'],
      ], ($) => shapeOf($.motion)),
    ],
    level: 1,
    hints: ['The slope of a v–t graph is the acceleration.',
      'Constant acceleration gives a straight line; changing acceleration bends it.',
    ],
    steps: ($) => [
      'The slope of v against t is a.',
      { cruise: 'Zero acceleration: the line is flat.', speedup: 'Constant positive a: a straight line rising from zero.', brake: 'Constant negative a: a straight line falling to zero.', jerk: 'a grows with t: the slope grows, so the curve steepens.' }[$.motion],
    ],
    second: ($) => ({ shape: shapeOf($.motion) }),
    cases: [kase('Hibbeler §12.3', { motion: 'jerk' }, { shape: 'curve' })],
  }),

  problem({
    id: 'u1.12.nt-direction',
    title: 'Which way does a car on a bend accelerate?',
    exam: 'u1',
    ch: '12',
    kind: 'conceptual',
    lab: 'path-nt',
    src: 'Hibbeler §12.7',
    topics: ['normal-tangential'],
    principles: ['curv-kin'],
    vars: { drive: choice(['steady', 'at a steady speed'], ['speeding', 'while speeding up'], ['braking', 'while braking']) },
    text: (T) => `A car takes a curve ${T.drive}. Which way does its acceleration point?`,
    parts: [
      pick('dir', 'direction', [
        ['in', 'toward the centre of the curve', 'Only when the speed is steady: then a_t = 0 and only a_n = v²/ρ is left.'],
        ['in-forward', 'toward the centre and forward', 'A forward part means a_t > 0: the car is speeding up.'],
        ['in-back', 'toward the centre and backward', 'A backward part means a_t < 0: the car is slowing.'],
        ['ahead', 'straight ahead, along the path', 'On a curve there is always a normal part, v²/ρ, toward the centre: the direction of travel is turning.'],
      ], ($) => directionOf($.drive)),
    ],
    level: 2,
    hints: ['Split the acceleration into a part along the path and a part toward the centre of the curve.',
      'The normal part, v²/ρ, is never zero on a curve. The tangential part is the rate of change of speed.',
    ],
    steps: ($) => [
      String.raw`$a_n = v^2/\rho$ points to the centre of curvature whenever the car is moving on the curve.`,
      { steady: String.raw`Steady speed: $a_t = 0$, so $\vec a$ points to the centre.`, speeding: String.raw`Speeding up: $a_t > 0$ points forward, so $\vec a$ leans forward of the centre.`, braking: String.raw`Braking: $a_t < 0$ points backward, so $\vec a$ leans behind the centre.` }[$.drive],
    ],
    second: ($) => ({ dir: directionOf($.drive) }),
    cases: [kase('Hibbeler §12.7', { drive: 'braking' }, { dir: 'in-back' })],
  }),

  problem({
    id: 'u1.12.boost',
    title: 'Application: a sounding rocket',
    exam: 'u1',
    ch: '12',
    lab: 'boost',
    src: 'Hibbeler §12.3',
    topics: ['rectilinear', 'erratic'],
    principles: ['rect-kin'],
    // Designed numbers: the burnout speed and burn time are picked, and the acceleration follows.
    vars: {
      vb: range(100, 200, 10, 'm/s'),
      tb: range(2, 6, 0.5, 's'),
      m: range(8, 20, 1, 'kg'),
      given: choice(['net', 'its net acceleration'], ['thrust', 'its thrust and mass']),
    },
    derive: ($) => {
      const a = $.vb / $.tb;
      return { a, T: $.m * (a + G) };
    },
    text: (T, $, sig) => ($.given === 'thrust'
      ? String.raw`A small sounding rocket of mass $${T.m}\ \mathrm{kg}$ leaves the pad straight up. Its motor gives a thrust of $${sig($.T)}\ \mathrm{N}$ for $${T.tb}\ \mathrm{s}$; treat the mass as constant and ignore drag. Find the speed at burnout and the apogee.`
      : String.raw`A small sounding rocket leaves the pad straight up with a net acceleration of $${sig($.a)}\ \mathrm{m/s^2}$ for $${T.tb}\ \mathrm{s}$, then coasts. Ignore drag. Find the speed at burnout and the apogee.`),
    parts: [
      num('vBo', ($) => flight($.a, $.tb).vBo, 'm/s', {
        label: 'burnout speed',
        traps: [[($) => ($.given === 'thrust' ? ($.T / $.m) * $.tb : ($.a - G) * $.tb), ($) => ($.given === 'thrust' ? 'Thrust over mass is not the acceleration: subtract g for the weight.' : 'The acceleration given is already net: g is in it. Do not subtract it again.')]],
      }),
      num('apogee', ($) => flight($.a, $.tb).apogee, 'm', {
        label: 'apogee',
        traps: [
          [($) => flight($.a, $.tb).hBo, 'That is the burnout height. The rocket is still moving up fast: add the coast.'],
          [($) => flight($.a, $.tb).coast, 'That is only the coast. Add the height already reached at burnout.'],
        ],
      }),
    ],
    level: 2,
    hints: ['The flight has two parts with different constant accelerations. Treat them one at a time.',
      String.raw`During the burn, $v = at$ and $s = \tfrac12at^2$. After it, the rocket coasts against $g$ until $v = 0$: it rises a further $v_{bo}^2/2g$.`,
    ],
    steps: ($, sig) => {
      const f = flight($.a, $.tb);
      return [
        ...($.given === 'thrust' ? [String.raw`Net acceleration: $a = T/m - g = ${sig($.T)}/${sig($.m)} - 9.81 = ${sig($.a)}\ \mathrm{m/s^2}$.`] : []),
        String.raw`Burnout: $v_{bo} = a t_b = ${sig(f.vBo)}\ \mathrm{m/s}$ at $h_{bo} = \tfrac12 a t_b^2 = ${sig(f.hBo)}\ \mathrm{m}$.`,
        String.raw`Coast: $v_{bo}^2/2g = ${sig(f.coast)}\ \mathrm{m}$. Apogee $= ${sig(f.apogee)}\ \mathrm{m}$.`,
      ];
    },
    // Second: step the flight forward until the speed turns negative.
    second: ($) => {
      let s = 0;
      let v = 0;
      let t = 0;
      const dt = 1e-4;
      let vBo = null;
      while (true) {
        const acc = t < $.tb - 1e-12 ? $.a : -G;
        const h = t < $.tb && t + dt > $.tb ? $.tb - t : dt;
        const v1 = v + acc * h;
        if (t >= $.tb && v1 < 0) return { vBo, apogee: s + (v * v) / (2 * G) };
        s += 0.5 * (v + v1) * h;
        v = v1;
        t += h;
        if (vBo === null && t >= $.tb - 1e-12) vBo = v;
      }
    },
    sim: {
      scenario: 'student',
      setup(s, $) {
        s.a = $.a;
        s.tb = $.tb;
        s.t = null;
      },
      read: (c) => ({ vBo: c.vBo, apogee: c.apogee }),
    },
    cases: [kase('Hibbeler §12.3', { vb: 120, tb: 2.5, m: 10, given: 'net' }, { vBo: 120, apogee: 883.9449541284404 })],
  }),
];

export default more;
