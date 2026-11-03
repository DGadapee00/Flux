/**
 * Unit 9 coaching. Traps are the wrong value a named mistake gives.
 * Folded into the bank by src/problems/index.js.
 */
import { GRAV, circularOrbitSpeed, escapeSpeed, gravityEnergy, gravityField } from '@flux/subjects/mechanics/gravitation.js';

const YEAR = 365 * 24 * 3600;

export default {
  'ch13.collision': {
    traps: {
      F: [
        [($) => (GRAV * $.m1 * $.m2) / $.r, 'That divides by the separation once. The force has r² in the denominator.'],
        [($) => (GRAV * $.m1 * $.m2) / (($.r / 2) ** 2), 'That takes the given separation as a diameter and halves it. The 10 m in the example is already center to center.'],
      ],
      accel: [
        [($) => $.F / ($.m1 + $.m2), 'That divides the force by both masses. Each vehicle is accelerated by the force divided by its own mass.'],
        [($) => $.F / $.m2, 'That is the acceleration of the second vehicle. This part asks for the first.'],
      ],
    },
  },
  'ch13.galaxies': {
    traps: {
      F: [
        [($) => (GRAV * $.m * $.m) / (($.sep / 2) ** 2), 'That uses the orbital radius about the midpoint. The force depends on the full separation of the centers.'],
        [($) => (GRAV * $.m * $.m) / $.sep, 'That leaves the separation unsquared. Newton’s law has r².'],
      ],
      accel: [
        [($) => $.F, 'That is the force, in newtons. The acceleration is the force divided by one galaxy’s mass.'],
        [($) => (GRAV * $.m) / ($.ly * $.ly), 'That used the number of millions of light-years as a distance in meters. A light-year is 9.5×10¹⁵ m, and the separation is that times a million times the number given.'],
      ],
    },
  },
  'ch13.earth-mass': {
    traps: {
      M: [
        [($) => ($.g * $.R) / GRAV, 'That uses the radius once. g = GM/R², so the mass has R².'],
        [($) => $.g * $.R * $.R, 'That is gR² with G left out. The mass is that product divided by G.'],
      ],
    },
  },
  'ch13.height': {
    traps: {
      g: [
        [($) => gravityField($.M, $.R), 'That is g at the surface. The height has to be added to the radius first.'],
        [($) => gravityField($.M, $.alt), 'That uses the height as the whole distance from the center. The planet’s radius is still there.'],
      ],
    },
  },
  'ch13.weightless': {
    traps: {
      v: [
        [($) => Math.sqrt(2 * $.g * $.R), 'That is the escape speed. Apparent weight vanishes at the circular-orbit speed, which is smaller by √2.'],
        [($) => $.g * $.R, 'That multiplies g by R. The centripetal acceleration is v²/R, so the speed is the square root of gR.'],
      ],
      T: [
        [($) => (Math.PI * $.R) / $.v, 'That is half a revolution. The day is a full circumference, 2πR.'],
        [($) => $.R / $.v, 'That drops the 2π. The equator has to travel the whole circle.'],
      ],
    },
  },
  'ch13.escape': {
    traps: {
      vesc: [
        [($) => circularOrbitSpeed($.M, $.R), 'That is the circular-orbit speed. Escape is √2 times larger, because the total energy has to reach zero.'],
        [($) => 2 * circularOrbitSpeed($.M, $.R), 'That doubles the circular speed. The kinetic energy only has to double, so the speed grows by √2, not by 2.'],
      ],
    },
  },
  'ch13.iss': {
    traps: {
      v: [
        [($) => circularOrbitSpeed($.M, $.R), 'That is the speed of an orbit at the surface. This satellite is higher, so r is the radius plus the height.'],
        [($) => circularOrbitSpeed($.M, $.alt), 'That uses the height as the whole radius. The planet is still under the satellite.'],
      ],
      T: [
        [($) => (2 * Math.PI * $.alt) / $.v, 'That wraps the period around the height instead of around the orbit. The circumference is 2πr, with r from the center.'],
        [($) => (Math.PI * $.r) / $.v, 'That is half an orbit. The period is a full lap.'],
      ],
    },
  },
  'ch13.soyuz': {
    traps: {
      dU: [
        [($) => $.m * 9.81 * $.alt, 'That is mgh with the surface g held fixed. Over hundreds of kilometres the field changes, and the potential is −GMm/r.'],
        [($) => gravityEnergy($.m, $.M, $.alt) - gravityEnergy($.m, $.M, $.R), 'That treats the altitude as a distance from the center. The orbit is at R + h.'],
      ],
      K: [
        [($) => -gravityEnergy($.m, $.M, $.r), 'That is the size of the potential energy. In a circular orbit the kinetic energy is half of that.'],
        [($) => 0.5 * $.m * circularOrbitSpeed($.M, $.R) ** 2, 'That is the kinetic energy of a surface orbit. This craft is at R + h.'],
      ],
      E: [
        [($) => gravityEnergy($.m, $.M, $.r), 'That is the potential energy alone. The total energy of a circular orbit is half of it, still negative.'],
        [($) => -$.E, 'That drops the minus sign. A bound orbit has negative total energy.'],
      ],
      dE: [
        [($) => $.dU, 'That is only the climb in potential energy. The craft also has to be given its orbital kinetic energy.'],
        [($) => $.K, 'That is the kinetic energy in orbit, and it leaves out the change in potential energy. Both are part of what you supply.'],
      ],
    },
  },
  'ch13.moon': {
    traps: {
      M: [
        [($) => (4 * Math.PI * Math.PI * ($.a / 2) ** 3) / (GRAV * $.T * $.T), 'That uses the diameter as if it were the semi-major axis. Kepler’s law takes the center-to-center axis.'],
        [($) => (4 * Math.PI * Math.PI * $.a * $.a) / (GRAV * $.T * $.T), 'That cubes nothing. The axis is cubed, and the period is squared.'],
      ],
    },
  },
  'ch13.halley': {
    traps: {
      a: [
        [($) => Math.cbrt((GRAV * $.M * ($.years / YEAR) ** 2) / (4 * Math.PI * Math.PI)), 'That puts the period in as a number of years and not as seconds. Kepler’s law wants seconds.'],
        [($) => $.peri, 'That is the perihelion. The semi-major axis is larger, and the period is what fixes it.'],
      ],
      aph: [
        [($) => $.a + $.peri, 'That adds the perihelion to the semi-major axis. Aphelion is 2a minus the perihelion.'],
        [($) => 2 * $.a, 'That is the whole long axis. The perihelion is one end of it and has to be subtracted.'],
      ],
    },
  },
  'ch13.speeds': {
    traps: {
      vp: [
        [($) => circularOrbitSpeed($.M, $.peri), 'That is a circular orbit at the perihelion distance. The comet is on an ellipse, and it is moving faster than that circle.'],
        [($) => circularOrbitSpeed($.M, $.a), 'That is the circular speed at the semi-major axis. Perihelion is closer, and the vis-viva speed is higher.'],
      ],
      va: [
        [($) => $.vp, 'That is the perihelion speed again. The far end is the slow end.'],
        [($) => circularOrbitSpeed($.M, $.aph), 'That would be a circle at the aphelion distance. The ellipse is moving more slowly than the circle that would live there.'],
      ],
    },
  },
  'ch13.transfer': {
    traps: {
      a: [
        [($) => $.r2 - $.r1, 'That is the gap between the orbits. The semi-major axis is the average of the two radii.'],
        [($) => $.r1 + $.r2, 'That is the long axis. The semi-major axis is half of it.'],
      ],
      halfT: [
        [($) => 2 * $.halfT, 'That is the full period of the ellipse. The trip from the inner orbit to the outer one is half of it.'],
        [($) => (2 * Math.PI * $.r1) / circularOrbitSpeed($.M, $.r1), 'That is the period of the inner circle. The transfer follows the ellipse, whose axis is the average of the two radii.'],
      ],
      boost: [
        [($) => $.boost + 2 * circularOrbitSpeed($.M, $.r1), 'That adds the circular speed instead of subtracting it. The boost is how much faster the ellipse is than the circle, at the same place.'],
        [($) => escapeSpeed($.M, $.r1) - circularOrbitSpeed($.M, $.r1), 'That is the extra speed to escape the star, not the extra speed to reach the outer circle.'],
      ],
    },
  },
};
