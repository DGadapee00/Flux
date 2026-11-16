/** Unit 7 notes: the file, and its sections with their labs and topics. See ../index.js. */
export default {
  exam: 'u7',
  title: 'Payload and integration',
  chapters: '7',
  file: 'u7-integration.html',
  load: () => import('../content/u7-integration.html?raw').then((m) => m.default),
  sections: [
    { id: 'payload', n: 1, title: 'Sensor payload', lab: null, ch: [] },
    { id: 'integration', n: 2, title: 'Integration', lab: null, ch: [] },
    { id: 'loop', n: 3, title: 'The design loop', lab: null, ch: ['7'], topics: ['loop'] },
    { id: 'budgets', n: 4, title: 'Every budget at once', lab: 'mission', ch: ['7'], topics: ['budgets'], home: true },
    { id: 'trades', n: 5, title: 'One change, every subsystem', lab: 'mission', ch: ['7'], topics: ['trades'] },
    { id: 'review', n: 6, title: 'What a design review holds', lab: null, ch: ['7'], topics: ['review'] },
    { id: 'sheet', n: 7, title: 'Formula sheet', lab: null, ch: [] },
  ],
};
