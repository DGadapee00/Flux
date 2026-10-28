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
    { id: 's4', n: 4, title: 'Pulley constraints', lab: 'pulleys', ch: ['13'], topics: ['constraint', 'pulley'], problems: ['u2.13.constraint', 'u2.13.tackle'], home: true },
    { id: 's5', n: 5, title: 'Drag', lab: 'drag', ch: ['13'], topics: ['drag'], problems: ['u2.13.terminal', 'u2.13.drag-ask'], home: true },
    { id: 's6', n: 6, title: 'Banked curve', lab: 'curve', ch: ['13'], topics: ['bank'], home: true },
    { id: 's7', n: 7, title: 'Vertical loop', lab: 'curve', ch: ['13'], topics: ['loop'] },
    { id: 's8', n: 8, title: 'Polar equations of motion', lab: null, ch: ['13'], topics: ['polar'], problems: ['u2.13.polar-eom'] },
    { id: 's9', n: 9, title: 'Spring on a collar', lab: null, ch: ['13'], topics: ['spring'] },
    { id: 's10', n: 10, title: 'Application: leaving the pad', lab: 'liftoff', ch: ['13'], topics: ['newton'], problems: ['u2.13.liftoff', 'u2.13.elevator'], home: true },
    { id: 's11', n: 11, title: 'Formula sheet', lab: null, ch: [] },
  ],
};
