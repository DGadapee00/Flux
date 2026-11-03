export default {
  id: 'bending-stress',
  title: 'Bending stress',
  subject: 'materials',
  courses: ['egn3331'],
  eq: String.raw`\sigma = -\frac{My}{I}, \qquad \frac1\rho = \frac{M}{EI}`,
  idea: String.raw`A bent beam's fibres stretch on one side and shorten on the other, in proportion to their distance from the neutral axis, which passes through the centroid. Stress follows the same line, \(My/I\). A deeper section has a much larger \(I\), so stress drops fast with depth. Two materials bolted together share the moment by stiffness, and a beam turned off its principal axes bends sideways too.`,
  requires: ['internal-loads', 'centroids', 'stress-strain'],
  sources: [
    {
      title: 'MIT 2.001, Lecture 18: Pure bending',
      url: 'https://ocw.mit.edu/courses/2-001-mechanics-materials-i-fall-2006/resources/lec18/',
      kind: 'Lecture notes',
      level: 'Course level',
      why: 'Plane sections, the neutral axis and the flexure formula.',
    },
    {
      title: 'MIT 2.001, Lecture 19: Moment-curvature relationship',
      url: 'https://ocw.mit.edu/courses/2-001-mechanics-materials-i-fall-2006/resources/lec19/',
      kind: 'Lecture notes',
      level: 'Course level',
      why: 'Curvature from moment, the start of deflection.',
    },
  ],
  labs: [
    { course: 'egn3331', lab: 'flexure', notes: ['s5', 's4', 's6'], note: 'Bending stress on rectangles and T sections, with the neutral axis at the centroid.' },
    { course: 'egn3331', lab: 'joist', notes: ['s7'], note: 'A floor joist on its dressed size: stress grows with the span squared.' },
    { course: 'egn3331', lab: 'flitch', notes: ['s9'], note: 'A steel plate between two 2×10s takes most of the moment.' },
    { course: 'egn3331', lab: 'purlin', notes: ['s8'], note: 'A roof purlin off its principal axes bends sideways too.' },
    { course: 'egn3331', lab: 'bandsaw', note: 'A band-saw blade bent round its wheels: curvature fixes the stress.' },
  ],
};
