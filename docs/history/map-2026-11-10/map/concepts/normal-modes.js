export default {
  id: 'normal-modes',
  title: 'Coupled normal modes',
  label: ['Normal modes'],
  subject: 'diffeq',
  courses: ['map2302'],
  eq: String.raw`M\ddot{\mathbf x} + K\mathbf x = \mathbf 0, \qquad (K - \omega^2 M)\,\mathbf v = \mathbf 0`,
  idea: String.raw`Masses joined by springs move in patterns where everything shares one frequency: the normal modes. Any free motion is a mix of them, and the starting state sets the mix. Release one mass and both modes usually start, which is why the motion seems to pass back and forth.`,
  requires: ['linear-systems', 'eigenvalues'],
  sources: [
    {
      title: 'Lebl, Notes on Diffy Qs, §3.6 Second-order systems and applications',
      url: 'https://www.jirka.org/diffyqs/html/sol_section.html',
      kind: 'Free textbook (CC BY-SA)',
      level: 'Course level',
      why: 'Normal modes of mass-spring chains.',
      checked: '2026-11-06',
    },
    {
      title: 'MIT 18.03SC, Matrix methods: eigenvalues and normal modes',
      url: 'https://ocw.mit.edu/courses/18-03sc-differential-equations-fall-2011/pages/unit-iv-first-order-systems/matrix-methods-eigenvalues-and-normal-modes/',
      kind: 'Lectures + problems with solutions',
      level: 'Course level',
      why: 'Normal modes as eigenvectors, with worked cases.',
      checked: '2026-11-06',
    },
  ],
  labs: [
    { course: 'map2302', lab: 'normal-modes', notes: ['s3'], note: 'Two masses and three springs: release one mass and watch the modes mix.' },
  ],
};
