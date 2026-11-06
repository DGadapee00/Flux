export default {
  id: 'line-integrals',
  title: 'Line integrals and work',
  label: ['Line integrals'],
  subject: 'calculus',
  courses: ['mac2313'],
  eq: String.raw`\int_C \mathbf F\cdot d\mathbf r = \int_a^b \mathbf F\big(\boldsymbol\gamma(t)\big)\cdot\boldsymbol\gamma'(t)\,dt`,
  idea: String.raw`Add up the part of a field along a path as you travel it. For a force, that is the work done. Parametrize the path and the line integral becomes an ordinary integral in \(t\). When the field is a gradient, \(\mathbf F = \nabla f\), the answer depends only on the endpoints, which is why potential energy and voltage make sense.`,
  requires: ['vector-fields', 'parametric-curves'],
  sources: [
    {
      title: 'OpenStax Calculus Vol. 3, §6.2 Line integrals',
      url: 'https://openstax.org/books/calculus-volume-3/pages/6-2-line-integrals',
      kind: 'Open textbook',
      level: 'Intro',
      why: 'Scalar and vector line integrals, then work and flux along a curve.',
      checked: '2026-11-06',
    },
    {
      title: 'MIT 18.02SC, Part B: Vector fields and line integrals',
      url: 'https://ocw.mit.edu/courses/18-02sc-multivariable-calculus-fall-2010/pages/3.-double-integrals-and-line-integrals-in-the-plane/part-b-vector-fields-and-line-integrals/',
      kind: 'Lectures + problems with solutions',
      level: 'Course level',
      why: 'Work, gradient fields and path independence with checked problems.',
      checked: '2026-11-06',
    },
  ],
  labs: [
    { course: 'phy2048', lab: 'work-path', notes: ['s2', 's7'], note: String.raw`Work as \(\int \mathbf F\cdot d\mathbf r\), summed leg by leg on four paths: gravity and a spring give one total, friction and a swirl do not.` },
    { course: 'egn3321', lab: 'paths', notes: 's5', note: 'Two paths between the same points: gravity and a spring agree, friction does not.' },
  ],
  candidate: 'A field and a path you drag: the work integral adds up piece by piece, and for a gradient field two paths between the same points give the same total.',
};
