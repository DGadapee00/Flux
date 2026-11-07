export default {
  id: 'phase-line',
  title: 'Autonomous equations and stability',
  label: ['Phase line and', 'stability'],
  subject: 'diffeq',
  courses: ['map2302'],
  eq: String.raw`y' = f(y), \qquad f(y^*) = 0, \qquad f'(y^*) < 0 \Rightarrow \text{stable}`,
  idea: String.raw`When the slope depends only on \(y\), the zeros of \(f\) are equilibria, and the sign of \(f\) between them says which way solutions move. A phase line shows it all without solving. Change a parameter and two equilibria can meet and vanish: harvest a population too hard and no steady state is left.`,
  requires: ['first-order-odes'],
  sources: [
    {
      title: 'Lebl, Notes on Diffy Qs, §1.6 Autonomous equations',
      url: 'https://www.jirka.org/diffyqs/html/auteq_section.html',
      kind: 'Free textbook (CC BY-SA)',
      level: 'Course level',
      why: 'Phase lines, stability and the logistic equation with harvesting.',
      checked: '2026-11-06',
    },
    {
      title: 'MIT 18.03SC, First order autonomous differential equations',
      url: 'https://ocw.mit.edu/courses/18-03sc-differential-equations-fall-2011/pages/unit-i-first-order-differential-equations/first-order-autonomous-differential-equations/',
      kind: 'Lectures + problems with solutions',
      level: 'Course level',
      why: 'Phase lines and bifurcations on video, with problems.',
      checked: '2026-11-06',
    },
  ],
  labs: [
    { course: 'map2302', lab: 'phase-line', notes: ['s8'], note: 'Logistic growth with harvest: the two equilibria collide and vanish past a threshold.' },
  ],
};
