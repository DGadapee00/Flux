/**
 * Unit 7, beyond the numeric drills: four conceptual questions, each wrong option with its own
 * reason, a machine rocking on one footpad (the `tipover` lab), and the unit's application, a
 * wheelchair rolling down an accessible ramp (the `wheelchair` lab).
 */
import { ROLL_K } from '@flux/subjects/mechanics/rigid-energy.js';
import { M_PER_FT, M_PER_IN } from '@flux/subjects/convert.js';
import { rollDown, rollDownStepped } from '@flux/subjects/mechanics/wheelchair.js';
import { omegaCNumeric, tip } from '../../labs/tipover.js';
import { chairSpec } from '../../labs/wheelchair.js';
import { G, choice, kase, num, problem, range } from '../kit.js';

/** A choice part whose options each carry a `why`. `options` may depend on `$`. */
const pick = (id, label, options, correct) => ({
  id,
  kind: 'choice',
  label,
  options: typeof options === 'function'
    ? ($) => options($).map(([value, text, why]) => ({ value, label: text, why }))
    : options.map(([value, text, why]) => ({ value, label: text, why })),
  correct,
  multi: false,
});

/** Each force, whether its point of application moves along it, and so the sign of its work. */
const FORCE = {
  rolling: { text: 'friction on a wheel that rolls without slipping', work: 'none' },
  pin: { text: 'the pin force on a bar swinging about a fixed pin', work: 'none' },
  skid: { text: 'friction on a wheel that skids along the road', work: 'negative' },
  normal: { text: 'the normal force from a fixed incline on a disk rolling down it', work: 'none' },
  drive: { text: 'a motor’s couple on a flywheel it is speeding up', work: 'positive' },
};

/** Second method for the work's sign: U = ∫ F·v dt over a short interval, from each force's own kinematics. */
function workSign(key) {
  // Velocity of the point where the force acts, and the force, at one instant (unit sizes).
  const at = {
    rolling: { F: [-1, 0], v: [0, 0] },
    pin: { F: [0.3, 1], v: [0, 0] },
    skid: { F: [-1, 0], v: [1, 0] },
    normal: { F: [0, 1], v: [1, 0] },
    drive: { F: [1, 0], v: [1, 0] }, // the couple M and ω, written as one dot product M·ω
  }[key];
  const P = at.F[0] * at.v[0] + at.F[1] * at.v[1];
  return Math.abs(P) < 1e-12 ? 'none' : P > 0 ? 'positive' : 'negative';
}

/** Two bodies on the same incline: which reaches the bottom first. Only k = I_G/(mR²) enters. */
const PAIR = {
  'hoop-disk': { a: 'hoop', b: 'disk', text: 'a heavy hoop of 10 kg and a light disk of 1 kg, the same radius' },
  'big-small': { a: 'sphere', b: 'sphere', text: 'a large solid sphere of radius 0.3 m and a small one of radius 0.05 m' },
  'disk-sphere': { a: 'disk', b: 'sphere', text: 'a disk of radius 0.1 m and a solid sphere of radius 0.4 m' },
};

/** Which body wins, from the time to roll a fixed slope: t = √(2s(1 + k)/(g sin θ)). */
function raceWinner(key) {
  const p = PAIR[key];
  const t = (shape) => Math.sqrt((2 * 2 * (1 + ROLL_K[shape])) / (G * Math.sin(Math.PI / 6)));
  const ta = t(p.a);
  const tb = t(p.b);
  return Math.abs(ta - tb) < 1e-12 ? 'tie' : ta < tb ? 'first' : 'second';
}

/** Rotational share of a rolling body's kinetic energy, k/(1 + k), as a fraction. */
const SHARE = { hoop: '1/2', disk: '1/3', sphere: '2/7' };
function shareByEnergy(shape) {
  // ½ I ω² over ½ m v² + ½ I ω², at v = 1, R = 1, m = 1.
  const rot = 0.5 * ROLL_K[shape];
  const f = rot / (0.5 + rot);
  return Object.entries({ '1/2': 0.5, '1/3': 1 / 3, '2/7': 2 / 7, '2/5': 0.4 }).find(([, v]) => Math.abs(v - f) < 1e-12)[0];
}

/** One change to the machine, and how it moves the tip-over speed (the lab's numbers). */
const CHANGE = {
  wider: { text: 'its base is widened so the pads sit farther from the mass centre', apply: (g) => ({ ...g, b: g.b * 1.5 }) },
  higher: { text: 'its payload is mounted higher, raising the mass centre', apply: (g) => ({ ...g, h: g.h * 1.5 }) },
  heavier: { text: 'it carries twice the mass, with the mass centre and k_G where they were', apply: (g) => g },
  lower: { text: 'its tanks are moved down, lowering the mass centre', apply: (g) => ({ ...g, h: g.h / 1.5 }) },
};
const BASE = { h: 1.5, b: 2, kG: 1.5 };
function tipShift(key) {
  const before = tip({ ...BASE, w0: 1 }).omegaC;
  const after = tip({ ...CHANGE[key].apply(BASE), w0: 1 }).omegaC;
  return Math.abs(after - before) < 1e-9 * before ? 'same' : after > before ? 'bigger' : 'smaller';
}

/** The machine's stance as Pythagorean triples, so r = √(b² + h²) comes out round. [b, h] in m. */
const STANCE = [[2, 1.5], [1.5, 2], [3, 4], [1.2, 1.6], [2.4, 1.8], [1.6, 1.2]];
const stance = ($) => STANCE[$.st - 1];

const more = [
  problem({
    id: 'u7.18.no-work',
    title: 'Which forces do work?',
    exam: 'u7',
    ch: '18',
    kind: 'conceptual',
    lab: 'race',
    src: 'Hibbeler §18.5',
    topics: ['energy'],
    vars: { force: choice(...Object.entries(FORCE).map(([k, f]) => [k, f.text])) },
    text: (T) => `Consider ${T.force}. What work does it do as the body moves?`,
    parts: [
      pick('work', 'its work', [
        ['none', 'none', 'No work when the point where the force acts does not move, or moves at right angles to the force.'],
        ['positive', 'positive', 'Positive work needs the point of application to move along the force: F·v > 0.'],
        ['negative', 'negative', 'Negative work needs the point of application to move against the force, as skidding friction does.'],
      ], ($) => FORCE[$.force].work),
    ],
    level: 1,
    hints: ['Work is F·dr for the point where the force acts, not for the body’s centre.',
      'Ask how that point moves. A rolling contact point is at rest for the instant; a fixed pin never moves.',
    ],
    steps: ($) => [
      'Work is the force dotted with the displacement of its own point of application.',
      {
        rolling: 'The contact point of a wheel rolling without slip has zero velocity. Friction there does no work.',
        pin: 'A fixed pin does not move, so its force does no work.',
        skid: 'A skidding contact slides forward while friction points back. The work is negative.',
        normal: 'The contact point does not move into the incline, so the normal force does no work.',
        drive: 'The couple turns the same way as the flywheel: U = ∫M dθ is positive.',
      }[$.force],
    ],
    second: ($) => ({ work: workSign($.force) }),
    cases: [kase('Hibbeler §18.5', { force: 'rolling' }, { work: 'none' })],
  }),

  problem({
    id: 'u7.18.race-pair',
    title: 'Which one reaches the bottom first?',
    exam: 'u7',
    ch: '18',
    kind: 'conceptual',
    lab: 'race',
    src: 'Hibbeler §18.5',
    topics: ['race'],
    vars: { pair: choice(...Object.entries(PAIR).map(([k, p]) => [k, p.text])) },
    text: (T) => `Two bodies are released together from rest and roll without slipping down the same incline: ${T.pair}. Which reaches the bottom first?`,
    parts: [
      pick('who', 'reaches the bottom first', ($) => {
        const p = PAIR[$.pair];
        return [
          ['first', `the ${p.a === p.b ? 'large one' : p.a}`, p.a === p.b ? 'Radius cancels: k is 2/5 for any solid sphere, so neither has the edge.' : `Only k decides. The ${p.a} has k = ${ROLL_K[p.a]}, the ${p.b} k = ${ROLL_K[p.b]}: ${ROLL_K[p.a] < ROLL_K[p.b] ? 'less' : 'more'} of its energy spins it.`],
          ['second', `the ${p.a === p.b ? 'small one' : p.b}`, p.a === p.b ? 'A smaller radius spins faster, but its spin energy ½(⅖mR²)(v/R)² is the same share. They tie.' : `Only k decides. The ${p.b} has k = ${ROLL_K[p.b]}, the ${p.a} k = ${ROLL_K[p.a]}: mass and radius cancel.`],
          ['tie', 'they arrive together', p.a === p.b ? 'Same shape, same k: mass and radius cancel, so they arrive together.' : 'They tie only if their k values match. These shapes differ.'],
        ];
      }, ($) => raceWinner($.pair)),
    ],
    level: 2,
    hints: ['Write the speed after dropping a height h: mgh = ½mv²(1 + k), with k = I_G/(mR²).',
      'Mass and radius cancel. Only the shape, through k, is left.',
    ],
    steps: ($) => {
      const p = PAIR[$.pair];
      return [
        String.raw`$v = \sqrt{2gh/(1+k)}$ at every height, so the smaller $k$ is ahead all the way down.`,
        String.raw`Here $k_1 = ${ROLL_K[p.a] === 0.4 ? '2/5' : ROLL_K[p.a] === 0.5 ? '1/2' : '1'}$ and $k_2 = ${ROLL_K[p.b] === 0.4 ? '2/5' : ROLL_K[p.b] === 0.5 ? '1/2' : '1'}$.`,
      ];
    },
    second: ($) => ({ who: raceWinner($.pair) }),
    cases: [kase('Hibbeler §18.5', { pair: 'hoop-disk' }, { who: 'second' })],
  }),

  problem({
    id: 'u7.18.spin-share',
    title: 'How much of the energy is spin?',
    exam: 'u7',
    ch: '18',
    kind: 'conceptual',
    lab: 'race',
    src: 'Hibbeler §18.1',
    topics: ['energy'],
    vars: { shape: choice(['hoop', 'thin hoop'], ['disk', 'solid disk'], ['sphere', 'solid sphere']) },
    text: (T) => `A ${T.shape} rolls without slipping. What fraction of its kinetic energy is rotational?`,
    parts: [
      pick('share', 'rotational share', [
        ['1/2', '1/2', 'k/(1 + k) = 1/2 only when k = 1: a hoop, all its mass at the rim.'],
        ['1/3', '1/3', 'k/(1 + k) = 1/3 when k = 1/2: a solid disk.'],
        ['2/7', '2/7', 'k/(1 + k) = 2/7 when k = 2/5: a solid sphere.'],
        ['2/5', '2/5', 'That is k itself, the ratio of the spin energy to the translation, not to the total. The share is k/(1 + k).'],
      ], ($) => SHARE[$.shape]),
    ],
    level: 2,
    hints: ['Rolling sets ω = v/R, so ½I_Gω² = ½kmv² with k = I_G/(mR²).',
      'The total is ½mv²(1 + k). Divide the spin part by it.',
    ],
    steps: ($) => [
      String.raw`$T = \tfrac12 mv^2 + \tfrac12 k m v^2$, so the spin share is $k/(1+k)$.`,
      { hoop: String.raw`Hoop, $k = 1$: $1/2$.`, disk: String.raw`Disk, $k = 1/2$: $1/3$.`, sphere: String.raw`Sphere, $k = 2/5$: $2/7$.` }[$.shape],
    ],
    second: ($) => ({ share: shareByEnergy($.shape) }),
    cases: [kase('Hibbeler §18.1', { shape: 'disk' }, { share: '1/3' })],
  }),

  problem({
    id: 'u7.18.tip-change',
    title: 'Harder or easier to tip?',
    exam: 'u7',
    ch: '18',
    kind: 'conceptual',
    lab: 'tipover',
    src: 'Hibbeler §18.5',
    topics: ['energy', 'tipover'],
    vars: { change: choice(...Object.entries(CHANGE).map(([k, c]) => [k, c.text])) },
    text: (T) => `A tall machine rests on its footpads. A bump rocks it about one pad. The smallest angular speed that tips it over is ω_c. Then ${T.change}. What happens to ω_c?`,
    parts: [
      pick('omegaC', 'ω_c', [
        ['bigger', 'it rises: harder to tip', 'ω_c rises when G must climb farther over the pad, √(b² + h²) − h, relative to I_O. Wider pads and a lower G both do that.'],
        ['same', 'it stays the same', 'Only a change that scales the barrier mgΔh and I_O = m(k_G² + r²) together leaves ω_c: more mass, with the geometry fixed.'],
        ['smaller', 'it falls: easier to tip', 'ω_c falls when G sits higher or the pads come in: the climb Δh shrinks and I_O grows.'],
      ], ($) => tipShift($.change)),
    ],
    level: 2,
    hints: ['Tipping takes the kinetic energy needed to lift G until it is straight above the pad.',
      String.raw`$\tfrac12 I_O\omega_c^2 = mg\,(r - h)$, with $r = \sqrt{b^2 + h^2}$ and $I_O = m(k_G^2 + r^2)$.`,
    ],
    steps: ($) => [
      String.raw`$\omega_c = \sqrt{2g(r - h)/(k_G^2 + r^2)}$: the mass cancels.`,
      {
        wider: 'Wider pads raise r − h faster than they raise k_G² + r²: ω_c rises.',
        higher: 'A higher G shrinks r − h and grows r²: ω_c falls.',
        heavier: 'Mass appears on both sides and cancels: ω_c is unchanged.',
        lower: 'A lower G lengthens the climb r − h: ω_c rises.',
      }[$.change],
    ],
    second: ($) => ({ omegaC: tipShift($.change) }),
    cases: [kase('Hibbeler §18.5', { change: 'heavier' }, { omegaC: 'same' })],
  }),

  problem({
    id: 'u7.18.tipover',
    title: 'Will the machine tip over?',
    exam: 'u7',
    ch: '18',
    lab: 'tipover',
    src: 'Hibbeler §18.5',
    topics: ['energy', 'tipover'],
    // Designed numbers: the stance is a Pythagorean triple, so r and the climb r − h are round.
    vars: {
      st: range(1, 6, 1),
      kG: range(1, 2.5, 0.25, 'm'),
      m: range(200, 1500, 100, 'kg'),
      given: choice(['legs', 'a radius of gyration'], ['box', 'a uniform box body']),
    },
    derive: ($) => {
      const [b, h] = stance($);
      // A uniform box w = 2b wide and H = 2h tall, standing on its bottom corners: k_G² = (w² + H²)/12.
      const kG = $.given === 'box' ? Math.sqrt((4 * b * b + 4 * h * h) / 12) : $.kG;
      return { b, h, kG };
    },
    text: (T, $, sig) => ($.given === 'box'
      ? String.raw`A crate of mass ${T.m} kg is a uniform box $${sig(2 * $.b)}\ \mathrm{m}$ wide and $${sig(2 * $.h)}\ \mathrm{m}$ tall, standing on pads at its two bottom corners. A bump rocks it about one pad. How far must its mass centre rise to tip it over, and what is the smallest angular speed about the pad that does so?`
      : String.raw`A machine of mass ${T.m} kg rests on its footpads. Its mass centre is $${sig($.h)}\ \mathrm{m}$ above the pads and $${sig($.b)}\ \mathrm{m}$ in from the outer pad, and its radius of gyration about the mass centre is $${sig($.kG)}\ \mathrm{m}$. A bump rocks it about that pad. How far must its mass centre rise to tip it over, and what is the smallest angular speed about the pad that does so?`),
    parts: [
      num('dh', ($) => tip($).dh, 'm', {
        label: 'rise of the mass centre',
        traps: [
          [($) => Math.hypot($.b, $.h), 'That is the height of G when it is over the pad. It starts at h: subtract it.'],
          [($) => Math.hypot($.b, $.h) - $.b, 'The rise is in height. G starts at h above the pads, so Δh = r − h, not r − b.'],
        ],
      }),
      num('omegaC', ($) => tip($).omegaC, 'rad/s', {
        label: 'tip-over angular speed',
        traps: [
          [($) => Math.sqrt((2 * G * tip($).dh) / ($.kG * $.kG)), 'That uses I about G. The body turns about the pad: I_O = m(k_G² + r²), by the parallel-axis theorem.'],
          [($) => Math.sqrt(2 * G * tip($).dh) / Math.hypot($.b, $.h), 'That treats the body as a point mass at G. Its own spin, m k_G², adds to I_O.'],
        ],
      }),
    ],
    level: 3,
    hints: ['The pad force acts at a point that does not move, so only the weight does work. Tipping starts when G is straight above the pad.',
      String.raw`G is $r = \sqrt{b^2 + h^2}$ from the pad, so it rises $r - h$. Then $\tfrac12 I_O\omega_c^2 = mg(r - h)$.`,
      String.raw`$I_O = m(k_G^2 + r^2)$. For a uniform box, $k_G^2 = (w^2 + H^2)/12$.`,
    ],
    steps: ($, sig) => {
      const f = tip($);
      return [
        ...($.given === 'box' ? [String.raw`Box: $k_G^2 = (w^2 + H^2)/12 = ${sig($.kG ** 2)}\ \mathrm{m^2}$, with $b = w/2 = ${sig($.b)}$ m and $h = H/2 = ${sig($.h)}$ m.`] : []),
        String.raw`$r = \sqrt{b^2 + h^2} = ${sig(f.r)}\ \mathrm{m}$, so G rises $\Delta h = r - h = ${sig(f.dh)}\ \mathrm{m}$.`,
        String.raw`$I_O = m(k_G^2 + r^2) = ${sig(f.IO)}\ \mathrm{kg\cdot m^2}$.`,
        String.raw`$\omega_c = \sqrt{2mg\,\Delta h/I_O} = ${sig(f.omegaC)}\ \mathrm{rad/s}$.`,
      ];
    },
    // Second: the climb by searching the arc for G's highest point, and ω_c by bisection on the
    // time-stepped rocking motion, which never uses the energy equation.
    second: ($) => {
      let lo = 0;
      let hi = Math.PI / 2;
      const y = (t) => $.h * Math.cos(t) + $.b * Math.sin(t);
      for (let i = 0; i < 200; i++) {
        const a = lo + (hi - lo) / 3;
        const c = hi - (hi - lo) / 3;
        if (y(a) < y(c)) lo = a;
        else hi = c;
      }
      return { dh: y(0.5 * (lo + hi)) - $.h, omegaC: omegaCNumeric({ h: $.h, b: $.b, kG: $.kG }) };
    },
    sim: {
      scenario: 'squat',
      setup(s, $) {
        s.m = $.m;
        s.h = $.h;
        s.b = $.b;
        s.kG = $.kG;
      },
      read: (c) => ({ dh: c.dh, omegaC: c.omegaC }),
    },
    cases: [kase('Hibbeler §18.5', { st: 1, kG: 1.5, m: 600, given: 'legs' }, { dh: 1, omegaC: 1.5192897339 })],
  }),
  problem({
    id: 'u7.18.wheelchair',
    title: 'Application: a wheelchair on an accessible ramp',
    exam: 'u7',
    ch: '18',
    lab: 'wheelchair',
    src: 'Hibbeler §18.4',
    topics: ['energy', 'race'],
    // Structure: the ramp given by its rise in inches, or by its length along the slope in feet.
    vars: {
      given: choice(['rise', 'its rise'], ['length', 'its length']),
      rise: range(12, 30, 6, 'in'),
      n: range(12, 20, 2, ''),
      rider: range(60, 120, 10, 'kg'),
      mw: range(1, 2, 0.5, 'kg'),
      c: range(0.008, 0.016, 0.004, ''),
    },
    derive: ($) => {
      const th = Math.atan(1 / $.n);
      // The length is stated in feet to three figures; the rise follows from it.
      const Lft = Number(((($.rise * M_PER_IN) / Math.sin(th)) / M_PER_FT).toPrecision(3));
      const riseIn = $.given === 'rise' ? $.rise : (Lft * M_PER_FT * Math.sin(th)) / M_PER_IN;
      const spec = chairSpec({ rise: riseIn, run: $.n, rider: $.rider, mw: $.mw, c: $.c });
      return { th, Lft, riseIn, spec, r: rollDown(spec) };
    },
    text: (T, $) => {
      const ramp = $.given === 'rise'
        ? String.raw`an accessible ramp with a rise of ${$.rise} in at a slope of 1:${$.n}`
        : String.raw`an accessible ramp ${$.Lft} ft long, measured along its slope of 1:${$.n}`;
      return String.raw`A ${$.rider} kg rider sits in a 15 kg manual wheelchair at the top of ${ramp}. Each 24 in rear wheel has mass ${T.mw} and radius of gyration $0.9R$ about its axle; each 6 in caster is a 0.3 kg solid disk. All four wheels roll without slipping, and rolling resistance is $${$.c}\,mg\cos\theta$ along the ramp. Released from rest with no hand on the rims, how fast is the chair moving at the foot, and how much kinetic energy is in the four wheels' spin?`;
    },
    parts: [
      num('v', ($) => $.r.v, 'm/s', {
        label: 'speed at the foot',
        traps: [
          [($) => Math.sqrt((2 * ($.spec.m * G * $.r.L - $.r.lost)) / $.r.mEff),
            'The weight works through the drop in height, H, not the length of the ramp: U = m g H.'],
          [($) => ($.given === 'rise'
            ? Math.sqrt((2 * ($.spec.m * G * $.rise - $.r.lost)) / $.r.mEff)
            : rollDown({ ...$.spec, H: $.Lft * Math.sin($.th) }).v),
          ($) => ($.given === 'rise' ? 'Convert the rise to metres: 1 in = 0.0254 m.' : 'Convert the length to metres: 1 ft = 0.3048 m.')],
          [($) => rollDown({ ...$.spec, c: 0 }).v, 'Rolling resistance works against the chair over the whole length: −c m g cos θ · L.'],
        ],
      }),
      num('Tw', ($) => $.r.Trot, 'J', {
        label: 'kinetic energy of the wheels’ spin',
        traps: [
          [($) => $.r.v ** 2 * (0.5 * 2 * $.mw + 0.5 * 2 * 0.3 * 0.5), 'A spoked wheel is not a hoop: I = m(0.9R)², so ½Iω² = ½m(0.81)v². A caster is a disk: ½mR².'],
          [($) => $.r.Trot + 0.5 * 2 * 0.3 * ((3 * M_PER_IN) ** 2 / 2) * ((($.r.v / (12 * M_PER_IN)) ** 2) - (($.r.v / (3 * M_PER_IN)) ** 2)),
            'Each wheel spins at its own ω = v/R. The 6 in casters spin four times faster than the 24 in wheels.'],
        ],
      }),
    ],
    level: 3,
    hints: ['Use work and energy from rest at the top to the foot. The ground does no work on wheels that roll without slipping.',
      String.raw`Every wheel moves with the chair at $v$ and spins at $\omega = v/R$: $T = \tfrac12 m v^2 + \sum \tfrac12 I\omega^2 = \tfrac12\big(m + \sum I/R^2\big)v^2$.`,
      String.raw`The weight does $mgH$; rolling resistance does $-c\,mg\cos\theta\,L$, with $L = H/\sin\theta$.`,
    ],
    steps: ($, sig) => {
      const { r, spec } = $;
      return [
        String.raw`$\theta = \tan^{-1}(1/${$.n}) = ${sig(($.th * 180) / Math.PI)}^\circ$. ${$.given === 'rise' ? String.raw`$H = ${$.rise}(0.0254) = ${sig(spec.H)}$ m, $L = H/\sin\theta = ${sig(r.L)}$ m.` : String.raw`$L = ${$.Lft}(0.3048) = ${sig(r.L)}$ m, $H = L\sin\theta = ${sig(spec.H)}$ m.`}`,
        String.raw`$m = ${spec.m}$ kg. $\sum I/R^2 = 2(${$.mw})(0.81) + 2(0.3)(0.5) = ${sig(r.mEff - spec.m)}$ kg, so $m_{eff} = ${sig(r.mEff)}$ kg.`,
        String.raw`$mgH = ${sig(r.drop)}$ J; $c\,mg\cos\theta\,L = ${sig(r.lost)}$ J. $\tfrac12(${sig(r.mEff)})v^2 = ${sig(r.drop - r.lost)}$ gives $v = ${sig(r.v)}$ m/s.`,
        String.raw`Spin: $\tfrac12(${sig(r.mEff - spec.m)})v^2 = ${sig(r.Trot)}$ J.`,
      ];
    },
    // Second: Newton and Euler on each wheel, stepped in time; the spin from that speed.
    second: ($) => {
      const n = rollDownStepped($.spec);
      const Tw = $.spec.wheels.reduce((s, w) => s + 0.5 * w.n * w.m * w.k * w.k * (n.v / w.R) ** 2, 0);
      return { v: n.v, Tw };
    },
    sim: {
      scenario: 'resist',
      setup(s, $) {
        Object.assign(s, { rise: $.riseIn, run: $.n, rider: $.rider, mw: $.mw, c: $.c, t: 0 });
      },
      read: (c) => ({ v: c.v, Tw: c.Trot }),
    },
    cases: [kase('Hibbeler §18.4', { given: 'rise', rise: 30, n: 12, rider: 80, mw: 1, c: 0.012 }, {
      v: rollDown(chairSpec({ rise: 30, run: 12, rider: 80, mw: 1, c: 0.012 })).v,
      Tw: rollDown(chairSpec({ rise: 30, run: 12, rider: 80, mw: 1, c: 0.012 })).Trot,
    })],
  }),
];

export default more;
