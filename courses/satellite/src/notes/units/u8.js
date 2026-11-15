/** Unit 8 notes: the file, and its sections with their labs and topics. See ../index.js. */
export default {
  exam: 'u8',
  title: 'Mission and requirements',
  chapters: '8',
  file: 'u8-mission.html',
  load: () => import('../content/u8-mission.html?raw').then((m) => m.default),
  sections: [
    { id: 'mission', n: 1, title: 'Mission and concept of operations', lab: null, ch: [] },
    { id: 'requirements', n: 2, title: 'Writing requirements', lab: null, ch: ['8'], topics: ['requirements'] },
    { id: 'verification', n: 3, title: 'Verification', lab: null, ch: ['8'], topics: ['verification'] },
    { id: 'margin', n: 4, title: 'Mass budget and margin', lab: 'margin', ch: ['8'], topics: ['margin'], home: true },
    { id: 'reviews', n: 5, title: 'Life cycle and reviews', lab: null, ch: ['8'], topics: ['reviews'] },
    { id: 'sheet', n: 6, title: 'Formula sheet', lab: null, ch: [] },
    { id: 'build-it', n: 7, title: 'Build it', lab: null, ch: [] },
  ],
};
