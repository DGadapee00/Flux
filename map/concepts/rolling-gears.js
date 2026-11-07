export default {
  id: 'rolling-gears',
  title: 'Rolling and gear trains',
  label: ['Rolling and', 'gear trains'],
  subject: 'mechanics',
  courses: ['egn3321'],
  eq: String.raw`v_G = r\omega\ \text{(no slip)}, \qquad \frac{\omega_\text{out}}{\omega_\text{in}} = \frac{N_\text{in}}{N_\text{out}}`,
  idea: String.raw`A wheel rolling without slipping touches the ground at a point that is momentarily still, so its centre moves at \(r\omega\). Two gears in mesh share the speed at their contact, so their spins go inversely with their sizes. A drivetrain is a chain of these contacts.`,
  requires: ['rigid-kinematics'],
  sources: [
    {
      title: 'OpenStax University Physics Vol. 1, §11.1 Rolling motion',
      url: 'https://openstax.org/books/university-physics-volume-1/pages/11-1-rolling-motion',
      kind: 'Open textbook',
      level: 'Intro',
      why: 'The no-slip condition and what it does to the contact point.',
      checked: '2026-11-06',
    },
    {
      title: 'MIT 8.01SC, 35.1 Translation and rotation of a wheel',
      url: 'https://ocw.mit.edu/courses/8-01sc-classical-mechanics-fall-2016/pages/week-12-rotations-and-translation-rolling/35-1-translation-and-rotation-of-a-wheel/',
      kind: 'Lecture video',
      level: 'Course level',
      why: 'Rolling as translation plus rotation, drawn point by point.',
      checked: '2026-11-06',
    },
  ],
  labs: [
    { course: 'egn3321', lab: 'rolling', notes: ['s7'], note: 'A wheel rolling without slip, with each point’s velocity.' },
    { course: 'egn3321', lab: 'gearbox', notes: ['s8'], note: 'Gear trains and their speed ratios.' },
    { course: 'egn3321', lab: 'bike', notes: ['s9'], note: 'A road bike’s chainrings, cogs and wheel, from cadence to road speed.' },
  ],
};
