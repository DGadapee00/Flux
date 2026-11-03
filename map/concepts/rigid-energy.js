export default {
  id: 'rigid-energy',
  title: 'Energy of a rigid body',
  label: ['Rigid-body', 'energy'],
  subject: 'mechanics',
  courses: ['egn3321', 'phy2048'],
  eq: String.raw`T = \tfrac12 m v_G^2 + \tfrac12 I_G\,\omega^2`,
  idea: String.raw`A moving rigid body stores energy in two ways: its centre moving and the body spinning. Down a slope, a hoop, a disk and a sphere share the same energy budget but split it differently, so the one with the least spin wins the race. A couple does work through its rotation. Tipping happens when the weight moves past the pivot.`,
  requires: ['work-energy', 'rigid-kinetics', 'energy-conservation'],
  sources: [
    {
      title: 'OpenStax University Physics Vol. 1, §11.1 Rolling motion',
      url: 'https://openstax.org/books/university-physics-volume-1/pages/11-1-rolling-motion',
      kind: 'Open textbook',
      level: 'Intro',
      why: 'Energy conservation for rolling, including the race down a ramp.',
    },
    {
      title: 'MIT 8.01SC, 37.1 Kinetic energy of translation and rotation',
      url: 'https://ocw.mit.edu/courses/8-01sc-classical-mechanics-fall-2016/pages/week-12-rotations-and-translation-rolling/37-1-kinetic-energy-of-translation-and-rotation/',
      kind: 'Lecture video',
      level: 'Course level',
      why: 'Splitting kinetic energy about the centre of mass.',
    },
  ],
  labs: [
    { course: 'egn3321', lab: 'race', notes: ['s1', 's3', 's5'], note: 'A hoop, a disk and a sphere racing down a ramp.' },
    { course: 'egn3321', lab: 'linkage', notes: ['s2', 's4'], note: 'A linkage driven by a couple, solved by energy.' },
    { course: 'egn3321', lab: 'tipover', notes: ['s6'], note: 'A body tipping about a pad once its weight passes the edge.' },
    { course: 'egn3321', lab: 'wheelchair', notes: ['s7'], note: 'A wheelchair on a ramp: the energy to climb and the speed coming down.' },
    { course: 'phy2048', lab: 'rover-wheel', notes: ['s3'], note: 'A Mars rover wheel rolling into a basin: speed at the bottom from energy.' },
  ],
};
