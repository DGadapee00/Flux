/**
 * Predict first: two to four prompts per lab. `expect` is what the lab's own compute says after
 * `apply`, and labs-check confirms it. A prediction nobody would get wrong teaches nothing.
 */

export const PREDICTIONS = {
  nodes: [
    {
      id: 'nd-switch',
      scenario: 'parallel',
      ask: 'Swap the four branches across two rails for a single loop of four resistors. What happens to the number of nodal equations, and of mesh equations?',
      apply(s) { Object.assign(s, { circuit: 'series', V: 12, Rx: 3 }); },
      watch: [
        { id: 'nodal', label: 'nodal equations', get: (c) => c.nodalCount },
        { id: 'mesh', label: 'mesh equations', get: (c) => c.meshCount },
      ],
      mode: 'dir',
      expect: { nodal: 'bigger', mesh: 'smaller' },
      why: 'The rails have one node above ground and three windows; the loop has three nodes above ground and one window. Count before you choose.',
    },
    {
      id: 'nd-balance',
      scenario: 'bridge',
      ask: 'Change the bottom-right resistor from 2 Ω to 6 Ω, so R₁/R₃ = R₂/R₄. Does any current still cross the bridge?',
      apply(s) { s.balance = true; },
      watch: [{ id: 'cross', label: 'Current across the bridge?', get: (c) => Math.abs(c.bridgeI) > 1e-9, mode: 'bool' }],
      mode: 'bool',
      expect: { cross: false },
      why: 'With the ratios equal, both middle nodes divide the source voltage the same way and sit at the same voltage. No difference, no current.',
    },
    {
      id: 'nd-double-V',
      scenario: 'series',
      ask: 'Double the source voltage in the single loop. By what factor does the current change?',
      apply(s) { s.V *= 2; },
      watch: [{ id: 'I', label: 'the loop current', get: (c) => c.sourceI }],
      mode: 'factor',
      expect: { I: 2 },
      why: 'The circuit is linear: every equation is linear in the sources, so every current and voltage doubles.',
    },
  ],
};
