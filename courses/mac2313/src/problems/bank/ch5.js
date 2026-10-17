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
      'The integral of $1$ over a region is its volume.',
      'For a box, the volume is the product of the edge lengths.',
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
      'The integrand is a product of one-variable factors, and the region is a box. The integral splits into three.',
      (T) => String.raw`It equals $\left(\int_0^{${T.A}}x\,dx\right)\left(\int_0^{${T.B}}y\,dy\right)\left(\int_0^{${T.C}}z\,dz\right)$.`,
      'Each factor is half the square of its upper limit.',
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
      "Fubini's theorem in three variables says when the order of an iterated integral can be swapped.",
      'On a box, its hypothesis is that $f$ is continuous. Check that for this $f$.',
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
      'The integrand depends only on $x$. Integrate it, then account for the $y$ and $z$ directions.',
      (T) => String.raw`$\int_0^{${T.A}}x\,dx$ is half the square of $${T.A}$.`,
      (T) => String.raw`The $y$ and $z$ integrals of $1$ give the edge lengths $${T.B}$ and $${T.C}$.`,
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
      String.raw`In cylindrical coordinates, $dV=r\,dr\,d\theta\,dz$.`,
      (T) => String.raw`Integrate $r$ from $0$ to $${T.R}$, $\theta$ over a full turn, and $z$ from $0$ to $${T.H}$.`,
      'The three integrals separate. Multiply them.',
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
      'Cylindrical coordinates are polar coordinates in the $xy$-plane, with $z$ unchanged.',
      'So the factor in $dV$ is the factor in the polar $dA$.',
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
      String.raw`In cylindrical coordinates, $dV=r\,dr\,d\theta\,dz$, and the integrand is $z$.`,
      (T) => String.raw`The $r$ and $\theta$ integrals give the base area, $\pi\cdot ${T.R}^2$.`,
      (T) => String.raw`Multiply that by $\int_0^{${T.H}}z\,dz$.`,
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
      String.raw`In spherical coordinates, $dV=\rho^2\sin\varphi\,d\rho\,d\varphi\,d\theta$.`,
      (T) => String.raw`Integrate $\rho$ from $0$ to $${T.R}$, $\varphi$ from $0$ to $\pi$, and $\theta$ from $0$ to $2\pi$.`,
      String.raw`The angular integrals are $\int_0^{\pi}\sin\varphi\,d\varphi=2$ and $\int_0^{2\pi}d\theta=2\pi$.`,
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
      String.raw`The volume element comes from the Jacobian of $(\rho,\varphi,\theta)\mapsto(x,y,z)$.`,
      String.raw`A small spherical box has sides $d\rho$, $\rho\,d\varphi$, and $\rho\sin\varphi\,d\theta$.`,
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
      String.raw`$\varphi=0$ is the positive $z$-axis.`,
      String.raw`$\theta$ already sweeps a full turn. $\varphi$ only has to reach the negative $z$-axis.`,
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
      'Look for a symmetry of the region and of the integrand before computing.',
      String.raw`Reflecting $z\to -z$ keeps the ball the same and flips the sign of the integrand.`,
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
      String.raw`Use spherical coordinates. The integrand is $\rho^2$.`,
      String.raw`With $dV=\rho^2\sin\varphi\,d\rho\,d\varphi\,d\theta$, the radial integrand is $\rho^4$.`,
      (T) => String.raw`The angles give $4\pi$. Integrate $\rho^4$ from $0$ to $${T.R}$.`,
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
