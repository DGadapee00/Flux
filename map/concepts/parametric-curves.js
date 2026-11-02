export default {
  id: 'parametric-curves',
  title: 'Parametric curves',
  subject: 'calculus',
  courses: ['mac2311', 'mac2313'],
  eq: String.raw`\boldsymbol\gamma(t) = \big(x(t),\,y(t),\,z(t)\big), \qquad L = \int_a^b |\boldsymbol\gamma'(t)|\,dt`,
  idea: String.raw`A curve can be traced by a point moving in time: each coordinate is its own function of \(t\). The derivative \(\boldsymbol\gamma'(t)\) is the velocity, tangent to the curve, and its length is the speed. Adding speed over time gives arc length. Every path a particle or a line integral follows is written this way.`,
  requires: ['derivative'],
  sources: [
    {
      title: 'OpenStax Calculus Vol. 3, §3.2 Calculus of vector-valued functions',
      url: 'https://openstax.org/books/calculus-volume-3/pages/3-2-calculus-of-vector-valued-functions',
      kind: 'Open textbook',
      level: 'Course level',
      why: 'Tangent vectors and derivatives of space curves.',
    },
    {
      title: 'MIT 18.02SC, Part C: Parametric equations for curves',
      url: 'https://ocw.mit.edu/courses/18-02sc-multivariable-calculus-fall-2010/pages/1.-vectors-and-matrices/part-c-parametric-equations-for-curves/',
      kind: 'Lectures + problems with solutions',
      level: 'Course level',
      why: 'Velocity, speed and arc length with recitation videos.',
    },
  ],
  labs: [
    { course: 'mac2313', lab: 'parametric', note: 'Slide t along a plane curve and watch its tangent.' },
    { course: 'mac2313', lab: 'space', note: 'The same in three dimensions: helices and coils with their tangent lines.' },
  ],
};
