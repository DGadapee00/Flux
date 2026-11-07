export default {
  id: 'surface-flux',
  title: 'Flux through a surface',
  label: ['Flux through', 'a surface'],
  subject: 'calculus',
  courses: ['mac2313'],
  eq: String.raw`\Phi = \iint_S \mathbf F\cdot\hat n\;dA`,
  idea: String.raw`The same idea one dimension up: add the normal component of the field over a surface. The hard part is usually \(\hat n\,dA\), the area element with its direction. For a fluid, \(\mathbf F = \rho\mathbf v\) and the flux is the mass crossing per second.`,
  requires: ['flux-2d'],
  sources: [
    {
      title: 'OpenStax Calculus Vol. 3, §6.6 Surface integrals',
      url: 'https://openstax.org/books/calculus-volume-3/pages/6-6-surface-integrals',
      kind: 'Open textbook',
      level: 'Course level',
      why: 'Parametrized surfaces step by step, then flux as a special case.',
      checked: '2026-11-06',
    },
    {
      title: 'MIT 18.02SC, Session 81: Calculating flux, finding n dS',
      url: 'https://ocw.mit.edu/courses/18-02sc-multivariable-calculus-fall-2010/resources/mit18_02sc_mnotes_v9-2/',
      kind: 'Worked example',
      level: 'Course level',
      why: 'One clean worked example of the area element, the step that trips people up.',
      checked: '2026-11-06',
    },
  ],
  labs: [
    { course: 'phy2049', lab: 'gauss', note: String.raw`Colours a closed surface by \(\mathbf E\cdot\hat n\), from inward to outward.` },
  ],
};
