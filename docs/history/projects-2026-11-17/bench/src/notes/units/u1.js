/** Unit 1 notes: the file, and its sections with their labs and topics. See ../index.js. */
export default {
  exam: 'u1',
  title: 'The Bench',
  chapters: '1',
  file: 'u1-the-bench.html',
  load: () => import('../content/u1-the-bench.html?raw').then((m) => m.default),
  sections: [
    { id: 's1', n: 1, title: 'What a breadboard joins', lab: 'breadboard', ch: ['1'], topics: ['breadboard'], problems: ['u1.concept-strips'], home: true },
    { id: 's2', n: 2, title: 'From a schematic to the board', lab: 'breadboard', ch: ['1'], topics: ['nets', 'ohm'], problems: ['u1.series', 'u1.jumper'] },
    { id: 's3', n: 3, title: 'Volts: across a part', lab: 'meter', ch: ['1'], topics: ['voltmeter'], problems: ['u1.loading', 'u1.concept-meter'], home: true },
    { id: 's4', n: 4, title: 'Amps: in series', lab: 'meter', ch: ['1'], topics: ['ammeter', 'safety'], problems: ['u1.ammeter-across', 'u1.fuse'] },
    { id: 's5', n: 5, title: 'Ohms: power off', lab: 'meter', ch: ['1'], topics: ['ohmmeter'], problems: ['u1.ohms-in-circuit'] },
    { id: 's6', n: 6, title: 'Powering the board from USB', lab: 'usb-rail', ch: ['1'], topics: ['usb', 'supply'], problems: ['u1.cable', 'u1.bank-life', 'u1.concept-usb'], home: true },
    { id: 's7', n: 7, title: 'Formula sheet', lab: null, ch: [] },
  ],
};
