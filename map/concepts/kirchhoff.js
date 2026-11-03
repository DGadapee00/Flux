export default {
  id: 'kirchhoff',
  title: 'Kirchhoff’s rules',
  subject: 'circuits',
  courses: ['phy2049', 'eel3111'],
  eq: String.raw`\sum I_\text{in} = \sum I_\text{out}, \qquad \oint \Delta V = 0`,
  idea: String.raw`Two rules solve any circuit. At a junction, charge in equals charge out. Around any loop, the voltage changes add to zero, because potential has one value at each point. Series and parallel rules follow from these. When a network does not reduce, write one equation per loop and junction and solve them together.`,
  requires: ['current-resistance'],
  sources: [
    {
      title: 'OpenStax University Physics Vol. 2, §10.3 Kirchhoff’s rules',
      url: 'https://openstax.org/books/university-physics-volume-2/pages/10-3-kirchhoffs-rules',
      kind: 'Open textbook',
      level: 'Intro',
      why: 'A sign convention you can follow every time, with a multi-loop example.',
    },
    {
      title: 'PhET: Circuit construction kit (DC)',
      url: 'https://phet.colorado.edu/en/simulations/circuit-construction-kit-dc',
      kind: 'Simulation',
      level: 'Intro',
      why: 'Build a network, then check your loop equations against its meters.',
    },
  ],
  labs: [
    { course: 'phy2049', lab: 'circuits', notes: ['s1', 's2', 's3', 's4', 's5'], note: 'Wires coloured by potential; series, parallel and networks reduced step by step.' },
  ],
};
