export default {
  id: 'strain-gauge-bridge',
  title: 'Strain gauges and the Wheatstone bridge',
  label: ['Strain gauges', 'and bridges'],
  subject: 'instruments',
  courses: ['design'],
  eq: String.raw`\frac{\Delta R}{R} = GF\,\varepsilon,\qquad V_\text{out} \approx \frac{V_s}{4}\,GF\,\varepsilon`,
  idea: String.raw`A strain gauge is a fine grid of foil that stretches with the surface it is glued to, and its resistance changes in proportion: \(\Delta R/R = GF\,\varepsilon\). The change is tiny, a fraction of a percent, so it is read in a Wheatstone bridge that subtracts the steady part and leaves only the change. Gauges in the other arms can cancel temperature effects and double or quadruple the signal.`,
  requires: ['stress-strain', 'voltage-divider'],
  sources: [
    {
      title: 'Wikipedia, Strain gauge',
      url: 'https://en.wikipedia.org/wiki/Strain_gauge',
      kind: 'Reference',
      level: 'Course level',
      why: 'Gauge factor, bridge circuits and temperature compensation.',
      checked: '2026-11-06',
    },
    {
      title: 'Wikipedia, Wheatstone bridge',
      url: 'https://en.wikipedia.org/wiki/Wheatstone_bridge',
      kind: 'Reference',
      level: 'Intro',
      why: 'How a balanced bridge measures a small change in resistance.',
      checked: '2026-11-06',
    },
  ],
  labs: [
    { course: 'design', lab: 'bridge', notes: ['s1', 's2'], note: 'Gauges on a bracket arm read as a quarter, half or full bridge, through an amplifier into an ADC, with a warm room to cancel.' },
  ],
};
