/** Unit 13 notes: the file, and its sections with their labs and topics. See ../index.js. */
export default {
  exam: 'u13',
  title: 'Environmental test and verification',
  chapters: '13',
  file: 'u13-test.html',
  load: () => import('../content/u13-test.html?raw').then((m) => m.default),
  sections: [
    { id: 'verify', n: 1, title: 'What a test proves', lab: null, ch: ['13'], topics: ['testing'] },
    { id: 'levels', n: 2, title: 'Vibration test levels', lab: 'levels', ch: ['13'], topics: ['levels'], home: true },
    { id: 'tvac', n: 3, title: 'Thermal vacuum', lab: 'tvac', ch: ['13'], topics: ['tvac'], home: true },
    { id: 'campaign', n: 4, title: 'The test campaign', lab: null, ch: ['13'], topics: ['campaign'] },
    { id: 'sheet', n: 5, title: 'Formula sheet', lab: null, ch: [] },
    { id: 'build-it', n: 6, title: 'Build it', lab: null, ch: [] },
  ],
};
