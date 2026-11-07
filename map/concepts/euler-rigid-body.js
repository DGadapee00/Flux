export default {
  id: 'euler-rigid-body',
  title: 'Euler’s equations and spin stability',
  label: ['Euler’s equations', '(spinning bodies)'],
  subject: 'mechanics',
  courses: ['satellite'],
  eq: String.raw`I_1\dot\omega_1 = (I_2 - I_3)\,\omega_2\omega_3 + M_1`,
  idea: 'For a body turning in three dimensions, angular momentum is the inertia tensor times the angular velocity, and the two need not point the same way. About the principal axes the torque balance becomes Euler’s three equations, coupled through the spin. With no torque, spin about the axis of largest or smallest inertia is stable, and spin about the middle axis tumbles. A satellite’s attitude control starts from these equations.',
  requires: ['rigid-kinetics', 'angular-momentum', 'moment-of-inertia'],
  sources: [
    {
      title: 'MIT 16.07, Lecture 28: 3D rigid body dynamics, Euler’s equations',
      url: 'https://ocw.mit.edu/courses/16-07-dynamics-fall-2009/resources/mit16_07f09_lec28/',
      kind: 'Lecture notes',
      level: 'Course level',
      why: 'Euler’s equations derived about the principal axes, then the stability of torque-free spin about each one.',
      checked: '2026-11-06',
    },
    {
      title: 'MIT 16.851, Lecture 9: Attitude determination and control',
      url: 'https://ocw.mit.edu/courses/16-851-satellite-engineering-fall-2003/resources/l9_acs/',
      kind: 'Lecture notes',
      level: 'Course level',
      why: 'The same equations put to work: reaction wheels, gravity gradient and quaternions on a satellite.',
      checked: '2026-11-06',
    },
  ],
  labs: [
    { course: 'satellite', lab: 'spin', notes: ['s4'], note: 'A box spun about each principal axis with a small wobble: steady about the least and greatest, tumbling about the middle, with the growth rate checked against linear theory.' },
  ],
};
