/**
 * Predict first: two to four prompts per lab. `expect` is what the lab's own compute says after
 * `apply`, and labs-check confirms it. A prediction nobody would get wrong teaches nothing.
 */

export const PREDICTIONS = {
  viscosity: [
    {
      id: 'vi-mercury',
      scenario: 'water',
      ask: 'Swap the water for mercury, which is 13.5 times denser. Same plate, same speed, same gap.',
      apply(s) { s.fluid = 'mercury'; },
      watch: [{ id: 'tau', label: 'the stress on the plate', get: (c) => c.tau }],
      mode: 'factor',
      factors: [13.5, 1.52, 1],
      expect: { tau: 1.52 },
      why: 'Density does not enter the stress. Mercury’s viscosity is 1.526 mPa·s against water’s 1.0016, so the stress goes up 1.52 times.',
    },
    {
      id: 'vi-gap',
      scenario: 'water',
      ask: 'Halve the gap, from 2 mm to 1 mm, at the same plate speed.',
      apply(s) { s.h = 1; },
      watch: [{ id: 'tau', label: 'the stress on the plate', get: (c) => c.tau }],
      mode: 'factor',
      expect: { tau: 2 },
      why: 'The stress follows the gradient U/h. Halving h doubles it.',
    },
    {
      id: 'vi-settle',
      scenario: 'water',
      ask: 'Swap the water for glycerol, 1,400 times more viscous. Does the layer settle to its straight line sooner or later?',
      apply(s) { s.fluid = 'glycerol'; },
      watch: [{ id: 't1', label: 'the time to settle', get: (c) => c.t1 }],
      mode: 'dir',
      expect: { t1: 'smaller' },
      why: 'Momentum spreads at ν = μ/ρ. Glycerol’s ν is about 1,100 times water’s, so it settles in 1.5 ms instead of 1.7 s.',
    },
  ],
};
