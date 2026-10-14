/** Ch 2 · Vectors. OpenStax University Physics Vol. 1, §§2.2–2.4. */
import {
  DEG, angle2D, angleBetween, cross, directionAngles, dot, fromAngle2D, mag, resultant, unitAB, v,
} from '@flux/subjects/mechanics/vectors.js';
import { kase, num, problem, range, sym, texNum } from '../kit.js';

const U = { exam: 'u1', ch: '2' };

export default [
  problem({
    ...U,
    id: 'ch2.magnitude',
    src: 'OpenStax University Physics Vol. 1 §2.2',
    title: 'Magnitude and coordinate direction angles',
    topics: ['vectors', 'components'],
    vars: {
      Fx: range(-12, 12, 1, 'm'),
      Fy: range(-12, 12, 1, 'm'),
      Fz: range(-12, 12, 1, 'm'),
    },
    derive: ($) => {
      const F = v($.Fx, $.Fy, $.Fz);
      const d = directionAngles(F);
      return { F: mag(F), alpha: d.alpha, beta: d.beta, gamma: d.gamma };
    },
    // atan2 of the other two components, against acos of the direction cosine.
    second: ($) => {
      const F = Math.hypot($.Fx, $.Fy, $.Fz);
      const ang = (along, other) => (Math.atan2(other, along) / DEG);
      return {
        F,
        alpha: ang($.Fx, Math.hypot($.Fy, $.Fz)),
        beta: ang($.Fy, Math.hypot($.Fx, $.Fz)),
        gamma: ang($.Fz, Math.hypot($.Fx, $.Fy)),
      };
    },
    valid: ($) => $.F > 2,
    text: (T) => `A displacement has components ${T.Fx} m, ${T.Fy} m and ${T.Fz} m. Find its magnitude and its coordinate direction angles.`,
    parts: [
      sym('Fsym', 'sqrt(Fx^2+Fy^2+Fz^2)', { Fx: 'm', Fy: 'm', Fz: 'm' }, ($) => $.F, { unit: 'm', label: 'magnitude as a formula' }),
      num('F', ($) => $.F, 'm', { label: 'magnitude' }),
      num('alpha', ($) => $.alpha, '°', { label: 'α', abs: 0.05 }),
      num('beta', ($) => $.beta, '°', { label: 'β', abs: 0.05 }),
      num('gamma', ($) => $.gamma, '°', { label: 'γ', abs: 0.05 }),
    ],
    hints: [
      String.raw`The magnitude is $\sqrt{r_x^2+r_y^2+r_z^2}$.`,
      String.raw`Each direction angle comes from a direction cosine: $\cos\alpha = r_x/r$.`,
    ],
    steps: ($) => [
      String.raw`$r = \sqrt{r_x^2+r_y^2+r_z^2} = ${texNum($.F)}\ \mathrm{m}$`,
      String.raw`$\alpha = ${texNum($.alpha)}^\circ$, $\beta = ${texNum($.beta)}^\circ$, $\gamma = ${texNum($.gamma)}^\circ$`,
    ],
    cases: [
      kase('hand', { Fx: 3, Fy: 4, Fz: 12 }, { F: 13, alpha: 76.6576, beta: 72.0798, gamma: 22.6199 }),
    ],
  }),

  problem({
    ...U,
    id: 'ch2.resultant',
    src: 'OpenStax University Physics Vol. 1 §2.3',
    title: 'Resultant of two forces',
    topics: ['vectors', 'resultant'],
    vars: {
      F1: range(10, 80, 5, 'N'),
      a1: range(0, 350, 10, '°'),
      F2: range(10, 80, 5, 'N'),
      a2: range(0, 350, 10, '°'),
    },
    derive: ($) => {
      const R = resultant(fromAngle2D($.F1, $.a1), fromAngle2D($.F2, $.a2));
      return { R: mag(R), th: angle2D(R) };
    },
    // Law of cosines on the angle between the forces, against adding components.
    second: ($) => {
      let between = Math.abs($.a1 - $.a2) % 360;
      if (between > 180) between = 360 - between;
      const Rx = $.F1 * Math.cos($.a1 * DEG) + $.F2 * Math.cos($.a2 * DEG);
      const Ry = $.F1 * Math.sin($.a1 * DEG) + $.F2 * Math.sin($.a2 * DEG);
      const R = Math.sqrt($.F1 ** 2 + $.F2 ** 2 + 2 * $.F1 * $.F2 * Math.cos(between * DEG));
      const th = ((Math.atan2(Ry, Rx) / DEG) + 360) % 360;
      return { R, th };
    },
    valid: ($) => $.R > 8,
    text: (T) => String.raw`Two forces act at a point: ${T.F1} N at ${T.a1}° from the $+x$ axis and ${T.F2} N at ${T.a2}°, both measured counterclockwise. Find the magnitude of the resultant and its direction from $+x$.`,
    parts: [
      num('R', ($) => $.R, 'N', { label: 'magnitude' }),
      num('th', ($) => $.th, '°', { label: 'direction', wrap: 360, abs: 0.08 }),
    ],
    hints: [
      'Add the components, or use the law of cosines on the angle between the two forces. The two routes agree.',
    ],
    steps: ($) => [
      String.raw`$R = \sqrt{F_1^2+F_2^2+2 F_1 F_2\cos\phi} = ${texNum($.R)}\ \mathrm{N}$`,
      String.raw`The resultant points at $${texNum($.th)}^\circ$ from $+x$.`,
    ],
    cases: [
      kase('hand', { F1: 40, a1: 0, F2: 30, a2: 90 }, { R: 50, th: 36.8699 }),
    ],
  }),

  problem({
    ...U,
    id: 'ch2.along',
    src: 'OpenStax University Physics Vol. 1 §2.2',
    title: 'Unit vector along a displacement',
    topics: ['vectors', 'unit-vector'],
    vars: {
      ax: range(-6, 6, 1, 'm'),
      ay: range(-6, 6, 1, 'm'),
      az: range(-6, 6, 1, 'm'),
      bx: range(-6, 6, 1, 'm'),
      by: range(-6, 6, 1, 'm'),
      bz: range(-6, 6, 1, 'm'),
    },
    derive: ($) => {
      const A = v($.ax, $.ay, $.az);
      const B = v($.bx, $.by, $.bz);
      const u = unitAB(A, B);
      return { L: mag(v($.bx - $.ax, $.by - $.ay, $.bz - $.az)), ux: u.x, uy: u.y, uz: u.z };
    },
    second: ($) => {
      const dx = $.bx - $.ax;
      const dy = $.by - $.ay;
      const dz = $.bz - $.az;
      const L = Math.hypot(dx, dy, dz);
      return { L, ux: dx / L, uy: dy / L, uz: dz / L };
    },
    valid: ($) => $.L > 1,
    text: (T) => `A point moves from A(${T.ax}, ${T.ay}, ${T.az}) m to B(${T.bx}, ${T.by}, ${T.bz}) m. Find the distance and the unit vector from A toward B.`,
    parts: [
      num('L', ($) => $.L, 'm', { label: 'distance' }),
      num('ux', ($) => $.ux, '', { label: String.raw`$u_x$`, abs: 0.002 }),
      num('uy', ($) => $.uy, '', { label: String.raw`$u_y$`, abs: 0.002 }),
      num('uz', ($) => $.uz, '', { label: String.raw`$u_z$`, abs: 0.002 }),
    ],
    hints: [
      String.raw`Subtract the coordinates first. Divide that displacement by its own length.`,
    ],
    steps: ($) => [
      String.raw`$L = ${texNum($.L)}\ \mathrm{m}$`,
      String.raw`$\hat u = (${texNum($.ux)},\ ${texNum($.uy)},\ ${texNum($.uz)})$`,
    ],
    cases: [
      kase('hand', { ax: 1, ay: 2, az: 2, bx: 4, by: 6, bz: 6 }, {
        L: 6.40312, ux: 0.468521, uy: 0.624695, uz: 0.624695,
      }),
    ],
  }),

  problem({
    ...U,
    id: 'ch2.between',
    src: 'OpenStax University Physics Vol. 1 §2.4',
    title: 'Angle between two vectors',
    topics: ['vectors', 'dot-product'],
    vars: {
      ax: range(-6, 6, 1, 'm'),
      ay: range(-6, 6, 1, 'm'),
      az: range(-6, 6, 1, 'm'),
      bx: range(-6, 6, 1, 'm'),
      by: range(-6, 6, 1, 'm'),
      bz: range(-6, 6, 1, 'm'),
    },
    derive: ($) => {
      const a = v($.ax, $.ay, $.az);
      const b = v($.bx, $.by, $.bz);
      return { theta: angleBetween(a, b) };
    },
    // atan2(|a × b|, a · b) distinguishes obtuse angles. acos of the cosine does too.
    second: ($) => {
      const a = v($.ax, $.ay, $.az);
      const b = v($.bx, $.by, $.bz);
      const theta = Math.atan2(mag(cross(a, b)), dot(a, b)) / DEG;
      return { theta };
    },
    valid: ($) => mag(v($.ax, $.ay, $.az)) > 0.5 && mag(v($.bx, $.by, $.bz)) > 0.5,
    text: (T) => String.raw`Find the angle between $\vec a = (${T.ax}, ${T.ay}, ${T.az})\ \mathrm{m}$ and $\vec b = (${T.bx}, ${T.by}, ${T.bz})\ \mathrm{m}$.`,
    parts: [
      num('theta', ($) => $.theta, '°', { label: 'angle', abs: 0.05 }),
    ],
    hints: [
      String.raw`$\cos\theta = \vec a\cdot\vec b\,/\,(|a||b|)$. The angle is between $0^\circ$ and $180^\circ$.`,
    ],
    steps: ($) => [
      String.raw`$\theta = ${texNum($.theta)}^\circ$`,
    ],
    cases: [
      kase('hand', { ax: 1, ay: 0, az: 0, bx: 1, by: 1, bz: 0 }, { theta: 45 }),
    ],
  }),

  problem({
    ...U,
    id: 'ch2.product',
    src: 'OpenStax University Physics Vol. 1 §2.4',
    title: 'Magnitude of a cross product',
    topics: ['vectors', 'cross-product'],
    vars: {
      ax: range(-6, 6, 1, 'm'),
      ay: range(-6, 6, 1, 'm'),
      az: range(-6, 6, 1, 'm'),
      bx: range(-6, 6, 1, 'm'),
      by: range(-6, 6, 1, 'm'),
      bz: range(-6, 6, 1, 'm'),
    },
    derive: ($) => ({ M: mag(cross(v($.ax, $.ay, $.az), v($.bx, $.by, $.bz))) }),
    // |a||b|sinθ from the dot product, against the magnitude of the determinant.
    second: ($) => {
      const a = v($.ax, $.ay, $.az);
      const b = v($.bx, $.by, $.bz);
      const ma = mag(a);
      const mb = mag(b);
      const c = dot(a, b) / (ma * mb);
      const s = Math.sqrt(Math.max(0, 1 - c * c));
      return { M: ma * mb * s };
    },
    valid: ($) => mag(v($.ax, $.ay, $.az)) > 0.5 && mag(v($.bx, $.by, $.bz)) > 0.5,
    text: (T) => String.raw`Find the magnitude of $\vec a \times \vec b$ for $\vec a = (${T.ax}, ${T.ay}, ${T.az})\ \mathrm{m}$ and $\vec b = (${T.bx}, ${T.by}, ${T.bz})\ \mathrm{m}$.`,
    parts: [
      num('M', ($) => $.M, 'm²', { label: String.raw`$|\vec a\times\vec b|$` }),
    ],
    hints: [
      String.raw`$|\vec a\times\vec b| = |a||b|\sin\theta$. The same number is the magnitude of the component determinant.`,
    ],
    steps: ($) => [
      String.raw`$|\vec a\times\vec b| = ${texNum($.M)}\ \mathrm{m}^2$`,
    ],
    cases: [
      kase('hand', { ax: 1, ay: 2, az: 3, bx: 4, by: 5, bz: 6 }, { M: 7.34847 }),
    ],
  }),
];
