export default {
  id: 'divergence',
  title: 'Divergence',
  label: ['Divergence'],
  subject: 'calculus',
  courses: ['mac2313'],
  eq: String.raw`\nabla\cdot\mathbf F = \frac{\partial P}{\partial x} + \frac{\partial Q}{\partial y} + \frac{\partial R}{\partial z}`,
  idea: 'Divergence is the net outward flux per unit volume, in the limit of a tiny box. Positive means a source: more leaves than enters. Zero everywhere means whatever flows in flows out. Incompressible flow and the magnetic field both obey that.',
  requires: ['surface-flux'],
  sources: [
    {
      title: 'OpenStax Calculus Vol. 3, §6.5 Divergence and curl',
      url: 'https://openstax.org/books/calculus-volume-3/pages/6-5-divergence-and-curl',
      kind: 'Open textbook',
      level: 'Course level',
      why: 'Defines divergence, then interprets it as sources and sinks.',
    },
    {
      title: 'MIT 18.02SC, Part B: Flux and the divergence theorem',
      url: 'https://ocw.mit.edu/courses/18-02sc-multivariable-calculus-fall-2010/pages/4.-triple-integrals-and-surface-integrals-in-3-space/part-b-flux-and-the-divergence-theorem/',
      kind: 'Lectures + problems with solutions',
      level: 'Course level',
      why: 'Divergence taught together with the theorem that gives it meaning.',
    },
  ],
  labs: [],
  candidate: String.raw`A small box you drag through a field. It shows the flux out of each face and compares their sum with \(\nabla\cdot\mathbf F\,\Delta V\).`,
};
