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
    { id: 's3', n: 3, title: 'The Nusselt number along a plate', lab: 'nusselt', ch: ['6'], topics: ['plate-h'], home: true },
    { id: 's5', n: 4, title: 'Flow in tubes', lab: 'tube', ch: ['6'], topics: ['tubes'], home: true },
    { id: 's6', n: 5, title: 'Natural convection', lab: 'plume', ch: ['6'], topics: ['buoyancy'], home: true },
    { id: 's7', n: 6, title: 'Boiling and condensation', lab: 'boil', ch: ['6'], topics: ['phase-change'], home: true },
    { id: 's4', n: 7, title: 'Formula sheet', lab: null, ch: [] },
  ],
};
