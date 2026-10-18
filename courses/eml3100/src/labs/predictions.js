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
};
