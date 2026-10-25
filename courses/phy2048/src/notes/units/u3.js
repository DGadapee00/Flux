/** Unit 3 notes: the file, and its sections with their labs and topics. See ../index.js. */
export default {
  exam: 'u3',
  title: "Newton's Laws and Their Applications",
  chapters: '5–6',
  file: 'u3-newtons-laws.html',
  load: () => import('../content/u3-newtons-laws.html?raw').then((m) => m.default),
  sections: [
    { id: 's1', n: 1, title: 'Force and the first law', lab: 'elevator-scale', ch: ['5'], topics: ['newton'], problems: ['ch5.concept-first'] },
    { id: 's2', n: 2, title: 'The second law', lab: null, ch: ['5'], topics: ['second-law'], problems: ['ch5.net'] },
    { id: 's3', n: 3, title: 'Mass and weight', lab: null, ch: ['5'], topics: ['weight'], problems: ['ch5.lift'] },
    { id: 's4', n: 4, title: 'The third law and choosing a system', lab: null, ch: ['5'], topics: ['third-law'], problems: ['ch5.system', 'ch5.concept-pairs'] },
    { id: 's5', n: 5, title: 'Normal force and tension', lab: 'incline', ch: ['5'], topics: ['normal', 'tension'], problems: ['ch5.tension'] },
    { id: 's6', n: 6, title: 'Free-body diagrams', lab: null, ch: ['5'], topics: ['newton'], problems: ['ch5.concept-fbd'] },
    { id: 's7', n: 7, title: 'Connected bodies', lab: 'atwood', ch: ['6'], topics: ['atwood', 'tension'], problems: ['ch6.atwood', 'ch6.connected', 'ch6.tractor', 'ch6.concept-tension'], home: true },
    { id: 's8', n: 8, title: 'Apparent weight', lab: 'elevator-scale', ch: ['6'], topics: ['apparent-weight'], problems: ['ch6.elevator', 'ch6.concept-scale'], home: true },
    { id: 's9', n: 9, title: 'Friction', lab: 'incline', ch: ['6'], topics: ['friction', 'incline'], problems: ['ch6.incline', 'ch6.hold', 'ch6.truck'], home: true },
    { id: 's10', n: 10, title: 'Centripetal force', lab: 'banked-curve', ch: ['6'], topics: ['centripetal-force'], problems: ['ch6.flat', 'ch6.banked', 'ch6.slowbank', 'ch6.loop', 'ch6.concept-curve'], home: true },
    { id: 's11', n: 11, title: 'Drag and terminal speed', lab: 'drag', ch: ['6'], topics: ['drag'], problems: ['ch6.terminal', 'ch6.coast', 'ch6.mortar', 'ch6.concept-terminal'], home: true },
    { id: 's12', n: 12, title: 'Formula sheet', lab: null, ch: [] },
  ],
};
