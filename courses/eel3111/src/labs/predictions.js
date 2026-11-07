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
  phasors: [
    {
      id: 'ph-freq',
      scenario: 'rc345',
      ask: 'Double the frequency from 1 kHz to 2 kHz. Does the voltage across the capacitor rise or fall?',
      apply(s) { s.lf = Math.log10(2000); },
      watch: [{ id: 'VC', label: '|V_C|', get: (c) => c.VCm }],
      mode: 'dir',
      expect: { VC: 'smaller' },
      why: 'The capacitor’s impedance is 1/(ωC): twice the frequency, half the impedance, so it takes a smaller share. |V_C| falls from 4 V to 2.8 V and the resistor takes the rest.',
    },
    {
      id: 'ph-r',
      scenario: 'rc345',
      ask: 'Double the resistor from 1 kΩ to 2 kΩ. By what factor does the voltage across it change?',
      apply(s) { s.lR = Math.log10(2000); },
      watch: [{ id: 'VR', label: '|V_R|', get: (c) => c.VRm }],
      mode: 'factor',
      factors: [1, 1.387, 2],
      expect: { VR: 1.387 },
      why: 'The current falls too: |Z| goes from 1667 Ω to 2404 Ω, so I = 5/|Z| drops from 3 mA to 2.08 mA, and V_R = IR rises only from 3 V to 4.16 V.',
    },
    {
      id: 'ph-tune',
      scenario: 'below',
      ask: 'Tune the source up from 500 Hz to the circuit’s resonance at 1 kHz. Does the capacitor’s voltage rise or fall?',
      apply(s) { s.lf = 3; },
      watch: [{ id: 'VC', label: '|V_C|', get: (c) => c.VCm }],
      mode: 'dir',
      expect: { VC: 'bigger' },
      why: 'At resonance V_L and V_C cancel, so only the 10 Ω limits the current: 0.5 A. That current through the capacitor’s 63 Ω gives 31 V, six times the 5 V source.',
    },
  ],
};
