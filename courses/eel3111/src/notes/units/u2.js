/** Unit 2 notes: the file, and its sections with their labs and topics. See ../index.js. */
export default {
  exam: 'u2',
  title: 'Sinusoidal steady state',
  chapters: '2',
  file: 'u2-phasors.html',
  load: () => import('../content/u2-phasors.html?raw').then((m) => m.default),
  sections: [
    { id: 's1', n: 1, title: 'Phasors and impedance', lab: 'phasors', ch: ['2'], topics: ['phasor'], home: true },
    { id: 's2', n: 2, title: 'Resonance', lab: 'phasors', ch: ['2'], topics: ['resonance'] },
    { id: 's3', n: 3, title: 'Formula sheet', lab: null, ch: [] },
  ],
};
