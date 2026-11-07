/** Unit 3 notes: the file, and its sections with their labs and topics. See ../index.js. */
export default {
  exam: 'u3',
  title: 'Attitude control',
  chapters: '3',
  file: 'u3-attitude.html',
  load: () => import('../content/u3-attitude.html?raw').then((m) => m.default),
  sections: [
    { id: 's1', n: 1, title: 'Rotation matrices and three angles', lab: 'attitude', ch: ['3'], topics: ['rotation'], home: true },
    { id: 's2', n: 2, title: 'Gimbal lock', lab: 'attitude', ch: ['3'], topics: ['gimbal-lock'] },
    { id: 's3', n: 3, title: 'Quaternions', lab: 'attitude', ch: ['3'], topics: ['quaternion'] },
    { id: 's4', n: 4, title: 'Formula sheet', lab: null, ch: [] },
  ],
};
