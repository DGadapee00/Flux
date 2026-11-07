/**
 * Unit 1 coaching: traps (the wrong value a named mistake gives) and their fixes, per template.
 * Folded into the bank by src/problems/index.js.
 */
import { interferenceChance, spread } from '@flux/subjects/design/tolerancing.js';
import { normCdf } from '@flux/subjects/stats/dist.js';
import { FITS } from '../bank/u1.js';

const F = ($) => FITS[$.fit] || FITS.transition;
const sds = ($) => {
  const f = F($);
  const a = spread(f.holeLo, f.holeHi, { cp: $.cp });
  const b = spread(f.shaftLo, f.shaftHi, { cp: $.cp });
  return { mean: interferenceChance(a, b).mean, a: a.sd, b: b.sd };
};

export default {
  'u1.1.fit-limits': {
    traps: {
      cMin: [
        [($) => F($).holeLo - F($).shaftLo, 'Pair the smallest hole with the largest shaft. That pair is the tightest.'],
        [($) => F($).holeHi - F($).shaftHi, 'That pairs the two upper limits. The tightest pair is the smallest hole with the largest shaft.'],
      ],
      cMax: [
        [($) => F($).holeHi - F($).shaftHi, 'Pair the largest hole with the smallest shaft. That pair is the loosest.'],
        [($) => F($).holeLo - F($).shaftLo, 'That pairs the two lower limits. The loosest pair is the largest hole with the smallest shaft.'],
      ],
    },
  },
  'u1.2.interference-share': {
    traps: {
      p: [
        [($) => { const s = sds($); return normCdf(0, s.mean, s.a + s.b) * 100; }, 'Spreads add as variances: σ_c = √(σ_D² + σ_d²), not σ_D + σ_d.'],
        [($) => { const s = sds($); return normCdf(0, s.mean, s.a) * 100; }, 'Both parts vary. Combine the hole’s and the shaft’s spreads.'],
      ],
    },
  },
  'u1.4.stack-bands': {
    traps: {
      worst: [
        [($) => $.T * Math.sqrt($.n), 'That is the RSS band. The worst case adds every tolerance: nT.'],
        [($) => $.T, 'That is one part. The worst case puts all of them at the same extreme.'],
      ],
      rss: [
        [($) => $.n * $.T, 'That is the worst case. RSS adds the squares: T√n.'],
        [($) => 3 * $.T * Math.sqrt($.n), 'Each T is already 3σ, so the stack’s 3σ band is T√n.'],
      ],
    },
  },
};
