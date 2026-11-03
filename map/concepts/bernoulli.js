export default {
  id: 'bernoulli',
  title: 'Bernoulli’s equation',
  subject: 'fluids',
  courses: ['phy2048', 'eml3015'],
  eq: String.raw`p + \tfrac12\rho v^2 + \rho g h = \text{const}, \qquad A_1v_1 = A_2v_2`,
  idea: String.raw`For steady flow of an incompressible fluid without friction, energy per unit volume is conserved along a streamline. Where a pipe narrows, continuity speeds the flow and Bernoulli lowers the pressure. A tank drains at Torricelli's \(\sqrt{2gh}\). Real fluids have viscosity, and fast flow turns turbulent, so these are the ideal limits.`,
  requires: ['pressure', 'energy-conservation', 'mass-cv'],
  sources: [
    {
      title: 'OpenStax University Physics Vol. 1, §14.6 Bernoulli’s equation',
      url: 'https://openstax.org/books/university-physics-volume-1/pages/14-6-bernoullis-equation',
      kind: 'Open textbook',
      level: 'Intro',
      why: 'The equation from the work-energy theorem on a fluid parcel.',
    },
    {
      title: 'MIT 2.06, Lecture 5 notes: Control volume formulation',
      url: 'https://ocw.mit.edu/courses/2-06-fluid-dynamics-spring-2013/resources/mit2_06s13_notes_lens/',
      kind: 'Lecture notes',
      level: 'Deeper',
      why: 'Where Bernoulli sits in the general control-volume picture.',
    },
  ],
  labs: [
    { course: 'phy2048', lab: 'bernoulli', notes: ['s5', 's6'], note: 'A narrowing pipe and a draining tank: speed up, pressure down, Torricelli’s law.' },
    { course: 'phy2048', lab: 'fire-hose', note: 'The pressure a fire hose needs to reach a nozzle and throw water up.' },
  ],
};
