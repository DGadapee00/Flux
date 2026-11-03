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
      title: 'MIT 2.06, Lecture notes: Differential forms',
      url: 'https://ocw.mit.edu/courses/2-06-fluid-dynamics-spring-2013/resources/mit2_06s13_notes_vo/',
      kind: 'Lecture notes',
      level: 'Course level',
      why: 'Introduces the substantial derivative before the differential equations of motion.',
    },
    {
      title: 'Cleynen, Fluid Dynamics for Engineers',
      url: 'https://fluidmech.ninja/',
      kind: 'Open textbook',
      level: 'Course level',
      why: 'The particle and field views side by side, with the convective term explained.',
    },
  ],
  labs: [],
  candidate: 'Trace particles through a steady converging nozzle and plot their speed against time. It corrects the idea that steady flow has no acceleration: the field never changes, but every particle speeds up as it moves.',
};
