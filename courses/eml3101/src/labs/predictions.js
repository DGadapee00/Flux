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
  nozzle: [
    {
      id: 'nz-choked',
      scenario: 'shock',
      ask: 'The throat is sonic and 1.17 kg/s flows with p_b = 400 kPa. Halve the back pressure, to 200 kPa. What happens to the mass flow?',
      apply(s) { s.pb = 200; },
      watch: [{ id: 'm', label: 'mass flow', get: (c) => c.mdot }],
      mode: 'dir',
      expect: { m: 'same' },
      why: 'Once the throat is sonic, nothing downstream can signal upstream through it: pressure waves travel at the speed of sound, and the flow there moves at it. The mass flow is set by p₀, T₀ and the throat alone.',
    },
    {
      id: 'nz-sub',
      scenario: 'subsonic',
      ask: 'At p_b = 485 kPa the flow is subsonic throughout. Lower p_b to 475 kPa. Does the mass flow change?',
      apply(s) { s.pb = 475; },
      watch: [{ id: 'm', label: 'mass flow', get: (c) => c.mdot }],
      mode: 'dir',
      expect: { m: 'bigger' },
      why: 'Not choked yet: the throat is at Mach 0.46, and a lower back pressure draws more through, from 0.82 to 1.05 kg/s. That stops at 469 kPa, where the throat reaches Mach 1.',
    },
    {
      id: 'nz-walk',
      scenario: 'shock',
      ask: 'A shock stands in the diverging part with p_b = 400 kPa. Lower p_b to 300 kPa. Does the shock move towards the exit or the throat, and does it cost more or less stagnation pressure?',
      apply(s) { s.pb = 300; },
      watch: [
        { id: 'x', label: 'shock position', get: (c) => c.shockX },
        { id: 'loss', label: 'stagnation pressure lost', get: (c) => c.p0loss },
      ],
      mode: 'dir',
      expect: { x: 'bigger', loss: 'bigger' },
      why: 'The shock moves downstream, from 73% to 92% of the length, where the supersonic flow has reached Mach 2.05 instead of 1.66. A stronger shock wastes more: the loss rises from 13% to 30% of p₀.',
    },
  ],
};
