/** Unit 2 notes: the file, and its sections with their labs and topics. See ../index.js. */
export default {
  exam: 'u2',
  title: 'Pressure on walls and in moving tanks',
  chapters: '4',
  file: 'u2-pressure.html',
  load: () => import('../content/u2-pressure.html?raw').then((m) => m.default),
  sections: [
    { id: 's1', n: 1, title: 'The force on a flat gate', lab: 'gate', ch: ['4'], topics: ['hydrostatic-force'], home: true },
    { id: 's2', n: 2, title: 'Where the force acts', lab: 'gate', ch: ['4'], topics: ['hydrostatic-force'] },
    { id: 's3', n: 3, title: 'A tank that accelerates', lab: 'rigid-tank', ch: ['4'], topics: ['rigid-body'], home: true },
    { id: 's4', n: 4, title: 'A tank that spins', lab: 'rigid-tank', ch: ['4'], topics: ['rigid-body'] },
    { id: 's5', n: 5, title: 'Formula sheet', lab: null, ch: [] },
  ],
};
