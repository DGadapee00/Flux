export default {
  id: 'viscosity',
  title: 'Viscosity',
  label: ['Viscosity'],
  subject: 'fluids',
  courses: ['eml3015'],
  eq: String.raw`\tau = \mu\,\frac{du}{dy}, \qquad \nu = \frac{\mu}{\rho}`,
  idea: String.raw`A fluid sticks to a wall and moves with it, so layers next to each other slide at different speeds. Neighbouring layers drag on each other with a shear stress. For a Newtonian fluid that stress is the viscosity times the velocity gradient, the same \(\tau\) as on a cut through a solid, but set by a rate of strain, not a strain. Viscosity falls with temperature in a liquid and rises in a gas. The kinematic viscosity \(\nu\) is how fast velocity differences diffuse.`,
  requires: ['stress-on-a-section', 'derivative'],
  related: [
    {
      id: 'fourier',
      note: String.raw`Both are gradient laws: shear stress from a velocity gradient, heat flux from a temperature gradient.`,
    },
  ],
  sources: [
    {
      title: 'OpenStax University Physics Vol. 1, §14.7 Viscosity and turbulence',
      url: 'https://openstax.org/books/university-physics-volume-1/pages/14-7-viscosity-and-turbulence',
      kind: 'Open textbook',
      level: 'Intro',
      why: 'Viscosity from a plate dragged over a fluid layer, with values for common fluids.',
      checked: '2026-11-06',
    },
    {
      title: 'MIT 2.06, calendar: Lecture 9, viscous fluids',
      url: 'https://ocw.mit.edu/courses/2-06-fluid-dynamics-spring-2013/pages/calendar/',
      kind: 'Course outline',
      level: 'Course level',
      why: 'Where the course adds shear stress to the equations of motion.',
      checked: '2026-11-06',
    },
  ],
  labs: [
    { course: 'eml3015', lab: 'viscosity', notes: ['s1', 's2'], note: 'Drags a plate over water, mercury, glycerol, oil and air, and draws the profile as it grows from rest.' },
  ],
};
