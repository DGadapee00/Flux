/**
 * Predict first: two to four prompts per lab. `expect` is what the lab's own compute says after
 * `apply`, and labs-check confirms it. A prediction nobody would get wrong teaches nothing.
 */
import { ALPHA } from '@flux/subjects/heat/rod.js';

export const PREDICTIONS = {
  rod: [
    {
      id: 'rd-steel',
      scenario: 'copper',
      ask: 'Swap the copper rod for carbon steel and wait the same 4.3 s. Is the middle of the rod hotter, colder or the same?',
      apply(s) { s.material = 'steel'; s.Fo *= ALPHA.steel / ALPHA.copper; },
      watch: [{ id: 'mid', label: 'the middle’s temperature', get: (c) => c.midC }],
      mode: 'dir',
      expect: { mid: 'bigger' },
      why: 'Steel’s diffusivity is a sixth of copper’s, so in the same time it has gone a sixth as far in Fo = αt/L². The heat has had less time, in effect, to reach the ends.',
    },
    {
      id: 'rd-double-L',
      scenario: 'copper',
      ask: 'Make the rod twice as long, with the same starting shape. How long until it reaches the same profile?',
      apply(s) { s.L *= 2; },
      watch: [{ id: 't', label: 'the time to reach this profile', get: (c) => c.t }],
      mode: 'factor',
      expect: { t: 4 },
      why: 'The profile depends only on Fo = αt/L². Twice the length needs four times the time: heat spreads a distance that grows as the square root of time.',
    },
    {
      id: 'rd-ripple',
      scenario: 'wiggle',
      ask: 'Run time on to Fo = 0.02. Will the ripple be down to under 1% of its start while the hump still has over 80% of its own?',
      apply(s) { s.Fo = 0.02; },
      watch: [{ id: 'gone', label: 'Ripple under 1%, hump over 80%?', get: (c) => c.rippleShare < 0.01 && c.humpShare > 0.8, mode: 'bool' }],
      mode: 'bool',
      expect: { gone: true },
      why: 'The ripple is the fifth mode, which fades as exp(−25π²Fo): 0.7% is left. The hump fades as exp(−π²Fo): 82% is left.',
    },
  ],
  radiation: [
    {
      id: 'rd-double',
      scenario: 'hot',
      ask: 'Double the coil’s temperature, from 1200 K to 2400 K. By what factor does the power a black body emits change, and the wavelength of its peak?',
      apply(s) { s.lT += Math.log10(2); },
      watch: [
        { id: 'Eb', label: 'σT⁴', get: (c) => c.Eb },
        { id: 'peak', label: 'the peak wavelength', get: (c) => c.peak },
      ],
      mode: 'factor',
      factors: [0.5, 2, 4, 16],
      expect: { Eb: 16, peak: 0.5 },
      why: 'Emission grows as T⁴: 2⁴ = 16. The peak moves as 1/T, to half the wavelength: hotter things glow bluer.',
    },
    {
      id: 'rd-metal',
      scenario: 'white',
      ask: 'Swap the white paint for polished aluminum. Does a plate of it get hotter or cooler in full sunlight?',
      apply(s) { s.surface = 'metal'; },
      watch: [{ id: 'T', label: 'the plate’s temperature in sunlight', get: (c) => c.plateT }],
      mode: 'dir',
      expect: { T: 'bigger' },
      why: 'Aluminum absorbs less sunlight than black paint, but it emits far less of its own glow: ε = 0.05. What matters is α/ε, and it is three times white paint’s.',
    },
    {
      id: 'rd-black',
      scenario: 'white',
      ask: 'Paint the plate black instead of white. Is it hotter or cooler in full sunlight?',
      apply(s) { s.surface = 'black'; },
      watch: [{ id: 'T', label: 'the plate’s temperature in sunlight', get: (c) => c.plateT }],
      mode: 'dir',
      expect: { T: 'bigger' },
      why: 'Both paints are near black in the infrared, so they shed heat alike; black absorbs far more sunlight. α/ε rises from 0.24 to 1.',
    },
  ],
  resistance: [
    {
      id: 'rs-no-wool',
      scenario: 'house',
      ask: 'Take the 90 mm of glass wool out of the wall. By about what factor does the heat flux change?',
      apply(s) { s.ins = 0; },
      watch: [{ id: 'q', label: 'the heat flux', get: (c) => c.q }],
      mode: 'dir',
      expect: { q: 'bigger' },
      why: 'The glass wool is 2.25 of the wall’s 2.63 m²·K/W. Without it the total falls to 0.38, and the flux rises nearly sevenfold, from 9.5 to 65 W/m².',
    },
    {
      id: 'rs-double-wool',
      scenario: 'house',
      ask: 'Double the glass wool to 180 mm. Does the heat flux halve?',
      apply(s) { s.ins = 0.18; },
      watch: [{ id: 'half', label: 'Does the flux halve or better?', get: (c) => c.q <= 9.490087245 / 2, mode: 'bool' }],
      mode: 'bool',
      expect: { half: false },
      why: 'Only the wool’s resistance doubles. The films, drywall and brick stay, so the total goes from 2.63 to 4.88, and the flux falls by a factor of 1.85, not 2.',
    },
    {
      id: 'rs-wire',
      scenario: 'wire',
      ask: 'Thicken the wire’s insulation from 6 mm to 9 mm outer radius. Does it lose more heat or less?',
      apply(s) { s.r2 = 0.009; },
      watch: [{ id: 'Q', label: 'the heat loss per metre', get: (c) => c.Q }],
      mode: 'dir',
      expect: { Q: 'bigger' },
      why: 'Both radii are below the critical radius k/h = 10 mm, where added surface beats added resistance: more insulation, more loss.',
    },
  ],
};
