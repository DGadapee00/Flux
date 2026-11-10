export default {
  id: 'corrosion',
  title: 'Corrosion',
  subject: 'matsci',
  courses: ['ema3010'],
  eq: String.raw`E_\text{cell} = E_\text{cathode} - E_\text{anode}, \qquad \Delta G = -nFE_\text{cell}`,
  idea: String.raw`Most metals are refined from oxides and drift back toward them. Corrosion is an electrochemical cell: the anode metal gives up electrons and dissolves, and oxygen or hydrogen takes them at the cathode. Two metals in contact form a galvanic couple, and a small anode beside a large cathode corrodes fast. Protection works by breaking the cell: coatings, a sacrificial zinc anode, or a thin passive oxide like the chromium oxide on stainless steel.`,
  requires: ['atomic-bonding', 'electric-potential'],
  sources: [
    {
      title: 'OpenStax Chemistry 2e, §17.6 Corrosion',
      url: 'https://openstax.org/books/chemistry-2e/pages/17-6-corrosion',
      kind: 'Open textbook',
      level: 'Intro',
      why: 'Rusting as a cell, with cathodic protection and galvanizing.',
      checked: '2026-11-06',
    },
    {
      title: 'Galvanic series (Wikipedia)',
      url: 'https://en.wikipedia.org/wiki/Galvanic_series',
      kind: 'Reference article',
      level: 'Intro',
      why: 'Which metal corrodes when two are joined in seawater.',
      checked: '2026-11-06',
    },
  ],
  labs: [
    { course: 'ema3010', lab: 'couple', notes: ['s4'], note: 'Steel joined to copper in aerated water with a slider for the area ratio, the Evans diagram drawn: a small anode beside a large cathode corrodes fast, so painting the anode alone is a mistake. The mixed potential is checked by bisection on the net current.' },
  ],
};
