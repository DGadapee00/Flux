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
  noise: [
    {
      id: 'nz-wide',
      scenario: 'cubesat',
      ask: 'Widen the receiver’s band a hundredfold, from 10 kHz to 1 MHz, with the same signal. By what factor does the signal-to-noise ratio change?',
      apply(s) { s.lB = 6; },
      watch: [{ id: 'snr', label: 'S/N', get: (c) => c.snr }],
      mode: 'factor',
      factors: [0.01, 0.1, 1],
      expect: { snr: 0.01 },
      why: 'The noise is k_B T B, so a hundred times the band lets in a hundred times the noise. S/N falls by 20 dB, from 11.6 dB to −8.4 dB, and the bits are lost.',
    },
    {
      id: 'nz-cold',
      scenario: 'cubesat',
      ask: 'Cool the receiver from a system temperature of 500 K to 100 K. By what factor does the signal-to-noise ratio change?',
      apply(s) { s.lT = 2; },
      watch: [{ id: 'snr', label: 'S/N', get: (c) => c.snr }],
      mode: 'factor',
      factors: [1, 5, 25],
      expect: { snr: 5 },
      why: 'The noise power is proportional to the temperature, not its square or fourth power: a fifth of the temperature, a fifth of the noise, 7 dB better.',
    },
    {
      id: 'nz-narrow',
      scenario: 'weak',
      ask: 'This signal is 15 dB weaker and a sixth of the bits come out wrong. Narrow the band, and the bit rate with it, from 10 kHz to 1 kHz. Does fewer than one bit in a hundred now come out wrong?',
      apply(s) { s.lB = 3; },
      watch: [{ id: 'readable', label: 'Fewer than 1 in 100 bits wrong', get: (c) => c.readable, mode: 'bool' }],
      mode: 'bool',
      expect: { readable: true },
      why: 'A tenth of the band lets in a tenth of the noise, so E_b/N_0 rises 10 dB, from −3.4 dB to 6.6 dB, and the error rate falls from 0.17 to 0.0012. The price is a tenth of the data rate.',
    },
  ],
};
