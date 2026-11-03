export default {
  id: 'flux-2d',
  title: 'Flux across a curve',
  label: ['Flux across', 'a curve'],
  subject: 'calculus',
  courses: ['mac2313'],
  eq: String.raw`\text{Flux} = \oint_C \mathbf F\cdot\hat n\;ds`,
  idea: String.raw`Flux counts how much of a field crosses a curve, with outward taken as positive. Only the normal part of \(\mathbf F\) counts; the part along the curve slides past. Green's theorem in normal form turns flux out of a closed curve into an area integral of \(\partial P/\partial x + \partial Q/\partial y\). That integrand is the divergence in two dimensions.`,
  requires: ['vector-fields'],
  sources: [
    {
      title: 'MIT 18.02SC, Session 69: Flux across curves (problems with solutions)',
      url: 'https://ocw.mit.edu/courses/18-02sc-multivariable-calculus-fall-2010/resources/mit18_02sc_pb_69_comb/',
      kind: 'Problems + solutions',
      level: 'Course level',
      why: 'Practice setting up n̂ ds, the step most people get wrong.',
    },
    {
      title: 'MIT 18.02SC, Part C: Green’s theorem',
      url: 'https://ocw.mit.edu/courses/18-02sc-multivariable-calculus-fall-2010/pages/3.-double-integrals-and-line-integrals-in-the-plane/part-c-greens-theorem/',
      kind: 'Lectures + problems with solutions',
      level: 'Course level',
      why: 'Covers both forms of Green’s theorem, including the flux (normal) form used here.',
    },
  ],
  labs: [],
  candidate: 'A 2D field with a loop you drag and reshape. The flux readout and the area integral of the divergence inside agree.',
};
