/**
 * EML 3015 Fluids, in the order of MIT 2.06 Fluid Dynamics, Spring 2013 (docs/ocw/2-06.md).
 * EML 3015 has no Flux app, so every new concept here is a gap with a candidate lab.
 * The last unit holds topics EML 3015 teaches that 2.06's calendar does not.
 */
export default {
  course: 'eml3015',
  units: [
    { title: 'Fluid statics (2.06 lectures 1 and 2)', concepts: ['pressure', 'hydrostatic-forces', 'buoyancy', 'floating-stability'] },
    { title: 'Acceleration and surface tension (lectures 3 and 4)', concepts: ['rigid-body-fluid', 'surface-tension'] },
    {
      title: 'Control volumes and Bernoulli (lectures 5 to 7)',
      concepts: ['mass-cv', 'reynolds-transport', 'bernoulli', 'energy-cv', 'momentum-cv'],
    },
    { title: 'Differential forms (lectures 8 and 9)', concepts: ['material-derivative', 'continuity', 'euler-equations', 'viscosity', 'navier-stokes'] },
    {
      title: 'Viscous flow in pipes (lectures 10 to 12)',
      concepts: ['couette-poiseuille', 'dimensional-analysis', 'pipe-flow', 'pipe-systems'],
    },
    { title: 'External flow (EML 3015, beyond 2.06)', concepts: ['boundary-layer', 'drag-lift'] },
  ],
};
