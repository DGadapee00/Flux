/** Unit 8 notes: the file, and its sections with their labs and topics. See ../index.js. */
export default {
  exam: 'u8',
  title: 'Static equilibrium and elasticity',
  chapters: '12',
  file: 'u8-static-equilibrium-and-elasticity.html',
  load: () => import('../content/u8-static-equilibrium-and-elasticity.html?raw').then((m) => m.default),
  sections: [
    {
      id: 's1', n: 1, title: 'Conditions for equilibrium', lab: 'car-balance', ch: ['12'],
      topics: ['equilibrium'],
      problems: ['ch12.car', 'ch12.concept-pivot'],
      home: true,
    },
    {
      id: 's2', n: 2, title: 'Beams and scaffolds', lab: 'beam', ch: ['12'],
      topics: ['beam'],
      problems: ['ch12.beam', 'ch12.concept-count'],
      home: true,
    },
    {
      id: 's3', n: 3, title: 'Ladders, cables, and hinges', lab: 'ladder', ch: ['12'],
      topics: ['ladder'],
      problems: ['ch12.ladder', 'ch12.strings', 'ch12.stick', 'ch12.forearm', 'ch12.cable', 'ch12.door', 'ch12.concept-ladder'],
      home: true,
    },
    {
      id: 's4', n: 4, title: 'Stress and strain', lab: 'stress-strain', ch: ['12'],
      topics: ['stress', 'strain'],
      problems: ['ch12.rod', 'ch12.pillar', 'ch12.shear', 'ch12.concept-stress'],
      home: true,
    },
    {
      id: 's5', n: 5, title: 'Elasticity and plasticity', lab: 'stress-strain', ch: ['12'],
      topics: ['elasticity'],
      problems: ['ch12.yield'],
      home: false,
    },
    { id: 's6', n: 6, title: 'Formula sheet', lab: null, ch: [] },
  ],
};
