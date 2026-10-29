/** Unit 6 notes: the file, and its sections with their labs and topics. See ../index.js. */
export default {
  exam: 'u6',
  title: 'Rigid-body kinetics',
  chapters: '17',
  file: 'u6-rigid-kinetics.html',
  load: () => import('../content/u6-rigid-kinetics.html?raw').then((m) => m.default),
  sections: [
    { id: 's1', n: 1, title: 'Mass moment of inertia', lab: 'inertia', ch: ['17'], topics: ['inertia'], home: true },
    { id: 's2', n: 2, title: 'Composite bodies', lab: 'inertia', ch: ['17'], topics: ['composite'] },
    { id: 's3', n: 3, title: 'Translation', lab: null, ch: ['17'], topics: ['crate'] },
    { id: 's4', n: 4, title: 'Rotation about a fixed axis', lab: 'pendulum', ch: ['17'], topics: ['pin'], home: true },
    { id: 's5', n: 5, title: 'General plane motion', lab: 'roll-slip', ch: ['17'], topics: ['roll', 'slip'], home: true },
    { id: 's6', n: 6, title: 'Application: a traction elevator', lab: 'hoist', ch: ['17'], topics: ['pin'], problems: ['u6.17.hoist'], home: true },
    { id: 's7', n: 7, title: 'Formula sheet', lab: null, ch: [] },
  ],
};
