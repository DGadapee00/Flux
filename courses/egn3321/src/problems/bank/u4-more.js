/**
 * Impulse and momentum (id u4, Unit 3), beyond the numeric drills: four conceptual questions, each wrong option with its own
 * reason, and the unit's application, a bicycle helmet's drop test (the `helmet` lab, 16 CFR 1203).
 */
import { collide1D, rocketDeltaV } from '@flux/subjects/mechanics/momentum.js';
import { minDuration, stopPulse, stopPulseNumeric } from '@flux/subjects/mechanics/impact-pulse.js';
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
    id: 'u4.15.helmet',
    title: 'Application: a helmet’s drop test',
    exam: 'u4',
    ch: '15',
    lab: 'helmet',
    src: 'Hibbeler §15.1',
    topics: ['impulse'],
    // Structure: the peak of a given pulse, or the shortest pulse that passes; the pulse is a half-sine or flat.
    vars: {
      find: choice(['peak', 'peak'], ['tau', 'shortest']),
      shape: choice(['half-sine', 'a half-sine'], ['square', 'flat (square)']),
      h: range(1.2, 2.4, 0.2, 'm'),
      tau: range(3, 12, 1, 'ms'),
      e: range(0, 0.4, 0.1, ''),
    },
    derive: ($) => ({ v0: Math.sqrt(2 * G * $.h) }),
    text: (T, $) => ($.find === 'peak'
      ? String.raw`In a drop test like CPSC's, a helmet on a 5.0 kg headform falls ${T.h} m onto a steel anvil. The liner stops it in ${T.tau} ms with a force pulse shaped like ${T.shape}, and it rebounds at ${T.e} of its impact speed. Find the impulse the anvil gives and the peak acceleration in g.`
      : String.raw`In a drop test like CPSC's, a helmet on a 5.0 kg headform falls ${T.h} m onto a steel anvil and rebounds at ${T.e} of its impact speed. Its liner gives a force pulse shaped like ${T.shape}. The standard fails it above 300 g. Find the impulse the anvil gives over a 6 ms pulse, and the shortest pulse that keeps the peak at 300 g.`),
    parts: [
      num('J', ($) => stopPulse({ m: 5, v0: $.v0, e: $.e, tau: ($.find === 'peak' ? $.tau : 6) / 1000, shape: $.shape }).J, 'N·s', { label: 'impulse from the anvil' }),
      num('q', ($) => ($.find === 'peak'
        ? stopPulse({ m: 5, v0: $.v0, e: $.e, tau: $.tau / 1000, shape: $.shape }).gPeak
        : minDuration({ v0: $.v0, e: $.e, shape: $.shape, limitG: 300 }) * 1000), ($) => ($.find === 'peak' ? 'g' : 'ms'), { label: ($) => ($.find === 'peak' ? 'peak acceleration' : 'shortest pulse') }),
    ],
    level: 2,
    hints: [
      'The drop fixes the momentum change: from v0 = √(2gh) down to e·v0 up. The anvil’s impulse supplies it, and the weight’s too.',
      '∫F dt − mgτ = m(1 + e)v0. For a half-sine, ∫F dt = 2F_pk τ/π; for a flat pulse, F_pk τ.',
      'The peak in g is F_pk/(mg).',
    ],
    steps: ($, sig) => {
      const tau = ($.find === 'peak' ? $.tau : 6) / 1000;
      const p = stopPulse({ m: 5, v0: $.v0, e: $.e, tau, shape: $.shape });
      const k = $.shape === 'square' ? '' : String.raw`\pi/2\ \times\ `;
      return [
        String.raw`$v_0 = \sqrt{2gh} = ${sig($.v0)}$ m/s. Over ${sig(tau * 1000)} ms, $\int F\,dt = m(1 + e)v_0 + mg\tau = ${sig(p.J)}$ N·s.`,
        $.find === 'peak'
          ? String.raw`$F_{pk} = ${k}\int F\,dt/\tau = ${sig(p.Fpk)}$ N, so the peak is $F_{pk}/mg = ${sig(p.gPeak)}$ g.`
          : String.raw`Set $F_{pk} = 300mg$: $\tau \ge (1 + e)v_0/(g(k \cdot 300 - 1))$ with $k = ${$.shape === 'square' ? '1' : '2/\\pi'}$, so $\tau = ${sig(minDuration({ v0: $.v0, e: $.e, shape: $.shape, limitG: 300 }) * 1000)}$ ms.`,
      ];
    },
    second: ($) => {
      // Step the fall through the pulse: the impulse is what changes the speed from −v0 to e·v0.
      const tau = ($.find === 'peak' ? $.tau : 6) / 1000;
      const n = stopPulseNumeric({ m: 5, v0: $.v0, e: $.e, tau, shape: $.shape });
      const J = 5 * (n.vEnd + $.v0) + 5 * G * tau;
      if ($.find === 'peak') return { J, q: J / ((($.shape === 'square' ? 1 : 2 / Math.PI) * tau) * 5 * G) };
      // The shortest pulse by bisection on the peak.
      let lo = 1e-4;
      let hi = 0.05;
      for (let i = 0; i < 80; i++) {
        const mid = 0.5 * (lo + hi);
        if (stopPulse({ m: 5, v0: $.v0, e: $.e, tau: mid, shape: $.shape }).gPeak > 300) lo = mid;
        else hi = mid;
      }
      return { J, q: 0.5 * (lo + hi) * 1000 };
    },
    sim: {
      scenario: 'cpsc',
      setup(s, $) {
        Object.assign(s, { h: $.h, e: $.e, shape: $.shape, tau: $.find === 'peak' ? $.tau : 6 });
      },
      read: (c, s, $) => ({ J: c.J, q: $.find === 'peak' ? c.gPeak : c.tauMin }),
    },
    cases: [kase('Hibbeler §15.1', { find: 'peak', shape: 'half-sine', h: 2, tau: 6, e: 0.1 }, {
      J: stopPulse({ m: 5, v0: Math.sqrt(2 * G * 2), e: 0.1, tau: 0.006 }).J,
      q: stopPulse({ m: 5, v0: Math.sqrt(2 * G * 2), e: 0.1, tau: 0.006 }).gPeak,
    })],
  }),
];

export default more;
