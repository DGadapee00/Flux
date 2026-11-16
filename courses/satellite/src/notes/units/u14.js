/** Unit 14 notes: the file, and its sections with their labs and topics. See ../index.js. */
export default {
  exam: 'u14',
  title: 'In-space propulsion',
  chapters: '14',
  file: 'u14-propulsion.html',
  load: () => import('../content/u14-propulsion.html?raw').then((m) => m.default),
  sections: [
    { id: 'rocket', n: 1, title: 'The rocket equation', lab: 'propellant', ch: ['14'], topics: ['rocket'] },
    { id: 'budget', n: 2, title: 'The Δv budget', lab: 'propellant', ch: ['14'], topics: ['dvbudget'], home: true },
    { id: 'tanks', n: 3, title: 'Tanks and the cold-gas limit', lab: 'propellant', ch: ['14'], topics: ['tankage'] },
    { id: 'electric', n: 4, title: 'Thrust limited by power', lab: 'spiral', ch: ['14'], topics: ['electric'], home: true },
    { id: 'choose', n: 5, title: 'Choosing a thruster', lab: null, ch: ['14'], topics: ['thrusters'] },
    { id: 'sheet', n: 6, title: 'Formula sheet', lab: null, ch: [] },
    { id: 'build-it', n: 7, title: 'Build it', lab: null, ch: [] },
  ],
};
