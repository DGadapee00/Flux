/**
 * Unit 4 coaching: for each template, the wrong value a named mistake gives (`traps`). The conceptual
 * templates carry a `why` on every option themselves. Folded into the bank by src/problems/index.js.
 * A trap is [($) => wrongValue, 'what went wrong'].
 */
import { G } from '@flux/subjects/mechanics/constants.js';
import { W_PER_HP } from '@flux/subjects/convert.js';

const DEG = Math.PI / 180;

export default {
  // ---------- Chapter 7 ----------
  'ch7.work': {
    traps: {
      W: [
        [($) => $.F * $.d, 'That counts the whole push. Only its part along the motion, F cos φ, does work.'],
        [($) => $.F * $.d * Math.sin($.phi * DEG), 'Sine and cosine swapped. The part along the motion is F cos φ, with φ measured from the ground.'],
      ],
    },
  },
  'ch7.dot': {
    traps: {
      W: [
        [($) => $.Fmag * $.dmag, 'That multiplies the sizes. Only the part of the force along the motion counts: add Fₓdₓ and F_yd_y.'],
        [($) => $.Fx * $.dx, 'That leaves out the y parts. The dot product adds both: Fₓdₓ + F_yd_y.'],
      ],
    },
  },
  'ch7.path': {
    traps: {
      W: [
        [($) => $.Wline, 'That is the work along the straight line. This force is not conservative, so the path matters: integrate along the curve.'],
        [($) => ($.a * $.Y * $.X) / ($.n + 1), 'That leaves out F_y dy. The path climbs, so the y part of the force does work too.'],
      ],
    },
  },
  'ch7.graph': {
    traps: {
      W: [
        [($) => $.F1 * $.x2, 'That is the whole rectangle under the peak. The rising part is a triangle: half of base times height.'],
        [($) => ($.shape === 'ramp' ? 0.5 * $.F1 * $.x2 : $.F1 * $.x1), 'Work is the area under the graph, piece by piece: a triangle for each sloping part, a rectangle for each level part.'],
      ],
    },
  },
  'ch7.spring': {
    traps: {
      k: [
        [($) => ($.kunit === 'Ncm' ? $.W1 / $.x1 / 100 : $.W1 / $.x1), 'That is W/x, as if the force were constant. The spring force grows from zero, so W = ½kx².'],
        [($) => ($.kunit === 'Ncm' ? $.W1 / ($.x1 * $.x1) / 100 : $.W1 / ($.x1 * $.x1)), 'That drops the ½: W = ½kx², so k = 2W/x².'],
      ],
      W: [
        [($) => 0.5 * $.k * $.extra * $.extra, 'That measures the extra stretch from the relaxed length. It starts at x₁, where the spring already pulls hard: ½k(x₂² − x₁²).'],
        [($) => 0.5 * $.k * $.x2 * $.x2, 'That is the work from the relaxed length all the way to x₂. Subtract the work already done to reach x₁.'],
      ],
    },
  },
  'ch7.frames': {
    traps: {
      Kt: [
        [($) => 0.5 * $.m * $.u * $.u + 0.5 * $.m * $.V * $.V, 'Kinetic energies do not add like velocities. Add the velocities first, then square.'],
        [($) => 0.5 * $.m * $.V * $.V, 'That is the train’s speed alone. Relative to the track the passenger also walks, so the speed is V ± u.'],
        [($) => 0.5 * $.m * $.vT, 'The speed is squared: K = ½mv².'],
      ],
    },
  },
  'ch7.push': {
    traps: {
      Wnet: [
        [($) => $.F * $.d, 'That is the push’s work alone. The net work adds friction’s, −μk mg d.'],
      ],
      v: [
        [($) => Math.sqrt((2 * $.F * $.d) / $.m), 'That leaves out friction. The kinetic energy gained is the net work, (F − μk mg)d.'],
        [($) => Math.sqrt($.Wnet / $.m), 'The ½ went missing: ½mv² = W, so v = √(2W/m).'],
      ],
    },
  },
  'ch7.bullet': {
    traps: {
      ans: [
        [($) => ($.q === 'F' ? (2 * $.K) / $.d : (200 * $.K) / $.F), 'That uses mv² for the kinetic energy. K = ½mv².'],
        [($) => ($.q === 'F' ? $.K / ($.d * 100) : $.K / $.F), 'Units: the depth must be in metres when you divide, and the answer in centimetres.'],
      ],
    },
  },
  'ch7.pullup': {
    traps: {
      P: [
        [($) => $.P / 0.9, 'That lifts the whole body. The arms stay at the bar: count 90% of the mass.'],
        [($) => ($.set === 'one' ? $.W1 : $.n * $.W1), 'That is the work, in joules. Power is the work divided by the time.'],
      ],
    },
  },
  'ch7.climb': {
    traps: {
      P: [
        [($) => ($.unit === 'kW' ? $.climb / 1000 : $.climb / W_PER_HP), 'That is only the power to climb. The losses take a share of the engine’s power on top: divide by 1 − share.'],
        [($) => (($.unit === 'kW' ? $.climb / 1000 : $.climb / W_PER_HP) * (1 + $.share / 100)), 'The share is of the engine’s power, not of the climbing power: P(1 − share) = mgv sin θ.'],
      ],
    },
  },

  // ---------- Chapter 8 ----------
  'ch8.hiker': {
    traps: {
      U: [
        [($) => ($.m * G * Math.abs($.y[$.at] - $.y[$.zero])) / 1000, 'Below the zero level the height is negative, and so is U.'],
        [($) => ($.m * G * ($.y[$.at] + $.E)) / 1000, 'That measures the height from sea level whatever the question says. Measure from the chosen zero.'],
      ],
    },
  },
  'ch8.spring': {
    traps: {
      Us: [
        [($) => $.k * $.x * $.x, 'The ½ went missing: U = ½kx². The force grows from zero as it stretches.'],
        [($) => $.k * $.x, 'That is the force kx, in newtons, not the energy ½kx².'],
      ],
      v: [
        [($) => Math.sqrt($.Us / $.m), 'The ½ went missing: ½mv² = U, so v = √(2U/m).'],
      ],
    },
  },
  'ch8.hanging': {
    traps: {
      ans: [
        [($) => ($.q === 'max' ? $.w / $.k : Math.sqrt(2 * G * $.yB)), ($) => ($.q === 'max' ? 'That is where it would hang at rest, w/k. Let go from the relaxed length, it overshoots to twice that.' : 'That is a free fall through the distance. The spring takes energy too: K = wy − ½ky².')],
        [($) => ($.q === 'max' ? $.w / (2 * $.k) : Math.sqrt((2 * $.w * $.yB) / $.m)), ($) => ($.q === 'max' ? 'From wy = ½ky², y = 2w/k.' : 'That leaves out the spring’s energy at that point, ½ky².')],
      ],
    },
  },
  'ch8.fromforce': {
    traps: {
      ans: [
        [($) => -$.ans + ($.q === 'U' ? 2 * $.U0 : 0), 'Sign: ΔU is minus the work. This force points toward −x, so moving out it does negative work and U rises.'],
        [($) => ($.q === 'dU' ? $.a * $.xB * $.xB * ($.xB - $.xA) : ($.a * $.x1 ** 3) / 3), ($) => ($.q === 'dU' ? 'That treats the force as constant at its end value. It changes along the way: integrate ax².' : 'That leaves out the constant: U(0) is given, so add it.')],
      ],
    },
  },
  'ch8.pendulum': {
    traps: {
      ans: [
        [($) => ($.q === 'v' ? Math.sqrt(2 * G * $.L) : ($.v1 * $.v1) / (2 * G)), ($) => ($.q === 'v' ? 'That drops the bob the whole string length. It drops L(1 − cos θ).' : 'That is how far it has dropped from the release point. The question asks its height above the bottom: h₀ minus that.')],
        [($) => ($.q === 'v' ? Math.sqrt(2 * G * $.L * Math.cos($.theta * DEG)) : $.h0), ($) => ($.q === 'v' ? 'The height of the release above the bottom is L − L cos θ, not L cos θ.' : 'That is where it starts. Moving at v₁, it has already dropped part of the way.')],
      ],
    },
  },
  'ch8.panel': {
    traps: {
      ans: [
        [($) => ($.q === 'loss' ? $.U0 / 1000 : 1), 'That is all of the starting energy. The panel still has ½mv² when it lands; subtract it.'],
        [($) => ($.q === 'loss' ? $.K / 1000 : $.K / $.U0), 'That is the energy it lands with. The air took the rest, mgh − ½mv².'],
      ],
    },
  },
  'ch8.loop': {
    traps: {
      ans: [
        [($) => ({ min: 2 * $.R, top: Math.sqrt(2 * G * $.h), N: ($.m * $.v2) / $.R }[$.q]), ($) => ({ min: 'At exactly 2R the car would reach the top at rest and fall. It needs v² ≥ gR there.', top: 'That is the speed at the bottom of the loop. At the top the car is 2R higher and slower.', N: 'At the top gravity also points down, toward the centre: N = mv²/R − mg.' }[$.q])],
        [($) => ({ min: 3 * $.R, top: Math.sqrt(G * $.R), N: ($.m * $.v2) / $.R + $.m * G }[$.q]), ($) => ({ min: 'The ½ went missing: ½mv² with v² = gR is ½mgR, so h = 2R + R/2.', top: 'That is the least speed that keeps it on. This car starts higher than that needs.', N: 'At the top N and mg point the same way, down: N + mg = mv²/R.' }[$.q])],
      ],
    },
  },
  'ch8.springboard': {
    traps: {
      x: [
        [($) => Math.sqrt((2 * $.m * G * $.h) / $.k), 'That leaves out the drop while the spring is squashed. The block falls h + x, not h.'],
        [($) => $.mg / $.k, 'That is where it would sit at rest on the spring. Moving, it goes further.'],
      ],
      U: [
        [($) => $.mg * $.h, 'That leaves out the last drop, x, while the spring compresses. U = mg(h + x).'],
      ],
    },
  },
  'ch8.rough': {
    traps: {
      ans: [
        [($) => ($.q === 'mu' ? ($.k * $.x) / ($.m * G) : $.Us / ($.mu * $.m)), ($) => ($.q === 'mu' ? 'That compares forces, kx and mg. Use energy: ½kx² = μk mg d.' : 'g went missing: friction is μk mg, a force in newtons.')],
        [($) => ($.q === 'mu' ? $.Us / ($.m * $.d) : (2 * $.Us) / ($.mu * $.m * G)), ($) => ($.q === 'mu' ? 'g went missing: the friction force is μk mg.' : 'The ½ went missing from the spring energy, ½kx².')],
      ],
    },
  },
  'ch8.turning': {
    traps: {
      x: [
        [($) => ($.curve === 'well' ? $.inner : ($.Eq / $.c) ** 0.25), ($) => ($.curve === 'well' ? 'That is the inner turning point, the one nearer the hump. The outer one has the larger root.' : 'The ¼ went missing: ¼cx⁴ = E gives x⁴ = 4E/c.')],
        [($) => ($.curve === 'well' ? 1 / Math.SQRT2 : Math.sqrt((4 * $.Eq) / $.c)), ($) => ($.curve === 'well' ? 'That is the bottom of the well, where U is least. At a turning point U = E.' : 'That takes a square root. x⁴ = 4E/c needs a fourth root.')],
      ],
      F: [
        [($) => -$.F, 'Sign: F = −dU/dx. Past the bottom U rises, so the force points back toward −x.'],
        [($) => $.Eused / $.x, 'Energy over distance is not the force here. The force is minus the slope of U at that point.'],
      ],
      v: [
        [($) => Math.sqrt($.Kmax / $.m), 'The 2 went missing: ½mv² = K, so v = √(2K/m).'],
        [($) => (2 * $.Kmax) / $.m, 'That is v². Take the square root.'],
      ],
    },
  },
};
