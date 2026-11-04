export default {
  id: 'laplace-transform',
  title: 'Laplace transform',
  subject: 'diffeq',
  courses: ['map2302'],
  eq: String.raw`F(s) = \int_0^\infty e^{-st} f(t)\,dt, \qquad \mathcal L\{f'\} = sF(s) - f(0)`,
  idea: String.raw`The Laplace transform turns derivatives into multiplication by \(s\), so a linear initial-value problem becomes algebra. Steps and impulses are easy inputs to write. Partial fractions bring the answer back, and the poles of the transfer function say how the system rings or decays. A transfer function assumes the system starts at rest; motion already present adds its own terms.`,
  requires: ['forced-resonance', 'improper-integrals'],
  sources: [
    {
      title: 'Lebl, Notes on Diffy Qs, §6.1 The Laplace transform',
      url: 'https://www.jirka.org/diffyqs/html/laplace_section.html',
      kind: 'Free textbook (CC BY-SA)',
      level: 'Course level',
      why: 'The transform and its table, from the course’s book.',
    },
    {
      title: 'MIT 18.03SC, Laplace transform: solving initial value problems',
      url: 'https://ocw.mit.edu/courses/18-03sc-differential-equations-fall-2011/pages/unit-iii-fourier-series-and-laplace-transform/laplace-transform-solving-initial-value-problems/',
      kind: 'Lectures + problems with solutions',
      level: 'Course level',
      why: 'Initial-value problems solved start to finish.',
    },
  ],
  labs: [
    { course: 'map2302', lab: 'laplace', notes: ['s4', 's5', 's7', 's8', 's9', 's10'], note: 'Steps, delayed steps and a hammer tap on a mass, at rest and already moving.' },
    { course: 'map2302', lab: 'laplace-rules', notes: ['s13'], note: 'Multiply by t, shift in s, shift in t and periodic inputs, each checked against the defining integral.' },
  ],
};
