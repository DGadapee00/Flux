/** Unit 1 notes: the file, and its sections with their labs and topics. See ../index.js. */
export default {
  exam: 'u1',
  title: 'Methods of analysis',
  chapters: '1',
  file: 'u1-analysis.html',
  load: () => import('../content/u1-analysis.html?raw').then((m) => m.default),
  sections: [
    { id: 's1', n: 1, title: 'Node voltages', lab: 'nodes', ch: ['1'], topics: ['nodal'], home: true },
    { id: 's2', n: 2, title: 'Mesh currents', lab: 'nodes', ch: ['1'], topics: ['mesh'] },
    { id: 's3', n: 3, title: 'Choosing a method', lab: 'nodes', ch: ['1'], topics: ['count'] },
    { id: 's4', n: 4, title: 'Dependent sources', lab: 'dependent', ch: ['1'], topics: ['dependent'] },
    { id: 's5', n: 5, title: 'Formula sheet', lab: null, ch: [] },
  ],
};
