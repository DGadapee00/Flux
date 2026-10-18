import { G, G_FT } from '@flux/subjects/mechanics/constants.js';
import { centralInertia } from '@flux/subjects/mechanics/inertia.js';
import {
  ROLL_K,
  pinnedRelease,
  raceDown,
  rollingEnergy,
  slotRelease,
} from '@flux/subjects/mechanics/rigid-energy.js';
import { choice, kase, mc, num, problem, range } from '../kit.js';

const DEG = Math.PI / 180;

function rollKE($) {
  return rollingEnergy({
    mass: $.m,
    radius: $.R,
    I: centralInertia($.shape, $.m, $.R),
    speed: $.v,
  });
}

function rollByHand($) {
  const k = $.shape === 'sphere' ? 2 / 5 : $.shape === 'hoop' ? 1 : 1 / 2;
  const I = k * $.m * $.R * $.R;
  const omega = $.v / $.R;
  const trans = 0.5 * $.m * $.v * $.v;
  const total = 0.5 * (I + $.m * $.R * $.R) * omega * omega;
  return { trans, rot: total - trans, total };
}

function raceParts($, g = G) {
  // Given the height, the slope length follows from it; the speeds depend on the height alone.
  const row = raceDown({ thetaDeg: $.theta, distance: $.s, mass: $.m, g });
  return { sphere: row.sphere.v, disk: row.disk.v, hoop: row.hoop.v, winner: row.winner };
}

function raceByHand($, g = G) {
  const sin = Math.sin($.theta * DEG);
  const v = (k) => {
    const drop = g * $.s * sin;
    return drop > 0 ? Math.sqrt((2 * drop) / (1 + k)) : 0;
  };
  const sphere = v(2 / 5);
  const disk = v(1 / 2);
  const hoop = v(1);
  const winner = sphere >= disk && sphere >= hoop ? 'sphere' : disk >= hoop ? 'disk' : 'hoop';
  return { sphere, disk, hoop, winner };
}

/** Where the bar is read: hanging straight down, or 30° below the horizontal (60° from the vertical). */
const BAR_AT = { bottom: 0, low30: 60 };

function barRelease($) {
  return pinnedRelease({
    mass: $.m,
    length: $.L,
    theta1Deg: 90,
    theta2Deg: BAR_AT[$.at],
    kappa: 0,
    restDeg: 0,
  });
}

function barByHand($) {
  // The centre drops (L/2) cos θ₂; ½(mL²/3)ω² = mg(L/2) cos θ₂.
  const omega = Math.sqrt((3 * G * Math.cos(BAR_AT[$.at] * DEG)) / $.L);
  return { omega, vG: omega * ($.L / 2) };
}

/** Where the torsional spring is unstretched: with the bar hanging down, or horizontal at the start. */
const REST = { bottom: 0, start: 90 };

function coupleRelease($) {
  return pinnedRelease({
    mass: $.m,
    length: $.L,
    theta1Deg: 90,
    theta2Deg: 0,
    kappa: $.kappa,
    restDeg: REST[$.rest],
  });
}

function coupleByHand($) {
  // Unwinding toward rest the spring gives up ½κ(π/2)²; winding up away from rest it takes it.
  const work = ($.rest === 'start' ? -1 : 1) * 0.5 * $.kappa * (Math.PI / 2) ** 2;
  const drop = ($.m * G * $.L) / 2 + work;
  const IO = ($.m * $.L * $.L) / 3;
  return { work, omega: Math.sqrt((2 * drop) / IO) };
}

function slotsRelease($) {
  return slotRelease({
    mass: $.m,
    length: $.L,
    theta1Deg: $.theta1,
    theta2Deg: $.theta2,
    k: 0,
    rest: 0,
  });
}

function slotsByHand($) {
  const drop = Math.sin($.theta1 * DEG) - Math.sin($.theta2 * DEG);
  const omega = drop > 0 ? Math.sqrt((3 * G / $.L) * drop) : 0;
  return { omega, vG: omega * ($.L / 2) };
}

function springRelease($) {
  return slotRelease({
    mass: $.m,
    length: $.L,
    theta1Deg: $.theta1,
    theta2Deg: $.theta2,
    k: $.k,
    rest: $.L,
  });
}

function springByHand($) {
  const V = (deg) => {
    const th = deg * DEG;
    return $.m * G * ($.L / 2) * Math.sin(th) + 0.5 * $.k * ($.L * Math.cos(th) - $.L) ** 2;
  };
  const drop = V($.theta1) - V($.theta2);
  const I = ($.m * $.L * $.L) / 3;
  const omega = drop > 0 ? Math.sqrt((2 * drop) / I) : 0;
  return { omega, T: drop > 0 ? drop : 0 };
}

const ch18 = [
  problem({
    id: 'u7.18.ke',
    title: 'Kinetic energy of a rolling body',
    exam: 'u7',
    ch: '18',
    lab: null,
    src: 'Hibbeler §18.1',
    topics: ['energy'],
    vars: {
      shape: choice(['disk', 'disk'], ['hoop', 'hoop'], ['sphere', 'sphere']),
      m: range(1, 8, 0.5, 'kg'),
      R: range(0.1, 0.5, 0.05, 'm'),
      v: range(1, 6, 0.5, 'm/s'),
    },
    text: (T) => String.raw`A ${T.shape} of mass ${T.m} kg and radius ${T.R} m rolls without slipping at ${T.v} m/s. Find the translational kinetic energy, the rotational kinetic energy, and the total.`,
    parts: [
      num('trans', ($) => rollKE($).trans, 'J', { label: 'translational' }),
      num('rot', ($) => rollKE($).rot, 'J', { label: 'rotational' }),
      num('total', ($) => rollKE($).total, 'J', { label: 'total' }),
    ],
    level: 2,
    hints: ['Translation is one half m v squared. Rotation uses k = I over m R squared, and rolling sets omega = v/R.',
      "For rolling, omega is v over R. The spin term is then one half k m v squared, with k = I_G over m R squared.",
    ],
    steps: ($, sig) => {
      const row = rollKE($);
      const k = $.shape === 'sphere' ? '2/5' : $.shape === 'hoop' ? '1' : '1/2';
      return [
        String.raw`For a ${$.shape}, $k=${k}$.`,
        String.raw`Translation: $\tfrac{1}{2}mv_G^2=${sig(row.trans)}\ \mathrm{J}$.`,
        String.raw`Rotation: $\tfrac{1}{2}I_G\omega^2=${sig(row.rot)}\ \mathrm{J}$.`,
        String.raw`Total: $T=${sig(row.total)}\ \mathrm{J}$.`,
      ];
    },
    second: rollByHand,
    cases: [kase('Hibbeler §18.1', { shape: 'disk', m: 2, R: 0.25, v: 3 }, { trans: 9, rot: 4.5, total: 13.5 })],
  }),

  problem({
    id: 'u7.18.race',
    title: 'Race down an incline',
    exam: 'u7',
    ch: '18',
    lab: 'race',
    src: 'Hibbeler §18.5',
    topics: ['race'],
    vars: {
      m: range(1, 6, 0.5, 'kg'),
      R: range(0.1, 0.4, 0.05, 'm'),
      theta: range(15, 45, 5, 'deg'),
      s: range(1, 4, 0.5, 'm'),
      given: choice(['slope', 'the distance along the slope'], ['height', 'the height dropped']),
    },
    text: (T, $, sig) => ($.given === 'height'
      ? String.raw`A hoop, a disk, and a solid sphere, each of mass ${T.m} kg and radius ${T.R} m, roll from rest down a ${T.theta}° incline until each has dropped a height of ${sig($.s * Math.sin($.theta * DEG))} m. Find each finish speed, and which shape finishes first.`
      : String.raw`A hoop, a disk, and a solid sphere, each of mass ${T.m} kg and radius ${T.R} m, roll ${T.s} m from rest down a ${T.theta}° incline. Find each finish speed, and which shape finishes first.`),
    parts: [
      num('sphere', ($) => raceParts($).sphere, 'm/s', { label: 'sphere' }),
      num('disk', ($) => raceParts($).disk, 'm/s', { label: 'disk' }),
      num('hoop', ($) => raceParts($).hoop, 'm/s', { label: 'hoop' }),
      {
        ...mc('winner', [
          ['sphere', 'Sphere'],
          ['disk', 'Disk'],
          ['hoop', 'Hoop'],
        ], ($) => raceParts($).winner, { label: 'finishes first' }),
        options: [
          { value: 'sphere', label: 'Sphere', why: 'Smallest k, 2/5: only 2/7 of its energy goes into spin, so it moves fastest at every point.' },
          { value: 'disk', label: 'Disk', why: 'A disk has k = 1/2, more than the sphere’s 2/5. A third of its energy spins it, against 2/7 for the sphere.' },
          { value: 'hoop', label: 'Hoop', why: 'A hoop has k = 1: half its energy goes into spin. It finishes last, whatever its mass or radius.' },
        ],
      },
    ],
    level: 2,
    hints: ['Mass and radius cancel. Compare 1 + k for a sphere (k = 2/5), a disk (k = 1/2), and a hoop (k = 1).',
      "Set the drop in height equal to one half m v squared times (1 + k). Mass and radius cancel. The smallest k finishes first.",
    ],
    steps: ($, sig) => {
      const row = raceByHand($);
      return [
        String.raw`Mass and radius cancel. $v=\sqrt{2gs\sin\theta/(1+k)}$.`,
        String.raw`Sphere, $k=2/5$: $v=${sig(row.sphere)}\ \mathrm{m/s}$.`,
        String.raw`Disk, $k=1/2$: $v=${sig(row.disk)}\ \mathrm{m/s}$.`,
        String.raw`Hoop, $k=1$: $v=${sig(row.hoop)}\ \mathrm{m/s}$. The ${row.winner} finishes first.`,
      ];
    },
    second: ($) => raceByHand($),
    sim: {
      scenario: 'even',
      setup(s, $) {
        s.mass = $.m;
        s.radius = $.R;
        s.theta = $.theta;
        s.distance = $.s;
        s.time = 0;
      },
      read: (c) => ({ sphere: c.sphere, disk: c.disk, hoop: c.hoop, winner: c.winner }),
    },
    cases: [kase('Hibbeler §18.5', { m: 2, R: 0.2, theta: 30, s: 2, given: 'slope' }, {
      sphere: 3.7435659089009925,
      disk: 3.6166282640050245,
      hoop: 3.1320919526731648,
      winner: 'sphere',
    })],
  }),

  problem({
    id: 'u7.18.race-ft',
    title: 'A sphere in US customary units',
    exam: 'u7',
    ch: '18',
    lab: null,
    src: 'Hibbeler §18.5',
    topics: ['race'],
    vars: {
      shape: choice(['sphere', 'solid sphere'], ['disk', 'solid disk'], ['hoop', 'thin hoop']),
      W: range(10, 40, 2, 'lb'),
      s: range(4, 20, 1, 'ft'),
    },
    text: (T) => String.raw`A ${T.shape} weighs ${T.W} lb and rolls ${T.s} ft from rest down a 30° incline. Find its speed. The weight cancels. Use $g=32.2\ \mathrm{ft/s^2}$.`,
    parts: [
      num('v', ($) => Math.sqrt((2 * G_FT * $.s * 0.5) / (1 + ROLL_K[$.shape])), 'ft/s', { label: 'speed' }),
    ],
    level: 2,
    hints: ['A sphere has k = 2/5, a disk 1/2, a hoop 1. The weight cancels, and g is 32.2 ft/s squared.',
      "The height dropped is the slope length times sin of 30 degrees. Set m g times it equal to one half m v squared times (1 + k).",
    ],
    steps: ($, sig) => {
      const k = ROLL_K[$.shape];
      const v = Math.sqrt((2 * G_FT * $.s * 0.5) / (1 + k));
      const kTex = { sphere: '2/5', disk: '1/2', hoop: '1' }[$.shape];
      return [
        String.raw`The weight cancels. For a ${$.shape}, $k=${kTex}$, and $\sin 30^\circ=1/2$.`,
        String.raw`$v=\sqrt{2gs\sin\theta/(1+k)}=${sig(v)}\ \mathrm{ft/s}$.`,
      ];
    },
    second: ($) => {
      const mass = $.W / G_FT;
      const radius = 1;
      const I = centralInertia($.shape, mass, radius);
      const k = I / (mass * radius * radius);
      const drop = G_FT * $.s * Math.sin(30 * DEG);
      return { v: Math.sqrt((2 * drop) / (1 + k)) };
    },
    cases: [kase('Hibbeler §18.5', { shape: 'sphere', W: 20, s: 10 }, { v: 15.165750888103101 })],
  }),

  problem({
    id: 'u7.18.bar',
    title: 'Bar released from horizontal',
    exam: 'u7',
    ch: '18',
    lab: 'linkage',
    src: 'Hibbeler §18.5',
    topics: ['bar'],
    vars: {
      m: range(2, 8, 0.5, 'kg'),
      L: range(0.8, 2.4, 0.2, 'm'),
      at: choice(['bottom', 'as it hangs straight down'], ['low30', 'when it is 30° below the horizontal']),
    },
    text: (T) => String.raw`A uniform bar of mass ${T.m} kg and length ${T.L} m is pinned at one end. It is released from rest while horizontal. Find its angular speed and the speed of the mass centre ${T.at}.`,
    parts: [
      num('omega', ($) => barRelease($).omega, 'rad/s', { label: 'angular speed' }),
      num('vG', ($) => barRelease($).vG, 'm/s', { label: 'speed of G' }),
    ],
    level: 2,
    hints: ['Only the weight does work: the pin does not move. I about the pin is m L squared over 3.',
      "Find how far the centre has dropped: L/2 at the bottom, and (L/2) sin 30° when the bar is 30° below the horizontal. Set m g times that drop equal to one half I_O omega squared.",
    ],
    steps: ($, sig) => {
      const row = barByHand($);
      const drop = $.at === 'bottom' ? 'L/2' : String.raw`(L/2)\sin 30^\circ = L/4`;
      return [
        String.raw`The centre drops $${drop}$, and $I_O=mL^2/3$.`,
        String.raw`$\tfrac{1}{2}I_O\omega^2=mg\cdot${drop.split('=').pop().trim()}$, so $\omega=${sig(row.omega)}\ \mathrm{rad/s}$.`,
        String.raw`$v_G=\omega L/2=${sig(row.vG)}\ \mathrm{m/s}$.`,
      ];
    },
    second: barByHand,
    sim: {
      scenario: 'bar',
      setup(s, $) {
        s.mass = $.m;
        s.length = $.L;
        s.theta1 = 90;
        s.theta2 = BAR_AT[$.at];
        s.kappa = 0;
        s.restDeg = 0;
      },
      read: (c) => ({ omega: c.omega, vG: c.vG }),
    },
    cases: [kase('Hibbeler §18.5', { m: 4, L: 2, at: 'bottom' }, { omega: 3.836013555763327, vG: 3.836013555763327 })],
  }),

  problem({
    id: 'u7.18.couple',
    title: 'Work of a torsional spring',
    exam: 'u7',
    ch: '18',
    lab: 'linkage',
    src: 'Hibbeler §18.3',
    topics: ['couple'],
    vars: {
      m: range(3, 8, 0.5, 'kg'),
      L: range(1.2, 2.4, 0.2, 'm'),
      kappa: range(2, 12, 0.5, 'N·m/rad'),
      rest: choice(['bottom', 'when the bar hangs straight down'], ['start', 'when the bar is horizontal, where it starts']),
    },
    valid: ($) => {
      const drop = ($.m * G * $.L) / 2;
      const spring = ($.rest === 'start' ? -1 : 1) * 0.5 * $.kappa * (Math.PI / 2) ** 2;
      return drop + spring > 0;
    },
    text: (T) => String.raw`A uniform bar of mass ${T.m} kg and length ${T.L} m is pinned at one end. A torsional spring of stiffness ${T.kappa} N·m/rad is unstretched ${T.rest}. The bar is released from rest while horizontal. Find the work of the spring and the angular speed at the bottom.`,
    parts: [
      num('work', ($) => coupleRelease($).work, 'J', { label: 'work of the spring' }),
      num('omega', ($) => coupleRelease($).omega, 'rad/s', { label: 'angular speed' }),
    ],
    level: 3,
    hints: ['The spring work is one half kappa times (pi/2) squared. Its sign depends on whether the bar turns toward the spring’s rest angle or away from it.',
      "Add the spring work, with its sign, to m g times (L/2). That sum is the kinetic energy at the bottom.",
      "The angle in the spring is pi/2 radians. I_O is m L squared over 3, and omega is the square root of 2T over I_O.",
    ],
    steps: ($, sig) => {
      const row = coupleByHand($);
      return [
        $.rest === 'start'
          ? String.raw`The spring winds up by $\pi/2$ as the bar falls. $U=-\tfrac{1}{2}\kappa(\pi/2)^2=${sig(row.work)}\ \mathrm{J}$.`
          : String.raw`The spring unwinds to rest at the bottom. $U=\tfrac{1}{2}\kappa(\pi/2)^2=${sig(row.work)}\ \mathrm{J}$.`,
        String.raw`Gravity drops $mgL/2$. With the spring, $T=${sig(($.m * G * $.L) / 2 + row.work)}\ \mathrm{J}$.`,
        String.raw`$I_O=mL^2/3$, so $\omega=\sqrt{2T/I_O}=${sig(row.omega)}\ \mathrm{rad/s}$.`,
      ];
    },
    second: coupleByHand,
    sim: {
      scenario: 'couple',
      setup(s, $) {
        s.mass = $.m;
        s.length = $.L;
        s.theta1 = 90;
        s.theta2 = 0;
        s.kappa = $.kappa;
        s.restDeg = REST[$.rest];
      },
      read: (c) => ({ work: c.work, omega: c.omega }),
    },
    cases: [kase('Hibbeler §18.3', { m: 4, L: 2, kappa: 15, rest: 'bottom' }, { work: 18.505508252042546, omega: 4.653446636044723 })],
  }),

  problem({
    id: 'u7.18.slots',
    title: 'Rod in two slots',
    exam: 'u7',
    ch: '18',
    lab: 'linkage',
    src: 'Hibbeler §18.5',
    topics: ['linkage'],
    vars: {
      m: range(2, 6, 0.5, 'kg'),
      L: range(1, 2, 0.1, 'm'),
      theta1: range(50, 70, 5, 'deg'),
      theta2: range(20, 35, 5, 'deg'),
    },
    valid: ($) => $.theta1 > $.theta2,
    text: (T) => String.raw`A uniform rod of mass ${T.m} kg and length ${T.L} m has one end in a horizontal slot and the other in a vertical slot. It is released from rest at ${T.theta1}° from the floor. Find its angular speed and the speed of the mass centre at ${T.theta2}°.`,
    parts: [
      num('omega', ($) => slotsRelease($).omega, 'rad/s', { label: 'angular speed' }),
      num('vG', ($) => slotsRelease($).vG, 'm/s', { label: 'speed of G' }),
    ],
    level: 3,
    hints: ['The instantaneous centre is the corner opposite the rod. I about that corner is m L squared over 3.',
      "The centre drops (L/2) times (sin of theta1 minus sin of theta2). Set m g times that drop equal to one half I omega squared.",
      "The mass centre is L/2 from the corner, so the speed of G is omega times L/2.",
    ],
    steps: ($, sig) => {
      const row = slotsByHand($);
      return [
        String.raw`The instantaneous centre is the corner opposite the rod, and $I_{IC}=mL^2/3$.`,
        String.raw`The centre drops $(L/2)(\sin\theta_1-\sin\theta_2)$.`,
        String.raw`$\omega=\sqrt{(3g/L)(\sin\theta_1-\sin\theta_2)}=${sig(row.omega)}\ \mathrm{rad/s}$.`,
        String.raw`$v_G=\omega L/2=${sig(row.vG)}\ \mathrm{m/s}$.`,
      ];
    },
    second: slotsByHand,
    sim: {
      scenario: 'slots',
      setup(s, $) {
        s.mass = $.m;
        s.length = $.L;
        s.theta1 = $.theta1;
        s.theta2 = $.theta2;
        s.k = 0;
        s.springRest = 'zero';
      },
      read: (c) => ({ omega: c.omega, vG: c.vG }),
    },
    cases: [kase('Hibbeler §18.5', { m: 3, L: 1.5, theta1: 60, theta2: 30 }, {
      omega: 2.679816863565622,
      vG: 2.0098626476742165,
    })],
  }),

  problem({
    id: 'u7.18.spring',
    title: 'Spring at the foot of the rod',
    exam: 'u7',
    ch: '18',
    lab: 'linkage',
    src: 'Hibbeler §18.5',
    topics: ['spring'],
    vars: {
      m: range(2, 6, 0.5, 'kg'),
      L: range(1, 2, 0.1, 'm'),
      theta1: range(50, 70, 5, 'deg'),
      theta2: range(20, 35, 5, 'deg'),
      k: range(10, 80, 5, 'N/m'),
    },
    valid: ($) => $.theta1 > $.theta2,
    text: (T) => String.raw`The rod of the previous layout has mass ${T.m} kg and length ${T.L} m. A spring of stiffness ${T.k} N/m joins the corner to the foot. Its natural length equals the rod. Released from rest at ${T.theta1}° from the floor, find the angular speed and the kinetic energy at ${T.theta2}°.`,
    parts: [
      num('omega', ($) => springRelease($).omega, 'rad/s', { label: 'angular speed' }),
      num('T', ($) => springRelease($).T, 'J', { label: 'kinetic energy' }),
    ],
    level: 3,
    hints: ['The spring natural length equals the rod. It is compressed when the rod is steep, so it speeds the fall.',
      "At angle theta the spring length is L cos theta, so the compression is L minus L cos theta.",
      "Include the drop in spring energy with the drop of the centre. I about the corner is still m L squared over 3.",
    ],
    steps: ($, sig) => {
      const row = springByHand($);
      return [
        String.raw`The natural length equals $L$, so the stretch at angle $\theta$ is $L\cos\theta-L$.`,
        String.raw`$I_{IC}=mL^2/3$. The drop in $V$ is the kinetic energy, $T=${sig(row.T)}\ \mathrm{J}$.`,
        String.raw`$\omega=\sqrt{2T/I_{IC}}=${sig(row.omega)}\ \mathrm{rad/s}$.`,
      ];
    },
    second: springByHand,
    sim: {
      scenario: 'spring',
      setup(s, $) {
        s.mass = $.m;
        s.length = $.L;
        s.theta1 = $.theta1;
        s.theta2 = $.theta2;
        s.k = $.k;
        s.springRest = 'length';
      },
      read: (c) => ({ omega: c.omega, T: c.T }),
    },
    cases: [kase('Hibbeler §18.5', { m: 3, L: 1.5, theta1: 60, theta2: 30, k: 40 }, {
      omega: 4.057517803412053,
      T: 18.521382065631496,
    })],
  }),
];

export default ch18;
