/** Unit 2 notes: the file, and its sections with their labs and topics. See ../index.js. */
export default {
  exam: 'u2',
  title: 'Numbers on a computer',
  chapters: '2',
  file: 'u2-roundoff.html',
  load: () => import('../content/u2-roundoff.html?raw').then((m) => m.default),
  sections: [
    { id: 's1', n: 1, title: 'Numbers in binary', lab: 'roundoff', ch: ['2'] },
    { id: 's2', n: 2, title: 'Cancellation', lab: 'roundoff', ch: ['2'], topics: ['cancellation'], home: true },
    { id: 's3', n: 3, title: 'Order of accuracy', lab: 'truncation', ch: ['2'], topics: ['order'], home: true },
    { id: 's4', n: 4, title: 'Root finding', lab: 'roots', ch: ['2'], topics: ['roots'], home: true },
    { id: 's6', n: 5, title: 'Stepping an ODE', lab: 'rk', ch: ['2'], topics: ['ode'], home: true },
    { id: 's5', n: 6, title: 'Formula sheet', lab: null, ch: [] },
  ],
};
