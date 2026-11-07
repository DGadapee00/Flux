export default {
  id: 'exact-equations',
  title: 'Exact equations',
  subject: 'diffeq',
  courses: ['map2302'],
  eq: String.raw`M_y = N_x \;\Rightarrow\; F(x,y) = C`,
  idea: String.raw`Some first-order equations are the total differential of one function set to zero. When \(M_y = N_x\), that function \(F\) exists, and every solution keeps \(F\) constant, so solutions are level curves. The test is the equal-mixed-partials test for a gradient field from Calculus III. When it fails, a factor \(\mu(x)\) or \(\mu(y)\) can make the equation exact.`,
  requires: ['first-order-odes', 'partial-derivatives'],
  related: [{ id: 'line-integrals', note: 'Both ask whether a field is a gradient, and test it with mixed partials.' }],
  sources: [
    {
      title: 'Lebl, Notes on Diffy Qs, §1.8 Exact equations',
      url: 'https://www.jirka.org/diffyqs/html/exact_section.html',
      kind: 'Free textbook (CC BY-SA)',
      level: 'Course level',
      why: 'The course’s book: the test, the potential and integrating factors.',
      checked: '2026-11-06',
    },
    {
      title: 'MIT 18.02SC, Identifying gradient fields and exact differentials',
      url: 'https://ocw.mit.edu/courses/18-02sc-multivariable-calculus-fall-2010/resources/mit18_02sc_pb_62_comb/',
      kind: 'Problems with solutions',
      level: 'Intro',
      why: 'The same mixed-partials test from the multivariable side.',
      checked: '2026-11-06',
    },
  ],
  labs: [
    { course: 'map2302', lab: 'exact-substitution', notes: ['s12'], note: 'A level curve of the potential, with RK4 on the slope equation landing on the same level.' },
  ],
};
