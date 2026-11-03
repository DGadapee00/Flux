export default {
  id: 'linearization',
  title: 'Equilibria and linearization',
  label: ['Linearization'],
  subject: 'diffeq',
  courses: ['map2302'],
  eq: String.raw`\dot{\mathbf x} = \mathbf F(\mathbf x),\quad \mathbf F(\mathbf x^*) = \mathbf 0, \qquad J = \left[\frac{\partial F_i}{\partial x_j}\right]_{\mathbf x^*}`,
  idea: String.raw`Near an equilibrium a nonlinear system looks like its linear part, the Jacobian. When the linear portrait is a node, saddle or spiral, the nonlinear one matches it nearby. A linear centre decides nothing: the nonlinear terms can make it attract or repel. Predator and prey models are the classic case.`,
  requires: ['linear-systems', 'phase-line', 'partial-derivatives'],
  sources: [
    {
      title: 'Lebl, Notes on Diffy Qs, §8.1 Linearization, critical points, and equilibria',
      url: 'https://www.jirka.org/diffyqs/html/linearization_section.html',
      kind: 'Free textbook (CC BY-SA)',
      level: 'Course level',
      why: 'The Jacobian test and where it fails.',
    },
    {
      title: 'MIT 18.03SC, Nonlinear systems',
      url: 'https://ocw.mit.edu/courses/18-03sc-differential-equations-fall-2011/pages/unit-iv-first-order-systems/nonlinear-systems/',
      kind: 'Lectures + problems with solutions',
      level: 'Course level',
      why: 'Critical points and linearization on video, with problems.',
    },
  ],
  labs: [
    { course: 'map2302', lab: 'linearize', notes: ['s6', 's7', 's8'], note: 'The same linear centre with nonlinear attraction and repulsion, and a predator-prey system.' },
  ],
};
