import { convert, FT_LBF_PER_S_PER_HP } from '@flux/subjects/convert.js';
import { G, G_FT } from '@flux/subjects/mechanics/constants.js';
import { collarPath, collarTrip, power, springStop, work } from '@flux/subjects/mechanics/energy.js';
import { archMotion, pathReport } from '../../labs/pathwork.js';
import { choice, kase, mc, num, problem, range } from '../kit.js';

const DEG = Math.PI / 180;

function slideSpeed($, g, mu) {
  const steps = 4000;
  const th = $.theta * DEG;
  const sin = Math.sin(th);
  const cos = Math.cos(th);
  const dir = Math.sign($.x2 - $.x1) || 1;
  const dx = ($.x2 - $.x1) / steps;
  let v2 = $.v1 * $.v1;
  for (let i = 0; i < steps; i++) {
    const x = $.x1 + (i + 0.5) * dx;
    const a = g * sin - ($.k / $.m) * x - mu * g * cos * dir;
    v2 += 2 * a * dx;
    if (v2 < -1e-8) return 0;
  }
  return Math.sqrt(Math.max(0, v2));
}

function reaches($, g, mu) {
  return collarTrip({ mass: $.m, k: $.k, thetaDeg: $.theta, x1: $.x1, x2: $.x2, v1: $.v1, mu, g }).reaches;
}

/** Speed on reaching the spring: friction has already worked over the gap, if there is one. */
export const contactSpeed = ($) => Math.sqrt($.v * $.v - 2 * $.mu * G * ($.start === 'gap' ? $.d : 0));

function stopRoot($) {
  let lo = 0;
  let hi = 1;
  const energy = (x) => collarTrip({ mass: $.m, k: $.k, thetaDeg: 0, x1: 0, x2: x, v1: contactSpeed($), mu: $.mu, g: G }).t2;
  while (energy(hi) > 0 && hi < 1e4) hi *= 2;
  for (let i = 0; i < 60; i++) {
    const mid = 0.5 * (lo + hi);
    if (energy(mid) > 0) lo = mid;
    else hi = mid;
  }
  return 0.5 * (lo + hi);
}

function pull($) {
  if ($.route === 'hoist') return $.m * G;
  const parallel = work($.m * G, 1, 90 - $.theta);
  const friction = work($.mu * $.m * G, 1, $.theta);
  return parallel + friction;
}

function archFriction($) {
  const motion = archMotion([$.ax, $.ay], [$.bx, $.by], $.rise);
  const steps = 2400;
  let length = 0;
  let conservative = 0;
  for (let i = 0; i < steps; i++) {
    const t = (i + 0.5) / steps;
    const p = motion(t);
    const dx = p.dx / steps;
    const dy = p.dy / steps;
    length += Math.hypot(dx, dy);
    const len = Math.hypot(p.x, p.y);
    const sx = len > 1e-9 ? -$.k * p.x : 0;
    const sy = len > 1e-9 ? -$.k * p.y : 0;
    conservative += sx * dx + (sy - $.m * G) * dy;
  }
  return { work: conservative, friction: -$.mu * $.m * G * length };
}

function detour($) {
  const mu = $.kind === 'friction' ? $.mu : 0;
  const common = { mass: 2, k: $.k, thetaDeg: 30, v1: 4, mu, g: G };
  const straight = collarTrip({ ...common, x1: $.x1, x2: $.x2 });
  const via = collarPath({ ...common, points: [$.x1, $.xFar, $.x2] });
  return { straight, via };
}

/** Two cars lock together head-on, seen from the ground or from a train moving with car A. Car A moves east. */
function frameEnergy($) {
  const f = $.frame === 'train' ? $.v1 : 0;
  const u1 = $.v1 - f;
  const u2 = -$.v2 - f;
  const vf = ($.m1 * u1 + $.m2 * u2) / ($.m1 + $.m2);
  const before = 0.5 * $.m1 * u1 * u1 + 0.5 * $.m2 * u2 * u2;
  const after = 0.5 * ($.m1 + $.m2) * vf * vf;
  return { u1, u2, vf, before, after, lost: before - after };
}

const ch14 = [
  problem({
    id: 'u3.14.speed',
    title: 'Speed from a spring',
    exam: 'u3',
    ch: '14',
    lab: 'collar',
    src: 'Hibbeler §14.2',
    topics: ['energy', 'spring'],
    vars: {
      m: range(1, 4, 0.5, 'kg'),
      k: range(40, 120, 5, 'N/m'),
      theta: range(15, 40, 5, 'deg'),
      x1: range(0.3, 0.7, 0.05, 'm'),
      x2: range(0, 0.2, 0.05, 'm'),
      v1: range(0, 3, 0.5, 'm/s'),
    },
    valid: ($) => $.x1 > $.x2 + 0.05 && reaches($, G, 0),
    text: (T) => String.raw`A ${T.m} kg collar slides on a smooth rod at ${T.theta}° above the horizontal. A spring lies along the rod. Measure $x$ down the rod from the unstretched point, so the stretch equals $x$. The spring has $k = ${T.k}$ N/m. The collar passes $x = ${T.x1}$ m at ${T.v1} m/s. Find its speed at $x = ${T.x2}$ m.`,
    parts: [
      num('speed', ($) => collarPath({ mass: $.m, k: $.k, thetaDeg: $.theta, points: [$.x1, $.x2], v1: $.v1, mu: 0, g: G }).speed, 'm/s', { label: 'speed at the end' }),
    ],
    level: 2,
    hints: ['The spring work is one half k times the change in the square of the stretch. Gravity uses the height change along the rod.',
      "x is measured down the rod from the unstretched point, so the stretch equals x. Gravity does m g sin theta times (x2 minus x1).",
    ],
    steps: ($, sig) => {
      const row = collarPath({ mass: $.m, k: $.k, thetaDeg: $.theta, points: [$.x1, $.x2], v1: $.v1, mu: 0, g: G });
      return [
        String.raw`Spring work: $\tfrac{1}{2}k(s_1^2-s_2^2) = ${sig(row.spring)}\ \mathrm{J}$.`,
        String.raw`Gravity: $mg\sin\theta\,(s_2-s_1) = ${sig(row.gravity)}\ \mathrm{J}$.`,
        String.raw`$T_1 + \sum U = T_2$ gives $v_2 = ${sig(row.speed)}\ \mathrm{m/s}$.`,
      ];
    },
    second: ($) => ({ speed: slideSpeed($, G, 0) }),
    sim: {
      scenario: 'smooth',
      setup(s, $) {
        s.mass = $.m;
        s.k = $.k;
        s.theta = $.theta;
        s.mu = 0;
        s.x1 = $.x1;
        s.x2 = $.x2;
        s.v1 = $.v1;
      },
      read: (c) => ({ speed: c.speed }),
    },
    cases: [kase('Hibbeler §14.2', { m: 2, k: 80, theta: 30, x1: 0.5, x2: 0, v1: 0 }, { speed: 2.2572106680591424 })],
  }),

  problem({
    id: 'u3.14.rough',
    title: 'Collar slowed by friction',
    exam: 'u3',
    ch: '14',
    lab: 'collar',
    src: 'Hibbeler §14.2',
    topics: ['energy', 'friction'],
    vars: {
      m: range(1, 4, 0.5, 'kg'),
      k: range(40, 120, 5, 'N/m'),
      theta: range(15, 40, 5, 'deg'),
      mu: range(0.1, 0.3, 0.05, ''),
      x1: range(0.3, 0.7, 0.05, 'm'),
      x2: range(0, 0.2, 0.05, 'm'),
      v1: range(0, 3, 0.5, 'm/s'),
    },
    valid: ($) => $.x1 > $.x2 + 0.05 && reaches($, G, $.mu),
    text: (T) => String.raw`A ${T.m} kg collar slides on a rough rod at ${T.theta}° above the horizontal, with $\mu_k = ${T.mu}$. A spring lies along the rod. Measure $x$ down the rod from the unstretched point, so the stretch equals $x$. The spring has $k = ${T.k}$ N/m. The collar passes $x = ${T.x1}$ m at ${T.v1} m/s and does not turn around before $x = ${T.x2}$ m. Find its speed there. The rod carries the weight component perpendicular to the rod, so the normal is $mg\cos\theta$.`,
    parts: [
      num('speed', ($) => collarPath({ mass: $.m, k: $.k, thetaDeg: $.theta, points: [$.x1, $.x2], v1: $.v1, mu: $.mu, g: G }).speed, 'm/s', { label: 'speed at the end' }),
    ],
    level: 2,
    hints: ['Add the friction work: minus the kinetic coefficient times the normal times the distance. The spring work is unchanged.',
      "The normal is m g cos theta, because the spring lies along the rod. On one leg, friction work is minus mu_k times that normal times the distance.",
    ],
    steps: ($, sig) => {
      const row = collarPath({ mass: $.m, k: $.k, thetaDeg: $.theta, points: [$.x1, $.x2], v1: $.v1, mu: $.mu, g: G });
      return [
        String.raw`The spring still does ${sig(row.spring)}\ \mathrm{J}.`,
        String.raw`Friction does ${sig(row.friction)}\ \mathrm{J} over ${sig(Math.abs($.x2 - $.x1))}\ \mathrm{m}.`,
        String.raw`The speed at the end is ${sig(row.speed)}\ \mathrm{m/s}.`,
      ];
    },
    second: ($) => ({ speed: slideSpeed($, G, $.mu) }),
    sim: {
      scenario: 'rough',
      setup(s, $) {
        s.mass = $.m;
        s.k = $.k;
        s.theta = $.theta;
        s.mu = $.mu;
        s.x1 = $.x1;
        s.x2 = $.x2;
        s.v1 = $.v1;
      },
      read: (c) => ({ speed: c.speed }),
    },
    cases: [kase('Hibbeler §14.2', { m: 2, k: 80, theta: 30, mu: 0.2, x1: 0.5, x2: 0, v1: 0 }, { speed: 1.8427854345460113 })],
  }),

  problem({
    id: 'u3.14.stop',
    title: 'Where the spring stops it',
    exam: 'u3',
    ch: '14',
    lab: null,
    src: 'Hibbeler §14.1',
    topics: ['spring', 'friction'],
    // Designed numbers: the compression is picked, and the speed that gives it follows.
    vars: {
      m: range(2, 5, 0.5, 'kg'),
      k: range(20, 50, 5, 'N/m'),
      xs: range(0.2, 0.5, 0.05, 'm'),
      mu: range(0.1, 0.3, 0.05, ''),
      d: range(0.5, 1.5, 0.25, 'm'),
      start: choice(['contact', 'as it meets the spring'], ['gap', 'some way short of the spring']),
    },
    derive: ($) => ({ v: Math.sqrt(($.k * $.xs * $.xs) / $.m + 2 * $.mu * G * ($.xs + ($.start === 'gap' ? $.d : 0))) }),
    text: (T, $, sig) => ($.start === 'gap'
      ? String.raw`A ${T.m} kg block slides on a horizontal surface. It is moving at $${sig($.v)}$ m/s when it is ${T.d} m short of a spring of stiffness ${T.k} N/m. $\mu_k = ${T.mu}$ on the whole surface. The spring is unstretched at the contact. How far is the spring compressed when the block stops?`
      : String.raw`A ${T.m} kg block slides on a horizontal surface at $${sig($.v)}$ m/s and meets a spring of stiffness ${T.k} N/m. $\mu_k = ${T.mu}$. The spring is unstretched at the contact. How far is the spring compressed when the block stops?`),
    parts: [
      num('x', ($) => springStop({ mass: $.m, k: $.k, v: contactSpeed($), mu: $.mu, g: G }), 'm', { label: 'compression' }),
    ],
    level: 2,
    hints: ['Set the final kinetic energy to zero. Friction does minus mu m g times the compression, and the spring stores one half k x squared.',
      "The compression appears in the spring term and in the friction term. Bring both to one side and keep the positive root.",
    ],
    steps: ($, sig) => {
      const x = springStop({ mass: $.m, k: $.k, v: contactSpeed($), mu: $.mu, g: G });
      return [
        ...($.start === 'gap' ? [String.raw`Over the gap, friction takes $\mu_k mg d$: the block meets the spring at $v_c = \sqrt{v^2 - 2\mu_k g d} = ${sig(contactSpeed($))}$ m/s.`] : []),
        String.raw`$\tfrac{1}{2}mv_c^2 = \tfrac{1}{2}kx^2 + \mu mgx$.`,
        String.raw`The compression is ${sig(x)}\ \mathrm{m}.`,
      ];
    },
    second: ($) => ({ x: stopRoot($) }),
    cases: [
      kase('Hibbeler §14.1', { m: 2, k: 40, xs: 0.5, mu: 0.1, d: 1, start: 'contact' }, { x: 0.5 }),
      kase('Hibbeler §14.1', { m: 2, k: 40, xs: 0.5, mu: 0.1, d: 1, start: 'gap' }, { x: 0.5 }),
    ],
  }),

  problem({
    id: 'u3.14.power',
    title: 'Power to climb at constant speed',
    exam: 'u3',
    ch: '14',
    lab: null,
    src: 'Hibbeler §14.4',
    topics: ['power'],
    vars: {
      m: range(2, 10, 1, 'kg'),
      theta: range(10, 35, 5, 'deg'),
      mu: range(0.1, 0.3, 0.05, ''),
      v: range(0.5, 3, 0.5, 'm/s'),
      eta: range(0.6, 0.9, 0.05, ''),
      route: choice(['incline', 'up a rough incline'], ['hoist', 'straight up on a hoist']),
    },
    text: (T, $) => ($.route === 'hoist'
      ? String.raw`A motor hoists a ${T.m} kg load straight up at a constant ${T.v} m/s. The motor's efficiency is ${T.eta}. Find the output power, and the input power the motor draws.`
      : String.raw`A ${T.m} kg block is pulled up a ${T.theta}° incline at a constant ${T.v} m/s. $\mu_k = ${T.mu}$. The motor's efficiency is ${T.eta}. Find the output power, and the input power the motor draws.`),
    parts: [
      num('P', ($) => power(pull($), $.v), 'W', { label: 'output power' }),
      num('Pin', ($) => power(pull($), $.v) / $.eta, 'W', { label: 'input power' }),
    ],
    level: 2,
    hints: ['At constant speed the pull equals the downhill part of the weight plus kinetic friction. Power is that force times the speed. Input power is the output divided by the efficiency.',
      "The output is the smaller power. Divide it by the efficiency. Multiplying by the efficiency gives the wrong input.",
    ],
    steps: ($, sig) => {
      const F = pull($);
      const P = power(F, $.v);
      return [
        String.raw`The pull is ${sig(F)}\ \mathrm{N}.`,
        String.raw`Output power: $P = Fv = ${sig(P)}\ \mathrm{W}$.`,
        String.raw`Input power: $P/\eta = ${sig(P / $.eta)}\ \mathrm{W}$.`,
      ];
    },
    second: ($) => {
      const th = $.theta * DEG;
      const F = $.route === 'hoist' ? $.m * G : $.m * G * (Math.sin(th) + $.mu * Math.cos(th));
      const P = F * $.v;
      return { P, Pin: P / $.eta };
    },
    cases: [
      kase('Hibbeler §14.4', { m: 4, theta: 25, mu: 0.15, v: 2, eta: 0.8, route: 'incline' }, { P: 43.83613645040553, Pin: 54.79517056300691 }),
      kase('Hibbeler §14.4', { m: 4, theta: 25, mu: 0.15, v: 2, eta: 0.8, route: 'hoist' }, { P: 78.48, Pin: 98.1 }),
    ],
  }),

  problem({
    id: 'u3.14.hp',
    title: 'Horsepower at a steady pull',
    exam: 'u3',
    ch: '14',
    lab: null,
    src: 'Hibbeler §14.4',
    topics: ['power'],
    vars: {
      F: range(20, 80, 5, 'lb'),
      v: range(2, 12, 1, 'ft/s'),
      FN: range(100, 400, 25, 'N'),
      vm: range(0.5, 4, 0.5, 'm/s'),
      units: choice(['us', 'in pounds and feet'], ['si', 'in newtons and metres']),
    },
    text: (T, $) => ($.units === 'si'
      ? String.raw`A winch pulls with a steady ${T.FN} N at ${T.vm} m/s. Find the power in horsepower. One horsepower is 745.7 W.`
      : String.raw`A winch pulls with a steady ${T.F} lb at ${T.v} ft/s. Find the power in horsepower. One horsepower is 550 ft·lb/s.`),
    parts: [
      num('hp', ($) => ($.units === 'si' ? convert($.FN * $.vm, 'W', 'hp') : ($.F * $.v) / FT_LBF_PER_S_PER_HP), 'hp', { label: 'power' }),
    ],
    level: 1,
    hints: ['Power is force times speed. Divide foot-pounds per second by 550 to get horsepower.',
      "Keep the force and the speed in one system. Then divide by that system's horsepower: 550 ft·lb/s, or 745.7 W.",
    ],
    steps: ($, sig) => ($.units === 'si'
      ? [String.raw`$P = Fv = ${sig($.FN * $.vm)}$ W.`, String.raw`That is ${sig(convert($.FN * $.vm, 'W', 'hp'))} horsepower.`]
      : [String.raw`$P = Fv = ${sig($.F * $.v)}$ ft·lb/s.`, String.raw`That is ${sig(($.F * $.v) / FT_LBF_PER_S_PER_HP)} horsepower.`]),
    second: ($) => {
      if ($.units === 'si') return { hp: (convert($.FN, 'N', 'lbf') * convert($.vm, 'm', 'ft')) / FT_LBF_PER_S_PER_HP };
      const watts = convert($.F, 'lbf', 'N') * convert($.v, 'ft', 'm');
      return { hp: convert(watts, 'W', 'hp') };
    },
    cases: [
      kase('Hibbeler §14.4', { F: 40, v: 8, FN: 200, vm: 2, units: 'us' }, { hp: 0.5818181818181818 }),
      kase('Hibbeler §14.4', { F: 40, v: 8, FN: 200, vm: 2, units: 'si' }, { hp: 0.5364088358380112 }),
    ],
  }),

  problem({
    id: 'u3.14.paths',
    title: 'Work on three paths',
    exam: 'u3',
    ch: '14',
    lab: 'paths',
    src: 'Hibbeler §14.5',
    topics: ['path', 'spring'],
    vars: {
      m: range(0.6, 2, 0.2, 'kg'),
      k: range(5, 40, 5, 'N/m'),
      mu: range(0.1, 0.4, 0.05, ''),
      rise: range(0.15, 0.6, 0.05, 'm'),
      ax: range(0.1, 0.4, 0.1, 'm'),
      ay: range(0.6, 1.4, 0.2, 'm'),
      bx: range(1.1, 1.6, 0.1, 'm'),
      by: range(0.2, 0.8, 0.2, 'm'),
    },
    valid: ($) => Math.hypot($.bx - $.ax, $.by - $.ay) > 0.3,
    text: (T) => String.raw`A ${T.m} kg particle moves from (${T.ax}, ${T.ay}) m to (${T.bx}, ${T.by}) m. A spring of stiffness ${T.k} N/m is anchored at the origin and is unstretched there. Friction has magnitude $\mu_k mg$ with $\mu_k = ${T.mu}$. An arch between the ends rises ${T.rise} m above the straight line. Find the work of the weight and the spring, and the friction work along the arch.`,
    parts: [
      num('work', ($) => pathReport({ mass: $.m, k: $.k, mu: $.mu, rise: $.rise, ax: $.ax, ay: $.ay, bx: $.bx, by: $.by, g: G }).potential, 'J', { label: 'work of weight and spring' }),
      num('friction', ($) => pathReport({ mass: $.m, k: $.k, mu: $.mu, rise: $.rise, ax: $.ax, ay: $.ay, bx: $.bx, by: $.by, g: G }).frictionArch, 'J', { label: 'friction work on the arch' }),
    ],
    level: 3,
    hints: ['Weight and the spring are conservative, so their work is minus the change in potential. Friction work is minus mu m g times the length of that path.',
      "The weight and the spring contribute minus the change in potential, computed from the two ends alone.",
      "Friction work on the arch is minus mu_k m g times the length of that arch. The paths share the potential change and differ in length.",
    ],
    steps: ($, sig) => {
      const row = pathReport({ mass: $.m, k: $.k, mu: $.mu, rise: $.rise, ax: $.ax, ay: $.ay, bx: $.bx, by: $.by, g: G });
      return [
        String.raw`$-\Delta V = ${sig(row.potential)}\ \mathrm{J}$ on every path.`,
        String.raw`Friction on the arch does ${sig(row.frictionArch)}\ \mathrm{J}.`,
      ];
    },
    second: ($) => archFriction($),
    sim: {
      scenario: 'rough',
      setup(s, $) {
        s.mass = $.m;
        s.k = $.k;
        s.mu = $.mu;
        s.rise = $.rise;
        s.ax = $.ax;
        s.ay = $.ay;
        s.bx = $.bx;
        s.by = $.by;
      },
      read: (c) => ({ work: c.potential, friction: c.frictionArch }),
    },
    cases: [kase('Hibbeler §14.5', { m: 1.2, k: 20, mu: 0.25, rise: 0.35, ax: 0.2, ay: 1, bx: 1.4, by: 0.4 }, {
      work: -3.7367999999999952,
      friction: -4.467187603865499,
    })],
  }),

  problem({
    id: 'u3.14.same',
    title: 'Does the detour change the work?',
    exam: 'u3',
    ch: '14',
    lab: null,
    src: 'Hibbeler §14.5',
    topics: ['path', 'spring', 'friction'],
    vars: {
      kind: choice(['spring', 'spring'], ['friction', 'kinetic friction']),
      k: range(20, 60, 5, 'N/m'),
      mu: range(0, 0.4, 0.05, ''),
      x1: range(0.15, 0.45, 0.05, 'm'),
      x2: range(0.15, 0.45, 0.05, 'm'),
      xFar: range(0.55, 0.9, 0.05, 'm'),
    },
    valid: ($) => {
      if (Math.abs($.x2 - $.x1) < 0.1) return false;
      if ($.kind === 'friction' && $.mu < 0.1) return false;
      const { straight, via } = detour($);
      return straight.reaches && via.reaches;
    },
    text: (T) => String.raw`A 2 kg collar slides on a rod at 30° above the horizontal, already moving at 4 m/s. Measure the stretch down the rod from the unstretched point. The collar goes from a stretch of ${T.x1} m to ${T.x2} m, or it continues out to ${T.xFar} m and then comes back to ${T.x2} m. $k = ${T.k}$ N/m and $\mu_k = ${T.mu}$. Does the work of the ${T.kind} change on that longer route?`,
    parts: [
      mc('path', [[1, 'Yes'], [0, 'No']], ($) => ($.kind === 'friction' ? 1 : 0), { label: 'depends on the detour?' }),
    ],
    level: 2,
    hints: ['A spring stores energy from its stretch. Kinetic friction spends energy on every metre of the slide.',
      "The spring work uses only the end stretches, so the turnaround cancels. Friction adds a cost on every extra metre.",
    ],
    steps: ($, sig) => {
      void sig;
      const yes = $.kind === 'friction';
      return [yes
        ? 'Friction opposes the motion on every leg, so the longer detour takes more work.'
        : 'The spring work depends on the starting and ending stretch. The detour cancels out of that difference.'];
    },
    second: ($) => {
      const { straight, via } = detour($);
      const key = $.kind === 'friction' ? 'friction' : 'spring';
      const changed = Math.abs(straight[key] - via[key]) > 1e-6;
      return { path: changed ? 1 : 0 };
    },
    cases: [
      kase('Hibbeler §14.5', { kind: 'spring', k: 40, mu: 0.2, x1: 0.4, x2: 0.2, xFar: 0.7 }, { path: 0 }),
      kase('Hibbeler §14.5', { kind: 'friction', k: 40, mu: 0.2, x1: 0.4, x2: 0.2, xFar: 0.7 }, { path: 1 }),
    ],
  }),

  problem({
    id: 'u3.14.us',
    title: 'Collar speed in US customary units',
    exam: 'u3',
    ch: '14',
    lab: null,
    src: 'Hibbeler §14.2',
    topics: ['energy'],
    vars: {
      m: range(1, 3, 0.5, 'slug'),
      k: range(8, 24, 2, 'lb/ft'),
      theta: range(10, 25, 5, 'deg'),
      mu: range(0, 0.2, 0.05, ''),
      x1: range(0.8, 1.6, 0.2, 'ft'),
      x2: range(0, 0.4, 0.2, 'ft'),
      v1: range(4, 10, 1, 'ft/s'),
    },
    valid: ($) => $.x1 > $.x2 + 0.2 && reaches($, G_FT, $.mu),
    text: (T) => String.raw`A ${T.m} slug collar slides on a rod at ${T.theta}° above the horizontal, with $\mu_k = ${T.mu}$. A spring lies along the rod. Measure $x$ down the rod from the unstretched point, so the stretch equals $x$. The spring has $k = ${T.k}$ lb/ft. The collar passes $x = ${T.x1}$ ft at ${T.v1} ft/s. Find its speed at $x = ${T.x2}$ ft. Use $g = 32.2$ ft/s². The normal is the weight component perpendicular to the rod.`,
    parts: [
      num('speed', ($) => collarPath({ mass: $.m, k: $.k, thetaDeg: $.theta, points: [$.x1, $.x2], v1: $.v1, mu: $.mu, g: G_FT }).speed, 'ft/s', { label: 'speed at the end' }),
    ],
    level: 2,
    hints: ['The work-energy equation is the same in US customary units. The mass is in slugs, so a force in pounds is already mass times acceleration.',
      "Keep slugs, feet, and pounds together. x is the stretch, measured down the rod from the unstretched point.",
    ],
    steps: ($, sig) => {
      const row = collarPath({ mass: $.m, k: $.k, thetaDeg: $.theta, points: [$.x1, $.x2], v1: $.v1, mu: $.mu, g: G_FT });
      return [
        String.raw`Spring ${sig(row.spring)} ft·lb, gravity ${sig(row.gravity)} ft·lb, friction ${sig(row.friction)} ft·lb.`,
        String.raw`The speed at the end is ${sig(row.speed)} ft/s.`,
      ];
    },
    second: ($) => ({ speed: slideSpeed($, G_FT, $.mu) }),
    cases: [kase('Hibbeler §14.2', { m: 2, k: 10, theta: 20, mu: 0.1, x1: 1, x2: 0, v1: 6 }, { speed: 3.5947576124080576 })],
  }),

  problem({
    id: 'u3.14.frames',
    title: 'Energy lost when two cars lock together',
    exam: 'u3',
    ch: '14',
    lab: null,
    src: 'Hibbeler §14.3',
    topics: ['energy', 'frames'],
    // The frame is the structure: the ground, or a train moving with the first car. T changes with the frame; the loss does not.
    vars: {
      frame: choice(['ground', 'the ground'], ['train', 'a train that moves with the first car']),
      m1: range(500, 1500, 100, 'kg'),
      m2: range(500, 2500, 100, 'kg'),
      v1: range(10, 30, 5, 'm/s'),
      v2: range(10, 30, 5, 'm/s'),
    },
    text: (T, $) => String.raw`Car A, ${T.m1} kg, drives east at ${T.v1} m/s. Car B, ${T.m2} kg, drives west at ${T.v2} m/s. They meet head-on and lock together. An observer on ${T.frame} measures the speeds. Find the kinetic energy of the two cars before, after, and the energy lost.`,
    parts: [
      num('Tb', ($) => frameEnergy($).before, 'J', { label: 'kinetic energy before' }),
      num('Ta', ($) => frameEnergy($).after, 'J', { label: 'kinetic energy after' }),
      num('lost', ($) => frameEnergy($).lost, 'J', { label: 'energy lost' }),
    ],
    level: 2,
    hints: ['Locked together, the cars keep their total momentum. Find the common velocity in the observer’s own frame.',
      'T is one half m v² for each car before, and for the pair after. Change frame on the velocities, before squaring them.',
    ],
    steps: ($, sig) => {
      const e = frameEnergy($);
      return [
        String.raw`In this frame the cars move at $${sig(e.u1)}$ and $${sig(e.u2)}\ \mathrm{m/s}$. Momentum gives the common velocity $${sig(e.vf)}\ \mathrm{m/s}$.`,
        String.raw`Before, $T = \tfrac12 m_1u_1^2 + \tfrac12 m_2u_2^2 = ${sig(e.before)}\ \mathrm{J}$. After, $T = \tfrac12(m_1+m_2)v_f^2 = ${sig(e.after)}\ \mathrm{J}$.`,
        String.raw`The loss is $${sig(e.lost)}\ \mathrm{J}$, the same in every inertial frame: $\tfrac12\mu v_{\mathrm{rel}}^2$.`,
      ];
    },
    // Second: König's split, T = ½ M V² + ½ μ v_rel². Only the first term depends on the frame, and only the second is lost.
    second: ($) => {
      const M = $.m1 + $.m2;
      const mu = ($.m1 * $.m2) / M;
      const vrel = $.v1 + $.v2;
      const u1 = $.v1 - ($.frame === 'train' ? $.v1 : 0);
      const u2 = -$.v2 - ($.frame === 'train' ? $.v1 : 0);
      const Vcm = ($.m1 * u1 + $.m2 * u2) / M;
      return { Tb: 0.5 * M * Vcm * Vcm + 0.5 * mu * vrel * vrel, Ta: 0.5 * M * Vcm * Vcm, lost: 0.5 * mu * vrel * vrel };
    },
    cases: [
      kase('MIT OCW 2.003SC (Fall 2011), Problem Set 1, Problem 6a', { frame: 'ground', m1: 1000, m2: 2000, v1: 25, v2: 25 }, { Tb: 937500, Ta: 104167, lost: 833333 }, { note: 'Two cars meet head-on and lock together. The printed values are 937,500 J before, 104,167 J after, and 833,333 J lost.' }),
      kase('MIT OCW 2.003SC (Fall 2011), Problem Set 1, Problem 6b', { frame: 'train', m1: 1000, m2: 2000, v1: 25, v2: 25 }, { Tb: 2500000, Ta: 1666667, lost: 833333 }, { note: 'The same collision seen from a train moving with the first car. T before and after change; the loss does not.' }),
    ],
  }),
];

export default ch14;
