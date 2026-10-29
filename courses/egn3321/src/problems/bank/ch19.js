/**
 * Unit 8, Chapter 19: impulse and momentum of a rigid body (D36). Angular momentum of a rolling
 * body, angular impulse on a flywheel, conservation of angular momentum, eccentric impact, the centre
 * of percussion, and the application, a baseball bat. Second methods integrate forces in time or solve
 * the impulse equations as a linear system with every reaction an unknown.
 */
import { batHit, solveLinear, spinChange, spinChangeByForces, strikeBar, strikeBarByImpulses } from '@flux/subjects/mechanics/rigid-momentum.js';
import { G, choice, kase, num, problem, range } from '../kit.js';

const DEG = Math.PI / 180;
const MPH = 0.44704;

/** A choice part whose options each carry a `why`. */
const pick = (id, label, options, correct) => ({ id, kind: 'choice', label, options: options.map(([value, text, why]) => ({ value, label: text, why })), correct, multi: false });

const K = { hoop: 1, disk: 0.5, sphere: 0.4 };

/** H about the centre and about the contact point of a body rolling without slip. */
function rollingH($) {
  const IG = K[$.shape] * $.m * $.R * $.R;
  const w = $.v / $.R;
  return { IG, w, HG: IG * w, HP: IG * w + $.m * $.v * $.R };
}

/** A flywheel under a motor torque and a bearing friction torque. */
function flywheel($) {
  const I = 0.5 * $.m * $.R * $.R;
  const net = $.M - $.Mf;
  return { I, net, w2: $.w1 + (net * $.t) / I, tTo: (I * ($.wTarget - $.w1)) / net };
}

/** Spin conservation, by radius or by target rate. */
function spinUp($) {
  if ($.find === 'r2') {
    // Solve (I0 + 2 m r1²) ω1 = (I0 + 2 m r2²) ω2 for r2.
    const H = ($.I0 + 2 * $.m * $.r1 * $.r1) * $.w1;
    const r2 = Math.sqrt((H / $.w2 - $.I0) / (2 * $.m));
    return { ...spinChange({ I0: $.I0, m: $.m, r1: $.r1, r2, w1: $.w1 }), r2 };
  }
  return { ...spinChange({ I0: $.I0, m: $.m, r1: $.r1, r2: $.r2, w1: $.w1 }), r2: $.r2 };
}

/** A bullet that embeds in a hanging bar, then the swing it starts. */
function ballistic($) {
  const IO = ($.M * $.L * $.L) / 3;
  const d = $.dFrac * $.L;
  const Itot = IO + $.mb * d * d;
  const w = ($.mb * $.u * d) / Itot;
  // Energy after: ½ I ω² lifts the bar's centre (L/2) and the bullet (d) by (1 − cos θ).
  const lift = $.M * G * ($.L / 2) + $.mb * G * d;
  const c = 1 - (0.5 * Itot * w * w) / lift;
  return { IO, d, Itot, w, theta: Math.acos(Math.max(-1, c)) / DEG, lift };
}

/** Where to strike a hanging body so the pin feels nothing: d = I_O / (M r̄). */
function percussion($) {
  if ($.body === 'bob') {
    const IO = ($.M * $.L * $.L) / 3 + $.mb * $.L * $.L;
    const Mt = $.M + $.mb;
    const rbar = ($.M * ($.L / 2) + $.mb * $.L) / Mt;
    return { IO, Mt, rbar, d: IO / (Mt * rbar) };
  }
  if ($.body === 'plate') {
    // A plate b wide and h tall, pinned at the middle of its top edge, swinging in its own plane.
    const IO = ($.M * ($.b * $.b + $.L * $.L)) / 12 + $.M * ($.L / 2) ** 2;
    return { IO, Mt: $.M, rbar: $.L / 2, d: IO / ($.M * ($.L / 2)) };
  }
  const IO = ($.M * $.L * $.L) / 3;
  return { IO, Mt: $.M, rbar: $.L / 2, d: IO / ($.M * ($.L / 2)) };
}

/** The same point found another way: the pin impulse of the impulse equations, set to zero by bisection. */
function percussionByImpulses($) {
  const p = percussion($);
  const pin = (d) => {
    // Unknowns [ω, P, J]: bar linear Mt r̄ ω = P + J; bar about the pin IO ω = P d; with P = 1 as the blow's size.
    const [w, , J] = solveLinear(
      [
        [p.Mt * p.rbar, -1, -1],
        [p.IO, -d, 0],
        [0, 1, 0],
      ],
      [0, 0, 1],
    );
    void w;
    return J;
  };
  let lo = 1e-6;
  let hi = 3 * $.L;
  for (let i = 0; i < 80; i++) {
    const mid = 0.5 * (lo + hi);
    if (Math.sign(pin(mid)) === Math.sign(pin(lo))) lo = mid;
    else hi = mid;
  }
  return 0.5 * (lo + hi);
}

const strikeSpec = ($) => ({ M: $.M, L: $.L, m: $.m, u: $.u, d: $.dFrac * $.L, e: $.e, pinned: true });

const freeSpec = ($) => ({ M: $.M, L: $.L, m: $.m, u: $.u, d: $.L / 2 + $.arm, e: $.e, pinned: false });

const batSpec = ($) => {
  const I = ($.M * $.L * $.L) / 3;
  return { I, M: $.M, xbar: $.L / 2, m: 0.145, u: $.u * MPH, w0: $.w0, e: 0.5, d: $.dFrac * $.L };
};

/** The kept quantities when a skater moves their arms, in words. */
function skaterChange(way, forces = false) {
  const spec = { I0: 2, m: 2, r1: way === 'in' ? 0.8 : 0.3, r2: way === 'in' ? 0.3 : 0.8, w1: 3 };
  const c = spinChange(spec);
  const w2 = forces ? spinChangeByForces(spec).w2 : c.w2;
  const T2 = 0.5 * c.I2 * w2 * w2;
  return `${w2 > spec.w1 ? 'w-up' : 'w-down'}|${T2 > c.T1 ? 'T-up' : 'T-down'}`;
}

/** Where a ball leaves a uniform bat fastest, relative to its centre of percussion. */
function bestContact(pitch) {
  const spec = (f) => ({ I: (0.88 * 0.84 * 0.84) / 3, M: 0.88, xbar: 0.42, m: 0.145, u: pitch * MPH, w0: 55, e: 0.5, d: f * 0.84 });
  let best = 0.3;
  let bv = -Infinity;
  for (let f = 0.3; f <= 1.0000001; f += 0.005) {
    const v = batHit(spec(f)).v;
    if (v > bv) {
      bv = v;
      best = f;
    }
  }
  const cp = 2 / 3;
  if (best > 0.995) return 'end';
  if (Math.abs(best - cp) < 0.01) return 'cp';
  return best > cp ? 'beyond' : 'inside';
}

const ch19 = [
  problem({
    id: 'u8.19.momentum',
    title: 'Angular momentum of a rolling body',
    exam: 'u8',
    ch: '19',
    lab: null,
    src: 'Hibbeler §19.1',
    topics: ['rigid-momentum'],
    // Structure: a hoop, a disk or a sphere; the point changes what H is.
    vars: {
      shape: choice(['hoop', 'thin hoop'], ['disk', 'solid disk'], ['sphere', 'solid sphere']),
      m: range(1, 10, 1, 'kg'),
      R: range(0.1, 0.5, 0.05, 'm'),
      v: range(1, 6, 0.5, 'm/s'),
    },
    text: (T) => String.raw`A ${T.m} kg ${T.shape} of radius ${T.R} m rolls without slipping, its centre moving at ${T.v} m/s. Find its angular momentum about its centre, and about the point touching the ground.`,
    parts: [
      num('HG', ($) => rollingH($).HG, 'kg·m²/s', { label: 'H about the centre G' }),
      num('HP', ($) => rollingH($).HP, 'kg·m²/s', { label: 'H about the contact point' }),
    ],
    level: 1,
    hints: [
      'About the mass centre, H_G = I_G ω. Rolling without slip gives ω = v/R.',
      'About another point P, add the moment of the linear momentum: H_P = r_G/P × m v_G + I_G ω.',
    ],
    steps: ($, sig) => {
      const r = rollingH($);
      return [
        String.raw`$I_G = ${K[$.shape] === 1 ? '' : K[$.shape] === 0.5 ? '\\tfrac12' : '\\tfrac25'}mR^2 = ${sig(r.IG)}$ kg·m² and $\omega = v/R = ${sig(r.w)}$ rad/s, so $H_G = ${sig(r.HG)}$ kg·m²/s.`,
        String.raw`The contact point is $R$ below $G$, square to $v_G$: $H_P = mvR + I_G\omega = ${sig($.m * $.v * $.R)} + ${sig(r.HG)} = ${sig(r.HP)}$ kg·m²/s.`,
      ];
    },
    second: ($) => {
      // r × m v about P, from vectors, plus every particle's spin about G summed over a ring of particles.
      const r = rollingH($);
      const n = 720;
      let spin = 0;
      for (let i = 0; i < n; i++) {
        // Spread the inertia as particles on a ring of radius k = √(I_G/m).
        const k = Math.sqrt(r.IG / $.m);
        const a = (2 * Math.PI * i) / n;
        const px = k * Math.cos(a);
        const py = k * Math.sin(a);
        // Each particle moves at ω × ρ about G (clockwise ω for rolling to +x).
        const vx = r.w * py;
        const vy = -r.w * px;
        spin += ($.m / n) * (px * vy - py * vx);
      }
      const HG = Math.abs(spin);
      return { HG, HP: HG + $.m * $.v * $.R };
    },
    cases: [kase('Hibbeler §19.1', { shape: 'disk', m: 4, R: 0.25, v: 2 }, { HG: 1, HP: 3 })],
  }),

  problem({
    id: 'u8.19.angular-impulse',
    title: 'A flywheel under a motor and a brake',
    exam: 'u8',
    ch: '19',
    lab: null,
    src: 'Hibbeler §19.2',
    topics: ['rigid-momentum'],
    // Structure: find the speed after a time, or the time to reach a speed.
    vars: {
      find: choice(['w2', 'speed'], ['t', 'time']),
      m: range(10, 60, 5, 'kg'),
      R: range(0.2, 0.5, 0.05, 'm'),
      M: range(10, 40, 5, 'N·m'),
      Mf: range(1, 6, 1, 'N·m'),
      w1: range(0, 20, 5, 'rad/s'),
      t: range(2, 10, 1, 's'),
      wTarget: range(40, 100, 10, 'rad/s'),
    },
    valid: ($) => $.M > $.Mf && ($.find === 'w2' || $.wTarget > $.w1 + 5),
    text: (T, $) => ($.find === 'w2'
      ? String.raw`A ${T.m} kg solid-disk flywheel of radius ${T.R} m turns at ${T.w1} rad/s. A motor applies ${T.M} N·m while its bearings resist with a steady ${T.Mf} N·m. Find its speed ${T.t} s later.`
      : String.raw`A ${T.m} kg solid-disk flywheel of radius ${T.R} m turns at ${T.w1} rad/s. A motor applies ${T.M} N·m while its bearings resist with a steady ${T.Mf} N·m. How long until it turns at ${T.wTarget} rad/s?`),
    parts: [
      num('q', ($) => ($.find === 'w2' ? flywheel($).w2 : flywheel($).tTo), ($) => ($.find === 'w2' ? 'rad/s' : 's'), { label: (T, $) => ($.find === 'w2' ? 'speed' : 'time') }),
    ],
    level: 2,
    hints: [
      'The angular impulse of the moments about the axle changes the angular momentum: I ω₁ + Σ∫M dt = I ω₂.',
      'Both torques are steady, so their impulse is (M − M_f) t. A solid disk has I = ½ m R².',
    ],
    steps: ($, sig) => {
      const f = flywheel($);
      return [
        String.raw`$I = \tfrac12 mR^2 = ${sig(f.I)}$ kg·m². The net moment is $${sig(f.net)}$ N·m.`,
        $.find === 'w2'
          ? String.raw`$I\omega_1 + (M - M_f)t = I\omega_2$, so $\omega_2 = ${sig($.w1)} + ${sig(f.net)}(${sig($.t)})/${sig(f.I)} = ${sig(f.w2)}$ rad/s.`
          : String.raw`$t = I(\omega_2 - \omega_1)/(M - M_f) = ${sig(f.I)}(${sig($.wTarget - $.w1)})/${sig(f.net)} = ${sig(f.tTo)}$ s.`,
      ];
    },
    second: ($) => {
      // Step the angular velocity forward in time under the two torques.
      const f = flywheel($);
      const h = 1e-3;
      if ($.find === 'w2') {
        let w = $.w1;
        for (let i = 0; i < Math.round($.t / h); i++) w += (h * ($.M - $.Mf)) / f.I;
        return { q: w };
      }
      let w = $.w1;
      let t = 0;
      while (w < $.wTarget) {
        w += (h * ($.M - $.Mf)) / f.I;
        t += h;
      }
      return { q: t - (w - $.wTarget) / (($.M - $.Mf) / f.I) };
    },
    cases: [kase('Hibbeler §19.2', { find: 'w2', m: 40, R: 0.5, M: 30, Mf: 5, w1: 10, t: 4, wTarget: 50 }, { q: 30 })],
  }),

  problem({
    id: 'u8.19.spin',
    title: 'Pulling in the weights',
    exam: 'u8',
    ch: '19',
    lab: 'spin',
    src: 'Hibbeler §19.3',
    topics: ['spin'],
    // Structure: from the new radius find the rate, or from a target rate find the radius.
    vars: {
      find: choice(['w2', 'rate'], ['r2', 'radius']),
      I0: range(1, 4, 0.5, 'kg·m²'),
      m: range(1, 4, 0.5, 'kg'),
      r1: range(0.6, 0.9, 0.1, 'm'),
      r2: range(0.15, 0.4, 0.05, 'm'),
      w1: range(1, 4, 0.5, 'rad/s'),
      w2: range(2, 8, 0.5, 'rad/s'),
    },
    valid: ($) => {
      if ($.find === 'w2') return true;
      const s = spinUp($);
      return Number.isFinite(s.r2) && s.r2 > 0.08 && s.r2 < $.r1 - 0.1;
    },
    text: (T, $) => ($.find === 'w2'
      ? String.raw`A person on a frictionless turntable, ${T.I0} kg·m² without the weights, holds two ${T.m} kg weights at ${T.r1} m from the axis and turns at ${T.w1} rad/s. They pull the weights in to ${T.r2} m. Find the new rate, and the work their arms do.`
      : String.raw`A person on a frictionless turntable, ${T.I0} kg·m² without the weights, holds two ${T.m} kg weights at ${T.r1} m from the axis and turns at ${T.w1} rad/s. To what radius must they pull the weights to turn at ${T.w2} rad/s, and how much work do their arms do?`),
    parts: [
      num('q', ($) => ($.find === 'w2' ? spinUp($).w2 : spinUp($).r2), ($) => ($.find === 'w2' ? 'rad/s' : 'm'), { label: (T, $) => ($.find === 'w2' ? 'new rate' : 'radius') }),
      num('work', ($) => spinUp($).work, 'J', { label: 'work done by the arms' }),
    ],
    level: 2,
    hints: [
      'Nothing torques the system about the axis, so its angular momentum is the same before and after.',
      'I = I₀ + 2 m r². Set I₁ω₁ = I₂ω₂. The kinetic energy is not kept: compare ½Iω² before and after.',
    ],
    steps: ($, sig) => {
      const s = spinUp($);
      return [
        String.raw`$I_1 = I_0 + 2mr_1^2 = ${sig(s.I1)}$ kg·m², so $H = I_1\omega_1 = ${sig(s.H)}$ kg·m²/s.`,
        $.find === 'w2'
          ? String.raw`$I_2 = I_0 + 2mr_2^2 = ${sig(s.I2)}$ kg·m², so $\omega_2 = H/I_2 = ${sig(s.w2)}$ rad/s.`
          : String.raw`$I_2 = H/\omega_2 = ${sig(s.I2)}$ kg·m², so $r_2 = \sqrt{(I_2 - I_0)/2m} = ${sig(s.r2)}$ m.`,
        String.raw`$T_2 - T_1 = ${sig(s.T2)} - ${sig(s.T1)} = ${sig(s.work)}$ J, done by the arms.`,
      ];
    },
    second: ($) => {
      const s = spinUp($);
      const f = spinChangeByForces({ I0: $.I0, m: $.m, r1: $.r1, r2: s.r2, w1: $.w1, steps: 2000 });
      const I2 = $.I0 + 2 * $.m * s.r2 * s.r2;
      return { q: $.find === 'w2' ? f.w2 : s.r2, work: 0.5 * I2 * f.w2 * f.w2 - s.T1 };
    },
    sim: {
      scenario: 'skater',
      setup(s, $) {
        Object.assign(s, { I0: $.I0, m: $.m, r1: $.r1, r: spinUp($).r2, w1: $.w1 });
      },
      read: (c, s, $) => ({ q: $.find === 'w2' ? c.w2 : s.r, work: c.work }),
    },
    cases: [kase('Hibbeler §19.3', { find: 'w2', I0: 2, m: 2, r1: 0.8, r2: 0.4, w1: 3, w2: 5 }, { q: 4.56 * 3 / 2.64, work: 0.5 * 2.64 * (4.56 * 3 / 2.64) ** 2 - 0.5 * 4.56 * 9 })],
  }),

  problem({
    id: 'u8.19.ballistic-bar',
    title: 'A bullet into a hanging bar',
    exam: 'u8',
    ch: '19',
    lab: 'strike',
    src: 'Hibbeler §19.3',
    topics: ['impact'],
    vars: {
      M: range(2, 8, 1, 'kg'),
      L: range(0.8, 1.6, 0.2, 'm'),
      mb: range(0.02, 0.06, 0.01, 'kg'),
      u: range(200, 500, 50, 'm/s'),
      dFrac: range(0.5, 1, 0.1, ''),
    },
    valid: ($) => ballistic($).theta > 5 && ballistic($).theta < 175,
    text: (T, $) => String.raw`A ${T.mb} kg bullet moving horizontally at ${T.u} m/s embeds itself in a ${T.M} kg uniform bar ${T.L} m long, which hangs at rest from a pin at its top. It strikes ${(($.dFrac * $.L)).toFixed(2)} m below the pin. Find the bar's angular velocity just after, and how far it swings.`,
    parts: [
      num('w', ($) => ballistic($).w, 'rad/s', { label: 'angular velocity just after' }),
      num('theta', ($) => ballistic($).theta, '°', { label: 'largest swing angle from the vertical' }),
    ],
    level: 2,
    hints: [
      'During the blow the pin pushes on the bar, so linear momentum is not kept. The pin has no moment about itself.',
      'Keep the angular momentum about the pin: m u d = (I_O + m d²) ω. Then the swing is energy: ½ I ω² = (M g L/2 + m g d)(1 − cos θ).',
    ],
    steps: ($, sig) => {
      const b = ballistic($);
      return [
        String.raw`About the pin: $m u d = (I_O + m d^2)\omega$ with $I_O = ML^2/3 = ${sig(b.IO)}$ kg·m², so $\omega = ${sig(b.w)}$ rad/s.`,
        String.raw`Then $\tfrac12(${sig(b.Itot)})\omega^2 = (${sig(b.lift)})(1 - \cos\theta)$, so $\theta = ${sig(b.theta)}^\circ$.`,
      ];
    },
    second: ($) => {
      // The impulse equations with the pin's impulse unknown (e = 0), then the swing stepped through in time.
      const k = strikeBarByImpulses({ M: $.M, L: $.L, m: $.mb, u: $.u, d: $.dFrac * $.L, e: 0 });
      const b = ballistic($);
      // RK4 on θ̈ = −(lift/I) sin θ until ω changes sign; the turning point is interpolated.
      const f = (q) => (-b.lift * Math.sin(q)) / b.Itot;
      let th = 0;
      let w = k.w;
      const h = 1e-3;
      let maxTh = 0;
      for (let i = 0; i < 100000; i++) {
        const k1t = w;
        const k1w = f(th);
        const k2t = w + 0.5 * h * k1w;
        const k2w = f(th + 0.5 * h * k1t);
        const k3t = w + 0.5 * h * k2w;
        const k3w = f(th + 0.5 * h * k2t);
        const k4t = w + h * k3w;
        const k4w = f(th + h * k3t);
        const th2 = th + (h / 6) * (k1t + 2 * k2t + 2 * k3t + k4t);
        const w2 = w + (h / 6) * (k1w + 2 * k2w + 2 * k3w + k4w);
        if (w2 <= 0) {
          // Near the top θ is quadratic in time: its peak follows from the last two rates.
          // Over the last part-step the swing slows at about f(θ): it rises w²/2|f| more.
          maxTh = th + (w * w) / (2 * Math.abs(f(th)));
          break;
        }
        th = th2;
        w = w2;
      }
      return { w: k.w, theta: maxTh / DEG };
    },
    sim: {
      scenario: 'pinned',
      setup(s, $) {
        Object.assign(s, { M: $.M, L: $.L, m: $.mb, u: $.u, dFrac: $.dFrac, e: 0 });
      },
      read: (c) => ({ w: c.w }),
    },
    cases: [kase('Hibbeler §19.3', { M: 5, L: 1.2, mb: 0.03, u: 200, dFrac: 1 }, { w: (0.03 * 200 * 1.2) / (5 * 1.44 / 3 + 0.03 * 1.44), theta: ballistic({ M: 5, L: 1.2, mb: 0.03, u: 200, dFrac: 1 }).theta })],
  }),

  problem({
    id: 'u8.19.strike',
    title: 'A ball strikes a hanging bar',
    exam: 'u8',
    ch: '19',
    lab: 'strike',
    src: 'Hibbeler §19.4',
    topics: ['impact'],
    vars: {
      M: range(2, 6, 1, 'kg'),
      L: range(0.8, 1.6, 0.2, 'm'),
      m: range(0.2, 1, 0.1, 'kg'),
      u: range(3, 10, 1, 'm/s'),
      dFrac: range(0.4, 1, 0.1, ''),
      e: range(0.2, 0.8, 0.1, ''),
    },
    valid: ($) => Math.abs(strikeBar(strikeSpec($)).J) > 0.05,
    text: (T, $) => String.raw`A ${T.m} kg ball moving horizontally at ${T.u} m/s strikes a ${T.M} kg uniform bar ${T.L} m long, hanging at rest from a pin at its top, ${(($.dFrac * $.L)).toFixed(2)} m below the pin. The coefficient of restitution is ${T.e}. Find the bar's angular velocity, the ball's velocity after the blow (positive in its original direction), and the horizontal impulse of the pin on the bar.`,
    parts: [
      num('w', ($) => strikeBar(strikeSpec($)).w, 'rad/s', { label: 'bar ω after' }),
      num('v', ($) => strikeBar(strikeSpec($)).v, 'm/s', { label: 'ball’s velocity after' }),
      num('J', ($) => strikeBar(strikeSpec($)).J, 'N·s', { label: 'pin’s impulse on the bar (positive along the ball’s path)' }),
    ],
    level: 3,
    hints: [
      'Through the blow, keep angular momentum about the pin, where the unknown reaction acts. Restitution relates the separation speed to the closing speed.',
      'About the pin: m u d = m v d + I_O ω. Restitution at the contact: ω d − v = e u.',
      'The pin’s impulse is what the linear momentum of ball and bar did not keep: J = M ω L/2 + m v − m u.',
    ],
    steps: ($, sig) => {
      const c = strikeBar(strikeSpec($));
      const d = $.dFrac * $.L;
      return [
        String.raw`$I_O = ML^2/3 = ${sig(c.IO)}$ kg·m². Solve $m u d = m v d + I_O\omega$ and $\omega d - v = e u$ together: $\omega = \dfrac{mud(1+e)}{I_O + md^2} = ${sig(c.w)}$ rad/s.`,
        String.raw`$v = \omega d - e u = ${sig(c.w * d)} - ${sig($.e * $.u)} = ${sig(c.v)}$ m/s.`,
        String.raw`$J = M\omega L/2 + mv - mu = ${sig(c.J)}$ N·s.`,
      ];
    },
    second: ($) => {
      const k = strikeBarByImpulses(strikeSpec($));
      return { w: k.w, v: k.v, J: k.J };
    },
    sim: {
      scenario: 'pinned',
      setup(s, $) {
        Object.assign(s, { M: $.M, L: $.L, m: $.m, u: $.u, dFrac: $.dFrac, e: $.e });
      },
      read: (c) => ({ w: c.w, v: c.v, J: c.J }),
    },
    cases: [kase('Hibbeler §19.4', { M: 3, L: 1.2, m: 0.5, u: 6, dFrac: 1, e: 0.4 }, { w: 7 / 3, v: 0.4, J: 1.4 })],
  }),

  problem({
    id: 'u8.19.percussion',
    title: 'Where the pin feels nothing',
    exam: 'u8',
    ch: '19',
    lab: 'strike',
    src: 'Hibbeler §19.4',
    topics: ['impact'],
    // Structure: a bare rod, a rod with a bob at its end, or a plate.
    vars: {
      body: choice(['rod', 'uniform slender rod'], ['bob', 'uniform rod with a small heavy bob fixed at its lower end'], ['plate', 'uniform rectangular plate, pinned at the middle of its top edge and swinging in its own plane']),
      M: range(1, 6, 1, 'kg'),
      L: range(0.6, 1.5, 0.1, 'm'),
      mb: range(0.5, 3, 0.5, 'kg'),
      b: range(0.4, 1.2, 0.1, 'm'),
    },
    valid: ($) => $.body === 'rod' || Math.abs(percussion($).d - (2 * $.L) / 3) > 0.06 * percussion($).d,
    text: (T, $) => {
      if ($.body === 'bob') return String.raw`A ${T.M} kg uniform rod ${T.L} m long hangs from a pin at its top, with a ${T.mb} kg bob fixed at its lower end. How far below the pin should it be struck horizontally so the pin feels no blow?`;
      if ($.body === 'plate') return String.raw`A ${T.M} kg uniform plate ${T.b} m wide and ${T.L} m tall hangs from a pin at the middle of its top edge and can swing in its own plane. How far below the pin should it be struck horizontally, in that plane, so the pin feels no blow?`;
      return String.raw`A ${T.M} kg uniform rod ${T.L} m long hangs from a pin at its top. How far below the pin should it be struck horizontally so the pin feels no blow?`;
    },
    parts: [num('d', ($) => percussion($).d, 'm', { label: 'distance below the pin' })],
    level: 2,
    hints: [
      'With no pin impulse, the blow alone must give the mass centre its velocity and the body its spin.',
      'Linear: P = M r̄ ω. About the pin: P d = I_O ω. Divide: d = I_O/(M r̄).',
    ],
    steps: ($, sig) => {
      const p = percussion($);
      return [
        String.raw`$I_O = ${sig(p.IO)}$ kg·m², the total mass is ${sig(p.Mt)} kg and its centre is $\bar r = ${sig(p.rbar)}$ m below the pin.`,
        String.raw`$d = I_O/(M\bar r) = ${sig(p.d)}$ m.`,
      ];
    },
    second: ($) => ({ d: percussionByImpulses($) }),
    sim: {
      scenario: 'percussion',
      setup(s, $) {
        // The lab's bar is a bare uniform rod; for the other bodies it shows the rod's own 2L/3.
        Object.assign(s, { M: $.M, L: $.L, dFrac: $.body === 'rod' ? percussion($).d / $.L : 2 / 3 });
      },
    },
    cases: [kase('Hibbeler §19.4', { body: 'rod', M: 3, L: 1.2, mb: 1, b: 0.5 }, { d: 0.8 })],
  }),

  problem({
    id: 'u8.19.free-bar',
    title: 'A ball strikes a bar on ice',
    exam: 'u8',
    ch: '19',
    lab: 'strike',
    src: 'Hibbeler §19.4',
    topics: ['impact'],
    vars: {
      M: range(1, 5, 1, 'kg'),
      L: range(0.6, 1.4, 0.2, 'm'),
      m: range(0.1, 0.6, 0.1, 'kg'),
      u: range(2, 8, 1, 'm/s'),
      armFrac: range(0, 0.5, 0.1, ''),
      e: range(0, 1, 0.2, ''),
    },
    derive: ($) => ({ arm: $.armFrac * $.L }),
    valid: ($) => $.armFrac > 0,
    text: (T, $) => String.raw`A ${T.M} kg uniform bar ${T.L} m long lies at rest on smooth ice. A ${T.m} kg puck sliding at ${T.u} m/s, square to the bar, strikes it ${(($.armFrac * $.L)).toFixed(2)} m from its centre. The coefficient of restitution is ${T.e}. Find the speed of the bar's centre and its angular velocity just after.`,
    parts: [
      num('vG', ($) => strikeBar(freeSpec({ ...$, arm: $.armFrac * $.L })).vG, 'm/s', { label: 'speed of the bar’s centre' }),
      num('w', ($) => Math.abs(strikeBar(freeSpec({ ...$, arm: $.armFrac * $.L })).w), 'rad/s', { label: 'angular velocity' }),
    ],
    level: 3,
    hints: [
      'Nothing outside acts during the blow, so linear momentum and angular momentum about any fixed point are both kept.',
      'Let P be the contact impulse. Then m u − P = m v, P = M v_G, P a = I_G ω, and restitution: v_G + ω a − v = e u.',
      'Solve for P first: P = (1 + e) u / (1/m + 1/M + a²/I_G).',
    ],
    steps: ($, sig) => {
      const a = $.armFrac * $.L;
      const c = strikeBar(freeSpec({ ...$, arm: a }));
      const IG = ($.M * $.L * $.L) / 12;
      const P = $.M * c.vG;
      return [
        String.raw`$I_G = ML^2/12 = ${sig(IG)}$ kg·m², and the strike is $a = ${sig(a)}$ m from $G$.`,
        String.raw`$P = (1+e)u/(1/m + 1/M + a^2/I_G) = ${sig(P)}$ N·s.`,
        String.raw`$v_G = P/M = ${sig(c.vG)}$ m/s and $\omega = Pa/I_G = ${sig(Math.abs(c.w))}$ rad/s.`,
      ];
    },
    second: ($) => {
      const k = strikeBarByImpulses({ ...freeSpec({ ...$, arm: $.armFrac * $.L }), pinned: false });
      return { vG: k.vG, w: Math.abs(k.w) };
    },
    sim: {
      scenario: 'free',
      setup(s, $) {
        Object.assign(s, { M: $.M, L: $.L, m: $.m, u: $.u, e: $.e, dFrac: 0.5 + $.armFrac });
      },
      read: (c) => ({ vG: c.vG, w: Math.abs(c.w) }),
    },
    cases: [kase('Hibbeler §19.4', { M: 2, L: 1, m: 0.3, u: 5, armFrac: 0.5, e: 0.6 }, { vG: 0.75, w: 4.5 })],
  }),

  problem({
    id: 'u8.19.bat',
    title: 'Application: off the bat',
    exam: 'u8',
    ch: '19',
    lab: 'bat',
    src: 'Hibbeler §19.4',
    topics: ['impact', 'bat'],
    vars: {
      M: range(0.8, 1, 0.02, 'kg'),
      L: range(0.8, 0.88, 0.02, 'm'),
      u: range(80, 100, 2, 'mph'),
      w0: range(45, 65, 5, 'rad/s'),
      dFrac: range(0.5, 1, 0.05, ''),
    },
    text: (T, $) => String.raw`Model a ${T.M} kg bat ${T.L} m long as a uniform rod swung about the hands at its knob, turning at ${T.w0} rad/s toward a ${T.u} mph pitch. The 0.145 kg ball meets the bat ${(($.dFrac * $.L)).toFixed(2)} m from the hands. Take e = 0.50, the BBCOR limit. Find the ball's exit speed and the impulse the hands give the bat, positive toward the pitcher.`,
    parts: [
      num('v', ($) => batHit(batSpec($)).v, 'm/s', { label: 'exit speed' }),
      num('J', ($) => batHit(batSpec($)).J, 'N·s', { label: 'hands’ impulse on the bat' }),
    ],
    level: 2,
    hints: [
      'Over the millisecond of contact the hands act like a pin. Keep angular momentum about them.',
      'I ω₀ − m u d = I ω₁ + m v d, with I = M L²/3; and v − ω₁ d = e(ω₀ d + u).',
      'The hands’ impulse is the change in the system’s linear momentum: J = M (L/2)(ω₁ − ω₀) + m(v + u).',
    ],
    steps: ($, sig) => {
      const p = batSpec($);
      const c = batHit(p);
      return [
        String.raw`$I = ML^2/3 = ${sig(p.I)}$ kg·m², the pitch is $${sig(p.u)}$ m/s, and the bat meets it at $\omega_0 d = ${sig(p.w0 * p.d)}$ m/s.`,
        String.raw`Solve the two equations: $\omega_1 = ${sig(c.w1)}$ rad/s and $v = ${sig(c.v)}$ m/s, ${sig(c.v / MPH)} mph.`,
        String.raw`$J = M(L/2)(\omega_1 - \omega_0) + m(v + u) = ${sig(c.J)}$ N·s.`,
      ];
    },
    second: ($) => {
      const p = batSpec($);
      const [v, , , J] = solveLinear(
        [
          [p.m, 0, -1, 0],
          [0, p.M * p.xbar, 1, -1],
          [0, p.I, p.d, 0],
          [1, -p.d, 0, 0],
        ],
        [-p.m * p.u, p.M * p.xbar * p.w0, p.I * p.w0, p.e * (p.w0 * p.d + p.u)],
      );
      return { v, J };
    },
    sim: {
      scenario: 'wood',
      setup(s, $) {
        Object.assign(s, { M: $.M, L: $.L, u: $.u * MPH, w0: $.w0, e: 0.5, dFrac: $.dFrac });
      },
      read: (c) => ({ v: c.v, J: c.J }),
    },
    cases: [kase('Hibbeler §19.4', { M: 0.88, L: 0.84, u: 90, w0: 55, dFrac: 1 }, { v: batHit({ I: (0.88 * 0.84 * 0.84) / 3, M: 0.88, xbar: 0.42, m: 0.145, u: 90 * MPH, w0: 55, e: 0.5, d: 0.84 }).v, J: batHit({ I: (0.88 * 0.84 * 0.84) / 3, M: 0.88, xbar: 0.42, m: 0.145, u: 90 * MPH, w0: 55, e: 0.5, d: 0.84 }).J })],
  }),

  problem({
    id: 'u8.19.spin-ask',
    title: 'A skater moves their arms',
    exam: 'u8',
    ch: '19',
    kind: 'conceptual',
    lab: 'spin',
    src: 'Hibbeler §19.3',
    topics: ['spin'],
    vars: {
      way: choice(['in', 'pulls their arms in'], ['out', 'spreads their arms out']),
    },
    text: (T) => `A skater spinning on smooth ice ${T.way}. What happens to their spin rate and their kinetic energy?`,
    parts: [
      pick('what', 'spin rate and kinetic energy', [
        ['w-up|T-up', 'the spin rate rises, and so does the kinetic energy', 'With no torque about the axis, H = Iω is kept. Pulling in lowers I, so ω rises, and T = H²/2I rises too: the arms do work pulling inward against the masses’ tendency to fly out.'],
        ['w-up|T-down', 'the spin rate rises, but the kinetic energy falls', 'T = H²/2I. With H kept, a smaller I gives a larger T, not a smaller one.'],
        ['w-down|T-down', 'the spin rate falls, and so does the kinetic energy', 'Spreading the arms raises I, so with H kept, ω falls, and T = H²/2I falls with it. The arms are pushed out by the masses and absorb that energy.'],
        ['w-down|T-up', 'the spin rate falls, but the kinetic energy rises', 'With H kept and I larger, T = H²/2I is smaller. Nothing does positive work on a skater spreading their arms.'],
      ], ($) => skaterChange($.way)),
    ],
    level: 1,
    hints: [
      'What is kept when nothing applies a torque about the spin axis?',
      'Write T in terms of H: T = H²/(2I).',
    ],
    steps: ($) => [
      'The ice is smooth, so no torque acts about the vertical axis: H = Iω is kept.',
      $.way === 'in' ? 'Pulling in lowers I, so ω = H/I rises and T = H²/2I rises.' : 'Spreading out raises I, so ω = H/I falls and T = H²/2I falls.',
    ],
    second: ($) => ({ what: skaterChange($.way, true) }),
    sim: {
      scenario: 'skater',
      setup(s, $) {
        Object.assign(s, $.way === 'in' ? { r1: 0.8, r: 0.3 } : { r1: 0.3, r: 0.8 });
      },
    },
    cases: [kase('Hibbeler §19.3', { way: 'in' }, { what: 'w-up|T-up' })],
  }),

  problem({
    id: 'u8.19.impact-ask',
    title: 'What does the blow keep?',
    exam: 'u8',
    ch: '19',
    kind: 'conceptual',
    lab: 'strike',
    src: 'Hibbeler §19.3',
    topics: ['impact'],
    vars: {
      support: choice(['pin', 'hangs from a pin at its top'], ['free', 'lies free on smooth ice']),
    },
    text: (T) => `A uniform bar ${T.support}. A ball strikes it partway along, not quite elastically. Through the blow, which of these is kept for the ball and bar together?`,
    parts: [
      pick('kept', 'kept through the blow', [
        ['H-pin', 'only the angular momentum about the pin', 'The pin pushes on the bar during the blow, so linear momentum is not kept. That push acts at the pin, so it has no moment there: angular momentum about the pin is kept.'],
        ['p-and-H', 'the linear momentum, and the angular momentum about any fixed point', 'With nothing outside acting during the blow, both are kept. A pinned bar is different: the pin’s push changes the linear momentum.'],
        ['p', 'only the linear momentum', 'A pinned bar gets a push from its pin, so its linear momentum changes. A free bar keeps its linear momentum, and its angular momentum too.'],
        ['T', 'the kinetic energy', 'A blow that is not perfectly elastic, e < 1, always loses kinetic energy, whatever holds the bar.'],
      ], ($) => ($.support === 'pin' ? 'H-pin' : 'p-and-H')),
    ],
    level: 2,
    hints: [
      'Ask which outside forces act during the blow, and where.',
      'An impulse at a point has no moment about that point.',
    ],
    steps: ($) => [
      $.support === 'pin' ? 'The pin acts during the blow, so linear momentum changes. Its impulse passes through the pin, so the angular momentum about the pin is kept.' : 'Nothing outside acts during the blow, so the linear momentum and the angular momentum about any fixed point are kept.',
      'With e < 1, kinetic energy is lost.',
    ],
    second: ($) => {
      const spec = { M: 3, L: 1.2, m: 0.5, u: 6, d: 1, e: 0.4, pinned: $.support === 'pin' };
      const c = strikeBar(spec);
      const pKept = Math.abs(spec.m * c.v + spec.M * c.vG - spec.m * spec.u) < 1e-9;
      return { kept: pKept ? 'p-and-H' : 'H-pin' };
    },
    sim: {
      scenario: 'pinned',
      setup(s, $) {
        if ($.support === 'free') Object.assign(s, { pinned: false, dFrac: 0.83 });
      },
    },
    cases: [kase('Hibbeler §19.3', { support: 'pin' }, { kept: 'H-pin' })],
  }),

  problem({
    id: 'u8.19.sweet-ask',
    title: 'Where does the ball leave fastest?',
    exam: 'u8',
    ch: '19',
    kind: 'conceptual',
    lab: 'bat',
    src: 'Hibbeler §19.4',
    topics: ['bat'],
    vars: {
      pitch: choice([80, 'an 80 mph'], [95, 'a 95 mph']),
    },
    text: (T) => `A uniform bat swung about the hands meets ${T.pitch} pitch. Along the bat, where does the ball leave fastest?`,
    parts: [
      pick('where', 'the best contact point', [
        ['end', 'at the very end, which moves fastest', 'The end moves fastest, but little of the bat’s inertia backs it: struck there, the bat gives way and much of the swing goes into the bat’s recoil.'],
        ['cp', 'exactly at the centre of percussion, two-thirds out', 'At the centre of percussion the hands feel nothing. That is about comfort; the exit speed peaks a little farther out, where the bat moves faster.'],
        ['beyond', 'a little beyond the centre of percussion, toward the end', 'Moving out, the bat’s speed rises but its effective mass at the contact falls. The two balance a little past two-thirds: for a uniform bat, about 0.8 of its length.'],
        ['inside', 'between the hands and the centre of percussion', 'Close to the hands the bat moves slowly, so the ball leaves slowly: a jammed swing.'],
      ], ($) => bestContact($.pitch)),
    ],
    level: 2,
    hints: [
      'Two things change along the bat: how fast the contact point moves, and how much of the bat’s inertia stands behind it.',
      'Compare the exit speed at a few contact points with the bat equations, or move the contact point in the Bat lab.',
    ],
    steps: () => [
      'The bat’s speed at the contact grows as ω d, but its effective mass there, I/d², falls.',
      'The exit speed peaks where the two balance: past the centre of percussion, short of the end.',
    ],
    second: ($) => {
      // A finer scan by golden-section search instead of a grid.
      const f = (x) => batHit({ I: (0.88 * 0.84 * 0.84) / 3, M: 0.88, xbar: 0.42, m: 0.145, u: $.pitch * MPH, w0: 55, e: 0.5, d: x * 0.84 }).v;
      let a = 0.3;
      let b = 1;
      const g = (Math.sqrt(5) - 1) / 2;
      for (let i = 0; i < 80; i++) {
        const x1 = b - g * (b - a);
        const x2 = a + g * (b - a);
        if (f(x1) < f(x2)) a = x1;
        else b = x2;
      }
      const best = 0.5 * (a + b);
      if (best > 0.995) return { where: 'end' };
      if (Math.abs(best - 2 / 3) < 0.01) return { where: 'cp' };
      return { where: best > 2 / 3 ? 'beyond' : 'inside' };
    },
    sim: {
      scenario: 'wood',
      setup(s, $) {
        s.u = $.pitch * MPH;
      },
    },
    cases: [kase('Hibbeler §19.4', { pitch: 80 }, { where: 'beyond' })],
  }),
];

export default ch19;
