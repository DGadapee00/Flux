export default {
  id: 'fourier-series',
  title: 'Fourier series',
  subject: 'diffeq',
  courses: ['map2302'],
  eq: String.raw`f(t) = \frac{a_0}{2} + \sum_{n\ge1}\big(a_n\cos nt + b_n\sin nt\big), \qquad a_n = \frac1\pi\int_{-\pi}^{\pi} f(t)\cos nt\,dt`,
  idea: String.raw`A periodic function is a sum of sines and cosines at whole multiples of one frequency. Because those waves are orthogonal, each coefficient is one integral. At a jump the partial sums overshoot by a fixed fraction however many terms are kept. Drive an oscillator with a periodic force and each harmonic is answered separately, so the one nearest resonance can dominate.`,
  requires: ['definite-integral', 'forced-resonance'],
  sources: [
    {
      title: 'Lebl, Notes on Diffy Qs, §4.2 Trigonometric series',
      url: 'https://www.jirka.org/diffyqs/html/ts_section.html',
      kind: 'Free textbook (CC BY-SA)',
      level: 'Course level',
      why: 'Coefficients from orthogonality, with the square wave worked.',
    },
    {
      title: 'MIT 18.03SC, Fourier series: basics',
      url: 'https://ocw.mit.edu/courses/18-03sc-differential-equations-fall-2011/pages/unit-iii-fourier-series-and-laplace-transform/fourier-series-basics/',
      kind: 'Lectures + problems with solutions',
      level: 'Course level',
      why: 'Lectures and problems on computing coefficients.',
    },
  ],
  labs: [
    { course: 'map2302', lab: 'fourier', notes: ['s1', 's2', 's3'], note: 'Add harmonics to a square, ramp and triangle wave; the jump ringing narrows but keeps its height.' },
  ],
};
