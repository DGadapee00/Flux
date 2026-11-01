/**
 * Predict first: two to four prompts per lab. `expect` is what the lab's own compute says after
 * `apply`, and labs-check confirms it. A prediction nobody would get wrong teaches nothing.
 */

export const PREDICTIONS = {
  tank: [
    {
      id: 'tk-double-in',
      scenario: 'fill',
      ask: 'Double the inflow, from 0.5 L/s to 1.0 L/s. The drain stays at 0.1 L/s.',
      apply(s) { s.qin = 0.001; },
      watch: [{ id: 'T', label: 'the time to fill', get: (c) => c.T }],
      mode: 'dir',
      expect: { T: 'smaller' },
      why: 'The net rate goes from 0.4 L/s to 0.9 L/s, so the fill time drops from 750 s to 333 s: less than half, not half.',
    },
    {
      id: 'tk-triple-drain',
      scenario: 'fill',
      ask: 'Triple the drain, from 0.1 L/s to 0.3 L/s. The inflow stays at 0.5 L/s.',
      apply(s) { s.qout = 0.0003; },
      watch: [{ id: 'T', label: 'the time to fill', get: (c) => c.T }],
      mode: 'factor',
      expect: { T: 2 },
      why: 'The net rate halves, from 0.4 L/s to 0.2 L/s, so the fill time doubles, from 750 s to 1,500 s.',
    },
  ],
};
