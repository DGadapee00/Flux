/**
 * Unit 5 coaching. Traps are the wrong value a named mistake gives.
 * Folded into the bank by src/problems/index.js. A trap is [($) => wrongValue, 'what went wrong'].
 */
import { G } from '@flux/subjects/mechanics/constants.js';
import { collide1D } from '@flux/subjects/mechanics/momentum.js';

const dvOf = ($) => ($.told === 'change' ? $.dv : $.vf - $.v0);
const u2Elastic = ($) => ($.meet === 'rest' ? 0 : $.u2);
const u2Stick = ($) => ($.dir === 'head' ? -$.u2 : $.u2);
const u2Partial = ($) => ($.meet === 'rest' ? 0 : $.u2);

export default {
  'ch9.momentum': {
    traps: {
      p: [
        [($) => Math.abs($.px) + Math.abs($.py), 'That adds the components as if they were parallel. The magnitude is the square root of the sum of the squares.'],
        [($) => $.m * $.vx, 'That keeps the sign of v_x and drops every other component. The magnitude is positive, and it uses the whole velocity.'],
      ],
      px: [
        [($) => $.m * $.vyUsed, 'That is the other component. p_x is the mass times v_x.'],
      ],
    },
  },
  'ch9.impulse': {
    traps: {
      J: [
        [($) => $.m * Math.abs(dvOf($)), 'The sign went missing. A force against the velocity has a negative impulse.'],
        [($) => $.m * dvOf($) * $.dt, 'That multiplies by the time. The impulse is mΔv. The time comes in when you find the force.'],
      ],
      F: [
        [($) => $.m * dvOf($), 'That is the impulse, in N·s. Divide by the time to get the average force.'],
        [($) => $.J * $.dt, 'Divide by the time, do not multiply. F = J/Δt.'],
      ],
    },
  },
  'ch9.graph': {
    traps: {
      J: [
        [($) => $.peak * $.T, 'That is the rectangle, peak times duration. A triangle is half of that, and a half-sine is 2/π of that.'],
        [($) => ($.shape === 'rect' ? 0.5 * $.peak * $.T : (2 * $.peak * $.T) / Math.PI), 'That is the area of a different pulse. Match the shape: rectangle FT, triangle ½FT, half-sine 2FT/π.'],
      ],
      Favg: [
        [($) => $.peak, 'That is the peak. The average force is the area divided by the duration, and a triangle or a half-sine spends time below its peak.'],
      ],
      vf: [
        [($) => $.v0 + ($.peak * $.T) / $.m, 'That uses the rectangular impulse. Use the area of the shape you were given.'],
      ],
    },
  },
  'ch9.bounce': {
    traps: {
      J: [
        [($) => $.m * $.speed, 'That is mv, the impulse that stops the body. A rebound at the same speed also has to supply the outgoing momentum, so the impulse is 2mv.'],
        [($) => $.m * $.speed * $.dt, 'That folds the contact time into the impulse. The impulse is the change of momentum. Divide by the time only when you want the force.'],
      ],
      F: [
        [($) => $.J * $.dt, 'Divide the impulse by the contact time. F = J/Δt.'],
        [($) => $.m * G, 'That is the weight. During the contact the floor pushes much harder than the weight.'],
      ],
    },
  },
  'ch9.meteor': {
    traps: {
      m: [
        [($) => $.rho * 4 * Math.PI * $.R * $.R, 'That is density times surface area. The mass uses the volume, (4/3)πR³.'],
        [($) => $.rho * Math.PI * $.R * $.R * $.R, 'The volume of a sphere is (4/3)πR³, not πR³.'],
      ],
      F: [
        [($) => $.m * $.speed, 'That is the momentum, not the force. Divide by the time the force acts.'],
        [($) => ($.m * $.speed) * $.t, 'Divide by the time. A longer stop means a smaller average force.'],
      ],
    },
  },
  'ch9.elastic': {
    traps: {
      v1: [
        [($) => ($.m1 * $.u1 + $.m2 * u2Elastic($)) / ($.m1 + $.m2), 'That is the shared velocity if they stuck. This collision is elastic, so the relative velocity reverses.'],
        [($) => u2Elastic($), 'That is an exchange, which holds for equal masses with the target at rest. These masses, or these velocities, do not both fit that case.'],
      ],
      v2: [
        [($) => $.u1, 'That sends the target off at the incoming speed, which is the exchange. Check that the masses are equal and the target was at rest before you use it.'],
      ],
      K: [
        [($) => {
          const u2 = u2Elastic($);
          const v = ($.m1 * $.u1 + $.m2 * u2) / ($.m1 + $.m2);
          return 0.5 * ($.m1 + $.m2) * v * v;
        }, 'That is the kinetic energy they would keep if they stuck. An elastic collision keeps all of it.'],
      ],
    },
  },
  'ch9.stick': {
    traps: {
      v: [
        [($) => collide1D($.m1, $.m2, $.u1, u2Stick($), 1).v1, 'That is the elastic result. They stick, so there is one shared velocity, (m1 u1 + m2 u2)/(m1 + m2).'],
        [($) => ($.m1 * Math.abs($.u1) + $.m2 * Math.abs($.u2)) / ($.m1 + $.m2), 'The speeds were added as sizes. A head-on approach makes one of the velocities negative.'],
      ],
      lost: [
        [($) => 0, 'Sticking is not elastic. The kinetic energy of the relative motion is lost.'],
        [($) => 0.5 * $.m1 * $.u1 * $.u1 + 0.5 * $.m2 * u2Stick($) * u2Stick($), 'That is all of the kinetic energy. The shared motion keeps some. Subtract ½(m1 + m2)v².'],
      ],
    },
  },
  'ch9.recoil': {
    traps: {
      ans: [
        [($) => -$.ans, 'The two momenta point opposite ways. The velocity you want is negative on the axis the question set.'],
        [($) => ($.which === 'gun' ? (-$.u * $.M) / $.m : (-$.m * $.Vp) / $.M), 'The mass in the denominator is the body whose velocity you are finding, not the other one.'],
      ],
    },
  },
  'ch9.oblique': {
    traps: {
      speed: [
        [($) => ($.m1 * $.u1 + $.m2 * $.u2) / ($.m1 + $.m2), 'That adds the momenta as if the vehicles were on the same line. Add them as vectors, then take the magnitude.'],
        [($) => ($.u1 + $.u2) / 2, 'That averages the speeds and forgets the masses. Momentum is mass times velocity, added by components.'],
      ],
      angle: [
        [($) => 90 - $.angle, 'That is the complement. The question asks for the direction from the first vehicle\'s axis, +x, not from the perpendicular.'],
        [($) => $.theta, 'That is the second vehicle\'s incoming direction. The shared velocity lies between the two incoming momenta.'],
      ],
    },
  },
  'ch9.crash': {
    traps: {
      vT: [
        [($) => $.mu * G * $.d, 'That is μgd, with no square root and no factor of 2. From v² = 2μgd, the speed is √(2μgd).'],
        [($) => Math.sqrt($.mu * G * $.d), 'The 2 went missing under the square root. The skid uses v² = 2ad with a = μg.'],
      ],
      vC: [
        [($) => $.vT, 'That is the truck\'s speed after the hit. The car was a different mass, so its speed before the hit is not the same number.'],
        [($) => ($.model === 'stop' ? (($.mc + $.mt) / $.mc) * $.vT : ($.mt / $.mc) * $.vT), 'That is the other reading of the crash. The car stops: the truck takes the car\'s momentum. They stick: the car was carrying both masses.'],
      ],
    },
  },
  'ch9.cm': {
    traps: {
      x: [
        [($) => ($.x1 + $.x2) / 2, 'That is the midpoint. It is the center of mass only when the two masses are equal. Weight each position by its mass.'],
        [($) => ($.m2 * $.x1 + $.m1 * $.x2) / ($.m1 + $.m2), 'The masses are swapped. Each position is weighted by the mass that sits there.'],
      ],
      y: [
        [($) => ($.y1 + $.y2) / 2, 'That is the midpoint. Weight each y by the mass at that point. On a line, y is zero.'],
      ],
    },
  },
  'ch9.rocket': {
    traps: {
      dv: [
        [($) => $.ve * (($.m0 - $.mf) / $.m0) - $.g * $.tb, 'That makes Δv proportional to the fraction of mass burned. The coasting result is ve times the natural log of the mass ratio.'],
        [($) => $.ve * Math.log10($.m0 / $.mf) - $.g * $.tb, 'The logarithm in the rocket equation is natural, ln, not log base 10.'],
        [($) => $.ve * Math.log($.m0 / $.mf), 'That leaves gravity out. An upward burn also subtracts g times the burn time.'],
      ],
      a0: [
        [($) => $.thrust / $.m0, 'That is thrust over the starting mass. An upward burn also has the weight pulling down, so subtract g.'],
        [($) => $.thrust / $.mf, 'The acceleration at ignition uses the starting mass, before any propellant has left.'],
      ],
    },
  },
  'ch9.partial': {
    traps: {
      e: [
        [($) => $.K / $.K0, 'That is the fraction of kinetic energy kept. Restitution is not that fraction. The relative motion keeps a fraction e² of its own kinetic energy.'],
        [($) => 1 - $.K / $.K0, 'That is the fraction of kinetic energy lost. e is the square root of the fraction of the relative kinetic energy that is kept, and the center-of-mass motion is not part of that relative piece.'],
      ],
      lost: [
        [($) => $.K0, 'That throws away all of the kinetic energy. The center-of-mass motion remains. Subtract the kinetic energy you were given.'],
        [($) => $.K, 'That is the kinetic energy left, not the kinetic energy lost. Lost is before minus after.'],
      ],
    },
  },
};
