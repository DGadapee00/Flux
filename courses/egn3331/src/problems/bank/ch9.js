/**
 * Plane-stress transformation, principals, combined stress on a circular bar,
 * a trailer-ball shank in ksi, and Tresca against von Mises.
 */
import { N_PER_LBF, PA_PER_PSI } from '@flux/subjects/convert.js';
import {
  circleSection, combinedCircle, combinedReduced, hitchSides, principal2, traction, transform,
  trescaPlane, vonMisesPlane,
} from '@flux/subjects/mechanics/materials.js';
import { HITCH_ARM, HITCH_D } from '../../data/hitch.js';
import { choice, cite, kase, mc, num, problem, range } from '../kit.js';

const MPA = 1e6;
const KSI = 1000 * PA_PER_PSI;
const DEG = Math.PI / 180;

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
      String.raw`$\tau_{max} = ${sig(principal2($.sx, $.sy, $.txy).R / MPA)}$ MPa.`,
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
      return rel(T, forgot) && rel(T, ignore);
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
];

export default ch9;
