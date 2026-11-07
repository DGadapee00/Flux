/**
 * Unit 1 coaching: traps (the wrong value a named mistake gives) and their fixes, per template.
 * Folded into the bank by src/problems/index.js.
 */
import { MU_EARTH } from '@flux/subjects/mechanics/kepler.js';
import { ORBITS } from '../../labs/kepler.js';
import { orbitOf } from '../bank/u1.js';

export default {
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
