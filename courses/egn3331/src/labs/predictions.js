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
  'tension-test': [
    {
      id: 'tt-past',
      scenario: 'steel',
      ask: 'The steel is still elastic, at 0.8 millistrain. Take it to 4 millistrain.',
      apply(s) { s.eps = 0.004; },
      watch: [
        watch('stress', 'the stress', (c) => c.stress),
        watch('slope', 'the slope of the curve', (c) => c.slope),
      ],
      mode: 'dir',
      expect: { stress: 'bigger', slope: 'smaller' },
      why: 'At 0.8 millistrain the stress is $E\\varepsilon = 160$ MPa, on the elastic line. Yield is at 1.25 millistrain. At 4 millistrain the stress is 278 MPa and the slope has fallen from 200 GPa to the 10 GPa tangent modulus.',
    },
    {
      id: 'tt-elastic-off',
      scenario: 'steel',
      ask: 'The steel is still elastic, at 0.8 millistrain. Take the load off.',
      apply(s) { s.unload = 1; },
      watch: [
        watch('shownStress', 'the stress after release', (c) => c.shownStress),
        watch('set', 'the permanent set', (c) => c.set),
      ],
      mode: 'dir',
      expect: { shownStress: 'smaller', set: 'same' },
      why: 'Below yield the unload line is the loading line. Stress falls from 160 MPa to zero, and the permanent set stays zero. A set appears only after the curve has passed the corner.',
    },
    {
      id: 'tt-unload',
      scenario: 'yielded',
      ask: 'The steel is held at 10 millistrain, past yield. Release the load.',
      apply(s) { s.unload = 1; },
      watch: [
        watch('shownStress', 'the stress after release', (c) => c.shownStress),
        watch('set', 'the permanent set', (c) => c.set),
      ],
      mode: 'dir',
      expect: { shownStress: 'smaller', set: 'same' },
      why: 'Releasing the load follows $E$ down to zero stress. The permanent set is already fixed by the peak strain: 8310 µε. It does not change when the load comes off.',
    },
  ],
  poisson: [
    {
      id: 'ps-nu',
      scenario: 'steel',
      ask: 'Keep the axial strain at 1 millistrain. Raise Poisson\'s ratio from 0.30 to 0.45.',
      apply(s) { s.nu = 0.45; },
      watch: [
        watch('lateral', 'the size of the lateral strain', (c) => c.lateral),
        watch('linear', 'the linear volume strain', (c) => c.linear),
      ],
      mode: 'dir',
      expect: { lateral: 'bigger', linear: 'smaller' },
      why: 'Lateral strain is $\\nu\\varepsilon$, so it grows from 0.0003 to 0.00045. The linear volume change is $\\varepsilon(1-2\\nu)$, which falls from 0.0004 to 0.0001.',
    },
    {
      id: 'ps-eps',
      scenario: 'steel',
      ask: 'Keep $\\nu = 0.30$. Double the axial strain, from 1 millistrain to 2.',
      apply(s) { s.eps = 0.002; },
      watch: [
        watch('lateral', 'the lateral strain', (c) => c.lateral),
        watch('linear', 'the linear volume strain', (c) => c.linear),
      ],
      mode: 'factor',
      expect: { lateral: 2, linear: 2 },
      why: 'Both the lateral strain and the linear volume change are proportional to the axial strain. Each doubles: lateral from $-0.0003$ to $-0.0006$, volume strain from $0.0004$ to $0.0008$.',
    },
  ],
  brace: [
    {
      id: 'br-half',
      scenario: 'service',
      ask: 'The brace carries 8 kip, under yield. Cut the load to 4 kip.',
      apply(s) { s.P = s.P / 2; },
      watch: [
        watch('delta', 'the elongation', (c) => c.delta),
        watch('stress', 'the stress', (c) => c.stress),
      ],
      mode: 'factor',
      expect: { delta: 0.5, stress: 0.5 },
      why: 'Both points are elastic, so $\\delta = PL/AE$ and $\\sigma = P/A$. Halving $P$ halves each of them.',
    },
    {
      id: 'br-length',
      scenario: 'service',
      ask: 'Keep 8 kip, and double the length from 10 ft to 20 ft.',
      apply(s) { s.L = s.L * 2; },
      watch: [
        watch('delta', 'the elongation', (c) => c.delta),
        watch('stress', 'the stress', (c) => c.stress),
      ],
      mode: 'factor',
      expect: { delta: 2, stress: 1 },
      why: 'Stress is $P/A$ and does not depend on length. Elongation is $PL/AE$, so twice the length gives twice the stretch.',
    },
    {
      id: 'br-over',
      scenario: 'service',
      ask: 'Take the load from 8 kip up to 20 kip, past yield.',
      apply(s) { s.P = s.P * 2.5; },
      watch: [
        watch('set', 'the permanent set if the load is released', (c) => c.set),
        watch('stress', 'the stress', (c) => c.stress),
      ],
      mode: 'dir',
      expect: { set: 'bigger', stress: 'bigger' },
      why: '8 kip is under the 15.9 kip yield load, so the set is zero. At 20 kip the stress is above 36 ksi and releasing the load leaves a permanent set.',
    },
  ],
  axial: [
    {
      id: 'ax-double',
      scenario: 'uniform',
      ask: 'The bar is uniform and the end load is 20 kN. Double it to 40 kN.',
      apply(s) { s.P = 40e3; },
      watch: [watch('delta', 'the end displacement', (c) => c.delta)],
      mode: 'factor',
      expect: { delta: 2 },
      why: 'Every internal force doubles, and $\\delta = \\sum NL/AE$ is linear in those forces. The end movement doubles.',
    },
    {
      id: 'ax-step-off',
      scenario: 'step',
      ask: 'Drop the step load Q from 12 kN to zero. Leave the end load at 20 kN.',
      apply(s) { s.Q = 0; },
      watch: [
        watch('delta', 'the end displacement', (c) => c.delta),
        watch('Nmax', 'the largest internal force', (c) => c.Nmax),
      ],
      mode: 'dir',
      expect: { delta: 'smaller', Nmax: 'smaller' },
      why: 'Q was adding to the force in the first segment only. Removing it shortens that segment\'s contribution, and the largest internal force falls from 32 kN to 20 kN.',
    },
  ],
  indeterminate: [
    {
      id: 'in-left',
      scenario: 'mid',
      ask: 'The load is at midspan. Slide it to 0.4 m from the left wall.',
      apply(s) { s.a = 0.4; },
      watch: [
        watch('left', 'the left-wall reaction', (c) => c.left),
        watch('right', 'the right-wall reaction', (c) => c.right),
      ],
      mode: 'dir',
      expect: { left: 'bigger', right: 'smaller' },
      why: 'The left segment becomes the short one, so its stiffness rises. It takes $P(L-a)/L = 16$ kN instead of half, and the right wall drops to 4 kN.',
    },
    {
      id: 'in-load',
      scenario: 'mid',
      ask: 'Stay at midspan. Double the load from 20 kN to 40 kN.',
      apply(s) { s.P = 40e3; },
      watch: [
        watch('left', 'the left-wall reaction', (c) => c.left),
        watch('right', 'the right-wall reaction', (c) => c.right),
      ],
      mode: 'factor',
      expect: { left: 2, right: 2 },
      why: 'The split depends only on the two lengths. Doubling P doubles both reactions, and they stay equal.',
    },
  ],
  rail: [
    {
      id: 'rl-length',
      scenario: 'summer',
      ask: 'The rail is held, at +30 °C. Double its length from 20 m to 40 m.',
      apply(s) { s.L = 40; },
      watch: [
        watch('stress', 'the stress', (c) => c.stress, { signed: true }),
        watch('free', 'the free expansion', (c) => c.free),
      ],
      mode: 'factor',
      expect: { stress: 1, free: 2 },
      why: 'Free expansion is $\\alpha\\Delta T L$, so it doubles. The anchors cancel that expansion, and the stress $E\\alpha\\Delta T$ has no length in it.',
    },
    {
      id: 'rl-hotter',
      scenario: 'summer',
      ask: 'Keep the length. Raise the change from +30 °C to +45 °C.',
      apply(s) { s.dT = 45; },
      watch: [
        watch('stress', 'the stress', (c) => c.stress, { signed: true }),
        watch('free', 'the free expansion', (c) => c.free),
      ],
      mode: 'dir',
      expect: { stress: 'smaller', free: 'bigger' },
      why: 'A larger rise means more compression, so the stress, already negative, becomes more negative. The free expansion grows in proportion to $\\Delta T$.',
    },
    {
      id: 'rl-gap',
      scenario: 'joint',
      ask: 'The joint still has a 6 mm gap, at +20 °C. Raise the change to +40 °C.',
      apply(s) { s.dT = 40; },
      watch: [
        watch('stress', 'the stress', (c) => c.stress, { signed: true }),
        watch('free', 'the free expansion', (c) => c.free),
      ],
      mode: 'dir',
      expect: { stress: 'smaller', free: 'bigger' },
      why: 'At +20 °C the rail has not yet closed a 6 mm gap, so the stress is zero. At +40 °C the gap is shut and the extra expansion is compression.',
    },
  ],
};
