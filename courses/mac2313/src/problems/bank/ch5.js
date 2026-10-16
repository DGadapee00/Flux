import { coef, problem, range, num, mc, tf, kase, domain } from '../kit.js';

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
    vars: { a: range(1, 4, 1), b: range(1, 4, 1), c: range(1, 4, 1) },
    derive: ($) => ({ V: $.a * $.b * $.c }),
    text: (T) =>
      `Let $f=1$ on $B=[0,${T.a}]\\times[0,${T.b}]\\times[0,${T.c}]$. Find $\\iiint_B f\\,dV$.`,
    parts: [num('V', ($) => $.V, '', { label: 'volume', abs: 0.03 })],
    hints: [
      '$f=1$, so the integral is the volume of the box.',
      'Multiply the three edge lengths. The order of integration does not change a constant integrand.',
    ],
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
    title: '$xyz$ on a box',
    kind: 'numeric',
    level: 2,
    topics: ['triple'],
    vars: { A: range(1, 4, 1), B: range(1, 4, 1), C: range(1, 4, 1) },
    derive: ($) => ({ I: (($.A * $.A) / 2) * (($.B * $.B) / 2) * (($.C * $.C) / 2) }),
    text: (T) =>
      `Let $f(x,y,z)=xyz$ on $[0,${T.A}]\\times[0,${T.B}]\\times[0,${T.C}]$. Find $\\iiint f\\,dV$.`,
    parts: [num('I', ($) => $.I, '', { label: '$\\iiint$', abs: 0.02 })],
    hints: [
      'The variables separate: $\\int_0^A x\\,dx = A^2/2$, and the same for $y$ and $z$.',
      'Multiply the three halves. On the unit cube each factor is $1/2$, so the integral is $1/8$.',
    ],
    steps: ($, f) => [`$(A^2/2)(B^2/2)(C^2/2) = ${f($.I)}$.`],
    sim: {
      scenario: 'xyz',
      setup(slice, $) {
        slice.fieldId = 'xyz';
        slice.xMin = 0;
        slice.xMax = $.A;
        slice.yMin = 0;
        slice.yMax = $.B;
        slice.zMin = 0;
        slice.zMax = $.C;
        slice.n = 6;
        return domain(slice, { xMin: 0, xMax: $.A, yMin: 0, yMax: $.B });
      },
      read: (c) => ({ I: c.closed }),
    },
    cases: [kase('sample', { A: 1, B: 1, C: 1 }, { I: 0.125 })],
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
    vars: { n: range(1, 50, 1) },
    text: (T) =>
      `Let $f(x,y,z)=${coef(T.n)}xyz$, continuous on a box $B$. True or false: $\\iiint_B f\\,dV$ does not depend on whether you iterate $dz\\,dy\\,dx$ or $dx\\,dy\\,dz$.`,
    parts: [tf('tf', true, { label: 'statement' })],
    hints: [
      'Fubini: the six orders agree on a box for a continuous $f$.',
      'The coefficient factors out of every order, so it cannot make two orders disagree.',
    ],
    steps: () => ['True.'],
    cases: [kase('sample', { n: 1 }, { tf: 1 })],
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
    vars: { A: range(1, 5, 1), B: range(1, 4, 1), C: range(1, 3, 1) },
    derive: ($) => ({ I: (($.A * $.A) / 2) * $.B * $.C }),
    text: (T) =>
      `Let $f(x,y,z)=x$ on $[0,${T.A}]\\times[0,${T.B}]\\times[0,${T.C}]$. Find $\\iiint f\\,dV$.`,
    parts: [num('I', ($) => $.I, '', { label: '$\\iiint$', abs: 0.04 })],
    hints: [
      '$\\int_0^A x\\,dx = A^2/2$, then multiply by the lengths in $y$ and $z$.',
      '$f$ does not depend on $y$ or $z$, so those integrals are just the edge lengths.',
    ],
    steps: ($, f) => [`$(A^2/2) \\cdot B \\cdot C = ${f($.I)}$.`],
    sim: {
      scenario: 'x',
      setup(slice, $) {
        slice.fieldId = 'xonly';
        slice.xMin = 0;
        slice.xMax = $.A;
        slice.yMin = 0;
        slice.yMax = $.B;
        slice.zMin = 0;
        slice.zMax = $.C;
        slice.n = 6;
        return domain(slice, { xMin: 0, xMax: $.A, yMin: 0, yMax: $.B });
      },
      read: (c) => ({ I: c.closed }),
    },
    cases: [kase('sample', { A: 2, B: 1, C: 1 }, { I: 2 })],
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
    vars: { R: range(1, 5, 1), H: range(1, 10, 1) },
    derive: ($) => ({ V: Math.PI * $.R * $.R * $.H }),
    text: (T) =>
      `A cylinder of radius ${T.R} and height ${T.H} (so $z\\in[0,${T.H}]$). Find its volume.`,
    parts: [num('V', ($) => $.V, '', { label: 'volume', abs: 0.06 })],
    hints: [
      '$\\pi R^2 H$. In cylindrical coordinates the Jacobian $r$ is what produces $\\pi R^2$.',
      'Height is the $z$-interval. Do not cube the radius: that formula belongs to a ball.',
    ],
    steps: ($, f) => [`$\\pi R^2 H = ${f($.V)}$.`],
    sim: {
      scenario: 'vol',
      setup(slice, $) {
        slice.fieldId = 'one';
        slice.R = $.R;
        slice.z0 = 0;
        slice.z1 = $.H;
        const m = $.R + 0.2;
        return domain(slice, { xMin: -m, xMax: m, yMin: -m, yMax: m });
      },
      read: (c) => ({ V: c.closed }),
    },
    cases: [kase('sample', { R: 1, H: 1 }, { V: Math.PI })],
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
    vars: { n: range(1, 50, 1) },
    text: (T) => `A cylinder of radius ${T.n}. In cylindrical coordinates, $dV$ is:`,
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
    hints: [
      'The $xy$-slice is polar: the extra factor is $r$, same as double polar.',
      'The radius of this cylinder does not change the Jacobian. $\\sin\\varphi$ belongs to spherical coordinates.',
    ],
    steps: () => ['$dV=r\\,dr\\,d\\theta\\,dz$.'],
    cases: [kase('sample', { n: 1 }, { jac: 'r' })],
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
    vars: { R: range(1, 5, 1), H: range(1, 10, 1) },
    derive: ($) => ({ I: Math.PI * $.R * $.R * (($.H * $.H) / 2) }),
    text: (T) =>
      `Let $f=z$ on the cylinder $x^2+y^2\\le ${T.R}^2$, $z\\in[0,${T.H}]$. Find $\\iiint f\\,dV$.`,
    parts: [num('I', ($) => $.I, '', { label: '$\\iiint$', abs: 0.08 })],
    hints: [
      'The base has area $\\pi R^2$, and $\\int_0^H z\\,dz = H^2/2$.',
      'Multiply those. The integrand does not depend on $x$ or $y$, so the base contributes only its area.',
    ],
    steps: ($, f) => [`$\\pi R^2 \\cdot (H^2/2) = ${f($.I)}$.`],
    sim: {
      scenario: 'z',
      setup(slice, $) {
        slice.fieldId = 'zonly';
        slice.R = $.R;
        slice.z0 = 0;
        slice.z1 = $.H;
        const m = $.R + 0.2;
        return domain(slice, { xMin: -m, xMax: m, yMin: -m, yMax: m });
      },
      read: (c) => ({ I: c.closed }),
    },
    cases: [kase('sample', { R: 1, H: 2 }, { I: 2 * Math.PI })],
  }),

  problem({
    id: 'ch5.sph.vol',
    exam: 'ch5',
    ch: '5',
    lab: 'sph',
    src: 'Merino §5 type',
    title: 'Volume of a ball',
    kind: 'numeric',
    level: 1,
    topics: ['sph'],
    vars: { R: range(1, 50, 1) },
    derive: ($) => ({ V: (4 / 3) * Math.PI * $.R ** 3 }),
    text: (T) => `Find the volume of the ball $x^2+y^2+z^2\\le ${T.R}^2$.`,
    parts: [num('V', ($) => $.V, '', { label: 'volume', abs: 0.08 })],
    hints: [
      '$\\tfrac43\\pi R^3$. The Jacobian $\\rho^2\\sin\\varphi$ is what produces this.',
      'The radius is cubed, not squared. A squared radius is the area of a disk.',
    ],
    steps: ($, f) => [`$\\tfrac43\\pi R^3 = ${f($.V)}$.`],
    sim: {
      scenario: 'vol',
      setup(slice, $) {
        slice.fieldId = 'one';
        slice.R = $.R;
        const m = $.R + 0.2;
        return domain(slice, { xMin: -m, xMax: m, yMin: -m, yMax: m });
      },
      read: (c) => ({ V: c.closed }),
    },
    cases: [kase('sample', { R: 1 }, { V: (4 / 3) * Math.PI })],
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
    vars: { n: range(1, 50, 1) },
    text: (T) => `The ball of radius ${T.n}. In spherical coordinates, $dV$ is:`,
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
    hints: [
      '$\\rho$ is the distance from the origin; $\\varphi$ is the angle from $+z$.',
      'The cylindrical factor $r\\,dr\\,d\\theta\\,dz$ is the other option. A ball uses $\\rho^2\\sin\\varphi$.',
    ],
    steps: () => ['$dV=\\rho^2\\sin\\varphi\\,d\\rho\\,d\\varphi\\,d\\theta$.'],
    cases: [kase('sample', { n: 1 }, { jac: 'rho2sin' })],
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
    vars: { n: range(1, 50, 1) },
    text: (T) =>
      `On the ball of radius ${T.n}, $\\varphi$ is the angle from the positive $z$-axis. Its range on a full ball is:`,
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
    hints: [
      '$\\varphi=0$ is the north pole, $\\varphi=\\pi$ is the south pole. $\\theta$ is the one that runs a full turn.',
      'The radius does not change the angle. $[0,\\pi/2]$ would stop at the equator.',
    ],
    steps: () => ['$[0,\\pi]$.'],
    cases: [kase('sample', { n: 1 }, { phi: 'pi' })],
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
    vars: { R: range(1, 50, 1) },
    derive: () => ({ I: 0 }),
    text: (T) => `Let $f(x,y,z)=z$ on the ball of radius ${T.R}. Find $\\iiint f\\,dV$.`,
    parts: [num('I', ($) => $.I, '', { label: '$\\iiint$', abs: 0.05 })],
    hints: [
      '$z$ is odd in $z$ and the ball is symmetric about $z=0$.',
      'A larger radius scales both the upper and lower halves the same way, so the integral stays $0$.',
    ],
    steps: () => ['$0$.'],
    sim: {
      scenario: 'z',
      setup(slice, $) {
        slice.fieldId = 'zonly';
        slice.R = $.R;
        const m = $.R + 0.2;
        return domain(slice, { xMin: -m, xMax: m, yMin: -m, yMax: m });
      },
      read: (c) => ({ I: c.closed }),
    },
    cases: [kase('sample', { R: 1 }, { I: 0 })],
  }),

  problem({
    id: 'ch5.sph.bowl',
    exam: 'ch5',
    ch: '5',
    lab: 'sph',
    src: 'Merino §5 type',
    title: '$\\iiint(x^2+y^2+z^2)\\,dV$ on a ball',
    kind: 'numeric',
    level: 2,
    topics: ['sph'],
    vars: { R: range(1, 50, 1) },
    derive: ($) => ({ I: (4 / 5) * Math.PI * $.R ** 5 }),
    text: (T) =>
      `Let $f(x,y,z)=x^2+y^2+z^2$ on the ball of radius ${T.R}. Find $\\iiint f\\,dV$.`,
    parts: [num('I', ($) => $.I, '', { label: '$\\iiint$', abs: 0.08 })],
    hints: [
      '$f=\\rho^2$, times Jacobian $\\rho^2\\sin\\varphi$. $\\int_0^R\\rho^4\\,d\\rho=R^5/5$, times $4\\pi$.',
      'The angular integrals give $4\\pi$, and the radial power is $5$, not $3$. Volume would stop at $\\rho^2$ in the Jacobian alone.',
    ],
    steps: ($, f) => [`$\\tfrac45\\pi R^5 = ${f($.I)}$.`],
    sim: {
      scenario: 'bowl',
      setup(slice, $) {
        slice.fieldId = 'bowl';
        slice.R = $.R;
        const m = $.R + 0.2;
        return domain(slice, { xMin: -m, xMax: m, yMin: -m, yMax: m });
      },
      read: (c) => ({ I: c.closed }),
    },
    cases: [kase('sample', { R: 1 }, { I: (4 / 5) * Math.PI })],
  }),
];
