export default {
  id: 'first-order-models',
  title: 'First-order balance models',
  label: ['Tanks, buildings,', 'falling bodies'],
  subject: 'diffeq',
  courses: ['map2302'],
  eq: String.raw`T' = K(M - T) + H,\quad mv' = mg - cv^2`,
  idea: String.raw`A first-order model is a balance written with units: rate of change equals what comes in minus what goes out. Tanks in series pass solute downstream, so the second tank rises, peaks and drains. A building follows a daily outdoor cycle with a smaller swing and a lag, the sinusoidal response of a first-order equation. A falling body balances weight against drag and approaches a terminal speed.`,
  requires: ['first-order-odes', 'sinusoidal-response'],
  related: [
    { id: 'lumped', note: 'Newton cooling of a well-mixed body is the same balance.' },
    { id: 'newtons-second-law', note: 'Drag models are Newton’s second law with a speed-dependent force.' },
  ],
  sources: [
    {
      title: 'Lebl, Notes on Diffy Qs, §1.4 Linear equations and the integrating factor',
      url: 'https://www.jirka.org/diffyqs/',
      kind: 'Free textbook (CC BY-SA)',
      level: 'Course level',
      why: 'Mixing problems solved with an integrating factor.',
    },
    {
      title: 'MIT 18.03SC, First order constant coefficient linear ODEs',
      url: 'https://ocw.mit.edu/courses/18-03sc-differential-equations-fall-2011/pages/unit-i-first-order-differential-equations/first-order-constant-coefficient-linear-odes/',
      kind: 'Lectures + problems with solutions',
      level: 'Course level',
      why: 'Models with constant rates and their response to inputs.',
    },
  ],
  labs: [
    { course: 'map2302', lab: 'first-order-models', notes: ['s14'], note: 'Two tanks, a heated building on a daily cycle, and falls with linear and quadratic drag.' },
    { course: 'phy2048', lab: 'drag', notes: ['s11'], note: 'The same drag balance from the physics side, with terminal speeds.' },
  ],
};
