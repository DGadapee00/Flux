/** Unit 6 notes: the file, and its sections with their labs and topics. See ../index.js. */
export default {
  exam: 'u6',
  title: 'Valves, motors and boards',
  chapters: '6',
  file: 'u6-valves-boards.html',
  load: () => import('../content/u6-valves-boards.html?raw').then((m) => m.default),
  sections: [
    { id: 's1', n: 1, title: 'A valve in its system', lab: 'valve', ch: ['6'], topics: ['valve'], home: true },
    { id: 's2', n: 2, title: 'Copper is a resistor', lab: 'board', ch: ['6'], topics: ['board'], home: true },
    { id: 's3', n: 3, title: "A DC motor's straight line", lab: 'motor', ch: ['6'], topics: ['motor'], home: true },
    { id: 's4', n: 4, title: 'Driving it with PWM', lab: 'pwm', ch: ['6'], topics: ['pwm'], home: true },
    { id: 's5', n: 5, title: 'Charge must be close', lab: 'decoupling', ch: ['6'], topics: ['decoupling'], home: true },
    { id: 's6', n: 6, title: 'Formula sheet', lab: null, ch: [] },
  ],
};
