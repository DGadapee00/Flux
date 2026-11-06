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
};
