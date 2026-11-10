export default {
  id: 'material-derivative',
  title: 'Material derivative',
  label: ['Material', 'derivative'],
  subject: 'fluids',
  courses: ['eml3015'],
  eq: String.raw`\frac{D\mathbf v}{Dt} = \frac{\partial\mathbf v}{\partial t} + (\mathbf v\cdot\nabla)\,\mathbf v`,
  idea: String.raw`A velocity field gives the velocity at each fixed point. A fluid particle does not stay at one point, so its acceleration has two parts. One is the change in time at a fixed point. The other is the change it meets by moving to where the field is different, the chain rule along its path. In steady flow the first part is zero, but a particle in a narrowing pipe still speeds up.`,
  requires: ['chain-rule', 'vector-fields'],
  sources: [
    {
      title: 'Wikipedia, Material derivative',
      url: 'https://en.wikipedia.org/wiki/Material_derivative',
      kind: 'Reference',
      level: 'Deeper',
      why: 'The definition, the link between the Eulerian and Lagrangian views, and its other names.',
      checked: '2026-11-06',
    },
    {
      title: 'Cleynen, Fluid Dynamics for Engineers, Ch. 6: Prediction of fluid flows',
      url: 'https://fluidmech.ninja/chapter6.pdf',
      kind: 'Open textbook',
      level: 'Course level',
      why: 'Develops the total time derivative from a particle passing a fixed point, with the convective term explained.',
      checked: '2026-11-06',
    },
  ],
  labs: [
    { course: 'eml3015', lab: 'nozzle', notes: ['s1', 's2'], note: 'Particles carried through a nozzle at equal time steps, with the local and convective parts of their acceleration.' },
  ],
};
