/**
 * Unit 1 coaching: traps (the wrong value a named mistake gives) and their fixes, per template.
 * Folded into the bank by src/problems/index.js.
 */
import { MU_EARTH } from '@flux/subjects/mechanics/kepler.js';
import { ORBITS } from '../../labs/kepler.js';
import { hohmannBurn, newApogee, orbitOf, transferHours } from '../bank/u1.js';

export default {
  'u1.5.hohmann': {
    traps: {
      dv: [
        [($) => hohmannBurn($, true, true), 'A Hohmann burn is not the difference of the two circular speeds: each burn moves between a circle and the transfer ellipse, at its own end.'],
        [($) => hohmannBurn($, false), 'Radii are measured from Earth’s centre: add 6378 km to each altitude.'],
      ],
    },
  },
  'u1.6.transfer-time': {
    traps: {
      t: [
        [($) => transferHours($, false), 'The coast is half the ellipse, not a whole period: t = π√(a³/μ).'],
        [($) => transferHours($, true, false), 'Measure the radii from Earth’s centre: add 6378 km to each altitude before averaging.'],
      ],
    },
  },
  'u1.7.new-apogee': {
    traps: {
      ha: [
        [($) => newApogee($, 'a'), 'That is the semi-major axis. The apogee is the far end: r_a = 2a − r_p.'],
        [($) => newApogee($, 'radius'), 'That is the apogee radius from Earth’s centre. Subtract 6378 km for the altitude.'],
      ],
    },
  },
  'u1.1.period': {
    traps: {
      T: [
        [($) => (2 * Math.PI * Math.sqrt(((ORBITS[$.orbit].hp + ORBITS[$.orbit].ha) / 2) ** 3 / MU_EARTH)) / 3600, 'Altitudes are above the surface: add Earth’s radius to both before averaging.'],
        [($) => (2 * Math.PI * orbitOf($.orbit).a ** 1.5) / MU_EARTH / 3600, 'T = 2π√(a³/μ): the square root covers μ too.'],
      ],
    },
  },
  'u1.2.speed': {
    traps: {
      v: [
        [($) => Math.sqrt(MU_EARTH / ($.where === 'perigee' ? orbitOf('gto').rp : orbitOf('gto').ra)), 'That is the circular speed at that radius. On an ellipse use vis-viva, v² = μ(2/r − 1/a).'],
        [($) => { const o = orbitOf('gto'); const h = $.where === 'perigee' ? 250 : 35786; return Math.sqrt(MU_EARTH * (2 / h - 1 / o.a)); }, 'r is measured from Earth’s centre, not from the surface.'],
      ],
    },
  },
  'u1.3.anomaly': {
    traps: {
      nu: [
        [() => 90, 'A quarter of the time is not a quarter of the angle: the craft is fastest at perigee.'],
        [($) => { const o = orbitOf($.orbit); let E = Math.PI / 2; for (let k = 0; k < 50; k++) E -= (E - o.e * Math.sin(E) - Math.PI / 2) / (1 - o.e * Math.cos(E)); return (E * 180) / Math.PI; }, 'That is the eccentric anomaly E. Convert it to the true anomaly ν.'],
      ],
    },
  },
};
