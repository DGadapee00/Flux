/** Unit 7 notes: the file, and its sections with their labs and topics. See ../index.js. */
export default {
  exam: 'u7',
  title: 'Rolling and angular momentum',
  chapters: '11',
  file: 'u7-rolling-and-angular-momentum.html',
  load: () => import('../content/u7-rolling-and-angular-momentum.html?raw').then((m) => m.default),
  sections: [
    { id: 's1', n: 1, title: 'Rolling without slipping', lab: 'rolling', ch: ['11'], topics: ['rolling'], problems: ['ch11.roll', 'ch11.concept-race', 'ch11.concept-friction'], home: true },
    { id: 's2', n: 2, title: 'Rolling with slipping', lab: 'rolling', ch: ['11'], topics: ['slipping'], problems: ['ch11.slip'] },
    { id: 's3', n: 3, title: 'Energy of a rolling body', lab: 'rover-wheel', ch: ['11'], topics: ['rolling'], problems: ['ch11.rover'], home: true },
    { id: 's4', n: 4, title: 'Angular momentum of a particle', lab: 'particle-l', ch: ['11'], topics: ['angular-momentum'], problems: ['ch11.meteor', 'ch11.concept-origin'], home: true },
    { id: 's5', n: 5, title: 'Angular momentum of a rigid body', lab: 'spinner', ch: ['11'], topics: ['angular-momentum'], problems: ['ch11.arm', 'ch11.three'] },
    { id: 's6', n: 6, title: 'Conservation of angular momentum', lab: 'spinner', ch: ['11'], topics: ['angular-conservation'], problems: ['ch11.fly', 'ch11.tuck', 'ch11.bullet', 'ch11.concept-conserve', 'ch11.concept-energy'], home: true },
    { id: 's7', n: 7, title: 'Precession', lab: 'gyro', ch: ['11'], topics: ['precession'], problems: ['ch11.precess'], home: true },
    { id: 's8', n: 8, title: 'Formula sheet', lab: null, ch: [] },
  ],
};
