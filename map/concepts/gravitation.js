export default {
  id: 'gravitation',
  title: 'Gravitation and orbits',
  label: ['Gravitation', 'and orbits'],
  subject: 'mechanics',
  courses: ['phy2048'],
  eq: String.raw`F = \frac{GMm}{r^2}, \qquad v_\text{circ} = \sqrt{\frac{GM}{r}}, \qquad T^2 = \frac{4\pi^2}{GM}a^3`,
  idea: String.raw`Every mass pulls every other with a force that falls as \(1/r^2\). An orbit is a fall that keeps missing: launched sideways at exactly \(\sqrt{GM/r}\), a body circles; slower or faster gives an ellipse; \(\sqrt2\) times that escapes. Kepler's laws follow: equal areas in equal times, and the period set by the size of the orbit alone, not the mass of what orbits.`,
  requires: ['curved-path-forces', 'energy-conservation'],
  sources: [
    {
      title: 'OpenStax University Physics Vol. 1, §13.4 Satellite orbits and energy',
      url: 'https://openstax.org/books/university-physics-volume-1/pages/13-4-satellite-orbits-and-energy',
      kind: 'Open textbook',
      level: 'Intro',
      why: 'Circular orbits, their energy and escape speed.',
    },
    {
      title: 'MIT 8.01SC, 5.1 Universal law of gravitation',
      url: 'https://ocw.mit.edu/courses/8-01sc-classical-mechanics-fall-2016/pages/week-2-newtons-laws/5-1-universal-law-of-gravitation/',
      kind: 'Lecture video',
      level: 'Course level',
      why: 'The inverse-square law set up as a vector force.',
    },
  ],
  labs: [
    { course: 'phy2048', lab: 'orbit', notes: ['s1', 's3'], note: 'Launch speed against circle, ellipse and escape.' },
    { course: 'phy2048', lab: 'kepler', notes: ['s5'], note: 'Equal areas in equal times, and the period against the semi-major axis.' },
    { course: 'phy2048', lab: 'iss-orbit', notes: ['s2', 's4'], note: 'The space station’s speed and period from its altitude alone.' },
  ],
};
