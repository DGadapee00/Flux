export default {
  id: 'first-order-odes',
  title: 'First-order equations and slope fields',
  label: ['First-order', 'equations'],
  subject: 'diffeq',
  courses: ['map2302'],
  eq: String.raw`y' = f(t, y), \qquad y' + p(t)\,y = q(t) \;\Rightarrow\; (\mu y)' = \mu q,\ \ \mu = e^{\int p\,dt}`,
  idea: String.raw`A differential equation gives the slope of its solution at every point, so it can be drawn as a field of short tangents before anything is solved. A solution follows the field. Separable equations split into two integrals; linear ones yield to an integrating factor. Existence and uniqueness need conditions: \(y' = 2\sqrt{|y|}\) has more than one solution through zero.`,
  requires: ['fundamental-theorem'],
  sources: [
    {
      title: 'Lebl, Notes on Diffy Qs, §1.2 Slope fields',
      url: 'https://www.jirka.org/diffyqs/html/slopefields_section.html',
      kind: 'Free textbook (CC BY-SA)',
      level: 'Course level',
      why: 'The course’s own book: fields, existence and uniqueness.',
    },
    {
      title: 'MIT 18.03SC, Solution by integrating factors',
      url: 'https://ocw.mit.edu/courses/18-03sc-differential-equations-fall-2011/pages/unit-i-first-order-differential-equations/solution-by-integrating-factors/',
      kind: 'Lectures + problems with solutions',
      level: 'Course level',
      why: 'The integrating factor worked on video, with checked problems.',
    },
  ],
  labs: [
    { course: 'map2302', lab: 'slope-field', notes: ['s1', 's2', 's3', 's5', 's10'], note: 'Slope fields with solutions drawn through them, including one that is not unique.' },
  ],
};
