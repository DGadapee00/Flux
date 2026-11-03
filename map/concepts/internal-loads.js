export default {
  id: 'internal-loads',
  title: 'Shear and bending moment',
  label: ['Shear and', 'bending moment'],
  subject: 'mechanics',
  courses: ['statics', 'egn3331'],
  eq: String.raw`\frac{dV}{dx} = -w(x), \qquad \frac{dM}{dx} = V`,
  idea: String.raw`Cut a beam anywhere and the piece on one side must be in equilibrium, so the cut carries an internal axial force, shear and bending moment. Along the beam the shear changes by the load and the moment changes by the shear. So the moment is the area under the shear diagram, and it peaks where the shear crosses zero.`,
  requires: ['static-equilibrium', 'definite-integral'],
  sources: [
    {
      title: 'MIT 2.001, Lecture 5: Shear force and bending moment diagrams',
      url: 'https://ocw.mit.edu/courses/2-001-mechanics-materials-i-fall-2006/resources/lec5/',
      kind: 'Lecture notes',
      level: 'Course level',
      why: 'The diagrams from cuts, then from the load–shear–moment relations.',
    },
    {
      title: 'MIT 2.001, Lecture 6: Shear force and bending moment diagrams (cont.)',
      url: 'https://ocw.mit.edu/courses/2-001-mechanics-materials-i-fall-2006/resources/lec6/',
      kind: 'Lecture notes',
      level: 'Course level',
      why: 'Distributed loads and couples on the same diagrams.',
    },
  ],
  labs: [
    { course: 'statics', lab: 'beam', notes: ['s3'], note: 'Beams with point, uniform and triangular loads, with V and M diagrams under one moving cut.' },
    { course: 'egn3331', lab: 'diagrams', notes: ['s1', 's2', 's3'], note: 'Shear and moment diagrams by sections and by areas and jumps.' },
  ],
};
