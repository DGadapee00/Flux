/**
 * Predict first, two or three prompts per lab. `expect` is what the lab's own
 * recompute says after `apply`, checked by labs-check. The panel grades the same way.
 */

const watch = (id, label, get, o = {}) => ({ id, label, get, ...o });

export const PREDICTIONS = {
  cut: [
    {
      id: 'cut-45',
      scenario: 'square',
      ask: 'The cut is square to the bar. Turn it to 45°.',
      apply(s) { s.theta = 45; },
      watch: [
        watch('tau', 'the shear stress on the cut', (c) => c.tau),
        watch('sigma', 'the normal stress on the cut', (c) => c.sigma),
      ],
      mode: 'dir',
      expect: { tau: 'bigger', sigma: 'smaller' },
      why: 'On the square cut, $\\sigma = P/A = 100$ MPa and $\\tau = 0$. At 45° the plane is $\\sqrt{2}$ times longer, and the force splits evenly: $\\sigma = \\tau = 50$ MPa. The largest shear is not on the cross-section.',
    },
    {
      id: 'cut-past',
      scenario: 'shear45',
      ask: 'Turn the cut further, from 45° to 60°.',
      apply(s) { s.theta = 60; },
      watch: [
        watch('tau', 'the shear stress on the cut', (c) => c.tau),
        watch('sigma', 'the normal stress on the cut', (c) => c.sigma),
      ],
      mode: 'dir',
      expect: { tau: 'smaller', sigma: 'smaller' },
      why: '$\\tau = (P/2A)\\sin 2\\theta$ peaks at 45°. At 60° it is $50 \\sin 120° = 43.3$ MPa, and $\\sigma = 100\\cos^2 60° = 25$ MPa.',
    },
    {
      id: 'cut-area',
      scenario: 'tension',
      ask: 'Double the bar\'s area, from 200 mm² to 400 mm², with the cut still at 30°.',
      apply(s) { s.A = 400e-6; },
      watch: [
        watch('sigma', 'the normal stress on the cut', (c) => c.sigma),
        watch('tau', 'the shear stress on the cut', (c) => c.tau),
      ],
      mode: 'factor',
      expect: { sigma: 0.5, tau: 0.5 },
      why: 'Both stresses are $P/A$ times a factor of the angle alone. Doubling $A$ halves them: $\\sigma$ goes from 75 to 37.5 MPa, and $\\tau$ from 43.3 to 21.7 MPa.',
    },
  ],
  'truss-stress': [
    {
      id: 'ts-web',
      scenario: 'even',
      ask: 'Every member has 400 mm². Thin the web (the verticals and the diagonal) to 300 mm².',
      apply(s) { s.Aw = 300e-6; },
      watch: [
        watch('Fmax', 'the largest member force', (c) => c.Fmax),
        watch('sigmaMax', 'the largest member stress', (c) => c.sigmaMax),
        watch('webGoverns', 'is the most stressed member now in the web?', (c) => c.webGoverns, { mode: 'bool' }),
      ],
      mode: 'dir',
      expect: { Fmax: 'same', sigmaMax: 'bigger', webGoverns: true },
      why: 'The forces do not depend on the areas: FD still carries 47.1 kN. CF carries 40.0 kN on 300 mm², so its stress is 133 MPa, above FD\'s 118 MPa.',
    },
    {
      id: 'ts-load',
      scenario: 'even',
      ask: 'Double the loads: P from 20 kN to 40 kN, and 2P from 40 kN to 80 kN.',
      apply(s) { s.P = 40e3; },
      watch: [
        watch('sigmaMax', 'the largest member stress', (c) => c.sigmaMax),
        watch('FS', 'the factor of safety', (c) => c.FS),
      ],
      mode: 'factor',
      expect: { sigmaMax: 2, FS: 0.5 },
      why: 'A statically determinate truss is linear: every member force doubles with the load. The largest stress goes from 118 to 236 MPa, and the factor of safety falls from 2.12 to 1.06.',
    },
  ],
  pins: [
    {
      id: 'pin-double',
      scenario: 'single',
      ask: 'Replace the lap joint with a clevis, so the pin is cut on two planes.',
      apply(s) {
        s.planes = 2;
        s.tc = 8e-3;
      },
      watch: [
        watch('tau', 'the shear stress in the pin', (c) => c.tau),
        watch('bearBar', 'the bearing stress on the bar', (c) => c.bearBar),
      ],
      mode: 'factor',
      factors: [2, 1, 0.5],
      expect: { tau: 0.5, bearBar: 1 },
      why: 'Two planes share the 10 kN, so each carries 5 kN and $\\tau$ falls from 88.4 to 44.2 MPa. The bar still presses all 10 kN on the pin over $d\\,t$, so its bearing stress stays 69.4 MPa.',
    },
    {
      id: 'pin-thin',
      scenario: 'double',
      ask: 'Keep the clevis, but make the bar 5 mm thick instead of 12 mm.',
      apply(s) { s.t = 5e-3; },
      watch: [
        watch('bearingGoverns', 'does bearing now govern?', (c) => c.bearingGoverns, { mode: 'bool' }),
        watch('FS', 'the factor of safety', (c) => c.FS),
      ],
      mode: 'dir',
      expect: { bearingGoverns: true, FS: 'smaller' },
      why: 'The pin\'s shear does not change: 44.2 MPa, 0.44 of its allowable. The bar\'s bearing stress rises to $10\\ \\mathrm{kN}/(12 \\times 5\\ \\mathrm{mm^2}) = 167$ MPa, 0.83 of its allowable. The factor of safety falls from 2.26 to 1.20.',
    },
  ],
  shackle: [
    {
      id: 'sh-proof',
      scenario: 'wll',
      ask: 'Raise the load from the working load to the proof load, twice that.',
      apply(s) { s.P = 8800; },
      watch: [
        watch('tau', 'the shear stress in the pin', (c) => c.tau),
        watch('planes', 'the number of shear planes', (c) => c.planes),
      ],
      mode: 'factor',
      expect: { tau: 2, planes: 1 },
      why: 'Average shear follows the load. 7.06 ksi at 4400 lbf becomes 14.12 ksi at 8800 lbf.',
    },
    {
      id: 'sh-one',
      scenario: 'wll',
      ask: 'Count the pin on one shear plane instead of two.',
      apply(s) { s.planes = 1; },
      watch: [
        watch('tau', 'the shear stress in the pin', (c) => c.tau),
        watch('planes', 'the number of shear planes', (c) => c.planes),
      ],
      mode: 'factor',
      expect: { tau: 2, planes: 0.5 },
      why: 'One plane carries the whole 4400 lbf. The stress doubles, from 7.06 ksi to 14.12 ksi.',
    },
    {
      id: 'sh-jaw',
      scenario: 'wll',
      ask: 'Open the jaw from 0.81 in to 1.25 in. Keep the pin and the load.',
      apply(s) { s.jaw = 1.25; },
      watch: [watch('tau', 'the shear stress in the pin', (c) => c.tau)],
      mode: 'dir',
      expect: { tau: 'same' },
      why: 'The jaw opening is not in the shear formula. The pin area and the load are unchanged, so the stress stays 7.06 ksi.',
    },
  ],
};
