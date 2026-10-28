/** Unit 8 notes: the file, and its sections with their labs and topics. See ../index.js. */
export default {
  exam: 'u8',
  title: 'Rigid-body impulse and momentum',
  chapters: '19',
  file: 'u8-rigid-momentum.html',
  load: () => import('../content/u8-rigid-momentum.html?raw').then((m) => m.default),
  sections: [
    { id: 's1', n: 1, title: 'Angular momentum of a rigid body', lab: null, ch: ['19'], topics: ['rigid-momentum'], problems: ['u8.19.momentum'] },
    { id: 's2', n: 2, title: 'Angular impulse', lab: null, ch: ['19'], topics: ['rigid-momentum'], problems: ['u8.19.angular-impulse'] },
    { id: 's3', n: 3, title: 'Conservation of angular momentum', lab: 'spin', ch: ['19'], topics: ['spin'], problems: ['u8.19.spin', 'u8.19.spin-ask', 'u8.19.ballistic-bar', 'u8.19.embed-sym'], home: true },
    { id: 's4', n: 4, title: 'Eccentric impact', lab: 'strike', ch: ['19'], topics: ['impact'], problems: ['u8.19.strike', 'u8.19.percussion', 'u8.19.free-bar', 'u8.19.impact-ask'], home: true },
    { id: 's5', n: 5, title: 'Application: a baseball bat', lab: 'bat', ch: ['19'], topics: ['bat'], problems: ['u8.19.bat', 'u8.19.sweet-ask'], home: true },
    { id: 's6', n: 6, title: 'Formula sheet', lab: null, ch: [] },
  ],
};
