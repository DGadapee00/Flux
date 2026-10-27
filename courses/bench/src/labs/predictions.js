/**
 * Predict first: two to four prompts per lab. `expect` is what the lab's own compute says after
 * `apply`, and labs-check confirms it. A prediction nobody would get wrong teaches nothing.
 */

export const PREDICTIONS = {
  breadboard: [
    {
      id: 'bb-along',
      scenario: 'series',
      ask: 'Pull R₂ out and plug it back in turned 90°, both legs in row 14. R₁ stays where it is. Does any current still flow through R₁?',
      apply(s) { s.fault = 'along'; },
      watch: [{ id: 'flows', label: 'current flows', get: (c) => c.flows, mode: 'bool' }],
      expect: { flows: false },
      why: 'Both of R₂’s legs are now in one strip, so it joins row 14 to itself. Nothing joins row 14 to row 18 any more, so the series chain is open and no current flows anywhere, R₁ included.',
    },
    {
      id: 'bb-jumper',
      scenario: 'series',
      ask: 'A stray jumper lands between row 14 and row 18, beside R₂. What happens to the current from the supply, and to the voltage of row 14?',
      apply(s) { s.fault = 'jumper'; },
      watch: [
        { id: 'I1', label: 'the current from the supply', get: (c) => c.I1 },
        { id: 'Vmid', label: 'the voltage of row 14', get: (c) => c.Vmid },
      ],
      mode: 'dir',
      expect: { I1: 'bigger', Vmid: 'smaller' },
      why: 'The jumper shorts R₂: rows 14 and 18 become one node at 0 V. Only R₁ is left, so the current rises from 1.56 mA to 5 mA, and row 14 drops from 3.44 V to 0 V.',
    },
    {
      id: 'bb-bridge',
      scenario: 'split',
      ask: 'The rails on this board are split in the middle and the circuit sits on the far half. Add a short jumper across the gap on each rail. Does current flow now?',
      apply(s) { s.bridge = true; },
      watch: [{ id: 'flows', label: 'current flows', get: (c) => c.flows, mode: 'bool' }],
      expect: { flows: true },
      why: 'The jumpers join the two halves of each rail, so the far half is at 5 V and 0 V too. A long board with split rails is two boards until you bridge it.',
    },
  ],
  meter: [
    {
      id: 'mt-amps-across',
      scenario: 'volts',
      ask: 'The leads are across R₂. Turn the dial to milliamps and leave the leads where they are. What happens to the current through R₁?',
      apply(s) { s.mode = 'A'; },
      watch: [{ id: 'iR1', label: 'the current through R₁', get: (c) => c.iR1 }],
      mode: 'factor',
      expect: { iR1: 2 },
      why: 'On amps the meter is 0.5 Ω, a near short across R₂. Current bypasses R₂ through the meter, so only R₁ is left in the path and the current roughly doubles, from 0.45 mA to 0.90 mA. The meter reads that 0.90 mA, which is not the circuit’s current.',
    },
    {
      id: 'mt-live-ohms',
      scenario: 'ohms',
      ask: 'The meter reads R₂ as 10.0 kΩ with the battery off. Reconnect the battery and leave the meter on ohms. Does it still read 10 kΩ?',
      apply(s) { s.power = true; },
      watch: [{ id: 'ohmsOk', label: 'it reads R₂ correctly', get: (c) => c.ohmsOk, mode: 'bool' }],
      expect: { ohmsOk: false },
      why: 'The ohmmeter works out R from its own small test current and the voltage that current makes. The battery adds 4.5 V of its own across R₂, so the meter’s arithmetic gives nonsense. Measure resistance with the power off.',
    },
    {
      id: 'mt-loading',
      scenario: 'volts',
      ask: 'Swap both resistors for 1 MΩ ones. The voltage across R₂ is still 4.5 V with no meter. What happens to the voltmeter’s error?',
      apply(s) { s.R1 = 1e6; s.R2 = 1e6; },
      watch: [{ id: 'err', label: 'the size of the meter’s error', get: (c) => c.error }],
      mode: 'dir',
      expect: { err: 'bigger' },
      why: 'The meter’s 10 MΩ sits in parallel with R₂. Against 10 kΩ it changes almost nothing, 0.05%. Against 1 MΩ it pulls R₂’s side down to 0.91 MΩ, and the reading falls to 4.29 V: almost 5% low.',
    },
  ],
  'usb-rail': [
    {
      id: 'ur-double',
      scenario: 'leds',
      ask: 'Add five more LEDs, so the board draws 200 mA instead of 100 mA. What happens to the voltage lost in the cable?',
      apply(s) { s.mA = 200; },
      watch: [{ id: 'cableDrop', label: 'the voltage lost in the cable', get: (c) => c.cableDrop }],
      mode: 'factor',
      tol: 0.02,
      expect: { cableDrop: 2 },
      why: 'The cable is a fixed 0.43 Ω, and the voltage across a resistance is IR. Twice the current, twice the drop: 43 mV becomes 85 mV.',
    },
    {
      id: 'ur-gauge',
      scenario: 'motor',
      ask: 'The 1 A motor pulls the rails below USB’s 4.75 V floor through a thin 28 AWG cable. Swap in a 22 AWG cable of the same length. Are the rails still below 4.75 V?',
      apply(s) { s.awg = 22; },
      watch: [{ id: 'low', label: 'the rails are below 4.75 V', get: (c) => c.low, mode: 'bool' }],
      expect: { low: false },
      why: '22 AWG copper has a quarter of 28 AWG’s resistance per metre. The cable drop falls from 0.39 V to 0.10 V, and the rails come back up to 4.90 V.',
    },
    {
      id: 'ur-life',
      scenario: 'leds',
      ask: 'Double the load from 100 mA to 200 mA on the same power bank. How long does the bank last?',
      apply(s) { s.mA = 200; },
      watch: [{ id: 'hours', label: 'how long the bank lasts', get: (c) => c.hours }],
      mode: 'factor',
      tol: 0.02,
      expect: { hours: 0.5 },
      why: 'The bank holds a fixed amount of energy, about 31 Wh after conversion. Twice the power drawn spends it in half the time: about 61 hours becomes about 31.',
    },
  ],
};
