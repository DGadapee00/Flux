export default {
  id: 'diodes-leds',
  title: 'Diodes and LEDs',
  subject: 'circuits',
  courses: ['bench'],
  eq: String.raw`R = \frac{V_s - V_f}{I}, \qquad I = I_s\left(e^{V/nV_T} - 1\right)`,
  idea: String.raw`A diode conducts one way. An LED's voltage barely changes as its current changes, so it cannot set its own current: the resistor in series does, at \((V_s - V_f)/I\). In series, LEDs share one current; in parallel on one resistor, the one with the lowest forward voltage takes most of it, so each needs its own resistor. Buy the next standard value up and check its power.`,
  requires: ['current-resistance', 'kirchhoff'],
  sources: [
    {
      title: 'OpenStax University Physics Vol. 3, §9.7 Semiconductor devices',
      url: 'https://openstax.org/books/university-physics-volume-3/pages/9-7-semiconductor-devices',
      kind: 'Open textbook',
      level: 'Course level',
      why: 'Why a p-n junction conducts one way, and its exponential curve.',
      checked: '2026-11-06',
    },
    {
      title: 'Kuphaldt, Lessons in Electric Circuits',
      url: 'https://www.ibiblio.org/kuphaldt/electricCircuits/',
      kind: 'Free textbook (Design Science License)',
      level: 'Intro',
      why: 'Diodes and LEDs in practice, from the text the course cites.',
    },
  ],
  labs: [
    { course: 'bench', lab: 'led', notes: ['s1', 's2', 's3'], note: 'An LED and its resistor on 3.3, 5 and 9 V, forwards and backwards.' },
    { course: 'bench', lab: 'led-strings', notes: ['s5', 's6'], note: 'LEDs in series, in parallel on one resistor, and with a resistor each.' },
    { course: 'bench', lab: 'indicator', notes: ['s4'], note: 'A power-light LED on four supplies: pick a current, buy the resistor, check its power.' },
  ],
};
