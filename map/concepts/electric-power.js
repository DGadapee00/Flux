export default {
  id: 'electric-power',
  title: 'Electric power',
  subject: 'circuits',
  courses: ['phy2049', 'eel3111'],
  eq: String.raw`P = IV = I^2R = \frac{V^2}{R}, \qquad V_\text{rms} = \frac{V_0}{\sqrt2}`,
  idea: String.raw`A source does work on each coulomb it pushes, so power is current times voltage. In a resistor all of it turns to heat. To send power far, raise the voltage: the current falls, and the line's \(I^2R\) loss falls with its square. For AC, the rms value is the steady voltage that would heat a resistor the same.`,
  requires: ['current-resistance'],
  sources: [
    {
      title: 'OpenStax University Physics Vol. 2, §9.5 Electrical energy and power',
      url: 'https://openstax.org/books/university-physics-volume-2/pages/9-5-electrical-energy-and-power',
      kind: 'Open textbook',
      level: 'Intro',
      why: 'Power in resistors, with the cost of running real appliances.',
      checked: '2026-11-06',
    },
    {
      title: 'OpenStax University Physics Vol. 2, §10.6 Household wiring and electrical safety',
      url: 'https://openstax.org/books/university-physics-volume-2/pages/10-6-household-wiring-and-electrical-safety',
      kind: 'Open textbook',
      level: 'Intro',
      why: 'Grounding, breakers and why a shock depends on current, not voltage alone.',
      checked: '2026-11-06',
    },
  ],
  labs: [
    { course: 'phy2049', lab: 'power', notes: ['s13', 's14', 's15'], note: 'Power in a resistor, and AC against DC with rms and peak marked.' },
    { course: 'phy2049', lab: 'powerline', note: String.raw`A town fed at voltage \(V\): the share lost in the line is \(PR/V^2\).` },
  ],
};
