/** Unit 3 notes: the file, and its sections with their labs and topics. See ../index.js. */
export default {
  exam: 'u3',
  title: 'Convection',
  chapters: '6',
  file: 'u3-convection.html',
  load: () => import('../content/u3-convection.html?raw').then((m) => m.default),
  sections: [
    { id: 's1', n: 1, title: 'Two layers on a heated plate', lab: 'thermal', ch: ['6'], topics: ['thermal-layer'], home: true },
    { id: 's2', n: 2, title: 'Heat leaving the wall', lab: 'thermal', ch: ['6'], topics: ['wall-flux'] },
    { id: 's3', n: 3, title: 'Formula sheet', lab: null, ch: [] },
  ],
};
