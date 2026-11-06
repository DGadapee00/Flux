/** Unit 5 notes: the file, and its sections with their labs and topics. See ../index.js. */
export default {
  exam: 'u5',
  title: 'Sensors and signals',
  chapters: '5',
  file: 'u5-sensors.html',
  load: () => import('../content/u5-sensors.html?raw').then((m) => m.default),
  sections: [
    { id: 's1', n: 1, title: 'A gauge and its bridge', lab: 'bridge', ch: ['5'], topics: ['bridge'], home: true },
    { id: 's2', n: 2, title: 'Heat, and where to put the gauges', lab: 'bridge', ch: ['5'], topics: ['bridge'] },
    { id: 's3', n: 3, title: 'Sampling and aliasing', lab: 'sampling', ch: ['5'], topics: ['sampling'], home: true },
    { id: 's4', n: 4, title: 'Formula sheet', lab: null, ch: [] },
  ],
};
