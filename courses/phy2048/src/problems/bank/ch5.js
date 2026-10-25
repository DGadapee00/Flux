/** Ch 5 · Newton's laws of motion. OpenStax University Physics Vol. 1, §§5.1–5.7. */
import { G } from '@flux/subjects/mechanics/constants.js';
import { acceleration, weight } from '@flux/subjects/mechanics/dynamics.js';
import { add, angle2D, fromAngle2D, mag, v } from '@flux/subjects/mechanics/vectors.js';
import { N_PER_LBF } from '@flux/subjects/convert.js';
import { choice, kase, mc, num, problem, range, texNum } from '../kit.js';

const U = { exam: 'u3', ch: '5' };
const DEG = Math.PI / 180;

export default [
  problem({
    ...U,
    id: 'ch5.net',
    level: 2,
    variety: ['configuration'],
    src: 'OpenStax University Physics Vol. 1 §5.3',
    title: 'The acceleration from several forces',
    topics: ['second-law', 'newton'],
    vars: {
      m: range(2, 10, 0.5, 'kg'),
      F1: range(5, 30, 1, 'N'),
      th: choice([30, '30°'], [60, '60°'], [150, '150°'], [120, '120°']),
      F2: range(10, 50, 1, 'N'),
      F3: range(1, 15, 1, 'N'),
      F4: range(0, 10, 1, 'N'),
    },
    derive: ($) => {
      // F1 at th from +x; F2 straight down; F3 along −x; F4 straight up.
      const net = [fromAngle2D($.F1, $.th), v(0, -$.F2, 0), v(-$.F3, 0, 0), v(0, $.F4, 0)].reduce(add);
      const acc = acceleration(net, $.m);
      return { ax: acc.x, ay: acc.y, a: mag(acc), dir: angle2D(acc), sumMag: ($.F1 + $.F2 + $.F3 + $.F4) / $.m };
    },
    // Component by component, written out: ΣFx = m ax and ΣFy = m ay.
    second: ($) => {
      const ax = ($.F1 * Math.cos($.th * DEG) - $.F3) / $.m;
      const ay = ($.F1 * Math.sin($.th * DEG) + $.F4 - $.F2) / $.m;
      return { a: Math.hypot(ax, ay), dir: ((Math.atan2(ay, ax) / DEG) + 360) % 360 };
    },
    valid: ($) => $.a > 0.2,
    text: (T) => `Four forces act on a ${T.m} kg particle in the xy plane: ${T.F1} N at ${T.th} counterclockwise from +x, ${T.F2} N straight down (−y), ${T.F3} N along −x and ${T.F4} N straight up (+y). Find the size of its acceleration and its direction, counterclockwise from +x.`,
    parts: [
      num('a', ($) => $.a, 'm/s²', { label: 'size of the acceleration' }),
      num('dir', ($) => $.dir, '°', { label: 'direction from +x', abs: 0.05, wrap: 360 }),
    ],
    hints: [
      String.raw`Newton's second law is a vector equation: $\sum\vec F = m\vec a$. Apply it to the $x$ parts and the $y$ parts separately.`,
      String.raw`Resolve the slanted force: $F_1\cos\theta$ along $x$ and $F_1\sin\theta$ along $y$. Add each column, then divide by the mass.`,
    ],
    steps: ($) => [
      String.raw`$a_x = \sum F_x/m = ${texNum($.ax)}\ \mathrm{m/s^2}$, $a_y = \sum F_y/m = ${texNum($.ay)}\ \mathrm{m/s^2}$`,
      String.raw`$a = \sqrt{a_x^2 + a_y^2} = ${texNum($.a)}\ \mathrm{m/s^2}$ at $${texNum($.dir)}^\circ$`,
    ],
    cases: [
      kase('OpenStax University Physics Vol. 1 §5.3, "Several Forces on a Particle": 4.0 kg; 10.0 N at 30°, 40.0 N down, 5.0 N along −x, 2.0 N up', { m: 4, F1: 10, th: 30, F2: 40, F3: 5, F4: 2 }, { a: 8.3006, dir: 276.33 }, {
        note: 'The book prints (0.92, −8.3) m/s² and 276°, and a size of 8.4 m/s². From its own components the size is √(0.915² + 8.25²) = 8.30 m/s².',
      }),
      kase('hand', { m: 5, F1: 10, th: 150, F2: 10, F3: 1.34, F4: 5 }, { a: 2.0, dir: 180 }),
    ],
  }),

  problem({
    ...U,
    id: 'ch5.lift',
    level: 1,
    variety: ['unknown', 'representation'],
    src: 'OpenStax University Physics Vol. 1 §5.4',
    title: 'Lifting with an acceleration',
    topics: ['weight', 'second-law'],
    vars: {
      q: choice(['force', 'the force he applies'], ['accel', 'the stone’s acceleration']),
      unit: choice(['N', 'newtons'], ['lb', 'pounds']),
      W: range(20, 60, 5, 'lb'),
      a: range(0.5, 3, 0.5, 'm/s²'),
      extra: range(10, 80, 5, 'N'),
    },
    derive: ($) => {
      const w = $.unit === 'lb' ? $.W * N_PER_LBF : $.W * 4.5;
      const m = w / G;
      const F = $.q === 'force' ? w + m * $.a : w + $.extra;
      const aOut = $.q === 'force' ? $.a : (F - w) / m;
      return { w, m, F, aOut, ans: $.q === 'force' ? F : aOut };
    },
    // From the weight vector and a = ΣF/m with the library, rather than the rearranged scalar form.
    second: ($) => {
      const w = $.unit === 'lb' ? $.W * N_PER_LBF : $.W * 4.5;
      const m = w / mag(weight(1, G));
      if ($.q === 'force') return { ans: m * ($.a + G) };
      return { ans: acceleration(add(v(0, w + $.extra, 0), weight(m, G)), m).y };
    },
    text: (T, $, sig) => {
      const given = $.unit === 'lb' ? `${T.W} lb (1 lb = ${sig(N_PER_LBF)} N)` : `${sig($.W * 4.5)} N`;
      return $.q === 'force'
        ? `A farmer lifts a stone that weighs ${given} straight up, so that it speeds up at ${T.a} m/s². Take g = ${G} m/s². What upward force does he apply?`
        : `A farmer lifts a stone that weighs ${given} straight up with a force of ${sig($.F)} N. Take g = ${G} m/s². What is the stone's acceleration?`;
    },
    parts: [
      num('ans', ($) => $.ans, ($) => ($.q === 'force' ? 'N' : 'm/s²'), { label: 'the answer' }),
    ],
    hints: [
      String.raw`Two forces act on the stone: his pull $F$ up and its weight $w$ down. Newton's second law: $F - w = ma$.`,
      String.raw`The mass is not the weight. Find it first: $m = w/g$.`,
    ],
    steps: ($) => [
      String.raw`$w = ${texNum($.w)}\ \mathrm{N}$, so $m = w/g = ${texNum($.m)}\ \mathrm{kg}$`,
      $.q === 'force'
        ? String.raw`$F = w + ma = ${texNum($.F)}\ \mathrm{N}$`
        : String.raw`$a = (F - w)/m = ${texNum($.aOut)}\ \mathrm{m/s^2}$`,
    ],
    cases: [
      kase('OpenStax University Physics Vol. 1 §5.4, "Clearing a Field": a 180 N stone lifted at 1.5 m/s²', { q: 'force', unit: 'N', W: 40, a: 1.5, extra: 50 }, { ans: 207.52 }, {
        note: 'The book rounds the mass to 18 kg and prints 207 N, then 210 N to two figures.',
      }),
      kase('OpenStax University Physics Vol. 1 §5.4, Check Your Understanding 5.5: the same stone lifted with 230.0 N', { q: 'accel', unit: 'N', W: 40, a: 1.5, extra: 50 }, { ans: 2.725 }, {
        note: 'The book rounds the mass to 18 kg and prints 2.78 m/s². With m = 180/9.81 = 18.35 kg, a = 50/18.35 = 2.72 m/s².',
      }),
    ],
  }),

  problem({
    ...U,
    id: 'ch5.system',
    level: 2,
    variety: ['configuration'],
    src: 'OpenStax University Physics Vol. 1 §5.5',
    title: 'Choosing the system',
    topics: ['third-law', 'second-law'],
    vars: {
      load: choice(['loaded', 'a cart loaded with equipment'], ['empty', 'an empty cart']),
      mp: range(50, 90, 5, 'kg'),
      mc: range(8, 20, 1, 'kg'),
      me: range(4, 15, 1, 'kg'),
      F: range(100, 250, 10, 'N'),
      f: range(10, 40, 2, 'N'),
    },
    derive: ($) => {
      const mCart = $.mc + ($.load === 'loaded' ? $.me : 0);
      const total = $.mp + mCart;
      const a = ($.F - $.f) / total;
      return { mCart, total, a, P: mCart * a + $.f };
    },
    // The person alone instead: the floor pushes her forward with F, the cart pushes her back with P.
    second: ($) => {
      const mCart = $.mc + ($.load === 'loaded' ? $.me : 0);
      // F − P = mp a and P − f = mCart a: eliminate P.
      const a = ($.F - $.f) / ($.mp + mCart);
      return { a, P: $.F - $.mp * a };
    },
    valid: ($) => $.F > $.f + 20,
    text: (T, $) => `A ${T.mp} kg professor pushes ${T.load} across a level floor. The cart alone is ${T.mc} kg${$.load === 'loaded' ? `, and the equipment on it ${T.me} kg` : ''}. She pushes backward on the floor with ${T.F} N. Friction on the cart's wheels and air resistance total ${T.f} N. Find the acceleration, and the force she exerts on the cart.`,
    parts: [
      num('a', ($) => $.a, 'm/s²', { label: 'acceleration' }),
      num('P', ($) => $.P, 'N', { label: 'her push on the cart' }),
    ],
    hints: [
      'Choose the system to fit the question. For the acceleration, take the professor and the cart together: the forces between them are internal and cancel.',
      'For her push on the cart, take the cart (and its load) alone. Her push is then an external force on it, and so is friction.',
    ],
    steps: ($) => [
      String.raw`Whole system: $a = (F - f)/(m_p + m_c) = ${texNum($.a)}\ \mathrm{m/s^2}$`,
      String.raw`Cart alone: $P - f = m_c a$, so $P = ${texNum($.P)}\ \mathrm{N}$`,
    ],
    cases: [
      kase('OpenStax University Physics Vol. 1 §5.5, "Choosing the Correct System": 65.0 kg professor, 12.0 kg cart, 7.0 kg equipment, 150 N, 24.0 N', { load: 'loaded', mp: 65, mc: 12, me: 7, F: 150, f: 24 }, { a: 1.5, P: 52.5 }, {
        note: 'The book prints 1.5 m/s², and 52.5 N in the follow-up, "Force on the Cart: Choosing a New System".',
      }),
      kase('hand', { load: 'empty', mp: 60, mc: 15, me: 5, F: 100, f: 25 }, { a: 1, P: 40 }),
    ],
  }),

  problem({
    ...U,
    id: 'ch5.tension',
    level: 2,
    variety: ['configuration'],
    src: 'OpenStax University Physics Vol. 1 §5.6',
    title: 'Tension in two supporting wires',
    topics: ['tension', 'equilibrium'],
    vars: {
      shape: choice(['sym', 'a tightrope that sags at the same angle on both sides'], ['two', 'two wires at different angles']),
      m: range(5, 80, 1, 'kg'),
      t1: range(5, 60, 5, '°'),
      t2: range(10, 70, 5, '°'),
    },
    derive: ($) => {
      const a1 = $.t1 * DEG;
      const a2 = ($.shape === 'sym' ? $.t1 : $.t2) * DEG;
      // Horizontal: T1 cos θ1 = T2 cos θ2. Vertical: T1 sin θ1 + T2 sin θ2 = mg. Eliminate T2.
      const w = $.m * G;
      const T1 = (w * Math.cos(a2)) / Math.sin(a1 + a2);
      const T2 = (w * Math.cos(a1)) / Math.sin(a1 + a2);
      return { w, T1, T2, th2: $.shape === 'sym' ? $.t1 : $.t2 };
    },
    // The closed triangle of forces: the sine rule in the triangle formed by T1, T2 and the weight.
    second: ($) => {
      const a1 = $.t1;
      const a2 = $.shape === 'sym' ? $.t1 : $.t2;
      const w = $.m * G;
      const opposite = (x) => Math.sin(x * DEG);
      // Angle opposite T1 is 90° − θ2, opposite T2 is 90° − θ1, opposite w is θ1 + θ2.
      return { T1: (w * opposite(90 - a2)) / opposite(a1 + a2), T2: (w * opposite(90 - a1)) / opposite(a1 + a2) };
    },
    text: (T, $) => ($.shape === 'sym'
      ? `A ${T.m} kg tightrope walker stands at the middle of a wire, which sags ${T.t1}° below the horizontal on each side. Ignore the wire's mass. Find the tension on each side.`
      : `A ${T.m} kg sign hangs from two wires. The left wire rises ${T.t1}° above the horizontal and the right wire ${T.t2}°. Ignore the wires' masses. Find the tension in each wire.`),
    parts: [
      num('T1', ($) => $.T1, 'N', { label: 'tension, left' }),
      num('T2', ($) => $.T2, 'N', { label: 'tension, right' }),
    ],
    hints: [
      'Nothing accelerates, so the net force is zero along x and along y. Write both equations for the point where the wires meet.',
      String.raw`Along $x$: $T_1\cos\theta_1 = T_2\cos\theta_2$. Along $y$: $T_1\sin\theta_1 + T_2\sin\theta_2 = mg$.`,
    ],
    steps: ($) => [
      String.raw`$T_1 = mg\cos\theta_2/\sin(\theta_1 + \theta_2) = ${texNum($.T1)}\ \mathrm{N}$`,
      String.raw`$T_2 = mg\cos\theta_1/\sin(\theta_1 + \theta_2) = ${texNum($.T2)}\ \mathrm{N}$, against a weight of $${texNum($.w)}\ \mathrm{N}$`,
    ],
    cases: [
      kase('OpenStax University Physics Vol. 1 §5.6, "What Is the Tension in a Tightrope?": 70.0 kg, a 5.0° sag', { shape: 'sym', m: 70, t1: 5, t2: 5 }, { T1: 3939.5, T2: 3939.5 }, {
        note: 'The book uses g = 9.80 m/s² and sin 5.0° = 0.0872 and prints 3930 N.',
      }),
      kase('OpenStax University Physics Vol. 1 §6.1, "Different Tensions at Different Angles": a 15.0 kg traffic light on wires at 30° and 45°', { shape: 'two', m: 15, t1: 30, t2: 45 }, { T1: 107.72, T2: 131.93 }, {
        note: 'The book prints 108 N and 132 N.',
      }),
    ],
  }),

  problem({
    ...U,
    id: 'ch5.concept-pairs',
    src: 'OpenStax University Physics Vol. 1 §5.5',
    title: 'Action and reaction',
    kind: 'conceptual',
    level: 1,
    topics: ['third-law'],
    variety: ['configuration'],
    vars: {
      q: choice(
        [1, 'a book resting on a table: the weight of the book, the pull of Earth on the book'],
        [2, 'a swimmer pushing off a wall: the push of her feet on the wall'],
        [3, 'a car accelerating forward: the push of the tyres backward on the road'],
      ),
    },
    derive: ($) => ({ ans: { 1: 'book-earth', 2: 'wall-feet', 3: 'road-tyres' }[$.q] }),
    second: ($) => ({ ans: { 1: 'book-earth', 2: 'wall-feet', 3: 'road-tyres' }[$.q] }),
    text: (T) => `Newton's third law pairs every force with a reaction. For ${T.q.split(':')[0]}, what is the reaction to ${T.q.split(':')[1].trim()}?`,
    parts: [
      mc('ans', ($) => ({
        1: [
          ['normal', 'The table pushing up on the book', 'Both of those forces act on the book, so they cannot be a third-law pair. They balance because the book does not accelerate, which is the second law, not the third.'],
          ['book-earth', 'The book pulling up on Earth', 'Right: Earth pulls the book down, so the book pulls Earth up with the same size of force. The pair acts on two different bodies.'],
          ['book-table', 'The book pushing down on the table', 'That is the reaction to the table’s push on the book, a contact force. Gravity’s reaction is a gravitational pull, on Earth.'],
        ],
        2: [
          ['wall-feet', 'The wall pushing her feet away from it', 'Right: she pushes the wall, the wall pushes her back with the same size of force. That push on her is what sends her off.'],
          ['water', 'The water pushing on her', 'Water drag acts on her, but it is not paired with her push on the wall. The pair to "feet on wall" is "wall on feet".'],
          ['none', 'Nothing: the wall does not move', 'The wall does push back. It does not move because it is fixed to the pool, which is fixed to Earth.'],
        ],
        3: [
          ['road-tyres', 'The road pushing the tyres forward', 'Right: the tyres push the road back, so the road pushes the tyres forward. That forward push accelerates the car.'],
          ['engine', 'The engine pushing the car forward', 'The engine is part of the car, so its forces are internal. The only external forward force on the car comes from the road.'],
          ['friction', 'Friction pushing the car backward', 'The pair to a backward push on the road is a forward push on the tyres. Friction here points forward on the car.'],
        ],
      }[$.q]), ($) => $.ans, { label: 'the reaction' }),
    ],
    hints: [
      'The two forces of a third-law pair act on two different bodies, are the same kind of force, and are equal in size and opposite in direction.',
      'Swap the names: if A pushes B, the reaction is B pushing A.',
    ],
    steps: ($) => [{ 1: 'Earth pulls the book; the book pulls Earth.', 2: 'Her feet push the wall; the wall pushes her feet.', 3: 'The tyres push the road back; the road pushes the tyres forward.' }[$.q]],
    cases: [
      kase('OpenStax University Physics Vol. 1 §5.5, "Forces on a Stationary Object": the weight and the scale\'s push on a package are not a third-law pair', { q: 1 }, { ans: 'book-earth' }),
      kase('OpenStax University Physics Vol. 1 §5.5: a swimmer pushes on the wall, and the wall pushes back on her', { q: 2 }, { ans: 'wall-feet' }),
    ],
  }),

  problem({
    ...U,
    id: 'ch5.concept-first',
    src: 'OpenStax University Physics Vol. 1 §5.2',
    title: 'Force and motion',
    kind: 'conceptual',
    level: 1,
    topics: ['newton'],
    variety: ['configuration'],
    vars: {
      q: choice(
        [1, 'A car cruises at a steady 100 km/h on a straight, level road. How does the forward force from the road compare with the drag and friction holding it back?'],
        [2, 'A hockey puck slides across smooth ice at a steady speed after it leaves the stick. What horizontal force keeps it moving?'],
        [3, 'A crate on a truck bed slides forward when the truck brakes hard. Why?'],
      ),
    },
    derive: ($) => ({ ans: { 1: 'equal', 2: 'none', 3: 'inertia' }[$.q] }),
    second: ($) => ({ ans: { 1: 'equal', 2: 'none', 3: 'inertia' }[$.q] }),
    text: (T) => T.q,
    parts: [
      mc('ans', ($) => ({
        1: [
          ['bigger', 'The forward force is bigger, or the car would slow down', 'A bigger forward force would speed the car up. At constant velocity the net force is zero.'],
          ['equal', 'They are equal in size', 'Right: constant velocity means zero acceleration, so the net force is zero. Forward and backward forces balance.'],
          ['smaller', 'The forward force is smaller', 'Then the net force would point back and the car would slow down.'],
        ],
        2: [
          ['stick', 'The force of the stick, carried with the puck', 'The stick’s force stops when contact ends. A force acts only while something pushes or pulls.'],
          ['none', 'None is needed', 'Right: with no net force a body keeps its velocity. Ice friction is small, so the puck nearly keeps its speed.'],
          ['momentum', 'A force of motion that slowly runs out', 'There is no such force. The puck slows only because of the small friction and drag that do act on it.'],
        ],
        3: [
          ['forward', 'A forward force pushes it toward the cab', 'Nothing pushes it forward. In the ground’s frame the crate tries to keep its velocity while the truck slows under it.'],
          ['inertia', 'It keeps moving forward while the truck slows; friction cannot slow it fast enough', 'Right: the crate keeps its velocity unless a force changes it. Friction from the bed is the only horizontal force, and it is limited to μN.'],
          ['brakes', 'The brakes push the crate', 'The brakes act on the wheels. Only friction from the bed acts horizontally on the crate.'],
        ],
      }[$.q]), ($) => $.ans, { label: 'the answer' }),
    ],
    hints: [
      'Newton’s first law: a body keeps its velocity unless a net force acts. A force changes motion; it is not needed to keep it.',
      'Constant velocity, in a straight line, means zero net force.',
    ],
    steps: ($) => [{ 1: 'Zero acceleration, zero net force: the forces balance.', 2: 'No net force is needed to keep a velocity.', 3: 'Inertia: the crate keeps its velocity while the truck slows.' }[$.q]],
    cases: [
      kase('OpenStax University Physics Vol. 1 §5.2, "When Does Newton\'s First Law Apply to Your Car?": at constant velocity the net external force is zero', { q: 1 }, { ans: 'equal' }),
      kase('OpenStax University Physics Vol. 1 §5.2: an object in motion stays in motion with the same velocity unless a net force acts', { q: 2 }, { ans: 'none' }),
    ],
  }),

  problem({
    ...U,
    id: 'ch5.concept-fbd',
    src: 'OpenStax University Physics Vol. 1 §5.7',
    title: 'What belongs on a free-body diagram',
    kind: 'conceptual',
    level: 2,
    topics: ['newton', 'normal'],
    variety: ['configuration'],
    vars: {
      q: choice(
        [1, 'a ball in flight after it has been thrown'],
        [2, 'a car going round a level curve at a steady speed, drawn from the ground'],
        [3, 'block B sliding down a ramp while block A, tied to a rope, is pulled up across B’s top face'],
      ),
    },
    derive: ($) => ({ ans: { 1: 'weight', 2: 'friction-in', 3: 'two' }[$.q] }),
    second: ($) => ({ ans: { 1: 'weight', 2: 'friction-in', 3: 'two' }[$.q] }),
    text: (T) => `Which description fits the free-body diagram of ${T.q}?`,
    parts: [
      mc('ans', ($) => ({
        1: [
          ['weight', 'Its weight only, if air resistance is ignored', 'Right: once it leaves the hand, only gravity acts on it. Nothing in contact pushes it.'],
          ['throw', 'Its weight, and the force of the throw pointing along its path', 'The hand’s force ends at release. A free-body diagram shows only forces acting now, from things touching it or from gravity.'],
          ['none', 'No forces: it is moving freely', 'Gravity still acts, which is why the path curves down.'],
        ],
        2: [
          ['friction-in', 'Weight down, the normal force up, and friction toward the centre of the curve', 'Right: friction from the road supplies the centripetal force. Nothing pushes outward in the ground’s frame.'],
          ['centrifugal', 'Weight, the normal force, and a centrifugal force pushing outward', 'There is no outward force in the ground’s frame. The car needs a net inward force, and friction supplies it. The outward push you feel is inertia seen from inside the car.'],
          ['forward', 'Weight, the normal force, and a forward driving force only', 'A force along the motion cannot turn the car. Turning needs a force toward the centre.'],
        ],
        3: [
          ['two', 'Two normal forces and two friction forces: from the ramp and from block A', 'Right: B touches two surfaces, the ramp and block A, and each contact gives a normal force and a friction force.'],
          ['one', 'One normal force and one friction force, from the ramp', 'B also touches block A. That contact pushes on B too: a normal force and a friction force.'],
          ['rope', 'The rope’s tension, the ramp’s normal force and friction', 'The rope is tied to A, not to B, so its tension is not on B’s diagram.'],
        ],
      }[$.q]), ($) => $.ans, { label: 'the diagram' }),
    ],
    hints: [
      'Draw the body alone. Add its weight, then one force for every thing that touches it, and nothing else.',
      'Each contact surface gives a normal force and, if it is rough, a friction force. A force that has stopped acting, or that acts on another body, does not belong.',
    ],
    steps: ($) => [{ 1: 'Only gravity: weight down.', 2: 'Weight, normal force, friction inward.', 3: 'Two contacts: two normal forces, two friction forces, and the weight.' }[$.q]],
    cases: [
      kase('OpenStax University Physics Vol. 1 §5.7, "Two Blocks on an Inclined Plane": block B has two contact surfaces, so two normal forces and two friction forces', { q: 3 }, { ans: 'two' }),
      kase('OpenStax University Physics Vol. 1 §6.3: centrifugal force is not a real force; friction supplies the centripetal force on a flat curve', { q: 2 }, { ans: 'friction-in' }),
    ],
  }),
];
