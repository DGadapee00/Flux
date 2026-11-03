/** Unit 9 notes: the file, and its sections with their labs and topics. See ../index.js. */
export default {
  exam: 'u9',
  title: 'Gravitation',
  chapters: '13',
  file: 'u9-gravitation.html',
  load: () => import('../content/u9-gravitation.html?raw').then((m) => m.default),
  sections: [
    {
      id: 's1', n: 1, title: "Newton's law of gravitation", lab: 'orbit', ch: ['13'],
      topics: ['gravitation'],
      problems: ['ch13.collision', 'ch13.galaxies'],
      home: true,
    },
    {
      id: 's2', n: 2, title: "Gravitation near Earth's surface", lab: 'iss-orbit', ch: ['13'],
      topics: ['gravity', 'field'],
      problems: ['ch13.earth-mass', 'ch13.height', 'ch13.weightless', 'ch13.concept-weight', 'ch13.concept-radius'],
      home: true,
    },
    {
      id: 's3', n: 3, title: 'Potential energy and escape', lab: 'orbit', ch: ['13'],
      topics: ['escape'],
      problems: ['ch13.escape', 'ch13.soyuz', 'ch13.concept-escape'],
      home: true,
    },
    {
      id: 's4', n: 4, title: 'Orbits and their energy', lab: 'iss-orbit', ch: ['13'],
      topics: ['orbit'],
      problems: ['ch13.iss', 'ch13.concept-mass'],
      home: true,
    },
    {
      id: 's5', n: 5, title: "Kepler's laws", lab: 'kepler', ch: ['13'],
      topics: ['kepler'],
      problems: ['ch13.moon', 'ch13.halley', 'ch13.speeds', 'ch13.transfer', 'ch13.concept-area'],
      home: true,
    },
    { id: 's6', n: 6, title: 'Formula sheet', lab: null, ch: [] },
  ],
};
