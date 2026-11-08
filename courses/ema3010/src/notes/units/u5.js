/** Unit 5 notes: the file, and its sections with their labs and topics. See ../index.js. */
export default {
  exam: 'u5',
  title: 'Polymers, glasses and corrosion',
  chapters: '5',
  file: 'u5-polymers-glasses-corrosion.html',
  load: () => import('../content/u5-polymers-glasses-corrosion.html?raw').then((m) => m.default),
  sections: [
    { id: 's2', n: 1, title: 'Polymer chains and the glass transition', lab: 'chains', ch: ['5'], topics: ['polymers'], home: true },
    { id: 's3', n: 2, title: 'Glass and its viscosity', lab: 'pane', ch: ['5'], topics: ['glass'], home: true },
    { id: 's4', n: 3, title: 'Galvanic corrosion', lab: 'couple', ch: ['5'], topics: ['corrosion'], home: true },
    { id: 's1', n: 4, title: 'Formula sheet', lab: null, ch: [] },
  ],
};
