export default {
  id: 'forced-resonance',
  title: 'Forced response and resonance',
  label: ['Forced response,', 'resonance'],
  subject: 'diffeq',
  courses: ['map2302', 'phy2048'],
  eq: String.raw`x_p = \frac{F_0}{\sqrt{(k - m\omega^2)^2 + (c\omega)^2}}\cos(\omega t - \phi), \qquad \omega_\text{peak} = \sqrt{\frac km - \frac{c^2}{2m^2}}`,
  idea: String.raw`A forced oscillator settles into the input's frequency with a gain that depends on how close it is to the natural one. With no damping, driving at the natural frequency grows without bound. With damping, the peak moves below the natural frequency, and with enough damping it vanishes. A sharp peak also means a slow build-up and a long ring-down.`,
  requires: ['damped-oscillator', 'sinusoidal-response'],
  sources: [
    {
      title: 'Lebl, Notes on Diffy Qs, §2.6 Forced oscillations and resonance',
      url: 'https://www.jirka.org/diffyqs/html/forcedo_section.html',
      kind: 'Free textbook (CC BY-SA)',
      level: 'Course level',
      why: 'Pure and practical resonance from the course’s book.',
    },
    {
      title: 'MIT 18.03SC, Frequency response and practical resonance',
      url: 'https://ocw.mit.edu/courses/18-03sc-differential-equations-fall-2011/pages/unit-ii-second-order-constant-coefficient-linear-equations/frequency-response-and-practical-resonance/',
      kind: 'Lectures + problems with solutions',
      level: 'Course level',
      why: 'The gain curve and where its peak sits.',
    },
  ],
  labs: [
    { course: 'map2302', lab: 'resonance', notes: ['s3', 's4', 's5', 's6', 's7'], note: 'Sweep the drive frequency: natural frequency, gain peak and transient growth are three things.' },
    { course: 'map2302', lab: 'suspension', notes: ['s8'], note: 'A car body over a bump and a rough road, driven through its spring and shock.' },
    { course: 'map2302', lab: 'radio-tuner', notes: ['s11'], note: 'A radio clock tuned to 60 kHz: a narrower band takes longer to build and to fade.' },
    { course: 'phy2048', lab: 'resonance', notes: ['s4'], note: 'A driven oscillator’s amplitude and phase across the natural frequency.' },
  ],
};
