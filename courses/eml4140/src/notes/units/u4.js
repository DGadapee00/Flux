/** Unit 4 notes: the file, and its sections with their labs and topics. See ../index.js. */
export default {
  exam: 'u4',
  title: 'Exchangers and mass transfer',
  chapters: '4',
  file: 'u4-exchangers.html',
  load: () => import('../content/u4-exchangers.html?raw').then((m) => m.default),
  sections: [
    { id: 's2', n: 1, title: 'Heat exchangers', lab: 'exchanger', ch: ['4'], topics: ['exchangers'], home: true },
    { id: 's3', n: 2, title: 'Evaporation and the wet bulb', lab: 'wetbulb', ch: ['4'], topics: ['evaporation'], home: true },
    { id: 's1', n: 3, title: 'Formula sheet', lab: null, ch: [] },
  ],
};
