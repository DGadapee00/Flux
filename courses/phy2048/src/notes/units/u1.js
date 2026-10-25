/** Unit 1 notes: the file, and its sections with their labs and topics. See ../index.js. */
export default {
  exam: 'u1',
  title: 'Units, Vectors and Motion Along a Line',
  chapters: '1–3',
  file: 'u1-units-vectors-and-motion.html',
  load: () => import('../content/u1-units-vectors-and-motion.html?raw').then((m) => m.default),
  sections: [
    { id: 's1', n: 1, title: 'Units, prefixes and conversion', lab: null, ch: ['1'], topics: ['units', 'conversion', 'prefixes'] },
    { id: 's2', n: 2, title: 'Dimensions and estimates', lab: null, ch: ['1'], topics: ['dimensional-analysis', 'estimation'] },
    { id: 's3', n: 3, title: 'Significant figures and uncertainty', lab: null, ch: ['1'], topics: ['significant-figures', 'uncertainty'] },
    { id: 's4', n: 4, title: 'Components, magnitude and direction', lab: 'vectors', ch: ['2'], topics: ['vectors', 'components', 'scalars'] },
    { id: 's5', n: 5, title: 'Adding and subtracting vectors', lab: 'vectors', ch: ['2'], topics: ['resultant', 'vectors'], home: true },
    { id: 's6', n: 6, title: 'The dot and cross products', lab: 'vectors', ch: ['2'], topics: ['dot-product', 'cross-product'] },
    { id: 's7', n: 7, title: 'Position, displacement and velocity', lab: 'kinematics-graphs', ch: ['3'], topics: ['kinematics', 'average'], home: true },
    { id: 's8', n: 8, title: 'Acceleration', lab: 'kinematics-graphs', ch: ['3'], topics: ['acceleration'] },
    { id: 's9', n: 9, title: 'Motion with constant acceleration', lab: 'stopping-distance', ch: ['3'], topics: ['constant-acceleration'] },
    { id: 's10', n: 10, title: 'Free fall', lab: 'kinematics-graphs', ch: ['3'], topics: ['free-fall'] },
    { id: 's11', n: 11, title: 'Velocity and position from an acceleration that changes', lab: 'kinematics-graphs', ch: ['3'], topics: ['integration'] },
    { id: 's12', n: 12, title: 'Formula sheet', lab: null, ch: [] },
  ],
};
