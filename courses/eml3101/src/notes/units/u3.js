/** Unit 3 notes: the file, and its sections with their labs and topics. See ../index.js. */
export default {
  exam: 'u3',
  title: 'Cycles and exergy',
  chapters: '3',
  file: 'u3-cycles.html',
  load: () => import('../content/u3-cycles.html?raw').then((m) => m.default),
  sections: [
    { id: 's2', n: 1, title: 'Exergy: what heat is worth', lab: 'exergy', ch: ['3'], topics: ['exergy'], home: true },
    { id: 's3', n: 2, title: 'Otto and Diesel cycles', lab: 'cycles', ch: ['3'], topics: ['engines'], home: true },
    { id: 's4', n: 3, title: 'The Rankine cycle', lab: 'rankine', ch: ['3'], topics: ['rankine'], home: true },
    { id: 's5', n: 4, title: 'Vapour compression and the heat pump', lab: 'heatpump', ch: ['3'], topics: ['heat-pump'], home: true },
    { id: 's1', n: 5, title: 'Formula sheet', lab: null, ch: [] },
  ],
};
