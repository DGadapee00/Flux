/** Unit 6 notes: the file, and its sections with their labs and topics. See ../index.js. */
export default {
  exam: 'u6',
  title: 'Fixed-axis rotation',
  chapters: '10',
  file: 'u6-fixed-axis-rotation.html',
  load: () => import('../content/u6-fixed-axis-rotation.html?raw').then((m) => m.default),
  sections: [
    { id: 's1', n: 1, title: 'Rotational variables', lab: null, ch: ['10'], topics: ['rotation'], problems: ['ch10.wind'] },
    { id: 's2', n: 2, title: 'Constant angular acceleration', lab: 'rotor', ch: ['10'], topics: ['angular-kinematics'], problems: ['ch10.spin', 'ch10.stop', 'ch10.concept-sign'], home: true },
    { id: 's3', n: 3, title: 'Angular and linear acceleration', lab: 'rotor', ch: ['10'], topics: ['tangential'], problems: ['ch10.rim'] },
    { id: 's4', n: 4, title: 'Moment of inertia', lab: 'helicopter-rotor', ch: ['10'], topics: ['inertia', 'rotational-energy'], problems: ['ch10.heli', 'ch10.concept-shape'], home: true },
    { id: 's5', n: 5, title: 'Calculating a moment of inertia', lab: 'inertia', ch: ['10'], topics: ['parallel-axis'], problems: ['ch10.rod', 'ch10.pair', 'ch10.concept-axis'], home: true },
    { id: 's6', n: 6, title: 'Torque', lab: 'rotor', ch: ['10'], topics: ['torque'], problems: ['ch10.torque', 'ch10.net'] },
    { id: 's7', n: 7, title: 'Newton\'s second law for rotation', lab: 'massive-pulley', ch: ['10'], topics: ['newton'], problems: ['ch10.merry', 'ch10.pulley', 'ch10.concept-pulley'], home: true },
    { id: 's8', n: 8, title: 'Rotational work and power', lab: 'rotor', ch: ['10'], topics: ['rotational-work'], problems: ['ch10.work', 'ch10.power', 'ch10.flywheel', 'ch10.concept-work'] },
    { id: 's9', n: 9, title: 'Formula sheet', lab: null, ch: [] },
  ],
};
