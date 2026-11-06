export default {
  id: 'damped-oscillator',
  title: 'Damped oscillators',
  subject: 'diffeq',
  courses: ['map2302'],
  eq: String.raw`m\ddot x + c\dot x + kx = 0, \qquad \zeta = \frac{c}{2\sqrt{mk}}`,
  idea: String.raw`A mass on a spring with friction obeys a second-order linear equation, solved by exponentials whose rates are the roots of \(mr^2 + cr + k = 0\). Complex roots ring down, real roots creep back, and a repeated root is the boundary, critical damping. More damping does not always return faster. A series RLC circuit is the same equation in charge.`,
  requires: ['first-order-odes', 'simple-harmonic-motion'],
  sources: [
    {
      title: 'Lebl, Notes on Diffy Qs, §2.4 Mechanical vibrations',
      url: 'https://www.jirka.org/diffyqs/html/sec_mv.html',
      kind: 'Free textbook (CC BY-SA)',
      level: 'Course level',
      why: 'The three damping cases and the RLC analogue.',
      checked: '2026-11-06',
    },
    {
      title: 'MIT 18.03SC, Damped harmonic oscillators',
      url: 'https://ocw.mit.edu/courses/18-03sc-differential-equations-fall-2011/pages/unit-ii-second-order-constant-coefficient-linear-equations/damped-harmonic-oscillators/',
      kind: 'Lectures + problems with solutions',
      level: 'Course level',
      why: 'Underdamped, critical and overdamped on video, with problems.',
      checked: '2026-11-06',
    },
  ],
  labs: [
    { course: 'map2302', lab: 'oscillator', notes: ['s1', 's2'], note: 'One release with small, critical and heavy damping.' },
    { course: 'map2302', lab: 'rlc', notes: ['s9'], note: 'A series RLC circuit: charge and current as two states of one equation.' },
  ],
};
