/**
 * Plane-stress transformation, principals, combined stress on a circular bar,
 * a trailer-ball shank in ksi, Tresca against von Mises, the circle read backwards, the largest
 * shear of all, and brittle fracture by Coulomb–Mohr.
 */
import { N_PER_LBF, PA_PER_PSI } from '@flux/subjects/convert.js';
import {
  circleSection, combinedCircle, combinedReduced, hitchSides, principal2, traction, transform,
  trescaPlane, vonMisesPlane,
} from '@flux/subjects/mechanics/materials.js';
import { absMaxShear, coulombMohrFS, maxNormalFS } from '@flux/subjects/mechanics/failure.js';
import { HITCH_ARM, HITCH_D } from '../../data/hitch.js';
import { choice, cite, kase, mc, num, problem, range } from '../kit.js';

const MPA = 1e6;
const KSI = 1000 * PA_PER_PSI;
const DEG = Math.PI / 180;

/** The in-plane radius from the eigenvalues, a second route to R. */
const eigenR = ($) => {
  const avg = ($.sx + $.sy) / 2;
  const det = $.sx * $.sy - $.txy * $.txy;
  return Math.sqrt(Math.max(0, avg * avg - det)) / MPA;
};

const rel = (a, b) => Math.abs(a - b) > 0.05 * Math.max(Math.abs(a), Math.abs(b), 1e-9);

const ch9 = [
  problem({
    id: 'u5.9.rotate',
    title: 'Stress on a turned plane',
    exam: 'u5',
    ch: '9',
    lab: 'mohr',
    src: cite('stress-transformation'),
    topics: ['stress-transformation'],
    variety: ['unknown'],
    level: 1,
    vars: {
      sx: range(40, 120, 5, 'MPa', MPA),
      sy: range(-40, 80, 10, 'MPa', MPA),
      txy: range(10, 60, 5, 'MPa', MPA),
      theta: range(15, 75, 5, '°', 1),
    },
    valid: ($) => {
      const right = transform($.sx, $.sy, $.txy, $.theta);
      const once = transform($.sx, $.sy, $.txy, $.theta / 2);
      const noShear = ($.sx + $.sy) / 2 + (($.sx - $.sy) / 2) * Math.cos(2 * $.theta * DEG);
      return rel(right.sx, once.sx) && rel(right.sx, noShear) && rel(right.txy, once.txy);
    },
    text: (T) => String.raw`Plane stress: $\sigma_x = ${T.sx}$ MPa, $\sigma_y = ${T.sy}$ MPa, $\tau_{xy} = ${T.txy}$ MPa. The element is turned ${T.theta}° counterclockwise. Find $\sigma_{x'}$ and $\tau_{x'y'}$.`,
    parts: [
      num('sx', ($) => transform($.sx, $.sy, $.txy, $.theta).sx, 'MPa', {
        scale: MPA,
        label: 'normal stress',
        traps: [
          [($) => transform($.sx, $.sy, $.txy, $.theta / 2).sx, 'The double-angle formulas use $2\\theta$, not $\\theta$.'],
          [($) => ($.sx + $.sy) / 2 + (($.sx - $.sy) / 2) * Math.cos(2 * $.theta * DEG), 'The $\\tau_{xy}\\sin 2\\theta$ term was left out of the normal stress.'],
        ],
      }),
      num('txy', ($) => transform($.sx, $.sy, $.txy, $.theta).txy, 'MPa', {
        scale: MPA,
        label: 'shear stress',
        traps: [
          [($) => transform($.sx, $.sy, $.txy, $.theta / 2).txy, 'Shear also turns with $2\\theta$.'],
          [($) => $.txy * Math.cos(2 * $.theta * DEG), 'That keeps only the $\\tau_{xy}\\cos 2\\theta$ term. The $(\\sigma_x-\\sigma_y)$ term is still there.'],
        ],
      }),
    ],
    hints: [
      'The normal and the shear on the turned plane both depend on twice the angle.',
      String.raw`Add $(\sigma_x-\sigma_y)/2 \cdot \cos 2\theta$ and $\tau_{xy}\sin 2\theta$ to the average stress. Shear is $-(\sigma_x-\sigma_y)/2 \cdot \sin 2\theta + \tau_{xy}\cos 2\theta$.`,
    ],
    steps: ($, sig) => {
      const t = transform($.sx, $.sy, $.txy, $.theta);
      return [
        String.raw`$\sigma_{x'} = ${sig(t.sx / MPA)}$ MPa.`,
        String.raw`$\tau_{x'y'} = ${sig(t.txy / MPA)}$ MPa.`,
      ];
    },
    second: ($) => {
      const t = traction($.sx, $.sy, $.txy, $.theta);
      return { sx: t.sx / MPA, txy: t.txy / MPA };
    },
    sim: {
      scenario: 'general',
      setup(s, $) {
        s.sx = $.sx;
        s.sy = $.sy;
        s.txy = $.txy;
        s.theta = $.theta;
      },
      read: (c) => ({ sx: c.sx, txy: c.txy }),
    },
    cases: [kase(cite('stress-transformation'), { sx: 80, sy: 20, txy: 30, theta: 45 }, { sx: 80, txy: -30 })],
  }),

  problem({
    id: 'u5.9.principal',
    title: 'The two principal stresses',
    exam: 'u5',
    ch: '9',
    lab: 'mohr',
    src: cite('mohr'),
    topics: ['mohr'],
    variety: ['representation'],
    level: 2,
    vars: {
      sx: range(40, 140, 10, 'MPa', MPA),
      sy: range(-20, 80, 10, 'MPa', MPA),
      txy: range(10, 50, 5, 'MPa', MPA),
    },
    valid: ($) => {
      const p = principal2($.sx, $.sy, $.txy);
      return rel(p.s1, p.avg) && rel(p.s1, p.s2);
    },
    text: (T) => String.raw`Plane stress: $\sigma_x = ${T.sx}$ MPa, $\sigma_y = ${T.sy}$ MPa, $\tau_{xy} = ${T.txy}$ MPa. Find the two principal stresses.`,
    parts: [
      num('s1', ($) => principal2($.sx, $.sy, $.txy).s1, 'MPa', {
        scale: MPA,
        label: 'larger principal',
        traps: [
          [($) => principal2($.sx, $.sy, $.txy).avg, 'That is the average, $(\\sigma_x+\\sigma_y)/2$. The radius of the circle still has to be added.'],
          [($) => principal2($.sx, $.sy, $.txy).s2, 'That is the smaller principal. $\\sigma_1$ is the average plus the radius.'],
        ],
      }),
      num('s2', ($) => principal2($.sx, $.sy, $.txy).s2, 'MPa', {
        scale: MPA,
        label: 'smaller principal',
        traps: [
          [($) => principal2($.sx, $.sy, $.txy).s1, 'That is the larger principal.'],
          [($) => principal2($.sx, $.sy, $.txy).avg, 'That is the center of the circle, not $\\sigma_2$.'],
        ],
      }),
    ],
    hints: [
      'The principals sit one radius either side of the average normal stress. Shear is zero on those planes.',
      String.raw`$\sigma_{1,2} = (\sigma_x+\sigma_y)/2 \pm \sqrt{[(\sigma_x-\sigma_y)/2]^2 + \tau_{xy}^2}$.`,
    ],
    steps: ($, sig) => {
      const p = principal2($.sx, $.sy, $.txy);
      return [
        String.raw`Center ${sig(p.avg / MPA)} MPa, radius ${sig(p.R / MPA)} MPa.`,
        String.raw`$\sigma_1 = ${sig(p.s1 / MPA)}$ MPa and $\sigma_2 = ${sig(p.s2 / MPA)}$ MPa.`,
      ];
    },
    second: ($) => {
      const avg = ($.sx + $.sy) / 2;
      const R = Math.sqrt(Math.max(0, avg * avg - ($.sx * $.sy - $.txy * $.txy)));
      return { s1: (avg + R) / MPA, s2: (avg - R) / MPA };
    },
    sim: {
      scenario: 'general',
      setup(s, $) {
        s.sx = $.sx;
        s.sy = $.sy;
        s.txy = $.txy;
        s.theta = 0;
      },
      read: (c) => ({ s1: c.s1, s2: c.s2 }),
    },
    cases: [kase(cite('mohr'), { sx: 80, sy: 20, txy: 30 }, { s1: 92.42640687119285, s2: 7.573593128807147 })],
  }),

  problem({
    id: 'u5.9.shear',
    title: 'The largest in-plane shear',
    exam: 'u5',
    ch: '9',
    lab: 'mohr',
    src: cite('mohr'),
    topics: ['max-shear'],
    variety: ['unknown'],
    level: 2,
    vars: {
      sx: range(40, 140, 10, 'MPa', MPA),
      sy: range(-20, 80, 10, 'MPa', MPA),
      txy: range(15, 55, 5, 'MPa', MPA),
    },
    valid: ($) => {
      const p = principal2($.sx, $.sy, $.txy);
      const forgot = Math.abs($.sx - $.sy) / 2;
      return rel(p.R, forgot) && rel(p.R, 2 * p.R);
    },
    text: (T) => String.raw`Plane stress: $\sigma_x = ${T.sx}$ MPa, $\sigma_y = ${T.sy}$ MPa, $\tau_{xy} = ${T.txy}$ MPa. Find the largest in-plane shear stress.`,
    parts: [
      num('R', ($) => principal2($.sx, $.sy, $.txy).R, 'MPa', {
        scale: MPA,
        label: 'maximum in-plane shear',
        traps: [
          [($) => Math.abs($.sx - $.sy) / 2, 'That drops $\\tau_{xy}$. The radius is $\\sqrt{[(\\sigma_x-\\sigma_y)/2]^2+\\tau_{xy}^2}$.'],
          [($) => principal2($.sx, $.sy, $.txy).s1 - principal2($.sx, $.sy, $.txy).s2, 'That is $\\sigma_1-\\sigma_2$. The largest in-plane shear is half of it.'],
        ],
      }),
    ],
    hints: [
      'The largest in-plane shear is the radius of Mohr\'s circle. It acts 45° from the principal planes.',
      String.raw`$\tau_{max} = \sqrt{[(\sigma_x-\sigma_y)/2]^2 + \tau_{xy}^2}$.`,
    ],
    steps: ($, sig) => [
      String.raw`Half the difference of the normals: $(\sigma_x - \sigma_y)/2 = ${sig(($.sx - $.sy) / 2 / MPA)}$ MPa.`,
      String.raw`The circle's radius combines it with $\tau_{xy}$: $R = \sqrt{${sig(($.sx - $.sy) / 2 / MPA)}^2 + ${sig($.txy / MPA)}^2}$.`,
      String.raw`$\tau_{max} = R = ${sig(principal2($.sx, $.sy, $.txy).R / MPA)}$ MPa, on planes 45° from the principal ones.`,
    ],
    second: ($) => {
      const avg = ($.sx + $.sy) / 2;
      const R = Math.sqrt(Math.max(0, avg * avg - ($.sx * $.sy - $.txy * $.txy)));
      return { R: R / MPA };
    },
    sim: {
      scenario: 'general',
      setup(s, $) {
        s.sx = $.sx;
        s.sy = $.sy;
        s.txy = $.txy;
        s.theta = 0;
      },
      read: (c) => ({ R: c.R }),
    },
    cases: [kase(cite('mohr'), { sx: 80, sy: 20, txy: 30 }, { R: 42.42640687119285 })],
  }),

  problem({
    id: 'u5.9.combined',
    title: 'Bending and torque on a circular bar',
    exam: 'u5',
    ch: '9',
    lab: 'combined',
    src: cite('combined-loading'),
    topics: ['combined-loading'],
    variety: ['configuration'],
    level: 2,
    vars: {
      P: range(0, 30, 5, 'kN', 1e3),
      M: range(150, 600, 50, 'N·m', 1),
      T: range(100, 500, 50, 'N·m', 1),
      d: range(30, 60, 5, 'mm', 1e-3),
    },
    valid: ($) => {
      const red = combinedReduced($.P, $.M, $.T, $.d);
      return Math.abs(red.bend) > 0.2 * Math.abs(red.sx)
        && Math.abs(red.axial) > 0.08 * Math.abs(red.sx)
        && Math.abs(red.txy) > 1e6;
    },
    text: (T) => String.raw`A solid circular bar of diameter ${T.d} mm carries an axial tension of ${T.P} kN, a bending moment of ${T.M} N·m and a torque of ${T.T} N·m. At the outer fiber where the bending stress is largest, find $\sigma_x$ and $\tau_{xy}$.`,
    parts: [
      num('sx', ($) => combinedCircle($.P, $.M, $.T, $.d).sx, 'MPa', {
        scale: MPA,
        label: 'normal stress',
        traps: [
          [($) => combinedReduced($.P, $.M, $.T, $.d).bend, 'That is the bending stress alone. The axial force still adds $P/A$.'],
          [($) => combinedReduced($.P, $.M, $.T, $.d).axial, 'That is $P/A$. The moment still adds $Mc/I$.'],
        ],
      }),
      num('txy', ($) => combinedCircle($.P, $.M, $.T, $.d).txy, 'MPa', {
        scale: MPA,
        label: 'shear stress',
        traps: [
          [($) => ($.T * ($.d / 2)) / circleSection($.d).I, 'Torque was divided by $I$. A circular section has $J = 2I$.'],
          [($) => combinedReduced($.P, $.M, $.T, $.d).bend, 'That is the bending stress. Shear from torque is $Tc/J$.'],
        ],
      }),
    ],
    hints: [
      'Normal stress at that fiber is the axial stress plus the bending stress. Shear there is the torsion stress. They use different section properties.',
      String.raw`$\sigma_x = 4P/(\pi d^2) + 32M/(\pi d^3)$. $\tau_{xy} = 16T/(\pi d^3)$.`,
    ],
    steps: ($, sig) => {
      const s = combinedCircle($.P, $.M, $.T, $.d);
      return [
        String.raw`$\sigma_x = ${sig(s.sx / MPA)}$ MPa.`,
        String.raw`$\tau_{xy} = ${sig(s.txy / MPA)}$ MPa.`,
      ];
    },
    second: ($) => {
      const red = combinedReduced($.P, $.M, $.T, $.d);
      return { sx: red.sx / MPA, txy: red.txy / MPA };
    },
    sim: {
      scenario: 'both',
      setup(s, $) {
        s.P = $.P;
        s.M = $.M;
        s.T = $.T;
        s.d = $.d;
      },
      read: (c) => ({ sx: c.sx, txy: c.txy }),
    },
    cases: [kase(cite('combined-loading'), { P: 10, M: 400, T: 300, d: 40 }, { sx: 71.6197243913529, txy: 23.8732414637843 })],
  }),

  problem({
    id: 'u5.9.torque',
    title: 'Torque that reaches a von Mises limit',
    exam: 'u5',
    ch: '9',
    lab: 'combined',
    src: cite('yield'),
    topics: ['yield'],
    variety: ['unknown'],
    level: 3,
    vars: {
      P: range(0, 20, 5, 'kN', 1e3),
      M: range(100, 400, 50, 'N·m', 1),
      d: range(40, 60, 5, 'mm', 1e-3),
      allow: range(80, 180, 10, 'MPa', MPA),
    },
    valid: ($) => {
      const sx = combinedReduced($.P, $.M, 0, $.d).sx;
      if (!(Math.abs($.allow) > Math.abs(sx) * 1.08)) return false;
      const tau = Math.sqrt(($.allow ** 2 - sx ** 2) / 3);
      const T = (tau * Math.PI * $.d ** 3) / 16;
      const forgot = (Math.sqrt($.allow ** 2 - sx ** 2) * Math.PI * $.d ** 3) / 16;
      const ignore = ($.allow * Math.PI * $.d ** 3) / 16;
      return rel(T, forgot) && rel(T, ignore) && rel(forgot, ignore);
    },
    text: (T) => String.raw`A solid circular bar of diameter ${T.d} mm already carries an axial tension of ${T.P} kN and a bending moment of ${T.M} N·m. How much torque brings the von Mises stress at the outer fiber to ${T.allow} MPa? $\sigma_y = 0$ at that fiber.`,
    parts: [
      num('T', ($) => {
        const sx = combinedReduced($.P, $.M, 0, $.d).sx;
        const tau = Math.sqrt(($.allow ** 2 - sx ** 2) / 3);
        return (tau * Math.PI * $.d ** 3) / 16;
      }, 'N·m', {
        label: 'torque',
        traps: [
          [($) => {
            const sx = combinedReduced($.P, $.M, 0, $.d).sx;
            return (Math.sqrt($.allow ** 2 - sx ** 2) * Math.PI * $.d ** 3) / 16;
          }, 'The 3 in $\\sigma^2 + 3\\tau^2$ was left out, so the shear came out $\\sqrt{3}$ times too large.'],
          [($) => ($.allow * Math.PI * $.d ** 3) / 16, 'That sets the shear equal to the allowable and ignores the normal stress already on the fiber.'],
        ],
      }),
    ],
    hints: [
      'Find the normal stress from the axial force and the moment first. The torque is the only unknown in the von Mises expression.',
      String.raw`With $\sigma_y = 0$, $\sigma_{vm}^2 = \sigma_x^2 + 3\tau^2$. Then $T = \tau \pi d^3/16$.`,
    ],
    steps: ($, sig) => {
      const sx = combinedReduced($.P, $.M, 0, $.d).sx;
      const tau = Math.sqrt(($.allow ** 2 - sx ** 2) / 3);
      const T = (tau * Math.PI * $.d ** 3) / 16;
      return [
        String.raw`$\sigma_x = ${sig(sx / MPA)}$ MPa, so $\tau = ${sig(tau / MPA)}$ MPa.`,
        String.raw`$T = ${sig(T)}$ N·m.`,
      ];
    },
    second: ($) => {
      const { A, I, J, c } = circleSection($.d);
      const sx = $.P / A + ($.M * c) / I;
      const tau = Math.sqrt(($.allow ** 2 - sx ** 2) / 3);
      return { T: (tau * J) / c };
    },
    sim: {
      scenario: 'both',
      setup(s, $) {
        const sx = combinedReduced($.P, $.M, 0, $.d).sx;
        const tau = Math.sqrt(($.allow ** 2 - sx ** 2) / 3);
        s.P = $.P;
        s.M = $.M;
        s.d = $.d;
        s.T = (tau * Math.PI * $.d ** 3) / 16;
      },
      read: (c) => ({ T: c.T }),
    },
    cases: [kase(cite('yield'), { P: 10, M: 400, d: 40, allow: 100 }, { T: 506.33872199490384 })],
  }),

  problem({
    id: 'u5.9.hitch-english',
    title: 'A CURT 40004 shank',
    exam: 'u5',
    ch: '9',
    lab: 'hitch',
    src: cite('combined-loading'),
    topics: ['combined-loading', 'english'],
    variety: ['representation'],
    level: 2,
    vars: {
      W: range(200, 1200, 40, 'lbf', N_PER_LBF),
      H: range(200, 1600, 40, 'lbf', N_PER_LBF),
    },
    valid: ($) => {
      const s = hitchSides($.W, $.H, HITCH_D, HITCH_ARM);
      return Math.abs(s.bend) > 0.3 * Math.abs(s.axial) && Math.abs(s.compression) > 0.5e6;
    },
    text: (T) => String.raw`A CURT 40004 trailer ball has a 2 in ball and a 1 in shank. The catalog lists a 2-1/8 in shank length, 0 rise and a 6000 lb gross trailer weight. Take the moment arm as the ball radius, 1 in, because the flange height is not given. The tongue load is ${T.W} lbf and the horizontal force is ${T.H} lbf. Find the normal stress on the tension side and on the compression side, in ksi.`,
    parts: [
      num('tension', ($) => hitchSides($.W, $.H, HITCH_D, HITCH_ARM).tension, 'ksi', {
        scale: KSI,
        label: 'tension-side stress',
        traps: [
          [($) => hitchSides($.W, $.H, HITCH_D, HITCH_ARM).bend, 'That is the bending stress. The tongue load still subtracts from this side.'],
          [($) => hitchSides($.W, $.H, HITCH_D, HITCH_ARM).compression, 'That is the compression side. This side is axial plus bending.'],
        ],
      }),
      num('compression', ($) => hitchSides($.W, $.H, HITCH_D, HITCH_ARM).compression, 'ksi', {
        scale: KSI,
        label: 'compression-side stress',
        traps: [
          [($) => hitchSides($.W, $.H, HITCH_D, HITCH_ARM).tension, 'That is the tension side.'],
          [($) => {
            const W = $.W / N_PER_LBF;
            const H = $.H / N_PER_LBF;
            const axial = -(4 * W) / (Math.PI * 1) / 1000;
            const bend = (32 * (H * 2.125)) / (Math.PI * 1) / 1000;
            return (axial - bend) * KSI;
          }, 'The published shank length, 2.125 in, was used as the moment arm. The arm here is the ball radius, 1 in.'],
        ],
      }),
    ],
    hints: [
      'The tongue load is compression, the same on every fiber. Bending adds on one side and subtracts on the other. The arm is 1 in, not the shank length.',
      String.raw`In ksi, with forces in lbf and the diameter in inches: axial $= -4W/(1000\pi d^2)$ and bending $= 32(H \cdot 1)/(1000\pi d^3)$.`,
    ],
    steps: ($, sig) => {
      const s = hitchSides($.W, $.H, HITCH_D, HITCH_ARM);
      return [
        String.raw`Axial ${sig(s.axial / KSI)} ksi, bending ${sig(s.bend / KSI)} ksi.`,
        String.raw`Tension side ${sig(s.tension / KSI)} ksi. Compression side ${sig(s.compression / KSI)} ksi.`,
      ];
    },
    second: ($) => {
      const W = $.W / N_PER_LBF;
      const H = $.H / N_PER_LBF;
      const axial = -(4 * W) / (Math.PI * 1000);
      const bend = (32 * H) / (Math.PI * 1000);
      return { tension: axial + bend, compression: axial - bend };
    },
    sim: {
      scenario: 'plan',
      setup(s, $) {
        s.W = $.W;
        s.H = $.H;
      },
      read: (c) => ({ tension: c.tension, compression: c.compression }),
    },
    cases: [kase(cite('combined-loading'), { W: 600, H: 600 }, { tension: 5.347606087887683, compression: -6.875493541569878 })],
  }),

  problem({
    id: 'u5.9.plane',
    title: 'Which turn kills the shear',
    exam: 'u5',
    ch: '9',
    lab: 'mohr',
    src: cite('stress-transformation'),
    kind: 'conceptual',
    topics: ['stress-transformation'],
    variety: ['configuration'],
    level: 1,
    vars: {
      turn: choice(
        ['principal', 'the principal angle'],
        ['shear', '45° past the principal angle'],
        ['face', 'the original x face, θ = 0'],
      ),
      scale: range(0.5, 2, 0.05, '', 1),
    },
    text: (T) => String.raw`An element has $\sigma_x = ${80 * T.scale}$ MPa, $\sigma_y = ${20 * T.scale}$ MPa and $\tau_{xy} = ${30 * T.scale}$ MPa. It is turned to ${T.turn}. What is true of the shear on that plane?`,
    parts: [
      mc('which', [
        ['zero', 'The shear is zero.', 'Shear vanishes on the principal planes, and only there for this element.'],
        ['max', 'The shear is the largest in-plane value.', 'That plane is 45° from the principals. The shear there equals the circle radius.'],
        ['neither', 'The shear is neither zero nor the largest.', 'The original x face of this element still carries shear, and it is not the circle radius.'],
        ['none', 'The normal stress is zero and so is the shear.', 'The center of the circle is not at the origin, so a zero normal stress is a different angle.'],
      ], ($) => ($.turn === 'principal' ? 'zero' : $.turn === 'shear' ? 'max' : 'neither')),
    ],
    hints: [
      'Shear is zero on the principal planes. It reaches the circle radius 45° further around.',
      'At θ = 0 this element still has τxy, and that value is not the radius.',
    ],
    steps: ($) => [
      $.turn === 'principal'
        ? 'On the principal plane the shear is zero by definition of that plane.'
        : $.turn === 'shear'
          ? 'Forty-five degrees from the principals, the shear equals the radius of the circle.'
          : 'At θ = 0 the shear is the given τxy, which is neither zero nor the radius.',
    ],
    second: ($) => ({ which: $.turn === 'principal' ? 'zero' : $.turn === 'shear' ? 'max' : 'neither' }),
    sim: {
      scenario: 'general',
      setup(s, $) {
        s.sx = 80e6 * $.scale;
        s.sy = 20e6 * $.scale;
        s.txy = 30e6 * $.scale;
        const p = principal2(s.sx, s.sy, s.txy);
        const deg = (p.theta * 180) / Math.PI;
        s.theta = $.turn === 'principal' ? deg : $.turn === 'shear' ? deg + 45 : 0;
      },
      read: (c) => {
        if (Math.abs(c.txy) <= 0.02 * Math.max(Math.abs(c.R), 1)) return { which: 'zero' };
        if (Math.abs(Math.abs(c.txy) - c.R) <= 0.02 * Math.abs(c.R)) return { which: 'max' };
        return { which: 'neither' };
      },
    },
    cases: [
      kase(cite('stress-transformation'), { turn: 'principal', scale: 1 }, { which: 'zero' }),
      kase(cite('stress-transformation'), { turn: 'shear', scale: 1 }, { which: 'max' }),
      kase(cite('stress-transformation'), { turn: 'face', scale: 1 }, { which: 'neither' }),
    ],
  }),

  problem({
    id: 'u5.9.theory',
    title: 'Which equivalent stress is larger',
    exam: 'u5',
    ch: '9',
    lab: 'combined',
    src: cite('yield'),
    kind: 'conceptual',
    topics: ['yield'],
    variety: ['configuration'],
    level: 2,
    vars: {
      kind: choice(
        ['axial', 'uniaxial tension'],
        ['shear', 'pure shear'],
        ['both', 'tension together with shear'],
      ),
      mag: range(20, 120, 5, 'MPa', MPA),
    },
    valid: ($) => {
      const sx = $.kind === 'shear' ? 0 : $.mag;
      const txy = $.kind === 'axial' ? 0 : $.kind === 'shear' ? $.mag : $.mag / 2;
      const gap = Math.abs(trescaPlane(sx, 0, txy) - vonMisesPlane(sx, 0, txy));
      const scale = Math.max(trescaPlane(sx, 0, txy), 1);
      const relGap = gap / scale;
      return relGap < 0.005 || relGap > 0.05;
    },
    text: (T) => String.raw`The stress at a point is ${T.kind}, with magnitude ${T.mag} MPa. In plane stress, how do the Tresca and von Mises equivalent stresses compare?`,
    parts: [
      mc('which', [
        ['equal', 'They are equal.', 'Under uniaxial tension both equivalents equal the tensile stress. A shear stress pulls them apart.'],
        ['tresca', 'Tresca is larger.', 'In pure shear Tresca is $2\\tau$ and von Mises is $\\tau\\sqrt{3}$. Tresca is the larger one whenever shear is present here.'],
        ['mises', 'von Mises is larger.', 'For these plane-stress states von Mises does not exceed Tresca.'],
        ['zero', 'Both are zero.', 'A nonzero tension or shear produces a nonzero equivalent stress.'],
      ], ($) => ($.kind === 'axial' ? 'equal' : 'tresca')),
    ],
    hints: [
      'Compare the largest principal difference with the von Mises combination. The third principal in plane stress is zero.',
      'Uniaxial tension makes them match. Pure shear makes Tresca $2\\tau$ and von Mises $\\tau\\sqrt{3}$.',
    ],
    steps: ($) => [
      $.kind === 'axial'
        ? 'Both principals of uniaxial tension are the tensile stress and zero. Tresca and von Mises both equal that stress.'
        : 'Shear makes the principals opposite in sign. Tresca uses the full difference, and that is larger than the von Mises value.',
    ],
    second: ($) => ({ which: $.kind === 'axial' ? 'equal' : 'tresca' }),
    sim: {
      scenario: 'torque',
      setup(s, $) {
        const mag = $.mag;
        s.d = 0.04;
        const geom = circleSection(0.04);
        if ($.kind === 'axial') {
          s.P = mag * geom.A;
          s.M = 0;
          s.T = 0;
        } else if ($.kind === 'shear') {
          s.P = 0;
          s.M = 0;
          s.T = (mag * Math.PI * 0.04 ** 3) / 16;
        } else {
          s.P = mag * geom.A;
          s.M = 0;
          s.T = ((mag / 2) * Math.PI * 0.04 ** 3) / 16;
        }
      },
      read: (c) => {
        const gap = Math.abs(c.tresca - c.vm) / Math.max(c.tresca, 1);
        if (gap < 0.02) return { which: 'equal' };
        return { which: c.tresca > c.vm ? 'tresca' : 'mises' };
      },
    },
    cases: [
      kase(cite('yield'), { kind: 'axial', mag: 100 }, { which: 'equal' }),
      kase(cite('yield'), { kind: 'shear', mag: 40 }, { which: 'tresca' }),
      kase(cite('yield'), { kind: 'both', mag: 80 }, { which: 'tresca' }),
    ],
  }),

  problem({
    id: 'u5.9.side',
    title: 'Does the shank go into tension',
    exam: 'u5',
    ch: '9',
    lab: 'hitch',
    src: cite('combined-loading'),
    kind: 'conceptual',
    topics: ['combined-loading'],
    variety: ['representation'],
    level: 1,
    vars: {
      W: range(200, 1000, 40, 'lbf', N_PER_LBF),
      H: range(0, 800, 20, 'lbf', N_PER_LBF),
    },
    valid: ($) => Math.abs(hitchSides($.W, $.H, HITCH_D, HITCH_ARM).tension) > 0.4e6,
    text: (T) => String.raw`The CURT 40004 shank (1 in diameter, moment arm 1 in) carries a tongue load of ${T.W} lbf and a horizontal force of ${T.H} lbf. Has either side gone into tension?`,
    parts: [
      mc('which', [
        ['tension', 'Yes. The bending tension side is in tension.', 'Bending has overcome the compressive tongue load on that side.'],
        ['compression', 'No. The whole cross-section stays in compression.', 'The tongue load still exceeds the bending stress, so the tension side has not crossed through zero.'],
        ['both', 'Both sides are in tension.', 'The tongue load is compression. Bending cannot put both sides into tension.'],
        ['none', 'Both stresses are zero.', 'A tongue load or a horizontal force leaves a nonzero stress.'],
      ], ($) => (hitchSides($.W, $.H, HITCH_D, HITCH_ARM).tension > 0 ? 'tension' : 'compression')),
    ],
    hints: [
      'Compare the bending stress with the compressive axial stress. Tension appears only on the side where bending wins.',
      'The tension-side stress is $-W/A + Mc/I$. It is positive only when the bending term is the larger one.',
    ],
    steps: ($) => {
      const s = hitchSides($.W, $.H, HITCH_D, HITCH_ARM);
      return [
        s.tension > 0
          ? 'Bending exceeds the axial compression, so one side is in tension.'
          : 'The axial compression still exceeds the bending stress, so every fiber stays in compression.',
      ];
    },
    second: ($) => ({ which: hitchSides($.W, $.H, HITCH_D, HITCH_ARM).tension > 0 ? 'tension' : 'compression' }),
    sim: {
      scenario: 'plan',
      setup(s, $) {
        s.W = $.W;
        s.H = $.H;
      },
      read: (c) => ({ which: c.tension > 0 ? 'tension' : 'compression' }),
    },
    cases: [
      kase(cite('combined-loading'), { W: 600, H: 600 }, { which: 'tension' }),
      kase(cite('combined-loading'), { W: 800, H: 40 }, { which: 'compression' }),
    ],
  }),
  problem({
    id: 'u5.9.from-principals',
    title: 'Back from the principal axes',
    exam: 'u5',
    ch: '9',
    lab: 'mohr',
    src: cite('mohr-construction'),
    topics: ['mohr-construction'],
    variety: ['representation'],
    level: 2,
    vars: {
      s1: range(40, 140, 5, 'MPa', MPA),
      s2: range(-80, 60, 5, 'MPa', MPA),
      th: range(-60, 60, 5, '°', 1),
    },
    derive: ($) => transform($.s1, $.s2, 0, -$.th),
    valid: ($) => $.s1 - $.s2 >= 30 * MPA && Math.abs($.th) >= 10 && Math.abs(Math.abs($.th) - 45) >= 5
      && Math.abs($.sx) <= 150 * MPA && Math.abs($.sy) <= 100 * MPA && $.sy >= -100 * MPA,
    text: (T) => String.raw`An element's principal stresses are $\sigma_1 = ${T.s1}$ MPa and $\sigma_2 = ${T.s2}$ MPa. The axis of $\sigma_1$ is turned $${T.th}^\circ$ counterclockwise from $x$ (a negative angle is clockwise). Find $\sigma_x$, $\sigma_y$ and $\tau_{xy}$.`,
    parts: [
      num('sx', ($) => $.sx, 'MPa', {
        scale: MPA,
        abs: 0.2,
        label: 'σx',
        traps: [
          [($) => ($.s1 + $.s2) / 2 + (($.s1 - $.s2) / 2) * Math.cos($.th * DEG), 'The circle turns $2\\theta$, not $\\theta$. That reads a plane half as far round.'],
        ],
      }),
      num('sy', ($) => $.sy, 'MPa', { scale: MPA, abs: 0.2, label: 'σy' }),
      num('txy', ($) => $.txy, 'MPa', {
        scale: MPA,
        abs: 0.2,
        label: 'τxy',
        traps: [
          [($) => -$.txy, 'Right size, wrong sign. The x axis is turned $-\\theta$ from the $\\sigma_1$ axis, so the shear takes the sign of $\\sin(-2\\theta)$ times $-(\\sigma_1-\\sigma_2)/2$.'],
        ],
      }),
    ],
    hints: [
      'On the principal axes the circle\'s point sits at $\\sigma_1$ on the axis. The x face is the same circle, turned back by twice the angle.',
      String.raw`Centre $(\sigma_1+\sigma_2)/2$, radius $(\sigma_1-\sigma_2)/2$. The x axis is $-\theta$ from the $\sigma_1$ axis, so use the transformation from the principal element with angle $-\theta$.`,
    ],
    steps: ($, sig) => {
      const C = ($.s1 + $.s2) / 2;
      const R = ($.s1 - $.s2) / 2;
      return [
        String.raw`Centre $${sig(C / MPA)}$ MPa, radius $${sig(R / MPA)}$ MPa.`,
        String.raw`Turn by $2(-${sig($.th)}^\circ)$: $\sigma_x = C + R\cos 2\theta = ${sig($.sx / MPA)}$ MPa and $\sigma_y = C - R\cos 2\theta = ${sig($.sy / MPA)}$ MPa.`,
        String.raw`$\tau_{xy} = R\sin 2\theta = ${sig($.txy / MPA)}$ MPa, with $\theta$ the angle from x to $\sigma_1$.`,
      ];
    },
    second: ($) => {
      // Rebuild the matrix R diag(σ1, σ2) Rᵀ, with the σ1 axis at θ.
      const c = Math.cos($.th * DEG);
      const s = Math.sin($.th * DEG);
      return {
        sx: ($.s1 * c * c + $.s2 * s * s) / MPA,
        sy: ($.s1 * s * s + $.s2 * c * c) / MPA,
        txy: (($.s1 - $.s2) * s * c) / MPA,
      };
    },
    sim: {
      scenario: 'principal',
      setup(s, $) {
        s.sx = $.s1;
        s.sy = $.s2;
        s.txy = 0;
        s.theta = -$.th;
      },
      read: (c) => ({ sx: c.sx, sy: c.sy, txy: c.txy }),
    },
    cases: [kase(cite('mohr-construction'), { s1: 92.4264, s2: 7.5736, th: 22.5 }, { sx: 80, sy: 20, txy: 30 })],
  }),

  problem({
    id: 'u5.9.abs-shear',
    title: 'The largest shear in the part',
    exam: 'u5',
    ch: '9',
    lab: 'mohr',
    src: cite('abs-max-shear'),
    topics: ['abs-max-shear'],
    variety: ['configuration'],
    level: 2,
    vars: {
      sx: range(-100, 140, 10, 'MPa', MPA),
      sy: range(-100, 140, 10, 'MPa', MPA),
      txy: range(-50, 50, 5, 'MPa', MPA),
    },
    derive: ($) => absMaxShear($.sx, $.sy, $.txy),
    valid: ($) => Math.abs($.sx - $.sy) >= 20 * MPA || Math.abs($.txy) >= 10 * MPA,
    text: (T) => String.raw`A point on the free surface of a part carries $\sigma_x = ${T.sx}$ MPa, $\sigma_y = ${T.sy}$ MPa and $\tau_{xy} = ${T.txy}$ MPa. Find the largest in-plane shear stress and the largest shear stress on any plane through the point.`,
    parts: [
      num('inPlane', ($) => $.inPlane, 'MPa', {
        scale: MPA,
        label: 'in-plane',
        traps: [
          [($) => $.s1 - $.s2, 'That is $\\sigma_1 - \\sigma_2$, the diameter. The largest shear is the radius.'],
        ],
      }),
      num('abs', ($) => $.abs, 'MPa', {
        scale: MPA,
        label: 'absolute',
        traps: [
          [($) => ($.outOfPlane ? $.inPlane : Math.max(Math.abs($.s1), Math.abs($.s2)) / 2), 'That uses only two of the three principals. The largest shear is half the spread of $\\sigma_1$, $\\sigma_2$ and 0 together.'],
          [($) => 2 * $.abs, 'That is the whole spread of the principals. The shear is half of it.'],
        ],
      }),
    ],
    hints: [
      'A free surface has a third principal stress, zero. Each pair of the three principals draws a circle.',
      String.raw`Find $\sigma_1$ and $\sigma_2$ from the centre and radius. The largest shear of all is half the spread of $\sigma_1$, $\sigma_2$ and 0.`,
    ],
    steps: ($, sig) => [
      String.raw`Centre $${sig(($.sx + $.sy) / 2 / MPA)}$ MPa, radius $R = ${sig($.inPlane / MPA)}$ MPa, so $\sigma_1 = ${sig($.s1 / MPA)}$ and $\sigma_2 = ${sig($.s2 / MPA)}$ MPa.`,
      ($.outOfPlane
        ? String.raw`Both principals share a sign, so zero lies outside them. The largest circle runs from 0 to $${sig((Math.abs($.s1) > Math.abs($.s2) ? $.s1 : $.s2) / MPA)}$ MPa.`
        : String.raw`Zero lies between $\sigma_2$ and $\sigma_1$, so the in-plane circle is the largest.`),
      String.raw`$\tau_{\mathrm{abs}} = ${sig($.abs / MPA)}$ MPa.`,
    ],
    second: ($) => ({ inPlane: eigenR($), abs: trescaPlane($.sx, $.sy, $.txy) / 2 / MPA }),
    sim: {
      scenario: 'general',
      setup(s, $) {
        s.sx = $.sx;
        s.sy = $.sy;
        s.txy = $.txy;
      },
      read: (c) => ({ inPlane: c.R, abs: c.tauAbs }),
    },
    cases: [
      kase(cite('abs-max-shear'), { sx: 80, sy: 40, txy: 0 }, { inPlane: 20, abs: 40 }),
      kase(cite('abs-max-shear'), { sx: 0, sy: 0, txy: 50 }, { inPlane: 50, abs: 50 }),
    ],
  }),

  problem({
    id: 'u5.9.brittle',
    title: 'Factor of safety for cast iron',
    exam: 'u5',
    ch: '9',
    lab: 'mohr',
    src: cite('brittle'),
    topics: ['brittle'],
    variety: ['configuration'],
    level: 3,
    vars: {
      sut: range(150, 250, 10, 'MPa', MPA),
      ratio: range(3, 4, 0.5, '', 1),
      sx: range(-100, 100, 10, 'MPa', MPA),
      sy: range(-100, 60, 10, 'MPa', MPA),
      txy: range(-60, 60, 5, 'MPa', MPA),
    },
    derive: ($) => {
      const suc = $.ratio * $.sut;
      const p = principal2($.sx, $.sy, $.txy);
      return {
        suc,
        p1: p.s1,
        p2: p.s2,
        cm: coulombMohrFS($.sx, $.sy, $.txy, $.sut, suc),
        mns: maxNormalFS($.sx, $.sy, $.txy, $.sut, suc),
      };
    },
    // Mixed signs only: there the two rules part company.
    valid: ($) => $.p1 > 10 * MPA && $.p2 < -10 * MPA && $.cm > 1 && $.cm < 6 && rel($.cm, $.mns),
    text: (T, $) => String.raw`A gray-iron bracket has an ultimate tensile strength of $${T.sut}$ MPa and an ultimate compressive strength of $${Math.round($.suc / MPA)}$ MPa. At its critical point $\sigma_x = ${T.sx}$ MPa, $\sigma_y = ${T.sy}$ MPa and $\tau_{xy} = ${T.txy}$ MPa. Find the factor of safety against fracture by Coulomb–Mohr, and by the maximum normal stress.`,
    parts: [
      num('cm', ($) => $.cm, '', {
        label: 'Coulomb–Mohr',
        traps: [
          [($) => 1 / ($.p1 / $.sut + $.p2 / $.suc), 'The compressive principal entered with the wrong sign. In $\\sigma_{\\max}/\\sigma_{ut} - \\sigma_{\\min}/\\sigma_{uc}$ a negative $\\sigma_{\\min}$ adds.'],
          [($) => $.sut / vonMisesPlane($.sx, $.sy, $.txy), 'That is von Mises against the tensile strength, a ductile yield rule. Cast iron breaks; it does not yield.'],
        ],
      }),
      num('mns', ($) => $.mns, '', {
        label: 'maximum normal stress',
        traps: [
          [($) => $.sut / Math.abs($.p2), 'That compares the compressive principal with the tensile strength. Compression is limited by $\\sigma_{uc}$.'],
        ],
      }),
    ],
    hints: [
      'Cast iron is brittle and much stronger in compression. Find the principal stresses first; both rules use them.',
      String.raw`With $\sigma_1 > 0 > \sigma_2$: Coulomb–Mohr gives $n = 1/(\sigma_1/\sigma_{ut} - \sigma_2/\sigma_{uc})$. The maximum normal stress takes the smaller of $\sigma_{ut}/\sigma_1$ and $\sigma_{uc}/|\sigma_2|$.`,
    ],
    steps: ($, sig) => [
      String.raw`$\sigma_1 = ${sig($.p1 / MPA)}$ MPa and $\sigma_2 = ${sig($.p2 / MPA)}$ MPa.`,
      String.raw`Coulomb–Mohr: $n = 1/(${sig($.p1 / MPA)}/${sig($.sut / MPA)} + ${sig(-$.p2 / MPA)}/${sig($.suc / MPA)}) = ${sig($.cm)}$.`,
      String.raw`Maximum normal stress: the smaller of $${sig($.sut / $.p1)}$ and $${sig($.suc / -$.p2)}$, so $n = ${sig($.mns)}$.`,
    ],
    second: ($) => {
      // Scale the stress until its circle touches the straight envelope through the two test circles.
      const beta = ($.sut - $.suc) / ($.sut + $.suc);
      const alpha = ($.sut * $.suc) / ($.sut + $.suc);
      const c = ($.p1 + $.p2) / 2;
      const r = ($.p1 - $.p2) / 2;
      return { cm: alpha / (r - beta * c), mns: Math.min($.sut / $.p1, $.suc / -$.p2) };
    },
    sim: {
      scenario: 'general',
      setup(s, $) {
        s.sx = $.sx;
        s.sy = $.sy;
        s.txy = $.txy;
      },
      read: (c, state, $) => ({ mns: Math.min($.sut / c.s1, ($.ratio * $.sut) / -c.s2) }),
    },
    cases: [kase(cite('brittle'), { sut: 200, ratio: 3.5, sx: 50, sy: -100, txy: 0 }, { cm: 2.5454545454545454, mns: 4 })],
  }),

  problem({
    id: 'u5.9.twist-break',
    title: 'Where a twisted bar breaks',
    exam: 'u5',
    ch: '9',
    lab: 'mohr',
    src: cite('brittle'),
    kind: 'conceptual',
    topics: ['brittle', 'yield'],
    variety: ['representation'],
    level: 1,
    vars: {
      mat: choice(
        ['chalk', 'a stick of chalk'],
        ['iron', 'a gray cast-iron rod'],
        ['steel', 'a mild-steel rod'],
        ['al', 'an annealed aluminium rod'],
      ),
      d: range(8, 30, 1, 'mm', 1e-3),
    },
    text: (T) => String.raw`${T.mat} of diameter $${T.d}$ mm is twisted until it breaks. Along which surface does it break?`,
    parts: [
      mc('surface', [
        ['helix', 'A helix at 45° to the axis.', 'A brittle material breaks across its largest tension. In torsion σ1 acts at 45° to the axis, so the crack runs as a 45° helix.'],
        ['flat', 'Flat, straight across the bar.', 'A ductile metal yields in shear first. The largest shear in torsion acts on the cross-section, so it slides apart flat.'],
        ['split', 'Lengthwise, along the axis.', 'The lengthwise planes carry the same shear as the cross-section but no tension. A ductile bar can slip there too, but fails across the section first; a brittle one cracks across σ1.'],
      ], ($) => ($.mat === 'chalk' || $.mat === 'iron' ? 'helix' : 'flat')),
    ],
    hints: [
      'Ask first whether the material breaks across tension or yields in shear.',
      'In pure torsion, the largest shear is on the cross-section and the largest tension is on a plane at 45°.',
    ],
    steps: ($) => [
      $.mat === 'chalk' || $.mat === 'iron'
        ? 'It is brittle, so it breaks across σ1, which is at 45° in torsion: a helix.'
        : 'It is ductile, so it yields on the plane of largest shear, the cross-section: a flat break.',
    ],
    second: ($) => {
      // Pure shear: σ1 sits 45° from the axis, and the largest shear on the 0° plane.
      const tr = transform(0, 0, 1, 45);
      const brittle = $.mat === 'chalk' || $.mat === 'iron';
      return { surface: brittle && Math.abs(tr.sx - 1) < 1e-12 ? 'helix' : 'flat' };
    },
    sim: {
      scenario: 'shear',
      setup(s) {
        s.theta = 0;
      },
      read: (c, state, $) => ({ surface: ($.mat === 'chalk' || $.mat === 'iron') && Math.abs(c.thetaP - 45) < 1e-9 ? 'helix' : 'flat' }),
    },
    cases: [
      kase(cite('brittle'), { mat: 'chalk', d: 10 }, { surface: 'helix' }),
      kase(cite('brittle'), { mat: 'steel', d: 20 }, { surface: 'flat' }),
    ],
  }),
];

export default ch9;
