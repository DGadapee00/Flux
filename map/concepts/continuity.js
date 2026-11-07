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
      title: 'Cleynen, Fluid Dynamics for Engineers, Ch. 6: Prediction of fluid flows',
      url: 'https://fluidmech.ninja/chapter6.pdf',
      kind: 'Open textbook',
      level: 'Course level',
      why: 'Derives the continuity equation from a balance of mass on a small fixed volume, for any flow and then incompressible flow.',
      checked: '2026-11-06',
    },
    {
      title: 'OpenStax Calculus Vol. 3, §6.8 The divergence theorem',
      url: 'https://openstax.org/books/calculus-volume-3/pages/6-8-the-divergence-theorem',
      kind: 'Open textbook',
      level: 'Course level',
      why: 'The math step, if it has faded since Calculus III.',
      checked: '2026-11-06',
    },
  ],
  labs: [
    { course: 'eml3015', lab: 'continuity', notes: ['s4'], note: 'A square control volume moved about water and air flows, with the mass across each side and the density change it implies.' },
  ],
};
