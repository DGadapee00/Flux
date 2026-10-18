import { G, G_FT } from '@flux/subjects/mechanics/constants.js';
import { atwood, bankedCurve, hangingIncline, incline, springCollar, verticalLoop } from '@flux/subjects/mechanics/dynamics.js';
import { inclineState } from '@flux/subjects/mechanics/friction.js';
import { choice, kase, num, problem, range } from '../kit.js';

const DEG = Math.PI / 180;

function blockMotion($, g) {
  const rest = incline({ mass: $.m, thetaDeg: $.theta, mu: $.mus, g, motion: 'rest' });
  if (rest.holds) return { a: 0, N: rest.N };
  const go = incline({ mass: $.m, thetaDeg: $.theta, mu: $.muk, g, motion: 'down' });
  return { a: go.aDown, N: go.N };
}

function blockByFriction($, g) {
  const fr = inclineState({ W: $.m * g, theta: $.theta, mus: $.mus, muk: $.muk });
  const held = fr.regime === 'static' || fr.regime === 'impending';
  return { a: held ? 0 : -fr.net / $.m, N: fr.N };
}

function towSecond($) {
  const th = $.theta * DEG;
  const N = $.m * G * Math.cos(th);
  const drive = $.M * G - $.m * G * Math.sin(th);
  const f = Math.abs(drive) <= $.mus * N + 1e-9
    ? -drive
    : (drive > 0 ? -1 : 1) * $.muk * N;
  const det = $.M * -1 - 1 * $.m;
  const a = ($.M * G * -1 - 1 * (f - $.m * G * Math.sin(th))) / det;
  const T = ($.M * (f - $.m * G * Math.sin(th)) - $.M * G * $.m) / det;
  return { a, T };
}

function bankSecond($) {
  const th = $.theta * DEG;
  const sin = Math.sin(th);
  const cos = Math.cos(th);
  const vmax = Math.sqrt(($.R * G * (sin + $.mu * cos)) / (cos - $.mu * sin));
  const numr = sin - $.mu * cos;
  const vmin = numr <= 0 ? 0 : Math.sqrt(($.R * G * numr) / (cos + $.mu * sin));
  const an = (vmax * vmax) / $.R;
  const nx = sin;
  const ny = cos;
  const dx = cos;
  const dy = -sin;
  const bx = $.m * an;
  const by = $.m * G;
  const det = nx * dy - dx * ny;
  const N = (bx * dy - dx * by) / det;
  return { vmax, vmin, N };
}

function loopSecond($) {
  const phi = $.phi * DEG;
  const steps = 4000;
  // The ramp: energy from height h to the bottom, by the work of gravity alone.
  let v = $.given === 'drop' ? Math.sqrt(2 * (G * $.h)) : $.vb;
  if (phi > 1e-8) {
    const dphi = phi / steps;
    for (let i = 0; i < steps; i++) {
      const at = -G * Math.sin((i + 0.5) * dphi);
      v = Math.sqrt(Math.max(0, v * v + 2 * at * $.R * dphi));
    }
  }
  const N = $.m * ((v * v) / $.R + G * Math.cos(phi));
  return { N, speed: v };
}

function collarSecond($) {
  const th = $.theta * DEG;
  const u = { x: Math.cos(th), y: -Math.sin(th) };
  const wx = 0;
  const wy = -$.m * G;
  const sx = -$.k * $.x * u.x;
  const sy = -$.k * $.x * u.y;
  const along = (wx + sx) * u.x + (wy + sy) * u.y;
  return { a: along / $.m, N: $.m * G * Math.cos(th) };
}

/** Two masses on one string: both hanging, or m1 on a smooth table with m2 hanging off its edge. */
export function pulley($) {
  if ($.config === 'table') {
    const a = ($.m2 * G) / ($.m1 + $.m2);
    return { a, T: $.m1 * a };
  }
  return atwood($.m1, $.m2, G);
}

/** The incline block: released from rest, or shoved up the plane and still sliding up. */
export function inclineBlock($, g) {
  if ($.start === 'up') {
    const go = incline({ mass: $.m, thetaDeg: $.theta, mu: $.muk, g, motion: 'up' });
    return { a: go.aDown, N: go.N };
  }
  return blockMotion($, g);
}

/** Speed at the bottom of the loop: given, or from a release at height h on a smooth ramp. */
export const loopVb = ($) => ($.given === 'drop' ? Math.sqrt(2 * G * $.h) : $.vb);

const ch13 = [
  problem({
    id: 'u2.13.atwood',
    title: 'Two masses over a pulley',
    exam: 'u2',
    ch: '13',
    lab: 'fma',
    src: 'Hibbeler §13.3',
    topics: ['newton', 'pulley'],
    vars: {
      m1: range(1, 6, 0.5, 'kg'),
      m2: range(1, 8, 0.5, 'kg'),
      config: choice(['hang', 'both hang over a light pulley'], ['table', 'are joined over a light pulley at the edge of a smooth table: $m_1$ slides on the table and $m_2$ hangs']),
    },
    valid: ($) => $.m1 > 0 && $.m2 > 0,
    text: (T) => String.raw`Masses $m_1 = ${T.m1}\ \mathrm{kg}$ and $m_2 = ${T.m2}\ \mathrm{kg}$, on a light string, ${T.config}. Take $g = 9.81\ \mathrm{m/s^2}$, and take the acceleration as positive when $m_2$ descends. Find the acceleration and the tension.`,
    parts: [
      num('a', ($) => pulley($).a, 'm/s²', { label: 'acceleration' }),
      num('T', ($) => pulley($).T, 'N', { label: 'tension' }),
    ],
    level: 1,
    hints: ['Write ΣF = ma for each mass. The heavier side descends. The tension is shared.',
      "For the heavier mass, its weight minus the tension equals mass times acceleration. For the lighter mass, the tension minus its weight does the same.",
    ],
    steps: ($, sig) => {
      const row = pulley($);
      if ($.config === 'table') {
        return [
          String.raw`On the table only the string pulls $m_1$ along: $T = m_1 a$. For $m_2$: $m_2 g - T = m_2 a$.`,
          String.raw`Add them: $a = \dfrac{m_2}{m_1 + m_2} g = ${sig(row.a)}\ \mathrm{m/s^2}$.`,
          String.raw`$T = m_1 a = ${sig(row.T)}\ \mathrm{N}$, less than the hanging weight ${sig($.m2 * G)}\ \mathrm{N}$.`,
        ];
      }
      return [
        String.raw`$a = \dfrac{m_2 - m_1}{m_1 + m_2} g = ${sig(row.a)}\ \mathrm{m/s^2}$.`,
        String.raw`$T = \dfrac{2 m_1 m_2}{m_1 + m_2} g = ${sig(row.T)}\ \mathrm{N}$.`,
        String.raw`The weight of $m_2$ is ${sig($.m2 * G)}\ \mathrm{N}$. Those two forces agree only when $a = 0$.`,
      ];
    },
    second($) {
      if ($.config === 'table') {
        // m1: T = m1 a. m2: m2 g − T = m2 a. Cramer's rule on [m1, −1; m2, 1][a; T] = [0; m2 g].
        const det = $.m1 + $.m2;
        return { a: ($.m2 * G) / det, T: ($.m1 * $.m2 * G) / det };
      }
      const det = -$.m2 - $.m1;
      return {
        a: (($.m2 * G) * -1 - 1 * (-$.m1 * G)) / det,
        T: ($.m2 * (-$.m1 * G) - $.m2 * G * $.m1) / det,
      };
    },
    sim: {
      scenario: 'atwood',
      setup(s, $) {
        s.m1 = $.m1;
        s.m2 = $.m2;
        s.v0 = 0;
        s.t = 0;
        if ($.config === 'table') {
          // The tow scenario, laid flat and smooth, is the table.
          Object.assign(s, { scenarioId: 'tow', block: $.m1, hang: $.m2, theta: 0, mus: 0, muk: 0 });
        }
      },
      read: (c) => ({ a: c.a, T: c.T }),
    },
    cases: [
      kase('Hibbeler §13.3', { m1: 2, m2: 4, config: 'hang' }, { a: 3.27, T: 26.16 }),
      kase('Hibbeler §13.3', { m1: 2, m2: 4, config: 'table' }, { a: 6.54, T: 13.08 }),
    ],
  }),

  problem({
    id: 'u2.13.incline',
    title: 'Block on a rough incline',
    exam: 'u2',
    ch: '13',
    lab: 'fma',
    src: 'Hibbeler §13.4',
    topics: ['friction', 'incline'],
    vars: {
      m: range(1, 8, 0.5, 'kg'),
      theta: range(15, 45, 1, 'deg'),
      mus: range(0.15, 0.7, 0.05, ''),
      muk: range(0.05, 0.5, 0.05, ''),
      start: choice(['rest', 'is released from rest'], ['up', 'is shoved up the plane, and is still sliding up it']),
    },
    valid: ($) => $.muk <= $.mus + 1e-9,
    text: (T, $) => ($.start === 'up'
      ? String.raw`A ${T.m} kg block on a ${T.theta}° incline ${T.start}. $\mu_s = ${T.mus}$ and $\mu_k = ${T.muk}$. While it slides up, find its acceleration down the plane, and the normal force.`
      : String.raw`A ${T.m} kg block ${T.start} on a ${T.theta}° incline. $\mu_s = ${T.mus}$ and $\mu_k = ${T.muk}$. Find the downhill acceleration, and the normal force. If it stays put, the acceleration is zero.`),
    parts: [
      num('a', ($) => inclineBlock($, G).a, 'm/s²', { label: 'acceleration down the plane' }),
      num('N', ($) => inclineBlock($, G).N, 'N', { label: 'normal force' }),
    ],
    level: 2,
    hints: ['Compare mg sinθ with μₛN before using μₖ. From rest, friction is kinetic only if the block slides.',
      "The normal is the weight times cos theta. If it slides, the downhill acceleration is g sin theta minus mu_k g cos theta.",
    ],
    steps: ($, sig) => {
      const row = inclineBlock($, G);
      if ($.start === 'up') {
        return [
          String.raw`$N = mg\cos\theta = ${sig(row.N)}\ \mathrm{N}$.`,
          String.raw`It slides up, so kinetic friction points down the plane, with the weight's component.`,
          String.raw`$a = g\sin\theta + \mu_k g\cos\theta = ${sig(row.a)}\ \mathrm{m/s^2}$ down the plane.`,
        ];
      }
      return [
        String.raw`$N = mg\cos\theta = ${sig(row.N)}\ \mathrm{N}$.`,
        row.a === 0
          ? String.raw`$\mu_s N$ is at least $mg\sin\theta$, so the block stays at rest and $a = 0$.`
          : String.raw`It slides, so $a = g\sin\theta - \mu_k g\cos\theta = ${sig(row.a)}\ \mathrm{m/s^2}$.`,
      ];
    },
    second: ($) => {
      if ($.start !== 'up') return blockByFriction($, G);
      // Sliding up: sum the forces along the plane, down-slope positive, as vectors.
      const th = $.theta * DEG;
      const W = [0, -$.m * G];
      const N = $.m * G * Math.cos(th);
      const down = [-Math.cos(th), -Math.sin(th)];
      const f = [down[0] * $.muk * N, down[1] * $.muk * N];
      const along = (W[0] + f[0]) * down[0] + (W[1] + f[1]) * down[1];
      return { a: along / $.m, N };
    },
    sim: {
      scenario: 'incline',
      setup(s, $) {
        s.block = $.m;
        s.theta = $.theta;
        s.mus = $.mus;
        s.muk = $.muk;
        s.v0 = $.start === 'up' ? -1 : 0;
        s.t = 0;
      },
      read: (c) => ({ a: c.a, N: c.N }),
    },
    cases: [
      kase('Hibbeler §13.4', { m: 3, theta: 30, mus: 0.2, muk: 0.15, start: 'rest' }, { a: 3.6306436183311974, N: 25.48712763337603 }),
      kase('Hibbeler §13.4', { m: 3, theta: 30, mus: 0.2, muk: 0.15, start: 'up' }, { a: 6.179356381668803, N: 25.48712763337603 }),
    ],
  }),

  problem({
    id: 'u2.13.tow',
    title: 'Incline tied to a hanging mass',
    exam: 'u2',
    ch: '13',
    lab: 'fma',
    src: 'Hibbeler §13.3',
    topics: ['friction', 'tension'],
    vars: {
      m: range(1, 6, 0.5, 'kg'),
      M: range(1, 8, 0.5, 'kg'),
      theta: range(15, 40, 1, 'deg'),
      mus: range(0.1, 0.6, 0.05, ''),
      muk: range(0.05, 0.45, 0.05, ''),
    },
    valid: ($) => $.muk <= $.mus + 1e-9,
    text: (T) => String.raw`A ${T.m} kg block on a ${T.theta}° incline is tied, over a light pulley, to a hanging ${T.M} kg mass. $\mu_s = ${T.mus}$ and $\mu_k = ${T.muk}$. The system starts from rest. Take acceleration as positive when the hanging mass descends. Find that acceleration and the tension.`,
    parts: [
      num('a', ($) => hangingIncline({ block: $.m, hang: $.M, thetaDeg: $.theta, muk: $.muk, mus: $.mus, g: G, v0: 0 }).a, 'm/s²', { label: 'acceleration' }),
      num('T', ($) => hangingIncline({ block: $.m, hang: $.M, thetaDeg: $.theta, muk: $.muk, mus: $.mus, g: G, v0: 0 }).T, 'N', { label: 'tension' }),
    ],
    level: 2,
    hints: ['One coordinate for both bodies. Static friction holds when it can cancel the unbalanced force.',
      "Take the hanging mass descending as the positive direction. Friction on the block then points up the plane.",
    ],
    steps: ($, sig) => {
      const row = hangingIncline({ block: $.m, hang: $.M, thetaDeg: $.theta, muk: $.muk, mus: $.mus, g: G, v0: 0 });
      return [
        row.holds
          ? String.raw`Static friction holds the system, so $a = 0$ and $T = Mg = ${sig(row.T)}\ \mathrm{N}$.`
          : String.raw`It slides. $a = ${sig(row.a)}\ \mathrm{m/s^2}$ and $T = M(g - a) = ${sig(row.T)}\ \mathrm{N}$.`,
        String.raw`The hanging weight is ${sig($.M * G)}\ \mathrm{N}.`,
      ];
    },
    second: ($) => towSecond($),
    sim: {
      scenario: 'tow',
      setup(s, $) {
        s.block = $.m;
        s.hang = $.M;
        s.theta = $.theta;
        s.mus = $.mus;
        s.muk = $.muk;
        s.v0 = 0;
        s.t = 0;
      },
      read: (c) => ({ a: c.a, T: c.T }),
    },
    cases: [kase('Hibbeler §13.3', { m: 4, M: 6, theta: 30, mus: 0.3, muk: 0.2 }, { a: 3.2443432631099727, T: 39.39394042134017 })],
  }),

  problem({
    id: 'u2.13.bank',
    title: 'Speed band on a banked curve',
    exam: 'u2',
    ch: '13',
    lab: 'curve',
    src: 'Hibbeler §13.5',
    topics: ['bank'],
    vars: {
      m: range(400, 1600, 50, 'kg'),
      R: range(20, 80, 5, 'm'),
      theta: range(10, 25, 1, 'deg'),
      mu: range(0, 0.35, 0.05, ''),
    },
    valid: ($) => {
      const th = $.theta * DEG;
      return Math.cos(th) - $.mu * Math.sin(th) > 0.05;
    },
    text: (T) => String.raw`A ${T.m} kg car rounds a curve of radius ${T.R} m banked at ${T.theta}°. The static coefficient is $\mu_s = ${T.mu}$. Find the slowest and fastest speeds that stay on the bank without slipping, and the normal force at the fastest speed.`,
    parts: [
      num('vmin', ($) => bankedCurve({ mass: $.m, radius: $.R, thetaDeg: $.theta, mu: $.mu, g: G }).vMin, 'm/s', { label: 'minimum speed' }),
      num('vmax', ($) => bankedCurve({ mass: $.m, radius: $.R, thetaDeg: $.theta, mu: $.mu, g: G }).vMax, 'm/s', { label: 'maximum speed' }),
      num('N', ($) => {
        const row = bankedCurve({ mass: $.m, radius: $.R, thetaDeg: $.theta, mu: $.mu, g: G });
        return bankedCurve({ mass: $.m, radius: $.R, thetaDeg: $.theta, speed: row.vMax, mu: $.mu, g: G }).N;
      }, 'N', { label: 'normal force at the maximum speed' }),
    ],
    level: 3,
    hints: ['With no friction there is one speed, √(ρ g tanθ). Friction down the bank raises the maximum. Friction up the bank lowers the minimum.',
      "Resolve the normal and the friction into horizontal and vertical parts. The vertical sum is zero. The horizontal sum is mass times v squared over the radius.",
      "Friction up the bank and friction down the bank are two free-body diagrams. Each one has its own speed.",
    ],
    steps: ($, sig) => {
      const row = bankedCurve({ mass: $.m, radius: $.R, thetaDeg: $.theta, mu: $.mu, g: G });
      const at = bankedCurve({ mass: $.m, radius: $.R, thetaDeg: $.theta, speed: row.vMax, mu: $.mu, g: G });
      return [
        String.raw`The no-friction speed is ${sig(row.vDesign)}\ \mathrm{m/s}.`,
        String.raw`With friction the band is ${sig(row.vMin)} to ${sig(row.vMax)}\ \mathrm{m/s}.`,
        String.raw`At the top of that band, $N = ${sig(at.N)}\ \mathrm{N}$.`,
      ];
    },
    second: ($) => bankSecond($),
    sim: {
      scenario: 'band',
      setup(s, $) {
        s.mass = $.m;
        s.radius = $.R;
        s.theta = $.theta;
        s.mu = $.mu;
        s.speed = 0;
      },
      read: (c) => ({ vmin: c.vMin, vmax: c.vMax, N: c.nTop }),
    },
    cases: [kase('Hibbeler §13.5', { m: 1000, R: 40, theta: 20, mu: 0.2 }, {
      vmin: 7.744418798838714,
      vmax: 15.449146275256043,
      N: 11259.185634603346,
    })],
  }),

  problem({
    id: 'u2.13.loop',
    title: 'Normal force in a vertical loop',
    exam: 'u2',
    ch: '13',
    lab: 'curve',
    src: 'Hibbeler §13.5',
    topics: ['loop'],
    vars: {
      m: range(0.4, 3, 0.2, 'kg'),
      R: range(0.4, 1.2, 0.1, 'm'),
      vb: range(3, 9, 0.5, 'm/s'),
      h: range(1, 6, 0.5, 'm'),
      phi: choice([60, '60'], [120, '120'], [150, '150'], [180, '180']),
      given: choice(['speed', 'its speed at the bottom'], ['drop', 'the height it starts from']),
    },
    valid: ($) => loopVb($) ** 2 >= 2 * G * $.R * (1 - Math.cos($.phi * DEG)) + 0.2,
    text: (T, $) => ($.given === 'drop'
      ? String.raw`A ${T.m} kg particle is released from rest ${T.h} m above the bottom of a smooth vertical loop of radius ${T.R} m, and slides down a smooth ramp into it. Find the speed and the normal force, toward the centre, at ${T.phi}° from the bottom.`
      : String.raw`A ${T.m} kg particle slides on the inside of a smooth vertical loop of radius ${T.R} m. Its speed at the bottom is ${T.vb} m/s. Find the speed and the normal force, toward the centre, at ${T.phi}° from the bottom.`),
    parts: [
      num('speed', ($) => verticalLoop({ mass: $.m, radius: $.R, speedBottom: loopVb($), phiDeg: $.phi, g: G }).speed, 'm/s', { label: 'speed' }),
      num('N', ($) => verticalLoop({ mass: $.m, radius: $.R, speedBottom: loopVb($), phiDeg: $.phi, g: G }).N, 'N', { label: 'normal force' }),
    ],
    level: 2,
    hints: ['The height above the bottom is ρ(1 − cosφ). Then ΣF toward the centre is m v²/ρ.',
      "Use energy to get the speed at that angle. At the top the weight points toward the centre, so it helps supply the normal acceleration.",
    ],
    steps: ($, sig) => {
      const row = verticalLoop({ mass: $.m, radius: $.R, speedBottom: loopVb($), phiDeg: $.phi, g: G });
      return [
        ...($.given === 'drop' ? [String.raw`At the bottom, $v_b = \sqrt{2gh} = ${sig(loopVb($))}\ \mathrm{m/s}$.`] : []),
        String.raw`The drop from the start is ${sig(row.drop)}\ \mathrm{m}, so $v = ${sig(row.speed)}\ \mathrm{m/s}$.`,
        String.raw`$N = m(v^2/\rho + g\cos\phi) = ${sig(row.N)}\ \mathrm{N}$.`,
      ];
    },
    second: ($) => loopSecond($),
    sim: {
      scenario: 'loop',
      setup(s, $) {
        s.mass = $.m;
        s.radius = $.R;
        s.vb = loopVb($);
        s.phi = $.phi;
      },
      read: (c) => ({ speed: c.speed, N: c.N }),
    },
    cases: [
      kase('Hibbeler §13.5', { m: 0.5, R: 0.4, vb: 5, h: 2, phi: 180, given: 'speed' }, { speed: 3.0502458917274193, N: 6.724999999999997 }),
      kase('Hibbeler §13.5', { m: 0.5, R: 0.4, vb: 5, h: 2, phi: 180, given: 'drop' }, { speed: 4.852215988597375, N: 24.525 }),
    ],
  }),

  problem({
    id: 'u2.13.spring',
    title: 'Spring-attached collar',
    exam: 'u2',
    ch: '13',
    lab: null,
    src: 'Hibbeler §13.4',
    topics: ['spring'],
    vars: {
      m: range(0.5, 4, 0.5, 'kg'),
      k: range(20, 80, 5, 'N/m'),
      x: range(-0.2, 0.4, 0.05, 'm'),
      theta: range(15, 45, 5, 'deg'),
      given: choice(['stretch', 'its stretch'], ['length', 'its length']),
    },
    text: (T, $, sig) => ($.given === 'length'
      ? String.raw`A ${T.m} kg collar slides on a smooth rod at ${T.theta}° above the horizontal. A spring of stiffness ${T.k} N/m lies along the rod, fixed to the rod above the collar. Its free length is 0.300 m, and it is now ${sig(0.3 + $.x)} m long. Find the acceleration down the rod and the force from the rod.`
      : String.raw`A ${T.m} kg collar slides on a smooth rod at ${T.theta}° above the horizontal. A spring of stiffness ${T.k} N/m lies along the rod and is stretched ${T.x} m past its free length, positive down the rod. Find the acceleration down the rod and the force from the rod.`),
    parts: [
      num('a', ($) => springCollar({ mass: $.m, k: $.k, x: $.x, thetaDeg: $.theta, g: G }).a, 'm/s²', { label: 'acceleration down the rod' }),
      num('N', ($) => springCollar({ mass: $.m, k: $.k, x: $.x, thetaDeg: $.theta, g: G }).N, 'N', { label: 'force from the rod' }),
    ],
    level: 2,
    hints: ['The spring force is kx along the rod. The rod force cancels the part of the weight perpendicular to the rod.',
      "Along the rod, the downhill part of the weight minus k x equals mass times acceleration. x is the stretch, measured down the rod from the unstretched point.",
    ],
    steps: ($, sig) => {
      const row = springCollar({ mass: $.m, k: $.k, x: $.x, thetaDeg: $.theta, g: G });
      return [
        ...($.given === 'length' ? [String.raw`The stretch is the length less the free length: $x = ${sig(0.3 + $.x)} - 0.300 = ${sig($.x)}\ \mathrm{m}$.`] : []),
        String.raw`The spring force is ${sig(row.spring)}\ \mathrm{N} up the rod when the stretch is positive.`,
        String.raw`$a = g\sin\theta - (k/m) x = ${sig(row.a)}\ \mathrm{m/s^2}$.`,
        String.raw`$N = mg\cos\theta = ${sig(row.N)}\ \mathrm{N}$.`,
      ];
    },
    second: ($) => collarSecond($),
    cases: [
      kase('Hibbeler §13.4', { m: 2, k: 30, x: 0.1, theta: 20, given: 'stretch' }, { a: 1.8552176060248105, N: 18.436769219819524 }),
      kase('Hibbeler §13.4', { m: 2, k: 30, x: 0.1, theta: 20, given: 'length' }, { a: 1.8552176060248105, N: 18.436769219819524 }),
    ],
  }),

  problem({
    id: 'u2.13.incline-ft',
    title: 'Incline in US customary units',
    exam: 'u2',
    ch: '13',
    lab: null,
    src: 'Hibbeler §13.4',
    topics: ['friction', 'incline'],
    vars: {
      m: range(1, 5, 0.5, 'slug'),
      theta: range(15, 40, 1, 'deg'),
      mus: range(0.2, 0.7, 0.05, ''),
      muk: range(0.1, 0.5, 0.05, ''),
    },
    valid: ($) => $.muk <= $.mus + 1e-9,
    text: (T) => String.raw`A block of mass ${T.m} slug is released from rest on a ${T.theta}° incline. $\mu_s = ${T.mus}$ and $\mu_k = ${T.muk}$. Use $g = 32.2\ \mathrm{ft/s^2}$. Find the downhill acceleration and the normal force.`,
    parts: [
      num('a', ($) => blockMotion($, G_FT).a, 'ft/s²', { label: 'acceleration down the plane' }),
      num('N', ($) => blockMotion($, G_FT).N, 'lb', { label: 'normal force' }),
    ],
    level: 2,
    hints: ['The US customary mass unit in F = ma is the slug. The weight is m times 32.2.',
      "The normal is the weight times cos theta. Test static friction against the downhill part of the weight before using mu_k.",
    ],
    steps: ($, sig) => {
      const row = blockMotion($, G_FT);
      return [
        String.raw`The weight is ${sig($.m * G_FT)}\ \mathrm{lb}. $N = ${sig(row.N)}\ \mathrm{lb}$.`,
        row.a === 0
          ? 'Static friction holds the block, so the acceleration is zero.'
          : String.raw`$a = ${sig(row.a)}\ \mathrm{ft/s^2}$ down the plane.`,
      ];
    },
    second: ($) => blockByFriction($, G_FT),
    cases: [kase('Hibbeler §13.4', { m: 2, theta: 30, mus: 0.5, muk: 0.2 }, { a: 10.522796399628213, N: 55.77203600371786 })],
  }),
];

export default ch13;
