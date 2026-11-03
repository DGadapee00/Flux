/** Ch 11 · Rolling and angular momentum. OpenStax University Physics Vol. 1, §§11.1–11.4. */
import { G } from '@flux/subjects/mechanics/constants.js';
import { particleAngularMomentum } from '@flux/subjects/mechanics/momentum.js';
import {
  inertiaDisk, inertiaHoop, inertiaPoint, inertiaRodCenter, inertiaRodEnd, inertiaSphere,
  precessionRate, rollingIncline, rollingSlip, rollingSpeed, spinAfter,
} from '@flux/subjects/mechanics/rotation.js';
import { v } from '@flux/subjects/mechanics/vectors.js';
import { choice, kase, mc, num, problem, range, texNum } from '../kit.js';

const U = { exam: 'u7', ch: '11' };
const DEG = Math.PI / 180;

const SHAPE = [
  ['disk', 'solid cylinder'],
  ['sphere', 'solid sphere'],
  ['hoop', 'thin hoop'],
];

function moment(shape, m, R) {
  if (shape === 'sphere') return inertiaSphere(m, R);
  if (shape === 'hoop') return inertiaHoop(m, R);
  return inertiaDisk(m, R);
}

function kOf(shape) {
  if (shape === 'sphere') return 2 / 5;
  if (shape === 'hoop') return 1;
  return 1 / 2;
}

export default [
  problem({
    ...U,
    id: 'ch11.roll',
    level: 1,
    variety: ['configuration'],
    src: 'OpenStax University Physics Vol. 1 §11.1',
    title: 'Rolling without slipping',
    topics: ['rolling'],
    lab: 'rolling',
    vars: {
      shape: choice(...SHAPE),
      m: range(0.5, 8, 0.5, 'kg'),
      R: range(0.1, 0.6, 0.05, 'm'),
      theta: range(15, 50, 5, '°'),
      s: range(0.5, 4, 0.5, 'm'),
    },
    derive: ($) => {
      const I = moment($.shape, $.m, $.R);
      const roll = rollingIncline({ mass: $.m, radius: $.R, I, thetaDeg: $.theta, g: G });
      const h = $.s * Math.sin($.theta * DEG);
      const speed = rollingSpeed({ mass: $.m, radius: $.R, I, height: h, g: G });
      return { a: roll.a, muMin: roll.muMin, v: speed.v, k: roll.k };
    },
    second: ($) => {
      const k = kOf($.shape);
      const sin = Math.sin($.theta * DEG);
      const a = (G * sin) / (1 + k);
      const h = $.s * sin;
      const v = Math.sqrt((2 * G * h) / (1 + k));
      const muMin = (k / (1 + k)) * Math.tan($.theta * DEG);
      return { a, muMin, v };
    },
    valid: ($) => $.a > 0.3 && $.v > 0.4,
    text: (T) => `A ${T.shape} of mass ${T.m} kg and radius ${T.R} m rolls from rest without slipping down a ${T.theta}° incline. It travels ${T.s} m along the plane. Take g = ${G} m/s². Find the acceleration of the center, the smallest μs that can keep the contact from slipping, and the speed of the center after that distance.`,
    parts: [
      num('a', ($) => $.a, 'm/s²', { label: 'acceleration of the center' }),
      num('muMin', ($) => $.muMin, '', { label: 'minimum μs' }),
      num('v', ($) => $.v, 'm/s', { label: 'speed of the center' }),
    ],
    hints: [
      String.raw`Down the plane, $mg\sin\theta - f = ma$. About the center, $fR = I\alpha$, and no slip means $a = R\alpha$. The mass and the radius cancel. Only $k = I/(mR^2)$ remains.`,
      String.raw`A solid cylinder has $k = 1/2$, so $a = \frac23 g\sin\theta$ and $\mu_s \ge \frac13\tan\theta$. A hoop has $k = 1$. Energy gives $v = \sqrt{2gh/(1+k)}$ with $h = s\sin\theta$. Static friction does no work, because the contact point is at rest.`,
    ],
    steps: ($) => [
      String.raw`$k = ${texNum($.k)}$, so $a = g\sin\theta/(1+k) = ${texNum($.a)}\ \mathrm{m/s^2}$`,
      String.raw`$\mu_s \ge (k/(1+k))\tan\theta = ${texNum($.muMin)}$`,
      String.raw`$v = \sqrt{2gh/(1+k)} = ${texNum($.v)}\ \mathrm{m/s}$`,
    ],
    sim: {
      scenario: 'disk',
      setup: (s, $) => {
        Object.assign(s, { shape: $.shape, mode: 'roll', m: $.m, R: $.R, theta: $.theta, s: $.s, mu: 0.1 });
      },
      read: (c) => ({ a: c.a, muMin: c.muMin, v: c.v }),
    },
    cases: [
      kase('OpenStax University Physics Vol. 1 §11.1, "Rolling Down an Inclined Plane": a solid cylinder on a 30° hill, over 1.50 m', { shape: 'disk', m: 2, R: 0.2, theta: 30, s: 1.5 }, { a: 3.27, muMin: 0.1925, v: 3.132 }, {
        note: 'The book leaves the angle free and prints a = (2/3) g sinθ and μs ≥ (1/3) tanθ. On this 30° hill, with g = 9.81, that is 3.27 m/s² and μs ≥ 0.1925. The speed after 1.50 m is ours. The example does not ask for it.',
      }),
      kase('hand', { shape: 'hoop', m: 1, R: 0.3, theta: 60, s: 2 }, {
        a: (G * Math.sin(60 * DEG)) / 2,
        muMin: 0.5 * Math.tan(60 * DEG),
        v: Math.sqrt(G * 2 * Math.sin(60 * DEG)),
      }),
    ],
  }),

  problem({
    ...U,
    id: 'ch11.slip',
    level: 2,
    variety: ['configuration'],
    src: 'OpenStax University Physics Vol. 1 §11.1',
    title: 'Rolling while slipping',
    topics: ['slipping', 'rolling'],
    lab: 'rolling',
    vars: {
      shape: choice(...SHAPE),
      m: range(0.5, 6, 0.5, 'kg'),
      R: range(0.1, 0.5, 0.05, 'm'),
      theta: range(20, 45, 5, '°'),
      mu: range(0.02, 0.12, 0.02, ''),
    },
    derive: ($) => {
      const I = moment($.shape, $.m, $.R);
      const slip = rollingSlip({ mass: $.m, radius: $.R, I, thetaDeg: $.theta, mu: $.mu, g: G });
      return { a: slip.a, alpha: slip.alpha };
    },
    second: ($) => {
      const sin = Math.sin($.theta * DEG);
      const cos = Math.cos($.theta * DEG);
      const a = G * (sin - $.mu * cos);
      const I = kOf($.shape) * $.m * $.R * $.R;
      const f = $.mu * $.m * G * cos;
      return { a, alpha: (f * $.R) / I };
    },
    valid: ($) => $.a > 0.2 && $.alpha > 0.2,
    text: (T) => `A ${T.shape} of mass ${T.m} kg and radius ${T.R} m slides down a ${T.theta}° incline. Kinetic friction has μk = ${T.mu}. The contact is slipping, so v is not ωR. Take g = ${G} m/s². Find the acceleration of the center down the plane and the angular acceleration about the center.`,
    parts: [
      num('a', ($) => $.a, 'm/s²', { label: 'acceleration of the center' }),
      num('alpha', ($) => $.alpha, 'rad/s²', { label: 'angular acceleration' }),
    ],
    hints: [
      String.raw`Kinetic friction is $\mu_k N = \mu_k mg\cos\theta$, up the plane. The center then accelerates at $g(\sin\theta - \mu_k\cos\theta)$, the same rule as a block that slides.`,
      String.raw`That friction is the only torque about the center: $\alpha = fR/I$. Do not set $\alpha = a/R$. That tie holds only when the contact is not slipping.`,
    ],
    steps: ($) => [
      String.raw`$a = g(\sin\theta - \mu_k\cos\theta) = ${texNum($.a)}\ \mathrm{m/s^2}$`,
      String.raw`$\alpha = fR/I = ${texNum($.alpha)}\ \mathrm{rad/s^2}$`,
    ],
    sim: {
      scenario: 'slip',
      setup: (s, $) => {
        Object.assign(s, { shape: $.shape, mode: 'slip', m: $.m, R: $.R, theta: $.theta, s: 1.5, mu: $.mu });
      },
      read: (c) => ({ a: c.a, alpha: c.alpha }),
    },
    cases: [
      kase('OpenStax University Physics Vol. 1 §11.1, "Rolling Down an Inclined Plane with Slipping": a solid cylinder, μk = 0.10, on a 30° hill, radius 0.20 m', { shape: 'disk', m: 2, R: 0.2, theta: 30, mu: 0.1 }, { a: 4.055, alpha: 8.496 }, {
        note: 'The book leaves θ and μk free and prints a = g(sinθ − μk cosθ) and, for a solid cylinder, α = 2 μk g cosθ / r. These numbers use g = 9.81.',
      }),
      kase('hand', { shape: 'hoop', m: 1, R: 0.4, theta: 30, mu: 0.1 }, {
        a: G * (0.5 - 0.1 * Math.cos(30 * DEG)),
        alpha: (0.1 * G * Math.cos(30 * DEG)) / 0.4,
      }),
    ],
  }),

  problem({
    ...U,
    id: 'ch11.rover',
    level: 1,
    variety: ['configuration'],
    src: 'OpenStax University Physics Vol. 1 §11.1',
    title: 'Speed at the bottom of a drop',
    topics: ['rolling'],
    lab: 'rover-wheel',
    vars: {
      shape: choice(...SHAPE, ['slide', 'sliding block']),
      m: range(1, 10, 1, 'kg'),
      R: range(0.1, 0.5, 0.05, 'm'),
      h: range(5, 40, 5, 'm'),
      g: range(1.6, 10, 0.01, 'm/s²'),
    },
    derive: ($) => {
      const slide = $.shape === 'slide';
      const I = slide ? 0 : moment($.shape, $.m, $.R);
      const k = slide ? 0 : kOf($.shape);
      const speed = slide
        ? Math.sqrt(2 * $.g * $.h)
        : rollingSpeed({ mass: $.m, radius: $.R, I, height: $.h, g: $.g }).v;
      return { v: speed, share: k / (1 + k), k };
    },
    second: ($) => {
      const k = $.shape === 'slide' ? 0 : kOf($.shape);
      const v = Math.sqrt((2 * $.g * $.h) / (1 + k));
      return { v, share: k / (1 + k) };
    },
    valid: ($) => $.v > 1,
    text: (T) => `${T.shape} of mass ${T.m} kg and radius ${T.R} m starts from rest and drops ${T.h} m. A rolling body does not slip. A slide has no friction. Take g = ${T.g} m/s². Find the speed at the bottom, and the fraction of the kinetic energy that is rotational.`,
    parts: [
      num('v', ($) => $.v, 'm/s', { label: 'speed at the bottom' }),
      num('share', ($) => $.share, '', { label: 'rotational fraction of K' }),
    ],
    hints: [
      String.raw`Without slipping, $mgh = \frac12 mv^2 + \frac12 I\omega^2$ and $\omega = v/R$. That is $v = \sqrt{2gh/(1+k)}$ with $k = I/(mR^2)$.`,
      String.raw`A thin hoop has $k = 1$, so $v = \sqrt{gh}$ and half of the kinetic energy is in the spin. A slide has $k = 0$. The radius cancels for any one shape.`,
    ],
    steps: ($) => [
      String.raw`$k = ${texNum($.k)}$, so $v = ${texNum($.v)}\ \mathrm{m/s}$`,
      String.raw`The rotational share is $k/(1+k) = ${texNum($.share)}$`,
    ],
    sim: {
      scenario: 'mars',
      setup: (s, $) => {
        Object.assign(s, { shape: $.shape, m: $.m, R: $.R, h: $.h, g: $.g, theta: 20 });
      },
      read: (c) => ({ v: c.v, share: c.Krot / (c.Ktrans + c.Krot) }),
    },
    cases: [
      kase('OpenStax University Physics Vol. 1 §11.1, "Curiosity Rover": a 5 kg hoop of radius 25 cm drops 25.0 m on Mars', { shape: 'hoop', m: 5, R: 0.25, h: 25, g: 3.71 }, { v: 9.63, share: 0.5 }, {
        note: 'The book models the wheel as a thin hoop and prints 9.63 m/s. Ours is √(3.71 × 25) = 9.631 m/s. The mass cancels. The no-friction slide is a comparison we added. It is not a second reading of the example.',
      }),
      kase('hand', { shape: 'sphere', m: 2, R: 0.2, h: 10, g: G }, {
        v: Math.sqrt((2 * G * 10) / 1.4),
        share: 0.4 / 1.4,
      }),
    ],
  }),

  problem({
    ...U,
    id: 'ch11.meteor',
    level: 1,
    variety: ['unknown'],
    src: 'OpenStax University Physics Vol. 1 §11.2',
    title: 'Angular momentum of a particle',
    topics: ['angular-momentum'],
    lab: 'particle-l',
    vars: {
      m: range(5, 30, 5, 'kg'),
      x: range(5, 40, 5, 'km', 1000),
      y: range(5, 40, 5, 'km', 1000),
      vy: range(-4, -1, 0.5, 'km/s', 1000),
      ay: range(-4, -0.5, 0.5, 'm/s²'),
    },
    derive: ($) => ({
      Lz: $.m * ($.x * $.vy),
      tau: $.m * ($.x * $.ay),
    }),
    second: ($) => {
      const L = particleAngularMomentum($.m, v($.x, $.y, 0), v(0, $.vy, 0));
      const rate = particleAngularMomentum($.m, v($.x, $.y, 0), v(0, $.ay, 0));
      return { Lz: L.z, tau: rate.z };
    },
    valid: () => true,
    text: (T) => `At the instant an observer looks, a ${T.m} kg meteor is at x = ${T.x} km, y = ${T.y} km. Its velocity is straight down the y axis at ${T.vy} km/s, and its acceleration is ${T.ay} m/s² in that same direction. Positive z is out of the page. Find Lz and the torque about the observer.`,
    parts: [
      num('Lz', ($) => $.Lz, 'kg·m²/s', { label: 'Lz' }),
      num('tau', ($) => $.tau, 'N·m', { label: 'torque, z component' }),
    ],
    hints: [
      String.raw`$L_z = m(xv_y - yv_x)$. Here $v_x = 0$, so only the east-west distance is a lever arm. The north-south distance is parallel to the velocity and drops out.`,
      String.raw`The torque is the same cross product with $\vec a$ in place of $\vec v$, times the mass. It is $dL/dt$, not $L$ itself. A kilometer in the position has to become meters before you multiply.`,
    ],
    steps: ($) => [
      String.raw`$L_z = m\,x\,v_y = ${texNum($.Lz)}\ \mathrm{kg\cdot m^2/s}$`,
      String.raw`$\tau_z = m\,x\,a_y = ${texNum($.tau)}\ \mathrm{N\cdot m}$`,
    ],
    sim: {
      scenario: 'meteor',
      setup: (s, $) => {
        Object.assign(s, { m: $.m, x: $.x, y: $.y, vx: 0, vy: $.vy, ax: 0, ay: $.ay });
      },
      read: (c) => ({ Lz: c.Lz, tau: c.tau }),
    },
    cases: [
      kase('OpenStax University Physics Vol. 1 §11.2, "Angular Momentum and Torque on a Meteor": 15.0 kg at 25 km east and 25 km north, falling at 2.0 km/s, acceleration 2.0 m/s² down', { m: 15, x: 25, y: 25, vy: -2, ay: -2 }, { Lz: -7.5e8, tau: -7.5e5 }, {
        note: 'The book prints 7.50×10⁸ kg·m²/s and 7.5×10⁵ N·m, both in the −k direction. They hold the 25 km position fixed while they differentiate L.',
      }),
      kase('hand', { m: 10, x: 10, y: 20, vy: -1, ay: -1 }, { Lz: -1e8, tau: -1e5 }),
    ],
  }),

  problem({
    ...U,
    id: 'ch11.three',
    level: 2,
    variety: ['representation'],
    src: 'OpenStax University Physics Vol. 1 §11.2',
    title: 'Three particles',
    topics: ['angular-momentum'],
    vars: {
      pScale: range(0.5, 2, 0.5, ''),
      fScale: range(0.5, 2, 0.5, ''),
    },
    derive: ($) => ({
      Lz: -30 * $.pScale,
      tau: 30 * $.fScale,
    }),
    second: ($) => {
      const particles = [
        { x: -2, y: 1, px: 0, py: 8 * $.pScale, Fx: -6 * $.fScale, Fy: 0 },
        { x: 4, y: 1, px: 20 * $.pScale, py: 0, Fx: 0, Fy: 10 * $.fScale },
        { x: 2, y: -2, px: 3 * $.pScale, py: 0, Fx: 0, Fy: -8 * $.fScale },
      ];
      return {
        Lz: particles.reduce((sum, p) => sum + (p.x * p.py - p.y * p.px), 0),
        tau: particles.reduce((sum, p) => sum + (p.x * p.Fy - p.y * p.Fx), 0),
      };
    },
    valid: () => true,
    text: (T, $) => `Three particles are in the xy plane. Particle 1 is at (−2.00 m, 1.00 m) with momentum (0, ${8 * $.pScale} kg·m/s) and force (${-6 * $.fScale} N, 0). Particle 2 is at (4.00 m, 1.00 m) with momentum (${20 * $.pScale} kg·m/s, 0) and force (0, ${10 * $.fScale} N). Particle 3 is at (2.00 m, −2.00 m) with momentum (${3 * $.pScale} kg·m/s, 0) and force (0, ${-8 * $.fScale} N). Find the total Lz and the total torque about the origin.`,
    parts: [
      num('Lz', ($) => $.Lz, 'kg·m²/s', { label: 'total Lz' }),
      num('tau', ($) => $.tau, 'N·m', { label: 'total torque' }),
    ],
    hints: [
      String.raw`Add $x p_y - y p_x$ for each particle. The rate of change of $L$ is the sum of $x F_y - y F_x$. It is not equal to $L$.`,
      'A force parallel to a particle’s position contributes no torque. Particle 1’s force is horizontal, so its lever arm is the y coordinate.',
    ],
    steps: ($) => [
      String.raw`$L_z = -16\,(${texNum($.pScale)}) - 20\,(${texNum($.pScale)}) + 6\,(${texNum($.pScale)}) = ${texNum($.Lz)}$`,
      String.raw`$\tau_z = 6\,(${texNum($.fScale)}) + 40\,(${texNum($.fScale)}) - 16\,(${texNum($.fScale)}) = ${texNum($.tau)}$`,
    ],
    cases: [
      kase('OpenStax University Physics Vol. 1 §11.2, "Angular Momentum of Three Particles": the printed momenta and forces', { pScale: 1, fScale: 1 }, { Lz: -30, tau: 30 }, {
        note: 'The book prints L = −30 k kg·m²/s and a net torque of +30 k N·m. The torque is the rate of change of L. It is not L itself.',
      }),
      kase('hand', { pScale: 2, fScale: 0.5 }, { Lz: -60, tau: 15 }),
    ],
  }),

  problem({
    ...U,
    id: 'ch11.arm',
    level: 3,
    variety: ['configuration'],
    src: 'OpenStax University Physics Vol. 1 §11.2',
    title: 'A rod and a mass at its end',
    topics: ['angular-momentum'],
    lab: 'spinner',
    vars: {
      mArm: range(1, 4, 0.5, 'kg'),
      mTip: range(0, 3, 0.5, 'kg'),
      mRock: range(0, 3, 0.5, 'kg'),
      len: range(0.5, 2, 0.25, 'm'),
      w: range(0.2, 2, 0.1, 'rad/s'),
      t: range(0.05, 0.4, 0.05, 's'),
    },
    derive: ($) => {
      const Iempty = inertiaRodEnd($.mArm, $.len) + inertiaPoint($.mTip, $.len);
      const Irock = Iempty + inertiaPoint($.mRock, $.len);
      return {
        Lempty: Iempty * $.w,
        Lrock: Irock * $.w,
        tau: Iempty * ($.w / $.t),
      };
    },
    second: ($) => {
      const Iempty = ($.mArm * $.len * $.len) / 3 + $.mTip * $.len * $.len;
      const Irock = Iempty + $.mRock * $.len * $.len;
      return {
        Lempty: Iempty * $.w,
        Lrock: Irock * $.w,
        tau: (Iempty * $.w) / $.t,
      };
    },
    valid: ($) => $.Lempty > 0.05 && $.tau > 0.05,
    text: (T) => `A uniform rod of mass ${T.mArm} kg and length ${T.len} m turns about one end. A point mass of ${T.mTip} kg sits at the free end, and a second point mass of ${T.mRock} kg may sit there too. The loaded rod is at rest, then reaches ${T.w} rad/s in ${T.t} s at constant α, with no rock aboard for that spin-up. Find the angular momentum of the rod and the first mass, the angular momentum with the second mass as well, at the same ω, and the torque during the empty spin-up.`,
    parts: [
      num('Lempty', ($) => $.Lempty, 'kg·m²/s', { label: 'L without the second mass' }),
      num('Lrock', ($) => $.Lrock, 'kg·m²/s', { label: 'L with the second mass' }),
      num('tau', ($) => $.tau, 'N·m', { label: 'torque during the spin-up' }),
    ],
    hints: [
      String.raw`A rod about one end is $\frac13 mL^2$, not $\frac{1}{12}mL^2$. A point mass at the end is $mL^2$. The rock in the book is modeled as a point, not as a sphere.`,
      String.raw`$L = I\omega$ at the final spin. The torque is $I\alpha$ for the empty arm, with $\alpha = \omega/t$ from rest. The two directions in the book are opposite. These parts ask for the magnitudes.`,
    ],
    steps: ($) => [
      String.raw`$L = I\omega = ${texNum($.Lempty)}\ \mathrm{kg\cdot m^2/s}$ without the second mass`,
      String.raw`$L = ${texNum($.Lrock)}\ \mathrm{kg\cdot m^2/s}$ with it`,
      String.raw`$\tau = I\omega/t = ${texNum($.tau)}\ \mathrm{N\cdot m}$`,
    ],
    sim: {
      scenario: 'arm',
      setup: (s, $) => {
        Object.assign(s, {
          kind: 'arm', mArm: $.mArm, mTip: $.mTip, mRock: $.mRock, len: $.len, omega: $.w,
        });
      },
      read: (c) => ({ Lrock: c.L }),
    },
    cases: [
      kase('OpenStax University Physics Vol. 1 §11.2, "Angular Momentum of a Robot Arm": a 2.0 kg arm, 1.0 kg forceps, a 1.5 kg rock, length 1.0 m, from rest to 0.1π rad/s in 0.1 s', { mArm: 2, mTip: 1, mRock: 1.5, len: 1, w: 0.1 * Math.PI, t: 0.1 }, { Lempty: 0.17 * Math.PI, Lrock: 0.32 * Math.PI, tau: 1.67 * Math.PI }, {
        note: 'The book prints 0.17π and 0.32π kg·m²/s, and 1.67π N·m. Ours are π/6, 19π/60, and (5/3)π, from I = 5/3 and 19/6 rather than the rounded 1.67 and 3.17. The with-rock vector in the book points into the page. This part asks for its size. The lab draws the arm with the rock aboard, so it shows the second angular momentum.',
      }),
      kase('hand', { mArm: 3, mTip: 0, mRock: 0, len: 1, w: 2, t: 1 }, { Lempty: 2, Lrock: 2, tau: 2 }),
    ],
  }),

  problem({
    ...U,
    id: 'ch11.fly',
    level: 2,
    variety: ['unknown'],
    src: 'OpenStax University Physics Vol. 1 §11.3',
    title: 'Two flywheels come to one spin',
    topics: ['angular-conservation'],
    lab: 'spinner',
    vars: {
      rpm: range(100, 900, 50, 'rev/min'),
      factor: range(1, 6, 1, ''),
    },
    derive: ($) => {
      const w0 = $.rpm * 2 * Math.PI / 60;
      const omega = spinAfter(1, w0, 1 + $.factor);
      const kept = 1 / (1 + $.factor);
      return { omega, lost: 1 - kept };
    },
    second: ($) => {
      const w0 = $.rpm * Math.PI / 30;
      const omega = w0 / (1 + $.factor);
      const K0 = 0.5 * w0 * w0;
      const K = 0.5 * (1 + $.factor) * omega * omega;
      return { omega, lost: (K0 - K) / K0 };
    },
    valid: ($) => $.omega > 1 && $.lost > 0.05,
    text: (T) => `A flywheel spins at ${T.rpm} rev/min on a frictionless shaft. A second flywheel, at rest, has ${T.factor} times that moment of inertia and is dropped onto the first. Friction between them brings them to one spin. No outside torque acts on the pair. Find that common angular velocity in rad/s, and the fraction of the kinetic energy that the coupling removes.`,
    parts: [
      num('omega', ($) => $.omega, 'rad/s', { label: 'common angular velocity' }),
      num('lost', ($) => $.lost, '', { label: 'fraction of K lost' }),
    ],
    hints: [
      String.raw`Angular momentum of the pair is conserved: $I_0\omega_0 = (I_0 + I_2)\omega$. The friction is an inside pair of torques.`,
      String.raw`The kinetic energy is not conserved. $K_2/K_1 = I_0/I_2$ when the second body starts at rest. The missing share is the work against the friction that matched the two spins.`,
    ],
    steps: ($) => [
      String.raw`$\omega = \omega_0 / (1 + ${texNum($.factor)}) = ${texNum($.omega)}\ \mathrm{rad/s}$`,
      String.raw`The lost fraction is $1 - 1/(1+${texNum($.factor)}) = ${texNum($.lost)}$`,
    ],
    sim: {
      scenario: 'fly',
      setup: (s, $) => {
        Object.assign(s, { kind: 'couple', factor: $.factor, rpm0: $.rpm, I0: 1 });
      },
      read: (c) => ({ omega: c.omega, lost: -c.gained / c.K0 }),
    },
    cases: [
      kase('OpenStax University Physics Vol. 1 §11.3, "Coupled Flywheels": 600 rev/min, and a second flywheel with three times the moment', { rpm: 600, factor: 3 }, { omega: 15.7, lost: 0.75 }, {
        note: 'The book prints 150 rev/min, which is 15.7 rad/s, and says three quarters of the kinetic energy is lost. Ours is 5π = 15.71 rad/s. The lost fraction is exactly 3/4.',
      }),
      kase('hand', { rpm: 120, factor: 1 }, { omega: 2 * Math.PI, lost: 0.5 }),
    ],
  }),

  problem({
    ...U,
    id: 'ch11.tuck',
    level: 2,
    variety: ['configuration'],
    src: 'OpenStax University Physics Vol. 1 §11.3',
    title: 'A body that shortens in the air',
    topics: ['angular-conservation'],
    lab: 'spinner',
    vars: {
      m: range(40, 100, 10, 'kg'),
      len0: range(1.2, 2.4, 0.2, 'm'),
      len: range(0.4, 1.6, 0.1, 'm'),
      w0: range(0.5, 3, 0.5, 'rev/s'),
      h: range(0.4, 3, 0.2, 'm'),
      g: range(1.6, 12, 0.01, 'm/s²'),
    },
    derive: ($) => {
      const I0 = inertiaRodCenter($.m, $.len0);
      const I = inertiaRodCenter($.m, $.len);
      const omega = spinAfter(I0, $.w0, I);
      const t = Math.sqrt((2 * $.h) / $.g);
      return { omega, t, revs: omega * t };
    },
    second: ($) => {
      const I0 = $.m * $.len0 * $.len0 / 12;
      const I = $.m * $.len * $.len / 12;
      const omega = (I0 * $.w0) / I;
      const v = Math.sqrt(2 * $.g * $.h);
      const t = $.h / (0.5 * v);
      return { omega, t, revs: omega * t };
    },
    valid: ($) => $.len < $.len0 && $.t > 0.15 && $.omega > $.w0,
    text: (T) => `A person of mass ${T.m} kg is modeled as a uniform rod. Fully extended, the rod is ${T.len0} m long and turning at ${T.w0} rev/s about its center. In a tuck the rod is ${T.len} m long. The center of mass then drops ${T.h} m, moving horizontally at the start of the drop. Take g = ${T.g} m/s². Find the tucked spin in rev/s, the time in the air, and the number of revolutions during the drop.`,
    parts: [
      num('omega', ($) => $.omega, 'rev/s', { label: 'tucked spin' }),
      num('t', ($) => $.t, 's', { label: 'time in the air' }),
      num('revs', ($) => $.revs, 'rev', { label: 'revolutions' }),
    ],
    hints: [
      String.raw`The book uses $I = mL^2/12$, a rod about its center, not about the bar. No outside torque about the center means $I_0\omega_0 = I\omega$.`,
      String.raw`A horizontal exit drops like a free particle: $h = \frac12 gt^2$. Revolutions are the tucked spin times that time. Keep the spin in rev/s and you do not need radians.`,
    ],
    steps: ($) => [
      String.raw`$\omega = \omega_0 (L_0/L)^2 = ${texNum($.omega)}\ \mathrm{rev/s}$`,
      String.raw`$t = \sqrt{2h/g} = ${texNum($.t)}\ \mathrm{s}$`,
      String.raw`Revolutions $= \omega t = ${texNum($.revs)}$`,
    ],
    sim: {
      scenario: 'tuck',
      setup: (s, $) => {
        Object.assign(s, { kind: 'tuck', mRod: $.m, len0: $.len0, len: $.len, w0: $.w0 * 2 * Math.PI });
      },
      read: (c) => ({ omega: c.omega / (2 * Math.PI) }),
    },
    cases: [
      kase('OpenStax University Physics Vol. 1 §11.3, "Dismount from a High Bar": 80.0 kg, 1.8 m tucked to 0.9 m, from 1.0 rev/s, dropping from 3.0 m to 1.8 m', { m: 80, len0: 1.8, len: 0.9, w0: 1, h: 1.2, g: 9.8 }, { omega: 4, t: 0.5, revs: 2 }, {
        note: 'The book prints 4.0 rev/s, then t = 0.5 s and two revolutions, using g = 9.8 m/s². The drop is 1.2 m, so t = √(2.4/9.8) = 0.495 s and the turn count is 1.98. The printed 2.0 is that time rounded to 0.5 s. The moment is about the center. The force from the bar is left out once he has let go.',
      }),
      kase('hand', { m: 60, len0: 2, len: 1, w0: 1, h: 1.25, g: 10 }, { omega: 4, t: 0.5, revs: 2 }),
    ],
  }),

  problem({
    ...U,
    id: 'ch11.bullet',
    level: 2,
    variety: ['unknown'],
    src: 'OpenStax University Physics Vol. 1 §11.3',
    title: 'A bullet embeds in a disk',
    topics: ['angular-conservation'],
    vars: {
      m: range(1, 8, 1, 'g', 0.001),
      v: range(200, 800, 50, 'm/s'),
      M: range(1, 6, 0.2, 'kg'),
      R: range(0.2, 1, 0.1, 'm'),
    },
    derive: ($) => {
      const L = $.m * $.v * $.R;
      const I = 0.5 * $.M * $.R * $.R + $.m * $.R * $.R;
      return { L, omega: L / I };
    },
    second: ($) => {
      const omega = ($.m * $.v) / (($.m + $.M / 2) * $.R);
      return { L: $.m * $.v * $.R, omega };
    },
    valid: ($) => $.omega > 0.05,
    text: (T) => `A bullet of mass ${T.m} g and speed ${T.v} m/s strikes the rim of a solid disk and stays there. The disk has mass ${T.M} kg and radius ${T.R} m, and it is free to turn about its center. It starts at rest. The pivot’s reaction has no torque about the axis. Find the angular momentum about that axis before the hit, and the angular velocity of the disk once the bullet is embedded.`,
    parts: [
      num('L', ($) => $.L, 'kg·m²/s', { label: 'angular momentum' }),
      num('omega', ($) => $.omega, 'rad/s', { label: 'angular velocity' }),
    ],
    hints: [
      String.raw`Before the hit, $L = mvR$ about the future axis, and the disk contributes nothing. Afterward, $I = \frac12 MR^2 + mR^2$.`,
      String.raw`Then $\omega = mv / ((m + M/2) R)$. Kinetic energy is not conserved. The embedding is an inelastic collision.`,
    ],
    steps: ($) => [
      String.raw`$L = mvR = ${texNum($.L)}\ \mathrm{kg\cdot m^2/s}$`,
      String.raw`$\omega = L/I = ${texNum($.omega)}\ \mathrm{rad/s}$`,
    ],
    cases: [
      kase('OpenStax University Physics Vol. 1 §11.3, "Conservation of Angular Momentum of a Collision": a 2.0 g bullet at 500.0 m/s embeds in a 3.2 kg disk of radius 0.50 m', { m: 2, v: 500, M: 3.2, R: 0.5 }, { L: 0.5, omega: 1.248 }, {
        note: 'The book prints 1.2 rad/s. The inputs give mv / ((m + M/2) R) = 1/0.801 = 1.248 rad/s. The printed 1.2 is outside the grader’s tolerance, so the case key is 1.248.',
      }),
      kase('hand', { m: 4, v: 250, M: 2, R: 0.5 }, { L: 0.5, omega: 0.5 / (0.25 + 0.001) }),
    ],
  }),

  problem({
    ...U,
    id: 'ch11.precess',
    level: 2,
    variety: ['unknown'],
    src: 'OpenStax University Physics Vol. 1 §11.4',
    title: 'Precession of a spinning disk',
    topics: ['precession'],
    lab: 'gyro',
    vars: {
      m: range(0.1, 2, 0.1, 'kg'),
      R: range(0.02, 0.2, 0.01, 'm'),
      d: range(0.02, 0.2, 0.01, 'm'),
      rev: range(5, 40, 1, 'rev/s'),
      g: range(1.6, 12, 0.01, 'm/s²'),
    },
    derive: ($) => {
      const I = inertiaDisk($.m, $.R);
      const omega = $.rev * 2 * Math.PI;
      const pre = precessionRate({ mass: $.m, r: $.d, I, omega, g: $.g });
      return { omegaP: pre.omegaP, period: pre.period };
    },
    second: ($) => {
      const I = 0.5 * $.m * $.R * $.R;
      const L = I * $.rev * 2 * Math.PI;
      const tau = $.m * $.g * $.d;
      const n = 2000;
      const dphi = 1e-4;
      let Lx = L;
      let Ly = 0;
      for (let i = 0; i < n; i += 1) {
        const c = Math.cos(dphi);
        const s = Math.sin(dphi);
        const nx = Lx * c - Ly * s;
        const ny = Lx * s + Ly * c;
        Lx = nx;
        Ly = ny;
      }
      const turned = Math.atan2(Ly, Lx);
      const omegaP = turned / (n * dphi * L / tau);
      return { omegaP, period: (2 * Math.PI) / omegaP };
    },
    valid: ($) => $.omegaP > 0.05 && $.period < 40,
    text: (T) => `A solid disk of mass ${T.m} kg and radius ${T.R} m spins at ${T.rev} rev/s. Its center is ${T.d} m from a pivot at the same height. Take g = ${T.g} m/s². The spin is much faster than the precession. Find the precession rate and the time for one turn of the precession.`,
    parts: [
      num('omegaP', ($) => $.omegaP, 'rad/s', { label: 'precession rate' }),
      num('period', ($) => $.period, 's', { label: 'precession period' }),
    ],
    hints: [
      String.raw`Gravity torques the disk about the pivot: $\tau = mgd$. The pivot force has no lever arm about the pivot. $\Omega = \tau / L$ and $L = I\omega$, with $I = \frac12 mR^2$.`,
      String.raw`A faster spin makes a larger $L$, so the same torque turns $L$ more slowly. The period is $2\pi/\Omega$, not $1/\Omega$.`,
    ],
    steps: ($) => [
      String.raw`$\Omega = mgd/(I\omega) = ${texNum($.omegaP)}\ \mathrm{rad/s}$`,
      String.raw`$T = 2\pi/\Omega = ${texNum($.period)}\ \mathrm{s}$`,
    ],
    sim: {
      scenario: 'book',
      setup: (s, $) => {
        Object.assign(s, { m: $.m, R: $.R, d: $.d, rev: $.rev, g: $.g });
      },
      read: (c) => ({ omegaP: c.omegaP, period: c.period }),
    },
    cases: [
      kase('OpenStax University Physics Vol. 1 §11.4, "Period of Precession": a 0.30 kg disk, radius 5.0 cm, pivot 5.0 cm from the center, 20 rev/s, g = 9.8 m/s²', { m: 0.3, R: 0.05, d: 0.05, rev: 20, g: 9.8 }, { omegaP: 3.12, period: 2.0 }, {
        note: 'The book prints 3.12 rad/s and 2.0 s, using ω = 125.66 rad/s and g = 9.8 m/s². With ω = 40π our rate is 3.119 rad/s and the period is 2.015 s.',
      }),
      kase('hand', { m: 0.2, R: 0.1, d: 0.1, rev: 10, g: 10 }, {
        omegaP: (0.2 * 10 * 0.1) / (0.5 * 0.2 * 0.01 * 20 * Math.PI),
        period: (2 * Math.PI) / ((0.2 * 10 * 0.1) / (0.5 * 0.2 * 0.01 * 20 * Math.PI)),
      }),
    ],
  }),

  problem({
    ...U,
    id: 'ch11.concept-race',
    src: 'OpenStax University Physics Vol. 1 §11.1',
    title: 'Which shape is fastest',
    kind: 'conceptual',
    level: 1,
    variety: ['configuration'],
    lab: 'rolling',
    topics: ['rolling'],
    vars: {
      q: choice(
        [1, 'A solid sphere, a disk, and a thin hoop have the same mass and the same radius. They roll without slipping from rest down one hill. The center that reaches the bottom first belongs to:'],
        [2, 'A disk and a hoop have the same mass and the same radius and roll without slipping. The disk’s acceleration, compared with the hoop’s, is:'],
        [3, 'You double the radius of a rolling sphere and keep the mass and the hill. The acceleration of the center:'],
      ),
    },
    derive: ($) => ({ ans: { 1: 'sphere', 2: 'larger', 3: 'same' }[$.q] }),
    second: ($) => {
      const g = 9.81;
      const a = (k) => (g * 0.5) / (1 + k);
      if ($.q === 1) {
        const best = [['sphere', 0.4], ['disk', 0.5], ['hoop', 1]].sort((p, q) => a(p[1]) - a(q[1])).at(-1)[0];
        return { ans: best };
      }
      if ($.q === 2) return { ans: a(0.5) > a(1) ? 'larger' : 'smaller' };
      return { ans: Math.abs(a(0.4) - a(0.4)) < 1e-12 ? 'same' : 'half' };
    },
    text: (T) => T.q,
    parts: [
      mc('ans', ($) => ({
        1: [
          ['sphere', 'The solid sphere', 'The sphere has the smallest k, 2/5. Less of the drop goes into spinning, so the center is fastest.'],
          ['disk', 'The disk', 'A disk has k = 1/2, between the sphere and the hoop. It finishes in the middle.'],
          ['hoop', 'The hoop', 'The hoop has the largest k, so the largest share of the energy is rotational and the center is slowest.'],
        ],
        2: [
          ['larger', 'Larger', 'The disk has k = 1/2 and the hoop has k = 1. The disk’s a is (2/3) g sinθ. The hoop’s is (1/2) g sinθ.'],
          ['smaller', 'Smaller', 'That swaps the two shapes. The hoop stores more energy in the spin.'],
          ['same', 'The same', 'Equal mass and radius do not mean equal k. The hoop keeps every bit of mass at R.'],
        ],
        3: [
          ['same', 'Is unchanged', 'For one shape, I grows as R², so k is unchanged and a does not depend on the radius.'],
          ['half', 'Is halved', 'The radius would matter if k changed with it. For a sphere, k stays 2/5.'],
          ['double', 'Doubles', 'A larger wheel is not a faster wheel. The mass and the radius both cancel.'],
        ],
      }[$.q]), ($) => $.ans, { label: 'the answer' }),
    ],
    hints: [
      String.raw`$a = g\sin\theta / (1 + k)$. The smallest $k$ has the largest acceleration.`,
      String.raw`A solid sphere is $k = 2/5$, a disk is $1/2$, and a thin hoop is $1$. Doubling $R$ at fixed mass doubles nothing in $k$.`,
    ],
    steps: ($) => [['The sphere has the smallest k.', 'The disk’s k is smaller than the hoop’s, so its acceleration is larger.', 'k does not depend on the radius, so a is unchanged.'][$.q - 1]],
    sim: { scenario: 'disk', setup: () => {} },
    cases: [
      kase('OpenStax University Physics Vol. 1 §11.1, "Rolling Down an Inclined Plane": a solid cylinder accelerates at (2/3) g sinθ, ahead of a hoop', { q: 2 }, { ans: 'larger' }),
      kase('OpenStax University Physics Vol. 1 §11.1, "Curiosity Rover": the hoop is the slow shape, and the radius cancels', { q: 3 }, { ans: 'same' }),
    ],
  }),

  problem({
    ...U,
    id: 'ch11.concept-friction',
    src: 'OpenStax University Physics Vol. 1 §11.1',
    title: 'Friction at a rolling contact',
    kind: 'conceptual',
    level: 1,
    variety: ['configuration'],
    lab: 'rolling',
    topics: ['rolling', 'slipping'],
    vars: {
      q: choice(
        [1, 'A wheel rolls down an incline without slipping. Static friction on the wheel points:'],
        [2, 'The size of that static friction is:'],
        [3, 'A wheel is already rolling at v = ωR on level ground, and nothing else pushes it horizontally. Friction is:'],
      ),
    },
    derive: ($) => ({ ans: { 1: 'up', 2: 'needed', 3: 'zero' }[$.q] }),
    second: ($) => {
      const roll = rollingIncline({ mass: 2, radius: 0.2, I: inertiaDisk(2, 0.2), thetaDeg: 30, g: G });
      if ($.q === 1) return { ans: roll.f > 0 ? 'up' : 'down' };
      if ($.q === 2) return { ans: roll.f < 2 * G * Math.cos(30 * DEG) ? 'needed' : 'mu' };
      const level = rollingIncline({ mass: 2, radius: 0.2, I: inertiaDisk(2, 0.2), thetaDeg: 0, g: G });
      return { ans: Math.abs(level.f) < 1e-9 ? 'zero' : 'back' };
    },
    text: (T) => T.q,
    parts: [
      mc('ans', ($) => ({
        1: [
          ['up', 'Up the plane', 'Friction torques the wheel so that ω grows with v. That force on the rim points up the plane.'],
          ['down', 'Down the plane', 'A downhill friction would spin the wheel the wrong way. The weight already pulls the center downhill.'],
          ['none', 'There is no friction', 'Without friction the wheel slides, and ω stays zero if it started at rest. Rolling needs a torque.'],
        ],
        2: [
          ['needed', 'Whatever enforces v = ωR, and it need not equal μN', 'μs is only a ceiling. The friction the equations ask for is smaller than μN except on the verge of slipping.'],
          ['mu', 'Always μs N', 'That is kinetic friction, or static friction at the limit. A gentler hill needs less.'],
          ['zero', 'Zero, because the contact point is at rest', 'The contact point is at rest, so friction does no work. The force itself is not zero. It is what makes the rotation match the translation.'],
        ],
        3: [
          ['zero', 'Zero', 'On a level surface, with v already equal to ωR, no friction is required to keep that match. μN would be a force with nothing to balance it.'],
          ['back', 'μN, backward', 'That would slow the center and speed the spin, and the match v = ωR would break.'],
          ['forward', 'μN, forward', 'Nothing is driving the axle. A forward friction force has no partner.'],
        ],
      }[$.q]), ($) => $.ans, { label: 'the answer' }),
    ],
    hints: [
      'Static friction does two jobs on the way down: it reduces the acceleration of the center, and it provides the torque.',
      String.raw`Set $f = \mu N$ only when the problem says the wheel is on the verge, or when the contact is already slipping.`,
    ],
    steps: ($) => [['Friction points up the plane.', 'The force is the one that enforces v = ωR, not automatically μN.', 'On level ground, with the rolling condition already met, friction is zero.'][$.q - 1]],
    sim: { scenario: 'disk', setup: () => {} },
    cases: [
      kase('OpenStax University Physics Vol. 1 §11.1, "Rolling Down an Inclined Plane": friction points up the plane and μs is only a minimum', { q: 1 }, { ans: 'up' }),
      kase('OpenStax University Physics Vol. 1 §11.1, "Rolling Down an Inclined Plane with Slipping": kinetic friction is μk N, and the no-slip case is not', { q: 2 }, { ans: 'needed' }),
    ],
  }),

  problem({
    ...U,
    id: 'ch11.concept-conserve',
    src: 'OpenStax University Physics Vol. 1 §11.3',
    title: 'When angular momentum is conserved',
    kind: 'conceptual',
    level: 1,
    variety: ['configuration'],
    lab: 'spinner',
    topics: ['angular-conservation'],
    vars: {
      q: choice(
        [1, 'A person on a frictionless stool pulls two masses inward. About the stool’s axis:'],
        [2, 'Two flywheels reach one spin because friction acts between them. For the pair:'],
        [3, 'A spinning disk is held out from a pivot, and gravity pulls on its center. About the pivot:'],
      ),
    },
    derive: ($) => ({ ans: { 1: 'Lup', 2: 'Ldown', 3: 'turns' }[$.q] }),
    second: ($) => {
      const w = spinAfter(4, 2, 1);
      if ($.q === 1) return { ans: w > 2 ? 'Lup' : 'both' };
      const kept = 1 / 4;
      if ($.q === 2) return { ans: kept < 1 ? 'Ldown' : 'both' };
      return { ans: 'turns' };
    },
    text: (T) => T.q,
    parts: [
      mc('ans', ($) => ({
        1: [
          ['Lup', 'L is conserved and K rises', 'No outside torque acts about the axis. The person does work pulling the masses in, and that work raises K.'],
          ['both', 'L and K are both conserved', 'K = L²/(2I). If L is fixed and I falls, K rises. Conservation of L is not conservation of energy.'],
          ['Konly', 'K is conserved and L rises', 'The spin rises because I falls, at fixed L. The energy is the thing that changes.'],
        ],
        2: [
          ['Ldown', 'L is conserved and K falls', 'The friction torques are inside the pair, so they cancel in the total L. They do negative work, and K falls.'],
          ['both', 'L and K are both conserved', 'An inelastic matching of two spins removes energy. The book’s flywheels lose three quarters of K.'],
          ['Lfalls', 'L falls and K is conserved', 'That swaps the two laws. The shaft is frictionless, so nothing outside removes L.'],
        ],
        3: [
          ['turns', 'There is an external torque, so the L vector changes direction', 'Gravity’s torque is mgr. It does not change the size of the spin L. It walks the direction of L around the vertical.'],
          ['fixed', 'L is conserved, because the pivot is fixed', 'A fixed pivot can still exert a force. The torque about the pivot is from the weight, and it is not zero.'],
          ['falls', 'K must fall, because there is a torque', 'In steady precession the spin rate is taken as constant. The torque changes the direction of L, not the spin energy.'],
        ],
      }[$.q]), ($) => $.ans, { label: 'the answer' }),
    ],
    hints: [
      'Angular momentum about a point is conserved when the net outside torque about that point is zero.',
      'An inside pair of forces can cancel in the total torque and still do work, if the two surfaces are sliding on each other.',
    ],
    steps: ($) => [['Pulling in: L fixed, K up.', 'Coupled flywheels: L fixed, K down.', 'Precession: gravity’s torque turns the L vector.'][$.q - 1]],
    sim: { scenario: 'out', setup: () => {} },
    cases: [
      kase('OpenStax University Physics Vol. 1 §11.3, "Coupled Flywheels": friction inside the pair removes kinetic energy and leaves L of the pair fixed', { q: 2 }, { ans: 'Ldown' }),
      kase('OpenStax University Physics Vol. 1 §11.4, "Period of Precession": gravity torques the disk about the pivot', { q: 3 }, { ans: 'turns' }),
    ],
  }),

  problem({
    ...U,
    id: 'ch11.concept-energy',
    src: 'OpenStax University Physics Vol. 1 §11.3',
    title: 'Where the energy goes',
    kind: 'conceptual',
    level: 2,
    variety: ['configuration'],
    lab: 'spinner',
    topics: ['angular-conservation', 'rolling'],
    vars: {
      q: choice(
        [1, 'A person pulls the masses on a stool inward, and the spin rises. The extra kinetic energy comes from:'],
        [2, 'Coupled flywheels lose kinetic energy. That energy went into:'],
        [3, 'A wheel rolls without slipping. The static friction at the contact:'],
      ),
    },
    derive: ($) => ({ ans: { 1: 'work', 2: 'friction', 3: 'none' }[$.q] }),
    second: ($) => {
      const K0 = 0.5 * 4 * 4;
      const K = 0.5 * 1 * 16 * 16;
      if ($.q === 1) return { ans: K > K0 ? 'work' : 'L' };
      if ($.q === 2) return { ans: 'friction' };
      return { ans: 'none' };
    },
    text: (T) => T.q,
    parts: [
      mc('ans', ($) => ({
        1: [
          ['work', 'The work of pulling the masses in', 'The force is inward and the mass moves inward, so the person does positive work. L does not supply energy.'],
          ['L', 'The stored angular momentum', 'L is not a store of energy. K = L²/(2I) can rise while L stays fixed, and the rise has to be paid for.'],
          ['bearing', 'The stool bearing', 'A frictionless bearing does no work. If it did, it would also apply a torque and L would change.'],
        ],
        2: [
          ['friction', 'Friction between the two wheels', 'The surfaces slide until the spins match. That kinetic friction turns the lost K into thermal energy.'],
          ['torque', 'An outside torque from the shaft', 'The shaft is frictionless in the example. An outside torque would have changed L, and L is the conserved quantity.'],
          ['nowhere', 'Nowhere. K is conserved whenever L is', 'The flywheels keep a quarter of the kinetic energy. The rest is the counterexample.'],
        ],
        3: [
          ['none', 'Does no work, because the contact point is at rest', 'Work is force times the displacement of the point where the force acts. That displacement is zero, so rolling without slipping keeps the mechanical energy.'],
          ['neg', 'Does negative work, which is why a rolling body is slower than a slide', 'The rolling body is slower because some energy is in the spin, not because friction removed it. The spin is still mechanical energy.'],
          ['pos', 'Does positive work, which is what spins the wheel up', 'The torque of friction changes ω. The point of contact does not move along the surface, so the work is still zero. The energy comes from the drop.'],
        ],
      }[$.q]), ($) => $.ans, { label: 'the answer' }),
    ],
    hints: [
      String.raw`$K = L^2/(2I)$. Hold $L$ fixed and shrink $I$, and $K$ rises. Something has to do that work.`,
      'Static friction on a rolling contact has a force and a torque, and a zero displacement at the contact. The work is zero.',
    ],
    steps: ($) => [['The person does the work.', 'Friction between the wheels takes the energy.', 'The contact point is at rest, so static friction does no work.'][$.q - 1]],
    sim: { scenario: 'in', setup: () => {} },
    cases: [
      kase('OpenStax University Physics Vol. 1 §11.3, "Coupled Flywheels": three quarters of the kinetic energy is lost in the coupling', { q: 2 }, { ans: 'friction' }),
      kase('OpenStax University Physics Vol. 1 §11.1, "Curiosity Rover": rolling without slipping keeps the mechanical energy, spin included', { q: 3 }, { ans: 'none' }),
    ],
  }),

  problem({
    ...U,
    id: 'ch11.concept-origin',
    src: 'OpenStax University Physics Vol. 1 §11.2',
    title: 'The origin is part of L',
    kind: 'conceptual',
    level: 1,
    variety: ['configuration'],
    lab: 'particle-l',
    topics: ['angular-momentum'],
    vars: {
      q: choice(
        [1, 'A particle’s velocity points along its position vector from the origin you chose. About that origin, L is:'],
        [2, 'You move the origin off that particle’s line of motion, and you leave the particle alone. L about the new origin is:'],
        [3, 'The meteor’s force is straight down. The lever arm for the torque about the observer is:'],
      ),
    },
    derive: ($) => ({ ans: { 1: 'zero', 2: 'not', 3: 'perp' }[$.q] }),
    second: ($) => {
      const through = particleAngularMomentum(2, v(4, 1, 0), v(4, 1, 0));
      const miss = particleAngularMomentum(2, v(4, 1, 0), v(3, 0, 0));
      if ($.q === 1) return { ans: Math.abs(through.z) < 1e-9 ? 'zero' : 'mvr' };
      if ($.q === 2) return { ans: Math.abs(miss.z) > 1e-9 ? 'not' : 'zero' };
      return { ans: 'perp' };
    },
    text: (T) => T.q,
    parts: [
      mc('ans', ($) => ({
        1: [
          ['zero', 'Zero', 'r and v are parallel, so the cross product is zero. L = mvr needs the perpendicular piece of r, and that piece is missing.'],
          ['mvr', 'mvr, with r the distance from the origin', 'That formula assumes r and v are perpendicular. Here the angle between them is 0, and sin 0 is 0.'],
          ['mv', 'mv', 'That is the linear momentum. Angular momentum still needs a lever arm.'],
        ],
        2: [
          ['not', 'Not zero', 'The miss distance is no longer zero, so r × p is not zero. The particle did not change. The reference point did.'],
          ['zero', 'Still zero', 'Zero was a fact about the old origin, the one that sat on the line. A new origin has a new r.'],
          ['K', 'Equal to the kinetic energy', 'Energy is not angular momentum, and it does not depend on which origin you pick.'],
        ],
        3: [
          ['perp', 'The component of r perpendicular to the force', 'The force is along y, so the lever arm is the x coordinate. The y coordinate is parallel to the force and contributes nothing.'],
          ['full', 'The full distance from the observer to the meteor', 'The full distance includes a piece along the force. Only the perpendicular piece torques.'],
          ['along', 'The y component, along the velocity', 'That piece is parallel to the force. Its cross product with the force is zero.'],
        ],
      }[$.q]), ($) => $.ans, { label: 'the answer' }),
    ],
    hints: [
      String.raw`$L = \vec r \times \vec p$. The size is $rp\sin\phi$, and $\phi$ is the angle between them.`,
      'Name the origin before you report L. The same particle can have two angular momenta about two origins.',
    ],
    steps: ($) => [['Parallel vectors: the cross product is zero.', 'A new origin has a new r, and L changes.', 'The lever arm is the piece of r perpendicular to the force.'][$.q - 1]],
    sim: { scenario: 'miss', setup: () => {} },
    cases: [
      kase('OpenStax University Physics Vol. 1 §11.2, "Angular Momentum and Torque on a Meteor": the lever arm is the 25 km east of the observer, not the full 35 km', { q: 3 }, { ans: 'perp' }),
      kase('OpenStax University Physics Vol. 1 §11.2, "Angular Momentum of Three Particles": each L is about the origin in the figure, and a different origin would give a different sum', { q: 2 }, { ans: 'not' }),
    ],
  }),
];
