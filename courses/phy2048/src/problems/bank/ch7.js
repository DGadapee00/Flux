/** Ch 7 · Work and kinetic energy. OpenStax University Physics Vol. 1, §§7.1–7.4. */
import { G } from '@flux/subjects/mechanics/constants.js';
import { climbPower, kineticEnergy, power, work, workAlongPath, workVector } from '@flux/subjects/mechanics/energy.js';
import { v } from '@flux/subjects/mechanics/vectors.js';
import { MPS_PER_KMH, W_PER_HP } from '@flux/subjects/convert.js';
import { choice, kase, mc, num, problem, range, texNum } from '../kit.js';

const U = { exam: 'u4', ch: '7' };
const DEG = Math.PI / 180;

export default [
  problem({
    ...U,
    id: 'ch7.work',
    level: 1,
    variety: ['representation'],
    lab: 'work-energy',
    src: 'OpenStax University Physics Vol. 1 §7.1',
    title: 'Work by a push at an angle',
    topics: ['work'],
    vars: {
      side: choice(['below', 'below'], ['above', 'above']),
      F: range(20, 200, 5, 'N'),
      phi: range(5, 60, 5, '°'),
      d: range(2, 30, 0.5, 'm'),
    },
    derive: ($) => ({ W: work($.F, $.d, $.phi) }),
    // Only the part of the push along the motion does work: F cos φ times d.
    second: ($) => ({ W: $.F * Math.cos($.phi * DEG) * $.d }),
    text: (T, $) => ($.side === 'below'
      ? `A person pushes a lawn mower ${T.d} m across level ground. The push is a steady ${T.F} N along the handle, ${T.phi}° below the horizontal. How much work does the push do on the mower?`
      : `A child pulls a wagon ${T.d} m along a level path. The handle pulls with a steady ${T.F} N, ${T.phi}° above the horizontal. How much work does the pull do on the wagon?`),
    parts: [
      num('W', ($) => $.W, 'J', { label: 'work' }),
    ],
    hints: [
      String.raw`Work by a constant force is $W = Fd\cos\phi$, with $\phi$ the angle between the force and the displacement.`,
      'The ground is level, so the displacement is horizontal. The angle below or above the horizontal is the angle to the displacement. Below or above makes no difference to the work.',
    ],
    steps: ($) => [
      String.raw`$W = Fd\cos\phi = (${texNum($.F)})(${texNum($.d)})\cos${texNum($.phi)}^\circ = ${texNum($.W)}\ \mathrm{J}$`,
    ],
    sim: {
      scenario: 'push',
      setup: (s, $) => {
        Object.assign(s, { theta: 0, F: $.F, phi: $.phi, d: $.d, mu: 0, v0: 0 });
      },
      read: (c) => ({ W: c.WF }),
    },
    cases: [
      kase('OpenStax University Physics Vol. 1 §7.1, "Calculating the Work You Do to Push a Lawn Mower": 75.0 N at 35° below the horizontal, 25.0 m', { side: 'below', F: 75, phi: 35, d: 25 }, { W: 1535.9 }, {
        note: 'The book prints 1.54 × 10³ J.',
      }),
      kase('hand', { side: 'above', F: 40, phi: 60, d: 10 }, { W: 200 }),
    ],
  }),

  problem({
    ...U,
    id: 'ch7.dot',
    level: 1,
    variety: ['representation'],
    src: 'OpenStax University Physics Vol. 1 §7.1',
    title: 'Work from components',
    topics: ['work', 'dot'],
    vars: {
      rep: choice(['comp', 'components'], ['words', 'words']),
      Fx: range(-20, 20, 1, 'N'),
      Fy: range(-20, 20, 1, 'N'),
      dx: range(-8, 8, 0.5, 'm'),
      dy: range(-8, 8, 0.5, 'm'),
    },
    derive: ($) => ({ W: workVector(v($.Fx, $.Fy, 0), v($.dx, $.dy, 0)), Fmag: Math.hypot($.Fx, $.Fy), dmag: Math.hypot($.dx, $.dy) }),
    // From sizes and directions: W = |F||d| cos(angle between them).
    second: ($) => {
      const between = Math.atan2($.dy, $.dx) - Math.atan2($.Fy, $.Fx);
      return { W: Math.hypot($.Fx, $.Fy) * Math.hypot($.dx, $.dy) * Math.cos(between) };
    },
    valid: ($) => Math.abs($.W) > 1 && $.Fmag > 0 && $.dmag > 0,
    text: (T, $) => ($.rep === 'comp'
      ? `A constant force F = (${T.Fx} N) i + (${T.Fy} N) j acts on a body while it moves through d = (${T.dx} m) i + (${T.dy} m) j. Find the work done by the force.`
      : `With x to the right and y up, a body moves ${Math.abs($.dx)} m ${$.dx >= 0 ? 'right' : 'left'} and ${Math.abs($.dy)} m ${$.dy >= 0 ? 'up' : 'down'}, in a straight line. A steady force of ${Math.abs($.Fx)} N ${$.Fx >= 0 ? 'right' : 'left'} and ${Math.abs($.Fy)} N ${$.Fy >= 0 ? 'up' : 'down'} acts on it the whole way. Find the work done by the force.`),
    parts: [
      num('W', ($) => $.W, 'J', { label: 'work' }),
    ],
    hints: [
      String.raw`The work is the dot product: $W = \vec F\cdot\vec d = F_x\,d_x + F_y\,d_y$.`,
      'Keep the signs. A component of the force against the matching component of the motion gives negative work.',
    ],
    steps: ($) => [
      String.raw`$W = F_x d_x + F_y d_y = (${texNum($.Fx)})(${texNum($.dx)}) + (${texNum($.Fy)})(${texNum($.dy)}) = ${texNum($.W)}\ \mathrm{J}$`,
    ],
    cases: [
      kase('OpenStax University Physics Vol. 1 §7.1, "Shelving a Book": a 20 N book moved 1 m down and 3 m across; gravity does 20 J', { rep: 'words', Fx: 0, Fy: -20, dx: 3, dy: -1 }, { W: 20 }, {
        note: 'Gravity is (0, −20) N and the straight move is (3, −1) m. Only the vertical part counts.',
      }),
      kase('hand', { rep: 'comp', Fx: 3, Fy: 4, dx: 2, dy: -1 }, { W: 2 }),
    ],
  }),

  problem({
    ...U,
    id: 'ch7.path',
    level: 3,
    variety: ['configuration'],
    src: 'OpenStax University Physics Vol. 1 §7.1',
    title: 'Work along a curved path',
    topics: ['work'],
    vars: {
      curve: choice(['p2', 'a parabola'], ['p3', 'a cubic']),
      a: range(2, 10, 1, 'N/m'),
      b: range(2, 12, 1, 'N/m'),
      X: range(1, 3, 0.5, 'm'),
      Y: range(1, 3, 0.5, 'm'),
    },
    derive: ($) => {
      const n = $.curve === 'p2' ? 2 : 3;
      // On y = c xⁿ, dy = n c xⁿ⁻¹ dx, so dW = a y dx + b x dy = (a + n b) c xⁿ dx.
      return { n, c: $.Y / $.X ** n, W: ($.Y * $.X * ($.a + n * $.b)) / (n + 1), Wline: (($.a + $.b) * $.X * $.Y) / 2 };
    },
    second: ($) => {
      const n = $.curve === 'p2' ? 2 : 3;
      const W = workAlongPath((x, y) => ({ x: $.a * y, y: $.b * x }), (u) => ({ x: u * $.X, y: $.Y * u ** n }), 2000);
      return { W };
    },
    valid: ($) => $.a !== $.b,
    text: (T, $, sig) => `A body moves from the origin to (${T.X} m, ${T.Y} m) along the curve y = (${sig($.c)} m${$.n === 2 ? '⁻¹' : '⁻²'})x${$.n === 2 ? '²' : '³'}, ${T.curve}. A force F = (${T.a} N/m) y i + (${T.b} N/m) x j acts on it. Find the work done by the force.`,
    parts: [
      num('W', ($) => $.W, 'J', { label: 'work' }),
    ],
    hints: [
      String.raw`The force changes along the path, so add up $dW = F_x\,dx + F_y\,dy$. Write everything in terms of $x$: on the curve, $y$ and $dy$ follow from the equation.`,
      String.raw`With $y = cx^n$, $dy = ncx^{n-1}dx$. Then $dW = (a + nb)\,c\,x^n\,dx$; integrate from $0$ to the end.`,
    ],
    steps: ($) => [
      String.raw`$dW = a y\,dx + b x\,dy = (a + ${$.n}b)\,c\,x^{${$.n}}\,dx$`,
      String.raw`$W = (a + ${$.n}b)\,c\,\dfrac{X^{${$.n + 1}}}{${$.n + 1}} = ${texNum($.W)}\ \mathrm{J}$. The straight line would give $${texNum($.Wline)}$ J: this force is not conservative.`,
    ],
    cases: [
      kase('OpenStax University Physics Vol. 1 §7.1, "Work Done by a Variable Force over a Curved Path": F = (5 N/m)y i + (10 N/m)x j along y = (0.5 m⁻¹)x² to (2 m, 2 m)', { curve: 'p2', a: 5, b: 10, X: 2, Y: 2 }, { W: 33.333 }, {
        note: 'The book prints 33.3 J.',
      }),
      kase('OpenStax University Physics Vol. 1 §7.1, Check Your Understanding: the same force over the cubic y = (0.25 m⁻²)x³', { curve: 'p3', a: 5, b: 10, X: 2, Y: 2 }, { W: 35 }, {
        note: 'The book prints 35 J. The ends are the same; the work is not.',
      }),
    ],
  }),

  problem({
    ...U,
    id: 'ch7.spring',
    level: 2,
    variety: ['representation'],
    src: 'OpenStax University Physics Vol. 1 §7.1',
    title: 'Stretching a spring further',
    topics: ['work', 'spring'],
    vars: {
      kunit: choice(['Ncm', 'N/cm'], ['Nm', 'N/m']),
      W1: range(0.1, 3, 0.02, 'J'),
      x1: range(2, 10, 1, 'cm', 0.01),
      extra: range(2, 10, 1, 'cm', 0.01),
    },
    derive: ($) => {
      const k = (2 * $.W1) / ($.x1 * $.x1);
      const x2 = $.x1 + $.extra;
      return { k, x2, W: 0.5 * k * (x2 * x2 - $.x1 * $.x1) };
    },
    // The work against the spring adds up the force kx over each small stretch: ∫ kx dx by the trapezoid rule.
    second: ($) => {
      const k = (2 * $.W1) / ($.x1 * $.x1);
      const x2 = $.x1 + $.extra;
      const n = 2000;
      let W = 0;
      for (let i = 0; i < n; i += 1) {
        const a = $.x1 + (i / n) * (x2 - $.x1);
        const b = $.x1 + ((i + 1) / n) * (x2 - $.x1);
        W += 0.5 * (k * a + k * b) * (b - a);
      }
      return { k: $.kunit === 'Ncm' ? k / 100 : k, W };
    },
    text: (T) => `It takes ${T.W1} J of work to stretch an ideal spring ${T.x1} cm from its relaxed length. Find its spring constant in ${T.kunit}, and the work needed to stretch it a further ${T.extra} cm.`,
    parts: [
      num('k', ($) => ($.kunit === 'Ncm' ? $.k / 100 : $.k), ($) => ($.kunit === 'Ncm' ? 'N/cm' : 'N/m'), { label: 'spring constant' }),
      num('W', ($) => $.W, 'J', { label: 'work for the further stretch' }),
    ],
    hints: [
      String.raw`The work to stretch a spring from $x_A$ to $x_B$ is $\tfrac12k(x_B^2 - x_A^2)$. From the relaxed length, $W = \tfrac12kx^2$, which gives $k$.`,
      String.raw`The further stretch starts at $x_1$, not at zero. The spring already pulls back hard there, so the second stretch costs more than the first.`,
    ],
    steps: ($) => [
      String.raw`$k = 2W_1/x_1^2 = ${texNum($.k)}\ \mathrm{N/m}$`,
      String.raw`$W = \tfrac12k(x_2^2 - x_1^2) = ${texNum($.W)}\ \mathrm{J}$, with $x_2 = ${texNum($.x2 * 100)}$ cm`,
    ],
    cases: [
      kase('OpenStax University Physics Vol. 1 §7.1, "Work Done by a Spring Force": 0.54 J to stretch 6 cm, then 6 cm more', { kunit: 'Ncm', W1: 0.54, x1: 6, extra: 6 }, { k: 3, W: 1.62 }),
      kase('hand', { kunit: 'Nm', W1: 1, x1: 10, extra: 10 }, { k: 200, W: 3 }),
    ],
  }),

  problem({
    ...U,
    id: 'ch7.frames',
    level: 1,
    variety: ['configuration'],
    src: 'OpenStax University Physics Vol. 1 §7.2',
    title: 'Kinetic energy in two frames',
    topics: ['kinetic'],
    vars: {
      way: choice(['front', 'toward the front'], ['back', 'toward the back']),
      m: range(40, 110, 5, 'kg'),
      u: range(0.5, 2.5, 0.1, 'm/s'),
      V: range(5, 30, 0.5, 'm/s'),
    },
    derive: ($) => {
      const vT = $.V + ($.way === 'front' ? $.u : -$.u);
      return { vT, Kc: kineticEnergy($.m, $.u), Kt: kineticEnergy($.m, vT) };
    },
    // The track frame's K, written as the car frame's K plus the frame's share: ½mV² + mVu' + ½mu².
    second: ($) => {
      const s = $.way === 'front' ? $.u : -$.u;
      return { Kc: 0.5 * $.m * $.u * $.u, Kt: 0.5 * $.m * $.V * $.V + $.m * $.V * s + 0.5 * $.m * s * s };
    },
    text: (T) => `A ${T.m} kg passenger walks ${T.way} of a train car at ${T.u} m/s relative to the car. The train moves forward at ${T.V} m/s along a straight track. Find the passenger's kinetic energy relative to the car and relative to the track.`,
    parts: [
      num('Kc', ($) => $.Kc, 'J', { label: 'relative to the car' }),
      num('Kt', ($) => $.Kt, 'J', { label: 'relative to the track' }),
    ],
    hints: [
      String.raw`Kinetic energy is $\tfrac12mv^2$ with the speed measured in the frame you are asked about. In the car, the speed is the walking speed.`,
      'Relative to the track, add the velocities first: the train’s speed plus or minus the walking speed. Then square. Kinetic energies do not add.',
    ],
    steps: ($) => [
      String.raw`$K_{\text{car}} = \tfrac12mu^2 = ${texNum($.Kc)}\ \mathrm{J}$`,
      String.raw`$v = ${texNum($.vT)}\ \mathrm{m/s}$ over the track, so $K_{\text{track}} = ${texNum($.Kt)}\ \mathrm{J}$`,
    ],
    cases: [
      kase('OpenStax University Physics Vol. 1 §7.2, "Kinetic Energy Relative to Different Frames": 75.0 kg at 1.50 m/s in a car at 15.0 m/s', { way: 'front', m: 75, u: 1.5, V: 15 }, { Kc: 84.375, Kt: 10209.375 }, {
        note: 'The book prints 84.4 J, and 10.2 kJ walking forward or 6.83 kJ walking back.',
      }),
      kase('OpenStax University Physics Vol. 1 §7.2, "Kinetic Energy Relative to Different Frames": walking toward the back', { way: 'back', m: 75, u: 1.5, V: 15 }, { Kc: 84.375, Kt: 6834.375 }),
    ],
  }),

  problem({
    ...U,
    id: 'ch7.push',
    level: 1,
    variety: ['configuration'],
    lab: 'work-energy',
    src: 'OpenStax University Physics Vol. 1 §7.3',
    title: 'Speed from the net work',
    topics: ['work', 'kinetic'],
    vars: {
      floor: choice(['smooth', 'smooth'], ['rough', 'rough']),
      m: range(2, 60, 1, 'kg'),
      F: range(20, 400, 5, 'N'),
      d: range(1, 8, 0.5, 'm'),
      mu: range(0.1, 0.5, 0.05, ''),
    },
    derive: ($) => {
      const mu = $.floor === 'rough' ? $.mu : 0;
      const Wnet = work($.F, $.d, 0) + work(mu * $.m * G, $.d, 180);
      return { muUsed: mu, Wnet, v: Math.sqrt((2 * Wnet) / $.m) };
    },
    // Newton's second law and kinematics, with no work in it: a = (F − μmg)/m, v² = 2ad.
    second: ($) => {
      const mu = $.floor === 'rough' ? $.mu : 0;
      const a = ($.F - mu * $.m * G) / $.m;
      return { Wnet: $.m * a * $.d, v: Math.sqrt(2 * a * $.d) };
    },
    valid: ($) => $.Wnet > 0.2 * $.F * $.d,
    text: (T, $) => `A ${T.m} kg crate starts at rest on a level ${$.floor === 'rough' ? `floor with μk = ${T.mu}` : 'frictionless floor'}. A horizontal push of ${T.F} N moves it ${T.d} m. Take g = ${G} m/s². Find the net work done on the crate and its speed at the end.`,
    parts: [
      num('Wnet', ($) => $.Wnet, 'J', { label: 'net work' }),
      num('v', ($) => $.v, 'm/s', { label: 'final speed' }),
    ],
    hints: [
      String.raw`The work–energy theorem: the net work equals the change in kinetic energy. From rest, $W_{\text{net}} = \tfrac12mv^2$.`,
      String.raw`Add the work of every force: the push $Fd$, friction $-\mu_k mg\,d$, and zero for the weight and the normal force, which are across the motion.`,
    ],
    steps: ($) => [
      String.raw`$W_{\text{net}} = (F - \mu_k mg)\,d = ${texNum($.Wnet)}\ \mathrm{J}$`,
      String.raw`$v = \sqrt{2W_{\text{net}}/m} = ${texNum($.v)}\ \mathrm{m/s}$`,
    ],
    sim: {
      scenario: 'push',
      setup: (s, $) => {
        Object.assign(s, { m: $.m, theta: 0, F: $.F, phi: 0, mu: $.muUsed, d: $.d, v0: 0 });
      },
      read: (c) => ({ Wnet: c.Wnet, v: c.vf }),
    },
    cases: [
      kase('OpenStax University Physics Vol. 1 §7.3: the net work done on a particle equals the change in its kinetic energy (the work–energy theorem)', { floor: 'rough', m: 50, F: 300, d: 3, mu: 0.3 }, { Wnet: 458.55, v: 4.2827 }),
      kase('hand', { floor: 'smooth', m: 2, F: 20, d: 4, mu: 0.3 }, { Wnet: 80, v: 8.9443 }),
    ],
  }),

  problem({
    ...U,
    id: 'ch7.bullet',
    level: 2,
    variety: ['unknown'],
    src: 'OpenStax University Physics Vol. 1 §7.3',
    title: 'A bullet stopped by wood',
    topics: ['work', 'kinetic'],
    vars: {
      q: choice(['F', 'the average stopping force'], ['d', 'how deep it goes']),
      m: range(1, 20, 0.1, 'g', 1e-3),
      v: range(150, 900, 5, 'm/s'),
      d: range(5, 30, 0.1, 'cm', 0.01),
      F: range(400, 4000, 10, 'N'),
    },
    derive: ($) => {
      const K = kineticEnergy($.m, $.v);
      return { K, ans: $.q === 'F' ? K / $.d : (100 * K) / $.F };
    },
    // Newton's second law and kinematics: the deceleration v²/2d, times the mass; or the depth from a = F/m.
    second: ($) => ({ ans: $.q === 'F' ? ($.m * $.v * $.v) / (2 * $.d) : (100 * $.v * $.v) / (2 * ($.F / $.m)) }),
    sampleValid: ($) => ($.q === 'F' ? true : $.ans > 3 && $.ans < 60),
    text: (T, $) => ($.q === 'F'
      ? `A ${T.m} g bullet leaves a rifle at ${T.v} m/s and stops after going ${T.d} cm into a stack of pine boards. What average force did the wood exert on it?`
      : `A ${T.m} g bullet at ${T.v} m/s hits a block of wood that pushes back on it with an average force of ${T.F} N. How far into the wood does it go, in centimetres?`),
    parts: [
      num('ans', ($) => $.ans, ($) => ($.q === 'F' ? 'N' : 'cm'), { label: 'the answer' }),
    ],
    hints: [
      String.raw`The wood's force does negative work $-F\,d$ and removes all of the bullet's kinetic energy: $F\,d = \tfrac12mv^2$.`,
      'Put the mass in kilograms and the distance in metres before you divide.',
    ],
    steps: ($) => [
      String.raw`$K = \tfrac12mv^2 = ${texNum($.K)}\ \mathrm{J}$`,
      $.q === 'F'
        ? String.raw`$F = K/d = ${texNum($.ans)}\ \mathrm{N}$`
        : String.raw`$d = K/F = ${texNum($.ans)}\ \mathrm{cm}$`,
    ],
    cases: [
      kase('OpenStax University Physics Vol. 1 §7.3, "Determining a Stopping Force": 2.60 g at 335 m/s, stopped in 15.2 cm', { q: 'F', m: 2.6, v: 335, d: 15.2, F: 1000 }, { ans: 959.97 }, {
        note: 'The book prints 960 N.',
      }),
      kase('hand', { q: 'd', m: 10, v: 400, d: 10, F: 4000 }, { ans: 20 }),
    ],
  }),

  problem({
    ...U,
    id: 'ch7.pullup',
    level: 1,
    variety: ['configuration'],
    src: 'OpenStax University Physics Vol. 1 §7.4',
    title: 'Power in a pull-up',
    topics: ['power'],
    vars: {
      set: choice(['one', 'one pull-up'], ['many', 'a set of pull-ups']),
      m: range(50, 100, 1, 'kg'),
      h: range(0.4, 0.8, 0.05, 'm'),
      t: range(0.5, 2, 0.1, 's'),
      n: range(5, 20, 1, ''),
      T: range(10, 60, 5, 's'),
    },
    derive: ($) => {
      // The arms are a tenth of the body and stay at the bar, so 90% of the mass rises.
      const W1 = 0.9 * $.m * G * $.h;
      return { W1, P: $.set === 'one' ? W1 / $.t : ($.n * W1) / $.T };
    },
    second: ($) => {
      const F = 0.9 * $.m * G;
      // At a steady rate the lifting force is the weight lifted and the speed is the rise over the time.
      return { P: $.set === 'one' ? power(F, $.h / $.t) : power(F, ($.n * $.h) / $.T) };
    },
    text: (T, $) => ($.set === 'one'
      ? `A ${T.m} kg trainee raises his body ${T.h} m in one pull-up, taking ${T.t} s. Count 90% of his mass as rising: the arms stay at the bar. Take g = ${G} m/s². What average power do his muscles supply?`
      : `A ${T.m} kg trainee does ${T.n} pull-ups in ${T.T} s, raising his body ${T.h} m each time. Count 90% of his mass as rising: the arms stay at the bar. Take g = ${G} m/s². What average power do his muscles supply while lifting?`),
    parts: [
      num('P', ($) => $.P, 'W', { label: 'average power' }),
    ],
    hints: [
      String.raw`Power is work over time. Each lift does work $mg\,\Delta y$ against gravity, with $m$ the mass that rises.`,
      'For a set, add up the work of every lift and divide by the whole time.',
    ],
    steps: ($) => [
      String.raw`Each lift: $W = 0.9mg\,\Delta y = ${texNum($.W1)}\ \mathrm{J}$`,
      String.raw`$P = W_{\text{total}}/t = ${texNum($.P)}\ \mathrm{W}$`,
    ],
    cases: [
      kase('OpenStax University Physics Vol. 1 §7.4, "Pull-Up Power": 80 kg, 90% of the mass, 0.60 m in 0.8 s', { set: 'one', m: 80, h: 0.6, t: 0.8, n: 10, T: 10 }, { P: 529.74 }, {
        note: 'The book uses g = 9.8 m/s² and prints 529 W.',
      }),
      kase('hand', { set: 'many', m: 70, h: 0.5, t: 1, n: 10, T: 20 }, { P: 154.51 }),
    ],
  }),

  problem({
    ...U,
    id: 'ch7.climb',
    level: 2,
    variety: ['representation'],
    lab: 'automotive-power',
    src: 'OpenStax University Physics Vol. 1 §7.4',
    title: 'Power to drive up a hill',
    topics: ['power'],
    vars: {
      unit: choice(['kW', 'kilowatts'], ['hp', 'horsepower']),
      m: range(800, 2500, 50, 'kg'),
      grade: range(2, 20, 1, '%'),
      kmh: range(40, 120, 5, 'km/h'),
      share: range(10, 40, 5, '%'),
    },
    derive: ($) => {
      const r = climbPower({ mass: $.m, speed: $.kmh * MPS_PER_KMH, grade: $.grade / 100, lossShare: $.share / 100 });
      return { th: r.theta, climb: r.climb, total: r.total };
    },
    // Energy over one kilometre of road, divided by the time it takes.
    second: ($) => {
      const v = $.kmh / 3.6;
      const rise = (1000 * ($.grade / 100)) / Math.sqrt(1 + ($.grade / 100) ** 2);
      const P = (($.m * G * rise) / (1000 / v)) / (1 - $.share / 100);
      return { P: $.unit === 'kW' ? P / 1000 : P / W_PER_HP };
    },
    text: (T) => `A ${T.m} kg car climbs a ${T.grade}% grade at a steady ${T.kmh} km/h. ${T.share}% of the engine's power goes into air resistance and friction. Take g = ${G} m/s². What power must the engine deliver, in ${T.unit}?`,
    parts: [
      num('P', ($) => ($.unit === 'kW' ? $.total / 1000 : $.total / W_PER_HP), ($) => $.unit, { label: 'power' }),
    ],
    hints: [
      String.raw`At a steady speed the kinetic energy does not change. The power left after the losses lifts the car: $(1 - \text{share})P = mgv\sin\theta$.`,
      String.raw`A grade of 15% means $\tan\theta = 0.15$. Turn km/h into m/s first; $1\ \mathrm{hp} = 745.7\ \mathrm{W}$.`,
    ],
    steps: ($) => [
      String.raw`$\theta = \tan^{-1}(${$.grade / 100}) = ${texNum($.th)}^\circ$; climbing takes $mgv\sin\theta = ${texNum($.climb)}\ \mathrm{W}$`,
      String.raw`$P = ${texNum($.climb)}/(1 - ${$.share / 100}) = ${texNum($.total)}\ \mathrm{W}$`,
    ],
    sim: {
      scenario: 'book',
      setup: (s, $) => {
        Object.assign(s, { model: 'share', m: $.m, grade: $.grade, kmh: $.kmh, share: $.share, unitAsked: $.unit });
      },
      read: (c, s) => ({ P: s.unitAsked === 'hp' ? c.hp : c.total / 1000 }),
    },
    cases: [
      kase('OpenStax University Physics Vol. 1 §7.4, "Automotive Power Driving Uphill": 1200 kg, 15% grade, 90 km/h, 25% lost', { unit: 'kW', m: 1200, grade: 15, kmh: 90, share: 25 }, { P: 58.209 }, {
        note: 'The book uses g = 9.8 m/s² and prints 58 kW.',
      }),
      kase('OpenStax University Physics Vol. 1 §7.4, "Automotive Power Driving Uphill": the same car, in horsepower', { unit: 'hp', m: 1200, grade: 15, kmh: 90, share: 25 }, { P: 78.059 }, {
        note: 'The book prints about 78 hp.',
      }),
    ],
  }),

  problem({
    ...U,
    id: 'ch7.concept-work',
    src: 'OpenStax University Physics Vol. 1 §7.1',
    title: 'The sign of the work',
    kind: 'conceptual',
    level: 1,
    lab: 'work-energy',
    topics: ['work'],
    variety: ['configuration'],
    vars: {
      q: choice(
        [1, 'A crate is pushed up a ramp. What work does the ramp’s normal force do on it?'],
        [2, 'A box slides down a ramp. What work does kinetic friction do on it?'],
        [3, 'A car goes round a flat curve at a steady speed. What work does the friction that turns it do?'],
      ),
    },
    derive: ($) => ({ ans: { 1: 'zero', 2: 'neg', 3: 'zero' }[$.q] }),
    second: ($) => {
      const sign = (W) => (Math.abs(W) < 1e-9 ? 'zero' : (W > 0 ? 'pos' : 'neg'));
      return { ans: sign({ 1: work(400, 3, 90), 2: work(3, 2, 180), 3: work(5000, 10, 90) }[$.q]) };
    },
    text: (T) => T.q,
    parts: [
      mc('ans', ($) => [
        ['pos', 'Positive', $.q === 2 ? 'Friction points up the ramp while the box moves down: the angle is 180°, so the work is negative.' : 'Positive work needs a part of the force along the motion. This force is across the motion.'],
        ['zero', 'Zero', $.q === 2 ? 'Zero needs the force at 90° to the motion. Kinetic friction lies along the surface, against the slide.' : 'Right: the force is at 90° to the motion at every instant, and cos 90° = 0.'],
        ['neg', 'Negative', $.q === 2 ? 'Right: friction acts against the motion, so W = −f d. It takes kinetic energy away.' : 'Negative work needs a part of the force against the motion. This force has none.'],
      ], ($) => $.ans, { label: 'the work' }),
    ],
    hints: [
      String.raw`$W = Fd\cos\phi$. The sign comes from $\cos\phi$, where $\phi$ is the angle between the force and the motion.`,
      'Along the motion: positive. Against it: negative. At right angles: zero, however big the force.',
    ],
    steps: ($) => [{ 1: 'N is at 90° to the ramp: W = 0.', 2: 'Friction is at 180° to the slide: W < 0.', 3: 'The turning force points to the centre, at 90° to the velocity: W = 0, and the speed stays the same.' }[$.q]],
    sim: { scenario: 'push', setup: () => {} },
    cases: [
      kase('OpenStax University Physics Vol. 1 §7.1: a force perpendicular to the displacement does no work; kinetic friction opposes the motion and does negative work', { q: 2 }, { ans: 'neg' }),
      kase('OpenStax University Physics Vol. 1 §7.1, Check Your Understanding: a centripetal force at constant speed does no work', { q: 3 }, { ans: 'zero' }),
    ],
  }),

  problem({
    ...U,
    id: 'ch7.concept-ke',
    src: 'OpenStax University Physics Vol. 1 §7.3',
    title: 'Kinetic energy and speed',
    kind: 'conceptual',
    level: 2,
    lab: 'work-energy',
    topics: ['kinetic', 'work'],
    variety: ['unknown'],
    vars: {
      q: choice(
        [1, 'A car goes twice as fast. How does its kinetic energy change?'],
        [2, 'A car skids to a stop on the same road from twice the speed. How does its stopping distance change?'],
        [3, 'A box twice as heavy slides the same distance down the same rough ramp, from rest. How does its final speed compare?'],
      ),
    },
    derive: ($) => ({ ans: { 1: 'x4', 2: 'x4', 3: 'same' }[$.q] }),
    second: ($) => {
      const r = { 1: kineticEnergy(1, 2) / kineticEnergy(1, 1), 2: (2 * 2) / (1 * 1), 3: 1 }[$.q];
      return { ans: r === 4 ? 'x4' : (r === 1 ? 'same' : 'x2') };
    },
    text: (T) => T.q,
    parts: [
      mc('ans', ($) => [
        ['same', 'The same', $.q === 3 ? 'Right: every force on it doubles with the mass, so the net work doubles; ½mv² with twice m then needs the same v.' : 'It changes: kinetic energy grows with the square of the speed.'],
        ['x2', 'Twice as much', $.q === 3 ? 'Twice the energy, yes, but also twice the mass. The speed does not change.' : 'That would hold if K grew in step with v. It grows with v².'],
        ['x4', 'Four times as much', $.q === 3 ? 'Nothing here is squared: both the work and ½mv² double with the mass.' : (($.q === 1) ? 'Right: K = ½mv², and 2² = 4.' : 'Right: friction removes the same energy per metre, and there is four times as much to remove.')],
      ], ($) => $.ans, { label: 'the answer' }),
    ],
    hints: [
      String.raw`$K = \tfrac12mv^2$. A change in $v$ is squared.`,
      String.raw`The work–energy theorem: friction does $-\mu_k mg\,d$, and that must equal $-K$. Ask what grows with the speed and what grows with the mass.`,
    ],
    steps: ($) => [{ 1: 'K ∝ v²: ×4.', 2: 'μmg d = ½mv², so d ∝ v²: ×4.', 3: 'Both sides of W = ½mv² double: v is the same.' }[$.q]],
    sim: {
      scenario: 'shove',
      setup: (s, $) => {
        if ($.q === 3) Object.assign(s, { mode: 'slide', theta: 30, d: 2, v0: 0, m: 4 });
      },
    },
    cases: [
      kase('OpenStax University Physics Vol. 1 §7.2: K = ½mv², so the kinetic energy grows as the square of the speed', { q: 1 }, { ans: 'x4' }),
      kase('OpenStax University Physics Vol. 1 §7.3: the work done by friction equals the kinetic energy lost, so the stopping distance grows as v²', { q: 2 }, { ans: 'x4' }),
    ],
  }),

  problem({
    ...U,
    id: 'ch7.concept-power',
    src: 'OpenStax University Physics Vol. 1 §7.4',
    title: 'Power, speed and drag',
    kind: 'conceptual',
    level: 2,
    lab: 'automotive-power',
    topics: ['power'],
    variety: ['unknown'],
    vars: {
      q: choice(
        [1, 'On a level highway, air drag is most of the loss. A car goes from 100 to 200 km/h. How does the power lost to drag change?'],
        [2, 'Two lifters raise the same barbell the same height. One takes half the time. How do their works compare?'],
        [3, 'The same two lifters. How do their powers compare?'],
      ),
    },
    derive: ($) => ({ ans: { 1: 'x8', 2: 'x1', 3: 'x2' }[$.q] }),
    second: ($) => {
      if ($.q === 1) return { ans: power(0.5 * 1.21 * 0.7 * 200 ** 2, 200) / power(0.5 * 1.21 * 0.7 * 100 ** 2, 100) === 8 ? 'x8' : 'x' };
      return { ans: $.q === 2 ? 'x1' : (((100 * 2) / 1) / ((100 * 2) / 2) === 2 ? 'x2' : 'x') };
    },
    text: (T) => T.q,
    parts: [
      mc('ans', ($) => [
        ['x1', 'The same', $.q === 2 ? 'Right: work is force times distance. Same weight, same height, same work; time does not enter.' : 'Power is the rate of doing work, so time and speed matter.'],
        ['x2', 'Twice as much', $.q === 3 ? 'Right: the same work in half the time is twice the power.' : ($.q === 1 ? 'Power is force times speed. The speed doubles, but the drag force also quadruples.' : 'Work does not depend on how fast it is done.')],
        ['x4', 'Four times as much', $.q === 1 ? 'That is the drag force, ½ρCAv². The power is that force times the speed: another factor of two.' : 'Nothing here is squared.'],
        ['x8', 'Eight times as much', $.q === 1 ? 'Right: P = ½ρCAv² × v grows as v³, and 2³ = 8.' : 'Nothing here is cubed.'],
      ], ($) => $.ans, { label: 'the answer' }),
    ],
    hints: [
      String.raw`Work is $Fd$; power is $W/t$, or $Fv$ for a force along the velocity.`,
      String.raw`Drag on a car is $\tfrac12\rho CAv^2$. Multiply by $v$ for its power.`,
    ],
    steps: ($) => [{ 1: 'P = ½ρCAv³: ×8.', 2: 'W = mgh: the same.', 3: 'P = W/t: ×2.' }[$.q]],
    sim: {
      scenario: 'highway',
      setup: (s, $) => {
        if ($.q !== 1) Object.assign(s, { model: 'share', grade: 15 });
      },
    },
    cases: [
      kase('OpenStax University Physics Vol. 1 §7.4: power is the rate of doing work, P = F · v', { q: 3 }, { ans: 'x2' }),
      kase('OpenStax University Physics Vol. 1 §6.4 and §7.4: drag grows as v², so its power grows as v³', { q: 1 }, { ans: 'x8' }),
    ],
  }),
];
