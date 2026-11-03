export default {
  id: 'continuity',
  title: 'Continuity equation',
  label: ['Continuity', 'equation'],
  subject: 'fluids',
  courses: ['eml3015'],
  eq: String.raw`\frac{\partial \rho}{\partial t} + \nabla\cdot(\rho\mathbf v) = 0`,
  idea: String.raw`Shrink the control volume to a point with the divergence theorem, and the mass balance becomes a differential equation. For an incompressible fluid it reduces to \(\nabla\cdot\mathbf v = 0\): the flow has no sources. Charge conservation has the same form, with charge density and current density.`,
  requires: ['mass-cv', 'divergence-theorem'],
  sources: [
    {
      title: 'MIT 2.06, Lecture 8 notes: Differential forms, mass conservation',
      url: 'https://ocw.mit.edu/courses/2-06-fluid-dynamics-spring-2013/resources/mit2_06s13_notes_vo/',
      kind: 'Lecture notes',
      level: 'Deeper',
      why: 'Derives the equation from the control volume, as above.',
    },
    {
      title: 'OpenStax Calculus Vol. 3, §6.8 The divergence theorem',
      url: 'https://openstax.org/books/calculus-volume-3/pages/6-8-the-divergence-theorem',
      kind: 'Open textbook',
      level: 'Course level',
      why: 'The math step, if it has faded since Calculus III.',
    },
  ],
  labs: [],
  candidate: 'A 2D flow with a small control volume you drag. Net outflow is zero for incompressible flow, and nonzero where density changes.',
};
