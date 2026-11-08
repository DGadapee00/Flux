/** Unit 4 notes: the file, and its sections with their labs and topics. See ../index.js. */
export default {
  exam: 'u4',
  title: 'Failure',
  chapters: '4',
  file: 'u4-failure.html',
  load: () => import('../content/u4-failure.html?raw').then((m) => m.default),
  sections: [
    { id: 's2', n: 1, title: 'Fracture toughness', lab: 'griffith', ch: ['4'], topics: ['toughness'], home: true },
    { id: 's3', n: 2, title: 'Fatigue crack growth', lab: 'paris', ch: ['4'], topics: ['fatigue'], home: true },
    { id: 's4', n: 3, title: 'Creep', lab: 'creep', ch: ['4'], topics: ['creep'], home: true },
    { id: 's1', n: 4, title: 'Formula sheet', lab: null, ch: [] },
  ],
};
