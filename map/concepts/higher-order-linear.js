export default {
  id: 'higher-order-linear',
  title: 'Higher-order linear equations and annihilators',
  label: ['Higher order,', 'annihilators'],
  subject: 'diffeq',
  courses: ['map2302'],
  eq: String.raw`W(t) = W(t_0)\,e^{-\int p_{n-1}\,dt}`,
  idea: String.raw`An nth-order linear equation needs n independent solutions and n initial values. With constant coefficients each root of the characteristic polynomial gives a solution, and a root of multiplicity m also gives it times \(t, \dots, t^{m-1}\). Abel’s formula says the Wronskian is never zero or always zero. An annihilator turns the undetermined-coefficients guess into a derivation: apply the operator that kills the forcing, then drop the roots the equation already has.`,
  requires: ['damped-oscillator', 'determinant-inverse'],
  related: [{ id: 'linear-systems', note: 'An nth-order equation is a first-order system in its companion form.' }],
  sources: [
    {
      title: 'Lebl, Notes on Diffy Qs, §2.3 Higher order linear ODEs',
      url: 'https://www.jirka.org/diffyqs/',
      kind: 'Free textbook (CC BY-SA)',
      level: 'Course level',
      why: 'Fundamental sets, the Wronskian and constant coefficients of any order.',
    },
    {
      title: 'MIT 18.03SC, Linear operators, linear time invariance',
      url: 'https://ocw.mit.edu/courses/18-03sc-differential-equations-fall-2011/pages/unit-ii-second-order-constant-coefficient-linear-equations/linear-operators-linear-time-invariance/',
      kind: 'Lectures + problems with solutions',
      level: 'Course level',
      why: 'Writing equations as polynomials in D, the language annihilators use.',
    },
  ],
  labs: [
    { course: 'map2302', lab: 'higher-order', notes: ['s13', 's14'], note: 'Third- and fourth-order bases checked against RK4 and Abel’s formula, and an annihilator trial.' },
  ],
};
