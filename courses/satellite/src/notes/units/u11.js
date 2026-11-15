/** Unit 11 notes: the file, and its sections with their labs and topics. See ../index.js. */
export default {
  exam: 'u11',
  title: 'Optical payloads and laser links',
  chapters: '11',
  file: 'u11-optics.html',
  load: () => import('../content/u11-optics.html?raw').then((m) => m.default),
  sections: [
    { id: 'light', n: 1, title: 'Light, apertures and telescopes', lab: null, ch: [] },
    { id: 'imager', n: 2, title: 'Resolution and ground sampling', lab: 'imager', ch: ['11'], topics: ['imaging'], home: true },
    { id: 'laser', n: 3, title: 'The laser link budget', lab: 'laser', ch: ['11'], topics: ['lasercom'], home: true },
    { id: 'operations', n: 4, title: 'Pointing, acquisition and weather', lab: null, ch: ['11'], topics: ['laserops'] },
    { id: 'sheet', n: 5, title: 'Formula sheet', lab: null, ch: [] },
    { id: 'build-it', n: 6, title: 'Build it', lab: null, ch: [] },
  ],
};
