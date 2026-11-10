export default {
  id: 'implicit-differentiation',
  title: 'Chain rule and implicit differentiation',
  label: ['Chain rule,', 'implicit'],
  subject: 'calculus',
  courses: ['mac2311'],
  eq: String.raw`\frac{d}{dx}f\big(g(x)\big) = f'\big(g(x)\big)\,g'(x), \qquad \frac{d}{dx}\ln x = \frac1x`,
  idea: String.raw`A function of a function changes at the outer rate times the inner rate. That one rule differentiates an equation that never solves for \(y\): differentiate both sides, treating \(y\) as a function of \(x\), and solve for \(y'\). The same move gives the derivatives of inverse functions, of \(\ln x\) and of \(e^x\).`,
  requires: ['derivative'],
  sources: [
    {
      title: 'OpenStax Calculus Vol. 1, §3.8 Implicit differentiation',
      url: 'https://openstax.org/books/calculus-volume-1/pages/3-8-implicit-differentiation',
      kind: 'Open textbook',
      level: 'Intro',
      why: 'Tangent lines to curves that are not graphs of functions.',
      checked: '2026-11-06',
    },
    {
      title: 'MIT 18.01SC, Part B: Implicit differentiation and inverse functions',
      url: 'https://ocw.mit.edu/courses/18-01sc-single-variable-calculus-fall-2010/pages/1.-differentiation/part-b-implicit-differentiation-and-inverse-functions/',
      kind: 'Lectures + problems with solutions',
      level: 'Course level',
      why: 'Implicit and inverse derivatives, with exp and log, and checked problems.',
      checked: '2026-11-06',
    },
  ],
  labs: [
    { course: 'mac2311', lab: 'focus', notes: ['s11', 's10', 's12', 'c2/s10'], note: 'A camera lens: the image distance from the thin-lens equation, and how fast it moves as the subject does.' },
  ],
};
