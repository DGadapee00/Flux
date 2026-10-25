/** Ch 2 · Vectors. OpenStax University Physics Vol. 1, §§2.2–2.4. */
import {
  DEG, angle2D, angleBetween, cross, directionAngles, dot, fromAngle2D, mag, resultant, unitAB, v,
} from '@flux/subjects/mechanics/vectors.js';
import { choice, kase, mc, num, problem, range, sym, texNum } from '../kit.js';

const U = { exam: 'u1', ch: '2' };

export default [
  problem({
    ...U,
    id: 'ch2.magnitude',
    level: 1,
    variety: ['unknown'],
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
      kase('OpenStax University Physics Vol. 1 §2.2, "Magnitude and Direction of the Displacement Vector": D = (−4.0, 2.9) cm', { Fx: -4, Fy: 2.9, Fz: 0 }, { F: 4.94065, alpha: 144.0579, beta: 54.0579, gamma: 90 }, {
        note: 'The book prints D = 4.9 cm at 144.1° (it rounds the arctangent first).',
      }),
      kase('hand', { Fx: 3, Fy: 4, Fz: 12 }, { F: 13, alpha: 76.6576, beta: 72.0798, gamma: 22.6199 }),
    ],
  }),

  problem({
    ...U,
    id: 'ch2.resultant',
    level: 1,
    variety: ['unknown'],
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
      kase('OpenStax University Physics Vol. 1 §2.3, "The Tug-of-War Game" (the second question): Astro 160.0 N at 55° south of east, Clifford 140.0 N at 55° west of north', { F1: 160, a1: 305, F2: 140, a2: 145 }, { R: 55.6923, th: 245.7 }, {
        note: 'The book asks for the pull that balances these two: D = 55.7 N, 65.7° north of east. That is the same size as the resultant, pointing the opposite way (245.7° + 180° = 65.7° mod 360°).',
      }),
      kase('hand', { F1: 40, a1: 0, F2: 30, a2: 90 }, { R: 50, th: 36.8699 }),
    ],
  }),

  problem({
    ...U,
    id: 'ch2.along',
    level: 2,
    variety: ['unknown'],
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
      kase('OpenStax University Physics Vol. 1 §2.2, "Takeoff of a Drone": from (300, 200, 100) m to (1200, 2100, 250) m', { ax: 300, ay: 200, az: 100, bx: 1200, by: 2100, bz: 250 }, { L: 2107.72, ux: 0.427001, uy: 0.901446, uz: 0.0711668 }, {
        note: 'The book prints the displacement (900, 1900, 150) m and its magnitude, 2.11 km.',
      }),
      kase('hand', { ax: 1, ay: 2, az: 2, bx: 4, by: 6, bz: 6 }, {
        L: 6.40312, ux: 0.468521, uy: 0.624695, uz: 0.624695,
      }),
    ],
  }),

  problem({
    ...U,
    id: 'ch2.between',
    level: 2,
    variety: ['unknown'],
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
      kase('OpenStax University Physics Vol. 1 §2.4, "Angle between Two Forces": (10.0, −20.4, 2.0) N and (−15.0, 0, −6.2) N', { ax: 10, ay: -20.4, az: 2, bx: -15, by: 0, bz: -6.2 }, { theta: 116.0 }, {
        note: 'The book prints 116.0°.',
      }),
      kase('hand', { ax: 1, ay: 0, az: 0, bx: 1, by: 1, bz: 0 }, { theta: 45 }),
    ],
  }),

  problem({
    ...U,
    id: 'ch2.product',
    level: 2,
    variety: ['unknown'],
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
    valid: ($) => mag(v($.ax, $.ay, $.az)) > 0.2 && mag(v($.bx, $.by, $.bz)) > 0.5,
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
      kase('OpenStax University Physics Vol. 1 §2.4, "The Torque of a Force": R = 0.25 m, F = 20.00 N at 40° from R', { ax: 0.25, ay: 0, az: 0, bx: 15.3209, by: 12.8558, bz: 0 }, { M: 3.21394 }, {
        note: 'The book prints τ = 3.2 N·m, and 3.5 N·m at 45° (with the opposite sense).',
      }),
      kase('hand', { ax: 1, ay: 2, az: 3, bx: 4, by: 5, bz: 6 }, { M: 7.34847 }),
    ],
  }),

  problem({
    ...U,
    id: 'ch2.pointer',
    src: 'OpenStax University Physics Vol. 1 §2.2',
    title: 'Displacement of a pointer on a screen',
    topics: ['vectors', 'components'],
    level: 1,
    variety: ['representation'],
    vars: {
      x1: range(0, 8, 0.5, 'cm'),
      y1: range(0, 8, 0.5, 'cm'),
      x2: range(0, 8, 0.5, 'cm'),
      y2: range(0, 8, 0.5, 'cm'),
    },
    derive: ($) => {
      const D = v($.x2 - $.x1, $.y2 - $.y1, 0);
      return { Dx: D.x, Dy: D.y, D: mag(D), th: angle2D(D) };
    },
    // atan2 gives the quadrant; the principal arctangent plus a half turn when Dx < 0 does too.
    second: ($) => {
      const dx = $.x2 - $.x1;
      const dy = $.y2 - $.y1;
      const base = (Math.atan(dy / dx) / DEG);
      const th = dx < 0 ? base + 180 : dy < 0 ? base + 360 : base;
      return { Dx: dx, Dy: dy, D: Math.sqrt(dx * dx + dy * dy), th: ((th % 360) + 360) % 360 };
    },
    valid: ($) => Math.abs($.Dx) > 0.4 && Math.abs($.Dy) > 0.4 && $.D > 1,
    text: (T) => `A mouse pointer moves across a screen from (${T.x1} cm, ${T.y1} cm) to (${T.x2} cm, ${T.y2} cm). Find the components of its displacement, its magnitude, and its direction, measured counterclockwise from the +x axis between 0° and 360°.`,
    parts: [
      num('Dx', ($) => $.Dx, 'cm', { label: String.raw`$D_x$` }),
      num('Dy', ($) => $.Dy, 'cm', { label: String.raw`$D_y$` }),
      num('D', ($) => $.D, 'cm', { label: 'magnitude' }),
      num('th', ($) => $.th, '°', { label: 'direction', wrap: 360, abs: 0.1 }),
    ],
    hints: [
      'The displacement is the final position minus the initial position, component by component.',
      String.raw`The magnitude is $\sqrt{D_x^2+D_y^2}$. The direction is $\tan^{-1}(D_y/D_x)$, but check which quadrant the vector is in.`,
    ],
    steps: ($) => [
      String.raw`$D_x = ${texNum($.Dx)}\ \mathrm{cm}$, $D_y = ${texNum($.Dy)}\ \mathrm{cm}$`,
      String.raw`$D = ${texNum($.D)}\ \mathrm{cm}$ at $\theta = ${texNum($.th)}^\circ$`,
    ],
    cases: [
      kase('OpenStax University Physics Vol. 1 §2.2, "Magnitude and Direction of the Displacement Vector": (6.0, 1.6) cm to (2.0, 4.5) cm', { x1: 6, y1: 1.6, x2: 2, y2: 4.5 }, { Dx: -4, Dy: 2.9, D: 4.94065, th: 144.0368 }, {
        note: 'The book rounds the arctangent to −35.9° and adds 180° to get 144.1°. Unrounded it is 144.04°.',
      }),
    ],
  }),

  problem({
    ...U,
    id: 'ch2.three',
    src: 'OpenStax University Physics Vol. 1 §2.3',
    title: 'Sum of three vectors from magnitudes and angles',
    topics: ['vectors', 'resultant', 'components'],
    level: 2,
    variety: ['unknown'],
    vars: {
      A: range(5, 12, 1, 'cm'),
      a: range(10, 80, 5, '°'),
      B: range(5, 12, 1, 'cm'),
      b: range(-170, -20, 10, '°'),
      C: range(5, 12, 1, 'cm'),
      c: range(0, 70, 5, '°'),
    },
    derive: ($) => {
      const R = resultant(fromAngle2D($.A, $.a), fromAngle2D($.B, $.b), fromAngle2D($.C, $.c));
      return { Rx: R.x, Ry: R.y, R: mag(R), th: angle2D(R) };
    },
    // Each component by hand, then the magnitude by the law of cosines on the partial sum.
    second: ($) => {
      const Rx = $.A * Math.cos($.a * DEG) + $.B * Math.cos($.b * DEG) + $.C * Math.cos($.c * DEG);
      const Ry = $.A * Math.sin($.a * DEG) + $.B * Math.sin($.b * DEG) + $.C * Math.sin($.c * DEG);
      return { Rx, Ry, R: Math.sqrt(Rx * Rx + Ry * Ry), th: ((Math.atan2(Ry, Rx) / DEG) + 360) % 360 };
    },
    valid: ($) => $.R > 3,
    text: (T) => `Three displacements lie in a plane. A = ${T.A} cm at ${T.a}°, B = ${T.B} cm at ${T.b}°, and C = ${T.C} cm at ${T.c}°, all measured from the +x axis (positive is counterclockwise). Find the components of the sum R = A + B + C, its magnitude, and its direction between 0° and 360°.`,
    parts: [
      num('Rx', ($) => $.Rx, 'cm', { label: String.raw`$R_x$` }),
      num('Ry', ($) => $.Ry, 'cm', { label: String.raw`$R_y$` }),
      num('R', ($) => $.R, 'cm', { label: 'magnitude' }),
      num('th', ($) => $.th, '°', { label: 'direction', wrap: 360, abs: 0.1 }),
    ],
    hints: [
      'Resolve each vector into x and y components with its magnitude and angle. Add the x components and add the y components.',
      'A negative angle points below the +x axis. Keep its sign: the sine of a negative angle is negative.',
    ],
    steps: ($) => [
      String.raw`$R_x = \sum A\cos\theta = ${texNum($.Rx)}\ \mathrm{cm}$, $R_y = \sum A\sin\theta = ${texNum($.Ry)}\ \mathrm{cm}$`,
      String.raw`$R = ${texNum($.R)}\ \mathrm{cm}$ at $${texNum($.th)}^\circ$`,
    ],
    cases: [
      kase('OpenStax University Physics Vol. 1 §2.3, "Analytical Computation of a Resultant": A = 10.0 at 35°, B = 7.0 at −110°, C = 8.0 at 30°', { A: 10, a: 35, B: 7, b: -110, C: 8, c: 30 }, { Rx: 12.7256, Ry: 3.1578, R: 13.1119, th: 13.9367 }, {
        note: 'The book rounds each component to 0.01 cm before adding and prints R = (12.7, 3.1) cm. Unrounded, Ry is 3.16 cm.',
      }),
    ],
  }),

  problem({
    ...U,
    id: 'ch2.tug',
    src: 'OpenStax University Physics Vol. 1 §2.3',
    title: 'The pull that balances three pulls',
    topics: ['vectors', 'resultant', 'components'],
    level: 3,
    variety: ['representation', 'unknown'],
    vars: {
      A: range(100, 200, 10, 'N'),
      al: range(20, 70, 5, '°'),
      B: range(100, 220, 10, 'N'),
      be: range(20, 70, 5, '°'),
      C: range(100, 200, 10, 'N'),
      ga: range(20, 70, 5, '°'),
    },
    derive: ($) => {
      // Directions as compass bearings become angles from +x (east): south of east, east of north, west of north.
      const R = resultant(fromAngle2D($.A, -$.al), fromAngle2D($.B, 90 - $.be), fromAngle2D($.C, 90 + $.ga));
      const D = v(-R.x, -R.y, 0);
      return { Dx: D.x, Dy: D.y, D: mag(D), th: angle2D(D), south: Math.abs(angle2D(D) - 180) };
    },
    // The balancing force makes the sum zero: add all four and see nothing is left.
    second: ($) => {
      const sx = $.A * Math.cos($.al * DEG) + $.B * Math.sin($.be * DEG) - $.C * Math.sin($.ga * DEG);
      const sy = -$.A * Math.sin($.al * DEG) + $.B * Math.cos($.be * DEG) + $.C * Math.cos($.ga * DEG);
      const Dx = -sx;
      const Dy = -sy;
      return { Dx, Dy, D: Math.hypot(Dx, Dy), th: ((Math.atan2(Dy, Dx) / DEG) + 360) % 360, south: Math.abs(((Math.atan2(Dy, Dx) / DEG) + 360) % 360 - 180) };
    },
    valid: ($) => $.D > 20,
    text: (T) => `Three dogs pull on a toy. Astro pulls ${T.A} N in a direction ${T.al}° south of east. Balto pulls ${T.B} N in a direction ${T.be}° east of north. Clifford pulls ${T.C} N in a direction ${T.ga}° west of north. A fourth dog pulls so that the toy does not move. Take east as +x and north as +y. Find the components of the fourth dog’s pull, its magnitude, and its direction from +x, between 0° and 360°.`,
    parts: [
      num('Dx', ($) => $.Dx, 'N', { label: String.raw`$D_x$` }),
      num('Dy', ($) => $.Dy, 'N', { label: String.raw`$D_y$` }),
      num('D', ($) => $.D, 'N', { label: 'magnitude' }),
      num('th', ($) => $.th, '°', { label: 'direction', wrap: 360, abs: 0.1 }),
    ],
    hints: [
      'Turn each compass direction into an angle from the +x axis: south of east is negative, east of north is 90° minus the angle, west of north is 90° plus it.',
      'If the toy does not move, the four forces add to zero. The fourth force is the negative of the sum of the other three.',
    ],
    steps: ($) => [
      String.raw`$D_x = -\sum F_x = ${texNum($.Dx)}\ \mathrm{N}$, $D_y = -\sum F_y = ${texNum($.Dy)}\ \mathrm{N}$`,
      String.raw`$D = ${texNum($.D)}\ \mathrm{N}$ at $${texNum($.th)}^\circ$ from $+x$`,
    ],
    cases: [
      kase('OpenStax University Physics Vol. 1 §2.3, "The Tug-of-War Game": 160.0 N at 55° S of E, 200.0 N at 60° E of N, 140.0 N at 55° W of N', { A: 160, al: 55, B: 200, be: 60, C: 140, ga: 55 }, { Dx: -150.29, Dy: -49.24, D: 158.14, th: 198.1 }, {
        note: 'The book prints D = 158.1 N, 18.1° south of west, which is 198.1° from +x.',
      }),
    ],
  }),

  problem({
    ...U,
    id: 'ch2.concept-quantity',
    src: 'OpenStax University Physics Vol. 1 §2.1',
    title: 'Vector or scalar?',
    kind: 'conceptual',
    level: 1,
    topics: ['vectors', 'scalars'],
    variety: ['configuration'],
    vars: {
      q: choice(
        [1, 'the displacement of a ladybug, 12 cm to the left'],
        [2, 'the distance the ladybug walked, 12 cm'],
        [3, 'the velocity of a car, 20 m/s due north'],
        [4, 'the speed of the car, 20 m/s'],
        [5, 'the temperature of a room, 21 °C'],
        [6, 'the weight of a book, 8 N downward'],
      ),
    },
    derive: ($) => ({ kind: [1, 3, 6].includes($.q) ? 'vector' : 'scalar' }),
    second: ($) => ({ ans: { 1: 'vector', 2: 'scalar', 3: 'vector', 4: 'scalar', 5: 'scalar', 6: 'vector' }[$.q] }),
    text: (T) => `Is ${T.q} a vector or a scalar quantity?`,
    parts: [
      mc('ans', ($) => {
        const vec = [1, 3, 6].includes($.q);
        const why = {
          1: 'A displacement says how far and in which direction, so it needs both.',
          2: 'A distance is a length with no direction, so it is a scalar.',
          3: 'A velocity includes the direction of the motion, so it is a vector.',
          4: 'A speed is the magnitude of the velocity and has no direction.',
          5: 'A temperature has a size and no direction.',
          6: 'A weight is a force, and a force has a direction.',
        }[$.q];
        return [
          ['vector', 'A vector', vec ? `Right: ${why}` : `Not quite: ${why}`],
          ['scalar', 'A scalar', vec ? `Not quite: ${why}` : `Right: ${why}`],
        ];
      }, ($) => $.kind, { label: 'the quantity' }),
    ],
    hints: [
      'A vector needs a direction as well as a size. A scalar needs only a size.',
      'Ask whether the statement would be complete without a direction.',
    ],
    steps: ($) => [String.raw`${$.kind === 'vector' ? 'It has a direction as well as a size, so it is a vector.' : 'It has only a size, so it is a scalar.'}`],
    cases: [
      kase('OpenStax University Physics Vol. 1 §2.1, "A Ladybug Walker": displacement is a vector, distance a scalar', { q: 1 }, { ans: 'vector' }),
      kase('OpenStax University Physics Vol. 1 §2.1, "A Ladybug Walker": the distance walked', { q: 2 }, { ans: 'scalar' }),
    ],
  }),

  problem({
    ...U,
    id: 'ch2.concept-products',
    src: 'OpenStax University Physics Vol. 1 §2.4',
    title: 'The dot and cross products at an angle',
    kind: 'conceptual',
    level: 2,
    topics: ['vectors', 'dot-product', 'cross-product'],
    variety: ['configuration'],
    vars: {
      ang: choice([0, '0°'], [30, '30°'], [90, '90°'], [150, '150°'], [180, '180°']),
    },
    derive: ($) => {
      const c = Math.cos($.ang * DEG);
      const s = Math.sin($.ang * DEG);
      return {
        sign: Math.abs(c) < 1e-9 ? 'zero' : c > 0 ? 'positive' : 'negative',
        cross: Math.abs(s) < 1e-9 ? 'zero' : Math.abs(s) > 1 - 1e-9 ? 'max' : 'between',
      };
    },
    second: ($) => ({
      sign: { 0: 'positive', 30: 'positive', 90: 'zero', 150: 'negative', 180: 'negative' }[$.ang],
      cross: { 0: 'zero', 30: 'between', 90: 'max', 150: 'between', 180: 'zero' }[$.ang],
    }),
    text: (T) => `Two nonzero vectors a and b make an angle of ${T.ang} with each other. Say what the sign of a·b is, and how big |a × b| is compared with what it can be.`,
    parts: [
      mc('sign', ($) => {
        const right = Math.abs(Math.cos($.ang * DEG)) < 1e-9 ? 'zero' : Math.cos($.ang * DEG) > 0 ? 'positive' : 'negative';
        const note = {
          positive: 'a·b = ab cos φ, and cos φ is positive below 90°.',
          negative: 'a·b = ab cos φ, and cos φ is negative between 90° and 180°.',
          zero: 'a·b = ab cos φ, and cos 90° = 0.',
        }[right];
        return [
          ['positive', 'a·b is positive', right === 'positive' ? `Right: ${note}` : `Check the cosine at this angle: ${note}`],
          ['zero', 'a·b is zero', right === 'zero' ? `Right: ${note}` : `Check the cosine at this angle: ${note}`],
          ['negative', 'a·b is negative', right === 'negative' ? `Right: ${note}` : `Check the cosine at this angle: ${note}`],
        ];
      }, ($) => $.sign, { label: 'the dot product' }),
      mc('cross', ($) => {
        const s = Math.abs(Math.sin($.ang * DEG));
        const right = s < 1e-9 ? 'zero' : s > 1 - 1e-9 ? 'max' : 'between';
        const note = {
          zero: '|a × b| = ab |sin φ|, and sin 0° = sin 180° = 0: parallel and antiparallel vectors span no area.',
          max: '|a × b| = ab |sin φ| is largest, ab, when sin φ = 1, at 90°.',
          between: '|a × b| = ab |sin φ|, and |sin φ| is strictly between 0 and 1 at this angle.',
        }[right];
        return [
          ['zero', 'zero', right === 'zero' ? `Right: ${note}` : `Not zero: ${note}`],
          ['between', 'not zero, and less than ab', right === 'between' ? `Right: ${note}` : `Look at the sine: ${note}`],
          ['max', 'as big as it can be, ab', right === 'max' ? `Right: ${note}` : `Look at the sine: ${note}`],
        ];
      }, ($) => $.cross, { label: 'the cross product' }),
    ],
    hints: [
      String.raw`The dot product is $ab\cos\varphi$ and the size of the cross product is $ab\sin\varphi$.`,
      'Picture the angle: parallel, at a right angle, past a right angle, or pointing opposite.',
    ],
    steps: ($) => [String.raw`$\cos${$.ang}^\circ = ${texNum(Math.cos($.ang * DEG), 3)}$ and $\sin${$.ang}^\circ = ${texNum(Math.sin($.ang * DEG), 3)}$ decide both answers.`],
    cases: [
      kase('OpenStax University Physics Vol. 1 §2.4: A·B = AB cos φ is negative for 90° < φ ≤ 180° and zero at 90°', { ang: 150 }, { sign: 'negative', cross: 'between' }),
      kase('OpenStax University Physics Vol. 1 §2.4: the scalar product of orthogonal vectors vanishes', { ang: 90 }, { sign: 'zero', cross: 'max' }),
    ],
  }),

  problem({
    ...U,
    id: 'ch2.concept-sum',
    src: 'OpenStax University Physics Vol. 1 §2.3',
    title: 'Adding lengths is not adding vectors',
    kind: 'conceptual',
    level: 2,
    lab: 'vectors',
    topics: ['vectors', 'resultant'],
    variety: ['configuration'],
    sim: {
      scenario: 'right',
      setup: (st, $) => {
        const phi = { 1: 0, 2: 180, 3: 90, 4: 60 }[$.rel] * DEG;
        st.a = { x: 3, y: 0 };
        st.b = { x: 4 * Math.cos(phi), y: 4 * Math.sin(phi) };
      },
    },
    vars: {
      rel: choice([1, 'point the same way'], [2, 'point opposite ways'], [3, 'are at a right angle'], [4, 'are at 60° to each other']),
    },
    derive: ($) => ({ ans: { 1: 'sum', 2: 'diff', 3: 'less', 4: 'less' }[$.rel] }),
    // The exact length of the sum for |a| = 3 and |b| = 4, then compared with 3 + 4 and 4 − 3.
    second: ($) => {
      const phi = { 1: 0, 2: 180, 3: 90, 4: 60 }[$.rel] * DEG;
      const len = Math.sqrt(9 + 16 + 24 * Math.cos(phi));
      return { ans: Math.abs(len - 7) < 1e-9 ? 'sum' : Math.abs(len - 1) < 1e-9 ? 'diff' : 'less' };
    },
    text: (T) => `Two vectors have lengths |a| = 3 m and |b| = 4 m, and they ${T.rel}. What is the length of a + b?`,
    parts: [
      mc('ans', ($) => {
        const right = { 1: 'sum', 2: 'diff', 3: 'less', 4: 'less' }[$.rel];
        const note = {
          sum: 'Parallel vectors add their lengths: 3 + 4 = 7 m.',
          diff: 'Antiparallel vectors subtract: 4 − 3 = 1 m.',
          less: String.raw`The length comes from the law of cosines, $\sqrt{a^2+b^2+2ab\cos\varphi}$, which is between 1 m and 7 m here.`,
        }[right];
        return [
          ['sum', '7 m, the sum of the lengths', right === 'sum' ? `Right: ${note}` : note],
          ['diff', '1 m, the difference of the lengths', right === 'diff' ? `Right: ${note}` : note],
          ['less', 'Between 1 m and 7 m', right === 'less' ? `Right: ${note}` : note],
        ];
      }, ($) => $.ans, { label: 'the length of the sum' }),
    ],
    hints: [
      'Vectors add by components, so their lengths add only when they point the same way.',
      String.raw`The length of the sum is $\sqrt{a^2 + b^2 + 2ab\cos\varphi}$ for the angle $\varphi$ between the vectors.`,
    ],
    steps: ($) => [String.raw`${{ sum: 'They point the same way, so the lengths add: 7 m.', diff: 'They point opposite ways, so the shorter takes away from the longer: 1 m.', less: 'At this angle part of one cancels part of the other, so the sum is shorter than 7 m and longer than 1 m.' }[$.ans]}`],
    cases: [
      kase('OpenStax University Physics Vol. 1 §2.3: parallel vectors add their magnitudes', { rel: 1 }, { ans: 'sum' }),
      kase('OpenStax University Physics Vol. 1 §2.3, "Geometric Construction of the Resultant": a 3–4–5 pair at a right angle gives 5 m, not 7 m', { rel: 3 }, { ans: 'less' }),
    ],
  }),
];
