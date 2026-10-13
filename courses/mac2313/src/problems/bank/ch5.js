import { problem, range, num, mc, tf, kase, domain } from '../kit.js';

const unit = { xMin: 0, xMax: 1, yMin: 0, yMax: 1 };

export default [
  problem({
    id: 'ch5.triple.vol',
    exam: 'ch5',
    ch: '5',
    lab: 'triple',
    src: 'Merino §5 type',
    title: 'Volume of a box',
    kind: 'numeric',
    level: 1,
    topics: ['triple'],
    vars: { a: range(1, 2, 1), b: range(1, 2, 1), c: range(1, 2, 1) },
    derive: ($) => ({ V: $.a * $.b * $.c }),
    text: (T) =>
      `Let $f=1$ on $B=[0,${T.a}]\\times[0,${T.b}]\\times[0,${T.c}]$. Find $\\iiint_B f\\,dV$.`,
    parts: [num('V', ($) => $.V, '', { label: 'volume', abs: 0.03 })],
    hints: ['$f=1$, so the integral is the volume of the box.'],
    steps: ($, f) => [`$${f($.V)}$.`],
    sim: {
      scenario: 'one',
      setup(slice, $) {
        slice.fieldId = 'one';
        slice.xMin = 0;
        slice.xMax = $.a;
        slice.yMin = 0;
        slice.yMax = $.b;
        slice.zMin = 0;
        slice.zMax = $.c;
        slice.n = 4;
        return domain(slice, { xMin: 0, xMax: $.a, yMin: 0, yMax: $.b });
      },
      read: (c) => ({ V: c.closed }),
    },
    cases: [kase('sample', { a: 1, b: 1, c: 1 }, { V: 1 })],
  }),

  problem({
    id: 'ch5.triple.xyz',
    exam: 'ch5',
    ch: '5',
    lab: 'triple',
    src: 'Merino §5 type',
    title: '$xyz$ on the unit cube',
    kind: 'numeric',
    level: 2,
    topics: ['triple'],
    vars: { dummy: range(1, 1, 1) },
    derive: () => ({ I: 0.125 }),
    text: () => `Let $f(x,y,z)=xyz$ on $[0,1]^3$. Find $\\iiint f\\,dV$.`,
    parts: [num('I', ($) => $.I, '', { label: '$\\iiint$', abs: 0.02 })],
    hints: ['The variables separate: $\\int_0^1 x\\,dx=1/2$, three times, so $1/8$.'],
    steps: () => ['$1/8$.'],
    sim: {
      scenario: 'xyz',
      setup(slice) {
        slice.fieldId = 'xyz';
        slice.xMin = 0;
        slice.xMax = 1;
        slice.yMin = 0;
        slice.yMax = 1;
        slice.zMin = 0;
        slice.zMax = 1;
        slice.n = 6;
        return domain(slice, unit);
      },
      read: (c) => ({ I: c.closed }),
    },
    cases: [kase('sample', { dummy: 1 }, { I: 0.125 })],
  }),

  problem({
    id: 'ch5.triple.fubini',
    exam: 'ch5',
    ch: '5',
    lab: 'triple',
    src: 'Merino §5 type',
    title: 'Fubini on a box',
    kind: 'conceptual',
    level: 1,
    topics: ['triple'],
    vars: { dummy: range(1, 1, 1) },
    text: () =>
      `True or false: if $f$ is continuous on a box $B$, then $\\int\\!\\int\\!\\int_B f\\,dV$ does not depend on whether you iterate $dz\\,dy\\,dx$ or $dx\\,dy\\,dz$.`,
    parts: [tf('tf', true, { label: 'statement' })],
    hints: ['Fubini: the six orders agree on a box for a continuous $f$.'],
    steps: () => ['True.'],
    cases: [kase('sample', { dummy: 1 }, { tf: 1 })],
  }),

  problem({
    id: 'ch5.triple.x',
    exam: 'ch5',
    ch: '5',
    lab: 'triple',
    src: 'Merino §5 type',
    title: '$\\iiint x\\,dV$ on a box',
    kind: 'numeric',
    level: 2,
    topics: ['triple'],
    vars: { dummy: range(1, 1, 1) },
    derive: () => ({ I: 2 }),
    text: () =>
      `Let $f(x,y,z)=x$ on $[0,2]\\times[0,1]\\times[0,1]$. Find $\\iiint f\\,dV$.`,
    parts: [num('I', ($) => $.I, '', { label: '$\\iiint$', abs: 0.04 })],
    hints: ['$\\int_0^2 x\\,dx=2$, times area $1$ in $y$ and $z$.'],
    steps: () => ['$2$.'],
    sim: {
      scenario: 'x',
      setup(slice) {
        slice.fieldId = 'xonly';
        slice.xMin = 0;
        slice.xMax = 2;
        slice.yMin = 0;
        slice.yMax = 1;
        slice.zMin = 0;
        slice.zMax = 1;
        slice.n = 6;
        return domain(slice, { xMin: 0, xMax: 2, yMin: 0, yMax: 1 });
      },
      read: (c) => ({ I: c.closed }),
    },
    cases: [kase('sample', { dummy: 1 }, { I: 2 })],
  }),

  problem({
    id: 'ch5.cyl.vol',
    exam: 'ch5',
    ch: '5',
    lab: 'cyl',
    src: 'Merino §5 type',
    title: 'Volume of a cylinder',
    kind: 'numeric',
    level: 1,
    topics: ['cyl'],
    vars: { dummy: range(1, 1, 1) },
    derive: () => ({ V: Math.PI }),
    text: () =>
      `A cylinder of radius $1$ and height $1$ (so $z\\in[0,1]$). Find its volume.`,
    parts: [num('V', ($) => $.V, '', { label: 'volume', abs: 0.06 })],
    hints: ['$\\pi R^2 H=\\pi$. In cylindrical coordinates the Jacobian $r$ is what produces $\\pi R^2$.'],
    steps: () => ['$\\pi$.'],
    sim: {
      scenario: 'vol',
      setup(slice) {
        slice.fieldId = 'one';
        slice.R = 1;
        slice.z0 = 0;
        slice.z1 = 1;
        return domain(slice, { xMin: -1.2, xMax: 1.2, yMin: -1.2, yMax: 1.2 });
      },
      read: (c) => ({ V: c.closed }),
    },
    cases: [kase('sample', { dummy: 1 }, { V: Math.PI })],
  }),

  problem({
    id: 'ch5.cyl.jac',
    exam: 'ch5',
    ch: '5',
    lab: 'cyl',
    src: 'Merino §5 type',
    title: 'The cylindrical Jacobian',
    kind: 'choice',
    level: 1,
    topics: ['cyl'],
    vars: { dummy: range(1, 1, 1) },
    text: () => `In cylindrical coordinates, $dV$ is:`,
    parts: [
      mc(
        'jac',
        [
          ['r', '$r\\,dr\\,d\\theta\\,dz$'],
          ['1', '$dr\\,d\\theta\\,dz$'],
          ['r2', '$r^2\\,dr\\,d\\theta\\,dz$'],
          ['sin', '$r\\sin\\theta\\,dr\\,d\\theta\\,dz$'],
        ],
        'r',
      ),
    ],
    hints: ['The $xy$-slice is polar: the extra factor is $r$, same as double polar.'],
    steps: () => ['$dV=r\\,dr\\,d\\theta\\,dz$.'],
    cases: [kase('sample', { dummy: 1 }, { jac: 'r' })],
  }),

  problem({
    id: 'ch5.cyl.z',
    exam: 'ch5',
    ch: '5',
    lab: 'cyl',
    src: 'Merino §5 type',
    title: '$\\iiint z\\,dV$ on a cylinder',
    kind: 'numeric',
    level: 2,
    topics: ['cyl'],
    vars: { dummy: range(1, 1, 1) },
    derive: () => ({ I: 2 * Math.PI }),
    text: () =>
      `Let $f=z$ on the cylinder $x^2+y^2\\le 1$, $z\\in[0,2]$. Find $\\iiint f\\,dV$.`,
    parts: [num('I', ($) => $.I, '', { label: '$\\iiint$', abs: 0.08 })],
    hints: ['Base area $\\pi$, $\\int_0^2 z\\,dz=2$, so the integral is $2\\pi$.'],
    steps: () => ['$\\iiint z\\,dV = \\pi R^2 \\cdot \\tfrac12\\bigl(z_1^2-z_0^2\\bigr) = \\pi \\cdot \\tfrac12 \\cdot 2^2 = 2\\pi$.'],
    sim: {
      scenario: 'z',
      setup(slice) {
        slice.fieldId = 'zonly';
        slice.R = 1;
        slice.z0 = 0;
        slice.z1 = 2;
        return domain(slice, { xMin: -1.2, xMax: 1.2, yMin: -1.2, yMax: 1.2 });
      },
      read: (c) => ({ I: c.closed }),
    },
    cases: [kase('sample', { dummy: 1 }, { I: 2 * Math.PI })],
  }),

  problem({
    id: 'ch5.sph.vol',
    exam: 'ch5',
    ch: '5',
    lab: 'sph',
    src: 'Merino §5 type',
    title: 'Volume of the unit ball',
    kind: 'numeric',
    level: 1,
    topics: ['sph'],
    vars: { dummy: range(1, 1, 1) },
    derive: () => ({ V: (4 / 3) * Math.PI }),
    text: () => `Find the volume of the unit ball $x^2+y^2+z^2\\le 1$.`,
    parts: [num('V', ($) => $.V, '', { label: 'volume', abs: 0.08 })],
    hints: ['$\\tfrac43\\pi R^3$ with $R=1$. The Jacobian $\\rho^2\\sin\\varphi$ is what produces this.'],
    steps: () => ['$\\tfrac43\\pi$.'],
    sim: {
      scenario: 'vol',
      setup(slice) {
        slice.fieldId = 'one';
        slice.R = 1;
        return domain(slice, { xMin: -1.2, xMax: 1.2, yMin: -1.2, yMax: 1.2 });
      },
      read: (c) => ({ V: c.closed }),
    },
    cases: [kase('sample', { dummy: 1 }, { V: (4 / 3) * Math.PI })],
  }),

  problem({
    id: 'ch5.sph.jac',
    exam: 'ch5',
    ch: '5',
    lab: 'sph',
    src: 'Merino §5 type',
    title: 'The spherical Jacobian',
    kind: 'choice',
    level: 1,
    topics: ['sph'],
    vars: { dummy: range(1, 1, 1) },
    text: () => `In spherical coordinates, $dV$ is:`,
    parts: [
      mc(
        'jac',
        [
          ['rho2sin', '$\\rho^2\\sin\\varphi\\,d\\rho\\,d\\varphi\\,d\\theta$'],
          ['rho', '$\\rho\\,d\\rho\\,d\\varphi\\,d\\theta$'],
          ['sin', '$\\sin\\varphi\\,d\\rho\\,d\\varphi\\,d\\theta$'],
          ['r', '$r\\,dr\\,d\\theta\\,dz$'],
        ],
        'rho2sin',
      ),
    ],
    hints: ['$\\rho$ is the distance from the origin; $\\varphi$ is the angle from $+z$.'],
    steps: () => ['$dV=\\rho^2\\sin\\varphi\\,d\\rho\\,d\\varphi\\,d\\theta$.'],
    cases: [kase('sample', { dummy: 1 }, { jac: 'rho2sin' })],
  }),

  problem({
    id: 'ch5.sph.phi',
    exam: 'ch5',
    ch: '5',
    lab: 'sph',
    src: 'Merino §5 type',
    title: 'The range of $\\varphi$',
    kind: 'choice',
    level: 1,
    topics: ['sph'],
    vars: { dummy: range(1, 1, 1) },
    text: () =>
      `In this course, $\\varphi$ in spherical coordinates is the angle from the positive $z$-axis. Its range on a full ball is:`,
    parts: [
      mc(
        'phi',
        [
          ['pi', '$[0,\\pi]$'],
          ['tau', '$[0,2\\pi)$'],
          ['half', '$[0,\\pi/2]$'],
          ['pm', '$[-\\pi/2,\\pi/2]$'],
        ],
        'pi',
      ),
    ],
    hints: ['$\\varphi=0$ is the north pole, $\\varphi=\\pi$ is the south pole. $\\theta$ is the one that runs a full turn.'],
    steps: () => ['$[0,\\pi]$.'],
    cases: [kase('sample', { dummy: 1 }, { phi: 'pi' })],
  }),

  problem({
    id: 'ch5.sph.odd',
    exam: 'ch5',
    ch: '5',
    lab: 'sph',
    src: 'Merino §5 type',
    title: 'An odd integrand on a ball',
    kind: 'numeric',
    level: 2,
    topics: ['sph'],
    vars: { dummy: range(1, 1, 1) },
    derive: () => ({ I: 0 }),
    text: () => `Let $f(x,y,z)=z$ on the unit ball. Find $\\iiint f\\,dV$.`,
    parts: [num('I', ($) => $.I, '', { label: '$\\iiint$', abs: 0.05 })],
    hints: ['$z$ is odd in $z$ and the ball is symmetric about $z=0$.'],
    steps: () => ['$0$.'],
    sim: {
      scenario: 'z',
      setup(slice) {
        slice.fieldId = 'zonly';
        slice.R = 1;
        return domain(slice, { xMin: -1.2, xMax: 1.2, yMin: -1.2, yMax: 1.2 });
      },
      read: (c) => ({ I: c.closed }),
    },
    cases: [kase('sample', { dummy: 1 }, { I: 0 })],
  }),

  problem({
    id: 'ch5.sph.bowl',
    exam: 'ch5',
    ch: '5',
    lab: 'sph',
    src: 'Merino §5 type',
    title: '$\\iiint(x^2+y^2+z^2)\\,dV$ on the unit ball',
    kind: 'numeric',
    level: 2,
    topics: ['sph'],
    vars: { dummy: range(1, 1, 1) },
    derive: () => ({ I: (4 / 5) * Math.PI }),
    text: () =>
      `Let $f(x,y,z)=x^2+y^2+z^2$ on the unit ball. Find $\\iiint f\\,dV$.`,
    parts: [num('I', ($) => $.I, '', { label: '$\\iiint$', abs: 0.08 })],
    hints: ['$f=\\rho^2$, times Jacobian $\\rho^2\\sin\\varphi$. $\\int_0^1\\rho^4\\,d\\rho=1/5$, times $4\\pi$.'],
    steps: () => ['$\\tfrac45\\pi$.'],
    sim: {
      scenario: 'bowl',
      setup(slice) {
        slice.fieldId = 'bowl';
        slice.R = 1;
        return domain(slice, { xMin: -1.2, xMax: 1.2, yMin: -1.2, yMax: 1.2 });
      },
      read: (c) => ({ I: c.closed }),
    },
    cases: [kase('sample', { dummy: 1 }, { I: (4 / 5) * Math.PI })],
  }),
];
