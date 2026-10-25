/** Unit 2 notes: the file, and its sections with their labs and topics. See ../index.js. */
export default {
  exam: 'u2',
  title: 'Motion in Two and Three Dimensions',
  chapters: '4',
  file: 'u2-motion-in-two-and-three-dimensions.html',
  load: () => import('../content/u2-motion-in-two-and-three-dimensions.html?raw').then((m) => m.default),
  sections: [
    { id: 's1', n: 1, title: 'Position, displacement and velocity', lab: null, ch: ['4'], topics: ['position-vector'], problems: ['ch4.motion'] },
    { id: 's2', n: 2, title: 'Acceleration, and constant acceleration in a plane', lab: null, ch: ['4'], topics: ['acceleration-vector'], problems: ['ch4.skier'] },
    { id: 's3', n: 3, title: 'Two independent motions', lab: 'projectile', ch: ['4'], topics: ['projectile'], problems: ['ch4.concept-top'], home: true },
    { id: 's4', n: 4, title: 'Time of flight, trajectory and range', lab: 'projectile', ch: ['4'], topics: ['projectile'], problems: ['ch4.level', 'ch4.golf', 'ch4.concept-range'] },
    { id: 's5', n: 5, title: 'Launching to or from a height', lab: 'projectile', ch: ['4'], topics: ['projectile'], problems: ['ch4.height', 'ch4.slope'] },
    { id: 's6', n: 6, title: 'Uniform circular motion', lab: 'circular-motion', ch: ['4'], topics: ['circular'], problems: ['ch4.circle', 'ch4.turn', 'ch4.concept-circle'], home: true },
    { id: 's7', n: 7, title: 'Speeding up and slowing down on a circle', lab: 'circular-motion', ch: ['4'], topics: ['nonuniform-circular'], problems: ['ch4.total', 'ch4.concept-accel'] },
    { id: 's8', n: 8, title: 'Reference frames and relative velocity', lab: 'relative-motion', ch: ['4'], topics: ['relative-velocity', 'reference-frames'], problems: ['ch4.truck', 'ch4.concept-frames'], home: true },
    { id: 's9', n: 9, title: 'Heading into a wind or a current', lab: 'wind-triangle', ch: ['4'], topics: ['relative-velocity'], problems: ['ch4.wind', 'ch4.river'], home: true },
    { id: 's10', n: 10, title: 'Formula sheet', lab: null, ch: [] },
  ],
};
