export default {
  id: 'strengthening',
  title: 'Strengthening mechanisms',
  label: ['Strengthening'],
  subject: 'matsci',
  courses: ['ema3010'],
  eq: String.raw`\sigma_y = \sigma_0 + k_y\,d^{-1/2}\ \text{(Hall–Petch)}`,
  idea: String.raw`A metal yields when dislocations move, so every way of strengthening it puts obstacles in their path. Grain boundaries stop them, and smaller grains mean more boundaries, giving the Hall–Petch rise with \(d^{-1/2}\). Solute atoms strain the lattice around them; cold work multiplies dislocations until they tangle; fine precipitates pin them. Those come from quenching the alloy to trap the solute, then ageing it so tiny particles form; slow cooling grows coarse ones that barely help. Each one costs ductility, and annealing gives it back.`,
  requires: ['dislocations', 'phase-diagrams'],
  sources: [
    {
      title: 'Grain boundary strengthening (Wikipedia)',
      url: 'https://en.wikipedia.org/wiki/Grain_boundary_strengthening',
      kind: 'Reference article',
      level: 'Course level',
      why: 'Hall–Petch, its pile-up argument and where it stops working.',
      checked: '2026-11-06',
    },
    {
      title: 'Precipitation hardening (Wikipedia)',
      url: 'https://en.wikipedia.org/wiki/Precipitation_hardening',
      kind: 'Reference article',
      level: 'Course level',
      why: 'Solution treatment, quench and ageing, tied to the solvus on the phase diagram.',
      checked: '2026-11-06',
    },
  ],
  labs: [
    { course: 'ema3010', lab: 'grain', notes: ['s5'], note: 'Yield strength against grain size for three metals, with a slider for the spread of sizes: boundaries, though defects, make a metal stronger. The log-normal closed form is checked by integrating over the distribution.' },
  ],
};
