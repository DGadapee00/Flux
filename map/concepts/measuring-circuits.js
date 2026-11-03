export default {
  id: 'measuring-circuits',
  title: 'Measuring with a multimeter',
  label: ['Multimeter'],
  subject: 'circuits',
  courses: ['bench'],
  eq: String.raw`R_\text{voltmeter} \gg R_\text{part}, \qquad R_\text{ammeter} \ll R_\text{circuit}`,
  idea: String.raw`A meter becomes part of the circuit it measures. On volts it sits across a part and draws almost nothing, through a large resistance. On amps it must go in series, so the circuit is broken to fit it in; put across a part instead, its small resistance shorts the part. Resistance is measured with the power off.`,
  requires: ['kirchhoff'],
  sources: [
    {
      title: 'OpenStax University Physics Vol. 2, §10.4 Electrical measuring instruments',
      url: 'https://openstax.org/books/university-physics-volume-2/pages/10-4-electrical-measuring-instruments',
      kind: 'Open textbook',
      level: 'Intro',
      why: 'How voltmeters and ammeters connect, and what each one changes.',
    },
    {
      title: 'Kuphaldt, Lessons in Electric Circuits',
      url: 'https://www.ibiblio.org/kuphaldt/electricCircuits/',
      kind: 'Free textbook (Design Science License)',
      level: 'Intro',
      why: 'Meter use and safety, from the text the course cites.',
    },
  ],
  labs: [
    { course: 'bench', lab: 'meter', notes: ['s3', 's4', 's5'], note: 'A meter on volts across a part, and on amps in series, with what goes wrong the other way.' },
  ],
};
