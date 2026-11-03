export default {
  id: 'momentum-cv',
  title: 'Momentum balance on a control volume',
  label: ['Momentum', '(control volume)'],
  subject: 'fluids',
  courses: ['eml3015'],
  eq: String.raw`\sum\mathbf F = \frac{d}{dt}\int_\text{CV}\rho\mathbf v\,dV + \int_\text{CS}\mathbf v\,\rho\,(\mathbf v\cdot\mathbf n)\,dA`,
  idea: String.raw`Put momentum into the transport theorem and Newton's second law holds for a control volume. The forces on it, pressure on the cut surfaces, gravity and whatever holds it in place, equal the net outflow of momentum. With uniform jets that outflow is \(\dot m\,\mathbf v\) out minus in. This is how to find the force on a pipe bend, a nozzle or a vane without knowing the flow inside.`,
  requires: ['reynolds-transport', 'impulse-momentum'],
  sources: [
    {
      title: 'MIT 2.06, Lecture notes: Control volume formulation',
      url: 'https://ocw.mit.edu/courses/2-06-fluid-dynamics-spring-2013/resources/mit2_06s13_notes_lens/',
      kind: 'Lecture notes',
      level: 'Course level',
      why: 'The momentum balance follows the mass balance in the same notes.',
    },
    {
      title: 'MIT 2.06, calendar: Lecture 7, momentum equation and examples',
      url: 'https://ocw.mit.edu/courses/2-06-fluid-dynamics-spring-2013/pages/calendar/',
      kind: 'Course outline',
      level: 'Course level',
      why: 'The lecture that applies it to jets, bends and moving vanes.',
    },
  ],
  labs: [],
  candidate: 'Aim a water jet at a fixed vane and then at a vane moving away from it. It corrects the idea that the force depends on the jet’s speed alone: on a moving vane only the relative speed counts, and the force is the momentum flux the vane turns.',
};
