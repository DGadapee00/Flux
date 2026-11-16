/** Unit 16 notes: the file, and its sections with their labs and topics. See ../index.js. */
export default {
  exam: 'u16',
  title: 'Mechanisms and deployables',
  chapters: '16',
  file: 'u16-mechanisms.html',
  load: () => import('../content/u16-mechanisms.html?raw').then((m) => m.default),
  sections: [
    { id: 'kinds', n: 1, title: 'Kinds of mechanism', lab: null, ch: ['16'], topics: ['mechanisms'] },
    { id: 'margin', n: 2, title: 'Torque margin', lab: 'hinge', ch: ['16'], topics: ['torquemargin'], home: true },
    { id: 'motion', n: 3, title: 'Deployment and the latch', lab: 'hinge', ch: ['16'], topics: ['latch'] },
    { id: 'reliability', n: 4, title: 'Making it work once', lab: null, ch: ['16'], topics: ['mechreliability'] },
    { id: 'sheet', n: 5, title: 'Formula sheet', lab: null, ch: [] },
    { id: 'build-it', n: 6, title: 'Build it', lab: null, ch: [] },
  ],
};
