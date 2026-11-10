export default {
  id: 'chain-rule',
  title: 'Multivariable chain rule',
  label: ['Chain rule'],
  subject: 'calculus',
  courses: ['mac2313'],
  eq: String.raw`\frac{d}{dt}f\big(x(t),y(t)\big) = \frac{\partial f}{\partial x}\frac{dx}{dt} + \frac{\partial f}{\partial y}\frac{dy}{dt} = \nabla f\cdot\boldsymbol\gamma'(t)`,
  idea: String.raw`Walk along a path across a surface. Your height changes because \(x\) changes and because \(y\) changes, and the two effects add. Written as a dot product, the rate is the gradient dotted with your velocity. That one line is where the directional derivative comes from.`,
  requires: ['partial-derivatives', 'parametric-curves'],
  sources: [
    {
      title: 'OpenStax Calculus Vol. 3, §4.5 The chain rule',
      url: 'https://openstax.org/books/calculus-volume-3/pages/4-5-the-chain-rule',
      kind: 'Open textbook',
      level: 'Intro',
      why: 'Tree diagrams that keep track of every path from f down to t.',
      checked: '2026-11-06',
    },
    {
      title: 'MIT 18.02SC, Part B: Chain rule, gradient and directional derivatives',
      url: 'https://ocw.mit.edu/courses/18-02sc-multivariable-calculus-fall-2010/pages/2.-partial-derivatives/part-b-chain-rule-gradient-and-directional-derivatives/',
      kind: 'Lectures + problems with solutions',
      level: 'Course level',
      why: 'Teaches the chain rule and the gradient together, as they belong.',
      checked: '2026-11-06',
    },
  ],
  labs: [
    { course: 'mac2313', lab: 'chain', note: String.raw`A curve on the floor lifted onto a surface: \(g = f\circ\gamma\) and its slope.` },
  ],
};
