export default {
  id: 'electric-charge',
  title: 'Electric charge',
  subject: 'em',
  courses: ['phy2049'],
  eq: String.raw`q = n e, \qquad e = 1.602\times10^{-19}\ \text{C}`,
  idea: String.raw`Charge comes in two signs and in whole multiples of \(e\). It is conserved: rubbing or touching only moves it from one object to another. In a conductor some charge is free to move; in an insulator it stays put, though its molecules can stretch. A charged rod can pull on a neutral object by shifting the charge inside it.`,
  requires: [],
  sources: [
    {
      title: 'OpenStax University Physics Vol. 2, §5.1 Electric charge',
      url: 'https://openstax.org/books/university-physics-volume-2/pages/5-1-electric-charge',
      kind: 'Open textbook',
      level: 'Intro',
      why: 'Quantization and conservation, with the experiments that show them.',
      checked: '2026-11-06',
    },
    {
      title: 'OpenStax University Physics Vol. 2, §5.2 Conductors, insulators, and charging by induction',
      url: 'https://openstax.org/books/university-physics-volume-2/pages/5-2-conductors-insulators-and-charging-by-induction',
      kind: 'Open textbook',
      level: 'Intro',
      why: 'Charging by contact and by induction, step by step with diagrams.',
      checked: '2026-11-06',
    },
  ],
  labs: [
    { course: 'phy2049', lab: 'force', notes: ['s5', 's6', 's7'], note: 'Place charges and watch them push and pull; the notes cover conductors and induction.' },
  ],
};
