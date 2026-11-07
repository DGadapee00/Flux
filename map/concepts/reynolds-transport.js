export default {
  id: 'reynolds-transport',
  title: 'Reynolds transport theorem',
  label: ['Reynolds', 'transport'],
  subject: 'fluids',
  courses: ['eml3015'],
  eq: String.raw`\frac{dB_\text{sys}}{dt} = \frac{d}{dt}\int_\text{CV}\rho b\,dV + \int_\text{CS}\rho b\,(\mathbf v\cdot\mathbf n)\,dA`,
  idea: String.raw`The laws of physics are written for a fixed lump of matter, a system. A fluid machine is easier to study as a fixed region, a control volume, that matter flows through. The theorem links the two: the system's rate of change is what builds up inside the region plus the net flux of the property out through its surface. Put mass in for \(B\) and it is the mass balance; momentum and energy follow the same way.`,
  requires: ['mass-cv'],
  sources: [
    {
      title: 'Wikipedia, Reynolds transport theorem',
      url: 'https://en.wikipedia.org/wiki/Reynolds_transport_theorem',
      kind: 'Reference',
      level: 'Deeper',
      why: 'The general form, read as the Leibniz rule in three dimensions, and the special case of a material volume.',
      checked: '2026-11-06',
    },
    {
      title: 'Cleynen, Fluid Dynamics for Engineers, Ch. 3: Analysis of existing flows (3D)',
      url: 'https://fluidmech.ninja/chapter3.pdf',
      kind: 'Open textbook',
      level: 'Course level',
      why: 'Builds the Reynolds transport theorem on an arbitrary control volume, then the balances of mass and momentum from it.',
      checked: '2026-11-06',
    },
  ],
  labs: [
    { course: 'eml3015', lab: 'transport', notes: ['s8'], note: 'A fixed box in a duct and the water that was in it moving on: box term plus net outflow is the system’s rate, for mass, momentum and a dye blob.' },
  ],
};
