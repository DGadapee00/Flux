/** Unit 1 notes: the file, and its sections with their labs and topics. See ../index.js. */
export default {
  exam: 'u1',
  title: 'Gas mixtures and combustion',
  chapters: '1',
  file: 'u1-mixtures.html',
  load: () => import('../content/u1-mixtures.html?raw').then((m) => m.default),
  sections: [
    { id: 's1', n: 1, title: 'Mole and mass fractions', lab: 'mixture', ch: ['1'], topics: ['fractions'], home: true },
    { id: 's2', n: 2, title: 'Partial pressures', lab: 'mixture', ch: ['1'], topics: ['dalton'] },
    { id: 's3', n: 3, title: 'Mixture properties', lab: 'mixture', ch: ['1'], topics: ['properties'] },
    { id: 's4', n: 4, title: 'Formula sheet', lab: null, ch: [] },
  ],
};
