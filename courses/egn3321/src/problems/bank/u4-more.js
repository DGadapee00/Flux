/**
 * Impulse and momentum (id u4, Unit 3), beyond the numeric drills: four conceptual questions, each wrong option with its own
 * reason, and the unit's application, an upper stage's vertical burn (the `rocket` lab).
 */
import { collide1D, rocketDeltaV } from '@flux/subjects/mechanics/momentum.js';
import { G, choice, kase, num, problem, range } from '../kit.js';

/** A choice part whose options each carry a `why`. */
const pick = (id, label, options, correct) => ({ id, kind: 'choice', label, options: options.map(([value, text, why]) => ({ value, label: text, why })), correct, multi: false });

/**
 * What each situation gives and asks, as data. The tool follows from it: a force against time
 * means impulse; no outside impulse means conservation; an impact followed by motion against a
 * force means both in turn; a force against distance means work.
 */
const SITUATION = {
  bat: { text: 'A bat’s force on a ball is given as a graph of force against time. Find the ball’s speed as it leaves the bat.', given: 'force-time', stages: 1 },
  skaters: { text: 'Two skaters stand at rest on smooth ice and push off each other. One skater’s speed is known. Find the other’s.', given: 'no-external', stages: 1 },
  pendulum: { text: 'A bullet embeds in a block hanging on a cord, and the block swings up. Find how high it rises.', given: 'no-external', stages: 2 },
  spring: { text: 'A compressed spring pushes a block along a smooth track through a known distance. Find the block’s speed when it leaves the spring.', given: 'force-distance', stages: 1 },
};
function toolFor(id) {
  const s = SITUATION[id];
  if (s.stages === 2) return 'both';
  return { 'force-time': 'impulse', 'no-external': 'conserve', 'force-distance': 'energy' }[s.given];
}

/** One sample collision of each kind, run through the impact law: the second method. */
const KIND = {
  stick: { m1: 1, m2: 2, u1: 3, u2: 0, e: 0 },
  bounce: { m1: 1, m2: 2, u1: 3, u2: 0, e: 1 },
  partial: { m1: 1, m2: 2, u1: 3, u2: 0, e: 0.5 },
};
function conserved(kind) {
  const ke = (m1, m2, a, b) => 0.5 * m1 * a * a + 0.5 * m2 * b * b;
  let p0;
  let p1;
  let k0;
  let k1;
  if (kind === 'explode') {
    // A 1 kg and a 2 kg cart at rest, pushed apart by a spring: −2 m/s and +1 m/s.
    [p0, k0] = [0, 0];
    [p1, k1] = [1 * -2 + 2 * 1, ke(1, 2, -2, 1)];
  } else {
    const c = KIND[kind];
    const out = collide1D(c.m1, c.m2, c.u1, c.u2, c.e);
    [p0, k0] = [c.m1 * c.u1 + c.m2 * c.u2, ke(c.m1, c.m2, c.u1, c.u2)];
    [p1, k1] = [c.m1 * out.v1 + c.m2 * out.v2, ke(c.m1, c.m2, out.v1, out.v2)];
  }
  const tol = 1e-9;
  return {
    p: Math.abs(p1 - p0) < tol ? 'same' : 'changes',
    ke: Math.abs(k1 - k0) < tol ? 'same' : k1 < k0 ? 'lost' : 'gained',
  };
}

const SOFT = {
  egg: { text: 'An egg dropped onto a pillow survives; dropped the same height onto a tile floor, it breaks.', hard: 0.002, soft: 0.05 },
  car: { text: 'A car with a crumple zone hits a wall; an identical car with a rigid front hits the same wall at the same speed.', hard: 0.02, soft: 0.12 },
  catch: { text: 'A catcher who draws the hands back stings less than one who holds them rigid, for the same ball at the same speed.', hard: 0.005, soft: 0.06 },
};
/** Same momentum change; the average force is that over the contact time. */
function softer(body) {
  const dp = 1;
  const s = SOFT[body];
  const Fh = dp / s.hard;
  const Fs = dp / s.soft;
  return { why: Fs < Fh && s.soft > s.hard ? 'same-longer' : 'other' };
}

const RADIUS = { half: 0.5, third: 1 / 3, double: 2 };
function pulled(change) {
  // L = m r v about the hole is fixed: v₂ = r₁ v₁ / r₂.
  const r1 = 0.6;
  const v1 = 2;
  const r2 = r1 * RADIUS[change];
  const ratio = (r1 * v1) / r2 / v1;
  const near = (x) => Math.abs(ratio - x) < 1e-9;
  return { speed: near(2) ? 'x2' : near(3) ? 'x3' : near(0.5) ? 'half' : near(4) ? 'x4' : 'same', L: 'same' };
}

/** The stage's flight numbers, from the designed givens. */
function stage($) {
  return rocketDeltaV({ m0: $.m0, mf: $.mf, ve: $.ve, mdot: $.mdot, g: G });
}

const more = [
  problem({
    id: 'u4.15.which-principle',
    title: 'Which principle fits?',
    exam: 'u4',
    ch: '15',
    kind: 'conceptual',
    lab: null,
    src: 'Hibbeler §15.2',
    topics: ['impulse', 'conservation'],
    vars: { sit: choice(['bat', 'a bat and a ball'], ['skaters', 'two skaters'], ['pendulum', 'a ballistic pendulum'], ['spring', 'a spring launcher']) },
    text: (T, $) => `${SITUATION[$.sit].text} Which principle gets there most directly?`,
    parts: [
      pick('tool', 'principle', [
        ['impulse', 'impulse and momentum: the area under F(t) is m Δv', 'This fits when the force is known against time. The area under F(t) is the change of momentum.'],
        ['conserve', 'conservation of momentum: no outside impulse', 'This fits when the bodies push only on each other. Their internal forces cancel, so the total momentum stays put.'],
        ['both', 'conservation of momentum for the impact, then energy for the motion after', 'An impact loses energy, so energy cannot cross it; the motion after has a force against distance, so momentum alone cannot finish it. Split it in two.'],
        ['energy', 'work and energy: the area under F(s) is the change in kinetic energy', 'This fits when the force is known against distance, or is a spring or gravity. Work is force over distance.'],
      ], ($) => toolFor($.sit)),
    ],
    level: 1,
    hints: ['Look at what is given against what: a force against time, a force against distance, or bodies that act only on each other.',
      'An impact loses kinetic energy. Any problem that crosses one must use momentum for that step.',
    ],
    steps: ($) => [
      { bat: 'The force is given against time, so its area is the impulse: m Δv = ∫F dt.', skaters: 'The push is internal to the pair, and the ice is smooth. Total momentum stays zero.', pendulum: 'The embedding is an impact: use momentum for the shared speed. The swing is gravity against height: use energy for the rise.', spring: 'The spring force depends on position, and the distance is known. Work and energy gives the speed.' }[$.sit],
    ],
    second: ($) => ({ tool: toolFor($.sit) }),
    cases: [kase('Hibbeler §15.4', { sit: 'pendulum' }, { tool: 'both' })],
  }),

  problem({
    id: 'u4.15.what-conserved',
    title: 'What does a collision keep?',
    exam: 'u4',
    ch: '15',
    kind: 'conceptual',
    lab: 'impact',
    src: 'Hibbeler §15.4',
    topics: ['impact', 'conservation'],
    vars: {
      kind: choice(
        ['stick', 'two carts collide and couple together'],
        ['bounce', 'two steel balls collide and bounce apart with e = 1'],
        ['partial', 'two carts collide with e = 0.5'],
        ['explode', 'two carts at rest are pushed apart by a compressed spring between them'],
      ),
    },
    text: (T) => `On a smooth level track, ${T.kind}. Compare just before with just after. What happens to the total momentum, and to the total kinetic energy?`,
    parts: [
      pick('p', 'total momentum', [
        ['same', 'the same', 'The forces between the bodies are internal and cancel in pairs. Nothing outside acts along the track.'],
        ['changes', 'it changes', 'Only an outside impulse changes the total momentum. Here every force along the track is between the two bodies.'],
      ], 'same'),
      pick('ke', 'total kinetic energy', [
        ['same', 'the same', 'Only a perfectly elastic impact, e = 1, keeps all the kinetic energy.'],
        ['lost', 'some is lost', 'With e < 1 the bodies separate more slowly than they met. The difference goes into heat, sound and deformation.'],
        ['gained', 'it grows', 'Energy stored in a spring or a charge can be released as kinetic energy. An ordinary impact cannot add any.'],
      ], ($) => conserved($.kind).ke),
    ],
    level: 1,
    hints: ['Momentum and kinetic energy are separate questions. Answer each on its own.',
      'Momentum depends on outside impulse. Kinetic energy depends on e, and on any stored energy released.',
    ],
    steps: ($) => [
      'The bodies push only on each other along the track, so the total momentum is the same.',
      { stick: 'Coupling is e = 0: the most kinetic energy an impact can lose.', bounce: 'e = 1: the kinetic energy is kept.', partial: 'e = 0.5: part of the kinetic energy is lost.', explode: 'From rest the kinetic energy was zero. The spring’s energy becomes kinetic energy, so it grows.' }[$.kind],
    ],
    second: ($) => conserved($.kind),
    cases: [
      kase('Hibbeler §15.4', { kind: 'stick' }, { p: 'same', ke: 'lost' }),
      kase('Hibbeler §15.3', { kind: 'explode' }, { p: 'same', ke: 'gained' }),
    ],
  }),

  problem({
    id: 'u4.15.soft-landing',
    title: 'Why a soft stop hurts less',
    exam: 'u4',
    ch: '15',
    kind: 'conceptual',
    lab: 'impulse',
    src: 'Hibbeler §15.1',
    topics: ['impulse'],
    vars: { body: choice(['egg', 'an egg'], ['car', 'a car'], ['catch', 'a catch']) },
    text: (T, $) => `${SOFT[$.body].text} Why?`,
    parts: [
      pick('why', 'reason', [
        ['same-longer', 'the momentum change is the same, but it is spread over a longer time, so the force is smaller', 'Both stop from the same speed, so the impulse m Δv is the same. A longer contact time divides it into a smaller average force.'],
        ['less-impulse', 'the soft stop has a smaller impulse', 'The impulse is the change of momentum. Both stop from the same speed, so the impulse is the same.'],
        ['less-momentum', 'the body has less momentum to lose', 'Same mass, same speed: the same momentum. The soft surface changes how it is lost, not how much.'],
        ['more-force', 'the longer time means a larger force, absorbed by the soft part', 'For a fixed impulse, force and time trade off: a longer time means a smaller force, not a larger one.'],
      ], 'same-longer'),
    ],
    level: 1,
    hints: ['Both stop from the same speed. What does that fix?',
      String.raw`The average force is $F_{avg} = m\Delta v/\Delta t$. Which term does the soft surface change?`,
    ],
    steps: () => [
      String.raw`The impulse $\int F\,dt = m\Delta v$ is the same in both, because the body stops from the same speed.`,
      String.raw`$F_{avg} = m\Delta v/\Delta t$. A soft surface makes $\Delta t$ ten or more times longer, so the peak force falls.`,
    ],
    second: ($) => softer($.body),
    cases: [kase('Hibbeler §15.1', { body: 'car' }, { why: 'same-longer' })],
  }),

  problem({
    id: 'u4.15.pull-in',
    title: 'Pulling in a string',
    exam: 'u4',
    ch: '15',
    kind: 'conceptual',
    lab: null,
    src: 'Hibbeler §15.7',
    topics: ['angular'],
    vars: { change: choice(['half', 'pulled in to half its radius'], ['third', 'pulled in to a third of its radius'], ['double', 'let out to twice its radius']) },
    text: (T) => `A puck slides in a circle on smooth ice, tied to a string that runs down through a small hole at the centre. The string is slowly ${T.change}. What happens to the puck's angular momentum about the hole, and to its speed?`,
    parts: [
      pick('L', 'angular momentum about the hole', [
        ['same', 'the same', 'The string pulls straight toward the hole, so its moment about the hole is zero. No moment, no change in angular momentum.'],
        ['up', 'it grows', 'Growing angular momentum needs a moment about the hole. The string passes through the hole and has none.'],
        ['down', 'it falls', 'Falling angular momentum needs a moment against the motion. The ice is smooth and the string points at the hole.'],
      ], 'same'),
      pick('speed', 'speed', [
        ['x2', 'it doubles', 'True when the radius halves: m r v is fixed, so v grows as r shrinks.'],
        ['x3', 'it triples', 'True when the radius falls to a third.'],
        ['half', 'it halves', 'True when the radius doubles: the puck slows as it moves out.'],
        ['x4', 'it is four times as large', 'That is the factor for r² v, which is not the conserved quantity. Angular momentum is m r v.'],
        ['same', 'it stays the same', 'The string does work as it pulls the puck inward. With m r v fixed and r changed, v must change.'],
      ], ($) => pulled($.change).speed),
    ],
    level: 2,
    hints: ['Find the moment of the string’s force about the hole.',
      String.raw`With no moment, $H_O = m r v$ stays fixed for a puck moving at right angles to the string.`,
    ],
    steps: ($) => [
      String.raw`The string force points at O, so $\sum M_O = 0$ and $m r_1 v_1 = m r_2 v_2$.`,
      { half: String.raw`$r_2 = r_1/2$, so $v_2 = 2v_1$.`, third: String.raw`$r_2 = r_1/3$, so $v_2 = 3v_1$.`, double: String.raw`$r_2 = 2r_1$, so $v_2 = v_1/2$.` }[$.change],
    ],
    second: ($) => pulled($.change),
    cases: [kase('Hibbeler §15.7', { change: 'half' }, { L: 'same', speed: 'x2' })],
  }),

  problem({
    id: 'u4.15.stage',
    title: 'Application: an upper stage',
    exam: 'u4',
    ch: '15',
    lab: 'rocket',
    src: 'Hibbeler §15.9',
    topics: ['rocket'],
    // Designed numbers: the exhaust speed, burn rate, start mass and mass ratio are picked; the
    // thrust, specific impulse and final mass follow, so every given is a number an engine sheet prints.
    vars: {
      given: choice(['thrust', 'its thrust and burn rate'], ['isp', 'its specific impulse']),
      ve: range(2400, 3000, 200, 'm/s'),
      mdot: range(3, 8, 1, 'kg/s'),
      m0: range(300, 800, 100, 'kg'),
      r: range(2, 3, 0.5, ''),
    },
    derive: ($) => ({ mf: $.m0 / $.r, F: $.ve * $.mdot, isp: $.ve / G }),
    valid: ($) => {
      const tb = ($.m0 - $.m0 / $.r) / $.mdot;
      return $.ve * $.mdot >= 1.3 * $.m0 * G && G * tb >= 0.05 * $.ve * Math.log($.r);
    },
    text: (T, $, sig) => {
      const engine = $.given === 'thrust'
        ? String.raw`Its engine gives ${sig($.F)} N of thrust while burning ${T.mdot} kg/s of propellant.`
        : String.raw`Its engine has a specific impulse of ${sig($.isp)} s, with $g_0 = 9.81$ m/s², and burns ${T.mdot} kg/s.`;
      return String.raw`A small methane–oxygen upper stage of ${T.m0} kg is released from rest and fires straight up. ${engine} It burns down to ${sig($.mf)} kg. Ignore drag; take $g = 9.81$ m/s². Find the exhaust speed and the speed at burnout.`;
    },
    parts: [
      num('ve', ($) => $.ve, 'm/s', {
        label: 'exhaust speed',
        traps: [[
          ($) => ($.given === 'thrust' ? $.F / ($.mdot * G) : $.isp),
          ($) => ($.given === 'thrust'
            ? 'That is the specific impulse, in seconds. The exhaust speed is thrust over burn rate, F/ṁ.'
            : 'Specific impulse is in seconds. Multiply by g₀ = 9.81 m/s² for the exhaust speed.'),
        ]],
      }),
      num('dv', ($) => stage($).dv, 'm/s', {
        label: 'speed at burnout',
        traps: [
          [($) => $.ve * Math.log($.r), 'Gravity acts for the whole burn. Subtract g·t_b, the gravity loss.'],
          [($) => $.ve * Math.log($.r) - G * ($.m0 / $.mdot), 'The burn time is the propellant burned over the burn rate, (m₀ − m_f)/ṁ, not the whole mass.'],
        ],
      }),
    ],
    level: 3,
    hints: [
      'Thrust is the burn rate times the exhaust speed. Specific impulse is the exhaust speed in units of g₀.',
      String.raw`Then the rocket equation, with gravity: $\Delta v = v_e\ln(m_0/m_f) - g t_b$ and $t_b = (m_0 - m_f)/\dot m$.`,
    ],
    steps: ($, sig) => {
      const row = stage($);
      return [
        $.given === 'thrust'
          ? String.raw`$v_e = F/\dot m = ${sig($.F)}/${sig($.mdot)} = ${sig($.ve)}\ \mathrm{m/s}$.`
          : String.raw`$v_e = I_{sp}\,g_0 = ${sig($.isp)} \times 9.81 = ${sig($.ve)}\ \mathrm{m/s}$.`,
        String.raw`$t_b = (m_0 - m_f)/\dot m = ${sig(row.tb)}\ \mathrm{s}$. Gravity loss $g t_b = ${sig(G * row.tb)}\ \mathrm{m/s}$.`,
        String.raw`$\Delta v = v_e\ln(${sig($.r)}) - g t_b = ${sig(row.dv)}\ \mathrm{m/s}$.`,
      ];
    },
    // Second: step the momentum balance m dv = ṁ v_e dt − m g dt through the burn.
    second: ($) => {
      const steps = 4000;
      const tb = ($.m0 - $.mf) / $.mdot;
      const dt = tb / steps;
      let m = $.m0;
      let v = 0;
      for (let i = 0; i < steps; i++) {
        const mid = m - 0.5 * $.mdot * dt;
        v += (($.F / $.mdot) * $.mdot / mid - G) * dt;
        m -= $.mdot * dt;
      }
      return { ve: $.F / $.mdot, dv: v };
    },
    sim: {
      scenario: 'gravity',
      setup(s, $) {
        s.m0 = $.m0;
        s.mf = $.mf;
        s.ve = $.ve;
        s.mdot = $.mdot;
        s.g = G;
      },
      read: (c) => ({ dv: c.dv }),
    },
    cases: [kase('Hibbeler §15.9', { given: 'thrust', ve: 3000, mdot: 5, m0: 500, r: 2.5 }, { ve: 3000, dv: 2160.2721956224655 })],
  }),
];

export default more;
