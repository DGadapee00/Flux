/**
 * Work and energy (id u3, Unit 4), beyond the numeric drills: three conceptual questions, each wrong option with its own
 * reason, and the unit's application, a road's stopping sight distance (the `stopping` lab).
 */
import { FPS_PER_MPH, aashtoSSD, stepStop, stopDistance } from '@flux/subjects/mechanics/stopping.js';
import { G, choice, kase, num, problem, range } from '../kit.js';

/** A choice part whose options each carry a `why`. */
const pick = (id, label, options, correct) => ({ id, kind: 'choice', label, options: options.map(([value, text, why]) => ({ value, label: text, why })), correct, multi: false });

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
    lab: 'stopping',
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
    id: 'u3.14.stopping',
    title: 'Application: a road’s stopping sight distance',
    exam: 'u3',
    ch: '14',
    lab: 'stopping',
    src: 'Hibbeler §14.3',
    topics: ['energy', 'friction'],
    // Structure: the sight line a speed needs, or the speed a sight line allows; level, uphill or downhill.
    // Designed numbers: the speed is picked, and the sight line follows.
    vars: {
      find: choice(['ssd', 'the sight distance'], ['speed', 'the speed']),
      V: range(30, 70, 5, 'mph'),
      t: range(1.5, 2.5, 0.5, 's'),
      gr: range(-6, 6, 2, '%'),
    },
    derive: ($) => {
      const d = stopDistance({ Vmph: $.V, t: $.t, grade: $.gr / 100 });
      const road = $.gr === 0 ? 'a level road' : $.gr < 0 ? `a ${-$.gr}% downgrade` : `a ${$.gr}% upgrade`;
      return { d, road, S: d.total };
    },
    text: (T, $, sig) => ($.find === 'ssd'
      ? String.raw`A driver doing ${T.V} on ${$.road} sees a stalled truck. It takes ${T.t} to react; then the car brakes with friction factor $f = 11.2/32.2$, AASHTO’s design rate of 11.2 ft/s² on the level. Take $g = 32.2$ ft/s² and $\tan\theta = ${$.gr / 100}$ (up positive). Find the braking distance and the stopping sight distance, the whole distance from where the driver sees the truck.`
      : String.raw`On ${$.road}, a hill crest lets a driver see $${sig($.S)}$ ft ahead. A driver takes ${T.t} to react, then brakes with friction factor $f = 11.2/32.2$. Take $g = 32.2$ ft/s² and $\tan\theta = ${$.gr / 100}$ (up positive). Find the highest speed, in mph, that stops within the sight line, and the braking distance at that speed.`),
    parts: [
      num('db', ($) => $.d.braking, 'ft', {
        label: 'braking distance',
        traps: [
          [($) => ($.V * $.V) / (2 * 11.2), 'Convert the speed first: 1 mph = 1.467 ft/s. In mph, v² is 2.15 times too small.'],
          [($) => $.d.v ** 2 / (2 * (11.2 * Math.cos(Math.atan($.gr / 100)) - 32.2 * Math.sin(Math.atan($.gr / 100)))), 'Check the weight’s sign. Downhill it does positive work and lengthens the stop; uphill it helps the brakes.'],
        ],
      }),
      num('q', ($) => ($.find === 'ssd' ? $.d.total : $.V), ($) => ($.find === 'ssd' ? 'ft' : 'mph'), {
        label: ($) => ($.find === 'ssd' ? 'stopping sight distance' : 'highest speed'),
        traps: [
          [($) => ($.find === 'ssd' ? $.V * $.t + $.d.braking : Math.sqrt(2 * $.d.decel * $.S) / FPS_PER_MPH),
            ($) => ($.find === 'ssd' ? 'The reaction distance is v t with v in ft/s, not mph.' : 'The car covers v t before the brakes come on. The sight line holds the reaction distance and the braking distance: S = v t + v²/2a.')],
          [($) => ($.find === 'ssd' ? $.d.braking : $.d.v),
            ($) => ($.find === 'ssd' ? 'That is the braking distance alone. The car travels v t at full speed while the driver reacts.' : 'That is the speed in ft/s. Divide by 1.467 for mph.')],
        ],
      }),
    ],
    level: 3,
    hints: ['Two stages: full speed for the reaction time, then work and energy from v to rest while braking.',
      String.raw`While braking, friction $f\,mg\cos\theta$ and the weight’s part along the road, $mg\sin\theta$, do work over $d_b$: $\tfrac12 mv^2 = (f\,mg\cos\theta + mg\sin\theta)\,d_b$. The mass cancels.`,
      'For the speed, the sight line is v t + v²/(2a): a quadratic in v.',
    ],
    steps: ($, sig) => {
      const { d } = $;
      const out = [
        String.raw`$v = ${$.V}\times 1.467 = ${sig(d.v)}$ ft/s. Along the road the brakes and the weight slow the car at $g(f\cos\theta + \sin\theta) = ${sig(d.decel)}$ ft/s².`,
        String.raw`Work and energy: $d_b = v^2/(2 \times ${sig(d.decel)}) = ${sig(d.braking)}$ ft.`,
      ];
      if ($.find === 'ssd') out.push(String.raw`Reaction: $vt = ${sig(d.reaction)}$ ft. SSD $= ${sig(d.reaction)} + ${sig(d.braking)} = ${sig(d.total)}$ ft.`);
      else out.push(String.raw`$${sig($.S)} = ${$.t}\,v + v^2/(2 \times ${sig(d.decel)})$ gives $v = ${sig(d.v)}$ ft/s $= ${sig($.V)}$ mph.`);
      return out;
    },
    second: ($) => {
      // Step the stop in time; for the speed, bisect on the stepped stop.
      if ($.find === 'ssd') {
        const n = stepStop({ Vmph: $.V, t: $.t, grade: $.gr / 100 });
        return { db: n.braking, q: n.total };
      }
      let lo = 1;
      let hi = 150;
      for (let i = 0; i < 60; i++) {
        const mid = 0.5 * (lo + hi);
        if (stepStop({ Vmph: mid, t: $.t, grade: $.gr / 100 }, 2000).total > $.S) hi = mid;
        else lo = mid;
      }
      const V = 0.5 * (lo + hi);
      return { db: stepStop({ Vmph: V, t: $.t, grade: $.gr / 100 }).braking, q: V };
    },
    sim: {
      scenario: 'design60',
      setup(s, $) {
        Object.assign(s, { V: $.V, t: $.t, a: 11.2, grade: $.gr / 100, sight: Math.round($.S) });
      },
      read: (c, s, $) => ({ db: c.braking, q: $.find === 'ssd' ? c.total : c.vMax }),
    },
    cases: [
      // AASHTO's own rounding, 1.47 V t + 1.075 V²/a, against the exact 22/15: within 0.1%.
      kase('AASHTO Green Book (2011), Table 3-1', { find: 'ssd', V: 60, t: 2.5, gr: 0 }, { db: (1.075 * 3600) / 11.2, q: aashtoSSD(60) }),
      kase('AASHTO Green Book (2011), Table 3-1', { find: 'ssd', V: 30, t: 2.5, gr: 0 }, { db: (1.075 * 900) / 11.2, q: aashtoSSD(30) }),
    ],
  }),
];

export default more;
