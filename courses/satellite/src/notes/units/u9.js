/** Unit 9 notes: the file, and its sections with their labs and topics. See ../index.js. */
export default {
  exam: 'u9',
  title: 'Space environment and radiation',
  chapters: '9',
  file: 'u9-environment.html',
  load: () => import('../content/u9-environment.html?raw').then((m) => m.default),
  sections: [
    { id: 'environment', n: 1, title: 'The environment of a low orbit', lab: null, ch: [] },
    { id: 'drag', n: 2, title: 'Drag and the upper atmosphere', lab: 'decay', ch: ['9'], topics: ['decay'], home: true },
    { id: 'radiation', n: 3, title: 'Where the radiation comes from', lab: null, ch: ['9'], topics: ['effects'] },
    { id: 'dose', n: 4, title: 'Total dose and shielding', lab: null, ch: ['9'], topics: ['dose'] },
    { id: 'upsets', n: 5, title: 'Single-event upsets and scrubbing', lab: 'upsets', ch: ['9'], topics: ['upsets'], home: true },
    { id: 'sheet', n: 6, title: 'Formula sheet', lab: null, ch: [] },
    { id: 'build-it', n: 7, title: 'Build it', lab: null, ch: [] },
  ],
};
