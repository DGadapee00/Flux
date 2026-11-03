export default {
  id: 'filters',
  title: 'Frequency response and filters',
  label: ['Filters'],
  subject: 'circuits',
  courses: ['eel3111'],
  eq: String.raw`H(j\omega) = \frac{\mathbf V_\text{out}}{\mathbf V_\text{in}} = \frac{1}{1 + j\omega RC}, \qquad \omega_c = \frac{1}{RC}, \quad |H(j\omega_c)| = \frac{1}{\sqrt2}\ (-3\ \text{dB}), \qquad Q = \frac{\omega_0}{\Delta\omega}`,
  idea: String.raw`Divide the output phasor by the input phasor and you get the circuit's frequency response \(H(j\omega)\): a gain and a phase at each frequency. An RC divider passes slow signals and cuts fast ones, a low-pass filter; swap the parts and it is high-pass. At the corner frequency the gain is \(1/\sqrt2\); well past it, one RC stage's gain falls tenfold for each tenfold rise in frequency. An RLC can pass a narrow band around \(\omega_0\), with a sharpness set by \(Q\). Plotted on log axes as a Bode plot, these curves become nearly straight lines.`,
  requires: ['impedance-analysis'],
  related: [
    {
      id: 'fourier-series',
      note: String.raw`A filter scales each Fourier component of a periodic input by \(|H(j\omega)|\) at its frequency.`,
    },
  ],
  sources: [
    {
      title: 'MIT 6.002, calendar: Lecture 20, filters, Q factor, radio tuner',
      url: 'https://ocw.mit.edu/courses/6-002-circuits-and-electronics-spring-2007/pages/calendar/',
      kind: 'Course outline',
      level: 'Course level',
      why: 'Filters and \\(Q\\) through the example of a radio tuner.',
    },
    {
      title: 'Kuphaldt, Lessons in Electric Circuits, Vol. II: AC',
      url: 'https://www.allaboutcircuits.com/textbook/alternating-current/',
      kind: 'Open textbook',
      level: 'Intro',
      why: 'Its filters chapter covers low-pass, high-pass, band-pass and resonant filters.',
    },
  ],
  labs: [],
  candidate: 'Pass a square wave through an RC low-pass filter with a slider for the corner frequency. It corrects the idea that a filter only weakens a signal: it reshapes it, because each harmonic is cut and delayed by a different amount.',
};
