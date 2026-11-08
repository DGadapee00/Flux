/** Unit 4 notes: the file, and its sections with their labs and topics. See ../index.js. */
export default {
  exam: 'u4',
  title: 'Structure',
  chapters: '4',
  file: 'u4-structure.html',
  load: () => import('../content/u4-structure.html?raw').then((m) => m.default),
  sections: [
    { id: 's1', n: 1, title: 'Shaken at the base', lab: 'shake', ch: ['4'], topics: ['vibration'], home: true },
    { id: 's3', n: 2, title: 'Random vibration and fatigue', lab: 'random', ch: ['4'], topics: ['random-vibration'], home: true },
    { id: 's2', n: 3, title: 'Formula sheet', lab: null, ch: [] },
  ],
};
