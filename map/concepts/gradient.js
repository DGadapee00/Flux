export default {
  id: 'gradient',
  title: 'Gradient',
  label: ['Gradient'],
  subject: 'calculus',
  courses: ['mac2313'],
  eq: String.raw`\nabla f = \left(\frac{\partial f}{\partial x},\ \frac{\partial f}{\partial y},\ \frac{\partial f}{\partial z}\right)`,
  idea: String.raw`The gradient of a scalar field points the way the field rises fastest, and its length is that rate. It is perpendicular to the level curves. Every "flows downhill" law in this thread starts here: heat flows down the temperature gradient, and \(\mathbf E = -\nabla V\).`,
  requires: [],
  sources: [
    {
      title: 'OpenStax Calculus Vol. 3, §4.6 Directional derivatives and the gradient',
      url: 'https://openstax.org/books/calculus-volume-3/pages/4-6-directional-derivatives-and-the-gradient',
      kind: 'Open textbook',
      level: 'Course level',
      why: 'Shows why the gradient is perpendicular to level curves, with worked examples.',
    },
    {
      title: 'MIT 18.02SC, Part B: Chain rule, gradient and directional derivatives',
      url: 'https://ocw.mit.edu/courses/18-02sc-multivariable-calculus-fall-2010/pages/2.-partial-derivatives/part-b-chain-rule-gradient-and-directional-derivatives/',
      kind: 'Lectures + problems with solutions',
      level: 'Course level',
      why: 'MIT’s own sequence: short lectures, recitation videos and checked problems.',
    },
  ],
  labs: [
    { course: 'mac2313', lab: 'gradient', note: String.raw`\(\nabla f\) and the directional derivative \(D_{\hat u} f\) on a surface.` },
  ],
};
