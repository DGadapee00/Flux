export default {
  id: 'variation-of-parameters',
  title: 'Variation of parameters',
  subject: 'diffeq',
  courses: ['map2302'],
  eq: String.raw`u_1' = -\frac{y_2 f}{W},\quad u_2' = \frac{y_1 f}{W}`,
  idea: String.raw`Variation of parameters finds a particular solution for any continuous forcing, given a basis of homogeneous solutions. The constants become functions, with one free condition chosen so that no second derivatives of them appear. Cramer’s rule then gives each \(u_i'\) as a ratio with the Wronskian. It handles \(\sec t\) and \(e^t/t\), where undetermined coefficients has no trial, and for constant coefficients it is the same as convolution with the impulse response.`,
  requires: ['forced-resonance', 'determinant-inverse'],
  related: [{ id: 'convolution', note: 'For constant coefficients the formula is a convolution with the impulse response.' }],
  sources: [
    {
      title: 'Lebl, Notes on Diffy Qs, §2.5 Nonhomogeneous equations',
      url: 'https://www.jirka.org/diffyqs/',
      kind: 'Free textbook (CC BY-SA)',
      level: 'Course level',
      why: 'Variation of parameters next to undetermined coefficients.',
    },
    {
      title: 'MIT 18.03SC, Transfer and weight functions, Green’s formula',
      url: 'https://ocw.mit.edu/courses/18-03sc-differential-equations-fall-2011/pages/unit-iii-fourier-series-and-laplace-transform/transfer-system-and-weight-functions-greens-formula/',
      kind: 'Lectures + problems with solutions',
      level: 'Deeper',
      why: 'Green’s formula: the integral form the method takes for constant coefficients.',
    },
  ],
  labs: [
    { course: 'map2302', lab: 'variation', notes: ['s11', 's14'], note: 'Forcing by sec t and e^t/t, an answer left as an integral, and a third-order case.' },
  ],
};
