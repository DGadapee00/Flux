export default {
  id: 'cauchy-euler',
  title: 'Cauchy–Euler equations and reduction of order',
  label: ['Cauchy–Euler,', 'reduction of order'],
  subject: 'diffeq',
  courses: ['map2302'],
  eq: String.raw`y = x^r:\ \ r^2 + (a-1)r + b = 0`,
  idea: String.raw`In a Cauchy–Euler equation each term keeps the degree of \(x^r\), so powers of \(x\) replace exponentials. The change \(x = e^s\) turns it into a constant-coefficient equation in \(s = \ln x\), which is why repeated roots bring \(\ln x\) and complex roots bring \(\cos(\beta\ln x)\). Reduction of order builds a second solution from one known solution of any linear second-order equation. Solutions live on an interval where the leading coefficient is not zero.`,
  requires: ['damped-oscillator'],
  sources: [
    {
      title: 'Lebl, Notes on Diffy Qs, §2.1 Second order linear ODEs',
      url: 'https://www.jirka.org/diffyqs/html/solinear_section.html',
      kind: 'Free textbook (CC BY-SA)',
      level: 'Course level',
      why: 'Existence for variable coefficients, reduction of order and Euler equations.',
      checked: '2026-11-06',
    },
    {
      title: 'MIT 18.03SC, Modes and the characteristic equation',
      url: 'https://ocw.mit.edu/courses/18-03sc-differential-equations-fall-2011/pages/unit-ii-second-order-constant-coefficient-linear-equations/modes-and-the-characteristic-equation/',
      kind: 'Lectures + problems with solutions',
      level: 'Course level',
      why: 'The constant-coefficient case a Cauchy–Euler equation reduces to.',
      checked: '2026-11-06',
    },
  ],
  labs: [
    { course: 'map2302', lab: 'cauchy-euler', notes: ['s12'], note: 'Distinct, repeated and complex indicial roots, and a second solution by reduction of order.' },
  ],
};
