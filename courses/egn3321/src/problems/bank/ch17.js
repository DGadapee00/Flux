import { G, G_FT } from '@flux/subjects/mechanics/constants.js';
import { tipOrSlip } from '@flux/subjects/mechanics/friction.js';
import {
  barPin,
  centralInertia,
  diskAboutIntegral,
  diskHoleIntegral,
  diskInertiaIntegral,
  diskWithHole,
  hoopInertiaIntegral,
  plateDiskInertia,
  plateInertiaIntegral,
  rodInertiaIntegral,
  rollOrSlip,
  sphereInertiaIntegral,
} from '@flux/subjects/mechanics/inertia.js';
import {
  inertiaDisk,
  inertiaHoop,
  inertiaRodCenter,
  inertiaRodEnd,
  inertiaSphere,
} from '@flux/subjects/mechanics/rotation.js';
import { choice, kase, mc, num, problem, range } from '../kit.js';

const DEG = Math.PI / 180;

function crateForces($) {
  const weight = $.m * G;
  const slide = $.mu * weight;
  const tip = (weight * $.b) / (2 * $.hp);
  return { slide, tip, mode: slide < tip ? 'slide' : 'tip' };
}

function barParts($, g) {
  const row = barPin({ mass: $.m, length: $.L, thetaDeg: $.theta, omega: $.omega ?? 0, g });
  return { pin: row.pin, alpha: Math.abs(row.alpha) };
}

function barComponents($, mass, g) {
  const th = $.theta * DEG;
  const sin = Math.sin(th);
  const cos = Math.cos(th);
  const r = $.L / 2;
  const w2 = ($.omega ?? 0) ** 2;
  const alpha = -(3 * g * sin) / (2 * $.L);
  // Tangential r·α and normal r·ω² toward the pin, in x and y.
  const ax = alpha * r * cos - w2 * r * sin;
  const ay = alpha * r * sin + w2 * r * cos;
  const Ox = mass * ax;
  const Oy = mass * g + mass * ay;
  return { pin: Math.hypot(Ox, Oy), alpha: Math.abs(alpha) };
}

function rollParts($) {
  const row = rollOrSlip({
    mass: $.m,
    radius: $.R,
    I: centralInertia($.shape, $.m, $.R),
    thetaDeg: $.theta,
    mu: $.mu,
    g: G,
  });
  return { a: row.a, f: row.f, mode: row.mode };
}

function rollByHand($) {
  const I = centralInertia($.shape, $.m, $.R);
  const th = $.theta * DEG;
  const sin = Math.sin(th);
  const cos = Math.cos(th);
  const k = I / ($.m * $.R * $.R);
  const N = $.m * G * cos;
  const aRoll = (G * sin) / (1 + k);
  const fRoll = $.m * G * sin - $.m * aRoll;
  if (fRoll <= $.mu * N + 1e-9 * Math.max(1, N)) return { a: aRoll, f: fRoll, mode: 'roll' };
  const f = $.mu * N;
  return { a: G * sin - f / $.m, f, mode: 'slip' };
}

const ch17 = [
  problem({
    id: 'u6.17.rod',
    title: 'Rod about centre and end',
    exam: 'u6',
    ch: '17',
    lab: 'inertia',
    src: 'Hibbeler §17.1',
    topics: ['inertia'],
    // Structure: the second axis is at the end, or halfway to it.
    vars: {
      m: range(1, 10, 0.5, 'kg'),
      L: range(0.8, 3.2, 0.4, 'm'),
      axis: choice(['end', 'one end'], ['quarter', 'a point halfway between the centre and one end']),
    },
    derive: ($) => ({ d: $.axis === 'end' ? $.L / 2 : $.L / 4 }),
    text: (T) => String.raw`A slender rod has mass ${T.m} kg and length ${T.L} m. Find its mass moment about a perpendicular axis through its centre, and about a parallel axis through ${T.axis}.`,
    parts: [
      num('center', ($) => inertiaRodCenter($.m, $.L), 'kg·m²', { label: 'about the centre' }),
      num('end', ($) => inertiaRodCenter($.m, $.L) + $.m * $.d * $.d, 'kg·m²', { label: (T) => `about ${T.axis}` }),
    ],
    level: 1,
    hints: ['The centre moment is mL²/12. A parallel axis a distance d away adds md².',
      "Measure d from the centre, not from the end. At the end d = L/2, which gives mL²/3; halfway there, d = L/4.",
    ],
    steps: ($, sig) => {
      const center = inertiaRodCenter($.m, $.L);
      const other = center + $.m * $.d * $.d;
      return [
        String.raw`About the centre: $I_G=\frac{1}{12}mL^2=${sig(center)}\ \mathrm{kg\cdot m^2}$.`,
        String.raw`The second axis is $d=${sig($.d)}\ \mathrm{m}$ from the centre: $I=I_G+md^2=${sig(other)}\ \mathrm{kg\cdot m^2}$.`,
      ];
    },
    second: ($) => ({
      center: rodInertiaIntegral($.m, -$.L / 2, $.L / 2, 0),
      end: rodInertiaIntegral($.m, -$.L / 2, $.L / 2, $.d),
    }),
    sim: {
      scenario: 'rod',
      setup(s, $) {
        s.mass = $.m;
        s.length = $.L;
        s.offset = $.d;
      },
      // The lab's I is about its axis, which the setup puts at d.
      read: (c) => ({ center: c.center, end: c.I }),
    },
    cases: [
      kase('Hibbeler §17.1', { m: 6, L: 2, axis: 'end' }, { center: 2, end: 8 }),
      kase('Hibbeler §17.1', { m: 6, L: 2, axis: 'quarter' }, { center: 2, end: 3.5 }),
    ],
  }),

  problem({
    id: 'u6.17.spread',
    title: 'Hoop, disk, and sphere',
    exam: 'u6',
    ch: '17',
    lab: 'inertia',
    src: 'Hibbeler §17.1',
    topics: ['inertia'],
    // Structure: the size comes as a radius or as a diameter.
    vars: {
      m: range(1, 8, 0.5, 'kg'),
      R: range(0.2, 0.8, 0.1, 'm'),
      given: choice(['radius', 'radius'], ['diameter', 'diameter']),
    },
    text: (T, $, sig) => String.raw`A hoop, a disk, and a solid sphere each have mass ${T.m} kg and ${T.given} ${$.given === 'radius' ? T.R : sig(2 * $.R)} m. Find each mass moment about its centre axis, and say which is largest.`,
    parts: [
      num('hoop', ($) => inertiaHoop($.m, $.R), 'kg·m²', { label: 'hoop' }),
      num('disk', ($) => inertiaDisk($.m, $.R), 'kg·m²', { label: 'disk' }),
      num('sphere', ($) => inertiaSphere($.m, $.R), 'kg·m²', { label: 'sphere' }),
      mc('which', [
        ['hoop', 'The hoop'],
        ['disk', 'The disk'],
        ['sphere', 'The sphere'],
      ], ($) => {
        const rows = [
          ['hoop', inertiaHoop($.m, $.R)],
          ['disk', inertiaDisk($.m, $.R)],
          ['sphere', inertiaSphere($.m, $.R)],
        ];
        rows.sort((a, b) => b[1] - a[1]);
        return rows[0][0];
      }, { label: 'largest mass moment' }),
    ],
    level: 1,
    hints: ['A hoop is mR², a disk is half of that, and a solid sphere is (2/5)mR².',
      "Divide each moment by m R squared if you want to compare shape alone. The hoop's factor is 1, the disk's is 1/2, and the sphere's is 2/5.",
    ],
    steps: ($, sig) => [
      String.raw`Hoop: $mR^2=${sig(inertiaHoop($.m, $.R))}\ \mathrm{kg\cdot m^2}$.`,
      String.raw`Disk: $\frac{1}{2}mR^2=${sig(inertiaDisk($.m, $.R))}\ \mathrm{kg\cdot m^2}$.`,
      String.raw`Sphere: $\frac{2}{5}mR^2=${sig(inertiaSphere($.m, $.R))}\ \mathrm{kg\cdot m^2}$. The hoop is largest.`,
    ],
    second: ($) => {
      const hoop = hoopInertiaIntegral($.m, $.R);
      const disk = diskInertiaIntegral($.m, $.R);
      const sphere = sphereInertiaIntegral($.m, $.R);
      const which = hoop >= disk && hoop >= sphere ? 'hoop' : disk >= sphere ? 'disk' : 'sphere';
      return { hoop, disk, sphere, which };
    },
    sim: {
      scenario: 'spread',
      setup(s, $) {
        s.mass = $.m;
        s.radius = $.R;
      },
      read: (c) => ({ hoop: c.hoop, disk: c.disk, sphere: c.sphere, which: c.which }),
    },
    cases: [kase('Hibbeler §17.1', { m: 2, R: 0.5, given: 'radius' }, { hoop: 0.5, disk: 0.25, sphere: 0.2, which: 'hoop' })],
  }),

  problem({
    id: 'u6.17.plate',
    title: 'Plate with a disk',
    exam: 'u6',
    ch: '17',
    lab: 'inertia',
    src: 'Hibbeler §17.1',
    topics: ['composite'],
    vars: {
      mp: range(2, 8, 1, 'kg'),
      w: range(0.4, 0.8, 0.1, 'm'),
      h: range(0.2, 0.6, 0.1, 'm'),
      md: range(1, 4, 0.5, 'kg'),
      r: range(0.04, 0.12, 0.02, 'm'),
      d: range(0.1, 0.3, 0.05, 'm'),
      axis: choice(['centre', "the plate's centre"], ['edge', "the midpoint of the plate's left edge"]),
    },
    // Structure: the axis is at the centre, or at the edge away from the disk.
    derive: ($) => ({ ax: $.axis === 'edge' ? -$.w / 2 : 0 }),
    valid: ($) => $.d + $.r <= $.w / 2 + 1e-9,
    text: (T) => String.raw`A rectangular plate of mass ${T.mp} kg is ${T.w} m wide and ${T.h} m tall. A disk of mass ${T.md} kg and radius ${T.r} m is fixed to it, with its centre ${T.d} m to the right of the plate's centre. Find the mass moment about an axis through ${T.axis}, perpendicular to the plate.`,
    parts: [
      num('I', ($) => plateDiskInertia({
        plateM: $.mp, plateW: $.w, plateH: $.h, diskM: $.md, diskR: $.r, diskX: $.d, axisX: $.ax,
      }).I, 'kg·m²', { label: 'mass moment' }),
    ],
    level: 2,
    hints: ['Each part contributes its own centre moment plus its mass times the square of its distance to the axis.',
      "The plate moment about its centre is m(w² + h²)/12. The disk adds ½mr² and m d², with d measured from the axis to the disk's centre.",
    ],
    steps: ($, sig) => {
      const row = plateDiskInertia({
        plateM: $.mp, plateW: $.w, plateH: $.h, diskM: $.md, diskR: $.r, diskX: $.d, axisX: $.ax,
      });
      const plate = (($.mp * ($.w * $.w + $.h * $.h)) / 12) + $.mp * $.ax * $.ax;
      return [
        String.raw`Plate: $\frac{1}{12}m(w^2+h^2)${$.ax ? '+m(w/2)^2' : ''}=${sig(plate)}\ \mathrm{kg\cdot m^2}$.`,
        String.raw`Disk, $${sig($.d - $.ax)}\ \mathrm{m}$ from the axis: $\frac{1}{2}mr^2+md^2=${sig(row.parallel + 0.5 * $.md * $.r * $.r)}\ \mathrm{kg\cdot m^2}$.`,
        String.raw`Total: $I=${sig(row.I)}\ \mathrm{kg\cdot m^2}$.`,
      ];
    },
    second: ($) => ({
      I: plateInertiaIntegral($.mp, $.w, $.h, $.ax, 0) + diskAboutIntegral($.md, $.r, $.d, 0, $.ax, 0),
    }),
    sim: {
      scenario: 'composite',
      setup(s, $) {
        s.plateM = $.mp;
        s.plateW = $.w;
        s.plateH = $.h;
        s.diskM = $.md;
        s.diskR = $.r;
        s.diskX = $.d;
        s.axisX = $.ax;
      },
      read: (c) => ({ I: c.I }),
    },
    cases: [
      kase('Hibbeler §17.1', { mp: 5, w: 0.6, h: 0.4, md: 2, r: 0.1, d: 0.2, axis: 'centre' }, { I: 0.3066666666666667 }),
      kase('Hibbeler §17.1', { mp: 5, w: 0.6, h: 0.4, md: 2, r: 0.1, d: 0.2, axis: 'edge' }, { I: 1.1766666666666667 }),
    ],
  }),

  problem({
    id: 'u6.17.hole',
    title: 'Disk with a hole',
    exam: 'u6',
    ch: '17',
    lab: null,
    src: 'Hibbeler §17.1',
    topics: ['composite'],
    // Structure: the mass given is the disk before the hole, or the part that remains.
    vars: {
      m: range(6, 16, 2, 'kg'),
      R: range(0.3, 0.4, 0.05, 'm'),
      r: range(0.1, 0.15, 0.01, 'm'),
      d: range(0.04, 0.12, 0.02, 'm'),
      given: choice(['before', 'the disk before the hole is cut'], ['after', 'what remains after the hole is cut']),
    },
    derive: ($) => ({ full: $.given === 'before' ? $.m : $.m / (1 - ($.r * $.r) / ($.R * $.R)) }),
    valid: ($) => $.r + Math.abs($.d) < $.R - 0.01,
    text: (T) => String.raw`A uniform disk of radius ${T.R} m has a hole of radius ${T.r} m. The hole's centre is ${T.d} m from the disk's centre. The mass of ${T.given} is ${T.m} kg. Find the mass moment of what remains, about the disk's centre.`,
    parts: [
      num('I', ($) => diskWithHole({ mass: $.full, radius: $.R, holeRadius: $.r, holeOffset: $.d }).I, 'kg·m²', { label: 'mass moment' }),
    ],
    level: 2,
    hints: ['Subtract the hole. Its moment about the disk centre is the centre moment plus md².',
      "Masses go as areas. The hole's mass is the full disk's times (r/R)²; if the given mass is what remains, find the full disk's mass first.",
    ],
    steps: ($, sig) => {
      const row = diskWithHole({ mass: $.full, radius: $.R, holeRadius: $.r, holeOffset: $.d });
      return [
        ...($.given === 'after' ? [String.raw`The full disk: $m/(1-r^2/R^2)=${sig($.full)}\ \mathrm{kg}$.`] : []),
        String.raw`The hole removes ${sig(row.removed)}\ \mathrm{kg}. Its moment about the disk centre is ${sig(row.hole)}\ \mathrm{kg\cdot m^2}.`,
        String.raw`What remains: $I=${sig(row.I)}\ \mathrm{kg\cdot m^2}$.`,
      ];
    },
    second: ($) => ({
      I: diskHoleIntegral({ mass: $.full, radius: $.R, holeRadius: $.r, holeOffset: $.d }),
    }),
    cases: [
      kase('Hibbeler §17.1', { m: 12, R: 0.3, r: 0.1, d: 0.12, given: 'before' }, { I: 0.5141333333333332 }),
      kase('Hibbeler §17.1', { m: 12, R: 0.3, r: 0.1, d: 0.12, given: 'after' }, { I: 0.5784 }),
    ],
  }),

  problem({
    id: 'u6.17.crate',
    title: 'Crate slides or tips',
    exam: 'u6',
    ch: '17',
    lab: null,
    src: 'Hibbeler §17.3',
    topics: ['crate'],
    vars: {
      m: range(10, 40, 5, 'kg'),
      b: range(0.3, 0.8, 0.1, 'm'),
      h: range(0.4, 1.2, 0.1, 'm'),
      mu: range(0.15, 0.6, 0.05, ''),
      where: choice(['top', 'at the top edge'], ['mid', 'at mid-height']),
    },
    // Structure: the push is at the top edge or at mid-height, which halves the tipping arm.
    derive: ($) => ({ hp: $.where === 'top' ? $.h : $.h / 2 }),
    valid: ($) => {
      const row = crateForces($);
      return Math.abs(row.slide - row.tip) > 0.05 * Math.max(row.slide, row.tip);
    },
    text: (T) => String.raw`A ${T.m} kg crate is ${T.b} m wide and ${T.h} m tall. It rests on a rough horizontal surface, $\mu=${T.mu}$. A growing horizontal force is applied ${T.where}. Find the force that makes it slide, the force that makes it tip, and which happens first.`,
    parts: [
      num('slide', ($) => crateForces($).slide, 'N', { label: 'slide force' }),
      num('tip', ($) => crateForces($).tip, 'N', { label: 'tip force' }),
      mc('mode', [
        ['slide', 'It slides'],
        ['tip', 'It tips'],
      ], ($) => crateForces($).mode, { label: 'as the force grows, the crate first…' }),
    ],
    level: 2,
    hints: ['Sliding needs μ times the weight. Tipping needs the weight times half the width, divided by the height of the force.',
      "Take moments about the front bottom corner. The force's arm is its height above the floor. Report the smaller of the two forces as what happens first.",
    ],
    steps: ($, sig) => {
      const row = crateForces($);
      const word = row.mode === 'slide' ? 'slides' : 'tips';
      return [
        String.raw`Slide: $P=\mu mg=${sig(row.slide)}\ \mathrm{N}$.`,
        String.raw`Tip, about the front corner: $P=mg(b/2)/h_P=${sig(row.tip)}\ \mathrm{N}$, with $h_P=${sig($.hp)}\ \mathrm{m}$.`,
        `The smaller one happens first, so the crate ${word}.`,
      ];
    },
    second: ($) => {
      const row = tipOrSlip({ W: $.m * G, b: $.b, hp: $.hp, mus: $.mu });
      return {
        slide: row.Pslip,
        tip: row.Ptip,
        mode: row.first === 'slip' ? 'slide' : 'tip',
      };
    },
    cases: [
      kase('Hibbeler §17.3', { m: 40, b: 0.5, h: 0.5, mu: 0.25, where: 'top' }, { slide: 98.1, tip: 196.2, mode: 'slide' }),
      kase('Hibbeler §17.3', { m: 20, b: 0.4, h: 0.8, mu: 0.5, where: 'top' }, { slide: 98.1, tip: 49.05, mode: 'tip' }),
      kase('Hibbeler §17.3', { m: 20, b: 0.4, h: 0.8, mu: 0.4, where: 'mid' }, { slide: 78.48, tip: 98.1, mode: 'slide' }),
      kase('MIT OCW 2.003SC (Fall 2011), Problem Set 5, Problem 4', { m: 800, b: 0.2, h: 2, mu: 0.3, where: 'mid' }, { slide: 2354.4, tip: 784.8, mode: 'tip' }, { note: 'A box rides on an accelerating cart. The inertial force m·a acts at the mass centre, as a push at mid-height does. The printed limits are a = 0.3 g to slide and a = 0.1 g to tip, so it tips first; times the 800 kg mass they are 2,354 N and 785 N.' }),
    ],
  }),

  problem({
    id: 'u6.17.pin',
    title: 'Pin force on a released bar',
    exam: 'u6',
    ch: '17',
    lab: 'pendulum',
    src: 'Hibbeler §17.4',
    topics: ['pin'],
    // Structure: released from rest, or swinging through the position with some ω.
    vars: {
      m: range(1, 8, 0.5, 'kg'),
      L: range(0.6, 2.4, 0.2, 'm'),
      theta: range(15, 150, 15, 'deg'),
      w: range(1, 4, 0.5, 'rad/s'),
      start: choice(['rest', 'released from rest'], ['moving', 'swinging through']),
    },
    derive: ($) => ({ omega: $.start === 'rest' ? 0 : $.w }),
    text: (T, $) => ($.start === 'rest'
      ? String.raw`A uniform slender bar of mass ${T.m} kg and length ${T.L} m is pinned at one end. It is released from rest at ${T.theta}° from the downward vertical. Find the pin-force magnitude and the angular acceleration at that instant.`
      : String.raw`A uniform slender bar of mass ${T.m} kg and length ${T.L} m is pinned at one end. It swings through ${T.theta}° from the downward vertical with an angular velocity of ${T.w} rad/s. Find the pin-force magnitude and the angular acceleration at that instant.`),
    parts: [
      num('pin', ($) => barParts($, G).pin, 'N', { label: 'pin force' }),
      num('alpha', ($) => barParts($, G).alpha, 'rad/s²', { label: 'angular acceleration' }),
    ],
    level: 2,
    hints: ['The lever arm of the weight about the pin is (L/2) sin θ, and I_O is mL²/3. Then use ΣF = m a_G.',
      "The mass centre has (L/2)α along its path and (L/2)ω² toward the pin. At release from rest the second is zero.",
    ],
    steps: ($, sig) => {
      const row = barParts($, G);
      return [
        String.raw`$I_O=\frac{1}{3}mL^2$, so $\alpha=\frac{3g\sin\theta}{2L}=${sig(row.alpha)}\ \mathrm{rad/s^2}$.`,
        String.raw`$a_G$ has $(L/2)\alpha$ along the path and $(L/2)\omega^2=${sig(($.L / 2) * $.omega * $.omega)}\ \mathrm{m/s^2}$ toward the pin. From $\Sigma F=ma_G$, the pin force is $${sig(row.pin)}\ \mathrm{N}$.`,
      ];
    },
    second: ($) => barComponents($, $.m, G),
    sim: {
      scenario: 'bar',
      setup(s, $) {
        s.mass = $.m;
        s.length = $.L;
        s.theta = $.theta;
        s.omega = $.omega;
      },
      read: (c) => ({ pin: c.pin, alpha: c.alpha }),
    },
    cases: [
      kase('Hibbeler §17.4', { m: 4, L: 2, theta: 90, w: 1, start: 'rest' }, { pin: 9.81, alpha: 7.3575 }),
      kase('Hibbeler §17.4', { m: 4, L: 2, theta: 90, w: 2, start: 'moving' }, { pin: Math.hypot(4 * 4, 9.81), alpha: 7.3575 }),
    ],
  }),

  problem({
    id: 'u6.17.pin-ft',
    title: 'Released bar in US customary units',
    exam: 'u6',
    ch: '17',
    lab: null,
    src: 'Hibbeler §17.4',
    topics: ['pin'],
    // Structure: released horizontal, or 60° from the downward vertical.
    vars: {
      W: range(10, 80, 5, 'lb'),
      L: range(2, 8, 0.5, 'ft'),
      angle: choice(['horizontal', 'horizontal'], ['sixty', 'at 60° from the downward vertical']),
    },
    derive: ($) => ({ th: $.angle === 'horizontal' ? 90 : 60 }),
    text: (T) => String.raw`A uniform slender bar weighs ${T.W} lb and is ${T.L} ft long. It is pinned at one end and released from rest while ${T.angle}. Find the pin force and the angular acceleration at release. Use $g=32.2\ \mathrm{ft/s^2}$.`,
    parts: [
      num('pin', ($) => {
        const mass = $.W / G_FT;
        return barPin({ mass, length: $.L, thetaDeg: $.th, omega: 0, g: G_FT }).pin;
      }, 'lb', { label: 'pin force' }),
      num('alpha', ($) => {
        const mass = $.W / G_FT;
        return Math.abs(barPin({ mass, length: $.L, thetaDeg: $.th, omega: 0, g: G_FT }).alpha);
      }, 'rad/s²', { label: 'angular acceleration' }),
    ],
    level: 2,
    hints: ['The mass is the weight divided by 32.2. Moments about the pin give α; the weight\'s arm is (L/2) sin θ.',
      "At release ω = 0, so the mass centre has only (L/2)α, along its path. ΣF = m a_G then gives the pin's two components.",
    ],
    steps: ($, sig) => {
      const mass = $.W / G_FT;
      const row = barPin({ mass, length: $.L, thetaDeg: $.th, omega: 0, g: G_FT });
      return [
        String.raw`Mass: $W/g=${sig(mass)}\ \mathrm{slug}$.`,
        String.raw`$\alpha=3g\sin\theta/(2L)=${sig(Math.abs(row.alpha))}\ \mathrm{rad/s^2}$.`,
        String.raw`The pin holds $${sig(row.pin)}\ \mathrm{lb}$${$.th === 90 ? ', a quarter of the weight' : ''}.`,
      ];
    },
    second: ($) => {
      const mass = $.W / G_FT;
      return barComponents({ m: mass, L: $.L, theta: $.th }, mass, G_FT);
    },
    cases: [
      kase('Hibbeler §17.4', { W: 32.2, L: 4, angle: 'horizontal' }, { pin: 8.05, alpha: 12.075 }),
      kase('Hibbeler §17.4', { W: 32.2, L: 4, angle: 'sixty' }, { alpha: 12.075 * Math.sqrt(3) / 2 }),
    ],
  }),

  problem({
    id: 'u6.17.roll',
    title: 'Roll or slip on an incline',
    exam: 'u6',
    ch: '17',
    lab: 'roll-slip',
    src: 'Hibbeler §17.5',
    topics: ['roll', 'slip'],
    vars: {
      shape: choice(['disk', 'disk'], ['hoop', 'hoop'], ['sphere', 'sphere']),
      m: range(1, 6, 0.5, 'kg'),
      R: range(0.15, 0.4, 0.05, 'm'),
      theta: range(15, 45, 5, 'deg'),
      mu: range(0, 0.6, 0.05, ''),
    },
    text: (T) => String.raw`A ${T.shape} of mass ${T.m} kg and radius ${T.R} m is released from rest on a ${T.theta}° incline. The friction coefficient is ${T.mu}. Find the acceleration down the plane, the friction force, and whether it rolls or slips.`,
    parts: [
      num('a', ($) => rollParts($).a, 'm/s²', { label: 'acceleration' }),
      num('f', ($) => rollParts($).f, 'N', { label: 'friction' }),
      mc('mode', [
        ['roll', 'Rolls without slipping'],
        ['slip', 'Slips'],
      ], ($) => rollParts($).mode, { label: 'the motion is…' }),
    ],
    level: 3,
    hints: ['Rolling needs friction m g sin θ times k/(1+k), with k = I/(mR²). If that exceeds μN, friction is μN and the body slips.',
      "Compute k from the shape first: 1 for a hoop, 1/2 for a disk, 2/5 for a sphere. Then compare the friction rolling needs with mu times the normal.",
      "When it slips, write the force equation and the moment equation separately. Do not set a equal to alpha R.",
    ],
    steps: ($, sig) => {
      const row = rollParts($);
      if (row.mode === 'roll') {
        return [
          String.raw`$k=I/(mR^2)$ and $a=g\sin\theta/(1+k)=${sig(row.a)}\ \mathrm{m/s^2}$.`,
          String.raw`Friction is the amount rolling needs: $f=${sig(row.f)}\ \mathrm{N}$. That is within $\mu N$, so it rolls.`,
        ];
      }
      return [
        String.raw`The friction rolling would need exceeds $\mu N$, so the body slips.`,
        String.raw`$f=\mu N=${sig(row.f)}\ \mathrm{N}$ and $a=${sig(row.a)}\ \mathrm{m/s^2}$.`,
      ];
    },
    second: ($) => rollByHand($),
    sim: {
      scenario: 'disk',
      setup(s, $) {
        s.scenarioId = $.shape;
        s.shape = $.shape;
        s.mass = $.m;
        s.radius = $.R;
        s.theta = $.theta;
        s.mu = $.mu;
      },
      read: (c) => ({ a: c.a, f: c.f, mode: c.mode }),
    },
    cases: [
      kase('Hibbeler §17.5', { shape: 'disk', m: 2, R: 0.25, theta: 30, mu: 0.3 }, { a: 3.27, f: 3.27, mode: 'roll' }),
      kase('Hibbeler §17.5', { shape: 'hoop', m: 2, R: 0.25, theta: 30, mu: 0.15 }, {
        a: 3.630643618331198,
        f: 2.5487127633376034,
        mode: 'slip',
      }),
    ],
  }),
];

export default ch17;
