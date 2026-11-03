export default {
  id: 'divergence-theorem',
  title: 'Divergence theorem',
  label: ['Divergence', 'theorem'],
  subject: 'calculus',
  courses: ['mac2313'],
  eq: String.raw`\oint_{\partial V} \mathbf F\cdot\hat n\;dA = \iiint_V \nabla\cdot\mathbf F\;dV`,
  idea: 'Add the divergence over every tiny box in a region. Each inner face is shared by two boxes, so its flux leaves one and enters the other and cancels. Only the outer surface survives. That is the whole theorem. It is also how every conservation law moves between its integral form and its differential form.',
  requires: ['divergence'],
  sources: [
    {
      title: 'OpenStax Calculus Vol. 3, §6.8 The divergence theorem',
      url: 'https://openstax.org/books/calculus-volume-3/pages/6-8-the-divergence-theorem',
      kind: 'Open textbook',
      level: 'Course level',
      why: 'Includes applications to Gauss’s law, which ties this lane to the next one.',
    },
    {
      title: 'MIT 18.02SC, Session 84: Divergence theorem example',
      url: 'https://ocw.mit.edu/courses/18-02sc-multivariable-calculus-fall-2010/resources/mit18_02sc_mnotes_v10-1/',
      kind: 'Worked example',
      level: 'Course level',
      why: 'A full computation both ways, so you can see the two sides agree.',
    },
  ],
  labs: [],
  candidate: 'Grid a region into boxes and watch the inner-face fluxes cancel as the grid refines.',
};
