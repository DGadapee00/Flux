/** Unit 2 notes: the file, and its sections with their labs and topics. See ../index.js. */
export default {
  exam: 'u2',
  title: 'Communications',
  chapters: '2',
  file: 'u2-communications.html',
  load: () => import('../content/u2-communications.html?raw').then((m) => m.default),
  sections: [
    { id: 's1', n: 1, title: 'Noise from heat', lab: 'noise', ch: ['2'], topics: ['noise'], home: true },
    { id: 's2', n: 2, title: 'Bits in noise', lab: 'noise', ch: ['2'], topics: ['noise'] },
    { id: 's3', n: 3, title: 'Formula sheet', lab: null, ch: [] },
  ],
};
