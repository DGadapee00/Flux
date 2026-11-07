/** Unit 4 notes: the file, and its sections with their labs and topics. See ../index.js. */
export default {
  exam: 'u4',
  title: 'Joints and mounts',
  chapters: '4',
  file: 'u4-joints.html',
  load: () => import('../content/u4-joints.html?raw').then((m) => m.default),
  sections: [
    { id: 's1', n: 1, title: 'Preload and the stiffness share', lab: 'bolted', ch: ['4'], topics: ['bolted'], home: true },
    { id: 's2', n: 2, title: 'When the joint opens', lab: 'bolted', ch: ['4'], topics: ['bolted'] },
    { id: 's3', n: 3, title: 'One contact per freedom', lab: 'mount', ch: ['4'], topics: ['mount'], home: true },
    { id: 's4', n: 4, title: 'Formula sheet', lab: null, ch: [] },
  ],
};
