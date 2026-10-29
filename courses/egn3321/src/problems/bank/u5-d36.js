/**
 * Unit 5 additions (D36): relative motion with rotating axes (Hibbeler §16.8). A shaper's slotted
 * rocker, the direction of the Coriolis term, and a collar on a rod whose pivot rides an accelerating
 * cart. Second methods differentiate the geometry numerically.
 */
import { rotatingAxes, slottedRocker, slottedRockerNumeric } from '@flux/subjects/mechanics/rotating.js';
import { choice, kase, num, problem, range } from '../kit.js';

const DEG = Math.PI / 180;

/** A choice part whose options each carry a `why`. */
const pick = (id, label, options, correct) => ({ id, kind: 'choice', label, options: options.map(([value, text, why]) => ({ value, label: text, why })), correct, multi: false });

const rocker = ($) => slottedRocker({ r: $.r, d: $.d, phi: $.phi * DEG, omega: $.w, alpha: 0 });

/** Where the Coriolis acceleration points, for someone moving on a turntable turning counterclockwise. */
const WALKS = {
  out: [1, 0],
  in: [-1, 0],
  with: [0, 1],
  against: [0, -1],
  still: [0, 0],
};
function coriolisWay(walk, numeric = false) {
  let a;
  if (!numeric) {
    a = rotatingAxes({ W: 1, r: [3, 0], vRel: WALKS[walk] }).terms.coriolis;
  } else {
    // Track the walker's position in fixed axes and take out the parts a body fixed to the platform would have.
    const [ur, ut] = WALKS[walk];
    const pos = (t) => {
      const rr = 3 + ur * t;
      const th = t + (ut * t) / 3;
      return [rr * Math.cos(th), rr * Math.sin(th)];
    };
    const h = 1e-3;
    const ax = (pos(h)[0] - 2 * pos(0)[0] + pos(-h)[0]) / (h * h);
    const ay = (pos(h)[1] - 2 * pos(0)[1] + pos(-h)[1]) / (h * h);
    // Fixed to the platform at r = 3: a = −Ω² r = (−3, 0). Moving along a line in the platform, a_rel = 0,
    // except walking round the circle of radius 3, where a_rel = −u²/3 inward.
    const aRel = ut ? [-(ut * ut) / 3, 0] : [0, 0];
    a = [ax + 3 - aRel[0], ay - aRel[1]];
  }
  const [x, y] = a.map((q) => (Math.abs(q) < 1e-3 ? 0 : q));
  if (!x && !y) return 'zero';
  if (Math.abs(y) > Math.abs(x)) return y > 0 ? 'ahead' : 'behind';
  return x > 0 ? 'outward' : 'inward';
}

/** A collar on a rod pinned to a cart, the rod along +x at this instant. */
function cartRod($) {
  const aA = $.base === 'cart' ? [$.aCart, 0] : [0, 0];
  return rotatingAxes({ aA, W: $.W, Wd: $.Wd, r: [$.rho, 0], vRel: [$.u, 0], aRel: [$.b, 0] });
}
function cartRodNumeric($) {
  const xA = (t) => ($.base === 'cart' ? 0.5 * $.aCart * t * t : 0);
  const th = (t) => $.W * t + 0.5 * $.Wd * t * t;
  const rr = (t) => $.rho + $.u * t + 0.5 * $.b * t * t;
  const x = (t) => xA(t) + rr(t) * Math.cos(th(t));
  const y = (t) => rr(t) * Math.sin(th(t));
  const h = 1e-4;
  return [(x(h) - 2 * x(0) + x(-h)) / (h * h), (y(h) - 2 * y(0) + y(-h)) / (h * h)];
}

const more = [
  problem({
    id: 'u5.16.rocker',
    title: 'A shaper’s slotted rocker',
    exam: 'u5',
    ch: '16',
    lab: 'coriolis',
    src: 'Hibbeler §16.8',
    topics: ['rotating'],
    // Structure: the rocker's velocities, or its accelerations, are asked.
    vars: {
      find: choice(['rates', 'how fast the rocker turns and how fast the pin slides'], ['accel', 'the rocker’s angular acceleration and the Coriolis term']),
      r: range(0.06, 0.14, 0.02, 'm'),
      d: range(0.2, 0.32, 0.03, 'm'),
      w: range(2, 8, 1, 'rad/s'),
      phi: range(0, 330, 30, 'deg'),
    },
    // Keep away from the top and bottom, where the pin does not slide and the Coriolis term vanishes.
    valid: ($) => $.phi % 180 !== 90 && Math.abs(rocker($).vRel) > 0.02,
    text: (T) => String.raw`In a shaper's quick-return drive, a crank ${T.r} m long turns about a pivot C at a steady ${T.w} rad/s, counterclockwise. Its pin slides in the slot of a rocker pivoted at O, ${T.d} m directly below C. When the crank makes ${T.phi}° with the horizontal, find ${T.find}.`,
    parts: [
      num('p1', ($) => ($.find === 'rates' ? rocker($).W : rocker($).Wd), ($) => ($.find === 'rates' ? 'rad/s' : 'rad/s²'), { label: ($) => ($.find === 'rates' ? 'rocker Ω (counterclockwise positive)' : 'rocker Ω̇ (counterclockwise positive)') }),
      num('p2', ($) => ($.find === 'rates' ? rocker($).vRel : rocker($).coriolis), ($) => ($.find === 'rates' ? 'm/s' : 'm/s²'), { label: ($) => ($.find === 'rates' ? 'pin’s speed along the slot, outward positive' : 'Coriolis term 2Ωv_rel, counterclockwise positive') }),
    ],
    level: 3,
    hints: [
      'Put axes on the rocker. The pin is at ρ along the slot and slides along it. The crank tells you the pin’s absolute velocity and acceleration.',
      'Match the two descriptions across and along the slot: across, v_P·n = ρΩ; along, v_P·e = v_rel.',
      'For the accelerations, across the slot a_P·n = ρΩ̇ + 2Ωv_rel. The Coriolis term is there because the pin slides along a turning slot.',
    ],
    steps: ($, sig) => {
      const c = rocker($);
      return [
        String.raw`The pin is at $(${sig(c.P[0])}, ${sig(c.P[1])})$ m from O, so $\rho = ${sig(c.rho)}$ m along the slot.`,
        String.raw`From the crank, $\vec v_P = \omega\times\vec r_{CP}$ and $\vec a_P = -\omega^2\vec r_{CP}$: $|v_P| = ${sig($.r * $.w)}$ m/s, $|a_P| = ${sig($.r * $.w * $.w)}$ m/s².`,
        String.raw`Across the slot: $\Omega = (\vec v_P\cdot\hat n)/\rho = ${sig(c.W)}$ rad/s. Along it: $v_{rel} = \vec v_P\cdot\hat e = ${sig(c.vRel)}$ m/s.`,
        String.raw`Across the slot again: $\vec a_P\cdot\hat n = \rho\dot\Omega + 2\Omega v_{rel}$, so $2\Omega v_{rel} = ${sig(c.coriolis)}$ m/s² and $\dot\Omega = ${sig(c.Wd)}$ rad/s².`,
      ];
    },
    second: ($) => {
      const n = slottedRockerNumeric({ r: $.r, d: $.d, phi: $.phi * DEG, omega: $.w, alpha: 0 });
      return $.find === 'rates' ? { p1: n.W, p2: n.vRel } : { p1: n.Wd, p2: 2 * n.W * n.vRel };
    },
    sim: {
      scenario: 'shaper',
      setup(s, $) {
        Object.assign(s, { r: $.r, d: $.d, omega: $.w, alpha: 0, phi: $.phi });
      },
      read: (c, s, $) => ($.find === 'rates' ? { p1: c.W, p2: c.vRel } : { p1: c.Wd, p2: c.coriolis }),
    },
    cases: [
      kase('Hibbeler §16.8', { find: 'accel', r: 0.1, d: 0.25, w: 4, phi: 30 }, { p1: slottedRocker({ r: 0.1, d: 0.25, phi: 30 * DEG, omega: 4 }).Wd, p2: slottedRocker({ r: 0.1, d: 0.25, phi: 30 * DEG, omega: 4 }).coriolis }),
    ],
  }),

  problem({
    id: 'u5.16.coriolis-dir',
    title: 'Walking on a turntable',
    exam: 'u5',
    ch: '16',
    kind: 'conceptual',
    lab: 'coriolis',
    src: 'Hibbeler §16.8',
    topics: ['rotating'],
    vars: {
      walk: choice(
        ['out', 'walks straight out from the centre'],
        ['in', 'walks straight in toward the centre'],
        ['with', 'walks round the rim the way the platform turns'],
        ['against', 'walks round the rim against the turn'],
        ['still', 'stands still on the platform'],
      ),
    },
    text: (T) => `A playground turntable turns counterclockwise at a steady rate. A child on it ${T.walk}, at a steady pace relative to the platform. Which way does the Coriolis part of the child's acceleration, 2Ω × v_rel, point?`,
    parts: [
      pick('way', 'the Coriolis acceleration', [
        ['ahead', 'sideways, the way the platform turns', 'Ω × v_rel turns v_rel a quarter turn the way the platform spins. Walking out, v_rel points out, so the Coriolis term points ahead: the platform must push the child forward.'],
        ['behind', 'sideways, against the turn', 'A quarter turn of an inward v_rel, counterclockwise, points against the turn. Walking in, the child carries too much sideways speed and must be held back.'],
        ['inward', 'toward the centre', 'Walking with the turn, v_rel points ahead; a quarter turn more points inward. The child moves faster round the circle than the platform there, so needs extra pull inward.'],
        ['outward', 'away from the centre', 'Walking against the turn, v_rel points back, and a quarter turn takes it outward. The child goes round more slowly than the platform, so needs less inward pull than a point on the rim.'],
        ['zero', 'there is none', 'Only with v_rel = 0 is the Coriolis term zero. Standing still, the child has just the centripetal part, Ω × (Ω × r).'],
      ], ($) => coriolisWay($.walk)),
    ],
    level: 2,
    hints: [
      'The Coriolis term is 2Ω × v_rel: it is zero unless the child moves relative to the platform.',
      'For a counterclockwise Ω, Ω × v turns v a quarter turn counterclockwise.',
    ],
    steps: ($) => [
      'The Coriolis term is 2Ω × v_rel. With Ω counterclockwise, it is v_rel turned a quarter turn counterclockwise, scaled by 2Ω.',
      { out: 'v_rel points out; a quarter turn counterclockwise points ahead.', in: 'v_rel points in; a quarter turn counterclockwise points back.', with: 'v_rel points ahead; a quarter turn points inward.', against: 'v_rel points back; a quarter turn points outward.', still: 'v_rel = 0, so there is no Coriolis term.' }[$.walk],
    ],
    second: ($) => ({ way: coriolisWay($.walk, true) }),
    cases: [kase('Hibbeler §16.8', { walk: 'out' }, { way: 'ahead' })],
  }),

  problem({
    id: 'u5.16.cart-rod',
    title: 'A collar on a rod on a moving cart',
    exam: 'u5',
    ch: '16',
    lab: 'coriolis',
    src: 'Hibbeler §16.8',
    topics: ['rotating'],
    // Structure: the rod's pivot is fixed, or rides a cart that accelerates along the rod's line.
    vars: {
      base: choice(['fixed', 'a fixed pin'], ['cart', 'a pin on a cart']),
      rho: range(0.4, 1.2, 0.2, 'm'),
      u: range(-1, 1.5, 0.5, 'm/s'),
      b: range(-1, 2, 0.5, 'm/s²'),
      W: range(1, 4, 0.5, 'rad/s'),
      Wd: range(-2, 3, 1, 'rad/s²'),
      aCart: range(1, 4, 1, 'm/s²'),
    },
    valid: ($) => Math.abs($.u) > 1e-9,
    text: (T, $) => String.raw`A rod turns about ${T.base}${$.base === 'cart' ? `, and the cart accelerates at ${T.aCart} m/s² along the line the rod points at this instant` : ''}. The rod turns at $\Omega = ${T.W}$ rad/s counterclockwise, with $\dot\Omega = ${T.Wd}$ rad/s². A collar on the rod is ${T.rho} m from the pin, sliding outward along it at ${T.u} m/s and speeding up along it at ${T.b} m/s². Find the collar's acceleration along the rod and across it.`,
    parts: [
      num('ax', ($) => cartRod($).a[0], 'm/s²', { label: 'acceleration along the rod (outward positive)' }),
      num('ay', ($) => cartRod($).a[1], 'm/s²', { label: 'acceleration across the rod (counterclockwise positive)' }),
    ],
    level: 2,
    hints: [
      'Use axes on the rod with their origin at the pin: a = a_A + Ω̇ × r + Ω × (Ω × r) + 2Ω × v_rel + a_rel.',
      'Along the rod: a_A’s part, −Ω²ρ, and a_rel. Across it: Ω̇ρ and 2Ωv_rel.',
    ],
    steps: ($, sig) => {
      const c = cartRod($);
      const t = c.terms;
      return [
        String.raw`Along the rod: $a_A + a_{rel} - \Omega^2\rho = ${sig(t.aA[0])} + ${sig($.b)} - ${sig($.W * $.W * $.rho)} = ${sig(c.a[0])}$ m/s².`,
        String.raw`Across it: $\dot\Omega\rho + 2\Omega v_{rel} = ${sig(t.tangential[1])} + ${sig(t.coriolis[1])} = ${sig(c.a[1])}$ m/s².`,
      ];
    },
    second: ($) => {
      const [ax, ay] = cartRodNumeric($);
      return { ax, ay };
    },
    cases: [kase('Hibbeler §16.8', { base: 'cart', rho: 0.8, u: 0.5, b: 0, W: 3, Wd: 2, aCart: 2 }, { ax: 2 - 7.2, ay: 1.6 + 3 })],
  }),
];

export default more;
