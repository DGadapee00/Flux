/**
 * Work and energy (id u3, Unit 4), beyond the numeric drills: three conceptual questions, each wrong option with its own
 * reason, and the unit's application, a lander's crushable pads (the `landing` lab).
 */
import { G, choice, kase, num, problem, range } from '../kit.js';

/** A choice part whose options each carry a `why`. */
const pick = (id, label, options, correct) => ({ id, kind: 'choice', label, options: options.map(([value, text, why]) => ({ value, label: text, why })), correct, multi: false });

const G_MOON = 1.62;

/** For each described force: the force and the displacement of its point, as vectors (x right, y up). */
const SCENES = {
  lift: { text: 'the weight of a box lifted at a steady speed', F: [0, -1], d: [0, 1] },
  fall: { text: 'the weight of a ball as it falls', F: [0, -1], d: [0, -1] },
  friction: { text: 'kinetic friction on a crate sliding across a floor', F: [-1, 0], d: [1, 0] },
  normal: { text: 'the floor’s normal force on a crate sliding across it', F: [0, 1], d: [1, 0] },
  tension: { text: 'the string’s pull on a swinging pendulum bob', F: [-1, 0], d: [0, 1] },
  spring: { text: 'a compressed spring on the block it pushes away', F: [1, 0], d: [1, 0] },
};
const signOf = (scene) => {
  const { F, d } = SCENES[scene];
  const dot = F[0] * d[0] + F[1] * d[1];
  return dot > 1e-12 ? 'pos' : dot < -1e-12 ? 'neg' : 'zero';
};

/** Braking distance d = v²/(2μg), before and after the change. */
const BRAKE = { speed: { v: 2, m: 1, mu: 1 }, mass: { v: 1, m: 2, mu: 1 }, mu: { v: 1, m: 1, mu: 2 } };
function brakeRatio(change) {
  const d = ({ v, m, mu }) => (0.5 * m * v * v) / (mu * m * G);
  return d({ v: 20 * BRAKE[change].v, m: 1200 * BRAKE[change].m, mu: 0.7 * BRAKE[change].mu }) / d({ v: 20, m: 1200, mu: 0.7 });
}

/** Two motors lift 50 kg through 6 m at a steady speed: A in 4 s, B in 2 s. */
function liftRatio(asked) {
  const run = (t) => ({ force: 50 * G, work: 50 * G * 6, power: (50 * G * 6) / t });
  return run(2)[asked] / run(4)[asked];
}
const ratioKey = (r) => (Math.abs(r - 1) < 1e-9 ? 'same' : `x${Math.round(r * 1000) / 1000}`);

/** The lander's pad stroke by stepping the crush in time, and the deceleration from the stop time. */
function crushSteps(m, v0, F, g) {
  const n = 20000;
  const a = F / m - g;
  const dt = v0 / a / n;
  let v = v0;
  let s = 0;
  let t = 0;
  while (v > 0) {
    const v1 = v - (F / m - g) * dt;
    if (v1 <= 0) {
      const h = v / a;
      s += 0.5 * v * h;
      t += h;
      break;
    }
    s += 0.5 * (v + v1) * dt;
    t += dt;
    v = v1;
  }
  return { stroke: s, decel: v0 / t };
}

const more = [
  problem({
    id: 'u3.14.sign',
    title: 'Positive, negative, or no work?',
    exam: 'u3',
    ch: '14',
    kind: 'conceptual',
    lab: null,
    src: 'Hibbeler §14.1',
    topics: ['energy'],
    vars: { scene: choice(...Object.entries(SCENES).map(([k, s]) => [k, s.text])) },
    text: (T) => `What is the sign of the work done by ${T.scene}?`,
    parts: [
      pick('sign', 'the work', [
        ['pos', 'positive', 'Positive work needs the force to have a component along the motion of its point.'],
        ['neg', 'negative', 'Negative work needs the force to have a component against the motion of its point.'],
        ['zero', 'zero', 'Zero work needs the force perpendicular to the motion of its point, or a point that does not move.'],
      ], ($) => signOf($.scene)),
    ],
    level: 1,
    hints: ['Work is the force dotted with the displacement of the point where it acts.',
      'Ask which way the force points and which way its point moves. Same way, against, or at right angles?',
    ],
    steps: ($) => [
      String.raw`$dU = \vec F \cdot d\vec r = F\,ds\cos\theta$, with $\theta$ the angle between the force and the motion.`,
      { pos: 'Here the force points along the motion: the work is positive.', neg: 'Here the force points against the motion: the work is negative.', zero: 'Here the force is perpendicular to the motion: it does no work.' }[signOf($.scene)],
    ],
    second: ($) => ({ sign: signOf($.scene) }),
    cases: [
      kase('Hibbeler §14.1', { scene: 'normal' }, { sign: 'zero' }),
      kase('Hibbeler §14.1', { scene: 'lift' }, { sign: 'neg' }),
    ],
  }),

  problem({
    id: 'u3.14.brake-scale',
    title: 'Stopping distance, scaled',
    exam: 'u3',
    ch: '14',
    kind: 'conceptual',
    lab: 'landing',
    src: 'Hibbeler §14.3',
    topics: ['energy', 'friction'],
    vars: { change: choice(['speed', 'its speed'], ['mass', 'its mass (same tyres, same road)'], ['mu', 'the friction coefficient']) },
    text: (T) => `A car locks its wheels and skids to a stop on a level road. Kinetic friction is the only horizontal force. If you double ${T.change}, and change nothing else, what happens to the stopping distance?`,
    parts: [
      pick('ratio', 'the stopping distance', [
        ['x4', 'four times as long', 'Four times needs four times the energy against the same stopping force. That is what doubling the speed does.'],
        ['x2', 'twice as long', 'Nothing here doubles it. The energy grows as v², and a heavier car has more friction as well as more energy.'],
        ['same', 'the same', 'The distance stays put only when the energy and the friction grow together. Doubling the mass does that.'],
        ['x0.5', 'half as long', 'Half the distance needs twice the stopping force for the same energy. Doubling μ_k does that.'],
      ], ($) => ratioKey(brakeRatio($.change))),
    ],
    level: 2,
    hints: ['Write the work-energy equation from the skid to the stop.',
      String.raw`$\tfrac12 mv^2 = \mu_k mg\,d$, so $d = v^2/(2\mu_k g)$. Which quantities are left?`,
    ],
    steps: ($) => [
      String.raw`$T_1 + U = 0$: $\tfrac12 mv^2 - \mu_k mg\,d = 0$, so $d = v^2/(2\mu_k g)$. The mass cancels.`,
      { speed: 'Doubling v multiplies v² by four: four times the distance.', mass: 'The mass is not in the result: the same distance.', mu: 'μ_k is in the denominator: half the distance.' }[$.change],
    ],
    second: ($) => ({ ratio: ratioKey(brakeRatio($.change)) }),
    cases: [kase('Hibbeler §14.3', { change: 'speed' }, { ratio: 'x4' })],
  }),

  problem({
    id: 'u3.14.lift-faster',
    title: 'The faster lift',
    exam: 'u3',
    ch: '14',
    kind: 'conceptual',
    lab: null,
    src: 'Hibbeler §14.4',
    topics: ['power'],
    vars: { asked: choice(['work', 'the work it does'], ['power', 'its output power'], ['force', 'the force it pulls with']) },
    text: (T) => `Two motors each lift a 50 kg load 6 m at a steady speed. Motor A takes 4 s; motor B takes 2 s. Compare ${T.asked} for motor B with motor A.`,
    parts: [
      pick('ratio', 'motor B against motor A', [
        ['x2', 'twice as much', 'Twice as much means twice the energy per second. That is power, not work or force.'],
        ['same', 'the same', 'Work is force times distance, and at a steady speed the force is the weight. Both match. Power, work per second, does not.'],
        ['x0.5', 'half as much', 'Less time does not mean less of anything here. The same work is done in half the time.'],
      ], ($) => ratioKey(liftRatio($.asked))),
    ],
    level: 1,
    hints: ['At a steady speed, the pull equals the weight.',
      'Work is force times distance. Power is work divided by time.',
    ],
    steps: ($) => [
      String.raw`Pull $= mg = 490.5$ N for both. Work $= mg\,h = 2{,}943$ J for both.`,
      String.raw`Power: A gives $2{,}943/4 = 736$ W; B gives $2{,}943/2 = 1{,}472$ W.`,
      { work: 'So the work is the same.', power: 'So B’s power is twice A’s.', force: 'So the force is the same.' }[$.asked],
    ],
    second: ($) => ({ ratio: ratioKey(liftRatio($.asked)) }),
    cases: [kase('Hibbeler §14.4', { asked: 'power' }, { ratio: 'x2' })],
  }),

  problem({
    id: 'u3.14.landing',
    title: 'Application: a lander’s crush pads',
    exam: 'u3',
    ch: '14',
    lab: 'landing',
    src: 'Hibbeler §14.3',
    topics: ['energy', 'landing'],
    // Designed numbers: the stroke and touchdown speed are picked, and the crush force follows.
    vars: {
      m: range(150, 400, 50, 'kg'),
      v0: range(2, 4, 0.5, 'm/s'),
      sd: range(0.15, 0.4, 0.05, 'm'),
      planet: choice(['earth', 'Earth'], ['moon', 'the Moon']),
    },
    derive: ($) => {
      const gl = $.planet === 'moon' ? G_MOON : G;
      const a = ($.v0 * $.v0) / (2 * $.sd);
      return { gl, a, F: $.m * (a + gl) };
    },
    text: (T, $, sig) => String.raw`A ${T.m} kg lander touches down on ${T.planet} at ${T.v0} m/s, straight down. Its legs end in crushable pads that crush at a constant total force of $${sig($.F)}$ N. Take $g = ${$.gl}$ m/s². Ignore any rebound. Find the pad stroke that stops the lander, and its deceleration while the pads crush.`,
    parts: [
      num('stroke', ($) => (0.5 * $.m * $.v0 * $.v0) / ($.F - $.m * $.gl), 'm', {
        label: 'stroke',
        traps: [
          [($) => (0.5 * $.m * $.v0 * $.v0) / $.F, 'The weight keeps working on the lander while the pads crush. The pad must take ½mv₀² plus mg times the stroke.'],
          [($) => (0.5 * $.m * $.v0 * $.v0) / ($.F + $.m * $.gl), 'The weight pushes the lander down into the pads. It adds to the energy the pads must take; it does not help them.'],
        ],
      }),
      num('decel', ($) => $.F / $.m - $.gl, 'm/s²', {
        label: 'deceleration',
        traps: [
          [($) => $.F / $.m, 'F/m is the pad’s push per kilogram. The weight acts the other way: the net deceleration is F/m − g.'],
          [($) => ($.v0 * $.v0) / $.sd, 'From v² = v₀² − 2as, a = v₀²/(2s). The factor of 2 is missing.'],
        ],
      }),
    ],
    level: 2,
    hints: ['Use work and energy from touchdown to rest. Two forces work over the stroke: the pads and the weight.',
      String.raw`$0 = \tfrac12 mv_0^2 + mg\,s - F\,s$. Solve for $s$. The net force on the lander is $F - mg$.`,
    ],
    steps: ($, sig) => {
      const s = (0.5 * $.m * $.v0 * $.v0) / ($.F - $.m * $.gl);
      return [
        String.raw`$T_1 = \tfrac12 mv_0^2 = ${sig(0.5 * $.m * $.v0 * $.v0)}$ J. The weight is $mg = ${sig($.m * $.gl)}$ N.`,
        String.raw`$\tfrac12 mv_0^2 + mg\,s - F\,s = 0$ gives $s = \dfrac{\tfrac12 mv_0^2}{F - mg} = ${sig(s)}$ m.`,
        String.raw`Net force $F - mg$ over the mass: $a = ${sig($.F / $.m - $.gl)}$ m/s², or $${sig(($.F / $.m - $.gl) / G)}$ g.`,
      ];
    },
    second: ($) => crushSteps($.m, $.v0, $.F, $.gl),
    sim: {
      scenario: 'hopper',
      setup(s, $) {
        s.m = $.m;
        s.v0 = $.v0;
        s.F = $.F;
        s.g = $.gl;
        s.L = 2;
      },
      read: (c) => ({ stroke: c.need, decel: c.a }),
    },
    cases: [
      kase('Hibbeler §14.3', { m: 250, v0: 3, sd: 0.25, planet: 'earth' }, { stroke: 0.25, decel: 18 }),
      kase('Hibbeler §14.3', { m: 300, v0: 2, sd: 0.2, planet: 'moon' }, { stroke: 0.2, decel: 10 }),
    ],
  }),
];

export default more;
