export default {
  id: 'beam-deflection',
  title: 'Beam deflection',
  subject: 'materials',
  courses: ['egn3331'],
  eq: String.raw`EI\,\frac{d^2v}{dx^2} = M(x)`,
  idea: String.raw`Curvature is moment over stiffness, so integrating the moment twice gives the beam's shape, with the supports fixing the constants. The beam is lowest where its slope is zero, which is not where the moment peaks under an off-centre load. Deflections from separate loads add. A redundant support is found from compatibility: it must hold the beam at zero deflection there.`,
  requires: ['bending-stress', 'definite-integral'],
  sources: [
    {
      title: 'MIT 2.001, Lecture 22: Beam deflection',
      url: 'https://ocw.mit.edu/courses/2-001-mechanics-materials-i-fall-2006/resources/lec20/',
      kind: 'Lecture notes',
      level: 'Course level',
      why: 'Integrating the moment-curvature equation with boundary conditions.',
      checked: '2026-11-06',
    },
    {
      title: 'MIT 2.001, Lecture 23: Symmetry, superposition, and statically indeterminate beams',
      url: 'https://ocw.mit.edu/courses/2-001-mechanics-materials-i-fall-2006/resources/lec21/',
      kind: 'Lecture notes',
      level: 'Course level',
      why: 'Superposition and redundant supports.',
      checked: '2026-11-06',
    },
  ],
  labs: [
    { course: 'egn3331', lab: 'curve', notes: ['s1', 's2', 's3', 's5'], note: 'The elastic curve from integrating the moment, and where the beam is lowest.' },
    { course: 'egn3331', lab: 'propped', notes: ['s6'], note: 'A propped cantilever: the prop is set by compatibility.' },
    { course: 'egn3331', lab: 'shelf', notes: ['s8'], note: 'A pine shelf sagging over a long span, and the bracket that fixes it.' },
    { course: 'egn3331', lab: 'crossing', notes: ['s4', 's7'], note: 'A car on two stringers: deflections add, and fixed ends cut the sag.' },
  ],
};
