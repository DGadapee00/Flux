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
    { id: 's3', n: 3, title: 'The link budget', lab: 'link', ch: ['2'], topics: ['link'], home: true },
    { id: 'ttc', n: 4, title: 'What TT&C does', lab: null, ch: ['2'], topics: ['ttc'] },
    { id: 'tracking', n: 5, title: 'Tracking: range and Doppler', lab: 'doppler', ch: ['2'], topics: ['doppler'], home: true },
    { id: 'security', n: 6, title: 'Command security and licensing', lab: null, ch: ['2'], topics: ['security'] },
    { id: 's4', n: 7, title: 'Formula sheet', lab: null, ch: [] },
    { id: 'build-it', n: 8, title: 'Build it', lab: null, ch: [] },
  ],
};
