/**
 * Unit 6 beyond the original drills: four conceptual questions, each option with its own reason,
 * and the unit's application, a traction elevator's car, counterweight and sheave (the `hoist` lab).
 */
import { barPin, centralInertia, diskInertiaIntegral } from '@flux/subjects/mechanics/inertia.js';
import { inertiaRodCenter, inertiaRodEnd } from '@flux/subjects/mechanics/rotation.js';
import { accelFrom, counterweight, hoist, hoistBySystem } from '@flux/subjects/mechanics/hoist.js';
import { G, choice, kase, num, problem, range } from '../kit.js';

/** A choice part whose options each carry a `why` (a string, or a function of $). */
const pick = (id, label, options, correct) => ({ id, kind: 'choice', label, options: options.map(([value, text, why]) => ({ value, label: text, why })), correct, multi: false });

/** The two bodies of each pair, in the order the question names them, with unit mass and size. */
const PAIRS = {
  'hoop-disk': { names: ['the hoop', 'the disk'], I: [centralInertia('hoop', 1, 1), centralInertia('disk', 1, 1)] },
  'sphere-disk': { names: ['the sphere', 'the disk'], I: [centralInertia('sphere', 1, 1), centralInertia('disk', 1, 1)] },
  rod: { names: ['the end-pivoted rod', 'the centre-pivoted rod'], I: [inertiaRodEnd(1, 1), inertiaRodCenter(1, 1)] },
};
/** Same torque from rest: t = Iω/M, so the smaller I gets there first. */
function faster(pair) {
  const [a, b] = PAIRS[pair].I;
  if (Math.abs(a - b) < 1e-12) return 'same';
  return a < b ? 'first' : 'second';
}

/**
 * Friction on a body that rolls without slipping, positive along the motion. A push P at height h
 * above the centre, a downhill pull W: ma = P + W + f and Iα = Ph − fR with a = αR give
 * f = (Ph − kR(P + W))/(R(1 + k)), k = I/(mR²).
 */
function rollingFriction({ P, h, W, k, R = 1 }) {
  return (P * h - k * R * (P + W)) / (R * (1 + k));
}
const FRICTION = {
  downhill: { P: 0, h: 0, W: 1 },
  centre: { P: 1, h: 0, W: 0 },
  top: { P: 1, h: 1, W: 0 },
  coast: { P: 0, h: 0, W: 0 },
};
function frictionWay(kind) {
  const f = rollingFriction({ ...FRICTION[kind], k: 0.5 });
  if (Math.abs(f) < 1e-12) return 'none';
  return f > 0 ? 'with' : 'against';
}

/** The pin force against the weight for a 1 kg, 2 m bar, from the bar's own equations. */
const PIN_CASE = {
  release: { thetaDeg: 90, omega: 0 },
  hang: { thetaDeg: 0, omega: 0 },
  bottom: { thetaDeg: 0, omega: Math.sqrt((3 * G) / 2) },
};
function pinVersusWeight(kind) {
  const row = barPin({ mass: 1, length: 2, ...PIN_CASE[kind] });
  if (Math.abs(row.ratio - 1) < 1e-9) return 'equal';
  return row.ratio < 1 ? 'less' : 'more';
}

/** Time to the same speed under a steady net torque, as a factor of the original: t ∝ I/M. */
const CHANGE = {
  radius: { I: 4, M: 1 },
  mass: { I: 2, M: 1 },
  ring: { I: centralInertia('hoop', 1, 1) / centralInertia('disk', 1, 1), M: 1 },
  torque: { I: 1, M: 2 },
};
const factorOf = (c) => {
  const r = CHANGE[c].I / CHANGE[c].M;
  return { 4: '4', 2: '2', 1: '1', 0.5: 'half' }[r] ?? String(r);
};

const more = [
  problem({
    id: 'u6.17.spin-faster',
    title: 'Which spins up first?',
    exam: 'u6',
    ch: '17',
    kind: 'conceptual',
    lab: 'inertia',
    src: 'Hibbeler §17.1',
    topics: ['inertia'],
    vars: {
      pair: choice(
        ['hoop-disk', 'a thin hoop and a solid disk, with the same mass and radius'],
        ['sphere-disk', 'a solid sphere and a solid disk, with the same mass and radius'],
        ['rod', 'two equal slender rods, one pivoted at its end and one at its centre'],
      ),
    },
    text: (T) => `Take ${T.pair}. Each starts from rest about its axis, and each gets the same steady torque. Ignore friction. Which reaches a given angular speed first?`,
    parts: [
      pick('which', 'reaches the speed first', [
        ['first', (T, $) => PAIRS[$.pair].names[0], ($) => (faster($.pair) === 'first' ? `It has the smaller mass moment, so the same torque gives it the larger α.` : `It has the larger mass moment: its mass sits farther from the axis, so the same torque gives it a smaller α.`)],
        ['second', (T, $) => PAIRS[$.pair].names[1], ($) => (faster($.pair) === 'second' ? 'It has the smaller mass moment, so the same torque gives it the larger α.' : 'It has the larger mass moment: its mass sits farther from the axis, so the same torque gives it a smaller α.')],
        ['same', 'they arrive together', 'Same mass and size is not the same I. How far the mass sits from the axis decides it.'],
      ], ($) => faster($.pair)),
    ],
    level: 1,
    hints: ['The torque is the same, so α = M/I. Compare the two mass moments.',
      'I counts each bit of mass times the square of its distance from the axis. Which body keeps its mass closer in?',
    ],
    steps: ($) => {
      const [a, b] = PAIRS[$.pair].I;
      const [na, nb] = PAIRS[$.pair].names;
      return [
        `For a unit mass and size, ${na} has I = ${a.toFixed(3)} and ${nb} has I = ${b.toFixed(3)}.`,
        `With the same torque, α = M/I, so the time to a speed ω is Iω/M. The one with the smaller I gets there first: ${faster($.pair) === 'first' ? na : nb}.`,
      ];
    },
    // Second: time-step each body's spin-up under the same torque and see which crosses ω = 1 first.
    second: ($) => {
      const reach = (I) => {
        let w = 0;
        let t = 0;
        while (w < 1) {
          w += (1 / I) * 1e-4;
          t += 1e-4;
        }
        return t;
      };
      const [ta, tb] = PAIRS[$.pair].I.map(reach);
      return { which: Math.abs(ta - tb) < 1e-9 ? 'same' : ta < tb ? 'first' : 'second' };
    },
    cases: [kase('Hibbeler §17.1', { pair: 'hoop-disk' }, { which: 'second' })],
  }),

  problem({
    id: 'u6.17.pin-load',
    title: 'More or less than the weight?',
    exam: 'u6',
    ch: '17',
    kind: 'conceptual',
    lab: 'pendulum',
    src: 'Hibbeler §17.4',
    topics: ['pin'],
    vars: {
      when: choice(
        ['release', 'at the instant it is released from rest, horizontal'],
        ['hang', 'while it hangs straight down, at rest'],
        ['bottom', 'as it swings through the bottom, after a release from horizontal'],
      ),
    },
    text: (T) => `A uniform bar is pinned at one end. Compare the pin force with the bar's weight ${T.when}.`,
    parts: [
      pick('pin', 'the pin force is', [
        ['less', 'less than the weight', ($) => ($.when === 'release' ? 'Right: the centre is accelerating downward at 3g/4, so the pin holds only mg/4.' : 'The pin carries less only when the centre accelerates downward. Here it does not.')],
        ['equal', 'equal to the weight', ($) => ($.when === 'hang' ? 'Right: at rest, nothing accelerates, and the pin holds exactly mg.' : 'Equal only when the mass centre has no acceleration. Here it accelerates.')],
        ['more', 'more than the weight', ($) => ($.when === 'bottom' ? 'Right: the centre moves on a circle, so the pin also supplies m(L/2)ω² upward: 2.5mg in all.' : 'More only when the centre accelerates toward the pin, as it does when swinging through the bottom.')],
      ], ($) => pinVersusWeight($.when)),
    ],
    level: 2,
    hints: ['The pin force and the weight together give the mass centre its acceleration: ΣF = m a_G.',
      'Which way does the centre accelerate in each case? Downward means the pin pushes less than mg; toward the pin above means more.',
    ],
    steps: ($) => {
      const row = barPin({ mass: 1, length: 2, ...PIN_CASE[$.when] });
      return [
        `Take m = 1 kg and L = 2 m. The pin force is ${row.pin.toFixed(2)} N against a weight of ${G.toFixed(2)} N: ${row.ratio.toFixed(2)} times the weight.`,
        'At release the centre falls at 3g/4; hanging, it does not accelerate; at the bottom it moves on a circle with a_G = (L/2)ω² = 1.5g, toward the pin.',
      ];
    },
    // Second: from the component form of the bar's equations, not the ratio itself.
    second: ($) => {
      const row = barPin({ mass: 1, length: 2, ...PIN_CASE[$.when] });
      const pin = Math.hypot(row.OxC, row.OyC);
      return { pin: Math.abs(pin - G) < 1e-9 ? 'equal' : pin < G ? 'less' : 'more' };
    },
    cases: [kase('Hibbeler §17.4', { when: 'release' }, { pin: 'less' })],
  }),

  problem({
    id: 'u6.17.friction-way',
    title: 'Which way does friction point?',
    exam: 'u6',
    ch: '17',
    kind: 'conceptual',
    lab: 'roll-slip',
    src: 'Hibbeler §17.5',
    topics: ['roll'],
    vars: {
      kind: choice(
        ['downhill', 'rolls down an incline from rest'],
        ['centre', 'is pulled along a level floor by a horizontal force at its centre'],
        ['top', 'is pulled along a level floor by a rope wound over its top, pulled horizontally'],
        ['coast', 'rolls along a level floor at a steady speed, with nothing pushing it'],
      ),
    },
    text: (T) => `A uniform disk ${T.kind}. It rolls without slipping. Which way does the friction force from the ground point?`,
    parts: [
      pick('f', 'friction points', [
        ['with', 'the way the disk moves', ($) => ($.kind === 'top' ? 'Right: the pull at the top spins the disk faster than rolling needs, so friction pushes forward to hold the bottom still.' : 'Friction points forward only when the push alone would spin the disk too fast, as a pull at the top does.')],
        ['against', 'against the motion', ($) => ($.kind === 'downhill' || $.kind === 'centre' ? 'Right: the force acts through the centre and cannot spin the disk. Friction at the bottom does, and it points back.' : 'Not here. Work out what spin the force alone would give, and what rolling needs.')],
        ['none', 'there is no friction', ($) => ($.kind === 'coast' ? 'Right: nothing changes, so no friction is needed. a = 0 and α = 0.' : 'Something speeds the disk up, and rolling needs α to keep pace with a. Friction supplies the difference.')],
      ], ($) => frictionWay($.kind)),
    ],
    level: 2,
    hints: ['Rolling ties a to α: a = αR. Ask what α the applied forces alone would give, against what rolling needs.',
      'A force through the centre gives no moment about G: only friction can spin the disk up. A force at the top spins it twice as hard as its own a needs.',
    ],
    steps: ($) => {
      const f = rollingFriction({ ...FRICTION[$.kind], k: 0.5 });
      return [
        'With k = I/(mR²) = 1/2, ma = P + W + f and Iα = Ph − fR, with a = αR.',
        `Solving, f = (Ph − kR(P + W))/(R(1 + k)) = ${f.toFixed(3)} per unit push. ${f > 1e-12 ? 'Positive: friction points with the motion.' : f < -1e-12 ? 'Negative: friction points against the motion.' : 'Zero: no friction.'}`,
      ];
    },
    // Second: the acceleration of the bottom point with no friction. Friction opposes its slide.
    second: ($) => {
      const { P, h, W } = FRICTION[$.kind];
      const a = P + W;
      const alphaR = (P * h) / 0.5;
      const slip = a - alphaR;
      return { f: Math.abs(slip) < 1e-12 ? 'none' : slip < 0 ? 'with' : 'against' };
    },
    cases: [kase('Hibbeler §17.5', { kind: 'top' }, { f: 'with' })],
  }),

  problem({
    id: 'u6.17.spin-time',
    title: 'Spin-up time when the rotor changes',
    exam: 'u6',
    ch: '17',
    kind: 'conceptual',
    lab: 'inertia',
    src: 'Hibbeler §17.4',
    topics: ['pin'],
    vars: {
      change: choice(
        ['radius', 'doubles the impeller radius and keeps its mass'],
        ['mass', 'doubles the impeller mass and keeps its radius'],
        ['ring', 'swaps the solid disk for a thin ring of the same mass and radius'],
        ['torque', 'doubles the net torque and keeps the impeller'],
      ),
    },
    text: (T) => `A rotor is a solid disk on a light shaft. A steady net torque spins it up from rest to a set speed. A redesign ${T.change}. The time to reach the same speed is now:`,
    parts: [
      pick('t', 'the new time is', [
        ['4', '4 times as long', ($) => ($.change === 'radius' ? 'Right: I = ½mR², so doubling R makes I four times larger, and t = Iω/M.' : 'Four times needs I four times larger, which takes a doubled radius.')],
        ['2', 'twice as long', ($) => ($.change === 'mass' || $.change === 'ring' ? 'Right: I doubles (½mR² → mR² for the ring, or twice the mass), and t = Iω/M doubles.' : 'Twice as long needs I to double at the same torque.')],
        ['1', 'the same', 'Every change here alters I or M, so t = Iω/M changes.'],
        ['half', 'half as long', ($) => ($.change === 'torque' ? 'Right: α = M/I doubles, so the same speed comes in half the time.' : 'Only more torque, or less inertia, shortens it.')],
      ], ($) => factorOf($.change)),
    ],
    level: 1,
    hints: ['At constant α, ω = αt, so t = ω/α = Iω/M.',
      'A disk is ½mR²; a ring is mR². Find the factor on I, and on M.',
    ],
    steps: ($) => [
      `t = Iω/M. The change multiplies I by ${CHANGE[$.change].I} and M by ${CHANGE[$.change].M}.`,
      `So t is multiplied by ${CHANGE[$.change].I / CHANGE[$.change].M}.`,
    ],
    // Second: the mass moments by integration, then the ratio of times.
    second: ($) => {
      const base = diskInertiaIntegral(1, 1);
      const I = { radius: diskInertiaIntegral(1, 2), mass: diskInertiaIntegral(2, 1), ring: 1, torque: base }[$.change];
      const M = $.change === 'torque' ? 2 : 1;
      const r = I / base / M;
      const near = (x) => Math.abs(r - x) < 1e-3;
      return { t: near(4) ? '4' : near(2) ? '2' : near(1) ? '1' : near(0.5) ? 'half' : String(r) };
    },
    cases: [kase('Hibbeler §17.4', { change: 'radius' }, { t: '4' })],
  }),

  problem({
    id: 'u6.17.hoist',
    title: 'Application: a traction elevator',
    exam: 'u6',
    ch: '17',
    lab: 'hoist',
    src: 'Hibbeler §17.4',
    topics: ['pin'],
    // Structure: the torque a start needs, or the start a torque gives; the car above or below balance.
    // Designed numbers: the acceleration is picked, and the torque is stated to four figures.
    vars: {
      find: choice(['torque', 'the torque'], ['accel', 'the acceleration']),
      car: range(800, 1200, 100, 'kg'),
      load: range(0, 1000, 125, 'kg'),
      a: range(0.5, 1.5, 0.25, 'm/s²'),
      r: range(0.25, 0.4, 0.05, 'm'),
      I: range(8, 16, 2, 'kg·m²'),
    },
    derive: ($) => {
      const m1 = $.car + $.load;
      const m2 = counterweight($.car, 1000, 0.45);
      const spec = { m1, m2, r: $.r, I: $.I };
      const Mgiven = Number(hoist({ ...spec, a: $.a }).M.toPrecision(4));
      const acc = $.find === 'torque' ? $.a : accelFrom({ ...spec, M: Mgiven });
      return { m1, m2, spec, Mgiven, acc, h: hoist({ ...spec, a: acc }) };
    },
    valid: ($) => Math.abs($.Mgiven) > 50,
    text: (T, $) => ($.find === 'torque'
      ? String.raw`A traction elevator's ${T.car} car carries ${T.load}. It is rated for 1,000 kg, and its counterweight is the empty car plus 45% of that. The rope runs over a drive sheave of radius ${T.r}; the sheave and the motor's rotor have $I = ${$.I}$ kg·m². The rope does not slip. Find the motor torque that starts the car upward at ${T.a}, and the tension in the car's rope while it does.`
      : String.raw`A traction elevator's ${T.car} car carries ${T.load}. It is rated for 1,000 kg, and its counterweight is the empty car plus 45% of that. The rope runs over a drive sheave of radius ${T.r}; the sheave and the motor's rotor have $I = ${$.I}$ kg·m². The rope does not slip. From rest, the motor applies $${$.Mgiven}$ N·m to the sheave, turning it to lift the car. Find the car's acceleration and the tension in the counterweight's rope.`),
    parts: [
      num('q', ($) => ($.find === 'torque' ? $.h.M : $.acc), ($) => ($.find === 'torque' ? 'N·m' : 'm/s²'), {
        label: ($) => ($.find === 'torque' ? 'motor torque' : 'car acceleration'),
        traps: [
          [($) => ($.find === 'torque' ? $.h.M - ($.I * $.acc) / $.r : (($.Mgiven / $.r) - ($.m1 - $.m2) * G) / ($.m1 + $.m2)),
            'The sheave and the rotor turn faster too. Their I α = I a/r is part of the torque.'],
          [($) => ($.find === 'torque' ? $.r * ($.m1 - $.m2) * G + ($.I * $.acc) / $.r : (($.Mgiven / $.r) - ($.m1 - $.m2) * G) / ($.m1 + $.I / ($.r * $.r))),
            ($) => ($.find === 'torque'
              ? 'That takes each rope’s pull as its weight. While the car speeds up, T₁ = m₁(g + a) and T₂ = m₂(g − a).'
              : 'The counterweight speeds up too, downward. Its mass belongs in the sum m₁ + m₂ + I/r².')],
        ],
      }),
      num('T', ($) => ($.find === 'torque' ? $.h.T1 : $.h.T2), 'N', {
        label: ($) => ($.find === 'torque' ? 'car rope tension' : 'counterweight rope tension'),
        traps: [
          [($) => ($.find === 'torque' ? $.m1 * G : $.m2 * G), 'That is the weight. The rope must also accelerate the body hanging from it.'],
          [($) => ($.find === 'torque' ? $.m1 * (G - $.acc) : $.m2 * (G + $.acc)),
            ($) => ($.find === 'torque'
              ? 'The car speeds up upward, so the rope pulls more than the weight: T₁ = m₁(g + a).'
              : 'The counterweight speeds up downward, so its rope pulls less than its weight: T₂ = m₂(g − a).')],
        ],
      }),
    ],
    level: 3,
    hints: ['Draw three free-body diagrams: the car, the counterweight, and the sheave. The rope links them: a = α r.',
      String.raw`Car: $T_1 - m_1 g = m_1 a$. Counterweight: $m_2 g - T_2 = m_2 a$. Sheave: $M - (T_1 - T_2)\,r = I a/r$.`,
      String.raw`Eliminate the tensions: $M = r(m_1 - m_2)g + (m_1 + m_2 + I/r^2)\,a\,r$.`,
    ],
    steps: ($, sig) => {
      const { h } = $;
      const out = [String.raw`$m_1 = ${$.car} + ${$.load} = ${$.m1}$ kg, $m_2 = ${$.car} + 0.45(1000) = ${$.m2}$ kg, $I/r^2 = ${sig($.I / ($.r * $.r))}$ kg.`];
      if ($.find === 'torque') {
        out.push(String.raw`$M = (${sig($.r)})(${$.m1} - ${$.m2})(9.81) + (${$.m1} + ${$.m2} + ${sig($.I / ($.r * $.r))})(${$.a})(${sig($.r)}) = ${sig(h.M)}$ N·m.`);
        out.push(String.raw`$T_1 = m_1(g + a) = ${$.m1}(9.81 + ${$.a}) = ${sig(h.T1)}$ N.`);
      } else {
        out.push(String.raw`$a = \dfrac{M/r - (m_1 - m_2)g}{m_1 + m_2 + I/r^2} = ${sig($.acc)}$ m/s².`);
        out.push(String.raw`$T_2 = m_2(g - a) = ${$.m2}(9.81 - ${sig($.acc)}) = ${sig(h.T2)}$ N.`);
      }
      return out;
    },
    // Second: the three free-body equations as one linear system.
    second: ($) => {
      if ($.find === 'torque') {
        // Bisect on the torque until the system gives the asked acceleration.
        let lo = -2e4;
        let hi = 2e4;
        for (let i = 0; i < 80; i++) {
          const mid = 0.5 * (lo + hi);
          if (hoistBySystem({ ...$.spec, M: mid }).a < $.a) lo = mid;
          else hi = mid;
        }
        const M = 0.5 * (lo + hi);
        return { q: M, T: hoistBySystem({ ...$.spec, M }).T1 };
      }
      const s = hoistBySystem({ ...$.spec, M: $.Mgiven });
      return { q: s.a, T: s.T2 };
    },
    sim: {
      scenario: 'full',
      setup(s, $) {
        Object.assign(s, { car: $.car, load: $.load, a: $.acc, q: 0.45, r: $.r, I: $.I, t: 0.01 });
      },
      read: (c, s, $) => ($.find === 'torque' ? { q: c.Mup, T: c.T1up } : { q: s.a, T: c.T2up }),
    },
    cases: [
      kase('Hibbeler §17.4', { find: 'torque', car: 1000, load: 1000, a: 1, r: 0.3, I: 12 }, {
        q: hoist({ m1: 2000, m2: 1450, r: 0.3, I: 12, a: 1 }).M,
        T: 2000 * (G + 1),
      }),
    ],
  }),
];

export default more;
