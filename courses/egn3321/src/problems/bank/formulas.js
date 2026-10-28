/**
 * One template per unit whose answer is a formula, then the number it gives (D32: representation
 * varies as well as the numbers). The formula is graded by the core engine at random values of
 * its symbols; the number carries the unit's traps. Each formula is the one the unit's notes
 * derive, so the steps are short and the hints name the law.
 */
import { collide1D } from '@flux/subjects/mechanics/momentum.js';
import { ladder } from '@flux/subjects/mechanics/rigid2d.js';
import { G, choice, kase, num, problem, range, sym } from '../kit.js';
import { pulley } from './ch13.js';

const DEG = Math.PI / 180;

/** Atwood or table: the acceleration and tension as formulas in m₁, m₂ and g. */
const PULLEY_KEY = {
  hang: { a: '(m2 - m1)*g/(m1 + m2)', T: '2*m1*m2*g/(m1 + m2)' },
  table: { a: 'm2*g/(m1 + m2)', T: 'm1*m2*g/(m1 + m2)' },
};

/** Compression of a spring by a sliding block (friction resists) or a dropped one (gravity adds). */
const SPRING_KEY = {
  slide: '(sqrt((mu*m*g)^2 + k*m*v^2) - mu*m*g)/k',
  drop: '(m*g + sqrt((m*g)^2 + 2*k*m*g*h))/k',
};
function compression($) {
  if ($.how === 'slide') {
    const f = $.mu * $.m * G;
    return (Math.sqrt(f * f + $.k * $.m * $.v * $.v) - f) / $.k;
  }
  const w = $.m * G;
  return (w + Math.sqrt(w * w + 2 * $.k * w * $.h)) / $.k;
}
/** The same compression, by marching the block until it stops: the second method. */
function compressionByMarch($) {
  const n = 20000;
  if ($.how === 'slide') {
    // ½mv² is spent on ½kx² and μmg x: step x until the energy runs out.
    let T = 0.5 * $.m * $.v * $.v;
    const dx = $.v * Math.sqrt($.m / $.k) / n;
    let x = 0;
    while (T > 0) {
      const F = $.k * (x + dx / 2) + $.mu * $.m * G;
      if (F * dx > T) return x + T / F;
      T -= F * dx;
      x += dx;
    }
    return x;
  }
  // From rest at h above the spring: T(x) = mg(h + x) − ½kx². Step x to the root.
  let x = 0;
  const top = (2 * $.m * G) / $.k + Math.sqrt((2 * $.m * G * $.h) / $.k) * 2;
  const dx = top / n;
  const T = (s) => $.m * G * ($.h + s) - 0.5 * $.k * s * s;
  while (T(x + dx) > 0) x += dx;
  return x + T(x) / (T(x) - T(x + dx)) * dx;
}

const SHAPE = {
  hoop: { k: 1, key: 'sqrt(g*h)', name: 'thin hoop' },
  disk: { k: 1 / 2, key: 'sqrt(4*g*h/3)', name: 'uniform disk' },
  sphere: { k: 2 / 5, key: 'sqrt(10*g*h/7)', name: 'solid sphere' },
  shell: { k: 2 / 3, key: 'sqrt(6*g*h/5)', name: 'thin spherical shell' },
};

/** The ladder's midpoint: its speed is ω times L/2, the half-diagonal of the rectangle. */
function ladderPoint($) {
  const row = ladder($.L, $.theta, $.v);
  return $.point === 'top' ? row.down : $.v / (2 * Math.sin($.theta * DEG));
}

/** The bar released from rest at θ from the downward vertical: pin components along and across it. */
function barAtRelease($) {
  const th = $.theta * DEG;
  return {
    alpha: (3 * G * Math.sin(th)) / (2 * $.L),
    along: $.m * G * Math.cos(th),
    across: ($.m * G * Math.sin(th)) / 4,
  };
}

/** A bullet that embeds a distance d below the pin of a hanging bar. */
const embed = ($) => ($.m * $.u * $.d) / (($.M * $.L * $.L) / 3 + $.m * $.d * $.d);

const formulas = [
  problem({
    id: 'u2.13.pulley-sym',
    title: 'Two masses on a string, as formulas',
    exam: 'u2',
    ch: '13',
    lab: 'fma',
    src: 'Hibbeler §13.3',
    topics: ['newton', 'pulley'],
    // Structure: both hang (Atwood), or one slides on a smooth table. The formulas differ.
    vars: {
      config: choice(['hang', 'both hang over a light pulley'], ['table', 'are joined over a light pulley at the edge of a smooth table: $m_1$ slides on the table and $m_2$ hangs']),
      m1: range(1, 6, 0.5, 'kg'),
      m2: range(1, 8, 0.5, 'kg'),
    },
    valid: ($) => $.config === 'table' || Math.abs($.m2 - $.m1) > 0.4,
    text: (T, $) => String.raw`Masses $m_1$ and $m_2$, on a light string, ${T.config}. Take the acceleration as positive when $m_2$ descends. Write the acceleration and the tension as formulas in $m_1$, $m_2$ and $g$. Then find the tension for $m_1 = ${T.m1}\ \mathrm{kg}$ and $m_2 = ${T.m2}\ \mathrm{kg}$.`,
    parts: [
      sym('a', ($) => PULLEY_KEY[$.config].a, { m1: 'kg', m2: 'kg' }, ($) => pulley($).a, { unit: 'm/s^2', label: 'a as a formula' }),
      sym('Tf', ($) => PULLEY_KEY[$.config].T, { m1: 'kg', m2: 'kg' }, ($) => pulley($).T, { unit: 'N', label: 'T as a formula' }),
      num('T', ($) => pulley($).T, 'N', { label: 'tension for these masses' }),
    ],
    level: 2,
    hints: ['Write ΣF = ma for each mass along its own direction of motion. The string gives both the same acceleration and the same tension.',
      'Add the two equations: the tension cancels and leaves a. Put a back into either one for T.',
    ],
    steps: ($, sig) => {
      const row = pulley($);
      return $.config === 'table'
        ? [String.raw`On the table: $T = m_1 a$. Hanging: $m_2 g - T = m_2 a$.`,
          String.raw`Add: $a = \dfrac{m_2 g}{m_1 + m_2}$. Then $T = m_1 a = \dfrac{m_1 m_2 g}{m_1 + m_2}$.`,
          String.raw`Here $T = ${sig(row.T)}\ \mathrm{N}$, less than the hanging weight, $${sig($.m2 * G)}\ \mathrm{N}$.`]
        : [String.raw`Descending: $m_2 g - T = m_2 a$. Rising: $T - m_1 g = m_1 a$.`,
          String.raw`Add: $a = \dfrac{(m_2 - m_1) g}{m_1 + m_2}$. Then $T = m_1(g + a) = \dfrac{2 m_1 m_2 g}{m_1 + m_2}$.`,
          String.raw`Here $T = ${sig(row.T)}\ \mathrm{N}$, between the two weights.`];
    },
    // Energy over a metre of travel, then T from the lighter body's own equation: a second route.
    second: ($) => {
      const drop = 1;
      const work = ($.config === 'table' ? $.m2 : $.m2 - $.m1) * G * drop;
      const a = work / (($.m1 + $.m2) * drop);
      return { T: $.config === 'table' ? $.m1 * a : $.m1 * (G + a) };
    },
    sim: {
      scenario: 'atwood',
      setup(s, $) {
        s.m1 = $.m1;
        s.m2 = $.m2;
        s.v0 = 0;
        s.t = 0;
        if ($.config === 'table') Object.assign(s, { scenarioId: 'tow', block: $.m1, hang: $.m2, theta: 0, mus: 0, muk: 0 });
      },
      read: (c) => ({ T: c.T }),
    },
    cases: [kase('Hibbeler §13.3', { config: 'hang', m1: 2, m2: 4 }, { a: '(m2 - m1)*g/(m1 + m2)', T: (2 * 2 * 4 * G) / 6 })],
  }),

  problem({
    id: 'u4.15.collide-sym',
    title: 'A collision, as a formula',
    exam: 'u4',
    ch: '15',
    lab: 'impact',
    src: 'Hibbeler §15.4',
    topics: ['impact'],
    // Structure: the bodies stick, or part with a coefficient e. The formula carries e or not.
    vars: {
      kind: choice(['stick', 'stick together'], ['partial', 'separate, with a coefficient of restitution e']),
      m1: range(1, 6, 0.5, 'kg'),
      m2: range(1, 8, 0.5, 'kg'),
      u: range(2, 8, 0.5, 'm/s'),
      e: range(0.2, 0.8, 0.1, ''),
    },
    derive: ($) => ($.kind === 'stick' ? { e: 0 } : {}),
    text: (T, $) => ($.kind === 'stick'
      ? String.raw`A body of mass $m_1$ moving at $u$ strikes a body of mass $m_2$ at rest, head on, and they stick together. Write the speed of $m_2$ after the impact as a formula in $m_1$, $m_2$ and $u$. Then find the kinetic energy lost for $m_1 = ${T.m1}\ \mathrm{kg}$, $m_2 = ${T.m2}\ \mathrm{kg}$ and $u = ${T.u}\ \mathrm{m/s}$.`
      : String.raw`A body of mass $m_1$ moving at $u$ strikes a body of mass $m_2$ at rest, head on. They separate with a coefficient of restitution $e$. Write the speed of $m_2$ after the impact as a formula in $m_1$, $m_2$, $u$ and $e$. Then find the kinetic energy lost for $m_1 = ${T.m1}\ \mathrm{kg}$, $m_2 = ${T.m2}\ \mathrm{kg}$, $u = ${T.u}\ \mathrm{m/s}$ and $e = ${T.e}$.`),
    parts: [
      sym('v2', ($) => ($.kind === 'stick' ? 'm1*u/(m1 + m2)' : '(1 + e)*m1*u/(m1 + m2)'), { m1: 'kg', m2: 'kg', u: 'm/s', e: '' },
        ($) => collide1D($.m1, $.m2, $.u, 0, $.e).v2, { unit: 'm/s', label: 'v₂ as a formula' }),
      num('lost', ($) => 0.5 * (($.m1 * $.m2) / ($.m1 + $.m2)) * (1 - $.e * $.e) * $.u * $.u, 'J', { label: 'kinetic energy lost' }),
    ],
    level: 2,
    hints: ['Momentum along the line is kept for every e. Restitution adds the second equation: v₂ − v₁ = e(u − 0).',
      'The energy lost is the energy before less the energy of both bodies after.',
    ],
    steps: ($, sig) => {
      const out = collide1D($.m1, $.m2, $.u, 0, $.e);
      const lost = 0.5 * $.m1 * $.u * $.u - 0.5 * $.m1 * out.v1 ** 2 - 0.5 * $.m2 * out.v2 ** 2;
      return [
        String.raw`Momentum: $m_1 u = m_1 v_1 + m_2 v_2$. Restitution: $v_2 - v_1 = e u$.`,
        String.raw`Eliminate $v_1$: $v_2 = \dfrac{(1 + e) m_1 u}{m_1 + m_2}$${$.kind === 'stick' ? String.raw`, with $e = 0$` : ''}.`,
        String.raw`Here $v_1 = ${sig(out.v1)}$ and $v_2 = ${sig(out.v2)}\ \mathrm{m/s}$, so $\Delta T = ${sig(0.5 * $.m1 * $.u * $.u)} - ${sig(0.5 * $.m1 * out.v1 ** 2 + 0.5 * $.m2 * out.v2 ** 2)} = ${sig(lost)}\ \mathrm{J}$.`,
      ];
    },
    second: ($) => {
      const out = collide1D($.m1, $.m2, $.u, 0, $.e);
      return { lost: 0.5 * $.m1 * $.u * $.u - 0.5 * $.m1 * out.v1 ** 2 - 0.5 * $.m2 * out.v2 ** 2 };
    },
    sim: {
      scenario: 'central',
      setup(s, $) {
        Object.assign(s, { m1: $.m1, m2: $.m2, u1: $.u, u2: 0, e: $.e, theta: 0 });
      },
    },
    cases: [kase('Hibbeler §15.4', { kind: 'stick', m1: 1, m2: 3, u: 8, e: 0.5 }, { v2: 'm1*u/(m1 + m2)', lost: 24 })],
  }),

  problem({
    id: 'u3.14.spring-sym',
    title: 'Spring compression, as a formula',
    exam: 'u3',
    ch: '14',
    lab: null,
    src: 'Hibbeler §14.3',
    topics: ['energy', 'spring'],
    // Structure: a block slides into the spring on a rough floor, or drops onto it from a height.
    // Friction takes energy and gravity gives it, so the two quadratics differ in one sign.
    vars: {
      how: choice(['slide', 'slides'], ['drop', 'drops']),
      m: range(1, 5, 0.5, 'kg'),
      k: range(200, 1200, 100, 'N/m'),
      v: range(1, 4, 0.5, 'm/s'),
      mu: range(0.1, 0.4, 0.05, ''),
      h: range(0.1, 0.6, 0.05, 'm'),
    },
    text: (T, $) => ($.how === 'slide'
      ? String.raw`A block of mass $m$ slides at speed $v$ on a rough floor, $\mu_k = \mu$, into a light spring of stiffness $k$. Write the spring's greatest compression as a formula in $m$, $v$, $k$, $\mu$ and $g$. Then evaluate it for $m = ${T.m}\ \mathrm{kg}$, $v = ${T.v}\ \mathrm{m/s}$, $k = ${T.k}\ \mathrm{N/m}$ and $\mu = ${T.mu}$.`
      : String.raw`A block of mass $m$ is released from rest a height $h$ above the top of a light vertical spring of stiffness $k$, and lands on it. Write the spring's greatest compression as a formula in $m$, $h$, $k$ and $g$. Then evaluate it for $m = ${T.m}\ \mathrm{kg}$, $h = ${T.h}\ \mathrm{m}$ and $k = ${T.k}\ \mathrm{N/m}$.`),
    parts: [
      sym('xf', ($) => SPRING_KEY[$.how], { m: 'kg', v: 'm/s', k: 'N/m', mu: '', h: 'm' }, compression, { unit: 'm', label: 'x as a formula' }),
      num('x', compression, 'm', { label: 'greatest compression' }),
    ],
    level: 3,
    hints: ['Work and energy from the start to the greatest compression, where the speed is zero. Count every force that does work over the whole distance.',
      (T, $) => ($.how === 'slide'
        ? 'Friction works over the compression x as well: ½mv² = ½kx² + μmgx. Solve the quadratic and keep the positive root.'
        : 'The block falls h + x, not h: mg(h + x) = ½kx². Solve the quadratic and keep the positive root.'),
    ],
    steps: ($, sig) => ($.how === 'slide'
      ? [String.raw`$\tfrac12 m v^2 = \tfrac12 k x^2 + \mu m g\,x$, so $k x^2 + 2\mu m g\,x - m v^2 = 0$.`,
        String.raw`$x = \dfrac{\sqrt{(\mu m g)^2 + k m v^2} - \mu m g}{k} = ${sig(compression($))}\ \mathrm{m}$.`]
      : [String.raw`$m g (h + x) = \tfrac12 k x^2$, so $k x^2 - 2 m g\,x - 2 m g h = 0$.`,
        String.raw`$x = \dfrac{m g + \sqrt{(m g)^2 + 2 k m g h}}{k} = ${sig(compression($))}\ \mathrm{m}$.`]),
    second: ($) => ({ x: compressionByMarch($) }),
    cases: [kase('Hibbeler §14.3', { how: 'drop', m: 2, k: 400, v: 2, mu: 0.2, h: 0.3 }, {
      xf: '(m*g + sqrt((m*g)^2 + 2*k*m*g*h))/k',
      x: (2 * G + Math.sqrt((2 * G) ** 2 + 2 * 400 * 2 * G * 0.3)) / 400,
    })],
  }),

  problem({
    id: 'u5.16.ladder-sym',
    title: 'The sliding ladder, as formulas',
    exam: 'u5',
    ch: '16',
    lab: 'ic',
    src: 'Hibbeler §16.6',
    topics: ['ic'],
    // Structure: the point asked for is the top, or the midpoint. Both are ω times a distance.
    vars: {
      point: choice(['top', 'top'], ['mid', 'midpoint']),
      L: range(2, 8, 0.5, 'm'),
      theta: range(20, 75, 5, 'deg'),
      v: range(0.5, 4, 0.5, 'm/s'),
    },
    derive: ($) => ({ th: $.theta * DEG }),
    valid: ($) => Math.abs($.theta - 45) > 1,
    text: (T, $) => String.raw`A ladder of length $L$ leans on a smooth wall at an angle $\theta$ to the floor. Its foot slides away from the wall at speed $v$. Write the ladder's angular velocity, and the speed of its ${T.point}, as formulas in $v$, $L$ and $\theta$. Then find that speed for $L = ${T.L}\ \mathrm{m}$, $\theta = ${T.theta}^\circ$ and $v = ${T.v}\ \mathrm{m/s}$.`,
    parts: [
      sym('w', 'v/(L*sin(th))', { v: 'm/s', L: 'm', th: '' }, ($) => ladder($.L, $.theta, $.v).omega, { unit: '1/s', label: 'ω as a formula' }),
      sym('vf', ($) => ($.point === 'top' ? 'v/tan(th)' : 'v/(2*sin(th))'), { v: 'm/s', L: 'm', th: '' }, ladderPoint, { unit: 'm/s', label: 'speed as a formula' }),
      num('vp', ladderPoint, 'm/s', { label: (T, $) => ($.point === 'top' ? 'speed of the top' : 'speed of the midpoint') }),
    ],
    level: 2,
    hints: ['The instantaneous centre is the corner of the rectangle the ladder spans: level with the top, above the foot.',
      (T, $) => ($.point === 'top'
        ? 'The foot is L sin θ from the centre and the top is L cos θ from it. Every point moves at ω times its distance.'
        : 'The midpoint is half a diagonal from the centre: L/2, at every angle.'),
    ],
    steps: ($, sig) => [
      String.raw`The foot is $L\sin\theta$ below the centre, so $\omega = \dfrac{v}{L\sin\theta}$.`,
      $.point === 'top'
        ? String.raw`The top is $L\cos\theta$ from it: $v_{top} = \omega L\cos\theta = \dfrac{v}{\tan\theta} = ${sig(ladderPoint($))}\ \mathrm{m/s}$.`
        : String.raw`The midpoint is $L/2$ from it: $v_{mid} = \omega \dfrac{L}{2} = \dfrac{v}{2\sin\theta} = ${sig(ladderPoint($))}\ \mathrm{m/s}$.`,
    ],
    // The point's position differentiated numerically as the ladder turns.
    second: ($) => {
      const th = $.theta * DEG;
      const thDot = -$.v / ($.L * Math.sin(th));
      const pos = (t) => {
        const a = th + thDot * t;
        return $.point === 'top' ? [0, $.L * Math.sin(a)] : [($.L / 2) * Math.cos(a), ($.L / 2) * Math.sin(a)];
      };
      const h = 1e-6;
      const [x1, y1] = pos(h);
      const [x0, y0] = pos(-h);
      return { vp: Math.hypot(x1 - x0, y1 - y0) / (2 * h) };
    },
    sim: {
      scenario: 'ladder',
      setup(s, $) {
        s.length = $.L;
        s.theta = $.theta;
        s.foot = $.v;
      },
      read: (c, s, $) => ($.point === 'top' ? { vp: c.speed } : {}),
    },
    cases: [kase('Hibbeler §16.6', { point: 'mid', L: 4, theta: 60, v: 2 }, { w: 'v/(L*sin(th))', vf: 'v/(2*sin(th))', vp: 2 / Math.sqrt(3) })],
  }),

  problem({
    id: 'u6.17.pin-sym',
    title: 'A released bar, as formulas',
    exam: 'u6',
    ch: '17',
    lab: 'pendulum',
    src: 'Hibbeler §17.4',
    topics: ['pin'],
    // Structure: the pin component asked for lies along the bar or across it. They come from
    // different equations: along it nothing accelerates yet; across it G does.
    vars: {
      comp: choice(['along', 'along the bar'], ['across', 'across the bar']),
      m: range(1, 8, 0.5, 'kg'),
      L: range(0.6, 2.4, 0.2, 'm'),
      theta: range(15, 75, 5, 'deg'),
    },
    derive: ($) => ({ th: $.theta * DEG }),
    text: (T, $) => String.raw`A uniform slender bar of mass $m$ and length $L$ hangs from a pin at one end. It is released from rest at an angle $\theta$ from the downward vertical. Write its angular acceleration, and the pin force's component ${T.comp}, as formulas in $m$, $L$, $\theta$ and $g$. Then find that component for $m = ${T.m}\ \mathrm{kg}$, $L = ${T.L}\ \mathrm{m}$ and $\theta = ${T.theta}^\circ$.`,
    parts: [
      sym('alpha', '3*g*sin(th)/(2*L)', { m: 'kg', L: 'm', th: '' }, ($) => barAtRelease($).alpha, { unit: '1/s^2', label: 'α as a formula' }),
      sym('Of', ($) => ($.comp === 'along' ? 'm*g*cos(th)' : 'm*g*sin(th)/4'), { m: 'kg', L: 'm', th: '' }, ($) => barAtRelease($)[$.comp], { unit: 'N', label: 'pin component as a formula' }),
      num('O', ($) => barAtRelease($)[$.comp], 'N', { label: (T, $) => `pin component ${$.comp === 'along' ? 'along' : 'across'} the bar` }),
    ],
    level: 2,
    hints: ['Moments about the pin give α, with I_O = mL²/3 and the weight acting at L/2.',
      (T, $) => ($.comp === 'along'
        ? 'Released from rest, ω = 0, so G has no acceleration along the bar yet. Along the bar the pin balances the weight’s component.'
        : 'Across the bar G accelerates at (L/2)α. The weight’s component less the pin’s gives m times that.'),
    ],
    steps: ($, sig) => [
      String.raw`$\Sigma M_O$: $m g \tfrac{L}{2}\sin\theta = \tfrac13 m L^2 \alpha$, so $\alpha = \dfrac{3 g \sin\theta}{2L}$.`,
      $.comp === 'along'
        ? String.raw`Along the bar, $a_G = \tfrac{L}{2}\omega^2 = 0$: $O_\parallel = m g\cos\theta = ${sig(barAtRelease($).along)}\ \mathrm{N}$.`
        : String.raw`Across it, $a_G = \tfrac{L}{2}\alpha = \tfrac34 g\sin\theta$: $m g\sin\theta - O_\perp = \tfrac34 m g\sin\theta$, so $O_\perp = \tfrac14 m g\sin\theta = ${sig(barAtRelease($).across)}\ \mathrm{N}$.`,
    ],
    // Moments about G instead of the pin: O⊥(L/2) = I_G α, with a_G = (L/2)α from the force equation.
    second: ($) => {
      const th = $.theta * DEG;
      // Unknowns α and O⊥: m g sin θ − O⊥ = m (L/2) α and O⊥ (L/2) = (m L²/12) α.
      const a11 = $.m * ($.L / 2);
      const a21 = -($.m * $.L * $.L) / 12;
      const alpha = ($.m * G * Math.sin(th)) / (a11 - a21 / ($.L / 2));
      const across = -(a21 * alpha) / ($.L / 2);
      return { O: $.comp === 'along' ? $.m * G * Math.cos(th) : across };
    },
    sim: {
      scenario: 'bar',
      setup(s, $) {
        s.mass = $.m;
        s.length = $.L;
        s.theta = $.theta;
        s.omega = 0;
      },
    },
    cases: [kase('Hibbeler §17.4', { comp: 'across', m: 4, L: 2, theta: 60 }, { alpha: '3*g*sin(th)/(2*L)', O: (4 * G * Math.sin(60 * DEG)) / 4 })],
  }),

  problem({
    id: 'u7.18.roll-sym',
    title: 'A rolling body, as formulas',
    exam: 'u7',
    ch: '18',
    lab: 'race',
    src: 'Hibbeler §18.5',
    topics: ['rolling', 'energy'],
    // Structure: four shapes, each its own k = I_G/(mR²), so each its own formula.
    vars: {
      shape: choice(['hoop', 'thin hoop'], ['disk', 'uniform disk'], ['sphere', 'solid sphere'], ['shell', 'thin spherical shell']),
      h: range(0.5, 2, 0.1, 'm'),
      R: range(0.1, 0.5, 0.05, 'm'),
    },
    text: (T, $) => String.raw`A ${T.shape} of radius $R$ rolls without slipping from rest down a slope, through a vertical drop $h$. Write its speed at the bottom, and its angular velocity there, as formulas in $h$, $R$ and $g$. Then find the speed for $h = ${T.h}\ \mathrm{m}$.`,
    parts: [
      sym('vf', ($) => SHAPE[$.shape].key, { h: 'm', R: 'm' }, ($) => Math.sqrt((2 * G * $.h) / (1 + SHAPE[$.shape].k)), { unit: 'm/s', label: 'v as a formula' }),
      sym('wf', ($) => `${SHAPE[$.shape].key}/R`, { h: 'm', R: 'm' }, ($) => Math.sqrt((2 * G * $.h) / (1 + SHAPE[$.shape].k)) / $.R, { unit: '1/s', label: 'ω as a formula' }),
      num('v', ($) => Math.sqrt((2 * G * $.h) / (1 + SHAPE[$.shape].k)), 'm/s', { label: 'speed at the bottom' }),
    ],
    level: 2,
    hints: ['Rolling without slip does no work at the contact. The drop’s m g h becomes ½mv² + ½I_Gω².',
      'Write I_G = k m R² and ω = v/R. Then T = ½mv²(1 + k), and m and R cancel.',
    ],
    steps: ($, sig) => {
      const { k } = SHAPE[$.shape];
      const fr = { 1: '1', 0.5: String.raw`\tfrac12`, 0.4: String.raw`\tfrac25` }[k] ?? String.raw`\tfrac23`;
      return [
        String.raw`$m g h = \tfrac12 m v^2 (1 + k)$, with $k = ${fr}$ for a ${SHAPE[$.shape].name}.`,
        String.raw`$v = \sqrt{2 g h/(1 + k)} = ${sig(Math.sqrt((2 * G * $.h) / (1 + k)))}\ \mathrm{m/s}$, and $\omega = v/R$.`,
      ];
    },
    // The force and moment equations give a = g sin θ/(1 + k) on any slope; v² = 2a(h/sin θ).
    second: ($) => {
      const th = 30 * DEG;
      const a = (G * Math.sin(th)) / (1 + SHAPE[$.shape].k);
      return { v: Math.sqrt(2 * a * ($.h / Math.sin(th))) };
    },
    sim: {
      scenario: 'even',
      setup(s, $) {
        Object.assign(s, { mass: 2, radius: Math.min($.R, 0.5), theta: 30, distance: 2 * $.h, time: 0 });
      },
      read: (c, s, $) => ($.shape === 'shell' ? {} : { v: c[$.shape] }),
    },
    cases: [kase('Hibbeler §18.5', { shape: 'disk', h: 1, R: 0.25 }, { vf: 'sqrt(4*g*h/3)', v: Math.sqrt((4 * G) / 3) })],
  }),

  problem({
    id: 'u8.19.embed-sym',
    title: 'A bullet into a hanging bar, as a formula',
    exam: 'u8',
    ch: '19',
    lab: 'strike',
    src: 'Hibbeler §19.3',
    topics: ['spin', 'rigid-momentum'],
    // Structure: the bullet strikes at the bar's end, or a distance d below the pin.
    vars: {
      where: choice(['end', 'at its lower end'], ['d', 'a distance $d$ below the pin']),
      m: range(0.02, 0.1, 0.01, 'kg'),
      u: range(200, 500, 50, 'm/s'),
      M: range(2, 8, 0.5, 'kg'),
      L: range(0.8, 2, 0.1, 'm'),
      dFrac: range(0.4, 0.9, 0.05, ''),
    },
    derive: ($) => ({ d: ($.where === 'end' ? 1 : $.dFrac) * $.L }),
    text: (T, $) => String.raw`A uniform bar of mass $M$ and length $L$ hangs at rest from a pin at its top. A bullet of mass $m$, moving horizontally at $u$, strikes it ${T.where} and embeds. Write the bar's angular velocity just after as a formula in $m$, $u$, $M$${$.where === 'end' ? ' and $L$' : ', $L$ and $d$'}. Then evaluate it for $m = ${T.m}\ \mathrm{kg}$, $u = ${T.u}\ \mathrm{m/s}$, $M = ${T.M}\ \mathrm{kg}$${$.where === 'end' ? String.raw` and $L = ${T.L}\ \mathrm{m}$` : String.raw`, $L = ${T.L}\ \mathrm{m}$ and $d = ${Number($.d.toFixed(3))}\ \mathrm{m}$`}.`,
    parts: [
      sym('wf', ($) => ($.where === 'end' ? '3*m*u/((M + 3*m)*L)' : 'm*u*d/(M*L^2/3 + m*d^2)'), { m: 'kg', u: 'm/s', M: 'kg', L: 'm', d: 'm' }, embed, { unit: '1/s', label: 'ω as a formula' }),
      num('w', embed, 'rad/s', { label: 'angular velocity just after' }),
    ],
    level: 2,
    hints: ['The pin pushes on the bar during the impact, so linear momentum is not kept. Its moment about the pin is zero: angular momentum about the pin is.',
      'Before: the bullet’s m u d. After: (I_O + m d²)ω, with I_O = ML²/3.',
    ],
    steps: ($, sig) => [
      String.raw`About the pin: $m u d = \left(\tfrac13 M L^2 + m d^2\right)\omega$.`,
      $.where === 'end'
        ? String.raw`With $d = L$: $\omega = \dfrac{3 m u}{(M + 3m) L} = ${sig(embed($))}\ \mathrm{rad/s}$.`
        : String.raw`$\omega = \dfrac{m u d}{M L^2/3 + m d^2} = ${sig(embed($))}\ \mathrm{rad/s}$.`,
    ],
    // The angular impulse on each body separately, solved together with the pin's impulse.
    second: ($) => {
      // Bullet: −P = m(ω d − u). Bar, about the pin: P d = I_O ω. Eliminate P.
      const IO = ($.M * $.L * $.L) / 3;
      return { w: ($.m * $.u * $.d) / (IO + $.m * $.d * $.d) };
    },
    sim: {
      scenario: 'pinned',
      setup(s, $) {
        Object.assign(s, { M: $.M, L: $.L, m: $.m, u: $.u, dFrac: $.d / $.L, e: 0 });
      },
      read: (c) => ({ w: c.w }),
    },
    cases: [kase('Hibbeler §19.3', { where: 'end', m: 0.05, u: 400, M: 4, L: 1, dFrac: 0.5 }, { wf: '3*m*u/((M + 3*m)*L)', w: (3 * 0.05 * 400) / ((4 + 0.15) * 1) })],
  }),
];

export default formulas;
