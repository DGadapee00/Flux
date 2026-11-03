export default {
  id: 'breadboard-circuits',
  title: 'Breadboards and circuit diagrams',
  label: ['Breadboards'],
  subject: 'circuits',
  courses: ['bench'],
  eq: String.raw`\text{one strip} = \text{one node}: \quad V_\text{hole} = V_\text{strip}`,
  idea: String.raw`A breadboard hides metal strips under its holes, and every hole on one strip is the same node. Building from a schematic means giving each node its own strip. A part with both legs on one strip is shorted out; a stray jumper across a part bypasses it; a power rail split in the middle leaves its far half dead.`,
  requires: ['current-resistance'],
  sources: [
    {
      title: 'Kuphaldt, Lessons in Electric Circuits',
      url: 'https://www.ibiblio.org/kuphaldt/electricCircuits/',
      kind: 'Free textbook (Design Science License)',
      level: 'Intro',
      why: 'The free text the Bench course cites; its early chapters build circuits from parts.',
    },
    {
      title: 'OpenStax University Physics Vol. 2, §10.2 Resistors in series and parallel',
      url: 'https://openstax.org/books/university-physics-volume-2/pages/10-2-resistors-in-series-and-parallel',
      kind: 'Open textbook',
      level: 'Intro',
      why: 'Series and parallel, the two layouts a breadboard makes easy to get wrong.',
    },
  ],
  labs: [
    { course: 'bench', lab: 'breadboard', notes: ['s1', 's2'], note: 'Holes coloured by their strip’s voltage: right placement, a turned part, a stray jumper and a split rail.' },
  ],
};
