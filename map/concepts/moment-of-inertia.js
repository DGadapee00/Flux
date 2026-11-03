export default {
  id: 'moment-of-inertia',
  title: 'Mass moment of inertia',
  label: ['Moment of', 'inertia'],
  subject: 'mechanics',
  courses: ['egn3321', 'phy2048'],
  eq: String.raw`I = \int r^2\,dm, \qquad I = I_G + md^2`,
  idea: String.raw`A body resists spinning according to how far its mass sits from the axis, weighted by the square of the distance. For a solid it is a volume integral, so the coordinates that fit the shape help. The parallel-axis theorem moves it to any other axis, and composite bodies add their parts.`,
  requires: ['triple-integrals'],
  sources: [
    {
      title: 'OpenStax University Physics Vol. 1, §10.5 Calculating moments of inertia',
      url: 'https://openstax.org/books/university-physics-volume-1/pages/10-5-calculating-moments-of-inertia',
      kind: 'Open textbook',
      level: 'Intro',
      why: 'Rods, disks and the parallel-axis theorem from the integral.',
    },
    {
      title: 'MIT 18.02SC, Part A: Triple integrals',
      url: 'https://ocw.mit.edu/courses/18-02sc-multivariable-calculus-fall-2010/pages/4.-triple-integrals-and-surface-integrals-in-3-space/part-a-triple-integrals/',
      kind: 'Lectures + problems with solutions',
      level: 'Course level',
      why: 'The calculus side: moments of inertia as triple integrals.',
    },
  ],
  labs: [
    { course: 'egn3321', lab: 'inertia', notes: ['s1', 's2'], note: 'Moments of inertia of shapes and composite bodies, with the parallel-axis shift.' },
    { course: 'phy2048', lab: 'inertia', notes: ['s5'], note: 'The table of moments of inertia and the parallel-axis shift.' },
    { course: 'phy2048', lab: 'helicopter-rotor', notes: ['s4'], note: 'A rescue helicopter’s blades as rods about one end, and the energy they store.' },
  ],
};
