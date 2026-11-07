export default {
  id: 'pipe-flow',
  title: 'Pipe flow and head loss',
  label: ['Pipe flow', 'and head loss'],
  subject: 'fluids',
  courses: ['eml3015'],
  eq: String.raw`h_L = f\,\frac{L}{D}\,\frac{V^2}{2g} + \sum K\,\frac{V^2}{2g}, \qquad f_\text{lam} = \frac{64}{\text{Re}}`,
  idea: String.raw`Friction in a pipe turns mechanical energy into heat, and the energy equation counts it as a head loss. Dimensional analysis says the friction factor depends only on the Reynolds number and the relative roughness. Below a Reynolds number of about 2300 the flow is laminar and Poiseuille gives \(f = 64/\text{Re}\). Above it the flow turns turbulent, mixing is far stronger, and \(f\) comes from the Moody chart or Colebrook's formula. Valves, bends and entrances add minor losses, each a multiple \(K\) of the velocity head.`,
  requires: ['couette-poiseuille', 'dimensional-analysis', 'energy-cv'],
  sources: [
    {
      title: 'MIT 2.06, calendar: Lecture 11, laminar flow, turbulent pipe flows and losses',
      url: 'https://ocw.mit.edu/courses/2-06-fluid-dynamics-spring-2013/pages/calendar/',
      kind: 'Course outline',
      level: 'Course level',
      why: 'The lecture that moves from the exact laminar solution to measured turbulent losses.',
      checked: '2026-11-06',
    },
    {
      title: 'Cleynen, Fluid Dynamics for Engineers',
      url: 'https://fluidmech.ninja/',
      kind: 'Open textbook',
      level: 'Course level',
      why: 'Pipe flow with the Moody diagram, friction factors and minor losses, worked through.',
      checked: '2026-11-06',
    },
    {
      title: 'Wikipedia, Darcy friction factor formulae',
      url: 'https://en.wikipedia.org/wiki/Darcy_friction_factor_formulae',
      kind: 'Reference',
      level: 'Deeper',
      why: 'Colebrook, Haaland and the other fits, with their ranges and errors.',
      checked: '2026-11-06',
    },
  ],
  labs: [
    { course: 'eml3015', lab: 'headloss', notes: ['s10'], note: 'Head loss against flow through the laminar and turbulent ranges: in step with flow while laminar, nearly as its square once turbulent, with roughness counting only then.' },
  ],
};
