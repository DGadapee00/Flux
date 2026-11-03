export default {
  id: 'vector-fields',
  title: 'Vector fields',
  label: ['Vector fields'],
  subject: 'calculus',
  courses: ['mac2313', 'phy2049'],
  eq: String.raw`\mathbf F(x,y) = P(x,y)\,\hat{\imath} + Q(x,y)\,\hat{\jmath}`,
  idea: String.raw`A vector field puts an arrow at every point: a fluid's velocity, a force per unit charge, a rate of heat flow. A gradient field is the special case \(\mathbf F = \nabla f\). The electrostatic field is one.`,
  requires: ['gradient'],
  sources: [
    {
      title: 'OpenStax Calculus Vol. 3, §6.1 Vector fields',
      url: 'https://openstax.org/books/calculus-volume-3/pages/6-1-vector-fields',
      kind: 'Open textbook',
      level: 'Course level',
      why: 'Many sketched fields; good for learning to read one at a glance.',
    },
    {
      title: 'MIT 18.02SC, Session 56: Vector fields (problems with solutions)',
      url: 'https://ocw.mit.edu/courses/18-02sc-multivariable-calculus-fall-2010/resources/mit18_02sc_pb_56_comb/',
      kind: 'Problems + solutions',
      level: 'Course level',
      why: 'Short problems with full solutions to check yourself against.',
    },
  ],
  labs: [
    { course: 'phy2049', lab: 'field', note: 'The field of point charges, drawn as arrows and field lines.' },
  ],
};
