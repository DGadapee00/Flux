/** Unit 1 notes: the file, and its sections with their labs and topics. See ../index.js. */
export default {
  exam: 'u1',
  title: 'Orbit',
  chapters: '1',
  file: 'u1-orbit.html',
  load: () => import('../content/u1-orbit.html?raw').then((m) => m.default),
  sections: [
    { id: 's1', n: 1, title: 'Ellipses and their speeds', lab: 'kepler', ch: ['1'], topics: ['ellipse'], home: true },
    { id: 's2', n: 2, title: "Kepler's equation", lab: 'kepler', ch: ['1'], topics: ['kepler'] },
    { id: 's3', n: 3, title: 'Orbit transfers', lab: 'transfer', ch: ['1'], topics: ['transfer'], home: true },
    { id: 's5', n: 4, title: 'Eclipses and ground-station passes', lab: 'passes', ch: ['1'], topics: ['passes'], home: true },
    { id: 's4', n: 5, title: 'Formula sheet', lab: null, ch: [] },
  ],
};
