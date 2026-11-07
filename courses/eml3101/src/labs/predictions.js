/**
 * Predict first: two to four prompts per lab. `expect` is what the lab's own compute says after
 * `apply`, and labs-check confirms it. A prediction nobody would get wrong teaches nothing.
 */

export const PREDICTIONS = {
  mixture: [
    {
      id: 'mx-swap',
      scenario: 'co2',
      ask: 'Swap the kilogram of CO₂ for a kilogram of hydrogen. The second gas is still half the mass. Does its share of the molecules rise, fall or stay the same?',
      apply(s) { s.gasB = 'H2'; },
      watch: [
        { id: 'y', label: 'its mole fraction', get: (c) => c.yB },
        { id: 'x', label: 'its mass fraction', get: (c) => c.xB },
      ],
      mode: 'dir',
      expect: { y: 'bigger', x: 'same' },
      why: 'A hydrogen molecule weighs 2 g/mol against nitrogen’s 28, so a kilogram of it holds fourteen times as many molecules: 93% of them, though still half the mass. CO₂, at 44 g/mol, was only 39%.',
    },
    {
      id: 'mx-double',
      scenario: 'co2',
      ask: 'Double the CO₂ to 2 kg, with the nitrogen, vessel and temperature unchanged. By what factor does the CO₂’s partial pressure change?',
      apply(s) { s.mB = 2; },
      watch: [{ id: 'pB', label: 'the CO₂ partial pressure', get: (c) => c.pB }],
      mode: 'factor',
      factors: [2, 1.44, 1],
      expect: { pB: 2 },
      why: 'Each gas pushes as if it were alone in the vessel: twice the molecules, twice the pressure, N_i R̄T/V. Its mole fraction rises only from 39% to 56%, because the total pressure rises too.',
    },
    {
      id: 'mx-hot',
      scenario: 'co2',
      ask: 'Heat the closed vessel from 300 K to 600 K. What happens to the CO₂’s mole fraction, and to the total pressure?',
      apply(s) { s.T = 600; },
      watch: [
        { id: 'y', label: 'CO₂ mole fraction', get: (c) => c.yB },
        { id: 'p', label: 'total pressure', get: (c) => c.p },
      ],
      mode: 'dir',
      expect: { y: 'same', p: 'bigger' },
      why: 'Heating adds no molecules, so the fractions stay. Every partial pressure doubles with T, and so does their sum, from 146 kPa to 291 kPa.',
    },
  ],
};
