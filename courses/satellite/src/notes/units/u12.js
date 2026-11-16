/** Unit 12 notes: the file, and its sections with their labs and topics. See ../index.js. */
export default {
  exam: 'u12',
  title: 'Ground systems and operations',
  chapters: '12',
  file: 'u12-ground.html',
  load: () => import('../content/u12-ground.html?raw').then((m) => m.default),
  sections: [
    { id: 'segment', n: 1, title: 'What the ground does', lab: null, ch: [] },
    { id: 'coverage', n: 2, title: 'Where stations stand', lab: 'coverage', ch: ['12'], topics: ['coverage'], home: true },
    { id: 'networks', n: 3, title: 'Networks, services and relays', lab: null, ch: ['12'], topics: ['networks'] },
    { id: 'operations', n: 4, title: 'Flying the mission', lab: null, ch: ['12'], topics: ['operations'] },
    { id: 'sheet', n: 5, title: 'Formula sheet', lab: null, ch: [] },
    { id: 'build-it', n: 6, title: 'Build it', lab: null, ch: [] },
  ],
};
