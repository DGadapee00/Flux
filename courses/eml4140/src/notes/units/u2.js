/** Unit 2 notes: the file, and its sections with their labs and topics. See ../index.js. */
export default {
  exam: 'u2',
  title: 'Radiation',
  chapters: '2',
  file: 'u2-radiation.html',
  load: () => import('../content/u2-radiation.html?raw').then((m) => m.default),
  sections: [
    { id: 's1', n: 1, title: 'Black bodies', lab: 'radiation', ch: ['2'], topics: ['blackbody'], home: true },
    { id: 's2', n: 2, title: 'Real surfaces in sunlight', lab: 'radiation', ch: ['2'], topics: ['surfaces'] },
    { id: 's3', n: 3, title: 'View factors', lab: 'viewfactor', ch: ['2'], topics: ['viewfactor'], home: true },
    { id: 's4', n: 4, title: 'Formula sheet', lab: null, ch: [] },
  ],
};
