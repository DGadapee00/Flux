/** Unit 1 notes: the file, and its sections with their labs and topics. See ../index.js. */
export default {
  exam: 'u1',
  title: 'Viscosity and shear',
  chapters: '5',
  file: 'u1-viscosity.html',
  load: () => import('../content/u1-viscosity.html?raw').then((m) => m.default),
  sections: [
    { id: 's1', n: 1, title: 'Viscosity: stress from a velocity gradient', lab: 'viscosity', ch: ['5'], topics: ['viscosity'], home: true },
    { id: 's2', n: 2, title: 'Momentum spreads in from the wall', lab: 'viscosity', ch: ['5'], topics: ['diffusion'] },
    { id: 's3', n: 3, title: 'Formula sheet', lab: null, ch: [] },
  ],
};
