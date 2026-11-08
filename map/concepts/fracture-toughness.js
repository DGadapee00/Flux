export default {
  id: 'fracture-toughness',
  title: 'Fracture and fracture toughness',
  label: ['Fracture', 'toughness'],
  subject: 'matsci',
  courses: ['ema3010'],
  eq: String.raw`K_I = Y\sigma\sqrt{\pi a}, \qquad \text{fracture when } K_I \ge K_{Ic}, \qquad a_c = \frac1\pi\left(\frac{K_{Ic}}{Y\sigma}\right)^2`,
  idea: String.raw`A crack grows when the elastic energy it releases pays for the new surface it makes, so a part with a crack fails below the stress its strength alone would allow. The stress intensity \(K_I\) measures the field at the crack tip, and fracture comes when it reaches the material's toughness. The critical crack length falls with the square of the stress. Ductile metals blunt their crack tips by dislocation motion and are tough; ceramics cannot, and many steels turn brittle in the cold.`,
  requires: ['stress-concentration', 'failure-theories', 'dislocations'],
  sources: [
    {
      title: 'Fracture toughness (Wikipedia)',
      url: 'https://en.wikipedia.org/wiki/Fracture_toughness',
      kind: 'Reference article',
      level: 'Course level',
      why: 'K, the critical crack length and typical values across material classes.',
      checked: '2026-11-06',
    },
    {
      title: 'MIT 2.001, Lecture 18: Failure of materials and examples',
      url: 'https://ocw.mit.edu/courses/2-001-mechanics-materials-i-fall-2006/resources/lec17/',
      kind: 'Lecture notes',
      level: 'Course level',
      why: 'Fracture placed beside the yield criteria it extends.',
      checked: '2026-11-06',
    },
  ],
  labs: [
    { course: 'ema3010', lab: 'griffith', notes: ['s2'], note: 'A cracked plate with sliders for crack length and stress against the toughness: it can break far below yield. K = σ√(πa) is checked against the exact elastic stress at the tip, extrapolated by Richardson’s method.' },
  ],
};
