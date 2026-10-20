/**
 * Unit 1, beyond the numeric drills: three conceptual questions, each wrong option with its own
 * reason, and the unit's application, a train between stations (the `train` lab).
 */
import { trip } from '../../labs/train.js';
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
    id: 'u1.12.train',
    title: 'Application: a train between stations',
    exam: 'u1',
    ch: '12',
    lab: 'train',
    src: 'Hibbeler §12.3',
    topics: ['rectilinear', 'erratic'],
    principles: ['rect-kin'],
    // Designed numbers: the acceleration, the time under power and the braking rate are picked.
    vars: {
      a1: range(0.8, 1.4, 0.1, 'm/s²'),
      t1: range(15, 30, 1, 's'),
      a2: range(0.6, 1.2, 0.1, 'm/s²'),
    },
    derive: ($) => trip($.a1, $.t1, $.a2),
    text: (T) => String.raw`A metro train leaves a station and accelerates at $${T.a1}\ \mathrm{m/s^2}$ for $${T.t1}\ \mathrm{s}$. It then brakes at $${T.a2}\ \mathrm{m/s^2}$ until it stops at the next station. Find the top speed and the distance between the stations.`,
    parts: [
      num('vTop', ($) => $.vTop, 'm/s', {
        label: 'top speed',
        traps: [[($) => ($.a1 - $.a2) * $.t1, 'The brakes are off during the first part. The top speed is set by the acceleration run alone.']],
      }),
      num('distance', ($) => $.total, 'm', {
        label: 'distance between the stations',
        traps: [
          [($) => $.s1, 'That is only the distance covered while accelerating. The train still has to brake to a stop.'],
          [($) => $.sBrake, 'That is only the braking distance. Add the distance covered while accelerating.'],
        ],
      }),
    ],
    level: 2,
    hints: ['The trip has two parts with different constant accelerations. Treat them one at a time.',
      String.raw`Under power, $v = a_1 t$ and $s = \tfrac12 a_1 t^2$. While braking, time is not needed: $v^2 = v_0^2 + 2a\,\Delta s$ with $v = 0$ gives the braking distance.`,
    ],
    steps: ($, sig) => [
      String.raw`Top speed: $v_{top} = a_1 t_1 = ${sig($.vTop)}\ \mathrm{m/s}$.`,
      String.raw`Under power: $s_1 = \tfrac12 a_1 t_1^2 = ${sig($.s1)}\ \mathrm{m}$. Braking: $s_2 = v_{top}^2/2a_2 = ${sig($.sBrake)}\ \mathrm{m}$.`,
      String.raw`The stations are $s_1 + s_2 = ${sig($.total)}\ \mathrm{m}$ apart.`,
    ],
    // Second: step the trip forward until the speed turns negative.
    second: ($) => {
      let s = 0;
      let v = 0;
      let t = 0;
      const dt = 1e-4;
      let vTop = null;
      while (true) {
        const acc = t < $.t1 - 1e-12 ? $.a1 : -$.a2;
        const h = t < $.t1 && t + dt > $.t1 ? $.t1 - t : dt;
        const v1 = v + acc * h;
        if (t >= $.t1 && v1 < 0) return { vTop, distance: s + (v * v) / (2 * $.a2) };
        s += 0.5 * (v + v1) * h;
        v = v1;
        t += h;
        if (vTop === null && t >= $.t1 - 1e-12) vTop = v;
      }
    },
    sim: {
      scenario: 'metro',
      setup(s, $) {
        s.a1 = $.a1;
        s.t1 = $.t1;
        s.a2 = $.a2;
        s.t = null;
      },
      read: (c) => ({ vTop: c.vTop, distance: c.total }),
    },
    cases: [kase('Hibbeler §12.3', { a1: 1.1, t1: 20, a2: 0.8 }, { vTop: 22, distance: 522.5 })],
  }),
];

export default more;
