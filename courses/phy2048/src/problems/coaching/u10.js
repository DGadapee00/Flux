/**
 * Unit 10 coaching. Traps are the wrong value a named mistake gives.
 * Folded into the bank by src/problems/index.js.
 */
import { G } from '@flux/subjects/mechanics/constants.js';
import { circleArea, flowSpeed } from '@flux/subjects/mechanics/fluids.js';

export default {
  'ch14.dam': {
    traps: {
      p: [
        [($) => $.rho * G * $.depth, 'That is the pressure at the bottom. The average on a vertical wall is the pressure at half the depth.'],
        [($) => $.rho * $.depth / 2, 'That left out g. The average pressure is ρg times half the depth.'],
      ],
      F: [
        [($) => $.rho * G * $.depth * $.depth * $.width, 'That uses the bottom pressure on the whole face. The pressure grows with depth, so the average is half of that.'],
        [($) => $.rho * G * $.depth / 2, 'That is the average pressure, in pascals. The force is that pressure times the area of the face.'],
      ],
    },
  },
  'ch14.barometer': {
    traps: {
      p: [
        [($) => $.rho * $.h, 'That left out g. Gauge pressure under a still column is ρgh.'],
        [($) => $.rho * G * $.h + 1.01e5, 'That adds the atmosphere. The part asks for the gauge pressure, which is zero in the open air.'],
      ],
    },
  },
  'ch14.utube': {
    traps: {
      h1: [
        [($) => $.h2 * $.rho1 / $.rho2, 'That swapped the densities. The heavier liquid stands lower, so its height is the lighter height times ρ2/ρ1.'],
        [($) => $.h2, 'That makes the two columns the same height. They balance only when ρh matches, and the densities differ.'],
      ],
      diff: [
        [($) => $.h2 + $.h1, 'That adds the two heights. The free surfaces differ by h2 − h1.'],
        [($) => $.h2, 'That is the lighter column alone. Subtract the heavier height above the interface.'],
      ],
    },
  },
  'ch14.brakes': {
    traps: {
      F2: [
        [($) => $.F1 * ($.d2 / $.d1), 'That uses the diameter ratio once. Area scales with the square of the diameter.'],
        [($) => $.F1 * ($.d1 / $.d2) ** 2, 'That inverts the pistons. The larger piston carries the larger force.'],
      ],
    },
  },
  'ch14.stroke': {
    traps: {
      F2: [
        [($) => $.F1 * ($.d2 / $.d1), 'That uses the diameter ratio once. The force ratio is (d2/d1)².'],
        [($) => $.F1 * ($.d1 / $.d2) ** 2, 'That puts the larger force on the smaller piston. The force follows the area.'],
      ],
      x2: [
        [($) => $.x1 * ($.d2 / $.d1) ** 2, 'That sends the wheel farther than the master. The volume is fixed, so the larger piston moves less.'],
        [($) => $.x1, 'That gives both pistons the same travel. The wheel travel is the master travel times (d1/d2)².'],
      ],
    },
  },
  'ch14.woman': {
    traps: {
      rho: [
        [($) => $.f * 100 * $.rhoF, 'That treats the fraction as a percent and multiplies by 100 again. 0.97 already means 97 percent.'],
        [($) => $.f * $.rhoF * G, 'That multiplies the density by g. Density is the fraction times the fluid density, in kg/m³.'],
      ],
      V: [
        [($) => $.mass / $.rhoF, 'That divides by the fluid density. Her volume uses her own density, which is the fraction times the fluid density.'],
        [($) => $.mass * $.f / $.rhoF, 'That multiplies by the fraction. Volume is mass divided by density, and the fraction is already inside the density.'],
      ],
    },
  },
  'ch14.apparent': {
    traps: {
      weight: [
        [($) => $.mass, 'That is the mass, in kilograms. The weight is mg.'],
        [($) => $.rhoF * ($.mass / $.rhoObj) * G, 'That is the buoyant force. The true weight is mg, and it does not use the fluid.'],
      ],
      Fb: [
        [($) => $.mass * G, 'That is the true weight. The buoyant force is the weight of the fluid the block displaces.'],
        [($) => $.rhoObj * ($.mass / $.rhoObj) * G, 'That uses the block’s density for the displaced fluid. The fluid density belongs there.'],
      ],
      apparent: [
        [($) => $.mass * G, 'That is the true weight. Under water the hand supplies only the true weight minus the buoyant force.'],
        [($) => $.rhoF * ($.mass / $.rhoObj) * G - $.mass * G, 'That subtracts the weight from the buoyant force. The apparent weight is the other way around, and it stays positive for this block.'],
      ],
    },
  },
  'ch14.nozzle': {
    traps: {
      v1: [
        [($) => flowSpeed($.Q, Math.PI * $.d1 * $.d1), 'That treats the diameter as a radius. The area is π(d/2)², so this area is four times too big and the speed is four times too small.'],
        [($) => flowSpeed($.Q * 1000, circleArea($.d1)), 'That uses the litre-per-second figure as cubic metres per second. Divide by 1000 first.'],
      ],
      v2: [
        [($) => flowSpeed($.Q, Math.PI * $.d2 * $.d2), 'That treats the nozzle diameter as a radius. The area is π(d/2)².'],
        [($) => flowSpeed($.Q * 1000, circleArea($.d2)), 'That leaves the flow in litres per second. The area is in square metres, so the flow has to be in cubic metres per second.'],
      ],
    },
  },
  'ch14.hose-p': {
    traps: {
      p1: [
        [($) => $.p2 + $.rho * ($.v2 * $.v2 - $.v1 * $.v1), 'That dropped the 1/2 on the kinetic term. Bernoulli uses ½ρv².'],
        [($) => $.p2 + 0.5 * $.rho * ($.v1 * $.v1 - $.v2 * $.v2), 'That swapped the two speeds. The hose is the slower end, so its pressure is the higher one.'],
      ],
    },
  },
  'ch14.fire': {
    traps: {
      v1: [
        [($) => flowSpeed($.Q, Math.PI * $.d1 * $.d1), 'That uses the diameter as a radius, so the area is four times too large.'],
        [($) => flowSpeed($.Q * 1000, circleArea($.d1)), 'That treats litres per second as cubic metres per second. The flow in the formula is a thousand times smaller.'],
      ],
      v2: [
        [($) => flowSpeed($.Q, Math.PI * $.d2 * $.d2), 'That uses the nozzle diameter as a radius. Halve it before you square.'],
        [($) => $.v1, 'That is the hose speed. The nozzle is narrower, so the same volume flow is faster there.'],
      ],
      p2: [
        [($) => $.p1 + 500 * ($.v1 * $.v1 - $.v2 * $.v2), 'That leaves out the rise. The nozzle is higher, so ρgh comes off the pressure as well.'],
        [($) => $.p1 - 1000 * G * $.h, 'That leaves out the kinetic term. The nozzle is much faster than the hose, and that drop is the large one.'],
      ],
    },
  },
  'ch14.tank': {
    traps: {
      v: [
        [($) => 2 * G * $.h, 'That is 2gh, without the square root. Torricelli’s speed is √(2gh), the same as free fall from that height.'],
        [($) => Math.sqrt(G * $.h), 'That left out the 2. The height term in Bernoulli is ρgh, and the kinetic term is ½ρv², so v² = 2gh.'],
      ],
    },
  },
  'ch14.poiseuille': {
    traps: {
      Q: [
        [($) => ($.dp * Math.PI * $.r ** 2) / (8 * $.eta * $.L), 'That uses r². Poiseuille’s law has r⁴, so a smaller pipe cuts the flow much harder than the area alone.'],
        [($) => ($.dp * Math.PI * $.r ** 4) / ($.eta * $.L), 'That left out the 8 in the denominator. The laminar profile puts an 8 there.'],
      ],
    },
  },
  'ch14.reynolds': {
    traps: {
      v: [
        [($) => $.Q / (Math.PI * (2 * $.r) ** 2), 'That used the diameter as the radius of the area. The area is πr², with r the radius you were given.'],
        [($) => $.Q / ($.r * $.r), 'That left out π. The duct is a circle.'],
      ],
      NR: [
        [($) => ($.rho * $.v * $.r) / $.eta, 'That left out the 2. This section writes the Reynolds number with the diameter, 2r.'],
        [($) => 2000, 'That is the line the section draws between laminar and turbulent. The Reynolds number is 2ρvr/η, and then you compare it with 2000.'],
      ],
    },
  },
};
