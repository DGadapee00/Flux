/** Unit 2 notes: the file, and its sections with their labs and topics. See ../index.js. */
export default {
  exam: 'u2',
  title: 'Force and acceleration',
  chapters: '13',
  file: 'u2-force-acceleration.html',
  load: () => import('../content/u2-force-acceleration.html?raw').then((m) => m.default),
  sections: [
    { id: 's1', n: 1, title: 'Equations of motion', lab: 'fma', ch: ['13'], topics: ['newton'], home: true },
    { id: 's2', n: 2, title: 'Friction on an incline', lab: 'fma', ch: ['13'], topics: ['friction', 'incline'] },
    { id: 's3', n: 3, title: 'Connected bodies', lab: 'fma', ch: ['13'], topics: ['tension', 'pulley'] },
    { id: 's4', n: 4, title: 'Banked curve', lab: 'curve', ch: ['13'], topics: ['bank'], home: true },
    { id: 's5', n: 5, title: 'Vertical loop', lab: 'curve', ch: ['13'], topics: ['loop'] },
    { id: 's6', n: 6, title: 'Spring on a collar', lab: null, ch: ['13'], topics: ['spring'] },
    { id: 's7', n: 7, title: 'Formula sheet', lab: null, ch: [] },
  ],
};
