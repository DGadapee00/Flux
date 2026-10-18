/**
 * Unit 6 beyond the original drills: four conceptual questions, each option with its own reason,
 * and the unit's application, a turbopump rotor's spin-up (the `spinup` lab).
 */
import { barPin, centralInertia, diskInertiaIntegral } from '@flux/subjects/mechanics/inertia.js';
import { inertiaRodCenter, inertiaRodEnd } from '@flux/subjects/mechanics/rotation.js';
import { rotorInertia, spinup, spinupByStepping } from '../../labs/spinup.js';
import { G, choice, kase, num, problem, range } from '../kit.js';

const SHAFT = { ms: 0.08, rs: 0.005, Mf: 0.02 };

/** A choice part whose options each carry a `why` (a string, or a function of $). */
const pick = (id, label, options, correct) => ({ id, kind: 'choice', label, options: options.map(([value, text, why]) => ({ value, label: text, why })), correct, multi: false });

/** The two bodies of each pair, in the order the question names them, with unit mass and size. */
const PAIRS = {
  'hoop-disk': { names: ['the hoop', 'the disk'], I: [centralInertia('hoop', 1, 1), centralInertia('disk', 1, 1)] },
  'sphere-disk': { names: ['the sphere', 'the disk'], I: [centralInertia('sphere', 1, 1), centralInertia('disk', 1, 1)] },
  rod: { names: ['the end-pivoted rod', 'the centre-pivoted rod'], I: [inertiaRodEnd(1, 1), inertiaRodCenter(1, 1)] },
};
/** Same torque from rest: t = Iω/M, so the smaller I gets there first. */
function faster(pair) {
  const [a, b] = PAIRS[pair].I;
  if (Math.abs(a - b) < 1e-12) return 'same';
  return a < b ? 'first' : 'second';
}

/**
 * Friction on a body that rolls without slipping, positive along the motion. A push P at height h
 * above the centre, a downhill pull W: ma = P + W + f and Iα = Ph − fR with a = αR give
 * f = (Ph − kR(P + W))/(R(1 + k)), k = I/(mR²).
 */
function rollingFriction({ P, h, W, k, R = 1 }) {
  return (P * h - k * R * (P + W)) / (R * (1 + k));
}
const FRICTION = {
  downhill: { P: 0, h: 0, W: 1 },
  centre: { P: 1, h: 0, W: 0 },
  top: { P: 1, h: 1, W: 0 },
  coast: { P: 0, h: 0, W: 0 },
};
function frictionWay(kind) {
  const f = rollingFriction({ ...FRICTION[kind], k: 0.5 });
  if (Math.abs(f) < 1e-12) return 'none';
  return f > 0 ? 'with' : 'against';
}

/** The pin force against the weight for a 1 kg, 2 m bar, from the bar's own equations. */
const PIN_CASE = {
  release: { thetaDeg: 90, omega: 0 },
  hang: { thetaDeg: 0, omega: 0 },
  bottom: { thetaDeg: 0, omega: Math.sqrt((3 * G) / 2) },
};
function pinVersusWeight(kind) {
  const row = barPin({ mass: 1, length: 2, ...PIN_CASE[kind] });
  if (Math.abs(row.ratio - 1) < 1e-9) return 'equal';
  return row.ratio < 1 ? 'less' : 'more';
}

/** Time to the same speed under a steady net torque, as a factor of the original: t ∝ I/M. */
const CHANGE = {
  radius: { I: 4, M: 1 },
  mass: { I: 2, M: 1 },
  ring: { I: centralInertia('hoop', 1, 1) / centralInertia('disk', 1, 1), M: 1 },
  torque: { I: 1, M: 2 },
};
const factorOf = (c) => {
  const r = CHANGE[c].I / CHANGE[c].M;
  return { 4: '4', 2: '2', 1: '1', 0.5: 'half' }[r] ?? String(r);
};

/** The application problem's numbers: the rotor, then the spin-up. */
function rotor($) {
  const I = rotorInertia($.md, $.R, SHAFT.ms, SHAFT.rs);
  const sp = spinup({ I, M: $.M, Mf: SHAFT.Mf, Mr: $.load === 'pump' ? $.Mr : 0, rpm: $.rpm });
  return { I, ...sp };
}

const more = [
  problem({
    id: 'u6.17.spin-faster',
    title: 'Which spins up first?',
    exam: 'u6',
    ch: '17',
    kind: 'conceptual',
    lab: 'inertia',
    src: 'Hibbeler §17.1',
    topics: ['inertia'],
    vars: {
      pair: choice(
        ['hoop-disk', 'a thin hoop and a solid disk, with the same mass and radius'],
        ['sphere-disk', 'a solid sphere and a solid disk, with the same mass and radius'],
        ['rod', 'two equal slender rods, one pivoted at its end and one at its centre'],
      ),
    },
    text: (T) => `Take ${T.pair}. Each starts from rest about its axis, and each gets the same steady torque. Ignore friction. Which reaches a given angular speed first?`,
    parts: [
      pick('which', 'reaches the speed first', [
        ['first', (T, $) => PAIRS[$.pair].names[0], ($) => (faster($.pair) === 'first' ? `It has the smaller mass moment, so the same torque gives it the larger α.` : `It has the larger mass moment: its mass sits farther from the axis, so the same torque gives it a smaller α.`)],
        ['second', (T, $) => PAIRS[$.pair].names[1], ($) => (faster($.pair) === 'second' ? 'It has the smaller mass moment, so the same torque gives it the larger α.' : 'It has the larger mass moment: its mass sits farther from the axis, so the same torque gives it a smaller α.')],
        ['same', 'they arrive together', 'Same mass and size is not the same I. How far the mass sits from the axis decides it.'],
      ], ($) => faster($.pair)),
    ],
    level: 1,
    hints: ['The torque is the same, so α = M/I. Compare the two mass moments.',
      'I counts each bit of mass times the square of its distance from the axis. Which body keeps its mass closer in?',
    ],
    steps: ($) => {
      const [a, b] = PAIRS[$.pair].I;
      const [na, nb] = PAIRS[$.pair].names;
      return [
        `For a unit mass and size, ${na} has I = ${a.toFixed(3)} and ${nb} has I = ${b.toFixed(3)}.`,
        `With the same torque, α = M/I, so the time to a speed ω is Iω/M. The one with the smaller I gets there first: ${faster($.pair) === 'first' ? na : nb}.`,
      ];
    },
    // Second: time-step each body's spin-up under the same torque and see which crosses ω = 1 first.
    second: ($) => {
      const reach = (I) => {
        let w = 0;
        let t = 0;
        while (w < 1) {
          w += (1 / I) * 1e-4;
          t += 1e-4;
        }
        return t;
      };
      const [ta, tb] = PAIRS[$.pair].I.map(reach);
      return { which: Math.abs(ta - tb) < 1e-9 ? 'same' : ta < tb ? 'first' : 'second' };
    },
    cases: [kase('Hibbeler §17.1', { pair: 'hoop-disk' }, { which: 'second' })],
  }),

  problem({
    id: 'u6.17.pin-load',
    title: 'More or less than the weight?',
    exam: 'u6',
    ch: '17',
    kind: 'conceptual',
    lab: 'pendulum',
    src: 'Hibbeler §17.4',
    topics: ['pin'],
    vars: {
      when: choice(
        ['release', 'at the instant it is released from rest, horizontal'],
        ['hang', 'while it hangs straight down, at rest'],
        ['bottom', 'as it swings through the bottom, after a release from horizontal'],
      ),
    },
    text: (T) => `A uniform bar is pinned at one end. Compare the pin force with the bar's weight ${T.when}.`,
    parts: [
      pick('pin', 'the pin force is', [
        ['less', 'less than the weight', ($) => ($.when === 'release' ? 'Right: the centre is accelerating downward at 3g/4, so the pin holds only mg/4.' : 'The pin carries less only when the centre accelerates downward. Here it does not.')],
        ['equal', 'equal to the weight', ($) => ($.when === 'hang' ? 'Right: at rest, nothing accelerates, and the pin holds exactly mg.' : 'Equal only when the mass centre has no acceleration. Here it accelerates.')],
        ['more', 'more than the weight', ($) => ($.when === 'bottom' ? 'Right: the centre moves on a circle, so the pin also supplies m(L/2)ω² upward: 2.5mg in all.' : 'More only when the centre accelerates toward the pin, as it does when swinging through the bottom.')],
      ], ($) => pinVersusWeight($.when)),
    ],
    level: 2,
    hints: ['The pin force and the weight together give the mass centre its acceleration: ΣF = m a_G.',
      'Which way does the centre accelerate in each case? Downward means the pin pushes less than mg; toward the pin above means more.',
    ],
    steps: ($) => {
      const row = barPin({ mass: 1, length: 2, ...PIN_CASE[$.when] });
      return [
        `Take m = 1 kg and L = 2 m. The pin force is ${row.pin.toFixed(2)} N against a weight of ${G.toFixed(2)} N: ${row.ratio.toFixed(2)} times the weight.`,
        'At release the centre falls at 3g/4; hanging, it does not accelerate; at the bottom it moves on a circle with a_G = (L/2)ω² = 1.5g, toward the pin.',
      ];
    },
    // Second: from the component form of the bar's equations, not the ratio itself.
    second: ($) => {
      const row = barPin({ mass: 1, length: 2, ...PIN_CASE[$.when] });
      const pin = Math.hypot(row.OxC, row.OyC);
      return { pin: Math.abs(pin - G) < 1e-9 ? 'equal' : pin < G ? 'less' : 'more' };
    },
    cases: [kase('Hibbeler §17.4', { when: 'release' }, { pin: 'less' })],
  }),

  problem({
    id: 'u6.17.friction-way',
    title: 'Which way does friction point?',
    exam: 'u6',
    ch: '17',
    kind: 'conceptual',
    lab: 'roll-slip',
    src: 'Hibbeler §17.5',
    topics: ['roll'],
    vars: {
      kind: choice(
        ['downhill', 'rolls down an incline from rest'],
        ['centre', 'is pulled along a level floor by a horizontal force at its centre'],
        ['top', 'is pulled along a level floor by a rope wound over its top, pulled horizontally'],
        ['coast', 'rolls along a level floor at a steady speed, with nothing pushing it'],
      ),
    },
    text: (T) => `A uniform disk ${T.kind}. It rolls without slipping. Which way does the friction force from the ground point?`,
    parts: [
      pick('f', 'friction points', [
        ['with', 'the way the disk moves', ($) => ($.kind === 'top' ? 'Right: the pull at the top spins the disk faster than rolling needs, so friction pushes forward to hold the bottom still.' : 'Friction points forward only when the push alone would spin the disk too fast, as a pull at the top does.')],
        ['against', 'against the motion', ($) => ($.kind === 'downhill' || $.kind === 'centre' ? 'Right: the force acts through the centre and cannot spin the disk. Friction at the bottom does, and it points back.' : 'Not here. Work out what spin the force alone would give, and what rolling needs.')],
        ['none', 'there is no friction', ($) => ($.kind === 'coast' ? 'Right: nothing changes, so no friction is needed. a = 0 and α = 0.' : 'Something speeds the disk up, and rolling needs α to keep pace with a. Friction supplies the difference.')],
      ], ($) => frictionWay($.kind)),
    ],
    level: 2,
    hints: ['Rolling ties a to α: a = αR. Ask what α the applied forces alone would give, against what rolling needs.',
      'A force through the centre gives no moment about G: only friction can spin the disk up. A force at the top spins it twice as hard as its own a needs.',
    ],
    steps: ($) => {
      const f = rollingFriction({ ...FRICTION[$.kind], k: 0.5 });
      return [
        'With k = I/(mR²) = 1/2, ma = P + W + f and Iα = Ph − fR, with a = αR.',
        `Solving, f = (Ph − kR(P + W))/(R(1 + k)) = ${f.toFixed(3)} per unit push. ${f > 1e-12 ? 'Positive: friction points with the motion.' : f < -1e-12 ? 'Negative: friction points against the motion.' : 'Zero: no friction.'}`,
      ];
    },
    // Second: the acceleration of the bottom point with no friction. Friction opposes its slide.
    second: ($) => {
      const { P, h, W } = FRICTION[$.kind];
      const a = P + W;
      const alphaR = (P * h) / 0.5;
      const slip = a - alphaR;
      return { f: Math.abs(slip) < 1e-12 ? 'none' : slip < 0 ? 'with' : 'against' };
    },
    cases: [kase('Hibbeler §17.5', { kind: 'top' }, { f: 'with' })],
  }),

  problem({
    id: 'u6.17.spin-time',
    title: 'Spin-up time when the rotor changes',
    exam: 'u6',
    ch: '17',
    kind: 'conceptual',
    lab: 'spinup',
    src: 'Hibbeler §17.4',
    topics: ['pin'],
    vars: {
      change: choice(
        ['radius', 'doubles the impeller radius and keeps its mass'],
        ['mass', 'doubles the impeller mass and keeps its radius'],
        ['ring', 'swaps the solid disk for a thin ring of the same mass and radius'],
        ['torque', 'doubles the net torque and keeps the impeller'],
      ),
    },
    text: (T) => `A rotor is a solid disk on a light shaft. A steady net torque spins it up from rest to a set speed. A redesign ${T.change}. The time to reach the same speed is now:`,
    parts: [
      pick('t', 'the new time is', [
        ['4', '4 times as long', ($) => ($.change === 'radius' ? 'Right: I = ½mR², so doubling R makes I four times larger, and t = Iω/M.' : 'Four times needs I four times larger, which takes a doubled radius.')],
        ['2', 'twice as long', ($) => ($.change === 'mass' || $.change === 'ring' ? 'Right: I doubles (½mR² → mR² for the ring, or twice the mass), and t = Iω/M doubles.' : 'Twice as long needs I to double at the same torque.')],
        ['1', 'the same', 'Every change here alters I or M, so t = Iω/M changes.'],
        ['half', 'half as long', ($) => ($.change === 'torque' ? 'Right: α = M/I doubles, so the same speed comes in half the time.' : 'Only more torque, or less inertia, shortens it.')],
      ], ($) => factorOf($.change)),
    ],
    level: 1,
    hints: ['At constant α, ω = αt, so t = ω/α = Iω/M.',
      'A disk is ½mR²; a ring is mR². Find the factor on I, and on M.',
    ],
    steps: ($) => [
      `t = Iω/M. The change multiplies I by ${CHANGE[$.change].I} and M by ${CHANGE[$.change].M}.`,
      `So t is multiplied by ${CHANGE[$.change].I / CHANGE[$.change].M}.`,
    ],
    // Second: the mass moments by integration, then the ratio of times.
    second: ($) => {
      const base = diskInertiaIntegral(1, 1);
      const I = { radius: diskInertiaIntegral(1, 2), mass: diskInertiaIntegral(2, 1), ring: 1, torque: base }[$.change];
      const M = $.change === 'torque' ? 2 : 1;
      const r = I / base / M;
      const near = (x) => Math.abs(r - x) < 1e-3;
      return { t: near(4) ? '4' : near(2) ? '2' : near(1) ? '1' : near(0.5) ? 'half' : String(r) };
    },
    cases: [kase('Hibbeler §17.4', { change: 'radius' }, { t: '4' })],
  }),

  problem({
    id: 'u6.17.spinup',
    title: 'Application: turbopump spin-up',
    exam: 'u6',
    ch: '17',
    lab: 'spinup',
    src: 'Hibbeler §17.4',
    topics: ['pin'],
    // Structure: the load is bearing friction alone (constant α), or friction plus a pump load
    // that grows as ω² (separate the variables).
    vars: {
      md: range(0.1, 0.5, 0.05, 'kg'),
      R: range(20, 50, 5, 'mm', 1e-3),
      M: range(0.3, 0.8, 0.05, 'N·m'),
      Mr: range(0.1, 0.25, 0.05, 'N·m'),
      rpm: range(20000, 40000, 5000, 'rpm'),
      load: choice(['bearing', 'only a steady bearing friction'], ['pump', 'a steady bearing friction and a pump load that grows as ω²']),
    },
    text: (T, $) => String.raw`A turbopump rotor is an impeller disk of mass ${T.md} kg and radius ${T.R} mm on a shaft of mass 0.08 kg and radius 5 mm; treat both as solid cylinders. From rest, a starter turbine gives a steady torque of ${T.M} N·m. The rotor feels ${T.load}: the bearings take 0.02 N·m${$.load === 'pump' ? `, and the pump takes ${T.Mr} N·m at the rated speed` : ''}. Find the mass moment, the angular acceleration at the start, and the time to reach the rated ${T.rpm} rpm.`,
    parts: [
      num('I', ($) => rotor($).I, 'kg·m²', { label: 'mass moment I', abs: 1e-10 }),
      num('alpha0', ($) => rotor($).alpha0, 'rad/s²', { label: 'angular acceleration at the start' }),
      num('t', ($) => rotor($).tRated, 's', { label: 'time to rated speed' }),
    ],
    level: 3,
    hints: ['I is the sum of ½mr² for the disk and for the shaft. At the start ω = 0, so the pump takes no torque yet.',
      String.raw`Write $I\,d\omega/dt = M - M_f - k\omega^2$, with $k = M_r/\omega_r^2$. With no pump load, α is constant.`,
      String.raw`With the pump, separate: $\int_0^{\omega_r} d\omega/(A - k\omega^2) = t/I$, with $A = M - M_f$. The integral is an inverse hyperbolic tangent.`,
    ],
    steps: ($, sig) => {
      const r = rotor($);
      const out = [
        String.raw`$I = \tfrac12(${sig($.md)})(${sig($.R)})^2 + \tfrac12(0.08)(0.005)^2 = ${sig(r.I)}\ \mathrm{kg\cdot m^2}$.`,
        String.raw`$\alpha_0 = (M - M_f)/I = ${sig(r.A)}/${sig(r.I)} = ${sig(r.alpha0)}\ \mathrm{rad/s^2}$.`,
        String.raw`Rated speed: $\omega_r = ${sig($.rpm)}\times 2\pi/60 = ${sig(r.wr)}\ \mathrm{rad/s}$.`,
      ];
      if ($.load === 'bearing') out.push(String.raw`α stays constant, so $t = \omega_r/\alpha_0 = ${sig(r.tRated)}\ \mathrm{s}$.`);
      else {
        out.push(String.raw`$k = M_r/\omega_r^2 = ${sig(r.k)}$, $\omega_\infty = \sqrt{A/k} = ${sig(r.wInf)}\ \mathrm{rad/s}$, $\tau = I/\sqrt{Ak} = ${sig(r.tau)}\ \mathrm{s}$.`);
        out.push(String.raw`$t = \tau\,\tanh^{-1}(\omega_r/\omega_\infty) = ${sig(r.tRated)}\ \mathrm{s}$.`);
      }
      return out;
    },
    // Second: I by integration over the disk and shaft; α₀ and t from the RK4 spin-up.
    second: ($) => {
      const I = diskInertiaIntegral($.md, $.R) + diskInertiaIntegral(SHAFT.ms, SHAFT.rs);
      const args = { I, M: $.M, Mf: SHAFT.Mf, Mr: $.load === 'pump' ? $.Mr : 0, rpm: $.rpm };
      return { I, alpha0: ($.M - SHAFT.Mf) / I, t: spinupByStepping(args) };
    },
    sim: {
      scenario: 'pump',
      setup(s, $) {
        Object.assign(s, { md: $.md, R: $.R, M: $.M, Mr: $.load === 'pump' ? $.Mr : 0, rpm: $.rpm, ...SHAFT });
      },
      read: (c) => ({ I: c.I, alpha0: c.alpha0, t: c.tRated }),
    },
    cases: [
      kase('Hibbeler §17.4', { md: 0.2, R: 30, M: 0.5, Mr: 0.25, rpm: 40000, load: 'bearing' }, { I: 9.1e-5, alpha0: 5274.725274725275, t: 0.7941248096574198 }),
      kase('Hibbeler §17.4', { md: 0.2, R: 30, M: 0.5, Mr: 0.25, rpm: 40000, load: 'pump' }, { I: 9.1e-5, alpha0: 5274.725274725275, t: 1.0026129577141054 }),
    ],
  }),
];

export default more;
