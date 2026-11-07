/**
 * Predict first: two to four prompts per lab. `expect` is what the lab's own compute says after
 * `apply`, and labs-check confirms it. A prediction nobody would get wrong teaches nothing.
 */

export const PREDICTIONS = {
  kepler: [
    {
      id: 'kp-quarter',
      scenario: 'gto-apogee',
      ask: 'Start at apogee, half a period after perigee. Move the clock back to a quarter period. Is the craft less than, exactly, or more than 90° from perigee?',
      apply(s) { s.frac = 0.25; },
      watch: [{ id: 'more', label: 'More than 90° round?', get: (c) => c.nu > Math.PI / 2 + 1e-9, mode: 'bool' }],
      mode: 'bool',
      expect: { more: true },
      why: 'The craft is fastest at perigee, so it covers the first stretch quickly: in a quarter of the period it reaches 156°, not 90°.',
    },
    {
      id: 'kp-speed',
      scenario: 'gto',
      ask: 'Move from a quarter period to apogee, half a period after perigee. What happens to the craft’s speed?',
      apply(s) { s.frac = 0.5; },
      watch: [{ id: 'v', label: 'the speed', get: (c) => c.v }],
      mode: 'dir',
      expect: { v: 'smaller' },
      why: 'Vis-viva, v² = μ(2/r − 1/a): the farther from Earth, the slower. At apogee the transfer orbit crawls at 1.6 km/s.',
    },
    {
      id: 'kp-iss',
      scenario: 'iss',
      ask: 'On the nearly circular ISS orbit, at a quarter period, is the craft within 0.1° of 90°?',
      apply() {},
      watch: [{ id: 'quarter', label: 'Within 0.1° of 90°?', get: (c) => Math.abs((c.nu * 180) / Math.PI - 90) < 0.1, mode: 'bool' }],
      mode: 'bool',
      expect: { quarter: true },
      why: 'With e = 0.0005 the speed barely changes, so equal times give equal angles: 90.06°.',
    },
  ],
};
