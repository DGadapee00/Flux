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
    { id: 's7', n: 6, title: 'Interpolation and Runge’s function', lab: 'interp', ch: ['2'], topics: ['interpolation'], home: true },
    { id: 's8', n: 7, title: 'Differentiating by differences', lab: 'derivative', ch: ['2'], topics: ['differences'], home: true },
    { id: 's9', n: 8, title: 'Stiff equations and stability', lab: 'stiff', ch: ['2'], topics: ['stiffness'], home: true },
    { id: 's10', n: 9, title: 'Monte Carlo', lab: 'montecarlo', ch: ['2'], topics: ['monte-carlo'], home: true },
    { id: 's11', n: 10, title: 'Newton’s method for systems', lab: 'newton', ch: ['2'], topics: ['newton-systems'], home: true },
    { id: 's5', n: 11, title: 'Formula sheet', lab: null, ch: [] },
  ],
};
