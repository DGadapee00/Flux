/** Unit 3 notes: the file, and its sections with their labs and topics. See ../index.js. */
export default {
  exam: 'u3',
  title: 'Following the flow',
  chapters: '6',
  file: 'u3-flow.html',
  load: () => import('../content/u3-flow.html?raw').then((m) => m.default),
  sections: [
    { id: 's1', n: 1, title: 'Acceleration following a particle', lab: 'nozzle', ch: ['6'], topics: ['material-derivative'], home: true },
    { id: 's2', n: 2, title: 'Time along a path', lab: 'nozzle', ch: ['6'], topics: ['material-derivative'] },
    { id: 's3', n: 3, title: "Euler's equation across a bend", lab: 'bend', ch: ['6'], topics: ['euler'], home: true },
    { id: 's4', n: 4, title: 'Mass in, mass out', lab: 'continuity', ch: ['6'], topics: ['continuity'], home: true },
    { id: 's5', n: 5, title: 'Formula sheet', lab: null, ch: [] },
  ],
};
