export default {
  id: 'rigid-kinetics',
  title: 'Rigid-body equations of motion',
  label: ['Rigid-body', 'kinetics'],
  subject: 'mechanics',
  courses: ['egn3321'],
  eq: String.raw`\sum\mathbf F = m\mathbf a_G, \qquad \sum M_G = I_G\,\alpha`,
  idea: String.raw`A rigid body in plane motion obeys two laws at once: the forces set the acceleration of its centre of mass, and the moments about that centre set its angular acceleration. Taking moments about a fixed pivot or the contact point can remove unknown forces. Whether a wheel rolls or slips is decided by checking the friction it needs against what is available.`,
  requires: ['newtons-second-law', 'moment-of-inertia', 'rigid-kinematics'],
  sources: [
    {
      title: 'OpenStax University Physics Vol. 1, §10.7 Newton’s second law for rotation',
      url: 'https://openstax.org/books/university-physics-volume-1/pages/10-7-newtons-second-law-for-rotation',
      kind: 'Open textbook',
      level: 'Intro',
      why: 'Torque and angular acceleration for fixed-axis problems.',
    },
    {
      title: 'MIT 2.003SC, Finding equations of motion for rigid body rotation',
      url: 'https://ocw.mit.edu/courses/2-003sc-engineering-dynamics-fall-2011/pages/finding-equations-of-motion-for-rigid-body-rotation/',
      kind: 'Lectures + problems with solutions',
      level: 'Deeper',
      why: 'A careful method for general plane motion.',
    },
  ],
  labs: [
    { course: 'egn3321', lab: 'pendulum', notes: ['s4', 's3'], note: 'A body swinging about a fixed pivot, with the pin reaction.' },
    { course: 'egn3321', lab: 'roll-slip', notes: ['s5'], note: 'A wheel on a slope: does it roll or slip?' },
    { course: 'egn3321', lab: 'hoist', notes: ['s6'], note: 'A traction elevator: drum, cable, car and counterweight together.' },
  ],
};
