/** Unit 6 notes: the file, and its sections with their labs and topics. See ../index.js. */
export default {
  exam: 'u6',
  title: 'Valves and boards',
  chapters: '6',
  file: 'u6-valves-boards.html',
  load: () => import('../content/u6-valves-boards.html?raw').then((m) => m.default),
  sections: [
    { id: 's1', n: 1, title: 'A valve in its system', lab: 'valve', ch: ['6'], topics: ['valve'], home: true },
    { id: 's2', n: 2, title: 'Copper is a resistor', lab: 'board', ch: ['6'], topics: ['board'], home: true },
    { id: 's3', n: 3, title: 'Formula sheet', lab: null, ch: [] },
  ],
};
