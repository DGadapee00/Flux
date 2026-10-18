/**
 * Unit 1 coaching: for each template, numeric `traps` (the wrong value a known mistake produces,
 * and what the mistake was), `why` for each wrong option of a choice part, and hints that continue a
 * template's own ladder. Folded into the bank by src/problems/index.js.
 *
 * Values inside `$` are SI. A trap returns a value in SI, like the part's own `get`.
 */
import { M_PER_FT, N_PER_LBF } from '@flux/subjects/convert.js';

const G = 9.81;
const DEG = Math.PI / 180;

/** The three-step a–t graph, with each step's distance figured from the end speed instead of the average. */
function erraticWrong($) {
  let s = 0;
  let v = $.v0;
  for (const [a, dt] of [[$.a1, $.dt1], [$.a2, $.dt2], [$.a3, $.dt3]]) {
    v += a * dt;
    s += v * dt;
  }
  return s;
}

function landing($, vx, vy) {
  const t = (vy + Math.sqrt(vy * vy + 2 * G * ($.y0 ?? 0))) / G;
  return { t, range: vx * t };
}

export default {
  'u1.1.convert': {
    traps: {
      F: [
        [($) => $.F / N_PER_LBF / N_PER_LBF, 'Divided by 4.448 instead of multiplying: a newton is smaller than a pound-force, so the number grows.'],
        [($) => ($.F / N_PER_LBF) * G, 'One pound-force is 4.448 N, not 9.81 N. The pound is a force here, not a mass.'],
      ],
      M: [[($) => $.F * ($.L / M_PER_FT), 'The force is in newtons, but the arm is still in feet. Convert both.']],
    },
  },
  'u1.12.polynomial': {
    traps: {
      v: [[($) => $.v0 + $.a * $.t + $.j * $.t * $.t, 'Differentiate the cubic term again: the derivative of t³/6 is t²/2, not t².']],
      a: [[($) => $.a, 'That is the acceleration at t = 0. The jerk term keeps changing it.']],
    },
  },
  'u1.12.separate': {
    traps: {
      v: [
        [
          ($) => ($.law === 'ks' ? Math.sqrt($.v0 ** 2 + 2 * $.k * $.s * $.s) : $.v0 * Math.exp(-$.k * $.s)),
          ($) => ($.law === 'ks'
            ? 'That treats ks as a constant acceleration over the whole distance. It grows from zero, so integrate it.'
            : 'That integrates in time, not distance. With a = −kv, v dv = a ds gives dv = −k ds: the speed falls linearly with s.'),
        ],
        [
          ($) => ($.law === 'ks' ? Math.sqrt($.k) * $.s : $.v0 + $.k * $.s),
          ($) => ($.law === 'ks' ? 'The particle already had v₀ at the origin. Keep the v₀² term.' : 'The resistance slows the particle: the speed goes down with distance, not up.'),
        ],
      ],
    },
  },
  'u1.12.distance': {
    traps: {
      dist: [[($) => Math.abs($.v0 * $.t + 0.5 * $.a * $.t * $.t), 'That is the size of the displacement. The particle turned round, so it covered more ground.']],
      s: [[($) => $.v0 * $.t + $.a * $.t * $.t, 'The acceleration term is ½at², not at².']],
    },
  },
  'u1.12.erratic': {
    traps: {
      s: [[erraticWrong, 'Each step’s distance uses the average of its two end speeds, not the speed at its end.']],
      v: [[($) => $.v0 + $.a1 + $.a2 + $.a3, 'Each step adds a·Δt to the speed, not a alone. Multiply by the step’s duration.']],
    },
  },
  'u1.12.projectile': {
    traps: {
      range: [[($) => landing($, $.v0 * Math.sin($.theta * DEG), $.v0 * Math.sin($.theta * DEG)).t * $.v0 * Math.sin($.theta * DEG), 'The horizontal speed is v₀ cos θ. The sine belongs to the vertical part.']],
      h: [[($) => ($.y0 ?? 0) + (($.v0 * Math.sin($.theta * DEG)) ** 2) / G, 'The rise is v_y²/2g: the factor of 2 is missing.']],
      t: [[($) => ($.v0 * Math.sin($.theta * DEG)) / G, 'That is the time to the top. The particle still has to come down.']],
    },
  },
  'u1.12.path': {
    traps: {
      rho: [[($) => 1 / Math.abs($.shape === 'sine' ? -$.c * Math.sin($.x) : $.c), 'That is 1/|y″|, which holds only where the path is level. Keep the (1 + y′²)^{3/2} factor.']],
      an: [[($) => {
        const yp = $.shape === 'sine' ? $.c * Math.cos($.x) : $.c * $.x;
        const ypp = $.shape === 'sine' ? -$.c * Math.sin($.x) : $.c;
        return $.speed / ((1 + yp * yp) ** 1.5 / Math.abs(ypp));
      }, 'The normal acceleration is v²/ρ. The speed is squared.']],
      mag: [[($) => {
        const yp = $.shape === 'sine' ? $.c * Math.cos($.x) : $.c * $.x;
        const ypp = $.shape === 'sine' ? -$.c * Math.sin($.x) : $.c;
        return Math.abs($.at) + ($.speed * $.speed) / ((1 + yp * yp) ** 1.5 / Math.abs(ypp));
      }, 'The two components are at right angles. Add their squares, then take the root.']],
    },
  },
  'u1.12.relative': {
    traps: {
      speed: [[($) => Math.abs(Math.hypot($.vbx, $.vby) - Math.hypot($.vax, $.vay)), 'Subtracting the two speeds loses the directions. Subtract the vectors, then take the size.']],
      vx: [[($) => $.vax - $.vbx, 'That is A relative to B. B relative to A is v_B − v_A.']],
      ax: [[($) => $.aax - $.abx, 'That is A relative to B. B relative to A is a_B − a_A.']],
    },
  },
};
