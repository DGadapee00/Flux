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
    { id: 's5', n: 5, title: 'Pressure-driven flow in a pipe', lab: 'pipe', ch: ['6'], topics: ['poiseuille'], home: true },
    { id: 's6', n: 6, title: 'Models and similitude', lab: 'model', ch: ['6'], topics: ['similitude'], home: true },
    { id: 's7', n: 7, title: 'Boundary layers', lab: 'layer', ch: ['6'], topics: ['boundary-layer'], home: true },
    { id: 's8', n: 8, title: 'A system passing through a box', lab: 'transport', ch: ['6'], topics: ['transport'], home: true },
    { id: 's9', n: 9, title: 'Momentum on a control volume', lab: 'vane', ch: ['6'], topics: ['momentum-cv'], home: true },
    { id: 's10', n: 10, title: 'Head loss in pipes', lab: 'headloss', ch: ['6'], topics: ['head-loss'], home: true },
    { id: 's11', n: 11, title: 'Formula sheet', lab: null, ch: [] },
  ],
};
