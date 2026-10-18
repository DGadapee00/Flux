/** Unit 5 notes: the file, and its sections with their labs and topics. See ../index.js. */
export default {
  exam: 'u5',
  title: 'Rigid-body kinematics',
  chapters: '16',
  file: 'u5-rigid-kinematics.html',
  load: () => import('../content/u5-rigid-kinematics.html?raw').then((m) => m.default),
  sections: [
    { id: 's1', n: 1, title: 'Fixed-axis rotation', lab: null, ch: ['16'], topics: ['belt', 'gears'] },
    { id: 's2', n: 2, title: 'Absolute motion analysis', lab: 'slider-crank', ch: ['16'], topics: ['absolute'], home: true },
    { id: 's3', n: 3, title: 'Relative velocity', lab: null, ch: ['16'], topics: ['relative'] },
    { id: 's4', n: 4, title: 'Instantaneous centre', lab: 'ic', ch: ['16'], topics: ['ic'], home: true },
    { id: 's5', n: 5, title: 'Relative acceleration', lab: 'slider-crank', ch: ['16'], topics: ['acceleration'] },
    { id: 's6', n: 6, title: 'Rolling without slip', lab: 'rolling', ch: ['16'], topics: ['rolling'], home: true },
    { id: 's7', n: 7, title: 'Application: a turbopump gearbox', lab: 'gearbox', ch: ['16'], topics: ['gears'], problems: ['u5.16.turbopump', 'u5.16.train-sense'], home: true },
    { id: 's8', n: 8, title: 'Formula sheet', lab: null, ch: [] },
  ],
};
