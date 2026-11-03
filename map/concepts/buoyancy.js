export default {
  id: 'buoyancy',
  title: 'Buoyancy',
  subject: 'thermo',
  courses: ['phy2048'],
  eq: String.raw`F_B = \rho_\text{fluid}\,g\,V_\text{sub}, \qquad \frac{V_\text{sub}}{V} = \frac{\rho_\text{body}}{\rho_\text{fluid}}\ \text{(floating)}`,
  idea: String.raw`Pressure rises with depth, so a submerged body is pushed up harder from below than down from above. The net push equals the weight of the fluid it displaces. A floating body sinks until it displaces its own weight, so the fraction under water is the ratio of the densities.`,
  requires: ['pressure'],
  sources: [
    {
      title: 'OpenStax University Physics Vol. 1, §14.4 Archimedes’ principle and buoyancy',
      url: 'https://openstax.org/books/university-physics-volume-1/pages/14-4-archimedes-principle-and-buoyancy',
      kind: 'Open textbook',
      level: 'Intro',
      why: 'Archimedes from pressure differences, then floating and density.',
    },
    {
      title: 'PhET: Buoyancy',
      url: 'https://phet.colorado.edu/en/simulations/buoyancy',
      kind: 'Simulation',
      level: 'Intro',
      why: 'Change the block and fluid densities and watch the waterline.',
    },
  ],
  labs: [
    { course: 'phy2048', lab: 'buoyancy', notes: ['s4'], note: 'The buoyant force as displaced weight, and how deep a floating body sits.' },
  ],
};
