/** Unit 7 notes: the file, and its sections with their labs and topics. See ../index.js. */
export default {
  exam: 'u7',
  title: 'Rigid-body energy',
  chapters: '18',
  file: 'u7-rigid-energy.html',
  load: () => import('../content/u7-rigid-energy.html?raw').then((m) => m.default),
  sections: [
    { id: 's1', n: 1, title: 'Kinetic energy', lab: 'race', ch: ['18'], topics: ['energy'] },
    { id: 's2', n: 2, title: 'Work of a couple', lab: 'linkage', ch: ['18'], topics: ['couple', 'bar'] },
    { id: 's3', n: 3, title: 'Rolling without slip', lab: 'race', ch: ['18'], topics: ['race'], problems: ['u7.18.roll-sym'], home: true },
    { id: 's4', n: 4, title: 'The instantaneous centre', lab: 'linkage', ch: ['18'], topics: ['linkage', 'spring'], home: true },
    { id: 's5', n: 5, title: 'Conservation of energy', lab: null, ch: ['18'], topics: ['energy'] },
    { id: 's6', n: 6, title: 'Tipping about a pad', lab: 'tipover', ch: ['18'], topics: ['tipover'], problems: ['u7.18.tipover', 'u7.18.tip-change'], home: true },
    { id: 's7', n: 7, title: 'Application: a wheelchair on a ramp', lab: 'wheelchair', ch: ['18'], topics: ['energy', 'race'], problems: ['u7.18.wheelchair'], home: true },
    { id: 's8', n: 8, title: 'Formula sheet', lab: null, ch: [] },
  ],
};
