import { G, G_FT } from '@flux/subjects/mechanics/constants.js';
import { centralInertia } from '@flux/subjects/mechanics/inertia.js';
import {
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

function barRelease($) {
  return pinnedRelease({
    mass: $.m,
    length: $.L,
    theta1Deg: 90,
    theta2Deg: 0,
    kappa: 0,
    restDeg: 0,
  });
}

function barByHand($) {
  const omega = Math.sqrt((3 * G) / $.L);
  return { omega, vG: omega * ($.L / 2) };
}

function coupleRelease($) {
  return pinnedRelease({
    mass: $.m,
    length: $.L,
    theta1Deg: 90,
    theta2Deg: 0,
    kappa: $.kappa,
    restDeg: 0,
  });
}

function coupleByHand($) {
  const work = 0.5 * $.kappa * (Math.PI / 2) ** 2;
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
    hints: ['Translation is one half m v squared. Rotation uses k = I over m R squared, and rolling sets omega = v/R.'],
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
    },
    text: (T) => String.raw`A hoop, a disk, and a solid sphere, each of mass ${T.m} kg and radius ${T.R} m, roll ${T.s} m from rest down a ${T.theta}° incline. Find each finish speed, and which shape finishes first.`,
    parts: [
      num('sphere', ($) => raceParts($).sphere, 'm/s', { label: 'sphere' }),
      num('disk', ($) => raceParts($).disk, 'm/s', { label: 'disk' }),
      num('hoop', ($) => raceParts($).hoop, 'm/s', { label: 'hoop' }),
      mc('winner', [
        ['sphere', 'Sphere'],
        ['disk', 'Disk'],
        ['hoop', 'Hoop'],
      ], ($) => raceParts($).winner, { label: 'finishes first' }),
    ],
    hints: ['Mass and radius cancel. Compare 1 + k for a sphere (k = 2/5), a disk (k = 1/2), and a hoop (k = 1).'],
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
    cases: [kase('Hibbeler §18.5', { m: 2, R: 0.2, theta: 30, s: 2 }, {
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
      W: range(10, 40, 2, 'lb'),
      s: range(4, 20, 1, 'ft'),
    },
    text: (T) => String.raw`A sphere weighs ${T.W} lb and rolls ${T.s} ft from rest down a 30° incline. Find its speed. The weight cancels. Use $g=32.2\ \mathrm{ft/s^2}$.`,
    parts: [
      num('v', ($) => {
        const drop = G_FT * $.s * 0.5;
        return Math.sqrt((2 * drop) / (7 / 5));
      }, 'ft/s', { label: 'speed' }),
    ],
    hints: ['A sphere has k = 2/5. The weight cancels, and g is 32.2 ft/s squared.'],
    steps: ($, sig) => {
      const drop = G_FT * $.s * 0.5;
      const v = Math.sqrt((2 * drop) / (7 / 5));
      return [
        String.raw`The weight cancels. $k=2/5$ and $\sin 30^\circ=1/2$.`,
        String.raw`$v=\sqrt{2gs\sin\theta/(7/5)}=${sig(v)}\ \mathrm{ft/s}$.`,
      ];
    },
    second: ($) => {
      const mass = $.W / G_FT;
      const radius = 1;
      const I = (2 / 5) * mass * radius * radius;
      const k = I / (mass * radius * radius);
      const drop = G_FT * $.s * Math.sin(30 * DEG);
      return { v: Math.sqrt((2 * drop) / (1 + k)) };
    },
    cases: [kase('Hibbeler §18.5', { W: 20, s: 10 }, { v: 15.165750888103101 })],
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
    },
    text: (T) => String.raw`A uniform bar of mass ${T.m} kg and length ${T.L} m is pinned at one end. It is released from rest while horizontal. Find its angular speed and the speed of the mass centre at the bottom.`,
    parts: [
      num('omega', ($) => barRelease($).omega, 'rad/s', { label: 'angular speed' }),
      num('vG', ($) => barRelease($).vG, 'm/s', { label: 'speed of G' }),
    ],
    hints: ['The centre drops L/2. I about the pin is m L squared over 3, so omega is the square root of 3g/L.'],
    steps: ($, sig) => {
      const row = barByHand($);
      return [
        String.raw`The centre drops $L/2$, and $I_O=mL^2/3$.`,
        String.raw`$\tfrac{1}{2}I_O\omega^2=mgL/2$, so $\omega=\sqrt{3g/L}=${sig(row.omega)}\ \mathrm{rad/s}$.`,
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
        s.theta2 = 0;
        s.kappa = 0;
        s.restDeg = 0;
      },
      read: (c) => ({ omega: c.omega, vG: c.vG }),
    },
    cases: [kase('Hibbeler §18.5', { m: 4, L: 2 }, { omega: 3.836013555763327, vG: 3.836013555763327 })],
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
      kappa: range(0, 12, 0.5, 'N·m/rad'),
    },
    valid: ($) => {
      const drop = ($.m * G * $.L) / 2;
      const spring = 0.5 * $.kappa * (Math.PI / 2) ** 2;
      return drop + spring > 0;
    },
    text: (T) => String.raw`A uniform bar of mass ${T.m} kg and length ${T.L} m is pinned at one end. A torsional spring of stiffness ${T.kappa} N·m/rad is unstretched when the bar hangs straight down. The bar is released from rest while horizontal. Find the work of the spring and the angular speed at the bottom.`,
    parts: [
      num('work', ($) => coupleRelease($).work, 'J', { label: 'work of the spring' }),
      num('omega', ($) => coupleRelease($).omega, 'rad/s', { label: 'angular speed' }),
    ],
    hints: ['The spring is unstretched at the bottom. Its work is one half kappa times (pi/2) squared. Add that to the drop in height.'],
    steps: ($, sig) => {
      const row = coupleByHand($);
      return [
        String.raw`The spring is unstretched at the bottom. $U=\tfrac{1}{2}\kappa(\pi/2)^2=${sig(row.work)}\ \mathrm{J}$.`,
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
        s.restDeg = 0;
      },
      read: (c) => ({ work: c.work, omega: c.omega }),
    },
    cases: [kase('Hibbeler §18.3', { m: 4, L: 2, kappa: 15 }, { work: 18.505508252042546, omega: 4.653446636044723 })],
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
    hints: ['The instantaneous centre is the corner opposite the rod. I about that corner is m L squared over 3.'],
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
      k: range(0, 80, 5, 'N/m'),
    },
    valid: ($) => $.theta1 > $.theta2,
    text: (T) => String.raw`The rod of the previous layout has mass ${T.m} kg and length ${T.L} m. A spring of stiffness ${T.k} N/m joins the corner to the foot. Its natural length equals the rod. Released from rest at ${T.theta1}° from the floor, find the angular speed and the kinetic energy at ${T.theta2}°.`,
    parts: [
      num('omega', ($) => springRelease($).omega, 'rad/s', { label: 'angular speed' }),
      num('T', ($) => springRelease($).T, 'J', { label: 'kinetic energy' }),
    ],
    hints: ['The spring natural length equals the rod. It is compressed when the rod is steep, so it speeds the fall.'],
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
