/** Unit 10 notes: the file, and its sections with their labs and topics. See ../index.js. */
export default {
  exam: 'u10',
  title: 'Avionics, flight software and data',
  chapters: '10',
  file: 'u10-avionics.html',
  load: () => import('../content/u10-avionics.html?raw').then((m) => m.default),
  sections: [
    { id: 'avionics', n: 1, title: 'The computer and its buses', lab: null, ch: ['10'], topics: ['buses'] },
    { id: 'tasks', n: 2, title: 'Flight software and scheduling', lab: 'tasks', ch: ['10'], topics: ['scheduling'], home: true },
    { id: 'faults', n: 3, title: 'Faults, watchdogs and safe mode', lab: null, ch: ['10'], topics: ['faults'] },
    { id: 'software', n: 4, title: 'Building flight software', lab: null, ch: [] },
    { id: 'data', n: 5, title: 'The data budget', lab: 'data', ch: ['10'], topics: ['databudget'], home: true },
    { id: 'sheet', n: 6, title: 'Formula sheet', lab: null, ch: [] },
    { id: 'build-it', n: 7, title: 'Build it', lab: null, ch: [] },
  ],
};
