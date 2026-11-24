/** Unit 3 notes: the file, and its sections with their labs and topics. See ../index.js. */
export default {
  exam: 'u3',
  title: 'Reading the World',
  chapters: '3',
  file: 'u3-reading-the-world.html',
  load: () => import('../content/u3-reading-the-world.html?raw').then((m) => m.default),
  sections: [
    { id: 's1', n: 1, title: 'The voltage divider', lab: 'divider', ch: ['3'], topics: ['divider'], problems: ['u3.divider'], home: true },
    { id: 's2', n: 2, title: 'Loading a divider', lab: 'divider', ch: ['3'], topics: ['loading'], problems: ['u3.load', 'u3.concept-divider'] },
    { id: 's3', n: 3, title: 'Sensors that change resistance', lab: 'divider', ch: ['3'], topics: ['ldr', 'ntc'], problems: ['u3.ldr', 'u3.ntc'] },
    { id: 's4', n: 4, title: 'Choosing the fixed resistor', lab: 'nightlight', ch: ['3'], topics: ['ldr'], problems: ['u3.best'], home: true },
    { id: 's5', n: 5, title: 'Floating inputs and pull resistors', lab: 'button', ch: ['3'], topics: ['pullup', 'inputs'], problems: ['u3.concept-float', 'u3.concept-pull'], home: true },
    { id: 's6', n: 6, title: 'Sizing the pull resistor', lab: 'button', ch: ['3'], topics: ['pullup', 'power'], problems: ['u3.pull-power', 'u3.pull-max'] },
    { id: 's7', n: 7, title: 'Formula sheet', lab: null, ch: [] },
  ],
};
