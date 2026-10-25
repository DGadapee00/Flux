/**
 * Unit 3 coaching: for each template, the wrong value a named mistake gives (`traps`) and the hints
 * that continue its ladder. The conceptual templates carry a `why` on every option themselves.
 * Folded into the bank by src/problems/index.js. A trap is [($) => wrongValue, 'what went wrong'].
 */
import { G } from '@flux/subjects/mechanics/constants.js';

const DEG = Math.PI / 180;
const mod360 = (x) => ((x % 360) + 360) % 360;

export default {
  // ---------- Chapter 5 ----------
  'ch5.net': {
    traps: {
      a: [
        [($) => $.sumMag, 'That adds the sizes of the forces. Forces add as vectors: add the x parts and the y parts separately.'],
        [($) => Math.abs($.ax) + Math.abs($.ay), 'That adds the two components. The size is √(aₓ² + a_y²).'],
      ],
      dir: [
        [($) => mod360(Math.atan($.ay / $.ax) / DEG), 'The arctangent alone cannot tell the quadrant. Check the signs of aₓ and a_y.'],
        [($) => mod360(90 - $.dir), 'That measures from the +y axis. The question measures from +x.'],
      ],
    },
  },
  'ch5.lift': {
    traps: {
      ans: [
        [($) => ($.q === 'force' ? $.m * $.a : $.F / $.m), 'That leaves out the weight. Gravity pulls down the whole time, so the net force is F − w.'],
        [($) => ($.q === 'force' ? $.w + $.w * $.a : ($.F - $.w) / $.w), 'That uses the weight in newtons as the mass. The mass is m = w/g.'],
      ],
    },
  },
  'ch5.system': {
    traps: {
      a: [
        [($) => $.F / $.total, 'That leaves out friction. The net external force is F − f.'],
        [($) => ($.F - $.f) / $.mCart, 'That uses the cart’s mass alone. The push from the floor accelerates the professor and the cart together.'],
      ],
      P: [
        [($) => $.F, 'That is the floor’s push on her, not her push on the cart. She uses part of it to accelerate herself.'],
        [($) => $.mCart * $.a, 'That leaves out friction on the cart. Her push must also overcome it: P = mₓa + f.'],
      ],
    },
  },
  'ch5.tension': {
    traps: {
      T1: [
        [($) => $.w / 2, 'That shares the weight equally and ignores the angles. Only the vertical part of each tension holds the weight up.'],
        [($) => ($.w * Math.sin($.th2 * DEG)) / Math.sin(($.t1 + $.th2) * DEG), 'Sine and cosine swapped: the vertical part of a tension at θ above the horizontal is T sin θ.'],
      ],
      T2: [
        [($) => $.w / 2, 'That shares the weight equally and ignores the angles. Only the vertical part of each tension holds the weight up.'],
        [($) => ($.w * Math.sin($.t1 * DEG)) / Math.sin(($.t1 + $.th2) * DEG), 'Sine and cosine swapped: the vertical part of a tension at θ above the horizontal is T sin θ.'],
      ],
    },
  },

  // ---------- Chapter 6 ----------
  'ch6.atwood': {
    traps: {
      a: [
        [($) => G, 'Only the difference of the weights drives the system, and it moves both masses.'],
        [($) => (($.m2 - $.m1) * G) / $.m2, 'That divides by one mass. The unbalanced force accelerates both blocks: divide by m₁ + m₂.'],
      ],
      T: [
        [($) => $.m2 * G, 'That is the heavier block’s weight. It accelerates downward, so the string pulls with less than its weight.'],
        [($) => $.m1 * G, 'That is the lighter block’s weight. It accelerates upward, so the string pulls with more than its weight.'],
      ],
    },
  },
  'ch6.connected': {
    traps: {
      a: [
        [() => G, 'The hanging block does not fall freely: it drags the table block along, and the string holds it back.'],
        [($) => ($.m2 * G - $.muUsed * $.m1 * G) / $.m2, 'The driving force accelerates both blocks together: divide by m₁ + m₂, not by m₂ alone.'],
      ],
      T: [
        [($) => $.W2, 'T = m₂g only if nothing accelerates. The hanging block speeds up, so T = m₂(g − a).'],
        [($) => $.m1 * $.a, 'That leaves out friction on the table block, or there is none and this is right by chance. With friction the string must also overcome μₖm₁g.'],
      ],
    },
  },
  'ch6.tractor': {
    traps: {
      v: [
        [($) => $.aNow * $.t, 'That treats the final acceleration as constant. The force grows from zero, so integrate: v = kt²/(2M).'],
        [($) => ($.k * $.t * $.t) / (2 * $.mT), 'That uses the tractor’s mass alone. The ground’s push accelerates the whole train.'],
      ],
      T: [
        [($) => $.k * $.t, 'That is the whole driving force. The cable only pulls what is behind it.'],
        [($) => ($.link === 'front' ? $.mB : $.mA + $.mB) * $.aNow, 'Wrong carts: a cable pulls everything behind it, and nothing in front.'],
      ],
    },
  },
  'ch6.elevator': {
    hints: ['Check with an extreme: in free fall (a = −g) the scale reads zero.'],
    traps: {
      N: [
        [($) => $.W, 'That is the weight. The scale reads the weight only when the elevator does not accelerate.'],
        [($) => $.m * (G - $.a), 'Sign of the acceleration: with up positive, N = m(g + a). Speeding up on the way up, or slowing on the way down, makes it read more.'],
      ],
      kg: [
        [($) => $.m, 'That is his mass. The scale shows N/g, which changes when the elevator accelerates.'],
        [($) => $.N, 'That is the reading in newtons. A scale marked in kilograms divides by g.'],
      ],
    },
  },
  'ch6.incline': {
    traps: {
      ans: [
        [($) => ($.q === 'mu' ? $.f / ($.m * G) : G * (Math.sin($.th * DEG) - $.mu)), 'The normal force on a slope is mg cos θ, not mg.'],
        [($) => ($.q === 'mu' ? $.f / ($.m * G * Math.sin($.th * DEG)) : G * (Math.cos($.th * DEG) - $.mu * Math.sin($.th * DEG))), 'Sine and cosine swapped: the part of the weight along the slope is mg sin θ, and the part into it is mg cos θ.'],
      ],
    },
  },
  'ch6.hold': {
    traps: {
      f: [
        [($) => $.mus * $.m * G * Math.cos($.th * DEG), 'μs N is the most static friction can give, not what it does give. While the crate holds, friction just matches mg sin θ.'],
        [($) => $.muk * $.m * G, 'The normal force on a ramp is mg cos θ, not mg.'],
      ],
      a: [
        [($) => G * (Math.sin($.th * DEG) - $.mus * Math.cos($.th * DEG)), 'Once it slides, friction is kinetic. Use μk, not μs, for the acceleration.'],
        [($) => G * Math.sin($.th * DEG), 'That leaves out friction. A sliding crate still has μk N acting up the ramp.'],
      ],
    },
  },
  'ch6.truck': {
    traps: {
      f: [
        [($) => $.mus * $.m * G, 'That is the most static friction can give. If the crate rides along, friction is only what it needs: m a.'],
        [($) => $.m * $.aT, 'If the crate slips, friction is kinetic, μk m g, and cannot reach m a.'],
      ],
      aCrate: [
        [($) => $.aT, 'The crate keeps up with the truck only if it does not slip. Here check μs g against the truck’s acceleration.'],
        [($) => $.mus * G, 'Once it slips, friction is kinetic: the crate’s acceleration is μk g.'],
      ],
    },
  },
  'ch6.flat': {
    traps: {
      ans: [
        [($) => ($.q === 'mu' ? $.speed / ($.r * G) : $.mu * G * $.r), 'The speed enters squared: μs = v²/(rg), so v = √(μs g r).'],
        [($) => ($.q === 'mu'
          ? ($.unit === 'kmh' ? ($.vkmh * $.vkmh) / ($.r * G) : ($.speed * $.speed) / $.r)
          : ($.unit === 'kmh' ? Math.sqrt($.mu * G * $.r) : Math.sqrt($.mu * $.r))), 'Check the units. The speed goes into v²/(rg) in m/s (divide km/h by 3.6, and multiply back at the end), and g belongs in the formula, so μs has no unit.'],
      ],
    },
  },
  'ch6.banked': {
    traps: {
      ans: [
        [($) => ({ speed: Math.sqrt($.r * G * Math.sin($.th * DEG)), angle: Math.asin(Math.min(1, ($.v * $.v) / ($.r * G))) / DEG, radius: ($.v * $.v) / (G * Math.sin($.th * DEG)) }[$.q]), 'Dividing N sin θ = mv²/r by N cos θ = mg gives tan θ, not sin θ.'],
        [($) => ({ speed: $.r * G * Math.tan($.th * DEG), angle: Math.atan($.v / ($.r * G)) / DEG, radius: $.v / (G * Math.tan($.th * DEG)) }[$.q]), 'The speed enters squared: tan θ = v²/(rg).'],
      ],
    },
  },
  'ch6.slowbank': {
    traps: {
      vDesign: [
        [($) => Math.sqrt($.r * G * Math.sin($.th * DEG)), 'Dividing the two force equations gives tan θ = v²/(rg), not sin θ.'],
        [($) => $.r * G * Math.tan($.th * DEG), 'That is v². Take the square root.'],
      ],
      muNeed: [
        [($) => Math.abs(($.speed * $.speed) / $.r - G * Math.tan($.th * DEG)) / G, 'That treats friction as if the bank were flat. On a bank both N and f have parts along x and y: solve the two equations together.'],
        [($) => ($.speed * $.speed) / ($.r * G), 'That is the friction a flat road would need. The bank does part of the job.'],
      ],
    },
  },
  'ch6.loop': {
    traps: {
      N: [
        [($) => $.m * (($.vTop * $.vTop) / $.r + G), 'At the top the seat pushes down, the same way as gravity. Both point to the centre: N = m(v²/r − g).'],
        [($) => $.m * G, 'The seat force is not the weight. At the top the two together supply mv²/r.'],
      ],
      vMin: [
        [($) => G * $.r, 'That is v². Take the square root: v = √(gr).'],
        [($) => Math.sqrt(2 * G * $.r), 'At the least speed the weight alone supplies mv²/r, so v² = gr, not 2gr.'],
      ],
    },
  },
  'ch6.terminal': {
    traps: {
      ans: [
        [($) => ($.q === 'speed' ? Math.sqrt(($.m * G) / (1.21 * $.C * $.A)) : ($.m * G) / $.vt), 'Check the v² in the drag: v_t² = 2mg/(ρCA) keeps the ½ of the drag force, and b = mg/v_t² squares the terminal speed.'],
        [($) => ($.q === 'speed' ? (2 * $.m * G) / (1.21 * $.C * $.A) : $.m / ($.vt * $.vt)), 'Either the square root was left off (that is v_t²), or the mass stands where the weight mg belongs.'],
      ],
    },
  },
  'ch6.coast': {
    traps: {
      bm: [
        [($) => ($.v0 - $.v1) / ($.v0 * $.t1), 'That assumes the speed falls in a straight line. With F = −bv it decays exponentially: b/m = ln(v₀/v)/t.'],
        [($) => Math.log10($.v0 / $.v1) / $.t1, 'Use the natural log, not log base 10.'],
      ],
      x1: [
        [($) => 0.5 * ($.v0 + $.v1) * $.t1, 'The average of the two speeds is the right average only for constant deceleration. Here integrate v₀e^(−bt/m).'],
        [($) => $.v0 * $.t1, 'The boat does not hold its starting speed. Integrate the falling speed.'],
      ],
      xMax: [
        [($) => $.x1, 'The boat keeps going after that time, more and more slowly. The limit is v₀m/b.'],
        [($) => ($.v0 * $.v0) / (2 * $.bm), 'That treats the drag as a constant deceleration. With F = −bv the limit is v₀/(b/m).'],
      ],
    },
  },
  'ch6.mortar': {
    traps: {
      h: [
        [($) => ($.air === 'drag' ? $.hFree : ($.v0 * $.v0) / G), 'Either the drag was left out (on the way up it points down, with the weight), or the 2 in v₀²/(2g) was dropped.'],
        [($) => ($.air === 'drag' ? ($.m / $.k) * Math.log1p(($.k * $.v0 * $.v0) / ($.m * G)) : $.v0 / (2 * G)), 'A factor went missing: the drag result is (m/2k) ln(1 + kv₀²/mg), with the ½, and with no drag h = v₀²/(2g), with v₀ squared.'],
      ],
    },
  },
  'ch5.concept-pairs': {},
  'ch5.concept-first': {},
  'ch5.concept-fbd': {},
  'ch6.concept-scale': {},
  'ch6.concept-tension': {},
  'ch6.concept-terminal': {},
  'ch6.concept-curve': {},
};

