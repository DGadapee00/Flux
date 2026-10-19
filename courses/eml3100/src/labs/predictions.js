/**
 * Predict first, two or three prompts per lab. `expect` is what the lab's own
 * recompute says after `apply`, checked by labs-check. The panel grades the same way.
 */
import { satP, fromC } from '@flux/subjects/thermo';

const watch = (id, label, get) => ({ id, label, get });

export const PREDICTIONS = {
  phase: [
    {
      id: 'ph-pressure',
      scenario: 'boil',
      ask: 'Raise the pressure from 100 kPa to 1 MPa, and keep the mixture half vapour.',
      apply(s) {
        s.p = 1e6;
        const sat = satP(s.p);
        s.h = sat.hf + 0.5 * sat.hfg;
      },
      watch: [
        watch('T', 'the boiling temperature', (c) => c.T),
        watch('vfg', 'the width of the plateau, v_g − v_f', (c) => c.vfg),
      ],
      mode: 'dir',
      expect: { T: 'bigger', vfg: 'smaller' },
      why: 'Water boils at 99.6 °C at 100 kPa and at 179.9 °C at 1 MPa. The vapour is denser at the higher pressure, so $v_g - v_f$ falls from 1.693 to 0.193 m³/kg.',
    },
    {
      id: 'ph-tank',
      scenario: 'tank',
      ask: 'Heat the rigid tank from 120 °C to 140 °C.',
      apply(s) { s.T = fromC(140); },
      watch: [
        watch('x', 'the quality', (c) => c.x),
        watch('p', 'the pressure', (c) => c.p),
      ],
      mode: 'dir',
      expect: { x: 'bigger', p: 'bigger' },
      why: 'The tank holds $v = 0.3396$ m³/kg, larger than the critical volume. As it heats, $v_g$ shrinks toward $v$, so more of the mass is vapour: $x$ rises from 0.380 to 0.667.',
    },
    {
      id: 'ph-tank-liquid',
      scenario: 'tank-liquid',
      ask: 'Heat the rigid tank from 250 °C to 300 °C. It holds mostly liquid.',
      apply(s) { s.T = fromC(300); },
      watch: [watch('x', 'the quality', (c) => c.x)],
      mode: 'dir',
      expect: { x: 'smaller' },
      why: 'This tank holds $v = 0.0015$ m³/kg, less than the critical volume. Heating swells the liquid ($v_f$ grows), so the liquid takes more of the mass: $x$ falls from 0.00508 to 0.00473. Heated further, the tank fills with liquid.',
    },
  ],
  piston: [
    {
      id: 'pi-path',
      scenario: 'isothermal',
      ask: 'Keep the same start and the same final volume, but expand at constant pressure instead of constant temperature.',
      apply(s) { s.process = 'isobaric'; },
      watch: [
        watch('W', 'the work done by the air', (c) => c.W),
        watch('T2', 'the final temperature', (c) => c.T2),
      ],
      mode: 'dir',
      expect: { W: 'bigger', T2: 'bigger' },
      why: 'At constant pressure the pressure stays at 400 kPa instead of falling as $1/V$, so the area grows from 8.79 kJ to 16.0 kJ. Tripling the volume at constant pressure triples the absolute temperature: 350 K becomes 1050 K.',
    },
    {
      id: 'pi-n',
      scenario: 'polytropic',
      ask: 'Raise the polytropic exponent from 1.3 to 1.6, with the same start and the same final volume.',
      apply(s) { s.n = 1.6; },
      watch: [
        watch('W', 'the work done by the air', (c) => c.W),
        watch('T2', 'the final temperature', (c) => c.T2),
      ],
      mode: 'dir',
      expect: { W: 'smaller', T2: 'smaller' },
      why: 'A larger $n$ makes the pressure fall faster with volume. The area drops from 11.3 kJ to 9.41 kJ, and $T_2 = T_1(V_1/V_2)^{n-1}$ drops from 122.8 °C to −11.9 °C.',
    },
    {
      id: 'pi-steam',
      scenario: 'steam',
      ask: 'Let the steam expand further at constant pressure, from 0.08 m³ to 0.12 m³.',
      apply(s) { s.V2 = 0.12; },
      watch: [
        watch('T2', 'the final temperature', (c) => c.T2),
        watch('Q', 'the heat added', (c) => c.Q),
      ],
      mode: 'dir',
      expect: { T2: 'same', Q: 'bigger' },
      why: 'Both volumes are inside the dome, so the temperature stays at 151.8 °C, the boiling point at 500 kPa. The quality rises from 0.425 to 0.639, and the heat needed rises from 237 kJ to 463 kJ.',
    },
  ],

  nozzle: [
    {
      id: 'nz-expand',
      scenario: 'subsonic',
      ask: 'Lower the exit pressure from 400 kPa to 100 kPa, with the same inlet. The nozzle may widen.',
      apply(s) { s.p2 = 100e3; },
      watch: [
        watch('V2', 'the exit speed', (c) => c.V2),
        watch('T2', 'the exit temperature', (c) => c.T2),
        watch('A2', 'the exit area', (c) => c.A2),
      ],
      mode: 'dir',
      expect: { V2: 'bigger', T2: 'smaller', A2: 'bigger' },
      why: 'More pressure drop means more enthalpy turned into speed: $V_2$ rises from 298 to 568 m/s while the air cools from 83.3 °C to −33.2 °C. The flow is the same 1.57 kg/s, but the air is far less dense, so the exit area grows from 13.4 to 19.0 cm².',
    },
    {
      id: 'nz-hot',
      scenario: 'subsonic',
      ask: 'Heat the inlet air from 400 K to 500 K at the same pressures and the same inlet speed.',
      apply(s) { s.T1 = 500; },
      watch: [
        watch('V2', 'the exit speed', (c) => c.V2),
        watch('mdot', 'the mass flow', (c) => c.mdot),
      ],
      mode: 'dir',
      expect: { V2: 'bigger', mdot: 'smaller' },
      why: 'Hotter air has more enthalpy to give up, so $V_2$ rises from 298 to 333 m/s. But it is less dense, and the inlet area and speed are fixed, so $\\dot m = AV/v$ falls from 1.57 to 1.25 kg/s.',
    },
    {
      id: 'nz-steam',
      scenario: 'steam',
      ask: 'Lower the exit pressure from 500 kPa to 100 kPa.',
      apply(s) { s.p2 = 100e3; },
      watch: [
        watch('V2', 'the exit speed', (c) => c.V2),
        watch('x2', 'the vapour fraction', (c) => c.x2),
      ],
      mode: 'dir',
      expect: { V2: 'bigger', x2: 'smaller' },
      why: 'The steam gives up more enthalpy, so $V_2$ rises from 773 to 1068 m/s. The expansion also cools it past saturation: the quality falls from 0.990 to 0.903, so the stream carries some liquid.',
    },
  ],
  devices: [
    {
      id: 'dv-wet',
      scenario: 'turbine',
      ask: 'Let the turbine exhaust be wetter: lower the exit quality from 0.90 to 0.80. The inlet and the exit pressure stay put.',
      apply(s) { s.x2 = 0.8; },
      watch: [
        watch('W', 'the shaft power', (c) => c.W),
        watch('T2', 'the exit temperature', (c) => c.T2),
      ],
      mode: 'dir',
      expect: { W: 'bigger', T2: 'same' },
      why: 'A wetter exhaust has less enthalpy, $h_2 = h_f + x h_{fg}$, so more of $h_1$ left as work: 1774 kW becomes 2252 kW. At 10 kPa the mixture is at 45.8 °C either way.',
    },
    {
      id: 'dv-air',
      scenario: 'throttle-air',
      ask: 'Throttle the air down further, from 100 kPa to 20 kPa.',
      apply(s) { s.p2 = 20e3; },
      watch: [watch('T2', 'the exit temperature', (c) => c.T2)],
      mode: 'dir',
      expect: { T2: 'same' },
      why: 'A throttle keeps $h$ constant. For an ideal gas $h$ depends on $T$ only, so the temperature does not move at any pressure drop: it stays at 27 °C. Steam does cool, because its $h$ also depends on pressure.',
    },
    {
      id: 'dv-mix',
      scenario: 'mixer',
      ask: 'Double the cold flow, from 2 to 4 kg/s. The hot flow stays at 1 kg/s.',
      apply(s) { s.mc = 4; },
      watch: [watch('T2', 'the outlet temperature', (c) => c.T2)],
      mode: 'dir',
      expect: { T2: 'smaller' },
      why: 'The outlet enthalpy is the flow-weighted mean, so more cold water pulls it toward the cold inlet: 30.0 °C falls to 24.0 °C.',
    },
  ],
  heater: [
    {
      id: 'hw-flow',
      scenario: 'shower',
      ask: 'Open a second shower: double the flow from 2.5 to 5 gal/min, with the same inlet and setting.',
      apply(s) { s.gpm = 5; },
      watch: [
        watch('elec', 'the electric power needed', (c) => c.elec),
        watch('maxGpm', 'the most flow the heater can serve', (c) => c.maxGpm),
        watch('Tout', 'the outlet temperature the 27 kW heater delivers', (c) => c.Tout),
      ],
      mode: 'dir',
      expect: { elec: 'bigger', maxGpm: 'same', Tout: 'smaller' },
      why: 'Power is $\\dot m\\,\\Delta h$, so doubling the flow doubles it, from 22.8 to 45.6 kW. The most flow the rating serves does not depend on how much you ask for: 2.96 gal/min. Past it the heater cannot keep up and the water leaves at 35.1 °C instead of 48.9 °C.',
    },
    {
      id: 'hw-cold',
      scenario: 'shower',
      ask: 'Move the heater to a cold climate: the inlet water drops from 15 °C to 5 °C.',
      apply(s) { s.Tin = 278.15; },
      watch: [
        watch('elec', 'the electric power needed', (c) => c.elec),
        watch('maxGpm', 'the most flow the heater can serve', (c) => c.maxGpm),
      ],
      mode: 'dir',
      expect: { elec: 'bigger', maxGpm: 'smaller' },
      why: 'The rise grows from 33.9 K to 43.9 K, so one gallon needs more energy. The shower needs 29.6 kW instead of 22.8, and the 27 kW heater now serves only 2.28 gal/min.',
    },
  ],
};
