/** Unit 2 notes: the file, and its sections with their labs and topics. See ../index.js. */
export default {
  exam: 'u2',
  title: 'Light an LED',
  chapters: '2',
  file: 'u2-light-an-led.html',
  load: () => import('../content/u2-light-an-led.html?raw').then((m) => m.default),
  sections: [
    { id: 's1', n: 1, title: 'A diode conducts one way', lab: 'led', ch: ['2'], topics: ['diode'], problems: ['u2.concept-fault'], home: true },
    { id: 's2', n: 2, title: "The LED's curve", lab: 'led', ch: ['2'], topics: ['diode', 'led'], problems: ['u2.concept-curve'] },
    { id: 's3', n: 3, title: 'The resistor sets the current', lab: 'led', ch: ['2'], topics: ['led', 'ohm'], problems: ['u2.pick-r', 'u2.current'] },
    { id: 's4', n: 4, title: 'A part you can buy, and its power', lab: 'indicator', ch: ['2'], topics: ['e12', 'colour', 'power'], problems: ['u2.bands', 'u2.power', 'u2.design'], home: true },
    { id: 's5', n: 5, title: 'LEDs in series', lab: 'led-strings', ch: ['2'], topics: ['nets'], problems: ['u2.series'], home: true },
    { id: 's6', n: 6, title: 'LEDs in parallel', lab: 'led-strings', ch: ['2'], topics: ['nets'], problems: ['u2.parallel', 'u2.concept-strings'] },
    { id: 's7', n: 7, title: 'Formula sheet', lab: null, ch: [] },
  ],
};
