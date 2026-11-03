export default {
  id: 'sinusoidal-response',
  title: 'Sinusoidal response, gain and phase',
  label: ['Gain and', 'phase'],
  subject: 'diffeq',
  courses: ['map2302'],
  eq: String.raw`\dot y + ky = k\cos\omega t \;\Rightarrow\; y_p = \frac{k}{\sqrt{k^2 + \omega^2}}\cos(\omega t - \phi),\quad \tan\phi = \frac{\omega}{k}`,
  idea: String.raw`Drive a linear system with a sinusoid and, once the start fades, it answers at the same frequency, scaled by a gain and delayed by a phase. Writing the input as the real part of \(e^{i\omega t}\) turns the calculus into algebra with complex numbers. Slow inputs are followed closely; fast ones are attenuated and lag.`,
  requires: ['first-order-odes'],
  sources: [
    {
      title: 'MIT 18.03SC, Exponential input; gain and phase lag',
      url: 'https://ocw.mit.edu/courses/18-03sc-differential-equations-fall-2011/pages/unit-i-first-order-differential-equations/exponential-input-gain-and-phase-lag/',
      kind: 'Lectures + problems with solutions',
      level: 'Course level',
      why: 'Complex exponentials applied to first-order response.',
    },
    {
      title: 'MIT 18.03SC, Complex arithmetic and exponentials',
      url: 'https://ocw.mit.edu/courses/18-03sc-differential-equations-fall-2011/pages/unit-i-first-order-differential-equations/complex-arithmetic-and-exponentials/',
      kind: 'Lectures + problems with solutions',
      level: 'Intro',
      why: 'The complex-number tools the method needs.',
    },
  ],
  labs: [
    { course: 'map2302', lab: 'first-order-response', notes: ['s7', 's6'], note: 'Slow and fast forcing: gain and lag change, the start only adds a transient.' },
  ],
};
