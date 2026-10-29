/**
 * Unit 2 beyond the original drills: four conceptual questions, each wrong option with its own
 * reason, and the unit's application, the curve of a highway (the `highway` lab, AASHTO 2011).
 */
import { M_PER_FT } from '@flux/subjects/convert.js';
import { bankedCurve } from '@flux/subjects/mechanics/dynamics.js';
import { MPH, aashtoFmax, frictionNeed, limitSpeed, minRadiusFt } from '@flux/subjects/mechanics/highway.js';
import { G, choice, kase, num, problem, range } from '../kit.js';

/** A choice part whose options each carry a `why`. */
const pick = (id, label, options, correct) => ({ id, kind: 'choice', label, options: options.map(([value, text, why]) => ({ value, label: text, why })), correct, multi: false });

/** Upward acceleration for each elevator motion, with |a| = 2 m/s². */
const LIFT = { 'up-faster': 2, 'up-steady': 0, 'up-slower': -2, 'down-faster': -2, 'down-slower': 2 };
const compare = (x, ref) => (Math.abs(x - ref) < 1e-9 ? 'same' : x > ref ? 'more' : 'less');

/**
 * Friction on a 2 kg block on a 30° plane (μs = 0.4, μk = 0.3), from the balance along the plane,
 * up the plane positive. Kinetic friction opposes the velocity; static friction is whatever the
 * balance needs. Returns which way it points.
 */
function frictionDir(state) {
  const m = 2;
  const th = (30 * Math.PI) / 180;
  const W = m * G * Math.sin(th);
  const N = m * G * Math.cos(th);
  let f;
  if (state === 'rest') f = W; // ΣF = f − W = 0
  else if (state === 'down') f = 0.3 * N; // velocity down the plane
  else if (state === 'up') f = -0.3 * N; // velocity up the plane
  else {
    // Pushed horizontally by P, about to slide up: P cos θ − W + f = 0, with f = −μs N' and
    // N' = mg cos θ + P sin θ. Solve for P, then f.
    const P = (W + 0.4 * N) / (Math.cos(th) - 0.4 * Math.sin(th));
    f = W - P * Math.cos(th);
  }
  return f > 1e-9 ? 'up' : f < -1e-9 ? 'down' : 'none';
}

const more = [
  problem({
    id: 'u2.13.elevator',
    title: 'The scale in a lift',
    exam: 'u2',
    ch: '13',
    kind: 'conceptual',
    lab: null,
    src: 'Hibbeler §13.4',
    topics: ['newton'],
    vars: {
      motion: choice(
        ['up-faster', 'moving up and speeding up'],
        ['up-steady', 'moving up at a steady speed'],
        ['up-slower', 'moving up and slowing to a stop'],
        ['down-faster', 'moving down and speeding up'],
        ['down-slower', 'moving down and slowing to a stop'],
      ),
    },
    text: (T) => `A person stands on a bathroom scale in a lift that is ${T.motion}. Compared with their weight, what does the scale read?`,
    parts: [
      pick('read', 'the scale reads', [
        ['more', 'more than their weight', 'The scale pushes harder than gravity pulls only when the acceleration points up: speeding up going up, or slowing down going down.'],
        ['same', 'their weight', 'The reading equals the weight only when the acceleration is zero: steady speed, up or down, or at rest.'],
        ['less', 'less than their weight', 'The scale pushes less than gravity pulls only when the acceleration points down: speeding up going down, or slowing down going up.'],
        ['zero', 'zero', 'Zero means free fall, a = g downward. A lift that speeds up or slows gently is far from that.'],
      ], ($) => compare(70 * (G + LIFT[$.motion]), 70 * G)),
    ],
    level: 1,
    hints: ['The scale reads the normal force N, not the weight.',
      'Take up as positive: N − mg = ma. The sign of a decides. Which way does the acceleration point?',
    ],
    steps: ($) => [
      String.raw`The scale reads $N$. Up positive: $N - mg = ma$, so $N = m(g + a)$.`,
      { 'up-faster': 'Speeding up while rising: a points up, so N > mg.', 'up-steady': 'Steady speed: a = 0, so N = mg.', 'up-slower': 'Slowing while rising: a points down, so N < mg.', 'down-faster': 'Speeding up while falling: a points down, so N < mg.', 'down-slower': 'Slowing while falling: a points up, so N > mg.' }[$.motion],
    ],
    // Second: put numbers in, a 70 kg person and |a| = 2 m/s², and compare N with mg.
    second: ($) => ({ read: compare(70 * (G + LIFT[$.motion]), 70 * G) }),
    cases: [kase('Hibbeler §13.4', { motion: 'down-slower' }, { read: 'more' })],
  }),

  problem({
    id: 'u2.13.crest',
    title: 'Over a crest, through a dip',
    exam: 'u2',
    ch: '13',
    kind: 'conceptual',
    lab: 'curve',
    src: 'Hibbeler §13.5',
    topics: ['loop'],
    vars: {
      road: choice(['crest', 'over the crest of a hill'], ['dip', 'through the bottom of a dip'], ['flat', 'along a level straight road']),
    },
    text: (T) => `A car drives at a steady speed ${T.road}. Compared with the car's weight, how big is the normal force from the road?`,
    parts: [
      pick('N', 'the normal force', [
        ['less', 'less than the weight', 'Over a crest the centre of curvature is below. The net force must point down, so N < mg.'],
        ['same', 'equal to the weight', 'Only on a level straight road: no curve, no normal acceleration, so N = mg.'],
        ['more', 'more than the weight', 'In a dip the centre of curvature is above. The net force must point up, so N > mg.'],
      ], ($) => ({ crest: 'less', dip: 'more', flat: 'same' }[$.road])),
    ],
    level: 1,
    hints: ['On a curve at steady speed, the acceleration is v²/ρ toward the centre of curvature.',
      'Write ΣF = ma along the line to the centre. Weight and N lie on it.',
    ],
    steps: ($) => [
      String.raw`Steady speed: $a_t = 0$, and $a_n = v^2/\rho$ points to the centre of curvature.`,
      { crest: String.raw`Centre below: $mg - N = mv^2/\rho$, so $N = m(g - v^2/\rho) < mg$.`, dip: String.raw`Centre above: $N - mg = mv^2/\rho$, so $N = m(g + v^2/\rho) > mg$.`, flat: String.raw`No curve: $a = 0$, so $N = mg$.` }[$.road],
    ],
    // Second: 1,200 kg at 15 m/s over a 50 m radius.
    second: ($) => {
      const m = 1200;
      const an = (15 * 15) / 50;
      const N = { crest: m * (G - an), dip: m * (G + an), flat: m * G }[$.road];
      return { N: compare(N, m * G) };
    },
    cases: [kase('Hibbeler §13.5', { road: 'crest' }, { N: 'less' })],
  }),

  problem({
    id: 'u2.13.tension',
    title: 'The tension in an Atwood machine',
    exam: 'u2',
    ch: '13',
    kind: 'conceptual',
    lab: 'fma',
    src: 'Hibbeler §13.3',
    topics: ['newton', 'pulley'],
    vars: {
      state: choice(['released', 'released from rest and moving'], ['held', 'held still by a hand under m₂']),
    },
    text: (T) => `Two masses hang over a light pulley, with m₂ heavier than m₁. The system is ${T.state}. How big is the tension in the string?`,
    parts: [
      pick('T', 'the tension', [
        ['between', 'between m₁g and m₂g', 'Released, m₁ accelerates up, so T > m₁g; m₂ accelerates down, so T < m₂g.'],
        ['heavy', 'equal to m₂g', 'The string would carry m₂’s weight only if m₂ were in equilibrium on the string alone. Released, it accelerates; held, the hand takes part of its weight.'],
        ['light', 'equal to m₁g', 'Held still, m₁ hangs in equilibrium on the string, so T = m₁g. Released, m₁ accelerates upward and the string must pull harder.'],
        ['sum', '(m₁ + m₂)g', 'That is the load on the pulley’s axle when nothing moves, 2T, not the tension. Each side of the string carries T.'],
      ], ($) => ($.state === 'held' ? 'light' : 'between')),
    ],
    level: 2,
    hints: ['Draw a free-body diagram for m₁ alone. Only the string and gravity act on it.',
      'If m₁ accelerates upward, the string must pull harder than m₁’s weight.',
    ],
    steps: ($) => ($.state === 'held'
      ? ['Nothing moves, so m₁ is in equilibrium: T − m₁g = 0, and T = m₁g.', 'The hand under m₂ supplies the rest of m₂’s weight: (m₂ − m₁)g.']
      : [String.raw`For $m_1$: $T - m_1 g = m_1 a$ with $a > 0$, so $T > m_1 g$.`, String.raw`For $m_2$: $m_2 g - T = m_2 a$, so $T < m_2 g$.`]),
    // Second: 2 kg and 4 kg, with the tension from the equations of motion.
    second: ($) => {
      const T = $.state === 'held' ? 2 * G : (2 * 2 * 4 * G) / 6;
      const near = (x, y) => Math.abs(x - y) < 1e-9;
      return { T: near(T, 2 * G) ? 'light' : near(T, 4 * G) ? 'heavy' : T > 2 * G && T < 4 * G ? 'between' : 'sum' };
    },
    cases: [kase('Hibbeler §13.3', { state: 'released' }, { T: 'between' })],
  }),

  problem({
    id: 'u2.13.friction-dir',
    title: 'Which way does friction point?',
    exam: 'u2',
    ch: '13',
    kind: 'conceptual',
    lab: 'fma',
    src: 'Hibbeler §13.4',
    topics: ['friction', 'incline'],
    vars: {
      state: choice(
        ['rest', 'sits at rest'],
        ['down', 'slides down'],
        ['up', 'was shoved and is sliding up'],
        ['pushed', 'is pushed by a horizontal force, just hard enough that it is about to slide up'],
      ),
    },
    text: (T) => `A block on a rough incline ${T.state}. Which way does the friction force on it point?`,
    parts: [
      pick('f', 'friction', [
        ['up', 'up the plane', 'Friction points up the plane when it opposes sliding down, or holds back a block that would slide down.'],
        ['down', 'down the plane', 'Friction points down the plane when the block slides up, or is about to.'],
        ['none', 'there is no friction', 'A rough surface gives friction whenever something tries to make the block slide. Here something does.'],
      ], ($) => frictionDir($.state)),
    ],
    level: 2,
    hints: ['Friction opposes sliding, or the sliding that would happen without it.',
      'Ask which way the block moves, or would move on a smooth plane.',
    ],
    steps: ($) => [
      { rest: 'At rest, static friction balances mg sin θ, which pulls down the plane. So friction points up.', down: 'Sliding down, kinetic friction opposes the motion: up the plane.', up: 'Sliding up, kinetic friction opposes the motion: down the plane.', pushed: 'About to slide up, static friction opposes that: down the plane.' }[$.state],
    ],
    second: ($) => ({ f: frictionDir($.state) }),
    cases: [kase('Hibbeler §13.4', { state: 'pushed' }, { f: 'down' })],
  }),

  problem({
    id: 'u2.13.highway',
    title: 'Application: the curve of a highway',
    exam: 'u2',
    ch: '13',
    lab: 'highway',
    src: 'Hibbeler §13.5',
    topics: ['bank'],
    // Structure: design the radius for a speed, or check a driver's friction need on a built curve.
    vars: {
      find: choice(['R', 'design'], ['f', 'check']),
      V: range(50, 70, 5, 'mph'),
      e: range(0.04, 0.1, 0.02, ''),
      drive: range(45, 80, 5, 'mph'),
    },
    derive: ($) => ({ f: aashtoFmax($.V), Rft: minRadiusFt($.V, $.e, aashtoFmax($.V)) }),
    valid: ($) => $.find === 'R' || Math.abs($.drive - $.V) >= 5,
    text: (T, $, sig) => ($.find === 'R'
      ? String.raw`A rural highway is designed for ${T.V} mph with a superelevation of $e = ${T.e}$. AASHTO allows a side friction factor of ${sig($.f)} at that speed. Find the minimum radius by AASHTO's formula, and the speed at which a car on that curve would need all of the allowed friction, from the exact force balance.`
      : String.raw`A highway curve of radius ${sig($.Rft)} ft is banked at $e = ${T.e}$. A driver takes it at ${T.drive} mph. Find the side friction factor the car needs, from the force balance on the bank, and the speed at which it would need AASHTO's ${sig($.f)}.`),
    parts: [
      num('q', ($) => ($.find === 'R' ? $.Rft : frictionNeed($.drive * MPH, $.Rft * M_PER_FT, $.e)), ($) => ($.find === 'R' ? 'ft' : ''), { label: ($) => ($.find === 'R' ? 'minimum radius' : 'side friction factor needed') }),
      num('vLim', ($) => limitSpeed($.Rft * M_PER_FT, $.e, $.f) / MPH, 'mph', { label: 'speed that needs all the allowed friction' }),
    ],
    level: 2,
    hints: [
      'Draw the car on the bank: weight, the road’s normal push, and side friction along the surface. The net force points to the curve’s centre.',
      'Vertical: N cos θ − F sin θ = mg. Toward the centre: N sin θ + F cos θ = mv²/R, with tan θ = e and F = f N.',
      'AASHTO drops the small e f term and works in mph and feet: R = V²/(15(e + f)).',
    ],
    steps: ($, sig) => {
      const R = $.Rft * M_PER_FT;
      const v = limitSpeed(R, $.e, $.f);
      return [
        $.find === 'R'
          ? String.raw`$R = V^2/15(e + f) = ${sig($.V)}^2/15(${sig($.e)} + ${sig($.f)}) = ${sig($.Rft)}$ ft.`
          : String.raw`At ${sig($.drive)} mph, $v^2/gR = ${sig(($.drive * MPH) ** 2 / (G * R))}$, so $f = (v^2/gR - e)/(1 + e\,v^2/gR) = ${sig(frictionNeed($.drive * MPH, R, $.e))}$.`,
        String.raw`The exact limit on ${sig($.Rft)} ft $= ${sig(R)}$ m: $v^2 = Rg(e + f)/(1 - ef)$, so $v = ${sig(v)}$ m/s $= ${sig(v / MPH)}$ mph.`,
      ];
    },
    // Second: the vector force balance of bankedCurve, independent of the closed forms.
    second: ($) => {
      const R = $.Rft * M_PER_FT;
      const th = (Math.atan($.e) * 180) / Math.PI;
      const vMax = bankedCurve({ mass: 1, radius: R, thetaDeg: th, mu: $.f }).vMax;
      if ($.find === 'R') {
        // Recover the radius from AASHTO's own speed–radius rule by bisection on R.
        let lo = 10;
        let hi = 1e5;
        for (let i = 0; i < 100; i++) {
          const mid = 0.5 * (lo + hi);
          if ((15 * (($.e + $.f) * mid)) < $.V * $.V) lo = mid;
          else hi = mid;
        }
        return { q: 0.5 * (lo + hi), vLim: vMax / MPH };
      }
      const b = bankedCurve({ mass: 1, radius: R, thetaDeg: th, speed: $.drive * MPH });
      return { q: b.f / b.N, vLim: vMax / MPH };
    },
    sim: {
      scenario: 'r60',
      setup(s, $) {
        Object.assign(s, { V: $.V, e: $.e, f: $.f, drive: $.find === 'R' ? $.V : $.drive, Rfix: null });
      },
      read: (c, s, $) => ({ q: $.find === 'R' ? c.Rdesign : c.need, vLim: c.vLimMph }),
    },
    cases: [kase('Hibbeler §13.5', { find: 'R', V: 60, e: 0.08, drive: 60 }, { q: 1200, vLim: limitSpeed(1200 * M_PER_FT, 0.08, 0.12) / MPH })],
  }),
];

export default more;
