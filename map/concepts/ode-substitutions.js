export default {
  id: 'ode-substitutions',
  title: 'Substitutions for first-order equations',
  label: ['Substitutions'],
  subject: 'diffeq',
  courses: ['map2302'],
  eq: String.raw`v = \tfrac yx, \qquad w = y^{1-n}`,
  idea: String.raw`A substitution trades the unknown for one that satisfies an equation already solved. If the right side depends only on \(y/x\), then \(v = y/x\) makes the equation separable. A Bernoulli equation \(y' + Py = Qy^n\) becomes linear in \(w = y^{1-n}\). Undo the substitution before applying the initial value, and keep any solution lost by dividing.`,
  requires: ['first-order-odes'],
  sources: [
    {
      title: 'Lebl, Notes on Diffy Qs, §1.5 Substitution',
      url: 'https://www.jirka.org/diffyqs/',
      kind: 'Free textbook (CC BY-SA)',
      level: 'Course level',
      why: 'Homogeneous and Bernoulli substitutions from the course’s book.',
    },
    {
      title: 'MIT 18.03SC, First order linear ODEs',
      url: 'https://ocw.mit.edu/courses/18-03sc-differential-equations-fall-2011/pages/unit-i-first-order-differential-equations/first-order-linear-odes/',
      kind: 'Lectures + problems with solutions',
      level: 'Course level',
      why: 'The linear equation a Bernoulli substitution leads to.',
    },
  ],
  labs: [
    { course: 'map2302', lab: 'exact-substitution', notes: ['s13'], note: 'A homogeneous equation and a Bernoulli equation with a pole, each checked by RK4.' },
  ],
};
