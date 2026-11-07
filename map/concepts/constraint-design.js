export default {
  id: 'constraint-design',
  title: 'Exact constraint design',
  label: ['Exact constraint'],
  subject: 'design',
  courses: ['design'],
  eq: String.raw`\text{DOF}_\text{free} = 6 - n_\text{constraints}`,
  idea: 'A rigid body has six ways to move. Exact constraint design removes each one once, with no more contacts than it needs. Constrain a direction twice and the two constraints fight: small errors become forces, wear and misalignment. A kinematic coupling with three balls in three grooves locates a part repeatably for that reason. Where a design must be over-constrained, it relies on compliance or preload instead.',
  requires: ['static-equilibrium'],
  sources: [
    {
      title: 'MIT 2.72, Lecture 6: Constraints, exact constraint design',
      url: 'https://ocw.mit.edu/courses/2-72-elements-of-mechanical-design-spring-2009/resources/mit2_72s09_lec06/',
      kind: 'Lecture notes',
      level: 'Course level',
      why: 'The principles of exact constraint, applied to bearing layouts and preload.',
      checked: '2026-11-06',
    },
    {
      title: 'Wikipedia, Kinematic coupling',
      url: 'https://en.wikipedia.org/wiki/Kinematic_coupling',
      kind: 'Reference',
      level: 'Intro',
      why: 'Constraining exactly the six degrees of freedom, as in the three-groove coupling.',
      checked: '2026-11-06',
    },
  ],
  labs: [
    { course: 'design', lab: 'mount', notes: ['s3'], note: 'A plate on two to four pins in the plane, with one pin off size. The plane has three freedoms; the notes extend the count to six.' },
  ],
};
