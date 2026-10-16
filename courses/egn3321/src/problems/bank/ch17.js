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
  const tip = (weight * $.b) / (2 * $.h);
  return { slide, tip, mode: slide < tip ? 'slide' : 'tip' };
}

function barParts($, g) {
  const row = barPin({ mass: $.m, length: $.L, thetaDeg: $.theta, omega: 0, g });
  return { pin: row.pin, alpha: Math.abs(row.alpha) };
}

function barComponents($, mass, g) {
  const th = $.theta * DEG;
  const sin = Math.sin(th);
  const cos = Math.cos(th);
  const r = $.L / 2;
  const alpha = -(3 * g * sin) / (2 * $.L);
  const ax = alpha * r * cos;
  const ay = alpha * r * sin;
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
    vars: {
      m: range(1, 10, 0.5, 'kg'),
      L: range(0.8, 3, 0.2, 'm'),
    },
    text: (T) => String.raw`A slender rod has mass ${T.m} kg and length ${T.L} m. Find its mass moment about the centre and about one end.`,
    parts: [
      num('center', ($) => inertiaRodCenter($.m, $.L), 'kg·m²', { label: 'about the centre' }),
      num('end', ($) => inertiaRodEnd($.m, $.L), 'kg·m²', { label: 'about one end' }),
    ],
    level: 1,
    hints: ['The centre moment is mL²/12. The end is that moment plus m(L/2)².',
      "About the centre, use m L squared over 12. About the end, add m times (L/2) squared, which simplifies to m L squared over 3.",
    ],
    steps: ($, sig) => {
      const center = inertiaRodCenter($.m, $.L);
      const end = inertiaRodEnd($.m, $.L);
      return [
        String.raw`About the centre: $I_G=\frac{1}{12}mL^2=${sig(center)}\ \mathrm{kg\cdot m^2}$.`,
        String.raw`About the end: $I_O=I_G+m(L/2)^2=${sig(end)}\ \mathrm{kg\cdot m^2}$.`,
      ];
    },
    second: ($) => ({
      center: rodInertiaIntegral($.m, -$.L / 2, $.L / 2, 0),
      end: rodInertiaIntegral($.m, -$.L / 2, $.L / 2, $.L / 2),
    }),
    sim: {
      scenario: 'rod',
      setup(s, $) {
        s.mass = $.m;
        s.length = $.L;
        s.offset = $.L / 2;
      },
      read: (c) => ({ center: c.center, end: c.end }),
    },
    cases: [kase('Hibbeler §17.1', { m: 6, L: 2 }, { center: 2, end: 8 })],
  }),

  problem({
    id: 'u6.17.spread',
    title: 'Hoop, disk, and sphere',
    exam: 'u6',
    ch: '17',
    lab: 'inertia',
    src: 'Hibbeler §17.1',
    topics: ['inertia'],
    vars: {
      m: range(1, 8, 0.5, 'kg'),
      R: range(0.2, 0.8, 0.1, 'm'),
    },
    text: (T) => String.raw`A hoop, a disk, and a solid sphere each have mass ${T.m} kg and radius ${T.R} m. Find each mass moment about its centre axis, and say which is largest.`,
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
    cases: [kase('Hibbeler §17.1', { m: 2, R: 0.5 }, { hoop: 0.5, disk: 0.25, sphere: 0.2, which: 'hoop' })],
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
      md: range(0.5, 4, 0.5, 'kg'),
      r: range(0.04, 0.12, 0.02, 'm'),
      d: range(0, 0.3, 0.05, 'm'),
    },
    text: (T) => String.raw`A rectangular plate of mass ${T.mp} kg is ${T.w} m by ${T.h} m. A disk of mass ${T.md} kg and radius ${T.r} m has its centre ${T.d} m from the plate's centre. Find the mass moment about the plate's centre, perpendicular to the plate.`,
    parts: [
      num('I', ($) => plateDiskInertia({
        plateM: $.mp, plateW: $.w, plateH: $.h, diskM: $.md, diskR: $.r, diskX: $.d,
      }).I, 'kg·m²', { label: 'mass moment' }),
    ],
    level: 2,
    hints: ['Add the moment of the plate to the centre moment of the disk and to md².',
      "The plate moment about its centre is m times (width squared plus height squared) over 12. The disk adds half its mass times r squared, and its mass times d squared.",
    ],
    steps: ($, sig) => {
      const row = plateDiskInertia({
        plateM: $.mp, plateW: $.w, plateH: $.h, diskM: $.md, diskR: $.r, diskX: $.d,
      });
      return [
        String.raw`Plate: $\frac{1}{12}m(w^2+h^2)$. Disk: $\frac{1}{2}mR^2+md^2=${sig(row.parallel + 0.5 * $.md * $.r * $.r)}\ \mathrm{kg\cdot m^2}$ for the disk's share.`,
        String.raw`Total: $I=${sig(row.I)}\ \mathrm{kg\cdot m^2}$.`,
      ];
    },
    second: ($) => ({
      I: plateInertiaIntegral($.mp, $.w, $.h) + diskAboutIntegral($.md, $.r, $.d, 0, 0, 0),
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
        s.axisX = 0;
      },
      read: (c) => ({ I: c.I }),
    },
    cases: [kase('Hibbeler §17.1', { mp: 5, w: 0.6, h: 0.4, md: 2, r: 0.1, d: 0.2 }, { I: 0.3066666666666667 })],
  }),

  problem({
    id: 'u6.17.hole',
    title: 'Disk with a hole',
    exam: 'u6',
    ch: '17',
    lab: null,
    src: 'Hibbeler §17.1',
    topics: ['composite'],
    vars: {
      m: range(6, 16, 2, 'kg'),
      R: range(0.3, 0.5, 0.05, 'm'),
      r: range(0.04, 0.1, 0.02, 'm'),
      d: range(0, 0.12, 0.02, 'm'),
    },
    valid: ($) => $.r + Math.abs($.d) < $.R - 0.01,
    text: (T) => String.raw`A uniform disk of mass ${T.m} kg and radius ${T.R} m has a hole of radius ${T.r} m. The hole's centre is ${T.d} m from the disk's centre. The given mass is the disk before the hole is cut. Find the mass moment of what remains, about the disk's centre.`,
    parts: [
      num('I', ($) => diskWithHole({ mass: $.m, radius: $.R, holeRadius: $.r, holeOffset: $.d }).I, 'kg·m²', { label: 'mass moment' }),
    ],
    level: 2,
    hints: ['Subtract the hole. Its moment about the disk centre is the centre moment plus md².',
      "The hole mass follows from the disk mass and the area ratio. Subtract (I_G + md^2) of that hole from the full disk.",
    ],
    steps: ($, sig) => {
      const row = diskWithHole({ mass: $.m, radius: $.R, holeRadius: $.r, holeOffset: $.d });
      return [
        String.raw`The hole removes ${sig(row.removed)}\ \mathrm{kg}. Its moment about the disk centre is ${sig(row.hole)}\ \mathrm{kg\cdot m^2}.`,
        String.raw`What remains: $I=${sig(row.I)}\ \mathrm{kg\cdot m^2}$.`,
      ];
    },
    second: ($) => ({
      I: diskHoleIntegral({ mass: $.m, radius: $.R, holeRadius: $.r, holeOffset: $.d }),
    }),
    cases: [kase('Hibbeler §17.1', { m: 12, R: 0.3, r: 0.1, d: 0.12 }, { I: 0.5141333333333332 })],
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
    },
    valid: ($) => {
      const row = crateForces($);
      return Math.abs(row.slide - row.tip) > 0.05 * Math.max(row.slide, row.tip);
    },
    text: (T) => String.raw`A ${T.m} kg crate is ${T.b} m wide and ${T.h} m tall. It rests on a rough horizontal surface, $\mu=${T.mu}$. A growing horizontal force is applied at the top edge. Find the force that makes it slide, the force that makes it tip, and which happens first.`,
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
      "The force is at the top, so the tipping arm is the full height. Report the smaller of the two forces as what happens first.",
    ],
    steps: ($, sig) => {
      const row = crateForces($);
      const word = row.mode === 'slide' ? 'slides' : 'tips';
      return [
        String.raw`Slide: $P=\mu mg=${sig(row.slide)}\ \mathrm{N}$.`,
        String.raw`Tip, about the front corner: $P=mg(b/2)/h=${sig(row.tip)}\ \mathrm{N}$.`,
        `The smaller one happens first, so the crate ${word}.`,
      ];
    },
    second: ($) => {
      const row = tipOrSlip({ W: $.m * G, b: $.b, hp: $.h, mus: $.mu });
      return {
        slide: row.Pslip,
        tip: row.Ptip,
        mode: row.first === 'slip' ? 'slide' : 'tip',
      };
    },
    cases: [
      kase('Hibbeler §17.3', { m: 40, b: 0.5, h: 0.5, mu: 0.25 }, { slide: 98.1, tip: 196.2, mode: 'slide' }),
      kase('Hibbeler §17.3', { m: 20, b: 0.4, h: 0.8, mu: 0.5 }, { slide: 98.1, tip: 49.05, mode: 'tip' }),
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
    vars: {
      m: range(1, 8, 0.5, 'kg'),
      L: range(0.6, 2.4, 0.2, 'm'),
      theta: range(0, 150, 15, 'deg'),
    },
    text: (T) => String.raw`A uniform slender bar of mass ${T.m} kg and length ${T.L} m is pinned at one end. It is released from rest at ${T.theta}° from the downward vertical. Find the pin-force magnitude and the angular acceleration at that instant.`,
    parts: [
      num('pin', ($) => barParts($, G).pin, 'N', { label: 'pin force' }),
      num('alpha', ($) => barParts($, G).alpha, 'rad/s²', { label: 'angular acceleration' }),
    ],
    level: 2,
    hints: ['The lever arm of the weight about the pin is (L/2) sin θ, and I_O is mL²/3. Then use ΣF = m a_G.',
      "I_O alpha equals the moment of the weight, m g times (L/2) sin theta. The pin components then come from the sum of the forces on the mass centre.",
    ],
    steps: ($, sig) => {
      const row = barParts($, G);
      return [
        String.raw`$I_O=\frac{1}{3}mL^2$, so $\alpha=\frac{3g\sin\theta}{2L}=${sig(row.alpha)}\ \mathrm{rad/s^2}$.`,
        String.raw`The pin force is ${sig(row.pin)}\ \mathrm{N}. A bar released from rest while horizontal is the special case $mg/4$.`,
      ];
    },
    second: ($) => barComponents($, $.m, G),
    sim: {
      scenario: 'bar',
      setup(s, $) {
        s.mass = $.m;
        s.length = $.L;
        s.theta = $.theta;
        s.omega = 0;
      },
      read: (c) => ({ pin: c.pin, alpha: c.alpha }),
    },
    cases: [kase('Hibbeler §17.4', { m: 4, L: 2, theta: 90 }, { pin: 9.81, alpha: 7.3575 })],
  }),

  problem({
    id: 'u6.17.pin-ft',
    title: 'Released bar in US customary units',
    exam: 'u6',
    ch: '17',
    lab: null,
    src: 'Hibbeler §17.4',
    topics: ['pin'],
    vars: {
      W: range(10, 80, 5, 'lb'),
      L: range(2, 8, 0.5, 'ft'),
    },
    text: (T) => String.raw`A uniform slender bar weighs ${T.W} lb and is ${T.L} ft long. It is pinned at one end and released from rest while horizontal. Find the pin force and the angular acceleration. Use $g=32.2\ \mathrm{ft/s^2}$.`,
    parts: [
      num('pin', ($) => {
        const mass = $.W / G_FT;
        return barPin({ mass, length: $.L, thetaDeg: 90, omega: 0, g: G_FT }).pin;
      }, 'lb', { label: 'pin force' }),
      num('alpha', ($) => {
        const mass = $.W / G_FT;
        return Math.abs(barPin({ mass, length: $.L, thetaDeg: 90, omega: 0, g: G_FT }).alpha);
      }, 'rad/s²', { label: 'angular acceleration' }),
    ],
    level: 2,
    hints: ['The mass is the weight divided by 32.2. A horizontal bar at release puts a quarter of the weight on the pin.',
      "Use g = 32.2 ft/s squared for the angular acceleration. The quarter-weight pin force holds only while the bar is horizontal and still at rest.",
    ],
    steps: ($, sig) => {
      const mass = $.W / G_FT;
      const row = barPin({ mass, length: $.L, thetaDeg: 90, omega: 0, g: G_FT });
      return [
        String.raw`Mass: $W/g=${sig(mass)}\ \mathrm{slug}$.`,
        String.raw`The pin holds $W/4=${sig(row.pin)}\ \mathrm{lb}$.`,
        String.raw`$\alpha=3g/(2L)=${sig(Math.abs(row.alpha))}\ \mathrm{rad/s^2}$.`,
      ];
    },
    second: ($) => {
      const mass = $.W / G_FT;
      return barComponents({ m: mass, L: $.L, theta: 90 }, mass, G_FT);
    },
    cases: [kase('Hibbeler §17.4', { W: 32.2, L: 4 }, { pin: 8.05, alpha: 12.075 })],
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
