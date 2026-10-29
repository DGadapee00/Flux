/**
 * Level-3 templates: each needs two principles in turn, or a direction that must be reasoned
 * before any number is written. Each varies its unknown as well as its numbers: the same setup
 * asks forward (given the cause, find the effect) or backward (given the effect, find the cause).
 */
import { fourBar } from '@flux/subjects/mechanics/rigid2d.js';
import { G, choice, kase, num, problem, range } from '../kit.js';

const DEG = Math.PI / 180;

/** A block slides onto a cart on smooth wheels; friction between them is internal to the pair. */
export function cartSlide($) {
  const v = ($.m * $.u) / ($.m + $.M);
  const arel = $.mu * G * (1 + $.m / $.M);
  return {
    v,
    t: $.u / arel,
    slide: ($.u * $.u) / (2 * arel),
    muMin: ($.u * $.u) / (2 * G * $.Lc * (1 + $.m / $.M)),
  };
}
/** The same, by stepping both bodies until their speeds match. */
function cartByMarch($) {
  const dt = 1e-5;
  let vb = $.u;
  let vc = 0;
  let rel = 0;
  let t = 0;
  const f = $.mu * $.m * G;
  while (vb > vc) {
    rel += (vb - vc) * dt;
    vb -= (f / $.m) * dt;
    vc += (f / $.M) * dt;
    t += dt;
  }
  // The least μ: friction μmg over a relative slide of Lc removes the energy the impact cannot keep.
  const v = ($.m * $.u) / ($.m + $.M);
  const lost = 0.5 * $.m * $.u * $.u - 0.5 * ($.m + $.M) * v * v;
  return { v: ($.m * vb + $.M * vc) / ($.m + $.M), t, slide: rel, muMin: lost / ($.m * G * $.Lc) };
}

/** A collar on a smooth vertical rod, its spring anchored a distance b from the rod. */
export function offRod($) {
  const s1 = $.b - $.L0;
  const s2 = Math.hypot($.b, $.y) - $.L0;
  const ds2 = s2 * s2 - s1 * s1;
  const v2 = 2 * G * $.y - ($.k / $.m) * ds2;
  return { s1, s2, ds2, v: Math.sqrt(Math.max(v2, 0)), v2, kStop: (2 * $.m * G * $.y) / ds2 };
}
/** The spring's vertical pull integrated down the rod by Simpson's rule: its work per unit k. */
function springWorkPerK($) {
  const n = 400;
  const h = $.y / n;
  const pull = (y) => {
    const len = Math.hypot($.b, y);
    return -(len - $.L0) * (y / len);
  };
  let s = pull(0) + pull($.y);
  for (let i = 1; i < n; i++) s += (i % 2 ? 4 : 2) * pull(i * h);
  return (s * h) / 3;
}

/** A wheel pulled by a horizontal force at its centre, or by a cord over its top, rolling. */
export function pulledWheel($, P = $.P) {
  const k = $.kr * $.kr;
  if ($.at === 'centre') {
    return { k, a: P / ($.m * (1 + k)), f: (-k * P) / (1 + k), Pmax: ($.mu * $.m * G * (1 + k)) / k };
  }
  return { k, a: (2 * P) / ($.m * (1 + k)), f: (P * (1 - k)) / (1 + k), Pmax: ($.mu * $.m * G * (1 + k)) / (1 - k) };
}
/** The force and moment equations solved as a linear system, friction forward positive. */
function wheelBySystem($, P) {
  // Unknowns a, f: P + f = m a, and the moment about G, (arm·P − f R) = I a/R, with arm R at the top, 0 at the centre.
  const k = $.kr * $.kr;
  const arm = $.at === 'top' ? 1 : 0;
  // m a − f = P and k m a + f = arm P (dividing the moment equation by R).
  const a = (P + arm * P) / ($.m + k * $.m);
  return { a, f: $.m * a - P };
}

const pivot = ($) => fourBar({ crank: $.a, coupler: $.b, rocker: $.c, ground: $.d, theta: $.theta * DEG, omega: 1 });
/** The four-bar's rates for a crank turning at 1 rad/s: coupler and rocker, signed. */
function unitRates($) {
  const p = pivot($);
  if (p.miss || !p.ic) return null;
  const rx = p.B.x - p.C.x;
  const ry = p.B.y - p.C.y;
  return { p, wab: p.omegaCoupler, wcd: (rx * p.vB.y - ry * p.vB.x) / (rx * rx + ry * ry) };
}
export function linkage($) {
  const u = unitRates($);
  if (!u) return null;
  // Velocities are linear in the crank's rate: scale the unit solution.
  const wCrank = $.driver === 'crank' ? $.w : $.w / u.wcd;
  const { p } = u;
  const icA = Math.hypot(p.A.x - p.ic.x, p.A.y - p.ic.y);
  const icB = Math.hypot(p.B.x - p.ic.x, p.B.y - p.ic.y);
  return {
    wCrank,
    wab: Math.abs(u.wab * wCrank),
    wcd: Math.abs(u.wcd * wCrank),
    wout: $.driver === 'crank' ? Math.abs(u.wcd * wCrank) : Math.abs(wCrank),
    vA: Math.abs(wCrank) * $.a,
    vB: Math.abs(u.wcd * wCrank) * $.c,
    icA,
    icB,
    icFar: Math.hypot(p.ic.x, p.ic.y),
    By: p.B.y,
  };
}
/** The rates by relative velocity: v_B = v_A + ω_AB k × r_B/A, with v_B square to the rocker. */
function linkageByRelative($) {
  const p = pivot($);
  // Crank at 1 rad/s: v_A = k × A. Unknowns ω_AB and ω_CD: v_A + ω_AB k × (B − A) = ω_CD k × (B − C).
  const vA = { x: -p.A.y, y: p.A.x };
  const ab = { x: p.B.x - p.A.x, y: p.B.y - p.A.y };
  const cb = { x: p.B.x - p.C.x, y: p.B.y - p.C.y };
  // x: −ab.y ω_AB + cb.y ω_CD = −vA.x; y: ab.x ω_AB − cb.x ω_CD = −vA.y. Cramer's rule.
  const [a11, a12, a21, a22] = [-ab.y, cb.y, ab.x, -cb.x];
  const [r1, r2] = [-vA.x, -vA.y];
  const det = a11 * a22 - a12 * a21;
  const wab = (r1 * a22 - a12 * r2) / det;
  const wcd = (a11 * r2 - r1 * a21) / det;
  const wCrank = $.driver === 'crank' ? $.w : $.w / wcd;
  return { wab: Math.abs(wab * wCrank), wout: $.driver === 'crank' ? Math.abs(wcd * wCrank) : Math.abs(wCrank) };
}

const deeper = [
  problem({
    id: 'u4.15.cart',
    title: 'A block slides onto a cart',
    exam: 'u4',
    ch: '15',
    lab: null,
    src: 'Hibbeler §15.3',
    topics: ['conservation', 'impulse'],
    // Structure: forward (μ given, find the time it slides), or backward (the deck's length given,
    // find the least μ that keeps the block on it). Momentum, impulse and energy each do one job.
    vars: {
      find: choice(['time', 'time'], ['mu', 'least μ']),
      m: range(2, 10, 1, 'kg'),
      M: range(10, 60, 5, 'kg'),
      u: range(2, 6, 0.5, 'm/s'),
      mu: range(0.2, 0.6, 0.05, ''),
      Lc: range(1, 4, 0.5, 'm'),
    },
    valid: ($) => $.find === 'time' || (cartSlide($).muMin >= 0.1 && cartSlide($).muMin <= 0.8),
    text: (T, $) => ($.find === 'time'
      ? String.raw`A ${T.m} kg block slides at ${T.u} m/s onto the deck of a ${T.M} kg cart, at rest on smooth wheels. Between block and deck $\mu_k = ${T.mu}$. Find the speed they share once the block stops sliding, and how long it slides.`
      : String.raw`A ${T.m} kg block slides at ${T.u} m/s onto the rear of a ${T.M} kg cart's deck, ${T.Lc} m long. The cart is at rest on smooth wheels. Find the speed they share once the block stops sliding, and the least $\mu_k$ between block and deck that keeps the block from reaching the front.`),
    parts: [
      num('v', ($) => cartSlide($).v, 'm/s', { label: 'shared speed' }),
      num('q', ($) => ($.find === 'time' ? cartSlide($).t : cartSlide($).muMin), ($) => ($.find === 'time' ? 's' : ''), { label: (T, $) => ($.find === 'time' ? 'time sliding' : 'least μₖ') }),
    ],
    level: 3,
    hints: ['Friction between block and deck is internal to the pair. Horizontally nothing outside acts, so their total momentum is kept.',
      'Impulse on each body alone: friction μmg slows the block and speeds the cart. They stop sliding when their speeds match.',
      'Energy is lost, not kept: friction times the distance the block slides relative to the deck is the kinetic energy that goes missing.',
    ],
    steps: ($, sig) => {
      const r = cartSlide($);
      const lost = 0.5 * $.m * $.u * $.u - 0.5 * ($.m + $.M) * r.v * r.v;
      return [
        String.raw`Momentum: $${sig($.m)}(${sig($.u)}) = (${sig($.m)} + ${sig($.M)})v$, so $v = ${sig(r.v)}\ \mathrm{m/s}$.`,
        $.find === 'time'
          ? String.raw`Friction $\mu m g$ slows the block at $\mu g$ and speeds the cart at $\mu m g/M$. The gap closes at $\mu g(1 + m/M) = ${sig($.mu * G * (1 + $.m / $.M))}\ \mathrm{m/s^2}$, so $t = u/${sig($.mu * G * (1 + $.m / $.M))} = ${sig(r.t)}\ \mathrm{s}$.`
          : String.raw`Kinetic energy lost: $${sig(0.5 * $.m * $.u * $.u)} - ${sig(0.5 * ($.m + $.M) * r.v * r.v)} = ${sig(lost)}\ \mathrm{J}$.`,
        $.find === 'time'
          ? String.raw`Check: friction times the relative slide, $${sig($.mu * $.m * G)} \times ${sig(r.slide)} = ${sig($.mu * $.m * G * r.slide)}\ \mathrm{J}$, is the kinetic energy lost.`
          : String.raw`That is $\mu m g$ times the relative slide. With the slide equal to the deck: $\mu = ${sig(lost)}/(${sig($.m * G)} \times ${sig($.Lc)}) = ${sig(r.muMin)}$.`,
      ];
    },
    second: ($) => {
      const r = cartByMarch($);
      return { v: r.v, q: $.find === 'time' ? r.t : r.muMin };
    },
    cases: [kase('Hibbeler §15.3', { find: 'time', m: 5, M: 20, u: 4, mu: 0.3, Lc: 2 }, { v: 0.8, q: 4 / (0.3 * G * 1.25) })],
  }),

  problem({
    id: 'u3.14.off-rod',
    title: 'A collar on a spring anchored off the rod',
    exam: 'u3',
    ch: '14',
    lab: null,
    src: 'Hibbeler §14.3',
    topics: ['energy', 'spring'],
    // Structure: forward (k given, find the speed after a drop), or backward (find the k that
    // stops the collar there). The stretch comes from Pythagoras at each end.
    vars: {
      find: choice(['v', 'speed'], ['k', 'stiffness']),
      m: range(0.5, 3, 0.5, 'kg'),
      k: range(20, 200, 10, 'N/m'),
      b: range(0.3, 0.8, 0.1, 'm'),
      L0: range(0.2, 0.6, 0.05, 'm'),
      y: range(0.3, 1.2, 0.1, 'm'),
    },
    valid: ($) => {
      if ($.L0 > $.b - 0.05) return false;
      const r = offRod($);
      return $.find === 'v' ? r.v2 > 0.5 : r.kStop >= 20 && r.kStop <= 2000;
    },
    text: (T, $) => ($.find === 'v'
      ? String.raw`A ${T.m} kg collar slides on a smooth vertical rod. A spring, $k = ${T.k}\ \mathrm{N/m}$ and unstretched length ${T.L0} m, joins it to a fixed pin ${T.b} m from the rod. The collar is released from rest level with the pin. Find its speed after it has dropped ${T.y} m.`
      : String.raw`A ${T.m} kg collar slides on a smooth vertical rod. A spring of unstretched length ${T.L0} m joins it to a fixed pin ${T.b} m from the rod. The collar is released from rest level with the pin. Find the spring stiffness that brings it to rest after a drop of ${T.y} m.`),
    parts: [
      num('q', ($) => ($.find === 'v' ? offRod($).v : offRod($).kStop), ($) => ($.find === 'v' ? 'm/s' : 'N/m'), { label: (T, $) => ($.find === 'v' ? 'speed' : 'stiffness') }),
    ],
    level: 3,
    hints: ['Work and energy from the release to the lower point. The rod is smooth and pushes square to the motion, so it does no work.',
      'The spring stores ½k s², where s is its length less its unstretched length. Find each length with Pythagoras.',
      'Gravity gives m g y. The spring takes ½k(s₂² − s₁²), because it is longer at the bottom.',
    ],
    steps: ($, sig) => {
      const r = offRod($);
      return [
        String.raw`Stretch at the start: $s_1 = ${sig($.b)} - ${sig($.L0)} = ${sig(r.s1)}\ \mathrm{m}$. At the bottom: $s_2 = \sqrt{${sig($.b)}^2 + ${sig($.y)}^2} - ${sig($.L0)} = ${sig(r.s2)}\ \mathrm{m}$.`,
        String.raw`$\tfrac12 m v^2 = m g y - \tfrac12 k (s_2^2 - s_1^2)$, with $s_2^2 - s_1^2 = ${sig(r.ds2)}\ \mathrm{m^2}$.`,
        $.find === 'v'
          ? String.raw`$v^2 = ${sig(2 * G * $.y)} - ${sig(($.k / $.m) * r.ds2)}$, so $v = ${sig(r.v)}\ \mathrm{m/s}$.`
          : String.raw`At rest, $v = 0$: $k = 2 m g y/(s_2^2 - s_1^2) = ${sig(r.kStop)}\ \mathrm{N/m}$.`,
      ];
    },
    second: ($) => {
      // The spring's vertical pull integrated down the rod, against the weight's work.
      const wk = springWorkPerK($);
      return $.find === 'v'
        ? { q: Math.sqrt(2 * G * $.y + (2 * $.k * wk) / $.m) }
        : { q: (-$.m * G * $.y) / wk };
    },
    cases: [kase('Hibbeler §14.3', { find: 'v', m: 2, k: 50, b: 0.4, L0: 0.3, y: 0.3 }, { q: Math.sqrt(2 * G * 0.3 - 25 * (0.2 ** 2 - 0.1 ** 2)) })],
  }),

  problem({
    id: 'u6.17.pulled-wheel',
    title: 'A wheel pulled at its centre or over its top',
    exam: 'u6',
    ch: '17',
    lab: null,
    src: 'Hibbeler §17.5',
    topics: ['roll', 'slip'],
    // Structure: where the pull acts decides which way friction points. Then forward (P given,
    // find friction) or backward (μ given, find the largest pull that still rolls).
    vars: {
      at: choice(['centre', 'at its centre'], ['top', 'by a cord wrapped over its top']),
      find: choice(['f', 'friction'], ['P', 'largest pull']),
      m: range(5, 40, 5, 'kg'),
      R: range(0.2, 0.6, 0.05, 'm'),
      kr: range(0.4, 0.85, 0.05, ''),
      P: range(20, 200, 10, 'N'),
      mu: range(0.15, 0.5, 0.05, ''),
    },
    derive: ($) => ({ kG: Number(($.kr * $.R).toFixed(4)) }),
    valid: ($) => {
      const r = pulledWheel($);
      if ($.find === 'f') return Math.abs(r.f) < 0.9 * $.mu * $.m * G && Math.abs(r.f) > 0.5;
      return r.Pmax < 2000;
    },
    text: (T, $) => {
      const body = String.raw`A wheel of mass ${T.m} kg, radius ${T.R} m and radius of gyration $k_G = ${Number(($.kr * $.R).toFixed(4))}\ \mathrm{m}$ stands on level ground, $\mu_s = ${T.mu}$. It is pulled horizontally ${T.at}`;
      return $.find === 'f'
        ? String.raw`${body} with a force of ${T.P} N, and it rolls without slipping. Find the friction force, positive in the direction of the pull, and the acceleration of the centre.`
        : String.raw`${body}. Find the largest pull for which it rolls without slipping, and the acceleration of the centre at that pull.`;
    },
    parts: [
      num('q', ($) => ($.find === 'f' ? pulledWheel($).f : pulledWheel($).Pmax), 'N', { label: (T, $) => ($.find === 'f' ? 'friction, + along the pull' : 'largest pull') }),
      num('a', ($) => pulledWheel($, $.find === 'f' ? $.P : pulledWheel($).Pmax).a, 'm/s²', { label: 'acceleration of the centre' }),
    ],
    level: 3,
    hints: ['Draw friction forward and let the sign decide. Then ΣF = m a_G along the ground and ΣM_G = I_G α, with α = a/R while it rolls.',
      'Pulled at the centre, the pull has no moment about G: friction alone spins the wheel up, so it points back. Pulled over the top, the cord spins it too hard on its own: friction points forward.',
      'Rolling holds while the friction it needs stays below μN = μmg. The largest pull makes the two equal.',
    ],
    steps: ($, sig) => {
      const r = pulledWheel($);
      const P = $.find === 'f' ? $.P : r.Pmax;
      const at = pulledWheel($, P);
      const eqs = $.at === 'centre'
        ? String.raw`$P + f = m a$ and $-f R = k m R^2 (a/R)$, with $k = (k_G/R)^2 = ${sig(r.k)}$. So $f = -k m a$ and $a = \dfrac{P}{m(1 + k)}$.`
        : String.raw`$P + f = m a$ and $P R - f R = k m R^2 (a/R)$, with $k = (k_G/R)^2 = ${sig(r.k)}$. So $a = \dfrac{2P}{m(1 + k)}$ and $f = \dfrac{1 - k}{1 + k}P$.`;
      return $.find === 'f'
        ? [eqs, String.raw`$a = ${sig(at.a)}\ \mathrm{m/s^2}$ and $f = ${sig(at.f)}\ \mathrm{N}$: ${at.f < 0 ? 'backward, against the pull' : 'forward, with the pull'}.`,
          String.raw`Check: $|f| < \mu m g = ${sig($.mu * $.m * G)}\ \mathrm{N}$, so it rolls.`]
        : [eqs, String.raw`Set $|f| = \mu m g = ${sig($.mu * $.m * G)}\ \mathrm{N}$: $P = ${sig(r.Pmax)}\ \mathrm{N}$.`,
          String.raw`At that pull, $a = ${sig(at.a)}\ \mathrm{m/s^2}$.`];
    },
    second: ($) => {
      if ($.find === 'f') {
        const r = wheelBySystem($, $.P);
        return { q: r.f, a: r.a };
      }
      // Bisect on P for the pull where the friction rolling needs reaches μmg.
      const lim = $.mu * $.m * G;
      let lo = 0;
      let hi = 1e5;
      for (let i = 0; i < 200; i++) {
        const mid = (lo + hi) / 2;
        if (Math.abs(wheelBySystem($, mid).f) < lim) lo = mid;
        else hi = mid;
      }
      return { q: lo, a: wheelBySystem($, lo).a };
    },
    cases: [kase('Hibbeler §17.5', { at: 'centre', find: 'f', m: 2, R: 0.25, kr: Math.SQRT1_2, P: 6, mu: 0.3 }, { q: -2, a: 2 })],
  }),

  problem({
    id: 'u5.16.four-bar',
    title: 'A four-bar by its instantaneous centre',
    exam: 'u5',
    ch: '16',
    lab: 'ic',
    src: 'Hibbeler §16.6',
    topics: ['ic'],
    // Structure: the crank drives and the rocker follows, or the rocker drives and the crank
    // follows. The coupler's centre is found the same way; the arithmetic runs the other way round.
    vars: {
      driver: choice(['crank', 'crank'], ['rocker', 'rocker']),
      a: range(0.6, 1.4, 0.1, 'm'),
      b: range(2, 3, 0.25, 'm'),
      c: range(1.5, 2.5, 0.25, 'm'),
      d: range(2.5, 3.5, 0.25, 'm'),
      theta: range(30, 150, 10, 'deg'),
      w: range(1, 5, 0.5, 'rad/s'),
    },
    valid: ($) => {
      const r = linkage($);
      return !!r && r.icFar < 15 && r.By > 0.2 && r.wab > 0.05 && r.wout > 0.05 && r.icA > 0.3 && r.icB > 0.3;
    },
    text: (T, $) => String.raw`A four-bar has its crank OA, ${T.a} m long, pinned at O, and its rocker CB, ${T.c} m long, pinned at C, ${T.d} m to the right of O on the same level. The coupler AB is ${T.b} m long, with B above the line OC. The crank makes ${T.theta}° with OC, measured counterclockwise. The ${T.driver} turns at ${T.w} rad/s. Find the angular speed of the coupler and of the ${$.driver === 'crank' ? 'rocker' : 'crank'}.`,
    parts: [
      num('wab', ($) => linkage($).wab, 'rad/s', { label: 'coupler' }),
      num('wout', ($) => linkage($).wout, 'rad/s', { label: (T, $) => ($.driver === 'crank' ? 'rocker' : 'crank') }),
    ],
    level: 3,
    hints: ['A moves square to the crank and B square to the rocker. The coupler’s instantaneous centre is where the crank line and the rocker line meet.',
      'Find B first: it is b from A and c from C. Then intersect line OA with line CB for the centre.',
      'Every point of the coupler moves at ω_AB times its distance from that centre. The driven link turns at its end’s speed over its length.',
    ],
    steps: ($, sig) => {
      const r = linkage($);
      const p = pivot($);
      const head = String.raw`A = $(${sig(p.A.x)}, ${sig(p.A.y)})$ m and B = $(${sig(p.B.x)}, ${sig(p.B.y)})$ m. The lines OA and CB meet at the centre, $(${sig(p.ic.x)}, ${sig(p.ic.y)})$ m: $${sig(r.icA)}$ m from A and $${sig(r.icB)}$ m from B.`;
      return $.driver === 'crank'
        ? [head,
          String.raw`$v_A = ${sig($.w)}(${sig($.a)}) = ${sig(r.vA)}\ \mathrm{m/s}$, so $\omega_{AB} = ${sig(r.vA)}/${sig(r.icA)} = ${sig(r.wab)}\ \mathrm{rad/s}$.`,
          String.raw`$v_B = ${sig(r.wab)}(${sig(r.icB)}) = ${sig(r.vB)}\ \mathrm{m/s}$, so the rocker turns at $${sig(r.vB)}/${sig($.c)} = ${sig(r.wout)}\ \mathrm{rad/s}$.`]
        : [head,
          String.raw`$v_B = ${sig($.w)}(${sig($.c)}) = ${sig(r.vB)}\ \mathrm{m/s}$, so $\omega_{AB} = ${sig(r.vB)}/${sig(r.icB)} = ${sig(r.wab)}\ \mathrm{rad/s}$.`,
          String.raw`$v_A = ${sig(r.wab)}(${sig(r.icA)}) = ${sig(r.vA)}\ \mathrm{m/s}$, so the crank turns at $${sig(r.vA)}/${sig($.a)} = ${sig(r.wout)}\ \mathrm{rad/s}$.`];
    },
    second: linkageByRelative,
    sim: {
      scenario: 'linkage',
      setup(s, $) {
        Object.assign(s, { mode: 'link', crank: $.a, coupler: $.b, rocker: $.c, ground: $.d, linkTheta: $.theta, linkOmega: linkage($).wCrank });
      },
      read: (c) => ({ wab: Math.abs(c.omega) }),
    },
    cases: [kase('Hibbeler §16.6', { driver: 'crank', a: 1, b: 2.5, c: 2, d: 3, theta: 60, w: 2 }, { wab: 0.5157, wout: 0.5832 })],
  }),
];

export default deeper;
