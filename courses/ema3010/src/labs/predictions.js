/**
 * Predict first: two to four prompts per lab. `expect` is what the lab's own compute says after
 * `apply`, and labs-check confirms it. A prediction nobody would get wrong teaches nothing.
 */

export const PREDICTIONS = {
  bond: [
    {
      id: 'bd-shallow',
      scenario: 'deep',
      ask: 'Swap the deep, wide 4 eV well for a shallow, narrow 2 eV one at the same bond length. What happens to the depth and to the stiffness?',
      apply(s) { Object.assign(s, { shape: 'narrow', E0: 2 }); },
      watch: [
        { id: 'E0', label: 'the well’s depth', get: (c) => c.E0 },
        { id: 'k', label: 'the bond’s stiffness', get: (c) => c.k },
      ],
      mode: 'dir',
      expect: { E0: 'smaller', k: 'bigger' },
      why: 'Stiffness is the curvature at the bottom, k = nmE₀/r₀². Half the depth, but n·m goes from 3 to 12: four times the shape factor, so twice the stiffness.',
    },
    {
      id: 'bd-double-depth',
      scenario: 'nacl',
      ask: 'Keep the shape and the bond length, and make the well twice as deep.',
      apply(s) { s.E0 *= 2; },
      watch: [
        { id: 'k', label: 'the stiffness', get: (c) => c.k },
        { id: 'r0', label: 'the bond length', get: (c) => c.numeric.r0 },
      ],
      mode: 'factor',
      factors: [4, 2, 1, 0.5],
      expect: { k: 2, r0: 1 },
      why: 'With the shape fixed, the whole curve scales by the depth, so its curvature doubles too. The bottom stays at r₀.',
    },
    {
      id: 'bd-squeeze',
      scenario: 'nacl',
      ask: 'Squeeze the ion pair from 1.4 r₀ in to 0.85 r₀. Which way does the force on each ion point now?',
      apply(s) { s.x = 0.85; },
      watch: [{ id: 'apart', label: 'Do the ions now push apart?', get: (c) => c.Fr > 0, mode: 'bool' }],
      mode: 'bool',
      expect: { apart: true },
      why: 'Inside r₀ the curve rises as r shrinks, so the force, minus its slope, points outward. The repulsion grows as 1/r⁹ and wins.',
    },
  ],
};
